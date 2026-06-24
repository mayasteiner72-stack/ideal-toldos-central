
/* FIX TROCA DE BAIRRO LIMPA GRUPO ANTIGO */
(function(){
  const K1="ideal_admin_master_v1", K2="ideal_admin_fix_v1";
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||"{}")}catch(e){return{}}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const clean=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
  const norm=u=>String(u||"").trim().replace(/\/$/,"");

  function saveBoth(state){
    [K1,K2].forEach(k=>{
      const old=read(k);
      write(k,{...old,groups:state.groups||old.groups||[],cycle:state.cycle||[],index:state.index??-1,current:state.current||null,selectedBairroCycle:state.selectedBairroCycle||""});
    });
  }

  function state(){
    const a=read(K1), b=read(K2);
    const groups=[...(a.groups||[]),...(b.groups||[])];
    const map=new Map();
    groups.forEach(g=>{
      const url=norm(g.url||g.link||""); if(!url)return;
      const bairro=g.bairro||g.region||g.regiao||"";
      map.set(url,{...g,url,bairro,region:bairro,name:g.name||g.nome||"Grupo Facebook",id:g.id||("g_"+Math.random().toString(36).slice(2))});
    });
    return {...a,groups:[...map.values()],cycle:Array.isArray(a.cycle)?a.cycle:[],current:a.current||null,index:Number.isFinite(+a.index)?+a.index:-1};
  }

  function selectedBairroFrom(el){
    const v=String(el?.value||"").trim();
    const c=clean(v);
    if(!v||c==="todos os bairros"||c==="todos"||c==="selecionar bairro"||c==="selecione o bairro") return "";
    return v;
  }

  function findGroupForBairro(groups,bairro){
    const bk=clean(bairro);
    if(!bk) return null;
    return groups.find(g=>clean(g.bairro||g.region||g.regiao||"")===bk && g.status!=="postado") ||
           groups.find(g=>clean(g.bairro||g.region||g.regiao||"")===bk);
  }

  function track(g){
    return location.origin+"/?src="+encodeURIComponent(g?.id||g?.url||"")+"&bairro="+encodeURIComponent(g?.bairro||"");
  }

  function renderCurrent(g){
    const html=g?`<b>${g.name||"Grupo Facebook"}</b><br><small>${g.bairro||""} · ${g.url}</small><br><small class="track-line">Link de cliques: ${track(g)}</small>`:"Nenhum grupo liberado nesse bairro.";
    ["grupoAtual","currentGroup","dashCurrentGroup","dashGrupoAtual"].forEach(id=>{const e=document.getElementById(id); if(e)e.innerHTML=html});
    ["mensagemAtual","currentMessage","dashMessage","dashMensagem"].forEach(id=>{
      const e=document.getElementById(id);
      if(e && !g) e.value="";
    });
  }

  function changeBairro(el){
    const bairro=selectedBairroFrom(el);
    const s=state();
    const g=findGroupForBairro(s.groups,bairro);

    s.selectedBairroCycle=bairro;
    s.cycle=g?[g]:[];
    s.index=g?0:-1;
    s.current=g||null;

    saveBoth(s);
    renderCurrent(g);
  }

  function bind(){
    document.querySelectorAll("select").forEach(sel=>{
      const txt=(sel.id+" "+sel.closest(".card,.panel,section,div")?.textContent||"").toLowerCase();
      if(txt.includes("selecionar bairro")||txt.includes("ciclo")||sel.id==="cycleBairro"||sel.id==="dashBairro"){
        sel.onchange=function(){
          changeBairro(sel);
        };
      }
    });
  }

  function boot(){
    bind();
    setInterval(bind,1200);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();
