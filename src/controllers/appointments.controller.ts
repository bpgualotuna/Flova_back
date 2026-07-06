import { Request, Response } from 'express';
import prisma from '../prisma';
import { validateMinAnticipation, validateCancellationLeadTime, validateTimeFormat, validateDateFormat } from '../utils/validators';

const formatAppointment = (app: any) => {
  if (!app) return null;
  const formatted: any = {
    id: app.id,
    patientId: app.patientId,
    pacienteId: app.patientId,
    doctorId: app.doctorId,
    medicoId: app.doctorId,
    therapyId: app.therapyId,
    terapiaId: app.therapyId,
    date: app.date instanceof Date ? app.date.toISOString().split('T')[0] : app.date,
    fecha: app.date instanceof Date ? app.date.toISOString().split('T')[0] : app.date,
    time: app.time,
    hora: app.time,
    status: app.status,
    estado: app.status,
    symptoms: app.symptoms,
    sintomas: app.symptoms,
    hasExams: app.hasExams,
    tieneExamenes: app.hasExams,
    exams: app.exams,
    examenes: app.exams,
    cancellationReason: app.cancellationReason,
    motivoCancelacion: app.cancellationReason,
    doctorNotes: app.doctorNotes,
    notasMedico: app.doctorNotes,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt
  };

  if (app.patient) {
    formatted.patient = {
      id: app.patient.id,
      fullName: app.patient.fullName,
      nationalId: app.patient.nationalId,
      cedula: app.patient.nationalId,
      email: app.patient.email,
      phone: app.patient.phone,
      telefono: app.patient.phone,
      insuranceType: app.patient.insuranceType,
      tipoSeguro: app.patient.insuranceType
    };
    formatted.paciente = formatted.patient;
  }

  if (app.doctor) {
    formatted.doctor = {
      id: app.doctor.id,
      fullName: app.doctor.user?.fullName || app.doctor.fullName || '',
      specialty: app.doctor.specialty,
      especialidad: app.doctor.specialty,
      licenseNumber: app.doctor.licenseNumber,
      numeroLicencia: app.doctor.licenseNumber,
      rating: app.doctor.rating ? parseFloat(app.doctor.rating.toString()) : 0,
      calificacion: app.doctor.rating ? parseFloat(app.doctor.rating.toString()) : 0
    };
    formatted.medico = formatted.doctor;
  }

  if (app.therapy) {
    formatted.therapy = {
      id: app.therapy.id,
      name: app.therapy.name,
      nombre: app.therapy.name,
      description: app.therapy.description,
      descripcion: app.therapy.description,
      specialty: app.therapy.specialty,
      especialidad: app.therapy.specialty,
      duration: app.therapy.duration,
      duracion: app.therapy.duration,
      price: app.therapy.price ? parseFloat(app.therapy.price.toString()) : 0,
      precio: app.therapy.price ? parseFloat(app.therapy.price.toString()) : 0
    };
    formatted.terapia = formatted.therapy;
  }

  return formatted;
};

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const status = req.query.status || req.query.estado;
    const date = req.query.date || req.query.fecha;

    const where: any = {};

    if (user.role === 'paciente') {
      where.patientId = user.userId;
    } else if (user.role === 'medico') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: user.userId }
      });
      if (doctor) {
        where.doctorId = doctor.id;
      }
    }

    if (status) {
      const statuses = (status as string).split(',').map(e => e.trim());
      if (statuses.length > 1) {
        where.status = { in: statuses };
      } else {
        where.status = statuses[0];
      }
    }

    if (date) {
      where.date = new Date(date as string);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            nationalId: true,
            email: true,
            phone: true,
            insuranceType: true
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        therapy: true
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ]
    });

    res.json(appointments.map(formatAppointment));
  } catch (error: any) {
    console.error('Error in getAppointments:', error);
    res.status(500).json({ error: error.message || 'Error retrieving appointments' });
  }
};

