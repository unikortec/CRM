import { kpis, listarPedidosRecentes } from '../db.js';

export default async function renderDashboard(ctx){
  const { tenantId } = ctx;
  const { saldo, entradas, saidas } = await kpis(tenantId);
  const ultimos = await listarPedidosRecentes(tenantId, 8);

  return /*html*/`
    <section class="panel">
      <h2>Dashboard</h2>
      <div class="hrow">
        <div class="card kpi"><div>Saldo</div><div class="big">${fmtBRL(saldo)}</div></div>
        <div class="card kpi"><div>Entradas (Mês)</div><div class="big pos">${fmtBRL(entradas)}</div></div>
        <div class="card kpi"><div>Saídas (Mês)</div><div class="big neg">${fmtBRL(saidas)}</div></div>
        <div class="card kpi"><div>Pedidos (Últimos)</div><div class="big">${ultimos.length}</div></div>
      </div>
    </section>

    <section class="panel">
      <h3>Últimas Transações (Pedidos)</h3>
      <div class="table">
        <div class="tr head"><div>Data</div><div>Cliente</div><div>Total</div><div>Status</div><div>Entrega</div><div>Doc</div></div>
        ${ultimos.map(p=>`
          <div class="tr">
            <div>${toBRDate(p.createdAt)}</div>
            <div>${p.clienteNome || p.clienteId || '-'}</div>
            <div class="pos">${fmtBRL(p.total||0)}</div>
            <div>${p.status || '-'}</div>
            <div>${p.dataEntregaISO || '-'}</div>
            <div>${p.__name__ || p.id}</div>
          </div>`).join('')}
      </div>
    </section>
  `;
}

function toBRDate(ts){
  try{
    if (ts?.toDate) return ts.toDate().toLocaleDateString('pt-BR');
    if (typeof ts === 'string') return new Date(ts).toLocaleDateString('pt-BR');
  }catch{}
  return '-';
}
function fmtBRL(n){
  return (n||0).toLocaleString('pt-BR',{ style:'currency', currency:'BRL' });
}
