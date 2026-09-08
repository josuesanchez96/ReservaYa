import { Reservation } from '../../domain/entities/reservation.entity.js';
import { IReservationRepository } from '../../domain/repositories/reservation.repository.interface.js';

export class InMemoryReservationRepository implements IReservationRepository {
  private reservations: Reservation[] = [];

  async save(reservation: Reservation): Promise<Reservation> {
    this.reservations.push(reservation);
    return reservation;
  }

  async findById(id: string): Promise<Reservation | null> {
    const reservation = this.reservations.find((r) => r.id === id);
    return reservation ?? null;
  }

  async findActiveByRoomId(roomId: string): Promise<Reservation[]> {
    return this.reservations.filter((r) => r.roomId === roomId && r.isActive());
  }

  async update(reservation: Reservation): Promise<Reservation> {
    const index = this.reservations.findIndex((r) => r.id === reservation.id);
    if (index >= 0) {
      this.reservations[index] = reservation;
    }
    return reservation;
  }
}