export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            nationalId: true,
            email: true,
            phone: true,
            insuranceType: true
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        therapy: true
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (user.role === 'paciente' && appointment.patientId !== user.userId) {
      return res.status(403).json({ error: 'You do not have permission to view this appointment' });
    }

    if (user.role === 'medico') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: user.userId }
      });
      if (doctor && appointment.doctorId !== doctor.id) {
        return res.status(403).json({ error: 'You do not have permission to view this appointment' });
      }
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
    const doctorId = req.body.doctorId || req.body.medicoId;
    const therapyId = req.body.therapyId || req.body.terapiaId;
    const date = req.body.date || req.body.fecha;
    const time = req.body.time || req.body.hora;
    const symptoms = req.body.symptoms || req.body.sintomas;
    const hasExams = req.body.hasExams !== undefined ? req.body.hasExams : req.body.tieneExamenes;
    const exams = req.body.exams || req.body.examenes;

    if (!doctorId || !therapyId || !date || !time || !symptoms) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!validateDateFormat(date)) {
      return res.status(400).json({ error: 'Invalid date format (must be YYYY-MM-DD)' });
    }

    if (!validateTimeFormat(time)) {
      return res.status(400).json({ error: 'Invalid time format (must be HH:mm)' });
    }

    if (symptoms.length < 10) {
      return res.status(400).json({ error: 'Symptoms must be at least 10 characters long' });
    }

    try {
      validateMinAnticipation(date, time);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: user.userId,
        date: new Date(date),
        time,
        status: {
          in: ['pending', 'confirmed']
        }
      }
    });

    if (existingAppointment) {
      return res.status(409).json({ 
        error: 'You already have an appointment booked at this date and time' 
      });
    }

    const occupiedSchedule = await prisma.appointment.findFirst({
      where: {
        doctorId: parseInt(doctorId),
        date: new Date(date),
        time,
        status: {
          in: ['pending', 'confirmed']
        }
      }
    });

    if (occupiedSchedule) {
      return res.status(409).json({ 
        error: 'This schedule is already occupied' 
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: user.userId,
        doctorId: parseInt(doctorId),
        therapyId: parseInt(therapyId),
        date: new Date(date),
        time,
        symptoms,
        hasExams: hasExams || false,
        exams: exams || [],
        status: 'pending'
      },
      include: {
        patient: {
          select: {
            fullName: true,
            nationalId: true,
            email: true
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        },
        therapy: true
      }
    });

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: formatAppointment(appointment)
    });
  } catch (error: any) {
    console.error('Error in createAppointment:', error);
    res.status(500).json({ error: error.message || 'Error creating appointment' });
  }
};

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const status = req.body.status || req.body.estado;
    const doctorNotes = req.body.doctorNotes !== undefined ? req.body.doctorNotes : req.body.notasMedico;

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (user.role === 'medico') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: user.userId }
      });
      if (doctor && appointment.doctorId !== doctor.id) {
        return res.status(403).json({ error: 'You do not have permission to modify this appointment' });
      }
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        ...(status && { status }),
        ...(doctorNotes !== undefined && { doctorNotes })
      }
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
    const { id } = req.params;
    const user = (req as any).user;
    const reason = req.body.reason || req.body.motivo;

    if (!reason) {
      return res.status(400).json({ error: 'You must provide a cancellation reason' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (user.role === 'paciente' && appointment.patientId !== user.userId) {
      return res.status(403).json({ error: 'You do not have permission to cancel this appointment' });
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({ error: 'This appointment cannot be cancelled' });
    }

    try {
      validateCancellationLeadTime(
        appointment.date.toISOString().split('T')[0],
        appointment.time
      );
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    const cancelledAppointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        status: 'cancelled',
        cancellationReason: reason
      }
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
    const doctorId = req.query.doctorId || req.query.medicoId;
    const date = req.query.date || req.query.fecha;

    if (!doctorId || doctorId === 'undefined' || !date) {
      return res.status(400).json({ error: 'doctorId and date are required' });
    }

    if (!validateDateFormat(date as string)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const doctorIdNum = parseInt(doctorId as string);
    if (isNaN(doctorIdNum)) {
      return res.status(400).json({ error: 'doctorId must be a valid number' });
    }

    const dateDate = new Date(date as string);
    const dayOfWeek = dateDate.getDay();

    const schedules = await prisma.workSchedule.findMany({
      where: {
        doctorId: doctorIdNum,
        dayOfWeek,
        active: true
      }
    });

    if (schedules.length === 0) {
      return res.json([]);
    }

    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorIdNum,
        date: dateDate,
        status: {
          in: ['pending', 'confirmed']
        }
      },
      select: {
        time: true
      }
    });

    const occupiedHours = bookedAppointments.map((c: any) => c.time);

    const availableSchedules: any[] = [];

    for (const schedule of schedules) {
      const [startHour, startMin] = schedule.startTime.split(':').map(Number);
      const [endHour, endMin] = schedule.endTime.split(':').map(Number);

      let currentHour = startHour;
      let currentMin = startMin;

      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
        
        let available = true;
        try {
          validateMinAnticipation(date as string, timeStr);
        } catch {
          available = false;
        }

        if (occupiedHours.includes(timeStr)) {
          available = false;
        }

        availableSchedules.push({
          date: date as string,
          fecha: date as string,
          time: timeStr,
          hora: timeStr,
          available,
          disponible: available,
          doctorId: doctorIdNum,
          medicoId: doctorIdNum
        });

        currentMin += 30;
        if (currentMin >= 60) {
          currentHour += 1;
          currentMin = 0;
        }
      }
    }

    res.json(availableSchedules);
  } catch (error: any) {
    console.error('Error in getAvailableSchedules:', error);
    res.status(500).json({ error: error.message || 'Error retrieving available schedules' });
  }
};
