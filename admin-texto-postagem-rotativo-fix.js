
/* FIX TROCA DE TEXTO DE POSTAGEM POR GRUPO */
(function(){
  const K1="ideal_admin_master_v1", K2="ideal_admin_fix_v1";

  const DEFAULT_MODELS = [
`🏠 Proteja e valorize seu imóvel com quem entende do assunto!

✅ Toldos retráteis e fixos
✅ Coberturas de policarbonato
✅ ACM e letreiros
✅ Instalação profissional

📲 Solicite seu orçamento: {LINK}`,

`☀️ Chega de sofrer com sol e chuva!

Sua casa ou comércio merece mais conforto e proteção.

✅ Toldos sob medida
✅ Coberturas resistentes
✅ Fabricação própria
✅ Atendimento em todo o Rio de Janeiro

📲 Fale conosco agora: {LINK}`,

`🚨 Transforme sua fachada e valorize seu imóvel!

Mais proteção, beleza e durabilidade para seu espaço.

✅ Toldos retráteis
✅ Coberturas em policarbonato
✅ Fachadas em ACM
✅ Instalação profissional

📲 Solicite um orçamento sem compromisso: {LINK}`,

`🏡 Seu espaço mais bonito, protegido e valorizado!

Trabalhamos com toldos, coberturas, ACM, letreiros e estruturas sob medida.

✅ Orçamento sem compromisso
✅ Atendimento profissional
✅ Material de qualidade

📲 Chame agora: {LINK}`
  ];

  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||"{}")}catch(e){return{}}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const clean=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
  const norm=u=>String(u||"").trim().replace(/\/$/,"");

  function state(){
    const a=read(K1), b=read(K2);
    const groups=[...(a.groups||[]),...(b.groups||[])];
    const map=new Map();
    groups.forEach(g=>{
      const url=norm(g.url||g.link||"");
      if(!url)return;
      const bairro=g.bairro||g.region||g.regiao||"";
      map.set(url,{...g,url,bairro,region:bairro,id:g.id||("g_"+Math.random().toString(36).slice(2)),name:g.name||g.nome||"Grupo Facebook"});
    });
    let models = Array.isArray(a.models) && a.models.some(x=>String(x||"").trim()) ? a.models :
                 Array.isArray(b.models) && b.models.some(x=>String(x||"").trim()) ? b.models :
                 DEFAULT_MODELS;
    return {...a,groups:[...map.values()],models,cycle:Array.isArray(a.cycle)?a.cycle:[],index:Number.isFinite(+a.index)?+a.index:-1,current:a.current||null,postModelIndex:Number.isFinite(+a.postModelIndex)?+a.postModelIndex:0};
  }

  function save(s){
    [K1,K2].forEach(k=>{
      const old=read(k);
      write(k,{...old,groups:s.groups||[],models:s.models||DEFAULT_MODELS,cycle:s.cycle||[],index:s.index??-1,current:s.current||null,postModelIndex:s.postModelIndex||0});
    });
  }

  function current(s){
    return s.current || ((s.cycle||[])[s.index]||null);
  }

  function track(g){
    return location.origin+"/?src="+encodeURIComponent(g?.id||g?.url||"")+"&bairro="+encodeURIComponent(g?.bairro||"");
  }

  function message(s){
    const g=current(s);
    const models=(s.models||DEFAULT_MODELS).filter(x=>String(x||"").trim());
    const idx = Number(s.postModelIndex||0) % models.length;
    let m=models[idx]||DEFAULT_MODELS[0];
    const link=track(g);
    m=m.replaceAll("{LINK}",link).replaceAll("[LINK]",link).replaceAll("{{LINK}}",link);
    if(!m.includes(link))m+="\n\n📲 Solicite seu orçamento: "+link;
    return m;
  }

  function renderMessage(){
    const s=state();
    const msg = current(s) ? message(s) : "";
    ["mensagemAtual","currentMessage","dashMessage","dashMensagem"].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.value=msg;
    });

    const label = document.getElementById("modeloAtualFix") || createLabel();
    const models=(s.models||DEFAULT_MODELS).filter(Boolean);
    label.textContent = current(s) ? `Mensagem ${((s.postModelIndex||0)%models.length)+1} de ${models.length}` : "Nenhum grupo selecionado";
  }

  function createLabel(){
    const el=document.createElement("div");
    el.id="modeloAtualFix";
    el.className="modelo-atual-fix";
    const ciclo=document.getElementById("ciclo");
    const box=(ciclo&&[...ciclo.querySelectorAll("textarea")][0]) || document.querySelector("textarea");
    if(box&&box.parentNode)box.parentNode.insertBefore(el,box);
    return el;
  }

  function saveModelsFromFields(){
    const s=state();
    const found=[];
    for(let i=1;i<=4;i++){
      const el=document.getElementById("model"+i)||document.getElementById("modelo"+i)||document.getElementById("postModel"+i);
      if(el)found.push(el.value||"");
    }
    if(found.some(x=>String(x||"").trim())){
      s.models=found;
      save(s);
      renderMessage();
    }
  }

  async function copyMsg(){
    let s=state();
    if(!current(s)){
      if(window.ciclo24hBairroIdeal?.start) window.ciclo24hBairroIdeal.start();
      s=state();
    }
    if(!current(s)){
      notify("Nenhum grupo selecionado.");
      return;
    }
    await navigator.clipboard.writeText(message(s)).catch(()=>{});
    notify("Mensagem copiada.");
  }

  function markPostedAdvanceModel(){
    setTimeout(()=>{
      const s=state();
      const models=(s.models||DEFAULT_MODELS).filter(Boolean);
      s.postModelIndex=((Number(s.postModelIndex||0)+1) % Math.max(1,models.length));
      save(s);
      renderMessage();
    },250);
  }

  function patchButtons(){
    document.querySelectorAll("button,a").forEach(btn=>{
      const t=clean(btn.textContent);
      if(t.includes("copiar mensagem")){
        btn.onclick=e=>{e.preventDefault();e.stopPropagation();copyMsg();return false};
      }
      if(t.includes("marcar") && t.includes("postado")){
        const old=btn.onclick;
        btn.onclick=e=>{
          if(typeof old==="function") old.call(btn,e);
          else if(window.ciclo24hBairroIdeal?.posted) window.ciclo24hBairroIdeal.posted();
          markPostedAdvanceModel();
          return false;
        };
      }
      if(t.includes("salvar modelos")){
        const old=btn.onclick;
        btn.onclick=e=>{
          if(typeof old==="function")old.call(btn,e);
          saveModelsFromFields();
          notify("Modelos salvos.");
          return false;
        };
      }
    });
  }

  function notify(m){if(typeof window.toastIdeal==="function")window.toastIdeal(m);else alert(m)}
  function boot(){
    patchButtons();
    renderMessage();
    setInterval(()=>{patchButtons();renderMessage()},1200);
  }
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot):boot();
})();
