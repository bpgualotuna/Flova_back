import { Request, Response } from 'express';
import prisma from '../prisma';

type TherapyRecord = {
  id: number;
  name: string;
  description: string;
  specialty: string;
  duration: number;
  price: number | { toString(): string };
  image: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type TherapyResponse = TherapyRecord & {
  nombre: string;
  descripcion: string;
  especialidad: string;
  duracion: number;
  precio: number;
  imagen: string | null;
  activa: boolean;
};

const readAlias = (source: Record<string, unknown>, primary: string, alias: string) => {
  if (Object.prototype.hasOwnProperty.call(source, primary)) {
    return { present: true, value: source[primary] };
  }

  if (Object.prototype.hasOwnProperty.call(source, alias)) {
    return { present: true, value: source[alias] };
  }

  return { present: false, value: undefined };
};

const isRequestBody = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const parseString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const parseNumber = (value: unknown): number | null => {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return null;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseBoolean = (value: unknown): boolean | null => {
  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return null;
};

const parseId = (value: string): number | null => {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
};

const formatTherapy = (therapy: TherapyRecord): TherapyResponse => {
  const price = Number(therapy.price.toString());

  return {
    id: therapy.id,
    name: therapy.name,
    nombre: therapy.name,
    description: therapy.description,
    descripcion: therapy.description,
    specialty: therapy.specialty,
    especialidad: therapy.specialty,
    duration: therapy.duration,
    duracion: therapy.duration,
    price,
    precio: price,
    image: therapy.image,
    imagen: therapy.image,
    active: therapy.active,
    activa: therapy.active,
    createdAt: therapy.createdAt,
    updatedAt: therapy.updatedAt
  };
};

const isNotFoundError = (error: unknown): boolean => (
  typeof error === 'object'
  && error !== null
  && 'code' in error
  && (error as { code?: string }).code === 'P2025'
);

const internalError = (operation: string, error: unknown, res: Response) => {
  console.error(`Error in ${operation}:`, error);
  return res.status(500).json({ error: `Error ${operation}` });
};

export const getTherapies = async (req: Request, res: Response) => {
  try {
    const specialtyFilter = readAlias(req.query as Record<string, unknown>, 'specialty', 'especialidad');
    const activeFilter = readAlias(req.query as Record<string, unknown>, 'active', 'activa');
    const where: Record<string, unknown> = {};

    if (specialtyFilter.present) {
      const specialty = parseString(specialtyFilter.value);
      if (!specialty) {
        return res.status(400).json({ error: 'Specialty must be a non-empty string' });
      }
      where.specialty = specialty;
    }

    if (activeFilter.present) {
      const active = parseBoolean(activeFilter.value);
      if (active === null) {
        return res.status(400).json({ error: 'Active filter must be true or false' });
      }
      where.active = active;
    } else {
      where.active = true;
    }

    const therapies = await prisma.terapia.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return res.json(therapies.map(formatTherapy));
  } catch (error) {
    return internalError('retrieving therapies', error, res);
  }
};

export const getTherapyById = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid therapy ID' });
  }

  try {
    const therapy = await prisma.terapia.findUnique({ where: { id } });

    if (!therapy) {
      return res.status(404).json({ error: 'Therapy not found' });
    }

    return res.json(formatTherapy(therapy));
  } catch (error) {
    return internalError('retrieving therapy', error, res);
  }
};

export const createTherapy = async (req: Request, res: Response) => {
  if (!isRequestBody(req.body)) {
    return res.status(400).json({ error: 'Request body must be an object' });
  }
  const body = req.body;
  const name = parseString(readAlias(body, 'name', 'nombre').value);
  const description = parseString(readAlias(body, 'description', 'descripcion').value);
  const specialty = parseString(readAlias(body, 'specialty', 'especialidad').value);
  const duration = parseNumber(readAlias(body, 'duration', 'duracion').value);
  const price = parseNumber(readAlias(body, 'price', 'precio').value);
  const imageField = readAlias(body, 'image', 'imagen');

  if (!name || !description || !specialty || duration === null || price === null) {
    return res.status(400).json({
      error: 'Name, description, specialty, duration and price are required'
    });
  }

  if (!Number.isInteger(duration) || duration <= 0) {
    return res.status(400).json({ error: 'Duration must be a positive integer' });
  }

  if (price < 0) {
    return res.status(400).json({ error: 'Price must be greater than or equal to zero' });
  }

  let image: string | null = null;
  if (imageField.present && imageField.value !== null) {
    if (typeof imageField.value !== 'string') {
      return res.status(400).json({ error: 'Image must be a string or null' });
    }
    image = imageField.value;
  }

  try {
    const therapy = await prisma.terapia.create({
      data: {
        name,
        description,
        specialty,
        duration,
        price,
        image,
        active: true
      }
    });

    return res.status(201).json({
      message: 'Therapy created successfully',
      therapy: formatTherapy(therapy)
    });
  } catch (error) {
    return internalError('creating therapy', error, res);
  }
};

export const updateTherapy = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid therapy ID' });
  }

  if (!isRequestBody(req.body)) {
    return res.status(400).json({ error: 'Request body must be an object' });
  }
  const body = req.body;
  const data: Record<string, unknown> = {};
  const nameField = readAlias(body, 'name', 'nombre');
  const descriptionField = readAlias(body, 'description', 'descripcion');
  const specialtyField = readAlias(body, 'specialty', 'especialidad');
  const durationField = readAlias(body, 'duration', 'duracion');
  const priceField = readAlias(body, 'price', 'precio');
  const imageField = readAlias(body, 'image', 'imagen');
  const activeField = readAlias(body, 'active', 'activa');

  for (const [field, input] of [
    ['name', nameField],
    ['description', descriptionField],
    ['specialty', specialtyField]
  ] as const) {
    if (input.present) {
      const value = parseString(input.value);
      if (!value) {
        return res.status(400).json({ error: `${field} must be a non-empty string` });
      }
      data[field] = value;
    }
  }

  if (durationField.present) {
    const duration = parseNumber(durationField.value);
    if (duration === null || !Number.isInteger(duration) || duration <= 0) {
      return res.status(400).json({ error: 'Duration must be a positive integer' });
    }
    data.duration = duration;
  }

  if (priceField.present) {
    const price = parseNumber(priceField.value);
    if (price === null || price < 0) {
      return res.status(400).json({ error: 'Price must be greater than or equal to zero' });
    }
    data.price = price;
  }

  if (imageField.present) {
    if (imageField.value !== null && typeof imageField.value !== 'string') {
      return res.status(400).json({ error: 'Image must be a string or null' });
    }
    data.image = imageField.value;
  }

  if (activeField.present) {
    const active = parseBoolean(activeField.value);
    if (active === null) {
      return res.status(400).json({ error: 'Active must be a boolean' });
    }
    data.active = active;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'At least one valid field is required' });
  }

  try {
    const existing = await prisma.terapia.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Therapy not found' });
    }

    const therapy = await prisma.terapia.update({ where: { id }, data });
    return res.json({
      message: 'Therapy updated successfully',
      therapy: formatTherapy(therapy)
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: 'Therapy not found' });
    }
    return internalError('updating therapy', error, res);
  }
};

export const deleteTherapy = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid therapy ID' });
  }

  try {
    const existing = await prisma.terapia.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Therapy not found' });
    }

    const therapy = await prisma.terapia.update({
      where: { id },
      data: { active: false }
    });

    return res.json({
      message: 'Therapy deactivated successfully',
      therapy: formatTherapy(therapy)
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: 'Therapy not found' });
    }
    return internalError('deactivating therapy', error, res);
  }
};
