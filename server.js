require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcryptjs');

// Importar modelos
const User = require('./src/models/User');
const Beca = require('./src/models/Beca');

// Importar datos iniciales
const { BECARIOS } = require('./src/data/becarios');

// Importar rutas
const authRoutes = require('./src/routes/auth');
const becaRoutes = require('./src/routes/becas');

// ========== CONFIGURACIÓN DE CLOUDINARY ==========
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ========== INICIALIZAR EXPRESS ==========
const app = express();

// ========== MIDDLEWARES ==========
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 5 * 1024 * 1024 }
}));

// ========== RUTAS ==========
app.use('/api/auth', authRoutes);
app.use('/api/becas', becaRoutes);

// ========== RUTA DE PRUEBA ==========
app.get('/', (req, res) => {
  res.json({ 
    mensaje: 'API de Gestión de Becas UNAN CUR Chontales',
    version: '1.0.0',
    status: 'online'
  });
});

// ========== CONEXIÓN A MONGODB ==========
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ Conectado a MongoDB Atlas');
  
  // ========== INICIALIZAR DATOS ==========
  await inicializarDatos();
  
  // ========== CREAR ADMIN ==========
  await crearAdmin();
  
  // ========== INICIAR SERVIDOR ==========
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 API de Becas lista para usar`);
  });
})
.catch(err => {
  console.error('❌ Error conectando a MongoDB:', err);
  process.exit(1);
});

// ========== FUNCIÓN PARA INICIALIZAR DATOS ==========
async function inicializarDatos() {
  try {
    const count = await Beca.countDocuments();
    if (count === 0) {
      console.log('📥 Insertando 846 becarios...');
      
      const batchSize = 100;
      for (let i = 0; i < BECARIOS.length; i += batchSize) {
        const batch = BECARIOS.slice(i, i + batchSize);
        await Beca.insertMany(batch.map(b => ({
          ...b,
          estado: 'pendiente'
        })));
        console.log(`✅ Insertados ${Math.min(i + batchSize, BECARIOS.length)} de ${BECARIOS.length}`);
      }
      
      console.log('✅ Todos los becarios insertados correctamente');
    } else {
      console.log(`📊 ${count} becarios ya existen en la base de datos`);
    }
  } catch (error) {
    console.error('❌ Error inicializando datos:', error);
  }
}

// ========== FUNCIÓN PARA CREAR ADMIN ==========
async function crearAdmin() {
  try {
    const adminExist = await User.findOne({ 
      email: process.env.ADMIN_EMAIL || 'admin@becas.com' 
    });
    
    if (!adminExist) {
      console.log('👤 Creando usuario administrador...');
      
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'Admin123',
        10
      );
      
      const admin = new User({
        nombre: 'Administrador',
        email: process.env.ADMIN_EMAIL || 'admin@becas.com',
        password: hashedPassword,
        rol: 'admin',
        activo: true
      });
      
      await admin.save();
      console.log('✅ Administrador creado:');
      console.log(`📧 Email: ${admin.email}`);
      console.log(`🔑 Contraseña: ${process.env.ADMIN_PASSWORD || 'Admin123'}`);
    } else {
      console.log(`👤 Administrador ya existe: ${adminExist.email}`);
    }
  } catch (error) {
    console.error('❌ Error creando administrador:', error);
  }
}