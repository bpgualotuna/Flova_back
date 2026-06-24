# 🏥 Complete Endpoint Collection - 2-Backend Architecture (Logic + Persistence)

This document contains the complete specification of all endpoints for both servers, detailing authorization token (JWT) requirements, required user roles, request body formats, and expected JSON responses.

---

## 📌 GENERAL PARAMETERS AND CONFIGURATION

### Base URLs:
*   **Business Logic API / Public API (`Flova_back`):** `http://localhost:4000`
*   **Persistence Service / Internal API (`flova_db`):** `http://localhost:5001`

---

## 🗄️ 1. PERSISTENCE SERVICE ENDPOINTS (`flova_db` - Port 5001)

This server is for internal service consumption only and must not be exposed to the public.

### 1.1 Persistence Health Check
Verifies that the database service and PostgreSQL connection are active.
*   **Method:** `GET`
*   **URL:** `http://localhost:5001/health`
*   **Requires Token:** `NO` (Free internal access for monitoring)
*   **Expected Response (200 OK):**
    ```json
    {
      "status": "ok",
      "service": "Flova DB Persistence API",
      "database": "connected",
      "timestamp": "2026-06-24T10:05:16.835Z"
    }
    ```

---

### 1.2 Prisma DB Operations (Generic Query Proxy)
All database persistence queries are handled via `POST http://localhost:5001/db/query`.
*   **Method:** `POST`
*   **URL:** `http://localhost:5001/db/query`
*   **Requires Token:** `YES` (Internal secret key sent in the header `X-Internal-Key: flova_secret_internal_key_2026`)

#### 1.2.1 Search Multiple Records (`findMany`)
*   **Request Body (JSON):**
    ```json
    {
      "model": "therapy",
      "operation": "findMany",
      "args": {
        "where": { "active": true },
        "orderBy": { "name": "asc" }
      }
    }
    ```
*   **Expected Response (200 OK):**
    ```json
    [
      {
        "id": 13,
        "name": "Sports Physiotherapy",
        "description": "Specialized treatment for sports injuries...",
        "specialty": "Physiotherapy",
        "duration": 60,
        "price": "45.00",
        "image": "https://picsum.photos/seed/fisio1/400/300",
        "active": true,
        "createdAt": "2026-06-24T05:44:25.159Z",
        "updatedAt": "2026-06-24T05:44:25.159Z"
      }
    ]
    ```

#### 1.2.2 Search Unique Record (`findUnique`)
*   **Request Body (JSON):**
    ```json
    {
      "model": "user",
      "operation": "findUnique",
      "args": {
        "where": { "nationalId": "1234567890" },
        "include": { "doctor": true }
      }
    }
    ```
*   **Expected Response (200 OK):**
    ```json
    {
      "id": 18,
      "nationalId": "1234567890",
      "username": "1234567890",
      "fullName": "John Doe",
      "email": "john.doe@email.com",
      "phone": "0987654321",
      "insuranceType": "iess",
      "role": "paciente",
      "active": true,
      "createdAt": "2026-06-24T15:21:36.324Z",
      "updatedAt": "2026-06-24T04:17:24.377Z",
      "doctor": null
    }
    ```

#### 1.2.3 Create Record (`create`)
*   **Request Body (JSON):**
    ```json
    {
      "model": "therapy",
      "operation": "create",
      "args": {
        "data": {
          "name": "Decontracting Massage",
          "description": "Treatment focused on relieving muscle tension.",
          "specialty": "Physiotherapy",
          "duration": 45,
          "price": 35.00
        }
      }
    }
    ```
*   **Expected Response (200 OK):**
    ```json
    {
      "id": 20,
      "name": "Decontracting Massage",
      "description": "Treatment focused on relieving muscle tension.",
      "specialty": "Physiotherapy",
      "duration": 45,
      "price": "35.00",
      "active": true,
      "createdAt": "2026-06-24T10:00:00.000Z",
      "updatedAt": "2026-06-24T10:00:00.000Z"
    }
    ```

#### 1.2.4 Update Record (`update`)
*   **Request Body (JSON):**
    ```json
    {
      "model": "appointment",
      "operation": "update",
      "args": {
        "where": { "id": 25 },
        "data": {
          "status": "confirmed",
          "doctorNotes": "Patient is stable. Continue exercises."
        }
      }
    }
    ```
