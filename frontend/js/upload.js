/* upload.js
   - Upload Files
*/
import { fetchJSON } from './api.js';
export async function uploadFile(file){
  const fd = new FormData();fd.append('file', file);
  const res = await fetch(new URL('/api/upload', API_BASE).toString(), {method:'POST', body: fd});
  return res.json();
}
