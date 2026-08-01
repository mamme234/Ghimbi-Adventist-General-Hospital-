// auth.js — login form handler (placeholder)
document.addEventListener('DOMContentLoaded', ()=>{
  const f = document.getElementById('login-form');
  if(!f) return;
  f.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(f).entries());
    try{
      const res = await window.api.post('/auth/login', data);
      localStorage.setItem('token', res.token);
      window.location.href = '/patient-portal.html';
    }catch(err){alert('Login failed')}
  });
});
