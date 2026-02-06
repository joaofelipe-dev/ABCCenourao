"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const searchParams = useSearchParams();
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Configuração inicial: Dia anterior (Ontem)
  const getYesterday = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
  };

  // Formata YYYY-MM-DD para o input HTML
  const formatDateForInput = (date) => date.toISOString().split('T')[0];

  const [dataIni, setDataIni] = useState(formatDateForInput(getYesterday()));
  const [dataFim, setDataFim] = useState(formatDateForInput(getYesterday()));

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

  // Filtros locais
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroProduto, setFiltroProduto] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [visibleCount, setVisibleCount] = useState(500);

  // Formata DD/MM/YYYY para a API
  const formatDateForApi = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const buscarVendas = async () => {
    setLoading(true);
    setError("");
    try {
      const ini = formatDateForApi(dataIni);
      const fim = formatDateForApi(dataFim);

      let apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl && typeof window !== "undefined") {
        apiUrl = `http://${window.location.hostname}:900`;
      }

      const res = await fetch(`${apiUrl}/vendas?data_ini=${ini}&data_fim=${fim}`);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao buscar dados");
      }

      const data = await res.json();
      setVendas(data);
    } catch (err) {
      setError(err.message);
      setVendas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const pIni = searchParams.get("data_ini");
    const pFim = searchParams.get("data_fim");
    const pEmpresa = searchParams.get("empresa");
    const pDepto = searchParams.get("depto");

    if (pIni) setDataIni(pIni);
    if (pFim) setDataFim(pFim);
    if (pEmpresa) setFiltroEmpresa(pEmpresa);
    if (pDepto) setFiltroDepartamento(pDepto);

    if (pIni || pFim || pEmpresa || pDepto) {
      setTimeout(() => buscarVendas(), 0);
    } else {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("abc_filters");
        if (stored) {
          try {
            const s = JSON.parse(stored);
            if (s.dataIni) setDataIni(s.dataIni);
            if (s.dataFim) setDataFim(s.dataFim);
            if (s.filtroEmpresa) setFiltroEmpresa(s.filtroEmpresa);
            if (s.filtroDepartamento) setFiltroDepartamento(s.filtroDepartamento);
            if (s.filtroProduto) setFiltroProduto(s.filtroProduto);
          } catch {}
        }
      }
      buscarVendas();
    }
  }, [searchParams]);

  // Dados filtrados
  const vendasFiltradas = vendas.filter(venda => {
    const matchEmpresa = filtroEmpresa ? venda.EMPRESA.toString() === filtroEmpresa : true;
    const matchDepartamento = filtroDepartamento ? venda["DEPARTAMENTO"] === filtroDepartamento : true;
    const matchProduto = filtroProduto
      ? (venda.PRODUTO.toString().includes(filtroProduto) || venda["DESCRIÇÃO"].toLowerCase().includes(filtroProduto.toLowerCase()))
      : true;
    return matchEmpresa && matchDepartamento && matchProduto;
  }).sort((a, b) => {
    // 1. Venda Bruta (Decrescente)
    const diffVenda = b["VENDA BRUTA"] - a["VENDA BRUTA"];
    if (diffVenda !== 0) return diffVenda;

    // 2. Produto (Crescente)
    if (a.PRODUTO < b.PRODUTO) return -1;
    if (a.PRODUTO > b.PRODUTO) return 1;

    // 3. Empresa (Crescente)
    if (a.EMPRESA < b.EMPRESA) return -1;
    if (a.EMPRESA > b.EMPRESA) return 1;

    return 0;
  });

  // Formata moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const payload = { dataIni, dataFim, filtroEmpresa, filtroDepartamento, filtroProduto };
      localStorage.setItem("abc_filters", JSON.stringify(payload));
    }
  }, [dataIni, dataFim, filtroEmpresa, filtroDepartamento, filtroProduto]);

  const clearFilters = () => {
    const yesterday = formatDateForInput(getYesterday());
    setDataIni(yesterday);
    setDataFim(yesterday);
    setFiltroEmpresa("");
    setFiltroDepartamento("");
    setFiltroProduto("");
    setTimeout(() => buscarVendas(), 0);
  };

  const analyticsHref = `/analytics?data_ini=${dataIni}&data_fim=${dataFim}${filtroEmpresa ? `&empresa=${filtroEmpresa}` : ""}${filtroDepartamento ? `&depto=${filtroDepartamento}` : ""}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Relatório de Vendas</h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">Consulte as vendas detalhadas por período</p>
          </div>
          <Link
            href={analyticsHref}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 sm:py-2.5 rounded-xl font-medium transition-all shadow-sm active:scale-95"
          >
            <BarChart3 size={20} />
            Ver Dashboards
          </Link>
        </header>

        {/* Filtros */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Data Inicial</label>
              <input
                type="date"
                value={dataIni}
                onChange={(e) => setDataIni(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Data Final</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Empresa</label>
              <select
                value={filtroEmpresa}
                onChange={(e) => setFiltroEmpresa(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/50 appearance-none"
              >
                <option value="">Todas as Lojas</option>
                {Object.entries(COMPANY_NAMES).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
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
                <option value="">Todos os Departamentos</option>
                {Array.from(new Set(vendas.map(v => v["DEPARTAMENTO"]))).sort().map((depto) => (
                  <option key={depto} value={depto}>
                    {depto}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Produto</label>
              <input
                type="text"
                placeholder="Nome ou código..."
                value={filtroProduto}
                onChange={(e) => setFiltroProduto(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50/50"
              />
            </div>

            <button
              onClick={buscarVendas}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-100 flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Aplicar Filtros'}
            </button>
            <button
              onClick={clearFilters}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all border border-slate-200 shadow-sm active:scale-95"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-medium text-sm">{error}</span>
          </div>
        )}

        {/* Lista/Tabela de Resultados */}
        <div className="space-y-4">
          {/* View de Desktop (Tabela) - Hidden on Mobile */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold tracking-widest">
                    <th className="p-4">Empresa</th>
                    <th className="p-4">Produto</th>
                    <th className="p-4">Descrição</th>
                    <th className="p-4">Departamento</th>
                    <th className="p-4 text-right">Qtd. Vendida</th>
                    <th className="p-4 text-right">Venda Bruta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vendasFiltradas.length === 0 && !loading && (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-slate-400 italic font-medium">
                        Nenhum registro encontrado para este filtro.
                      </td>
                    </tr>
                  )}

                  {vendasFiltradas.slice(0, visibleCount).map((venda, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 text-slate-600 text-sm">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold">
                          {COMPANY_NAMES[venda.EMPRESA] || venda.EMPRESA}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900 text-sm tracking-tight">{venda.PRODUTO}</td>
                      <td className="p-4 text-slate-600 text-sm font-medium">{venda["DESCRIÇÃO"]}</td>
                      <td className="p-4">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold text-slate-600">
                          {venda["DEPARTAMENTO"]}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-500 text-sm">{venda["QTDE VENDIDA"]}</td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-600 text-sm">
                        {formatCurrency(venda["VENDA BRUTA"])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* View de Mobile (Cards) - Hidden on Desktop */}
          <div className="md:hidden space-y-3">
            {vendasFiltradas.length === 0 && !loading && (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 font-medium">
                Nenhum registro encontrado.
              </div>
            )}

            {vendasFiltradas.slice(0, visibleCount).map((venda, index) => (
              <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 active:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                    {COMPANY_NAMES[venda.EMPRESA] || `Loja ${venda.EMPRESA}`}
                  </span>
                  <span className="text-sm font-bold text-emerald-600 font-mono">
                    {formatCurrency(venda["VENDA BRUTA"])}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 leading-tight mb-1">{venda["DESCRIÇÃO"]}</h3>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                  <span className="text-xs font-medium text-slate-500">Cód: {venda.PRODUTO}</span>
                  <span className="text-xs font-bold text-slate-700">Qtd: {venda["QTDE VENDIDA"]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Botão Carregar Mais */}
          {vendasFiltradas.length > visibleCount && (
            <div className="pt-2 pb-6 flex justify-center">
              <button
                onClick={() => setVisibleCount(prev => prev + 500)}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-blue-600 font-semibold text-sm px-8 py-3 rounded-xl border border-blue-100 shadow-sm transition-all active:scale-95"
              >
                Carregar mais {vendasFiltradas.length - visibleCount} itens
              </button>
            </div>
          )}

          {/* Rodapé da Tabela (Totais) - Sticky position for mobile */}
          {vendasFiltradas.length > 0 && (
            <div className="sticky bottom-4 left-0 right-0 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center sm:relative sm:bottom-0 sm:mt-6 sm:bg-white sm:text-slate-900 sm:border sm:border-slate-200">
              <div className="flex flex-col sm:flex-row sm:gap-6">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">Total Itens</span>
                <span className="text-lg sm:text-base font-bold sm:text-slate-900">
                  {vendasFiltradas.reduce((acc, curr) => acc + curr["QTDE VENDIDA"], 0).toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-end sm:flex-row sm:gap-6 sm:items-center">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">Valor Total</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 sm:text-emerald-600 tracking-tight">
                  {formatCurrency(vendasFiltradas.reduce((acc, curr) => acc + curr["VENDA BRUTA"], 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
