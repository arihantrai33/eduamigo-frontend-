import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { currentAcademicYear } from "../../utils/academicYear";
import SupportContent from "../../components/SupportContent";
import { signOutEverywhere } from "../../utils/account";

import Glyph from "../../components/Glyph";
import BottomNav from "../../layout/BottomNav";
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export default function TeacherProfile() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API}/teachers/me`, authHeader());
      if (res.data.success) setTeacher(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };
  const getInitial = () => (teacher?.name || "T")[0].toUpperCase();

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ fontSize: 14, color: "var(--subtext)" }}>Loading...</div>
    </div>
  );

  if (showProfile) return (
    <div style={{ position: "absolute", inset: 0, background: "var(--bg)", fontFamily: "inherit", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "var(--brand-gradient)", padding: "48px 16px 24px", color: "white", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button type="button" aria-label="Back" onClick={() => setShowProfile(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}><Glyph e="←" /></button>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>My Information</h2>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ width: "84px", height: "84px", borderRadius: "50%", background: "var(--brand-gradient)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: "32px", fontWeight: "700", color: "white", border: "3px solid #e5e7eb" }}>
            {getInitial()}
          </div>
          <div style={{ fontSize: "12px", color: "var(--subtext)", marginTop: "8px" }}>Profile photo is managed by school admin</div>
        </div>
        {[
          { label: "Full Name",     value: teacher?.name || "—" },
          { label: "Email",         value: teacher?.email || "—" },
          { label: "Employee ID",   value: teacher?.employeeId || "—" },
          { label: "Mobile",        value: teacher?.phone || "—" },
          { label: "Gender",        value: teacher?.gender || "—" },
          { label: "Date of Birth", value: teacher?.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—" },
          { label: "Joining Date",  value: teacher?.joiningDate ? new Date(teacher.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—" },
          { label: "Address",       value: teacher?.address || "—" },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--subtext)", textTransform: "uppercase", letterSpacing: "1px" }}>{f.label}</label>
            <div style={{ padding: "13px 15px", borderRadius: "12px", background: "var(--bg)", border: "1.5px solid var(--border)", fontSize: "14px", marginTop: "6px", color: "#444" }}>{f.value}</div>
          </div>
        ))}
        <div style={{ background: "#FFF9C4", borderRadius: "12px", padding: "12px 16px", marginTop: "8px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "18px" }}><Glyph e="⚠" /></span>
          <div style={{ fontSize: "13px", color: "#F57F17", fontWeight: "600", lineHeight: 1.5 }}>
            Profile details can only be changed by school administration. Contact HR for any corrections.
          </div>
        </div>
      </div>
    </div>
  );

  if (showSettings) return (
    <div style={{ position: "absolute", inset: 0, background: "var(--bg)", fontFamily: "inherit", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "var(--brand-gradient)", padding: "48px 16px 24px", color: "white", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button type="button" aria-label="Back" onClick={() => setShowSettings(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}><Glyph e="←" /></button>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>Settings</h2>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{ background: "var(--card)", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--subtext)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Account</div>
          {["Change Password"].map((item, i, arr) => (
            <div key={item} onClick={() => navigate("/change-password")} style={{ padding: "14px 0", borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <span style={{ fontSize: "14px", fontWeight: "600" }}>{item}</span>
              <span style={{ color: "#ccc" }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (showIdCard) return (
    <div style={{ position: "absolute", inset: 0, background: "var(--bg)", fontFamily: "inherit", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "var(--brand-gradient)", padding: "48px 16px 24px", color: "white", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button type="button" aria-label="Back" onClick={() => setShowIdCard(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}><Glyph e="←" /></button>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>Teacher ID Card</h2>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "320px", background: "var(--card)", borderRadius: "20px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
          <div style={{ background: "var(--brand-gradient)", padding: "20px", color: "white", textAlign: "center" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "2px", opacity: .8 }}>EDUAMIGO SCHOOL</div>
            <div style={{ fontSize: "11px", opacity: .7 }}>Faculty Identity Card {currentAcademicYear()}</div>
          </div>
          <div style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "var(--brand-gradient)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: "28px", fontWeight: "700", color: "white", border: "3px solid #e5e7eb" }}>
              {getInitial()}
            </div>
            <div style={{ fontWeight: "800", fontSize: "18px", color: "var(--text)" }}>{teacher?.name || "—"}</div>
            <div style={{ fontSize: "13px", color: "var(--subtext2)", marginTop: "4px" }}>{teacher?.subjects?.join(", ") || "—"} • {teacher?.qualification || "—"}</div>
            <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", textAlign: "left" }}>
              {[
                ["Employee ID", teacher?.employeeId || "—"],
                ["Email",       teacher?.email || "—"],
                ["Classes",     teacher?.assignedClasses?.join(", ") || "—"],
                ["Session",     currentAcademicYear()],
              ].map(([l, v]) => (
                <div key={l} style={{ background: "var(--bg)", borderRadius: "10px", padding: "10px" }}>
                  <div style={{ fontSize: "10px", color: "var(--subtext)", fontWeight: "700", textTransform: "uppercase" }}>{l}</div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text)", marginTop: "2px" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "var(--bg)", padding: "12px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "var(--subtext)" }}>If found, please return to school administration</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (showHelp) return (
    <div style={{ position: "absolute", inset: 0, background: "var(--bg)", fontFamily: "inherit", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "var(--brand-gradient)", padding: "48px 16px 24px", color: "white", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button type="button" aria-label="Back" onClick={() => setShowHelp(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}><Glyph e="←" /></button>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>Help & Support</h2>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <SupportContent role="teacher" />
      </div>
    </div>
  );

  const menuItems = [
    { icon: <Glyph e="👤" />, label: "View Profile",    sub: "Your school information",  action: () => setShowProfile(true) },
    { icon: <Glyph e="🔔" />, label: "Notifications",   sub: "View all notifications",   action: () => navigate("/teacher/notifications") },
    { icon: <Glyph e="⚙" />, label: "Settings",        sub: "Password and account",          action: () => setShowSettings(true) },
    { icon: <Glyph e="🪪" />, label: "Teacher ID Card", sub: "View your faculty ID",     action: () => setShowIdCard(true) },
    { icon: <Glyph e="🤝" />, label: "Help & Support",  sub: "FAQs and contact",         action: () => setShowHelp(true) },
  ];

  return (
    <div className="ea-pd-narrow" style={{ position: "absolute", inset: 0, background: "var(--bg)", fontFamily: "inherit", overflowY: "auto", paddingBottom: "80px" }}>
      <div className="ea-pd-band" style={{ background: "var(--brand-gradient)", padding: "48px 16px 40px", color: "white", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <button type="button" aria-label="Back" onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", cursor: "pointer", fontSize: "16px" }}><Glyph e="←" /></button>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>My Profile</h2>
          <div style={{ width: "36px" }} />
        </div>
        <div style={{ width: "84px", height: "84px", borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "700", border: "3px solid rgba(255,255,255,0.5)", margin: "0 auto 12px" }}>
          {getInitial()}
        </div>
        <div style={{ fontWeight: "700", fontSize: "22px" }}>{teacher?.name || "—"}</div>
        <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "4px" }}>{teacher?.subjects?.join(" • ") || "—"} • {teacher?.email || "—"}</div>
        <div style={{ marginTop: "10px" }}>
          <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}><Glyph e="🏫" /> Faculty</span>
        </div>
      </div>

      <div className="ea-pd-body" style={{ padding: "16px", marginTop: "-20px" }}>
        <div style={{ background: "var(--card)", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", textAlign: "center" }}>
            {[
              { label: "CLASSES",    value: teacher?.assignedClasses?.length || "—" },
              { label: "SUBJECTS",   value: teacher?.subjects?.length || "—" },
              { label: "EXPERIENCE", value: teacher?.experience ? `${teacher.experience}Y` : "—" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontWeight: "700", fontSize: "18px", color: "var(--brand)" }}>{s.value}</div>
                <div style={{ fontSize: "9px", color: "var(--subtext)", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--card)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "16px" }}>
          {menuItems.map((item, i) => (
            <div key={item.label} onClick={item.action} style={{ padding: "16px", borderBottom: i < menuItems.length - 1 ? "1px solid #f3f4f6" : "none", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#f5f6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", fontSize: "14px", color: "var(--text)" }}>{item.label}</div>
                <div style={{ fontSize: "12px", color: "var(--subtext)", marginTop: "2px" }}>{item.sub}</div>
              </div>
              <div style={{ color: "#ccc", fontSize: "18px" }}>›</div>
            </div>
          ))}
        </div>

        <div onClick={() => signOutEverywhere(logout, navigate)} style={{ background: "var(--card)", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", marginBottom: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}><Glyph e="📵" /></div>
          <div style={{ flex: 1, fontWeight: "600", fontSize: "14px", color: "#C2410C" }}>Sign out on all devices</div>
          <div style={{ color: "#C2410C", fontSize: "18px" }}>›</div>
        </div>

        <div onClick={handleLogout} style={{ background: "var(--card)", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}><Glyph e="🚪" /></div>
          <div style={{ flex: 1, fontWeight: "600", fontSize: "14px", color: "#ef4444" }}>Log Out</div>
          <div style={{ color: "#ef4444", fontSize: "18px" }}>›</div>
        </div>
      </div>

      <BottomNav role="teacher" />
    </div>
  );
}
