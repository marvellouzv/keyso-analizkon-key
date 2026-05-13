import React from "react";
import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import axios from "axios";

import { ResultTable } from "./components/ResultTable";
import defaultExcludedCompetitorsRaw from "./data/defaultExcludedCompetitors.txt?raw";
import { YANDEX_REGION_OPTIONS } from "./data/yandexRegions";
import { useStore } from "./store/useStore";

const queryClient = new QueryClient();
const DOMAIN_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/i;
const N_VALUES_STORAGE_PREFIX = "seo:n-values:";
const COMPETITOR_ORDER_STORAGE_PREFIX = "seo:competitor-order:";
const BASE_TO_YANDEX_REGION_ID: Record<string, number> = {
  msk: 213,
  spb: 2,
  ekb: 54,
  rnd: 39,
  ufa: 172,
  sar: 194,
  krr: 35,
  prm: 50,
  sam: 51,
  kry: 62,
  oms: 66,
  kzn: 43,
  che: 56,
  nsk: 65,
  nnv: 47,
  vlg: 38,
  vrn: 193,
  mns: 157,
  tmn: 55,
  tom: 67,
};
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
const SERP_TOP_NUMBER_OPTIONS = [10, 20, 30, 50, 100] as const;

type AnalyzeResponse = {
  analysis_id: number;
  domain: string;
  competitors: string[];
  competitor_sources: Record<string, string>;
  table_data: Array<Record<string, number | string>>;
  table_pool_data: Array<Record<string, number | string>>;
  diagnostics: {
    main_keywords_raw: number;
    main_keywords_unique: number;
    after_join: number;
    after_main_position_filter: number;
    after_competitor_filter: number;
    final_output: number;
  };
  stage_results: Record<string, Array<Record<string, number | string>>>;
  serp_summary: {
    queries_total: number;
    successful_queries: number;
    failed_queries: number;
    domains_collected: number;
    excluded_stoplist: number;
    added_new: number;
  };
  serp_progress: string[];
};

type HistoryItem = {
  id: number;
  domain: string;
  base: string;
  created_at: string;
  rows_count: number;
  data?: unknown;
};

type ServiceWish = {
  id: number;
  text: string;
  is_done: boolean;
  created_at: string;
  updated_at: string;
};

type ParseSettings = {
  competitorsLimit: number;
  mainMaxPages: number;
  competitorsMaxPages: number;
  resultLimit: number;
  top50CompetitorsMin: number;
};

type VisualThemeId = "clean" | "executive" | "dense";

const PRESET_OPTIONS: Array<{ id: string; label: string; settings: ParseSettings }> = [
  {
    id: "fast",
    label: "Быстрый",
    settings: {
      competitorsLimit: 10,
      mainMaxPages: 10,
      competitorsMaxPages: 10,
      resultLimit: 500,
      top50CompetitorsMin: 3,
    },
  },
  {
    id: "balanced",
    label: "Баланс",
    settings: {
      competitorsLimit: 15,
      mainMaxPages: 20,
      competitorsMaxPages: 15,
      resultLimit: 1000,
      top50CompetitorsMin: 3,
    },
  },
  {
    id: "deep",
    label: "Глубокий",
    settings: {
      competitorsLimit: 20,
      mainMaxPages: 30,
      competitorsMaxPages: 20,
      resultLimit: 2000,
      top50CompetitorsMin: 3,
    },
  },
];

const DEFAULT_EXCLUDED_COMPETITORS_INPUT = defaultExcludedCompetitorsRaw
  .split(/\r?\n/)
  .map((line: string) => line.trim())
  .filter(Boolean)
  .join("\n");

const VISUAL_THEME_OPTIONS: Array<{ id: VisualThemeId; label: string; description: string }> = [
  {
    id: "clean",
    label: "Чистый",
    description: "Безопасный деловой стиль",
  },
  {
    id: "executive",
    label: "Executive",
    description: "Премиальные акценты и контраст",
  },
  {
    id: "dense",
    label: "Data-Dense",
    description: "Плотный режим для больших таблиц",
  },
];

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

function extractApiErrorMessage(err: any): string {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const parts = detail.map((item) => {
      if (item && typeof item === "object") {
        const loc = Array.isArray(item.loc) ? item.loc.join(".") : "";
        const msg = typeof item.msg === "string" ? item.msg : "";
        if (loc && msg) {
          return `${loc}: ${msg}`;
        }
      }
      return JSON.stringify(item);
    });
    return parts.join("; ");
  }

  if (detail && typeof detail === "object") {
    if (typeof detail.message === "string" && detail.message.trim()) {
      return detail.message;
    }
    return JSON.stringify(detail);
  }

  const rawData = err?.response?.data;
  if (typeof rawData === "string" && rawData.trim()) {
    return rawData;
  }

  if (typeof err?.message === "string" && err.message.trim()) {
    return err.message;
  }

  return "Неизвестная ошибка";
}

function parseManualCompetitorsInput(value: string): string[] {
  const lines = value
    .split(/\r?\n/)
    .map((line) => normalizeDomainInput(line))
    .filter(Boolean);
  return Array.from(new Set(lines));
}

function parseSerpQueriesInput(value: string): string[] {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const key = line.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(line);
  }
  return result;
}

function normalizeDomainInput(value: string): string {
  let domain = (value || "").trim().toLowerCase();
  if (!domain) {
    return "";
  }
  if (domain.includes("://")) {
    domain = domain.split("://", 2)[1] ?? "";
  }
  domain = domain.split("/", 2)[0] ?? "";
  domain = domain.split(":", 2)[0] ?? "";
  if (domain.startsWith("www.")) {
    domain = domain.slice(4);
  }
  return domain;
}

function toApiDomain(value: string): string {
  const normalized = normalizeDomainInput(value);
  if (!normalized) {
    return "";
  }
  try {
    let host = new URL(`http://${normalized}`).hostname.toLowerCase();
    if (host.startsWith("www.")) {
      host = host.slice(4);
    }
    return host;
  } catch {
    return normalized;
  }
}

