
/* FIX LINK RASTREAVEL + EXCLUIR GRUPOS */
(function(){
  const MASTER_KEY = "ideal_admin_master_v1";
  const FIX_KEY = "ideal_admin_fix_v1";

  function read(key){
    try{return JSON.parse(localStorage.getItem(key)||"{}")}catch(e){return{}}
  }

  function write(key,data){
    localStorage.setItem(key, JSON.stringify(data));
  }

  function norm(url){
    url = String(url||"").trim();
    if(!url) return "";
    return url.replace(/\/$/,"");
  }

  function getState(){
    const master = read(MASTER_KEY);
    const fix = read(FIX_KEY);
    const groups = []
      .concat(Array.isArray(master.groups)?master.groups:[])
      .concat(Array.isArray(fix.groups)?fix.groups:[]);
    const map = new Map();
    groups.forEach(g=>{
      if(!g.url) return;
      map.set(norm(g.url), {
        ...g,
        bairro: g.bairro || g.region || g.regiao || "",
        region: g.region || g.bairro || g.regiao || ""
      });
    });
    master.groups = Array.from(map.values());
    fix.groups = master.groups;
    write(MASTER_KEY, master);
    write(FIX_KEY, fix);
    return master;
  }

  function saveState(state){
    write(MASTER_KEY, state);
    const fix = read(FIX_KEY);
    fix.groups = state.groups || [];
    fix.current = state.current || null;
    fix.cycle = state.cycle || [];
    fix.index = state.index || 0;
    write(FIX_KEY, fix);
  }

  function tracking(group){
    if(!group) return location.origin;
    return location.origin + "/?src=" + encodeURIComponent(group.id || group.url) + "&bairro=" + encodeURIComponent(group.bairro || group.region || "");
  }

  function currentMessage(){
    const state = getState();
    const current = state.current || (Array.isArray(state.cycle) ? state.cycle[state.index] : null);
    const models = Array.isArray(state.models) ? state.models.filter(x=>String(x||"").trim()) : [];
    let msg = models.length ? models[Math.max(0, Number(state.index||0)) % models.length] : "";
    if(!msg) msg = "🏠 Proteja e valorize seu imóvel com quem entende do assunto!\n\n✅ Toldos retráteis e fixos\n✅ Coberturas de policarbonato\n✅ ACM e letreiros\n✅ Instalação profissional\n\n📲 Solicite seu orçamento: {LINK}";
    const link = tracking(current);
    msg = msg.replaceAll("{LINK}", link).replaceAll("[LINK]", link).replaceAll("{{LINK}}", link);
    if(!msg.includes(link)) msg += "\n\n📲 Solicite seu orçamento: " + link;
    return msg;
  }

  async function copyMessage(){
    const msg = currentMessage();
    await navigator.clipboard.writeText(msg).catch(()=>{});
    alert("Mensagem com link rastreável copiada.");
  }

  function renderDeleteButtons(){
    const state = getState();
    const groups = Array.isArray(state.groups) ? state.groups : [];

    // Procura linhas de grupo já renderizadas e injeta excluir/link
    document.querySelectorAll(".row,.data-row,.group-row").forEach(row=>{
      const txt = row.textContent || "";
      const found = groups.find(g => txt.includes(g.url) || txt.includes(g.name));
      if(!found || row.dataset.deleteFixed === "ok") return;

      let actions = row.querySelector(".actions");
      if(!actions){
        actions = document.createElement("div");
        actions.className = "actions";
        row.appendChild(actions);
      }

      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "btn blue";
      copy.textContent = "Copiar link de cliques";
      copy.onclick = async()=>{
        await navigator.clipboard.writeText(tracking(found)).catch(()=>{});
        alert("Link rastreável copiado.");
      };

      const del = document.createElement("button");
      del.type = "button";
      del.className = "btn red";
      del.textContent = "Excluir grupo";
      del.onclick = ()=>{
        if(!confirm("Excluir este grupo?")) return;
        const s = getState();
        s.groups = (s.groups||[]).filter(g => norm(g.url) !== norm(found.url) && g.id !== found.id);
        s.cycle = (s.cycle||[]).filter(g => norm(g.url) !== norm(found.url) && g.id !== found.id);
        if(s.current && (norm(s.current.url) === norm(found.url) || s.current.id === found.id)) s.current = null;
        saveState(s);
        location.reload();
      };

      actions.appendChild(copy);
      actions.appendChild(del);
      row.dataset.deleteFixed = "ok";
    });
  }

  function patchButtons(){
    Array.from(document.querySelectorAll("button,a")).forEach(btn=>{
      const t = String(btn.textContent||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      if(t.includes("copiar mensagem")){
        btn.onclick = function(e){
          e.preventDefault();
          e.stopPropagation();
          copyMessage();
          return false;
        };
      }
    });
  }

  function showTrackingInCurrent(){
    const state = getState();
    const current = state.current || (Array.isArray(state.cycle) ? state.cycle[state.index] : null);
    if(!current) return;
    const link = tracking(current);

    ["grupoAtual","currentGroup","dashCurrentGroup","dashGrupoAtual"].forEach(id=>{
      const el = document.getElementById(id);
      if(el && !el.textContent.includes(link)){
        el.innerHTML += `<br><small class="track-line">Link de cliques: ${link}</small>`;
      }
    });

    ["mensagemAtual","currentMessage","dashMessage","dashMensagem"].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.value = currentMessage();
    });
  }

  function boot(){
    patchButtons();
    renderDeleteButtons();
    showTrackingInCurrent();
    setInterval(()=>{
      patchButtons();
      renderDeleteButtons();
      showTrackingInCurrent();
    }, 1200);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.copiarMensagemComLinkIdeal = copyMessage;
})();
