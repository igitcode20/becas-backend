const mongoose = require('mongoose');

const RegistroSchema = new mongoose.Schema({
  beca_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beca',
    required: true
  },
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accion: {
    type: String,
    enum: ['entregada', 'no_asistio', 'detalle_agregado', 'foto_actualizada'],
    required: true
  },
  detalle: {
    type: String,
    default: ''
  },
  estado_anterior: {
    type: String,
    enum: ['pendiente', 'entregada', 'no_asistio', 'con_detalle']
  },
  estado_nuevo: {
    type: String,
    enum: ['pendiente', 'entregada', 'no_asistio', 'con_detalle']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Registro', RegistroSchema);