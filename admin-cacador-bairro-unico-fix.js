
(function(){
  const K1="ideal_admin_master_v1", K2="ideal_admin_fix_v1";
  const BAIRROS=["Campo Grande","Cosmos","Paciência","Santa Cruz","Méier","Bangu","Realengo","Senador Camará","Santíssimo","Inhoaíba","Guaratiba","Sepetiba","Barra da Tijuca","Recreio dos Bandeirantes","Jacarepaguá","Taquara","Freguesia","Pechincha","Curicica","Praça Seca","Madureira","Irajá","Tijuca","Vila Isabel","Penha","Pavuna","Copacabana","Ipanema","Leblon","Botafogo","Centro","Lapa","Nova Iguaçu","Duque de Caxias","Belford Roxo","São João de Meriti","Nilópolis"];
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||"{}")}catch(e){return{}}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const clean=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
  const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const norm=u=>{u=String(u||"").trim();if(!u)return"";if(!/^https?:\/\//i.test(u))u="https://"+u;try{const x=new URL(u);return x.origin+x.pathname.replace(/\/$/,"")}catch(e){return""}};
  let extracted=[];

  function panel(){
    return [...document.querySelectorAll(".card,.panel,section,div")].find(el=>{
      const t=clean(el.textContent);
      return t.includes("cacador de links 20") || t.includes("caçador de links 20") || t.includes("extrair selecionar salvar");
    });
  }
  function removeOld(){
    const p=panel(); if(!p)return;
    p.querySelectorAll("#bairroCacadorWrap,.bairro-cacador-wrap").forEach(x=>x.remove());
    [...p.querySelectorAll("input,select")].forEach(el=>{
      if(el.id==="bairroUnicoCacador"||el.id==="buscarBairroUnicoCacador")return;
      const ph=clean(el.placeholder||""), id=clean(el.id||""), txt=clean(el.closest("div")?.textContent||"");
      if(ph.includes("bairro padrao")||ph.includes("buscar bairro")||id.includes("bairro")||txt.includes("bairro para salvar os grupos")){
        el.style.display="none";
        el.dataset.hiddenBairroOld="1";
      }
    });
  }
  function ensure(){
    const p=panel(); if(!p)return;
    removeOld();
    if(document.getElementById("bairroUnicoWrap"))return;
    const wrap=document.createElement("div");
    wrap.id="bairroUnicoWrap"; wrap.className="bairro-unico-wrap";
    wrap.innerHTML=`<div class="bairro-unico-title"><b>📍 Bairro dos grupos extraídos</b><small>Escolha uma vez. Todos os links salvos abaixo irão para esse bairro.</small></div><div class="bairro-unico-grid"><input id="buscarBairroUnicoCacador" placeholder="Buscar bairro... Ex: Campo Grande"><select id="bairroUnicoCacador"><option value="">Selecionar bairro</option>${BAIRROS.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join("")}</select></div>`;
    const ref=[...p.querySelectorAll("textarea")][0]||[...p.querySelectorAll("input")].find(i=>i.style.display!=="none");
    if(ref&&ref.parentNode)ref.parentNode.insertBefore(wrap,ref);else p.prepend(wrap);
    const busca=wrap.querySelector("#buscarBairroUnicoCacador"), sel=wrap.querySelector("#bairroUnicoCacador");
    busca.oninput=()=>{const q=clean(busca.value);sel.innerHTML='<option value="">Selecionar bairro</option>'+BAIRROS.filter(b=>clean(b).includes(q)).map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join("");const ex=BAIRROS.find(b=>clean(b)===q);if(ex){sel.value=ex;localStorage.setItem("bairro_unico_cacador",ex);}};
    sel.onchange=()=>{busca.value=sel.value;localStorage.setItem("bairro_unico_cacador",sel.value);};
    const last=localStorage.getItem("bairro_unico_cacador")||""; if(last){busca.value=last;sel.value=last;}
  }
  function bairro(){const v=document.getElementById("bairroUnicoCacador")?.value||localStorage.getItem("bairro_unico_cacador")||"";const c=clean(v);return(!v||c==="todos os bairros"||c==="todos")?"":v.trim();}
  function pasteBox(){const p=panel(); if(!p)return null;return [...p.querySelectorAll("textarea")].find(t=>clean(t.placeholder).includes("cole aqui")||String(t.value).includes("facebook.com"))||p.querySelector("textarea");}
  function resultBox(){let box=document.getElementById("resultadoExtratorBairroUnico"); if(box)return box; const p=panel(); if(!p)return null; box=document.createElement("div"); box.id="resultadoExtratorBairroUnico"; box.className="resultado-extrator-unico"; const buttons=[...p.querySelectorAll("button")].find(b=>clean(b.textContent).includes("extrair links")); if(buttons&&buttons.parentNode)buttons.parentNode.insertAdjacentElement("afterend",box);else p.appendChild(box);return box;}
  function decode(s){let o=String(s||"");for(let i=0;i<3;i++){try{const d=decodeURIComponent(o);if(d===o)break;o=d}catch(e){break}}return o}
  function groupUrl(raw){raw=decode(String(raw||"").trim()).replace(/&amp;/g,"&");try{const u=new URL(raw.startsWith("http")?raw:"https://"+raw);const q=u.searchParams.get("q")||u.searchParams.get("url")||u.searchParams.get("u");if(q&&/facebook\.com\/groups\//i.test(q))raw=decode(q)}catch(e){}if(!/^https?:\/\//i.test(raw))raw="https://"+raw;try{const u=new URL(raw);const m=u.pathname.match(/\/groups\/([^/?#]+)/i);if(!m)return"";return "https://www.facebook.com/groups/"+m[1]}catch(e){return""}}
  function extract(){const box=pasteBox(); if(!box)return note("Campo de links não encontrado."); const b=bairro(); if(!b)return note("Selecione o bairro antes de extrair/salvar."); const txt=String(box.value||""), candidates=[]; const re=/(?:https?:\/\/)?(?:www\.|m\.)?(?:facebook|fb)\.com\/groups\/[^\s|<>"')]+/gi; for(const m of txt.matchAll(re))candidates.push(m[0]); const any=/https?:\/\/[^\s<>"')]+/gi; for(const m of txt.matchAll(any)){const d=decode(m[0]);if(/facebook\.com\/groups\//i.test(d)||/facebook\.com%2Fgroups%2F/i.test(m[0]))candidates.push(m[0])} const map=new Map(); candidates.forEach(c=>{const url=groupUrl(c);if(url&&!map.has(url)){const slug=(url.split("/groups/")[1]||"").replace(/[-_.]+/g," ");map.set(url,{id:"ex_"+Math.random().toString(36).slice(2),name:/^\d+$/.test(slug)?"Grupo Facebook":slug.replace(/\b\w/g,l=>l.toUpperCase()),url,bairro:b,selected:true})}}); extracted=[...map.values()]; renderExtracted(); if(!extracted.length)note("Nenhum grupo encontrado. Cole links facebook.com/groups/...");}
  function renderExtracted(){const box=resultBox(); if(!box)return; if(!extracted.length){box.innerHTML="<p>Nenhum link extraído ainda.</p>";return} const b=bairro(); box.innerHTML=`<b class="ok-unico">${extracted.length} grupo(s) extraído(s) para: ${esc(b)}</b>`+extracted.map((g,i)=>`<div class="grupo-extraido-unico"><input type="checkbox" checked data-i="${i}"><div><b>${esc(g.name)}</b><small>${esc(g.url)}</small><small>Bairro: ${esc(b)}</small></div></div>`).join(""); box.querySelectorAll("[data-i]").forEach(ch=>ch.onchange=()=>extracted[+ch.dataset.i].selected=ch.checked);}
  function saveSelected(){const b=bairro(); if(!b)return note("Selecione o bairro antes de salvar."); if(!extracted.length)extract(); if(!extracted.length)return; const s1=read(K1),s2=read(K2); const groups=[...(s1.groups||[]),...(s2.groups||[])]; const urls=new Set(groups.map(g=>norm(g.url))); let saved=0,rep=0,ign=0; extracted.filter(g=>g.selected).forEach(g=>{if(!g.url){ign++;return} if(urls.has(norm(g.url))){rep++;return} groups.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2),name:g.name||"Grupo Facebook",url:g.url,bairro:b,region:b,status:"pendente",createdAt:new Date().toISOString(),postedAt:null});urls.add(norm(g.url));saved++;}); s1.groups=groups;s2.groups=groups;write(K1,s1);write(K2,s2);extracted=[];const pb=pasteBox();if(pb)pb.value="";renderExtracted();note(`${saved} salvos em ${b}. ${rep} repetidos. ${ign} ignorados.`); if(window.renderContagemBairroExata)window.renderContagemBairroExata();}
  function bind(){ensure();removeOld();[...document.querySelectorAll("button,a")].forEach(btn=>{const t=clean(btn.textContent);if(t.includes("extrair links"))btn.onclick=e=>{e.preventDefault();extract();return false};if(t.includes("selecionar todos"))btn.onclick=e=>{e.preventDefault();extracted.forEach(g=>g.selected=true);renderExtracted();return false};if(t.includes("salvar selecionados"))btn.onclick=e=>{e.preventDefault();saveSelected();return false};});}
  function note(m){if(typeof window.toastIdeal==="function")window.toastIdeal(m);else alert(m)}
  function boot(){bind();setInterval(bind,1500)}
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot):boot();
})();
