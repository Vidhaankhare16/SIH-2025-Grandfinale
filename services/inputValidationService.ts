// Input validation and sanitization service
// Provides comprehensive validation and sanitization for all user inputs

/**
 * Sanitizes text input by removing potentially harmful characters
 * Limits length and trims whitespace
 */
export const sanitizeText = (input: string, maxLength: number = 100): string => {
  if (typeof input !== 'string') return '';
  
  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

/**
 * Validates and sanitizes username
 * Rules: 3-20 characters, alphanumeric and underscore only
 */
export const validateUsername = (username: string): { valid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeText(username, 20).toLowerCase();
  
  if (sanitized.length < 3) {
    return { valid: false, sanitized, error: 'Username must be at least 3 characters' };
  }
  
  if (sanitized.length > 20) {
    return { valid: false, sanitized, error: 'Username must be at most 20 characters' };
  }
  
  // Only alphanumeric and underscore
  if (!/^[a-z0-9_]+$/.test(sanitized)) {
    return { valid: false, sanitized, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { valid: true, sanitized };
};

/**
 * Validates password strength
 * Rules: 6-50 characters, at least one letter and one number
 */
export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  
  if (password.length > 50) {
    return { valid: false, error: 'Password must be at most 50 characters' };
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  return { valid: true };
};

/**
 * Validates and sanitizes name (person name)
 * Rules: 2-50 characters, letters, spaces, hyphens, apostrophes only
 */
export const validateName = (name: string): { valid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeText(name, 50);
  
  if (sanitized.length < 2) {
    return { valid: false, sanitized, error: 'Name must be at least 2 characters' };
  }
  
  // Allow letters, spaces, hyphens, apostrophes (for names like O'Brien, Mary-Jane)
  if (!/^[a-zA-Z\s\-']+$/.test(sanitized)) {
    return { valid: false, sanitized, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { valid: true, sanitized };
};

/**
 * Validates and sanitizes first/last name (strict - letters and spaces only)
 * Rules: 1-50 characters, letters and spaces only (no numbers, special characters)
 * This is stricter than validateName - only allows letters and spaces
 */
export const validateNameStrict = (name: string): { valid: boolean; sanitized: string; error?: string } => {
  // Remove all non-letter, non-space characters in real-time
  let sanitized = name.replace(/[^a-zA-Z\s]/g, '');
  
  // Trim and limit length
  sanitized = sanitized.trim();
  if (sanitized.length > 50) {
    sanitized = sanitized.substring(0, 50);
  }
  
  if (sanitized.length < 1) {
    return { valid: false, sanitized, error: 'Name must be at least 1 character' };
  }
  
  // Final validation - only letters and spaces allowed
  if (!/^[a-zA-Z\s]+$/.test(sanitized)) {
    return { valid: false, sanitized, error: 'Name can only contain letters and spaces' };
  }
  
  // Remove multiple consecutive spaces
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return { valid: true, sanitized };
};

/**
 * Validates and sanitizes phone number
 * Rules: 10 digits (Indian format)
 */
export const validatePhone = (phone: string): { valid: boolean; sanitized: string; error?: string } => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return { valid: true, sanitized: digits };
  }
  
  if (digits.length === 11 && digits.startsWith('0')) {
    // Remove leading 0
    return { valid: true, sanitized: digits.substring(1) };
  }
  
  if (digits.length === 13 && digits.startsWith('91')) {
    // Remove country code
    return { valid: true, sanitized: digits.substring(2) };
  }
  
  return { valid: false, sanitized: digits, error: 'Phone number must be 10 digits' };
};

/**
 * Validates and sanitizes numeric input
 * Rules: Must be a valid number within specified range
 */
export const validateNumber = (
  value: string | number,
  min: number = Number.MIN_SAFE_INTEGER,
  max: number = Number.MAX_SAFE_INTEGER,
  allowDecimals: boolean = true
): { valid: boolean; sanitized: number; error?: string } => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return { valid: false, sanitized: 0, error: 'Must be a valid number' };
  }
  
  if (!allowDecimals && !Number.isInteger(numValue)) {
    return { valid: false, sanitized: Math.round(numValue), error: 'Must be a whole number' };
  }
  
  if (numValue < min) {
    return { valid: false, sanitized: numValue, error: `Value must be at least ${min}` };
  }
  
  if (numValue > max) {
    return { valid: false, sanitized: numValue, error: `Value must be at most ${max}` };
  }
  
  return { valid: true, sanitized: numValue };
};

/**
 * Validates quantity (for crops, produce, etc.)
 * Rules: 0.1 to 10000 quintals
 */
export const validateQuantity = (quantity: string | number): { valid: boolean; sanitized: number; error?: string } => {
  return validateNumber(quantity, 0.1, 10000, true);
};

/**
 * Validates price per quintal
 * Rules: 1000 to 100000 rupees
 */
export const validatePrice = (price: string | number): { valid: boolean; sanitized: number; error?: string } => {
  return validateNumber(price, 1000, 100000, true);
};

/**
 * Validates acreage
 * Rules: 0.1 to 1000 acres
 */
export const validateAcreage = (acreage: string | number): { valid: boolean; sanitized: number; error?: string } => {
  return validateNumber(acreage, 0.1, 1000, true);
};

/**
 * Validates soil health card parameters with realistic agricultural limits
 * Based on standard soil health card parameters for Indian agriculture
 */
export const validateSoilParameter = (
  param: string,
  value: number,
  min: number,
  max: number
): { valid: boolean; sanitized: number; error?: string; warning?: string } => {
  const validation = validateNumber(value, min, max, true);
  
  // Add warnings for extreme values based on agricultural standards
  if (validation.valid) {
    switch (param.toLowerCase()) {
      case 'nitrogen':
      case 'n':
        if (value > 480) {
          return { ...validation, warning: 'Very high nitrogen (> 480 kg/ha) - sufficient for most crops' };
        }
        break;
      case 'phosphorus':
      case 'p':
        if (value > 22) {
          return { ...validation, warning: 'Very high phosphorus (> 22 kg/ha) - sufficient for most crops' };
        }
        break;
      case 'potassium':
      case 'k':
        if (value > 280) {
          return { ...validation, warning: 'Very high potassium (> 280 kg/ha) - sufficient for most crops' };
        }
        break;
      case 'organiccarbon':
      case 'oc':
        if (value < 0.75) {
          return { ...validation, warning: 'Low organic carbon (< 0.75%) - may need organic matter addition' };
        }
        if (value > 4) {
          return { ...validation, warning: 'Very high organic carbon (> 4%) - rare but beneficial' };
        }
        if (value > 8) {
          return { ...validation, warning: 'Extremely high organic carbon (> 8%) - very rare' };
        }
        break;
      case 'electricalconductivity':
      case 'ec':
        if (value > 4.0) {
          return { ...validation, warning: 'High EC (> 4.0 dS/m) - Saline soil, may be injurious to most crops' };
        }
        break;
      case 'sulphur':
      case 's':
        if (value > 20) {
          return { ...validation, warning: 'Very high sulphur (> 20 ppm)' };
        }
        break;
      case 'boron':
      case 'b':
        if (value > 5.0) {
          return { ...validation, warning: 'High boron (> 5.0 ppm) - may be toxic to sensitive crops' };
        }
        if (value > 3.0 && value <= 5.0) {
          return { ...validation, warning: 'Moderate-high boron (3-5 ppm) - monitor for crop sensitivity' };
        }
        break;
    }
  }
  
  return validation;
};

/**
 * Validates pH value
 * Rules: 0 to 14
 */
export const validatePH = (ph: number): { valid: boolean; sanitized: number; error?: string } => {
  return validateNumber(ph, 0, 14, true);
};

/**
 * Validates date string (YYYY-MM-DD format)
 */
export const validateDate = (dateString: string, minDate?: Date, maxDate?: Date): { valid: boolean; sanitized: string; error?: string } => {
  if (!dateString) {
    return { valid: false, sanitized: '', error: 'Date is required' };
  }
  
  // Check format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return { valid: false, sanitized: dateString, error: 'Date must be in YYYY-MM-DD format' };
  }
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return { valid: false, sanitized: dateString, error: 'Invalid date' };
  }
  
  if (minDate && date < minDate) {
    return { valid: false, sanitized: dateString, error: `Date must be after ${minDate.toISOString().split('T')[0]}` };
  }
  
  if (maxDate && date > maxDate) {
    return { valid: false, sanitized: dateString, error: `Date must be before ${maxDate.toISOString().split('T')[0]}` };
  }
  
  return { valid: true, sanitized: dateString };
};

