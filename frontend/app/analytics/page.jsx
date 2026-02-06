"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { ArrowLeft, TrendingUp, DollarSign, Package, Calendar } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utility for Shadcn-like classes ---
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// --- Mock Components mimicking Shadcn UI ---
const Card = ({ className, children }) => (
    <div className={cn("rounded-xl border bg-card text-card-foreground shadow-sm bg-white", className)}>
        {children}
    </div>
);

const CardHeader = ({ className, children }) => (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>
);

const CardTitle = ({ className, children }) => (
    <h3 className={cn("font-semibold leading-none tracking-tight", className)}>{children}</h3>
);

const CardContent = ({ className, children }) => (
    <div className={cn("p-6 pt-0", className)}>{children}</div>
);

// --- Main Dashboard Page ---
export default function AnalyticsPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();

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
    const [topN, setTopN] = useState(5);
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

    const formatDateForApi = (dateString) => {
        if (!dateString) return "";
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const ini = formatDateForApi(dataIni);
            const fim = formatDateForApi(dataFim);
            let apiUrl = process.env.NEXT_PUBLIC_API_URL;
            if (!apiUrl && typeof window !== "undefined") {
                apiUrl = `http://${window.location.hostname}:900`;
            }
            const res = await fetch(`${apiUrl}/vendas?data_ini=${ini}&data_fim=${fim}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error("Erro ao buscar dados", error);
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

        if (!(pIni || pFim || pEmpresa || pDepto)) {
            if (typeof window !== "undefined") {
                const stored = localStorage.getItem("abc_filters");
                if (stored) {
                    try {
                        const s = JSON.parse(stored);
                        if (s.dataIni) setDataIni(s.dataIni);
                        if (s.dataFim) setDataFim(s.dataFim);
                        if (s.filtroEmpresa) setFiltroEmpresa(s.filtroEmpresa);
                        if (s.filtroDepartamento) setFiltroDepartamento(s.filtroDepartamento);
                    } catch {}
                }
            }
        }
        fetchData();
    }, [searchParams]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const payload = { dataIni, dataFim, filtroEmpresa, filtroDepartamento };
            localStorage.setItem("abc_filters", JSON.stringify(payload));
        }
    }, [dataIni, dataFim, filtroEmpresa, filtroDepartamento]);

    // Filtrar dados por empresa e departamento se selecionados
    const dadosFiltrados = data.filter(item => {
        const matchEmpresa = filtroEmpresa ? item.EMPRESA.toString() === filtroEmpresa : true;
        const matchDepartamento = filtroDepartamento ? item["DEPARTAMENTO"] === filtroDepartamento : true;
        return matchEmpresa && matchDepartamento;
    });

    // Processamento dos dados para os gráficos
    const totalVendas = dadosFiltrados.reduce((acc, curr) => acc + curr["VENDA BRUTA"], 0);
    const totalItens = dadosFiltrados.reduce((acc, curr) => acc + curr["QTDE VENDIDA"], 0);

    // Top N Produtos
    const topProdutos = [...dadosFiltrados]
        .sort((a, b) => b["VENDA BRUTA"] - a["VENDA BRUTA"])
        .slice(0, topN)
        .map(item => ({
            name: `${item.PRODUTO} - ${(COMPANY_NAMES[item.EMPRESA] || `EMPRESA ${item.EMPRESA}`)}`,
            full_name: item["DESCRIÇÃO"],
            value: item["VENDA BRUTA"],
            produto: item.PRODUTO,
            empresa: COMPANY_NAMES[item.EMPRESA] || `EMPRESA ${item.EMPRESA}`
        }));

    // Bottom 5 Produtos (Menor Receita)
    const bottomProdutos = [...dadosFiltrados]
        .filter(item => item["VENDA BRUTA"] > 0) // Ignorar vendas zeradas ou negativas se houver
        .sort((a, b) => a["VENDA BRUTA"] - b["VENDA BRUTA"])
        .slice(0, 5)
        .map(item => ({
            name: item["DESCRIÇÃO"].length > 15 ? item["DESCRIÇÃO"].substring(0, 15) + '...' : item["DESCRIÇÃO"],
            full_name: item["DESCRIÇÃO"],
            value: item["VENDA BRUTA"]
        }));

    // Vendas por Empresa
    const vendasPorEmpresa = Object.values(dadosFiltrados.reduce((acc, curr) => {
        const empresaId = curr.EMPRESA;
        const empresaNome = COMPANY_NAMES[empresaId] || `EMPRESA ${empresaId}`;

        if (!acc[empresaId]) acc[empresaId] = { id: empresaId, name: empresaNome, value: 0 };
        acc[empresaId].value += curr["VENDA BRUTA"];
        return acc;
    }, {}));

    // Vendas por Departamento
    const vendasPorDepartamento = Object.values(dadosFiltrados.reduce((acc, curr) => {
        const depto = curr["DEPARTAMENTO"];
        if (!acc[depto]) acc[depto] = { name: depto, value: 0 };
        acc[depto].value += curr["VENDA BRUTA"];
        return acc;
    }, {})).sort((a, b) => b.value - a.value);

    // Tabela de Performance por Empresa
    const companyPerformance = Object.values(dadosFiltrados.reduce((acc, curr) => {
        const empresaId = curr.EMPRESA;
        const empresaNome = COMPANY_NAMES[empresaId] || `EMPRESA ${empresaId}`;

        if (!acc[empresaId]) {
            acc[empresaId] = {
                id: empresaId,
                name: empresaNome,
                totalSales: 0,
                totalItems: 0
            };
        }
        acc[empresaId].totalSales += curr["VENDA BRUTA"];
        acc[empresaId].totalItems += curr["QTDE VENDIDA"];
        return acc;
    }, {})).map(company => ({
        ...company,
        avgTicket: company.totalItems > 0 ? company.totalSales / company.totalItems : 0
    })).sort((a, b) => b.totalSales - a.totalSales);

    // Tabela de Performance por Departamento
    const departmentPerformance = Object.values(dadosFiltrados.reduce((acc, curr) => {
        const depto = curr["DEPARTAMENTO"];
        if (!acc[depto]) {
            acc[depto] = {
                id: depto,
                name: depto,
                totalSales: 0,
                totalItems: 0
            };
        }
        acc[depto].totalSales += curr["VENDA BRUTA"];
        acc[depto].totalItems += curr["QTDE VENDIDA"];
        return acc;
    }, {})).map(dept => ({
        ...dept,
        avgTicket: dept.totalItems > 0 ? dept.totalSales / dept.totalItems : 0
    })).sort((a, b) => b.totalSales - a.totalSales);

    const generateColors = (n) => {
        const colors = [];
        for (let i = 0; i < n; i++) {
            const hue = Math.round((360 / n) * i);
            colors.push(`hsl(${hue}, 70%, 55%)`);
        }
        return colors;
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const CustomTooltipTopProdutos = ({ active, payload }) => {
        if (!active || !payload || payload.length === 0) return null;
        const d = payload[0].payload;
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-md">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Produto</div>
                <div className="text-sm font-bold text-slate-900">{`${d.produto} — ${d.full_name}`}</div>
                <div className="text-xs text-slate-600 mt-1">{`Loja: ${d.empresa}`}</div>
                <div className="text-xs text-emerald-600 font-bold mt-2">{`Valor: ${formatCurrency(d.value)}`}</div>
            </div>
        );
    };

    const clearFilters = () => {
        const yesterday = formatDateForInput(getYesterday());
        setDataIni(yesterday);
        setDataFim(yesterday);
        setFiltroEmpresa("");
        setFiltroDepartamento("");
        fetchData();
        const params = new URLSearchParams();
        params.set("data_ini", yesterday);
        params.set("data_fim", yesterday);
        router.replace(`/analytics?${params.toString()}`);
    };

    const backHref = `/?data_ini=${dataIni}&data_fim=${dataFim}${filtroEmpresa ? `&empresa=${filtroEmpresa}` : ""}${filtroDepartamento ? `&depto=${filtroDepartamento}` : ""}`;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Dashboard Analítico</h2>
                        <p className="text-slate-500 text-sm sm:text-base">Visão geral das vendas do período.</p>
                    </div>
                    <Link
                        href={backHref}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white px-5 py-3 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95"
                    >
                        <ArrowLeft size={16} />
                        Voltar para Lista
                    </Link>
                </div>

                {/* Filtros de Data */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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
                                {Array.from(new Set(data.map(d => d["DEPARTAMENTO"]))).sort().map((depto) => (
                                    <option key={depto} value={depto}>
                                        {depto}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : 'Atualizar'}
                        </button>
                        <button
                            onClick={clearFilters}
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all border border-slate-200 shadow-sm active:scale-95"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="rounded-2xl border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Venda Bruta Total</CardTitle>
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <DollarSign className="h-4 w-4 text-emerald-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-900">{formatCurrency(totalVendas)}</div>
                            <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tight">Período selecionado</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Itens Vendidos</CardTitle>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Package className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-900">{totalItens.toLocaleString()}</div>
                            <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-tight">Unidades totais</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Ticket Médio/Item</CardTitle>
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <TrendingUp className="h-4 w-4 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-900">
                                {totalItens > 0 ? formatCurrency(totalVendas / totalItens) : "R$ 0,00"}
                            </div>
                            <p className="text-[10px] font-bold text-purple-600 mt-1 uppercase tracking-tight">Média por unidade</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Empresas Ativas</CardTitle>
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <Calendar className="h-4 w-4 text-orange-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-slate-900">
                                {companyPerformance.length}
                            </div>
                            <p className="text-[10px] font-bold text-orange-600 mt-1 uppercase tracking-tight">Unidades com venda</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Chart Section - Full Width */}
                <Card className="w-full rounded-2xl border-slate-200 overflow-hidden">
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 pb-6">
                        <CardTitle className="text-lg font-bold">Top {topN} Produtos (Receita)</CardTitle>
                        <select
                            value={topN}
                            onChange={(e) => setTopN(Number(e.target.value))}
                            className="w-full sm:w-auto text-sm border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 font-semibold"
                        >
                            <option value={5}>Top 5</option>
                            <option value={10}>Top 10</option>
                            <option value={15}>Top 15</option>
                            <option value={20}>Top 20</option>
                        </select>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <div className="h-[300px] sm:h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProdutos} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `R$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        content={<CustomTooltipTopProdutos />}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Secondary Charts Section */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                    {/* Vendas por Empresa */}
                    <Card className="rounded-2xl border-slate-200">
                        <CardHeader className="border-b border-slate-50 pb-6">
                            <CardTitle className="text-lg font-bold">Vendas por Empresa</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[300px] w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={vendasPorEmpresa}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {vendasPorEmpresa.map((entry, index) => {
                                                const COLORS_EMPRESA = generateColors(vendasPorEmpresa.length);
                                                return (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS_EMPRESA[index]}
                                                        strokeWidth={0}
                                                        onClick={() => {
                                                            const params = new URLSearchParams();
                                                            params.set("data_ini", dataIni);
                                                            params.set("data_fim", dataFim);
                                                            params.set("empresa", entry.id.toString());
                                                            if (filtroDepartamento) params.set("depto", filtroDepartamento);
                                                            router.push(`/?${params.toString()}`);
                                                        }}
                                                    />
                                                );
                                            })}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => formatCurrency(value)}
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '20px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Performance Table */}
                    <Card className="rounded-2xl border-slate-200 overflow-hidden">
                        <CardHeader className="border-b border-slate-50 pb-6">
                            <CardTitle className="text-lg font-bold">Performance das Unidades</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            <th className="px-6 py-4">Empresa</th>
                                            <th className="px-6 py-4 text-right">Receita</th>
                                            <th className="px-6 py-4 text-right">Média</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {companyPerformance.map((company) => (
                                            <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-900">{company.name}</td>
                                                <td className="px-6 py-4 text-right text-emerald-600 font-bold">
                                                    {formatCurrency(company.totalSales)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-500 font-medium">
                                                    {formatCurrency(company.avgTicket)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Departments Section */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                    {/* Vendas por Departamento */}
                    <Card className="rounded-2xl border-slate-200">
                        <CardHeader className="border-b border-slate-50 pb-6">
                            <CardTitle className="text-lg font-bold">Vendas por Departamento</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[300px] w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={vendasPorDepartamento}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {vendasPorDepartamento.map((entry, index) => {
                                                const COLORS_DEPTO = generateColors(vendasPorDepartamento.length);
                                                return (
                                                    <Cell
                                                        key={`cell-depto-${index}`}
                                                        fill={COLORS_DEPTO[index]}
                                                        strokeWidth={0}
                                                        onClick={() => {
                                                            const params = new URLSearchParams();
                                                            params.set("data_ini", dataIni);
                                                            params.set("data_fim", dataFim);
                                                            params.set("depto", entry.name);
                                                            if (filtroEmpresa) params.set("empresa", filtroEmpresa);
                                                            router.push(`/?${params.toString()}`);
                                                        }}
                                                    />
                                                );
                                            })}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => formatCurrency(value)}
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '20px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Performance por Departamento */}
                    <Card className="rounded-2xl border-slate-200 overflow-hidden">
                        <CardHeader className="border-b border-slate-50 pb-6">
                            <CardTitle className="text-lg font-bold">Performance por Departamento</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            <th className="px-6 py-4">Departamento</th>
                                            <th className="px-6 py-4 text-right">Receita</th>
                                            <th className="px-6 py-4 text-right">Média</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {departmentPerformance.map((dept) => (
                                            <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-900">{dept.name}</td>
                                                <td className="px-6 py-4 text-right text-emerald-600 font-bold">
                                                    {formatCurrency(dept.totalSales)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-500 font-medium">
                                                    {formatCurrency(dept.avgTicket)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
