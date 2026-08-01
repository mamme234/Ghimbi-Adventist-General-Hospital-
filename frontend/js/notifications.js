/* notifications.js
   - Notifications
   - Toast
*/
export function showToast(message, opts = {}){
  const root = document.querySelector('.toast') || createToastRoot();
  const item = document.createElement('div');
  item.className = 'item';
  item.textContent = message;
  root.appendChild(item);
  setTimeout(()=>{item.remove();}, opts.duration || 4000);
}
function createToastRoot(){
  const r = document.createElement('div');r.className='toast';document.body.appendChild(r);return r;
}
