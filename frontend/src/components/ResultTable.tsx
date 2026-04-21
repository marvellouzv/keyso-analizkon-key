import React from "react";

interface ResultTableProps {
  data: Array<Record<string, number | string>>;
  domains: string[];
}

type SortDirection = "asc" | "desc";

const getPosColor = (pos: number) => {
  if (pos === 0 || pos > 100) return "text-slate-300";
  if (pos <= 3) return "bg-emerald-50 font-bold text-emerald-700";
  if (pos <= 10) return "bg-amber-50 font-semibold text-amber-700";
  return "text-slate-600";
};

export const ResultTable: React.FC<ResultTableProps> = ({ data, domains }) => {
  const mainDomain = domains[0];
  const topScrollRef = React.useRef<HTMLDivElement | null>(null);
  const bottomScrollRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLTableElement | null>(null);
  const [scrollWidth, setScrollWidth] = React.useState(0);
  const syncingRef = React.useRef<"top" | "bottom" | null>(null);

  const [sortKey, setSortKey] = React.useState<string>("word");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");
  const [colWidths, setColWidths] = React.useState<Record<string, number>>({});
  const resizingRef = React.useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const getDefaultWidth = React.useCallback((key: string) => {
    if (key === "word") return 300;
    return 140;
  }, []);

  const getMinWidth = React.useCallback((key: string) => {
    if (key === "word") return 220;
    return 110;
  }, []);

  const getColWidth = React.useCallback(
    (key: string) => {
      return colWidths[key] ?? getDefaultWidth(key);
    },
    [colWidths, getDefaultWidth],
  );

  React.useEffect(() => {
    const syncWidth = () => {
      setScrollWidth(contentRef.current?.scrollWidth ?? 0);
    };

    syncWidth();
    window.addEventListener("resize", syncWidth);
    return () => window.removeEventListener("resize", syncWidth);
  }, [data, domains, colWidths]);

  React.useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const active = resizingRef.current;
      if (!active) return;

      const minWidth = getMinWidth(active.key);
      const nextWidth = Math.max(minWidth, active.startWidth + (event.clientX - active.startX));
      setColWidths((prev) => ({ ...prev, [active.key]: nextWidth }));
    };

    const onMouseUp = () => {
      if (!resizingRef.current) return;
      resizingRef.current = null;
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [getMinWidth]);

  const startResize = (event: React.MouseEvent<HTMLDivElement>, key: string) => {
    event.preventDefault();
    event.stopPropagation();

    resizingRef.current = {
      key,
      startX: event.clientX,
      startWidth: getColWidth(key),
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const syncFromTop = () => {
    if (!topScrollRef.current || !bottomScrollRef.current) return;
    if (syncingRef.current === "bottom") return;
    syncingRef.current = "top";
    bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    syncingRef.current = null;
  };

  const syncFromBottom = () => {
    if (!topScrollRef.current || !bottomScrollRef.current) return;
    if (syncingRef.current === "top") return;
    syncingRef.current = "bottom";
    topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    syncingRef.current = null;
  };

  const onSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const sortIndicator = (key: string) => {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? "▲" : "▼";
  };

  const sortedData = React.useMemo(() => {
    const rows = [...data];
    rows.sort((a, b) => {
      let result = 0;

      if (sortKey === "word") {
        const av = String(a.word ?? "").toLowerCase();
        const bv = String(b.word ?? "").toLowerCase();
        result = av.localeCompare(bv, "ru");
      } else if (sortKey === "[!Wordstat]" || sortKey === "competitors_top10_count") {
        const av = Number(a[sortKey] ?? 0);
        const bv = Number(b[sortKey] ?? 0);
        result = av - bv;
      } else {
        const av = Number(a[sortKey] ?? 101);
        const bv = Number(b[sortKey] ?? 101);
        result = av - bv;
      }

      return sortDirection === "asc" ? result : -result;
    });
    return rows;
  }, [data, sortDirection, sortKey]);

  const headerBtnClass =
    "inline-flex w-full items-center justify-center gap-1 rounded px-1 py-0.5 text-slate-700 hover:bg-slate-100";

  const columns = React.useMemo(
    () => ["word", "[!Wordstat]", "competitors_top10_count", ...domains],
    [domains],
  );

  return (
    <div>
      <div
        ref={topScrollRef}
        onScroll={syncFromTop}
        className="mb-2 overflow-x-auto overflow-y-hidden rounded border border-slate-200 bg-slate-50"
      >
        <div style={{ width: `${scrollWidth}px`, height: "12px" }} />
      </div>

      <div ref={bottomScrollRef} onScroll={syncFromBottom} className="overflow-x-auto pb-2">
        <table ref={contentRef} className="w-max min-w-full border-collapse text-left">
          <colgroup>
            {columns.map((columnKey) => (
              <col key={columnKey} style={{ width: `${getColWidth(columnKey)}px` }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="relative sticky left-0 z-10 bg-slate-50 p-4 font-semibold text-slate-700">
                <button type="button" onClick={() => onSort("word")} className={headerBtnClass}>
                  Keyword <span className="text-xs">{sortIndicator("word")}</span>
                </button>
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize keyword column"
                  onMouseDown={(e) => startResize(e, "word")}
                  className="absolute inset-y-0 right-0 w-2 cursor-col-resize"
                />
              </th>
              <th className="relative p-4 text-center font-semibold text-slate-700">
                <button type="button" onClick={() => onSort("[!Wordstat]")} className={headerBtnClass}>
                  [!Wordstat] <span className="text-xs">{sortIndicator("[!Wordstat]")}</span>
                </button>
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize wordstat column"
                  onMouseDown={(e) => startResize(e, "[!Wordstat]")}
                  className="absolute inset-y-0 right-0 w-2 cursor-col-resize"
                />
              </th>
              <th className="relative p-4 text-center font-semibold text-slate-700">
                <button type="button" onClick={() => onSort("competitors_top10_count")} className={headerBtnClass}>
                  Top-10 competitors <span className="text-xs">{sortIndicator("competitors_top10_count")}</span>
                </button>
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize competitors count column"
                  onMouseDown={(e) => startResize(e, "competitors_top10_count")}
                  className="absolute inset-y-0 right-0 w-2 cursor-col-resize"
                />
              </th>
              {domains.map((d) => (
                <th
                  key={d}
                  className={`relative p-4 text-center font-semibold ${d === mainDomain ? "bg-sky-50 text-sky-700" : "text-slate-700"}`}
                >
                  <button type="button" onClick={() => onSort(d)} className={headerBtnClass}>
                    {d.length > 15 ? `${d.substring(0, 12)}...` : d} <span className="text-xs">{sortIndicator(d)}</span>
                  </button>
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Resize ${d} column`}
                    onMouseDown={(e) => startResize(e, d)}
                    className="absolute inset-y-0 right-0 w-2 cursor-col-resize"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 transition-colors hover:bg-slate-50/50">
                <td className="sticky left-0 z-10 border-r border-slate-100 bg-white p-4 font-medium text-slate-900">
                  {String(row.word ?? "")}
                </td>
                <td className="bg-indigo-50/40 p-4 text-center font-semibold text-indigo-700">{Number(row["[!Wordstat]"] ?? 0)}</td>
                <td className="bg-emerald-50/40 p-4 text-center font-semibold text-emerald-700">
                  {Number(row["competitors_top10_count"] ?? 0)}
                </td>
                {domains.map((d) => {
                  const pos = Number(row[d] ?? 101);
                  return (
                    <td key={d} className={`p-4 text-center ${d === mainDomain ? "bg-sky-50/70" : ""} ${getPosColor(pos)}`}>
                      {pos > 100 ? "-" : pos}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
