// FILE: constants/index.js
// ============================================
export const DEPARTMENTS = [
  'Top Management',
  'Marketing',
  'Purchase',
  'Store',
  'Warehouse',
  'Maintenance',
  'Production',
  'Quality Control',
  'HSE',
  'HR',
  'Dispatch',
  'IT',
  'Accounts'
];

export const ROLES = [
  'admin',
  'qa-officer',
  'department-head',
  'user',
];

export const RATINGS = [
  { value: 5, label: 'Excellent', color: 'bg-green-500' },
  { value: 4, label: 'Good', color: 'bg-blue-500' },
  { value: 3, label: 'Average', color: 'bg-yellow-500' },
  { value: 2, label: 'Poor', color: 'bg-orange-500' },
  { value: 1, label: 'N/A', color: 'bg-gray-400' }
];

// Add at top of file after other constants
export const UNIVERSAL_DEPARTMENTS = [
  'Top Management', 
  'HSE', 
  'HR'
];