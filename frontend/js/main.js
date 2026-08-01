// Simple component loader: inserts HTML from components into elements with data-include
(async function(){
  const includes = document.querySelectorAll('[data-include]');
  for(const el of includes){
    const path = el.getAttribute('data-include');
    try{
      const res = await fetch(path);
      if(res.ok){
        const html = await res.text();
        el.innerHTML = html;
      }else{
        el.innerHTML = '<!-- include not found: '+path+' -->';
      }
    }catch(e){
      el.innerHTML = '<!-- include failed -->';
    }
  }
})();

