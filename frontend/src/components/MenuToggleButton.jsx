import { forwardRef } from "react"

const MenuToggleButton = forwardRef(function MenuToggleButton(
  {
    collisionOffset = 0,
    isOpen,
    onToggle,
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`app-mobile-sidebar-trigger${isOpen ? " is-open" : ""}`}
      style={{
        "--mobile-menu-collision-offset": `${collisionOffset}px`,
      }}
      aria-label={isOpen ? "Închide meniul" : "Deschide meniul"}
      aria-controls="app-mobile-sidebar-dialog"
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <span className="app-mobile-menu-bars" aria-hidden="true">
        <span className="app-mobile-menu-bar app-mobile-menu-bar-first" />
        <span className="app-mobile-menu-bar app-mobile-menu-bar-middle" />
        <span className="app-mobile-menu-bar app-mobile-menu-bar-last" />
      </span>
    </button>
  )
})

export default MenuToggleButton
