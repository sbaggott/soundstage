import { ROOMS, getRoom, type RoomId } from '../rooms';

type Props = {
  value: RoomId;
  onChange: (id: RoomId) => void;
};

export function RoomPicker({ value, onChange }: Props) {
  return (
    <fieldset className="rooms">
      <legend className="rooms__legend">Room</legend>
      <div className="rooms__options">
        {ROOMS.map((room) => (
          <label key={room.id} className="rooms__option">
            <input
              type="radio"
              name="room"
              value={room.id}
              checked={value === room.id}
              onChange={() => onChange(room.id)}
            />
            <span>{room.name}</span>
          </label>
        ))}
      </div>
      <p className="rooms__blurb">{getRoom(value).blurb}</p>
    </fieldset>
  );
}
