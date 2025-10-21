// js/db.js – leitura das coleções do app atual
import { db, collection, getDocs, query, where, orderBy, limit } from './firebase.js';

const base = (t)=> `tenants/${t}`; // Firestore SDK v9+ usa caminhos sem barra à esquerda

export const PATHS = {
  clientes:  (t)=> `${base(t)}/clientes`,
  pedidos:   (t)=> `${base(t)}/pedidos`,
  despesas:  (t)=> `${base(t)}/despesas`
};

// ===== LISTAGENS =====
export async function listarClientes(tenantId, max=100){
  const snaps = await getDocs(query(collection(db, PATHS.clientes(tenantId)), limit(max)));
  return snaps.docs.map(d=>({ id:d.id, ...d.data() }));
}

export async function listarPedidosRecentes(tenantId, max=100){
  // indexes do app: (status, dataEntregaISO, createdAt) e (dataEntregaISO, createdAt)
  // aqui priorizamos createdAt desc (cairá em índice simples ou composite existente)
  const col = collection(db, PATHS.pedidos(tenantId));
  const snaps = await getDocs(query(col, orderBy("createdAt","desc"), limit(max)));
  return snaps.docs.map(d=>({ id:d.id, ...d.data() }));
}

export async function listarDespesas(tenantId, max=100){
  const col = collection(db, PATHS.despesas(tenantId));
  const snaps = await getDocs(query(col, orderBy("data","desc"), limit(max)));
  return snaps.docs.map(d=>({ id:d.id, ...d.data() }));
}

// ===== DASHBOARD KPIs (rápidos) =====
export async function kpis(tenantId){
  const [ped, desp] = await Promise.all([
    listarPedidosRecentes(tenantId, 50),
    listarDespesas(tenantId, 50)
  ]);
  const entradas = ped.reduce((s,p)=> s + (Number(p.total)||0), 0);
  const saidas = desp.reduce((s,d)=> s + (Number(d.valor)||0), 0);
  return { saldo: entradas - saidas, entradas, saidas };
}
