/*
 * Fișă de fixare construită direct în lecție (în locul posterelor-imagine).
 * Conținutul vine din date (vezi data/theory/lessonSheets.js) și e compus din
 * blocuri tipizate: definiții, reguli, scări, diagrame Venn, arbori, tabele, pași.
 */

const tones = {
  blue: { chip: "bg-blue-600 text-white", soft: "border-blue-200 bg-blue-50/70", ink: "text-blue-900", stroke: "#2563eb", fill: "rgba(37,99,235,0.10)" },
  green: { chip: "bg-emerald-600 text-white", soft: "border-emerald-200 bg-emerald-50/70", ink: "text-emerald-900", stroke: "#059669", fill: "rgba(5,150,105,0.10)" },
  amber: { chip: "bg-amber-500 text-white", soft: "border-amber-200 bg-amber-50/80", ink: "text-amber-900", stroke: "#d97706", fill: "rgba(217,119,6,0.12)" },
  red: { chip: "bg-rose-600 text-white", soft: "border-rose-200 bg-rose-50/80", ink: "text-rose-900", stroke: "#e11d48", fill: "rgba(225,29,72,0.10)" },
  purple: { chip: "bg-violet-600 text-white", soft: "border-violet-200 bg-violet-50/70", ink: "text-violet-900", stroke: "#7c3aed", fill: "rgba(124,58,237,0.10)" },
  slate: { chip: "bg-slate-800 text-white", soft: "border-slate-200 bg-slate-50", ink: "text-slate-900", stroke: "#334155", fill: "rgba(51,65,85,0.08)" },
}

const toneOf = (tone) => tones[tone] ?? tones.blue

function Num({ children, tone }) {
  return (
    <span
      className={`inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-2 text-xs font-bold ${toneOf(tone).chip}`}
    >
      {children}
    </span>
  )
}

function BlockTitle({ number, title, tone }) {
  if (!title) return null
  return (
    <div className="mb-3 flex items-center gap-2.5">
      {number ? <Num tone={tone}>{number}</Num> : null}
      <h4 className="text-[0.95rem] font-semibold uppercase tracking-[0.08em] text-slate-800">{title}</h4>
    </div>
  )
}

function Rich({ text }) {
  // **cuvânt** → evidențiat; `SaP` → notație logică
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, index) => {
    if (part.startsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith("`")) {
      return (
        <span key={index} className="whitespace-nowrap font-mono text-[1.05em] font-bold text-blue-800">
          {part.slice(1, -1)}
        </span>
      )
    }
    return <span key={index}>{part}</span>
  })
}

/* ---------- blocuri ---------- */

