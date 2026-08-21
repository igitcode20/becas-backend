const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida']
  },
  rol: {
    type: String,
    enum: ['admin', 'seccion1', 'seccion2', 'seccion3', 'seccion4'],
    required: true
  },
  seccion: {
    type: Number,
    enum: [1, 2, 3, 4],
    required: function() {
      return this.rol !== 'admin';
    }
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Método para ocultar la contraseña al enviar JSON
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', UserSchema);