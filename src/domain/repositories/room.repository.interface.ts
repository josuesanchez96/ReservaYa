import { Room } from '../entities/room.entity.js';

export interface IRoomRepository {
  save(room: Room): Promise<Room>;
  findById(id: string): Promise<Room | null>;
  findAll(): Promise<Room[]>;
}
