// js/itens.js
import { atualizarFreteUI } from './frete.js';
import { buscarUltimoPreco, produtosDoCliente } from './clientes.js';

// estado base
let itens = [
  { produto: '', tipo: 'KG', quantidade: 0, preco: 0, total: 0, obs: '', _pesoTotalKg: 0 }
];

// util: normaliza só números
const digitsOnly = (v) => String(v || '').replace(/\D/g, '');

// tenta extrair peso do nome do produto: "Picanha 1.2kg", "Linguiça 800g", etc.
function parsePesoFromProduto(nome) {
  const s = String(nome || '').toLowerCase().replace(',', '.');
  const re = /(\d+(?:\.\d+)?)[\s]*(kg|quilo|quilos|g|gr|grama|gramas)\b/g;
  let m, last = null;
  while ((m = re.exec(s)) !== null) last = m;
  if (!last) return null;
  const val = parseFloat(last[1]);
  const unit = last[2];
  if (!isFinite(val) || val <= 0) return null;
  if (unit === 'kg' || unit.startsWith('quilo')) return val;
  return val / 1000; // g → kg
}

// calcula total considerando caso especial de UN com peso embutido no nome
function calcTotalComPesoSeAplicavel({ produto, tipo, quantidade, preco }) {
  const q = parseFloat(quantidade) || 0;
  const p = parseFloat(preco) || 0;
  if (tipo === 'UN') {
    const kgUn = parsePesoFromProduto(produto);
    if (kgUn) {
      const pesoTotalKg = q * kgUn;
      const total = pesoTotalKg * p;
      return { total, pesoTotalKg };
    }
  }
  return { total: q * p, pesoTotalKg: 0 };
}

export function getItens() {
  return itens.map(i => ({ ...i }));
}

export function getSubtotal() {
  return Number(itens.reduce((s, i) => s + Number(i.total || 0), 0).toFixed(2));
}

// salva valores que o usuário já digitou, antes de re-renderizar
function salvarCamposAntesRender() {
  document.querySelectorAll('.item').forEach((el, idx) => {
    if (typeof itens[idx] === 'undefined') return;
    const prod = el.querySelector('.produto')?.value || '';
    const tipo = el.querySelector('.tipo-select')?.value || 'KG';
    const qtd = el.querySelector('.quantidade')?.value || 0;
    const preco = el.querySelector('.preco')?.value || 0;
    const obs = el.querySelector('.obsItem')?.value || '';
    const { total, pesoTotalKg } = calcTotalComPesoSeAplicavel({ produto: prod, tipo, quantidade: qtd, preco });
    itens[idx] = {
      produto: prod,
      tipo,
      quantidade: parseFloat(qtd) || 0,
      preco: parseFloat(preco) || 0,
      obs,
      total: Number(total || 0),
      _pesoTotalKg: pesoTotalKg || 0
    };
  });
  // expõe globalmente se outro módulo usar
  window.itens = itens;
}

function criarSelectProduto(i) {
  return `
    <input list="listaProdutos" class="produto" data-index="${i}"
      placeholder="Digite ou selecione" value="${itens[i].produto || ''}" />
  `;
}

function criarTipoSelect(i) {
  const isKG = itens[i].tipo === 'KG';
  return `
    <select class="tipo-select" data-index="${i}">
      <option value="KG" ${isKG ? 'selected' : ''}>KG</option>
      <option value="UN" ${!isKG ? 'selected' : ''}>UN</option>
    </select>
  `;
}

function linhaItemHTML(i) {
  const item = itens[i] || {};
  const totalFmt = Number(item.total || 0).toFixed(2);
  return `
    <div class="item" data-i="${i}">
      <label>Produto:</label>
      ${criarSelectProduto(i)}

      <label>Tipo:</label>
      ${criarTipoSelect(i)}

      <label>Quantidade:</label>
      <input type="number" step="0.01" class="quantidade" data-index="${i}" value="${item.quantidade || ''}" />

      <label>Preço Unitário:</label>
      <input type="number" step="0.01" class="preco" data-index="${i}" value="${item.preco || ''}" />

      <div class="peso-info" id="pesoInfo_${i}"></div>

      <label>Observação do item:</label>
      <textarea class="obsItem" data-index="${i}">${item.obs || ''}</textarea>

      <p class="total">Total do Item: R$ <span id="totalItem_${i}">${totalFmt}</span></p>

      <button class="remove" data-action="remover" data-index="${i}">Remover Item</button>
    </div>
  `;
}

