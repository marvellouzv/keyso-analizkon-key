import React from "react";

interface ResultTableProps {
  data: Array<Record<string, number | string>>;
  domains: string[];
}

const getPosColor = (pos: number) => {
  if (pos === 0 || pos > 100) return "text-slate-300";
  if (pos <= 3) return "bg-emerald-50 font-bold text-emerald-700";
  if (pos <= 10) return "bg-amber-50 font-semibold text-amber-700";
  return "text-slate-600";
};

export const ResultTable: React.FC<ResultTableProps> = ({ data, domains }) => {
  return (
    <div className="overflow-x-auto pb-2">
      <table className="w-max min-w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="sticky left-0 z-10 bg-slate-50 p-4 font-semibold text-slate-700">Keyword</th>
            <th className="p-4 text-center font-semibold text-slate-700 min-w-[120px]">[!Wordstat]</th>
            <th className="p-4 text-center font-semibold text-slate-700 min-w-[120px]">Top-10 competitors</th>
            {domains.map((d) => (
              <th key={d} className="min-w-[120px] p-4 text-center font-semibold text-slate-700">
                {d.length > 15 ? `${d.substring(0, 12)}...` : d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 transition-colors hover:bg-slate-50/50">
              <td className="sticky left-0 z-10 border-r border-slate-100 bg-white p-4 font-medium text-slate-900">
                {String(row.word ?? "")}
              </td>
              <td className="p-4 text-center font-semibold text-indigo-700 bg-indigo-50/40">
                {Number(row["[!Wordstat]"] ?? 0)}
              </td>
              <td className="p-4 text-center font-semibold text-emerald-700 bg-emerald-50/40">
                {Number(row["competitors_top10_count"] ?? 0)}
              </td>
              {domains.map((d) => {
                const pos = Number(row[d] ?? 101);
                return (
                  <td key={d} className={`p-4 text-center ${getPosColor(pos)}`}>
                    {pos > 100 ? "-" : pos}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
