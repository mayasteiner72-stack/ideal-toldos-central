
/* FIX CONTAGEM EXATA POR BAIRRO */
(function(){
  const MASTER_KEY = "ideal_admin_master_v1";
  const FIX_KEY = "ideal_admin_fix_v1";

  const DEFAULT_BAIRROS = [
    ["Zona Oeste",["Campo Grande","Cosmos","Paciência","Santa Cruz","Bangu","Realengo","Praça Seca","Taquara","Jacarepaguá","Guaratiba","Recreio","Barra da Tijuca","Curicica","Freguesia","Pechincha"]],
    ["Zona Norte",["Méier","Madureira","Irajá","Tijuca","Vila Isabel","Penha","Pavuna","Cascadura","Engenho de Dentro","Bonsucesso"]],
    ["Zona Sul",["Copacabana","Ipanema","Leblon","Botafogo","Flamengo","Laranjeiras","Catete"]],
    ["Centro",["Centro","Lapa","Cidade Nova","Estácio","Santa Teresa"]],
    ["Baixada",["Nova Iguaçu","Duque de Caxias","Belford Roxo","São João de Meriti","Nilópolis"]]
  ];

  function read(key){
    try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch(e){ return {}; }
  }

  function write(key, data){
    localStorage.setItem(key, JSON.stringify(data));
  }

  function cleanText(s){
    return String(s || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9\s]/g," ")
      .replace(/\s+/g," ")
      .trim();
  }

  function bairroFromGroup(g){
    return cleanText(g.bairro || g.region || g.regiao || g.area || "");
  }

  function sync(){
    const master = read(MASTER_KEY);
    const fix = read(FIX_KEY);

    const all = []
      .concat(Array.isArray(master.groups) ? master.groups : [])
      .concat(Array.isArray(fix.groups) ? fix.groups : []);

    const groupsMap = new Map();
    all.forEach(g => {
      const url = String(g.url || g.link || "").replace(/\/$/,"");
      if(!url) return;
      groupsMap.set(url, {
        ...g,
        bairro: g.bairro || g.region || g.regiao || "",
        region: g.bairro || g.region || g.regiao || ""
      });
    });

    const groups = Array.from(groupsMap.values());

    let bairros = Array.isArray(master.bairros) ? master.bairros : [];
    if(!bairros.length && Array.isArray(fix.bairros)) bairros = fix.bairros;
    if(!bairros.length){
      bairros = [];
      DEFAULT_BAIRROS.forEach(([regiao, arr]) => arr.forEach(nome => bairros.push({nome, regiao, meta:12})));
    }

    // força meta padrão 12 sem mudar a contagem
    bairros = bairros.map(b => ({
      nome: b.nome || b.name || b.bairro || "",
      regiao: b.regiao || b.region || b.zone || "",
      meta: Number(b.meta || b.goal || 12)
    })).filter(b => b.nome);

    master.groups = groups;
    master.bairros = bairros;
    fix.groups = groups;
    fix.bairros = bairros;
    write(MASTER_KEY, master);
    write(FIX_KEY, fix);

    return {groups, bairros};
  }

  function countExact(groups){
    const counts = {};
    groups.forEach(g => {
      const key = bairroFromGroup(g);
      if(!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  function renderRegions(){
    const {groups, bairros} = sync();
    const counts = countExact(groups);

    const html = bairros.map(b => {
      const key = cleanText(b.nome);
      const qtd = counts[key] || 0;
      const meta = Number(b.meta || 12);
      const pct = Math.min(100, Math.round((qtd / meta) * 100));

      return `
        <div class="row data-row bairro-row-fix" data-bairro="${key}">
          <header><b>${b.nome}</b><span>${qtd} / ${meta}</span></header>
          <small>${b.regiao}</small>
          <div class="bar"><span style="width:${pct}%"></span></div>
        </div>
      `;
    }).join("");

    ["dashRegions","dashBairros","regioesList","regionsList"].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.innerHTML = html;
    });

    const totalGroups = groups.length;
    const totalBairrosComGrupo = Object.values(counts).filter(v => v > 0).length;
    [
      ["statGroups", totalGroups],
      ["totalGroups", totalGroups],
      ["groupsCount", totalGroups],
      ["statBairros", totalBairrosComGrupo],
      ["totalRegions", totalBairrosComGrupo]
    ].forEach(([id,val]) => {
      const el = document.getElementById(id);
      if(el) el.textContent = val;
    });
  }

  function patchAfterSave(){
    const buttons = Array.from(document.querySelectorAll("button,a"));
    buttons.forEach(btn => {
      const t = String(btn.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      if(
        t.includes("salvar grupo") ||
        t.includes("salvar selecionados") ||
        t.includes("importar") ||
        t.includes("excluir grupo") ||
        t.includes("marcar como postado")
      ){
        const old = btn.onclick;
        btn.onclick = function(e){
          let r;
          if(typeof old === "function") r = old.call(this,e);
          setTimeout(renderRegions, 200);
          setTimeout(renderRegions, 800);
          return r;
        };
      }
    });
  }

  function boot(){
    renderRegions();
    patchAfterSave();
    setInterval(renderRegions, 1500);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.renderContagemBairroExata = renderRegions;
})();
