import { Room } from '../../domain/entities/room.entity.js';
import { IRoomRepository } from '../../domain/repositories/room.repository.interface.js';

export class InMemoryRoomRepository implements IRoomRepository {
  private rooms: Room[] = [];

  async save(room: Room): Promise<Room> {
    const existingIndex = this.rooms.findIndex((r) => r.id === room.id);
    if (existingIndex >= 0) {
      this.rooms[existingIndex] = room;
    } else {
      this.rooms.push(room);
    }
    return room;
  }

  async findById(id: string): Promise<Room | null> {
    const room = this.rooms.find((r) => r.id === id);
    return room ?? null;
  }

  async findAll(): Promise<Room[]> {
    return [...this.rooms];
  }
}