function buildAnalyzeResponseFromHistoryItem(item: HistoryItem): AnalyzeResponse | null {
  const payload = item.data;
  if (!payload) {
    return null;
  }

  const metricColumns = new Set(["word", "[!Wordstat]", "competitors_top10_count", "opportunity_score"]);
  if (Array.isArray(payload)) {
    const tableData = payload as Array<Record<string, number | string>>;
    const first = tableData[0] ?? {};
    const competitors = Object.keys(first).filter((key) => !metricColumns.has(key) && key !== item.domain);
    return {
      analysis_id: item.id,
      domain: item.domain,
      competitors,
      competitor_sources: {},
      table_data: tableData,
      table_pool_data: tableData,
      diagnostics: {
        main_keywords_raw: tableData.length,
        main_keywords_unique: tableData.length,
        after_join: tableData.length,
        after_main_position_filter: tableData.length,
        after_competitor_filter: tableData.length,
        final_output: tableData.length,
      },
      stage_results: {},
      serp_summary: {
        queries_total: 0,
        successful_queries: 0,
        failed_queries: 0,
        domains_collected: 0,
        excluded_stoplist: 0,
        added_new: 0,
      },
      serp_progress: [],
    };
  }

  if (typeof payload === "object" && payload !== null) {
    const p = payload as Record<string, unknown>;
    const tableData = (p.table_data as Array<Record<string, number | string>>) ?? [];
    const tablePoolData = (p.table_pool_data as Array<Record<string, number | string>>) ?? tableData;
    const diagnostics = (p.diagnostics as AnalyzeResponse["diagnostics"]) ?? {
      main_keywords_raw: tableData.length,
      main_keywords_unique: tableData.length,
      after_join: tableData.length,
      after_main_position_filter: tableData.length,
      after_competitor_filter: tableData.length,
      final_output: tableData.length,
    };
    const stageResults = (p.stage_results as AnalyzeResponse["stage_results"]) ?? {};
    const competitors = (p.competitors as string[]) ?? [];
    const competitorSources = (p.competitor_sources as AnalyzeResponse["competitor_sources"]) ?? {};
    const domain = (p.domain as string) ?? item.domain;
    const serpSummary = (p.serp_summary as AnalyzeResponse["serp_summary"]) ?? {
      queries_total: 0,
      successful_queries: 0,
      failed_queries: 0,
      domains_collected: 0,
      excluded_stoplist: 0,
      added_new: 0,
    };
    const serpProgress = (p.serp_progress as string[]) ?? [];
    return {
      analysis_id: item.id,
      domain,
      competitors,
      competitor_sources: competitorSources,
      table_data: tableData,
      table_pool_data: tablePoolData,
      diagnostics,
      stage_results: stageResults,
      serp_summary: serpSummary,
      serp_progress: serpProgress,
    };
  }

  return null;
}

