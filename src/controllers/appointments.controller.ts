import { Request, Response } from 'express';
import prisma from '../prisma';
import { validateMinAnticipation, validateCancellationLeadTime, validateTimeFormat, validateDateFormat } from '../utils/validators';

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status, date } = req.query;

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

    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      therapyId: appointment.therapyId,
      date: appointment.date.toISOString().split('T')[0],
      time: appointment.time,
      status: appointment.status,
      symptoms: appointment.symptoms,
      hasExams: appointment.hasExams,
      exams: appointment.exams,
      cancellationReason: appointment.cancellationReason,
      doctorNotes: appointment.doctorNotes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      patient: appointment.patient,
      doctor: {
        id: appointment.doctor.id,
        fullName: appointment.doctor.user.fullName,
        specialty: appointment.doctor.specialty,
        licenseNumber: appointment.doctor.licenseNumber,
        rating: parseFloat(appointment.doctor.rating.toString())
      },
      therapy: {
        id: appointment.therapy.id,
        name: appointment.therapy.name,
        description: appointment.therapy.description,
        specialty: appointment.therapy.specialty,
        duration: appointment.therapy.duration,
        price: parseFloat(appointment.therapy.price.toString())
      }
    }));

    res.json(formattedAppointments);
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

    const formattedAppointment = {
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      therapyId: appointment.therapyId,
      date: appointment.date.toISOString().split('T')[0],
      time: appointment.time,
      status: appointment.status,
      symptoms: appointment.symptoms,
      hasExams: appointment.hasExams,
      exams: appointment.exams,
      cancellationReason: appointment.cancellationReason,
      doctorNotes: appointment.doctorNotes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      patient: appointment.patient,
      doctor: {
        id: appointment.doctor.id,
        fullName: appointment.doctor.user.fullName,
        specialty: appointment.doctor.specialty,
        licenseNumber: appointment.doctor.licenseNumber,
        rating: parseFloat(appointment.doctor.rating.toString())
      },
      therapy: {
        id: appointment.therapy.id,
        name: appointment.therapy.name,
        description: appointment.therapy.description,
        specialty: appointment.therapy.specialty,
        duration: appointment.therapy.duration,
        price: parseFloat(appointment.therapy.price.toString())
      }
    };

    res.json(formattedAppointment);
  } catch (error: any) {
    console.error('Error in getAppointmentById:', error);
    res.status(500).json({ error: error.message || 'Error retrieving appointment' });
  }
};

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { doctorId, therapyId, date, time, symptoms, hasExams, exams } = req.body;

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
      appointment: {
        id: appointment.id,
        date: appointment.date.toISOString().split('T')[0],
        time: appointment.time,
        status: appointment.status,
        patient: appointment.patient,
        doctor: {
          fullName: appointment.doctor.user.fullName,
          specialty: appointment.doctor.specialty
        },
        therapy: {
          name: appointment.therapy.name,
          duration: appointment.therapy.duration,
          price: parseFloat(appointment.therapy.price.toString())
        }
      }
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
    const { status, doctorNotes } = req.body;

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
      appointment: updatedAppointment
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
    const { reason } = req.body;

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
      appointment: cancelledAppointment
    });
  } catch (error: any) {
    console.error('Error in cancelAppointment:', error);
    res.status(500).json({ error: error.message || 'Error cancelling appointment' });
  }
};

export const getAvailableSchedules = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.query;

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
          time: timeStr,
          available,
          doctorId: doctorIdNum
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
