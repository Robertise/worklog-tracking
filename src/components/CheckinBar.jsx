import TimePicker from './TimePicker'
import { CHECKIN_OPTIONS } from '../utils/time'

function CheckinBar({ checkIn, checkOut, onUpdate, readOnly }) {
  return (
    <div className="checkin-panel">
      <div className="entry-grid">
        <label className="entry-field entry-field-half">
          <span className="field-caption">Check-in</span>
          <TimePicker
            value={checkIn}
            options={CHECKIN_OPTIONS}
            onChange={(value) => onUpdate('checkIn', value)}
            disabled={readOnly}
            ariaLabel="Check-in time"
          />
        </label>
        <label className="entry-field entry-field-half">
          <span className="field-caption">Check-out</span>
          <TimePicker
            value={checkOut}
            options={CHECKIN_OPTIONS}
            onChange={(value) => onUpdate('checkOut', value)}
            disabled={readOnly}
            ariaLabel="Check-out time"
          />
        </label>
      </div>
    </div>
  )
}

export default CheckinBar
