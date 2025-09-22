// js/pdf.js — usa jsPDF do CDN via window.jspdf (sem import "jspdf")

import { digitsOnly } from './utils.js';
import { getItens, getSubtotal } from './itens.js';
import { ensureFreteBeforePDF, getFreteAtual } from './frete.js';

const { jsPDF } = window.jspdf; // ✅ pega do script CDN já incluído no index.html

// ---------- Helpers de nome do arquivo ----------
function twoFirstNamesCamel(client) {
  const tokens = String(client || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9\s]+/g, ' ')
    .trim().split(/\s+/).slice(0, 2);
  return tokens
    .map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
    .join('')
    .replace(/[^A-Za-z0-9]/g, '') || 'Cliente';
}
function nomeArquivoPedido(cliente, entregaISO, horaEntrega) {
  const [ano, mes, dia] = String(entregaISO || '').split('-');
  const aa = (ano || '').slice(-2) || 'AA';
  const hh = (horaEntrega || '').slice(0, 2) || 'HH';
  const mm = (horaEntrega || '').slice(3, 5) || 'MM';
  const base = twoFirstNamesCamel(cliente);
  return `${base}_${dia || 'DD'}_${mes || 'MM'}_${aa}_${hh}-${mm}.pdf`;
}

// ---------- Utilidades PDF ----------
function formatarData(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a.slice(-2)}`;
}
function diaDaSemanaExtenso(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase();
}

// ---------- Montagem PDF ----------
export async function montarPDF(querSalvarNoBanco) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [72, 297] });

  const margemX = 2, larguraCaixa = 68, SAFE_BOTTOM = 287;
  let y = 10;
  function ensureSpace(h) {
    if (y + h > SAFE_BOTTOM) { doc.addPage([72, 297], 'portrait'); y = 10; }
  }

  // LOGO (se existir local)
  try {
    const img = new Image();
    img.src = 'Serra-Nobre_3.png';
    await new Promise((res, rej) => { img.onload = res; img.onerror = res; }); // não quebra se 404
    if (img.complete && img.naturalWidth) {
      doc.addImage(img, 'PNG', 20, y, 32, 12, '', 'FAST');
      if (window.__usuario?.nome) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        doc.text(String(window.__usuario.nome).toUpperCase(), 2, y + 3);
      }
      y += 14;
    } else { y += 2; }
  } catch { y += 2; }

  // Campos do formulário
  const cliente = document.getElementById('cliente').value.trim().toUpperCase();
  const endereco = document.getElementById('endereco').value.trim().toUpperCase();
  const entregaISO = document.getElementById('entrega').value;
  const hora = document.getElementById('horaEntrega').value;
  const cnpj = digitsOnly(document.getElementById('cnpj').value);
  const ie = (document.getElementById('ie').value || '').toUpperCase();
  const cep = digitsOnly(document.getElementById('cep').value);
  const contato = digitsOnly(document.getElementById('contato').value);
  const pagamento = document.getElementById('pagamento').value;
  const obsG = (document.getElementById('obsGeral').value || '').trim().toUpperCase();
  const tipoEnt = document.querySelector('input[name="tipoEntrega"]:checked')?.value || 'ENTREGA';

  // CLIENTE
  ensureSpace(14);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.rect(margemX, y, larguraCaixa, 12, 'S');
  doc.text('CLIENTE:', margemX + 3, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(cliente, margemX + 20, y + 7);
  y += 13;

  // CNPJ / I.E.
  const gap1 = 1;
  const halfW = (larguraCaixa - gap1) / 2;
  ensureSpace(12);
  doc.rect(margemX, y, halfW, 10, 'S');
  doc.rect(margemX + halfW + gap1, y, halfW, 10, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  doc.text('CNPJ', margemX + halfW / 2, y + 4, { align: 'center' });
  doc.text('I.E.', margemX + halfW + gap1 + halfW / 2, y + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(cnpj, margemX + halfW / 2, y + 8, { align: 'center' });
  doc.text(ie, margemX + halfW + gap1 + halfW / 2, y + 8, { align: 'center' });
  y += 11;

  // ENDEREÇO (quebra automática dentro da borda) ✅
  const pad = 3;
  const innerW = larguraCaixa - pad * 2;
  const linhasEnd = doc.splitTextToSize(endereco, innerW);
  const rowH = Math.max(12, 6 + linhasEnd.length * 5 + 4);
  ensureSpace(rowH);
  doc.setDrawColor(0); doc.setLineWidth(0.2);
  doc.rect(margemX, y, larguraCaixa, rowH, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('ENDEREÇO', margemX + pad, y + 5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  const baseY = y + 9;
  linhasEnd.forEach((ln, i) => doc.text(ln, margemX + pad, baseY + i * 5));
  y += rowH + 1;

  // CONTATO / CEP
  ensureSpace(12);
  doc.rect(margemX, y, halfW, 10, 'S');
  doc.rect(margemX + halfW + gap1, y, halfW, 10, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  doc.text('CONTATO', margemX + halfW / 2, y + 4, { align: 'center' });
  doc.text('CEP', margemX + halfW + gap1 + halfW / 2, y + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(contato, margemX + halfW / 2, y + 8, { align: 'center' });
  doc.text(cep, margemX + halfW + gap1 + halfW / 2, y + 8, { align: 'center' });
  y += 11;

  // DIA / DATA / HORA
  ensureSpace(12);
  doc.rect(margemX, y, larguraCaixa, 10, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('DIA DA SEMANA:', margemX + 3, y + 6);
  doc.text(diaDaSemanaExtenso(entregaISO), margemX + larguraCaixa / 2 + 12, y + 6, { align: 'center' });
  y += 11;

  const halfW2 = (larguraCaixa - 1) / 2;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  doc.rect(margemX, y, halfW2, 10, 'S');
  doc.rect(margemX + halfW2 + 1, y, halfW2, 10, 'S');
  doc.text('DATA ENTREGA', margemX + halfW2 / 2, y + 4, { align: 'center' });
  doc.text('HORÁRIO ENTREGA', margemX + halfW2 + 1 + halfW2 / 2, y + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(formatarData(entregaISO), margemX + halfW2 / 2, y + 8, { align: 'center' });
  doc.text(hora, margemX + halfW2 + 1 + halfW2 / 2, y + 8, { align: 'center' });
  y += 12;

  // ===== ITENS =====
  const W_PROD = 23.5, W_QDE = 13, W_UNIT = 13, W_TOTAL = 18.5;
  ensureSpace(14);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  doc.rect(margemX, y, W_PROD, 10, 'S');
  doc.rect(margemX + W_PROD, y, W_QDE, 10, 'S');
  doc.rect(margemX + W_PROD + W_QDE, y, W_UNIT, 10, 'S');
  doc.rect(margemX + W_PROD + W_QDE + W_UNIT, y, W_TOTAL, 10, 'S');
  doc.text('PRODUTO', margemX + W_PROD / 2, y + 6, { align: 'center' });
  doc.text('QDE', margemX + W_PROD + W_QDE / 2, y + 6, { align: 'center' });
  doc.text('R$ UNIT.', margemX + W_PROD + W_QDE + W_UNIT / 2, y + 6, { align: 'center' });
  const valorX = margemX + W_PROD + W_QDE + W_UNIT + W_TOTAL / 2;
  doc.text('VALOR', valorX, y + 4, { align: 'center' });
  doc.text('PRODUTO', valorX, y + 8.5, { align: 'center' });
  y += 12;

  let subtotal = 0;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  const itens = getItens();

  for (let i = 0; i < itens.length; i++) {
    const it = itens[i];
    const prod = it.produto || '';
    const qtdStr = (it.quantidade || 0).toString();
    const tipo = it.tipo || 'KG';
    const precoNum = parseFloat(it.preco) || 0;
    const pesoTotalKg = it._pesoTotalKg || 0;
    const totalNum = it.total || (precoNum * (tipo === 'UN' ? pesoTotalKg : (it.quantidade || 0)));

    const prodLines = doc.splitTextToSize(prod, W_PROD - 2).slice(0, 3);
    const rowHItem = Math.max(14, 6 + prodLines.length * 5);
    ensureSpace(rowHItem + (pesoTotalKg ? 6 : 0));

    doc.rect(margemX, y, W_PROD, rowHItem, 'S');
    doc.rect(margemX + W_PROD, y, W_QDE, rowHItem, 'S');
    doc.rect(margemX + W_PROD + W_QDE, y, W_UNIT, rowHItem, 'S');
    doc.rect(margemX + W_PROD + W_QDE + W_UNIT, y, W_TOTAL, rowHItem, 'S');

    const center = (cx, lines) => {
      const block = (lines.length - 1) * 5;
      const base = y + (rowHItem - block) / 2;
      lines.forEach((ln, k) => doc.text(ln, cx, base + k * 5, { align: 'center' }));
    };
    center(margemX + W_PROD / 2, prodLines);
    center(margemX + W_PROD + W_QDE / 2, qtdStr ? [qtdStr, tipo] : ['']);
    if (tipo === 'UN' && pesoTotalKg) {
      center(margemX + W_PROD + W_QDE + W_UNIT / 2,
        precoNum ? ['R$/KG', precoNum.toFixed(2).replace('.', ',')] : ['—']);
    } else {
      center(margemX + W_PROD + W_QDE + W_UNIT / 2,
        precoNum ? ['R$', precoNum.toFixed(2).replace('.', ',')] : ['—']);
    }
    center(margemX + W_PROD + W_QDE + W_UNIT + W_TOTAL / 2,
      (precoNum && (it.quantidade || pesoTotalKg)) ? ['R$', totalNum.toFixed(2).replace('.', ',')] : ['—']);

    y += rowHItem;

    if (tipo === 'UN' && pesoTotalKg) {
      doc.setFontSize(7); doc.setFont('helvetica', 'italic');
      doc.text(`(*) Peso total: ${pesoTotalKg.toFixed(3)} kg`, margemX + 3, y + 4);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      y += 5;
    }

    const obs = (it.obs || '').trim();
    if (obs) {
      const corpoLines = doc.splitTextToSize(obs.toUpperCase(), larguraCaixa - 6);
      const obsH = 9 + corpoLines.length * 5;
      ensureSpace(obsH);
      doc.rect(margemX, y, larguraCaixa, obsH, 'S');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      const titulo = 'OBSERVAÇÕES:', tx = margemX + 3, ty = y + 6;
      doc.text(titulo, tx, ty); doc.line(tx, ty + 0.8, tx + doc.getTextWidth(titulo), ty + 0.8);
      doc.setFont('helvetica', 'normal');
      let baseY2 = y + 12; corpoLines.forEach((ln, ix) => doc.text(ln, margemX + 3, baseY2 + ix * 5));
      y += obsH;
    }

    subtotal += totalNum;
    if (i < itens.length - 1) y += 2;
  }

  // SOMA PRODUTOS
  const w2tercos = Math.round(larguraCaixa * (2 / 3));
  const somaX = margemX + larguraCaixa - w2tercos;
  ensureSpace(11);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  doc.rect(somaX, y, w2tercos, 10, 'S');
  doc.text('SOMA PRODUTOS: R$ ' + subtotal.toFixed(2), somaX + 3, y + 6);
  y += 12;

  // ENTREGA/RETIRADA + FRETE
  await ensureFreteBeforePDF(); // calcula frete antes de imprimir
  const frete = getFreteAtual(); // {valorBase, valorCobravel, isento, ...}
  const gap2 = 2;
  const entregaW = Math.round(larguraCaixa * (2 / 3));
  const freteW = larguraCaixa - entregaW - gap2;

  ensureSpace(12);
  doc.setLineWidth(1.1);
  doc.rect(margemX, y, entregaW, 10, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(tipoEnt, margemX + entregaW / 2, y + 6.5, { align: 'center' });

  const freteX = margemX + entregaW + gap2;
  doc.rect(freteX, y, freteW, 10, 'S');
  doc.text('FRETE', freteX + freteW / 2, y + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  const isIsentoManual = !!document.getElementById('isentarFrete')?.checked;
  const fretePreview = (isIsentoManual || frete?.isento) ? 'ISENTO' : ('R$ ' + Number(frete?.valorBase || 0).toFixed(2));
  doc.text(fretePreview, freteX + freteW / 2, y + 8.2, { align: 'center' });
  doc.setLineWidth(0.2);
  y += 12;

  // TOTAL DO PEDIDO
  const freteCobravelParaTotal = (isIsentoManual ? 0 : Number(frete?.valorCobravel || 0));
  const totalGeral = subtotal + freteCobravelParaTotal;

  ensureSpace(11);
  const rowHtotal = 10;
  doc.rect(margemX, y, larguraCaixa, rowHtotal, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('TOTAL DO PEDIDO:', margemX + 3, y + rowHtotal / 2 + 0.5);
  doc.text('R$ ' + totalGeral.toFixed(2), margemX + larguraCaixa - 3, y + rowHtotal / 2 + 0.5, { align: 'right' });
  y += rowHtotal + 2;

  if (obsG) {
    const corpoLines = doc.splitTextToSize(obsG.toUpperCase(), larguraCaixa - 6);
    const h = 9 + corpoLines.length * 5;
    ensureSpace(h + 2);
    doc.rect(margemX, y, larguraCaixa, h, 'S');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    const titulo = 'OBSERVAÇÃO DO PEDIDO:', tx = margemX + 3, ty = y + 6;
    doc.text(titulo, tx, ty); doc.line(tx, ty + 0.8, tx + doc.getTextWidth(titulo), ty + 0.8);
    doc.setFont('helvetica', 'normal');
    let baseY = y + 12; corpoLines.forEach((ln, ix) => doc.text(ln, margemX + 3, baseY + ix * 5));
    y += h + 3;
  }

  // Nome final do arquivo (sem “Pedido_”, com hora de entrega) ✅
  const nomeArquivo = nomeArquivoPedido(cliente, entregaISO, hora);

  return { doc, nomeArquivo };
}

// ---------- Ações públicas ----------
export async function gerarPDF(apenasSalvar = false, btnRef) {
  if (!window.__usuario) { alert('Faça login para continuar.'); return; }

  if (window.__busy) return;
  window.__busy = true;

  try {
    if (btnRef) { btnRef.disabled = true; btnRef.textContent = apenasSalvar ? 'Salvando...' : 'Gerando...'; }

    // valida mínimos: cliente, endereço, data/hora e 1 item com quantidade e preço
    const okCampos = document.getElementById('cliente').value.trim()
      && document.getElementById('endereco').value.trim()
      && document.getElementById('entrega').value
      && document.getElementById('horaEntrega').value
      && getItens().some(i => (i.quantidade > 0) && (i.preco > 0));
    if (!okCampos) { alert('Preencha Cliente, Endereço, Data, Horário e ao menos 1 item com quantidade e preço.'); return; }

    const { doc, nomeArquivo } = await montarPDF(apenasSalvar /* salva no banco fica a teu critério */);
    if (apenasSalvar) {
      doc.save(nomeArquivo);
    } else {
      const url = doc.output('bloburl');
      const win = window.open(url, '_blank');
      if (!win) doc.save(nomeArquivo);
    }
  } finally {
    if (btnRef) { btnRef.disabled = false; btnRef.textContent = apenasSalvar ? 'Salvar PDF' : 'Gerar PDF'; }
    window.__busy = false;
  }
}

// (opcional) compartilhar via Web Share API
window.compartilharPDF = async function () {
  const { doc, nomeArquivo } = await montarPDF(true);
  const blob = await doc.output('blob');
  if (navigator.canShare && window.File) {
    const file = new File([blob], nomeArquivo, { type: 'application/pdf' });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Pedido Serra Nobre', text: 'Segue pedido em PDF' });
      return;
    }
  }
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 15000);
};
