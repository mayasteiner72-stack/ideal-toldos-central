
/*
  FIX ADMIN IDEAL TOLDOS
  Corrige botões e funções principais sem depender do JS antigo.
*/
(function(){
  const KEY = "ideal_admin_fix_v1";
  const DEFAULT_BAIRROS = [
    ["Zona Oeste", ["Campo Grande","Cosmos","Paciência","Santa Cruz","Bangu","Realengo","Senador Camará","Senador Vasconcelos","Santíssimo","Inhoaíba","Guaratiba","Sepetiba","Pedra de Guaratiba","Recreio dos Bandeirantes","Barra da Tijuca","Vargem Grande","Vargem Pequena","Jacarepaguá","Taquara","Freguesia","Pechincha","Anil","Curicica","Cidade de Deus","Gardênia Azul","Padre Miguel","Magalhães Bastos","Vila Kennedy","Jabour","Deodoro","Vila Militar","Sulacap","Praça Seca","Tanque"]],
    ["Zona Norte", ["Méier","Tijuca","Vila Isabel","Maracanã","Grajaú","Andaraí","Engenho de Dentro","Engenho Novo","Cachambi","Del Castilho","Pilares","Madureira","Oswaldo Cruz","Cascadura","Quintino","Rocha Miranda","Irajá","Vista Alegre","Vila da Penha","Penha","Olaria","Bonsucesso","Ramos","Inhaúma","Pavuna"]],
    ["Zona Sul", ["Copacabana","Ipanema","Leblon","Botafogo","Flamengo","Laranjeiras","Catete","Glória","Urca","Humaitá","Jardim Botânico","Lagoa","Gávea","São Conrado","Leme"]],
    ["Centro", ["Centro","Lapa","Cidade Nova","Estácio","Rio Comprido","Santa Teresa","Catumbi","Santo Cristo","Saúde","Gamboa","Caju"]],
    ["Baixada", ["Nova Iguaçu","Duque de Caxias","Belford Roxo","São João de Meriti","Nilópolis","Mesquita","Queimados","Japeri"]],
    ["Grande Rio", ["Niterói","São Gonçalo","Itaboraí","Maricá","Itaguaí","Seropédica"]]
  ];

  const $ = (id) => document.getElementById(id);
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));
  const esc = (s) => String(s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const normUrl = (url) => {
    url = String(url || "").trim();
    if (!url) return "";
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    try {
      const u = new URL(url);
      return u.origin + u.pathname.replace(/\/$/, "");
    } catch(e) { return ""; }
  };

  let state = {
    groups: [],
    bairros: [],
    models: ["","","",""],
    clicks: [],
    cycle: [],
    index: -1,
    current: null,
    ignoredIp: ""
  };

  function load(){
    try { state = Object.assign(state, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch(e) {}
    if (!Array.isArray(state.groups)) state.groups = [];
    if (!Array.isArray(state.bairros)) state.bairros = [];
    if (!Array.isArray(state.models)) state.models = ["","","",""];
    if (!Array.isArray(state.clicks)) state.clicks = [];
    if (!state.bairros.length) seedBairros(false);
  }

  function save(){
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function seedBairros(showAlert){
    const map = new Map(state.bairros.map(b => [String(b.nome || b.name || "").toLowerCase(), b]));
    DEFAULT_BAIRROS.forEach(([regiao, bairros]) => {
      bairros.forEach(nome => {
        if (!map.has(nome.toLowerCase())) state.bairros.push({ nome, regiao, meta: 50 });
      });
    });
    save();
    render();
    if (showAlert) alert("Bairros atualizados.");
  }

  function getBairroOptions(){
    return '<option value="">Selecione o bairro</option>' +
      state.bairros
        .slice()
        .sort((a,b)=>String(a.nome).localeCompare(String(b.nome), "pt-BR"))
        .map(b => `<option value="${esc(b.nome)}">${esc(b.nome)}</option>`)
        .join("");
  }

  function fillSelects(){
    const html = getBairroOptions();
    [
      "groupBairroSelect","bulkBairroSelect","cycleBairro","dashBairro",
      "bairroSelect","regionSelect","selectedBairro","grupoBairroSelect"
    ].forEach(id => {
      const el = $(id);
      if (!el || el.dataset.fixedFilled === "manual") return;
      const current = el.value;
      if (el.tagName === "SELECT") {
        el.innerHTML = html;
        if (current) el.value = current;
      }
    });
  }

  function pageTitle(name){
    const title = $("pageTitle") || qs("h1");
    if (title) title.textContent = name;
  }

  function showPage(page){
    const ids = ["dashboard","grupos","regioes","modelos","ciclo","cliques","relatorios","config","galeria","clientes","postagens"];
    qsa(".page, section[id]").forEach(el => {
      if (ids.includes(el.id)) {
        el.classList.remove("active");
        el.style.display = "none";
      }
    });

    const target = $(page);
    if (target) {
      target.classList.add("active");
      target.style.display = "block";
    }

    qsa("[data-page]").forEach(b => b.classList.remove("active"));
    const btn = qs(`[data-page="${page}"]`);
    if (btn) {
      btn.classList.add("active");
      pageTitle(btn.textContent.replace(/[^\wÀ-ÿ\s]/g, "").trim() || "Painel");
    }
    localStorage.setItem("ideal_last_page_fix", page);
  }

  function countByBairro(){
    const out = {};
    state.groups.forEach(g => {
      const b = g.bairro || g.region || "Sem bairro";
      out[b] = (out[b] || 0) + 1;
    });
    return out;
  }

  function trackingUrl(g){
    return location.origin + "/?src=" + encodeURIComponent(g.id || g.url) + "&bairro=" + encodeURIComponent(g.bairro || g.region || "");
  }

  function renderStats(){
    const byB = countByBairro();
    const today = new Date().toISOString().slice(0,10);
    const postedToday = state.groups.filter(g => String(g.postedAt || "").slice(0,10) === today).length;

    [
      ["statGroups", state.groups.length],
      ["totalGroups", state.groups.length],
      ["groupsCount", state.groups.length],
      ["statBairros", Object.keys(byB).length],
      ["totalRegions", Object.keys(byB).length],
      ["statPosted", postedToday],
      ["todayPosted", postedToday],
      ["statClicks", state.clicks.length],
      ["totalClicks", state.clicks.length]
    ].forEach(([id, val]) => { if ($(id)) $(id).textContent = val; });
  }

  function renderRegions(){
    const byB = countByBairro();
    const html = state.bairros.map(b => {
      const qtd = byB[b.nome] || 0;
      const meta = Number(b.meta || 50);
      const pct = Math.min(100, Math.round((qtd / meta) * 100));
      return `<div class="row region-row data-row">
        <header><b>${esc(b.nome)}</b><span>${qtd}/${meta}</span></header>
        <small>${esc(b.regiao || b.zone || "")}</small>
        <div class="bar"><span style="width:${pct}%"></span></div>
      </div>`;
    }).join("");

    ["regioesList","regionsList","dashRegions","dashBairros"].forEach(id => {
      if ($(id)) $(id).innerHTML = html || "<p>Nenhum bairro cadastrado.</p>";
    });
  }

  function renderGroups(){
    const filter = (($("groupFilter") || $("filterGroup"))?.value || "").toLowerCase();
    const list = state.groups.filter(g => `${g.name} ${g.url} ${g.bairro} ${g.region}`.toLowerCase().includes(filter));
    const html = list.map(g => `<div class="row group-row data-row">
      <header><b>${esc(g.name || "Grupo Facebook")}</b><span>${esc(g.bairro || g.region || "")}</span></header>
      <small>${esc(g.url)}</small>
      <small class="track-line">Link rastreável: ${esc(trackingUrl(g))}</small>
      <div class="actions">
        <a class="btn blue" href="${esc(g.url)}" target="_blank" rel="noopener">Abrir grupo</a>
        <button class="btn blue" type="button" data-copy="${esc(trackingUrl(g))}">Copiar link rastreável</button>
        <button class="btn red" type="button" data-del-group="${esc(g.id)}">Excluir</button>
      </div>
    </div>`).join("");

    ["groupsList","gruposList","groupList"].forEach(id => {
      if ($(id)) $(id).innerHTML = html || "<p>Nenhum grupo cadastrado.</p>";
    });
  }

  function renderModels(){
    state.models.forEach((m, i) => {
      const ids = [`model${i+1}`, `modelo${i+1}`, `postModel${i+1}`];
      ids.forEach(id => {
        const el = $(id);
        if (el && document.activeElement !== el) el.value = m || "";
      });
    });
  }

  function currentMessage(){
    const models = state.models.filter(m => String(m || "").trim());
    if (!models.length) return "";
    const idx = Math.max(0, state.index);
    return models[idx % models.length];
  }

  function filteredGroups(){
    const bairro = ($("cycleBairro")?.value || $("dashBairro")?.value || "").trim();
    return state.groups.filter(g => !bairro || (g.bairro || g.region) === bairro);
  }

  function renderCycle(){
    const list = state.cycle.length ? state.cycle : filteredGroups();
    const html = list.map(g => `<div class="row cycle-row">
      <header><b>${esc(g.name || "Grupo Facebook")}</b><span>${esc(g.status || "pendente")}</span></header>
      <small>${esc(g.bairro || g.region || "")} · ${esc(g.url)}</small>
    </div>`).join("");

    ["cycleList","filaCiclo"].forEach(id => { if ($(id)) $(id).innerHTML = html || "<p>Nenhum grupo no ciclo.</p>"; });

    const cur = state.current
      ? `<b>${esc(state.current.name || "Grupo Facebook")}</b><br><small>${esc(state.current.bairro || state.current.region || "")} · ${esc(state.current.url)}</small>`
      : "Nenhum grupo selecionado.";

    ["grupoAtual","currentGroup","dashCurrentGroup","dashGrupoAtual"].forEach(id => { if ($(id)) $(id).innerHTML = cur; });
    ["mensagemAtual","currentMessage","dashMessage","dashMensagem"].forEach(id => { if ($(id)) $(id).value = currentMessage(); });
  }

  function renderClicks(){
    const byB = {}, byG = {};
    state.clicks.forEach(c => {
      const b = c.bairro || c.region || "Sem bairro";
      const g = c.groupName || c.group || "Sem grupo";
      byB[b] = (byB[b] || 0) + 1;
      byG[g] = (byG[g] || 0) + 1;
    });
    const topB = Object.entries(byB).sort((a,b)=>b[1]-a[1])[0];
    const topG = Object.entries(byG).sort((a,b)=>b[1]-a[1])[0];

    if ($("clickTotal")) $("clickTotal").textContent = state.clicks.length;
    if ($("clickBairroTop")) $("clickBairroTop").textContent = topB ? topB[0] : "-";
    if ($("clickGrupoTop")) $("clickGrupoTop").textContent = topG ? topG[0] : "-";

    const htmlB = Object.entries(byB).map(([k,v]) => `<div class="row"><header><b>${esc(k)}</b><span>${v}</span></header></div>`).join("");
    const htmlG = Object.entries(byG).map(([k,v]) => `<div class="row"><header><b>${esc(k)}</b><span>${v}</span></header></div>`).join("");

    ["clicksBairro","clicksByRegion","clickReportsList"].forEach(id => { if ($(id)) $(id).innerHTML = htmlB || "<p>Nenhum clique.</p>"; });
    ["clicksGrupo","clicksByGroup"].forEach(id => { if ($(id)) $(id).innerHTML = htmlG || "<p>Nenhum clique.</p>"; });
  }

  function render(){
    fillSelects();
    renderStats();
    renderRegions();
    renderGroups();
    renderModels();
    renderCycle();
    renderClicks();
    save();
  }

  function getVal(ids){
    for (const id of ids) {
      const el = $(id);
      if (el && String(el.value || "").trim()) return String(el.value).trim();
    }
    return "";
  }

  function saveGroup(){
    const name = getVal(["groupName","nomeGrupo","newGroupName"]) || "Grupo Facebook";
    const url = normUrl(getVal(["groupUrl","linkGrupo","newGroupUrl"]));
    const bairro = getVal(["groupBairro","bairroGrupo","groupRegion"]) || getVal(["groupBairroSelect","grupoBairroSelect"]);
    const regiao = getVal(["groupRegiao","regiaoGrupo"]) || "Sem região";
    const membros = getVal(["groupMembros","membrosGrupo"]);

    if (!url || !bairro) return alert("Link e bairro são obrigatórios.");
    if (state.groups.some(g => normUrl(g.url) === url)) return alert("Este grupo já está cadastrado.");

    state.groups.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name, url, bairro, regiao, membros,
      status: "pendente",
      createdAt: new Date().toISOString(),
      postedAt: null
    });

    ["groupName","nomeGrupo","newGroupName","groupUrl","linkGrupo","newGroupUrl","groupBairro","bairroGrupo","groupMembros","membrosGrupo"].forEach(id => { if ($(id)) $(id).value = ""; });
    render();
    alert("Grupo salvo.");
  }

  function parseLine(line){
    const m = line.match(/https?:\/\/(?:www\.)?(?:facebook|fb)\.com\/groups\/[^\s|<>"')]+/i) ||
              line.match(/(?:www\.)?(?:facebook|fb)\.com\/groups\/[^\s|<>"')]+/i);
    const url = m ? normUrl(m[0]) : "";
    const clean = line.replace(m ? m[0] : "", "").replace(/[–—-]+/g, "|");
    const parts = clean.split("|").map(x => x.trim()).filter(Boolean);
    const defaultBairro = getVal(["bulkBairro","bulkRegionDefault"]) || getVal(["bulkBairroSelect"]);
    return { name: parts[0] || "Grupo Facebook", url, bairro: parts[1] || parts[2] || defaultBairro, regiao: "" };
  }

  function importBulk(){
    const box = $("bulkText") || $("bulkGroups") || $("hunter2PasteBox");
    if (!box) return alert("Campo de importação não encontrado.");
    const lines = String(box.value || "").split(/\n+/).map(x=>x.trim()).filter(Boolean);
    let saved = 0, repeated = 0, ignored = 0;
    lines.forEach(line => {
      const g = parseLine(line);
      if (!g.url || !g.bairro) { ignored++; return; }
      if (state.groups.some(x => normUrl(x.url) === g.url)) { repeated++; return; }
      state.groups.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        name: g.name,
        url: g.url,
        bairro: g.bairro,
        regiao: g.regiao,
        status: "pendente",
        createdAt: new Date().toISOString(),
        postedAt: null
      });
      saved++;
    });
    box.value = "";
    render();
    alert(`${saved} salvos. ${repeated} repetidos. ${ignored} ignorados.`);
  }

  function saveModels(){
    state.models = [1,2,3,4].map(i => getVal([`model${i}`,`modelo${i}`,`postModel${i}`]));
    render();
    alert("Modelos salvos.");
  }

  function startCycle(){
    const limit = Number(($("cycleLimit")?.value || 20));
    state.cycle = filteredGroups().filter(g => g.status !== "postado").slice(0, limit || 20);
    state.index = -1;
    state.current = null;
    render();
    alert(`${state.cycle.length} grupos no ciclo.`);
  }

  function nextGroup(){
    if (!state.cycle.length) startCycle();
    if (!state.cycle.length) return alert("Nenhum grupo disponível.");
    state.index += 1;
    if (state.index >= state.cycle.length) return alert("Fim do ciclo.");
    state.current = state.cycle[state.index];
    state.current.status = "aberto";
    window.open(state.current.url, "_blank");
    render();
  }

  function markPosted(){
    if (!state.current) return alert("Abra um grupo primeiro.");
    const id = state.current.id;
    const g = state.groups.find(x => x.id === id);
    if (g) {
      g.status = "postado";
      g.postedAt = new Date().toISOString();
    }
    state.current.status = "postado";
    state.current.postedAt = new Date().toISOString();
    render();
    alert("Marcado como postado.");
  }

  function addBairro(){
    const nome = getVal(["newBairro","newRegion"]);
    const regiao = getVal(["newRegiao","newZone"]) || "Sem região";
    const meta = Number(getVal(["newMeta","newGoal"]) || 50);
    if (!nome) return alert("Informe o bairro.");
    if (state.bairros.some(b => String(b.nome).toLowerCase() === nome.toLowerCase())) return alert("Bairro já existe.");
    state.bairros.push({ nome, regiao, meta });
    ["newBairro","newRegion"].forEach(id => { if ($(id)) $(id).value = ""; });
    render();
  }

  function deleteGroup(id){
    if (!confirm("Excluir grupo?")) return;
    state.groups = state.groups.filter(g => g.id !== id);
    render();
  }

  async function copyText(text){
    await navigator.clipboard.writeText(text || "").catch(()=>{});
    alert("Copiado.");
  }

  function saveSettings(){
    state.ignoredIp = getVal(["ignoredIp","adminIgnoredIp","adminIgnoredIp21"]);
    render();
    alert("Configuração salva.");
  }

  function resetClicks(){
    if (!confirm("Zerar cliques?")) return;
    state.clicks = [];
    render();
  }

  function exportData(){
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state,null,2)], {type:"application/json"}));
    a.download = "ideal-toldos-backup.json";
    a.click();
  }

  function importData(file){
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        state = Object.assign(state, data);
        render();
        alert("Backup importado.");
      } catch(e) {
        alert("Arquivo inválido.");
      }
    };
    reader.readAsText(file);
  }

  function clearForm(){
    qsa("input, textarea").forEach(el => {
      if (["groupName","groupUrl","groupBairro","groupMembros","bulkText","bulkGroups"].includes(el.id)) el.value = "";
    });
  }

  function bind(){
    qsa("[data-page]").forEach(btn => btn.addEventListener("click", e => { e.preventDefault(); showPage(btn.dataset.page); }));
    qsa("[data-go]").forEach(btn => btn.addEventListener("click", e => { e.preventDefault(); showPage(btn.dataset.go); }));

    [
      ["saveGroup", saveGroup], ["addGroupBtn", saveGroup], ["salvarGrupo", saveGroup],
      ["bulkImport", importBulk], ["saveBulkGroupsBtn", importBulk], ["hunter2SaveBtn", importBulk],
      ["saveModels", saveModels], ["saveModelsBtn", saveModels],
      ["startCycle", startCycle], ["nextGroup", nextGroup], ["dashNext", nextGroup],
      ["markPosted", markPosted], ["dashPosted", markPosted],
      ["copyMsg", () => copyText(currentMessage())], ["dashCopy", () => copyText(currentMessage())],
      ["seedRegions", () => seedBairros(true)], ["loadDefaultRegionsBtn", () => seedBairros(true)],
      ["addBairro", addBairro], ["addRegionBtn", addBairro],
      ["clearGroup", clearForm], ["clearGroupFormBtn", clearForm],
      ["saveSettings", saveSettings], ["saveIgnoredIpBtn", saveSettings], ["saveIgnoredIp21", saveSettings],
      ["resetClicks", resetClicks], ["resetClicks21", resetClicks],
      ["exportData", exportData], ["exportGroupsBtn", exportData],
      ["resetCycle", () => { state.cycle=[]; state.index=-1; state.current=null; render(); }]
    ].forEach(([id, fn]) => { if ($(id)) $(id).onclick = fn; });

    ["groupFilter","filterGroup"].forEach(id => { if ($(id)) $(id).oninput = renderGroups; });

    ["groupBairroSelect","grupoBairroSelect"].forEach(id => {
      if ($(id)) $(id).onchange = e => { if ($("groupBairro")) $("groupBairro").value = e.target.value; if ($("groupRegion")) $("groupRegion").value = e.target.value; };
    });

    ["bulkBairroSelect"].forEach(id => {
      if ($(id)) $(id).onchange = e => { if ($("bulkBairro")) $("bulkBairro").value = e.target.value; if ($("bulkRegionDefault")) $("bulkRegionDefault").value = e.target.value; };
    });

    const importInput = $("importData") || $("importGroupsFile");
    if (importInput) importInput.onchange = e => e.target.files[0] && importData(e.target.files[0]);

    document.body.addEventListener("click", e => {
      const del = e.target.closest("[data-del-group]");
      if (del) deleteGroup(del.dataset.delGroup);
      const copy = e.target.closest("[data-copy]");
      if (copy) copyText(copy.dataset.copy);
    });
  }

  window.idealAdminFix = {state, render, saveGroup, importBulk, startCycle, nextGroup, markPosted};

  document.addEventListener("DOMContentLoaded", () => {
    load();
    bind();
    render();
    const last = localStorage.getItem("ideal_last_page_fix") || "dashboard";
    if ($(last)) showPage(last);
  });
})();
