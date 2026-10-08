const STORAGE_KEY = "sales_manager_dashboard_vendas";

// Se o que está salvo estiver corrompido (ou o storage bloqueado), começa vazio em vez de quebrar a página
function carregarVendas() {
  try {
    const salvas = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(salvas) ? salvas : [];
  } catch {
    return [];
  }
}

let vendas = carregarVendas();
let contador = vendas.length ? Math.max(...vendas.map(v => v.id)) : 0;

const formVenda = document.getElementById("formVenda");
const vendedorInput = document.getElementById("vendedor");
const valorInput = document.getElementById("valor");
const percentualDescontoInput = document.getElementById("percentualDesconto");
const categoriaInput = document.getElementById("categoria");
const dataVendaInput = document.getElementById("dataVenda");

const filtroBusca = document.getElementById("filtroBusca");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroDataInicio = document.getElementById("filtroDataInicio");
const filtroDataFim = document.getElementById("filtroDataFim");
const filtroValorMin = document.getElementById("filtroValorMin");
const filtroValorMax = document.getElementById("filtroValorMax");
const ordenacao = document.getElementById("ordenacao");

const tabelaVendas = document.getElementById("tabelaVendas");
const resumoFiltros = document.getElementById("resumoFiltros");

const cardTotalVendas = document.getElementById("cardTotalVendas");
const cardFaturamentoBruto = document.getElementById("cardFaturamentoBruto");
const cardDescontos = document.getElementById("cardDescontos");
const cardFaturamentoLiquido = document.getElementById("cardFaturamentoLiquido");
const cardTicketMedio = document.getElementById("cardTicketMedio");
const cardMelhorVendedor = document.getElementById("cardMelhorVendedor");

const btnLimparFiltros = document.getElementById("btnLimparFiltros");
const btnLimparTudo = document.getElementById("btnLimparTudo");

let graficoVendedores = null;
let graficoCategorias = null;
let graficoEvolucao = null;

function salvarStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vendas));
  } catch {
    // Sem storage disponível: as vendas ficam só até a página ser fechada
  }
}

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarDataExibicao(dataISO) {
  if (!dataISO) return "-";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function definirDataAtual() {
  if (!dataVendaInput.value) {
    dataVendaInput.value = new Date().toISOString().split("T")[0];
  }
}

function validarFormulario(vendedor, valor, descontoPercentual, dataVenda) {
  if (!vendedor) {
    alert("Informe o nome do vendedor.");
    return false;
  }

  if (isNaN(valor) || valor <= 0) {
    alert("Informe um valor válido.");
    return false;
  }

  if (isNaN(descontoPercentual) || descontoPercentual < 0 || descontoPercentual > 100) {
    alert("Informe um desconto entre 0 e 100.");
    return false;
  }

  if (!dataVenda) {
    alert("Informe a data da venda.");
    return false;
  }

  return true;
}

function adicionarVenda(event) {
  event.preventDefault();

  const vendedor = vendedorInput.value.trim();
  const valor = parseFloat(valorInput.value);
  const descontoPercentual = parseFloat(percentualDescontoInput.value);
  const categoria = categoriaInput.value;
  const dataVenda = dataVendaInput.value;

  if (!validarFormulario(vendedor, valor, descontoPercentual, dataVenda)) {
    return;
  }

  const desconto = valor * (descontoPercentual / 100);
  const valorFinal = valor - desconto;

  const novaVenda = {
    id: ++contador,
    vendedor,
    valor,
    descontoPercentual,
    desconto,
    valorFinal,
    categoria,
    dataVenda,
    criadoEm: new Date().toISOString()
  };

  vendas.push(novaVenda);
  salvarStorage();
  formVenda.reset();
  percentualDescontoInput.value = 10;
  definirDataAtual();
  atualizarInterface();
}

function removerVenda(id) {
  const confirmou = confirm("Deseja realmente remover esta venda?");
  if (!confirmou) return;

  vendas = vendas.filter(venda => venda.id !== id);
  salvarStorage();
  atualizarInterface();
}

function limparTudo() {
  const confirmou = confirm("Isso apagará todas as vendas cadastradas. Deseja continuar?");
  if (!confirmou) return;

  vendas = [];
  contador = 0;
  salvarStorage();
  atualizarInterface();
}

function popularFiltroCategorias() {
  const categorias = [...new Set(vendas.map(venda => venda.categoria))].sort();
  // Guarda a categoria escolhida: recriar as opções apagava a seleção,
  // e o filtro por categoria nunca era aplicado
  const selecionada = filtroCategoria.value;

  filtroCategoria.replaceChildren(
    new Option("Todas", ""),
    ...categorias.map(categoria => new Option(categoria, categoria))
  );
  filtroCategoria.value = categorias.includes(selecionada) ? selecionada : "";
}

function aplicarFiltros() {
  let resultado = [...vendas];

  const busca = filtroBusca.value.trim().toLowerCase();
  const categoria = filtroCategoria.value;
  const dataInicio = filtroDataInicio.value;
  const dataFim = filtroDataFim.value;
  const valorMin = parseFloat(filtroValorMin.value);
  const valorMax = parseFloat(filtroValorMax.value);
  const tipoOrdenacao = ordenacao.value;

  if (busca) {
    resultado = resultado.filter(venda =>
      venda.vendedor.toLowerCase().includes(busca)
    );
  }

  if (categoria) {
    resultado = resultado.filter(venda => venda.categoria === categoria);
  }

  if (dataInicio) {
    resultado = resultado.filter(venda => venda.dataVenda >= dataInicio);
  }

  if (dataFim) {
    resultado = resultado.filter(venda => venda.dataVenda <= dataFim);
  }

  if (!isNaN(valorMin)) {
    resultado = resultado.filter(venda => venda.valor >= valorMin);
  }

  if (!isNaN(valorMax)) {
    resultado = resultado.filter(venda => venda.valor <= valorMax);
  }

  switch (tipoOrdenacao) {
    case "mais-antigo":
      resultado.sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm));
      break;
    case "maior-valor":
      resultado.sort((a, b) => b.valor - a.valor);
      break;
    case "menor-valor":
      resultado.sort((a, b) => a.valor - b.valor);
      break;
    case "vendedor-az":
      resultado.sort((a, b) => a.vendedor.localeCompare(b.vendedor));
      break;
    case "vendedor-za":
      resultado.sort((a, b) => b.vendedor.localeCompare(a.vendedor));
      break;
    default:
      resultado.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
      break;
  }

  atualizarResumoFiltros(resultado);
  return resultado;
}

