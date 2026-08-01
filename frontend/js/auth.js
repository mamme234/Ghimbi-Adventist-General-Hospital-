// auth.js — handles simple login form
document.addEventListener('DOMContentLoaded', ()=>{
  const form = document.getElementById('login-form');
  if(!form) return;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    try{
      const res = await window.api.post('/auth/login', data);
      localStorage.setItem('token', res.token);
      window.location.href = '/patient-dashboard.html';
    }catch(err){
      document.getElementById('login-message').textContent = 'Login failed';
    }
  })
});
