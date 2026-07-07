import { ShiftAssignment, Shift } from '../types';
import { isWithinInterval, areIntervalsOverlapping } from 'date-fns';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validate: (assignment: ShiftAssignment, shifts: Shift[]) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  ruleId: string;
  message: string;
  severity: 'WARNING' | 'ERROR';
}

// Example Rule: A user cannot be assigned to two overlapping shifts
export const overlappingShiftsRule: ValidationRule = {
  id: 'OVERLAPPING_SHIFTS',
  name: 'Overlapping Shifts',
  description: 'Staff cannot work multiple shifts at the same time.',
  validate: (assignment, shifts) => {
    const errors: ValidationError[] = [];
    
    // Find the shift for the current assignment
    const currentShift = shifts.find(s => s.id === assignment.shiftId);
    if (!currentShift) return { isValid: true, errors };

    // Check all other shifts for this user
    const userOtherAssignments = shifts
      .filter(s => s.id !== currentShift.id)
      .flatMap(s => s.assignments.map(a => ({ ...a, shift: s })))
      .filter(a => a.userId === assignment.userId);

    const currentInterval = {
      start: new Date(currentShift.startAt),
      end: new Date(currentShift.endAt)
    };

    const hasOverlap = userOtherAssignments.some(other => {
      const otherInterval = {
        start: new Date(other.shift.startAt),
        end: new Date(other.shift.endAt)
      };
      return areIntervalsOverlapping(currentInterval, otherInterval);
    });

    if (hasOverlap) {
      errors.push({
        ruleId: 'OVERLAPPING_SHIFTS',
        message: 'This assignment overlaps with another shift for the same staff member.',
        severity: 'ERROR'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export const runValidations = (
  assignment: ShiftAssignment, 
  shifts: Shift[], 
  rules: ValidationRule[] = [overlappingShiftsRule]
): ValidationResult => {
  const allErrors = rules.flatMap(rule => rule.validate(assignment, shifts).errors);
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};
