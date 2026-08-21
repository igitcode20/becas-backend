const express = require('express');
const {
  obtenerBecas,
  obtenerBeca,
  actualizarEstado,
  subirFoto,
  obtenerEstadisticas
} = require('../controllers/becaController');
const { verificarToken, verificarAccesoSeccion } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Estadísticas
router.get('/estadisticas', obtenerEstadisticas);

// Obtener becas (con filtros)
router.get('/', obtenerBecas);

// Obtener una beca específica
router.get('/:id', obtenerBeca);

// Actualizar estado de una beca
router.put('/:id/estado', actualizarEstado);

// Subir foto de una beca
router.post('/:id/foto', subirFoto);

module.exports = router;