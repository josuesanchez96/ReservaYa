import { Room } from '../../domain/entities/room.entity.js';
import { Reservation } from '../../domain/entities/reservation.entity.js';
import { DateInterval } from '../../domain/value-objects/date-interval.vo.js';
import { IRoomRepository } from '../../domain/repositories/room.repository.interface.js';
import { IReservationRepository } from '../../domain/repositories/reservation.repository.interface.js';
import {
  RoomNotFoundError,
  CapacityExceededError,
  ReservationOverlapError,
  ReservationNotFoundError,
} from '../../domain/errors/domain.errors.js';

export interface CreateReservationCommand {
  id: string;
  roomId: string;
  startDate: Date;
  endDate: Date;
  responsible: string;
  attendees: number;
}

export class RoomReservationService {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly reservationRepository: IReservationRepository
  ) {}

  async registerRoom(id: string, name: string, capacity: number): Promise<Room> {
    const room = new Room({ id, name, capacity });
    return await this.roomRepository.save(room);
  }

  async createReservation(command: CreateReservationCommand): Promise<Reservation> {
    const interval = new DateInterval(command.startDate, command.endDate);

    const room = await this.roomRepository.findById(command.roomId);
    if (!room) {
      throw new RoomNotFoundError(command.roomId);
    }

    if (command.attendees <= 0 || command.attendees > room.capacity) {
      throw new CapacityExceededError(command.attendees, room.capacity);
    }

    const activeReservations = await this.reservationRepository.findActiveByRoomId(command.roomId);

    const isOverlapping = activeReservations.some((res) =>
      res.interval.overlapsWith(interval)
    );

    if (isOverlapping) {
      throw new ReservationOverlapError(command.roomId);
    }

    const reservation = new Reservation({
      id: command.id,
      roomId: command.roomId,
      interval,
      responsible: command.responsible,
      attendees: command.attendees,
    });

    return await this.reservationRepository.save(reservation);
  }

  async cancelReservation(reservationId: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }

    reservation.cancel();
    return await this.reservationRepository.update(reservation);
  }

  async checkAvailability(roomId: string, startDate: Date, endDate: Date): Promise<boolean> {
    const interval = new DateInterval(startDate, endDate);

    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new RoomNotFoundError(roomId);
    }

    const activeReservations = await this.reservationRepository.findActiveByRoomId(roomId);

    const isOverlapping = activeReservations.some((res) =>
      res.interval.overlapsWith(interval)
    );

    return !isOverlapping;
  }
}
