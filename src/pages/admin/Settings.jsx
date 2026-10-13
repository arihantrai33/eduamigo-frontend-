import { useEffect, useState } from "react";
import axios from "axios";
import { toast, errorMessage, confirmAction } from "../../utils/toast";
import Glyph from "../../components/Glyph";
import PageHeader from "../../components/ui/PageHeader";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const inputStyle = {
  padding: "9px 11px", borderRadius: 8, border: "1px solid #E2E8F0",
  fontSize: 13, color: "#0F172A", outline: "none", background: "#F8FAFC",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};
const card = { background: "#fff", border: "1px solid #E8E8E5", borderRadius: 12, padding: "1.5rem", marginBottom: 16 };
const title = { fontSize: 13, fontWeight: 600, color: "var(--brand)", marginBottom: 12 };
const label = { fontSize: 11, color: "#64748B", fontWeight: 600 };

function Field({ text, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={label}>{text}</span>
      {children}
    </label>
  );
}

// Webhook address Razorpay should call; works whether VITE_API_URL is absolute or "/api".
function webhookUrl(path) {
  const base = API.startsWith("http") ? API.replace(/\/api\/?$/, "") : window.location.origin;
  return `${base}${path}`;
}

function OnlinePayments() {
  const [cfg, setCfg] = useState(null);
  const [form, setForm] = useState({ keyId: "", keySecret: "", webhookSecret: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get(`${API}/payments/settings`, auth());
      setCfg(res.data.data);
      setForm({ keyId: res.data.data.keyId || "", keySecret: "", webhookSecret: "" });
    } catch (err) {
      setCfg({ error: errorMessage(err, "Could not load payment settings") });
    }
  };
  useEffect(() => { load(); }, []);

  const save = async (enabled) => {
    setSaving(true);
    try {
      const body = { keyId: form.keyId.trim(), enabled };
      if (form.keySecret) body.keySecret = form.keySecret;
      if (form.webhookSecret) body.webhookSecret = form.webhookSecret;
      await axios.put(`${API}/payments/settings`, body, auth());
      toast.success(enabled ? "Online payments are on" : "Payment settings saved");
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!cfg) return <div style={card}><div style={title}>Online Fee Payments</div><div style={{ fontSize: 13, color: "#94A3B8" }}>Loading...</div></div>;
  if (cfg.error) return <div style={card}><div style={title}>Online Fee Payments</div><div style={{ fontSize: 13, color: "#B91C1C" }}>{cfg.error}</div></div>;
  const url = webhookUrl(cfg.webhookPath);
  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={title}>Online Fee Payments (Razorpay)</div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: cfg.enabled ? "#DCFCE7" : "#F1F5F9", color: cfg.enabled ? "#15803D" : "#64748B" }}>{cfg.enabled ? "On" : "Off"}</span>
      </div>
      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12, lineHeight: 1.6 }}>
        Parents and students pay fees from the app with UPI, cards or net banking. Money goes straight to your school's Razorpay account and receipts are issued automatically.
        Get the keys from Razorpay Dashboard → Account &amp; Settings → API Keys. Use Test Mode keys (rzp_test_…) first.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <Field text="Key ID"><input style={inputStyle} value={form.keyId} onChange={e => setForm({ ...form, keyId: e.target.value })} placeholder="rzp_test_..." autoComplete="off" /></Field>
        <Field text="Key Secret"><input style={inputStyle} type="password" value={form.keySecret} onChange={e => setForm({ ...form, keySecret: e.target.value })} placeholder={cfg.hasKeySecret ? "Saved. Type to replace" : "Paste the key secret"} autoComplete="new-password" /></Field>
        <Field text="Webhook Secret"><input style={inputStyle} type="password" value={form.webhookSecret} onChange={e => setForm({ ...form, webhookSecret: e.target.value })} placeholder={cfg.hasWebhookSecret ? "Saved. Type to replace" : "Secret you set on the webhook"} autoComplete="new-password" /></Field>
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: "#475569", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", lineHeight: 1.6 }}>
        In Razorpay Dashboard → Webhooks, add this URL with the events <b>payment.captured</b>, <b>order.paid</b> and <b>payment.failed</b>, and use the same webhook secret as above:
        <div style={{ fontFamily: "monospace", fontSize: 12, marginTop: 4, wordBreak: "break-all", color: "#0F172A" }}>{url}</div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
        {cfg.enabled && <button onClick={() => save(false)} disabled={saving} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#B91C1C", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Turn off</button>}
        <button onClick={() => save(cfg.enabled)} disabled={saving} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#334155", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save keys</button>
        {!cfg.enabled && <button onClick={() => save(true)} disabled={saving} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save and turn on</button>}
      </div>
    </div>
  );
}

