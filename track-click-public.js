
(function(){
  const p=new URLSearchParams(location.search);
  const src=p.get('src')||'';
  const bairro=p.get('bairro')||'';
  const grupo=p.get('grupo')||src||'';
  if(!src&&!bairro&&!grupo)return;
  const key='ideal_click_sent_'+src+'_'+bairro+'_'+new Date().toISOString().slice(0,10);
  if(sessionStorage.getItem(key))return;
  sessionStorage.setItem(key,'1');
  fetch('/api/track-click?src='+encodeURIComponent(src)+'&bairro='+encodeURIComponent(bairro)+'&grupo='+encodeURIComponent(grupo)+'&url='+encodeURIComponent(location.href),{cache:'no-store'}).catch(()=>{});
})();
