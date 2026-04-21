import os
from pathlib import Path
from typing import Dict, List

import pandas as pd


class SEOAnalyzer:
    @staticmethod
    def _domain_positions_df(keywords: List[Dict], domain: str) -> pd.DataFrame:
        if not keywords:
            return pd.DataFrame(columns=["word", domain])

        df = pd.DataFrame(keywords)[["word", "pos"]]
        df = df.dropna(subset=["word", "pos"])
        df["pos"] = pd.to_numeric(df["pos"], errors="coerce")
        df = df.dropna(subset=["pos"])
        df = df.groupby("word", as_index=False)["pos"].min()
        df.columns = ["word", domain]
        return df

    @staticmethod
    def _wordstat_map(main_keywords: List[Dict], competitors_data: Dict[str, List[Dict]]) -> Dict[str, int]:
        mapping: Dict[str, int] = {}

        def absorb(items: List[Dict]):
            for item in items:
                word = item.get("word")
                if not word:
                    continue

                raw = item.get("superwsk")
                if raw is None:
                    raw = item.get("wsk")
                if raw is None:
                    raw = item.get("ws")
                if raw is None:
                    continue

                try:
                    value = int(raw)
                except (TypeError, ValueError):
                    continue

                prev = mapping.get(word)
                if prev is None or value > prev:
                    mapping[word] = value

        absorb(main_keywords)
        for keywords in competitors_data.values():
            absorb(keywords)

        return mapping

    @staticmethod
    async def process_data(
        main_domain: str,
        main_keywords: List[Dict],
        competitors_data: Dict[str, List[Dict]],
        competitors_top_pos: int = 10,
        main_min_pos: int = 10,
        main_max_pos: int = 100,
        result_limit: int = 500,
    ):
        if not main_keywords:
            return pd.DataFrame(columns=["word", "[!Wordstat]", "competitors_top10_count", main_domain])

        df_main = SEOAnalyzer._domain_positions_df(main_keywords, main_domain)
        # Keep the analyzed site as the base universe of queries.
        # This guarantees we always return rows where the main site has positions.
        final_df = df_main.copy()

        for comp_domain, keywords in competitors_data.items():
            if not keywords:
                final_df[comp_domain] = 101
                continue

            df_comp = SEOAnalyzer._domain_positions_df(keywords, comp_domain)
            # Competitors are attached only for matching queries from the main site.
            final_df = pd.merge(final_df, df_comp, on="word", how="left")

        final_df = final_df.fillna(101)
        competitor_columns = list(competitors_data.keys())

        # Keep only rows where the analyzed site is ranked in the requested range.
        final_df = final_df[(final_df[main_domain] > main_min_pos) & (final_df[main_domain] <= main_max_pos)]

        if competitor_columns:
            final_df["competitors_top10_count"] = (
                final_df[competitor_columns].le(competitors_top_pos).sum(axis=1).astype(int)
            )
        else:
            final_df["competitors_top10_count"] = 0

        # Keep only rows where at least one competitor is in top-10.
        if competitor_columns:
            final_df = final_df[final_df["competitors_top10_count"] > 0]

        wordstat = SEOAnalyzer._wordstat_map(main_keywords, competitors_data)
        final_df["[!Wordstat]"] = final_df["word"].map(wordstat).fillna(0).astype(int)

        # Weighted ranking:
        # - Wordstat is the main signal (demand potential).
        # - More competitors in top-10 increases priority.
        final_df["opportunity_score"] = (
            final_df["[!Wordstat]"] * (1 + final_df["competitors_top10_count"] * 0.6)
        ).round(2)

        ordered_columns = [
            "word",
            "[!Wordstat]",
            "competitors_top10_count",
            "opportunity_score",
            main_domain,
            *competitor_columns,
        ]
        final_df = final_df[ordered_columns]
        final_df = final_df.sort_values(
            by=["opportunity_score", "competitors_top10_count", "[!Wordstat]", "word"],
            ascending=[False, False, False, True],
        )
        return final_df.head(result_limit)

    @staticmethod
    def save_to_excel(df: pd.DataFrame, filename: str) -> str:
        backend_dir = Path(__file__).resolve().parents[1]
        storage_dir = backend_dir / "storage"
        os.makedirs(storage_dir, exist_ok=True)

        path = storage_dir / f"{filename}.xlsx"
        df.to_excel(path, index=False)
        return str(path)
