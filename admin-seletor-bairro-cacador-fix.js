
/* FIX SELETOR DE BAIRRO NO CAÇADOR 2.0 */
(function(){
  const BAIRROS = [
    "Campo Grande","Cosmos","Paciência","Santa Cruz","Bangu","Realengo","Senador Camará","Senador Vasconcelos",
    "Santíssimo","Inhoaíba","Guaratiba","Sepetiba","Pedra de Guaratiba","Recreio dos Bandeirantes","Barra da Tijuca",
    "Vargem Grande","Vargem Pequena","Jacarepaguá","Taquara","Freguesia","Pechincha","Anil","Curicica","Cidade de Deus",
    "Gardênia Azul","Padre Miguel","Magalhães Bastos","Vila Kennedy","Jabour","Deodoro","Vila Militar","Sulacap",
    "Praça Seca","Tanque","Méier","Madureira","Irajá","Tijuca","Vila Isabel","Penha","Pavuna","Cascadura",
    "Engenho de Dentro","Bonsucesso","Copacabana","Ipanema","Leblon","Botafogo","Flamengo","Centro","Lapa",
    "Nova Iguaçu","Duque de Caxias","Belford Roxo","São João de Meriti","Nilópolis","Niterói","São Gonçalo"
  ];

  function findCacadorPanel(){
    return Array.from(document.querySelectorAll(".card,.panel,section,div")).find(el=>{
      const t = String(el.textContent || "").toLowerCase();
      return t.includes("caçador de links 2.0") || t.includes("cacador de links 2.0");
    });
  }

  function findBairroInput(panel){
    return panel.querySelector("#hunter2DefaultRegion")
      || panel.querySelector("#bulkRegionDefault")
      || panel.querySelector("#bulkBairro")
      || Array.from(panel.querySelectorAll("input")).find(i=>{
        const p = String(i.placeholder || "").toLowerCase();
        return p.includes("bairro padrão") || p.includes("bairro padrao") || p.includes("bairro");
      });
  }

  function applyBairro(value){
    const panel = findCacadorPanel();
    if(!panel) return;

    const input = findBairroInput(panel);
    if(input){
      input.value = value;
      input.dispatchEvent(new Event("input", {bubbles:true}));
      input.dispatchEvent(new Event("change", {bubbles:true}));
    }
  }

  function buildSelect(){
    const wrap = document.createElement("div");
    wrap.id = "bairroCacadorWrap";
    wrap.className = "bairro-cacador-wrap";
    wrap.innerHTML = `
      <div class="bairro-cacador-head">
        <b>📍 Bairro para salvar os grupos</b>
        <small>Escolha ou pesquise o bairro antes de extrair/salvar.</small>
      </div>
      <div class="bairro-cacador-grid">
        <input id="buscarBairroCacador" placeholder="Buscar bairro... Ex: Campo Grande">
        <select id="seletorBairroCacador">
          <option value="">Selecionar bairro</option>
          ${BAIRROS.map(b=>`<option value="${b}">${b}</option>`).join("")}
        </select>
      </div>
    `;

    const busca = wrap.querySelector("#buscarBairroCacador");
    const select = wrap.querySelector("#seletorBairroCacador");

    busca.oninput = function(){
      const q = String(busca.value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      select.innerHTML = '<option value="">Selecionar bairro</option>' + BAIRROS
        .filter(b => b.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").includes(q))
        .map(b=>`<option value="${b}">${b}</option>`)
        .join("");

      const exact = BAIRROS.find(b => b.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"") === q);
      if(exact){
        select.value = exact;
        applyBairro(exact);
      }
    };

    select.onchange = function(){
      if(select.value){
        busca.value = select.value;
        applyBairro(select.value);
      }
    };

    return wrap;
  }

  function inject(){
    if(document.getElementById("bairroCacadorWrap")) return;

    const panel = findCacadorPanel();
    if(!panel) return;

    const input = findBairroInput(panel);
    const wrap = buildSelect();

    if(input && input.parentNode){
      input.parentNode.insertBefore(wrap, input);
    }else{
      const p = panel.querySelector("p") || panel.firstElementChild;
      if(p && p.parentNode) p.parentNode.insertBefore(wrap, p.nextSibling);
      else panel.prepend(wrap);
    }
  }

  function boot(){
    inject();
    setTimeout(inject, 700);
    setTimeout(inject, 1600);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
