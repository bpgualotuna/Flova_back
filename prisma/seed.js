"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando seed de la base de datos...\n');
    // Limpiar datos existentes
    console.log('🗑️  Limpiando datos existentes...');
    await prisma.cita.deleteMany();
    await prisma.horarioAtencion.deleteMany();
    await prisma.medico.deleteMany();
    await prisma.terapia.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Datos limpiados\n');
    // Hash de contraseñas
    const passwordHash = await bcryptjs_1.default.hash('password123', 10);
    const adminPasswordHash = await bcryptjs_1.default.hash('admin123', 10);
    // ============================================
    // 1. CREAR USUARIOS
    // ============================================
    console.log('👥 Creando usuarios...');
    // Admin
    const admin = await prisma.user.create({
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
    });
    console.log('  ✓ Admin creado');
    // Pacientes
    const paciente1 = await prisma.user.create({
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
    });
    const paciente2 = await prisma.user.create({
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
    });
    const paciente3 = await prisma.user.create({
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
    });
    console.log('  ✓ 3 pacientes creados');
    // Médicos
    const medicoUser1 = await prisma.user.create({
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
    });
    const medicoUser2 = await prisma.user.create({
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
    });
    const medicoUser3 = await prisma.user.create({
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
    });
    const medicoUser4 = await prisma.user.create({
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
    });
    console.log('  ✓ 4 médicos creados\n');
    // ============================================
    // 2. CREAR PERFILES DE MÉDICOS
    // ============================================
    console.log('🩺 Creando perfiles de médicos...');
    const medico1 = await prisma.medico.create({
        data: {
            userId: medicoUser1.id,
            especialidad: 'Fisioterapia',
            numeroLicencia: 'MED-FIS-001',
            calificacion: 4.8,
            pacientesAtendidos: 245
        }
    });
    const medico2 = await prisma.medico.create({
        data: {
            userId: medicoUser2.id,
            especialidad: 'Terapia Ocupacional',
            numeroLicencia: 'MED-TO-002',
            calificacion: 4.9,
            pacientesAtendidos: 189
        }
    });
    const medico3 = await prisma.medico.create({
        data: {
            userId: medicoUser3.id,
            especialidad: 'Psicología',
            numeroLicencia: 'MED-PSI-003',
            calificacion: 4.7,
            pacientesAtendidos: 312
        }
    });
    const medico4 = await prisma.medico.create({
        data: {
            userId: medicoUser4.id,
            especialidad: 'Fisioterapia',
            numeroLicencia: 'MED-FIS-004',
            calificacion: 4.6,
            pacientesAtendidos: 156
        }
    });
    console.log('  ✓ 4 perfiles de médicos creados\n');
    // ============================================
    // 3. CREAR HORARIOS DE ATENCIÓN
    // ============================================
    console.log('📅 Creando horarios de atención...');
    // Horarios para Dr. Carlos Mendoza (Fisioterapia)
    // Lunes a Viernes: 08:00 - 16:00
    for (let dia = 1; dia <= 5; dia++) {
        await prisma.horarioAtencion.create({
            data: {
                medicoId: medico1.id,
                diaSemana: dia,
                horaInicio: '08:00',
                horaFin: '16:00'
            }
        });
    }
    // Horarios para Dra. María González (Terapia Ocupacional)
    // Lunes a Viernes: 09:00 - 17:00
    for (let dia = 1; dia <= 5; dia++) {
        await prisma.horarioAtencion.create({
            data: {
                medicoId: medico2.id,
                diaSemana: dia,
                horaInicio: '09:00',
                horaFin: '17:00'
            }
        });
    }
    // Horarios para Dr. Roberto Silva (Psicología)
    // Lunes a Viernes: 10:00 - 18:00
    for (let dia = 1; dia <= 5; dia++) {
        await prisma.horarioAtencion.create({
            data: {
                medicoId: medico3.id,
                diaSemana: dia,
                horaInicio: '10:00',
                horaFin: '18:00'
            }
        });
    }
    // Horarios para Dra. Ana Martínez (Fisioterapia)
    // Lunes a Viernes: 14:00 - 20:00
    for (let dia = 1; dia <= 5; dia++) {
        await prisma.horarioAtencion.create({
            data: {
                medicoId: medico4.id,
                diaSemana: dia,
                horaInicio: '14:00',
                horaFin: '20:00'
            }
        });
    }
    console.log('  ✓ Horarios de atención creados\n');
    // ============================================
    // 4. CREAR TERAPIAS
    // ============================================
    console.log('💊 Creando terapias...');
    const terapia1 = await prisma.terapia.create({
        data: {
            nombre: 'Fisioterapia Deportiva',
            descripcion: 'Tratamiento especializado para lesiones deportivas y recuperación de atletas. Incluye técnicas de rehabilitación avanzadas.',
            especialidad: 'Fisioterapia',
            duracion: 60,
            precio: 45.00,
            imagen: 'https://picsum.photos/seed/fisio1/400/300',
            activa: true
        }
    });
    const terapia2 = await prisma.terapia.create({
        data: {
            nombre: 'Rehabilitación Post-Quirúrgica',
            descripcion: 'Programa de rehabilitación integral después de cirugías ortopédicas. Recuperación funcional completa.',
            especialidad: 'Fisioterapia',
            duracion: 75,
            precio: 65.00,
            imagen: 'https://picsum.photos/seed/fisio2/400/300',
            activa: true
        }
    });
    const terapia3 = await prisma.terapia.create({
        data: {
            nombre: 'Terapia Ocupacional Pediátrica',
            descripcion: 'Intervención temprana para niños con dificultades en el desarrollo motor y cognitivo.',
            especialidad: 'Terapia Ocupacional',
            duracion: 45,
            precio: 50.00,
            imagen: 'https://picsum.photos/seed/to1/400/300',
            activa: true
        }
    });
    const terapia4 = await prisma.terapia.create({
        data: {
            nombre: 'Terapia Ocupacional para Adultos Mayores',
            descripcion: 'Mejora de la independencia funcional y calidad de vida en adultos mayores.',
            especialidad: 'Terapia Ocupacional',
            duracion: 60,
            precio: 55.00,
            imagen: 'https://picsum.photos/seed/to2/400/300',
            activa: true
        }
    });
    const terapia5 = await prisma.terapia.create({
        data: {
            nombre: 'Terapia Cognitivo-Conductual',
            descripcion: 'Tratamiento psicológico para ansiedad, depresión y otros trastornos emocionales.',
            especialidad: 'Psicología',
            duracion: 60,
            precio: 55.00,
            imagen: 'https://picsum.photos/seed/psi1/400/300',
            activa: true
        }
    });
    const terapia6 = await prisma.terapia.create({
        data: {
            nombre: 'Terapia Familiar',
            descripcion: 'Intervención psicológica para mejorar la comunicación y resolver conflictos familiares.',
            especialidad: 'Psicología',
            duracion: 90,
            precio: 75.00,
            imagen: 'https://picsum.photos/seed/psi2/400/300',
            activa: true
        }
    });
    console.log('  ✓ 6 terapias creadas\n');
    // ============================================
    // 5. CREAR CITAS DE EJEMPLO
    // ============================================
    console.log('📋 Creando citas de ejemplo...');
    // Cita futura (pendiente)
    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 3);
    await prisma.cita.create({
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
    });
    // Cita futura (confirmada)
    const fechaFutura2 = new Date();
    fechaFutura2.setDate(fechaFutura2.getDate() + 5);
    await prisma.cita.create({
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
    });
    // Cita pasada (completada)
    const fechaPasada = new Date();
    fechaPasada.setDate(fechaPasada.getDate() - 7);
    await prisma.cita.create({
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
    });
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
}
main()
    .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map