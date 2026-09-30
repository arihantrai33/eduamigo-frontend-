import { useEffect, useState } from "react";
import axios from "axios";
import { toast, errorMessage, confirmAction } from "../../utils/toast";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const inputStyle = {
  padding: "9px 11px", borderRadius: 8, border: "1px solid #E2E8F0",
  fontSize: 13, color: "#0F172A", outline: "none", background: "#F8FAFC",
  fontFamily: "Inter, sans-serif", width: "100%", boxSizing: "border-box",
};
const card = { background: "#fff", border: "1px solid #E8E8E5", borderRadius: 12, padding: "1.5rem", marginBottom: 16 };
const title = { fontSize: 13, fontWeight: 600, color: "#534AB7", marginBottom: 12 };
const label = { fontSize: 11, color: "#64748B", fontWeight: 600 };

function Field({ text, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={label}>{text}</span>
      {children}
    </label>
  );
}

export default function Settings() {
  const [school, setSchool] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, sub] = await Promise.all([
          axios.get(`${API}/schools/me`, auth()),
          axios.get(`${API}/schools/subjects`, auth()),
        ]);
        const d = s.data.data;
        setSchool({ ...d, lat: d.location?.lat ?? "", lng: d.location?.lng ?? "" });
        setSubjects(sub.data.data || []);
      } catch (err) {
        setError(errorMessage(err, "Could not load school settings"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (key) => (e) => setSchool({ ...school, [key]: e.target.value });

  const save = async () => {
    if (!school.name?.trim()) return toast.error("School name is required");
    const hasLocation = school.lat !== "" && school.lng !== "";
    setSaving(true);
    try {
      const payload = {
        name: school.name, email: school.email, phone: school.phone, address: school.address,
        principal: school.principal, workingDays: school.workingDays,
        ...(hasLocation ? { location: { lat: Number(school.lat), lng: Number(school.lng) } } : {}),
      };
      const res = await axios.put(`${API}/schools/me`, payload, auth());
      const d = res.data.data;
      setSchool({ ...d, lat: d.location?.lat ?? "", lng: d.location?.lng ?? "" });
      toast.success("School settings saved");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const addSubject = async () => {
    const subject = newSubject.trim();
    if (!subject) return;
    try {
      const res = await axios.post(`${API}/schools/subjects`, { subject }, auth());
      setSubjects(res.data.data || []);
      setNewSubject("");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const removeSubject = async (subject) => {
    if (!(await confirmAction(`Remove "${subject}" from the subject list?`, { confirmLabel: "Remove" }))) return;
    try {
      const res = await axios.delete(`${API}/schools/subjects`, { ...auth(), data: { subject } });
      setSubjects(res.data.data || []);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const header = (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>Settings</div>
      <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>School profile, academic year and subjects</div>
    </div>
  );

  if (loading) return <div style={{ fontFamily: "Inter, sans-serif" }}>{header}<div style={{ ...card, color: "#94A3B8", fontSize: 13 }}>Loading settings...</div></div>;
  if (error) return <div style={{ fontFamily: "Inter, sans-serif" }}>{header}<div style={{ ...card, color: "#B91C1C", fontSize: 13 }}>{error}</div></div>;

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      {header}

      <div style={card}>
        <div style={title}>School Information</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          <Field text="School name"><input style={inputStyle} value={school.name || ""} onChange={set("name")} /></Field>
          <Field text="Principal"><input style={inputStyle} value={school.principal || ""} onChange={set("principal")} /></Field>
          <Field text="Email"><input type="email" style={inputStyle} value={school.email || ""} onChange={set("email")} /></Field>
          <Field text="Phone"><input type="tel" style={inputStyle} value={school.phone || ""} onChange={set("phone")} /></Field>
          <Field text="Address"><input style={inputStyle} value={school.address || ""} onChange={set("address")} /></Field>
        </div>
      </div>

      <div style={card}>
        <div style={title}>Academic Year</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          <Field text="Current session (April to March)"><input style={{ ...inputStyle, color: "#64748B" }} value={school.academicYear} readOnly /></Field>
          <Field text="Working days">
            <select style={inputStyle} value={school.workingDays} onChange={set("workingDays")}>
              <option>Monday - Saturday</option>
              <option>Monday - Friday</option>
            </select>
          </Field>
        </div>
      </div>

      <div style={card}>
        <div style={title}>School Location</div>
        <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}>Used as the destination on parents' bus tracking map. Copy the coordinates from Google Maps (right-click on the school gate).</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <Field text="Latitude"><input type="number" step="any" style={inputStyle} value={school.lat} onChange={set("lat")} placeholder="e.g. 28.6280" /></Field>
          <Field text="Longitude"><input type="number" step="any" style={inputStyle} value={school.lng} onChange={set("lng")} placeholder="e.g. 77.3649" /></Field>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <button onClick={save} disabled={saving} style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "#534AB7", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div style={card}>
        <div style={title}>Subjects</div>
        <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}>Extra subjects your school teaches, shown in teacher and timetable forms.</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input style={inputStyle} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSubject()} placeholder="e.g. Sanskrit" />
          <button onClick={addSubject} style={{ padding: "0 18px", borderRadius: 8, border: "none", background: "#EEF2FF", color: "#4338CA", fontWeight: 600, cursor: "pointer" }}>Add</button>
        </div>
        {subjects.length === 0 ? (
          <div style={{ fontSize: 12, color: "#94A3B8" }}>No custom subjects yet.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {subjects.map((s) => (
              <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F1F5F9", borderRadius: 999, padding: "5px 6px 5px 12px", fontSize: 12, color: "#334155" }}>
                {s}
                <button aria-label={`Remove ${s}`} onClick={() => removeSubject(s)} style={{ border: "none", background: "#E2E8F0", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", color: "#475569" }}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
