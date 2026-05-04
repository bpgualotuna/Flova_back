/**
 * Validaciones de reglas de negocio
 */

/**
 * Valida que la cita tenga más de 12 horas de anticipación
 * REGLA AJUSTADA: Anticipación mínima de 12 horas (no 24)
 */
export const validarAnticipacionMinima = (fecha: string, hora: string): void => {
  const ahora = new Date();
  const fechaCita = new Date(`${fecha}T${hora}:00`);
  const diferenciaHoras = (fechaCita.getTime() - ahora.getTime()) / (1000 * 60 * 60);
  
  if (diferenciaHoras <= 12) {
    throw new Error('Las citas deben reservarse con más de 12 horas de anticipación');
  }
};

/**
 * Valida que la cancelación tenga más de 24 horas de anticipación
 */
export const validarAnticipacionCancelacion = (fecha: string, hora: string): void => {
  const ahora = new Date();
  const fechaCita = new Date(`${fecha}T${hora}:00`);
  const diferenciaHoras = (fechaCita.getTime() - ahora.getTime()) / (1000 * 60 * 60);
  
  if (diferenciaHoras <= 24) {
    throw new Error('Las citas solo pueden cancelarse con más de 24 horas de anticipación');
  }
};

/**
 * Valida formato de hora HH:mm
 */
export const validarFormatoHora = (hora: string): boolean => {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(hora);
};

/**
 * Valida formato de fecha YYYY-MM-DD
 */
export const validarFormatoFecha = (fecha: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(fecha)) return false;
  
  const date = new Date(fecha);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Valida que la cédula ecuatoriana sea válida
 */
export const validarCedulaEcuatoriana = (cedula: string): boolean => {
  if (cedula.length !== 10) return false;
  
  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) return false;
  
  const tercerDigito = parseInt(cedula.charAt(2));
  if (tercerDigito > 6) return false;
  
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i)) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }
  
  const digitoVerificador = parseInt(cedula.charAt(9));
  const resultado = suma % 10 === 0 ? 0 : 10 - (suma % 10);
  
  return resultado === digitoVerificador;
};
