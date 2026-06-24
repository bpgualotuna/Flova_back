import { Request, Response } from 'express';
import prisma from '../prisma';

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const { specialty } = req.query;

    const where: any = {
      active: true
    };

    if (specialty) {
      where.specialty = specialty as string;
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nationalId: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        schedules: {
          where: {
            active: true
          },
          orderBy: {
            dayOfWeek: 'asc'
          }
        }
      },
      orderBy: {
        rating: 'desc'
      }
    });

    const formattedDoctors = doctors.map(doctor => ({
      id: doctor.id,
      userId: doctor.userId,
      fullName: doctor.user.fullName,
      nationalId: doctor.user.nationalId,
      email: doctor.user.email,
      phone: doctor.user.phone,
      specialty: doctor.specialty,
      licenseNumber: doctor.licenseNumber,
      rating: parseFloat(doctor.rating.toString()),
      patientsServed: doctor.patientsServed,
      workSchedule: doctor.schedules.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    }));

    res.json(formattedDoctors);
  } catch (error: any) {
    console.error('Error in getDoctors:', error);
    res.status(500).json({ error: error.message || 'Error retrieving doctors' });
  }
};

export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            nationalId: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        schedules: {
          where: {
            active: true
          },
          orderBy: {
            dayOfWeek: 'asc'
          }
        }
      }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const formattedDoctor = {
      id: doctor.id,
      userId: doctor.userId,
      fullName: doctor.user.fullName,
      nationalId: doctor.user.nationalId,
      email: doctor.user.email,
      phone: doctor.user.phone,
      specialty: doctor.specialty,
      licenseNumber: doctor.licenseNumber,
      rating: parseFloat(doctor.rating.toString()),
      patientsServed: doctor.patientsServed,
      workSchedule: doctor.schedules.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    };

    res.json(formattedDoctor);
  } catch (error: any) {
    console.error('Error in getDoctorById:', error);
    res.status(500).json({ error: error.message || 'Error retrieving doctor' });
  }
};

export const getDoctorsBySpecialty = async (req: Request, res: Response) => {
  try {
    const { specialty } = req.params;

    const doctors = await prisma.doctor.findMany({
      where: {
        specialty,
        active: true
      },
      include: {
        user: {
          select: {
            id: true,
            nationalId: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        schedules: {
          where: {
            active: true
          },
          orderBy: {
            dayOfWeek: 'asc'
          }
        }
      },
      orderBy: {
        rating: 'desc'
      }
    });

    const formattedDoctors = doctors.map(doctor => ({
      id: doctor.id,
      userId: doctor.userId,
      fullName: doctor.user.fullName,
      nationalId: doctor.user.nationalId,
      email: doctor.user.email,
      phone: doctor.user.phone,
      specialty: doctor.specialty,
      licenseNumber: doctor.licenseNumber,
      rating: parseFloat(doctor.rating.toString()),
      patientsServed: doctor.patientsServed,
      workSchedule: doctor.schedules.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    }));

    res.json(formattedDoctors);
  } catch (error: any) {
    console.error('Error in getDoctorsBySpecialty:', error);
    res.status(500).json({ error: error.message || 'Error retrieving doctors' });
  }
};
