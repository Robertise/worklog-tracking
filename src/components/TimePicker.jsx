function TimePicker({ value, options, onChange, disabled, placeholder, ariaLabel }) {
  return (
    <div className="time-picker">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
    </div>
  )
}

export default TimePicker
