import { Request, Response } from 'express';
import prisma from '../prisma';

/**
 * GET /api/stats/admin
 * Obtener estadísticas generales del sistema (Admin)
 */
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    // Total de usuarios por rol
    const totalUsuarios = await prisma.user.count();
    const totalPacientes = await prisma.user.count({ where: { role: 'paciente' } });
    const totalMedicos = await prisma.user.count({ where: { role: 'medico' } });
    const totalAdmins = await prisma.user.count({ where: { role: 'admin' } });

    // Total de citas por estado
    const totalCitas = await prisma.cita.count();
    const citasPendientes = await prisma.cita.count({ where: { estado: 'pendiente' } });
    const citasConfirmadas = await prisma.cita.count({ where: { estado: 'confirmada' } });
    const citasCompletadas = await prisma.cita.count({ where: { estado: 'completada' } });
    const citasCanceladas = await prisma.cita.count({ where: { estado: 'cancelada' } });

    // Total de terapias
    const totalTerapias = await prisma.terapia.count();
    const terapiasActivas = await prisma.terapia.count({ where: { activa: true } });

    // Ingresos esperados (citas confirmadas y pendientes)
    const citasConIngreso = await prisma.cita.findMany({
      where: {
        estado: {
          in: ['pendiente', 'confirmada']
        }
      },
      include: {
        terapia: {
          select: {
            precio: true
          }
        }
      }
    });

    const ingresosEsperados = citasConIngreso.reduce((total, cita) => {
      return total + parseFloat(cita.terapia.precio.toString());
    }, 0);

    // Ingresos completados (citas completadas)
    const citasCompletadasConIngreso = await prisma.cita.findMany({
      where: {
        estado: 'completada'
      },
      include: {
        terapia: {
          select: {
            precio: true
          }
        }
      }
    });

    const ingresosCompletados = citasCompletadasConIngreso.reduce((total, cita) => {
      return total + parseFloat(cita.terapia.precio.toString());
    }, 0);

    // Citas recientes (últimas 10)
    const citasRecientes = await prisma.cita.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        paciente: {
          select: {
            fullName: true,
            cedula: true
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
        terapia: {
          select: {
            nombre: true,
            precio: true
          }
        }
      }
    });

    // Usuarios registrados recientemente (últimos 7 días)
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    const nuevosUsuarios = await prisma.user.count({
      where: {
        createdAt: {
          gte: hace7Dias
        }
      }
    });

    res.json({
      usuarios: {
        total: totalUsuarios,
        pacientes: totalPacientes,
        medicos: totalMedicos,
        admins: totalAdmins,
        nuevosUltimos7Dias: nuevosUsuarios
      },
      citas: {
        total: totalCitas,
        pendientes: citasPendientes,
        confirmadas: citasConfirmadas,
        completadas: citasCompletadas,
        canceladas: citasCanceladas,
        recientes: citasRecientes.map(c => ({
          id: c.id,
          fecha: c.fecha.toISOString().split('T')[0],
          hora: c.hora,
          estado: c.estado,
          paciente: c.paciente.fullName,
          medico: c.medico.user.fullName,
          terapia: c.terapia.nombre,
          precio: parseFloat(c.terapia.precio.toString())
        }))
      },
      terapias: {
        total: totalTerapias,
        activas: terapiasActivas
      },
      finanzas: {
        ingresosEsperados: parseFloat(ingresosEsperados.toFixed(2)),
        ingresosCompletados: parseFloat(ingresosCompletados.toFixed(2)),
        ingresosPendientes: parseFloat((ingresosEsperados - ingresosCompletados).toFixed(2))
      }
    });
  } catch (error: any) {
    console.error('Error en getAdminStats:', error);
    res.status(500).json({ error: error.message || 'Error al obtener estadísticas' });
  }
};

/**
 * GET /api/stats/finanzas
 * Obtener estadísticas financieras detalladas (Admin)
 */
