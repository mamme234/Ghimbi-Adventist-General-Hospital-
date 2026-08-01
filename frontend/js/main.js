// main.js — component loader and basic UX
(async function(){
  const includes = document.querySelectorAll('[data-include]');
  for(const el of includes){
    const url = el.getAttribute('data-include');
    try{
      const res = await fetch(url.replace(/^\//,''));
      if(res.ok) el.innerHTML = await res.text();
    }catch(e){console.warn('include failed',url)}
  }
})();
