import { Request, Response } from 'express';
import prisma from '../prisma';
import { validateTimeFormat } from '../utils/validators';

export const formatDoctor = (doctor: any) => {
  if (!doctor) return null;

  const ratingVal = doctor.calificacion !== undefined && doctor.calificacion !== null
    ? parseFloat(doctor.calificacion.toString())
    : (doctor.rating !== undefined && doctor.rating !== null ? parseFloat(doctor.rating.toString()) : 0);

  const patientsVal = doctor.pacientesAtendidos !== undefined
    ? doctor.pacientesAtendidos
    : (doctor.patientsServed !== undefined ? doctor.patientsServed : 0);

  const user = doctor.user || {};
  const schedules = doctor.horariosAtencion || doctor.schedules || [];
  const activeSchedules = schedules.filter((s: any) => s.activo !== false && s.active !== false);

  const formattedSchedules = activeSchedules.map((s: any) => ({
    id: s.id,
    medicoId: s.medicoId !== undefined ? s.medicoId : s.doctorId,
    doctorId: s.medicoId !== undefined ? s.medicoId : s.doctorId,
    diaSemana: s.diaSemana !== undefined ? s.diaSemana : s.dayOfWeek,
    dayOfWeek: s.diaSemana !== undefined ? s.diaSemana : s.dayOfWeek,
    horaInicio: s.horaInicio || s.startTime,
    startTime: s.horaInicio || s.startTime,
    horaFin: s.horaFin || s.endTime,
    endTime: s.horaFin || s.endTime,
    activo: s.activo !== undefined ? s.activo : s.active,
    active: s.activo !== undefined ? s.activo : s.active
  }));

  return {
    id: doctor.id,
    userId: doctor.userId,
    fullName: user.fullName || '',
    nationalId: user.cedula || user.nationalId || '',
    cedula: user.cedula || user.nationalId || '',
    email: user.email || '',
    phone: user.telefono || user.phone || '',
    telefono: user.telefono || user.phone || '',
    specialty: doctor.especialidad || doctor.specialty || '',
    especialidad: doctor.especialidad || doctor.specialty || '',
    licenseNumber: doctor.numeroLicencia || doctor.licenseNumber || '',
    numeroLicencia: doctor.numeroLicencia || doctor.licenseNumber || '',
    rating: ratingVal,
    calificacion: ratingVal,
    patientsServed: patientsVal,
    pacientesAtendidos: patientsVal,
    active: doctor.activo !== undefined ? doctor.activo : doctor.active,
    activo: doctor.activo !== undefined ? doctor.activo : doctor.active,
    workSchedule: formattedSchedules,
    horarioAtencion: formattedSchedules
  };
};

export const formatSchedule = (s: any) => {
  if (!s) return null;
  return {
    id: s.id,
    medicoId: s.medicoId !== undefined ? s.medicoId : s.doctorId,
    doctorId: s.medicoId !== undefined ? s.medicoId : s.doctorId,
    diaSemana: s.diaSemana !== undefined ? s.diaSemana : s.dayOfWeek,
    dayOfWeek: s.diaSemana !== undefined ? s.diaSemana : s.dayOfWeek,
    horaInicio: s.horaInicio || s.startTime,
    startTime: s.horaInicio || s.startTime,
    horaFin: s.horaFin || s.endTime,
    endTime: s.horaFin || s.endTime,
    activo: s.activo !== undefined ? s.activo : s.active,
    active: s.activo !== undefined ? s.activo : s.active,
    createdAt: s.createdAt
  };
};

