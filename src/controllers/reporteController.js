const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const archiver = require('archiver');
const Beca = require('../models/Beca');
const cloudinary = require('cloudinary').v2;
const https = require('https');
const http = require('http');

// ========== FUNCIÓN PARA DESCARGAR IMÁGENES ==========
const descargarImagen = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
      } else {
        reject(new Error(`Error al descargar: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
};

// ========== GENERAR REPORTE EXCEL ==========
const generarExcel = async (req, res) => {
  try {
    const { seccion } = req.query;
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
    } else if (seccion && seccion !== 'todas') {
      filtro.seccion = parseInt(seccion);
    }

    const becas = await Beca.find(filtro).sort({ id: 1 });
    const nombreSeccion = filtro.seccion ? `Seccion_${filtro.seccion}` : 'Todas';

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Becas');

    // Definir columnas
    worksheet.columns = [
      { header: '#', key: 'id', width: 8 },
      { header: 'Nombre', key: 'nombre', width: 40 },
      { header: 'Cédula', key: 'cedula', width: 20 },
      { header: 'Sección', key: 'seccion', width: 10 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Detalle', key: 'detalle', width: 30 },
      { header: 'Fecha Entrega', key: 'fecha_entrega', width: 20 },
      { header: 'Hora', key: 'hora_entrega', width: 12 },
      { header: 'Día', key: 'dia_entrega', width: 8 }
    ];

    // Agregar datos
    becas.forEach(b => {
      worksheet.addRow({
        id: b.id,
        nombre: b.nombre,
        cedula: b.cedula,
        seccion: b.seccion,
        estado: b.estado,
        detalle: b.detalle || '',
        fecha_entrega: b.fecha_entrega ? b.fecha_entrega.toLocaleDateString('es-NI') : '',
        hora_entrega: b.hora_entrega || '',
        dia_entrega: b.dia_entrega || ''
      });
    });

    // Estilos
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' } };

    // Respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_becas_${nombreSeccion}_${new Date().toISOString().slice(0,10)}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generando Excel:', error);
    res.status(500).json({ error: error.message });
  }
};

// ========== GENERAR REPORTE PDF ==========
const generarPDF = async (req, res) => {
  try {
    const { seccion } = req.query;
    let filtro = {};

    if (req.user.rol !== 'admin') {
      const rolSeccion = {
        seccion1: 1,
        seccion2: 2,
        seccion3: 3,
        seccion4: 4
      };
      filtro.seccion = rolSeccion[req.user.rol];
    } else if (seccion && seccion !== 'todas') {
      filtro.seccion = parseInt(seccion);
    }

    const becas = await Beca.find(filtro).sort({ id: 1 });
    const nombreSeccion = filtro.seccion ? `Sección ${filtro.seccion}` : 'Todas las secciones';

    // Crear PDF
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      size: 'A4'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_becas_${nombreSeccion.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);

    doc.pipe(res);

    // Título
    doc.fontSize(16).text('REPORTE DE BECAS', { align: 'center' });
    doc.fontSize(12).text(`UNAN CUR Chontales - ${nombreSeccion}`, { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-NI')}`, { align: 'center' });
    doc.moveDown();

    // Estadísticas
    const total = becas.length;
    const entregadas = becas.filter(b => b.estado === 'entregada').length;
    const pendientes = becas.filter(b => b.estado === 'pendiente').length;
    const noAsistieron = becas.filter(b => b.estado === 'no_asistio').length;
    const conDetalle = becas.filter(b => b.estado === 'con_detalle').length;

    doc.fontSize(12);
    doc.text(`Total: ${total}`, { continued: true });
    doc.text(`  |  Entregadas: ${entregadas}`, { continued: true });
    doc.text(`  |  Pendientes: ${pendientes}`, { continued: true });
    doc.text(`  |  No Asistieron: ${noAsistieron}`, { continued: true });
    doc.text(`  |  Con Detalle: ${conDetalle}`);
    doc.moveDown();

    // Tabla de becarios
    const columnas = ['#', 'Nombre', 'Cédula', 'Estado'];
    const anchoColumnas = [30, 200, 100, 80];
    let y = doc.y + 10;

    // Encabezados
    doc.fontSize(10).font('Helvetica-Bold');
    let x = 50;
    columnas.forEach((col, i) => {
      doc.text(col, x, y, { width: anchoColumnas[i], align: 'left' });
      x += anchoColumnas[i];
    });

    y += 20;
    doc.lineWidth(0.5);
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    // Datos
    doc.font('Helvetica');
    becas.forEach((beca, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      x = 50;
      const estadoEmoji = beca.estado === 'entregada' ? '✅' :
                         beca.estado === 'no_asistio' ? '❌' :
                         beca.estado === 'con_detalle' ? '⚠️' : '⏳';

      doc.text(beca.id.toString(), x, y, { width: anchoColumnas[0] });
      x += anchoColumnas[0];
      doc.text(beca.nombre, x, y, { width: anchoColumnas[1] });
      x += anchoColumnas[1];
      doc.text(beca.cedula, x, y, { width: anchoColumnas[2] });
      x += anchoColumnas[2];
      doc.text(`${estadoEmoji} ${beca.estado}`, x, y, { width: anchoColumnas[3] });

      y += 20;
    });

    doc.end();
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: error.message });
  }
};

// ========== GENERAR ZIP CON FOTOS ==========
const generarFotosZip = async (req, res) => {
  try {
    const { seccion } = req.query;
    let filtro = {};

    if (req.user.rol !== 'admin') {
      const rolSeccion = {
        seccion1: 1,
        seccion2: 2,
        seccion3: 3,
        seccion4: 4
      };
      filtro.seccion = rolSeccion[req.user.rol];
    } else if (seccion && seccion !== 'todas') {
      filtro.seccion = parseInt(seccion);
    }

    // Solo becas con foto
    filtro.foto = { $ne: '' };

    const becas = await Beca.find(filtro).sort({ id: 1 });

    if (becas.length === 0) {
      return res.status(404).json({ error: 'No hay fotos disponibles para esta sección' });
    }

    // Crear ZIP
    const zip = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    const nombreSeccion = filtro.seccion ? `Seccion_${filtro.seccion}` : 'Todas';
    res.setHeader('Content-Disposition', `attachment; filename=fotos_becas_${nombreSeccion}_${new Date().toISOString().slice(0,10)}.zip`);

    zip.pipe(res);

    // Descargar y agregar cada foto al ZIP
    let fotosAgregadas = 0;
    let errores = 0;

    for (const beca of becas) {
      try {
        // Usar la función de descarga con https/http
        const buffer = await descargarImagen(beca.foto);
        const nombreArchivo = `${String(beca.id).padStart(3, '0')}_${beca.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
        zip.append(buffer, { name: nombreArchivo });
        fotosAgregadas++;
        console.log(`✅ Foto ${beca.id} agregada: ${nombreArchivo}`);
      } catch (error) {
        errores++;
        console.error(`❌ Error descargando foto ${beca.id}:`, error.message);
      }
    }

    // Finalizar ZIP
    await zip.finalize();

    console.log(`📸 ZIP generado: ${fotosAgregadas} fotos agregadas, ${errores} errores`);

  } catch (error) {
    console.error('Error generando ZIP:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  generarExcel,
  generarPDF,
  generarFotosZip
};