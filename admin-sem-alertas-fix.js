
/* FIX SEM ALERTAS TRAVANDO O RITMO */
(function(){
  const nativeAlert = window.alert;

  function ensureToastBox(){
    let box = document.getElementById("toastIdealBox");
    if(!box){
      box = document.createElement("div");
      box.id = "toastIdealBox";
      document.body.appendChild(box);
    }
    return box;
  }

  function toast(msg){
    const box = ensureToastBox();
    const item = document.createElement("div");
    item.className = "toast-ideal";
    item.textContent = String(msg || "Pronto.");
    box.appendChild(item);

    setTimeout(()=>item.classList.add("show"), 20);
    setTimeout(()=>{
      item.classList.remove("show");
      setTimeout(()=>item.remove(), 300);
    }, 2200);
  }

  // Troca alert por aviso pequeno. Confirm continua funcionando para excluir/zerar.
  window.alert = function(msg){
    toast(msg);
  };

  // Remove alertas repetidos de mensagem copiada, mas mantém feedback leve.
  document.addEventListener("click", function(e){
    const btn = e.target.closest("button,a");
    if(!btn) return;

    const t = String(btn.textContent || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");

    if(t.includes("copiar mensagem") || t.includes("copiar link")){
      setTimeout(()=>toast("Copiado."), 250);
    }
  }, true);

  window.toastIdeal = toast;
})();