const checkScheduleConflict = async (
  medicoId: number,
  diaSemana: number,
  horaInicio: string,
  horaFin: string,
  excludeScheduleId?: number
) => {
  const existingSchedules = await prisma.horarioAtencion.findMany({
    where: {
      medicoId,
      diaSemana,
      activo: true,
      ...(excludeScheduleId ? { NOT: { id: excludeScheduleId } } : {})
    }
  });

  for (const schedule of existingSchedules) {
    const sStart = schedule.horaInicio || schedule.startTime;
    const sEnd = schedule.horaFin || schedule.endTime;

    // Overlap condition: startA < endB && endA > startB
    if (horaInicio < sEnd && horaFin > sStart) {
      return schedule;
    }
  }

  return null;
};

// ============================================
// CONTROLADORES DE MÉDICOS
// ============================================

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const specialty = (req.query.specialty || req.query.especialidad) as string | undefined;

    const where: any = {
      activo: true
    };

    if (specialty) {
      where.especialidad = specialty;
    }

    const doctors = await prisma.medico.findMany({
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

    res.json(doctors.map(formatDoctor));
  } catch (error: any) {
    console.error('Error in getDoctors:', error);
    res.status(500).json({ error: error.message || 'Error al obtener médicos' });
  }
};

export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = parseInt(id);

    if (isNaN(doctorId)) {
      return res.status(400).json({ error: 'ID de médico inválido' });
    }

    const doctor = await prisma.medico.findUnique({
      where: { id: doctorId },
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

    if (!doctor) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    res.json(formatDoctor(doctor));
  } catch (error: any) {
    console.error('Error in getDoctorById:', error);
    res.status(500).json({ error: error.message || 'Error al obtener el médico' });
  }
};

export const getDoctorsBySpecialty = async (req: Request, res: Response) => {
  try {
    const { specialty } = req.params;

    const doctors = await prisma.medico.findMany({
      where: {
        especialidad: specialty,
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

    res.json(doctors.map(formatDoctor));
  } catch (error: any) {
    console.error('Error in getDoctorsBySpecialty:', error);
    res.status(500).json({ error: error.message || 'Error al obtener médicos por especialidad' });
  }
};

export const createDoctor = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      especialidad,
      specialty,
      numeroLicencia,
      licenseNumber,
      calificacion,
      rating,
      pacientesAtendidos,
      patientsServed
    } = req.body;

    const targetUserId = userId !== undefined ? Number(userId) : NaN;
    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'userId es obligatorio y debe ser un número entero' });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!user) {
      return res.status(404).json({ error: 'El usuario especificado no existe' });
    }

    if (user.role !== 'medico') {
      return res.status(400).json({ error: 'El usuario asociado debe tener rol "medico"' });
    }

    const existingDoctorForUser = await prisma.medico.findUnique({
      where: { userId: targetUserId }
    });

    if (existingDoctorForUser) {
      return res.status(409).json({ error: 'Ya existe un perfil de médico asociado a este usuario' });
    }

    const finalSpecialty = (especialidad || specialty)?.trim();
    if (!finalSpecialty) {
      return res.status(400).json({ error: 'La especialidad es obligatoria' });
    }

    const finalLicense = (numeroLicencia || licenseNumber)?.trim();
    if (!finalLicense) {
      return res.status(400).json({ error: 'El número de licencia es obligatorio' });
    }

    const existingLicense = await prisma.medico.findUnique({
      where: { numeroLicencia: finalLicense }
    });

    if (existingLicense) {
      return res.status(409).json({ error: 'El número de licencia ya se encuentra registrado' });
    }

    const finalRating = calificacion !== undefined ? Number(calificacion) : (rating !== undefined ? Number(rating) : 0);
    const finalPatients = pacientesAtendidos !== undefined ? Number(pacientesAtendidos) : (patientsServed !== undefined ? Number(patientsServed) : 0);

    const newDoctor = await prisma.medico.create({
      data: {
        userId: targetUserId,
        especialidad: finalSpecialty,
        numeroLicencia: finalLicense,
        calificacion: finalRating,
        pacientesAtendidos: finalPatients,
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
        horariosAtencion: true
      }
    });

    res.status(201).json(formatDoctor(newDoctor));
  } catch (error: any) {
    console.error('Error in createDoctor:', error);
    res.status(500).json({ error: error.message || 'Error al crear médico' });
  }
};

