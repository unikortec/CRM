import { listarDespesas } from '../db.js';

export default async function renderDespesas(ctx){
  const { tenantId } = ctx;
  const items = await listarDespesas(tenantId, 200);

  return /*html*/`
    <section class="panel">
      <h2>Despesas (${items.length})</h2>
      <div class="table">
        <div class="tr head"><div>Data</div><div>Descrição</div><div>Valor</div><div>Categoria</div><div>Conta</div><div>ID</div></div>
        ${items.map(d=>`
          <div class="tr">
            <div>${toBRDate(d.data)}</div>
            <div>${d.descricao || '-'}</div>
            <div class="neg">${fmtBRL(d.valor||0)}</div>
            <div>${d.categoria || '-'}</div>
            <div>${d.conta || d.contaId || '-'}</div>
            <div>${d.id}</div>
          </div>`).join('')}
      </div>
    </section>`;
}

function toBRDate(ts){ try{ if (ts?.toDate) return ts.toDate().toLocaleDateString('pt-BR'); if (typeof ts==='string') return new Date(ts).toLocaleDateString('pt-BR'); }catch{} return '-'; }
function fmtBRL(n){ return (n||0).toLocaleString('pt-BR',{ style:'currency', currency:'BRL' }); }
