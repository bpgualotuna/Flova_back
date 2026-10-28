import { Request, Response } from 'express';
import prisma from '../prisma';
import {
  validateCancellationLeadTime,
  validateDateFormat,
  validateMinAnticipation,
  validateTimeFormat
} from '../utils/validators';

const appointmentStatuses = ['pendiente', 'confirmada', 'completada', 'cancelada'];
const activeAppointmentStatuses = ['pendiente', 'confirmada'];

const toDateOnly = (date: string): Date => new Date(`${date}T00:00:00.000Z`);

const formatAppointment = (appointment: any) => {
  if (!appointment) return null;

  const date = appointment.fecha instanceof Date
    ? appointment.fecha.toISOString().split('T')[0]
    : appointment.fecha;

  const formatted: any = {
    id: appointment.id,
    pacienteId: appointment.pacienteId,
    medicoId: appointment.medicoId,
    terapiaId: appointment.terapiaId,
    fecha: date,
    hora: appointment.hora,
    estado: appointment.estado,
    sintomas: appointment.sintomas,
    tieneExamenes: appointment.tieneExamenes,
    examenes: appointment.examenes,
    motivoCancelacion: appointment.motivoCancelacion,
    notasMedico: appointment.notasMedico,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt
  };

  if (appointment.paciente) {
    formatted.paciente = {
      id: appointment.paciente.id,
      fullName: appointment.paciente.fullName,
      cedula: appointment.paciente.cedula,
      email: appointment.paciente.email,
      telefono: appointment.paciente.telefono,
      tipoSeguro: appointment.paciente.tipoSeguro
    };
  }

  if (appointment.medico) {
    formatted.medico = {
      id: appointment.medico.id,
      fullName: appointment.medico.user?.fullName || '',
      especialidad: appointment.medico.especialidad,
      numeroLicencia: appointment.medico.numeroLicencia,
      calificacion: appointment.medico.calificacion
        ? parseFloat(appointment.medico.calificacion.toString())
        : 0
    };
  }

  if (appointment.terapia) {
    formatted.terapia = {
      id: appointment.terapia.id,
      nombre: appointment.terapia.nombre,
      descripcion: appointment.terapia.descripcion,
      especialidad: appointment.terapia.especialidad,
      duracion: appointment.terapia.duracion,
      precio: appointment.terapia.precio
        ? parseFloat(appointment.terapia.precio.toString())
        : 0
    };
  }

  return formatted;
};

const appointmentInclude = {
  paciente: {
    select: {
      id: true,
      cedula: true,
      fullName: true,
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
};

const getDoctorForUser = async (userId: number) => {
  return prisma.medico.findUnique({ where: { userId } });
};

const canAccessAppointment = async (appointment: any, user: any): Promise<boolean> => {
  if (user.role === 'admin') return true;
  if (user.role === 'paciente') return appointment.pacienteId === user.userId;

  if (user.role === 'medico') {
    const doctor = await getDoctorForUser(user.userId);
    return doctor?.id === appointment.medicoId;
  }

  return false;
};

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const status = req.query.status || req.query.estado;
    const date = req.query.date || req.query.fecha;
    const where: any = {};

    if (user.role === 'paciente') {
      where.pacienteId = user.userId;
    } else if (user.role === 'medico') {
      const doctor = await getDoctorForUser(user.userId);
      if (!doctor) return res.json([]);
      where.medicoId = doctor.id;
    }

    if (status) {
      const statuses = (status as string).split(',').map(value => value.trim());
      if (statuses.some(value => !appointmentStatuses.includes(value))) {
        return res.status(400).json({ error: 'Invalid appointment status' });
      }
      where.estado = statuses.length > 1 ? { in: statuses } : statuses[0];
    }

    if (date) {
      if (!validateDateFormat(date as string)) {
        return res.status(400).json({ error: 'Invalid date format (must be YYYY-MM-DD)' });
      }
      where.fecha = toDateOnly(date as string);
    }

    const appointments = await prisma.cita.findMany({
      where,
      include: appointmentInclude,
      orderBy: [{ fecha: 'desc' }, { hora: 'desc' }]
    });

    res.json(appointments.map(formatAppointment));
  } catch (error: any) {
    console.error('Error in getAppointments:', error);
    res.status(500).json({ error: error.message || 'Error retrieving appointments' });
  }
};

