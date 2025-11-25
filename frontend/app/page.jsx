"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function Home() {
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

  // Filtros locais
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroProduto, setFiltroProduto] = useState("");
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

      const res = await fetch(`http://localhost:3001/vendas?data_ini=${ini}&data_fim=${fim}`);

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
    buscarVendas();
  }, []);

  // Dados filtrados
  const vendasFiltradas = vendas.filter(venda => {
    const matchEmpresa = filtroEmpresa ? venda.EMPRESA.toString().includes(filtroEmpresa) : true;
    const matchProduto = filtroProduto
      ? (venda.PRODUTO.toString().includes(filtroProduto) || venda["DESCRIÇÃO"].toLowerCase().includes(filtroProduto.toLowerCase()))
      : true;
    return matchEmpresa && matchProduto;
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

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Relatório de Vendas</h1>
            <p className="text-gray-500 mt-2">Consulte as vendas detalhadas por período</p>
          </div>
          <Link
            href="/analytics"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            <BarChart3 size={20} />
            Ver Dashboards
          </Link>
        </header>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Data Inicial</label>
              <input
                type="date"
                value={dataIni}
                onChange={(e) => setDataIni(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Data Final</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Empresa (ID)</label>
              <input
                type="text"
                placeholder="Todas"
                value={filtroEmpresa}
                onChange={(e) => setFiltroEmpresa(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Produto (ID ou Nome)</label>
              <input
                type="text"
                placeholder="Todos"
                value={filtroProduto}
                onChange={(e) => setFiltroProduto(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <button
              onClick={buscarVendas}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
            >
              {loading ? 'Buscando...' : 'Filtrar'}
            </button>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">
            {error}
          </div>
        )}

        {/* Tabela de Resultados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <th className="p-4">Empresa</th>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4 text-right">Qtd. Vendida</th>
                  <th className="p-4 text-right">Venda Bruta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendasFiltradas.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}

                {vendasFiltradas.slice(0, visibleCount).map((venda, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600">{venda.EMPRESA}</td>
                    <td className="p-4 font-medium text-gray-900">{venda.PRODUTO}</td>
                    <td className="p-4 text-gray-600">{venda["DESCRIÇÃO"]}</td>
                    <td className="p-4 text-right font-mono text-gray-700">{venda["QTDE VENDIDA"]}</td>
                    <td className="p-4 text-right font-mono font-medium text-green-600">
                      {formatCurrency(venda["VENDA BRUTA"])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Botão Carregar Mais */}
          {vendasFiltradas.length > visibleCount && (
            <div className="p-4 border-t border-gray-100 flex justify-center bg-white">
              <button
                onClick={() => setVisibleCount(prev => prev + 500)}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline transition-all"
              >
                Carregar mais resultados ({vendasFiltradas.length - visibleCount} restantes)
              </button>
            </div>
          )}

          {/* Rodapé da Tabela (Totais) */}
          {vendasFiltradas.length > 0 && (
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-8 text-sm">
              <div>
                <span className="text-gray-500 mr-2">Total Itens:</span>
                <span className="font-bold text-gray-900">
                  {vendasFiltradas.reduce((acc, curr) => acc + curr["QTDE VENDIDA"], 0)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 mr-2">Valor Total:</span>
                <span className="font-bold text-green-600 text-lg">
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
