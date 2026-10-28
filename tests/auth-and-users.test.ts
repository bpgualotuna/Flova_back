import http from 'http';
import express from 'express';
import dotenv from 'dotenv';

process.env.NODE_ENV = 'test';
dotenv.config();

process.env.INTERNAL_API_KEY = 'flova_secret_internal_key_2026';
process.env.JWT_SECRET = 'test_secret_key_12345';
process.env.JWT_EXPIRES_IN = '1h';

const mockDb = {
  users: [] as any[],
  blacklistedTokens: [] as any[]
};

let nextUserId = 1;
let nextBlacklistId = 1;

const dbApp = express();
dbApp.use(express.json());

dbApp.post('/db/query', (req, res) => {
  const { model, operation, args } = req.body;

  if (model === 'user') {
    if (operation === 'findUnique' || operation === 'findFirst') {
      const where = args?.where || {};
      const user = mockDb.users.find(u => {
        if (where.id !== undefined && u.id === where.id) return true;
        if (where.cedula !== undefined && u.cedula === where.cedula) return true;
        if (where.username !== undefined && u.username === where.username) return true;
        if (where.email !== undefined && u.email === where.email) return true;
        return false;
      });
      return res.json(user ? { ...user } : null);
    }

    if (operation === 'findMany') {
      const where = args?.where || {};
      const result = mockDb.users.filter(u => {
        if (where.role !== undefined && u.role !== where.role) return false;
        if (where.activo !== undefined && u.activo !== where.activo) return false;
        return true;
      });
      return res.json(result.map(u => ({ ...u })));
    }

    if (operation === 'create') {
      const data = args?.data || {};
      const newUser = {
        id: nextUserId++,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        medico: null,
        citas: [],
        ...data
      };
      mockDb.users.push(newUser);
      return res.status(201).json({ ...newUser });
    }

    if (operation === 'update') {
      const where = args?.where || {};
      const index = mockDb.users.findIndex(u => u.id === where.id);
      if (index === -1) {
        return res.status(404).json({ error: 'Record to update not found.' });
      }
      mockDb.users[index] = {
        ...mockDb.users[index],
        ...args.data,
        updatedAt: new Date().toISOString()
      };
      return res.json({ ...mockDb.users[index] });
    }

    if (operation === 'delete') {
      const where = args?.where || {};
      const index = mockDb.users.findIndex(u => u.id === where.id);
      if (index === -1) {
        return res.status(404).json({ error: 'Record to delete not found.' });
      }
      const deleted = mockDb.users.splice(index, 1)[0];
      return res.json(deleted);
    }
  }

  if (model === 'blacklistedToken') {
    if (operation === 'create') {
      const data = args?.data || {};
      const item = {
        id: nextBlacklistId++,
        createdAt: new Date().toISOString(),
        ...data
      };
      mockDb.blacklistedTokens.push(item);
      return res.status(201).json(item);
    }

    if (operation === 'findUnique') {
      const where = args?.where || {};
      const found = mockDb.blacklistedTokens.find(t => t.token === where.token);
      return res.json(found || null);
    }
  }

  return res.status(400).json({ error: `Unsupported model/operation: ${model}.${operation}` });
});

let dbServer: http.Server;
let appServer: http.Server;
let baseUrl = '';

async function request(endpoint: string, options: any = {}) {
  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body: any = await res.json().catch(() => null);
  return { status: res.status, body };
}

