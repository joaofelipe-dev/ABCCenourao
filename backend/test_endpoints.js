const BASE_URL = 'http://localhost:900';

async function testRoute(name, url) {
    console.log(`\n--- Testando: ${name} ---`);
    console.log(`URL: ${url}`);
    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const json = await res.json();
            console.log(`Body:`, JSON.stringify(json, null, 2));
        } else {
            const text = await res.text();
            console.log(`Body:`, text);
        }
    } catch (err) {
        console.error("Erro na requisição (o servidor está rodando?):", err.message);
    }
}

async function runTests() {
    console.log("Iniciando testes...");

    // 1. Teste Raiz
    await testRoute('Raiz (Health Check)', `${BASE_URL}/`);

    // 2. Teste Validação de Erro (Datas Inválidas)
    await testRoute('Vendas (Datas Inválidas)', `${BASE_URL}/vendas?data_ini=abc&data_fim=123`);

    // 3. Teste Validação de Erro (Sem Parâmetros)
    await testRoute('Vendas (Sem Parâmetros)', `${BASE_URL}/vendas`);

    // 4. Teste Sucesso (Datas Exemplo - Ajuste conforme seus dados)
    // Usando um intervalo de datas genérico
    await testRoute('Vendas (Datas Válidas)', `${BASE_URL}/vendas?data_ini=01/01/2024&data_fim=31/01/2024`);
}

runTests();
