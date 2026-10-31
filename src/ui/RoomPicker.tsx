import { ROOMS, getRoom, type RoomId } from '../rooms';
import { Knob } from './Knob';

type Props = {
  value: RoomId;
  onChange: (id: RoomId) => void;
  // Reverb mix, 0 (dry) to 1 (wet). Shared by every room.
  mix: number;
  onMixChange: (mix: number) => void;
};

export function RoomPicker({ value, onChange, mix, onMixChange }: Props) {
  const percent = Math.round(mix * 100);
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
      <div className="rooms__mix">
        <span className="rooms__mix-label">Reverb</span>
        <span className="rooms__mix-end">Dry</span>
        <Knob
          value={mix}
          onChange={onMixChange}
          label="Reverb mix"
          valueText={`${percent}% wet`}
          defaultValue={0.5}
        />
        <span className="rooms__mix-end">Wet</span>
        <output className="rooms__mix-value">{percent}%</output>
      </div>
    </fieldset>
  );
}
