import re
from pathlib import Path

src = Path("C:/Project/keyso-analiz-key/frontend/src/data/Yandex_regions.txt")
dst = Path("C:/Project/keyso-analiz-key/frontend/src/data/yandexRegions.ts")
raw = src.read_text(encoding="utf-8")
lines = [x.strip() for x in re.split(r"\r\n|\n|\r", raw) if x.strip()]

rows = []
seen = set()
for line in lines:
    m = re.match(r"^(.*)\s+\((\d+)\)$", line)
    if not m:
        continue
    label = " ".join(m.group(1).split())
    rid = int(m.group(2))
    key = (rid, label)
    if key in seen:
        continue
    seen.add(key)
    rows.append((rid, label))

out = []
out.append("export type YandexRegionOption = { id: number; label: string };")
out.append("")
out.append("export const YANDEX_REGION_OPTIONS: YandexRegionOption[] = [")
for rid, label in rows:
    esc = label.replace("\\", "\\\\").replace("'", "\\'")
    out.append(f"  {{ id: {rid}, label: '{esc}' }},")
out.append("];\n")

dst.write_text("\n".join(out), encoding="utf-8")
print(f"generated_rows={len(rows)}")
