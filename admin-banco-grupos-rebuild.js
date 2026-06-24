
/* BANCO DE GRUPOS REBUILD - FUNCIONAL */
(function(){
  const K1="ideal_admin_master_v1";
  const K2="ideal_admin_fix_v1";
  const BAIRROS=[
    "Campo Grande","Cosmos","Paciência","Santa Cruz","Méier","Bangu","Realengo","Senador Camará",
    "Santíssimo","Inhoaíba","Guaratiba","Sepetiba","Barra da Tijuca","Recreio dos Bandeirantes",
    "Jacarepaguá","Taquara","Freguesia","Pechincha","Curicica","Praça Seca","Madureira","Irajá",
    "Tijuca","Vila Isabel","Penha","Pavuna","Copacabana","Ipanema","Leblon","Botafogo","Flamengo",
    "Centro","Lapa","Nova Iguaçu","Duque de Caxias","Belford Roxo","São João de Meriti","Nilópolis"
  ];
  const NICHOS=["desapego","desapega","serviços","troca","compra e venda","vendas","moradores","classificados","anúncios"];

  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||"{}")}catch(e){return{}}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const clean=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
  const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const normUrl=u=>{
    u=String(u||"").trim();
    if(!u)return"";
    if(!/^https?:\/\//i.test(u))u="https://"+u;
    try{const x=new URL(u);return x.origin+x.pathname.replace(/\/$/,"")}catch(e){return""}
  };

  let extracted=[];
  let searches=[];

  function getState(){
    const a=read(K1), b=read(K2);
    const all=[...(Array.isArray(a.groups)?a.groups:[]), ...(Array.isArray(b.groups)?b.groups:[])];
    const map=new Map();
    all.forEach(g=>{
      const url=normUrl(g.url||g.link||"");
      if(!url)return;
      const bairro=g.bairro||g.region||g.regiao||"";
      map.set(url,{
        ...g,
        id:g.id||("g_"+Math.random().toString(36).slice(2)),
        name:g.name||g.nome||"Grupo Facebook",
        url,
        bairro,
        region:bairro,
        status:g.status||"pendente",
        createdAt:g.createdAt||new Date().toISOString(),
        postedAt:g.postedAt||null
      });
    });
    const state={...a,groups:[...map.values()],bairros:a.bairros||b.bairros||[],models:a.models||b.models||[]};
    saveState(state);
    return state;
  }

  function saveState(state){
    [K1,K2].forEach(k=>{
      const old=read(k);
      write(k,{...old,groups:state.groups||[],bairros:state.bairros||old.bairros||[],models:state.models||old.models||[]});
    });
  }

  function findGruposPage(){
    return document.getElementById("grupos") ||
      [...document.querySelectorAll("section,.page,main,div")].find(el=>{
        const t=clean(el.textContent);
        return t.includes("banco de grupos") || t.includes("controle de cliques") || t.includes("salvar lista");
      });
  }

  function install(){
    const page=findGruposPage();
    if(!page)return;

    if(document.getElementById("bancoGruposRebuild"))return;

    page.innerHTML=`
      <div id="bancoGruposRebuild" class="banco-rebuild">
        <div class="card banco-card">
          <h2>🔎 Gerador de buscas e grupos</h2>
          <p>Escolha o bairro uma vez. Ele será usado para gerar buscas e salvar os grupos extraídos.</p>

          <div class="grid2">
            <input id="bgBuscarBairro" placeholder="Buscar bairro... Ex: Campo Grande">
            <select id="bgBairro">
              <option value="">Selecionar bairro</option>
              ${BAIRROS.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join("")}
            </select>
          </div>

          <div class="nicho-grid">
            ${NICHOS.map((n,i)=>`<label><input type="checkbox" class="bgNicho" value="${esc(n)}" ${i===0?"checked":""}> ${esc(n)}</label>`).join("")}
          </div>

          <textarea id="bgBuscas" placeholder="As buscas aparecem aqui automaticamente."></textarea>

          <div class="actions">
            <button type="button" id="bgGerar" class="btn blue">Gerar buscas</button>
            <button type="button" id="bgAbrir" class="btn purple">Abrir todas as buscas</button>
            <button type="button" id="bgCopiar" class="btn green">Copiar buscas</button>
          </div>

          <div id="bgResultadoBuscas" class="resultado-lista"></div>
        </div>

        <div class="card banco-card">
          <h2>🧲 Caçador de Links 2.0</h2>
          <p>Cole os links encontrados no Google. Todos serão salvos no bairro escolhido acima.</p>

          <textarea id="bgLinks" placeholder="Cole links de grupos:
https://facebook.com/groups/123
https://facebook.com/groups/456
ou
Nome do Grupo | https://facebook.com/groups/789"></textarea>

          <div class="actions">
            <button type="button" id="bgExtrair" class="btn blue">Extrair links</button>
            <button type="button" id="bgSelecionar" class="btn purple">Selecionar todos</button>
            <button type="button" id="bgSalvar" class="btn green">Salvar selecionados</button>
            <button type="button" id="bgLimpar" class="btn red">Limpar</button>
          </div>

          <div id="bgResultadoLinks" class="resultado-lista"><p>Nenhum link extraído ainda.</p></div>
        </div>

        <div class="card banco-card">
          <h2>📚 Grupos cadastrados</h2>
          <div class="grid2">
            <input id="bgFiltro" placeholder="Filtrar por nome, bairro ou link...">
            <select id="bgFiltroBairro">
              <option value="">Todos os bairros</option>
              ${BAIRROS.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join("")}
            </select>
          </div>
          <div class="actions">
            <button type="button" id="bgExportar" class="btn purple">Exportar banco</button>
            <label class="btn blue">
              Importar banco
              <input id="bgImportar" type="file" accept=".json" hidden>
            </label>
          </div>
          <div id="bgListaGrupos" class="resultado-lista"></div>
        </div>
      </div>
    `;

    bind();
    renderGroups();
  }

  function bairro(){
    return document.getElementById("bgBairro")?.value || localStorage.getItem("bg_bairro") || "";
  }

  function setBairro(v){
    localStorage.setItem("bg_bairro",v||"");
  }

  function nichos(){
    const arr=[...document.querySelectorAll(".bgNicho:checked")].map(x=>x.value);
    return arr.length?arr:["desapego"];
  }

  function updateBuscas(){
    const b=bairro();
    const ta=document.getElementById("bgBuscas");
    if(!ta)return;
    if(!b){
      ta.value="";
      searches=[];
      renderSearches();
      return;
    }
    ta.value=nichos().map(n=>`${n} ${b}`).join("\n");
    generateSearches(false);
  }

  function buildSearch(term){
    const q=term.toLowerCase().includes(" rj")?term:`${term} RJ`;
    return {title:q,url:"https://www.google.com/search?q="+encodeURIComponent("site:facebook.com/groups "+q)};
  }

  function generateSearches(show=true){
    const terms=String(document.getElementById("bgBuscas")?.value||"").split(/\n+/).map(x=>x.trim()).filter(Boolean);
    searches=terms.map(buildSearch);
    renderSearches();
    if(show)toast(`${searches.length} buscas geradas.`);
  }

  function renderSearches(){
    const out=document.getElementById("bgResultadoBuscas");
    if(!out)return;
    out.innerHTML=searches.map(s=>`
      <div class="row-item">
        <div><b>${esc(s.title)}</b><small>${esc(s.url)}</small></div>
        <a class="btn blue" target="_blank" href="${esc(s.url)}">Abrir</a>
      </div>`).join("");
  }

  function openSearches(){
    if(!searches.length)generateSearches(false);
    searches.forEach((s,i)=>setTimeout(()=>window.open(s.url,"_blank"),i*450));
  }

  async function copySearches(){
    if(!searches.length)generateSearches(false);
    await navigator.clipboard.writeText(searches.map(s=>s.url).join("\n")).catch(()=>{});
    toast("Buscas copiadas.");
  }

  function decodeMaybe(s){
    let out=String(s||"");
    for(let i=0;i<3;i++){
      try{const d=decodeURIComponent(out);if(d===out)break;out=d}catch(e){break}
    }
    return out;
  }

  function groupUrl(raw){
    raw=decodeMaybe(String(raw||"").trim()).replace(/&amp;/g,"&");
    try{
      const u=new URL(raw.startsWith("http")?raw:"https://"+raw);
      const q=u.searchParams.get("q")||u.searchParams.get("url")||u.searchParams.get("u");
      if(q&&/facebook\.com\/groups\//i.test(q))raw=decodeMaybe(q);
    }catch(e){}
    if(!/^https?:\/\//i.test(raw))raw="https://"+raw;
    try{
      const u=new URL(raw);
      const m=u.pathname.match(/\/groups\/([^/?#]+)/i);
      if(!m)return"";
      return "https://www.facebook.com/groups/"+m[1];
    }catch(e){return""}
  }

  function nameFromUrl(url,line){
    const parts=String(line||"").split("|").map(x=>x.trim()).filter(Boolean);
    if(parts.length>1 && !parts[0].includes("facebook.com"))return parts[0];
    const slug=(url.split("/groups/")[1]||"").replace(/[-_.]+/g," ");
    if(!slug||/^\d+$/.test(slug))return"Grupo Facebook";
    return slug.replace(/\b\w/g,l=>l.toUpperCase());
  }

  function extractLinks(){
    const b=bairro();
    if(!b)return toast("Selecione um bairro antes de extrair.");
    const txt=String(document.getElementById("bgLinks")?.value||"");
    const candidates=[];
    const re=/(?:https?:\/\/)?(?:www\.|m\.)?(?:facebook|fb)\.com\/groups\/[^\s|<>"')]+/gi;
    for(const m of txt.matchAll(re))candidates.push({raw:m[0],line:txt});
    const any=/https?:\/\/[^\s<>"')]+/gi;
    for(const m of txt.matchAll(any)){
      const d=decodeMaybe(m[0]);
      if(/facebook\.com\/groups\//i.test(d)||/facebook\.com%2Fgroups%2F/i.test(m[0]))candidates.push({raw:m[0],line:txt});
    }

    const map=new Map();
    candidates.forEach(c=>{
      const url=groupUrl(c.raw);
      if(url&&!map.has(url)){
        map.set(url,{name:nameFromUrl(url,c.line),url,bairro:b,selected:true});
      }
    });
    extracted=[...map.values()];
    renderExtracted();
    if(!extracted.length)toast("Nenhum grupo encontrado. Cole links facebook.com/groups/...");
  }

  function renderExtracted(){
    const out=document.getElementById("bgResultadoLinks");
    if(!out)return;
    if(!extracted.length){
      out.innerHTML="<p>Nenhum link extraído ainda.</p>";
      return;
    }
    out.innerHTML=`<b class="ok-text">${extracted.length} grupo(s) extraído(s) para ${esc(bairro())}</b>`+
      extracted.map((g,i)=>`
        <div class="row-check">
          <input type="checkbox" checked data-i="${i}">
          <div><b>${esc(g.name)}</b><small>${esc(g.url)}</small><small>Bairro: ${esc(g.bairro)}</small></div>
        </div>`).join("");
    out.querySelectorAll("[data-i]").forEach(ch=>ch.onchange=()=>extracted[+ch.dataset.i].selected=ch.checked);
  }

  function saveSelected(){
    const b=bairro();
    if(!b)return toast("Selecione um bairro antes de salvar.");
    if(!extracted.length)extractLinks();
    if(!extracted.length)return;

    const state=getState();
    const urls=new Set(state.groups.map(g=>normUrl(g.url)));
    let saved=0,rep=0,ign=0;

    extracted.filter(g=>g.selected).forEach(g=>{
      if(!g.url){ign++;return}
      if(urls.has(normUrl(g.url))){rep++;return}
      state.groups.push({
        id:Date.now().toString(36)+Math.random().toString(36).slice(2),
        name:g.name||"Grupo Facebook",
        url:g.url,
        bairro:b,
        region:b,
        status:"pendente",
        createdAt:new Date().toISOString(),
        postedAt:null,
        clicks:0
      });
      urls.add(normUrl(g.url));
      saved++;
    });

    saveState(state);
    extracted=[];
    document.getElementById("bgLinks").value="";
    renderExtracted();
    renderGroups();
    toast(`${saved} salvos em ${b}. ${rep} repetidos. ${ign} ignorados.`);
  }

  function renderGroups(){
    const state=getState();
    const q=clean(document.getElementById("bgFiltro")?.value||"");
    const b=document.getElementById("bgFiltroBairro")?.value||"";

    const groups=state.groups.filter(g=>{
      const text=clean(`${g.name} ${g.url} ${g.bairro}`);
      const okQ=!q||text.includes(q);
      const okB=!b||g.bairro===b||g.region===b;
      return okQ&&okB;
    });

    const out=document.getElementById("bgListaGrupos");
    if(!out)return;
    out.innerHTML=groups.length?groups.map(g=>`
      <div class="row-item">
        <div>
          <b>${esc(g.name)}</b>
          <small>${esc(g.bairro||"Sem bairro")} · ${esc(g.url)}</small>
          <small>Status: ${esc(g.status||"pendente")}</small>
        </div>
        <div class="row-actions">
          <a class="btn blue" href="${esc(g.url)}" target="_blank">Abrir</a>
          <button type="button" class="btn red" data-del="${esc(g.id)}">Excluir</button>
        </div>
      </div>`).join(""):"<p>Nenhum grupo cadastrado.</p>";

    out.querySelectorAll("[data-del]").forEach(btn=>btn.onclick=()=>{
      if(!confirm("Excluir este grupo?"))return;
      const s=getState();
      s.groups=s.groups.filter(g=>g.id!==btn.dataset.del);
      saveState(s);
      renderGroups();
    });
  }

  function exportDb(){
    const state=getState();
    const blob=new Blob([JSON.stringify({groups:state.groups,bairros:state.bairros,models:state.models},null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="ideal-toldos-banco-grupos.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importDb(file){
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const data=JSON.parse(reader.result);
        const state=getState();
        const incoming=Array.isArray(data.groups)?data.groups:[];
        const urls=new Set(state.groups.map(g=>normUrl(g.url)));
        incoming.forEach(g=>{
          const url=normUrl(g.url||g.link||"");
          if(url&&!urls.has(url)){
            state.groups.push({...g,url,bairro:g.bairro||g.region||"",region:g.bairro||g.region||"",id:g.id||("g_"+Math.random().toString(36).slice(2))});
            urls.add(url);
          }
        });
        saveState(state);
        renderGroups();
        toast("Banco importado.");
      }catch(e){toast("Arquivo inválido.")}
    };
    reader.readAsText(file);
  }

  function bind(){
    const buscar=document.getElementById("bgBuscarBairro");
    const sel=document.getElementById("bgBairro");

    if(buscar&&sel){
      const last=localStorage.getItem("bg_bairro")||"";
      if(last){buscar.value=last;sel.value=last;updateBuscas();}
      buscar.oninput=()=>{
        const q=clean(buscar.value);
        sel.innerHTML='<option value="">Selecionar bairro</option>'+BAIRROS.filter(b=>clean(b).includes(q)).map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join("");
        const exact=BAIRROS.find(b=>clean(b)===q);
        if(exact){sel.value=exact;localStorage.setItem("bg_bairro",exact);updateBuscas();}
      };
      sel.onchange=()=>{buscar.value=sel.value;localStorage.setItem("bg_bairro",sel.value);updateBuscas();};
    }

    document.querySelectorAll(".bgNicho").forEach(ch=>ch.onchange=updateBuscas);
    document.getElementById("bgGerar").onclick=()=>generateSearches(true);
    document.getElementById("bgAbrir").onclick=openSearches;
    document.getElementById("bgCopiar").onclick=copySearches;
    document.getElementById("bgExtrair").onclick=extractLinks;
    document.getElementById("bgSelecionar").onclick=()=>{extracted.forEach(g=>g.selected=true);renderExtracted();};
    document.getElementById("bgSalvar").onclick=saveSelected;
    document.getElementById("bgLimpar").onclick=()=>{extracted=[];document.getElementById("bgLinks").value="";renderExtracted();};
    document.getElementById("bgFiltro").oninput=renderGroups;
    document.getElementById("bgFiltroBairro").onchange=renderGroups;
    document.getElementById("bgExportar").onclick=exportDb;
    document.getElementById("bgImportar").onchange=e=>e.target.files[0]&&importDb(e.target.files[0]);
  }

  function patchNav(){
    document.querySelectorAll("button,a,.nav,.nav-item,[data-page]").forEach(el=>{
      const t=clean(el.textContent);
      if(t.includes("banco de grupos")){
        el.onclick=e=>{
          setTimeout(install,50);
        };
      }
    });
  }

  function toast(msg){
    if(typeof window.toastIdeal==="function")window.toastIdeal(msg);
    else alert(msg);
  }

  function boot(){
    install();
    patchNav();
    setInterval(()=>{patchNav(); if(document.getElementById("grupos")?.classList.contains("active"))install();},1000);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();
