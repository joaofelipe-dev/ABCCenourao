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
    const curStart = getFirstDayOfMonth(today);
    const curEnd = today;
    const prevMonth = today.getMonth() - 1;
    const prevYear = prevMonth < 0 ? today.getFullYear() - 1 : today.getFullYear();
    const prevMonthIndex = (prevMonth + 12) % 12;
    const day = clampDayInMonth(prevYear, prevMonthIndex, today.getDate());
    const prevStart = new Date(prevYear, prevMonthIndex, 1);
    const prevEnd = new Date(prevYear, prevMonthIndex, day);
    return {
      current: { ini: curStart, fim: curEnd },
      previous: { ini: prevStart, fim: prevEnd }
    };
  };

  const yearlyRanges = () => {
    const today = getToday();
    const curStart = new Date(today.getFullYear(), 0, 1);
    const curEnd = today;
    const prevYear = today.getFullYear() - 1;
    const prevStart = new Date(prevYear, 0, 1);
    const prevEnd = new Date(prevYear, today.getMonth(), clampDayInMonth(prevYear, today.getMonth(), today.getDate()));
    return {
      current: { ini: curStart, fim: curEnd },
      previous: { ini: prevStart, fim: prevEnd }
    };
  };

  const fetchComparative = async () => {
    setLoading(true);
    setError("");
    try {
      const ranges = mode === "mensal" ? monthlyRanges() : yearlyRanges();
      setPeriodText({
        current: `${formatDateForApi(ranges.current.ini)} - ${formatDateForApi(ranges.current.fim)}`,
        previous: `${formatDateForApi(ranges.previous.ini)} - ${formatDateForApi(ranges.previous.fim)}`
      });
      let apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl && typeof window !== "undefined") {
        apiUrl = `http://${window.location.hostname}:900`;
      }

      const [curRes, prevRes] = await Promise.all([
        fetch(`${apiUrl}/vendas?data_ini=${formatDateForApi(ranges.current.ini)}&data_fim=${formatDateForApi(ranges.current.fim)}`),
        fetch(`${apiUrl}/vendas?data_ini=${formatDateForApi(ranges.previous.ini)}&data_fim=${formatDateForApi(ranges.previous.fim)}`)
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

  const sum = (arr, field) => arr.reduce((acc, curr) => acc + (curr[field] || 0), 0);
  const totalVendaAtual = sum(currentData, "VENDA BRUTA");
  const totalVendaAnterior = sum(previousData, "VENDA BRUTA");
  const totalItensAtual = sum(currentData, "QTDE VENDIDA");
  const totalItensAnterior = sum(previousData, "QTDE VENDIDA");
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
    { name: "Ticket", Atual: ticketAtual, Anterior: ticketAnterior }
  ];

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
              </select>
            </div>

            <button
              onClick={fetchComparative}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "Atualizar"}
            </button>
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
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Ticket Médio</div>
            <div className="mt-2 text-2xl font-black">{formatCurrency(ticketAtual)}</div>
            <div className="mt-1 text-xs text-slate-500">Anterior: {formatCurrency(ticketAnterior)}</div>
            <div className={`mt-2 text-xs font-bold ${pct(ticketAtual, ticketAnterior) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {pct(ticketAtual, ticketAnterior).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-slate-200 border bg-white p-6">
          <div className="text-lg font-bold mb-4">Comparativo</div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `R$${Math.round(v/1000)}k` : `R$${v}`} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Atual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Anterior" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
