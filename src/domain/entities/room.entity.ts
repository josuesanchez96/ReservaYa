import { InvalidRoomDataError } from '../errors/domain.errors.js';

export interface RoomProps {
  id: string;
  name: string;
  capacity: number;
}

export class Room {
  readonly id: string;
  readonly name: string;
  readonly capacity: number;

  constructor(props: RoomProps) {
    if (!props.name || props.name.trim() === '' || props.capacity <= 0) {
      throw new InvalidRoomDataError();
    }
    this.id = props.id;
    this.name = props.name.trim();
    this.capacity = props.capacity;
  }
}
