import { Reservation } from '../entities/reservation.entity.js';

export interface IReservationRepository {
  save(reservation: Reservation): Promise<Reservation>;
  findById(id: string): Promise<Reservation | null>;
  findActiveByRoomId(roomId: string): Promise<Reservation[]>;
  update(reservation: Reservation): Promise<Reservation>;
}
