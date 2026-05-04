import { Request, Response } from 'express';
import prisma from '../prisma';
import { validarAnticipacionMinima, validarAnticipacionCancelacion, validarFormatoHora, validarFormatoFecha } from '../utils/validators';

/**
 * GET /api/citas
 * Obtener todas las citas (Admin) o citas del usuario actual
 */
export const getCitas = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { estado, fecha } = req.query;

    const where: any = {};

    // Si no es admin, solo ver sus propias citas
    if (user.role === 'paciente') {
      where.pacienteId = user.userId;
    } else if (user.role === 'medico') {
      const medico = await prisma.medico.findUnique({
        where: { userId: user.userId }
      });
      if (medico) {
        where.medicoId = medico.id;
      }
    }

    if (estado) {
      // Manejar múltiples estados separados por coma
      const estados = (estado as string).split(',').map(e => e.trim());
      if (estados.length > 1) {
        where.estado = { in: estados };
      } else {
        where.estado = estados[0];
      }
    }

    if (fecha) {
      where.fecha = new Date(fecha as string);
    }

    const citas = await prisma.cita.findMany({
      where,
      include: {
        paciente: {
          select: {
            id: true,
            fullName: true,
            cedula: true,
            email: true,
            telefono: true,
            tipoSeguro: true
          }
        },
        medico: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                telefono: true
              }
            }
          }
        },
        terapia: true
      },
      orderBy: [
        { fecha: 'desc' },
        { hora: 'desc' }
      ]
    });

    // Formatear respuesta
    const citasFormateadas = citas.map(cita => ({
      id: cita.id,
      pacienteId: cita.pacienteId,
      medicoId: cita.medicoId,
      terapiaId: cita.terapiaId,
      fecha: cita.fecha.toISOString().split('T')[0],
      hora: cita.hora,
      estado: cita.estado,
      sintomas: cita.sintomas,
      tieneExamenes: cita.tieneExamenes,
      examenes: cita.examenes,
      motivoCancelacion: cita.motivoCancelacion,
      notasMedico: cita.notasMedico,
      createdAt: cita.createdAt,
      updatedAt: cita.updatedAt,
      paciente: cita.paciente,
      medico: {
        id: cita.medico.id,
        fullName: cita.medico.user.fullName,
        especialidad: cita.medico.especialidad,
        numeroLicencia: cita.medico.numeroLicencia,
        calificacion: parseFloat(cita.medico.calificacion.toString())
      },
      terapia: {
        id: cita.terapia.id,
        nombre: cita.terapia.nombre,
        descripcion: cita.terapia.descripcion,
        especialidad: cita.terapia.especialidad,
        duracion: cita.terapia.duracion,
        precio: parseFloat(cita.terapia.precio.toString())
      }
    }));

    res.json(citasFormateadas);
  } catch (error: any) {
    console.error('Error en getCitas:', error);
    res.status(500).json({ error: error.message || 'Error al obtener citas' });
  }
};

/**
 * GET /api/citas/:id
 * Obtener una cita por ID
 */
export const getCitaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const cita = await prisma.cita.findUnique({
      where: { id: parseInt(id) },
      include: {
        paciente: {
          select: {
            id: true,
            fullName: true,
            cedula: true,
            email: true,
            telefono: true,
            tipoSeguro: true
          }
        },
        medico: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                telefono: true
              }
            }
          }
        },
        terapia: true
      }
    });

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // Verificar permisos
    if (user.role === 'paciente' && cita.pacienteId !== user.userId) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta cita' });
    }

    if (user.role === 'medico') {
      const medico = await prisma.medico.findUnique({
        where: { userId: user.userId }
      });
      if (medico && cita.medicoId !== medico.id) {
        return res.status(403).json({ error: 'No tienes permiso para ver esta cita' });
      }
    }

    const citaFormateada = {
      id: cita.id,
      pacienteId: cita.pacienteId,
      medicoId: cita.medicoId,
      terapiaId: cita.terapiaId,
      fecha: cita.fecha.toISOString().split('T')[0],
      hora: cita.hora,
      estado: cita.estado,
      sintomas: cita.sintomas,
      tieneExamenes: cita.tieneExamenes,
      examenes: cita.examenes,
      motivoCancelacion: cita.motivoCancelacion,
      notasMedico: cita.notasMedico,
      createdAt: cita.createdAt,
      updatedAt: cita.updatedAt,
      paciente: cita.paciente,
      medico: {
        id: cita.medico.id,
        fullName: cita.medico.user.fullName,
        especialidad: cita.medico.especialidad,
        numeroLicencia: cita.medico.numeroLicencia,
        calificacion: parseFloat(cita.medico.calificacion.toString())
      },
      terapia: {
        id: cita.terapia.id,
        nombre: cita.terapia.nombre,
        descripcion: cita.terapia.descripcion,
        especialidad: cita.terapia.especialidad,
        duracion: cita.terapia.duracion,
        precio: parseFloat(cita.terapia.precio.toString())
      }
    };

    res.json(citaFormateada);
  } catch (error: any) {
    console.error('Error en getCitaById:', error);
    res.status(500).json({ error: error.message || 'Error al obtener cita' });
  }
};

