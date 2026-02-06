import "dotenv/config";
import express from "express";
import cors from "cors";
import oracledb from "oracledb";
import { getConnection } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

// Middleware para log de todas as requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rota raiz apenas para teste
app.get("/", (req, res) => {
  console.log("Rota / acessada");
  res.send("Servidor rodando!");
});

// Rota /vendas com filtro de data
app.get("/vendas", async (req, res) => {
  console.log("Rota /vendas acessada");
  const { data_ini, data_fim } = req.query;

  if (!data_ini || !data_fim) {
    return res.status(400).json({ error: "Parâmetros data_ini e data_fim são obrigatórios (DD/MM/YYYY)" });
  }

  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRegex.test(data_ini) || !dateRegex.test(data_fim)) {
    return res.status(400).json({ error: "Formato de data inválido. Use DD/MM/YYYY" });
  }

  let connection;
  try {
    connection = await getConnection();
    const sql = `
      SELECT 
          v.produto,
          p.descritivo AS "DESCRIÇÃO",
          CASE 
              WHEN p.depto = 1  THEN 'ACOUGUE'
              WHEN p.depto = 2  THEN 'FRIOS'
              WHEN p.depto = 3  THEN 'HORTIFRUTI'
              WHEN p.depto = 4  THEN 'EMPORIO'
              WHEN p.depto = 5  THEN 'MERCEARIA'
              WHEN p.depto = 6  THEN 'PANIFICACAO'
              WHEN p.depto = 7  THEN 'ROTISSERIE'
              WHEN p.depto = 8  THEN 'CAFETERIA'
              WHEN p.depto = 9  THEN 'MATERIA PRIMA'
              WHEN p.depto = 10 THEN 'IMOBILIZADO'
              WHEN p.depto = 11 THEN 'USO E CONSUMO'
              WHEN p.depto = 12 THEN 'EMBALAGENS'
              WHEN p.depto = 13 THEN 'FLORICULTURA(ANTIGO)'
              WHEN p.depto = 14 THEN 'COMBUSTIVEL'
              WHEN p.depto = 15 THEN 'PROMOCAO'
              WHEN p.depto = 16 THEN 'EXCLUIDOS'
              WHEN p.depto = 17 THEN 'FLORICULTURA'
              ELSE 'DEPARTAMENTO OUTROS'
          END AS "DEPARTAMENTO",
          SUM(v.qtde) AS "QTDE VENDIDA",
          SUM(v.valor) AS "VENDA BRUTA",
          v.empresa
      FROM VWT_VENDAS_DIARIAS v
      JOIN PRODUTOS p ON p.id = v.produto
      WHERE v.data BETWEEN TO_DATE(:data_ini, 'DD/MM/YYYY') AND TO_DATE(:data_fim, 'DD/MM/YYYY')
        AND v.empresa <> 19
        AND v.valor > 0
      GROUP BY v.produto, p.depto, p.descritivo, v.empresa
      ORDER BY SUM(v.valor) DESC, v.produto ASC, v.empresa ASC
    `;

    const result = await connection.execute(sql, { data_ini, data_fim }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao consultar banco de dados:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Erro ao fechar conexão:", err);
      }
    }
  }
});
// Start do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse via IP local: http://<seu-ip-local>:${PORT}`);
});
