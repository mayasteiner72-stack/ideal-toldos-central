
(function(){
  function clean(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
  async function loadClicks(){try{const r=await fetch('/api/clicks?ts='+Date.now(),{cache:'no-store'});const j=await r.json();return Array.isArray(j.clicks)?j.clicks:[]}catch(e){return[]}}
  function setMetric(label,value){document.querySelectorAll('div').forEach(card=>{const t=clean(card.textContent);if(t.includes(clean(label))){const el=[...card.querySelectorAll('b,strong,h1,h2,h3,span')].find(x=>/^(-|\d+)/.test(String(x.textContent||'').trim()));if(el)el.textContent=value;}})}
  function page(){return document.getElementById('relatorios')||[...document.querySelectorAll('section,.page,main,div')].find(el=>clean(el.textContent).includes('relatorios por bairro'))}
  async function render(){const clicks=await loadClicks();const byB={},byG={};clicks.forEach(c=>{const b=c.bairro||'Sem bairro';byB[b]=(byB[b]||0)+1;const g=c.grupo||c.src||'Sem grupo';byG[g]=(byG[g]||0)+1;});const tb=Object.entries(byB).sort((a,b)=>b[1]-a[1])[0];const tg=Object.entries(byG).sort((a,b)=>b[1]-a[1])[0];setMetric('Cliques totais',String(clicks.length));setMetric('Bairro com mais cliques',tb?tb[0]:'-');setMetric('Grupo com mais cliques',tg?tg[0]:'-');const p=page();if(!p)return;let box=document.getElementById('relatorioCliquesReal');if(!box){box=document.createElement('div');box.id='relatorioCliquesReal';box.className='relatorio-real-box';p.appendChild(box);}box.innerHTML='<h2>Cliques por bairro</h2>'+ (Object.entries(byB).sort((a,b)=>b[1]-a[1]).map(([b,n])=>'<div class="click-row-real"><b>'+b+'</b><span>'+n+' clique(s)</span></div>').join('')||'<p>Nenhum clique registrado ainda.</p>');}
  function boot(){render();document.querySelectorAll('button,a,.nav-item,[data-page]').forEach(el=>{if(clean(el.textContent).includes('relatorios'))el.addEventListener('click',()=>setTimeout(render,300));});}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
  window.atualizarRelatorioCliquesReal=render;
})();
