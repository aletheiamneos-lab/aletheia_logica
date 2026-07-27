import { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle,
  Mail,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react"

import {
  createAllowedStudent,
  deleteAllowedStudent,
  getAllowedStudents,
  updateAllAllowedStudents,
  updateAllowedStudent,
} from "../../api/client"

function AllowedStudentsAdminPanel() {
  const [students, setStudents] = useState([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [studentToDelete, setStudentToDelete] = useState(null)
  const [bulkAccessAction, setBulkAccessAction] = useState("")

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const result = await getAllowedStudents()
      setStudents(result.students ?? [])
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!studentToDelete) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busyId) {
        setStudentToDelete(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [busyId, studentToDelete])

  async function handleAdd(event) {
    event.preventDefault()
    setBusyId("new")
    setError("")
    setMessage("")
    try {
      await createAllowedStudent({ email, name })
      setEmail("")
      setName("")
      setMessage("Elevul a fost adaugat in lista de acces.")
      await refresh()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setBusyId("")
    }
  }

  async function handlePatch(student, changes, successMessage) {
    setBusyId(student.id)
    setError("")
    setMessage("")
    try {
      await updateAllowedStudent(student.id, changes)
      setMessage(successMessage)
      await refresh()
    } catch (patchError) {
      setError(patchError.message)
    } finally {
      setBusyId("")
    }
  }

  async function handleBulkAccessUpdate() {
    if (!bulkAccessAction) {
      return
    }

    const shouldBlock = bulkAccessAction === "block"
    setBusyId(`all:${bulkAccessAction}`)
    setError("")
    setMessage("")
    try {
      await updateAllAllowedStudents(shouldBlock)
      await refresh()
      setBulkAccessAction("")
      setMessage(
        shouldBlock
          ? "Accesul a fost blocat pentru toți elevii din listă."
          : "Accesul a fost deblocat pentru toți elevii din listă.",
      )
    } catch (patchError) {
      setError(patchError.message)
    } finally {
      setBusyId("")
    }
  }

  async function handleDelete() {
    if (!studentToDelete) {
      return
    }

    setBusyId(studentToDelete.id)
    setError("")
    setMessage("")
    try {
      await deleteAllowedStudent(studentToDelete.id)
      setStudentToDelete(null)
      setMessage("Adresa a fost stearsa.")
      await refresh()
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setBusyId("")
    }
  }

  return (
    <>
      <section className="academic-surface-panel allowed-students-panel">
        <div className="allowed-students-section-rule" aria-hidden="true">
          <span />
          <ShieldCheck size={18} strokeWidth={1.8} />
          <span />
        </div>

        <div className="academic-panel-head allowed-students-heading">
          <div className="allowed-students-heading-copy">
            <p className="section-kicker">Control acces</p>
            <h2 className="academic-section-title">Administrare acces elevi</h2>
            <p className="academic-panel-note">
              Aprobi adresele de email, blochezi accesul sau inchizi de la distanta sesiunea unui elev.
            </p>
          </div>
          <div className="allowed-students-summary">
            <span className="allowed-students-count">
              <Users aria-hidden="true" size={16} strokeWidth={1.9} />
              {`${students.length} ${students.length === 1 ? "elev" : "elevi"}`}
            </span>
            <button className="allowed-students-icon-button" type="button" onClick={refresh} disabled={isLoading}>
              <RefreshCw
                aria-hidden="true"
                className={isLoading ? "is-spinning" : ""}
                size={17}
                strokeWidth={1.9}
              />
              Reincarca
            </button>
          </div>
        </div>

        <article className="allowed-students-add-card">
          <div className="allowed-students-add-copy">
            <span className="allowed-students-add-icon" aria-hidden="true">
              <UserPlus size={20} strokeWidth={1.8} />
            </span>
            <div>
              <h3>Adauga un elev autorizat</h3>
              <p>Emailul va putea fi folosit imediat pentru autentificare.</p>
            </div>
          </div>

          <form className="allowed-students-form" onSubmit={handleAdd}>
            <label className="access-input-shell">
              <span className="section-kicker">Nume elev</span>
              <input
                className="testing-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nume complet"
                autoComplete="name"
                required
              />
            </label>
            <label className="access-input-shell">
              <span className="section-kicker">Email</span>
              <span className="allowed-students-input-with-icon">
                <Mail aria-hidden="true" size={16} strokeWidth={1.8} />
                <input
                  className="testing-input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="elev@exemplu.ro"
                  autoComplete="email"
                  type="email"
                  required
                />
              </span>
            </label>
            <button className="btn-primary allowed-students-add-button" type="submit" disabled={busyId === "new"}>
              <UserPlus aria-hidden="true" size={16} strokeWidth={1.9} />
              {busyId === "new" ? "Se adauga..." : "Adauga elev"}
            </button>
          </form>
        </article>

        {message ? <div className="allowed-students-feedback is-success">{message}</div> : null}
        {error ? <div className="allowed-students-feedback is-error">{error}</div> : null}

        <div className="allowed-students-list-card">
          <div className="allowed-students-list-heading">
            <div>
              <p className="section-kicker">Lista aprobata</p>
              <h3>Elevi cu acces la aplicatie</h3>
            </div>
            <div className="allowed-students-global-actions">
              <button
                className="allowed-students-action-button is-block"
                type="button"
                disabled={Boolean(busyId) || students.length === 0}
                onClick={() => setBulkAccessAction("block")}
              >
                <ShieldOff aria-hidden="true" size={16} strokeWidth={1.9} />
                Blochează pe toți
              </button>
              <button
                className="allowed-students-action-button is-unblock"
                type="button"
                disabled={Boolean(busyId) || students.length === 0}
                onClick={() => setBulkAccessAction("unblock")}
              >
                <ShieldCheck aria-hidden="true" size={16} strokeWidth={1.9} />
                Deblochează pe toți
              </button>
            </div>
          </div>

          <div className="allowed-students-table-scroll">
            <table className="allowed-students-table">
              <thead>
                <tr>
                  <th>Nume</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actiuni</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const isBusy = busyId === student.id
                  return (
                    <tr key={student.id}>
                      <td className="allowed-students-name-cell">{student.name}</td>
                      <td>{student.email}</td>
                      <td>
                        <span
                          className={[
                            "allowed-students-status",
                            student.is_blocked ? "is-blocked" : "is-active",
                          ].join(" ")}
                        >
                          <span aria-hidden="true" />
                          {student.is_blocked ? "Blocat" : "Activ"}
                        </span>
                      </td>
                      <td>
                        <div className="allowed-students-actions">
                          <button
                            className={[
                              "allowed-students-action-button",
                              "is-block",
                              student.is_blocked ? "is-current" : "",
                            ].join(" ")}
                            type="button"
                            disabled={isBusy || student.is_blocked}
                            title={student.is_blocked ? "Elevul este deja blocat" : "Blochează accesul"}
                            onClick={() =>
                              handlePatch(
                                student,
                                { is_blocked: true },
                                "Accesul a fost blocat.",
                              )
                            }
                          >
                            <ShieldOff aria-hidden="true" size={16} strokeWidth={1.9} />
                            Blochează
                          </button>
                          <button
                            className={[
                              "allowed-students-action-button",
                              "is-unblock",
                              !student.is_blocked ? "is-current" : "",
                            ].join(" ")}
                            type="button"
                            disabled={isBusy || !student.is_blocked}
                            title={!student.is_blocked ? "Elevul este deja deblocat" : "Deblochează accesul"}
                            onClick={() =>
                              handlePatch(
                                student,
                                { is_blocked: false },
                                "Accesul a fost deblocat.",
                              )
                            }
                          >
                            <ShieldCheck aria-hidden="true" size={16} strokeWidth={1.9} />
                            Deblochează
                          </button>
                          <button
                            className="allowed-students-action-button"
                            type="button"
                            disabled={isBusy}
                            title="Deconecteaza elevul la urmatoarea verificare"
                            onClick={() =>
                              handlePatch(
                                student,
                                { force_logout: true },
                                "Deconectarea va avea loc la urmatoarea verificare.",
                              )
                            }
                          >
                            <RefreshCw aria-hidden="true" size={16} strokeWidth={1.9} />
                            Deconecteaza
                          </button>
                          <button
                            className="allowed-students-action-button is-delete"
                            type="button"
                            disabled={isBusy}
                            title="Sterge accesul"
                            onClick={() => setStudentToDelete(student)}
                          >
                            <Trash2 aria-hidden="true" size={16} strokeWidth={1.9} />
                            Sterge
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {isLoading ? (
                  <tr>
                    <td className="allowed-students-empty" colSpan="4">
                      Se incarca lista...
                    </td>
                  </tr>
                ) : null}
                {!isLoading && students.length === 0 ? (
                  <tr>
                    <td className="allowed-students-empty" colSpan="4">
                      Lista este goala. Adauga primul elev autorizat.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {studentToDelete ? (
        <div className="allowed-students-dialog-shell" role="presentation">
          <button
            className="allowed-students-dialog-backdrop"
            type="button"
            aria-label="Inchide dialogul"
            disabled={Boolean(busyId)}
            onClick={() => setStudentToDelete(null)}
          />
          <section
            className="allowed-students-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="allowed-students-dialog-title"
          >
            <button
              className="allowed-students-dialog-close"
              type="button"
              aria-label="Inchide"
              disabled={Boolean(busyId)}
              onClick={() => setStudentToDelete(null)}
            >
              <X aria-hidden="true" size={18} />
            </button>
            <span className="allowed-students-dialog-icon" aria-hidden="true">
              <AlertTriangle size={24} strokeWidth={1.8} />
            </span>
            <p className="section-kicker">Confirmare stergere</p>
            <h3 id="allowed-students-dialog-title">Stergi accesul acestui elev?</h3>
            <p>
              Adresa <strong>{studentToDelete.email}</strong> nu va mai putea fi folosita pentru autentificare.
            </p>
            <div className="allowed-students-dialog-actions">
              <button
                className="btn-secondary"
                type="button"
                autoFocus
                disabled={Boolean(busyId)}
                onClick={() => setStudentToDelete(null)}
              >
                Renunta
              </button>
              <button
                className="allowed-students-confirm-delete"
                type="button"
                disabled={Boolean(busyId)}
                onClick={handleDelete}
              >
                <Trash2 aria-hidden="true" size={16} strokeWidth={1.9} />
                {busyId ? "Se sterge..." : "Sterge accesul"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {bulkAccessAction ? (
        <div className="allowed-students-dialog-shell" role="presentation">
          <button
            className="allowed-students-dialog-backdrop"
            type="button"
            aria-label="Închide dialogul"
            disabled={busyId.startsWith("all:")}
            onClick={() => setBulkAccessAction("")}
          />
          <section
            className="allowed-students-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="allowed-students-bulk-dialog-title"
          >
            <button
              className="allowed-students-dialog-close"
              type="button"
              aria-label="Închide"
              disabled={busyId.startsWith("all:")}
              onClick={() => setBulkAccessAction("")}
            >
              <X aria-hidden="true" size={18} />
            </button>
            <span className="allowed-students-dialog-icon is-access-action" aria-hidden="true">
              {bulkAccessAction === "block" ? (
                <ShieldOff size={24} strokeWidth={1.8} />
              ) : (
                <ShieldCheck size={24} strokeWidth={1.8} />
              )}
            </span>
            <p className="section-kicker">Confirmare acces general</p>
            <h3 id="allowed-students-bulk-dialog-title">
              {bulkAccessAction === "block"
                ? "Ești sigur că vrei să blochezi accesul pentru TOȚI elevii din listă?"
                : "Ești sigur că vrei să deblochezi accesul pentru TOȚI elevii din listă?"}
            </h3>
            <p>Schimbarea se aplică imediat tuturor celor {students.length} elevi afișați în listă.</p>
            <div className="allowed-students-dialog-actions">
              <button
                className="btn-secondary"
                type="button"
                autoFocus
                disabled={busyId.startsWith("all:")}
                onClick={() => setBulkAccessAction("")}
              >
                Renunță
              </button>
              <button
                className="btn-primary"
                type="button"
                disabled={busyId.startsWith("all:")}
                onClick={handleBulkAccessUpdate}
              >
                {busyId.startsWith("all:")
                  ? "Se actualizează..."
                  : bulkAccessAction === "block"
                    ? "Blochează pe toți"
                    : "Deblochează pe toți"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}

export default AllowedStudentsAdminPanel
