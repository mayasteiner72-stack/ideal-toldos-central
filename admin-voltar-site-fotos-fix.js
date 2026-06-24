
/* FIX VOLTAR AO SITE + FOTOS NA POSTAGEM */
(function(){
  const PHOTO_KEY = "ideal_admin_post_photos_v1";

  function loadPhotos(){
    try { return JSON.parse(localStorage.getItem(PHOTO_KEY) || "[]"); } catch(e){ return []; }
  }

  function savePhotos(list){
    localStorage.setItem(PHOTO_KEY, JSON.stringify(list));
  }

  function ensureBackButton(){
    if(document.getElementById("btnVoltarSiteIdeal")) return;

    const btn = document.createElement("a");
    btn.id = "btnVoltarSiteIdeal";
    btn.href = "/";
    btn.className = "btn blue voltar-site-fix";
    btn.textContent = "← Voltar ao site";
    btn.title = "Voltar para o site público";

    const sidebar = document.querySelector(".sidebar");
    if(sidebar){
      const brand = sidebar.querySelector(".brand") || sidebar.firstElementChild;
      if(brand && brand.parentNode){
        brand.parentNode.insertBefore(btn, brand.nextSibling);
      }else{
        sidebar.prepend(btn);
      }
      return;
    }

    document.body.prepend(btn);
  }

  function findCycleCard(){
    const cards = Array.from(document.querySelectorAll(".card,.panel,section,div"));
    return cards.find(el => {
      const txt = String(el.textContent || "").toLowerCase();
      return txt.includes("ciclo de divulgação") || txt.includes("ciclo de divulgacao");
    });
  }

  function ensurePhotoArea(){
    if(document.getElementById("postPhotosAreaIdeal")) return;

    const card = findCycleCard();
    if(!card) return;

    const area = document.createElement("div");
    area.id = "postPhotosAreaIdeal";
    area.className = "photos-area-fix";
    area.innerHTML = `
      <h3>📸 Fotos da postagem</h3>
      <p>Adicione quantas fotos quiser para usar na postagem. O sistema mantém as fotos nesta máquina/navegador.</p>
      <label class="btn blue photos-upload-label">
        Adicionar fotos
        <input id="postPhotosInputIdeal" type="file" accept="image/*" multiple hidden>
      </label>
      <button id="clearPostPhotosIdeal" type="button" class="btn red">Limpar fotos</button>
      <div id="postPhotosPreviewIdeal" class="photos-preview-fix"></div>
    `;

    const textarea = card.querySelector("textarea");
    if(textarea && textarea.parentNode){
      textarea.parentNode.insertBefore(area, textarea.nextSibling);
    }else{
      card.appendChild(area);
    }

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

        const existing = loadPhotos();

        for(const file of files){
          if(!file.type.startsWith("image/")) continue;
          const data = await fileToDataUrl(file);
          existing.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            name: file.name,
            size: file.size,
            data
          });
        }

        savePhotos(existing);
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

  function fileToDataUrl(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function renderPhotos(){
    const box = document.getElementById("postPhotosPreviewIdeal");
    if(!box) return;

    const photos = loadPhotos();

    if(!photos.length){
      box.innerHTML = '<p class="muted-fix">Nenhuma foto adicionada.</p>';
      return;
    }

    box.innerHTML = photos.map((p, idx)=>`
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
        const id = btn.dataset.removePhoto;
        savePhotos(loadPhotos().filter(p => p.id !== id));
        renderPhotos();
      };
    });
  }

  function patchCopyMessage(){
    Array.from(document.querySelectorAll("button,a")).forEach(btn=>{
      const t = String(btn.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      if(t.includes("copiar mensagem")){
        const old = btn.onclick;
        btn.onclick = async function(e){
          if(typeof old === "function"){
            const r = old.call(this, e);
          }
          const photos = loadPhotos();
          if(photos.length){
            setTimeout(()=>alert(`${photos.length} foto(s) separadas para anexar manualmente na publicação.`), 300);
          }
          return false;
        };
      }
    });
  }

  function boot(){
    ensureBackButton();
    ensurePhotoArea();
    patchCopyMessage();
    setInterval(()=>{
      ensureBackButton();
      ensurePhotoArea();
      patchCopyMessage();
    }, 1500);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.idealPostPhotos = {loadPhotos, savePhotos, renderPhotos};
})();