export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = parseInt(id);

    if (isNaN(doctorId)) {
      return res.status(400).json({ error: 'ID de médico inválido' });
    }

    const existingDoctor = await prisma.medico.findUnique({
      where: { id: doctorId }
    });

    if (!existingDoctor) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    const {
      userId,
      especialidad,
      specialty,
      numeroLicencia,
      licenseNumber,
      calificacion,
      rating,
      pacientesAtendidos,
      patientsServed,
      activo,
      active
    } = req.body;

    const updateData: any = {};

    if (userId !== undefined) {
      const targetUserId = Number(userId);
      if (isNaN(targetUserId)) {
        return res.status(400).json({ error: 'userId debe ser un número entero válido' });
      }

      if (targetUserId !== existingDoctor.userId) {
        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!user) {
          return res.status(404).json({ error: 'El nuevo usuario no existe' });
        }
        if (user.role !== 'medico') {
          return res.status(400).json({ error: 'El usuario asociado debe tener rol "medico"' });
        }
        const doctorWithUser = await prisma.medico.findUnique({ where: { userId: targetUserId } });
        if (doctorWithUser && doctorWithUser.id !== doctorId) {
          return res.status(409).json({ error: 'Ese usuario ya tiene asignado otro perfil médico' });
        }
        updateData.userId = targetUserId;
      }
    }

    const finalSpecialty = (especialidad || specialty)?.trim();
    if (finalSpecialty !== undefined) {
      if (!finalSpecialty) {
        return res.status(400).json({ error: 'La especialidad no puede estar vacía' });
      }
      updateData.especialidad = finalSpecialty;
    }

    const finalLicense = (numeroLicencia || licenseNumber)?.trim();
    if (finalLicense !== undefined) {
      if (!finalLicense) {
        return res.status(400).json({ error: 'El número de licencia no puede estar vacío' });
      }
      if (finalLicense !== existingDoctor.numeroLicencia) {
        const licenseInUse = await prisma.medico.findUnique({
          where: { numeroLicencia: finalLicense }
        });
        if (licenseInUse && licenseInUse.id !== doctorId) {
          return res.status(409).json({ error: 'El número de licencia ya está registrado para otro médico' });
        }
        updateData.numeroLicencia = finalLicense;
      }
    }

    if (calificacion !== undefined || rating !== undefined) {
      const r = calificacion !== undefined ? Number(calificacion) : Number(rating);
      if (!isNaN(r)) updateData.calificacion = r;
    }

    if (pacientesAtendidos !== undefined || patientsServed !== undefined) {
      const p = pacientesAtendidos !== undefined ? Number(pacientesAtendidos) : Number(patientsServed);
      if (!isNaN(p)) updateData.pacientesAtendidos = p;
    }

    if (activo !== undefined || active !== undefined) {
      const a = activo !== undefined ? Boolean(activo) : Boolean(active);
      updateData.activo = a;
      // Si se desactiva el médico, desactivar también sus horarios
      if (a === false) {
        await prisma.horarioAtencion.updateMany({
          where: { medicoId: doctorId, activo: true },
          data: { activo: false }
        });
      }
    }

    const updatedDoctor = await prisma.medico.update({
      where: { id: doctorId },
      data: updateData,
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
          where: { activo: true },
          orderBy: { diaSemana: 'asc' }
        }
      }
    });

    res.json({
      message: 'Médico actualizado exitosamente',
      doctor: formatDoctor(updatedDoctor)
    });
  } catch (error: any) {
    console.error('Error in updateDoctor:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar médico' });
  }
};

