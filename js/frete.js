// js/frete.js
export const ABS_FRETE_BASE = "https://serranobre-iota.vercel.app"; // fallback

const freteCtrl = { ultimo: null, sugestao: null };

function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

export async function calcularFrete(enderecoTexto, subtotal){
  if (!enderecoTexto) return { valorBase:0, valorCobravel:0, isento:false, labelIsencao:"", _vazio:true };
  const isentar = !!document.getElementById('isentarFrete')?.checked;
  const payload = { enderecoTexto, totalItens: subtotal, clienteIsento: isentar };

  // tenta local
  try{
    const r = await fetch("/api/calcular-entrega", {
      method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload)
    });
    if(!r.ok) throw new Error("HTTP "+r.status);
    return await r.json();
  }catch(_){}

  // fallback absoluto
  try{
    const r2 = await fetch(`${ABS_FRETE_BASE}/api/calcular-entrega`, {
      method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload)
    });
    if(!r2.ok) throw new Error("HTTP "+r2.status);
    return await r2.json();
  }catch(_){
    return { valorBase:0, valorCobravel:0, isento:false, labelIsencao:"(falha no cálculo)", _err:true };
  }
}

function appendPOA(str){
  const t = String(str||"").trim();
  if (!t) return t;
  if (/porto\s*alegre/i.test(t)) return t;
  const TEM_CIDADE = /,\s*([A-Za-zÀ-ÿ'.\-\s]{2,})(?:\s*-\s*[A-Za-z]{2})?/i;
  if (TEM_CIDADE.test(t)) return t;
  return `${t}, Porto Alegre - RS`;
}

export const atualizarFreteUI = debounce(async function(){
  const out = document.getElementById("freteValor");
  if (!out) return;
  let end = document.getElementById("endereco")?.value?.trim()?.toUpperCase() || "";
  end = appendPOA(end);
  const itens = Array.from(document.querySelectorAll("#itens .item")).map((_,i)=>{
    const tot = document.getElementById(`totalItem_${i}`)?.textContent || "0";
    return parseFloat((tot||"0").replace(",", ".")) || 0;
  });
  const subtotal = itens.reduce((s,v)=>s+(v||0),0);

  const resp = await calcularFrete(end, subtotal);
  freteCtrl.ultimo = resp;
  const isManual = !!document.getElementById('isentarFrete')?.checked;
  const rotulo = isManual ? "(ISENTO manual)" : (resp?.labelIsencao || (resp?._err?"(falha no cálculo)":""));
  out.textContent = resp?.valorBase==null ? "—" : `R$ ${Number(resp.valorBase||0).toFixed(2)} ${rotulo}`;
}, 300);

export function getFreteAtual(){ return freteCtrl.ultimo || { valorBase:0, valorCobravel:0, isento:false }; }
export function setFreteSugestao(v){ freteCtrl.sugestao = v; }
export function getFreteSugestao(){ return freteCtrl.sugestao; }
