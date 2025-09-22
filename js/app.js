import { gerarPDF } from './pdf.js';
import { toastOk } from './ui.js';
import { renderItens, adicionarItem } from './itens.js';
import { atualizarFreteUI } from './frete.js';

document.addEventListener('DOMContentLoaded', () => {
  // render inicial dos itens (começa com 1 linha)
  renderItens();

  // botão "Adicionar Item"
  const addBtn = document.getElementById('adicionarItemBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      adicionarItem();
      toastOk('Item adicionado');
    });
  }

  // botões de PDF (usar IDs do HTML)
  const btnGerar = document.getElementById('btnGerarPdf');
  const btnSalvar = document.getElementById('btnSalvarPdf');
  const btnCompartilhar = document.getElementById('btnCompartilharPdf');

  if (btnGerar) btnGerar.addEventListener('click', (ev) => gerarPDF(false, ev.target));
  if (btnSalvar) btnSalvar.addEventListener('click', (ev) => gerarPDF(true, ev.target));
  if (btnCompartilhar) {
    btnCompartilhar.addEventListener('click', async () => {
      if (window.compartilharPDF) await window.compartilharPDF();
      else alert('Função de compartilhar não está disponível.');
    });
  }

  // mostrar/ocultar "pagamentoOutro"
  const selPagto = document.getElementById('pagamento');
  const pagtoOutro = document.getElementById('pagamentoOutro');
  if (selPagto && pagtoOutro) {
    selPagto.addEventListener('change', () => {
      pagtoOutro.style.display = selPagto.value === 'OUTRO' ? '' : 'none';
    });
  }

  // recalcula frete ao marcar isenção manual
  const isentar = document.getElementById('isentarFrete');
  if (isentar) isentar.addEventListener('change', atualizarFreteUI);

  // atualização inicial do frete (se tiver dados)
  atualizarFreteUI();
});