export const deleteDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = parseInt(id);

    if (isNaN(doctorId)) {
      return res.status(400).json({ error: 'ID de médico inválido' });
    }

    const doctor = await prisma.medico.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    // Baja lógica obligatoria para preservar integridad referencial de citas históricas
    await prisma.medico.update({
      where: { id: doctorId },
      data: { activo: false }
    });

    await prisma.horarioAtencion.updateMany({
      where: { medicoId: doctorId, activo: true },
      data: { activo: false }
    });

    res.json({
      message: 'Médico desactivado exitosamente',
      id: doctorId
    });
  } catch (error: any) {
    console.error('Error in deleteDoctor:', error);
    res.status(500).json({ error: error.message || 'Error al desactivar médico' });
  }
};

// ============================================
// CONTROLADORES DE HORARIOS DE ATENCIÓN
// ============================================

export const createSchedule = async (req: Request, res: Response) => {
  try {
    const doctorId = parseInt(req.params.id);

    if (isNaN(doctorId)) {
      return res.status(400).json({ error: 'ID de médico inválido' });
    }

    const doctor = await prisma.medico.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    if (!doctor.activo) {
      return res.status(400).json({ error: 'No se pueden registrar horarios para un médico inactivo' });
    }

    const currentUser = (req as any).user;
    if (currentUser?.role === 'medico' && doctor.userId !== currentUser.userId) {
      return res.status(403).json({ error: 'No tienes permiso para gestionar horarios de otro médico' });
    }

    const { diaSemana, dayOfWeek, horaInicio, startTime, horaFin, endTime } = req.body;

    const day = diaSemana !== undefined ? Number(diaSemana) : (dayOfWeek !== undefined ? Number(dayOfWeek) : NaN);
    const start = (horaInicio || startTime)?.trim();
    const end = (horaFin || endTime)?.trim();

    if (isNaN(day) || !Number.isInteger(day) || day < 0 || day > 6) {
      return res.status(400).json({ error: 'diaSemana debe ser un número entero entre 0 (Domingo) y 6 (Sábado)' });
    }

    if (!start || !validateTimeFormat(start)) {
      return res.status(400).json({ error: 'horaInicio es obligatoria y debe tener formato HH:mm (ej. 08:00)' });
    }

    if (!end || !validateTimeFormat(end)) {
      return res.status(400).json({ error: 'horaFin es obligatoria y debe tener formato HH:mm (ej. 16:00)' });
    }

    if (start >= end) {
      return res.status(400).json({ error: 'horaInicio debe ser menor que horaFin' });
    }

    const conflict = await checkScheduleConflict(doctorId, day, start, end);
    if (conflict) {
      return res.status(409).json({ error: 'Conflicto de horario: Ya existe un horario registrado o superpuesto para este día y rango de horas' });
    }

    const newSchedule = await prisma.horarioAtencion.create({
      data: {
        medicoId: doctorId,
        diaSemana: day,
        horaInicio: start,
        horaFin: end,
        activo: true
      }
    });

    res.status(201).json(formatSchedule(newSchedule));
  } catch (error: any) {
    console.error('Error in createSchedule:', error);
    res.status(500).json({ error: error.message || 'Error al crear horario' });
  }
};

