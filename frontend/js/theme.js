// theme.js — toggles themes
(function(){
  const t = localStorage.getItem('theme');
  if(t) document.documentElement.setAttribute('data-theme', t);
  window.toggleTheme = function(){
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }
})();
