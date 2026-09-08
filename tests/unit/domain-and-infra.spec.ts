import { describe, it, expect } from 'vitest';
import { Room } from '../../src/domain/entities/room.entity.js';
import { Reservation } from '../../src/domain/entities/reservation.entity.js';
import { DateInterval } from '../../src/domain/value-objects/date-interval.vo.js';
import {
  DomainError,
  InvalidRoomDataError,
  RoomNotFoundError,
  InvalidDateIntervalError,
  CapacityExceededError,
  ReservationOverlapError,
  ReservationNotFoundError,
  ReservationAlreadyCancelledError,
} from '../../src/domain/errors/domain.errors.js';
import { InMemoryRoomRepository } from '../../src/infrastructure/repositories/in-memory-room.repository.js';
import { InMemoryReservationRepository } from '../../src/infrastructure/repositories/in-memory-reservation.repository.js';

describe('Domain Entities & Value Objects', () => {
  describe('Room Entity', () => {
    it('should create a valid room instance', () => {
      const room = new Room({ id: 'room-1', name: ' Lab 101 ', capacity: 20 });
      expect(room.id).toBe('room-1');
      expect(room.name).toBe('Lab 101');
      expect(room.capacity).toBe(20);
    });

    it('should throw InvalidRoomDataError if name is empty or whitespace', () => {
      expect(() => new Room({ id: 'room-1', name: '', capacity: 20 })).toThrow(InvalidRoomDataError);
      expect(() => new Room({ id: 'room-1', name: '   ', capacity: 20 })).toThrow(InvalidRoomDataError);
    });

    it('should throw InvalidRoomDataError if capacity is zero or negative', () => {
      expect(() => new Room({ id: 'room-1', name: 'Room 1', capacity: 0 })).toThrow(InvalidRoomDataError);
      expect(() => new Room({ id: 'room-1', name: 'Room 1', capacity: -5 })).toThrow(InvalidRoomDataError);
    });
  });

  describe('DateInterval Value Object', () => {
    it('should create a valid DateInterval', () => {
      const start = new Date('2026-10-01T10:00:00Z');
      const end = new Date('2026-10-01T12:00:00Z');
      const interval = new DateInterval(start, end);
      expect(interval.startDate).toEqual(start);
      expect(interval.endDate).toEqual(end);
    });

    it('should throw InvalidDateIntervalError if endDate is equal to or before startDate', () => {
      const start = new Date('2026-10-01T10:00:00Z');
      const equalEnd = new Date('2026-10-01T10:00:00Z');
      const beforeEnd = new Date('2026-10-01T09:00:00Z');

      expect(() => new DateInterval(start, equalEnd)).toThrow(InvalidDateIntervalError);
      expect(() => new DateInterval(start, beforeEnd)).toThrow(InvalidDateIntervalError);
    });

    it('should throw InvalidDateIntervalError if dates are invalid or null/undefined', () => {
      const invalidDate = new Date('invalid date');
      const validDate = new Date('2026-10-01T10:00:00Z');

      expect(() => new DateInterval(invalidDate, validDate)).toThrow(InvalidDateIntervalError);
      expect(() => new DateInterval(validDate, invalidDate)).toThrow(InvalidDateIntervalError);
      expect(() => new DateInterval(null as unknown as Date, validDate)).toThrow(InvalidDateIntervalError);
      expect(() => new DateInterval(validDate, null as unknown as Date)).toThrow(InvalidDateIntervalError);
    });

    it('should calculate overlap correctly including exact minute boundary cases', () => {
      const intervalA = new DateInterval(
        new Date('2026-10-01T10:00:00Z'),
        new Date('2026-10-01T11:00:00Z')
      );

      // Touching boundary: 11:00 to 12:00 -> NO overlap
      const touchingAfter = new DateInterval(
        new Date('2026-10-01T11:00:00Z'),
        new Date('2026-10-01T12:00:00Z')
      );
      expect(intervalA.overlapsWith(touchingAfter)).toBe(false);
      expect(touchingAfter.overlapsWith(intervalA)).toBe(false);

      // Touching boundary: 09:00 to 10:00 -> NO overlap
      const touchingBefore = new DateInterval(
        new Date('2026-10-01T09:00:00Z'),
        new Date('2026-10-01T10:00:00Z')
      );
      expect(intervalA.overlapsWith(touchingBefore)).toBe(false);

      // Overlapping by 1 minute: 10:59 to 12:00 -> OVERLAP
      const overlap1Min = new DateInterval(
        new Date('2026-10-01T10:59:00Z'),
        new Date('2026-10-01T12:00:00Z')
      );
      expect(intervalA.overlapsWith(overlap1Min)).toBe(true);

      // Entirely inside: 10:15 to 10:45 -> OVERLAP
      const inside = new DateInterval(
        new Date('2026-10-01T10:15:00Z'),
        new Date('2026-10-01T10:45:00Z')
      );
      expect(intervalA.overlapsWith(inside)).toBe(true);
    });
  });

  describe('Reservation Entity', () => {
    it('should create reservation with ACTIVE status default', () => {
      const interval = new DateInterval(
        new Date('2026-10-01T10:00:00Z'),
        new Date('2026-10-01T11:00:00Z')
      );
      const res = new Reservation({
        id: 'res-1',
        roomId: 'room-1',
        interval,
        responsible: 'Juan Pérez',
        attendees: 15,
      });

      expect(res.id).toBe('res-1');
      expect(res.status).toBe('ACTIVE');
      expect(res.isActive()).toBe(true);
    });

    it('should cancel reservation and throw error if cancelled twice', () => {
      const interval = new DateInterval(
        new Date('2026-10-01T10:00:00Z'),
        new Date('2026-10-01T11:00:00Z')
      );
      const res = new Reservation({
        id: 'res-1',
        roomId: 'room-1',
        interval,
        responsible: 'Juan Pérez',
        attendees: 15,
      });

      res.cancel();
      expect(res.status).toBe('CANCELLED');
      expect(res.isActive()).toBe(false);

      expect(() => res.cancel()).toThrow(ReservationAlreadyCancelledError);
    });
  });

  describe('Custom Domain Errors', () => {
    it('should instantiate error classes with default and custom messages', () => {
      const customErr = new InvalidRoomDataError('Custom room err');
      expect(customErr.message).toBe('Custom room err');

      const roomNotFound = new RoomNotFoundError('r-99');
      expect(roomNotFound.message).toContain('r-99');

      const dateErr = new InvalidDateIntervalError();
      expect(dateErr.message).toContain('intervalo de fechas');

      const capErr = new CapacityExceededError(50, 30);
      expect(capErr.message).toContain('50');

      const overlapErr = new ReservationOverlapError('r-1');
      expect(overlapErr.message).toContain('r-1');

      const resNotFound = new ReservationNotFoundError('res-99');
      expect(resNotFound.message).toContain('res-99');

      const cancelErr = new ReservationAlreadyCancelledError('res-1');
      expect(cancelErr.message).toContain('res-1');
    });
  });

  describe('Infrastructure Repositories', () => {
    it('InMemoryRoomRepository should save, find, and update rooms', async () => {
      const repo = new InMemoryRoomRepository();
      const room1 = new Room({ id: 'r-1', name: 'Sala A', capacity: 10 });
      const room2 = new Room({ id: 'r-2', name: 'Sala B', capacity: 20 });

      await repo.save(room1);
      await repo.save(room2);

      expect(await repo.findById('r-1')).toEqual(room1);
      expect(await repo.findById('r-unknown')).toBeNull();

      const all = await repo.findAll();
      expect(all).toHaveLength(2);

      // Update room1
      const updatedRoom1 = new Room({ id: 'r-1', name: 'Sala A Modified', capacity: 15 });
      await repo.save(updatedRoom1);
      expect(await repo.findById('r-1')).toEqual(updatedRoom1);
      expect(await repo.findAll()).toHaveLength(2);
    });

    it('InMemoryReservationRepository should save, find, filter active, and update reservations', async () => {
      const repo = new InMemoryReservationRepository();
      const interval = new DateInterval(
        new Date('2026-10-01T10:00:00Z'),
        new Date('2026-10-01T11:00:00Z')
      );
      const res1 = new Reservation({
        id: 'res-1',
        roomId: 'r-1',
        interval,
        responsible: 'Maria',
        attendees: 5,
      });

      await repo.save(res1);

      expect(await repo.findById('res-1')).toEqual(res1);
      expect(await repo.findById('res-unknown')).toBeNull();

      let active = await repo.findActiveByRoomId('r-1');
      expect(active).toHaveLength(1);

      res1.cancel();
      await repo.update(res1);

      active = await repo.findActiveByRoomId('r-1');
      expect(active).toHaveLength(0);

      // Updating non-existent reservation should safely do nothing
      const nonExistentRes = new Reservation({
        id: 'res-999',
        roomId: 'r-1',
        interval,
        responsible: 'Ghost',
        attendees: 1,
      });
      await repo.update(nonExistentRes);
      expect(await repo.findById('res-999')).toBeNull();
    });
  });
});
