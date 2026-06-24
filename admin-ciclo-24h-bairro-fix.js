
(function(){
  const K1="ideal_admin_master_v1", K2="ideal_admin_fix_v1", DAY=86400000;
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||"{}")}catch(e){return{}}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const clean=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
  const norm=u=>String(u||"").trim().replace(/\/$/,"");
  const blocked=g=>!!(g&&g.postedAt&&Date.now()-new Date(g.postedAt).getTime()<DAY);
  const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  function merge(){
    const a=read(K1), b=read(K2), all=[...(a.groups||[]),...(b.groups||[])], map=new Map();
    all.forEach(x=>{
      const url=norm(x.url||x.link||""); if(!url)return;
      const bairro=x.bairro||x.region||x.regiao||x.area||"";
      map.set(url,{...x,id:x.id||("g_"+Math.random().toString(36).slice(2)),name:x.name||x.nome||"Grupo Facebook",url,bairro,region:bairro,status:blocked(x)?"postado":(x.status==="postado"&&!blocked(x)?"liberado":(x.status||"pendente")),postedAt:x.postedAt||null});
    });
    const s={...a,groups:[...map.values()],models:Array.isArray(a.models)?a.models:(b.models||[]),bairros:Array.isArray(a.bairros)?a.bairros:(b.bairros||[]),cycle:Array.isArray(a.cycle)?a.cycle:[],index:Number.isFinite(+a.index)?+a.index:-1,current:a.current||null};
    save(s); return s;
  }
  function save(s){[K1,K2].forEach(k=>{const old=read(k);write(k,{...old,groups:s.groups||[],models:s.models||old.models||[],bairros:s.bairros||old.bairros||[],cycle:s.cycle||[],index:s.index??-1,current:s.current||null,selectedBairroCycle:s.selectedBairroCycle||""})})}
  function selBairro(){
    const ids=["cycleBairro","dashBairro"]; for(const id of ids){const e=document.getElementById(id); if(e&&e.value&&!"todos os bairros todos selecionar bairro selecione o bairro".includes(clean(e.value)))return e.value.trim();}
    const c=document.getElementById("ciclo"); if(c){for(const e of c.querySelectorAll("select")){if(e.value&&!"todos os bairros todos selecionar bairro selecione o bairro".includes(clean(e.value)))return e.value.trim();}}
    return "";
  }
  const track=g=>location.origin+"/?src="+encodeURIComponent(g?.id||g?.url||"")+"&bairro="+encodeURIComponent(g?.bairro||"");
  const cur=s=>s.current||((s.cycle||[])[s.index]||null);
  function msg(s){const g=cur(s), ms=(s.models||[]).filter(Boolean);let m=ms.length?ms[Math.max(0,s.index||0)%ms.length]:"🏠 Proteja e valorize seu imóvel com quem entende do assunto!\n\n✅ Toldos retráteis e fixos\n✅ Coberturas de policarbonato\n✅ ACM e letreiros\n✅ Instalação profissional\n\n📲 Solicite seu orçamento: {LINK}";const l=track(g);m=m.replaceAll("{LINK}",l).replaceAll("[LINK]",l).replaceAll("{{LINK}}",l);if(!m.includes(l))m+="\n\n📲 Solicite seu orçamento: "+l;return m}
  function eligible(s,b){const bk=clean(b);return(s.groups||[]).filter(g=>(!bk||clean(g.bairro||g.region||"")===bk)&&!blocked(g))}
  function start(){const s=merge(),b=selBairro(),lim=+(document.getElementById("cycleLimit")?.value||20)||20, list=eligible(s,b).slice(0,lim);s.cycle=list;s.index=list.length?0:-1;s.current=list[0]||null;s.selectedBairroCycle=b;save(s);render();note(list.length?`${list.length} grupos liberados para ${b||"todos os bairros"}.`:`Nenhum grupo liberado para ${b||"todos os bairros"}.`)}
  async function copy(){let s=merge();if(!cur(s)){start();s=merge()}if(!cur(s))return note("Nenhum grupo liberado no ciclo.");await navigator.clipboard.writeText(msg(s)).catch(()=>{});note("Mensagem copiada com link de cliques.")}
  function openG(){let s=merge();if(!cur(s)){start();s=merge()}const g=cur(s);if(!g)return note("Nenhum grupo para abrir.");window.open(g.url,"_blank");render()}
  function posted(){const s=merge(),g=cur(s);if(!g)return note("Nenhum grupo selecionado.");const at=new Date().toISOString();s.groups=(s.groups||[]).map(x=>(x.id===g.id||norm(x.url)===norm(g.url))?{...x,status:"postado",postedAt:at}:x);const b=s.selectedBairroCycle||selBairro(),lim=+(document.getElementById("cycleLimit")?.value||20)||20;s.cycle=eligible(s,b).slice(0,lim);s.index=s.cycle.length?0:-1;s.current=s.cycle[0]||null;save(s);render();note(s.current?"Postado. Próximo grupo carregado.":"Postado. Não há mais grupos liberados nesse bairro.")}
  function reset(){const s=merge();s.cycle=[];s.index=-1;s.current=null;save(s);render();note("Ciclo zerado.")}
  function render(){
    const s=merge(),g=cur(s),cy=s.cycle||[],b=s.selectedBairroCycle||selBairro();
    const html=g?`<b>${esc(g.name)}</b><br><small>${esc(g.bairro)} · ${esc(g.url)}</small><br><small class="track-line">Link de cliques: ${esc(track(g))}</small>`:"Nenhum grupo liberado no ciclo.";
    ["grupoAtual","currentGroup","dashCurrentGroup","dashGrupoAtual"].forEach(id=>{const e=document.getElementById(id);if(e)e.innerHTML=html});
    ["mensagemAtual","currentMessage","dashMessage","dashMensagem"].forEach(id=>{const e=document.getElementById(id);if(e)e.value=g?msg(s):""});
    const list=cy.map((x,i)=>`<div class="row data-row ${i===0?"active-cycle-fix":""}"><header><b>${esc(x.name)}</b><span>${esc(x.status||"pendente")}</span></header><small>${esc(x.bairro)} · ${esc(x.url)}</small><small class="track-line">Link de cliques: ${esc(track(x))}</small></div>`).join("");
    ["cycleList","filaCiclo"].forEach(id=>{const e=document.getElementById(id);if(e)e.innerHTML=list||"<p>Nenhum grupo liberado no ciclo.</p>"});
    counts(s,b);
  }
  function counts(s,b){
    const gs=s.groups||[], bk=clean(b), bg=bk?gs.filter(g=>clean(g.bairro||g.region||"")===bk):gs, post24=bg.filter(blocked).length,total=bg.length;
    document.querySelectorAll("span,strong,b").forEach(e=>{if(/^\d+\s*\/\s*\d+$/.test(String(e.textContent||"").trim()))e.textContent=`${post24} / ${total}`});
    const today=new Date().toISOString().slice(0,10), postedToday=gs.filter(g=>String(g.postedAt||"").slice(0,10)===today).length, bairros={};gs.forEach(g=>{const x=clean(g.bairro||g.region||"");if(x)bairros[x]=1});
    [["statGroups",gs.length],["totalGroups",gs.length],["groupsCount",gs.length],["statBairros",Object.keys(bairros).length],["statPosted",postedToday],["todayPosted",postedToday]].forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.textContent=v});
  }
  function patch(){document.querySelectorAll("button,a").forEach(btn=>{const t=clean(btn.textContent);if(t.includes("iniciar ciclo"))btn.onclick=e=>{e.preventDefault();start();return false};if(t.includes("copiar mensagem"))btn.onclick=e=>{e.preventDefault();copy();return false};if(t.includes("abrir grupo")||t.includes("abrir proximo")||t.includes("proximo grupo")){btn.textContent="Abrir Grupo";btn.onclick=e=>{e.preventDefault();openG();return false}}if(t.includes("marcar")&&t.includes("postado"))btn.onclick=e=>{e.preventDefault();posted();return false};if(t.includes("zerar ciclo"))btn.onclick=e=>{e.preventDefault();reset();return false}});reorder()}
  function reorder(){const c=document.getElementById("ciclo");if(!c)return;const bs=[...c.querySelectorAll("button,a")].filter(b=>/iniciar ciclo|copiar mensagem|abrir grupo|marcar|zerar ciclo/.test(clean(b.textContent)));if(!bs.length)return;const p=bs[0].parentElement;const f=t=>bs.find(b=>clean(b.textContent).includes(t));[f("iniciar ciclo"),f("copiar mensagem"),f("abrir grupo"),bs.find(b=>clean(b.textContent).includes("marcar")&&clean(b.textContent).includes("postado")),f("zerar ciclo")].filter(Boolean).forEach(b=>p.appendChild(b))}
  function note(m){if(typeof window.toastIdeal==="function")window.toastIdeal(m);else alert(m)}
  function boot(){patch();render();setInterval(patch,1200);setInterval(render,8000)}
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot):boot();
  window.ciclo24hBairroIdeal={start,copy,openG,posted,reset,render};
})();
