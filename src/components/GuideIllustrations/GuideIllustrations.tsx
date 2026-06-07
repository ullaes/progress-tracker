type IllustrationProps = {
  labels: string[];
};

export function DashboardIllustration({ labels }: IllustrationProps) {
  return (
    <svg className="guide-illustration" viewBox="0 0 720 390" role="img" aria-label={labels[0]}>
      <rect width="720" height="390" rx="20" className="guide-bg" />
      <rect x="24" y="24" width="672" height="44" rx="10" className="guide-panel" />
      <rect x="42" y="39" width="120" height="12" rx="6" className="guide-accent" />
      <rect x="470" y="35" width="62" height="20" rx="8" className="guide-button" />
      <rect x="542" y="35" width="62" height="20" rx="8" className="guide-button" />
      <rect x="614" y="35" width="62" height="20" rx="8" className="guide-button-muted" />
      <rect x="24" y="86" width="260" height="280" rx="14" className="guide-panel" />
      <circle cx="154" cy="130" r="29" className="guide-zone-medium" />
      <path d="M116 166 Q154 145 192 166 L205 238 L103 238 Z" className="guide-zone-strong" />
      <path d="M104 242 L145 245 L138 338 L104 338 Z M163 245 L204 242 L204 338 L170 338 Z" className="guide-zone-low" />
      <path d="M101 169 L75 188 L59 270 L86 276 L112 204 Z M207 169 L233 188 L249 270 L222 276 L196 204 Z" className="guide-zone-medium" />
      <rect x="304" y="86" width="392" height="280" rx="14" className="guide-panel" />
      {[0, 1, 2].map((row) => (
        <g key={row} transform={`translate(324 ${108 + row * 78})`}>
          <rect width="352" height="62" rx="10" className="guide-card" />
          <rect x="14" y="14" width={130 - row * 15} height="8" rx="4" className="guide-text" />
          <rect x="14" y="32" width="230" height="6" rx="3" className="guide-text-muted" />
          <rect x="272" y="14" width="62" height="16" rx="8" className={row === 1 ? "guide-status-warn" : "guide-status-good"} />
          <rect x="14" y="48" width={180 + row * 45} height="4" rx="2" className="guide-accent" />
        </g>
      ))}
      <text x="154" y="355" textAnchor="middle" className="guide-svg-label">{labels[1]}</text>
      <text x="500" y="355" textAnchor="middle" className="guide-svg-label">{labels[2]}</text>
    </svg>
  );
}

export function EntryIllustration({ labels }: IllustrationProps) {
  return (
    <svg className="guide-illustration" viewBox="0 0 720 390" role="img" aria-label={labels[0]}>
      <rect width="720" height="390" rx="20" className="guide-bg" />
      <rect x="36" y="32" width="648" height="326" rx="18" className="guide-panel" />
      <rect x="62" y="58" width="198" height="16" rx="8" className="guide-text" />
      <text x="62" y="108" className="guide-svg-label">{labels[1]}</text>
      <rect x="62" y="122" width="278" height="38" rx="8" className="guide-input" />
      <rect x="74" y="136" width="85" height="9" rx="4" className="guide-accent" />
      <text x="380" y="108" className="guide-svg-label">{labels[2]}</text>
      <rect x="380" y="122" width="278" height="38" rx="8" className="guide-input" />
      <rect x="392" y="136" width="105" height="9" rx="4" className="guide-text-muted" />
      <text x="62" y="203" className="guide-svg-label">{labels[3]}</text>
      <line x1="62" x2="560" y1="232" y2="232" className="guide-slider" />
      <circle cx="410" cy="232" r="12" className="guide-accent" />
      <text x="590" y="238" className="guide-svg-value">7 / 10</text>
      <rect x="62" y="278" width="138" height="42" rx="10" className="guide-button" />
      <text x="131" y="304" textAnchor="middle" className="guide-svg-button-label">{labels[4]}</text>
      <rect x="214" y="278" width="110" height="42" rx="10" className="guide-button-muted" />
    </svg>
  );
}

export function SkillsIllustration({ labels }: IllustrationProps) {
  return (
    <svg className="guide-illustration" viewBox="0 0 720 390" role="img" aria-label={labels[0]}>
      <rect width="720" height="390" rx="20" className="guide-bg" />
      <rect x="28" y="28" width="220" height="334" rx="16" className="guide-panel" />
      {[0, 1, 2, 3].map((row) => <rect key={row} x="48" y={58 + row * 56} width="180" height="40" rx="9" className={row === 1 ? "guide-selected" : "guide-card"} />)}
      <rect x="270" y="28" width="422" height="334" rx="16" className="guide-panel" />
      <rect x="294" y="54" width="170" height="12" rx="6" className="guide-text" />
      <rect x="294" y="88" width="374" height="36" rx="8" className="guide-input" />
      <rect x="294" y="142" width="178" height="36" rx="8" className="guide-input" />
      <rect x="490" y="142" width="178" height="36" rx="8" className="guide-input" />
      <text x="294" y="211" className="guide-svg-label">{labels[1]}</text>
      {[0, 1, 2, 3].map((item) => (
        <g key={item} transform={`translate(${294 + (item % 2) * 180} ${226 + Math.floor(item / 2) * 38})`}>
          <rect width="164" height="26" rx="8" className="guide-chip" />
          <text x="82" y="18" textAnchor="middle" className="guide-svg-chip-label">{labels[item + 2]}</text>
        </g>
      ))}
      <rect x="294" y="316" width="118" height="28" rx="8" className="guide-button" />
    </svg>
  );
}

export function AnalyticsIllustration({ labels }: IllustrationProps) {
  return (
    <svg className="guide-illustration" viewBox="0 0 720 390" role="img" aria-label={labels[0]}>
      <rect width="720" height="390" rx="20" className="guide-bg" />
      <rect x="28" y="28" width="664" height="334" rx="16" className="guide-panel" />
      {[0, 1, 2, 3].map((line) => <line key={line} x1="72" x2="658" y1={94 + line * 64} y2={94 + line * 64} className="guide-grid" />)}
      {[0, 1, 2, 3, 4, 5].map((bar) => (
        <rect key={bar} x={98 + bar * 92} y={286 - [70, 120, 40, 160, 90, 135][bar]} width="32" height={[70, 120, 40, 160, 90, 135][bar]} rx="5" className="guide-chart-bar" />
      ))}
      <path d="M98 265 C158 245 190 250 222 210 S315 215 370 160 S470 190 520 125 S600 130 642 88" className="guide-chart-line" />
      {[98, 222, 370, 520, 642].map((x, index) => <circle key={x} cx={x} cy={[265, 210, 160, 125, 88][index]} r="7" className="guide-chart-dot" />)}
      <text x="100" y="340" className="guide-svg-label">{labels[1]}</text>
      <text x="330" y="340" className="guide-svg-label">{labels[2]}</text>
      <text x="540" y="340" className="guide-svg-label">{labels[3]}</text>
    </svg>
  );
}
