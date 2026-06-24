
/* FIX FINAL: CICLO OBEDECE BAIRRO + VOLTAR AO SITE */
(function(){
  const MASTER_KEY = "ideal_admin_master_v1";
  const FIX_KEY = "ideal_admin_fix_v1";

  function read(key){
    try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch(e){ return {}; }
  }

  function write(key, data){
    localStorage.setItem(key, JSON.stringify(data));
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

  function syncState(){
    const master = read(MASTER_KEY);
    const fix = read(FIX_KEY);

    const all = []
      .concat(Array.isArray(master.groups) ? master.groups : [])
      .concat(Array.isArray(fix.groups) ? fix.groups : []);

    const map = new Map();

    all.forEach(g=>{
      const url = normUrl(g.url || g.link || "");
      if(!url) return;

      const bairro = g.bairro || g.region || g.regiao || g.area || "";
      map.set(url, {
        ...g,
        url,
        bairro,
        region: bairro,
        status: g.status || "pendente"
      });
    });

    master.groups = Array.from(map.values());

    if(!Array.isArray(master.models) && Array.isArray(fix.models)) master.models = fix.models;
    if(!Array.isArray(master.bairros) && Array.isArray(fix.bairros)) master.bairros = fix.bairros;

    write(MASTER_KEY, master);

    fix.groups = master.groups;
    if(master.models) fix.models = master.models;
    if(master.bairros) fix.bairros = master.bairros;
    write(FIX_KEY, fix);

    return master;
  }

  function saveState(state){
    write(MASTER_KEY, state);
    const fix = read(FIX_KEY);
    fix.groups = state.groups || [];
    fix.cycle = state.cycle || [];
    fix.current = state.current || null;
    fix.index = state.index ?? -1;
    if(state.models) fix.models = state.models;
    write(FIX_KEY, fix);
  }

  function ensureBackButton(){
    let btn = document.getElementById("btnVoltarSiteIdeal");
    if(!btn){
      btn = document.createElement("a");
      btn.id = "btnVoltarSiteIdeal";
      btn.className = "btn blue voltar-site-fix";
      btn.href = "/";
      btn.textContent = "← Voltar ao site";
    }

    const sidebar = document.querySelector(".sidebar");
    if(sidebar && !sidebar.contains(btn)){
      const brand = sidebar.querySelector(".brand") || sidebar.firstElementChild;
      if(brand && brand.parentNode){
        brand.parentNode.insertBefore(btn, brand.nextSibling);
      }else{
        sidebar.prepend(btn);
      }
    }else if(!sidebar && !document.body.contains(btn)){
      document.body.prepend(btn);
    }
  }

  function getSelectedBairro(){
    const cyclePage = document.getElementById("ciclo");

    const select =
      document.getElementById("cycleBairro") ||
      (cyclePage ? Array.from(cyclePage.querySelectorAll("select")).find(s => {
        const t = String(s.closest(".card,.panel,section,div")?.textContent || "").toLowerCase();
        return t.includes("selecionar bairro") || t.includes("ciclo");
      }) : null);

    let val = select ? String(select.value || "").trim() : "";

    if(!val || clean(val) === "todos os bairros" || clean(val) === "todos" || clean(val) === "selecione o bairro"){
      return "";
    }

    return val;
  }

  function tracking(g){
    if(!g) return location.origin;
    return location.origin + "/?src=" + encodeURIComponent(g.id || g.url) + "&bairro=" + encodeURIComponent(g.bairro || g.region || "");
  }

  function currentMessage(){
    const state = syncState();
    const current = state.current;
    const models = Array.isArray(state.models) ? state.models.filter(m => String(m || "").trim()) : [];

    let msg = models.length
      ? models[Math.max(0, Number(state.index || 0)) % models.length]
      : "🏠 Proteja e valorize seu imóvel com quem entende do assunto!\n\n✅ Toldos retráteis e fixos\n✅ Coberturas de policarbonato\n✅ ACM e letreiros\n✅ Instalação profissional\n\n📲 Solicite seu orçamento: {LINK}";

    const link = tracking(current);
    msg = msg.replaceAll("{LINK}", link).replaceAll("[LINK]", link).replaceAll("{{LINK}}", link);

    if(!msg.includes(link)){
      msg += "\n\n📲 Solicite seu orçamento: " + link;
    }

    return msg;
  }

  function startCycleExact(){
    const state = syncState();
    const bairro = getSelectedBairro();
    const bairroKey = clean(bairro);
    const limit = Number(document.getElementById("cycleLimit")?.value || 20) || 20;

    let groups = Array.isArray(state.groups) ? state.groups : [];

    if(bairroKey){
      groups = groups.filter(g => clean(g.bairro || g.region || g.regiao || "") === bairroKey);
    }

    groups = groups
      .filter(g => g.status !== "postado")
      .slice(0, limit);

    state.cycle = groups;
    state.index = groups.length ? 0 : -1;
    state.current = groups.length ? groups[0] : null;
    state.selectedBairroCycle = bairro;

    saveState(state);
    renderCycleExact();
    updateCounters();

    if(groups.length){
      toastOrAlert(`${groups.length} grupos carregados em ${bairro || "todos os bairros"}.`);
    }else{
      toastOrAlert(`Nenhum grupo disponível para ${bairro || "todos os bairros"}.`);
    }
  }

  function openCurrent(){
    const state = syncState();

    if(!state.current){
      startCycleExact();
      const again = syncState();
      if(!again.current) return;
      window.open(again.current.url, "_blank");
      return;
    }

    window.open(state.current.url, "_blank");
  }

  async function copyCurrent(){
    const state = syncState();
    if(!state.current){
      startCycleExact();
    }

    const again = syncState();
    if(!again.current){
      toastOrAlert("Nenhum grupo selecionado no ciclo.");
      return;
    }

    await navigator.clipboard.writeText(currentMessage()).catch(()=>{});
    toastOrAlert("Mensagem com link de cliques copiada.");
  }

  function markPostedExact(){
    const state = syncState();
    const current = state.current;

    if(!current){
      toastOrAlert("Nenhum grupo selecionado para marcar.");
      return;
    }

    const postedAt = new Date().toISOString();

    state.groups = (state.groups || []).map(g=>{
      if(g.id === current.id || normUrl(g.url) === normUrl(current.url)){
        return {...g, status:"postado", postedAt};
      }
      return g;
    });

    state.cycle = (state.cycle || []).map(g=>{
      if(g.id === current.id || normUrl(g.url) === normUrl(current.url)){
        return {...g, status:"postado", postedAt};
      }
      return g;
    });

    state.current = {...current, status:"postado", postedAt};
    saveState(state);
    renderCycleExact();
    updateCounters();
    toastOrAlert("Marcado como postado.");
  }

  function nextExact(){
    const state = syncState();

    if(!state.cycle || !state.cycle.length){
      startCycleExact();
      return;
    }

    state.index = Number(state.index ?? 0) + 1;

    if(state.index >= state.cycle.length){
      state.index = state.cycle.length - 1;
      saveState(state);
      toastOrAlert("Fim do ciclo.");
      return;
    }

    state.current = state.cycle[state.index];
    saveState(state);
    renderCycleExact();
  }

  function renderCycleExact(){
    const state = syncState();
    const cycle = Array.isArray(state.cycle) ? state.cycle : [];
    const idx = Number(state.index ?? -1);
    const current = state.current;

    const currentHtml = current
      ? `<b>${current.name || "Grupo Facebook"}</b><br>
         <small>${current.bairro || ""} · ${current.url}</small><br>
         <small class="track-line">Link de cliques: ${tracking(current)}</small>`
      : "Nenhum grupo no ciclo.";

    ["grupoAtual","currentGroup","dashCurrentGroup","dashGrupoAtual"].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.innerHTML = currentHtml;
    });

    ["mensagemAtual","currentMessage","dashMessage","dashMensagem"].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.value = current ? currentMessage() : "";
    });

    const listHtml = cycle.map((g,i)=>`
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

  function updateCounters(){
    const state = syncState();
    const groups = state.groups || [];
    const today = new Date().toISOString().slice(0,10);
    const posted = groups.filter(g => String(g.postedAt || "").slice(0,10) === today).length;
    const bairros = {};
    groups.forEach(g=>{
      const b = clean(g.bairro || g.region || "");
      if(b) bairros[b] = true;
    });

    [
      ["statGroups", groups.length],
      ["totalGroups", groups.length],
      ["groupsCount", groups.length],
      ["statBairros", Object.keys(bairros).length],
      ["statPosted", posted],
      ["todayPosted", posted]
    ].forEach(([id,val])=>{
      const el = document.getElementById(id);
      if(el) el.textContent = val;
    });
  }

  function toastOrAlert(msg){
    if(typeof window.toastIdeal === "function") window.toastIdeal(msg);
    else alert(msg);
  }

  function reorderButtons(){
    const cycle = document.getElementById("ciclo");
    if(!cycle) return;

    const buttons = Array.from(cycle.querySelectorAll("button,a")).filter(btn=>{
      const t = String(btn.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      return t.includes("iniciar ciclo") || t.includes("copiar mensagem") || t.includes("abrir proximo") || t.includes("marcar") || t.includes("zerar ciclo");
    });

    if(!buttons.length) return;

    const parent = buttons[0].parentElement;
    if(!parent) return;

    const find = (needle)=>buttons.find(b=>String(b.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").includes(needle));

    const start = find("iniciar ciclo");
    const copy = find("copiar mensagem");
    const open = find("abrir proximo");
    const posted = buttons.find(b=>{
      const t = String(b.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      return t.includes("marcar") && t.includes("postado");
    });
    const reset = find("zerar ciclo");

    [start, copy, open, posted, reset].filter(Boolean).forEach(b=>parent.appendChild(b));
  }

  function patchButtons(){
    Array.from(document.querySelectorAll("button,a")).forEach(btn=>{
      const t = String(btn.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");

      if(t.includes("iniciar ciclo")){
        btn.onclick = e => { e.preventDefault(); e.stopPropagation(); startCycleExact(); return false; };
      }

      if(t.includes("copiar mensagem")){
        btn.onclick = e => { e.preventDefault(); e.stopPropagation(); copyCurrent(); return false; };
      }

      if(t.includes("abrir proximo") || t.includes("proximo grupo")){
        btn.onclick = e => { e.preventDefault(); e.stopPropagation(); openCurrent(); return false; };
      }

      if(t.includes("marcar") && t.includes("postado")){
        btn.onclick = e => { e.preventDefault(); e.stopPropagation(); markPostedExact(); return false; };
      }

      if(t.includes("zerar ciclo")){
        btn.onclick = e => {
          e.preventDefault();
          e.stopPropagation();
          const state = syncState();
          state.cycle = [];
          state.index = -1;
          state.current = null;
          saveState(state);
          renderCycleExact();
          return false;
        };
      }
    });
  }

  function boot(){
    ensureBackButton();
    patchButtons();
    reorderButtons();
    renderCycleExact();
    updateCounters();

    setInterval(()=>{
      ensureBackButton();
      patchButtons();
      reorderButtons();
    }, 1200);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.cicloBairroVoltarFix = {
    startCycleExact,
    copyCurrent,
    openCurrent,
    markPostedExact,
    nextExact,
    renderCycleExact
  };
})();
