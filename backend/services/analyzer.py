import os
from pathlib import Path
from typing import Dict, List

import pandas as pd


class SEOAnalyzer:
    @staticmethod
    def _stage_preview(df: pd.DataFrame, limit: int = 50) -> List[Dict]:
        if df.empty:
            return []
        preview = df.head(limit).copy()
        return preview.to_dict(orient="records")

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
        result_limit: int = 500,
        stage_preview_limit: int = 500,
    ) -> tuple[pd.DataFrame, Dict[str, int], Dict[str, List[Dict]], List[Dict]]:
        if not main_keywords:
            return (
                pd.DataFrame(columns=["word", "[!Wordstat]", "competitors_top10_count", main_domain]),
                {
                    "main_keywords_raw": 0,
                    "main_keywords_unique": 0,
                    "after_join": 0,
                    "after_main_position_filter": 0,
                    "after_competitor_filter": 0,
                    "final_output": 0,
                },
                {
                    "main_keywords_raw": [],
                    "main_keywords_unique": [],
                    "after_join": [],
                    "after_main_position_filter": [],
                    "after_competitor_filter": [],
                    "final_output": [],
                },
                [],
            )

        df_main = SEOAnalyzer._domain_positions_df(main_keywords, main_domain)
        main_keywords_raw = len(main_keywords)
        main_keywords_unique = len(df_main)
        stage_main_raw = main_keywords[:stage_preview_limit]
        # Keep analyzed site queries as base and use index join for faster assembly.
        final_df = df_main.set_index("word")

        for comp_domain, keywords in competitors_data.items():
            if not keywords:
                final_df[comp_domain] = 101
                continue

            df_comp = SEOAnalyzer._domain_positions_df(keywords, comp_domain)
            final_df = final_df.join(df_comp.set_index("word")[[comp_domain]], how="left")

        final_df = final_df.fillna(101).reset_index()
        after_join = len(final_df)
        competitor_columns = list(competitors_data.keys())
        stage_main_unique = SEOAnalyzer._stage_preview(df_main, stage_preview_limit)
        stage_after_join = SEOAnalyzer._stage_preview(final_df, stage_preview_limit)

        wordstat = SEOAnalyzer._wordstat_map(main_keywords, competitors_data)
        final_df["[!Wordstat]"] = final_df["word"].map(wordstat).fillna(0).astype(int)

        pool_columns = ["word", "[!Wordstat]", main_domain, *competitor_columns]
        table_pool_data = final_df[pool_columns].to_dict(orient="records")

        # Keep only rows where the analyzed site rank is below the selected threshold.
        final_df = final_df[final_df[main_domain] > main_min_pos]
        after_main_position_filter = len(final_df)
        stage_after_main_filter = SEOAnalyzer._stage_preview(final_df, stage_preview_limit)

        if competitor_columns:
            final_df["competitors_top10_count"] = (
                final_df[competitor_columns].le(competitors_top_pos).sum(axis=1).astype(int)
            )
        else:
            final_df["competitors_top10_count"] = 0

        # Keep only rows where at least one competitor is in top-10.
        if competitor_columns:
            final_df = final_df[final_df["competitors_top10_count"] > 0]
        after_competitor_filter = len(final_df)
        stage_after_comp_filter = SEOAnalyzer._stage_preview(final_df, stage_preview_limit)

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
        final_df = final_df.head(result_limit)
        stage_final_output = SEOAnalyzer._stage_preview(final_df, stage_preview_limit)
        diagnostics = {
            "main_keywords_raw": int(main_keywords_raw),
            "main_keywords_unique": int(main_keywords_unique),
            "after_join": int(after_join),
            "after_main_position_filter": int(after_main_position_filter),
            "after_competitor_filter": int(after_competitor_filter),
            "final_output": int(len(final_df)),
        }
        stage_results = {
            "main_keywords_raw": stage_main_raw,
            "main_keywords_unique": stage_main_unique,
            "after_join": stage_after_join,
            "after_main_position_filter": stage_after_main_filter,
            "after_competitor_filter": stage_after_comp_filter,
            "final_output": stage_final_output,
        }
        return final_df, diagnostics, stage_results, table_pool_data

    @staticmethod
    def save_to_excel(df: pd.DataFrame, filename: str) -> str:
        backend_dir = Path(__file__).resolve().parents[1]
        storage_dir = backend_dir / "storage"
        os.makedirs(storage_dir, exist_ok=True)

        path = storage_dir / f"{filename}.xlsx"
        df.to_excel(path, index=False)
        return str(path)
