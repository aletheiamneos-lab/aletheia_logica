import { useMemo, useState } from "react"

import TheorySectionCard from "./TheorySectionCard"

function ClassificationPairCard({
  board,
  placements,
  onPlace,
  onReset,
  selectedItem,
  onSelectItem,
}) {
  const availableItems = board.items.filter((item) => !placements[item.id])
  const leftItems = board.items.filter((item) => placements[item.id] === "left")
  const rightItems = board.items.filter((item) => placements[item.id] === "right")
  const correctCount = board.items.filter((item) => placements[item.id] === item.answer).length

  function handleDrop(event, bucket) {
    event.preventDefault()

    try {
      const payload = JSON.parse(event.dataTransfer.getData("text/plain"))
      if (payload.boardId === board.id) {
        onPlace(board.id, payload.itemId, bucket)
      }
    } catch {
      return
    }
  }

  function renderZoneItems(items) {
    if (!items.length) {
      return (
        <p className="text-sm text-slate-400">
          Pune aici termenii care aparțin acestei categorii.
        </p>
      )
    }

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const correct = placements[item.id] === item.answer

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onPlace(board.id, item.id, "")}
              className={[
                "rounded-full px-3 py-2 text-sm font-semibold transition",
                correct
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800",
              ].join(" ")}
              title={item.hint}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">{board.title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">{board.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            {correctCount}/{board.items.length} corecte
          </span>
          <button
            type="button"
            onClick={() => onReset(board.id)}
            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            Resetează
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Termeni disponibili</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {availableItems.map((item) => (
            <button
              key={item.id}
              type="button"
              draggable
              onDragStart={(event) =>
                event.dataTransfer.setData(
                  "text/plain",
                  JSON.stringify({ boardId: board.id, itemId: item.id }),
                )
              }
              onClick={() =>
                onSelectItem((current) =>
                  current?.itemId === item.id ? null : { boardId: board.id, itemId: item.id },
                )
              }
              className={[
                "rounded-full border px-3 py-2 text-sm font-semibold transition",
                selectedItem?.itemId === item.id
                  ? "border-blue-300 bg-blue-50 text-blue-800"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/40",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
          {!availableItems.length && (
            <p className="text-sm text-slate-400">Toți termenii au fost plasați. Poți rearanja dacă vrei.</p>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {[
          { bucket: "left", label: board.leftLabel, items: leftItems },
          { bucket: "right", label: board.rightLabel, items: rightItems },
        ].map((zone) => (
          <div
            key={zone.bucket}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (selectedItem?.boardId === board.id) {
                onPlace(board.id, selectedItem.itemId, zone.bucket)
                onSelectItem(null)
              }
            }}
            onKeyDown={(event) => {
              if ((event.key === "Enter" || event.key === " ") && selectedItem?.boardId === board.id) {
                event.preventDefault()
                onPlace(board.id, selectedItem.itemId, zone.bucket)
                onSelectItem(null)
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, zone.bucket)}
            className="min-h-[170px] rounded-[24px] border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/30"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">{zone.label}</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                drop zone
              </span>
            </div>
            <div className="mt-4">{renderZoneItems(zone.items)}</div>
          </div>
        ))}
      </div>
    </article>
  )
}

function TermClassificationBoard({ section }) {
  const [activeTabId, setActiveTabId] = useState(section.tabs[0]?.id ?? "")
  const [placements, setPlacements] = useState({})
  const [selectedItem, setSelectedItem] = useState(null)

  const activeTab = useMemo(
    () => section.tabs.find((tab) => tab.id === activeTabId) ?? section.tabs[0],
    [activeTabId, section.tabs],
  )

  function placeItem(boardId, itemId, bucket) {
    setPlacements((current) => ({
      ...current,
      [boardId]: {
        ...(current[boardId] ?? {}),
        [itemId]: bucket,
      },
    }))
  }

  function resetBoard(boardId) {
    setPlacements((current) => ({
      ...current,
      [boardId]: {},
    }))
    setSelectedItem(null)
  }

  return (
    <TheorySectionCard
      kicker={section.kicker}
      title={section.title}
      description={section.description}
      headerAside={
        <div className="flex flex-wrap gap-3">
          {section.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                tab.id === activeTabId
                  ? "bg-blue-600 text-white shadow-[0_16px_36px_-24px_rgba(37,99,235,0.55)]"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      }
    >
      <div
        key={activeTab.id}
        className="lesson-state-transition space-y-5"
      >
        {activeTab.boards.map((board) => (
          <ClassificationPairCard
            key={board.id}
            board={board}
            placements={placements[board.id] ?? {}}
            onPlace={placeItem}
            onReset={resetBoard}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
          />
        ))}
      </div>
    </TheorySectionCard>
  )
}

export default TermClassificationBoard
