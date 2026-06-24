
/* FIX CICLO: COPIAR PRIMEIRO + MARCAR POSTADO FUNCIONANDO */
(function(){
  const MASTER_KEY = "ideal_admin_master_v1";
  const FIX_KEY = "ideal_admin_fix_v1";

  function read(key){
    try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch(e){ return {}; }
  }

  function write(key, data){
    localStorage.setItem(key, JSON.stringify(data));
  }

  function norm(url){
    return String(url || "").trim().replace(/\/$/,"");
  }

  function getState(){
    const master = read(MASTER_KEY);
    const fix = read(FIX_KEY);

    const groups = []
      .concat(Array.isArray(master.groups) ? master.groups : [])
      .concat(Array.isArray(fix.groups) ? fix.groups : []);

    const map = new Map();
    groups.forEach(g=>{
      if(!g.url) return;
      const bairro = g.bairro || g.region || g.regiao || "";
      map.set(norm(g.url), {
        ...g,
        bairro,
        region: bairro,
        status: g.status || "pendente"
      });
    });

    master.groups = Array.from(map.values());
    if(!Array.isArray(master.cycle) && Array.isArray(fix.cycle)) master.cycle = fix.cycle;
    if(master.index === undefined && fix.index !== undefined) master.index = fix.index;
    if(!master.current && fix.current) master.current = fix.current;
    if(!Array.isArray(master.models) && Array.isArray(fix.models)) master.models = fix.models;

    write(MASTER_KEY, master);
    return master;
  }

  function saveState(state){
    write(MASTER_KEY, state);
    const fix = read(FIX_KEY);
    fix.groups = state.groups || [];
    fix.cycle = state.cycle || [];
    fix.index = state.index ?? -1;
    fix.current = state.current || null;
    if(state.models) fix.models = state.models;
    write(FIX_KEY, fix);
  }

  function tracking(group){
    if(!group) return location.origin;
    const src = group.id || group.url || "";
    const bairro = group.bairro || group.region || "";
    return location.origin + "/?src=" + encodeURIComponent(src) + "&bairro=" + encodeURIComponent(bairro);
  }

  function currentGroup(){
    const state = getState();
    if(state.current) return state.current;

    const cycle = Array.isArray(state.cycle) ? state.cycle : [];
    const idx = Number(state.index ?? -1);
    if(idx >= 0 && cycle[idx]) return cycle[idx];

    return null;
  }

  function currentMessage(){
    const state = getState();
    const group = currentGroup();
    const models = Array.isArray(state.models) ? state.models.filter(m => String(m || "").trim()) : [];

    let msg = models.length
      ? models[Math.max(0, Number(state.index || 0)) % models.length]
      : "🏠 Proteja e valorize seu imóvel com quem entende do assunto!\n\n✅ Toldos retráteis e fixos\n✅ Coberturas de policarbonato\n✅ ACM e letreiros\n✅ Instalação profissional\n\n📲 Solicite seu orçamento: {LINK}";

    const link = tracking(group);
    msg = msg.replaceAll("{LINK}", link).replaceAll("[LINK]", link).replaceAll("{{LINK}}", link);

    if(!msg.includes(link)){
      msg += "\n\n📲 Solicite seu orçamento: " + link;
    }

    return msg;
  }

  async function copyMessage(){
    const group = currentGroup();
    if(!group){
      alert("Inicie o ciclo e abra um grupo primeiro.");
      return;
    }
    await navigator.clipboard.writeText(currentMessage()).catch(()=>{});
    alert("Mensagem com link rastreável copiada.");
  }

  function startCycle(){
    const state = getState();
    const bairro = (document.getElementById("cycleBairro")?.value || document.getElementById("dashBairro")?.value || "").trim();
    const limit = Number(document.getElementById("cycleLimit")?.value || 20) || 20;

    const groups = Array.isArray(state.groups) ? state.groups : [];
    const cycle = groups
      .filter(g => !bairro || g.bairro === bairro || g.region === bairro)
      .filter(g => g.status !== "postado")
      .slice(0, limit);

    state.cycle = cycle;
    state.index = cycle.length ? 0 : -1;
    state.current = cycle.length ? cycle[0] : null;

    saveState(state);
    renderCycle();

    alert(`${cycle.length} grupos carregados no ciclo.`);
  }

  function openCurrentGroup(){
    let state = getState();

    if(!state.cycle || !state.cycle.length){
      startCycle();
      state = getState();
    }

    if(!state.current){
      alert("Nenhum grupo no ciclo.");
      return;
    }

    window.open(state.current.url, "_blank");
    renderCycle();
  }

  function nextGroup(){
    let state = getState();

    if(!state.cycle || !state.cycle.length){
      startCycle();
      state = getState();
    }

    if(!state.cycle.length){
      alert("Nenhum grupo disponível.");
      return;
    }

    state.index = Number(state.index ?? 0) + 1;

    if(state.index >= state.cycle.length){
      alert("Fim do ciclo.");
      state.index = state.cycle.length - 1;
      saveState(state);
      return;
    }

    state.current = state.cycle[state.index];
    saveState(state);
    renderCycle();
    window.open(state.current.url, "_blank");
  }

  function markPosted(){
    const state = getState();
    const group = currentGroup();

    if(!group){
      alert("Nenhum grupo selecionado para marcar.");
      return;
    }

    const postedAt = new Date().toISOString();

    state.groups = (state.groups || []).map(g => {
      if(g.id === group.id || norm(g.url) === norm(group.url)){
        return {...g, status:"postado", postedAt};
      }
      return g;
    });

    state.cycle = (state.cycle || []).map(g => {
      if(g.id === group.id || norm(g.url) === norm(group.url)){
        return {...g, status:"postado", postedAt};
      }
      return g;
    });

    state.current = {...group, status:"postado", postedAt};

    saveState(state);
    renderCycle();
    renderDashboardCounts();

    alert("Grupo marcado como postado.");
  }

  function renderCycle(){
    const state = getState();
    const cycle = Array.isArray(state.cycle) ? state.cycle : [];
    const idx = Number(state.index ?? -1);
    const group = currentGroup();

    const currentHtml = group
      ? `<b>${group.name || "Grupo Facebook"}</b><br>
         <small>${group.bairro || ""} · ${group.url}</small><br>
         <small class="track-line">Link de cliques: ${tracking(group)}</small>`
      : "Nenhum grupo no ciclo.";

    ["grupoAtual","currentGroup","dashCurrentGroup","dashGrupoAtual"].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.innerHTML = currentHtml;
    });

    ["mensagemAtual","currentMessage","dashMessage","dashMensagem"].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.value = group ? currentMessage() : "";
    });

    const listHtml = cycle.map((g, i)=>`
      <div class="row data-row ${i === idx ? "active-cycle-fix" : ""}">
        <header><b>${g.name || "Grupo Facebook"}</b><span>${g.status || "pendente"}</span></header>
        <small>${g.bairro || ""} · ${g.url}</small>
        <small class="track-line">Link de cliques: ${tracking(g)}</small>
      </div>
    `).join("");

    ["cycleList","filaCiclo"].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.innerHTML = listHtml || "<p>Nenhum grupo no ciclo.</p>";
    });

    Array.from(document.querySelectorAll("span,strong,b")).forEach(el=>{
      const txt = String(el.textContent || "").trim();
      if(/^\d+\s*\/\s*\d+$/.test(txt)){
        el.textContent = cycle.length ? `${Math.max(0,idx+1)} / ${cycle.length}` : "0 / 0";
      }
    });
  }

  function renderDashboardCounts(){
    const state = getState();
    const today = new Date().toISOString().slice(0,10);
    const posted = (state.groups || []).filter(g => String(g.postedAt || "").slice(0,10) === today).length;
    const bairros = {};
    (state.groups || []).forEach(g => {
      const b = g.bairro || g.region || "";
      if(b) bairros[b] = true;
    });

    [
      ["statGroups", (state.groups || []).length],
      ["statBairros", Object.keys(bairros).length],
      ["statPosted", posted],
      ["todayPosted", posted]
    ].forEach(([id,val])=>{
      const el = document.getElementById(id);
      if(el) el.textContent = val;
    });
  }

  function reorderButtons(){
    const cycle = document.getElementById("ciclo");
    if(!cycle) return;

    const buttons = Array.from(cycle.querySelectorAll("button,a")).filter(btn=>{
      const t = String(btn.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      return t.includes("iniciar ciclo") || t.includes("abrir proximo") || t.includes("copiar mensagem") || t.includes("marcar") || t.includes("zerar ciclo");
    });

    if(!buttons.length) return;

    const actions = buttons[0].parentElement;
    if(!actions || actions.dataset.reorderedFix === "ok") return;

    const find = (term)=>buttons.find(b=>String(b.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").includes(term));
    const start = find("iniciar ciclo");
    const copy = find("copiar mensagem");
    const open = find("abrir proximo");
    const posted = buttons.find(b=>{
      const t = String(b.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      return t.includes("marcar") && t.includes("postado");
    });
    const reset = find("zerar ciclo");

    [start, copy, open, posted, reset].filter(Boolean).forEach(b=>actions.appendChild(b));
    actions.dataset.reorderedFix = "ok";
  }

  function patchButtons(){
    Array.from(document.querySelectorAll("button,a")).forEach(btn=>{
      const t = String(btn.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");

      if(t.includes("iniciar ciclo")){
        btn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); startCycle(); return false; };
      }

      if(t.includes("copiar mensagem")){
        btn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); copyMessage(); return false; };
      }

      if(t.includes("abrir proximo") || t.includes("proximo grupo")){
        btn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); openCurrentGroup(); return false; };
      }

      if(t.includes("marcar") && t.includes("postado")){
        btn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); markPosted(); return false; };
      }

      if(t.includes("zerar ciclo")){
        btn.onclick = function(e){
          e.preventDefault();
          e.stopPropagation();
          const state = getState();
          state.cycle = [];
          state.index = -1;
          state.current = null;
          saveState(state);
          renderCycle();
          return false;
        };
      }
    });
  }

  function boot(){
    patchButtons();
    reorderButtons();
    renderCycle();
    renderDashboardCounts();

    setInterval(()=>{
      patchButtons();
      reorderButtons();
    }, 1000);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.cicloIdealFix = {startCycle, openCurrentGroup, nextGroup, markPosted, copyMessage, renderCycle};
})();
