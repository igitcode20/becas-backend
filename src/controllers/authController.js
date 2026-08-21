const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ========== REGISTRAR USUARIO ==========
const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol, seccion } = req.body;

    // Verificar si el usuario ya existe
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      nombre,
      email,
      password: hashedPassword,
      rol,
      seccion: seccion || null
    });

    await user.save();
    res.status(201).json({ mensaje: 'Usuario creado exitosamente', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== LOGIN ==========
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const passwordValido = await bcrypt.compare(password, user.password);
    if (!passwordValido) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        seccion: user.seccion
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== OBTENER USUARIOS ==========
const obtenerUsuarios = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registrarUsuario,
  login,
  obtenerUsuarios
};