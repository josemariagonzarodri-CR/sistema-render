const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const multer = require('multer'); 
const { createClient } = require('@supabase/supabase-js'); 
require('dotenv').config(); 

const app = express();
app.use(cors());
app.use(express.json());

// 1. Servir tu archivo index.html
app.use(express.static(path.join(__dirname, 'public')));

// 2. Conexión a la Base de Datos Postgres (Render/Supabase)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 3. Configuración de Supabase Storage y Multer
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// 🔐 NUEVO SISTEMA DE AUTENTICACIÓN (SUPABASE)
// ==========================================

// El middleware ahora valida la "Llave Maestra" (Token) directamente con Supabase
const verificarToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: 'Acceso denegado. Inicia sesión.' });

    const token = authHeader.split(' ')[1]; 
    
    try {
        // Le preguntamos a Supabase si este token es válido y a quién pertenece
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'denegado' }); // Esta palabra clave activa el re-login en el index.html
        }

        // Sistema dinámico de roles basado en el correo electrónico
        let rolAsignado = 'admin'; // Chema, Mel y Bely son admin por defecto
        if (user.email.toLowerCase().includes('bri')) {
            rolAsignado = 'creador'; // Mantenemos el rol limitado para Bri
        }

        req.usuario = {
            id: user.email.split('@')[0], // Usamos la primera parte del correo como ID temporal
            rol: rolAsignado,
            email: user.email
        };

        next();
    } catch (err) {
        return res.status(401).json({ error: 'denegado' });
    }
};

// ==========================================
// FUNCIÓN LIMPIADORA DE NOMBRES DE ARCHIVO
// ==========================================
function limpiarNombreArchivo(nombre) {
    return nombre
        .normalize("NFD") 
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/\s+/g, '_') 
        .replace(/[^a-zA-Z0-9._-]/g, ''); 
}

// ==========================================
// RUTAS PARA EVENTOS (BLINDADAS Y CON ARCHIVOS)
// ==========================================
app.get('/api/eventos', verificarToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eventos');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/eventos', verificarToken, upload.single('archivo'), async (req, res) => {
    try {
        const { dia, mes, anio, titulo, tipo, hora, responsable_id, responsable_nombre, prioridad } = req.body;
        let archivo_url = null;

        if (req.file) {
            const nombreLimpio = limpiarNombreArchivo(req.file.originalname);
            const fileName = `${Date.now()}_${nombreLimpio}`;
            
            const { data, error } = await supabase.storage
                .from('archivos_medicos')
                .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('archivos_medicos')
                .getPublicUrl(fileName);
            
            archivo_url = publicUrlData.publicUrl;
        }

        const result = await pool.query(
            'INSERT INTO eventos (dia, mes, anio, titulo, tipo, hora, responsable_id, responsable_nombre, prioridad, archivo_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [parseInt(dia), parseInt(mes), parseInt(anio), titulo, tipo, hora, responsable_id, responsable_nombre, prioridad, archivo_url]
        );
        res.json({ success: true, info: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/eventos', verificarToken, async (req, res) => {
    if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'No tienes permisos para editar eventos.' });

    try {
        const { id, dia, mes, anio, titulo, tipo, hora, responsable_id, responsable_nombre, prioridad } = req.body;
        const result = await pool.query(
            'UPDATE eventos SET dia=$1, mes=$2, anio=$3, titulo=$4, tipo=$5, hora=$6, responsable_id=$7, responsable_nombre=$8, prioridad=$9 WHERE id=$10 RETURNING *',
            [parseInt(dia), parseInt(mes), parseInt(anio), titulo, tipo, hora, responsable_id, responsable_nombre, prioridad, id]
        );
        res.json({ success: true, info: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/eventos', verificarToken, async (req, res) => {
    if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'No tienes permisos para eliminar eventos.' });

    try {
        const { id } = req.body;
        await pool.query('DELETE FROM eventos WHERE id=$1', [id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// RUTAS PARA TAREAS (BLINDADAS)
// ==========================================
app.get('/api/tareas', verificarToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tareas_diarias');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tareas', verificarToken, async (req, res) => {
    try {
        const { titulo, descripcion, responsable_id, responsable_nombre, hora, ampm, prioridad, fecha } = req.body;
        const result = await pool.query(
            'INSERT INTO tareas_diarias (titulo, descripcion, responsable_id, responsable_nombre, hora, ampm, prioridad, fecha) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [titulo, descripcion, responsable_id, responsable_nombre, hora, ampm, prioridad, fecha]
        );
        res.json({ success: true, info: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/tareas', verificarToken, async (req, res) => {
    try {
        const { id, titulo, descripcion, responsable_id, responsable_nombre, hora, ampm, prioridad, fecha, completada } = req.body;
        let result;
        
        if (titulo !== undefined) {
            if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'No tienes permisos para modificar textos de tareas.' });

            result = await pool.query(
                'UPDATE tareas_diarias SET titulo=$1, descripcion=$2, responsable_id=$3, responsable_nombre=$4, hora=$5, ampm=$6, prioridad=$7, fecha=$8 WHERE id=$9 RETURNING *',
                [titulo, descripcion, responsable_id, responsable_nombre, hora, ampm, prioridad, fecha, id]
            );
        } else {
            result = await pool.query('UPDATE tareas_diarias SET completada=$1 WHERE id=$2 RETURNING *', [completada ? 1 : 0, id]);
        }
        res.json({ success: true, info: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/tareas', verificarToken, async (req, res) => {
    if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'No tienes permisos para eliminar tareas.' });

    try {
        const { id } = req.body;
        await pool.query('DELETE FROM tareas_diarias WHERE id=$1', [id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Encender el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en el puerto ${PORT}`));