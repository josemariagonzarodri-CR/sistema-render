// modules/compras.js
import { supabase } from '../services/supabase.js';

export async function cargarVistaCompras(contenedor) {
    contenedor.innerHTML = `
        <h3 style="color: #00aaff; margin-bottom: 15px;">Módulo de Compras Activo</h3>
        <p>Iniciando sesión de escaneo...</p>
        <div style="margin-top: 20px;">
            <button class="btn-vibrant-blue" id="test-query">Probar Conexión Supabase</button>
        </div>
        <div id="resultado-query" style="margin-top: 15px; font-weight: bold;"></div>
    `;

    // Asignar evento al botón dinámico
    document.getElementById('test-query').addEventListener('click', async () => {
        const resultadoDiv = document.getElementById('resultado-query');
        resultadoDiv.textContent = "Consultando...";
        resultadoDiv.className = "text-blue";

        try {
            const { data, error } = await supabase.from('cat_supermercados').select('*');
            if (error) throw error;
            
            resultadoDiv.textContent = `¡Éxito! Encontré ${data.length} supermercados en la BD.`;
            resultadoDiv.style.color = '#00ff66';
        } catch (err) {
            console.error("Incidente Abierto:", err);
            resultadoDiv.textContent = "Error de conexión. Revisa las llaves en supabase.js";
            resultadoDiv.className = "alert-critical";
        }
    });
}