*   **Expected Response (200 OK):**
    ```json
    {
      "id": 25,
      "patientId": 18,
      "doctorId": 11,
      "therapyId": 17,
      "date": "2026-06-24T00:00:00.000Z",
      "time": "15:00",
      "status": "confirmed",
      "symptoms": "chronic stress",
      "hasExams": false,
      "exams": [],
      "cancellationReason": null,
      "doctorNotes": "Patient is stable. Continue exercises.",
      "createdAt": "2026-06-24T01:55:39.384Z",
      "updatedAt": "2026-06-24T10:10:00.000Z"
    }
    ```

#### 1.2.5 Delete Record (`delete`)
*   **Request Body (JSON):**
    ```json
    {
      "model": "therapy",
      "operation": "delete",
      "args": {
        "where": { "id": 20 }
      }
    }
    ```
*   **Expected Response (200 OK):**
    ```json
    {
      "id": 20,
      "name": "Decontracting Massage",
      "description": "Treatment focused on relieving muscle tension.",
      "specialty": "Physiotherapy",
      "duration": 45,
      "price": "35.00",
      "active": true
    }
    ```

---

## 🌐 2. PUBLIC API / BUSINESS LOGIC ENDPOINTS (`Flova_back` - Port 4000)

All these endpoints apply validation, run business rules, and are consumed by the frontend client.

---

### 2.1 Authentication & Accounts

#### 2.1.1 Health Check
*   **Method:** `GET`
*   **URL:** `http://localhost:4000/api/health`
*   **Requires Token:** `NO` (Public)
*   **Allowed Roles:** `Anyone` (Unauthenticated)
*   **Expected Response (200 OK):**
    ```json
    {
      "status": "ok",
      "message": "Flova Backend API - Medical Appointment Management System",
      "timestamp": "2026-06-24T10:05:16.940Z"
    }
    ```

#### 2.1.2 Patient Registration
*Aplies Ecuadorian ID format validation.*
*   **Method:** `POST`
*   **URL:** `http://localhost:4000/api/auth/register`
*   **Requires Token:** `NO` (Public)
*   **Allowed Roles:** `Anyone` (Unauthenticated)
*   **Request Body (JSON):**
    ```json
    {
      "nationalId": "1726543210",
      "fullName": "Pedro Sanchez Morales",
      "email": "pedro.sanchez@email.com",
      "phone": "0987654325",
      "insuranceType": "iess",
      "password": "password123"
    }
    ```
*   **Expected Response (201 Created):**
    ```json
    {
      "message": "User registered successfully",
      "user": {
        "id": 25,
        "nationalId": "1726543210",
        "fullName": "Pedro Sanchez Morales",
        "email": "pedro.sanchez@email.com",
        "phone": "0987654325",
        "insuranceType": "iess",
        "role": "paciente",
        "createdAt": "2026-06-24T05:30:00.000Z"
      }
    }
    ```

#### 2.1.3 User Login
*   **Method:** `POST`
*   **URL:** `http://localhost:4000/api/auth/login`
*   **Requires Token:** `NO` (Public)
*   **Allowed Roles:** `Anyone` (Unauthenticated)
*   **Request Body (JSON):**
    ```json
    {
      "nationalId": "1234567890",
      "password": "password123"
    }
    ```
*   **Expected Response (200 OK):**
    ```json
    {
      "message": "Login successful",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE4LCJuYXRpb25hbElkIjoiMTIzNDU2Nzg5MCIsInJvbGUiOiJwYWNpZW50ZSIsImZ1bGxOYW1lIjoiSm9obiBEb2UifQ.xxxx",
      "user": {
        "id": 18,
        "nationalId": "1234567890",
        "username": "1234567890",
        "fullName": "John Doe",
        "email": "john.doe@email.com",
        "phone": "0987654321",
        "insuranceType": "iess",
        "role": "paciente"
      }
    }
    ```

