import { describe, it, expect } from 'vitest';
import { RoomReservationService } from '../../src/application/services/room-reservation.service.js';
import { InMemoryRoomRepository } from '../../src/infrastructure/repositories/in-memory-room.repository.js';
import { InMemoryReservationRepository } from '../../src/infrastructure/repositories/in-memory-reservation.repository.js';
import { ReservationOverlapError } from '../../src/domain/errors/domain.errors.js';

describe('RoomReservation Integration Flow (Real Repositories, No Mocks)', () => {
  it('should execute full reservation lifecycle: register room -> create -> overlap fail -> cancel -> verify availability -> recreate', async () => {
    // 0. Setup real in-memory dependencies
    const roomRepo = new InMemoryRoomRepository();
    const reservationRepo = new InMemoryReservationRepository();
    const service = new RoomReservationService(roomRepo, reservationRepo);

    // 1. Registrar sala con nombre y capacidad positiva
    const room = await service.registerRoom('room-magna', 'Sala Magna', 30);
    expect(room.id).toBe('room-magna');
    expect(room.name).toBe('Sala Magna');
    expect(room.capacity).toBe(30);

    const start1 = new Date('2026-10-15T10:00:00Z');
    const end1 = new Date('2026-10-15T12:00:00Z');

    // 2. Crear una reservación inicial (10:00 a 12:00)
    const reservation1 = await service.createReservation({
      id: 'res-1',
      roomId: 'room-magna',
      startDate: start1,
      endDate: end1,
      responsible: 'Dra. Isabel Torres',
      attendees: 25,
    });
    expect(reservation1.id).toBe('res-1');
    expect(reservation1.isActive()).toBe(true);

    // La disponibilidad debe ser false durante el intervalo ocupado
    const isAvailableBeforeCancel = await service.checkAvailability('room-magna', start1, end1);
    expect(isAvailableBeforeCancel).toBe(false);

    // 3. Intentar traslape (11:00 a 13:00) y verificar que se rechaza
    const startOverlap = new Date('2026-10-15T11:00:00Z');
    const endOverlap = new Date('2026-10-15T13:00:00Z');

    await expect(
      service.createReservation({
        id: 'res-overlap',
        roomId: 'room-magna',
        startDate: startOverlap,
        endDate: endOverlap,
        responsible: 'Ing. Carlos Mendoza',
        attendees: 15,
      })
    ).rejects.toThrow(ReservationOverlapError);

    // 4. Cancelar la reservación inicial
    const cancelledRes = await service.cancelReservation('res-1');
    expect(cancelledRes.status).toBe('CANCELLED');
    expect(cancelledRes.isActive()).toBe(false);

    // 5. Verificar que la disponibilidad ahora sea true para ese mismo intervalo
    const isAvailableAfterCancel = await service.checkAvailability('room-magna', start1, end1);
    expect(isAvailableAfterCancel).toBe(true);

    // 6. Crear una nueva reservación en el mismo intervalo recién liberado
    const reservation3 = await service.createReservation({
      id: 'res-3',
      roomId: 'room-magna',
      startDate: start1,
      endDate: end1,
      responsible: 'Lic. Roberto Gómez',
      attendees: 30,
    });
    expect(reservation3.id).toBe('res-3');
    expect(reservation3.isActive()).toBe(true);
  });
});
