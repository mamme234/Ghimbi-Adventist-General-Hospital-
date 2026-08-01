// Basic API helper that uses relative /api or window.API_BASE
window.api = (function(){
  const BASE = (window.API_BASE || window.NEXT_PUBLIC_API_URL || '') ;
  async function request(method, path, body){
    const url = path.startsWith('http') ? path : (BASE ? BASE + path : path);
    const opts = {method,headers:{'Content-Type':'application/json'},mode:'cors'};
    if(body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    if(!res.ok) throw new Error('API error '+res.status);
    return res.json().catch(()=>null);
  }
  return {get:(p)=>request('GET',p),post:(p,b)=>request('POST',p,b),put:(p,b)=>request('PUT',p,b),delete:(p)=>request('DELETE',p)};
})();