export const getSchedulesByDoctor = async (req: Request, res: Response) => {
  try {
    const doctorId = parseInt(req.params.id);

    if (isNaN(doctorId)) {
      return res.status(400).json({ error: 'ID de médico inválido' });
    }

    const doctor = await prisma.medico.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    const schedules = await prisma.horarioAtencion.findMany({
      where: {
        medicoId: doctorId,
        activo: true
      },
      orderBy: [
        { diaSemana: 'asc' },
        { horaInicio: 'asc' }
      ]
    });

    res.json(schedules.map(formatSchedule));
  } catch (error: any) {
    console.error('Error in getSchedulesByDoctor:', error);
    res.status(500).json({ error: error.message || 'Error al obtener horarios del médico' });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const scheduleId = parseInt(req.params.id);

    if (isNaN(scheduleId)) {
      return res.status(400).json({ error: 'ID de horario inválido' });
    }

    const existingSchedule = await prisma.horarioAtencion.findUnique({
      where: { id: scheduleId }
    });

    if (!existingSchedule) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    const doctor = await prisma.medico.findUnique({
      where: { id: existingSchedule.medicoId }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Médico asociado al horario no encontrado' });
    }

    const currentUser = (req as any).user;
    if (currentUser?.role === 'medico' && doctor.userId !== currentUser.userId) {
      return res.status(403).json({ error: 'No tienes permiso para modificar horarios de otro médico' });
    }

    const {
      diaSemana,
      dayOfWeek,
      horaInicio,
      startTime,
      horaFin,
      endTime,
      activo,
      active
    } = req.body;

    const newDay = diaSemana !== undefined ? Number(diaSemana) : (dayOfWeek !== undefined ? Number(dayOfWeek) : existingSchedule.diaSemana);
    const newStart = (horaInicio || startTime)?.trim() || existingSchedule.horaInicio;
    const newEnd = (horaFin || endTime)?.trim() || existingSchedule.horaFin;
    const newActive = activo !== undefined ? Boolean(activo) : (active !== undefined ? Boolean(active) : existingSchedule.activo);

    if (isNaN(newDay) || !Number.isInteger(newDay) || newDay < 0 || newDay > 6) {
      return res.status(400).json({ error: 'diaSemana debe ser un número entero entre 0 (Domingo) y 6 (Sábado)' });
    }

    if (!validateTimeFormat(newStart)) {
      return res.status(400).json({ error: 'horaInicio debe tener formato HH:mm (ej. 08:00)' });
    }

    if (!validateTimeFormat(newEnd)) {
      return res.status(400).json({ error: 'horaFin debe tener formato HH:mm (ej. 16:00)' });
    }

    if (newStart >= newEnd) {
      return res.status(400).json({ error: 'horaInicio debe ser menor que horaFin' });
    }

    if (newActive) {
      if (!doctor.activo) {
        return res.status(400).json({ error: 'No se puede activar un horario para un médico inactivo' });
      }

      const conflict = await checkScheduleConflict(
        existingSchedule.medicoId,
        newDay,
        newStart,
        newEnd,
        scheduleId
      );

      if (conflict) {
        return res.status(409).json({ error: 'Conflicto de horario: Ya existe un horario registrado o superpuesto para este día y rango de horas' });
      }
    }

    const updatedSchedule = await prisma.horarioAtencion.update({
      where: { id: scheduleId },
      data: {
        diaSemana: newDay,
        horaInicio: newStart,
        horaFin: newEnd,
        activo: newActive
      }
    });

    res.json({
      message: 'Horario actualizado exitosamente',
      schedule: formatSchedule(updatedSchedule)
    });
  } catch (error: any) {
    console.error('Error in updateSchedule:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar el horario' });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const scheduleId = parseInt(req.params.id);

    if (isNaN(scheduleId)) {
      return res.status(400).json({ error: 'ID de horario inválido' });
    }

    const existingSchedule = await prisma.horarioAtencion.findUnique({
      where: { id: scheduleId }
    });

    if (!existingSchedule) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }

    const doctor = await prisma.medico.findUnique({
      where: { id: existingSchedule.medicoId }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Médico asociado al horario no encontrado' });
    }

    const currentUser = (req as any).user;
    if (currentUser?.role === 'medico' && doctor.userId !== currentUser.userId) {
      return res.status(403).json({ error: 'No tienes permiso para desactivar horarios de otro médico' });
    }

    await prisma.horarioAtencion.update({
      where: { id: scheduleId },
      data: { activo: false }
    });

    res.json({
      message: 'Horario desactivado exitosamente',
      id: scheduleId
    });
  } catch (error: any) {
    console.error('Error in deleteSchedule:', error);
    res.status(500).json({ error: error.message || 'Error al desactivar el horario' });
  }
};