function DefinitionBlock({ block }) {
  const tone = toneOf(block.tone)
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${tone.soft}`}>
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      <p className="text-[0.95rem] leading-7 text-slate-700">
        <Rich text={block.text} />
      </p>
    </div>
  )
}

function PairBlock({ block }) {
  return (
    <div>
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      <div className="grid gap-3 sm:grid-cols-2">
        {block.items.map((item) => {
          const tone = toneOf(item.tone)
          return (
            <div key={item.term} className={`rounded-2xl border p-4 ${tone.soft}`}>
              <p className={`text-lg font-semibold ${tone.ink}`}>{item.term}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                <Rich text={item.text} />
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RuleBlock({ block }) {
  const tone = toneOf(block.tone ?? "red")
  return (
    <div className={`rounded-2xl border-2 p-4 sm:p-5 ${tone.soft}`}>
      <BlockTitle number={block.number} title={block.title} tone={block.tone ?? "red"} />
      <p className="text-base font-medium leading-7 text-slate-800">
        <Rich text={block.text} />
      </p>
    </div>
  )
}

function DotsCircle({ count, tone }) {
  // cerc cu puncte (dispunere tip floarea-soarelui): cât de mare e sfera
  const golden = Math.PI * (3 - Math.sqrt(5))
  const spread = 23 / Math.sqrt(Math.max(count, 1))
  const dots = Array.from({ length: count }, (_, k) => {
    const radius = count === 1 ? 0 : spread * Math.sqrt(k + 0.5)
    return [32 + radius * Math.cos(k * golden), 32 + radius * Math.sin(k * golden)]
  })
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="white" stroke={toneOf(tone).stroke} strokeWidth="1.5" />
      {dots.map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r="2.1" fill={toneOf(tone).stroke} />
      ))}
    </svg>
  )
}

function LadderBlock({ block }) {
  const widths = ["w-full", "w-[80%]", "w-[62%]"]
  return (
    <div>
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      {block.caption ? <p className="mb-3 text-sm text-slate-500">{block.caption}</p> : null}
      <div className="grid max-w-3xl gap-2.5">
        {block.steps.map((step, index) => (
          <div key={step.term} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[150px_minmax(0,1fr)_150px]">
            <div className="flex items-center justify-center">
              <span
                className={`${widths[index] ?? "w-full"} rounded-xl border border-slate-300 bg-white py-2 text-center text-lg font-semibold text-slate-900 shadow-[0_6px_14px_-12px_rgba(15,23,42,0.5)]`}
              >
                {step.term}
              </span>
            </div>
            <p className="col-span-2 row-start-2 text-sm leading-6 text-slate-600 sm:col-span-1 sm:row-start-auto">
              <span className="font-semibold text-slate-800">Conținut: </span>
              {step.content}
            </p>
            <div className="col-start-2 row-start-1 flex items-center gap-2 sm:col-start-auto sm:row-start-auto">
              <DotsCircle count={step.dots} tone={block.tone} />
              <span className="w-20 text-xs leading-4 text-slate-500">
                <span className="block font-semibold uppercase tracking-wide text-slate-700">Sferă</span>
                {step.sphere}
              </span>
            </div>
          </div>
        ))}
      </div>
      {block.note ? <p className="mt-3 text-sm italic text-slate-500">{block.note}</p> : null}
    </div>
  )
}

function Venn({ kind, frame }) {
  const a = tones.green
  const b = tones.blue
  const text = { fontSize: 13, fontWeight: 600, fill: "#1e293b", textAnchor: "middle", dominantBaseline: "middle" }
  return (
    <svg viewBox="0 0 140 84" className="h-20 w-full" role="img" aria-label={kind}>
      {frame ? (
        <>
          <rect x="3" y="3" width="134" height="78" rx="8" fill="none" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" />
          <text x="10" y="14" fontSize="8.5" fill="#64748b" fontWeight="600">{frame}</text>
        </>
      ) : null}
      <g transform={frame ? "translate(12 12) scale(0.83)" : undefined}>
      {kind === "identitate" && (
        <>
          <circle cx="70" cy="42" r="32" fill={a.fill} stroke={a.stroke} strokeWidth="2" />
          <text x="70" y="42" {...text}>A = B</text>
        </>
      )}
      {kind === "subordonare" && (
        <>
          <circle cx="70" cy="42" r="36" fill={a.fill} stroke={a.stroke} strokeWidth="2" />
          <circle cx="82" cy="52" r="17" fill="white" stroke={b.stroke} strokeWidth="2" />
          <text x="52" y="30" {...text}>A</text>
          <text x="82" y="52" {...text}>B</text>
        </>
      )}
      {kind === "incrucisare" && (
        <>
          <circle cx="54" cy="42" r="30" fill={a.fill} stroke={a.stroke} strokeWidth="2" />
          <circle cx="86" cy="42" r="30" fill={b.fill} stroke={b.stroke} strokeWidth="2" />
          <text x="40" y="42" {...text}>A</text>
          <text x="100" y="42" {...text}>B</text>
        </>
      )}
      {kind === "contrarietate" && (
        <>
          <circle cx="40" cy="42" r="26" fill={a.fill} stroke={a.stroke} strokeWidth="2" />
          <circle cx="100" cy="42" r="26" fill={b.fill} stroke={b.stroke} strokeWidth="2" />
          <text x="40" y="42" {...text}>A</text>
          <text x="100" y="42" {...text}>B</text>
        </>
      )}
      {kind === "contradictie" && (
        <>
          <clipPath id="venn-contra-left"><rect x="0" y="0" width="70" height="84" /></clipPath>
          <clipPath id="venn-contra-right"><rect x="70" y="0" width="70" height="84" /></clipPath>
          <ellipse cx="70" cy="42" rx="48" ry="32" fill={a.fill} stroke={a.stroke} strokeWidth="2" clipPath="url(#venn-contra-left)" />
          <ellipse cx="70" cy="42" rx="48" ry="32" fill={tones.red.fill} stroke={tones.red.stroke} strokeWidth="2" clipPath="url(#venn-contra-right)" />
          <line x1="70" y1="10" x2="70" y2="74" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="48" y="42" {...text}>A</text>
          <text x="94" y="42" {...text} fill="#be123c">non-A</text>
        </>
      )}
      </g>
    </svg>
  )
}

function RelationsBlock({ block }) {
  return (
    <div>
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {block.items.map((item, index) => (
          <div key={item.kind} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3 text-center">
            <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-800">
              <span className="text-xs text-slate-400">{index + 1}.</span>
              {item.name}
            </p>
            <Venn kind={item.kind} frame={item.frame} />
            {item.text ? <p className="mb-2 text-xs leading-5 text-slate-600">{item.text}</p> : null}
            <p className="mt-auto text-xs leading-5 text-slate-500">
              <span className="font-semibold text-slate-700">Ex.: </span>
              {item.example}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TreeBlock({ block }) {
  return (
    <div>
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex justify-center">
          <span className="rounded-xl border-2 border-slate-800 px-5 py-1.5 text-lg font-semibold text-slate-900">
            {block.root}
          </span>
        </div>
        {block.criterion ? (
          <p className="mt-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
            criteriu: {block.criterion}
          </p>
        ) : null}
        <div
          className="relative mt-3 grid gap-2 pt-4"
          style={{ gridTemplateColumns: `repeat(${block.branches.length}, minmax(0, 1fr))` }}
        >
          <span
            className="absolute top-0 h-px bg-slate-300"
            style={{ left: `${50 / block.branches.length}%`, right: `${50 / block.branches.length}%` }}
            aria-hidden="true"
          />
          {block.branches.map((branch) => (
            <div key={branch.label} className="relative flex flex-col items-center gap-2 text-center">
              <span className="absolute -top-4 h-4 w-px bg-slate-300" aria-hidden="true" />
              <span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-900">
                {branch.label}
              </span>
              {branch.examples ? <span className="text-xs text-slate-500">{branch.examples}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ListBlock({ block }) {
  const tone = toneOf(block.tone)
  return (
    <div className={`rounded-2xl border p-4 ${tone.soft}`}>
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      <ol className="grid gap-2">
        {block.items.map((item, index) => (
          <li key={index} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700">
            <Num tone={block.tone}>{index + 1}</Num>
            <span className="pt-0.5">
              <Rich text={item} />
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function CompareBlock({ block }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {[block.good, block.bad].map((side, index) => {
        const good = index === 0
        const tone = toneOf(good ? "green" : "red")
        return (
          <div key={side.title} className={`rounded-2xl border p-4 ${tone.soft}`}>
            <p className={`mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide ${tone.ink}`}>
              <span aria-hidden="true" className={`inline-grid h-6 w-6 place-items-center rounded-full text-sm ${tone.chip}`}>
                {good ? "✓" : "✕"}
              </span>
              {side.title}
            </p>
            {side.text ? (
              <p className="text-base leading-7 text-slate-800">
                <Rich text={side.text} />
              </p>
            ) : (
            <p className="text-sm leading-6 text-slate-700">
              <span className="font-semibold text-slate-900">{side.root}</span> → {side.criterion ? <span className="text-slate-500">{side.criterion}: </span> : null}
              {side.parts.map((part, partIndex) => (
                <span key={part}>
                  <span className="mx-0.5 inline-block rounded-md border border-slate-300 bg-white px-2 py-0.5 text-slate-800">{part}</span>
                  {partIndex < side.parts.length - 1 ? " / " : null}
                </span>
              ))}
            </p>
            )}
            {side.verdict ? <p className={`mt-2 text-sm font-medium ${tone.ink}`}>{side.verdict}</p> : null}
          </div>
        )
      })}
    </div>
  )
}

function StepsBlock({ block }) {
  return (
    <div>
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {block.items.map((item, index) => (
          <li key={item} className="relative flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium leading-5 text-slate-700">
            <Num tone={block.tone ?? "slate"}>{index + 1}</Num>
            <span>{item}</span>
            {index < block.items.length - 1 ? (
              <span aria-hidden="true" className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-slate-300 lg:block">→</span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  )
}

function TableBlock({ block }) {
  return (
    <div>
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              {block.columns.map((column) => (
                <th key={column} className="border-b border-slate-200 px-3 py-2.5 text-left font-semibold text-slate-800">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="odd:bg-white even:bg-slate-50/50">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border-b border-slate-100 px-3 py-2 align-top leading-6 text-slate-700">
                    <Rich text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {block.note ? (
        <p className="mt-2 text-xs text-slate-500">
          <Rich text={block.note} />
        </p>
      ) : null}
    </div>
  )
}

function FormulaBlock({ block }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      <div className="flex flex-wrap items-center gap-2">
        {block.parts.map((part, index) => (
          <span key={part.label} className="flex items-center gap-2">
            {index > 0 ? (
              <span aria-hidden="true" className="text-lg font-semibold text-slate-400">
                {block.result && index === block.parts.length - 1 ? "→" : "+"}
              </span>
            ) : null}
            <span className={`rounded-xl border px-3 py-1.5 text-sm font-semibold ${toneOf(part.tone).soft} ${toneOf(part.tone).ink}`}>
              {part.label}
            </span>
          </span>
        ))}
      </div>
      {block.example ? (
        <div className="mt-4 flex flex-wrap items-start gap-x-4 gap-y-3 border-t border-dashed border-slate-200 pt-4">
          {block.example.map((item) => (
            <div key={item.word} className="flex flex-col items-center text-center">
              <span className={`text-lg font-semibold ${toneOf(item.tone).ink}`}>{item.word}</span>
              <span className="mt-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">↓ {item.role}</span>
            </div>
          ))}
        </div>
      ) : null}
      {block.exampleText ? (
        <p className="mt-4 border-t border-dashed border-slate-200 pt-4 text-base leading-7 text-slate-700">
          <Rich text={block.exampleText} />
        </p>
      ) : null}
    </div>
  )
}

function GlossaryBlock({ block }) {
  const tone = toneOf(block.tone)
  return (
    <div className={`rounded-2xl border p-4 ${block.plain ? "border-slate-200 bg-white" : tone.soft}`}>
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      <dl className="grid gap-2">
        {block.items.map((item) => (
          <div key={item.key} className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-3 border-b border-dashed border-slate-200 pb-2 last:border-0 last:pb-0">
            <dt className={`min-w-8 font-bold ${item.big ? "text-2xl leading-none" : "text-sm uppercase tracking-wide"} ${toneOf(item.tone ?? block.tone).ink}`}>
              {item.key}
            </dt>
            <dd className="text-sm leading-6 text-slate-600">
              <Rich text={item.text} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function ChipsBlock({ block }) {
  const tone = toneOf(block.tone ?? "slate")
  return (
    <div className={`rounded-2xl border p-4 ${tone.soft}`}>
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      {block.text ? (
        <p className="mb-3 text-sm leading-6 text-slate-600">
          <Rich text={block.text} />
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {block.items.map((item) => (
          <span key={item} className={`rounded-full border border-current/20 bg-white px-3.5 py-1 text-sm font-semibold italic ${tone.ink}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function ArgumentBlock({ block }) {
  const tone = toneOf(block.tone ?? "slate")
  return (
    <div className={`rounded-2xl border p-4 ${block.tone ? tone.soft : "border-slate-200 bg-white"}`}>
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <ol className="grid gap-1.5 text-[0.95rem] leading-7 text-slate-700">
          {block.premises.map((premise, index) => (
            <li key={premise} className="flex gap-2.5">
              <span className="w-5 shrink-0 text-right font-semibold text-slate-400">{index + 1}.</span>
              <Rich text={premise} />
            </li>
          ))}
          <li className="mt-1 flex gap-2.5 border-t-2 border-slate-800/70 pt-2 font-medium text-slate-900">
            <span className="w-5 shrink-0 text-right font-semibold text-slate-400">∴</span>
            <span>
              <span className={`font-bold ${tone.ink}`}>Deci </span>
              <Rich text={block.conclusion} />
            </span>
          </li>
        </ol>
        {block.legend ? (
          <dl className="grid content-start gap-1.5 border-slate-200 text-sm sm:border-l sm:pl-4">
            {block.legend.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <dt className={`inline-grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${toneOf(item.tone).chip}`}>{item.key}</dt>
                <dd className="text-slate-600">= {item.text}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      {block.verdict ? (
        <p className={`mt-3 flex items-center gap-2 text-sm font-semibold ${tone.ink}`}>
          <span aria-hidden="true" className={`inline-grid h-5 w-5 place-items-center rounded-full text-xs ${tone.chip}`}>
            {block.valid === false ? "✕" : "✓"}
          </span>
          {block.verdict}
        </p>
      ) : null}
    </div>
  )
}

function SquareBlock({ block }) {
  const corner = {
    A: { x: 20, y: 20, fill: "#dbeafe", stroke: "#2563eb", text: "Toți S sunt P" },
    E: { x: 300, y: 20, fill: "#ffe4e6", stroke: "#e11d48", text: "Niciun S nu este P" },
    I: { x: 20, y: 230, fill: "#d1fae5", stroke: "#059669", text: "Unii S sunt P" },
    O: { x: 300, y: 230, fill: "#fef3c7", stroke: "#d97706", text: "Unii S nu sunt P" },
  }
  const label = { fontSize: 13, fill: "#334155", fontWeight: 600, textAnchor: "middle" }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      <svg viewBox="0 0 440 320" className="mx-auto w-full max-w-[520px]" role="img" aria-label="Pătratul logic: A, E, I, O și relațiile dintre ele">
        <defs>
          <marker id="sq-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M1 1L9 5L1 9" fill="none" stroke="#1e293b" strokeWidth="1.6" />
          </marker>
        </defs>
        <line x1="145" y1="50" x2="295" y2="50" stroke="#1e293b" strokeWidth="1.8" markerStart="url(#sq-arrow)" markerEnd="url(#sq-arrow)" />
        <text x="220" y="40" {...label}>contrarietate</text>
        <line x1="145" y1="262" x2="295" y2="262" stroke="#1e293b" strokeWidth="1.8" markerStart="url(#sq-arrow)" markerEnd="url(#sq-arrow)" />
        <text x="220" y="252" {...label}>subcontrarietate</text>
        <line x1="80" y1="85" x2="80" y2="225" stroke="#1e293b" strokeWidth="1.8" markerEnd="url(#sq-arrow)" />
        <text x="66" y="158" {...label} transform="rotate(-90 66 158)">subalternare</text>
        <line x1="360" y1="85" x2="360" y2="225" stroke="#1e293b" strokeWidth="1.8" markerEnd="url(#sq-arrow)" />
        <text x="374" y="158" {...label} transform="rotate(90 374 158)">subalternare</text>
        <line x1="145" y1="85" x2="295" y2="228" stroke="#1e293b" strokeWidth="1.6" strokeDasharray="6 5" markerStart="url(#sq-arrow)" markerEnd="url(#sq-arrow)" />
        <line x1="295" y1="85" x2="145" y2="228" stroke="#1e293b" strokeWidth="1.6" strokeDasharray="6 5" markerStart="url(#sq-arrow)" markerEnd="url(#sq-arrow)" />
        <rect x="170" y="146" width="100" height="22" rx="6" fill="white" />
        <text x="220" y="161" {...label}>contradicție</text>
        {Object.entries(corner).map(([letter, c]) => (
          <g key={letter}>
            <rect x={c.x} y={c.y} width="120" height="70" rx="12" fill={c.fill} stroke={c.stroke} strokeWidth="1.8" />
            <text x={c.x + 60} y={c.y + 32} textAnchor="middle" fontSize="26" fontWeight="700" fill="#0f172a">{letter}</text>
            <text x={c.x + 60} y={c.y + 54} textAnchor="middle" fontSize="11.5" fill="#334155">{c.text}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function TruthBlock({ block }) {
  const cell = (value) =>
    value === "A" ? "bg-emerald-50 text-emerald-700" : value === "F" ? "bg-rose-50 text-rose-700" : "text-slate-800"
  return (
    <div>
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {block.tables.map((table) => (
          <div key={table.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="bg-slate-900 px-3 py-2 text-center text-white">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">{table.name}</p>
              <p className="font-mono text-lg font-bold">{table.symbol}</p>
            </div>
            <table className="w-full border-collapse text-center text-sm">
              <thead>
                <tr>
                  {table.columns.map((column) => (
                    <th key={column} className="border-b border-slate-200 bg-slate-50 px-1.5 py-1.5 font-mono font-semibold text-slate-700">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((value, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={`border-b border-slate-100 px-1.5 py-1.5 font-semibold ${cellIndex === row.length - 1 ? cell(value) : "text-slate-600"}`}
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      {block.note ? <p className="mt-2 text-xs text-slate-500">{block.note}</p> : null}
    </div>
  )
}

function CardsBlock({ block }) {
  return (
    <div>
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      <div className="grid gap-3 md:[grid-template-columns:repeat(var(--cards),minmax(0,1fr))]" style={{ "--cards": block.items.length }}>
        {block.items.map((item) => {
          const tone = toneOf(item.tone ?? block.tone)
          return (
            <div key={item.title} className={`rounded-2xl border p-4 ${tone.soft}`}>
              <p className="flex items-center gap-2 text-base font-semibold text-slate-900">
                {item.badge ? <span className={`inline-grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${tone.chip}`}>{item.badge}</span> : null}
                <Rich text={item.title} />
              </p>
              {item.lines ? (
                <ul className="mt-2 grid gap-1 text-sm leading-6 text-slate-600">
                  {item.lines.map((line) => (
                    <li key={line}>
                      <Rich text={line} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {item.note ? (
                <p className={`mt-2 text-sm font-medium leading-6 ${tone.ink}`}>
                  <Rich text={item.note} />
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EulerDiagram({ form }) {
  const s = tones.blue
  const p = tones.green
  const text = { fontSize: 14, fontWeight: 700, fill: "#0f172a", textAnchor: "middle", dominantBaseline: "middle" }
  return (
    <svg viewBox="0 0 160 90" className="h-24 w-full" role="img" aria-label={`Diagrama Euler pentru ${form}`}>
      <defs>
        <pattern id="euler-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#d97706" strokeWidth="2" />
        </pattern>
      </defs>
      {form === "A" && (
        <>
          <circle cx="80" cy="45" r="40" fill={p.fill} stroke={p.stroke} strokeWidth="2" />
          <circle cx="80" cy="56" r="20" fill="white" stroke={s.stroke} strokeWidth="2" />
          <text x="80" y="20" {...text}>P</text>
          <text x="80" y="56" {...text}>S</text>
        </>
      )}
      {form === "E" && (
        <>
          <circle cx="45" cy="45" r="30" fill={s.fill} stroke={s.stroke} strokeWidth="2" />
          <circle cx="115" cy="45" r="30" fill={p.fill} stroke={p.stroke} strokeWidth="2" />
          <text x="45" y="45" {...text}>S</text>
          <text x="115" y="45" {...text}>P</text>
        </>
      )}
      {form === "I" && (
        <>
          <circle cx="62" cy="45" r="32" fill={s.fill} stroke={s.stroke} strokeWidth="2" />
          <circle cx="98" cy="45" r="32" fill={p.fill} stroke={p.stroke} strokeWidth="2" />
          <circle cx="80" cy="45" r="4" fill="#0f172a" />
          <text x="48" y="45" {...text}>S</text>
          <text x="112" y="45" {...text}>P</text>
        </>
      )}
      {form === "O" && (
        <>
          <circle cx="62" cy="45" r="32" fill="url(#euler-hatch)" fillOpacity="0.5" stroke={s.stroke} strokeWidth="2" />
          <circle cx="98" cy="45" r="32" fill="#e6f5ee" stroke={p.stroke} strokeWidth="2" />
          <text x="46" y="45" {...text}>S</text>
          <text x="112" y="45" {...text}>P</text>
        </>
      )}
    </svg>
  )
}

function EulerFormsBlock({ block }) {
  const colors = { A: "blue", E: "green", I: "amber", O: "red" }
  return (
    <div>
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      <div className="grid gap-3 sm:grid-cols-2">
        {block.items.map((item) => {
          const tone = toneOf(colors[item.form])
          return (
            <div key={item.form} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span className={`inline-grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${tone.chip}`}>{item.form}</span>
                {item.name}
                <span className="font-normal italic text-slate-500">„{item.reading}”</span>
              </p>
              <EulerDiagram form={item.form} />
              <p className="text-xs leading-5 text-slate-600">
                <Rich text={item.text} />
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Premise({ terms }) {
  // terms: ["M", "P"] — termenul mediu e evidențiat
  return (
    <span className="inline-flex items-center gap-1 font-mono text-base font-bold text-slate-700">
      {terms.map((term, index) => (
        <span key={index} className="inline-flex items-center gap-1">
          {index > 0 ? <span className="text-slate-400">–</span> : null}
          <span className={term === "M" ? "rounded-md bg-amber-100 px-1.5 text-amber-800 ring-1 ring-amber-300" : ""}>{term}</span>
        </span>
      ))}
    </span>
  )
}

function FiguresBlock({ block }) {
  return (
    <div>
      <BlockTitle number={block.number} title={block.title} tone={block.tone} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {block.items.map((figure) => (
          <div key={figure.name} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-800">{figure.name}</p>
            <div className="my-3 grid justify-center gap-1 text-center">
              <Premise terms={figure.major} />
              <Premise terms={figure.minor} />
              <span className="mx-auto mt-0.5 h-0.5 w-16 bg-slate-700" aria-hidden="true" />
              <Premise terms={["S", "P"]} />
            </div>
            <p className="text-xs leading-5 text-slate-600">
              <Rich text={figure.text} />
            </p>
          </div>
        ))}
      </div>
      {block.note ? (
        <p className="mt-2 text-xs text-slate-500">
          <Rich text={block.note} />
        </p>
      ) : null}
    </div>
  )
}

const renderers = {
  definition: DefinitionBlock,
  pair: PairBlock,
  rule: RuleBlock,
  ladder: LadderBlock,
  relations: RelationsBlock,
  tree: TreeBlock,
  list: ListBlock,
  compare: CompareBlock,
  steps: StepsBlock,
  table: TableBlock,
  formula: FormulaBlock,
  glossary: GlossaryBlock,
  chips: ChipsBlock,
  argument: ArgumentBlock,
  square: SquareBlock,
  truth: TruthBlock,
  cards: CardsBlock,
  euler: EulerFormsBlock,
  figures: FiguresBlock,
}

function Row({ row }) {
  const blocks = row.blocks ?? [row]
  const columns = row.columns ?? "1fr"
  return (
    <div className="grid gap-4 lg:[grid-template-columns:var(--sheet-cols)]" style={{ "--sheet-cols": columns }}>
      {blocks.map((block, index) => {
        const Renderer = renderers[block.type]
        return Renderer ? (
          <div key={index} className="min-w-0">
            <Renderer block={block} />
          </div>
        ) : null
      })}
    </div>
  )
}

function LessonSheet({ sheet }) {
  return (
    <article className="rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 sm:p-6">
      {sheet.title ? <h3 className="mb-4 text-xl font-semibold text-slate-900 sm:text-2xl">{sheet.title}</h3> : null}
      <div className="grid gap-5">
        {sheet.rows.map((row, index) => (
          <Row key={index} row={row} />
        ))}
      </div>
      {sheet.keyQuestion ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-900 px-4 py-3.5 text-white sm:px-5">
          <span aria-hidden="true" className="mt-0.5 text-lg">💡</span>
          <p className="text-sm leading-6 sm:text-base">
            <span className="font-semibold text-amber-300">{sheet.keyLabel ?? "Întrebarea-cheie"}: </span>
            <span className="italic">{sheet.keyQuestion}</span>
          </p>
        </div>
      ) : null}
    </article>
  )
}

export default LessonSheet