export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const user = (req as any).user;

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Appointment id must be a valid number' });
    }

    const appointment = await prisma.cita.findUnique({
      where: { id },
      include: appointmentInclude
    });

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    if (!(await canAccessAppointment(appointment, user))) {
      return res.status(403).json({ error: 'You do not have permission to view this appointment' });
    }

    res.json(formatAppointment(appointment));
  } catch (error: any) {
    console.error('Error in getAppointmentById:', error);
    res.status(500).json({ error: error.message || 'Error retrieving appointment' });
  }
};

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const medicoId = Number.parseInt(String(req.body.medicoId || req.body.doctorId), 10);
    const terapiaId = Number.parseInt(String(req.body.terapiaId || req.body.therapyId), 10);
    const fecha = req.body.fecha || req.body.date;
    const hora = req.body.hora || req.body.time;
    const sintomas = req.body.sintomas || req.body.symptoms;
    const tieneExamenes = req.body.tieneExamenes ?? req.body.hasExams ?? false;
    const examenes = req.body.examenes ?? req.body.exams ?? [];

    if (!medicoId || !terapiaId || !fecha || !hora || !sintomas) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (Number.isNaN(medicoId) || Number.isNaN(terapiaId)) {
      return res.status(400).json({ error: 'Doctor and therapy ids must be valid numbers' });
    }
    if (!validateDateFormat(fecha) || !validateTimeFormat(hora)) {
      return res.status(400).json({ error: 'Invalid date or time format' });
    }
    if (sintomas.trim().length < 10) {
      return res.status(400).json({ error: 'Symptoms must be at least 10 characters long' });
    }

    try {
      validateMinAnticipation(fecha, hora);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    const [patient, doctor, therapy] = await Promise.all([
      prisma.user.findUnique({ where: { id: user.userId } }),
      prisma.medico.findUnique({ where: { id: medicoId }, include: { user: true } }),
      prisma.terapia.findUnique({ where: { id: terapiaId } })
    ]);

    if (!patient || !patient.activo) return res.status(404).json({ error: 'Active patient not found' });
    if (!doctor || !doctor.activo || !doctor.user?.activo) {
      return res.status(404).json({ error: 'Active doctor not found' });
    }
    if (!therapy || !((therapy as any).activa ?? (therapy as any).active)) return res.status(404).json({ error: 'Active therapy not found' });

    const appointmentDate = toDateOnly(fecha);
    const dayOfWeek = appointmentDate.getUTCDay();
    const schedule = await prisma.horarioAtencion.findFirst({
      where: {
        medicoId,
        diaSemana: dayOfWeek,
        activo: true
      }
    });

    if (!schedule || hora < schedule.horaInicio || hora >= schedule.horaFin) {
      return res.status(400).json({ error: 'The selected time is outside the doctor schedule' });
    }

    const [patientConflict, doctorConflict] = await Promise.all([
      prisma.cita.findFirst({
        where: { pacienteId: user.userId, fecha: appointmentDate, hora, estado: { in: activeAppointmentStatuses } }
      }),
      prisma.cita.findFirst({
        where: { medicoId, fecha: appointmentDate, hora, estado: { in: activeAppointmentStatuses } }
      })
    ]);

    if (patientConflict) {
      return res.status(409).json({ error: 'You already have an appointment booked at this date and time' });
    }
    if (doctorConflict) {
      return res.status(409).json({ error: 'This schedule is already occupied' });
    }

    const appointment = await prisma.cita.create({
      data: {
        pacienteId: user.userId,
        medicoId,
        terapiaId,
        fecha: appointmentDate,
        hora,
        estado: 'pendiente',
        sintomas: sintomas.trim(),
        tieneExamenes: Boolean(tieneExamenes),
        examenes: Array.isArray(examenes) ? examenes : []
      },
      include: appointmentInclude
    });

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: formatAppointment(appointment)
    });
  } catch (error: any) {
    console.error('Error in createAppointment:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'This schedule is already occupied' });
    }
    res.status(500).json({ error: error.message || 'Error creating appointment' });
  }
};

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const user = (req as any).user;
    const estado = req.body.estado || req.body.status;
    const notasMedico = req.body.notasMedico ?? req.body.doctorNotes;

    if (Number.isNaN(id)) return res.status(400).json({ error: 'Appointment id must be a valid number' });
    if (estado && !appointmentStatuses.includes(estado)) {
      return res.status(400).json({ error: 'Invalid appointment status' });
    }

    const appointment = await prisma.cita.findUnique({ where: { id } });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    if (!(await canAccessAppointment(appointment, user))) {
      return res.status(403).json({ error: 'You do not have permission to modify this appointment' });
    }

    if (estado === 'cancelada') {
      return res.status(400).json({ error: 'Use the cancellation endpoint for this status' });
    }
    if (appointment.estado === 'completada' || appointment.estado === 'cancelada') {
      return res.status(400).json({ error: 'This appointment cannot be updated' });
    }

    const updatedAppointment = await prisma.cita.update({
      where: { id },
      data: {
        ...(estado && { estado }),
        ...(notasMedico !== undefined && { notasMedico })
      },
      include: appointmentInclude
    });

    res.json({
      message: 'Appointment updated successfully',
      appointment: formatAppointment(updatedAppointment)
    });
  } catch (error: any) {
    console.error('Error in updateAppointment:', error);
    res.status(500).json({ error: error.message || 'Error updating appointment' });
  }
};

