import { Request, Response } from 'express';
import prisma from '../prisma';

/**
 * GET /api/terapias
 * Obtener todas las terapias activas
 */
export const getTerapias = async (req: Request, res: Response) => {
  try {
    const { especialidad, activa } = req.query;

    const where: any = {};

    if (especialidad) {
      where.especialidad = especialidad as string;
    }

    if (activa !== undefined) {
      where.activa = activa === 'true';
    } else {
      // Por defecto, solo terapias activas
      where.activa = true;
    }

    const terapias = await prisma.terapia.findMany({
      where,
      orderBy: {
        nombre: 'asc'
      }
    });

    res.json(terapias);
  } catch (error: any) {
    console.error('Error en getTerapias:', error);
    res.status(500).json({ error: error.message || 'Error al obtener terapias' });
  }
};

/**
 * GET /api/terapias/:id
 * Obtener una terapia por ID
 */
export const getTerapiaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const terapia = await prisma.terapia.findUnique({
      where: { id: parseInt(id) }
    });

    if (!terapia) {
      return res.status(404).json({ error: 'Terapia no encontrada' });
    }

    res.json(terapia);
  } catch (error: any) {
    console.error('Error en getTerapiaById:', error);
    res.status(500).json({ error: error.message || 'Error al obtener terapia' });
  }
};

/**
 * POST /api/terapias
 * Crear nueva terapia (Admin)
 */
export const createTerapia = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, especialidad, duracion, precio, imagen } = req.body;

    // Validaciones
    if (!nombre || !descripcion || !especialidad || !duracion || !precio) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (duracion <= 0) {
      return res.status(400).json({ error: 'La duración debe ser mayor a 0' });
    }

    if (precio < 0) {
      return res.status(400).json({ error: 'El precio no puede ser negativo' });
    }

    const terapia = await prisma.terapia.create({
      data: {
        nombre,
        descripcion,
        especialidad,
        duracion: parseInt(duracion),
        precio: parseFloat(precio),
        imagen,
        activa: true
      }
    });

    res.status(201).json({
      message: 'Terapia creada exitosamente',
      terapia
    });
  } catch (error: any) {
    console.error('Error en createTerapia:', error);
    res.status(500).json({ error: error.message || 'Error al crear terapia' });
  }
};

/**
 * PUT /api/terapias/:id
 * Actualizar terapia (Admin)
 */
export const updateTerapia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, especialidad, duracion, precio, imagen, activa } = req.body;

    const terapia = await prisma.terapia.update({
      where: { id: parseInt(id) },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion && { descripcion }),
        ...(especialidad && { especialidad }),
        ...(duracion && { duracion: parseInt(duracion) }),
        ...(precio !== undefined && { precio: parseFloat(precio) }),
        ...(imagen !== undefined && { imagen }),
        ...(activa !== undefined && { activa })
      }
    });

    res.json({
      message: 'Terapia actualizada exitosamente',
      terapia
    });
  } catch (error: any) {
    console.error('Error en updateTerapia:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar terapia' });
  }
};

/**
 * DELETE /api/terapias/:id
 * Eliminar terapia (Admin)
 */
export const deleteTerapia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.terapia.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Terapia eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error en deleteTerapia:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar terapia' });
  }
};
