const express = require('express');
const {
  generarExcel,
  generarPDF,
  generarFotosZip
} = require('../controllers/reporteController');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Generar reporte Excel (con filtro por sección)
router.get('/excel', generarExcel);

// Generar reporte PDF (con filtro por sección)
router.get('/pdf', generarPDF);

// Generar ZIP con todas las fotos (con filtro por sección)
router.get('/fotos', generarFotosZip);

module.exports = router;