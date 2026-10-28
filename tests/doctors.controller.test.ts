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
  deleteSchedule,
  formatDoctor,
  formatSchedule
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

describe('doctors and schedules controller - exhaustive coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('format helpers', () => {
    it('handles null values in formatDoctor and formatSchedule', () => {
      expect(formatDoctor(null)).toBeNull();
      expect(formatSchedule(null)).toBeNull();
    });

    it('formats doctor with fallback and undefined fields', () => {
      const formatted = formatDoctor({
        id: 1,
        userId: 2,
        rating: 4.2,
        patientsServed: 15,
        schedules: [
          { id: 10, dayOfWeek: 2, startTime: '09:00', endTime: '13:00', active: true },
          { id: 11, dayOfWeek: 3, startTime: '09:00', endTime: '13:00', active: false }
        ]
      });

      expect(formatted).toMatchObject({
        id: 1,
        userId: 2,
        fullName: '',
        calificacion: 4.2,
        rating: 4.2,
        pacientesAtendidos: 15
      });
      expect(formatted?.workSchedule).toHaveLength(1);
    });
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
      await getDoctors(createRequest({ query: { especialidad: 'Fisioterapia' } }) as any, response);

      expect(response.status).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            especialidad: 'Fisioterapia'
          })
        ])
      );
    });

    it('handles 500 error in getDoctors', async () => {
      mockPrisma.medico.findMany.mockRejectedValue(new Error('DB failure'));
      const response = createResponse();
      await getDoctors(createRequest() as any, response);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({ error: 'DB failure' });
    });

    it('returns 400 for invalid doctor id in getDoctorById', async () => {
      const response = createResponse();
      await getDoctorById(createRequest({ params: { id: 'abc' } }) as any, response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({ error: 'ID de médico inválido' });
    });

    it('returns 404 if doctor is not found by ID', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue(null);

      const response = createResponse();
      await getDoctorById(createRequest({ params: { id: '999' } }) as any, response);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith({ error: 'Médico no encontrado' });
    });

    it('handles 500 in getDoctorById', async () => {
      mockPrisma.medico.findUnique.mockRejectedValue(new Error('Connection lost'));
      const response = createResponse();
      await getDoctorById(createRequest({ params: { id: '1' } }) as any, response);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({ error: 'Connection lost' });
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
          where: { especialidad: 'Psicología', activo: true }
        })
      );
      expect(response.json).toHaveBeenCalledWith([]);
    });

    it('handles 500 in getDoctorsBySpecialty', async () => {
      mockPrisma.medico.findMany.mockRejectedValue(new Error('Query failed'));
      const response = createResponse();
      await getDoctorsBySpecialty(createRequest({ params: { specialty: 'General' } }) as any, response);

      expect(response.status).toHaveBeenCalledWith(500);
    });
  });

  describe('POST / PUT / DELETE doctors', () => {
    it('rejects createDoctor if userId is missing or invalid', async () => {
      const response = createResponse();
      await createDoctor(createRequest({ body: { userId: 'invalid' } }) as any, response);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'userId es obligatorio y debe ser un número entero'
      });
    });

    it('rejects creating a doctor if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = createResponse();
      await createDoctor(
        createRequest({
          body: { userId: 99, especialidad: 'Cardiología', numeroLicencia: 'LIC-001' }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith({
        error: 'El usuario especificado no existe'
      });
    });

    it('rejects creating a doctor if user role is not medico', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 5, role: 'paciente' });

      const response = createResponse();
      await createDoctor(
        createRequest({
          body: { userId: 5, especialidad: 'Cardiología', numeroLicencia: 'LIC-001' }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'El usuario asociado debe tener rol "medico"'
      });
    });

    it('rejects duplicate doctor profile for the same user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 5, role: 'medico' });
      mockPrisma.medico.findUnique.mockResolvedValueOnce({ id: 1, userId: 5 });

      const response = createResponse();
      await createDoctor(
        createRequest({
          body: { userId: 5, especialidad: 'Cardiología', numeroLicencia: 'LIC-001' }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(409);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Ya existe un perfil de médico asociado a este usuario'
      });
    });

    it('rejects createDoctor if specialty is missing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 5, role: 'medico' });
      mockPrisma.medico.findUnique.mockResolvedValueOnce(null);

      const response = createResponse();
      await createDoctor(
        createRequest({
          body: { userId: 5, numeroLicencia: 'LIC-001' }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'La especialidad es obligatoria'
      });
    });

    it('rejects createDoctor if license number is missing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 5, role: 'medico' });
      mockPrisma.medico.findUnique.mockResolvedValueOnce(null);

      const response = createResponse();
      await createDoctor(
        createRequest({
          body: { userId: 5, especialidad: 'Oftalmología' }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'El número de licencia es obligatorio'
      });
    });

    it('rejects duplicate license number in createDoctor', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 5, role: 'medico' });
      mockPrisma.medico.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 2, numeroLicencia: 'LIC-001' });

      const response = createResponse();
      await createDoctor(
        createRequest({
          body: { userId: 5, especialidad: 'Cardiología', numeroLicencia: 'LIC-001' }
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
        user: { id: 5, cedula: '1234567890', fullName: 'Dr. House', email: 'house@flova.com', telefono: '0999999999' },
        horariosAtencion: []
      };

      mockPrisma.medico.create.mockResolvedValue(createdDoctor);

      const response = createResponse();
      await createDoctor(
        createRequest({
          body: { userId: 5, especialidad: 'Pediatría', numeroLicencia: 'LIC-PED-001' }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(201);
    });

    it('handles 500 error in createDoctor', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Internal write error'));
      const response = createResponse();
      await createDoctor(
        createRequest({
          body: { userId: 5, especialidad: 'Pediatría', numeroLicencia: 'LIC-001' }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(500);
    });

    it('validates updateDoctor: invalid id or not found', async () => {
      const resp1 = createResponse();
      await updateDoctor(createRequest({ params: { id: 'bad' } }) as any, resp1);
      expect(resp1.status).toHaveBeenCalledWith(400);

      mockPrisma.medico.findUnique.mockResolvedValue(null);
      const resp2 = createResponse();
      await updateDoctor(createRequest({ params: { id: '99' } }) as any, resp2);
      expect(resp2.status).toHaveBeenCalledWith(404);
    });

    it('validates updateDoctor userId changes', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1, userId: 5, numeroLicencia: 'LIC-1' });

      // Invalid NaN userId
      const resp1 = createResponse();
      await updateDoctor(createRequest({ params: { id: '1' }, body: { userId: 'invalid' } }) as any, resp1);
      expect(resp1.status).toHaveBeenCalledWith(400);

      // User not found
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const resp2 = createResponse();
      await updateDoctor(createRequest({ params: { id: '1' }, body: { userId: 8 } }) as any, resp2);
      expect(resp2.status).toHaveBeenCalledWith(404);

      // User not medico
      mockPrisma.user.findUnique.mockResolvedValue({ id: 8, role: 'paciente' });
      const resp3 = createResponse();
      await updateDoctor(createRequest({ params: { id: '1' }, body: { userId: 8 } }) as any, resp3);
      expect(resp3.status).toHaveBeenCalledWith(400);

      // User already assigned to another doctor
      mockPrisma.user.findUnique.mockResolvedValue({ id: 8, role: 'medico' });
      mockPrisma.medico.findUnique.mockResolvedValueOnce({ id: 1, userId: 5, numeroLicencia: 'LIC-1' });
      mockPrisma.medico.findUnique.mockResolvedValueOnce({ id: 99, userId: 8 });
      const resp4 = createResponse();
      await updateDoctor(createRequest({ params: { id: '1' }, body: { userId: 8 } }) as any, resp4);
      expect(resp4.status).toHaveBeenCalledWith(409);
    });

    it('validates updateDoctor specialty and license errors', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1, userId: 5, numeroLicencia: 'LIC-1' });

      // Empty specialty
      const resp1 = createResponse();
      await updateDoctor(createRequest({ params: { id: '1' }, body: { especialidad: '   ' } }) as any, resp1);
      expect(resp1.status).toHaveBeenCalledWith(400);

      // Empty license
      const resp2 = createResponse();
      await updateDoctor(createRequest({ params: { id: '1' }, body: { numeroLicencia: '   ' } }) as any, resp2);
      expect(resp2.status).toHaveBeenCalledWith(400);

      // License in use
      mockPrisma.medico.findUnique.mockResolvedValueOnce({ id: 1, userId: 5, numeroLicencia: 'LIC-1' });
      mockPrisma.medico.findUnique.mockResolvedValueOnce({ id: 2, numeroLicencia: 'LIC-DUPLICATE' });
      const resp3 = createResponse();
      await updateDoctor(createRequest({ params: { id: '1' }, body: { numeroLicencia: 'LIC-DUPLICATE' } }) as any, resp3);
      expect(resp3.status).toHaveBeenCalledWith(409);
    });

    it('updates doctor successfully with status 200 and handles deactivation', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue({
        id: 1,
        userId: 5,
        especialidad: 'Pediatría',
        numeroLicencia: 'LIC-001',
        activo: true
      });

      mockPrisma.horarioAtencion.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.medico.update.mockResolvedValue({
        id: 1,
        userId: 5,
        especialidad: 'Neurología',
        numeroLicencia: 'LIC-001',
        calificacion: 4.8,
        pacientesAtendidos: 20,
        activo: false,
        user: { id: 5, cedula: '1234567890', fullName: 'Dr. House', email: 'house@flova.com', telefono: '0999999999' },
        horariosAtencion: []
      });

      const response = createResponse();
      await updateDoctor(
        createRequest({
          params: { id: '1' },
          body: {
            especialidad: 'Neurología',
            calificacion: 4.8,
            pacientesAtendidos: 20,
            activo: false
          }
        }) as any,
        response
      );

      expect(response.status).not.toHaveBeenCalled();
      expect(mockPrisma.horarioAtencion.updateMany).toHaveBeenCalledWith({
        where: { medicoId: 1, activo: true },
        data: { activo: false }
      });
    });

    it('handles 500 error in updateDoctor', async () => {
      mockPrisma.medico.findUnique.mockRejectedValue(new Error('Update crash'));
      const response = createResponse();
      await updateDoctor(createRequest({ params: { id: '1' } }) as any, response);
      expect(response.status).toHaveBeenCalledWith(500);
    });

    it('validates deleteDoctor: invalid id, not found and error', async () => {
      const resp1 = createResponse();
      await deleteDoctor(createRequest({ params: { id: 'xyz' } }) as any, resp1);
      expect(resp1.status).toHaveBeenCalledWith(400);

      mockPrisma.medico.findUnique.mockResolvedValue(null);
      const resp2 = createResponse();
      await deleteDoctor(createRequest({ params: { id: '99' } }) as any, resp2);
      expect(resp2.status).toHaveBeenCalledWith(404);

      mockPrisma.medico.findUnique.mockRejectedValue(new Error('Delete error'));
      const resp3 = createResponse();
      await deleteDoctor(createRequest({ params: { id: '1' } }) as any, resp3);
      expect(resp3.status).toHaveBeenCalledWith(500);
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
    });
  });

  describe('Schedules management', () => {
    it('validates createSchedule invalid doctor ID and not found', async () => {
      const resp1 = createResponse();
      await createSchedule(createRequest({ params: { id: 'bad' } }) as any, resp1);
      expect(resp1.status).toHaveBeenCalledWith(400);

      mockPrisma.medico.findUnique.mockResolvedValue(null);
      const resp2 = createResponse();
      await createSchedule(createRequest({ params: { id: '10' } }) as any, resp2);
      expect(resp2.status).toHaveBeenCalledWith(404);
    });

    it('rejects createSchedule if role is medico and userId does not match', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1, activo: true, userId: 10 });
      const response = createResponse();
      await createSchedule(
        createRequest({
          params: { id: '1' },
          user: { userId: 999, role: 'medico' },
          body: { diaSemana: 1, horaInicio: '08:00', horaFin: '12:00' }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(403);
      expect(response.json).toHaveBeenCalledWith({
        error: 'No tienes permiso para gestionar horarios de otro médico'
      });
    });

    it('rejects createSchedule with invalid day of week or invalid time formats', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1, activo: true, userId: 10 });

      // Invalid day
      const resp1 = createResponse();
      await createSchedule(createRequest({ params: { id: '1' }, body: { diaSemana: 8 } }) as any, resp1);
      expect(resp1.status).toHaveBeenCalledWith(400);

      // Invalid horaInicio
      const resp2 = createResponse();
      await createSchedule(createRequest({ params: { id: '1' }, body: { diaSemana: 1, horaInicio: 'bad' } }) as any, resp2);
      expect(resp2.status).toHaveBeenCalledWith(400);

      // Invalid horaFin
      const resp3 = createResponse();
      await createSchedule(createRequest({ params: { id: '1' }, body: { diaSemana: 1, horaInicio: '08:00', horaFin: 'bad' } }) as any, resp3);
      expect(resp3.status).toHaveBeenCalledWith(400);
    });

    it('rejects schedule with start time >= end time', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1, activo: true, userId: 10 });

      const response = createResponse();
      await createSchedule(
        createRequest({
          params: { id: '1' },
          body: { diaSemana: 1, horaInicio: '16:00', horaFin: '08:00' }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        error: 'horaInicio debe ser menor que horaFin'
      });
    });

    it('rejects adding schedules to an inactive doctor', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1, activo: false, userId: 10 });

      const response = createResponse();
      await createSchedule(
        createRequest({
          params: { id: '1' },
          body: { diaSemana: 1, horaInicio: '08:00', horaFin: '12:00' }
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
        { id: 10, medicoId: 1, diaSemana: 1, horaInicio: '08:00', horaFin: '12:00', activo: true }
      ]);

      const response = createResponse();
      await createSchedule(
        createRequest({
          params: { id: '1' },
          body: { diaSemana: 1, horaInicio: '11:00', horaFin: '14:00' }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(409);
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
          body: { diaSemana: 1, horaInicio: '08:00', horaFin: '12:00' }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(201);
    });

    it('handles 500 error in createSchedule', async () => {
      mockPrisma.medico.findUnique.mockRejectedValue(new Error('Schedule creation crashed'));
      const response = createResponse();
      await createSchedule(createRequest({ params: { id: '1' } }) as any, response);
      expect(response.status).toHaveBeenCalledWith(500);
    });

    it('validates getSchedulesByDoctor', async () => {
      const resp1 = createResponse();
      await getSchedulesByDoctor(createRequest({ params: { id: 'bad' } }) as any, resp1);
      expect(resp1.status).toHaveBeenCalledWith(400);

      mockPrisma.medico.findUnique.mockResolvedValue(null);
      const resp2 = createResponse();
      await getSchedulesByDoctor(createRequest({ params: { id: '1' } }) as any, resp2);
      expect(resp2.status).toHaveBeenCalledWith(404);

      mockPrisma.medico.findUnique.mockRejectedValue(new Error('Get schedule error'));
      const resp3 = createResponse();
      await getSchedulesByDoctor(createRequest({ params: { id: '1' } }) as any, resp3);
      expect(resp3.status).toHaveBeenCalledWith(500);
    });

    it('returns active schedules for a doctor', async () => {
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.horarioAtencion.findMany.mockResolvedValue([
        { id: 1, medicoId: 1, diaSemana: 1, horaInicio: '08:00', horaFin: '12:00', activo: true, createdAt: new Date() }
      ]);

      const response = createResponse();
      await getSchedulesByDoctor(createRequest({ params: { id: '1' } }) as any, response);

      expect(response.status).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith([
        expect.objectContaining({ id: 1, horaInicio: '08:00' })
      ]);
    });

    it('validates updateSchedule: invalid id, not found schedule or doctor', async () => {
      const resp1 = createResponse();
      await updateSchedule(createRequest({ params: { id: 'bad' } }) as any, resp1);
      expect(resp1.status).toHaveBeenCalledWith(400);

      mockPrisma.horarioAtencion.findUnique.mockResolvedValue(null);
      const resp2 = createResponse();
      await updateSchedule(createRequest({ params: { id: '10' } }) as any, resp2);
      expect(resp2.status).toHaveBeenCalledWith(404);

      mockPrisma.horarioAtencion.findUnique.mockResolvedValue({ id: 10, medicoId: 5 });
      mockPrisma.medico.findUnique.mockResolvedValue(null);
      const resp3 = createResponse();
      await updateSchedule(createRequest({ params: { id: '10' } }) as any, resp3);
      expect(resp3.status).toHaveBeenCalledWith(404);
    });

    it('rejects updateSchedule if role is medico and userId does not match', async () => {
      mockPrisma.horarioAtencion.findUnique.mockResolvedValue({ id: 10, medicoId: 5 });
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 5, userId: 10 });

      const response = createResponse();
      await updateSchedule(
        createRequest({
          params: { id: '10' },
          user: { userId: 999, role: 'medico' }
        }) as any,
        response
      );

      expect(response.status).toHaveBeenCalledWith(403);
    });

    it('validates updateSchedule inputs (day, hours, inactive doctor, conflict)', async () => {
      mockPrisma.horarioAtencion.findUnique.mockResolvedValue({ id: 10, medicoId: 5, diaSemana: 1, horaInicio: '08:00', horaFin: '12:00', activo: true });
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 5, userId: 10, activo: true });

      // Invalid day
      const resp1 = createResponse();
      await updateSchedule(createRequest({ params: { id: '10' }, body: { diaSemana: 99 } }) as any, resp1);
      expect(resp1.status).toHaveBeenCalledWith(400);

      // Invalid start format
      const resp2 = createResponse();
      await updateSchedule(createRequest({ params: { id: '10' }, body: { horaInicio: 'invalid' } }) as any, resp2);
      expect(resp2.status).toHaveBeenCalledWith(400);

      // Invalid end format
      const resp3 = createResponse();
      await updateSchedule(createRequest({ params: { id: '10' }, body: { horaFin: 'invalid' } }) as any, resp3);
      expect(resp3.status).toHaveBeenCalledWith(400);

      // Start >= End
      const resp4 = createResponse();
      await updateSchedule(createRequest({ params: { id: '10' }, body: { horaInicio: '15:00', horaFin: '10:00' } }) as any, resp4);
      expect(resp4.status).toHaveBeenCalledWith(400);

      // Reactivating schedule for inactive doctor
      mockPrisma.medico.findUnique.mockResolvedValueOnce({ id: 5, userId: 10, activo: false });
      const resp5 = createResponse();
      await updateSchedule(createRequest({ params: { id: '10' }, body: { activo: true } }) as any, resp5);
      expect(resp5.status).toHaveBeenCalledWith(400);

      // Overlap conflict
      mockPrisma.medico.findUnique.mockResolvedValueOnce({ id: 5, userId: 10, activo: true });
      mockPrisma.horarioAtencion.findMany.mockResolvedValueOnce([
        { id: 99, medicoId: 5, diaSemana: 1, horaInicio: '08:00', horaFin: '12:00', activo: true }
      ]);
      const resp6 = createResponse();
      await updateSchedule(createRequest({ params: { id: '10' }, body: { diaSemana: 1, horaInicio: '09:00', horaFin: '11:00', activo: true } }) as any, resp6);
      expect(resp6.status).toHaveBeenCalledWith(409);
    });

    it('updates schedule successfully with status 200', async () => {
      mockPrisma.horarioAtencion.findUnique.mockResolvedValue({ id: 20, medicoId: 1, diaSemana: 1, horaInicio: '08:00', horaFin: '12:00', activo: true });
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1, userId: 10, activo: true });
      mockPrisma.horarioAtencion.findMany.mockResolvedValue([]);
      mockPrisma.horarioAtencion.update.mockResolvedValue({ id: 20, medicoId: 1, diaSemana: 2, horaInicio: '09:00', horaFin: '13:00', activo: true });

      const response = createResponse();
      await updateSchedule(createRequest({ params: { id: '20' }, body: { diaSemana: 2, horaInicio: '09:00', horaFin: '13:00' } }) as any, response);

      expect(response.status).not.toHaveBeenCalled();
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Horario actualizado exitosamente' }));
    });

    it('handles 500 error in updateSchedule', async () => {
      mockPrisma.horarioAtencion.findUnique.mockRejectedValue(new Error('Update schedule error'));
      const response = createResponse();
      await updateSchedule(createRequest({ params: { id: '20' } }) as any, response);
      expect(response.status).toHaveBeenCalledWith(500);
    });

    it('validates deleteSchedule: invalid id, not found, permission, error and success', async () => {
      // Invalid ID
      const resp1 = createResponse();
      await deleteSchedule(createRequest({ params: { id: 'bad' } }) as any, resp1);
      expect(resp1.status).toHaveBeenCalledWith(400);

      // Not found schedule
      mockPrisma.horarioAtencion.findUnique.mockResolvedValue(null);
      const resp2 = createResponse();
      await deleteSchedule(createRequest({ params: { id: '20' } }) as any, resp2);
      expect(resp2.status).toHaveBeenCalledWith(404);

      // Not found doctor
      mockPrisma.horarioAtencion.findUnique.mockResolvedValue({ id: 20, medicoId: 1 });
      mockPrisma.medico.findUnique.mockResolvedValue(null);
      const resp3 = createResponse();
      await deleteSchedule(createRequest({ params: { id: '20' } }) as any, resp3);
      expect(resp3.status).toHaveBeenCalledWith(404);

      // Permission error
      mockPrisma.horarioAtencion.findUnique.mockResolvedValue({ id: 20, medicoId: 1 });
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1, userId: 10 });
      const resp4 = createResponse();
      await deleteSchedule(createRequest({ params: { id: '20' }, user: { userId: 999, role: 'medico' } }) as any, resp4);
      expect(resp4.status).toHaveBeenCalledWith(403);

      // 500 error
      mockPrisma.horarioAtencion.findUnique.mockRejectedValue(new Error('Delete schedule error'));
      const resp5 = createResponse();
      await deleteSchedule(createRequest({ params: { id: '20' } }) as any, resp5);
      expect(resp5.status).toHaveBeenCalledWith(500);

      // Success
      mockPrisma.horarioAtencion.findUnique.mockResolvedValue({ id: 20, medicoId: 1, activo: true });
      mockPrisma.medico.findUnique.mockResolvedValue({ id: 1, userId: 10 });
      mockPrisma.horarioAtencion.update.mockResolvedValue({ id: 20, activo: false });
      const resp6 = createResponse();
      await deleteSchedule(createRequest({ params: { id: '20' } }) as any, resp6);
      expect(resp6.status).not.toHaveBeenCalled();
      expect(resp6.json).toHaveBeenCalledWith({ message: 'Horario desactivado exitosamente', id: 20 });
    });
  });
});
