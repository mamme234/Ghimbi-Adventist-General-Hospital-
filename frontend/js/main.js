/* main.js
   - Website Logic
   - Navigation
   - Hero Animation
*/
import { fetchJSON } from './api.js';

export function initMain(){
  setupNavToggle();
  initHero();
  // Example: prefetch site info from backend
  hydrateSiteInfo();
}

function setupNavToggle(){
  const btn = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav-links');
  if(!btn || !nav) return;
  btn.addEventListener('click', ()=>{
    const open = nav.getAttribute('data-open') === 'true';
    nav.setAttribute('data-open', (!open).toString());
    nav.style.display = open ? 'none' : 'flex';
  });
}

function initHero(){
  const hero = document.querySelector('.hero');
  if(!hero) return;
  // subtle float animation for large hero images
  hero.animate([
    { transform: 'translateY(0px)' },
    { transform: 'translateY(-8px)' },
    { transform: 'translateY(0px)' }
  ], { duration: 8000, iterations: Infinity });
}

async function hydrateSiteInfo(){
  try{
    const data = await fetchJSON('/api/site-info');
    // Example: populate element .site-title
    const el = document.querySelector('.site-title');
    if(el && data && data.title) el.textContent = data.title;
  }catch(err){
    // silent fail - backend might not exist in all environments
    console.warn('Could not hydrate site info', err);
  }
}

// Auto-init when loaded as a script module in browser
if(typeof window !== 'undefined'){
  document.addEventListener('DOMContentLoaded', ()=>{
    initMain();
  });
}
