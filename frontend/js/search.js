/* search.js
   - Global Search
*/
import { fetchJSON } from './api.js';
export async function search(query){
  if(!query) return [];
  return fetchJSON(`/api/search?q=${encodeURIComponent(query)}`);
}