/**
 * POST /api/citas
 * Crear nueva cita (Paciente)
 */
export const createCita = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { medicoId, terapiaId, fecha, hora, sintomas, tieneExamenes, examenes } = req.body;

    // Validaciones básicas
    if (!medicoId || !terapiaId || !fecha || !hora || !sintomas) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (!validarFormatoFecha(fecha)) {
      return res.status(400).json({ error: 'Formato de fecha inválido (debe ser YYYY-MM-DD)' });
    }

    if (!validarFormatoHora(hora)) {
      return res.status(400).json({ error: 'Formato de hora inválido (debe ser HH:mm)' });
    }

    if (sintomas.length < 10) {
      return res.status(400).json({ error: 'Los síntomas deben tener al menos 10 caracteres' });
    }

    // REGLA: Anticipación mínima de 12 horas
    try {
      validarAnticipacionMinima(fecha, hora);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    // REGLA: Sin doble reserva (mismo paciente, misma fecha y hora)
    const citaExistente = await prisma.cita.findFirst({
      where: {
        pacienteId: user.userId,
        fecha: new Date(fecha),
        hora,
        estado: {
          in: ['pendiente', 'confirmada']
        }
      }
    });

    if (citaExistente) {
      return res.status(409).json({ 
        error: 'Ya tienes una cita reservada en esta fecha y hora' 
      });
    }

    // Verificar que el horario esté disponible
    const horarioOcupado = await prisma.cita.findFirst({
      where: {
        medicoId: parseInt(medicoId),
        fecha: new Date(fecha),
        hora,
        estado: {
          in: ['pendiente', 'confirmada']
        }
      }
    });

    if (horarioOcupado) {
      return res.status(409).json({ 
        error: 'Este horario ya está ocupado' 
      });
    }

    // Crear cita
    const cita = await prisma.cita.create({
      data: {
        pacienteId: user.userId,
        medicoId: parseInt(medicoId),
        terapiaId: parseInt(terapiaId),
        fecha: new Date(fecha),
        hora,
        sintomas,
        tieneExamenes: tieneExamenes || false,
        examenes: examenes || [],
        estado: 'pendiente'
      },
      include: {
        paciente: {
          select: {
            fullName: true,
            cedula: true,
            email: true
          }
        },
        medico: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        },
        terapia: true
      }
    });

    res.status(201).json({
      message: 'Cita creada exitosamente',
      cita: {
        id: cita.id,
        fecha: cita.fecha.toISOString().split('T')[0],
        hora: cita.hora,
        estado: cita.estado,
        paciente: cita.paciente,
        medico: {
          fullName: cita.medico.user.fullName,
          especialidad: cita.medico.especialidad
        },
        terapia: {
          nombre: cita.terapia.nombre,
          duracion: cita.terapia.duracion,
          precio: parseFloat(cita.terapia.precio.toString())
        }
      }
    });
  } catch (error: any) {
    console.error('Error en createCita:', error);
    res.status(500).json({ error: error.message || 'Error al crear cita' });
  }
};

/**
 * PUT /api/citas/:id
 * Actualizar cita (Médico puede agregar notas, Admin puede cambiar estado)
 */
export const updateCita = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { estado, notasMedico } = req.body;

    const cita = await prisma.cita.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // Verificar permisos
    if (user.role === 'medico') {
      const medico = await prisma.medico.findUnique({
        where: { userId: user.userId }
      });
      if (medico && cita.medicoId !== medico.id) {
        return res.status(403).json({ error: 'No tienes permiso para modificar esta cita' });
      }
    }

    const citaActualizada = await prisma.cita.update({
      where: { id: parseInt(id) },
      data: {
        ...(estado && { estado }),
        ...(notasMedico !== undefined && { notasMedico })
      }
    });

    res.json({
      message: 'Cita actualizada exitosamente',
      cita: citaActualizada
    });
  } catch (error: any) {
    console.error('Error en updateCita:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar cita' });
  }
};

