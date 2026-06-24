import { Request, Response } from 'express';
import prisma from '../prisma';

export const getTherapies = async (req: Request, res: Response) => {
  try {
    const { specialty, active } = req.query;

    const where: any = {};

    if (specialty) {
      where.specialty = specialty as string;
    }

    if (active !== undefined) {
      where.active = active === 'true';
    } else {
      where.active = true;
    }

    const therapies = await prisma.therapy.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });

    res.json(therapies);
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

    res.json(therapy);
  } catch (error: any) {
    console.error('Error in getTherapyById:', error);
    res.status(500).json({ error: error.message || 'Error retrieving therapy' });
  }
};

export const createTherapy = async (req: Request, res: Response) => {
  try {
    const { name, description, specialty, duration, price, image } = req.body;

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

    res.status(201).json({
      message: 'Therapy created successfully',
      therapy
    });
  } catch (error: any) {
    console.error('Error in createTherapy:', error);
    res.status(500).json({ error: error.message || 'Error creating therapy' });
  }
};

export const updateTherapy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, specialty, duration, price, image, active } = req.body;

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

    res.json({
      message: 'Therapy updated successfully',
      therapy
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