#### 2.1.4 Get Profile Info (`/me`)
*   **Method:** `GET`
*   **URL:** `http://localhost:4000/api/auth/me`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Anyone` (Authenticated Patient, Doctor, or Admin)
*   **Expected Response (200 OK):**
    ```json
    {
      "id": 18,
      "nationalId": "1234567890",
      "username": "1234567890",
      "fullName": "John Doe",
      "email": "john.doe@email.com",
      "phone": "0987654321",
      "insuranceType": "iess",
      "role": "paciente",
      "createdAt": "2026-06-24T15:21:36.324Z",
      "updatedAt": "2026-06-24T04:17:24.377Z",
      "doctor": null
    }
    ```

#### 2.1.5 Logout
*   **Method:** `POST`
*   **URL:** `http://localhost:4000/api/auth/logout`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Anyone` (Authenticated Patient, Doctor, or Admin)
*   **Expected Response (200 OK):**
    ```json
    {
      "message": "Session closed successfully",
      "timestamp": "2026-06-24T06:02:54.097Z"
    }
    ```

---

### 2.2 Therapies Module

#### 2.2.1 Get All Therapies
*   **Method:** `GET`
*   **URL:** `http://localhost:4000/api/therapies`
*   **Requires Token:** `NO` (Public)
*   **Allowed Roles:** `Anyone`
*   **Expected Response (200 OK):**
    ```json
    [
      {
        "id": 13,
        "name": "Sports Physiotherapy",
        "description": "Specialized treatment for sports injuries...",
        "specialty": "Physiotherapy",
        "duration": 60,
        "price": "45.00",
        "image": "https://picsum.photos/seed/fisio1/400/300",
        "active": true
      }
    ]
    ```

#### 2.2.2 Get Therapies by Specialty
*   **Method:** `GET`
*   **URL:** `http://localhost:4000/api/therapies?specialty=Physiotherapy`
*   **Requires Token:** `NO` (Public)
*   **Allowed Roles:** `Anyone`
*   **Expected Response (200 OK):** *(Lists matches only)*

#### 2.2.3 Get Therapy by ID
*   **Method:** `GET`
*   **URL:** `http://localhost:4000/api/therapies/13`
*   **Requires Token:** `NO` (Public)
*   **Allowed Roles:** `Anyone`
*   **Expected Response (200 OK):**
    ```json
    {
      "id": 13,
      "name": "Sports Physiotherapy",
      "description": "Specialized treatment for sports injuries...",
      "specialty": "Physiotherapy",
      "duration": 60,
      "price": "45.00",
      "image": "https://picsum.photos/seed/fisio1/400/300",
      "active": true
    }
    ```

#### 2.2.4 Create Therapy
*   **Method:** `POST`
*   **URL:** `http://localhost:4000/api/therapies`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Admin` (Other roles receive `403 Forbidden`)
*   **Request Body (JSON):**
    ```json
    {
      "name": "Decontracting Massage",
      "description": "Treatment focused on relieving muscle tension.",
      "specialty": "Physiotherapy",
      "duration": 45,
      "price": 35.00,
      "image": "https://picsum.photos/seed/descon/400/300"
    }
    ```
*   **Expected Response (201 Created):**
    ```json
    {
      "message": "Therapy created successfully",
      "therapy": {
        "id": 20,
        "name": "Decontracting Massage",
        "description": "Treatment focused on relieving muscle tension.",
        "specialty": "Physiotherapy",
        "duration": 45,
        "price": 35,
        "image": "https://picsum.photos/seed/descon/400/300",
        "active": true,
        "createdAt": "2026-06-24T06:00:00.000Z",
        "updatedAt": "2026-06-24T06:00:00.000Z"
      }
    }
    ```

#### 2.2.5 Update Therapy
*   **Method:** `PUT`
*   **URL:** `http://localhost:4000/api/therapies/13`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Admin`
*   **Request Body (JSON):**
    ```json
    {
      "price": 50.00
    }
    ```
*   **Expected Response (200 OK):**
    ```json
    {
      "message": "Therapy updated successfully",
      "therapy": {
        "id": 13,
        "name": "Sports Physiotherapy",
        "price": 50,
        "active": true
      }
    }
    ```