/**
 * Validates vehicle number plate (Indian format)
 * Rules: Format like "OD-01-AB-1234" or similar
 */
export const validateVehicleNumber = (vehicleNumber: string): { valid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeText(vehicleNumber.toUpperCase(), 15);
  
  // Indian vehicle number format: XX-XX-XX-XXXX (state-district-series-number)
  if (!/^[A-Z]{2}-?\d{1,2}-?[A-Z]{1,2}-?\d{1,4}$/.test(sanitized.replace(/-/g, ''))) {
    return { valid: false, sanitized, error: 'Invalid vehicle number format' };
  }
  
  return { valid: true, sanitized };
};

/**
 * Validates and sanitizes location string
 */
export const validateLocation = (location: string): { valid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeText(location, 200);
  
  if (sanitized.length < 3) {
    return { valid: false, sanitized, error: 'Location must be at least 3 characters' };
  }
  
  return { valid: true, sanitized };
};

/**
 * Validates crop name
 */
export const validateCropName = (cropName: string): { valid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeText(cropName, 50);
  
  const validCrops = ['Groundnut', 'Mustard', 'Soybean', 'Sunflower', 'Sesame', 'Castor', 'Niger'];
  
  if (!validCrops.includes(sanitized)) {
    return { valid: false, sanitized, error: 'Invalid crop name' };
  }
  
  return { valid: true, sanitized };
};

/**
 * Sanitizes HTML to prevent XSS
 */
export const sanitizeHTML = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Validates email format (basic)
 */
export const validateEmail = (email: string): { valid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeText(email.toLowerCase(), 100);
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return { valid: false, sanitized, error: 'Invalid email format' };
  }
  
  return { valid: true, sanitized };
};

/**
 * Validates district name (Odisha districts)
 */
export const validateDistrict = (district: string): { valid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeText(district, 50);
  
  const validDistricts = [
    'Khordha', 'Cuttack', 'Puri', 'Ganjam', 'Sundargarh', 'Koraput', 'Sambalpur',
    'Bhadrak', 'Jajpur', 'Balasore', 'Mayurbhanj', 'Keonjhar', 'Angul', 'Dhenkanal',
    'Nayagarh', 'Kendrapada', 'Jagatsinghpur', 'Boudh', 'Kandhamal', 'Rayagada',
    'Malkangiri', 'Nabarangpur', 'Nuapada', 'Bargarh', 'Jharsuguda', 'Deogarh'
  ];
  
  if (!validDistricts.includes(sanitized)) {
    return { valid: false, sanitized, error: 'Invalid district name' };
  }
  
  return { valid: true, sanitized };
};


