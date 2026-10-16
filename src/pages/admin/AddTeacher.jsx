import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { showCredentials, errorMessage } from "../../utils/toast";
import PageHeader from "../../components/ui/PageHeader";
import { hasEntries, useUnsavedChanges } from "../../utils/unsavedChanges";
import FieldError from "../../components/ui/FieldError";
import { useFieldErrors } from "../../utils/fieldErrors";

const API = import.meta.env.VITE_API_URL
// Fields checked before saving; each input's id is "add-teacher-<name>".
const FIELDS = { name: "add-teacher-name", email: "add-teacher-email", phone: "add-teacher-phone", employeeId: "add-teacher-employeeId" }

const SUBJECTS = ["Mathematics", "Science", "English", "Hindi", "Social Studies", "Physics", "Chemistry", "Biology", "Computer Science", "Physical Education", "Art", "Music"]

const AddTeacher = () => {
  const { user } = useAuth()

  const [form, setForm] = useState({
    name: "", email: "", phone: "", employeeId: "",
    subjects: [], qualification: "", experience: "",
    gender: "", dateOfBirth: "", address: "", salary: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  useUnsavedChanges(hasEntries(form))
  const v = useFieldErrors(FIELDS)

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); v.clear(e.target.name) }

  const toggleSubject = (subject) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }))
  }

  const handleSubmit = async () => {
    setError(null)
    setSuccess(null)
    if (!v.check({
      name: !form.name.trim() && "Enter the teacher's full name",
      email: !form.email.trim() && "Enter the teacher's email",
      phone: !form.phone.trim() && "Enter the teacher's phone number",
      employeeId: !form.employeeId.trim() && "Enter the employee ID",
    })) return
    if (form.subjects.length === 0) {
      setError("Please select at least one subject.")
      return
    }
    try {
      setLoading(true)
      const res = await fetch(`${API}/teachers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to add teacher")
      setSuccess("Teacher added successfully")
      showCredentials([{ label: "Teacher", ...data.credentials }], "Teacher added")
      setForm({ name: "", email: "", phone: "", employeeId: "", subjects: [], qualification: "", experience: "", gender: "", dateOfBirth: "", address: "", salary: "" })
    } catch (err) {
      setError(errorMessage(err, "Could not add the teacher"))
    } finally {
      setLoading(false)
    }
  }

  // "Full Name *": the star marks a required field; it is drawn apart from the label text.
  const inp = (label, name, type = "text", options = null) => {
    const required = label.endsWith(" *")
    const text = required ? label.slice(0, -2) : label
    return (
      <label className="ea-field">
        <span className="ea-label">{text}{required && <span className="ea-label__req" aria-hidden="true">*</span>}</span>
        {options ? (
          <select id={`add-teacher-${name}`} name={name} value={form[name]} onChange={handleChange} className="ea-select" aria-required={required || undefined} {...v.invalid(name)}>
            <option value="">Select</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input id={`add-teacher-${name}`} type={type} name={name} value={form[name]} onChange={handleChange} className="ea-input" aria-required={required || undefined} {...v.invalid(name)} />
        )}
        <FieldError id={`add-teacher-${name}-error`}>{v.errors[name]}</FieldError>
      </label>
    )
  }

  return (
    <div className="ea-page--read" style={{ fontFamily: "inherit" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <PageHeader title="Add Teacher" subtitle="Fill in the details to register a new teacher" />
      </div>

      {error   && <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ background: "#DCFCE7", color: "#16A34A", padding: "10px 14px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{success}</div>}

      <div className="ea-card" style={{ padding: 24 }}>

        <h2 className="ea-form-section__title">Personal Info</h2>
        <div className="ea-form-grid" style={{ marginBottom: 24 }}>
          {inp("Full Name *", "name")}
          {inp("Email *", "email", "email")}
          {inp("Phone *", "phone", "tel")}
          {inp("Employee ID *", "employeeId")}
          {inp("Date of Birth", "dateOfBirth", "date")}
          {inp("Gender", "gender", "text", ["Male", "Female", "Other"])}
          {inp("Address", "address")}
        </div>

        <h2 className="ea-form-section__title">Professional Info</h2>
        <div className="ea-form-grid" style={{ marginBottom: 24 }}>
          {inp("Qualification", "qualification")}
          {inp("Experience (years)", "experience", "number")}
          {inp("Salary", "salary", "number")}
        </div>

        <h2 className="ea-form-section__title" id="add-teacher-subjects">Subjects<span className="ea-label__req" aria-hidden="true">*</span></h2>
        <div role="group" aria-labelledby="add-teacher-subjects" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {SUBJECTS.map(s => (
            <button key={s} type="button" className="ea-chip" aria-pressed={form.subjects.includes(s)} onClick={() => toggleSubject(s)}>{s}</button>
          ))}
        </div>

        <div className="ea-form-actions">
          <button type="button" className="ea-btn ea-btn--ghost"
            onClick={() => setForm({ name: "", email: "", phone: "", employeeId: "", subjects: [], qualification: "", experience: "", gender: "", dateOfBirth: "", address: "", salary: "" })}>
            Cancel
          </button>
          <button type="button" className="ea-btn ea-btn--primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Teacher"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddTeacher