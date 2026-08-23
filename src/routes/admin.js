const express = require('express');
const router = express.Router();
const Beca = require('../models/Beca');
const { verificarToken, esAdmin } = require('../middleware/auth');

// ========== RESTABLECER UN SOLO BECARIO ==========
router.put('/reset-individual/:id', verificarToken, esAdmin, async (req, res) => {
  try {
    const beca = await Beca.findById(req.params.id);
    
    if (!beca) {
      return res.status(404).json({ error: 'Beca no encontrada' });
    }

    // Resetear solo este becario
    beca.estado = 'pendiente';
    beca.detalle = '';
    beca.fecha_entrega = null;
    beca.dia_entrega = null;
    beca.hora_entrega = '';
    // NOTA: La foto NO se elimina, solo se resetea el estado

    await beca.save();

    res.json({ 
      mensaje: '✅ Beca restablecida a pendiente',
      beca
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RESTABLECER TODOS LOS BECARIOS ==========
router.post('/reset-all', verificarToken, esAdmin, async (req, res) => {
  try {
    const result = await Beca.updateMany(
      {},
      { 
        estado: 'pendiente',
        detalle: '',
        fecha_entrega: null,
        dia_entrega: null,
        hora_entrega: ''
        // NOTA: Las fotos NO se eliminan, solo se resetea el estado
      }
    );

    res.json({ 
      mensaje: '✅ Todos los becarios restablecidos a pendiente',
      modificados: result.modifiedCount,
      total: await Beca.countDocuments()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;