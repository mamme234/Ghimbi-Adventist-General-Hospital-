/* frontend/js/api.js
   - Connect Backend
   - Fetch Data
   - BASE URL set to provided Render URL
*/
export const API_BASE = 'https://ghimbi-adventist-general-hospital-1.onrender.com/';

async function handleResponse(res){
  const contentType = res.headers.get('content-type') || '';
  if(!res.ok){
    let body = null;
    try{ body = contentType.includes('application/json') ? await res.json() : await res.text() }catch(e){ body = null }
    const err = new Error('API request failed');
    err.status = res.status; err.body = body; throw err;
  }
  if(contentType.includes('application/json')) return res.json();
  return res.text();
}

export async function fetchJSON(path, options = {}){
  const url = new URL(path, API_BASE).toString();
  const opts = Object.assign({headers: {'Accept':'application/json'}}, options);
  const res = await fetch(url, opts);
  return handleResponse(res);
}

// Convenience on window for non-module consumers
if(typeof window !== 'undefined') window.API_BASE = API_BASE;
