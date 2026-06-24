import dotenv from 'dotenv';
dotenv.config();

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

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

const dbQuery = async (model: string, operation: string, args: any = {}) => {
  const dbServiceUrl = process.env.DB_SERVICE_URL || 'http://localhost:5001';
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
      throw new Error(data.error || `DB query error (${response.status})`);
    }

    return reviveDates(data);
  } catch (error: any) {
    console.error(`❌ DB Proxy Error [${model}.${operation}]:`, error.message);
    throw error;
  }
};

const createModelProxy = (model: string) => {
  return new Proxy({}, {
    get(target, operation: string) {
      return (args: any) => dbQuery(model, operation, args);
    }
  });
};

const prisma = new Proxy({}, {
  get(target, model: string) {
    if (model.startsWith('$')) {
      return () => Promise.resolve();
    }
    return createModelProxy(model);
  }
}) as any;

export default prisma;
