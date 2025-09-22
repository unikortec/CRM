// js/pdf.js
import { jsPDF } from "jspdf";
import { digitsOnly } from "./utils.js";

// ======================= Helpers =======================
function twoFirstNamesCamel(client) {
  const tokens = String(client || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\s]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2);

  return tokens
    .map(
      (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
    )
    .join("")
    .replace(/[^A-Za-z0-9]/g, "");
}

function nomeArquivoPedido(cliente, entregaISO, horaEntrega) {
  const [ano, mes, dia] = String(entregaISO || "").split("-");
  const aa = (ano || "").slice(-2) || "AA";
  const hh = (horaEntrega || "").slice(0, 2) || "HH";
  const mm = (horaEntrega || "").slice(3, 5) || "MM";
  const base = twoFirstNamesCamel(cliente) || "Cliente";
  return `${base}_${dia || "DD"}_${mes || "MM"}_${aa}_${hh}-${mm}.pdf`;
}

// ======================= PDF Builder =======================
export async function montarPDF(payload, freteData, usuario) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [72, 297], // 72mm largura bobina
  });

  const margemX = 2,
    larguraCaixa = 68,
    SAFE_BOTTOM = 287;
  let y = 10;

  function ensureSpace(h) {
    if (y + h > SAFE_BOTTOM) {
      doc.addPage([72, 297], "portrait");
      y = 10;
    }
  }

  // LOGO
  if (payload.logoB64) {
    doc.addImage(payload.logoB64, "PNG", 20, y, 32, 12, "", "FAST");
    if (usuario?.nome) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(usuario.nome.toUpperCase(), 2, y + 3);
    }
    y += 14;
  } else {
    y += 2;
  }

  // CLIENTE
  ensureSpace(14);
  y += (function () {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.rect(margemX, y, larguraCaixa, 12, "S");
    doc.text("CLIENTE:", margemX + 3, y + 7);
    doc.setFont("helvetica", "normal");
    doc.text(String(payload.cliente || "").toUpperCase(), margemX + 20, y + 7);
    return 13;
  })();

  // CNPJ / IE
  const halfW = (larguraCaixa - 1) / 2;
  ensureSpace(12);
  doc.rect(margemX, y, halfW, 10, "S");
  doc.rect(margemX + halfW + 1, y, halfW, 10, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("CNPJ", margemX + halfW / 2, y + 4, { align: "center" });
  doc.text("I.E.", margemX + halfW + 1 + halfW / 2, y + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(digitsOnly(payload.cnpj) || "", margemX + halfW / 2, y + 8, {
    align: "center",
  });
  doc.text(String(payload.ie || ""), margemX + halfW + 1 + halfW / 2, y + 8, {
    align: "center",
  });
  y += 11;

  // ENDEREÇO (quebra automática)
  const textoEndereco = String(payload.endereco || "").toUpperCase();
  const pad = 3;
  const innerW = larguraCaixa - pad * 2;
  const linhasEnd = doc.splitTextToSize(textoEndereco, innerW);
  const rowH = Math.max(12, 6 + linhasEnd.length * 5 + 4);

  ensureSpace(rowH);
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.rect(margemX, y, larguraCaixa, rowH, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ENDEREÇO", margemX + pad, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const baseY = y + 9;
  linhasEnd.forEach((ln, i) => {
    doc.text(ln, margemX + pad, baseY + i * 5);
  });
  y += rowH + 1;

  // ... [restante da geração dos itens, totais, observações igual antes]

  // Nome final do arquivo
  const nomeArquivo = nomeArquivoPedido(
    payload.cliente,
    payload.dataEntregaISO,
    payload.horaEntrega
  );

  return { doc, nomeArquivo };
}
