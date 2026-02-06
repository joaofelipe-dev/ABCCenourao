"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { ArrowLeft } from "lucide-react";

export default function ComparativoPage() {
  const [mode, setMode] = useState("mensal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentData, setCurrentData] = useState([]);
  const [previousData, setPreviousData] = useState([]);
  const [periodText, setPeriodText] = useState({ current: "", previous: "" });
  const [curIni, setCurIni] = useState("");
  const [curFim, setCurFim] = useState("");
  const [prevIni, setPrevIni] = useState("");
  const [prevFim, setPrevFim] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");

  const COMPANY_NAMES = {
    8: "SAN MARCO",
    9: "BONFIM PAULISTA",
    14: "JARDIM BOTANICO",
    15: "SERTAOZINHO",
    16: "TAMANDARE",
    17: "NOVA ALIANCA",
    18: "PORTUGAL",
    20: "HENRIQUE DUMONT",
    21: "JARDIM CALIFORNIA"
  };

  const formatDateForApi = (date) => {
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const getToday = () => {
    const d = new Date();
    return d;
  };

  const formatDateForInput = (date) => {
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDateInputToApi = (dateStr) => {
    const [yyyy, mm, dd] = String(dateStr).split("-");
    return `${dd}/${mm}/${yyyy}`;
  };

  const getFirstDayOfMonth = (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  };

  const clampDayInMonth = (year, month, day) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return Math.min(day, lastDay);
  };

  const monthlyRanges = () => {
    const today = getToday();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const curStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), 1);
    const curEnd = yesterday;
    const prevMonth = yesterday.getMonth() - 1;
    const prevYear = prevMonth < 0 ? yesterday.getFullYear() - 1 : yesterday.getFullYear();
    const prevMonthIndex = (prevMonth + 12) % 12;
    const day = clampDayInMonth(prevYear, prevMonthIndex, yesterday.getDate());
    const prevStart = new Date(prevYear, prevMonthIndex, 1);
    const prevEnd = new Date(prevYear, prevMonthIndex, day);
    return {
      current: { ini: curStart, fim: curEnd },
      previous: { ini: prevStart, fim: prevEnd }
    };
  };

  const yearlyRanges = () => {
    const today = getToday();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const curStart = new Date(yesterday.getFullYear(), 0, 1);
    const curEnd = yesterday;
    const prevYear = yesterday.getFullYear() - 1;
    const prevStart = new Date(prevYear, 0, 1);
    const prevEnd = new Date(prevYear, yesterday.getMonth(), clampDayInMonth(prevYear, yesterday.getMonth(), yesterday.getDate()));
    return {
      current: { ini: curStart, fim: curEnd },
      previous: { ini: prevStart, fim: prevEnd }
    };
  };

  const fetchComparative = async () => {
    setLoading(true);
    setError("");
    try {
      let currentIniStr, currentFimStr, previousIniStr, previousFimStr;
      if (mode === "mensal" || mode === "anual") {
        const ranges = mode === "mensal" ? monthlyRanges() : yearlyRanges();
        currentIniStr = formatDateForApi(ranges.current.ini);
        currentFimStr = formatDateForApi(ranges.current.fim);
        previousIniStr = formatDateForApi(ranges.previous.ini);
        previousFimStr = formatDateForApi(ranges.previous.fim);
      } else {
        if (!curIni || !curFim || !prevIni || !prevFim) {
          const def = monthlyRanges();
          setCurIni(formatDateForInput(def.current.ini));
          setCurFim(formatDateForInput(def.current.fim));
          setPrevIni(formatDateForInput(def.previous.ini));
          setPrevFim(formatDateForInput(def.previous.fim));
          currentIniStr = formatDateForApi(def.current.ini);
          currentFimStr = formatDateForApi(def.current.fim);
          previousIniStr = formatDateForApi(def.previous.ini);
          previousFimStr = formatDateForApi(def.previous.fim);
        } else {
          currentIniStr = formatDateInputToApi(curIni);
          currentFimStr = formatDateInputToApi(curFim);
          previousIniStr = formatDateInputToApi(prevIni);
          previousFimStr = formatDateInputToApi(prevFim);
        }
      }

      setPeriodText({
        current: `${currentIniStr} - ${currentFimStr}`,
        previous: `${previousIniStr} - ${previousFimStr}`
      });
      let apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl && typeof window !== "undefined") {
        apiUrl = `http://${window.location.hostname}:900`;
      }

      const [curRes, prevRes] = await Promise.all([
        fetch(`${apiUrl}/vendas?data_ini=${currentIniStr}&data_fim=${currentFimStr}`),
        fetch(`${apiUrl}/vendas?data_ini=${previousIniStr}&data_fim=${previousFimStr}`)
      ]);

      if (!curRes.ok || !prevRes.ok) {
        const errDataCur = curRes.ok ? null : await curRes.json();
        const errDataPrev = prevRes.ok ? null : await prevRes.json();
        throw new Error((errDataCur?.error || errDataPrev?.error) ?? "Erro ao buscar dados");
      }

      const [curJson, prevJson] = await Promise.all([curRes.json(), prevRes.json()]);
      setCurrentData(curJson || []);
      setPreviousData(prevJson || []);
    } catch (err) {
      setError(err.message);
      setCurrentData([]);
      setPreviousData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparative();
  }, [mode]);

  const filtra = (arr) =>
    arr.filter(item => {
      const matchEmpresa = filtroEmpresa ? item.EMPRESA.toString() === filtroEmpresa : true;
      const matchDepartamento = filtroDepartamento ? item["DEPARTAMENTO"] === filtroDepartamento : true;
      return matchEmpresa && matchDepartamento;
    });

  const empresasDisponiveis = Array.from(new Set([...currentData, ...previousData].map(i => i.EMPRESA))).sort((a, b) => a - b);
  const departamentosDisponiveis = Array.from(new Set([...currentData, ...previousData].map(i => i["DEPARTAMENTO"]))).sort((a, b) => {
    const as = String(a), bs = String(b);
    return as.localeCompare(bs, 'pt-BR', { numeric: true, sensitivity: 'base' });
  });

  const sum = (arr, field) => arr.reduce((acc, curr) => acc + (curr[field] || 0), 0);
  const currentFiltered = filtra(currentData);
  const previousFiltered = filtra(previousData);
  const totalVendaAtual = sum(currentFiltered, "VENDA BRUTA");
  const totalVendaAnterior = sum(previousFiltered, "VENDA BRUTA");
  const totalItensAtual = sum(currentFiltered, "QTDE VENDIDA");
  const totalItensAnterior = sum(previousFiltered, "QTDE VENDIDA");
  const ticketAtual = totalItensAtual > 0 ? totalVendaAtual / totalItensAtual : 0;
  const ticketAnterior = totalItensAnterior > 0 ? totalVendaAnterior / totalItensAnterior : 0;

  const pct = (cur, prev) => {
    if (prev === 0) return cur === 0 ? 0 : 100;
    return ((cur - prev) / prev) * 100;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const chartData = [
    { name: "Venda", Atual: totalVendaAtual, Anterior: totalVendaAnterior },
    { name: "Itens", Atual: totalItensAtual, Anterior: totalItensAnterior },
    { name: "Ticket/Item", Atual: ticketAtual, Anterior: ticketAnterior }
  ];

  const CustomTooltipComparativo = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    const atual = payload.find(p => p.dataKey === "Atual");
    const anterior = payload.find(p => p.dataKey === "Anterior");
    const fmt = (lbl, v) => {
      if (lbl === "Venda" || String(lbl).toLowerCase().includes("ticket")) return formatCurrency(v);
      return Number(v).toLocaleString("pt-BR");
    };
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-md">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</div>
        <div className="text-xs text-slate-700">Atual: <span className="font-bold">{fmt(label, atual?.value ?? 0)}</span></div>
        <div className="text-xs text-slate-700">Anterior: <span className="font-bold">{fmt(label, anterior?.value ?? 0)}</span></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Comparativo</h2>
            <p className="text-slate-500 text-sm sm:text-base">Compare períodos selecionados</p>
            {periodText.current && periodText.previous && (
              <p className="text-xs font-bold text-slate-700">
                {periodText.current} <span className="text-slate-400">comparado a</span> {periodText.previous}
              </p>
            )}
          </div>
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white px-5 py-3 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95"
          >
            <ArrowLeft size={16} />
            Voltar para Lista
          </Link>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Modo</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/50 appearance-none"
              >
                <option value="mensal">Mensal (mês atual vs mês anterior)</option>
                <option value="anual">Anual (YTD vs YTD anterior)</option>
                <option value="custom">Customizado</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Loja</label>
              <select
                value={filtroEmpresa}
                onChange={(e) => setFiltroEmpresa(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/50 appearance-none"
              >
                <option value="">Todas</option>
                {empresasDisponiveis.map((id) => (
                  <option key={id} value={id}>
                    {COMPANY_NAMES[id] || `EMPRESA ${id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Departamento</label>
              <select
                value={filtroDepartamento}
                onChange={(e) => setFiltroDepartamento(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/50 appearance-none"
              >
                <option value="">Todos</option>
                {departamentosDisponiveis.map((d) => (
                  <option key={String(d)} value={d}>
                    {String(d)}
                  </option>
                ))}
              </select>
            </div>

            {mode === "custom" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Atual - Início</label>
                  <input
                    type="date"
                    value={curIni}
                    onChange={(e) => setCurIni(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Atual - Fim</label>
                  <input
                    type="date"
                    value={curFim}
                    onChange={(e) => setCurFim(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Anterior - Início</label>
                  <input
                    type="date"
                    value={prevIni}
                    onChange={(e) => setPrevIni(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Anterior - Fim</label>
                  <input
                    type="date"
                    value={prevFim}
                    onChange={(e) => setPrevFim(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/50"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={fetchComparative}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Atualizar"}
              </button>
              <button
                onClick={() => { setFiltroEmpresa(""); setFiltroDepartamento(""); }}
                className="w-full bg-white hover:bg-slate-50 text-blue-600 font-semibold py-3 px-6 rounded-xl border border-blue-100 shadow-sm transition-all active:scale-95"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-medium text-sm">{error}</span>
          </div>
        )}

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border-slate-200 border bg-white p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Venda Bruta</div>
            <div className="mt-2 text-2xl font-black">{formatCurrency(totalVendaAtual)}</div>
            <div className="mt-1 text-xs text-slate-500">Anterior: {formatCurrency(totalVendaAnterior)}</div>
            <div className={`mt-2 text-xs font-bold ${pct(totalVendaAtual, totalVendaAnterior) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {pct(totalVendaAtual, totalVendaAnterior).toFixed(1)}%
            </div>
          </div>

          <div className="rounded-2xl border-slate-200 border bg-white p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Itens Vendidos</div>
            <div className="mt-2 text-2xl font-black">{totalItensAtual.toLocaleString()}</div>
            <div className="mt-1 text-xs text-slate-500">Anterior: {totalItensAnterior.toLocaleString()}</div>
            <div className={`mt-2 text-xs font-bold ${pct(totalItensAtual, totalItensAnterior) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {pct(totalItensAtual, totalItensAnterior).toFixed(1)}%
            </div>
          </div>

          <div className="rounded-2xl border-slate-200 border bg-white p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Ticket Médio/Item</div>
            <div className="mt-2 text-2xl font-black">{formatCurrency(ticketAtual)}</div>
            <div className="mt-1 text-xs text-slate-500">Anterior: {formatCurrency(ticketAnterior)}</div>
            <div className={`mt-2 text-xs font-bold ${pct(ticketAtual, ticketAnterior) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {pct(ticketAtual, ticketAnterior).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <div className="rounded-2xl border-slate-200 border bg-white p-6">
            <div className="text-lg font-bold mb-4">Comparativo de Venda Bruta</div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: "Venda", Atual: totalVendaAtual, Anterior: totalVendaAnterior }]} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip content={<CustomTooltipComparativo />} />
                  <Legend />
                  <Bar dataKey="Atual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Anterior" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border-slate-200 border bg-white p-6">
            <div className="text-lg font-bold mb-4">Comparativo de Itens Vendidos</div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: "Itens", Atual: totalItensAtual, Anterior: totalItensAnterior }]} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => Number(v).toLocaleString("pt-BR")} />
                  <Tooltip content={<CustomTooltipComparativo />} />
                  <Legend />
                  <Bar dataKey="Atual" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Anterior" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border-slate-200 border bg-white p-6">
            <div className="text-lg font-bold mb-4">Comparativo de Ticket Médio/Item</div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: "Ticket/Item", Atual: ticketAtual, Anterior: ticketAnterior }]} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip content={<CustomTooltipComparativo />} />
                  <Legend />
                  <Bar dataKey="Atual" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Anterior" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
