// constants/appConstants.js

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
  'Accounts',
];

// export const POSITIONS = [
// 'Ass. Manager',
// 'Assistant',
// 'Assistant Supervisor',
// 'Data entry operator',
// 'Electical Wireman',
// 'Engineer',
// 'Executive',
// 'Fitter',
// 'Foreman',
// 'GET',
// 'Head',
// 'Helper',
// 'In-Charge',
// 'Inspector',
// 'Jr. Packing Supervisor',
// 'Manager',
// 'Operator',
// 'Packer',
// 'Packing Supervisor',
// 'Receptions',
// 'Shift Engineer',
// 'Shift Executive',
// 'Shift Leader',
// 'Shift Supervisor',
// 'Sr. Electrical Engineer',
// 'Sr. Officer',
// 'Supervisor',
// 'Team Member',
// 'Technician',
// 'Trainee',
// 'Trainee Engineer',
// 'Welder'
// ];

export const ROLES = [
  'admin',
  'qa-officer',
  'department-head',
  'user',
];

export const RATINGS = [
  { value: 5, label: 'Excellent', color: 'bg-green-500' },
  { value: 4, label: 'Good',      color: 'bg-blue-500'  },
  { value: 3, label: 'Average',   color: 'bg-yellow-500'},
  { value: 2, label: 'Poor',      color: 'bg-orange-500'},
  { value: 1, label: 'N/A',       color: 'bg-gray-400'  },
];

// Departments whose topics apply to ALL employees regardless of their own department
export const UNIVERSAL_DEPARTMENTS = [
  'Top Management',
  'HSE',
  'HR',
];

// Training duration options (in hours)
export const TRAINING_DURATIONS = [
  '0.5 hr',
  '1 hr',
  '1.5 hrs',
  '2 hrs',
  '2.5 hrs',
  '3 hrs',
  '4 hrs',
  '6 hrs',
  '8 hrs',
  '1 Day',
  '2 Days',
  '3 Days',
  '1 Week',
];