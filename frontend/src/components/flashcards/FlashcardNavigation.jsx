import { Link } from "react-router-dom"

function NavigationTile({ to, label, detail, disabled = false }) {
  const content = (
    <>
      <span className="flash-label">{label}</span>
      <strong className="flash-nav-title">{detail}</strong>
    </>
  )

  if (disabled) {
    return (
      <div className="flash-nav-card is-disabled" aria-disabled="true">
        {content}
      </div>
    )
  }

  return (
    <Link className="flash-nav-card" to={to}>
      {content}
    </Link>
  )
}

function FlashcardNavigation({ backTo, previousSlot, nextSlot }) {
  return (
    <nav className="flash-bottom-nav" aria-label="Navigatie intre sloturi">
      <NavigationTile to={backTo} label="Inapoi" detail="Lista sloturilor" />
      <NavigationTile
        to={previousSlot?.path}
        label="Slot anterior"
        detail={previousSlot?.label ?? "Nu exista slot anterior disponibil"}
        disabled={!previousSlot}
      />
      <NavigationTile
        to={nextSlot?.path}
        label="Slot urmator"
        detail={nextSlot?.label ?? "Nu exista slot urmator disponibil"}
        disabled={!nextSlot}
      />
    </nav>
  )
}

export default FlashcardNavigation
