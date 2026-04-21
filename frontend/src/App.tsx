import React from "react";
import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import axios from "axios";

import { ResultTable } from "./components/ResultTable";
import { useStore } from "./store/useStore";

const queryClient = new QueryClient();
const DOMAIN_PATTERN = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const BASE_OPTIONS = {
  Yandex: [
    { value: "msk", label: "Москва" },
    { value: "spb", label: "Санкт-Петербург" },
    { value: "ekb", label: "Екатеринбург" },
    { value: "rnd", label: "Ростов-на-Дону" },
    { value: "ufa", label: "Уфа" },
    { value: "sar", label: "Саратов" },
    { value: "krr", label: "Краснодар" },
    { value: "prm", label: "Пермь" },
    { value: "sam", label: "Самара" },
    { value: "kry", label: "Красноярск" },
    { value: "oms", label: "Омск" },
    { value: "kzn", label: "Казань" },
    { value: "che", label: "Челябинск" },
    { value: "nsk", label: "Новосибирск" },
    { value: "nnv", label: "Нижний Новгород" },
    { value: "vlg", label: "Волгоград" },
    { value: "vrn", label: "Воронеж" },
    { value: "mns", label: "MNS" },
    { value: "tmn", label: "Тюмень" },
    { value: "tom", label: "Томск" },
  ],
  Google: [
    { value: "gru", label: "Москва" },
    { value: "gkv", label: "Киев" },
    { value: "gmns", label: "GMNS" },
    { value: "gny", label: "GNY" },
  ],
  Other: [{ value: "zen", label: "Дзен" }],
} as const;

type AnalyzeResponse = {
  analysis_id: number;
  domain: string;
  competitors: string[];
  table_data: Array<Record<string, number | string>>;
};

type ParseSettings = {
  competitorsLimit: number;
  competitorsTopPos: number;
  mainMinPos: number;
  mainMaxPos: number;
  mainMaxPages: number;
  competitorsMaxPages: number;
  resultLimit: number;
};

function FieldLabel({ text, hint }: { text: string; hint: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span>{text}</span>
      <span
        title={hint}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-500"
      >
        ?
      </span>
    </span>
  );
}

