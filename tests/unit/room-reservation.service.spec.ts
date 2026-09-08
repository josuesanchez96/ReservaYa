import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomReservationService } from '../../src/application/services/room-reservation.service.js';
import { Room } from '../../src/domain/entities/room.entity.js';
import { Reservation } from '../../src/domain/entities/reservation.entity.js';
import { DateInterval } from '../../src/domain/value-objects/date-interval.vo.js';
import { IRoomRepository } from '../../src/domain/repositories/room.repository.interface.js';
import { IReservationRepository } from '../../src/domain/repositories/reservation.repository.interface.js';
import {
  RoomNotFoundError,
  CapacityExceededError,
  ReservationOverlapError,
  ReservationNotFoundError,
  ReservationAlreadyCancelledError,
  InvalidDateIntervalError,
} from '../../src/domain/errors/domain.errors.js';

describe('RoomReservationService (Unit Tests with Mocks)', () => {
  let service: RoomReservationService;
  let mockRoomRepo: IRoomRepository;
  let mockReservationRepo: IReservationRepository;

  beforeEach(() => {
    mockRoomRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
    };

    mockReservationRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findActiveByRoomId: vi.fn(),
      update: vi.fn(),
    };

    service = new RoomReservationService(mockRoomRepo, mockReservationRepo);
  });

  describe('registerRoom', () => {
    it('should register a valid room successfully', async () => {
      const roomToSave = new Room({ id: 'r-1', name: 'Auditorio', capacity: 100 });
      vi.mocked(mockRoomRepo.save).mockResolvedValue(roomToSave);

      const result = await service.registerRoom('r-1', 'Auditorio', 100);

      expect(mockRoomRepo.save).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('r-1');
      expect(result.capacity).toBe(100);
    });
  });

  describe('createReservation', () => {
    const defaultRoom = new Room({ id: 'r-100', name: 'Sala Beta', capacity: 10 });
    const startDate = new Date('2026-10-01T10:00:00Z');
    const endDate = new Date('2026-10-01T11:00:00Z');

    it('should create reservation successfully when capacity is exact equal to room capacity', async () => {
      vi.mocked(mockRoomRepo.findById).mockResolvedValue(defaultRoom);
      vi.mocked(mockReservationRepo.findActiveByRoomId).mockResolvedValue([]);
      vi.mocked(mockReservationRepo.save).mockImplementation(async (res) => res);

      const result = await service.createReservation({
        id: 'res-1',
        roomId: 'r-100',
        startDate,
        endDate,
        responsible: 'Profesor X',
        attendees: 10, // Exact capacity limit
      });

      expect(result.id).toBe('res-1');
      expect(result.attendees).toBe(10);
      expect(mockReservationRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw CapacityExceededError when attendees exceed capacity by exactly 1', async () => {
      vi.mocked(mockRoomRepo.findById).mockResolvedValue(defaultRoom);

      await expect(
        service.createReservation({
          id: 'res-2',
          roomId: 'r-100',
          startDate,
          endDate,
          responsible: 'Profesor X',
          attendees: 11, // Capacity is 10
        })
      ).rejects.toThrow(CapacityExceededError);
    });

    it('should throw CapacityExceededError when attendees is 0 or negative', async () => {
      vi.mocked(mockRoomRepo.findById).mockResolvedValue(defaultRoom);

      await expect(
        service.createReservation({
          id: 'res-3',
          roomId: 'r-100',
          startDate,
          endDate,
          responsible: 'Profesor X',
          attendees: 0,
        })
      ).rejects.toThrow(CapacityExceededError);

      await expect(
        service.createReservation({
          id: 'res-3b',
          roomId: 'r-100',
          startDate,
          endDate,
          responsible: 'Profesor X',
          attendees: -5,
        })
      ).rejects.toThrow(CapacityExceededError);
    });

    it('should throw RoomNotFoundError if the room does not exist', async () => {
      vi.mocked(mockRoomRepo.findById).mockResolvedValue(null);

      await expect(
        service.createReservation({
          id: 'res-4',
          roomId: 'non-existent',
          startDate,
          endDate,
          responsible: 'Profesor X',
          attendees: 5,
        })
      ).rejects.toThrow(RoomNotFoundError);
    });

    it('should throw InvalidDateIntervalError if endDate is before or equal to startDate', async () => {
      await expect(
        service.createReservation({
          id: 'res-5',
          roomId: 'r-100',
          startDate: new Date('2026-10-01T12:00:00Z'),
          endDate: new Date('2026-10-01T10:00:00Z'),
          responsible: 'Profesor X',
          attendees: 5,
        })
      ).rejects.toThrow(InvalidDateIntervalError);
    });

    it('should throw ReservationOverlapError if active reservation overlaps', async () => {
      vi.mocked(mockRoomRepo.findById).mockResolvedValue(defaultRoom);
      const existingRes = new Reservation({
        id: 'res-existing',
        roomId: 'r-100',
        interval: new DateInterval(startDate, endDate), // 10:00 to 11:00
        responsible: 'Juan',
        attendees: 4,
      });
      vi.mocked(mockReservationRepo.findActiveByRoomId).mockResolvedValue([existingRes]);

      // Attempt reservation from 10:30 to 11:30
      await expect(
        service.createReservation({
          id: 'res-new',
          roomId: 'r-100',
          startDate: new Date('2026-10-01T10:30:00Z'),
          endDate: new Date('2026-10-01T11:30:00Z'),
          responsible: 'Ana',
          attendees: 5,
        })
      ).rejects.toThrow(ReservationOverlapError);
    });

    it('should allow reservation when intervals touch at the exact same minute', async () => {
      vi.mocked(mockRoomRepo.findById).mockResolvedValue(defaultRoom);
      const existingRes = new Reservation({
        id: 'res-existing',
        roomId: 'r-100',
        interval: new DateInterval(startDate, endDate), // 10:00 to 11:00
        responsible: 'Juan',
        attendees: 4,
      });
      vi.mocked(mockReservationRepo.findActiveByRoomId).mockResolvedValue([existingRes]);
      vi.mocked(mockReservationRepo.save).mockImplementation(async (res) => res);

      // Attempt reservation starting at 11:00 to 12:00 (touches existing end date)
      const result = await service.createReservation({
        id: 'res-touching',
        roomId: 'r-100',
        startDate: new Date('2026-10-01T11:00:00Z'),
        endDate: new Date('2026-10-01T12:00:00Z'),
        responsible: 'Carlos',
        attendees: 5,
      });

      expect(result.id).toBe('res-touching');
    });
  });

  describe('cancelReservation', () => {
    it('should cancel reservation successfully', async () => {
      const reservation = new Reservation({
        id: 'res-1',
        roomId: 'r-1',
        interval: new DateInterval(new Date('2026-10-01T10:00:00Z'), new Date('2026-10-01T11:00:00Z')),
        responsible: 'Pedro',
        attendees: 5,
      });
      vi.mocked(mockReservationRepo.findById).mockResolvedValue(reservation);
      vi.mocked(mockReservationRepo.update).mockImplementation(async (res) => res);

      const cancelled = await service.cancelReservation('res-1');

      expect(cancelled.status).toBe('CANCELLED');
      expect(mockReservationRepo.update).toHaveBeenCalledTimes(1);
    });

    it('should throw ReservationNotFoundError if reservation is not found', async () => {
      vi.mocked(mockReservationRepo.findById).mockResolvedValue(null);

      await expect(service.cancelReservation('res-404')).rejects.toThrow(ReservationNotFoundError);
    });

    it('should throw ReservationAlreadyCancelledError if already cancelled', async () => {
      const reservation = new Reservation({
        id: 'res-1',
        roomId: 'r-1',
        interval: new DateInterval(new Date('2026-10-01T10:00:00Z'), new Date('2026-10-01T11:00:00Z')),
        responsible: 'Pedro',
        attendees: 5,
      });
      reservation.cancel();
      vi.mocked(mockReservationRepo.findById).mockResolvedValue(reservation);

      await expect(service.cancelReservation('res-1')).rejects.toThrow(ReservationAlreadyCancelledError);
    });
  });

  describe('checkAvailability', () => {
    const room = new Room({ id: 'r-1', name: 'Sala 1', capacity: 10 });
    const start = new Date('2026-10-01T10:00:00Z');
    const end = new Date('2026-10-01T11:00:00Z');

    it('should return true if room has no active reservations', async () => {
      vi.mocked(mockRoomRepo.findById).mockResolvedValue(room);
      vi.mocked(mockReservationRepo.findActiveByRoomId).mockResolvedValue([]);

      const available = await service.checkAvailability('r-1', start, end);
      expect(available).toBe(true);
    });

    it('should return false if room has an overlapping reservation', async () => {
      vi.mocked(mockRoomRepo.findById).mockResolvedValue(room);
      const activeRes = new Reservation({
        id: 'res-1',
        roomId: 'r-1',
        interval: new DateInterval(start, end),
        responsible: 'Lucia',
        attendees: 3,
      });
      vi.mocked(mockReservationRepo.findActiveByRoomId).mockResolvedValue([activeRes]);

      const available = await service.checkAvailability('r-1', start, end);
      expect(available).toBe(false);
    });

    it('should throw RoomNotFoundError when room does not exist', async () => {
      vi.mocked(mockRoomRepo.findById).mockResolvedValue(null);

      await expect(service.checkAvailability('r-404', start, end)).rejects.toThrow(RoomNotFoundError);
    });

    it('should throw InvalidDateIntervalError if date range is invalid', async () => {
      await expect(service.checkAvailability('r-1', end, start)).rejects.toThrow(InvalidDateIntervalError);
    });
  });
});
