import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * Validates that a date is not in the past
   */
  static futureDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const inputDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (inputDate < today) {
        return { pastDate: { value: control.value } };
      }
      return null;
    };
  }

  /**
   * Validates that end date is after start date
   */
  static dateRange(startDateField: string, endDateField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const startDate = control.get(startDateField)?.value;
      const endDate = control.get(endDateField)?.value;

      if (!startDate || !endDate) return null;

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        control.get(endDateField)?.setErrors({ dateRange: true });
        return { dateRange: { startDate, endDate } };
      }

      return null;
    };
  }

  /**
   * Validates that a price is positive
   */
  static positiveNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === undefined || control.value === '') {
        return null;
      }

      const value = Number(control.value);
      if (isNaN(value) || value < 0) {
        return { positiveNumber: { value: control.value } };
      }
      return null;
    };
  }

  /**
   * Validates price is within a reasonable range
   */
  static priceRange(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === undefined || control.value === '') {
        return null;
      }

      const value = Number(control.value);
      if (isNaN(value)) {
        return { invalidPrice: { value: control.value } };
      }

      if (value < min) {
        return { minPrice: { min, actual: value } };
      }

      if (value > max) {
        return { maxPrice: { max, actual: value } };
      }

      return null;
    };
  }

  /**
   * Validates phone number format (Indian)
   */
  static phoneNumber(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      // Remove spaces and dashes
      const phone = control.value.replace(/[\s-]/g, '');

      // Indian phone: 10 digits, optionally starting with +91
      const indianPhoneRegex = /^(\+91)?[6-9]\d{9}$/;

      if (!indianPhoneRegex.test(phone)) {
        return { invalidPhone: { value: control.value } };
      }
      return null;
    };
  }

  /**
   * Validates URL format
   */
  static url(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      try {
        new URL(control.value);
        return null;
      } catch {
        return { invalidUrl: { value: control.value } };
      }
    };
  }

  /**
   * Validates time format (HH:MM)
   */
  static timeFormat(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timeRegex.test(control.value)) {
        return { invalidTime: { value: control.value } };
      }
      return null;
    };
  }

  /**
   * Validates date format (YYYY-MM-DD)
   */
  static dateFormat(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(control.value)) {
        return { invalidDateFormat: { value: control.value } };
      }

      const date = new Date(control.value);
      if (isNaN(date.getTime())) {
        return { invalidDate: { value: control.value } };
      }

      return null;
    };
  }

  /**
   * Sanitizes input to prevent XSS
   */
  static noScript(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
      const onEventRegex = /on\w+\s*=/gi;

      if (scriptRegex.test(control.value) || onEventRegex.test(control.value)) {
        return { scriptInjection: true };
      }
      return null;
    };
  }

  /**
   * Validates max attendees is greater than expected guests
   */
  static maxGreaterThanExpected(expectedField: string, maxField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const expected = control.get(expectedField)?.value;
      const max = control.get(maxField)?.value;

      if (!expected || !max) return null;

      if (Number(max) < Number(expected)) {
        control.get(maxField)?.setErrors({ maxLessThanExpected: true });
        return { maxLessThanExpected: { expected, max } };
      }

      return null;
    };
  }
}
