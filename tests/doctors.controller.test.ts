import {
  getDoctors,
  getDoctorById,
  getDoctorsBySpecialty,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  createSchedule,
  getSchedulesByDoctor,
  updateSchedule,
  deleteSchedule
} from '../src/controllers/doctors.controller';

jest.mock('../src/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn()
    },
    medico: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    horarioAtencion: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    }
  }
}));

const mockPrisma = jest.requireMock('../src/prisma').default;

const createResponse = () => {
  const response: any = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response;
};

const createRequest = (overrides: any = {}) => ({
  body: {},
  params: {},
  query: {},
  user: { userId: 1, role: 'admin' },
  ...overrides
});

describe('doctors and schedules controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET doctors', () => {
    it('returns active doctors formatted with user and schedules', async () => {
      mockPrisma.medico.findMany.mockResolvedValue([
        {
          id: 1,
          userId: 10,
          especialidad: 'Fisioterapia',
          numeroLicencia: 'MED-001',
          calificacion: 4.8,
          pacientesAtendidos: 50,
          activo: true,
          user: {
            id: 10,
            cedula: '1234567890',
            fullName: 'Dr. House',
            email: 'house@flova.com',
            telefono: '0999999999'
          },
          horariosAtencion: [
            {
              id: 1,
              medicoId: 1,
              diaSemana: 1,
              horaInicio: '08:00',
              horaFin: '12:00',
              activo: true
            }
          ]
        }
      ]);

      const response = createResponse();
      await getDoctors(createRequest() as any, response);

      expect(response.status).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            especialidad: 'Fisioterapia',
            specialty: 'Fisioterapia',
            fullName: 'Dr. House',
            cedula: '1234567890',
            horarioAtencion: expect.arrayContaining([
              expect.objectContaining({
                diaSemana: 1,
                horaInicio: '08:00',
                horaFin: '12:00'
              })
            ])
          })
        ])
      );
    });

    it('returns 404 if doctor is not found by ID', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue(null);

      const response = createResponse();
      await getDoctorById(createRequest({ params: { id: '999' } }) as any, response);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith({ error: 'Médico no encontrado' });
    });

    it('filters doctors by specialty', async () => {
      mockPrisma.medico.findMany.mockResolvedValue([]);

      const response = createResponse();
      await getDoctorsBySpecialty(
        createRequest({ params: { specialty: 'Psicología' } }) as any,
        response
      );

      expect(mockPrisma.medico.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            especialidad: 'Psicología',
            activo: true
          }
        })
      );
      expect(response.json).toHaveBeenCalledWith([]);
    });
  });

  describe('POST / PUT / DELETE doctors', () => {
    it('rejects creating a doctor if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = createResponse();
      await createDoctor(
        createRequest({
          body: {
            userId: 99,
            especialidad: 'Cardiología',
            numeroLicencia: 'LIC-001'
          }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith({
        error: 'El usuario especificado no existe'
      });
      expect(mockPrisma.medico.create).not.toHaveBeenCalled();
    });

    it('rejects creating a doctor if user role is not medico', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 5, role: 'paciente' });

      const response = createResponse();
      await createDoctor(
        createRequest({
          body: {
            userId: 5,
            especialidad: 'Cardiología',
            numeroLicencia: 'LIC-001'
          }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'El usuario asociado debe tener rol "medico"'
      });
      expect(mockPrisma.medico.create).not.toHaveBeenCalled();
    });

    it('rejects duplicate doctor profile for the same user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 5, role: 'medico' });
      mockPrisma.medico.findUnique.mockResolvedValueOnce({ id: 1, userId: 5 });

      const response = createResponse();
      await createDoctor(
        createRequest({
          body: {
            userId: 5,
            especialidad: 'Cardiología',
            numeroLicencia: 'LIC-001'
          }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(409);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Ya existe un perfil de médico asociado a este usuario'
      });
    });

    it('rejects duplicate license number', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 5, role: 'medico' });
      mockPrisma.medico.findUnique
        .mockResolvedValueOnce(null) // no doctor for user
        .mockResolvedValueOnce({ id: 2, numeroLicencia: 'LIC-001' }); // license exists

      const response = createResponse();
      await createDoctor(
        createRequest({
          body: {
            userId: 5,
            especialidad: 'Cardiología',
            numeroLicencia: 'LIC-001'
          }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(409);
      expect(response.json).toHaveBeenCalledWith({
        error: 'El número de licencia ya se encuentra registrado'
      });
    });

    it('creates doctor successfully with status 201', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 5, role: 'medico' });
      mockPrisma.medico.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const createdDoctor = {
        id: 1,
        userId: 5,
        especialidad: 'Pediatría',
        numeroLicencia: 'LIC-PED-001',
        calificacion: 0,
        pacientesAtendidos: 0,
        activo: true,
        user: {
          id: 5,
          cedula: '1234567890',
          fullName: 'Dr. House',
          email: 'house@flova.com',
          telefono: '0999999999'
        },
        horariosAtencion: []
      };

      mockPrisma.medico.create.mockResolvedValue(createdDoctor);

      const response = createResponse();
      await createDoctor(
        createRequest({
          body: {
            userId: 5,
            especialidad: 'Pediatría',
            numeroLicencia: 'LIC-PED-001'
          }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(201);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          especialidad: 'Pediatría',
          numeroLicencia: 'LIC-PED-001'
        })
      );
    });

    it('updates doctor successfully with status 200', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue({
        id: 1,
        userId: 5,
        especialidad: 'Pediatría',
        numeroLicencia: 'LIC-001',
        calificacion: 4.5,
        pacientesAtendidos: 10,
        activo: true
      });

      mockPrisma.medico.update.mockResolvedValue({
        id: 1,
        userId: 5,
        especialidad: 'Neurología',
        numeroLicencia: 'LIC-001',
        calificacion: 4.8,
        pacientesAtendidos: 20,
        activo: true,
        user: {
          id: 5,
          cedula: '1234567890',
          fullName: 'Dr. House',
          email: 'house@flova.com',
          telefono: '0999999999'
        },
        horariosAtencion: []
      });

      const response = createResponse();
      await updateDoctor(
        createRequest({
          params: { id: '1' },
          body: {
            especialidad: 'Neurología',
            calificacion: 4.8,
            pacientesAtendidos: 20
          }
        }) as any,
        response
      );

      expect(response.status).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Médico actualizado exitosamente',
          doctor: expect.objectContaining({
            especialidad: 'Neurología',
            calificacion: 4.8
          })
        })
      );
    });

    it('performs soft delete for doctor and their schedules', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1, activo: true });
      mockPrisma.medico.update.mockResolvedValue({ id: 1, activo: false });
      mockPrisma.horarioAtencion.updateMany.mockResolvedValue({ count: 2 });

      const response = createResponse();
      await deleteDoctor(createRequest({ params: { id: '1' } }) as any, response);

      expect(response.status).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith({
        message: 'Médico desactivado exitosamente',
        id: 1
      });
      expect(mockPrisma.medico.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { activo: false }
      });
      expect(mockPrisma.horarioAtencion.updateMany).toHaveBeenCalledWith({
        where: { medicoId: 1, activo: true },
        data: { activo: false }
      });
    });
  });

  describe('Schedules management', () => {
    it('returns active schedules for a doctor', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.horarioAtencion.findMany.mockResolvedValue([
        {
          id: 1,
          medicoId: 1,
          diaSemana: 1,
          horaInicio: '08:00',
          horaFin: '12:00',
          activo: true,
          createdAt: new Date()
        }
      ]);

      const response = createResponse();
      await getSchedulesByDoctor(
        createRequest({ params: { id: '1' } }) as any,
        response
      );

      expect(response.status).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 1,
          medicoId: 1,
          diaSemana: 1,
          horaInicio: '08:00',
          horaFin: '12:00'
        })
      ]);
    });

    it('rejects schedule with invalid time format or start time >= end time', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1, activo: true, userId: 10 });

      const response = createResponse();
      await createSchedule(
        createRequest({
          params: { id: '1' },
          body: {
            diaSemana: 1,
            horaInicio: '16:00',
            horaFin: '08:00'
          }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'horaInicio debe ser menor que horaFin'
      });
      expect(mockPrisma.horarioAtencion.create).not.toHaveBeenCalled();
    });

    it('rejects adding schedules to an inactive doctor', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1, activo: false, userId: 10 });

      const response = createResponse();
      await createSchedule(
        createRequest({
          params: { id: '1' },
          body: {
            diaSemana: 1,
            horaInicio: '08:00',
            horaFin: '12:00'
          }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'No se pueden registrar horarios para un médico inactivo'
      });
    });

    it('rejects overlapping schedule for the same doctor and day', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1, activo: true, userId: 10 });
      mockPrisma.horarioAtencion.findMany.mockResolvedValue([
        {
          id: 10,
          medicoId: 1,
          diaSemana: 1,
          horaInicio: '08:00',
          horaFin: '12:00',
          activo: true
        }
      ]);

      const response = createResponse();
      await createSchedule(
        createRequest({
          params: { id: '1' },
          body: {
            diaSemana: 1,
            horaInicio: '11:00',
            horaFin: '14:00'
          }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(409);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Conflicto de horario: Ya existe un horario registrado o superpuesto para este día y rango de horas'
      });
      expect(mockPrisma.horarioAtencion.create).not.toHaveBeenCalled();
    });

    it('creates schedule successfully with status 201', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1, activo: true, userId: 10 });
      mockPrisma.horarioAtencion.findMany.mockResolvedValue([]);
      mockPrisma.horarioAtencion.create.mockResolvedValue({
        id: 20,
        medicoId: 1,
        diaSemana: 1,
        horaInicio: '08:00',
        horaFin: '12:00',
        activo: true
      });

      const response = createResponse();
      await createSchedule(
        createRequest({
          params: { id: '1' },
          body: {
            diaSemana: 1,
            horaInicio: '08:00',
            horaFin: '12:00'
          }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(201);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 20,
          medicoId: 1,
          diaSemana: 1,
          horaInicio: '08:00',
          horaFin: '12:00'
        })
      );
    });

    it('updates schedule successfully with status 200', async () => {
      mockPrisma.horarioAtencion.findUnique.mockResolvedValue({
        id: 20,
        medicoId: 1,
        diaSemana: 1,
        horaInicio: '08:00',
        horaFin: '12:00',
        activo: true
      });
      mockPrisma.medico.findUnique.mockResolvedValue({
        id: 1,
        userId: 10,
        activo: true
      });
      mockPrisma.horarioAtencion.findMany.mockResolvedValue([]);
      mockPrisma.horarioAtencion.update.mockResolvedValue({
        id: 20,
        medicoId: 1,
        diaSemana: 2,
        horaInicio: '09:00',
        horaFin: '13:00',
        activo: true
      });

      const response = createResponse();
      await updateSchedule(
        createRequest({
          params: { id: '20' },
          body: {
            diaSemana: 2,
            horaInicio: '09:00',
            horaFin: '13:00'
          }
        }) as any,
        response
      );

      expect(response.status).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith({
        message: 'Horario actualizado exitosamente',
        schedule: expect.objectContaining({
          id: 20,
          diaSemana: 2,
          horaInicio: '09:00',
          horaFin: '13:00'
        })
      });
    });

    it('performs soft delete for a schedule', async () => {
      mockPrisma.horarioAtencion.findUnique.mockResolvedValue({
        id: 20,
        medicoId: 1,
        activo: true
      });
      mockPrisma.medico.findUnique.mockResolvedValue({
        id: 1,
        userId: 10
      });
      mockPrisma.horarioAtencion.update.mockResolvedValue({
        id: 20,
        activo: false
      });

      const response = createResponse();
      await deleteSchedule(
        createRequest({ params: { id: '20' } }) as any,
        response
      );

      expect(response.status).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith({
        message: 'Horario desactivado exitosamente',
        id: 20
      });
      expect(mockPrisma.horarioAtencion.update).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { activo: false }
      });
    });
  });
});
