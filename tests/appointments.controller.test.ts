import {
  cancelAppointment,
  createAppointment,
  getAvailableSchedules,
  getAppointmentById,
  updateAppointment
} from '../src/controllers/appointments.controller';

jest.mock('../src/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn()
    },
    medico: {
      findUnique: jest.fn()
    },
    terapia: {
      findUnique: jest.fn()
    },
    horarioAtencion: {
      findFirst: jest.fn(),
      findMany: jest.fn()
    },
    cita: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
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
  user: { userId: 10, role: 'paciente' },
  ...overrides
});

describe('appointments controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns available half-hour schedules and marks booked slots', async () => {
    mockPrisma.medico.findUnique.mockResolvedValue({ id: 2, activo: true });
    mockPrisma.horarioAtencion.findMany.mockResolvedValue([
      {
        horaInicio: '08:00',
        horaFin: '10:00'
      }
    ]);
    mockPrisma.cita.findMany.mockResolvedValue([{ hora: '08:30' }]);

    const response = createResponse();
    await getAvailableSchedules(
      createRequest({ query: { medicoId: '2', fecha: '2099-05-04' } }) as any,
      response
    );

    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith([
      { fecha: '2099-05-04', hora: '08:00', disponible: true, medicoId: 2 },
      { fecha: '2099-05-04', hora: '08:30', disponible: false, medicoId: 2 },
      { fecha: '2099-05-04', hora: '09:00', disponible: true, medicoId: 2 },
      { fecha: '2099-05-04', hora: '09:30', disponible: true, medicoId: 2 }
    ]);
  });

  it('rejects a new appointment outside the doctor schedule', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 10, activo: true });
    mockPrisma.medico.findUnique.mockResolvedValue({
      id: 2,
      activo: true,
      user: { activo: true }
    });
    mockPrisma.terapia.findUnique.mockResolvedValue({ id: 3, activa: true });
    mockPrisma.horarioAtencion.findFirst.mockResolvedValue(null);

    const response = createResponse();
    await createAppointment(
      createRequest({
        body: {
          medicoId: 2,
          terapiaId: 3,
          fecha: '2099-05-04',
          hora: '18:00',
          sintomas: 'Dolor persistente en la espalda'
        }
      }) as any,
      response
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: 'The selected time is outside the doctor schedule'
    });
    expect(mockPrisma.cita.create).not.toHaveBeenCalled();
  });

  it('creates an appointment with the real schema field names', async () => {
    const appointment = {
      id: 20,
      pacienteId: 10,
      medicoId: 2,
      terapiaId: 3,
      fecha: new Date('2099-05-04T00:00:00.000Z'),
      hora: '09:00',
      estado: 'pendiente',
      sintomas: 'Dolor persistente en la espalda',
      tieneExamenes: false,
      examenes: [],
      motivoCancelacion: null,
      notasMedico: null,
      paciente: null,
      medico: null,
      terapia: null
    };

    mockPrisma.user.findUnique.mockResolvedValue({ id: 10, activo: true });
    mockPrisma.medico.findUnique.mockResolvedValue({
      id: 2,
      activo: true,
      user: { activo: true }
    });
    mockPrisma.terapia.findUnique.mockResolvedValue({ id: 3, activa: true });
    mockPrisma.horarioAtencion.findFirst.mockResolvedValue({
      horaInicio: '08:00',
      horaFin: '12:00'
    });
    mockPrisma.cita.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockPrisma.cita.create.mockResolvedValue(appointment);

    const response = createResponse();
    await createAppointment(
      createRequest({
        body: {
          medicoId: 2,
          terapiaId: 3,
          fecha: '2099-05-04',
          hora: '09:00',
          sintomas: 'Dolor persistente en la espalda'
        }
      }) as any,
      response
    );

    expect(response.status).toHaveBeenCalledWith(201);
    expect(mockPrisma.cita.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pacienteId: 10,
          medicoId: 2,
          terapiaId: 3,
          estado: 'pendiente',
          fecha: new Date('2099-05-04T00:00:00.000Z')
        })
      })
    );
  });

  it('rejects a duplicate doctor schedule', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 10, activo: true });
    mockPrisma.medico.findUnique.mockResolvedValue({
      id: 2,
      activo: true,
      user: { activo: true }
    });
    mockPrisma.terapia.findUnique.mockResolvedValue({ id: 3, activa: true });
    mockPrisma.horarioAtencion.findFirst.mockResolvedValue({
      horaInicio: '08:00',
      horaFin: '12:00'
    });
    mockPrisma.cita.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 19 });

    const response = createResponse();
    await createAppointment(
      createRequest({
        body: {
          medicoId: 2,
          terapiaId: 3,
          fecha: '2099-05-04',
          hora: '09:00',
          sintomas: 'Dolor persistente en la espalda'
        }
      }) as any,
      response
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      error: 'This schedule is already occupied'
    });
  });

  it('allows only the appointment owner, assigned doctor, or admin to view it', async () => {
    const appointment = { id: 20, pacienteId: 10, medicoId: 2 };
    mockPrisma.cita.findUnique.mockResolvedValue(appointment);

    const response = createResponse();
    await getAppointmentById(
      createRequest({ params: { id: '20' }, user: { userId: 11, role: 'paciente' } }) as any,
      response
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(mockPrisma.medico.findUnique).not.toHaveBeenCalled();
  });

  it('does not allow cancelling a completed appointment', async () => {
    mockPrisma.cita.findUnique.mockResolvedValue({
      id: 20,
      pacienteId: 10,
      estado: 'completada'
    });

    const response = createResponse();
    await cancelAppointment(
      createRequest({
        params: { id: '20' },
        body: { motivo: 'Ya no necesito la cita' }
      }) as any,
      response
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: 'This appointment cannot be cancelled'
    });
  });

  it('rejects invalid appointment states during updates', async () => {
    const response = createResponse();
    await updateAppointment(
      createRequest({
        params: { id: '20' },
        body: { estado: 'estado-invalido' }
      }) as any,
      response
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Invalid appointment status'
    });
    expect(mockPrisma.cita.findUnique).not.toHaveBeenCalled();
  });
});
