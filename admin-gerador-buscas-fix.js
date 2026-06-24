
// FIX GERADOR DE BUSCAS EM MASSA - Ideal Toldos
(function(){
  let generatedSearches = [];

  const $ = (id) => document.getElementById(id);

  function findFieldByText(placeholders){
    const fields = Array.from(document.querySelectorAll("textarea,input,select"));
    return fields.find(el => {
      const txt = ((el.placeholder || "") + " " + (el.id || "") + " " + (el.name || "")).toLowerCase();
      return placeholders.some(p => txt.includes(p));
    });
  }

  function getTermsBox(){
    return $("massSearchTerms") || $("searchTerms") || $("bulkSearchTerms") ||
      findFieldByText(["vários bairros", "varios bairros", "nichos", "campo grande"]);
  }

  function getTypeBox(){
    return $("massSearchType") || $("searchType") ||
      Array.from(document.querySelectorAll("select")).find(s => String(s.textContent || "").toLowerCase().includes("google"));
  }

  function getSuffixBox(){
    return $("massSearchSuffix") || $("searchSuffix") ||
      Array.from(document.querySelectorAll("input")).find(i => (i.value || "").trim().toUpperCase() === "RJ") ||
      findFieldByText(["rj", "sufixo"]);
  }

  function getResultsBox(){
    let box = $("massSearchResults") || $("searchResults") || $("generatedSearchResults");
    if(box) return box;

    const panel = Array.from(document.querySelectorAll(".panel,.card,section,div")).find(el => 
      String(el.textContent || "").toLowerCase().includes("gerador de buscas em massa")
    );

    box = document.createElement("div");
    box.id = "massSearchResults";
    box.className = "mass-results-fix";

    if(panel){
      panel.appendChild(box);
    }else{
      document.body.appendChild(box);
    }
    return box;
  }

  function buildQuery(term){
    const suffix = (getSuffixBox()?.value || "RJ").trim();
    const typeText = (getTypeBox()?.value || getTypeBox()?.selectedOptions?.[0]?.textContent || "google grupos").toLowerCase();

    let q = term.trim();
    if(suffix && !q.toLowerCase().includes(suffix.toLowerCase())) q += " " + suffix;

    if(typeText.includes("desapego")) return "site:facebook.com/groups desapego " + q;
    if(typeText.includes("compra")) return "site:facebook.com/groups compra e venda " + q;
    if(typeText.includes("servi")) return "site:facebook.com/groups serviços " + q;
    return "site:facebook.com/groups " + q;
  }

  function buildUrl(term){
    return "https://www.google.com/search?q=" + encodeURIComponent(buildQuery(term));
  }

  function generateSearches(){
    const box = getTermsBox();
    if(!box) return alert("Campo de bairros não encontrado.");

    const terms = String(box.value || "")
      .split(/\n+/)
      .map(x => x.trim())
      .filter(Boolean);

    if(!terms.length) return alert("Digite pelo menos um bairro.");

    generatedSearches = terms.map(term => ({
      term,
      query: buildQuery(term),
      url: buildUrl(term)
    }));

    const results = getResultsBox();
    results.innerHTML = generatedSearches.map(item => `
      <div class="search-row-fix">
        <div>
          <b>${item.term} RJ</b>
          <small>${item.url}</small>
        </div>
        <a class="btn blue" href="${item.url}" target="_blank" rel="noopener">Abrir</a>
      </div>
    `).join("");

    alert(`${generatedSearches.length} buscas geradas.`);
  }

  function openAll(){
    if(!generatedSearches.length) generateSearches();
    if(!generatedSearches.length) return;

    generatedSearches.forEach((item, index) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = item.url;
        a.target = "_blank";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, index * 500);
    });
  }

  async function copyAll(){
    if(!generatedSearches.length) generateSearches();
    if(!generatedSearches.length) return;

    const text = generatedSearches.map(i => i.url).join("\n");
    await navigator.clipboard.writeText(text).catch(()=>{});
    alert("Buscas copiadas.");
  }

  function bind(){
    const buttons = Array.from(document.querySelectorAll("button,a"));

    buttons.forEach(btn => {
      const t = String(btn.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");

      if(t.includes("gerar buscas")){
        btn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); generateSearches(); return false; };
      }

      if(t.includes("abrir todas as buscas") || t.includes("abrir buscas")){
        btn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); openAll(); return false; };
      }

      if(t.includes("copiar buscas")){
        btn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); copyAll(); return false; };
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bind();
    setTimeout(bind, 600);
    setTimeout(bind, 1500);
  });

  window.gerarBuscasIdeal = generateSearches;
  window.abrirBuscasIdeal = openAll;
  window.copiarBuscasIdeal = copyAll;
})();
