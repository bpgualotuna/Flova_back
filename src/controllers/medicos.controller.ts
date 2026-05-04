import { Request, Response } from 'express';
import prisma from '../prisma';

/**
 * GET /api/medicos
 * Obtener todos los médicos
 */
export const getMedicos = async (req: Request, res: Response) => {
  try {
    const { especialidad } = req.query;

    const where: any = {
      activo: true
    };

    if (especialidad) {
      where.especialidad = especialidad as string;
    }

    const medicos = await prisma.medico.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            cedula: true,
            fullName: true,
            email: true,
            telefono: true
          }
        },
        horariosAtencion: {
          where: {
            activo: true
          },
          orderBy: {
            diaSemana: 'asc'
          }
        }
      },
      orderBy: {
        calificacion: 'desc'
      }
    });

    // Formatear respuesta
    const medicosFormateados = medicos.map(medico => ({
      id: medico.id,
      userId: medico.userId,
      fullName: medico.user.fullName,
      cedula: medico.user.cedula,
      email: medico.user.email,
      telefono: medico.user.telefono,
      especialidad: medico.especialidad,
      numeroLicencia: medico.numeroLicencia,
      calificacion: parseFloat(medico.calificacion.toString()),
      pacientesAtendidos: medico.pacientesAtendidos,
      horarioAtencion: medico.horariosAtencion.map(h => ({
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin
      }))
    }));

    res.json(medicosFormateados);
  } catch (error: any) {
    console.error('Error en getMedicos:', error);
    res.status(500).json({ error: error.message || 'Error al obtener médicos' });
  }
};

/**
 * GET /api/medicos/:id
 * Obtener un médico por ID
 */
export const getMedicoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const medico = await prisma.medico.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            cedula: true,
            fullName: true,
            email: true,
            telefono: true
          }
        },
        horariosAtencion: {
          where: {
            activo: true
          },
          orderBy: {
            diaSemana: 'asc'
          }
        }
      }
    });

    if (!medico) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    const medicoFormateado = {
      id: medico.id,
      userId: medico.userId,
      fullName: medico.user.fullName,
      cedula: medico.user.cedula,
      email: medico.user.email,
      telefono: medico.user.telefono,
      especialidad: medico.especialidad,
      numeroLicencia: medico.numeroLicencia,
      calificacion: parseFloat(medico.calificacion.toString()),
      pacientesAtendidos: medico.pacientesAtendidos,
      horarioAtencion: medico.horariosAtencion.map(h => ({
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin
      }))
    };

    res.json(medicoFormateado);
  } catch (error: any) {
    console.error('Error en getMedicoById:', error);
    res.status(500).json({ error: error.message || 'Error al obtener médico' });
  }
};

/**
 * GET /api/medicos/especialidad/:especialidad
 * Obtener médicos por especialidad
 */
export const getMedicosByEspecialidad = async (req: Request, res: Response) => {
  try {
    const { especialidad } = req.params;

    const medicos = await prisma.medico.findMany({
      where: {
        especialidad,
        activo: true
      },
      include: {
        user: {
          select: {
            id: true,
            cedula: true,
            fullName: true,
            email: true,
            telefono: true
          }
        },
        horariosAtencion: {
          where: {
            activo: true
          },
          orderBy: {
            diaSemana: 'asc'
          }
        }
      },
      orderBy: {
        calificacion: 'desc'
      }
    });

    const medicosFormateados = medicos.map(medico => ({
      id: medico.id,
      userId: medico.userId,
      fullName: medico.user.fullName,
      cedula: medico.user.cedula,
      email: medico.user.email,
      telefono: medico.user.telefono,
      especialidad: medico.especialidad,
      numeroLicencia: medico.numeroLicencia,
      calificacion: parseFloat(medico.calificacion.toString()),
      pacientesAtendidos: medico.pacientesAtendidos,
      horarioAtencion: medico.horariosAtencion.map(h => ({
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin
      }))
    }));

    res.json(medicosFormateados);
  } catch (error: any) {
    console.error('Error en getMedicosByEspecialidad:', error);
    res.status(500).json({ error: error.message || 'Error al obtener médicos' });
  }
};
