function TheoryKeyTakeaways({ items = [] }) {
  if (!items.length) {
    return null
  }

  return (
    <div className="theory-key-takeaways">
      <p className="theory-close-kicker">Ce să reții</p>
      <ul className="theory-takeaway-list">
        {items.map((item) => (
          <li key={item} className="theory-takeaway-item">
            <span aria-hidden="true" className="theory-takeaway-dot" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TheoryKeyTakeaways
