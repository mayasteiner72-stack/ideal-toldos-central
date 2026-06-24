
(function(){
  const K1="ideal_admin_master_v1", K2="ideal_admin_fix_v1";
  const clean=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||"{}")}catch(e){return{}}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

  function groups(){
    const a=read(K1),b=read(K2),all=[...(Array.isArray(a.groups)?a.groups:[]),...(Array.isArray(b.groups)?b.groups:[])],m=new Map();
    all.forEach(g=>{
      const url=String(g.url||g.link||"").trim().replace(/\/$/,"");
      if(!url)return;
      const bairro=g.bairro||g.region||g.regiao||"";
      m.set(url,{...g,url,bairro,region:bairro,status:g.status||"pendente"});
    });
    return [...m.values()];
  }
  function saveGroups(gs){[K1,K2].forEach(k=>{const s=read(k);s.groups=gs;write(k,s)})}

  function updateCounters(){
    const gs=groups(), bairros={};
    gs.forEach(g=>{const b=clean(g.bairro||g.region||g.regiao||"");if(b)bairros[b]=true});
    const totalB=Object.keys(bairros).length;

    ["statBairros","totalRegions","regionsCount"].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=totalB});
    ["statGroups","totalGroups","groupsCount"].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=gs.length});

    document.querySelectorAll(".row,.data-row").forEach(card=>{
      const txt=clean(card.textContent||"");
      Object.keys(bairros).forEach(b=>{
        if(!txt.includes(b))return;
        const count=gs.filter(g=>clean(g.bairro||g.region||g.regiao||"")===b).length;
        card.querySelectorAll("span,b,strong").forEach(sp=>{
          const old=String(sp.textContent||"").trim();
          if(/^\d+\s*\/\s*\d+$/.test(old)){
            const meta=old.split("/")[1].trim()||"12";
            sp.textContent=count+" / "+meta;
          }
        });
        const bar=card.querySelector(".bar span,.progress span");
        if(bar){
          const metaText=[...card.querySelectorAll("span,b,strong")].map(x=>x.textContent).find(x=>/^\d+\s*\/\s*\d+$/.test(String(x||"").trim()));
          const meta=metaText?Number(String(metaText).split("/")[1].trim()):12;
          bar.style.width=Math.min(100,Math.round((count/meta)*100))+"%";
        }
      });
    });
  }

  function patchPostado(){
    document.querySelectorAll("button,a").forEach(btn=>{
      const t=clean(btn.textContent);
      if(!(t.includes("marcar")&&t.includes("postado")))return;
      if(btn.dataset.fastPostado==="1")return;
      btn.dataset.fastPostado="1";
      const old=btn.onclick;
      btn.onclick=function(e){
        if(typeof old==="function") old.call(this,e);
        setTimeout(()=>{
          const gs=groups();
          const body=clean(document.body.textContent||"");
          let changed=false;
          gs.forEach(g=>{
            if(g.status==="postado")return;
            const tail=clean(String(g.url||"").slice(-18));
            if(tail && body.includes(tail)){
              g.status="postado";
              g.postedAt=new Date().toISOString();
              changed=true;
            }
          });
          if(changed)saveGroups(gs);
          updateCounters();
        },80);
        return false;
      };
    });
  }

  function stopBlink(){
    if(window.__idealStopBlinkOk)return;
    window.__idealStopBlinkOk=true;
    const native=window.setInterval;
    window.setInterval=function(fn,time){
      const s=String(fn||"");
      if(time&&time<2000&&(s.includes("innerHTML")||s.includes("renderRegions")||s.includes("install()")||s.includes("ensure()"))){
        return 0;
      }
      return native(fn,time);
    };
  }

  function boot(){
    stopBlink();
    updateCounters();
    patchPostado();
    document.addEventListener("click",()=>setTimeout(()=>{updateCounters();patchPostado()},150),true);
    document.addEventListener("change",()=>setTimeout(updateCounters,150),true);
    setTimeout(updateCounters,700);
    setTimeout(updateCounters,1600);
  }
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot):boot();
  window.idealAtualizarContadoresSemPiscar=updateCounters;
})();
