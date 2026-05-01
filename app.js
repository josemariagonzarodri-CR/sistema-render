// app.js
import { cargarVistaCompras } from './modules/compras.js';

// Elementos del DOM
const btnCompras = document.getElementById('btn-compras');
const btnCalendario = document.getElementById('btn-calendario');
const vistaTitulo = document.getElementById('vista-titulo');
const statusDb = document.getElementById('status-db');
const moduloContenido = document.getElementById('modulo-contenido');

// Inicialización de la SPA
document.addEventListener('DOMContentLoaded', () => {
    vistaTitulo.textContent = 'Sistema Listo';
    statusDb.textContent = 'Arquitectura Modular Iniciada';
    statusDb.style.color = '#00ff66';
});

// Enrutador Simple (Cambio de vistas)
btnCompras.addEventListener('click', () => {
    vistaTitulo.textContent = 'Control de Compras y Presupuesto';
    cargarVistaCompras(moduloContenido);
});

btnCalendario.addEventListener('click', () => {
    vistaTitulo.textContent = 'Menú Semanal y Preparación';
    moduloContenido.innerHTML = '<p class="text-blue">El módulo del calendario se conectará aquí.</p>';
});