export const mockDepartments = [
  { id: 'dept-1', name: 'Intensive Care Unit (ICU)' },
  { id: 'dept-2', name: 'Emergency Room (ER)' },
  { id: 'dept-3', name: 'Surgery Department' },
  { id: 'dept-4', name: 'Pediatrics' },
];

const today = new Date();
today.setHours(0, 0, 0, 0); // Start of today

const createDate = (daysOffset: number, hours: number) => {
  const d = new Date(today);
  
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hours, 0, 0, 0);

  return d;
};

export const mockShifts = [
  {
    id: 'shift-1',
    departmentId: 'dept-1',
    name: 'ICU Night Cover',
    startAt: createDate(0, 20), // Today 20:00
    endAt: createDate(1, 8),    // Tomorrow 08:00 (12 hours)
    status: 'understaffed',
  },
  {
    id: 'shift-2',
    departmentId: 'dept-2',
    name: 'ER Morning',
    startAt: createDate(0, 8), // Today 08:00
    endAt: createDate(0, 14),  // Today 14:00 (6 hours)
    status: 'staffed',
  },
  {
    id: 'shift-3',
    departmentId: 'dept-3',
    name: 'Surgery Assist',
    startAt: createDate(0, 10),
    endAt: createDate(0, 13),
    status: 'overstaffed',
  },
  {
    id: 'shift-4',
    departmentId: 'dept-3',
    name: 'Quick Consult',
    startAt: createDate(0, 14),
    endAt: createDate(0, 15),
    status: 'understaffed',
  },
  {
    id: 'shift-5',
    departmentId: 'dept-4',
    name: 'Pediatrics Day',
    startAt: createDate(1, 8), // Tomorrow
    endAt: createDate(1, 16),
    status: 'staffed',
  }
];
