import { Request, Response } from 'express';
import {
  createTherapy,
  deleteTherapy,
  getTherapies,
  getTherapyById,
  updateTherapy
} from '../src/controllers/therapies.controller';
import prisma from '../src/prisma';

jest.mock('../src/prisma', () => ({
  __esModule: true,
  default: {
    terapia: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  }
}));

type MockedPrisma = {
  terapia: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
};

type MockedResponse = Response & {
  status: jest.Mock;
  json: jest.Mock;
};

const prismaMock = prisma as unknown as MockedPrisma;

const createRequest = (overrides: Partial<Request> = {}): Request => ({
  params: {},
  query: {},
  body: {},
  ...overrides
} as Request);

const createResponse = (): MockedResponse => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
} as unknown as MockedResponse);

const therapyRecord = {
  id: 1,
  name: 'Fisioterapia Deportiva',
  description: 'Tratamiento para lesiones deportivas.',
  specialty: 'Fisioterapia',
  duration: 60,
  price: 45,
  image: 'https://example.com/therapy.jpg',
  active: true,
  createdAt: new Date('2026-01-01T10:00:00.000Z'),
  updatedAt: new Date('2026-01-02T10:00:00.000Z')
};

describe('therapies.controller', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getTherapies', () => {
    it('lists active therapies and returns both English and Spanish fields', async () => {
      prismaMock.terapia.findMany.mockResolvedValue([therapyRecord]);
      const req = createRequest();
      const res = createResponse();

      await getTherapies(req, res);

      expect(prismaMock.terapia.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { name: 'asc' }
      });
      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 1,
          name: 'Fisioterapia Deportiva',
          nombre: 'Fisioterapia Deportiva',
          description: 'Tratamiento para lesiones deportivas.',
          descripcion: 'Tratamiento para lesiones deportivas.',
          specialty: 'Fisioterapia',
          especialidad: 'Fisioterapia',
          duration: 60,
          duracion: 60,
          price: 45,
          precio: 45,
          image: therapyRecord.image,
          imagen: therapyRecord.image,
          active: true,
          activa: true
        })
      ]);
    });

    it('filters therapies by Spanish specialty and inactive status', async () => {
      prismaMock.terapia.findMany.mockResolvedValue([]);
      const req = createRequest({
        query: { especialidad: 'Fisioterapia', activa: 'false' }
      });
      const res = createResponse();

      await getTherapies(req, res);

      expect(prismaMock.terapia.findMany).toHaveBeenCalledWith({
        where: { specialty: 'Fisioterapia', active: false },
        orderBy: { name: 'asc' }
      });
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('returns status 400 when the active filter is invalid', async () => {
      const req = createRequest({ query: { active: 'yes' } });
      const res = createResponse();

      await getTherapies(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Active filter must be true or false'
      });
      expect(prismaMock.terapia.findMany).not.toHaveBeenCalled();
    });

    it('returns status 500 when retrieving therapies fails', async () => {
      prismaMock.terapia.findMany.mockRejectedValue(new Error('Database error'));
      const req = createRequest();
      const res = createResponse();

      await getTherapies(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error retrieving therapies'
      });
    });
  });

  describe('getTherapyById', () => {
    it('returns status 400 when the therapy ID is invalid', async () => {
      const req = createRequest({ params: { id: 'invalid' } });
      const res = createResponse();

      await getTherapyById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid therapy ID' });
      expect(prismaMock.terapia.findUnique).not.toHaveBeenCalled();
    });

    it('returns 404 when the therapy does not exist', async () => {
      prismaMock.terapia.findUnique.mockResolvedValue(null);
      const req = createRequest({ params: { id: '99' } });
      const res = createResponse();

      await getTherapyById(req, res);

      expect(prismaMock.terapia.findUnique).toHaveBeenCalledWith({
        where: { id: 99 }
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Therapy not found' });
    });

    it('returns status 500 when retrieving a therapy fails', async () => {
      prismaMock.terapia.findUnique.mockRejectedValue(new Error('DB error'));
      const req = createRequest({ params: { id: '1' } });
      const res = createResponse();

      await getTherapyById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createTherapy', () => {
    it('creates a therapy from Spanish fields and returns its mapped fields', async () => {
      prismaMock.terapia.create.mockResolvedValue(therapyRecord);
      const req = createRequest({
        body: {
          nombre: 'Fisioterapia Deportiva',
          descripcion: 'Tratamiento para lesiones deportivas.',
          especialidad: 'Fisioterapia',
          duracion: 60,
          precio: 45,
          imagen: 'https://example.com/therapy.jpg',
          activa: true
        }
      });
      const res = createResponse();

      await createTherapy(req, res);

      expect(prismaMock.terapia.create).toHaveBeenCalledWith({
        data: {
          name: 'Fisioterapia Deportiva',
          description: 'Tratamiento para lesiones deportivas.',
          specialty: 'Fisioterapia',
          duration: 60,
          price: 45,
          image: 'https://example.com/therapy.jpg',
          active: true
        }
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Therapy created successfully',
        therapy: expect.objectContaining({
          nombre: 'Fisioterapia Deportiva',
          descripcion: 'Tratamiento para lesiones deportivas.',
          especialidad: 'Fisioterapia',
          duracion: 60,
          precio: 45,
          imagen: 'https://example.com/therapy.jpg',
          activa: true
        })
      });
    });

    it('returns status 400 when duration is not a positive integer', async () => {
      const req = createRequest({
        body: {
          nombre: 'Fisioterapia Deportiva',
          descripcion: 'Tratamiento para lesiones deportivas.',
          especialidad: 'Fisioterapia',
          duracion: 0,
          precio: 45
        }
      });
      const res = createResponse();

      await createTherapy(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Duration must be a positive integer'
      });
      expect(prismaMock.terapia.create).not.toHaveBeenCalled();
    });

    it('returns status 400 when price is negative', async () => {
      const req = createRequest({
        body: {
          nombre: 'Fisioterapia Deportiva',
          descripcion: 'Tratamiento para lesiones deportivas.',
          especialidad: 'Fisioterapia',
          duracion: 60,
          precio: -1
        }
      });
      const res = createResponse();

      await createTherapy(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Price must be greater than or equal to zero'
      });
      expect(prismaMock.terapia.create).not.toHaveBeenCalled();
    });

    it('returns status 500 when creating a therapy fails', async () => {
      prismaMock.terapia.create.mockRejectedValue(new Error('DB error'));
      const req = createRequest({
        body: {
          nombre: 'Fisioterapia Deportiva',
          descripcion: 'Tratamiento para lesiones deportivas.',
          especialidad: 'Fisioterapia',
          duracion: 60,
          precio: 45,
          imagen: 'https://example.com/therapy.jpg'
        }
      });
      const res = createResponse();

      await createTherapy(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateTherapy', () => {
    it('updates a therapy and returns the mapped fields', async () => {
      prismaMock.terapia.findUnique.mockResolvedValue(therapyRecord);
      prismaMock.terapia.update.mockResolvedValue({
        ...therapyRecord,
        name: 'Fisioterapia actualizada'
      });
      const req = createRequest({
        params: { id: '1' },
        body: { nombre: 'Fisioterapia actualizada' }
      });
      const res = createResponse();

      await updateTherapy(req, res);

      expect(prismaMock.terapia.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Fisioterapia actualizada' }
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Therapy updated successfully',
        therapy: expect.objectContaining({
          name: 'Fisioterapia actualizada',
          nombre: 'Fisioterapia actualizada'
        })
      });
    });

    it('returns status 404 when the therapy to update does not exist', async () => {
      prismaMock.terapia.findUnique.mockResolvedValue(null);
      const req = createRequest({
        params: { id: '1' },
        body: { nombre: 'Fisioterapia actualizada' }
      });
      const res = createResponse();

      await updateTherapy(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Therapy not found' });
    });

    it('returns status 404 when Prisma reports a missing therapy during update', async () => {
      prismaMock.terapia.findUnique.mockResolvedValue(therapyRecord);
      prismaMock.terapia.update.mockRejectedValue(
        Object.assign(new Error('Record not found'), { code: 'P2025' })
      );
      const req = createRequest({
        params: { id: '1' },
        body: { nombre: 'Fisioterapia actualizada' }
      });
      const res = createResponse();

      await updateTherapy(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Therapy not found' });
    });

    it('returns status 500 when updating a therapy fails', async () => {
      prismaMock.terapia.findUnique.mockResolvedValue(therapyRecord);
      prismaMock.terapia.update.mockRejectedValue(new Error('DB error'));
      const req = createRequest({
        params: { id: '1' },
        body: { nombre: 'Fisioterapia actualizada' }
      });
      const res = createResponse();

      await updateTherapy(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteTherapy', () => {
    it('deactivates the therapy without deleting it', async () => {
      prismaMock.terapia.findUnique.mockResolvedValue(therapyRecord);
      prismaMock.terapia.update.mockResolvedValue({
        ...therapyRecord,
        active: false
      });
      const req = createRequest({ params: { id: '1' } });
      const res = createResponse();

      await deleteTherapy(req, res);

      expect(prismaMock.terapia.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { active: false }
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Therapy deactivated successfully',
        therapy: expect.objectContaining({
          active: false,
          activa: false
        })
      });
    });

    it('returns status 404 when the therapy to delete does not exist', async () => {
      prismaMock.terapia.findUnique.mockResolvedValue(null);
      const req = createRequest({ params: { id: '1' } });
      const res = createResponse();

      await deleteTherapy(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Therapy not found' });
    });

    it('returns status 500 when deactivating a therapy fails', async () => {
      prismaMock.terapia.findUnique.mockResolvedValue(therapyRecord);
      prismaMock.terapia.update.mockRejectedValue(new Error('DB error'));
      const req = createRequest({ params: { id: '1' } });
      const res = createResponse();

      await deleteTherapy(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
