function TheoryArticleLayout({ eyebrow, title, summary, children }) {
  return (
    <div className="theory-article">
      {(eyebrow || title || summary) && (
        <div className="theory-article-intro">
          {(eyebrow || title) && (
            <div className="theory-article-heading">
              {eyebrow && <p className="theory-eyebrow">{eyebrow}</p>}
              {title && <h2 className="theory-article-title">{title}</h2>}
            </div>
          )}
          {summary && <p className="theory-article-summary">{summary}</p>}
        </div>
      )}

      {children}
    </div>
  )
}

export default TheoryArticleLayout