function AnalyzerApp() {
  const { domain, region, setDomain, setRegion } = useStore();
  const [statusLogs, setStatusLogs] = React.useState<string[]>([]);
  const [settings, setSettings] = React.useState<ParseSettings>({
    competitorsLimit: 10,
    competitorsTopPos: 10,
    mainMinPos: 10,
    mainMaxPos: 100,
    mainMaxPages: 10,
    competitorsMaxPages: 5,
    resultLimit: 500,
  });

  const normalizedDomain = domain.trim().toLowerCase();
  const isDomainValid = DOMAIN_PATTERN.test(normalizedDomain);
  const showDomainError = normalizedDomain.length > 0 && !isDomainValid;

  const addLog = (msg: string) => {
    setStatusLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const mutation = useMutation<AnalyzeResponse>({
    mutationFn: async () => {
      setStatusLogs([]);
      addLog(`Запуск анализа для ${normalizedDomain}...`);

      const res = await axios.post("/api/analyze", {
        domain: normalizedDomain,
        base: region,
        competitors_limit: settings.competitorsLimit,
        competitors_top_pos: settings.competitorsTopPos,
        main_min_pos: settings.mainMinPos,
        main_max_pos: settings.mainMaxPos,
        main_max_pages: settings.mainMaxPages,
        competitors_max_pages: settings.competitorsMaxPages,
        result_limit: settings.resultLimit,
      });

      addLog("Данные успешно получены.");
      return res.data;
    },
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.detail || err?.message || "Неизвестная ошибка";
      addLog(`ОШИБКА: ${errorMsg}`);
    },
  });

  React.useEffect(() => {
    if (!mutation.isPending) {
      return;
    }

    const steps = [
      "Получаем ключи исследуемого сайта...",
      "Ищем конкурентов...",
      "Собираем данные конкурентов с учетом лимитов API...",
      "Обрабатываем данные в Pandas...",
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        addLog(steps[i]);
        i += 1;
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [mutation.isPending]);

  const chartData = React.useMemo(() => {
    if (!mutation.data) {
      return [];
    }

    const analyzedDomain = mutation.data.domain;
    return mutation.data.competitors.map((competitor) => {
      const common = mutation.data.table_data.filter((row) => {
        const mainPos = Number(row[analyzedDomain] ?? 101);
        const compPos = Number(row[competitor] ?? 101);
        return mainPos <= 100 && compPos <= 100;
      }).length;

      return {
        name: competitor,
        common,
      };
    });
  }, [mutation.data]);

  const visibleCompetitors = React.useMemo(() => {
    if (!mutation.data) {
      return [];
    }
    return mutation.data.competitors.filter((competitor) =>
      mutation.data!.table_data.some((row) => Number(row[competitor] ?? 101) <= 100),
    );
  }, [mutation.data]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <h1 className="mb-2 text-4xl font-extrabold text-slate-900">SEO Keys.so Analyzer</h1>
          <p className="text-slate-500">Анализ видимости домена и сравнение с конкурентами</p>
        </header>

        <div className="mb-6 flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              <FieldLabel text="Домен" hint="Основной домен для анализа, например: example.com." />
            </label>
            <input
              className="w-full rounded-md border border-slate-300 p-2 outline-none transition-all focus:ring-2 focus:ring-blue-500"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            {showDomainError && (
              <p className="mt-1 text-sm text-red-600">Введите корректный домен, например `example.com`.</p>
            )}
          </div>

          <div className="w-56">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              <FieldLabel text="База региона" hint="Поисковая база Keys.so: Яндекс/Google и выбранный регион." />
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white p-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <optgroup label="Яндекс">
                {BASE_OPTIONS.Yandex.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Google">
                {BASE_OPTIONS.Google.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Другое">
                {BASE_OPTIONS.Other.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-3 text-sm font-semibold text-slate-700">Глубина парсинга</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm text-slate-700">
                <FieldLabel text="Количество конкурентов" hint="Сколько конкурентов запрашивать у Keys.so." />
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                  value={settings.competitorsLimit}
                  onChange={(e) => setSettings((s) => ({ ...s, competitorsLimit: Number(e.target.value) }))}
                >
                  {[10, 15, 20].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-700">
                <FieldLabel text="Топ позиций конкурентов" hint="Учитываются позиции конкурентов от 1 до выбранного значения." />
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                  value={settings.competitorsTopPos}
                  onChange={(e) => setSettings((s) => ({ ...s, competitorsTopPos: Number(e.target.value) }))}
                >
                  {[10, 20, 30, 50].map((v) => (
                    <option key={v} value={v}>
                      1-{v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-700">
                <FieldLabel text="Мин. позиция сайта" hint="Запросы с позицией сайта выше этого порога исключаются (используется > порога)." />
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                  value={settings.mainMinPos}
                  onChange={(e) => setSettings((s) => ({ ...s, mainMinPos: Number(e.target.value) }))}
                >
                  {[10, 20, 30, 50].map((v) => (
                    <option key={v} value={v}>
                      {">"} {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-700">
                <FieldLabel text="Макс. позиция сайта" hint="Верхняя граница позиции исследуемого сайта в выборке." />
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                  value={settings.mainMaxPos}
                  onChange={(e) => setSettings((s) => ({ ...s, mainMaxPos: Number(e.target.value) }))}
                >
                  {[100, 150, 200].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-700">
                <FieldLabel text="Страниц для сайта" hint="Сколько страниц ключей собрать для исследуемого сайта." />
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                  value={settings.mainMaxPages}
                  onChange={(e) => setSettings((s) => ({ ...s, mainMaxPages: Number(e.target.value) }))}
                >
                  {[10, 15, 20, 30].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-700">
                <FieldLabel text="Страниц для конкурентов" hint="Сколько страниц ключей собрать для каждого конкурента." />
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                  value={settings.competitorsMaxPages}
                  onChange={(e) => setSettings((s) => ({ ...s, competitorsMaxPages: Number(e.target.value) }))}
                >
                  {[5, 10, 15, 20].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-700">
                <FieldLabel text="Макс. строк в таблице" hint="Ограничение на итоговое количество строк в результатах." />
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                  value={settings.resultLimit}
                  onChange={(e) => setSettings((s) => ({ ...s, resultLimit: Number(e.target.value) }))}
                >
                  {[500, 1000, 2000, 5000].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !isDomainValid}
              className="h-[42px] rounded-md bg-blue-600 px-8 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? "Анализ..." : "Запустить"}
            </button>
          </div>
        </div>

        {(statusLogs.length > 0 || mutation.isPending) && (
          <div className="mb-8 max-h-40 overflow-y-auto rounded-lg bg-slate-900 p-4 font-mono text-sm text-blue-400 shadow-inner">
            <div className="mb-2 flex items-center gap-2 border-b border-slate-800 pb-2 text-slate-400">
              <div className={`h-2 w-2 rounded-full ${mutation.isPending ? "animate-pulse bg-yellow-500" : "bg-green-500"}`} />
              Статус выполнения:
            </div>
            {statusLogs.map((log, i) => (
              <div key={i} className="mb-1">
                <span className="mr-2 text-slate-500">{">>"}</span>
                {log}
              </div>
            ))}
            {mutation.isPending && <div className="animate-pulse">_</div>}
          </div>
        )}

        <AnimatePresence>
          {mutation.isPending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 shadow-sm"
            >
              <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <h3 className="text-lg font-medium text-slate-900">Сбор данных</h3>
              <p className="max-w-xs text-center text-slate-500">Из-за ограничений API Keys.so сбор может занять до минуты.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {mutation.data && !mutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h3 className="mb-4 text-lg font-semibold">Пересечение по ключевым словам</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar dataKey="common" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Общих фраз" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold">Сводка</h3>
                <div className="space-y-4">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-600">Проанализировано фраз</p>
                    <p className="text-2xl font-bold text-blue-900">{mutation.data.table_data.length}</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-sm font-medium text-green-600">Найдено конкурентов</p>
                    <p className="text-2xl font-bold text-green-900">{mutation.data.competitors.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <h3 className="text-lg font-semibold">Таблица сравнения позиций</h3>
                <button
                  onClick={() => window.open(`/api/export/${mutation.data?.analysis_id}`, "_blank")}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Скачать Excel
                </button>
              </div>
              <ResultTable data={mutation.data.table_data} domains={[mutation.data.domain, ...visibleCompetitors]} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyzerApp />
    </QueryClientProvider>
  );
}
