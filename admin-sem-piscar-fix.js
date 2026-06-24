
/* FIX: PARA TELA PISCANDO / RECONSTRUINDO */
(function(){
  let bancoInstalled = false;

  function stopIntervals(){
    // Bloqueia reconstruções agressivas que causavam piscada
    if(window.__idealNoBlinkInstalled) return;
    window.__idealNoBlinkInstalled = true;

    const oldSetInterval = window.setInterval;
    window.setInterval = function(fn, time){
      const txt = String(fn || "");
      if(
        txt.includes("install()") ||
        txt.includes("ensure()") ||
        txt.includes("clearOld") ||
        txt.includes("bancoSimples") ||
        txt.includes("removeOldBlocks")
      ){
        return 0;
      }
      return oldSetInterval(fn, time);
    };
  }

  function stabilizeBanco(){
    const banco = document.getElementById("bancoSimples");
    if(banco){
      bancoInstalled = true;
      banco.dataset.estavel = "ok";
    }

    // Impede scripts antigos de removerem o banco final
    const observer = new MutationObserver(function(){
      const b = document.getElementById("bancoSimples");
      if(b && bancoInstalled){
        b.style.display = "grid";
      }
    });

    observer.observe(document.body, {childList:true, subtree:true});
  }

  function boot(){
    stopIntervals();
    stabilizeBanco();
    setTimeout(stabilizeBanco,500);
    setTimeout(stabilizeBanco,1500);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();
