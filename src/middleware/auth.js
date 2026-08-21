const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verificar token JWT
const verificarToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No hay token, autorización denegada' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.activo) {
      return res.status(401).json({ error: 'Usuario no válido o desactivado' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Verificar que sea administrador
const esAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Se requiere rol de administrador' });
  }
  next();
};

// Verificar acceso a la sección correcta
const verificarAccesoSeccion = (req, res, next) => {
  const { seccion } = req.params;
  
  if (req.user.rol === 'admin') {
    return next();
  }

  const rolSeccion = {
    seccion1: 1,
    seccion2: 2,
    seccion3: 3,
    seccion4: 4
  };

  const userSeccion = rolSeccion[req.user.rol];
  
  if (!userSeccion || userSeccion !== parseInt(seccion)) {
    return res.status(403).json({ 
      error: 'No tienes acceso a esta sección' 
    });
  }
  
  req.seccion = userSeccion;
  next();
};

module.exports = {
  verificarToken,
  esAdmin,
  verificarAccesoSeccion
};