interface HoneypotFieldProps {
  value: string;
  onChange: (value: string) => void;
}

// Campo anti-bot: fica fora da tela (não usa display:none, que alguns bots
// detectam), fora da ordem de tab e escondido de leitores de tela. Nenhum
// humano preenche; se vier preenchido, o backend devolve um sucesso falso.
export function HoneypotField({ value, onChange }: HoneypotFieldProps) {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}
    >
      <label htmlFor="website">Website</label>
      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
