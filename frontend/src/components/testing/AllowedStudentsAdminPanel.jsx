import { useCallback, useEffect, useState } from "react"

import {
  createAllowedStudent,
  deleteAllowedStudent,
  getAllowedStudents,
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

  const refresh = useCallback(async () => {
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

  async function handleDelete(student) {
    if (!window.confirm(`Esti sigur ca vrei sa stergi accesul pentru ${student.email}?`)) {
      return
    }
    setBusyId(student.id)
    setError("")
    setMessage("")
    try {
      await deleteAllowedStudent(student.id)
      setMessage("Adresa a fost stearsa.")
      await refresh()
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setBusyId("")
    }
  }

  return (
    <section className="admin-control-panel allowed-students-panel">
      <div className="allowed-students-heading">
        <div>
          <p className="section-kicker">Control acces</p>
          <h2 className="testing-section-title mt-2 text-2xl text-ink">Administrare acces elevi</h2>
          <p className="testing-section-copy mt-3 text-sm leading-7 text-slate-600">
            Aprobi adresele de email, blochezi accesul sau inchizi de la distanta sesiunea unui elev.
          </p>
        </div>
        <button className="btn-secondary" type="button" onClick={refresh} disabled={isLoading}>
          Reincarca lista
        </button>
      </div>

      <form className="allowed-students-form mt-5" onSubmit={handleAdd}>
        <label className="access-input-shell">
          <span className="section-kicker">Nume elev</span>
          <input
            className="testing-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nume complet"
            required
          />
        </label>
        <label className="access-input-shell">
          <span className="section-kicker">Email</span>
          <input
            className="testing-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="elev@exemplu.ro"
            type="email"
            required
          />
        </label>
        <button className="btn-primary" type="submit" disabled={busyId === "new"}>
          {busyId === "new" ? "Se adauga..." : "Adauga elev"}
        </button>
      </form>

      {message ? <div className="status-pill mt-4">{message}</div> : null}
      {error ? <div className="alert-panel mt-4">{error}</div> : null}

      <div className="mt-5 overflow-x-auto">
        <table className="testing-table allowed-students-table">
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
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>
                    <span className={student.is_blocked ? "status-pill is-danger" : "status-pill"}>
                      {student.is_blocked ? "Blocat" : "Activ"}
                    </span>
                  </td>
                  <td>
                    <div className="allowed-students-actions">
                      <button
                        className="btn-secondary"
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          handlePatch(
                            student,
                            { is_blocked: !student.is_blocked },
                            student.is_blocked ? "Accesul a fost deblocat." : "Accesul a fost blocat.",
                          )
                        }
                      >
                        {student.is_blocked ? "Deblocheaza" : "Blocheaza"}
                      </button>
                      <button
                        className="btn-secondary"
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          handlePatch(
                            student,
                            { force_logout: true },
                            "Deconectarea va avea loc la urmatoarea verificare.",
                          )
                        }
                      >
                        Refresh / Deconecteaza
                      </button>
                      <button
                        className="btn-secondary allowed-students-delete"
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDelete(student)}
                      >
                        Sterge
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!isLoading && students.length === 0 ? (
              <tr>
                <td colSpan="4">Lista este goala. Adauga primul elev autorizat.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default AllowedStudentsAdminPanel