// The school's EduAmigo plan, modules and bills (issued and paid invoices).
const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const utcDay = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—");

function PlanAndBills({ school }) {
  const [invoices, setInvoices] = useState(null);
  useEffect(() => {
    axios.get(`${API}/schools/me/invoices`, auth()).then((r) => setInvoices(r.data.data || [])).catch(() => setInvoices([]));
  }, []);
  const sub = school?.subscription;
  return (
    <div style={card}>
      <div style={title}>EduAmigo plan and bills</div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, color: "#334155", marginBottom: 12 }}>
        <span>Plan: <strong>{school?.plan?.name || "—"}</strong></span>
        <span>Status: <strong style={{ textTransform: "capitalize" }}>{(sub?.status || "—").replace("_", " ")}</strong></span>
        {sub?.endsAt && <span>{sub.status === "trial" ? "Trial ends" : "Paid until"}: <strong>{utcDay(sub.endsAt)}</strong></span>}
        <span>School code: <strong>{school?.code}</strong></span>
      </div>
      {!invoices ? <p style={{ fontSize: 13, color: "#64748B" }}>Loading bills…</p> : invoices.length === 0 ? (
        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>No bills yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>{["Invoice", "Period", "Students", "Total", "Status", "Due"].map((h) => <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: "#64748B", fontWeight: 600, borderBottom: "1px solid #E2E8F0" }}>{h}</th>)}</tr></thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id}>
                <td style={td}>{inv.number}</td>
                <td style={td}>{utcDay(inv.periodFrom)} – {utcDay(inv.periodTo)}</td>
                <td style={td}>{inv.activeStudents}</td>
                <td style={td}><strong>{rupees(inv.total)}</strong> <span style={{ color: "#64748B" }}>incl. GST {inv.taxRate}%</span></td>
                <td style={td}><span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: inv.status === "paid" ? "#DCFCE7" : "#FEF3C7", color: inv.status === "paid" ? "#166534" : "#92400E" }}>{inv.status === "paid" ? "Paid" : "Due"}</span></td>
                <td style={td}>{inv.status === "paid" ? `Paid ${new Date(inv.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : utcDay(inv.dueDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
const td = { padding: "8px", borderBottom: "1px solid #F1F5F9" };

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
      <PageHeader title="Settings" subtitle="School profile, academic year and subjects" />
    </div>
  );

  if (loading) return <div style={{ fontFamily: "inherit" }}>{header}<div style={{ ...card, color: "#94A3B8", fontSize: 13 }}>Loading settings...</div></div>;
  if (error) return <div style={{ fontFamily: "inherit" }}>{header}<div style={{ ...card, color: "#B91C1C", fontSize: 13 }}>{error}</div></div>;

  return (
    <div style={{ fontFamily: "inherit" }}>
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
        <button onClick={save} disabled={saving} style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <PlanAndBills school={school} />
      <OnlinePayments />

      <div style={card}>
        <div style={title}>Subjects</div>
        <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}>Extra subjects your school teaches, shown in teacher and timetable forms.</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input style={inputStyle} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSubject()} placeholder="e.g. Sanskrit" />
          <button onClick={addSubject} style={{ padding: "0 18px", borderRadius: 8, border: "none", background: "var(--brand-soft)", color: "var(--brand-dark)", fontWeight: 600, cursor: "pointer" }}>Add</button>
        </div>
        {subjects.length === 0 ? (
          <div style={{ fontSize: 12, color: "#94A3B8" }}>No custom subjects yet.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {subjects.map((s) => (
              <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F1F5F9", borderRadius: 999, padding: "5px 6px 5px 12px", fontSize: 12, color: "#334155" }}>
                {s}
                <button aria-label={`Remove ${s}`} onClick={() => removeSubject(s)} style={{ border: "none", background: "#E2E8F0", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", color: "#475569" }}><Glyph e="×" /></button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
