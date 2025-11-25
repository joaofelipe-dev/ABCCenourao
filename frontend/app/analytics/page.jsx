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
            const res = await fetch(`http://localhost:3001/vendas?data_ini=${ini}&data_fim=${fim}`);
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
        fetchData();
    }, []);

    // Processamento dos dados para os gráficos
    const totalVendas = data.reduce((acc, curr) => acc + curr["VENDA BRUTA"], 0);
    const totalItens = data.reduce((acc, curr) => acc + curr["QTDE VENDIDA"], 0);

    // Top 5 Produtos
    const topProdutos = [...data]
        .sort((a, b) => b["VENDA BRUTA"] - a["VENDA BRUTA"])
        .slice(0, 5)
        .map(item => ({
            name: item["DESCRIÇÃO"].length > 15 ? item["DESCRIÇÃO"].substring(0, 15) + '...' : item["DESCRIÇÃO"],
            full_name: item["DESCRIÇÃO"],
            value: item["VENDA BRUTA"]
        }));

    // Vendas por Empresa
    const vendasPorEmpresa = Object.values(data.reduce((acc, curr) => {
        const empresaId = curr.EMPRESA;
        const empresaNome = COMPANY_NAMES[empresaId] || `EMPRESA ${empresaId}`;

        if (!acc[empresaId]) acc[empresaId] = { name: empresaNome, value: 0 };
        acc[empresaId].value += curr["VENDA BRUTA"];
        return acc;
    }, {}));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Analítico</h2>
                        <p className="text-slate-500">Visão geral das vendas do dia anterior.</p>
                    </div>
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-md border shadow-sm transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Voltar para Lista
                    </Link>
                </div>

                {/* Filtros de Data */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
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

                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
                        >
                            {loading ? 'Atualizando...' : 'Atualizar Dashboard'}
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Venda Bruta Total</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalVendas)}</div>
                            <p className="text-xs text-slate-500">+20.1% em relação à média (mock)</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Itens Vendidos</CardTitle>
                            <Package className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{totalItens}</div>
                            <p className="text-xs text-slate-500">Unidades movimentadas</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Ticket Médio</CardTitle>
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">
                                {totalItens > 0 ? formatCurrency(totalVendas / totalItens) : "R$ 0,00"}
                            </div>
                            <p className="text-xs text-slate-500">Por item vendido</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Data de Referência</CardTitle>
                            <Calendar className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-slate-900">
                                {formatDateForApi(dataIni)} - {formatDateForApi(dataFim)}
                            </div>
                            <p className="text-xs text-slate-500">Período selecionado</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                    {/* Main Chart - Top Products */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Top 5 Produtos (Receita)</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topProdutos}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `R$${value}`}
                                        />
                                        <Tooltip
                                            formatter={(value) => formatCurrency(value)}
                                            cursor={{ fill: '#f3f4f6' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Secondary Chart - Sales by Company */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Vendas por Empresa</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={vendasPorEmpresa}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {vendasPorEmpresa.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
