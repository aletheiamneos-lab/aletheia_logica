function TheoryLead({ children }) {
  if (!children) {
    return null
  }

  return <p className="theory-lead">{children}</p>
}

export default TheoryLead
