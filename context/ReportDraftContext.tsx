import React, { createContext, useContext, useState } from 'react';
import { CapturedLocation } from '../hooks/useLocation';

export interface ReportDraft {
  photoUri: string | null;
  location: CapturedLocation | null;
  barangayId: number | null;
  description: string;
}

const initialDraft: ReportDraft = {
  photoUri: null,
  location: null,
  barangayId: null,
  description: '',
};

interface ReportDraftContextValue {
  draft: ReportDraft;
  updateDraft: (patch: Partial<ReportDraft>) => void;
  resetDraft: () => void;
}

const ReportDraftContext = createContext<ReportDraftContextValue | undefined>(undefined);

export const ReportDraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draft, setDraft] = useState<ReportDraft>(initialDraft);

  const updateDraft = (patch: Partial<ReportDraft>) => setDraft((prev) => ({ ...prev, ...patch }));
  const resetDraft = () => setDraft(initialDraft);

  return (
    <ReportDraftContext.Provider value={{ draft, updateDraft, resetDraft }}>{children}</ReportDraftContext.Provider>
  );
};

export const useReportDraft = (): ReportDraftContextValue => {
  const ctx = useContext(ReportDraftContext);
  if (!ctx) throw new Error('useReportDraft must be used within a ReportDraftProvider');
  return ctx;
};