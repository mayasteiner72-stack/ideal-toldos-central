
(function(){
  const BAIRROS=["Campo Grande","Cosmos","Paciência","Santa Cruz","Méier","Bangu","Realengo","Senador Camará","Santíssimo","Inhoaíba","Guaratiba","Sepetiba","Barra da Tijuca","Recreio dos Bandeirantes","Jacarepaguá","Taquara","Freguesia","Pechincha","Curicica","Praça Seca","Madureira","Irajá","Tijuca","Vila Isabel","Penha","Pavuna","Copacabana","Ipanema","Leblon","Botafogo","Flamengo","Centro","Lapa","Nova Iguaçu","Duque de Caxias","Belford Roxo","São João de Meriti","Nilópolis"];
  const clean=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();

  function removeLateralBug(){
    document.querySelectorAll("body > .row-item, body > .busca-row-auto, body > .busca-unico-row, body > .resultado-busca-unico, body > .buscas-geradas-auto").forEach(e=>e.remove());
    document.querySelectorAll(".row-item,.busca-row-auto,.busca-unico-row").forEach(e=>{
      const t=clean(e.textContent);
      const inside=e.closest("#grupos,#bancoSimples,#bancoGruposRebuild,#geradorFinalBanco,#geradorUnicoBusca");
      if(!inside && t.includes("google com search")) e.remove();
    });
  }

  function simplifyBanco(){
    const banco=document.getElementById("bancoSimples") || document.getElementById("bancoGruposRebuild");
    if(!banco)return;

    banco.querySelectorAll("input").forEach(inp=>{
      const ph=clean(inp.placeholder||"");
      const id=clean(inp.id||"");
      if(ph.includes("buscar bairro") || id.includes("buscarbairro")){
        inp.remove();
      }
    });

    const select=document.getElementById("bsBairro") || document.getElementById("bgBairro");
    if(select && select.dataset.fixedBairroSelect!=="1"){
      const last=localStorage.getItem("bs_bairro") || localStorage.getItem("bg_bairro") || select.value || "";
      select.innerHTML='<option value="">Selecionar bairro</option>'+BAIRROS.map(b=>'<option value="'+b+'">'+b+'</option>').join("");
      if(last)select.value=last;
      select.dataset.fixedBairroSelect="1";
      select.addEventListener("change",function(){
        localStorage.setItem("bs_bairro",select.value);
        localStorage.setItem("bg_bairro",select.value);
      });
    }
  }

  function boot(){
    removeLateralBug();
    simplifyBanco();
    document.addEventListener("click",()=>setTimeout(()=>{removeLateralBug();simplifyBanco();},200),true);
    setTimeout(()=>{removeLateralBug();simplifyBanco();},1000);
  }
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot):boot();
})();
