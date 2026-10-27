import http from 'http';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Ensure test port and test db service URL
const DB_PORT = 5005;
const APP_PORT = 4005;

process.env.PORT = String(APP_PORT);
process.env.DB_SERVICE_URL = `http://localhost:${DB_PORT}`;
process.env.INTERNAL_API_KEY = 'flova_secret_internal_key_2026';
process.env.JWT_SECRET = 'test_secret_key_12345';
process.env.JWT_EXPIRES_IN = '1h';

// Mock DB Persistence Server
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
      let result = mockDb.users.filter(u => {
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

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE AUTH & USERS TEST SUITE ---');

  // 1. Start mock DB persistence service
  await new Promise<void>(resolve => {
    dbServer = dbApp.listen(DB_PORT, () => {
      console.log(`[TEST] Mock DB server running on port ${DB_PORT}`);
      resolve();
    });
  });

  // Importing src/index starts the server on process.env.PORT (4005)
  await import('../src/index');

  // Wait a brief tick for server startup
  await new Promise(r => setTimeout(r, 300));

  const baseUrl = `http://localhost:${APP_PORT}/api`;
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details: string = '') {
    totalTests++;
    if (condition) {
      console.log(`  PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  FAIL: ${testName} - ${details}`);
      process.exitCode = 1;
    }
  }

  // Helper for requests
  async function request(endpoint: string, options: any = {}) {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }

  try {
    // ----------------------------------------------------
    // TEST 1: ERROR 400 - REGISTRATION VALIDATIONS
    // ----------------------------------------------------
    console.log('\n--- Test Group 1: 400 Bad Request on Register ---');
    
    // 1.1 Missing required fields
    let res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName: 'John Missing' })
    });
    assert(res.status === 400, '400 on missing required fields', JSON.stringify(res.body));

    // 1.2 Invalid Ecuadorian ID
    res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        cedula: '9999999999',
        fullName: 'Invalid Cedula',
        tipoSeguro: 'iess',
        password: 'password123'
      })
    });
    assert(res.status === 400, '400 on invalid Ecuadorian ID checksum/province', JSON.stringify(res.body));

    // 1.3 Password too short (< 6 chars)
    res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        cedula: '1726543210',
        fullName: 'Short Password',
        tipoSeguro: 'iess',
        password: '123'
      })
    });
    assert(res.status === 400, '400 on password shorter than 6 chars', JSON.stringify(res.body));

    // 1.4 Invalid email format
    res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        cedula: '1726543210',
        fullName: 'Invalid Email',
        email: 'not-an-email',
        tipoSeguro: 'iess',
        password: 'password123'
      })
    });
    assert(res.status === 400, '400 on invalid email format', JSON.stringify(res.body));

    // 1.5 Invalid role provided
    res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        cedula: '1726543210',
        fullName: 'Invalid Role',
        role: 'superman',
        tipoSeguro: 'iess',
        password: 'password123'
      })
    });
    assert(res.status === 400, '400 on invalid role', JSON.stringify(res.body));

    // ----------------------------------------------------
    // TEST 2: SUCCESSFUL REGISTRATION (201 Created)
    // ----------------------------------------------------
    console.log('\n--- Test Group 2: Successful Registration & Password Masking ---');
    
    // Register Patient 1
    res = await request('/auth/register', {
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
    assert(res.status === 201, '201 on valid patient registration', JSON.stringify(res.body));
    assert(res.body.user && res.body.user.password === undefined, 'Password is NEVER returned in response');
    assert(res.body.user.role === 'paciente', 'Default role is paciente');
    const patient1Id = res.body.user.id;

    // Register Admin
    res = await request('/auth/register', {
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
    assert(res.status === 201, '201 on admin registration', JSON.stringify(res.body));
    const adminId = res.body.user.id;

    // ----------------------------------------------------
    // TEST 3: ERROR 409 - CONFLICT ON UNIQUE CONSTRAINTS
    // ----------------------------------------------------
    console.log('\n--- Test Group 3: 409 Conflict on Duplicate Fields ---');

    // 3.1 Duplicate cedula
    res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        cedula: '1726543216',
        fullName: 'Duplicate Cedula',
        email: 'other@flova.com',
        tipoSeguro: 'iess',
        password: 'password123'
      })
    });
    assert(res.status === 409, '409 on duplicate cedula', JSON.stringify(res.body));

    // 3.2 Duplicate email
    res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        cedula: '1111111111',
        fullName: 'Duplicate Email',
        email: 'brayan.paciente@flova.com',
        tipoSeguro: 'iess',
        password: 'password123'
      })
    });
    assert(res.status === 409, '409 on duplicate email', JSON.stringify(res.body));

    // ----------------------------------------------------
    // TEST 4: LOGIN & ERROR CODES (400, 404, 401)
    // ----------------------------------------------------
    console.log('\n--- Test Group 4: Login Scenarios (400, 404, 401, 200) ---');

    // 4.1 Missing credentials
    res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cedula: '1726543216' })
    });
    assert(res.status === 400, '400 on missing login password', JSON.stringify(res.body));

    // 4.2 User not found
    res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cedula: '2222222222', password: 'password123' })
    });
    assert(res.status === 404, '404 on non-existent user', JSON.stringify(res.body));

    // 4.3 Incorrect password
    res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cedula: '1726543216', password: 'wrongPassword' })
    });
    assert(res.status === 401, '401 on incorrect password', JSON.stringify(res.body));

    // 4.4 Successful patient login
    res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cedula: '1726543216', password: 'password123' })
    });
    assert(res.status === 200, '200 on valid patient login', JSON.stringify(res.body));
    assert(res.body.token && typeof res.body.token === 'string', 'JWT token is returned on login');
    assert(res.body.user && res.body.user.password === undefined, 'Login response masks password');
    const patientToken = res.body.token;

    // 4.5 Successful admin login
    res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cedula: '1234567890', password: 'adminPassword123' })
    });
    assert(res.status === 200, '200 on valid admin login', JSON.stringify(res.body));
    const adminToken = res.body.token;

    // ----------------------------------------------------
    // TEST 5: GET /me AND TOKEN VALIDATIONS (401, 200)
    // ----------------------------------------------------
    console.log('\n--- Test Group 5: /api/auth/me and Token Validation ---');

    // 5.1 No token provided
    res = await request('/auth/me', { method: 'GET' });
    assert(res.status === 401, '401 when token is missing', JSON.stringify(res.body));

    // 5.2 Invalid token
    res = await request('/auth/me', {
      method: 'GET',
      headers: { Authorization: 'Bearer this.is.an.invalid.token' }
    });
    assert(res.status === 401, '401 when token is invalid', JSON.stringify(res.body));

    // 5.3 Valid patient token
    res = await request('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert(res.status === 200, '200 on /auth/me with valid token', JSON.stringify(res.body));
    assert(res.body.id === patient1Id, 'Profile belongs to current authenticated user');
    assert(res.body.password === undefined, 'Profile does not leak password');

    // ----------------------------------------------------
    // TEST 6: LOGOUT AND TOKEN REVOCATION (401)
    // ----------------------------------------------------
    console.log('\n--- Test Group 6: Logout & Revoked Token (401) ---');

    // 6.1 Logout
    res = await request('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert(res.status === 200, '200 on /auth/logout', JSON.stringify(res.body));

    // 6.2 Accessing protected route with revoked token must fail with 401
    res = await request('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert(res.status === 401, '401 Unauthorized with revoked token', JSON.stringify(res.body));

    // Re-login to get fresh patient token for subsequent tests
    const freshLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cedula: '1726543216', password: 'password123' })
    });
    const activePatientToken = freshLogin.body.token;

    // ----------------------------------------------------
    // TEST 7: USER MANAGEMENT PERMISSIONS (403, 200)
    // ----------------------------------------------------
    console.log('\n--- Test Group 7: Role and Ownership Access Controls (403, 200) ---');

    // 7.1 Patient trying to list all users -> 403 Forbidden
    res = await request('/users', {
      method: 'GET',
      headers: { Authorization: `Bearer ${activePatientToken}` }
    });
    assert(res.status === 403, '403 when non-admin lists users', JSON.stringify(res.body));

    // 7.2 Admin listing all users -> 200 OK
    res = await request('/users', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 200, '200 when admin lists users', JSON.stringify(res.body));
    assert(Array.isArray(res.body) && res.body.length >= 2, 'Admin receives user list');

    // 7.3 Patient viewing their own profile -> 200 OK
    res = await request(`/users/${patient1Id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${activePatientToken}` }
    });
    assert(res.status === 200, '200 when patient views their own profile', JSON.stringify(res.body));

    // 7.4 Patient viewing someone else profile -> 403 Forbidden
    res = await request(`/users/${adminId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${activePatientToken}` }
    });
    assert(res.status === 403, '403 when patient views another user profile', JSON.stringify(res.body));

    // 7.5 Admin viewing patient profile -> 200 OK
    res = await request(`/users/${patient1Id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 200, '200 when admin views patient profile', JSON.stringify(res.body));

    // 7.6 Invalid ID param (e.g. /users/abc) -> 400 Bad Request
    res = await request('/users/invalid-id', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 400, '400 on non-numeric user ID', JSON.stringify(res.body));

    // 7.7 Non-existent user -> 404 Not Found
    res = await request('/users/99999', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 404, '404 when user ID does not exist', JSON.stringify(res.body));

    // ----------------------------------------------------
    // TEST 8: UPDATE USER (403, 400, 409, 200)
    // ----------------------------------------------------
    console.log('\n--- Test Group 8: Update User Validations & Guards ---');

    // 8.1 Patient attempting to modify another user -> 403 Forbidden
    res = await request(`/users/${adminId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${activePatientToken}` },
      body: JSON.stringify({ fullName: 'Hacker Attempt' })
    });
    assert(res.status === 403, '403 when patient attempts to modify another user', JSON.stringify(res.body));

    // 8.2 Patient attempting to promote themselves to admin -> 403 Forbidden
    res = await request(`/users/${patient1Id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${activePatientToken}` },
      body: JSON.stringify({ role: 'admin' })
    });
    assert(res.status === 403, '403 when non-admin attempts to change roles', JSON.stringify(res.body));

    // 8.3 Patient updating password with < 6 chars -> 400 Bad Request
    res = await request(`/users/${patient1Id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${activePatientToken}` },
      body: JSON.stringify({ password: '123' })
    });
    assert(res.status === 400, '400 when updating password with < 6 chars', JSON.stringify(res.body));

    // 8.4 Patient updating with invalid email format -> 400 Bad Request
    res = await request(`/users/${patient1Id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${activePatientToken}` },
      body: JSON.stringify({ email: 'bad-email' })
    });
    assert(res.status === 400, '400 on invalid email update', JSON.stringify(res.body));

    // 8.5 Patient updating with email belonging to admin -> 409 Conflict
    res = await request(`/users/${patient1Id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${activePatientToken}` },
      body: JSON.stringify({ email: 'admin@flova.com' })
    });
    assert(res.status === 409, '409 when updating email to an existing email', JSON.stringify(res.body));

    // 8.6 Valid update of phone and insurance -> 200 OK
    res = await request(`/users/${patient1Id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${activePatientToken}` },
      body: JSON.stringify({
        telefono: '0999999999',
        tipoSeguro: 'privado',
        fullName: 'Brayan Updated'
      })
    });
    assert(res.status === 200, '200 on valid user update', JSON.stringify(res.body));
    assert(res.body.user.phone === '0999999999', 'Phone was successfully updated');
    assert(res.body.user.tipoSeguro === 'privado', 'Insurance was successfully updated');
    assert(res.body.user.password === undefined, 'Updated user response does not contain password');

    // ----------------------------------------------------
    // TEST 9: DEACTIVATE / DELETE USER AND DEACTIVATED CHECKS
    // ----------------------------------------------------
    console.log('\n--- Test Group 9: User Deactivation and Access Blocking (Rule 6) ---');

    // 9.1 Patient trying to delete a user -> 403 Forbidden
    res = await request(`/users/${patient1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${activePatientToken}` }
    });
    assert(res.status === 403, '403 when non-admin tries to delete/deactivate user', JSON.stringify(res.body));

    // 9.2 Admin deactivates patient
    res = await request(`/users/${patient1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 200, '200 when admin deactivates user', JSON.stringify(res.body));

    // 9.3 Deactivated user cannot authenticate (login) -> 401 Unauthorized
    res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cedula: '1726543216', password: 'password123' })
    });
    assert(res.status === 401, '401 when deactivated user attempts to log in', JSON.stringify(res.body));

    // 9.4 Deactivated user cannot execute operations with existing token -> 401 Unauthorized
    res = await request('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${activePatientToken}` }
    });
    assert(res.status === 401, '401 when deactivated user accesses protected endpoint with token', JSON.stringify(res.body));

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED!`);
    console.log(`========================================\n`);

  } finally {
    if (dbServer) dbServer.close();
    process.exit(process.exitCode || 0);
  }
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
