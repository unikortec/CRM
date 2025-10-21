import { listarClientes } from '../db.js';

export default async function renderClientes(ctx){
  const { tenantId } = ctx;
  const items = await listarClientes(tenantId, 200);

  return /*html*/`
    <section class="panel">
      <h2>Clientes (${items.length})</h2>
      <div class="table">
        <div class="tr head"><div>Nome</div><div>Contato</div><div>Saldo</div><div>Tipo</div><div>Último Pedido</div><div>ID</div></div>
        ${items.map(c=>`
          <div class="tr">
            <div>${c.nome || c.razao || '-'}</div>
            <div>${(c.telefones?.[0] || c.emails?.[0] || '-')}</div>
            <div>${numOrDash(c.saldoDevedor)}</div>
            <div>${c.tipo || '-'}</div>
            <div>${toBRDate(c.ultimoPedidoEm)}</div>
            <div>${c.id}</div>
          </div>`).join('')}
      </div>
    </section>`;
}

function numOrDash(n){ return (typeof n==='number') ? n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '-'; }
function toBRDate(ts){ try{ if (ts?.toDate) return ts.toDate().toLocaleDateString('pt-BR'); if (typeof ts==='string') return new Date(ts).toLocaleDateString('pt-BR'); }catch{} return '-'; }
