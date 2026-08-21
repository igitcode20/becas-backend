const express = require('express');
const { generarExcel, generarPDF, generarFotosZip } = require('../controllers/reporteController');
const { verificarToken, esAdmin } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación y ser admin
router.use(verificarToken);
router.use(esAdmin);

// Generar reporte Excel
router.get('/excel', generarExcel);

// Generar reporte PDF
router.get('/pdf', generarPDF);

// Generar ZIP con todas las fotos
router.get('/fotos', generarFotosZip);

module.exports = router;