function AnalyzerApp() {
  const { domain, region, setDomain, setRegion } = useStore();
  const [statusLogs, setStatusLogs] = React.useState<string[]>([]);
  const [activeAnalysis, setActiveAnalysis] = React.useState<AnalyzeResponse | null>(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historyRestoreLoadingId, setHistoryRestoreLoadingId] = React.useState<number | null>(null);
  const [historyError, setHistoryError] = React.useState<string | null>(null);
  const [historyItems, setHistoryItems] = React.useState<HistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = React.useState("");
  const [wishesOpen, setWishesOpen] = React.useState(false);
  const [wishesLoading, setWishesLoading] = React.useState(false);
  const [wishesError, setWishesError] = React.useState<string | null>(null);
  const [wishes, setWishes] = React.useState<ServiceWish[]>([]);
  const [wishDraft, setWishDraft] = React.useState("");
  const [wishSubmitting, setWishSubmitting] = React.useState(false);
  const [wishTogglingId, setWishTogglingId] = React.useState<number | null>(null);
  const [wishEditingId, setWishEditingId] = React.useState<number | null>(null);
  const [wishEditingText, setWishEditingText] = React.useState("");
  const [wishSavingId, setWishSavingId] = React.useState<number | null>(null);
  const [settings, setSettings] = React.useState<ParseSettings>({
    competitorsLimit: 10,
    mainMaxPages: 10,
    competitorsMaxPages: 10,
    resultLimit: 500,
    top50CompetitorsMin: 3,
  });
  const [activePreset, setActivePreset] = React.useState<string>("fast");
  const [openedStage, setOpenedStage] = React.useState<string | null>(null);
  const [tableCompetitorsTopPos, setTableCompetitorsTopPos] = React.useState<number>(10);
  const [tableMainMinPos, setTableMainMinPos] = React.useState<number | "all">(10);
  const [tableResultLimit, setTableResultLimit] = React.useState<number>(500);
  const [tableTop50CompetitorsMin, setTableTop50CompetitorsMin] = React.useState<number>(3);
  const [manualCompetitorsInput, setManualCompetitorsInput] = React.useState<string>("");
  const [excludedCompetitorsInput, setExcludedCompetitorsInput] = React.useState<string>(DEFAULT_EXCLUDED_COMPETITORS_INPUT);
  const [serpQueriesInput, setSerpQueriesInput] = React.useState<string>("");
  const [serpTopNumber, setSerpTopNumber] = React.useState<number>(10);
  const [serpRegionSearch, setSerpRegionSearch] = React.useState<string>("");
  const [serpRegionId, setSerpRegionId] = React.useState<number>(213);
  const [visualTheme, setVisualTheme] = React.useState<VisualThemeId>("clean");
  const [copySuccessVisible, setCopySuccessVisible] = React.useState<boolean>(false);
  const [nValues, setNValues] = React.useState<Record<string, string>>({});
  const [competitorOrder, setCompetitorOrder] = React.useState<string[]>([]);
  const [hasCustomCompetitorOrder, setHasCustomCompetitorOrder] = React.useState<boolean>(false);
  const copySuccessTimeoutRef = React.useRef<number | null>(null);
  const manualCompetitors = React.useMemo(
    () => parseManualCompetitorsInput(manualCompetitorsInput),
    [manualCompetitorsInput],
  );
  const excludedCompetitors = React.useMemo(
    () => parseManualCompetitorsInput(excludedCompetitorsInput),
    [excludedCompetitorsInput],
  );
  const serpQueries = React.useMemo(() => parseSerpQueriesInput(serpQueriesInput), [serpQueriesInput]);
  const serpQueriesLimitError = serpQueries.length > 10 ? "Не более 10 запросов" : "";
  const filteredSerpRegions = React.useMemo(() => {
    const q = serpRegionSearch.trim().toLowerCase();
    if (!q) {
      return YANDEX_REGION_OPTIONS;
    }
    return YANDEX_REGION_OPTIONS.filter((item) => item.label.toLowerCase().includes(q));
  }, [serpRegionSearch]);
  const expectedProgressSteps = React.useMemo(() => {
    let steps = 12;
    if (serpQueries.length > 0) {
      steps += 3;
    }
    return steps;
  }, [serpQueries.length]);
  const progressPercent = Math.max(5, Math.min(100, Math.round((statusLogs.length / Math.max(1, expectedProgressSteps)) * 100)));
  const requiresManualCompetitors = settings.competitorsLimit === 0 && manualCompetitors.length === 0 && serpQueries.length === 0;

  const normalizedDomain = normalizeDomainInput(domain);
  const normalizedDomainForApi = toApiDomain(domain);
  const isDomainValid = DOMAIN_PATTERN.test(normalizedDomainForApi);
  const showDomainError = domain.trim().length > 0 && !isDomainValid;

  const addLog = (msg: string) => {
    setStatusLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const mutation = useMutation<AnalyzeResponse>({
    mutationFn: async () => {
      setStatusLogs([]);
      setCopySuccessVisible(false);
      if (copySuccessTimeoutRef.current) {
        window.clearTimeout(copySuccessTimeoutRef.current);
        copySuccessTimeoutRef.current = null;
      }
      addLog(`Запуск анализа для ${normalizedDomain || domain.trim()}...`);
      setTableCompetitorsTopPos(10);
      setTableMainMinPos(10);
      setTableResultLimit(settings.resultLimit);
      setTableTop50CompetitorsMin(settings.top50CompetitorsMin);

      if (serpQueries.length > 10) {
        throw new Error("Не более 10 запросов");
      }

      const res = await axios.post("/api/analyze", {
        domain: normalizedDomain,
        base: region,
        competitors_limit: settings.competitorsLimit,
        manual_competitors: manualCompetitors,
        excluded_competitors: excludedCompetitors,
        serp_queries: serpQueries,
        serp_top_number: serpTopNumber,
        serp_region_id: serpRegionId || BASE_TO_YANDEX_REGION_ID[region] || 213,
        top50_competitors_min: settings.top50CompetitorsMin,
        main_max_pages: settings.mainMaxPages,
        competitors_max_pages: settings.competitorsMaxPages,
        result_limit: settings.resultLimit,
      });

      addLog("Данные успешно получены.");
      return res.data;
    },
    onSuccess: (data) => {
      setActiveAnalysis(data);
      for (const line of data.serp_progress ?? []) {
        addLog(line);
      }
      const postProcessSteps = [
        "Нормализуем позиции и удаляем дубли...",
        "Объединяем фразы сайта и конкурентов...",
        "Считаем [!Wordstat] для ключевых фраз...",
        "Рассчитываем метрики конкуренции и приоритет...",
        "Формируем пул строк для локальной фильтрации таблицы...",
        "Применяем фильтр позиций исследуемого сайта...",
        "Применяем фильтр топа конкурентов...",
        "Сортируем итоговые строки по приоритету...",
        "Ограничиваем результат по лимиту строк...",
      ];
      for (const step of postProcessSteps) {
        addLog(step);
      }
    },
    onError: (err: any) => {
      const errorMsg = extractApiErrorMessage(err);
      addLog(`ОШИБКА: ${errorMsg}`);
    },
  });

  const analysisData = activeAnalysis ?? mutation.data ?? null;
  const nStorageKey = React.useMemo(() => {
    if (!analysisData) {
      return null;
    }
    return `${N_VALUES_STORAGE_PREFIX}${analysisData.analysis_id}`;
  }, [analysisData]);
  const competitorOrderStorageKey = React.useMemo(() => {
    if (!analysisData) {
      return null;
    }
    return `${COMPETITOR_ORDER_STORAGE_PREFIX}${analysisData.analysis_id}`;
  }, [analysisData]);

  React.useEffect(() => {
    if (!nStorageKey) {
      setNValues({});
      return;
    }
    try {
      const raw = window.localStorage.getItem(nStorageKey);
      if (!raw) {
        setNValues({});
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const normalized: Record<string, string> = {};
        for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof key !== "string" || typeof value !== "string") {
            continue;
          }
          const sanitized = value.replace(/\D/g, "").slice(0, 3);
          if (sanitized) {
            normalized[key] = sanitized;
          }
        }
        setNValues(normalized);
        return;
      }
      setNValues({});
    } catch {
      setNValues({});
    }
  }, [nStorageKey]);

  React.useEffect(() => {
    if (!analysisData) {
      setCompetitorOrder([]);
      setHasCustomCompetitorOrder(false);
      return;
    }
    const available = analysisData.competitors;
    if (!competitorOrderStorageKey) {
      setCompetitorOrder(available);
      setHasCustomCompetitorOrder(false);
      return;
    }
    try {
      const raw = window.localStorage.getItem(competitorOrderStorageKey);
      if (!raw) {
        setCompetitorOrder(available);
        setHasCustomCompetitorOrder(false);
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setCompetitorOrder(available);
        setHasCustomCompetitorOrder(false);
        return;
      }
      const saved = parsed.filter((item): item is string => typeof item === "string");
      const filteredSaved = saved.filter((item) => available.includes(item));
      const rest = available.filter((item) => !filteredSaved.includes(item));
      setCompetitorOrder([...filteredSaved, ...rest]);
      setHasCustomCompetitorOrder(filteredSaved.length > 0);
    } catch {
      setCompetitorOrder(available);
      setHasCustomCompetitorOrder(false);
    }
  }, [analysisData, competitorOrderStorageKey]);

  const handleNChange = React.useCallback(
    (word: string, value: string) => {
      if (!word) {
        return;
      }
      const sanitized = value.replace(/\D/g, "").slice(0, 3);
      setNValues((prev) => {
        const next: Record<string, string> = { ...prev };
        if (sanitized) {
          next[word] = sanitized;
        } else {
          delete next[word];
        }
        if (nStorageKey) {
          try {
            window.localStorage.setItem(nStorageKey, JSON.stringify(next));
          } catch {
            // Ignore storage write errors (quota/private mode), keep UI responsive.
          }
        }
        return next;
      });
    },
    [nStorageKey],
  );

  const loadHistory = React.useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await axios.get<any[]>("/api/history");
      const normalized: HistoryItem[] = (res.data ?? []).map((item: any) => {
        const data = item?.data;
        const rowsCount =
          typeof item?.rows_count === "number"
            ? item.rows_count
            : Array.isArray(data)
              ? data.length
              : Array.isArray(data?.table_data)
                ? data.table_data.length
                : 0;
        return {
          id: Number(item?.id ?? 0),
          domain: String(item?.domain ?? ""),
          base: String(item?.base ?? ""),
          created_at: String(item?.created_at ?? ""),
          rows_count: rowsCount,
          data,
        };
      });
      setHistoryItems(normalized.filter((item) => item.id > 0));
    } catch (err: any) {
      setHistoryError(extractApiErrorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const openHistory = React.useCallback(async () => {
    setHistoryOpen(true);
    await loadHistory();
  }, [loadHistory]);

  const loadWishes = React.useCallback(async () => {
    setWishesLoading(true);
    setWishesError(null);
    try {
      const res = await axios.get<ServiceWish[]>("/api/wishes");
      setWishes(res.data ?? []);
    } catch (err: any) {
      setWishesError(extractApiErrorMessage(err));
    } finally {
      setWishesLoading(false);
    }
  }, []);

  const openWishes = React.useCallback(async () => {
    setWishesOpen(true);
    await loadWishes();
  }, [loadWishes]);

  const submitWish = React.useCallback(async () => {
    const text = wishDraft.trim();
    if (!text) {
      return;
    }
    setWishSubmitting(true);
    setWishesError(null);
    try {
      await axios.post<ServiceWish>("/api/wishes", { text });
      setWishDraft("");
      await loadWishes();
    } catch (err: any) {
      setWishesError(extractApiErrorMessage(err));
    } finally {
      setWishSubmitting(false);
    }
  }, [loadWishes, wishDraft]);

  const toggleWish = React.useCallback(
    async (wish: ServiceWish) => {
      setWishTogglingId(wish.id);
      setWishesError(null);
      try {
        await axios.patch<ServiceWish>(`/api/wishes/${wish.id}/toggle`, { is_done: !wish.is_done });
        await loadWishes();
      } catch (err: any) {
        setWishesError(extractApiErrorMessage(err));
      } finally {
        setWishTogglingId(null);
      }
    },
    [loadWishes],
  );

  const startWishEdit = React.useCallback((wish: ServiceWish) => {
    setWishEditingId(wish.id);
    setWishEditingText(wish.text);
  }, []);

  const cancelWishEdit = React.useCallback(() => {
    setWishEditingId(null);
    setWishEditingText("");
  }, []);

  const saveWishEdit = React.useCallback(async () => {
    if (wishEditingId === null) {
      return;
    }
    const text = wishEditingText.trim();
    if (!text) {
      setWishesError("Текст предложения не может быть пустым.");
      return;
    }
    setWishSavingId(wishEditingId);
    setWishesError(null);
    try {
      await axios.patch<ServiceWish>(`/api/wishes/${wishEditingId}`, { text });
      setWishEditingId(null);
      setWishEditingText("");
      await loadWishes();
    } catch (err: any) {
      setWishesError(extractApiErrorMessage(err));
    } finally {
      setWishSavingId(null);
    }
  }, [loadWishes, wishEditingId, wishEditingText]);

  const restoreHistoryItem = React.useCallback(
    async (item: HistoryItem) => {
      setHistoryRestoreLoadingId(item.id);
      setHistoryError(null);
      try {
        const res = await axios.get<AnalyzeResponse>(`/api/history/${item.id}`);
        setActiveAnalysis(res.data);
        setDomain(item.domain);
        setRegion(item.base);
        setHistoryOpen(false);
        addLog(`Восстановлен анализ #${item.id} для ${item.domain}`);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          const fallback = buildAnalyzeResponseFromHistoryItem(item);
          if (fallback) {
            setActiveAnalysis(fallback);
            setDomain(item.domain);
            setRegion(item.base);
            setHistoryOpen(false);
            addLog(`Восстановлен анализ #${item.id} для ${item.domain}`);
            return;
          }
        }
        setHistoryError(extractApiErrorMessage(err));
      } finally {
        setHistoryRestoreLoadingId(null);
      }
    },
    [addLog, setDomain, setRegion],
  );

  const filteredHistoryItems = React.useMemo(() => {
    const query = historyFilter.trim().toLowerCase();
    if (!query) {
      return historyItems;
    }
    return historyItems.filter((item) => item.domain.toLowerCase().includes(query));
  }, [historyFilter, historyItems]);

  React.useEffect(() => {
    if (!mutation.isPending) {
      return;
    }

    const steps = [
      "Получаем ключи исследуемого сайта...",
      "Ищем конкурентов...",
    ];
    if (serpQueries.length > 0) {
      steps.push("Запускаем задания по запросам из выдачи Яндекса...");
      steps.push("Ожидаем готовность задач SERP и собираем домены...");
      steps.push("Объединяем найденные домены SERP со списком конкурентов...");
    }
    steps.push("Собираем данные конкурентов с учетом лимитов API...");

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
  }, [mutation.isPending, serpQueries.length]);

  const chartData = React.useMemo(() => {
    if (!analysisData) {
      return [];
    }

    const analyzedDomain = analysisData.domain;
    return analysisData.competitors.map((competitor) => {
      const common = analysisData.table_data.filter((row) => {
        const mainPos = Number(row[analyzedDomain] ?? 101);
        const compPos = Number(row[competitor] ?? 101);
        return mainPos <= 100 && compPos <= 100;
      }).length;

      return {
        name: competitor,
        common,
      };
    });
  }, [analysisData]);

  const tableFilteredData = React.useMemo(() => {
    if (!analysisData) {
      return [];
    }

    const analyzedDomain = analysisData.domain;
    const allCompetitors = analysisData.competitors;
    const sourceRows =
      analysisData.table_pool_data && analysisData.table_pool_data.length > 0
        ? analysisData.table_pool_data
        : analysisData.table_data;

    const prepared: Array<Record<string, number | string>> = sourceRows
      .filter((row) => {
        const mainPos = Number(row[analyzedDomain] ?? 101);
        const hasMainTop50Position = Number.isFinite(mainPos) && mainPos <= 50;
        const noMainTop50Position = !Number.isFinite(mainPos) || mainPos > 50;
        const competitorsInSelectedTop = allCompetitors.reduce((acc, competitor) => {
          const compPos = Number(row[competitor] ?? 101);
          return acc + (Number.isFinite(compPos) && compPos <= tableCompetitorsTopPos ? 1 : 0);
        }, 0);
        const competitorsInTop10 = allCompetitors.reduce((acc, competitor) => {
          const compPos = Number(row[competitor] ?? 101);
          return acc + (Number.isFinite(compPos) && compPos <= 10 ? 1 : 0);
        }, 0);

        const mainFilterPass =
          hasMainTop50Position &&
          (tableMainMinPos === "all" || mainPos > tableMainMinPos) &&
          competitorsInSelectedTop > 0;

        const noMainTop50Pass = noMainTop50Position && competitorsInTop10 >= tableTop50CompetitorsMin;

        return mainFilterPass || noMainTop50Pass;
      })
      .map((row) => {
        const maskedRow: Record<string, number | string> = { ...row };
        const mainPos = Number(maskedRow[analyzedDomain] ?? 101);
        if (!Number.isFinite(mainPos) || mainPos > 50) {
          maskedRow[analyzedDomain] = 101;
        }
        for (const competitor of allCompetitors) {
          const compPos = Number(maskedRow[competitor] ?? 101);
          if (!Number.isFinite(compPos) || compPos > tableCompetitorsTopPos) {
            maskedRow[competitor] = 101;
          }
        }

        const competitorsTopCount = allCompetitors.reduce((acc, competitor) => {
          const compPos = Number(maskedRow[competitor] ?? 101);
          return acc + (Number.isFinite(compPos) && compPos <= tableCompetitorsTopPos ? 1 : 0);
        }, 0);

        const wordstat = Number(maskedRow["[!Wordstat]"] ?? 0);
        const opportunityScore = Number((wordstat * (1 + competitorsTopCount * 0.6)).toFixed(2));

        return {
          ...maskedRow,
          "[!Wordstat]": wordstat,
          competitors_top10_count: competitorsTopCount,
          opportunity_score: opportunityScore,
        };
      })
      .sort((a: Record<string, number | string>, b: Record<string, number | string>) => {
        const scoreDiff = Number(b.opportunity_score ?? 0) - Number(a.opportunity_score ?? 0);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }
        const countDiff = Number(b.competitors_top10_count ?? 0) - Number(a.competitors_top10_count ?? 0);
        if (countDiff !== 0) {
          return countDiff;
        }
        const wsDiff = Number(b["[!Wordstat]"] ?? 0) - Number(a["[!Wordstat]"] ?? 0);
        if (wsDiff !== 0) {
          return wsDiff;
        }
        return String(a.word ?? "").localeCompare(String(b.word ?? ""), "ru");
      });

    return prepared.slice(0, tableResultLimit);
  }, [analysisData, tableCompetitorsTopPos, tableMainMinPos, tableResultLimit, tableTop50CompetitorsMin]);

  const hasTablePoolData = React.useMemo(() => {
    return Boolean(analysisData?.table_pool_data && analysisData.table_pool_data.length > 0);
  }, [analysisData]);

  const visibleCompetitors = React.useMemo(() => {
    if (!analysisData) {
      return [];
    }
    const competitorStats = analysisData.competitors
      .map((competitor) => {
        const foundCount = tableFilteredData.reduce((acc, row) => {
          const pos = Number(row[competitor] ?? 101);
          return acc + (Number.isFinite(pos) && pos < 101 ? 1 : 0);
        }, 0);
        return { competitor, foundCount };
      })
      .filter((item) => item.foundCount > 0)
      .sort((a, b) => {
        if (b.foundCount !== a.foundCount) {
          return b.foundCount - a.foundCount;
        }
        return a.competitor.localeCompare(b.competitor);
      });
    const defaultOrder = competitorStats.map((item) => item.competitor);
    if (!hasCustomCompetitorOrder) {
      return defaultOrder;
    }
    const custom = competitorOrder.filter((item) => defaultOrder.includes(item));
    const rest = defaultOrder.filter((item) => !custom.includes(item));
    return [...custom, ...rest];
  }, [analysisData, competitorOrder, hasCustomCompetitorOrder, tableFilteredData]);

  const handleCompetitorOrderChange = React.useCallback(
    (nextCompetitors: string[]) => {
      if (!analysisData) {
        return;
      }
      const availableSet = new Set(analysisData.competitors);
      const normalized = nextCompetitors.filter((item) => availableSet.has(item));
      const rest = analysisData.competitors.filter((item) => !normalized.includes(item));
      const finalOrder = [...normalized, ...rest];
      setCompetitorOrder(finalOrder);
      setHasCustomCompetitorOrder(true);
      if (competitorOrderStorageKey) {
        try {
          window.localStorage.setItem(competitorOrderStorageKey, JSON.stringify(finalOrder));
        } catch {
          // Ignore storage write errors and keep UI responsive.
        }
      }
    },
    [analysisData, competitorOrderStorageKey],
  );

  const copyTableToClipboard = React.useCallback(async () => {
    if (!analysisData) {
      return;
    }

    const columns = [
      "n_value",
      "word",
      "[!Wordstat]",
      "competitors_top10_count",
      "opportunity_score",
      analysisData.domain,
      ...visibleCompetitors,
    ];

    const labels: Record<string, string> = {
      n_value: "N",
      word: "Запросы",
      "[!Wordstat]": "Частотность",
      competitors_top10_count: "Конкурентов в ТОП",
      opportunity_score: "Приоритет",
    };

    const formatCell = (column: string, row: Record<string, number | string>) => {
      if (column === "n_value") {
        const word = String(row.word ?? "");
        return nValues[word] ?? "";
      }
      const raw = row[column];
      if (column === "word") {
        return String(raw ?? "");
      }
      if (column === "[!Wordstat]" || column === "competitors_top10_count") {
        return String(raw ?? "");
      }
      if (column === "opportunity_score") {
        const value = Number(raw ?? 0);
        return String(Number.isFinite(value) ? Math.round(value) : 0);
      }
      const pos = Number(raw ?? 101);
      return !Number.isFinite(pos) || pos > 100 ? "-" : String(pos);
    };

    const headerRow = columns.map((column) => labels[column] ?? column).join("\t");
    const bodyRows = tableFilteredData.map((row) => columns.map((column) => formatCell(column, row)).join("\t"));
    const tsv = [headerRow, ...bodyRows].join("\n");

    const fallbackCopy = (text: string): boolean => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      }
      document.body.removeChild(textarea);
      return copied;
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(tsv);
      } else {
        const copied = fallbackCopy(tsv);
        if (!copied) {
          throw new Error("Clipboard API is unavailable");
        }
      }
      addLog("Таблица скопирована в буфер обмена.");
      setCopySuccessVisible(true);
      if (copySuccessTimeoutRef.current) {
        window.clearTimeout(copySuccessTimeoutRef.current);
      }
      copySuccessTimeoutRef.current = window.setTimeout(() => {
        setCopySuccessVisible(false);
        copySuccessTimeoutRef.current = null;
      }, 3000);
    } catch {
      const copied = fallbackCopy(tsv);
      if (copied) {
        addLog("Таблица скопирована в буфер обмена.");
        setCopySuccessVisible(true);
        if (copySuccessTimeoutRef.current) {
          window.clearTimeout(copySuccessTimeoutRef.current);
        }
        copySuccessTimeoutRef.current = window.setTimeout(() => {
          setCopySuccessVisible(false);
          copySuccessTimeoutRef.current = null;
        }, 3000);
      } else {
        addLog("ОШИБКА: Не удалось скопировать таблицу в буфер обмена.");
        setCopySuccessVisible(false);
      }
    }
  }, [addLog, analysisData, nValues, tableFilteredData, visibleCompetitors]);

  React.useEffect(() => {
    return () => {
      if (copySuccessTimeoutRef.current) {
        window.clearTimeout(copySuccessTimeoutRef.current);
      }
    };
  }, []);

  const stageOrder = [
    "main_keywords_raw",
    "main_keywords_unique",
    "after_join",
    "after_main_position_filter",
    "after_competitor_filter",
    "competitor_only_selected",
    "after_competitor_merge",
    "final_output",
  ] as const;

  const stageLabels: Record<(typeof stageOrder)[number], string> = {
    main_keywords_raw: "Сырые ключи сайта",
    main_keywords_unique: "Уникальные ключи сайта",
    after_join: "После объединения с конкурентами",
    after_main_position_filter: "После фильтра позиций сайта",
    after_competitor_filter: "После фильтра конкурентов",
    competitor_only_selected: "Конкурентные ключи без ТОП50 сайта",
    after_competitor_merge: "После объединения с конкурентными ключами",
    final_output: "Финальный результат",
  };

  return (
    <div className={`theme-shell theme-${visualTheme} min-h-screen bg-slate-50 p-4 md:p-8`}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h1 className="app-title text-4xl font-extrabold text-slate-900">Поиск конкурентов и запросов для КП</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="app-preset-chip app-preset-chip-idle rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                Помощь
              </button>
              <button
                type="button"
                onClick={openWishes}
                className="app-preset-chip app-preset-chip-idle rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                Хотелки
              </button>
              <button
                type="button"
                onClick={openHistory}
                className="app-preset-chip app-preset-chip-idle rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                История
              </button>
            </div>
          </div>
          <p className="app-subtitle text-slate-500">Анализ видимости домена и сравнение с конкурентами</p>
        </header>

        <div className="app-card mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="app-subtitle text-sm font-medium text-slate-600">Визуальный стиль интерфейса</p>
              <p className="app-subtitle text-xs text-slate-500">Можно переключать в любой момент, без пересчета данных</p>
            </div>
            <div className="w-full max-w-[260px]">
              <select
                value={visualTheme}
                onChange={(e) => setVisualTheme(e.target.value as VisualThemeId)}
                className="app-select w-full rounded-md border border-slate-300 bg-white p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                title={VISUAL_THEME_OPTIONS.find((theme) => theme.id === visualTheme)?.description ?? ""}
              >
                {VISUAL_THEME_OPTIONS.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              <FieldLabel text="Домен" hint="Можно вставлять домен или URL, например: https://www.example.com/." />
            </label>
            <input
              className="app-input w-full rounded-md border border-slate-300 p-2 outline-none transition-all focus:ring-2 focus:ring-blue-500"
              placeholder="https://www.example.com/"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onBlur={(e) => setDomain(normalizeDomainInput(e.target.value))}
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
              className="app-select w-full rounded-md border border-slate-300 bg-white p-2 outline-none focus:ring-2 focus:ring-blue-500"
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

          <div className="app-card-soft app-density-pad w-full rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-3 text-sm font-semibold text-slate-700">Глубина парсинга</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {PRESET_OPTIONS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSettings(preset.settings);
                    setActivePreset(preset.id);
                  }}
                  className={`app-preset-chip rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    activePreset === preset.id
                      ? "app-preset-chip-active border-blue-600 bg-blue-600 text-white"
                      : "app-preset-chip-idle border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm text-slate-700">
                <FieldLabel text="Глубина для сайта" hint="Сколько страниц ключей собрать для исследуемого сайта." />
                <select
                  className="app-select mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
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
                <FieldLabel text="Количество конкурентов" hint="Сколько конкурентов запрашивать у Keys.so." />
                <select
                  className="app-select mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                  value={settings.competitorsLimit}
                  onChange={(e) => setSettings((s) => ({ ...s, competitorsLimit: Number(e.target.value) }))}
                >
                  {[0, 3, 5, 10, 15, 20].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-700">
                <FieldLabel text="Глубина для конкурентов" hint="Сколько страниц ключей собрать для каждого конкурента." />
                <select
                  className="app-select mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
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
                  className="app-select mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
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

              <label className="text-sm text-slate-700">
                <FieldLabel
                  text="Запросы за ТОП50, конкуренты"
                  hint="Для запросов без позиции сайта: включаем строку, если в топ-10 найдено не меньше выбранного количества конкурентов."
                />
                <select
                  className="app-select mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                  value={settings.top50CompetitorsMin}
                  onChange={(e) => setSettings((s) => ({ ...s, top50CompetitorsMin: Number(e.target.value) }))}
                >
                  {[2, 3, 5, 10].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 gap-3 md:col-span-2 md:grid-cols-2 xl:col-span-4">
                <label className="text-sm text-slate-700">
                  <FieldLabel
                    text="Конкуренты вручную"
                    hint="По одному домену в строке. Эти домены будут добавлены к конкурентам из API."
                  />
                  <textarea
                    rows={5}
                    className="app-input mt-1 h-[120px] w-full resize-y overflow-y-auto rounded-md border border-slate-300 bg-white p-2 font-mono text-sm"
                    placeholder={"example-competitor.ru\nanother-site.ru"}
                    value={manualCompetitorsInput}
                    onChange={(e) => setManualCompetitorsInput(e.target.value)}
                  />
                  {requiresManualCompetitors && (
                    <p className="mt-1 text-xs text-red-600">
                      При значении `Количество конкурентов = 0` добавьте хотя бы один домен вручную или хотя бы один запрос в блоке `Из выдачи Яндекса`.
                    </p>
                  )}
                </label>

                <label className="text-sm text-slate-700">
                  <FieldLabel
                    text="Исключить конкуренты"
                    hint="По одному домену в строке. Эти домены будут исключены из списка API-конкурентов, и система доберет следующий подходящий домен."
                  />
                  <textarea
                    rows={5}
                    className="app-input mt-1 h-[120px] w-full resize-y overflow-y-auto rounded-md border border-slate-300 bg-white p-2 font-mono text-sm"
                    value={excludedCompetitorsInput}
                    onChange={(e) => setExcludedCompetitorsInput(e.target.value)}
                  />
                </label>

                <div className="text-sm text-slate-700 md:col-span-2">
                  <FieldLabel
                    text="Из выдачи Яндекса"
                    hint="1 запрос = 1 строка, максимум 10 запросов. Пустые строки и дубликаты игнорируются."
                  />
                  <textarea
                    rows={5}
                    className="app-input mt-1 h-[120px] w-full resize-y overflow-y-auto rounded-md border border-slate-300 bg-white p-2 font-mono text-sm"
                    placeholder="Введите запросы, по одному на строку"
                    value={serpQueriesInput}
                    onChange={(e) => setSerpQueriesInput(e.target.value)}
                  />
                  {serpQueriesLimitError && <p className="mt-1 text-xs text-red-600">{serpQueriesLimitError}</p>}

                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_1fr]">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Домены из выдачи / запрос</label>
                      <select
                        className="app-select w-full rounded-md border border-slate-300 bg-white p-2 text-sm"
                        value={serpTopNumber}
                        onChange={(e) => setSerpTopNumber(Number(e.target.value))}
                      >
                        {SERP_TOP_NUMBER_OPTIONS.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Поиск региона</label>
                      <input
                        type="text"
                        value={serpRegionSearch}
                        onChange={(e) => setSerpRegionSearch(e.target.value)}
                        placeholder="Введите город"
                        className="app-input w-full rounded-md border border-slate-300 bg-white p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Регион</label>
                      <select
                        className="app-select w-full rounded-md border border-slate-300 bg-white p-2 text-sm"
                        value={serpRegionId}
                        onChange={(e) => setSerpRegionId(Number(e.target.value))}
                      >
                        {filteredSerpRegions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label} ({item.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="flex items-end">
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !isDomainValid || requiresManualCompetitors || Boolean(serpQueriesLimitError)}
                className="app-btn-primary h-[42px] rounded-md bg-blue-600 px-8 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mutation.isPending ? "Анализ..." : "Запустить"}
              </button>
            </div>
            {mutation.isPending && (
              <div className="w-full">
                <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-200">
                  <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            )}
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
              <p className="max-w-xs text-center text-slate-500">Из-за ограничений API Keys.so сбор может занять несколько минут.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {analysisData && !mutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="app-card app-density-pad rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
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

              <div className="app-card app-density-pad rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold">Сводка</h3>
                <div className="space-y-4">
                  <div className="app-summary-primary rounded-lg bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-600">Проанализировано фраз</p>
                    <p className="text-2xl font-bold text-blue-900">{tableFilteredData.length}</p>
                  </div>
                  <div className="app-summary-secondary rounded-lg bg-green-50 p-4">
                    <p className="text-sm font-medium text-green-600">Найдено конкурентов</p>
                    <p className="text-2xl font-bold text-green-900">{analysisData.competitors.length}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-4">
                    <p className="text-sm font-medium text-amber-700">Найдено конкурентов из SERP</p>
                    <p className="text-2xl font-bold text-amber-900">{analysisData.serp_summary?.added_new ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="app-card app-density-pad rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Диагностика этапов</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    <FieldLabel
                      text="Сырые ключи сайта"
                      hint="Количество записей ключей, полученных от Keys.so для исследуемого домена до нормализации и удаления дублей."
                    />
                  </p>
                  <p className="text-xl font-bold text-slate-900">{analysisData.diagnostics.main_keywords_raw}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    <FieldLabel
                      text="Уникальные ключи сайта"
                      hint="Количество уникальных запросов после группировки по слову и выбора лучшей позиции сайта."
                    />
                  </p>
                  <p className="text-xl font-bold text-slate-900">{analysisData.diagnostics.main_keywords_unique}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    <FieldLabel
                      text="После объединения с конкурентами"
                      hint="Количество строк после присоединения колонок позиций конкурентов к запросам исследуемого сайта."
                    />
                  </p>
                  <p className="text-xl font-bold text-slate-900">{analysisData.diagnostics.after_join}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    <FieldLabel
                      text="После фильтра позиций сайта"
                      hint="Сколько строк осталось после фильтра по минимальной позиции исследуемого сайта."
                    />
                  </p>
                  <p className="text-xl font-bold text-slate-900">{analysisData.diagnostics.after_main_position_filter}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    <FieldLabel
                      text="После фильтра конкурентов"
                      hint="Сколько строк осталось после условия: хотя бы один конкурент попадает в заданный топ по позиции."
                    />
                  </p>
                  <p className="text-xl font-bold text-slate-900">{analysisData.diagnostics.after_competitor_filter}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-blue-600">
                    <FieldLabel
                      text="Итог в таблице"
                      hint="Финальное количество строк после сортировки и ограничения result_limit."
                    />
                  </p>
                  <p className="text-xl font-bold text-blue-900">{analysisData.diagnostics.final_output}</p>
                </div>
              </div>
            </div>

            <div className="app-card app-density-pad rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Результаты по стадиям</h3>
              <div className="space-y-3">
                {stageOrder.map((stageKey) => {
                  const rows = analysisData.stage_results?.[stageKey] ?? [];
                  const isOpen = openedStage === stageKey;
                  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
                  return (
                    <div key={stageKey} className="overflow-hidden rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setOpenedStage((prev) => (prev === stageKey ? null : stageKey))}
                        className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
                      >
                        <span className="font-medium text-slate-800">{stageLabels[stageKey]}</span>
                        <span className="text-sm text-slate-500">{rows.length} строк</span>
                      </button>
                      {isOpen && (
                        <div className="overflow-x-auto p-3">
                          {rows.length === 0 ? (
                            <p className="text-sm text-slate-500">На этом этапе нет строк.</p>
                          ) : (
                            <table className="w-max min-w-full border-collapse text-left text-sm">
                              <thead>
                                <tr className="border-b border-slate-200">
                                  {headers.map((h) => (
                                    <th key={h} className="whitespace-nowrap p-2 font-semibold text-slate-700">
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, idx) => (
                                  <tr key={idx} className="border-b border-slate-100">
                                    {headers.map((h) => (
                                      <td key={`${idx}-${h}`} className="whitespace-nowrap p-2 text-slate-700">
                                        {String(row[h] ?? "")}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="app-card w-full rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <h3 className="text-lg font-semibold">Таблица сравнения позиций</h3>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={copyTableToClipboard} className="app-link text-sm font-medium text-blue-600 hover:underline">
                    Скопировать
                  </button>
                  {copySuccessVisible && (
                    <span className="text-sm font-semibold text-emerald-600" title="Скопировано">
                      ✓
                    </span>
                  )}
                  <button
                    onClick={() => window.open(`/api/export/${analysisData?.analysis_id}`, "_blank")}
                    className="app-link text-sm font-medium text-blue-600 hover:underline"
                  >
                    Скачать Excel
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 border-b border-slate-100 p-6 md:grid-cols-2">
                <label className="text-sm text-slate-700">
                  <FieldLabel
                    text="Топ позиций конкурентов"
                    hint="Локальный фильтр таблицы: показываем строки, где хотя бы один конкурент имеет позицию от 1 до выбранного значения."
                  />
                  <select
                    className="app-select mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                    value={tableCompetitorsTopPos}
                    onChange={(e) => setTableCompetitorsTopPos(Number(e.target.value))}
                  >
                    {[10, 20, 30, 50].map((v) => (
                      <option key={v} value={v}>
                        1-{v}
                      </option>
                    ))}
                  </select>
                  {!hasTablePoolData && (
                    <p className="mt-1 text-xs text-amber-700">
                      Фильтр работает в ограниченном режиме: нужен новый запуск анализа на обновленном backend.
                    </p>
                  )}
                </label>

                <label className="text-sm text-slate-700">
                  <FieldLabel
                    text="Мин. позиция сайта"
                    hint="Локальный фильтр таблицы: показываем строки, где позиция сайта строго больше выбранного порога."
                  />
                  <select
                    className="app-select mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                    value={tableMainMinPos}
                    onChange={(e) => setTableMainMinPos(e.target.value === "all" ? "all" : Number(e.target.value))}
                  >
                    <option value="all">Все</option>
                    {[10, 20, 30, 40].map((v) => (
                      <option key={v} value={v}>
                        {">"} {v}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <ResultTable
                data={tableFilteredData}
                domains={[analysisData.domain, ...visibleCompetitors]}
                competitorSources={analysisData.competitor_sources ?? {}}
                nValues={nValues}
                onNChange={handleNChange}
                onCompetitorOrderChange={handleCompetitorOrderChange}
                variant={visualTheme}
              />
            </div>
          </motion.div>
        )}

        {historyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="app-card w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">История анализов</h3>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Закрыть
                </button>
              </div>

              <div className="mb-3 flex gap-2">
                <input
                  className="app-input w-full rounded-md border border-slate-300 bg-white p-2 text-sm"
                  placeholder="Фильтр по домену..."
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                />
                <button
                  type="button"
                  onClick={loadHistory}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Обновить
                </button>
              </div>

              {historyLoading && <p className="text-sm text-slate-500">Загружаем историю...</p>}
              {historyError && <p className="mb-2 text-sm text-red-600">ОШИБКА: {historyError}</p>}

              {!historyLoading && (
                <div className="max-h-[420px] overflow-y-auto rounded-md border border-slate-200">
                  {filteredHistoryItems.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">Записей не найдено.</p>
                  ) : (
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="sticky top-0 bg-slate-50">
                        <tr className="border-b border-slate-200">
                          <th className="p-3 font-semibold text-slate-700">Домен</th>
                          <th className="p-3 font-semibold text-slate-700">База</th>
                          <th className="p-3 font-semibold text-slate-700">Строк</th>
                          <th className="p-3 font-semibold text-slate-700">Дата</th>
                          <th className="p-3 font-semibold text-slate-700">Действие</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistoryItems.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100">
                            <td className="p-3 font-medium text-slate-900">{item.domain}</td>
                            <td className="p-3 text-slate-700">{item.base}</td>
                            <td className="p-3 text-slate-700">{item.rows_count}</td>
                            <td className="p-3 text-slate-700">
                              {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
                            </td>
                            <td className="p-3">
                              <button
                                type="button"
                                disabled={historyRestoreLoadingId === item.id}
                                onClick={() => restoreHistoryItem(item)}
                                className="app-btn-primary rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                {historyRestoreLoadingId === item.id ? "Восстанавливаем..." : "Восстановить"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {helpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="app-card w-full max-w-4xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Помощь по интерфейсу</h3>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Закрыть
                </button>
              </div>

              <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 text-sm text-slate-700">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">1) Домен</p>
                  <p className="mt-1">Основной сайт для анализа. От него строится вся таблица сравнений.</p>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">2) База региона</p>
                  <p className="mt-1">
                    Выбор поисковой базы Keys.so (Яндекс/Google + регион). Влияет на все данные: ключи, конкурентов и позиции.
                  </p>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">3) Визуальный стиль интерфейса</p>
                  <p className="mt-1">Меняет только оформление. На расчеты и API-запросы не влияет.</p>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">4) Глубина парсинга</p>
                  <p className="mt-1">Настройки влияют на скорость и объем данных:</p>
                  <p className="mt-1">- Глубина для сайта: сколько страниц ключей брать у вашего домена.</p>
                  <p>- Количество конкурентов: сколько конкурентов брать из API.</p>
                  <p>- Глубина для конкурентов: сколько страниц ключей брать у каждого конкурента.</p>
                  <p>- Макс. строк в таблице: лимит итогового вывода.</p>
                  <p>- Запросы за ТОП50, конкуренты: фильтр для конкурентных ключей без позиций сайта в ТОП50.</p>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">5) Конкуренты вручную</p>
                  <p className="mt-1">Дополнительные домены (по одному в строке), которые принудительно добавляются в анализ.</p>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">6) Исключить конкуренты</p>
                  <p className="mt-1">Домены, которые нужно исключить из анализа. Применяются только значения из текущей формы.</p>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">7) Из выдачи Яндекса</p>
                  <p className="mt-1">Добавляет конкурентов из SERP по вашим запросам.</p>
                  <p className="mt-1">- Запросы: 1 строка = 1 запрос, максимум 10.</p>
                  <p>- Домены из выдачи / запрос: сколько результатов брать с каждого запроса.</p>
                  <p>- Поиск региона + Регион: регион для SERP-задач.</p>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">8) Кнопка Запустить</p>
                  <p className="mt-1">Стартует полный цикл: сбор ключей, сбор конкурентов, фильтрация, расчеты и формирование таблицы.</p>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">9) Статус выполнения</p>
                  <p className="mt-1">Показывает этапы обработки и ошибки. Удобно для понимания, на каком шаге задержка.</p>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">10) Сводка и диагностика</p>
                  <p className="mt-1">Показывают статистику результата: сколько строк, сколько конкурентов, сколько добавлено из SERP и т.д.</p>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">11) Итоговая таблица</p>
                  <p className="mt-1">Основной результат сравнения позиций.</p>
                  <p className="mt-1">- Столбец N редактируется и сохраняется локально.</p>
                  <p>- Заголовки доменов содержат источник: API / SERP / РУЧ.</p>
                  <p>- Доступна сортировка по столбцам и ручная перестановка конкурентных колонок.</p>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">12) История</p>
                  <p className="mt-1">Позволяет открыть и восстановить прошлые анализы без повторного запуска.</p>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">13) Хотелки</p>
                  <p className="mt-1">Список предложений по сервису: добавление, редактирование, отметка выполненных.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {wishesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="app-card w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Список предложений по сервису</h3>
                <button
                  type="button"
                  onClick={() => setWishesOpen(false)}
                  className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Закрыть
                </button>
              </div>

              {wishesError && <p className="mb-2 text-sm text-red-600">ОШИБКА: {wishesError}</p>}
              {wishesLoading && <p className="mb-3 text-sm text-slate-500">Загружаем предложения...</p>}

              <div className="mb-4 max-h-[320px] overflow-y-auto rounded-md border border-slate-200">
                {wishes.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">Пока нет предложений.</p>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {wishes.map((wish) => {
                      const isEditing = wishEditingId === wish.id;
                      return (
                        <div
                          key={wish.id}
                          className={`flex items-start gap-3 p-3 ${wish.is_done ? "bg-emerald-50/70" : "bg-amber-50/70"}`}
                        >
                          <input
                            type="checkbox"
                            checked={wish.is_done}
                            disabled={wishTogglingId === wish.id}
                            onChange={() => toggleWish(wish)}
                            className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />

                          <div className="min-w-0 flex-1">
                            {isEditing ? (
                              <textarea
                                value={wishEditingText}
                                onChange={(e) => setWishEditingText(e.target.value)}
                                rows={2}
                                className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800"
                              />
                            ) : (
                              <p className="whitespace-pre-wrap text-sm text-slate-800">{wish.text}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={saveWishEdit}
                                  disabled={wishSavingId === wish.id}
                                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                                >
                                  OK
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelWishEdit}
                                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                                >
                                  Отмена
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startWishEdit(wish)}
                                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                                title="Редактировать"
                              >
                                ✎
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <textarea
                  value={wishDraft}
                  onChange={(e) => setWishDraft(e.target.value)}
                  rows={5}
                  placeholder="Добавьте предложение по улучшению сервиса..."
                  className="w-full resize-y rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-800"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={submitWish}
                    disabled={wishSubmitting || wishDraft.trim().length === 0}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Отправить
                  </button>
                </div>
              </div>
            </div>
          </div>
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
