
/* CICLO DEFINITIVO - Ideal Toldos
   1. Iniciar ciclo filtra pelo bairro escolhido.
   2. Copiar mensagem usa o grupo atual e link rastreável.
   3. Abrir grupo abre o grupo atual, não pula.
   4. Marcar postado grava e avança para o próximo grupo.
*/
(function(){
  const KEYS = ["ideal_admin_master_v1", "ideal_admin_fix_v1"];

  function read(key){
    try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch(e){ return {}; }
  }

  function write(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  function clean(s){
    return String(s || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9\s]/g," ")
      .replace(/\s+/g," ")
      .trim();
  }

  function normUrl(url){
    return String(url || "").trim().replace(/\/$/,"");
  }

  function mergeState(){
    const a = read(KEYS[0]);
    const b = read(KEYS[1]);

    const allGroups = []
      .concat(Array.isArray(a.groups) ? a.groups : [])
      .concat(Array.isArray(b.groups) ? b.groups : []);

    const map = new Map();
    allGroups.forEach(g => {
      const url = normUrl(g.url || g.link || "");
      if(!url) return;
      const bairro = g.bairro || g.region || g.regiao || g.area || "";
      map.set(url, {
        ...g,
        id: g.id || ("g_" + Math.random().toString(36).slice(2)),
        url,
        name: g.name || g.nome || "Grupo Facebook",
        bairro,
        region: bairro,
        status: g.status || "pendente",
        postedAt: g.postedAt || null
      });
    });

    const state = {
      ...a,
      groups: Array.from(map.values()),
      models: Array.isArray(a.models) ? a.models : (Array.isArray(b.models) ? b.models : []),
      bairros: Array.isArray(a.bairros) ? a.bairros : (Array.isArray(b.bairros) ? b.bairros : []),
      cycle: Array.isArray(a.cycle) ? a.cycle : [],
      index: Number.isFinite(Number(a.index)) ? Number(a.index) : -1,
      current: a.current || null
    };

    saveState(state);
    return state;
  }

  function saveState(state){
    KEYS.forEach(key => {
      const old = read(key);
      write(key, {
        ...old,
        groups: state.groups || [],
        models: state.models || old.models || [],
        bairros: state.bairros || old.bairros || [],
        cycle: state.cycle || [],
        index: state.index ?? -1,
        current: state.current || null
      });
    });
  }

  function selectedBairro(){
    const ciclo = document.getElementById("ciclo");
    const selects = [];

    ["cycleBairro","dashBairro"].forEach(id => {
      const el = document.getElementById(id);
      if(el) selects.push(el);
    });

    if(ciclo){
      ciclo.querySelectorAll("select").forEach(s => selects.push(s));
    }

    for(const s of selects){
      const v = String(s.value || "").trim();
      const c = clean(v);
      if(v && c !== "todos os bairros" && c !== "todos" && c !== "selecione o bairro" && c !== "selecionar bairro"){
        return v;
      }
    }
    return "";
  }

  function tracking(g){
    if(!g) return location.origin;
    return location.origin + "/?src=" + encodeURIComponent(g.id || g.url) + "&bairro=" + encodeURIComponent(g.bairro || g.region || "");
  }

  function getCurrent(state){
    if(state.current) return state.current;
    if(Array.isArray(state.cycle) && state.index >= 0 && state.cycle[state.index]){
      return state.cycle[state.index];
    }
    return null;
  }

  function buildMessage(state){
    const g = getCurrent(state);
    const models = Array.isArray(state.models) ? state.models.filter(m => String(m || "").trim()) : [];
    let msg = models.length
      ? models[Math.max(0, state.index || 0) % models.length]
      : "🏠 Proteja e valorize seu imóvel com quem entende do assunto!\n\n✅ Toldos retráteis e fixos\n✅ Coberturas de policarbonato\n✅ ACM e letreiros\n✅ Instalação profissional\n\n📲 Solicite seu orçamento: {LINK}";

    const link = tracking(g);
    msg = msg.replaceAll("{LINK}", link).replaceAll("[LINK]", link).replaceAll("{{LINK}}", link);

    if(!msg.includes(link)){
      msg += "\n\n📲 Solicite seu orçamento: " + link;
    }
    return msg;
  }

  function startCycle(){
    const state = mergeState();
    const bairro = selectedBairro();
    const bairroKey = clean(bairro);
    const limit = Number(document.getElementById("cycleLimit")?.value || 20) || 20;

    let groups = state.groups || [];

    if(bairroKey){
      groups = groups.filter(g => clean(g.bairro || g.region || g.regiao || "") === bairroKey);
    }

    groups = groups.filter(g => g.status !== "postado").slice(0, limit);

    state.cycle = groups;
    state.index = groups.length ? 0 : -1;
    state.current = groups.length ? groups[0] : null;
    state.selectedBairroCycle = bairro;

    saveState(state);
    render();

    toast(groups.length ? `${groups.length} grupos carregados para ${bairro || "todos os bairros"}.` : `Nenhum grupo encontrado para ${bairro || "todos os bairros"}.`);
  }

  async function copyMessage(){
    let state = mergeState();
    if(!getCurrent(state)){
      startCycle();
      state = mergeState();
    }

    if(!getCurrent(state)){
      toast("Nenhum grupo no ciclo.");
      return;
    }

    await navigator.clipboard.writeText(buildMessage(state)).catch(()=>{});
    toast("Mensagem copiada com link de cliques.");
  }

  function openGroup(){
    let state = mergeState();
    if(!getCurrent(state)){
      startCycle();
      state = mergeState();
    }

    const g = getCurrent(state);
    if(!g){
      toast("Nenhum grupo para abrir.");
      return;
    }

    window.open(g.url, "_blank");
    render();
  }

  function markPostedAndAdvance(){
    const state = mergeState();
    const current = getCurrent(state);

    if(!current){
      toast("Nenhum grupo selecionado.");
      return;
    }

    const postedAt = new Date().toISOString();

    state.groups = (state.groups || []).map(g => {
      if(g.id === current.id || normUrl(g.url) === normUrl(current.url)){
        return {...g, status:"postado", postedAt};
      }
      return g;
    });

    state.cycle = (state.cycle || []).map(g => {
      if(g.id === current.id || normUrl(g.url) === normUrl(current.url)){
        return {...g, status:"postado", postedAt};
      }
      return g;
    });

    let nextIndex = Number(state.index || 0) + 1;
    state.index = nextIndex;

    if(nextIndex < state.cycle.length){
      state.current = state.cycle[nextIndex];
      toast("Postado. Próximo grupo carregado.");
    }else{
      state.current = null;
      toast("Postado. Fim do ciclo.");
    }

    saveState(state);
    render();
  }

  function resetCycle(){
    const state = mergeState();
    state.cycle = [];
    state.index = -1;
    state.current = null;
    saveState(state);
    render();
    toast("Ciclo zerado.");
  }

  function render(){
    const state = mergeState();
    const current = getCurrent(state);
    const cycle = state.cycle || [];
    const idx = Number(state.index ?? -1);

    const currentHtml = current
      ? `<b>${escapeHtml(current.name || "Grupo Facebook")}</b><br>
         <small>${escapeHtml(current.bairro || "")} · ${escapeHtml(current.url)}</small><br>
         <small class="track-line">Link de cliques: ${escapeHtml(tracking(current))}</small>`
      : "Nenhum grupo no ciclo.";

    ["grupoAtual","currentGroup","dashCurrentGroup","dashGrupoAtual"].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.innerHTML = currentHtml;
    });

    const msg = current ? buildMessage(state) : "";
    ["mensagemAtual","currentMessage","dashMessage","dashMensagem"].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.value = msg;
    });

    const list = cycle.map((g, i) => `
      <div class="row data-row ${i === idx ? "active-cycle-fix" : ""}">
        <header><b>${escapeHtml(g.name || "Grupo Facebook")}</b><span>${escapeHtml(g.status || "pendente")}</span></header>
        <small>${escapeHtml(g.bairro || "")} · ${escapeHtml(g.url)}</small>
        <small class="track-line">Link de cliques: ${escapeHtml(tracking(g))}</small>
      </div>
    `).join("");

    ["cycleList","filaCiclo"].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.innerHTML = list || "<p>Nenhum grupo no ciclo.</p>";
    });

    const today = new Date().toISOString().slice(0,10);
    const postedToday = (state.groups || []).filter(g => String(g.postedAt || "").slice(0,10) === today).length;
    const bairros = {};
    (state.groups || []).forEach(g => {
      const b = clean(g.bairro || g.region || "");
      if(b) bairros[b] = true;
    });

    [
      ["statGroups", (state.groups || []).length],
      ["totalGroups", (state.groups || []).length],
      ["groupsCount", (state.groups || []).length],
      ["statBairros", Object.keys(bairros).length],
      ["totalRegions", Object.keys(bairros).length],
      ["statPosted", postedToday],
      ["todayPosted", postedToday]
    ].forEach(([id, val]) => {
      const el = document.getElementById(id);
      if(el) el.textContent = val;
    });

    document.querySelectorAll("span,strong,b").forEach(el => {
      const txt = String(el.textContent || "").trim();
      if(/^\d+\s*\/\s*\d+$/.test(txt)){
        el.textContent = cycle.length && idx >= 0 ? `${Math.min(idx+1, cycle.length)} / ${cycle.length}` : "0 / 0";
      }
    });
  }

  function patchButtons(){
    document.querySelectorAll("button,a").forEach(btn => {
      const t = String(btn.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");

      if(t.includes("iniciar ciclo")){
        btn.onclick = e => { e.preventDefault(); e.stopPropagation(); startCycle(); return false; };
      }

      if(t.includes("copiar mensagem")){
        btn.onclick = e => { e.preventDefault(); e.stopPropagation(); copyMessage(); return false; };
      }

      if(t.includes("abrir proximo") || t.includes("proximo grupo")){
        btn.textContent = "Abrir Grupo";
        btn.onclick = e => { e.preventDefault(); e.stopPropagation(); openGroup(); return false; };
      }

      if(t.includes("marcar") && t.includes("postado")){
        btn.onclick = e => { e.preventDefault(); e.stopPropagation(); markPostedAndAdvance(); return false; };
      }

      if(t.includes("zerar ciclo")){
        btn.onclick = e => { e.preventDefault(); e.stopPropagation(); resetCycle(); return false; };
      }
    });

    reorder();
  }

  function reorder(){
    const ciclo = document.getElementById("ciclo");
    if(!ciclo) return;
    const buttons = Array.from(ciclo.querySelectorAll("button,a")).filter(b => {
      const t = String(b.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      return t.includes("iniciar ciclo") || t.includes("copiar mensagem") || t.includes("abrir grupo") || t.includes("marcar") || t.includes("zerar ciclo");
    });
    if(!buttons.length) return;
    const parent = buttons[0].parentElement;
    if(!parent) return;

    const find = term => buttons.find(b => String(b.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").includes(term));
    const start = find("iniciar ciclo");
    const copy = find("copiar mensagem");
    const open = find("abrir grupo");
    const posted = buttons.find(b => {
      const t = String(b.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      return t.includes("marcar") && t.includes("postado");
    });
    const reset = find("zerar ciclo");

    [start, copy, open, posted, reset].filter(Boolean).forEach(b => parent.appendChild(b));
  }

  function escapeHtml(s){
    return String(s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function toast(msg){
    if(typeof window.toastIdeal === "function") window.toastIdeal(msg);
    else alert(msg);
  }

  function boot(){
    patchButtons();
    render();
    setInterval(patchButtons, 1200);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.cicloDefinitivoIdeal = {startCycle, copyMessage, openGroup, markPostedAndAdvance, resetCycle, render};
})();
