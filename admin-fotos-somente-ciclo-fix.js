
/* FIX: FOTOS SOMENTE NA ABA CICLO */
(function(){
  const PHOTO_KEY = "ideal_admin_post_photos_v1";

  function loadPhotos(){
    try { return JSON.parse(localStorage.getItem(PHOTO_KEY) || "[]"); } catch(e){ return []; }
  }

  function savePhotos(list){
    localStorage.setItem(PHOTO_KEY, JSON.stringify(list));
  }

  function removeWrongPhotoAreas(){
    document.querySelectorAll("#postPhotosAreaIdeal,.photos-area-fix").forEach(area=>{
      const insideCycle = area.closest("#ciclo");
      if(!insideCycle) area.remove();
    });
  }

  function getCyclePage(){
    return document.getElementById("ciclo");
  }

  function ensurePhotoArea(){
    removeWrongPhotoAreas();

    const cycle = getCyclePage();
    if(!cycle) return;

    if(cycle.querySelector("#postPhotosAreaIdeal")) return;

    const card = Array.from(cycle.querySelectorAll(".card,.panel,section,div")).find(el=>{
      const t = String(el.textContent || "").toLowerCase();
      return t.includes("ciclo de divulgação") || t.includes("ciclo de divulgacao");
    }) || cycle;

    const area = document.createElement("div");
    area.id = "postPhotosAreaIdeal";
    area.className = "photos-area-fix";
    area.innerHTML = `
      <h3>📸 Fotos da postagem</h3>
      <p>Adicione quantas fotos quiser para anexar manualmente na publicação.</p>
      <div class="photos-actions-fix">
        <label class="btn blue">
          Adicionar fotos
          <input id="postPhotosInputIdeal" type="file" accept="image/*" multiple hidden>
        </label>
        <button id="clearPostPhotosIdeal" type="button" class="btn red">Limpar fotos</button>
      </div>
      <div id="postPhotosPreviewIdeal" class="photos-preview-fix"></div>
    `;

    card.appendChild(area);
    bindPhotos();
    renderPhotos();
  }

  function bindPhotos(){
    const input = document.getElementById("postPhotosInputIdeal");
    const clear = document.getElementById("clearPostPhotosIdeal");

    if(input){
      input.onchange = async function(e){
        const files = Array.from(e.target.files || []);
        if(!files.length) return;

        const list = loadPhotos();

        for(const file of files){
          if(!file.type.startsWith("image/")) continue;
          const data = await new Promise((resolve,reject)=>{
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          list.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            name: file.name,
            size: file.size,
            data
          });
        }

        savePhotos(list);
        input.value = "";
        renderPhotos();
      };
    }

    if(clear){
      clear.onclick = function(){
        if(!confirm("Remover todas as fotos da postagem?")) return;
        savePhotos([]);
        renderPhotos();
      };
    }
  }

  function renderPhotos(){
    const box = document.getElementById("postPhotosPreviewIdeal");
    if(!box) return;

    const photos = loadPhotos();

    if(!photos.length){
      box.innerHTML = '<p class="muted-fix">Nenhuma foto adicionada.</p>';
      return;
    }

    box.innerHTML = photos.map((p,idx)=>`
      <div class="photo-item-fix">
        <img src="${p.data}" alt="${p.name || "foto"}">
        <div>
          <b>${p.name || "Foto " + (idx+1)}</b>
          <small>${Math.round((p.size || 0) / 1024)} KB</small>
          <button type="button" class="btn red mini" data-remove-photo="${p.id}">Excluir</button>
        </div>
      </div>
    `).join("");

    box.querySelectorAll("[data-remove-photo]").forEach(btn=>{
      btn.onclick = function(){
        savePhotos(loadPhotos().filter(p=>p.id !== btn.dataset.removePhoto));
        renderPhotos();
      };
    });
  }

  function boot(){
    removeWrongPhotoAreas();
    ensurePhotoArea();
    setInterval(()=>{
      removeWrongPhotoAreas();
      const cycleVisible = document.getElementById("ciclo")?.classList.contains("active") || document.getElementById("ciclo")?.style.display === "block";
      if(cycleVisible) ensurePhotoArea();
    }, 1000);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
