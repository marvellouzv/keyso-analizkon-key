"""Build Keys.so organic /keywords filter strings for competitor collection."""

from __future__ import annotations


def parse_include_lines(raw: str) -> list[str]:
    """
    Each non-empty line is one API round. Within a line, tokens separated by '+'
    become wordLIKE parts joined by '^'.
    """
    text = (raw or "").replace("\r\n", "\n")
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    out: list[str] = []
    for line in lines:
        parts = [p.strip() for p in line.split("+") if p.strip()]
        if not parts:
            continue
        out.append("^".join(f"wordLIKE{p}" for p in parts))
    return out


def parse_exclude_fragments(raw: str) -> list[str]:
    """Each non-empty line -> wordNOT LIKE<line> (trimmed)."""
    text = (raw or "").replace("\r\n", "\n")
    return [f"wordNOT LIKE{ln.strip()}" for ln in text.split("\n") if ln.strip()]


def build_competitor_filter_string(max_pos: int, include_fragment: str | None, exclude_fragments: list[str]) -> str:
    """Base pos filter, optional include fragment, then exclude fragments; all joined with '^'."""
    parts: list[str] = [f"pos<={max_pos}"]
    if include_fragment:
        parts.append(include_fragment)
    parts.extend(exclude_fragments)
    return "^".join(parts)


def merge_keyword_rows_by_word(rows: list[dict]) -> list[dict]:
    """Dedupe by word; if duplicate, keep the row with better (smaller) position."""
    by_word: dict[str, dict] = {}

    def pos_value(item: dict) -> float:
        try:
            return float(item.get("pos", 101))
        except (TypeError, ValueError):
            return 101.0

    for item in rows:
        w = item.get("word")
        if not isinstance(w, str) or not w.strip():
            continue
        key = w.strip()
        if key not in by_word:
            by_word[key] = item
        elif pos_value(item) < pos_value(by_word[key]):
            by_word[key] = item

    return list(by_word.values())