function atualizarResumoFiltros(vendasFiltradas) {
  const total = vendasFiltradas.length;
  resumoFiltros.textContent =
    total === 0
      ? "Nenhum registro encontrado com os filtros atuais."
      : `Exibindo ${total} venda(s) de um total de ${vendas.length}.`;
}

function renderizarTabela(vendasFiltradas) {
  tabelaVendas.innerHTML = "";

  if (!vendasFiltradas.length) {
    tabelaVendas.innerHTML = `
      <tr>
        <td colspan="8" class="empty">Nenhuma venda encontrada.</td>
      </tr>
    `;
    return;
  }

  // As células são preenchidas com textContent: o que foi digitado aparece como
  // texto e nunca é interpretado como HTML
  const celula = (conteudo) => {
    const td = document.createElement("td");
    td.append(conteudo);
    return td;
  };

  vendasFiltradas.forEach(venda => {
    const linha = document.createElement("tr");

    const etiqueta = document.createElement("span");
    etiqueta.className = "badge";
    etiqueta.textContent = venda.categoria;

    const botaoRemover = document.createElement("button");
    botaoRemover.className = "btn-remove";
    botaoRemover.type = "button";
    botaoRemover.dataset.id = venda.id;
    botaoRemover.textContent = "Remover";

    linha.append(
      celula(String(venda.id)),
      celula(venda.vendedor),
      celula(etiqueta),
      celula(formatarMoeda(venda.valor)),
      celula(`${formatarMoeda(venda.desconto)} (${venda.descontoPercentual}%)`),
      celula(formatarMoeda(venda.valorFinal)),
      celula(formatarDataExibicao(venda.dataVenda)),
      celula(botaoRemover)
    );

    tabelaVendas.appendChild(linha);
  });
}

// Um único listener para todos os botões "Remover", inclusive os criados depois
tabelaVendas.addEventListener("click", evento => {
  const botao = evento.target.closest(".btn-remove");
  if (botao) removerVenda(Number(botao.dataset.id));
});

