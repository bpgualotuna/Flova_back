"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var passwordHash, adminPasswordHash, admin, paciente1, paciente2, paciente3, medicoUser1, medicoUser2, medicoUser3, medicoUser4, medico1, medico2, medico3, medico4, dia, dia, dia, dia, terapia1, terapia2, terapia3, terapia4, terapia5, terapia6, fechaFutura, fechaFutura2, fechaPasada;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Iniciando seed de la base de datos...\n');
                    // Limpiar datos existentes
                    console.log('🗑️  Limpiando datos existentes...');
                    return [4 /*yield*/, prisma.cita.deleteMany()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, prisma.horarioAtencion.deleteMany()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.medico.deleteMany()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.terapia.deleteMany()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.deleteMany()];
                case 5:
                    _a.sent();
                    console.log('✅ Datos limpiados\n');
                    return [4 /*yield*/, bcryptjs_1.default.hash('password123', 10)];
                case 6:
                    passwordHash = _a.sent();
                    return [4 /*yield*/, bcryptjs_1.default.hash('admin123', 10)];
                case 7:
                    adminPasswordHash = _a.sent();
                    // ============================================
                    // 1. CREAR USUARIOS
                    // ============================================
                    console.log('👥 Creando usuarios...');
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                cedula: 'admin',
                                username: 'admin',
                                password: adminPasswordHash,
                                fullName: 'Administrador del Sistema',
                                email: 'admin@flova.com',
                                telefono: '0999999999',
                                tipoSeguro: 'ninguno',
                                role: 'admin'
                            }
                        })];
                case 8:
                    admin = _a.sent();
                    console.log('  ✓ Admin creado');
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                cedula: '1234567890',
                                username: '1234567890',
                                password: passwordHash,
                                fullName: 'Juan Pérez García',
                                email: 'juan.perez@email.com',
                                telefono: '0987654321',
                                tipoSeguro: 'iess',
                                role: 'paciente'
                            }
                        })];
                case 9:
                    paciente1 = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                cedula: '0987654321',
                                username: '0987654321',
                                password: passwordHash,
                                fullName: 'María González López',
                                email: 'maria.gonzalez@email.com',
                                telefono: '0987654322',
                                tipoSeguro: 'privado',
                                role: 'paciente'
                            }
                        })];
                case 10:
                    paciente2 = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                cedula: '1122334455',
                                username: '1122334455',
                                password: passwordHash,
                                fullName: 'Carlos Ramírez Torres',
                                email: 'carlos.ramirez@email.com',
                                telefono: '0987654323',
                                tipoSeguro: 'issfa',
                                role: 'paciente'
                            }
                        })];
                case 11:
                    paciente3 = _a.sent();
                    console.log('  ✓ 3 pacientes creados');
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                cedula: '1111111111',
                                username: '1111111111',
                                password: passwordHash,
                                fullName: 'Dr. Carlos Mendoza Silva',
                                email: 'carlos.mendoza@flova.com',
                                telefono: '0991111111',
                                tipoSeguro: 'privado',
                                role: 'medico'
                            }
                        })];
                case 12:
                    medicoUser1 = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                cedula: '2222222222',
                                username: '2222222222',
                                password: passwordHash,
                                fullName: 'Dra. María González Ruiz',
                                email: 'maria.gonzalez.med@flova.com',
                                telefono: '0992222222',
                                tipoSeguro: 'privado',
                                role: 'medico'
                            }
                        })];
                case 13:
                    medicoUser2 = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                cedula: '3333333333',
                                username: '3333333333',
                                password: passwordHash,
                                fullName: 'Dr. Roberto Silva Morales',
                                email: 'roberto.silva@flova.com',
                                telefono: '0993333333',
                                tipoSeguro: 'privado',
                                role: 'medico'
                            }
                        })];
                case 14:
                    medicoUser3 = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                cedula: '4444444444',
                                username: '4444444444',
                                password: passwordHash,
                                fullName: 'Dra. Ana Martínez Vega',
                                email: 'ana.martinez@flova.com',
                                telefono: '0994444444',
                                tipoSeguro: 'privado',
                                role: 'medico'
                            }
                        })];
                case 15:
                    medicoUser4 = _a.sent();
                    console.log('  ✓ 4 médicos creados\n');
                    // ============================================
                    // 2. CREAR PERFILES DE MÉDICOS
                    // ============================================
                    console.log('🩺 Creando perfiles de médicos...');
                    return [4 /*yield*/, prisma.medico.create({
                            data: {
                                userId: medicoUser1.id,
                                especialidad: 'Fisioterapia',
                                numeroLicencia: 'MED-FIS-001',
                                calificacion: 4.8,
                                pacientesAtendidos: 245
                            }
                        })];
                case 16:
                    medico1 = _a.sent();
                    return [4 /*yield*/, prisma.medico.create({
                            data: {
                                userId: medicoUser2.id,
                                especialidad: 'Terapia Ocupacional',
                                numeroLicencia: 'MED-TO-002',
                                calificacion: 4.9,
                                pacientesAtendidos: 189
                            }
                        })];
                case 17:
                    medico2 = _a.sent();
                    return [4 /*yield*/, prisma.medico.create({
                            data: {
                                userId: medicoUser3.id,
                                especialidad: 'Psicología',
                                numeroLicencia: 'MED-PSI-003',
                                calificacion: 4.7,
                                pacientesAtendidos: 312
                            }
                        })];
                case 18:
                    medico3 = _a.sent();
                    return [4 /*yield*/, prisma.medico.create({
                            data: {
                                userId: medicoUser4.id,
                                especialidad: 'Fisioterapia',
                                numeroLicencia: 'MED-FIS-004',
                                calificacion: 4.6,
                                pacientesAtendidos: 156
                            }
                        })];
                case 19:
                    medico4 = _a.sent();
                    console.log('  ✓ 4 perfiles de médicos creados\n');
                    // ============================================
                    // 3. CREAR HORARIOS DE ATENCIÓN
                    // ============================================
                    console.log('📅 Creando horarios de atención...');
                    dia = 1;
                    _a.label = 20;
                case 20:
                    if (!(dia <= 5)) return [3 /*break*/, 23];
                    return [4 /*yield*/, prisma.horarioAtencion.create({
                            data: {
                                medicoId: medico1.id,
                                diaSemana: dia,
                                horaInicio: '08:00',
                                horaFin: '16:00'
                            }
                        })];
                case 21:
                    _a.sent();
                    _a.label = 22;
                case 22:
                    dia++;
                    return [3 /*break*/, 20];
                case 23: 
                // Sábado: 08:00 - 12:00 (medio día)
                return [4 /*yield*/, prisma.horarioAtencion.create({
                        data: {
                            medicoId: medico1.id,
                            diaSemana: 6,
                            horaInicio: '08:00',
                            horaFin: '12:00'
                        }
                    })];
                case 24:
                    // Sábado: 08:00 - 12:00 (medio día)
                    _a.sent();
                    dia = 1;
                    _a.label = 25;
                case 25:
                    if (!(dia <= 5)) return [3 /*break*/, 28];
                    return [4 /*yield*/, prisma.horarioAtencion.create({
                            data: {
                                medicoId: medico2.id,
                                diaSemana: dia,
                                horaInicio: '09:00',
                                horaFin: '17:00'
                            }
                        })];
                case 26:
                    _a.sent();
                    _a.label = 27;
                case 27:
                    dia++;
                    return [3 /*break*/, 25];
                case 28:
                    dia = 1;
                    _a.label = 29;
                case 29:
                    if (!(dia <= 5)) return [3 /*break*/, 32];
                    return [4 /*yield*/, prisma.horarioAtencion.create({
                            data: {
                                medicoId: medico3.id,
                                diaSemana: dia,
                                horaInicio: '10:00',
                                horaFin: '18:00'
                            }
                        })];
                case 30:
                    _a.sent();
                    _a.label = 31;
                case 31:
                    dia++;
                    return [3 /*break*/, 29];
                case 32: 
                // Sábado: 10:00 - 14:00 (medio día)
                return [4 /*yield*/, prisma.horarioAtencion.create({
                        data: {
                            medicoId: medico3.id,
                            diaSemana: 6,
                            horaInicio: '10:00',
                            horaFin: '14:00'
                        }
                    })];
                case 33:
                    // Sábado: 10:00 - 14:00 (medio día)
                    _a.sent();
                    dia = 1;
                    _a.label = 34;
                case 34:
                    if (!(dia <= 5)) return [3 /*break*/, 37];
                    return [4 /*yield*/, prisma.horarioAtencion.create({
                            data: {
                                medicoId: medico4.id,
                                diaSemana: dia,
                                horaInicio: '14:00',
                                horaFin: '20:00'
                            }
                        })];
                case 35:
                    _a.sent();
                    _a.label = 36;
                case 36:
                    dia++;
                    return [3 /*break*/, 34];
                case 37:
                    console.log('  ✓ Horarios de atención creados\n');
                    // ============================================
                    // 4. CREAR TERAPIAS
                    // ============================================
                    console.log('💊 Creando terapias...');
                    return [4 /*yield*/, prisma.terapia.create({
                            data: {
                                nombre: 'Fisioterapia Deportiva',
                                descripcion: 'Tratamiento especializado para lesiones deportivas y recuperación de atletas. Incluye técnicas de rehabilitación avanzadas.',
                                especialidad: 'Fisioterapia',
                                duracion: 60,
                                precio: 45.00,
                                imagen: 'https://picsum.photos/seed/fisio1/400/300',
                                activa: true
                            }
                        })];
                case 38:
                    terapia1 = _a.sent();
                    return [4 /*yield*/, prisma.terapia.create({
                            data: {
                                nombre: 'Rehabilitación Post-Quirúrgica',
                                descripcion: 'Programa de rehabilitación integral después de cirugías ortopédicas. Recuperación funcional completa.',
                                especialidad: 'Fisioterapia',
                                duracion: 75,
                                precio: 65.00,
                                imagen: 'https://picsum.photos/seed/fisio2/400/300',
                                activa: true
                            }
                        })];
                case 39:
                    terapia2 = _a.sent();
                    return [4 /*yield*/, prisma.terapia.create({
                            data: {
                                nombre: 'Terapia Ocupacional Pediátrica',
                                descripcion: 'Intervención temprana para niños con dificultades en el desarrollo motor y cognitivo.',
                                especialidad: 'Terapia Ocupacional',
                                duracion: 45,
                                precio: 50.00,
                                imagen: 'https://picsum.photos/seed/to1/400/300',
                                activa: true
                            }
                        })];
                case 40:
                    terapia3 = _a.sent();
                    return [4 /*yield*/, prisma.terapia.create({
                            data: {
                                nombre: 'Terapia Ocupacional para Adultos Mayores',
                                descripcion: 'Mejora de la independencia funcional y calidad de vida en adultos mayores.',
                                especialidad: 'Terapia Ocupacional',
                                duracion: 60,
                                precio: 55.00,
                                imagen: 'https://picsum.photos/seed/to2/400/300',
                                activa: true
                            }
                        })];
                case 41:
                    terapia4 = _a.sent();
                    return [4 /*yield*/, prisma.terapia.create({
                            data: {
                                nombre: 'Terapia Cognitivo-Conductual',
                                descripcion: 'Tratamiento psicológico para ansiedad, depresión y otros trastornos emocionales.',
                                especialidad: 'Psicología',
                                duracion: 60,
                                precio: 55.00,
                                imagen: 'https://picsum.photos/seed/psi1/400/300',
                                activa: true
                            }
                        })];
                case 42:
                    terapia5 = _a.sent();
                    return [4 /*yield*/, prisma.terapia.create({
                            data: {
                                nombre: 'Terapia Familiar',
                                descripcion: 'Intervención psicológica para mejorar la comunicación y resolver conflictos familiares.',
                                especialidad: 'Psicología',
                                duracion: 90,
                                precio: 75.00,
                                imagen: 'https://picsum.photos/seed/psi2/400/300',
                                activa: true
                            }
                        })];
                case 43:
                    terapia6 = _a.sent();
                    console.log('  ✓ 6 terapias creadas\n');
                    // ============================================
                    // 5. CREAR CITAS DE EJEMPLO
                    // ============================================
                    console.log('📋 Creando citas de ejemplo...');
                    fechaFutura = new Date();
                    fechaFutura.setDate(fechaFutura.getDate() + 3);
                    return [4 /*yield*/, prisma.cita.create({
                            data: {
                                pacienteId: paciente1.id,
                                medicoId: medico1.id,
                                terapiaId: terapia1.id,
                                fecha: fechaFutura,
                                hora: '10:00',
                                estado: 'pendiente',
                                sintomas: 'Dolor en rodilla derecha después de correr. Necesito evaluación para continuar entrenamiento.',
                                tieneExamenes: false,
                                examenes: []
                            }
                        })];
                case 44:
                    _a.sent();
                    fechaFutura2 = new Date();
                    fechaFutura2.setDate(fechaFutura2.getDate() + 5);
                    return [4 /*yield*/, prisma.cita.create({
                            data: {
                                pacienteId: paciente2.id,
                                medicoId: medico2.id,
                                terapiaId: terapia3.id,
                                fecha: fechaFutura2,
                                hora: '11:00',
                                estado: 'confirmada',
                                sintomas: 'Mi hijo de 5 años tiene dificultades con la motricidad fina. Necesita evaluación.',
                                tieneExamenes: true,
                                examenes: ['evaluacion_escolar.pdf']
                            }
                        })];
                case 45:
                    _a.sent();
                    fechaPasada = new Date();
                    fechaPasada.setDate(fechaPasada.getDate() - 7);
                    return [4 /*yield*/, prisma.cita.create({
                            data: {
                                pacienteId: paciente3.id,
                                medicoId: medico3.id,
                                terapiaId: terapia5.id,
                                fecha: fechaPasada,
                                hora: '15:00',
                                estado: 'completada',
                                sintomas: 'Ansiedad generalizada y problemas para dormir. Busco ayuda profesional.',
                                tieneExamenes: false,
                                examenes: [],
                                notasMedico: 'Paciente presenta síntomas de ansiedad moderada. Se recomienda continuar con sesiones semanales.'
                            }
                        })];
                case 46:
                    _a.sent();
                    console.log('  ✓ 3 citas de ejemplo creadas\n');
                    // ============================================
                    // RESUMEN
                    // ============================================
                    console.log('✅ Seed completado exitosamente!\n');
                    console.log('📊 RESUMEN:');
                    console.log('  • 1 Administrador');
                    console.log('  • 3 Pacientes');
                    console.log('  • 4 Médicos');
                    console.log('  • 6 Terapias');
                    console.log('  • 3 Citas de ejemplo');
                    console.log('');
                    console.log('🔑 CREDENCIALES DE PRUEBA:');
                    console.log('');
                    console.log('  👨‍💼 ADMIN:');
                    console.log('     Cédula: admin');
                    console.log('     Contraseña: admin123');
                    console.log('');
                    console.log('  👤 PACIENTE:');
                    console.log('     Cédula: 1234567890');
                    console.log('     Contraseña: password123');
                    console.log('');
                    console.log('  👨‍⚕️ MÉDICO (Fisioterapia):');
                    console.log('     Cédula: 1111111111');
                    console.log('     Contraseña: password123');
                    console.log('');
                    console.log('  👩‍⚕️ MÉDICO (Terapia Ocupacional):');
                    console.log('     Cédula: 2222222222');
                    console.log('     Contraseña: password123');
                    console.log('');
                    console.log('  👨‍⚕️ MÉDICO (Psicología):');
                    console.log('     Cédula: 3333333333');
                    console.log('     Contraseña: password123');
                    console.log('');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Error en seed:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
