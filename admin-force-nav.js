
// FORÇA ABAS DO ADMIN - Ideal Toldos
(function(){
  function normalize(t){
    return String(t || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^\w\s]/g,"")
      .trim();
  }

  const mapTextToPage = {
    "dashboard": "dashboard",
    "banco de grupos": "grupos",
    "grupos": "grupos",
    "controle de regiao": "regioes",
    "regioes": "regioes",
    "modelos de postagem": "modelos",
    "modelos": "modelos",
    "ciclo de divulgacao": "ciclo",
    "ciclo": "ciclo",
    "relatorios": "relatorios",
    "cliques": "relatorios",
    "galeria": "galeria",
    "clientes": "clientes",
    "configuracoes": "config"
  };

  const pageNames = ["dashboard","grupos","regioes","modelos","ciclo","relatorios","galeria","clientes","config","postagens","cliques"];

  function ensurePages(){
    pageNames.forEach(id=>{
      const el = document.getElementById(id);
      if(el){
        el.classList.add("page");
        el.style.display = "none";
      }
    });
  }

  function openPage(page){
    ensurePages();

    document.querySelectorAll(".page").forEach(el=>{
      el.classList.remove("active");
      el.style.display = "none";
    });

    const target = document.getElementById(page);
    if(target){
      target.classList.add("active");
      target.style.display = "block";
    }

    document.querySelectorAll("button,a,.nav,.nav-item,[data-page]").forEach(el=>{
      el.classList.remove("active");
    });

    document.querySelectorAll("button,a,.nav,.nav-item,[data-page]").forEach(el=>{
      const text = normalize(el.textContent);
      const data = el.getAttribute("data-page");
      if(data === page || mapTextToPage[text] === page){
        el.classList.add("active");
      }
    });

    const title = document.getElementById("pageTitle") || document.querySelector("main h1");
    if(title){
      const label = Object.entries(mapTextToPage).find(([k,v])=>v===page)?.[0] || page;
      title.textContent = label.replace(/\b\w/g, l=>l.toUpperCase());
    }

    localStorage.setItem("ideal_admin_page_force", page);
  }

  function bindNav(){
    const navs = Array.from(document.querySelectorAll("button,a,.nav,.nav-item,[data-page]"));
    navs.forEach(el=>{
      const text = normalize(el.textContent);
      const data = el.getAttribute("data-page");
      const href = el.getAttribute("href") || "";
      let page = data || mapTextToPage[text];

      if(!page && href.startsWith("#")){
        page = href.replace("#","");
      }

      if(pageNames.includes(page)){
        el.onclick = function(e){
          e.preventDefault();
          e.stopPropagation();
          openPage(page);
          return false;
        };
        el.style.cursor = "pointer";
      }
    });
  }

  function boot(){
    ensurePages();
    bindNav();

    const first = localStorage.getItem("ideal_admin_page_force") || "dashboard";
    openPage(document.getElementById(first) ? first : "dashboard");

    // Reforça após scripts antigos rodarem
    setTimeout(bindNav, 500);
    setTimeout(bindNav, 1500);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  }else{
    boot();
  }

  window.abrirAbaAdmin = openPage;
})();
