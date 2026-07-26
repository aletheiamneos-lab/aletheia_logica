import { useMemo, useState } from "react"

function TeacherTestEditor({
  editorState,
  onChange,
  onCreateBlank,
  standardJsonDraft,
  onStandardJsonDraftChange,
  onUseStandardTemplate,
  onImportStandardJson,
  onExportStandardJson,
  onSave,
  onPublish,
  isSaving,
  isPublishing,
  message,
  onCollapse,
}) {
  const [activeLesson, setActiveLesson] = useState(1)
  const [showQuestionStructure, setShowQuestionStructure] = useState(false)

  const questionsByLesson = useMemo(() => {
    const map = new Map()
    for (const lessonNumber of [1, 2, 3, 4, 5]) {
      map.set(
        lessonNumber,
        (editorState.questions ?? []).filter((question) => question.lesson_number === lessonNumber),
      )
    }
    return map
  }, [editorState.questions])

  function updateField(field, value) {
    onChange({
      ...editorState,
      [field]: value,
    })
  }

  function updateCategories(nextCategories) {
    onChange({
      ...editorState,
      categories: nextCategories,
      questions: editorState.questions.map((question) => {
        const categoryLabel = nextCategories[question.lesson_number - 1] ?? `Lectia ${question.lesson_number}`
        return {
          ...question,
          lesson_label: categoryLabel,
          category: categoryLabel,
          source_lesson: question.source_lesson || categoryLabel,
        }
      }),
    })
  }

  function updateQuestion(questionId, updater) {
    onChange({
      ...editorState,
      questions: editorState.questions.map((question) =>
        question.id === questionId ? updater(question) : question,
      ),
    })
  }

  function lessonTabLabel(lessonNumber) {
    return editorState.categories?.[lessonNumber - 1] ?? `Categoria ${lessonNumber}`
  }

  return (
    <section className="panel p-5 sm:p-6 testing-admin-editor-builder">
      <div className="testing-admin-editor-header flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="testing-admin-editor-copy">
          <p className="section-kicker">Test</p>
          <h2 className="testing-admin-editor-title mt-2 text-2xl text-ink">Editor test</h2>
          <p className="testing-admin-editor-description mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Modifici titluri, descrieri si intrebari.
          </p>
        </div>

        <div className="testing-admin-editor-actions flex flex-wrap gap-2.5">
          <button className="btn-secondary" type="button" onClick={onCreateBlank}>
            Creeaza test nou
          </button>
          {onCollapse ? (
            <button className="btn-secondary" type="button" onClick={onCollapse}>
              Minimizeaza editorul
            </button>
          ) : null}
          <button className="btn-secondary" type="button" onClick={onUseStandardTemplate}>
            Sablon JSON standard
          </button>
          <button className="btn-secondary" type="button" onClick={onExportStandardJson}>
            Exporta JSON standard
          </button>
          <button className="btn-secondary" disabled={isSaving} type="button" onClick={onSave}>
            {isSaving ? "Se salveaza..." : "Salveaza draft"}
          </button>
          <button className="btn-primary" disabled={isPublishing} type="button" onClick={onPublish}>
            {isPublishing ? "Se publica..." : "Publica test"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <label className="flex flex-col gap-2">
          <span className="section-kicker">Titlu</span>
          <input
            className="testing-input"
            value={editorState.title}
            onChange={(event) => updateField("title", event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="section-kicker">Slug</span>
          <input
            className="testing-input"
            value={editorState.slug}
            onChange={(event) => updateField("slug", event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="section-kicker">Durata minute</span>
          <input
            type="number"
            min="5"
            className="testing-input"
            value={editorState.duration_minutes}
            onChange={(event) => updateField("duration_minutes", Number(event.target.value))}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="section-kicker">Dificultate</span>
          <input
            className="testing-input"
            value={editorState.difficulty_label}
            onChange={(event) => updateField("difficulty_label", event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="section-kicker">Schema</span>
          <input
            className="testing-input"
            value={editorState.schema_version ?? "1.0"}
            onChange={(event) => updateField("schema_version", event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="section-kicker">Materie</span>
          <input
            className="testing-input"
            value={editorState.subject ?? "Logica"}
            onChange={(event) => updateField("subject", event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="section-kicker">Nivel</span>
          <input
            className="testing-input"
            value={editorState.level ?? "bac_admitere"}
            onChange={(event) => updateField("level", event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="section-kicker">Limba</span>
          <input
            className="testing-input"
            value={editorState.language ?? "ro"}
            onChange={(event) => updateField("language", event.target.value)}
          />
        </label>

        <label className="flex items-center gap-3 rounded-[16px] border border-panelLine bg-panelSoft px-4 py-3 lg:col-span-4">
          <input
            type="checkbox"
            checked={Boolean(editorState.is_visible_to_students)}
            onChange={(event) => updateField("is_visible_to_students", event.target.checked)}
          />
          <span className="text-sm leading-7 text-slate-700">
            Afiseaza acest test in lista elevilor dupa publicare.
          </span>
        </label>

        <label className="flex flex-col gap-2 lg:col-span-4">
          <span className="section-kicker">Descriere</span>
          <textarea
            className="testing-input testing-textarea"
            value={editorState.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
        </label>
      </div>

      <article className="muted-box mt-5 p-4">
        <p className="section-kicker">Rezumat test selectat</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <div>
            <p className="text-sm leading-7 text-slate-600">Nume test</p>
            <p className="text-lg text-ink">{editorState.title || "Test nou"}</p>
          </div>
          <div>
            <p className="text-sm leading-7 text-slate-600">Preview / publicare</p>
            <p className="text-lg text-ink">
              {editorState.is_visible_to_students ? "Pregatit pentru studenti" : "Ramane doar in admin"}
            </p>
          </div>
          <div>
            <p className="text-sm leading-7 text-slate-600">Structura interna</p>
            <p className="text-lg text-ink">{`${editorState.questions?.length ?? 0} intrebari`}</p>
          </div>
        </div>
      </article>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="muted-box p-4">
          <p className="section-kicker">Categorii standard</p>
          <div className="mt-4 grid gap-3">
            {(editorState.categories ?? []).map((category, index) => (
              <label key={`category-${index}`} className="flex flex-col gap-2">
                <span className="section-kicker">{`Categorie ${index + 1}`}</span>
                <input
                  className="testing-input"
                  value={category}
                  onChange={(event) =>
                    updateCategories(
                      (editorState.categories ?? []).map((entry, entryIndex) =>
                        entryIndex === index ? event.target.value : entry,
                      ),
                    )
                  }
                />
              </label>
            ))}
          </div>
        </article>

        <article className="muted-box p-4">
          <p className="section-kicker">JSON standard fix</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Acesta este modelul pe care il vom pastra pentru toate testele viitoare. Poti lipi aici
            JSON-ul primit si il incarci direct in editor.
          </p>
          <textarea
            className="testing-input testing-textarea mt-4 min-h-[260px]"
            value={standardJsonDraft}
            onChange={(event) => onStandardJsonDraftChange(event.target.value)}
          />
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button className="btn-secondary" type="button" onClick={onImportStandardJson}>
              Importa JSON standard
            </button>
            <button className="btn-secondary" type="button" onClick={onExportStandardJson}>
              Regenereaza JSON din editor
            </button>
          </div>
        </article>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="muted-box p-4">
          <p className="section-kicker">Configuratie raport standard</p>
          <div className="mt-4 grid gap-3">
            {Object.entries(editorState.report_template ?? {}).map(([key, value]) => (
              <label key={key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) =>
                    updateField("report_template", {
                      ...(editorState.report_template ?? {}),
                      [key]: event.target.checked,
                    })
                  }
                />
                <span className="text-sm leading-7 text-slate-700">{key}</span>
              </label>
            ))}
          </div>
        </article>
      </div>

      {message ? <div className="mt-4 status-pill">{message}</div> : null}

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="section-kicker">Structura interna a testului</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Intrebarile pot fi editate fara sa aglomereze lista de teste.
          </p>
        </div>
        <button
          className="btn-secondary"
          type="button"
          onClick={() => setShowQuestionStructure((current) => !current)}
        >
          {showQuestionStructure ? "Ascunde structura interna" : "Vezi structura interna"}
        </button>
      </div>

      {showQuestionStructure ? (
        <>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {[1, 2, 3, 4, 5].map((lessonNumber) => (
              <button
                key={lessonNumber}
                type="button"
                className={["testing-nav-chip", activeLesson === lessonNumber ? "is-current" : ""].join(" ")}
                onClick={() => setActiveLesson(lessonNumber)}
              >
                {lessonTabLabel(lessonNumber)}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4">
            {(questionsByLesson.get(activeLesson) ?? []).map((question) => (
              <article key={question.id} className="muted-box p-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="tag">{question.lesson_label}</span>
                  <span className="status-pill">{`Ordine categorie ${question.order_in_lesson}`}</span>
                  <span className="status-pill">{`Ordine test ${question.order_in_test}`}</span>
                  <span className="status-pill">{`${question.options.length} variante`}</span>
                </div>

                <div className="mt-4 grid gap-4">
                  <label className="flex flex-col gap-2">
                    <span className="section-kicker">Text intrebare</span>
                    <textarea
                      className="testing-input testing-textarea"
                      value={question.text}
                      onChange={(event) =>
                        updateQuestion(question.id, (current) => ({ ...current, text: event.target.value }))
                      }
                    />
                  </label>

                  <div className="grid gap-3 lg:grid-cols-3">
                    <label className="flex flex-col gap-2">
                      <span className="section-kicker">Categorie standard</span>
                      <input
                        className="testing-input"
                        value={question.category ?? question.lesson_label}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) => ({
                            ...current,
                            category: event.target.value,
                            lesson_label: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="section-kicker">Sursa</span>
                      <input
                        className="testing-input"
                        value={question.source_lesson ?? question.lesson_label}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) => ({
                            ...current,
                            source_lesson: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="section-kicker">Tip raspuns</span>
                      <select
                        className="testing-input"
                        value={question.answer_type ?? "single"}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) => ({
                            ...current,
                            answer_type: event.target.value || "single",
                          }))
                        }
                      >
                        <option value="single">single</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    {question.options.map((option, optionIndex) => (
                      <label key={`${question.id}-option-${optionIndex}`} className="flex flex-col gap-2">
                        <span className="section-kicker">{`Varianta ${String.fromCharCode(65 + optionIndex)}`}</span>
                        <input
                          className="testing-input"
                          value={option}
                          onChange={(event) =>
                            updateQuestion(question.id, (current) => ({
                              ...current,
                              options: current.options.map((entry, index) =>
                                index === optionIndex ? event.target.value : entry,
                              ),
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() =>
                        updateQuestion(question.id, (current) => ({
                          ...current,
                          options:
                            current.options.length === 4
                              ? [...current.options, ""]
                              : current.options.slice(0, 4),
                          correct_option_index:
                            current.options.length === 4
                              ? current.correct_option_index
                              : Math.min(current.correct_option_index, 3),
                        }))
                      }
                    >
                      {question.options.length === 4 ? "Adauga varianta E" : "Elimina varianta E"}
                    </button>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-3">
                    <label className="flex flex-col gap-2">
                      <span className="section-kicker">Varianta corecta</span>
                      <select
                        className="testing-input"
                        value={question.correct_option_index}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) => ({
                            ...current,
                            correct_option_index: Number(event.target.value),
                          }))
                        }
                      >
                        {question.options.map((_, index) => (
                          <option key={index} value={index}>
                            {String.fromCharCode(65 + index)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="section-kicker">Dificultate item</span>
                      <input
                        className="testing-input"
                        value={question.difficulty}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) => ({
                            ...current,
                            difficulty: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="section-kicker">Tag-uri</span>
                      <input
                        className="testing-input"
                        value={(question.tags ?? []).join(", ")}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) => ({
                            ...current,
                            tags: event.target.value
                              .split(",")
                              .map((entry) => entry.trim())
                              .filter(Boolean),
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <label className="flex flex-col gap-2">
                      <span className="section-kicker">Justificare</span>
                      <textarea
                        className="testing-input testing-textarea"
                        value={question.justification ?? ""}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) => ({
                            ...current,
                            justification: event.target.value,
                            explanation: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="section-kicker">Explicatie interna</span>
                      <textarea
                        className="testing-input testing-textarea"
                        value={question.explanation ?? ""}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) => ({
                            ...current,
                            explanation: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}

export default TeacherTestEditor
