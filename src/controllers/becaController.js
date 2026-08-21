const cloudinary = require('cloudinary').v2;
const Beca = require('../models/Beca');
const Registro = require('../models/Registro');

// ========== OBTENER TODAS LAS BECAS ==========
const obtenerBecas = async (req, res) => {
  try {
    const { seccion, estado, busqueda } = req.query;
    let filtro = {};

    // Filtrar por sección (según rol del usuario)
    if (req.user.rol !== 'admin') {
      const rolSeccion = {
        seccion1: 1,
        seccion2: 2,
        seccion3: 3,
        seccion4: 4
      };
      filtro.seccion = rolSeccion[req.user.rol];
    } else if (seccion) {
      filtro.seccion = parseInt(seccion);
    }

    // Filtrar por estado
    if (estado) {
      filtro.estado = estado;
    }

    // Búsqueda por texto
    let query = Beca.find(filtro);
    if (busqueda) {
      query = query.find({ $text: { $search: busqueda } });
    }

    const becas = await query.sort({ id: 1 });
    res.json(becas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== OBTENER UNA BECA ==========
const obtenerBeca = async (req, res) => {
  try {
    const beca = await Beca.findById(req.params.id);
    if (!beca) {
      return res.status(404).json({ error: 'Beca no encontrada' });
    }
    res.json(beca);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== ACTUALIZAR ESTADO DE BECA ==========
const actualizarEstado = async (req, res) => {
  try {
    const { estado, detalle, dia_entrega } = req.body;
    const beca = await Beca.findById(req.params.id);

    if (!beca) {
      return res.status(404).json({ error: 'Beca no encontrada' });
    }

    // Guardar estado anterior para el registro
    const estadoAnterior = beca.estado;

    // Actualizar beca
    beca.estado = estado;
    if (detalle) beca.detalle = detalle;
    if (dia_entrega) beca.dia_entrega = dia_entrega;
    
    if (estado === 'entregada') {
      beca.fecha_entrega = new Date();
      beca.entregado_por = req.user._id;
      const ahora = new Date();
      beca.hora_entrega = ahora.toLocaleTimeString('es-NI');
    }

    await beca.save();

    // Crear registro de actividad
    const registro = new Registro({
      beca_id: beca._id,
      usuario_id: req.user._id,
      accion: estado === 'entregada' ? 'entregada' : 
              estado === 'no_asistio' ? 'no_asistio' : 'detalle_agregado',
      detalle: detalle || '',
      estado_anterior: estadoAnterior,
      estado_nuevo: estado
    });
    await registro.save();

    res.json({ mensaje: 'Estado actualizado', beca });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== SUBIR FOTO ==========
const subirFoto = async (req, res) => {
  try {
    const beca = await Beca.findById(req.params.id);
    if (!beca) {
      return res.status(404).json({ error: 'Beca no encontrada' });
    }

    if (!req.files || !req.files.foto) {
      return res.status(400).json({ error: 'No se subió ninguna foto' });
    }

    const file = req.files.foto;

    // Subir a Cloudinary
    const resultado = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'becas',
      public_id: `beca_${beca.id}`,
      overwrite: true,
      resource_type: 'image',
      quality: 'auto:good'
    });

    // Actualizar beca con la URL de la foto
    beca.foto = resultado.secure_url;
    beca.foto_public_id = resultado.public_id;
    await beca.save();

    // Crear registro de actividad
    const registro = new Registro({
      beca_id: beca._id,
      usuario_id: req.user._id,
      accion: 'foto_actualizada',
      detalle: 'Foto subida correctamente'
    });
    await registro.save();

    res.json({ 
      mensaje: 'Foto subida correctamente', 
      foto: resultado.secure_url 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========== OBTENER ESTADÍSTICAS ==========
const obtenerEstadisticas = async (req, res) => {
  try {
    let filtro = {};

    // Si no es admin, solo ve su sección
    if (req.user.rol !== 'admin') {
      const rolSeccion = {
        seccion1: 1,
        seccion2: 2,
        seccion3: 3,
        seccion4: 4
      };
      filtro.seccion = rolSeccion[req.user.rol];
    }

    const stats = await Beca.aggregate([
      { $match: filtro },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          entregadas: { $sum: { $cond: [{ $eq: ['$estado', 'entregada'] }, 1, 0] } },
          no_asistieron: { $sum: { $cond: [{ $eq: ['$estado', 'no_asistio'] }, 1, 0] } },
          con_detalle: { $sum: { $cond: [{ $eq: ['$estado', 'con_detalle'] }, 1, 0] } },
          pendientes: { $sum: { $cond: [{ $eq: ['$estado', 'pendiente'] }, 1, 0] } }
        }
      }
    ]);

    // Estadísticas por sección (solo para admin)
    let statsPorSeccion = [];
    if (req.user.rol === 'admin') {
      statsPorSeccion = await Beca.aggregate([
        {
          $group: {
            _id: '$seccion',
            total: { $sum: 1 },
            entregadas: { $sum: { $cond: [{ $eq: ['$estado', 'entregada'] }, 1, 0] } },
            pendientes: { $sum: { $cond: [{ $eq: ['$estado', 'pendiente'] }, 1, 0] } },
            no_asistieron: { $sum: { $cond: [{ $eq: ['$estado', 'no_asistio'] }, 1, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    }

    res.json({
      general: stats[0] || { total: 0, entregadas: 0, no_asistieron: 0, con_detalle: 0, pendientes: 0 },
      porSeccion: statsPorSeccion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  obtenerBecas,
  obtenerBeca,
  actualizarEstado,
  subirFoto,
  obtenerEstadisticas
};