import { requireAdmin } from './guard.js';
import { doLogout } from './auth.js';
import viewDashboard from './views/dashboard.js';
import viewClientes from './views/clientes.js';
import viewPedidos from './views/pedidos.js';
import viewDespesas from './views/despesas.js';
import viewOFX from './views/ofx.js';

const routes = {
  dashboard: viewDashboard,
  clientes:  viewClientes,
  pedidos:   viewPedidos,
  despesas:  viewDespesas,
  ofx:       viewOFX
};

document.getElementById('logoutBtn')?.addEventListener('click', ()=> doLogout());

function setActive(route){
  document.querySelectorAll('.sidebar a').forEach(a=>{
    a.classList.toggle('active', a.dataset.route === route);
  });
}

function mountNav(){
  document.querySelectorAll('.sidebar a').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const r = a.dataset.route;
      location.hash = r;
    });
  });
}

async function renderFor(ctx){
  const route = (location.hash.replace('#','') || 'dashboard');
  const view = routes[route] || routes.dashboard;
  setActive(route);
  const html = await view(ctx);
  document.getElementById('app').innerHTML = html;
}

function boot(){
  mountNav();
  requireAdmin((ctx)=>{
    renderFor(ctx);
    window.addEventListener('hashchange', ()=> renderFor(ctx));
  });
}

boot();
