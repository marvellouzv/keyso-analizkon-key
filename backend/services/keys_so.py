import asyncio
import time
import uuid
from urllib.parse import urlparse
from typing import Dict, List, Optional

import httpx


class KeysSoClient:
    def _extract_domains_from_serp_payload(self, payload) -> tuple[List[str], dict]:
        domains: List[str] = []
        list_candidates: List[dict] = []
        grouped_branches = 0

        if isinstance(payload, list):
            list_candidates = [x for x in payload if isinstance(x, dict)]
        elif isinstance(payload, dict):
            data = payload.get("data")
            if isinstance(data, list):
                list_candidates = [x for x in data if isinstance(x, dict)]
            elif isinstance(data, dict) and isinstance(data.get("data"), list):
                list_candidates = [x for x in data.get("data", []) if isinstance(x, dict)]

        def _domain_from_item(item: dict) -> str:
            domain = item.get("domain")
            if isinstance(domain, str) and domain.strip():
                return domain.strip()

            # Fallback: some payloads contain URL but no explicit domain field.
            url_raw = item.get("url") or item.get("link")
            if isinstance(url_raw, str) and url_raw.strip():
                parsed = urlparse(url_raw if "://" in url_raw else f"http://{url_raw}")
                host = (parsed.netloc or parsed.path or "").strip().lower()
                if host.startswith("www."):
                    host = host[4:]
                return host
            return ""

        for item in list_candidates:
            pos = item.get("pos")
            if pos is not None:
                try:
                    pos_num = int(pos)
                    if pos_num > 20:
                        continue
                except (TypeError, ValueError):
                    pass
            candidate = _domain_from_item(item)
            if candidate:
                domains.append(candidate)

        # Variant 2: {"<query>": [{domain|url, pos, ...}, ...], ...}
        if not domains and isinstance(payload, dict):
            for value in payload.values():
                if not isinstance(value, list):
                    continue
                grouped_branches += 1
                for item in value:
                    if not isinstance(item, dict):
                        continue
                    pos = item.get("pos")
                    if pos is not None:
                        try:
                            pos_num = int(pos)
                            if pos_num > 20:
                                continue
                        except (TypeError, ValueError):
                            pass
                    candidate = _domain_from_item(item)
                    if candidate:
                        domains.append(candidate)

        payload_type = type(payload).__name__
        payload_keys = list(payload.keys())[:8] if isinstance(payload, dict) else []
        sample = payload[:2] if isinstance(payload, list) else payload
        payload_sample = sample if isinstance(sample, (dict, list, str, int, float, bool, type(None))) else str(sample)
        if isinstance(payload_sample, str) and len(payload_sample) > 500:
            payload_sample = payload_sample[:500] + "...<truncated>"

        debug = {
            "payload_type": payload_type,
            "payload_keys": payload_keys,
            "list_candidates_count": len(list_candidates),
            "grouped_branches_count": grouped_branches,
            "domains_extracted_count": len(domains),
            "payload_sample": payload_sample,
        }
        return domains, debug

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
        max_attempts: int = 20,
        delay_seconds: int = 5,
    ) -> httpx.Response:
        for attempt in range(1, max_attempts + 1):
            try:
                await self._rate_limit()
                resp = await client.get(url, params=params, headers=self.headers)
            except httpx.RequestError as exc:
                raise RuntimeError(f"Cannot connect to Keys.so API: {exc!r}") from exc

            if resp.status_code == 429:
                backoff = min(12, 2 + attempt)
                print(f"      [API] Rate limited (429), retry in {backoff}s...")
                await asyncio.sleep(backoff)
                continue

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
        max_pos: Optional[int] = 10,
        per_page: int = 100,
        max_pages: int = 5,
        sort: str = "pos|asc",
        filter_string: Optional[str] = None,
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
                    "page": page,
                    "sort": sort,
                }
                if filter_string is not None:
                    params["filter"] = filter_string
                elif max_pos is not None:
                    params["filter"] = f"pos<={max_pos}"
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

                    if max_pos is None or pos <= max_pos:
                        collected.append(item)
                    elif max_pos is not None and sort == "pos|asc":
                        stop = True
                        break

                if stop or len(items) < per_page:
                    break

            return collected

    async def create_serp_task(self, words: List[str], region_id: int, top_number: int = 20) -> str:
        if not words:
            raise RuntimeError("SERP request requires at least one query")
        await self._rate_limit()
        async with httpx.AsyncClient(timeout=30.0, trust_env=False) as client:
            project_name = f"serp-{uuid.uuid4().hex[:12]}"
            payload = {
                "data": {
                    "name": project_name,
                    "regionId": int(region_id),
                    "topNumber": int(top_number),
                    "searchEngine": 0,  # 0 -> yandex (per API docs)
                    "words": words,
                }
            }
            try:
                resp = await client.post("https://api.keys.so/serp", json=payload, headers=self.headers)
            except httpx.RequestError as exc:
                raise RuntimeError(f"Cannot connect to Keys.so SERP API: {exc!r}") from exc

            if resp.status_code != 200:
                if resp.status_code == 401:
                    raise RuntimeError("Keys.so authorization failed (401). Check KEYSO_TOKEN.")
                if resp.status_code == 429:
                    raise RuntimeError("Keys.so rate limit exceeded (429). Retry later.")
                raise RuntimeError(f"Keys.so SERP create error ({resp.status_code}): {resp.text[:300]}")

            # SERP create returns [] in docs/real responses, so fetch last created task by unique name.
            await self._rate_limit()
            list_resp = await client.get(
                "https://api.keys.so/serp",
                params={"sort": "created_at|desc", "page": 1, "per_page": 50},
                headers=self.headers,
            )
            if list_resp.status_code != 200:
                raise RuntimeError(f"Keys.so SERP list error ({list_resp.status_code}): {list_resp.text[:300]}")
            rows = list_resp.json().get("data", [])
            if not isinstance(rows, list):
                raise RuntimeError("Keys.so SERP list response has unexpected format")
            task = next((row for row in rows if isinstance(row, dict) and row.get("name") == project_name), None)
            if task is None:
                raise RuntimeError("Keys.so SERP task was created but cannot be found in tasks list")
            task_id = task.get("id")
            if task_id is None:
                raise RuntimeError("Keys.so SERP task has no id field")
            return str(task_id)

    async def wait_serp_ready(self, task_id: str, timeout_seconds: int = 60, poll_interval_seconds: int = 3) -> bool:
        is_ready, _ = await self.wait_serp_ready_with_debug(
            task_id=task_id,
            timeout_seconds=timeout_seconds,
            poll_interval_seconds=poll_interval_seconds,
        )
        return is_ready

    async def wait_serp_ready_with_debug(
        self,
        task_id: str,
        timeout_seconds: int = 60,
        poll_interval_seconds: int = 3,
    ) -> tuple[bool, dict]:
        started = time.time()
        polls = 0
        last_status_snapshot: dict = {}
        async with httpx.AsyncClient(timeout=30.0, trust_env=False) as client:
            while (time.time() - started) < timeout_seconds:
                await self._rate_limit()
                polls += 1
                try:
                    resp = await client.get(f"https://api.keys.so/serp/{task_id}/status", headers=self.headers)
                except httpx.RequestError as exc:
                    raise RuntimeError(f"Cannot check Keys.so SERP status: {exc!r}") from exc

                if resp.status_code != 200:
                    if resp.status_code == 404:
                        return False, {
                            "reason": "status_404",
                            "polls": polls,
                            "elapsed_seconds": round(time.time() - started, 2),
                            "last_status": last_status_snapshot,
                        }
                    if resp.status_code == 429:
                        await asyncio.sleep(2)
                        continue
                    raise RuntimeError(f"Keys.so SERP status error ({resp.status_code}): {resp.text[:300]}")

                body = resp.json()
                batches = body.get("batches")
                batches_total = body.get("batches_total")
                last_status_snapshot = {
                    "status_code": resp.status_code,
                    "batches": batches,
                    "batches_total": batches_total,
                    "status": body.get("status"),
                    "state": body.get("state"),
                    "data_status": (body.get("data") or {}).get("status") if isinstance(body.get("data"), dict) else None,
                }
                if isinstance(batches, int) and isinstance(batches_total, int):
                    # Ready when all batches are completed.
                    if batches_total > 0 and batches >= batches_total:
                        return True, {
                            "reason": "ready_by_batches",
                            "polls": polls,
                            "elapsed_seconds": round(time.time() - started, 2),
                            "last_status": last_status_snapshot,
                        }
                    await asyncio.sleep(poll_interval_seconds)
                    continue

                status_raw = str(body.get("status") or body.get("state") or body.get("data", {}).get("status") or "").lower()
                if status_raw in {"ready", "done", "success", "completed", "finished", "10"}:
                    return True, {
                        "reason": "ready_by_status",
                        "polls": polls,
                        "elapsed_seconds": round(time.time() - started, 2),
                        "last_status": last_status_snapshot,
                    }
                if status_raw in {"failed", "error", "canceled", "cancelled"}:
                    return False, {
                        "reason": "failed_status",
                        "polls": polls,
                        "elapsed_seconds": round(time.time() - started, 2),
                        "last_status": last_status_snapshot,
                    }
                await asyncio.sleep(poll_interval_seconds)
        return False, {
            "reason": "timeout",
            "polls": polls,
            "elapsed_seconds": round(time.time() - started, 2),
            "last_status": last_status_snapshot,
        }

    async def get_serp_domains(self, task_id: str) -> List[str]:
        await self._rate_limit()
        async with httpx.AsyncClient(timeout=30.0, trust_env=False) as client:
            try:
                resp = await client.get(
                    f"https://api.keys.so/serp/{task_id}",
                    params={"organic": "true"},
                    headers=self.headers,
                )
            except httpx.RequestError as exc:
                raise RuntimeError(f"Cannot fetch Keys.so SERP result: {exc!r}") from exc

            if resp.status_code != 200:
                if resp.status_code == 404:
                    return []
                if resp.status_code == 429:
                    raise RuntimeError("Keys.so rate limit exceeded (429). Retry later.")
                raise RuntimeError(f"Keys.so SERP result error ({resp.status_code}): {resp.text[:300]}")

            payload = resp.json()
            domains: List[str] = []

            # Variant 1: list payload or {"data":[...]} payload.
            list_candidates: List[dict] = []
            if isinstance(payload, list):
                list_candidates = [x for x in payload if isinstance(x, dict)]
            elif isinstance(payload, dict):
                data = payload.get("data")
                if isinstance(data, list):
                    list_candidates = [x for x in data if isinstance(x, dict)]
                elif isinstance(data, dict) and isinstance(data.get("data"), list):
                    list_candidates = [x for x in data.get("data", []) if isinstance(x, dict)]

            for item in list_candidates:
                domain = item.get("domain")
                pos = item.get("pos")
                # Keep only top-20 organic results when position is present.
                if pos is not None:
                    try:
                        pos_num = int(pos)
                        if pos_num > 20:
                            continue
                    except (TypeError, ValueError):
                        pass
                if isinstance(domain, str) and domain.strip():
                    domains.append(domain.strip())

            # Variant 2 (doc sample): {"<query>": [{domain, pos, ...}, ...], ...}
            if not domains and isinstance(payload, dict):
                for value in payload.values():
                    if not isinstance(value, list):
                        continue
                    for item in value:
                        if not isinstance(item, dict):
                            continue
                        domain = item.get("domain")
                        pos = item.get("pos")
                        if pos is not None:
                            try:
                                pos_num = int(pos)
                                if pos_num > 20:
                                    continue
                            except (TypeError, ValueError):
                                pass
                        if isinstance(domain, str) and domain.strip():
                            domains.append(domain.strip())

            return domains

    async def get_serp_domains_with_debug(self, task_id: str) -> tuple[List[str], dict]:
        await self._rate_limit()
        async with httpx.AsyncClient(timeout=30.0, trust_env=False) as client:
            variants = [
                ("organic_true", {"organic": "true"}),
                ("no_params", None),
                ("organic_false", {"organic": "false"}),
            ]

            collected_domains: List[str] = []
            chosen_variant = ""
            variant_debugs: List[dict] = []

            for variant_name, variant_params in variants:
                await self._rate_limit()
                try:
                    resp = await client.get(
                        f"https://api.keys.so/serp/{task_id}",
                        params=variant_params,
                        headers=self.headers,
                    )
                except httpx.RequestError as exc:
                    raise RuntimeError(f"Cannot fetch Keys.so SERP result: {exc!r}") from exc

                if resp.status_code == 429:
                    raise RuntimeError("Keys.so rate limit exceeded (429). Retry later.")

                if resp.status_code != 200:
                    variant_debugs.append(
                        {
                            "variant": variant_name,
                            "params": variant_params or {},
                            "status_code": resp.status_code,
                            "domains_extracted_count": 0,
                        }
                    )
                    continue

                payload = resp.json()
                domains, parsed_debug = self._extract_domains_from_serp_payload(payload)
                variant_debug = {
                    "variant": variant_name,
                    "params": variant_params or {},
                    "status_code": 200,
                    **parsed_debug,
                }
                variant_debugs.append(variant_debug)

                if domains and not collected_domains:
                    collected_domains = domains
                    chosen_variant = variant_name

            if not variant_debugs:
                return [], {"status_code": 0, "payload_type": "no_response", "variants": []}

            if not chosen_variant:
                # Prefer non-empty candidate variant for diagnostics, else first.
                chosen = next(
                    (v for v in variant_debugs if v.get("list_candidates_count", 0) > 0 or v.get("grouped_branches_count", 0) > 0),
                    variant_debugs[0],
                )
                chosen_variant = str(chosen.get("variant") or "unknown")

            debug = {
                "status_code": 200,
                "chosen_variant": chosen_variant,
                "domains_extracted_count": len(collected_domains),
                "variants": variant_debugs,
            }
            return collected_domains, debug

    async def wait_serp_result_with_debug(
        self,
        task_id: str,
        timeout_seconds: int = 90,
        poll_interval_seconds: int = 3,
    ) -> tuple[List[str], dict]:
        started = time.time()
        polls = 0
        last_debug: dict = {}

        while (time.time() - started) < timeout_seconds:
            polls += 1
            domains, debug = await self.get_serp_domains_with_debug(task_id)
            last_debug = debug

            has_non_empty_payload = any(
                (
                    int(v.get("list_candidates_count", 0)) > 0
                    or int(v.get("grouped_branches_count", 0)) > 0
                    or int(v.get("domains_extracted_count", 0)) > 0
                )
                for v in (debug.get("variants") or [])
                if isinstance(v, dict)
            )

            if domains:
                return domains, {
                    "reason": "result_endpoint_with_domains",
                    "polls": polls,
                    "elapsed_seconds": round(time.time() - started, 2),
                    "last_result_debug": debug,
                }

            # If result endpoint is structurally non-empty but domains are still zero,
            # stop waiting and return diagnostics immediately.
            if has_non_empty_payload:
                return [], {
                    "reason": "result_endpoint_nonempty_but_zero_domains",
                    "polls": polls,
                    "elapsed_seconds": round(time.time() - started, 2),
                    "last_result_debug": debug,
                }

            await asyncio.sleep(poll_interval_seconds)

        return [], {
            "reason": "result_timeout",
            "polls": polls,
            "elapsed_seconds": round(time.time() - started, 2),
            "last_result_debug": last_debug,
        }
