import { InvalidDateIntervalError } from '../errors/domain.errors.js';

export class DateInterval {
  readonly startDate: Date;
  readonly endDate: Date;

  constructor(startDate: Date, endDate: Date) {
    if (
      !startDate ||
      !endDate ||
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime()) ||
      endDate.getTime() <= startDate.getTime()
    ) {
      throw new InvalidDateIntervalError();
    }
    this.startDate = new Date(startDate.getTime());
    this.endDate = new Date(endDate.getTime());
  }

  overlapsWith(other: DateInterval): boolean {
    return (
      this.startDate.getTime() < other.endDate.getTime() &&
      other.startDate.getTime() < this.endDate.getTime()
    );
  }
}
