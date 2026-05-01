// services/supabase.js

// 1. Obtener la variable global inyectada por el CDN en el HTML
const supabaseObj = window.supabase;

// 2. Coloca aquí las llaves exactas de tu proyecto en Supabase
const supabaseUrl = 'https://wrtonvmcnsvsograemsl.supabase.co';
const supabaseKey = 'sb_publishable_ct2g0DbkFpR-qyzHR6Xxgg_YiOC-PbL';

// 3. Crear y exportar el cliente para que el resto de la app lo use
export const supabase = supabaseObj.createClient(supabaseUrl, supabaseKey);