function atualizarDashboard(vendasFiltradas) {
  const totalVendas = vendasFiltradas.length;
  const faturamentoBruto = vendasFiltradas.reduce((acc, venda) => acc + venda.valor, 0);
  const totalDescontos = vendasFiltradas.reduce((acc, venda) => acc + venda.desconto, 0);
  const faturamentoLiquido = vendasFiltradas.reduce((acc, venda) => acc + venda.valorFinal, 0);
  const ticketMedio = totalVendas ? faturamentoLiquido / totalVendas : 0;

  const rankingVendedores = {};
  vendasFiltradas.forEach(venda => {
    rankingVendedores[venda.vendedor] = (rankingVendedores[venda.vendedor] || 0) + venda.valorFinal;
  });

  let melhorVendedor = "-";
  let maiorValor = 0;

  for (const vendedor in rankingVendedores) {
    if (rankingVendedores[vendedor] > maiorValor) {
      maiorValor = rankingVendedores[vendedor];
      melhorVendedor = vendedor;
    }
  }

  cardTotalVendas.textContent = totalVendas;
  cardFaturamentoBruto.textContent = formatarMoeda(faturamentoBruto);
  cardDescontos.textContent = formatarMoeda(totalDescontos);
  cardFaturamentoLiquido.textContent = formatarMoeda(faturamentoLiquido);
  cardTicketMedio.textContent = formatarMoeda(ticketMedio);
  cardMelhorVendedor.textContent = melhorVendedor;
}

function gerarDadosGraficoVendedores(vendasFiltradas) {
  const mapa = {};

  vendasFiltradas.forEach(venda => {
    mapa[venda.vendedor] = (mapa[venda.vendedor] || 0) + venda.valorFinal;
  });

  return {
    labels: Object.keys(mapa),
    values: Object.values(mapa)
  };
}

function gerarDadosGraficoCategorias(vendasFiltradas) {
  const mapa = {};

  vendasFiltradas.forEach(venda => {
    mapa[venda.categoria] = (mapa[venda.categoria] || 0) + venda.valorFinal;
  });

  return {
    labels: Object.keys(mapa),
    values: Object.values(mapa)
  };
}

function gerarDadosGraficoEvolucao(vendasFiltradas) {
  const mapa = {};

  vendasFiltradas.forEach(venda => {
    mapa[venda.dataVenda] = (mapa[venda.dataVenda] || 0) + venda.valorFinal;
  });

  const datasOrdenadas = Object.keys(mapa).sort((a, b) => new Date(a) - new Date(b));

  return {
    labels: datasOrdenadas.map(data => formatarDataExibicao(data)),
    values: datasOrdenadas.map(data => mapa[data])
  };
}

function destruirGraficos() {
  if (graficoVendedores) graficoVendedores.destroy();
  if (graficoCategorias) graficoCategorias.destroy();
  if (graficoEvolucao) graficoEvolucao.destroy();
}

function renderizarGraficos(vendasFiltradas) {
  destruirGraficos();

  const dadosVendedores = gerarDadosGraficoVendedores(vendasFiltradas);
  const dadosCategorias = gerarDadosGraficoCategorias(vendasFiltradas);
  const dadosEvolucao = gerarDadosGraficoEvolucao(vendasFiltradas);

  const ctxVendedores = document.getElementById("graficoVendedores");
  const ctxCategorias = document.getElementById("graficoCategorias");
  const ctxEvolucao = document.getElementById("graficoEvolucao");

  graficoVendedores = new Chart(ctxVendedores, {
    type: "bar",
    data: {
      labels: dadosVendedores.labels,
      datasets: [
        {
          label: "Faturamento líquido",
          data: dadosVendedores.values,
          borderWidth: 1,
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });

  graficoCategorias = new Chart(ctxCategorias, {
    type: "doughnut",
    data: {
      labels: dadosCategorias.labels,
      datasets: [
        {
          label: "Categorias",
          data: dadosCategorias.values,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  graficoEvolucao = new Chart(ctxEvolucao, {
    type: "line",
    data: {
      labels: dadosEvolucao.labels,
      datasets: [
        {
          label: "Faturamento líquido",
          data: dadosEvolucao.values,
          tension: 0.3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function limparFiltros() {
  filtroBusca.value = "";
  filtroCategoria.value = "";
  filtroDataInicio.value = "";
  filtroDataFim.value = "";
  filtroValorMin.value = "";
  filtroValorMax.value = "";
  ordenacao.value = "mais-recente";
  atualizarInterface();
}

function atualizarInterface() {
  popularFiltroCategorias();
  const vendasFiltradas = aplicarFiltros();
  renderizarTabela(vendasFiltradas);
  atualizarDashboard(vendasFiltradas);
  renderizarGraficos(vendasFiltradas);
}

formVenda.addEventListener("submit", adicionarVenda);

[
  filtroBusca,
  filtroCategoria,
  filtroDataInicio,
  filtroDataFim,
  filtroValorMin,
  filtroValorMax,
  ordenacao
].forEach(elemento => {
  elemento.addEventListener("input", atualizarInterface);
  elemento.addEventListener("change", atualizarInterface);
});

btnLimparFiltros.addEventListener("click", limparFiltros);
btnLimparTudo.addEventListener("click", limparTudo);

definirDataAtual();
atualizarInterface();