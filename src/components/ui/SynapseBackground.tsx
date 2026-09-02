interface SynapseBackgroundProps {
  className?: string;
}

// Rede neural estilizada: poucos nós, conexões orgânicas e curvas — não é uma
// malha densa. Usado com moderação como assinatura visual (Login/Cadastro e
// banner do Dashboard), sempre em opacidade baixa sobre `currentColor`.
export function SynapseBackground({ className = '' }: SynapseBackgroundProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Conexões orgânicas (curvas suaves, não retas) */}
      <g stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" fill="none">
        <path d="M60,80 Q120,40 180,45" />
        <path d="M180,45 Q250,55 320,90" />
        <path d="M60,80 Q70,150 95,215" />
        <path d="M180,45 Q210,110 248,178" />
        <path d="M320,90 Q290,135 250,178" />
        <path d="M95,215 Q120,270 150,318" />
        <path d="M248,178 Q195,250 150,318" />
        <path d="M248,178 Q310,215 368,258" />
        <path d="M368,258 Q335,315 300,368" />
        <path d="M150,318 Q220,345 300,368" />
      </g>

      {/* Nós (sinapses) */}
      <g fill="currentColor">
        <circle cx="60" cy="80" r="4" />
        <circle cx="180" cy="45" r="3.5" />
        <circle cx="320" cy="90" r="4.5" />
        <circle cx="95" cy="215" r="3.5" />
        <circle cx="248" cy="178" r="5" />
        <circle cx="368" cy="258" r="4" />
        <circle cx="150" cy="318" r="4" />
        <circle cx="300" cy="368" r="3.5" />
      </g>
    </svg>
  );
}