export const getFinanzasStats = async (req: Request, res: Response) => {
  try {
    const { mes, anio } = req.query;

    // Filtros de fecha
    const whereClause: any = {};
    
    if (mes && anio) {
      const mesNum = parseInt(mes as string);
      const anioNum = parseInt(anio as string);
      const fechaInicio = new Date(anioNum, mesNum - 1, 1);
      const fechaFin = new Date(anioNum, mesNum, 0);
      
      whereClause.fecha = {
        gte: fechaInicio,
        lte: fechaFin
      };
    }

    // Ingresos por estado
    const citasPorEstado = await Promise.all([
      prisma.cita.findMany({
        where: { ...whereClause, estado: 'completada' },
        include: { terapia: { select: { precio: true, nombre: true } } }
      }),
      prisma.cita.findMany({
        where: { ...whereClause, estado: 'confirmada' },
        include: { terapia: { select: { precio: true, nombre: true } } }
      }),
      prisma.cita.findMany({
        where: { ...whereClause, estado: 'pendiente' },
        include: { terapia: { select: { precio: true, nombre: true } } }
      }),
      prisma.cita.findMany({
        where: { ...whereClause, estado: 'cancelada' },
        include: { terapia: { select: { precio: true, nombre: true } } }
      })
    ]);

    const [completadas, confirmadas, pendientes, canceladas] = citasPorEstado;

    const calcularTotal = (citas: any[]) => 
      citas.reduce((sum, c) => sum + parseFloat(c.terapia.precio.toString()), 0);

    const ingresosCompletados = calcularTotal(completadas);
    const ingresosConfirmados = calcularTotal(confirmadas);
    const ingresosPendientes = calcularTotal(pendientes);
    const ingresosPerdidos = calcularTotal(canceladas);

    // Ingresos por terapia
    const todasLasCitas = await prisma.cita.findMany({
      where: whereClause,
      include: {
        terapia: {
          select: {
            id: true,
            nombre: true,
            precio: true,
            especialidad: true
          }
        }
      }
    });

    const ingresosPorTerapia = todasLasCitas.reduce((acc: any, cita) => {
      const terapiaId = cita.terapia.id;
      if (!acc[terapiaId]) {
        acc[terapiaId] = {
          id: terapiaId,
          nombre: cita.terapia.nombre,
          especialidad: cita.terapia.especialidad,
          precio: parseFloat(cita.terapia.precio.toString()),
          cantidadCitas: 0,
          ingresosTotal: 0,
          citasCompletadas: 0,
          citasPendientes: 0,
          citasCanceladas: 0
        };
      }
      
      acc[terapiaId].cantidadCitas++;
      acc[terapiaId].ingresosTotal += parseFloat(cita.terapia.precio.toString());
      
      if (cita.estado === 'completada') acc[terapiaId].citasCompletadas++;
      if (cita.estado === 'pendiente' || cita.estado === 'confirmada') acc[terapiaId].citasPendientes++;
      if (cita.estado === 'cancelada') acc[terapiaId].citasCanceladas++;
      
      return acc;
    }, {});

    // Ingresos por médico
    const citasPorMedico = await prisma.cita.findMany({
      where: whereClause,
      include: {
        medico: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        },
        terapia: {
          select: {
            precio: true
          }
        }
      }
    });

    const ingresosPorMedico = citasPorMedico.reduce((acc: any, cita) => {
      const medicoId = cita.medico.id;
      if (!acc[medicoId]) {
        acc[medicoId] = {
          id: medicoId,
          nombre: cita.medico.user.fullName,
          especialidad: cita.medico.especialidad,
          cantidadCitas: 0,
          ingresosTotal: 0,
          citasCompletadas: 0
        };
      }
      
      acc[medicoId].cantidadCitas++;
      acc[medicoId].ingresosTotal += parseFloat(cita.terapia.precio.toString());
      if (cita.estado === 'completada') acc[medicoId].citasCompletadas++;
      
      return acc;
    }, {});

    res.json({
      resumen: {
        ingresosCompletados: parseFloat(ingresosCompletados.toFixed(2)),
        ingresosConfirmados: parseFloat(ingresosConfirmados.toFixed(2)),
        ingresosPendientes: parseFloat(ingresosPendientes.toFixed(2)),
        ingresosPerdidos: parseFloat(ingresosPerdidos.toFixed(2)),
        ingresosTotal: parseFloat((ingresosCompletados + ingresosConfirmados + ingresosPendientes).toFixed(2)),
        cantidadCitas: {
          completadas: completadas.length,
          confirmadas: confirmadas.length,
          pendientes: pendientes.length,
          canceladas: canceladas.length,
          total: todasLasCitas.length
        }
      },
      porTerapia: Object.values(ingresosPorTerapia).sort((a: any, b: any) => b.ingresosTotal - a.ingresosTotal),
      porMedico: Object.values(ingresosPorMedico).sort((a: any, b: any) => b.ingresosTotal - a.ingresosTotal)
    });
  } catch (error: any) {
    console.error('Error en getFinanzasStats:', error);
    res.status(500).json({ error: error.message || 'Error al obtener estadísticas financieras' });
  }
};
