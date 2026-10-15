import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { resetStudentPassword } from "../../utils/account";
import { showCredentials, toast, errorMessage } from "../../utils/toast";
import PortalHeader from "../../components/ui/PortalHeader";

import { plural } from "../../utils/plural";
const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

// Students of the teacher's classes, with their sign-in ID. Students have no email, so when one forgets
// the password the class teacher gives a new temporary one here (the student sets their own after signing in).
export default function TeacherStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState(null);
  const [query, setQuery] = useState("");
  const [cls, setCls] = useState("");

  useEffect(() => {
    axios.get(`${API}/students`, auth())
      .then((r) => setStudents(r.data.data || []))
      .catch((err) => { toast.error(errorMessage(err, "Could not load students")); setStudents([]); });
  }, []);

  const classes = useMemo(
    () => [...new Set((students || []).map((s) => `${s.class}-${s.section}`))].sort((a, b) => a.localeCompare(b, "en", { numeric: true })),
    [students],
  );
  const shown = (students || []).filter((s) => {
    if (cls && `${s.class}-${s.section}` !== cls) return false;
    const q = query.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || String(s.admissionNo || "").toLowerCase() === q;
  });

  const reset = async (student) => {
    const credentials = await resetStudentPassword(student);
    if (!credentials) return;
    showCredentials([{ label: student.name, ...credentials }], "New password for the student");
  };

  return (
    <div className="ea-pd-narrow" style={s.screen}>
      <PortalHeader title="My Students" onBack={() => navigate("/teacher/home")}
        subtitle={students ? `${plural(students.length, "student")} in your classes` : "Loading..."} />

      <div className="ea-pd-body" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search students" placeholder="Search by name or admission no" style={{ ...s.input, flex: 1 }} />
          {classes.length > 1 && (
            <select value={cls} onChange={(e) => setCls(e.target.value)} style={s.input}>
              <option value="">All classes</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        {students && shown.length === 0 && (
          <div style={s.empty}>{students.length ? "No student matches your search." : "No students in your classes yet."}</div>
        )}

        <div style={{ display: "grid", gap: 8 }}>
          {shown.map((st) => (
            <div key={st._id} style={s.row}>
              <div style={s.avatar}>{st.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.name}>{st.name}</div>
                <div style={s.meta}>
                  Class {st.class}-{st.section} · Roll {st.rollNumber}
                  {st.admissionNo ? ` · Admission No ${st.admissionNo}` : ""}
                </div>
              </div>
              <button onClick={() => reset(st)} style={s.resetBtn} title="Give a new temporary password">Reset password</button>
            </div>
          ))}
        </div>
        <p style={s.note}>
          Students sign in with the school code and their admission number. A reset gives a temporary password;
          the student chooses a new one after signing in.
        </p>
      </div>
    </div>
  );
}

const s = {
  screen: { minHeight: "100vh", background: "#F4F6FB", fontFamily: "inherit" },
  input: { padding: "10px 12px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13, background: "#fff", outline: "none", minWidth: 0 },
  row: { display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 16, padding: "10px 12px", boxShadow: "0 2px 12px rgba(15,23,42,.05)" },
  avatar: { width: 38, height: 38, borderRadius: 12, background: "var(--brand-soft)", color: "var(--brand-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 },
  name: { fontSize: 14, fontWeight: 700, color: "#1C2033", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  meta: { fontSize: 11.5, color: "#7B8099", marginTop: 1 },
  resetBtn: { padding: "7px 10px", borderRadius: 10, border: "1px solid var(--brand-border)", background: "var(--brand-soft)", color: "var(--brand-dark)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  empty: { textAlign: "center", padding: "30px 10px", color: "#7B8099", fontSize: 13 },
  note: { fontSize: 11.5, color: "#7B8099", textAlign: "center", lineHeight: 1.5, marginTop: 16 },
};
