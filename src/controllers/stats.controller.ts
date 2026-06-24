import { Request, Response } from 'express';
import prisma from '../prisma';

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalPatients = await prisma.user.count({ where: { role: 'paciente' } });
    const totalDoctors = await prisma.user.count({ where: { role: 'medico' } });
    const totalAdmins = await prisma.user.count({ where: { role: 'admin' } });

    const totalAppointments = await prisma.appointment.count();
    const pendingAppointments = await prisma.appointment.count({ where: { status: 'pending' } });
    const confirmedAppointments = await prisma.appointment.count({ where: { status: 'confirmed' } });
    const completedAppointments = await prisma.appointment.count({ where: { status: 'completed' } });
    const cancelledAppointments = await prisma.appointment.count({ where: { status: 'cancelled' } });

    const totalTherapies = await prisma.therapy.count();
    const activeTherapies = await prisma.therapy.count({ where: { active: true } });

    const appointmentsWithRevenue = await prisma.appointment.findMany({
      where: {
        status: {
          in: ['pending', 'confirmed']
        }
      },
      include: {
        therapy: {
          select: {
            price: true
          }
        }
      }
    });

    const expectedRevenue = appointmentsWithRevenue.reduce((total: number, appointment: any) => {
      return total + parseFloat(appointment.therapy.price.toString());
    }, 0);

    const completedAppointmentsWithRevenue = await prisma.appointment.findMany({
      where: {
        status: 'completed'
      },
      include: {
        therapy: {
          select: {
            price: true
          }
        }
      }
    });

    const completedRevenue = completedAppointmentsWithRevenue.reduce((total: number, appointment: any) => {
      return total + parseFloat(appointment.therapy.price.toString());
    }, 0);

    const recentAppointments = await prisma.appointment.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        patient: {
          select: {
            fullName: true,
            nationalId: true
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
        therapy: {
          select: {
            name: true,
            price: true
          }
        }
      }
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    res.json({
      users: {
        total: totalUsers,
        patients: totalPatients,
        doctors: totalDoctors,
        admins: totalAdmins,
        newLast7Days: newUsers
      },
      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        recent: recentAppointments.map(appointment => ({
          id: appointment.id,
          date: appointment.date.toISOString().split('T')[0],
          time: appointment.time,
          status: appointment.status,
          patient: appointment.patient.fullName,
          doctor: appointment.doctor.user.fullName,
          therapy: appointment.therapy.name,
          price: parseFloat(appointment.therapy.price.toString())
        }))
      },
      therapies: {
        total: totalTherapies,
        active: activeTherapies
      },
      finances: {
        expectedRevenue: parseFloat(expectedRevenue.toFixed(2)),
        completedRevenue: parseFloat(completedRevenue.toFixed(2)),
        pendingRevenue: parseFloat((expectedRevenue - completedRevenue).toFixed(2))
      }
    });
  } catch (error: any) {
    console.error('Error in getAdminStats:', error);
    res.status(500).json({ error: error.message || 'Error retrieving statistics' });
  }
};

export const getFinancialStats = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;

    const whereClause: any = {};
    
    if (month && year) {
      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0);
      
      whereClause.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const appointmentsByStatus = await Promise.all([
      prisma.appointment.findMany({
        where: { ...whereClause, status: 'completed' },
        include: { therapy: { select: { price: true, name: true } } }
      }),
      prisma.appointment.findMany({
        where: { ...whereClause, status: 'confirmed' },
        include: { therapy: { select: { price: true, name: true } } }
      }),
      prisma.appointment.findMany({
        where: { ...whereClause, status: 'pending' },
        include: { therapy: { select: { price: true, name: true } } }
      }),
      prisma.appointment.findMany({
        where: { ...whereClause, status: 'cancelled' },
        include: { therapy: { select: { price: true, name: true } } }
      })
    ]);

    const [completed, confirmed, pending, cancelled] = appointmentsByStatus;

    const calculateTotal = (appointments: any[]) => 
      appointments.reduce((sum, c) => sum + parseFloat(c.therapy.price.toString()), 0);

    const completedRevenue = calculateTotal(completed);
    const confirmedRevenue = calculateTotal(confirmed);
    const pendingRevenue = calculateTotal(pending);
    const lostRevenue = calculateTotal(cancelled);

    const allAppointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        therapy: {
          select: {
            id: true,
            name: true,
            price: true,
            specialty: true
          }
        }
      }
    });

    const revenueByTherapy = allAppointments.reduce((acc: any, appointment) => {
      const therapyId = appointment.therapy.id;
      if (!acc[therapyId]) {
        acc[therapyId] = {
          id: therapyId,
          name: appointment.therapy.name,
          specialty: appointment.therapy.specialty,
          price: parseFloat(appointment.therapy.price.toString()),
          appointmentCount: 0,
          totalRevenue: 0,
          completedAppointments: 0,
          pendingAppointments: 0,
          cancelledAppointments: 0
        };
      }
      
      acc[therapyId].appointmentCount++;
      acc[therapyId].totalRevenue += parseFloat(appointment.therapy.price.toString());
      
      if (appointment.status === 'completed') acc[therapyId].completedAppointments++;
      if (appointment.status === 'pending' || appointment.status === 'confirmed') acc[therapyId].pendingAppointments++;
      if (appointment.status === 'cancelled') acc[therapyId].cancelledAppointments++;
      
      return acc;
    }, {});

    const appointmentsByDoctor = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        doctor: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        },
        therapy: {
          select: {
            price: true
          }
        }
      }
    });

    const revenueByDoctor = appointmentsByDoctor.reduce((acc: any, appointment) => {
      const doctorId = appointment.doctor.id;
      if (!acc[doctorId]) {
        acc[doctorId] = {
          id: doctorId,
          name: appointment.doctor.user.fullName,
          specialty: appointment.doctor.specialty,
          appointmentCount: 0,
          totalRevenue: 0,
          completedAppointments: 0
        };
      }
      
      acc[doctorId].appointmentCount++;
      acc[doctorId].totalRevenue += parseFloat(appointment.therapy.price.toString());
      if (appointment.status === 'completed') acc[doctorId].completedAppointments++;
      
      return acc;
    }, {});

    res.json({
      summary: {
        completedRevenue: parseFloat(completedRevenue.toFixed(2)),
        confirmedRevenue: parseFloat(confirmedRevenue.toFixed(2)),
        pendingRevenue: parseFloat(pendingRevenue.toFixed(2)),
        lostRevenue: parseFloat(lostRevenue.toFixed(2)),
        totalRevenue: parseFloat((completedRevenue + confirmedRevenue + pendingRevenue).toFixed(2)),
        appointmentCount: {
          completed: completed.length,
          confirmed: confirmed.length,
          pending: pending.length,
          cancelled: cancelled.length,
          total: allAppointments.length
        }
      },
      byTherapy: Object.values(revenueByTherapy).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue),
      byDoctor: Object.values(revenueByDoctor).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
    });
  } catch (error: any) {
    console.error('Error in getFinancialStats:', error);
    res.status(500).json({ error: error.message || 'Error retrieving financial statistics' });
  }
};
