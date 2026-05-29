import { useState } from "react"
import { useAuth } from "../../context/AuthContext"

const API = import.meta.env.VITE_API_URL

const inputStyle = {
  padding: "8px 10px", borderRadius: 8, border: "0.5px solid #E8E8E5",
  fontSize: 12, color: "#1a1a1a", outline: "none", background: "#F5F5F3",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box"
}

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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

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
    if (!form.name || !form.email || !form.phone || !form.employeeId) {
      setError("Name, Email, Phone and Employee ID are required.")
      return
    }
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
      setSuccess(`Teacher added! Login: ${data.credentials?.email} / ${data.credentials?.password}`)
      setForm({ name: "", email: "", phone: "", employeeId: "", subjects: [], qualification: "", experience: "", gender: "", dateOfBirth: "", address: "", salary: "" })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = (label, name, type = "text", options = null) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>{label}</label>
      {options ? (
        <select name={name} value={form[name]} onChange={handleChange} style={inputStyle}>
          <option value="">Select</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={form[name]} onChange={handleChange} style={inputStyle} />
      )}
    </div>
  )

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Add Teacher</div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Fill in the details to register a new teacher</div>
      </div>

      {error   && <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ background: "#DCFCE7", color: "#16A34A", padding: "10px 14px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{success}</div>}

      <div style={{ background: "#fff", border: "0.5px solid #E8E8E5", borderRadius: 12, padding: "1.5rem" }}>

        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 12 }}>Personal Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {inp("Full Name *", "name")}
          {inp("Email *", "email", "email")}
          {inp("Phone *", "phone", "tel")}
          {inp("Employee ID *", "employeeId")}
          {inp("Date of Birth", "dateOfBirth", "date")}
          {inp("Gender", "gender", "text", ["Male", "Female", "Other"])}
          {inp("Address", "address")}
        </div>

        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 12 }}>Professional Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {inp("Qualification", "qualification")}
          {inp("Experience (years)", "experience", "number")}
          {inp("Salary", "salary", "number")}
        </div>

        <div style={{ fontSize: 12, fontWeight: 500, color: "#534AB7", marginBottom: 8 }}>Subjects *</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {SUBJECTS.map(s => (
            <button key={s} onClick={() => toggleSubject(s)} style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontWeight: 500,
              border: form.subjects.includes(s) ? "none" : "0.5px solid #E8E8E5",
              background: form.subjects.includes(s) ? "#534AB7" : "#F5F5F3",
              color: form.subjects.includes(s) ? "#fff" : "#666",
            }}>{s}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => setForm({ name: "", email: "", phone: "", employeeId: "", subjects: [], qualification: "", experience: "", gender: "", dateOfBirth: "", address: "", salary: "" })}
            style={{ padding: "8px 20px", borderRadius: 8, border: "0.5px solid #E8E8E5", background: "#F5F5F3", fontSize: 12, color: "#666", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: loading ? "#9CA3AF" : "#534AB7", fontSize: 12, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontWeight: 500 }}>
            {loading ? "Adding..." : "Add Teacher"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddTeacher