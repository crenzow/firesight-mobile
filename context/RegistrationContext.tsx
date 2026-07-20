import React, { createContext, useContext, useState } from 'react';

export interface RegistrationFormState {
  // Step 1 — Personal Information
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  mobileNumber: string;
  // Step 2 — Address Information
  houseNoStreet: string;
  barangayId: number | null;
  municipality: string;
  province: string;
  // Step 3 — Account Information
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

const initialState: RegistrationFormState = {
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  mobileNumber: '',
  houseNoStreet: '',
  barangayId: null,
  municipality: 'Lian',
  province: 'Batangas',
  email: '',
  password: '',
  confirmPassword: '',
  agreedToTerms: false,
};

interface RegistrationContextValue {
  form: RegistrationFormState;
  updateForm: (patch: Partial<RegistrationFormState>) => void;
  resetForm: () => void;
}

const RegistrationContext = createContext<RegistrationContextValue | undefined>(undefined);

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [form, setForm] = useState<RegistrationFormState>(initialState);

  const updateForm = (patch: Partial<RegistrationFormState>) => setForm((prev) => ({ ...prev, ...patch }));
  const resetForm = () => setForm(initialState);

  return (
    <RegistrationContext.Provider value={{ form, updateForm, resetForm }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = (): RegistrationContextValue => {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error('useRegistration must be used within a RegistrationProvider');
  return ctx;
};