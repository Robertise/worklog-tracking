function StatusToggle({ options, value, onChange, disabled }) {
  return (
    <div className="status-group" role="group">
      {options.map((option) => (
        <label key={String(option.value)} className="status-option">
          <input
            type="checkbox"
            checked={value === option.value}
            onChange={(event) => {
              if (event.target.checked) {
                onChange(option.value)
              }
            }}
            disabled={disabled}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  )
}

export default StatusToggle