/**
 * DELETE /api/citas/:id
 * Cancelar cita (Paciente)
 */
export const cancelCita = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { motivo } = req.body;

    if (!motivo) {
      return res.status(400).json({ error: 'Debe proporcionar un motivo de cancelación' });
    }

    const cita = await prisma.cita.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // Verificar que sea el paciente de la cita
    if (user.role === 'paciente' && cita.pacienteId !== user.userId) {
      return res.status(403).json({ error: 'No tienes permiso para cancelar esta cita' });
    }

    // Verificar que la cita esté en estado cancelable
    if (!['pendiente', 'confirmada'].includes(cita.estado)) {
      return res.status(400).json({ error: 'Esta cita no puede ser cancelada' });
    }

    // REGLA: Anticipación mínima de 24 horas para cancelación
    try {
      validarAnticipacionCancelacion(
        cita.fecha.toISOString().split('T')[0],
        cita.hora
      );
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    // Cancelar cita
    const citaCancelada = await prisma.cita.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'cancelada',
        motivoCancelacion: motivo
      }
    });

    res.json({
      message: 'Cita cancelada exitosamente',
      cita: citaCancelada
    });
  } catch (error: any) {
    console.error('Error en cancelCita:', error);
    res.status(500).json({ error: error.message || 'Error al cancelar cita' });
  }
};

/**
 * GET /api/horarios-disponibles
 * Obtener horarios disponibles de un médico en una fecha
 */
export const getHorariosDisponibles = async (req: Request, res: Response) => {
  try {
    const { medicoId, fecha } = req.query;

    // Validar que los parámetros existan y no sean undefined
    if (!medicoId || medicoId === 'undefined' || !fecha) {
      return res.status(400).json({ error: 'medicoId y fecha son requeridos' });
    }

    if (!validarFormatoFecha(fecha as string)) {
      return res.status(400).json({ error: 'Formato de fecha inválido' });
    }

    // Validar que medicoId sea un número válido
    const medicoIdNum = parseInt(medicoId as string);
    if (isNaN(medicoIdNum)) {
      return res.status(400).json({ error: 'medicoId debe ser un número válido' });
    }

    const fechaDate = new Date(fecha as string);
    const diaSemana = fechaDate.getDay();

    // Obtener horarios de atención del médico para ese día
    const horariosAtencion = await prisma.horarioAtencion.findMany({
      where: {
        medicoId: medicoIdNum,
        diaSemana,
        activo: true
      }
    });

    if (horariosAtencion.length === 0) {
      return res.json([]);
    }

    // Obtener citas ya reservadas
    const citasReservadas = await prisma.cita.findMany({
      where: {
        medicoId: parseInt(medicoId as string),
        fecha: fechaDate,
        estado: {
          in: ['pendiente', 'confirmada']
        }
      },
      select: {
        hora: true
      }
    });

    const horasOcupadas = citasReservadas.map(c => c.hora);

    // Generar horarios disponibles
    const horariosDisponibles: any[] = [];

    for (const horario of horariosAtencion) {
      const [horaInicio, minInicio] = horario.horaInicio.split(':').map(Number);
      const [horaFin, minFin] = horario.horaFin.split(':').map(Number);

      let horaActual = horaInicio;
      let minActual = minInicio;

      while (horaActual < horaFin || (horaActual === horaFin && minActual < minFin)) {
        const horaStr = `${horaActual.toString().padStart(2, '0')}:${minActual.toString().padStart(2, '0')}`;
        
        // Verificar anticipación mínima de 12 horas
        let disponible = true;
        try {
          validarAnticipacionMinima(fecha as string, horaStr);
        } catch {
          disponible = false;
        }

        // Verificar si está ocupado
        if (horasOcupadas.includes(horaStr)) {
          disponible = false;
        }

        horariosDisponibles.push({
          fecha: fecha as string,
          hora: horaStr,
          disponible,
          medicoId: parseInt(medicoId as string)
        });

        // Incrementar 30 minutos
        minActual += 30;
        if (minActual >= 60) {
          horaActual += 1;
          minActual = 0;
        }
      }
    }

    res.json(horariosDisponibles);
  } catch (error: any) {
    console.error('Error en getHorariosDisponibles:', error);
    res.status(500).json({ error: error.message || 'Error al obtener horarios disponibles' });
  }
};