#### 2.2.6 Delete Therapy
*   **Method:** `DELETE`
*   **URL:** `http://localhost:4000/api/therapies/20`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Admin`
*   **Expected Response (200 OK):**
    ```json
    {
      "message": "Therapy deleted successfully"
    }
    ```

---

### 2.3 Doctors Module

#### 2.3.1 Get All Doctors
*   **Method:** `GET`
*   **URL:** `http://localhost:4000/api/doctors`
*   **Requires Token:** `NO` (Public)
*   **Allowed Roles:** `Anyone`
*   **Expected Response (200 OK):**
    ```json
    [
      {
        "id": 9,
        "userId": 21,
        "fullName": "Dr. Carlos Mendoza Silva",
        "nationalId": "1111111111",
        "email": "carlos.mendoza@flova.com",
        "phone": "0991111111",
        "specialty": "Physiotherapy",
        "licenseNumber": "MED-FIS-001",
        "rating": 4.8,
        "patientsServed": 245,
        "workSchedule": [
          { "dayOfWeek": 1, "startTime": "08:00", "endTime": "16:00" }
        ]
      }
    ]
    ```

#### 2.3.2 Get Doctor by ID
*   **Method:** `GET`
*   **URL:** `http://localhost:4000/api/doctors/9`
*   **Requires Token:** `NO` (Public)
*   **Allowed Roles:** `Anyone`
*   **Expected Response (200 OK):** *(Individual doctor payload details)*

#### 2.3.3 Get Doctors by Specialty
*   **Method:** `GET`
*   **URL:** `http://localhost:4000/api/doctors/specialty/Physiotherapy`
*   **Requires Token:** `NO` (Public)
*   **Allowed Roles:** `Anyone`
*   **Expected Response (200 OK):**
    ```json
    [
      {
        "id": 9,
        "fullName": "Dr. Carlos Mendoza Silva",
        "specialty": "Physiotherapy",
        "licenseNumber": "MED-FIS-001",
        "rating": 4.8,
        "patientsServed": 245
      }
    ]
    ```

---

### 2.4 Appointments & Schedules Module

#### 2.4.1 Get Available Schedules
*   **Method:** `GET`
*   **URL:** `http://localhost:4000/api/appointments/available-schedules?doctorId=9&date=2026-06-15`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Anyone` (Authenticated Patient, Doctor, or Admin)
*   **Expected Response (200 OK):**
    ```json
    [
      {
        "date": "2026-06-15",
        "time": "08:00",
        "available": true,
        "doctorId": 9
      },
      {
        "date": "2026-06-15",
        "time": "08:30",
        "available": false,
        "doctorId": 9
      }
    ]
    ```

#### 2.4.2 Book Appointment
*Applies 12 hours minimum booking lead time check.*
*   **Method:** `POST`
*   **URL:** `http://localhost:4000/api/appointments`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Paciente` (Doctors and Admins cannot book appointments)
*   **Request Body (JSON):**
    ```json
    {
      "doctorId": 9,
      "therapyId": 13,
      "date": "2026-06-15",
      "time": "10:00",
      "symptoms": "Severe pain in my left ankle since yesterday afternoon.",
      "hasExams": false
    }
    ```
*   **Expected Response (201 Created):**
    ```json
    {
      "message": "Appointment created successfully",
      "appointment": {
        "id": 26,
        "date": "2026-06-15",
        "time": "10:00",
        "status": "pending",
        "patient": {
          "fullName": "John Doe",
          "nationalId": "1234567890",
          "email": "john.doe@email.com"
        },
        "doctor": {
          "fullName": "Dr. Carlos Mendoza Silva",
          "specialty": "Physiotherapy"
        },
        "therapy": {
          "name": "Sports Physiotherapy",
          "duration": 60,
          "price": 45
        }
      }
    }
    ```

#### 2.4.3 Get My Appointments
*   **Method:** `GET`
*   **URL:** `http://localhost:4000/api/appointments`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Anyone`
    *   *If Patient:* Returns only their booked appointments.
    *   *If Doctor:* Returns only appointments scheduled with them.
    *   *If Admin:* Returns all system appointments.
*   **Optional Query Params:** `?status=pending` or `?date=2026-06-15`
*   **Expected Response (200 OK):**
    ```json
    [
      {
        "id": 26,
        "patientId": 18,
        "doctorId": 9,
        "therapyId": 13,
        "date": "2026-06-15",
        "time": "10:00",
        "status": "pending",
        "symptoms": "Severe pain in my left ankle...",
        "hasExams": false,
        "exams": [],
        "cancellationReason": null,
        "doctorNotes": null,
        "patient": { "fullName": "John Doe", "nationalId": "1234567890" },
        "doctor": { "fullName": "Dr. Carlos Mendoza Silva", "specialty": "Physiotherapy" },
        "therapy": { "name": "Sports Physiotherapy", "price": 45 }
      }
    ]
    ```

#### 2.4.4 Get Appointment by ID
*   **Method:** `GET`
*   **URL:** `http://localhost:4000/api/appointments/26`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Owner` or `Admin` (Only the assigned patient, the doctor, or an admin can access)
*   **Expected Response (200 OK):** *(Individual appointment payload details)*

