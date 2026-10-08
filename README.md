# 🛒 Cadastro-de-Vendas

Dashboard de vendas desenvolvido com HTML, CSS e JavaScript puro, com cadastro de registros, filtros avançados, indicadores de desempenho, ordenação dinâmica e persistência em localStorage.

## 🔧 Correções

- **Filtro por categoria:** a lista de categorias era recriada a cada atualização da tela, o que apagava a categoria escolhida. Na prática, o filtro nunca era aplicado. Agora a seleção é mantida.
- **Texto digitado virando código:** o nome do vendedor e a categoria eram inseridos com `innerHTML`. Um nome como `<img src=x onerror=...>` era executado e ficava salvo, rodando de novo toda vez que a página abria. Agora a tabela é montada com `textContent`.
- **Dados salvos corrompidos:** se o `localStorage` tivesse um valor inválido, o `JSON.parse` quebrava a página inteira. Agora o dashboard começa vazio.
- **Botão Remover:** trocado o `onclick` inline (que exigia uma função global) por um único listener na tabela.

## 🚀 Como executar

Baixe o repositório e abra `Cadastro de Vendas/index.html` no navegador.
