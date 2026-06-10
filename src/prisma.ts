import dotenv from 'dotenv';
dotenv.config();

// ============================================
// REGEX PARA IDENTIFICACIÓN DE FECHAS EN JSON
// ============================================
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

/**
 * Función recursiva para buscar cadenas de texto que parezcan fechas ISO
 * y convertirlas en objetos Date de Javascript para conservar compatibilidad con Prisma.
 */
const reviveDates = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    if (ISO_DATE_REGEX.test(obj)) {
      return new Date(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => reviveDates(item));
  }

  if (typeof obj === 'object') {
    const revivedObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        revivedObj[key] = reviveDates(obj[key]);
      }
    }
    return revivedObj;
  }

  return obj;
};

/**
 * Función que realiza la petición HTTP al servicio de persistencia (flova_db)
 */
const dbQuery = async (model: string, operation: string, args: any = {}) => {
  const dbServiceUrl = process.env.DB_SERVICE_URL || 'http://localhost:5000';
  const apiKey = process.env.INTERNAL_API_KEY || 'flova_secret_internal_key_2026';

  try {
    const response = await fetch(`${dbServiceUrl}/db/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': apiKey
      },
      body: JSON.stringify({ model, operation, args })
    });

    const data = await response.json() as any;

    if (!response.ok) {
      throw new Error(data.error || `Error en consulta DB (${response.status})`);
    }

    // Convertir de nuevo los strings de fechas en objetos Date
    return reviveDates(data);
  } catch (error: any) {
    console.error(`❌ Error en Proxy DB [${model}.${operation}]:`, error.message);
    throw error;
  }
};

/**
 * Proxy para un modelo individual (ej: prisma.user)
 */
const createModelProxy = (model: string) => {
  return new Proxy({}, {
    get(target, operation: string) {
      return (args: any) => dbQuery(model, operation, args);
    }
  });
};

/**
 * Proxy principal que intercepta los accesos a los modelos de Prisma
 */
const prisma = new Proxy({}, {
  get(target, model: string) {
    if (model.startsWith('$')) {
      // Retornar una función vacía resuelta para métodos como $connect o $disconnect
      return () => Promise.resolve();
    }
    return createModelProxy(model);
  }
}) as any;

export default prisma;
