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
  // **cuvânt** → evidențiat
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) =>
    part.startsWith("**") ? (
      <strong key={index} className="font-semibold text-slate-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  )
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

function Venn({ kind }) {
  const a = tones.green
  const b = tones.blue
  const text = { fontSize: 13, fontWeight: 600, fill: "#1e293b", textAnchor: "middle", dominantBaseline: "middle" }
  return (
    <svg viewBox="0 0 140 84" className="h-20 w-full" role="img" aria-label={kind}>
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
            <Venn kind={item.kind} />
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
            <p className="text-sm leading-6 text-slate-700">
              <span className="font-semibold text-slate-900">{side.root}</span> → {side.criterion ? <span className="text-slate-500">{side.criterion}: </span> : null}
              {side.parts.map((part, partIndex) => (
                <span key={part}>
                  <span className="mx-0.5 inline-block rounded-md border border-slate-300 bg-white px-2 py-0.5 text-slate-800">{part}</span>
                  {partIndex < side.parts.length - 1 ? " / " : null}
                </span>
              ))}
            </p>
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
      <div className="grid gap-5">
        {sheet.rows.map((row, index) => (
          <Row key={index} row={row} />
        ))}
      </div>
      {sheet.keyQuestion ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-900 px-4 py-3.5 text-white sm:px-5">
          <span aria-hidden="true" className="mt-0.5 text-lg">💡</span>
          <p className="text-sm leading-6 sm:text-base">
            <span className="font-semibold text-amber-300">Întrebarea-cheie: </span>
            <span className="italic">{sheet.keyQuestion}</span>
          </p>
        </div>
      ) : null}
    </article>
  )
}

export default LessonSheet
