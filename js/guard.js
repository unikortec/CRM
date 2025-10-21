// js/guard.js – somente ADMIN/MASTER
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

export async function getClaims(force=false){
  const u = auth.currentUser;
  if (!u) return {};
  const tok = await u.getIdTokenResult(force);
  return tok?.claims || {};
}

export function requireAdmin(onReady){
  onAuthStateChanged(auth, async (user)=>{
    if (!user){ renderLock("Faça login para continuar."); return; }
    try{
      const claims = await getClaims(true);
      const role = claims.role || "";
      const tenantId = claims.tenantId || "unikor";
      if (!(role==="admin" || role==="master")){ renderLock("Sem permissão (somente Admin)."); return; }
      onReady({ user, role, tenantId });
    }catch(e){
      renderLock("Falha ao obter credenciais.");
    }
  });
}

function renderLock(msg){
  const el = document.getElementById("app");
  if (el) el.innerHTML = `<div class="locked">${msg}</div>`;
  // redirecionamento opcional para o portal:
  // location.href = "/portal/index.html";
}
