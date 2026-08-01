// api.js — small wrapper that uses relative paths or API_BASE
window.api = (function(){
  const BASE = window.API_BASE || '';
  async function req(method,path,body){
    const url = path.startsWith('http') ? path : (BASE + path);
    const opts = {method,headers:{'Content-Type':'application/json'}};
    if(body) opts.body = JSON.stringify(body);
    const res = await fetch(url,opts);
    if(!res.ok) throw new Error('API error '+res.status);
    return res.json().catch(()=>null);
  }
  return {get:p=>req('GET',p),post:(p,b)=>req('POST',p,b),put:(p,b)=>req('PUT',p,b),delete:p=>req('DELETE',p)};
})();
