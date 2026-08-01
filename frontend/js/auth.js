/* auth.js
   - Login
   - Logout
   - JWT Token
*/
import { fetchJSON } from './api.js';

export async function login(credentials){
  return fetchJSON('/api/auth/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(credentials)});
}
export function logout(){
  // Clear token storage
  localStorage.removeItem('auth_token');
}
export function setToken(token){
  localStorage.setItem('auth_token', token);
}
export function getToken(){
  return localStorage.getItem('auth_token');
}
