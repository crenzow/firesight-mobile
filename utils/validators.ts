export const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isValidPHMobile = (value: string): boolean => {
  const digitsOnly = value.replace(/\D/g, '');
  // Accepts 09XXXXXXXXX (11 digits) or +639XXXXXXXXX
  return /^(09\d{9})$/.test(digitsOnly) || /^(639\d{9})$/.test(digitsOnly);
};

export const passwordStrength = (value: string): 'weak' | 'fair' | 'strong' => {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  if (score <= 1) return 'weak';
  if (score <= 3) return 'fair';
  return 'strong';
};

export const validateRegisterStep1 = (fields: {
  firstName: string;
  lastName: string;
  mobileNumber: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!fields.firstName.trim()) errors.firstName = 'First name is required.';
  if (!fields.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!fields.mobileNumber.trim()) {
    errors.mobileNumber = 'Mobile number is required.';
  } else if (!isValidPHMobile(fields.mobileNumber)) {
    errors.mobileNumber = 'Enter a valid PH mobile number (e.g. 09XX XXX XXXX).';
  }
  return errors;
};

export const validateRegisterStep2 = (fields: {
  barangayId: number | null;
  municipality: string;
  province: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!fields.barangayId) errors.barangayId = 'Please select your barangay.';
  if (!fields.municipality.trim()) errors.municipality = 'Municipality is required.';
  if (!fields.province.trim()) errors.province = 'Province is required.';
  return errors;
};

export const validateRegisterStep3 = (fields: {
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!fields.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(fields.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!fields.password) {
    errors.password = 'Password is required.';
  } else if (fields.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (fields.confirmPassword !== fields.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  if (!fields.agreedToTerms) {
    errors.agreedToTerms = 'You must agree to the Terms of Service and Privacy Policy.';
  }
  return errors;
};

export const validateLogin = (fields: { email: string; password: string }): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!fields.email.trim()) errors.email = 'Email address is required.';
  else if (!isValidEmail(fields.email)) errors.email = 'Enter a valid email address.';
  if (!fields.password) errors.password = 'Password is required.';
  return errors;
};