const express = require('express');
const { registrarUsuario, login, obtenerUsuarios } = require('../controllers/authController');
const { verificarToken, esAdmin } = require('../middleware/auth');

const router = express.Router();

// Rutas públicas
router.post('/register', registrarUsuario);
router.post('/login', login);

// Rutas protegidas
router.get('/usuarios', verificarToken, esAdmin, obtenerUsuarios);

module.exports = router;