export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const user = (req as any).user;
    const reason = req.body.reason || req.body.motivo;

    if (Number.isNaN(id)) return res.status(400).json({ error: 'Appointment id must be a valid number' });
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: 'You must provide a cancellation reason' });
    }

    const appointment = await prisma.cita.findUnique({ where: { id } });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    if (!(await canAccessAppointment(appointment, user))) {
      return res.status(403).json({ error: 'You do not have permission to cancel this appointment' });
    }
    if (!activeAppointmentStatuses.includes(appointment.estado)) {
      return res.status(400).json({ error: 'This appointment cannot be cancelled' });
    }

    try {
      validateCancellationLeadTime(
        appointment.fecha.toISOString().split('T')[0],
        appointment.hora
      );
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    const cancelledAppointment = await prisma.cita.update({
      where: { id },
      data: {
        estado: 'cancelada',
        motivoCancelacion: reason.trim()
      },
      include: appointmentInclude
    });

    res.json({
      message: 'Appointment cancelled successfully',
      appointment: formatAppointment(cancelledAppointment)
    });
  } catch (error: any) {
    console.error('Error in cancelAppointment:', error);
    res.status(500).json({ error: error.message || 'Error cancelling appointment' });
  }
};

export const getAvailableSchedules = async (req: Request, res: Response) => {
  try {
    const doctorId = Number.parseInt(String(req.query.medicoId || req.query.doctorId), 10);
    const date = req.query.fecha || req.query.date;

    if (Number.isNaN(doctorId) || !date) {
      return res.status(400).json({ error: 'doctorId and date are required' });
    }
    if (!validateDateFormat(date as string)) {
      return res.status(400).json({ error: 'Invalid date format (must be YYYY-MM-DD)' });
    }

    const dateDate = toDateOnly(date as string);
    const doctor = await prisma.medico.findUnique({ where: { id: doctorId } });
    if (!doctor || !doctor.activo) return res.status(404).json({ error: 'Active doctor not found' });

    const schedules = await prisma.horarioAtencion.findMany({
      where: {
        medicoId: doctorId,
        diaSemana: dateDate.getUTCDay(),
        activo: true
      },
      orderBy: { horaInicio: 'asc' }
    });

    const bookedAppointments = await prisma.cita.findMany({
      where: {
        medicoId: doctorId,
        fecha: dateDate,
        estado: { in: activeAppointmentStatuses }
      },
      select: { hora: true }
    });
    const occupiedHours = new Set(bookedAppointments.map((appointment: any) => appointment.hora));
    const availableSchedules: any[] = [];

    for (const schedule of schedules) {
      const [startHour, startMinute] = schedule.horaInicio.split(':').map(Number);
      const [endHour, endMinute] = schedule.horaFin.split(':').map(Number);
      let minutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      while (minutes < endMinutes) {
        const time = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
        let available = !occupiedHours.has(time);

        try {
          validateMinAnticipation(date as string, time);
        } catch {
          available = false;
        }

        availableSchedules.push({
          fecha: date,
          hora: time,
          disponible: available,
          medicoId: doctorId
        });
        minutes += 30;
      }
    }

    res.json(availableSchedules);
  } catch (error: any) {
    console.error('Error in getAvailableSchedules:', error);
    res.status(500).json({ error: error.message || 'Error retrieving available schedules' });
  }
};
