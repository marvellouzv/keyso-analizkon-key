import asyncio
import time
from typing import Dict, List

import httpx


class KeysSoClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.keys.so/report/simple/organic"
        self.headers = {"X-Keyso-TOKEN": api_key}
        self.last_request_time = 0
        self.request_count = 0
        self.lock = asyncio.Lock()

    async def _rate_limit(self):
        async with self.lock:
            current_time = time.time()
            if current_time - self.last_request_time < 10:
                if self.request_count >= 10:
                    sleep_time = 10 - (current_time - self.last_request_time) + 0.5
                    await asyncio.sleep(sleep_time)
                    self.last_request_time = time.time()
                    self.request_count = 0
            else:
                self.last_request_time = current_time
                self.request_count = 0
            self.request_count += 1

    async def _get_with_report_wait(
        self,
        client: httpx.AsyncClient,
        url: str,
        params: Dict,
        max_attempts: int = 12,
        delay_seconds: int = 5,
    ) -> httpx.Response:
        for attempt in range(1, max_attempts + 1):
            try:
                await self._rate_limit()
                resp = await client.get(url, params=params, headers=self.headers)
            except httpx.RequestError as exc:
                raise RuntimeError(f"Cannot connect to Keys.so API: {exc!r}") from exc

            if resp.status_code != 202:
                return resp

            if attempt == max_attempts:
                break
            print(f"      [API] Report is preparing (202), retry {attempt}/{max_attempts}...")
            await asyncio.sleep(delay_seconds)

        raise RuntimeError(
            "Keys.so report is still preparing (202). Retry in a few minutes."
        )

    async def get_keywords(self, domain: str, base: str, per_page: int = 100) -> List[Dict]:
        await self._rate_limit()
        async with httpx.AsyncClient(timeout=30.0, trust_env=False) as client:
            params = {
                "domain": domain,
                "base": base,
                "per_page": per_page,
                "sort": "pos|asc",
            }
            print(f"      [API] Request keywords for {domain}...")
            resp = await self._get_with_report_wait(
                client,
                f"{self.base_url}/keywords",
                params,
            )

            print(f"      [API] Response: {resp.status_code}")
            if resp.status_code != 200:
                if resp.status_code == 401:
                    raise RuntimeError("Keys.so authorization failed (401). Check KEYSO_TOKEN.")
                if resp.status_code == 404:
                    raise RuntimeError(f"Domain not found in Keys.so (404): {domain}")
                if resp.status_code == 429:
                    raise RuntimeError("Keys.so rate limit exceeded (429). Retry later.")
                raise RuntimeError(f"Keys.so API error ({resp.status_code}): {resp.text[:300]}")

            return resp.json().get("data", [])

    async def get_competitors(self, domain: str, base: str, limit: int = 10) -> List[str]:
        await self._rate_limit()
        async with httpx.AsyncClient(timeout=30.0, trust_env=False) as client:
            params = {
                "domain": domain,
                "base": base,
                "per_page": limit,
            }
            print(f"      [API] Request competitors for {domain}...")
            resp = await self._get_with_report_wait(
                client,
                f"{self.base_url}/concurents",
                params,
            )

            print(f"      [API] Response: {resp.status_code}")
            if resp.status_code != 200:
                if resp.status_code == 401:
                    raise RuntimeError("Keys.so authorization failed (401). Check KEYSO_TOKEN.")
                if resp.status_code == 404:
                    raise RuntimeError(f"Domain not found in Keys.so (404): {domain}")
                if resp.status_code == 429:
                    raise RuntimeError("Keys.so rate limit exceeded (429). Retry later.")
                raise RuntimeError(f"Keys.so API error ({resp.status_code}): {resp.text[:300]}")

            return [item["name"] for item in resp.json().get("data", [])]

    async def get_keywords_top_positions(
        self,
        domain: str,
        base: str,
        max_pos: int = 10,
        per_page: int = 100,
        max_pages: int = 5,
        sort: str = "pos|asc",
    ) -> List[Dict]:
        await self._rate_limit()
        async with httpx.AsyncClient(timeout=30.0, trust_env=False) as client:
            collected: List[Dict] = []
            url = f"{self.base_url}/keywords"

            for page in range(1, max_pages + 1):
                params = {
                    "domain": domain,
                    "base": base,
                    "per_page": per_page,
                    "current_page": page,
                    "sort": sort,
                    "filter": f"pos<={max_pos}",
                }
                print(f"      [API] Request top positions for {domain}, page {page}...")
                resp = await self._get_with_report_wait(client, url, params)
                print(f"      [API] Response: {resp.status_code}")

                if resp.status_code != 200:
                    if resp.status_code == 401:
                        raise RuntimeError("Keys.so authorization failed (401). Check KEYSO_TOKEN.")
                    if resp.status_code == 404:
                        raise RuntimeError(f"Domain not found in Keys.so (404): {domain}")
                    if resp.status_code == 429:
                        raise RuntimeError("Keys.so rate limit exceeded (429). Retry later.")
                    raise RuntimeError(f"Keys.so API error ({resp.status_code}): {resp.text[:300]}")

                payload = resp.json()
                items = payload.get("data", [])
                if not items:
                    break

                stop = False
                for item in items:
                    pos_raw = item.get("pos")
                    try:
                        pos = float(pos_raw)
                    except (TypeError, ValueError):
                        continue

                    if pos <= max_pos:
                        collected.append(item)
                    elif sort == "pos|asc":
                        stop = True
                        break

                if stop or len(items) < per_page:
                    break

            return collected
