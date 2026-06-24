
/* ADMIN MASTER FIX - Ideal Toldos
   Faz o painel funcionar independente dos scripts antigos.
*/
(function(){
  const KEY = "ideal_admin_master_v1";
  const $ = (id) => document.getElementById(id);
  const qsa = (s) => Array.from(document.querySelectorAll(s));
  const esc = (s) => String(s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  const DEFAULT_BAIRROS = [
    ["Zona Oeste",["Campo Grande","Cosmos","Paciência","Santa Cruz","Bangu","Realengo","Praça Seca","Taquara","Jacarepaguá","Guaratiba","Recreio","Barra da Tijuca","Curicica","Freguesia","Pechincha"]],
    ["Zona Norte",["Méier","Madureira","Irajá","Tijuca","Vila Isabel","Penha","Pavuna","Cascadura","Engenho de Dentro","Bonsucesso"]],
    ["Zona Sul",["Copacabana","Ipanema","Leblon","Botafogo","Flamengo","Laranjeiras","Catete"]],
    ["Centro",["Centro","Lapa","Cidade Nova","Estácio","Santa Teresa"]],
    ["Baixada",["Nova Iguaçu","Duque de Caxias","Belford Roxo","São João de Meriti","Nilópolis"]]
  ];

  let state = {
    groups: [],
    bairros: [],
    models: [
      "🏠 Proteja e valorize seu imóvel com quem entende do assunto!\n\n✅ Toldos retráteis e fixos\n✅ Coberturas de policarbonato\n✅ ACM e letreiros\n✅ Instalação profissional\n\n📲 Solicite seu orçamento: {LINK}",
      "",
      "",
      ""
    ],
    cycle: [],
    index: -1,
    current: null,
    clicks: [],
    ignoredIp: ""
  };

  function normUrl(url){
    url = String(url || "").trim();
    if(!url) return "";
    if(!/^https?:\/\//i.test(url)) url = "https://" + url;
    try{
      const u = new URL(url);
      return u.origin + u.pathname.replace(/\/$/,"");
    }catch(e){ return ""; }
  }

  function load(){
    try{ state = Object.assign(state, JSON.parse(localStorage.getItem(KEY) || "{}")); }catch(e){}
    if(!Array.isArray(state.groups)) state.groups = [];
    if(!Array.isArray(state.bairros)) state.bairros = [];
    if(!Array.isArray(state.models)) state.models = ["","","",""];
    if(!Array.isArray(state.cycle)) state.cycle = [];
    if(!Array.isArray(state.clicks)) state.clicks = [];
    seedBairros(false);
  }

  function save(){
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function seedBairros(alertar){
    const map = new Map(state.bairros.map(b => [String(b.nome).toLowerCase(), b]));
    DEFAULT_BAIRROS.forEach(([regiao, bairros]) => bairros.forEach(nome => {
      if(!map.has(nome.toLowerCase())) state.bairros.push({nome, regiao, meta:50});
    }));
    save();
    if(alertar) alert("Bairros atualizados.");
  }

  function pageMapFromText(text){
    text = String(text||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\w\s]/g,"").trim();
    if(text.includes("dashboard")) return "dashboard";
    if(text.includes("banco") || text === "grupos") return "grupos";
    if(text.includes("regiao")) return "regioes";
    if(text.includes("modelo")) return "modelos";
    if(text.includes("ciclo")) return "ciclo";
    if(text.includes("relatorio")) return "relatorios";
    if(text.includes("clique")) return "relatorios";
    if(text.includes("galeria")) return "galeria";
    if(text.includes("cliente")) return "clientes";
    if(text.includes("config")) return "config";
    if(text.includes("postagen")) return "postagens";
    return "";
  }

  function openPage(page){
    qsa("section[id], .page").forEach(el => {
      if(["dashboard","grupos","regioes","modelos","ciclo","relatorios","galeria","clientes","config","postagens"].includes(el.id)){
        el.classList.add("page");
        el.classList.remove("active");
        el.style.display = "none";
      }
    });

    const target = $(page);
    if(target){
      target.classList.add("page","active");
      target.style.display = "block";
    }

    qsa("[data-page],button,a,.nav,.nav-item").forEach(el => {
      el.classList.remove("active");
      const p = el.dataset.page || pageMapFromText(el.textContent);
      if(p === page) el.classList.add("active");
    });

    const title = $("pageTitle") || document.querySelector("main h1");
    const activeBtn = qsa("[data-page],button,a,.nav,.nav-item").find(el => (el.dataset.page || pageMapFromText(el.textContent)) === page);
    if(title && activeBtn) title.textContent = activeBtn.textContent.replace(/[^\wÀ-ÿ\s]/g,"").trim();

    localStorage.setItem("ideal_admin_last_page_master", page);
    render();
  }

  function fillSelects(){
    const opts = '<option value="">Todos os bairros</option>' + state.bairros
      .slice().sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"))
      .map(b=>`<option value="${esc(b.nome)}">${esc(b.nome)}</option>`).join("");

    qsa("select").forEach(sel => {
      const txt = (sel.id + " " + sel.name + " " + sel.closest(".card,.panel,section")?.textContent || "").toLowerCase();
      if(txt.includes("bairro") || txt.includes("regiao") || txt.includes("ciclo")){
        if(!sel.dataset.adminFilled || sel.dataset.adminFilled === "bairros"){
          const v = sel.value;
          sel.innerHTML = opts;
          sel.value = v;
          sel.dataset.adminFilled = "bairros";
        }
      }
    });
  }

  function getField(names){
    for(const name of names){
      const el = $(name);
      if(el) return el;
    }
    return null;
  }

  function getValue(names){
    const el = getField(names);
    return el ? String(el.value || "").trim() : "";
  }

  function setValue(names, val){
    const el = getField(names);
    if(el) el.value = val;
  }

  function bairroCounts(){
    const out = {};
    state.groups.forEach(g => {
      const b = g.bairro || g.region || "Sem bairro";
      out[b] = (out[b] || 0) + 1;
    });
    return out;
  }

  function tracking(g){
    return location.origin + "/?src=" + encodeURIComponent(g.id) + "&bairro=" + encodeURIComponent(g.bairro || "");
  }

  function renderStats(){
    const today = new Date().toISOString().slice(0,10);
    const posted = state.groups.filter(g => String(g.postedAt || "").slice(0,10) === today).length;
    const counts = bairroCounts();

    const pairs = {
      statGroups: state.groups.length,
      totalGroups: state.groups.length,
      groupsCount: state.groups.length,
      statBairros: Object.keys(counts).length,
      totalRegions: Object.keys(counts).length,
      statPosted: posted,
      todayPosted: posted,
      statClicks: state.clicks.length,
      totalClicks: state.clicks.length
    };
    Object.entries(pairs).forEach(([id,v]) => { if($(id)) $(id).textContent = v; });
  }

  function renderRegions(){
    const counts = bairroCounts();
    const html = state.bairros.map(b => {
      const qtd = counts[b.nome] || 0;
      const meta = Number(b.meta || 50);
      const pct = Math.min(100, Math.round(qtd / meta * 100));
      return `<div class="row data-row">
        <header><b>${esc(b.nome)}</b><span>${qtd}/${meta}</span></header>
        <small>${esc(b.regiao)}</small>
        <div class="bar"><span style="width:${pct}%"></span></div>
      </div>`;
    }).join("");

    ["regionsList","regioesList","dashRegions","dashBairros"].forEach(id => { if($(id)) $(id).innerHTML = html || "<p>Nenhum bairro.</p>"; });
  }

  function renderGroups(){
    const filter = getValue(["groupFilter","filterGroup"]).toLowerCase();
    const groups = state.groups.filter(g => `${g.name} ${g.url} ${g.bairro}`.toLowerCase().includes(filter));
    const html = groups.map(g => `<div class="row data-row">
      <header><b>${esc(g.name)}</b><span>${esc(g.bairro || "")}</span></header>
      <small>${esc(g.url)}</small>
      <small class="track-line">Link rastreável: ${esc(tracking(g))}</small>
      <div class="actions">
        <a class="btn blue" href="${esc(g.url)}" target="_blank">Abrir grupo</a>
        <button class="btn blue" type="button" data-copy="${esc(tracking(g))}">Copiar link rastreável</button>
        <button class="btn red" type="button" data-delete-group="${esc(g.id)}">Excluir</button>
      </div>
    </div>`).join("");

    ["groupsList","gruposList","groupList"].forEach(id => { if($(id)) $(id).innerHTML = html || "<p>Nenhum grupo cadastrado.</p>"; });
  }

  function renderModels(){
    state.models.forEach((m,i) => {
      ["model","modelo","postModel"].forEach(prefix => {
        const el = $(prefix + (i+1));
        if(el && document.activeElement !== el) el.value = m || "";
      });
    });
  }

  function currentMessage(){
    const models = state.models.filter(m => String(m||"").trim());
    if(!models.length) return "";
    return models[Math.max(0,state.index) % models.length];
  }

  function filteredGroups(){
    const bairro = getValue(["cycleBairro","dashBairro"]);
    return state.groups.filter(g => !bairro || g.bairro === bairro || g.region === bairro);
  }

  function renderCycle(){
    const list = state.cycle.length ? state.cycle : filteredGroups();
    const html = list.map(g => `<div class="row data-row">
      <header><b>${esc(g.name)}</b><span>${esc(g.status || "pendente")}</span></header>
      <small>${esc(g.bairro || "")} · ${esc(g.url)}</small>
    </div>`).join("");

    ["cycleList","filaCiclo"].forEach(id => { if($(id)) $(id).innerHTML = html || "<p>Nenhum grupo no ciclo.</p>"; });

    const cur = state.current
      ? `<b>${esc(state.current.name)}</b><br><small>${esc(state.current.bairro)} · ${esc(state.current.url)}</small>`
      : "Nenhum grupo no ciclo.";

    ["grupoAtual","currentGroup","dashCurrentGroup","dashGrupoAtual"].forEach(id => { if($(id)) $(id).innerHTML = cur; });
    ["mensagemAtual","currentMessage","dashMessage","dashMensagem"].forEach(id => { if($(id)) $(id).value = currentMessage(); });
  }

  function renderClicks(){
    const byB = {}, byG = {};
    state.clicks.forEach(c => {
      const b = c.bairro || "Sem bairro";
      const g = c.groupName || "Sem grupo";
      byB[b] = (byB[b]||0)+1;
      byG[g] = (byG[g]||0)+1;
    });

    const topB = Object.entries(byB).sort((a,b)=>b[1]-a[1])[0];
    const topG = Object.entries(byG).sort((a,b)=>b[1]-a[1])[0];

    if($("clickTotal")) $("clickTotal").textContent = state.clicks.length;
    if($("clickBairroTop")) $("clickBairroTop").textContent = topB ? topB[0] : "-";
    if($("clickGrupoTop")) $("clickGrupoTop").textContent = topG ? topG[0] : "-";

    const hb = Object.entries(byB).map(([k,v]) => `<div class="row"><header><b>${esc(k)}</b><span>${v}</span></header></div>`).join("");
    const hg = Object.entries(byG).map(([k,v]) => `<div class="row"><header><b>${esc(k)}</b><span>${v}</span></header></div>`).join("");

    ["clicksBairro","clicksByRegion"].forEach(id => { if($(id)) $(id).innerHTML = hb || "<p>Nenhum clique.</p>"; });
    ["clicksGrupo","clicksByGroup"].forEach(id => { if($(id)) $(id).innerHTML = hg || "<p>Nenhum clique.</p>"; });
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

  function saveGroup(){
    const name = getValue(["groupName","nomeGrupo","newGroupName"]) || "Grupo Facebook";
    const url = normUrl(getValue(["groupUrl","linkGrupo","newGroupUrl"]));
    const bairro = getValue(["groupBairro","bairroGrupo","groupRegion","groupBairroSelect"]);
    const membros = getValue(["groupMembros","membrosGrupo"]);
    if(!url || !bairro) return alert("Preencha link e bairro.");
    if(state.groups.some(g => normUrl(g.url) === url)) return alert("Grupo repetido.");

    state.groups.push({
      id: Date.now().toString(36)+Math.random().toString(36).slice(2),
      name, url, bairro, region:bairro, membros,
      status:"pendente",
      createdAt:new Date().toISOString(),
      postedAt:null
    });
    render();
    alert("Grupo salvo.");
  }

  function parseGroupLine(line){
    const m = line.match(/https?:\/\/(?:www\.)?(?:facebook|fb)\.com\/groups\/[^\s|<>"')]+/i) ||
              line.match(/(?:www\.)?(?:facebook|fb)\.com\/groups\/[^\s|<>"')]+/i);
    const url = m ? normUrl(m[0]) : "";
    const clean = line.replace(m ? m[0] : "").replace(/[–—-]+/g,"|");
    const p = clean.split("|").map(x=>x.trim()).filter(Boolean);
    const bairro = p[1] || p[2] || getValue(["bulkBairro","bulkRegionDefault","bulkBairroSelect","hunter2DefaultRegion"]);
    return {name:p[0] || "Grupo Facebook", url, bairro};
  }

  function bulkImport(){
    const box = getField(["bulkText","bulkGroups","hunter2PasteBox"]);
    if(!box) return alert("Campo de links não encontrado.");
    const lines = String(box.value||"").split(/\n+/).map(x=>x.trim()).filter(Boolean);
    let saved=0, rep=0, ign=0;
    lines.forEach(line => {
      const g = parseGroupLine(line);
      if(!g.url || !g.bairro){ ign++; return; }
      if(state.groups.some(x => normUrl(x.url) === g.url)){ rep++; return; }
      state.groups.push({
        id: Date.now().toString(36)+Math.random().toString(36).slice(2),
        name:g.name, url:g.url, bairro:g.bairro, region:g.bairro,
        status:"pendente", createdAt:new Date().toISOString(), postedAt:null
      });
      saved++;
    });
    box.value = "";
    render();
    alert(`${saved} salvos. ${rep} repetidos. ${ign} ignorados.`);
  }

  function saveModels(){
    state.models = [1,2,3,4].map(i => getValue([`model${i}`,`modelo${i}`,`postModel${i}`]));
    render();
    alert("Modelos salvos.");
  }

  function startCycle(){
    const limit = Number(getValue(["cycleLimit"]) || 20);
    state.cycle = filteredGroups().filter(g => g.status !== "postado").slice(0,limit);
    state.index = -1;
    state.current = null;
    render();
    alert(`${state.cycle.length} grupos carregados no ciclo.`);
  }

  function nextGroup(){
    if(!state.cycle.length) startCycle();
    if(!state.cycle.length) return alert("Nenhum grupo disponível.");
    state.index++;
    if(state.index >= state.cycle.length) return alert("Fim do ciclo.");
    state.current = state.cycle[state.index];
    state.current.status = "aberto";
    window.open(state.current.url,"_blank");
    render();
  }

  function markPosted(){
    if(!state.current) return alert("Abra um grupo primeiro.");
    const g = state.groups.find(x => x.id === state.current.id);
    if(g){
      g.status = "postado";
      g.postedAt = new Date().toISOString();
    }
    state.current.status = "postado";
    state.current.postedAt = new Date().toISOString();
    render();
    alert("Marcado como postado.");
  }

  async function copyText(text){
    await navigator.clipboard.writeText(text || "").catch(()=>{});
    alert("Copiado.");
  }

  function addBairro(){
    const nome = getValue(["newBairro","newRegion"]);
    const regiao = getValue(["newRegiao","newZone"]) || "Sem região";
    const meta = Number(getValue(["newMeta","newGoal"]) || 50);
    if(!nome) return alert("Informe o bairro.");
    if(state.bairros.some(b => b.nome.toLowerCase() === nome.toLowerCase())) return alert("Bairro já existe.");
    state.bairros.push({nome,regiao,meta});
    render();
  }

  function resetCycle(){
    state.cycle = [];
    state.index = -1;
    state.current = null;
    render();
  }

  function bind(){
    qsa("[data-page],button,a,.nav,.nav-item").forEach(el => {
      const page = el.dataset.page || pageMapFromText(el.textContent);
      if(page){
        el.onclick = e => { e.preventDefault(); e.stopPropagation(); openPage(page); return false; };
      }
    });

    qsa("button,a").forEach(btn => {
      const t = String(btn.textContent||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      if(t.includes("salvar grupo")) btn.onclick = e => { e.preventDefault(); saveGroup(); };
      if(t.includes("importar") || t.includes("salvar selecionados")) btn.onclick = e => { e.preventDefault(); bulkImport(); };
      if(t.includes("salvar modelos")) btn.onclick = e => { e.preventDefault(); saveModels(); };
      if(t.includes("iniciar ciclo")) btn.onclick = e => { e.preventDefault(); startCycle(); };
      if(t.includes("proximo grupo") || t.includes("abrir proximo")) btn.onclick = e => { e.preventDefault(); nextGroup(); };
      if(t.includes("copiar mensagem")) btn.onclick = e => { e.preventDefault(); copyText(currentMessage()); };
      if(t.includes("marcar") && t.includes("postado")) btn.onclick = e => { e.preventDefault(); markPosted(); };
      if(t.includes("zerar ciclo")) btn.onclick = e => { e.preventDefault(); resetCycle(); };
      if(t.includes("atualizar bairros")) btn.onclick = e => { e.preventDefault(); seedBairros(true); render(); };
      if(t.includes("adicionar bairro")) btn.onclick = e => { e.preventDefault(); addBairro(); };
    });

    document.body.addEventListener("click", e => {
      const del = e.target.closest("[data-delete-group]");
      if(del){
        state.groups = state.groups.filter(g => g.id !== del.dataset.deleteGroup);
        render();
      }
      const cp = e.target.closest("[data-copy]");
      if(cp) copyText(cp.dataset.copy);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    load();
    bind();
    render();
    const last = localStorage.getItem("ideal_admin_last_page_master") || "dashboard";
    openPage($(last) ? last : "dashboard");
    setTimeout(bind,500);
    setTimeout(bind,1500);
  });

  window.adminMasterIdeal = {state,render,saveGroup,bulkImport,startCycle,nextGroup,markPosted};
})();