function bindEventosLinha(container) {
  // change de produto → tenta preencher último preço se preço vazio
  container.querySelectorAll('.produto').forEach((inp) => {
    inp.addEventListener('blur', async (ev) => {
      const i = Number(ev.target.dataset.index);
      await preencherUltimoPreco(i);
      calcularItem(i);
      atualizarFreteUI();
      // atualiza datalist com sugestões do cliente atual
      carregarSugestoesProdutosDoCliente().catch(()=>{});
    });
  });

  // change de tipo
  container.querySelectorAll('.tipo-select').forEach((sel) => {
    sel.addEventListener('change', (ev) => {
      const i = Number(ev.target.dataset.index);
      itens[i].tipo = ev.target.value;
      calcularItem(i);
      atualizarFreteUI();
    });
  });

  // quantidade / preço
  container.querySelectorAll('.quantidade, .preco').forEach((inp) => {
    inp.addEventListener('input', (ev) => {
      const i = Number(ev.target.dataset.index);
      calcularItem(i);
      atualizarFreteUI();
    });
  });

  // observação
  container.querySelectorAll('.obsItem').forEach((ta) => {
    ta.addEventListener('input', salvarCamposAntesRender);
  });

  // remover
  container.querySelectorAll('button[data-action="remover"]').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      const i = Number(ev.currentTarget.dataset.index);
      removerItem(i);
      atualizarFreteUI();
    });
  });
}

export function renderItens() {
  salvarCamposAntesRender();
  const host = document.getElementById('itens');
  if (!host) return;

  host.innerHTML = itens.map((_, i) => linhaItemHTML(i)).join('');

  // garante existência do datalist
  if (!document.getElementById('listaProdutos')) {
    const dl = document.createElement('datalist');
    dl.id = 'listaProdutos';
    document.body.appendChild(dl);
  }

  bindEventosLinha(host);
}

export function adicionarItem() {
  salvarCamposAntesRender();
  itens.push({ produto: '', tipo: 'KG', quantidade: 0, preco: 0, total: 0, obs: '', _pesoTotalKg: 0 });
  renderItens();
}

export function removerItem(i) {
  salvarCamposAntesRender();
  itens.splice(i, 1);
  if (!itens.length) itens.push({ produto: '', tipo: 'KG', quantidade: 0, preco: 0, total: 0, obs: '', _pesoTotalKg: 0 });
  renderItens();
}

// cálculo da linha + atualização visual
export function calcularItem(i) {
  const container = document.querySelector(`.item[data-i="${i}"]`);
  if (!container) return;

  const prod = container.querySelector('.produto')?.value || '';
  const tipo = container.querySelector('.tipo-select')?.value || 'KG';
  const q = container.querySelector('.quantidade')?.value || 0;
  const p = container.querySelector('.preco')?.value || 0;

  const { total, pesoTotalKg } = calcTotalComPesoSeAplicavel({ produto: prod, tipo, quantidade: q, preco: p });

  itens[i].produto = prod;
  itens[i].tipo = tipo;
  itens[i].quantidade = parseFloat(q) || 0;
  itens[i].preco = parseFloat(p) || 0;
  itens[i].total = Number(total || 0);
  itens[i]._pesoTotalKg = pesoTotalKg || 0;

  const tgt = container.querySelector(`#totalItem_${i}`);
  if (tgt) tgt.textContent = itens[i].total ? itens[i].total.toFixed(2) : '—';

  const pi = container.querySelector(`#pesoInfo_${i}`);
  if (pi) {
    if (tipo === 'UN' && (pesoTotalKg || 0) > 0) {
      pi.textContent = `Peso total estimado: ${pesoTotalKg.toFixed(3)} kg (preço por kg)`;
    } else {
      pi.textContent = '';
    }
  }
}

// tenta preencher preço com o último preço do cliente para o produto
export async function preencherUltimoPreco(i) {
  try {
    const nomeCli = (document.getElementById('cliente')?.value || '').trim().toUpperCase();
    if (!nomeCli) return;

    const container = document.querySelector(`.item[data-i="${i}"]`);
    const prodEl = container?.querySelector('.produto');
    const precoEl = container?.querySelector('.preco');
    if (!prodEl || !precoEl) return;

    const produto = (prodEl.value || '').trim();
    if (!produto) return;

    const jaTemPreco = parseFloat(precoEl.value);
    if (isFinite(jaTemPreco) && jaTemPreco > 0) return;

    const ult = await buscarUltimoPreco(nomeCli, produto);
    if (ult && isFinite(ult) && (!precoEl.value || Number(precoEl.value) === 0)) {
      precoEl.value = Number(ult).toFixed(2);
      calcularItem(i);
    }
  } catch {}
}

// popula datalist com produtos do cliente (histórico)
export async function carregarSugestoesProdutosDoCliente() {
  try {
    const nome = (document.getElementById('cliente')?.value || '').trim().toUpperCase();
    if (!nome) return;
    const listaProdutos = document.getElementById('listaProdutos');
    if (!listaProdutos) return;
    const nomes = await produtosDoCliente(nome);
    listaProdutos.innerHTML = nomes.map((p) => `<option value="${p}"></option>`).join('');
  } catch {}
}

// expõe para outros módulos que referenciam window.*
window.renderItens = renderItens;
window.adicionarItem = adicionarItem;
window.removerItem = removerItem;
window.calcularItem = calcularItem;
window.getItens = getItens;
window.getSubtotal = getSubtotal;
window.preencherUltimoPreco = preencherUltimoPreco;
window.carregarSugestoesProdutosDoCliente = carregarSugestoesProdutosDoCliente;
