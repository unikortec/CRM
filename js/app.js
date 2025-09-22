// js/app.js
import { initItens, adicionarItem, atualizarFreteAoEditarItem } from './itens.js';
import { atualizarFreteUI } from './frete.js';
import { gerarPDF } from './pdf.js';

// UI: mostra/oculta campo "pagamentoOutro"
function wirePagamentoOutro(){
  const sel = document.getElementById('pagamento');
  const outro = document.getElementById('pagamentoOutro');
  if (!sel || !outro) return;
  const sync = () => { outro.style.display = (sel.value === 'OUTRO') ? '' : 'none'; };
  sel.addEventListener('change', sync);
  sync();
}

// Banner offline
function updateOfflineBanner(){
  const el = document.getElementById('offlineBanner');
  if (!el) return;
  el.style.display = navigator.onLine ? 'none' : 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  // Render inicial dos itens e listeners internos
  initItens();

  // botão adicionar item
  const addBtn = document.getElementById('adicionarItemBtn');
  if (addBtn){
    addBtn.addEventListener('click', () => {
      adicionarItem();
      atualizarFreteUI();
    });
  }

  // eventos que impactam o frete
  const end = document.getElementById('endereco');
  const chkIsentar = document.getElementById('isentarFrete');
  end && end.addEventListener('blur', atualizarFreteUI);
  chkIsentar && chkIsentar.addEventListener('change', atualizarFreteUI);

  // Quando qualquer item muda (qtd/preço/produto), recalcular frete
  atualizarFreteAoEditarItem(() => atualizarFreteUI());

  // pagamento outro
  wirePagamentoOutro();

  // Botões PDF
  const g = document.getElementById('btnGerarPdf');
  const s = document.getElementById('btnSalvarPdf');
  const c = document.getElementById('btnCompartilharPdf');
  g && g.addEventListener('click', (ev) => gerarPDF(false, ev.target));
  s && s.addEventListener('click', (ev) => gerarPDF(true,  ev.target));
  c && c.addEventListener('click', async () => gerarPDF('share'));

  // offline banner
  updateOfflineBanner();
  window.addEventListener('online', updateOfflineBanner);
  window.addEventListener('offline', updateOfflineBanner);
});
