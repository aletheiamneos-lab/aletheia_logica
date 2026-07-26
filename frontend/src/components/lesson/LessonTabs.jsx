import { NavLink } from "react-router-dom"

const tabs = [
  { id: "teorie", label: "Teorie" },
  { id: "practica", label: "Practica" },
]

function LessonTabs({ lessonId }) {
  return (
    <div className="lesson-tabs-shell">
      <div className="lesson-tabs-row">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={`/lectii/${lessonId}/${tab.id}`}
            className={({ isActive }) =>
              [
                "lesson-tab-button",
                isActive ? "is-active" : "is-inactive",
              ].join(" ")
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default LessonTabs
