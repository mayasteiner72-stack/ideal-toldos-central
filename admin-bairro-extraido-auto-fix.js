
/* FIX BAIRRO AUTOMÁTICO NOS GRUPOS EXTRAÍDOS */
(function(){
  const K1="ideal_admin_master_v1";
  const K2="ideal_admin_fix_v1";

  function read(k){
    try{return JSON.parse(localStorage.getItem(k)||"{}")}catch(e){return{}}
  }

  function write(k,v){
    localStorage.setItem(k,JSON.stringify(v));
  }

  function clean(s){
    return String(s||"")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9\s]/g," ")
      .replace(/\s+/g," ")
      .trim();
  }

  function selectedBairro(){
    const ids=[
      "bsBairro","bgBairro","bairroFinal","bairroUnicoCacador",
      "bairroGeradorUnico","bairroGeradorAuto","cycleBairro","dashBairro"
    ];

    for(const id of ids){
      const el=document.getElementById(id);
      if(el && el.value){
        const v=String(el.value).trim();
        const c=clean(v);
        if(v && c!=="todos os bairros" && c!=="todos" && c!=="selecionar bairro"){
          return v;
        }
      }
    }

    const keys=["bs_bairro","bg_bairro","bairro_final_banco","bairro_unico_cacador"];
    for(const k of keys){
      const v=localStorage.getItem(k);
      if(v && clean(v)!=="todos os bairros") return v;
    }

    return "";
  }

  function fillVisibleBairroFields(){
    const bairro=selectedBairro();
    if(!bairro) return;

    document.querySelectorAll("input,textarea").forEach(el=>{
      const ph=clean(el.placeholder||"");
      const id=clean(el.id||"");
      const val=String(el.value||"").trim();

      if(
        ph==="bairro" ||
        ph.includes("bairro") ||
        id.includes("bairro") ||
        el.dataset.bairroField==="1"
      ){
        if(!val || val==="Bairro"){
          el.value=bairro;
          el.dataset.bairroField="1";
          el.dispatchEvent(new Event("input",{bubbles:true}));
          el.dispatchEvent(new Event("change",{bubbles:true}));
        }
      }
    });

    document.querySelectorAll(".row-check,.grupo-final-row,.grupo-extraido-unico,.data-row,.row-item").forEach(row=>{
      const txt=clean(row.textContent);
      if(txt.includes("facebook com groups") && !txt.includes(clean(bairro))){
        let small=document.createElement("small");
        small.className="bairro-auto-label";
        small.textContent="Bairro: "+bairro;
        row.appendChild(small);
      }
    });
  }

  function fixStorageGroups(){
    const bairro=selectedBairro();
    if(!bairro) return;

    const a=read(K1);
    const b=read(K2);

    let changed=false;

    [a,b].forEach(state=>{
      if(Array.isArray(state.groups)){
        state.groups=state.groups.map(g=>{
          if(!g.bairro && !g.region && g.url){
            changed=true;
            return {...g,bairro:bairro,region:bairro};
          }
          return g;
        });
      }
    });

    if(changed){
      write(K1,a);
      write(K2,b);
    }
  }

  function patchSaveButtons(){
    document.querySelectorAll("button,a").forEach(btn=>{
      const t=clean(btn.textContent);
      if(
        t.includes("salvar selecionados") ||
        t.includes("salvar lista") ||
        t.includes("salvar grupo") ||
        t==="salvar"
      ){
        if(btn.dataset.bairroSavePatch==="1") return;
        btn.dataset.bairroSavePatch="1";

        const old=btn.onclick;
        btn.onclick=function(e){
          fillVisibleBairroFields();

          if(typeof old==="function"){
            const r=old.call(this,e);
            setTimeout(fixStorageGroups,200);
            setTimeout(fixStorageGroups,800);
            return r;
          }

          setTimeout(fixStorageGroups,200);
          return true;
        };
      }
    });
  }

  function boot(){
    fillVisibleBairroFields();
    fixStorageGroups();
    patchSaveButtons();

    document.addEventListener("change",function(e){
      if(e.target && e.target.tagName==="SELECT"){
        setTimeout(fillVisibleBairroFields,100);
      }
    },true);

    document.addEventListener("click",function(){
      setTimeout(fillVisibleBairroFields,150);
      setTimeout(patchSaveButtons,150);
    },true);

    setTimeout(fillVisibleBairroFields,800);
    setTimeout(patchSaveButtons,800);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();

  window.corrigirBairroGruposExtraidos=function(){
    fillVisibleBairroFields();
    fixStorageGroups();
  };
})();
