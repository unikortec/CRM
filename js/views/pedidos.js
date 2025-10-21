import { listarPedidosRecentes } from '../db.js';

export default async function renderPedidos(ctx){
  const { tenantId } = ctx;
  const items = await listarPedidosRecentes(tenantId, 200);

  return /*html*/`
    <section class="panel">
      <h2>Pedidos (${items.length})</h2>
      <div class="table">
        <div class="tr head"><div>Data</div><div>Cliente</div><div>Total</div><div>Status</div><div>Entrega</div><div>ID</div></div>
        ${items.map(p=>`
          <div class="tr">
            <div>${toBRDate(p.createdAt)}</div>
            <div>${p.clienteNome || p.clienteId || '-'}</div>
            <div class="${(p.total||0)>=0?'pos':'neg'}">${fmtBRL(p.total||0)}</div>
            <div>${p.status || '-'}</div>
            <div>${p.dataEntregaISO || '-'}</div>
            <div>${p.id}</div>
          </div>`).join('')}
      </div>
    </section>`;
}

function toBRDate(ts){ try{ if (ts?.toDate) return ts.toDate().toLocaleDateString('pt-BR'); if (typeof ts==='string') return new Date(ts).toLocaleDateString('pt-BR'); }catch{} return '-'; }
function fmtBRL(n){ return (n||0).toLocaleString('pt-BR',{ style:'currency', currency:'BRL' }); }
