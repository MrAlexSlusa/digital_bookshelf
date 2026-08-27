export default function SurveyField({ question, value, onChange }) {
  const { label, type, options } = question;

  if (type === 'select') {
    return (
      <label className="field">
        <span>{label}</span>
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {(options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (type === 'scale') {
    const min = options?.min ?? 1;
    const max = options?.max ?? 5;
    return (
      <label className="field">
        <span>
          {label} {value ? `(${value})` : ''}
        </span>
        <input
          type="range"
          min={min}
          max={max}
          value={value ?? min}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }

  if (type === 'boolean') {
    return (
      <label className="field field--checkbox">
        <input
          type="checkbox"
          checked={value === 'true' || value === true}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{label}</span>
      </label>
    );
  }

  if (type === 'number') {
    return (
      <label className="field">
        <span>{label}</span>
        <input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }

  return (
    <label className="field">
      <span>{label}</span>
      <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
