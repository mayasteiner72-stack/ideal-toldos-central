
// FIX EXTRATOR DE GRUPOS - CAÇADOR 2.0
(function(){
  let extractedGroupsFix = [];

  const KEY = "ideal_admin_fix_v1";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function getState(){
    if(window.idealAdminFix && window.idealAdminFix.state) return window.idealAdminFix.state;
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch(e) { return {}; }
  }

  function saveState(state){
    localStorage.setItem(KEY, JSON.stringify(state));
    if(window.idealAdminFix && typeof window.idealAdminFix.render === "function"){
      window.idealAdminFix.render();
    }
  }

  function getPasteBox(){
    return $("hunter2PasteBox") || $("bulkGroups") || $("bulkText") ||
      Array.from(document.querySelectorAll("textarea")).find(t => 
        String(t.placeholder || "").toLowerCase().includes("cole aqui os links")
        || String(t.placeholder || "").toLowerCase().includes("facebook.com/groups")
        || String(t.value || "").includes("facebook.com")
      );
  }

  function getBairroInput(){
    return $("hunter2DefaultRegion") || $("bulkRegionDefault") || $("bulkBairro") || $("groupBairro") ||
      Array.from(document.querySelectorAll("input")).find(i => 
        String(i.placeholder || "").toLowerCase().includes("bairro padrão")
        || String(i.placeholder || "").toLowerCase().includes("bairro")
      );
  }

  function getResultsBox(){
    let box = $("hunter2Results") || $("extractResultsFix");
    if(box) return box;

    const panel = Array.from(document.querySelectorAll(".panel,.card,section,div")).find(el =>
      String(el.textContent || "").toLowerCase().includes("caçador de links")
      || String(el.textContent || "").toLowerCase().includes("cacador de links")
    );

    box = document.createElement("div");
    box.id = "extractResultsFix";
    box.className = "extract-results-fix";

    if(panel) panel.appendChild(box);
    else document.body.appendChild(box);

    return box;
  }

  function decodeMaybe(s){
    let out = String(s || "");
    for(let i=0;i<3;i++){
      try {
        const d = decodeURIComponent(out);
        if(d === out) break;
        out = d;
      } catch(e) { break; }
    }
    return out;
  }

  function normalizeGroupUrl(raw){
    raw = decodeMaybe(String(raw || "").trim());
    raw = raw.replace(/&amp;/g, "&");

    // Google redirect: google.com/url?q=https://facebook.com/groups/...
    try{
      const u = new URL(raw.startsWith("http") ? raw : "https://" + raw);
      const q = u.searchParams.get("q") || u.searchParams.get("url") || u.searchParams.get("u");
      if(q && /facebook\.com\/groups\//i.test(q)) raw = decodeMaybe(q);
    }catch(e){}

    // Facebook redirect: l.facebook.com/l.php?u=...
    try{
      const u = new URL(raw.startsWith("http") ? raw : "https://" + raw);
      const q = u.searchParams.get("u");
      if(q && /facebook\.com\/groups\//i.test(q)) raw = decodeMaybe(q);
    }catch(e){}

    raw = raw.replace(/^https?:\/\/lm\.facebook\.com\/l\.php\?u=/i, "");
    raw = raw.replace(/^https?:\/\/l\.facebook\.com\/l\.php\?u=/i, "");
    raw = decodeMaybe(raw);

    if(!/^https?:\/\//i.test(raw)) raw = "https://" + raw;

    try{
      const u = new URL(raw);
      if(!/(^|\.)facebook\.com$/i.test(u.hostname) && !/(^|\.)fb\.com$/i.test(u.hostname)) return "";

      const path = u.pathname.replace(/\/+$/,"");
      const match = path.match(/\/groups\/([^/?#]+)/i);
      if(!match) return "";

      return "https://www.facebook.com/groups/" + match[1];
    }catch(e){
      return "";
    }
  }

  function nameFromUrl(url){
    const part = String(url).split("/groups/")[1] || "";
    const clean = part.split(/[/?#]/)[0];
    if(!clean || /^\d+$/.test(clean)) return "Grupo Facebook";
    return clean.replace(/[-_\.]+/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  function extractLinks(){
    const box = getPasteBox();
    if(!box) return alert("Campo para colar links não encontrado.");

    const text = String(box.value || "");
    const bairro = String(getBairroInput()?.value || "").trim();

    const candidates = [];

    // Links normais
    const urlRegex = /(?:https?:\/\/)?(?:www\.|m\.)?(?:facebook|fb)\.com\/groups\/[^\s<>"')]+/gi;
    for(const m of text.matchAll(urlRegex)) candidates.push(m[0]);

    // Google/Facebook redirects e URLs gerais que contenham facebook.com/groups encoded
    const anyUrlRegex = /https?:\/\/[^\s<>"')]+/gi;
    for(const m of text.matchAll(anyUrlRegex)){
      const raw = decodeMaybe(m[0]);
      if(/facebook\.com\/groups\//i.test(raw) || /facebook\.com%2Fgroups%2F/i.test(m[0])) candidates.push(m[0]);
    }

    const unique = new Map();
    candidates.forEach(c => {
      const url = normalizeGroupUrl(c);
      if(url && !unique.has(url)){
        unique.set(url, {
          id: "ex_" + Math.random().toString(36).slice(2),
          name: nameFromUrl(url),
          url,
          bairro,
          selected: true
        });
      }
    });

    extractedGroupsFix = Array.from(unique.values());
    renderExtracted();

    if(!extractedGroupsFix.length){
      if(/google\.com\/search/i.test(text)){
        alert("Você colou links de busca do Google. Abra a busca no Google, copie os links dos grupos Facebook encontrados e cole aqui.");
      }else{
        alert("Nenhum link de grupo encontrado. Cole links no formato facebook.com/groups/...");
      }
    }
  }

  function renderExtracted(){
    const result = getResultsBox();
    if(!result) return;

    if(!extractedGroupsFix.length){
      result.innerHTML = '<p>Nenhum link extraído ainda.</p>';
      return;
    }

    result.innerHTML = `
      <div class="extract-summary-fix">${extractedGroupsFix.length} grupo(s) extraído(s)</div>
      ${extractedGroupsFix.map((g, i) => `
        <div class="extract-row-fix">
          <input type="checkbox" ${g.selected ? "checked" : ""} data-ex-check="${i}">
          <div>
            <input class="extract-name-fix" value="${esc(g.name)}" data-ex-name="${i}">
            <small>${esc(g.url)}</small>
            <input class="extract-bairro-fix" value="${esc(g.bairro)}" placeholder="Bairro" data-ex-bairro="${i}">
          </div>
        </div>
      `).join("")}
    `;

    result.querySelectorAll("[data-ex-check]").forEach(el => {
      el.onchange = () => extractedGroupsFix[Number(el.dataset.exCheck)].selected = el.checked;
    });

    result.querySelectorAll("[data-ex-name]").forEach(el => {
      el.oninput = () => extractedGroupsFix[Number(el.dataset.exName)].name = el.value.trim() || "Grupo Facebook";
    });

    result.querySelectorAll("[data-ex-bairro]").forEach(el => {
      el.oninput = () => extractedGroupsFix[Number(el.dataset.exBairro)].bairro = el.value.trim();
    });
  }

  function selectAll(){
    if(!extractedGroupsFix.length) extractLinks();
    extractedGroupsFix.forEach(g => g.selected = true);
    renderExtracted();
  }

  function saveSelected(){
    if(!extractedGroupsFix.length) extractLinks();

    const state = getState();
    if(!Array.isArray(state.groups)) state.groups = [];

    let saved = 0, repeated = 0, ignored = 0;

    extractedGroupsFix.filter(g => g.selected).forEach(g => {
      if(!g.url || !g.bairro){ ignored++; return; }
      if(state.groups.some(x => String(x.url || "").replace(/\/$/,"") === g.url.replace(/\/$/,""))){ repeated++; return; }

      state.groups.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        name: g.name || "Grupo Facebook",
        url: g.url,
        bairro: g.bairro,
        region: g.bairro,
        regiao: "",
        status: "pendente",
        createdAt: new Date().toISOString(),
        postedAt: null,
        clicks: 0
      });
      saved++;
    });

    saveState(state);

    const box = getPasteBox();
    if(box) box.value = "";
    extractedGroupsFix = [];
    renderExtracted();

    alert(`${saved} salvos. ${repeated} repetidos. ${ignored} ignorados.`);
  }

  function clearAll(){
    extractedGroupsFix = [];
    const box = getPasteBox();
    if(box) box.value = "";
    renderExtracted();
  }

  function bind(){
    Array.from(document.querySelectorAll("button,a")).forEach(btn => {
      const t = String(btn.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");

      if(t.includes("extrair links")){
        btn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); extractLinks(); return false; };
      }

      if(t.includes("selecionar todos")){
        btn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); selectAll(); return false; };
      }

      if(t.includes("salvar selecionados")){
        btn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); saveSelected(); return false; };
      }

      if(t.trim() === "limpar"){
        btn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); clearAll(); return false; };
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bind();
    renderExtracted();
    setTimeout(bind, 700);
    setTimeout(bind, 1600);
  });

  window.extrairGruposIdeal = extractLinks;
  window.salvarGruposExtraidosIdeal = saveSelected;
})();
