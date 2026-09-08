export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidRoomDataError extends DomainError {
  constructor(message = 'Datos de la sala inválidos. El nombre no puede estar vacío y la capacidad debe ser mayor a 0.') {
    super(message);
  }
}

export class RoomNotFoundError extends DomainError {
  constructor(roomId: string) {
    super(`No se encontró la sala con ID "${roomId}".`);
  }
}

export class InvalidDateIntervalError extends DomainError {
  constructor(message = 'El intervalo de fechas es inválido. La fecha final debe ser posterior a la fecha inicial.') {
    super(message);
  }
}

export class CapacityExceededError extends DomainError {
  constructor(attendees: number, capacity: number) {
    super(`El número de asistentes (${attendees}) excede la capacidad de la sala (${capacity}) o es inválido.`);
  }
}

export class ReservationOverlapError extends DomainError {
  constructor(roomId: string) {
    super(`La sala con ID "${roomId}" ya se encuentra reservada en el intervalo de tiempo seleccionado.`);
  }
}

export class ReservationNotFoundError extends DomainError {
  constructor(reservationId: string) {
    super(`No se encontró la reservación con ID "${reservationId}".`);
  }
}

export class ReservationAlreadyCancelledError extends DomainError {
  constructor(reservationId: string) {
    super(`La reservación con ID "${reservationId}" ya fue cancelada previamente.`);
  }
}
