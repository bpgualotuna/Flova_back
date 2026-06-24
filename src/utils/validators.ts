export const validateMinAnticipation = (dateStr: string, timeStr: string): void => {
  const now = new Date();
  const appointmentDate = new Date(`${dateStr}T${timeStr}:00`);
  const diffHours = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffHours <= 12) {
    throw new Error('Appointments must be booked at least 12 hours in advance');
  }
};

export const validateCancellationLeadTime = (dateStr: string, timeStr: string): void => {
  const now = new Date();
  const appointmentDate = new Date(`${dateStr}T${timeStr}:00`);
  const diffHours = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffHours <= 24) {
    throw new Error('Appointments can only be cancelled at least 24 hours in advance');
  }
};

export const validateTimeFormat = (timeStr: string): boolean => {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeStr);
};

export const validateDateFormat = (dateStr: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const dateObj = new Date(dateStr);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

export const validateEcuadorianId = (nationalId: string): boolean => {
  if (nationalId.length !== 10) return false;
  
  const province = parseInt(nationalId.substring(0, 2));
  if (province < 1 || province > 24) return false;
  
  const thirdDigit = parseInt(nationalId.charAt(2));
  if (thirdDigit > 6) return false;
  
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    let val = parseInt(nationalId.charAt(i)) * coefficients[i];
    if (val >= 10) val -= 9;
    sum += val;
  }
  
  const verificationDigit = parseInt(nationalId.charAt(9));
  const result = sum % 10 === 0 ? 0 : 10 - (sum % 10);
  
  return result === verificationDigit;
};
