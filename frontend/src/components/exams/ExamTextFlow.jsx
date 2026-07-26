function normalizeLine(line) {
  return line
    .replace(/:,/g, ":")
    .replace(/([,;:])(?=[A-Za-z])/g, "$1 ")
    .replace(/(?<=[.?!])(?=[A-Za-z])/g, " ")
    .replace(/(?<=[a-z])(?=[A-Z])/g, " ")
    .replace(/\b([A-Z])si(?=[A-Z])/g, "$1 si ")
    .replace(/\b([A-Z])si(?=[a-z])/g, "$1 si ")
    .replace(/\b([A-Z])si\b/g, "$1 si")
    .replace(/\s+/g, " ")
    .trim()
}

function startsNewBlock(line) {
  return /^(?:\d+[.)]|[a-zA-Z][.)]|[IVXLC]+[.)]|[-•])/.test(line)
}

function buildBlocks(text) {
  const lines = text.split(/\r?\n/)
  const blocks = []
  let currentBlock = []

  function flush() {
    if (!currentBlock.length) {
      return
    }

    blocks.push(currentBlock.join(" "))
    currentBlock = []
  }

  lines.forEach((rawLine) => {
    const line = normalizeLine(rawLine)

    if (!line) {
      flush()
      return
    }

    if (!currentBlock.length) {
      currentBlock = [line]
      return
    }

    if (startsNewBlock(line)) {
      flush()
      currentBlock = [line]
      return
    }

    currentBlock.push(line)
  })

  flush()
  return blocks
}

function ExamTextFlow({ text }) {
  const blocks = buildBlocks(text)

  return (
    <div className="exam-text-flow">
      {blocks.map((block, index) => (
        <p key={`${index}-${block.slice(0, 24)}`} className="exam-text-paragraph">
          {block}
        </p>
      ))}
    </div>
  )
}

export default ExamTextFlow
