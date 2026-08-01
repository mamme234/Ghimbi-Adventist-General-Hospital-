/* validation.js
   - Form Validation
*/
export function validateRequired(input){
  return input != null && String(input).trim().length > 0;
}