#### 2.4.5 Update Appointment / Register Notes
*   **Method:** `PUT`
*   **URL:** `http://localhost:4000/api/appointments/26`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Doctor` (assigned to this appointment) or `Admin`
*   **Request Body (JSON):**
    ```json
    {
      "status": "confirmed",
      "doctorNotes": "Patient is stable. Approved session."
    }
    ```
*   **Expected Response (200 OK):**
    ```json
    {
      "message": "Appointment updated successfully",
      "appointment": {
        "id": 26,
        "status": "confirmed",
        "doctorNotes": "Patient is stable. Approved session.",
        "updatedAt": "2026-06-24T06:02:00.000Z"
      }
    }
    ```

#### 2.4.6 Cancel Appointment
*Requires a minimum 24-hour lead time and mandatory reason.*
*   **Method:** `DELETE`
*   **URL:** `http://localhost:4000/api/appointments/26`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Paciente` (Only the owner patient can cancel their appointments)
*   **Request Body (JSON):**
    ```json
    {
      "reason": "Unexpected work trip."
    }
    ```
*   **Expected Response (200 OK):**
    ```json
    {
      "message": "Appointment cancelled successfully",
      "appointment": {
        "id": 26,
        "status": "cancelled",
        "cancellationReason": "Unexpected work trip."
      }
    }
    ```

---

### 2.5 User Administration

#### 2.5.1 Get All Users
*   **Method:** `GET`
*   **URL:** `http://localhost:4000/api/users`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Admin`
*   **Optional Query Params:** `?role=medico`
*   **Expected Response (200 OK):**
    ```json
    [
      {
        "id": 18,
        "nationalId": "1234567890",
        "fullName": "John Doe",
        "role": "paciente"
      }
    ]
    ```

#### 2.5.2 Get User by ID
*   **Method:** `GET`
*   **URL:** `http://localhost:4000/api/users/18`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Owner` or `Admin`
*   **Expected Response (200 OK):** *(Full user details)*

#### 2.5.3 Update User
*   **Method:** `PUT`
*   **URL:** `http://localhost:4000/api/users/18`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Owner` or `Admin` (Note: Only Admins can modify the `role` field)
*   **Request Body (JSON):**
    ```json
    {
      "email": "john.new@flova.com",
      "phone": "0987654322",
      "insuranceType": "privado"
    }
    ```
*   **Expected Response (200 OK):**
    ```json
    {
      "message": "User updated successfully",
      "user": {
        "id": 18,
        "fullName": "John Doe",
        "email": "john.new@flova.com",
        "phone": "0987654322",
        "insuranceType": "privado"
      }
    }
    ```

#### 2.5.4 Delete User
*   **Method:** `DELETE`
*   **URL:** `http://localhost:4000/api/users/25`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Admin`
*   **Expected Response (200 OK):**
    ```json
    {
      "message": "User deleted successfully"
    }
    ```

---

### 2.6 Reports & Statistics

#### 2.6.1 Get Admin Statistics
*   **Method:** `GET`
*   **URL:** `http://localhost:4000/api/stats/admin`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Admin`
*   **Expected Response (200 OK):**
    ```json
    {
      "users": { "total": 8, "patients": 3, "doctors": 4, "admins": 1 },
      "appointments": { "total": 12, "pending": 4, "confirmed": 2, "completed": 2, "cancelled": 4 },
      "finances": { "expectedRevenue": 240, "completedRevenue": 120, "pendingRevenue": 120 }
    }
    ```

#### 2.6.2 Get Financial Report
*   **Method:** `GET`
*   **URL:** `http://localhost:4000/api/stats/financial`
*   **Requires Token:** `YES` (JWT in Header `Authorization: Bearer <token>`)
*   **Allowed Roles:** `Admin`
*   **Optional Query Params:** `?month=6&year=2026`
*   **Expected Response (200 OK):** *(Detailed breakdown of revenues by therapy and doctor)*
