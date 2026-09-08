import { DateInterval } from '../value-objects/date-interval.vo.js';
import { ReservationAlreadyCancelledError } from '../errors/domain.errors.js';

export type ReservationStatus = 'ACTIVE' | 'CANCELLED';

export interface ReservationProps {
  id: string;
  roomId: string;
  interval: DateInterval;
  responsible: string;
  attendees: number;
  status?: ReservationStatus;
}

export class Reservation {
  readonly id: string;
  readonly roomId: string;
  readonly interval: DateInterval;
  readonly responsible: string;
  readonly attendees: number;
  private _status: ReservationStatus;

  constructor(props: ReservationProps) {
    this.id = props.id;
    this.roomId = props.roomId;
    this.interval = props.interval;
    this.responsible = props.responsible.trim();
    this.attendees = props.attendees;
    this._status = props.status ?? 'ACTIVE';
  }

  get status(): ReservationStatus {
    return this._status;
  }

  isActive(): boolean {
    return this._status === 'ACTIVE';
  }

  cancel(): void {
    if (this._status === 'CANCELLED') {
      throw new ReservationAlreadyCancelledError(this.id);
    }
    this._status = 'CANCELLED';
  }
}
