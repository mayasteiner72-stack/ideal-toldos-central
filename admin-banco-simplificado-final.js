
/* BANCO DE GRUPOS SIMPLIFICADO - 1 BAIRRO APENAS */
(function(){
  const K1="ideal_admin_master_v1", K2="ideal_admin_fix_v1";
  const BAIRROS=["Campo Grande","Cosmos","Paciência","Santa Cruz","Méier","Bangu","Realengo","Senador Camará","Santíssimo","Inhoaíba","Guaratiba","Sepetiba","Barra da Tijuca","Recreio dos Bandeirantes","Jacarepaguá","Taquara","Freguesia","Pechincha","Curicica","Praça Seca","Madureira","Irajá","Tijuca","Vila Isabel","Penha","Pavuna","Copacabana","Ipanema","Leblon","Botafogo","Flamengo","Centro","Lapa","Nova Iguaçu","Duque de Caxias","Belford Roxo","São João de Meriti","Nilópolis"];
  const NICHOS=["desapego","desapega","serviços","troca","compra e venda","vendas","moradores","classificados","anúncios"];
  const clean=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
  const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||"{}")}catch(e){return{}}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const norm=u=>{u=String(u||"").trim();if(!u)return"";if(!/^https?:\/\//i.test(u))u="https://"+u;try{const x=new URL(u);return x.origin+x.pathname.replace(/\/$/,"")}catch(e){return""}};
  let searches=[], extracted=[];

  function state(){
    const a=read(K1), b=read(K2), all=[...(a.groups||[]),...(b.groups||[])], map=new Map();
    all.forEach(g=>{
      const url=norm(g.url||g.link||""); if(!url)return;
      const bairro=g.bairro||g.region||g.regiao||"";
      map.set(url,{...g,id:g.id||("g_"+Math.random().toString(36).slice(2)),name:g.name||g.nome||"Grupo Facebook",url,bairro,region:bairro,status:g.status||"pendente"});
    });
    const s={...a,groups:[...map.values()],bairros:a.bairros||b.bairros||[],models:a.models||b.models||[]};
    save(s); return s;
  }
  function save(s){[K1,K2].forEach(k=>{const old=read(k);write(k,{...old,groups:s.groups||[],bairros:s.bairros||old.bairros||[],models:s.models||old.models||[]})})}

  function page(){
    return document.getElementById("grupos") || [...document.querySelectorAll("section,.page,main,div")].find(el=>clean(el.textContent).includes("banco de grupos"));
  }

  function clearOld(){
    [...document.querySelectorAll("#bancoGruposRebuild,#geradorFinalBanco,#geradorUnicoBusca,#bairroUnicoWrap,#bairroCacadorWrap,.bairro-unico-wrap,.bairro-cacador-wrap,#geradorBairroAutoWrap,.gerador-bairro-auto-wrap")].forEach(e=>e.remove());
    const p=page();
    if(p){
      [...p.children].forEach(ch=>{
        const t=clean(ch.textContent);
        if(t.includes("gerador")||t.includes("cacador")||t.includes("caçador")||t.includes("salvar lista")||t.includes("exportar banco")||t.includes("importar banco")){
          if(ch.id!=="bancoSimples") ch.remove();
        }
      });
    }
  }

  function install(){
    const p=page(); if(!p)return;
    clearOld();
    if(document.getElementById("bancoSimples"))return;

    const box=document.createElement("div");
    box.id="bancoSimples";
    box.className="banco-simples";
    box.innerHTML=`
      <div class="card banco-card">
        <h2>🔎 Banco de Grupos</h2>
        <p>Escolha o bairro uma vez. Esse bairro será usado para gerar buscas e salvar os grupos.</p>

        <label class="label-simples">Bairro</label>
        <select id="bsBairro" class="select-bairro-unico">
          <option value="">Selecionar bairro</option>
          ${BAIRROS.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join("")}
        </select>

        <h3>Tipos de busca</h3>
        <div class="nicho-grid">
          ${NICHOS.map((n,i)=>`<label><input type="checkbox" class="bsNicho" value="${esc(n)}" ${i===0?"checked":""}> ${esc(n)}</label>`).join("")}
        </div>

        <textarea id="bsBuscas" readonly placeholder="Escolha um bairro para gerar as buscas automaticamente."></textarea>

        <div class="actions">
          <button type="button" id="bsTodosNichos" class="btn green">Todos os nichos</button>
          <button type="button" id="bsGerar" class="btn blue">Gerar buscas</button>
          <button type="button" id="bsAbrir" class="btn purple">Abrir todas</button>
          <button type="button" id="bsCopiar" class="btn green">Copiar buscas</button>
        </div>

        <div id="bsResultadoBuscas" class="resultado-lista"></div>
      </div>

      <div class="card banco-card">
        <h2>🧲 Caçador de Links 2.0</h2>
        <p id="bsBairroAviso">Bairro selecionado: nenhum</p>
        <textarea id="bsLinks" placeholder="Cole aqui os links dos grupos encontrados:
https://facebook.com/groups/123
https://facebook.com/groups/456"></textarea>

        <div class="actions">
          <button type="button" id="bsExtrair" class="btn blue">Extrair links</button>
          <button type="button" id="bsSelecionar" class="btn purple">Selecionar todos</button>
          <button type="button" id="bsSalvar" class="btn green">Salvar selecionados</button>
          <button type="button" id="bsLimpar" class="btn red">Limpar</button>
        </div>

        <div id="bsResultadoLinks" class="resultado-lista"><p>Nenhum link extraído ainda.</p></div>
      </div>

      <div class="card banco-card">
        <h2>📚 Grupos cadastrados</h2>
        <input id="bsFiltro" placeholder="Filtrar grupos...">
        <div class="actions">
          <button type="button" id="bsExportar" class="btn purple">Exportar banco</button>
        </div>
        <div id="bsLista" class="resultado-lista"></div>
      </div>
    `;
    p.prepend(box);
    bind();
    update();
    renderGroups();
  }

  function bairro(){return document.getElementById("bsBairro")?.value||localStorage.getItem("bs_bairro")||""}
  function update(){
    const b=bairro();
    const aviso=document.getElementById("bsBairroAviso");
    if(aviso) aviso.textContent="Bairro selecionado: "+(b||"nenhum");
    const ta=document.getElementById("bsBuscas");
    if(!ta)return;
    if(!b){ta.value=""; searches=[]; renderSearches(); return}
    ta.value=[...document.querySelectorAll(".bsNicho:checked")].map(x=>`${x.value} ${b} RJ`).join("\n");
    if(!ta.value) ta.value=`desapego ${b} RJ`;
    searches=ta.value.split(/\n+/).filter(Boolean).map(term=>({title:term,url:"https://www.google.com/search?q="+encodeURIComponent("site:facebook.com/groups "+term)}));
    renderSearches();
  }
  function renderSearches(){
    const out=document.getElementById("bsResultadoBuscas"); if(!out)return;
    out.innerHTML=searches.map(s=>`<div class="row-item"><div><b>${esc(s.title)}</b><small>${esc(s.url)}</small></div><a class="btn blue" target="_blank" href="${esc(s.url)}">Abrir</a></div>`).join("");
  }
  function openAll(){if(!searches.length)update();searches.forEach((s,i)=>setTimeout(()=>window.open(s.url,"_blank"),i*450))}
  async function copyAll(){if(!searches.length)update();await navigator.clipboard.writeText(searches.map(s=>s.url).join("\n")).catch(()=>{});note("Buscas copiadas.")}

  function decode(s){let o=String(s||"");for(let i=0;i<3;i++){try{const d=decodeURIComponent(o);if(d===o)break;o=d}catch(e){break}}return o}
  function groupUrl(raw){
    raw=decode(String(raw||"").trim()).replace(/&amp;/g,"&");
    try{const u=new URL(raw.startsWith("http")?raw:"https://"+raw);const q=u.searchParams.get("q")||u.searchParams.get("url")||u.searchParams.get("u");if(q&&/facebook\.com\/groups\//i.test(q))raw=decode(q)}catch(e){}
    if(!/^https?:\/\//i.test(raw))raw="https://"+raw;
    try{const u=new URL(raw);const m=u.pathname.match(/\/groups\/([^/?#]+)/i);if(!m)return"";return"https://www.facebook.com/groups/"+m[1]}catch(e){return""}
  }
  function extract(){
    const b=bairro(); if(!b)return note("Selecione um bairro.");
    const txt=String(document.getElementById("bsLinks")?.value||""), candidates=[];
    const re=/(?:https?:\/\/)?(?:www\.|m\.)?(?:facebook|fb)\.com\/groups\/[^\s|<>"')]+/gi;
    for(const m of txt.matchAll(re))candidates.push(m[0]);
    const any=/https?:\/\/[^\s<>"')]+/gi;
    for(const m of txt.matchAll(any)){const d=decode(m[0]);if(/facebook\.com\/groups\//i.test(d)||/facebook\.com%2Fgroups%2F/i.test(m[0]))candidates.push(m[0])}
    const map=new Map();
    candidates.forEach(c=>{const url=groupUrl(c);if(url&&!map.has(url)){const slug=(url.split("/groups/")[1]||"").replace(/[-_.]+/g," ");map.set(url,{name:/^\d+$/.test(slug)?"Grupo Facebook":slug.replace(/\b\w/g,l=>l.toUpperCase()),url,bairro:b,selected:true})}});
    extracted=[...map.values()];
    renderExtracted();
    if(!extracted.length)note("Nenhum grupo encontrado.");
  }
  function renderExtracted(){
    const out=document.getElementById("bsResultadoLinks");if(!out)return;
    if(!extracted.length){out.innerHTML="<p>Nenhum link extraído ainda.</p>";return}
    out.innerHTML=`<b class="ok-text">${extracted.length} grupo(s) para ${esc(bairro())}</b>`+extracted.map((g,i)=>`<div class="row-check"><input type="checkbox" checked data-i="${i}"><div><b>${esc(g.name)}</b><small>${esc(g.url)}</small><small>Bairro: ${esc(g.bairro)}</small></div></div>`).join("");
    out.querySelectorAll("[data-i]").forEach(ch=>ch.onchange=()=>extracted[+ch.dataset.i].selected=ch.checked);
  }
  function saveSelected(){
    const b=bairro(); if(!b)return note("Selecione um bairro.");
    if(!extracted.length)extract(); if(!extracted.length)return;
    const s=state(), urls=new Set(s.groups.map(g=>norm(g.url))); let saved=0,rep=0;
    extracted.filter(g=>g.selected).forEach(g=>{if(urls.has(norm(g.url))){rep++;return} s.groups.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2),name:g.name,url:g.url,bairro:b,region:b,status:"pendente",createdAt:new Date().toISOString(),postedAt:null});urls.add(norm(g.url));saved++});
    save(s); extracted=[]; document.getElementById("bsLinks").value=""; renderExtracted(); renderGroups(); note(`${saved} salvos. ${rep} repetidos.`);
  }
  function renderGroups(){
    const s=state(), q=clean(document.getElementById("bsFiltro")?.value||""), out=document.getElementById("bsLista"); if(!out)return;
    const groups=s.groups.filter(g=>clean(`${g.name} ${g.bairro} ${g.url}`).includes(q));
    out.innerHTML=groups.length?groups.map(g=>`<div class="row-item"><div><b>${esc(g.name)}</b><small>${esc(g.bairro)} · ${esc(g.url)}</small></div><button class="btn red" data-del="${esc(g.id)}">Excluir</button></div>`).join(""):"<p>Nenhum grupo cadastrado.</p>";
    out.querySelectorAll("[data-del]").forEach(btn=>btn.onclick=()=>{if(!confirm("Excluir grupo?"))return;const s=state();s.groups=s.groups.filter(g=>g.id!==btn.dataset.del);save(s);renderGroups()});
  }
  function exportDb(){
    const s=state(), blob=new Blob([JSON.stringify({groups:s.groups,bairros:s.bairros,models:s.models},null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="ideal-toldos-banco-grupos.json";a.click();URL.revokeObjectURL(a.href);
  }
  function bind(){
    const sel=document.getElementById("bsBairro");
    if(sel){const last=localStorage.getItem("bs_bairro")||"";if(last)sel.value=last;sel.onchange=()=>{localStorage.setItem("bs_bairro",sel.value);update()}}
    document.querySelectorAll(".bsNicho").forEach(ch=>ch.onchange=update);
    document.getElementById("bsTodosNichos").onclick=()=>{document.querySelectorAll(".bsNicho").forEach(x=>x.checked=true);update()};
    document.getElementById("bsGerar").onclick=update;
    document.getElementById("bsAbrir").onclick=openAll;
    document.getElementById("bsCopiar").onclick=copyAll;
    document.getElementById("bsExtrair").onclick=extract;
    document.getElementById("bsSelecionar").onclick=()=>{extracted.forEach(g=>g.selected=true);renderExtracted()};
    document.getElementById("bsSalvar").onclick=saveSelected;
    document.getElementById("bsLimpar").onclick=()=>{extracted=[];document.getElementById("bsLinks").value="";renderExtracted()};
    document.getElementById("bsFiltro").oninput=renderGroups;
    document.getElementById("bsExportar").onclick=exportDb;
  }
  function note(m){if(typeof window.toastIdeal==="function")window.toastIdeal(m);else alert(m)}
  function boot(){install()}
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot):boot();
})();
