
/* FIX CICLO + CONTAGEM - Ideal Toldos
   Unifica bancos antigos e novos para o ciclo enxergar os grupos salvos.
*/
(function(){
  const MASTER_KEY = "ideal_admin_master_v1";
  const FIX_KEY = "ideal_admin_fix_v1";

  function safeJson(key){
    try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch(e){ return {}; }
  }

  function saveJson(key, data){
    localStorage.setItem(key, JSON.stringify(data));
  }

  function normUrl(url){
    url = String(url || "").trim();
    if(!url) return "";
    if(!/^https?:\/\//i.test(url)) url = "https://" + url;
    try{
      const u = new URL(url);
      return u.origin + u.pathname.replace(/\/$/,"");
    }catch(e){ return ""; }
  }

  function normalizeGroup(g){
    const url = normUrl(g.url || g.link || g.groupUrl || "");
    const bairro = g.bairro || g.region || g.regiao || g.area || "";
    return {
      id: g.id || ("g_" + Math.random().toString(36).slice(2)),
      name: g.name || g.nome || g.title || "Grupo Facebook",
      url,
      bairro,
      region: bairro,
      regiao: g.regiao || g.zone || "",
      membros: g.membros || g.members || "",
      status: g.status || "pendente",
      createdAt: g.createdAt || new Date().toISOString(),
      postedAt: g.postedAt || null
    };
  }

  function syncBanks(){
    const master = safeJson(MASTER_KEY);
    const fix = safeJson(FIX_KEY);

    const all = []
      .concat(Array.isArray(master.groups) ? master.groups : [])
      .concat(Array.isArray(fix.groups) ? fix.groups : []);

    const map = new Map();
    all.forEach(raw => {
      const g = normalizeGroup(raw);
      if(!g.url) return;
      const key = normUrl(g.url);
      if(!map.has(key)) map.set(key, g);
    });

    const groups = Array.from(map.values());

    master.groups = groups;
    fix.groups = groups;

    if(!Array.isArray(master.bairros) && Array.isArray(fix.bairros)) master.bairros = fix.bairros;
    if(!Array.isArray(fix.bairros) && Array.isArray(master.bairros)) fix.bairros = master.bairros;

    if(Array.isArray(fix.models) && (!Array.isArray(master.models) || !master.models.some(Boolean))) master.models = fix.models;
    if(Array.isArray(master.models) && (!Array.isArray(fix.models) || !fix.models.some(Boolean))) fix.models = master.models;

    saveJson(MASTER_KEY, master);
    saveJson(FIX_KEY, fix);

    return groups;
  }

  function patchStartCycle(){
    const buttons = Array.from(document.querySelectorAll("button,a"));
    buttons.forEach(btn => {
      const t = String(btn.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      if(t.includes("iniciar ciclo")){
        btn.onclick = function(e){
          e.preventDefault();
          e.stopPropagation();

          const groups = syncBanks();
          const bairroSelect = document.getElementById("cycleBairro") || document.getElementById("dashBairro");
          const bairro = bairroSelect ? String(bairroSelect.value || "").trim() : "";
          const limitInput = document.getElementById("cycleLimit");
          const limit = Number(limitInput ? limitInput.value : 20) || 20;

          const selected = groups
            .filter(g => !bairro || g.bairro === bairro || g.region === bairro)
            .filter(g => g.status !== "postado")
            .slice(0, limit);

          const master = safeJson(MASTER_KEY);
          master.groups = groups;
          master.cycle = selected;
          master.index = -1;
          master.current = null;
          saveJson(MASTER_KEY, master);

          const fix = safeJson(FIX_KEY);
          fix.groups = groups;
          fix.cycle = selected;
          fix.index = -1;
          fix.current = null;
          saveJson(FIX_KEY, fix);

          renderCycle(selected);
          renderCounts(groups);

          alert(`${selected.length} grupos carregados no ciclo.`);
          return false;
        };
      }

      if(t.includes("abrir proximo") || t.includes("proximo grupo")){
        btn.onclick = function(e){
          e.preventDefault();
          e.stopPropagation();

          const master = safeJson(MASTER_KEY);
          const cycle = Array.isArray(master.cycle) ? master.cycle : [];
          if(!cycle.length){
            alert("Inicie o ciclo primeiro.");
            return false;
          }

          master.index = Number(master.index || -1) + 1;
          if(master.index >= cycle.length){
            alert("Fim do ciclo.");
            return false;
          }

          master.current = cycle[master.index];
          saveJson(MASTER_KEY, master);

          const fix = safeJson(FIX_KEY);
          fix.index = master.index;
          fix.current = master.current;
          fix.cycle = cycle;
          saveJson(FIX_KEY, fix);

          renderCurrent(master.current, master.index, cycle.length);
          window.open(master.current.url, "_blank");
          return false;
        };
      }

      if(t.includes("marcar") && t.includes("postado")){
        btn.onclick = function(e){
          e.preventDefault();
          e.stopPropagation();

          const master = safeJson(MASTER_KEY);
          if(!master.current){
            alert("Abra um grupo primeiro.");
            return false;
          }

          const groups = Array.isArray(master.groups) ? master.groups : [];
          const g = groups.find(x => x.id === master.current.id || normUrl(x.url) === normUrl(master.current.url));
          if(g){
            g.status = "postado";
            g.postedAt = new Date().toISOString();
          }
          master.current.status = "postado";
          master.current.postedAt = new Date().toISOString();
          master.groups = groups;
          saveJson(MASTER_KEY, master);

          const fix = safeJson(FIX_KEY);
          fix.groups = groups;
          fix.current = master.current;
          saveJson(FIX_KEY, fix);

          renderCounts(groups);
          alert("Marcado como postado.");
          return false;
        };
      }
    });
  }

  function renderCounts(groups){
    const today = new Date().toISOString().slice(0,10);
    const byBairro = {};
    groups.forEach(g => {
      const b = g.bairro || g.region || "Sem bairro";
      byBairro[b] = (byBairro[b] || 0) + 1;
    });

    const postedToday = groups.filter(g => String(g.postedAt || "").slice(0,10) === today).length;

    [
      ["statGroups", groups.length],
      ["totalGroups", groups.length],
      ["groupsCount", groups.length],
      ["statBairros", Object.keys(byBairro).length],
      ["totalRegions", Object.keys(byBairro).length],
      ["statPosted", postedToday],
      ["todayPosted", postedToday]
    ].forEach(([id,val]) => {
      const el = document.getElementById(id);
      if(el) el.textContent = val;
    });

    const cycleCounter = Array.from(document.querySelectorAll(".card,.panel,section,div")).find(el =>
      String(el.textContent || "").includes("Ciclo de Divulgação")
    );
    if(cycleCounter){
      const spans = cycleCounter.querySelectorAll("span,strong,b");
      spans.forEach(s => {
        if(String(s.textContent || "").trim().match(/^\d+\s*\/\s*\d+$/)){
          s.textContent = `0 / ${groups.length}`;
        }
      });
    }
  }

  function renderCycle(cycle){
    const html = cycle.map(g => `
      <div class="row data-row">
        <header><b>${g.name}</b><span>${g.status || "pendente"}</span></header>
        <small>${g.bairro || ""} · ${g.url}</small>
      </div>
    `).join("");

    ["cycleList","filaCiclo"].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.innerHTML = html || "<p>Nenhum grupo no ciclo.</p>";
    });

    const boxes = Array.from(document.querySelectorAll(".card,.panel,section")).filter(el =>
      String(el.textContent || "").includes("Fila do ciclo")
    );
    boxes.forEach(box => {
      const container = box.querySelector("#cycleList") || box.querySelector(".data-list") || box;
      if(container) container.innerHTML = html || "<p>Nenhum grupo no ciclo.</p>";
    });
  }

  function renderCurrent(g, index, total){
    const html = `<b>${g.name}</b><br><small>${g.bairro || ""} · ${g.url}</small>`;

    ["grupoAtual","currentGroup","dashCurrentGroup","dashGrupoAtual"].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.innerHTML = html;
    });

    const master = safeJson(MASTER_KEY);
    const models = Array.isArray(master.models) ? master.models.filter(Boolean) : [];
    const msg = models.length ? models[index % models.length] : "";

    ["mensagemAtual","currentMessage","dashMessage","dashMensagem"].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.value = msg;
    });

    Array.from(document.querySelectorAll("span,strong,b")).forEach(s => {
      if(String(s.textContent || "").trim().match(/^\d+\s*\/\s*\d+$/)){
        s.textContent = `${index + 1} / ${total}`;
      }
    });
  }

  function boot(){
    const groups = syncBanks();
    renderCounts(groups);
    patchStartCycle();
    setTimeout(patchStartCycle, 500);
    setTimeout(patchStartCycle, 1500);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.syncIdealGroups = syncBanks;
})();
