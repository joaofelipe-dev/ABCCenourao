# Sistema de Relatório de Vendas ABC

Sistema completo de análise e visualização de vendas desenvolvido com Next.js 16 e Node.js/Express.

## 📋 Visão Geral

Este projeto consiste em duas partes principais:
- **Frontend**: Aplicação Next.js com dashboard analítico e relatórios de vendas
- **Backend**: API REST em Node.js/Express conectada a banco de dados Oracle

## 🚀 Funcionalidades

### Dashboard Analítico
- **KPIs em tempo real**: Venda Bruta Total, Itens Vendidos, Preço Médio por Item
- **Gráficos interativos**:
  - Top N Produtos (ajustável de 5 a 20)
  - Vendas por Empresa (gráfico de pizza)
  - Bottom 5 Produtos
  - Tabela de Performance por Empresa
- **Filtros avançados**:
  - Período de datas (Data Inicial e Final)
  - Filtro por empresa específica

### Relatório de Vendas
- **Listagem completa** de vendas com paginação (500 itens por vez)
- **Filtros**:
  - Período de datas
  - Empresa (dropdown com nomes)
  - Produto (por código ou nome)
- **Ordenação**: Por Venda Bruta (desc), Produto (asc), Empresa (asc)
- **Totalizadores**: Total de Itens e Valor Total
- **Botão "Carregar Mais"** para visualizar mais resultados

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 16.0.4** (React 19.2.0)
- **Tailwind CSS 4** para estilização
- **Recharts** para gráficos
- **Lucide React** para ícones

### Backend
- **Node.js** com Express
- **Oracle Database** (oracledb)
- **dotenv** para variáveis de ambiente

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ instalado
- Acesso a um banco de dados Oracle
- npm ou yarn

### Configuração do Backend

1. Navegue até a pasta `backend`:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente criando um arquivo `.env`:
```env
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_CONNECTION_STRING=seu_connection_string
PORT=3001
```

4. Inicie o servidor:
```bash
npm start
```

O backend estará rodando em `http://localhost:3001`

### Configuração do Frontend

1. Navegue até a pasta `frontend`:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra [http://localhost:3000](http://localhost:3000) no navegador

## 🏗️ Estrutura do Projeto

```
ABC Node/
├── backend/
│   ├── server.js          # Servidor Express e rotas da API
│   ├── db.js              # Configuração do banco de dados Oracle
│   ├── package.json
│   └── .env               # Variáveis de ambiente (não versionado)
│
└── frontend/
    ├── app/
    │   ├── page.jsx       # Página principal (Relatório de Vendas)
    │   ├── analytics/
    │   │   └── page.jsx   # Dashboard Analítico
    │   ├── layout.jsx
    │   └── globals.css
    ├── package.json
    └── README.md
```

## 🌐 Deploy

### Frontend (Vercel)
1. Conecte seu repositório ao Vercel
2. Configure o "Root Directory" para `frontend`
3. Deploy automático

### Backend
O backend precisa ser hospedado separadamente em serviços como:
- **Render** (recomendado, plano gratuito disponível)
- **Railway**
- **Heroku**

Após o deploy do backend, atualize a URL da API no frontend (variável `NEXT_PUBLIC_API_URL` ou diretamente no código).

## 📊 Empresas Cadastradas

- **8**: SAN MARCO
- **9**: BONFIM PAULISTA
- **14**: JARDIM BOTANICO
- **15**: SERTAOZINHO
- **16**: TAMANDARE
- **17**: NOVA ALIANCA
- **18**: PORTUGAL
- **20**: HENRIQUE DUMONT
- **21**: JARDIM CALIFORNIA

## 🔧 Scripts Disponíveis

### Frontend
```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Cria build de produção
npm start        # Inicia servidor de produção
npm run lint     # Executa linter
```

### Backend
```bash
npm start        # Inicia o servidor
```

## 📝 Notas Importantes

- O backend deve estar rodando antes de iniciar o frontend
- A API está configurada para `http://localhost:3001` por padrão
- O sistema filtra automaticamente a empresa 19 (excluída das consultas)
- Dados são carregados com base no dia anterior por padrão

## 🤝 Contribuindo

Este é um projeto interno. Para sugestões ou melhorias, entre em contato com a equipe de desenvolvimento.

## 📄 Licença

Propriedade da ABC - Todos os direitos reservados.
