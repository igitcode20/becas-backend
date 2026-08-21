const mongoose = require('mongoose');

const BecaSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    index: 'text'
  },
  cedula: {
    type: String,
    required: [true, 'La cédula es requerida'],
    index: 'text'
  },
  seccion: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4]
  },
  estado: {
    type: String,
    enum: ['pendiente', 'entregada', 'no_asistio', 'con_detalle'],
    default: 'pendiente'
  },
  detalle: {
    type: String,
    default: ''
  },
  fecha_entrega: {
    type: Date
  },
  foto: {
    type: String,
    default: ''
  },
  foto_public_id: {
    type: String,
    default: ''
  },
  dia_entrega: {
    type: Number,
    enum: [1, 2, 3],
    default: null
  },
  entregado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hora_entrega: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Índices para búsquedas rápidas
BecaSchema.index({ nombre: 'text', cedula: 'text' });
BecaSchema.index({ seccion: 1 });
BecaSchema.index({ estado: 1 });

module.exports = mongoose.model('Beca', BecaSchema);