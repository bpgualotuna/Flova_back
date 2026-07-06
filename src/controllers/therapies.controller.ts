import { Request, Response } from 'express';
import prisma from '../prisma';

export const getTherapies = async (req: Request, res: Response) => {
  try {
    const specialty = req.query.specialty || req.query.especialidad;
    const active = req.query.active !== undefined ? req.query.active : req.query.activa;

    const where: any = {};

    if (specialty) {
      where.specialty = specialty as string;
    }

    if (active !== undefined) {
      where.active = active === 'true' || (active as any) === true;
    } else {
      where.active = true;
    }

    const therapies = await prisma.therapy.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });

    const formatTherapy = (t: any) => ({
      id: t.id,
      name: t.name,
      nombre: t.name,
      description: t.description,
      descripcion: t.description,
      specialty: t.specialty,
      especialidad: t.specialty,
      duration: t.duration,
      duracion: t.duration,
      price: parseFloat(t.price.toString()),
      precio: parseFloat(t.price.toString()),
      image: t.image,
      imagen: t.image,
      active: t.active,
      activa: t.active,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    });

    res.json(therapies.map(formatTherapy));
  } catch (error: any) {
    console.error('Error in getTherapies:', error);
    res.status(500).json({ error: error.message || 'Error retrieving therapies' });
  }
};

export const getTherapyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const therapy = await prisma.therapy.findUnique({
      where: { id: parseInt(id) }
    });

    if (!therapy) {
      return res.status(404).json({ error: 'Therapy not found' });
    }

    const formatTherapy = (t: any) => ({
      id: t.id,
      name: t.name,
      nombre: t.name,
      description: t.description,
      descripcion: t.description,
      specialty: t.specialty,
      especialidad: t.specialty,
      duration: t.duration,
      duracion: t.duration,
      price: parseFloat(t.price.toString()),
      precio: parseFloat(t.price.toString()),
      image: t.image,
      imagen: t.image,
      active: t.active,
      activa: t.active,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    });

    res.json(formatTherapy(therapy));
  } catch (error: any) {
    console.error('Error in getTherapyById:', error);
    res.status(500).json({ error: error.message || 'Error retrieving therapy' });
  }
};

export const createTherapy = async (req: Request, res: Response) => {
  try {
    const name = req.body.name || req.body.nombre;
    const description = req.body.description || req.body.descripcion;
    const specialty = req.body.specialty || req.body.especialidad;
    const duration = req.body.duration || req.body.duracion;
    const price = req.body.price || req.body.precio;
    const image = req.body.image || req.body.imagen;

    if (!name || !description || !specialty || !duration || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (duration <= 0) {
      return res.status(400).json({ error: 'Duration must be greater than 0' });
    }

    if (price < 0) {
      return res.status(400).json({ error: 'Price cannot be negative' });
    }

    const therapy = await prisma.therapy.create({
      data: {
        name,
        description,
        specialty,
        duration: parseInt(duration),
        price: parseFloat(price),
        image,
        active: true
      }
    });

    const formatTherapy = (t: any) => ({
      id: t.id,
      name: t.name,
      nombre: t.name,
      description: t.description,
      descripcion: t.description,
      specialty: t.specialty,
      especialidad: t.specialty,
      duration: t.duration,
      duracion: t.duration,
      price: parseFloat(t.price.toString()),
      precio: parseFloat(t.price.toString()),
      image: t.image,
      imagen: t.image,
      active: t.active,
      activa: t.active,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    });

    res.status(201).json({
      message: 'Therapy created successfully',
      therapy: formatTherapy(therapy)
    });
  } catch (error: any) {
    console.error('Error in createTherapy:', error);
    res.status(500).json({ error: error.message || 'Error creating therapy' });
  }
};

export const updateTherapy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = req.body.name || req.body.nombre;
    const description = req.body.description || req.body.descripcion;
    const specialty = req.body.specialty || req.body.especialidad;
    const duration = req.body.duration || req.body.duracion;
    const price = req.body.price || req.body.precio;
    const image = req.body.image || req.body.imagen;
    const active = req.body.active !== undefined ? req.body.active : req.body.activa;

    const therapy = await prisma.therapy.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(specialty && { specialty }),
        ...(duration && { duration: parseInt(duration) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(image !== undefined && { image }),
        ...(active !== undefined && { active })
      }
    });

    const formatTherapy = (t: any) => ({
      id: t.id,
      name: t.name,
      nombre: t.name,
      description: t.description,
      descripcion: t.description,
      specialty: t.specialty,
      especialidad: t.specialty,
      duration: t.duration,
      duracion: t.duration,
      price: parseFloat(t.price.toString()),
      precio: parseFloat(t.price.toString()),
      image: t.image,
      imagen: t.image,
      active: t.active,
      activa: t.active,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    });

    res.json({
      message: 'Therapy updated successfully',
      therapy: formatTherapy(therapy)
    });
  } catch (error: any) {
    console.error('Error in updateTherapy:', error);
    res.status(500).json({ error: error.message || 'Error updating therapy' });
  }
};

export const deleteTherapy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.therapy.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Therapy deleted successfully' });
  } catch (error: any) {
    console.error('Error in deleteTherapy:', error);
    res.status(500).json({ error: error.message || 'Error deleting therapy' });
  }
};
