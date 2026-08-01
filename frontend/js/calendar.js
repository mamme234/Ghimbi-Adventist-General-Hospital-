/* calendar.js
   - Appointment Calendar
*/
export function initCalendar(container){
  // Hook up FullCalendar or simple calendar rendering
  container = typeof container === 'string' ? document.querySelector(container) : container;
  if(!container) return;
  container.innerHTML = '<p>Calendar placeholder</p>';
}
