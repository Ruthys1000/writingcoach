interface Props { current: number; }

const steps = ['בחירת סוג מסמך', 'אבחון', 'למידה ותרגול'];

export function StepIndicator({ current }: Props) {
  return (
    <div className="step-indicator">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="step-item">
            <div className={`step-circle ${done ? 'done' : active ? 'active' : ''}`}>
              {done ? '✓' : n}
            </div>
            <span className={`step-label ${done ? 'done' : active ? 'active' : ''}`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`step-line ${done ? 'done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
