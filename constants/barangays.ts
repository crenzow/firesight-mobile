/**
 * Barangays of Lian, Batangas — used to populate the Barangay dropdown
 * in Step 2 of registration, and for client-side display lookups.
 * IDs match `barangay.barangay_id` in firesight_db.sql.
 */
export interface BarangayOption {
  id: number;
  name: string;
}

export const LIAN_BARANGAYS: BarangayOption[] = [
  { id: 1, name: 'Barangay 1 (Poblacion)' },
  { id: 2, name: 'Barangay 2 (Poblacion)' },
  { id: 3, name: 'Barangay 3 (Poblacion)' },
  { id: 4, name: 'Barangay 4 (Poblacion)' },
  { id: 5, name: 'Barangay 5 (Poblacion)' },
  { id: 6, name: 'Bagong Pook' },
  { id: 7, name: 'Balibago' },
  { id: 8, name: 'Binubusan' },
  { id: 9, name: 'Bungahan' },
  { id: 10, name: 'Cumba' },
  { id: 11, name: 'Humayingan' },
  { id: 12, name: 'Kapito' },
  { id: 13, name: 'Lumaniag' },
  { id: 14, name: 'Luyahan' },
  { id: 15, name: 'Malaruhatan' },
  { id: 16, name: 'Matabungkay' },
  { id: 17, name: 'Prenza' },
  { id: 18, name: 'Puting Kahoy' },
  { id: 19, name: 'San Diego' },
];