describe('Flova Authentication and User Management Module (Brayan Plan)', () => {
  let patient1Id: number;
  let adminId: number;
  let patientToken: string;
  let adminToken: string;
  let activePatientToken: string;

  beforeAll(async () => {
    await new Promise<void>(resolve => {
      dbServer = dbApp.listen(0, () => {
        const dbPort = (dbServer.address() as any).port;
        process.env.DB_SERVICE_URL = `http://localhost:${dbPort}`;
        resolve();
      });
    });

    const app = (await import('../src/index')).default;
    await new Promise<void>(resolve => {
      appServer = app.listen(0, () => {
        const appPort = (appServer.address() as any).port;
        baseUrl = `http://localhost:${appPort}/api`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (appServer && appServer.close) {
      await new Promise<void>(resolve => appServer.close(() => resolve()));
    }
    if (dbServer && dbServer.close) {
      await new Promise<void>((resolve, reject) => {
        dbServer.close(err => (err ? reject(err) : resolve()));
      });
    }
  });

  describe('1. Error 400 - Registration Validations', () => {
    it('returns 400 on missing required fields', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName: 'John Missing' })
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing required fields');
    });

    it('returns 400 on invalid Ecuadorian ID checksum/province', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          cedula: '9999999999',
          fullName: 'Invalid Cedula',
          tipoSeguro: 'iess',
          password: 'password123'
        })
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid Ecuadorian national ID');
    });

    it('returns 400 on password shorter than 6 characters', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          cedula: '1726543216',
          fullName: 'Short Password',
          tipoSeguro: 'iess',
          password: '123'
        })
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Password must be at least 6 characters long');
    });

    it('returns 400 on invalid email format', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          cedula: '1726543216',
          fullName: 'Invalid Email',
          email: 'not-an-email',
          tipoSeguro: 'iess',
          password: 'password123'
        })
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid email format');
    });

    it('returns 400 on invalid user role', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          cedula: '1726543216',
          fullName: 'Invalid Role',
          role: 'superman',
          tipoSeguro: 'iess',
          password: 'password123'
        })
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid role. Valid roles are: admin, medico, paciente');
    });
  });

  describe('2. Registration (201 Created) and Password Masking', () => {
    it('registers a patient successfully without returning password', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          cedula: '1726543216',
          fullName: 'Brayan Paciente',
          email: 'brayan.paciente@flova.com',
          telefono: '0987654321',
          tipoSeguro: 'iess',
          password: 'password123'
        })
      });
      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.role).toBe('paciente');
      expect(res.body.user.cedula).toBe('1726543216');
      expect(res.body.user.activo).toBe(true);
      patient1Id = res.body.user.id;
    });

    it('registers an administrator successfully', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          cedula: '1234567890',
          fullName: 'Admin User',
          email: 'admin@flova.com',
          tipoSeguro: 'privado',
          password: 'adminPassword123',
          role: 'admin'
        })
      });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('admin');
      adminId = res.body.user.id;
    });
  });

  describe('3. Error 409 - Conflict on Duplicate Records', () => {
    it('returns 409 on duplicate cedula registration', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          cedula: '1726543216',
          fullName: 'Duplicate Cedula',
          email: 'other@flova.com',
          tipoSeguro: 'iess',
          password: 'password123'
        })
      });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('A user with this national ID already exists');
    });

    it('returns 409 on duplicate email registration', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          cedula: '1111111111',
          fullName: 'Duplicate Email',
          email: 'brayan.paciente@flova.com',
          tipoSeguro: 'iess',
          password: 'password123'
        })
      });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('A user with this email already exists');
    });
  });

  describe('4. Login Scenarios (400, 404, 401, 200)', () => {
    it('returns 400 when login password is missing', async () => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cedula: '1726543216' })
      });
      expect(res.status).toBe(400);
    });

    it('returns 404 when user does not exist', async () => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cedula: '2222222222', password: 'password123' })
      });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('returns 401 when password is incorrect', async () => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cedula: '1726543216', password: 'wrongPassword' })
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Incorrect password');
    });

    it('returns 200 and JWT on valid patient login without exposing password', async () => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cedula: '1726543216', password: 'password123' })
      });
      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user.password).toBeUndefined();
      patientToken = res.body.token;
    });

    it('returns 200 on valid admin login', async () => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cedula: '1234567890', password: 'adminPassword123' })
      });
      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe('string');
      adminToken = res.body.token;
    });
  });

  describe('5. Profile /api/auth/me and Token Validation', () => {
    it('returns 401 when token is missing', async () => {
      const res = await request('/auth/me', { method: 'GET' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Token not provided');
    });

    it('returns 401 when token is invalid', async () => {
      const res = await request('/auth/me', {
        method: 'GET',
        headers: { Authorization: 'Bearer this.is.invalid' }
      });
      expect(res.status).toBe(401);
    });

    it('returns 200 with user profile on valid token', async () => {
      const res = await request('/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(patient1Id);
      expect(res.body.password).toBeUndefined();
    });
  });

  describe('6. Logout and Token Revocation (401)', () => {
    it('returns 200 on logout and revokes the token', async () => {
      const res = await request('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Session closed successfully');
    });

    it('returns 401 when using a revoked token', async () => {
      const res = await request('/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Token has been revoked');
    });

    it('allows user to login again and receive a new valid token', async () => {
      const freshLogin = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cedula: '1726543216', password: 'password123' })
      });
      expect(freshLogin.status).toBe(200);
      activePatientToken = freshLogin.body.token;
      expect(activePatientToken).not.toBe(patientToken);
    });
  });

  describe('7. User Management Access Controls (403, 200)', () => {
    it('returns 403 when non-admin attempts to list users', async () => {
      const res = await request('/users', {
        method: 'GET',
        headers: { Authorization: `Bearer ${activePatientToken}` }
      });
      expect(res.status).toBe(403);
    });

    it('returns 200 when admin lists users', async () => {
      const res = await request('/users', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('allows patient to view their own profile', async () => {
      const res = await request(`/users/${patient1Id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${activePatientToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(patient1Id);
    });

    it('returns 403 when patient attempts to view another user profile', async () => {
      const res = await request(`/users/${adminId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${activePatientToken}` }
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('You do not have permission to view this user');
    });

    it('allows admin to view any user profile', async () => {
      const res = await request(`/users/${patient1Id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(patient1Id);
    });

    it('returns 400 when user ID parameter is non-numeric', async () => {
      const res = await request('/users/invalid-id', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid user ID');
    });

    it('returns 404 when user ID does not exist', async () => {
      const res = await request('/users/99999', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });
  });

  describe('8. User Updates & Ownership Guards', () => {
    it('returns 403 when patient attempts to modify another user', async () => {
      const res = await request(`/users/${adminId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${activePatientToken}` },
        body: JSON.stringify({ fullName: 'Unauthorized' })
      });
      expect(res.status).toBe(403);
    });

    it('returns 403 when non-admin attempts to change their role', async () => {
      const res = await request(`/users/${patient1Id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${activePatientToken}` },
        body: JSON.stringify({ role: 'admin' })
      });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Only administrators can change roles');
    });

    it('returns 400 when updating password with fewer than 6 characters', async () => {
      const res = await request(`/users/${patient1Id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${activePatientToken}` },
        body: JSON.stringify({ password: '123' })
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Password must be at least 6 characters long');
    });

    it('returns 400 on invalid email update', async () => {
      const res = await request(`/users/${patient1Id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${activePatientToken}` },
        body: JSON.stringify({ email: 'bad-email' })
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid email format');
    });

    it('returns 409 when updating email to an existing email', async () => {
      const res = await request(`/users/${patient1Id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${activePatientToken}` },
        body: JSON.stringify({ email: 'admin@flova.com' })
      });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('A user with this email already exists');
    });

    it('updates user profile successfully', async () => {
      const res = await request(`/users/${patient1Id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${activePatientToken}` },
        body: JSON.stringify({
          telefono: '0999999999',
          tipoSeguro: 'privado',
          fullName: 'Brayan Updated'
        })
      });
      expect(res.status).toBe(200);
      expect(res.body.user.phone).toBe('0999999999');
      expect(res.body.user.tipoSeguro).toBe('privado');
      expect(res.body.user.password).toBeUndefined();
    });
  });

  describe('9. User Deactivation and Access Blocking (Rule 6)', () => {
    it('returns 403 when non-admin attempts to delete/deactivate user', async () => {
      const res = await request(`/users/${patient1Id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${activePatientToken}` }
      });
      expect(res.status).toBe(403);
    });

    it('allows admin to deactivate user', async () => {
      const res = await request(`/users/${patient1Id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User deleted successfully');
    });

    it('returns 401 when deactivated user attempts to log in', async () => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cedula: '1726543216', password: 'password123' })
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('User account is deactivated');
    });

    it('returns 401 when deactivated user attempts to access protected endpoint with old token', async () => {
      const res = await request('/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${activePatientToken}` }
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('User account is deactivated');
    });
  });
});
