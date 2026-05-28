import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Award,
  BookOpen, Users, Briefcase, IndianRupee, Edit,
  CheckCircle, XCircle, Clock, GraduationCap, Hash
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const InfoField = ({ icon: Icon, label, value, accent = "#4F46E5" }) => (
  <div style={{
    display: "flex", alignItems: "flex-start", gap: 12,
    padding: "14px 16px", background: "#F8FAFC",
    borderRadius: 12, border: "1px solid #F1F5F9",
  }}>
    <div style={{
      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
      background: `${accent}12`, display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={15} color={accent} />
    </div>
    <div>
      <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 600, lineHeight: 1.4 }}>
        {value || <span style={{ color: "#CBD5E1", fontWeight: 400 }}>Not provided</span>}
      </div>
    </div>
  </div>
);

const SectionHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.1px" }}>{title}</div>
    {subtitle && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{subtitle}</div>}
  </div>
);

const SkeletonBlock = ({ h = 16, w = "100%", radius = 8 }) => (
  <div style={{
    height: h, width: w, borderRadius: radius,
    background: "linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
  }} />
);

export default function TeacherProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchTeacher();
  }, [id]);

  const fetchTeacher = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API}/teachers/${id}`, authHeader());
      setTeacher(res.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load teacher profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  const formatSalary = (amount) => {
    if (!amount && amount !== 0) return null;
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const avatarColors = [
    { bg: "#EEF2FF", text: "#4F46E5" },
    { bg: "#F0FDF4", text: "#16A34A" },
    { bg: "#FFF7ED", text: "#EA580C" },
    { bg: "#F0F9FF", text: "#0284C7" },
    { bg: "#FDF4FF", text: "#9333EA" },
  ];
  const colorIdx = teacher?.name
    ? teacher.name.charCodeAt(0) % avatarColors.length
    : 0;
  const avatarColor = avatarColors[colorIdx];

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .profile-card { animation: fadeIn 0.3s ease; }
      `}</style>

      <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate("/admin/teachers")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                border: "1px solid #E2E8F0", background: "#fff",
                fontSize: 13, cursor: "pointer", color: "#64748B",
                fontWeight: 500, transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.color = "#0F172A"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#64748B"; }}
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>Teacher Profile</div>
          </div>
          {!loading && teacher && (
            <button
              onClick={() => navigate(`/admin/teachers/edit/${id}`)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 10,
                border: "none", background: "#4F46E5",
                fontSize: 13, cursor: "pointer", color: "#fff",
                fontWeight: 600, transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#4338CA"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#4F46E5"; }}
            >
              <Edit size={13} />
              Edit Profile
            </button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div style={{
            background: "#FFF1F2", border: "1px solid #FECDD3",
            borderRadius: 12, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <XCircle size={18} color="#E11D48" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#9F1239" }}>Error Loading Profile</div>
              <div style={{ fontSize: 12, color: "#BE123C", marginTop: 2 }}>{error}</div>
            </div>
            <button
              onClick={fetchTeacher}
              style={{
                marginLeft: "auto", padding: "6px 14px", borderRadius: 8,
                border: "1px solid #FECDD3", background: "#fff",
                fontSize: 12, cursor: "pointer", color: "#E11D48", fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "28px 28px" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 28 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F1F5F9" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <SkeletonBlock h={20} w="40%" />
                <SkeletonBlock h={14} w="60%" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {Array(6).fill(0).map((_, i) => <SkeletonBlock key={i} h={64} radius={12} />)}
            </div>
          </div>
        )}

        {/* Profile Card */}
        {!loading && !error && teacher && (
          <div className="profile-card">

            {/* Hero Section */}
            <div style={{
              background: "#fff", border: "1px solid #E2E8F0",
              borderRadius: 16, padding: "28px", marginBottom: 16,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
                {/* Avatar */}
                <div style={{
                  width: 72, height: 72, borderRadius: 20, flexShrink: 0,
                  background: avatarColor.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 700, color: avatarColor.text,
                  border: `2px solid ${avatarColor.text}22`,
                }}>
                  {getInitials(teacher.name)}
                </div>

                {/* Name & Meta */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>{teacher.name}</div>
                    <span style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
                      background: teacher.isActive ? "#F0FDF4" : "#FFF1F2",
                      color: teacher.isActive ? "#16A34A" : "#E11D48",
                      border: `1px solid ${teacher.isActive ? "#BBF7D0" : "#FECDD3"}`,
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      {teacher.isActive
                        ? <><CheckCircle size={10} /> Active</>
                        : <><XCircle size={10} /> Inactive</>}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                    {teacher.subjects?.length > 0 && (
                      <span style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
                        <BookOpen size={12} color="#94A3B8" />
                        {teacher.subjects.join(", ")}
                      </span>
                    )}
                    {teacher.employeeId && (
                      <>
                        <span style={{ color: "#CBD5E1", fontSize: 12 }}>·</span>
                        <span style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
                          <Hash size={11} color="#94A3B8" />
                          {teacher.employeeId}
                        </span>
                      </>
                    )}
                    {teacher.experience > 0 && (
                      <>
                        <span style={{ color: "#CBD5E1", fontSize: 12 }}>·</span>
                        <span style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={11} color="#94A3B8" />
                          {teacher.experience} {teacher.experience === 1 ? "year" : "years"} experience
                        </span>
                      </>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
                    {[
                      {
                        icon: Users, label: "Classes Assigned",
                        value: teacher.assignedClasses?.length || 0,
                        color: "#4F46E5", bg: "#EEF2FF",
                      },
                      {
                        icon: BookOpen, label: "Subjects",
                        value: teacher.subjects?.length || 0,
                        color: "#16A34A", bg: "#F0FDF4",
                      },
                      {
                        icon: Calendar, label: "Joined",
                        value: formatDate(teacher.joiningDate) || "—",
                        color: "#0284C7", bg: "#F0F9FF",
                        small: true,
                      },
                    ].map((stat, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", background: stat.bg,
                        borderRadius: 12, minWidth: 120,
                      }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: `${stat.color}18`, display: "flex",
                          alignItems: "center", justifyContent: "center",
                        }}>
                          <stat.icon size={14} color={stat.color} />
                        </div>
                        <div>
                          <div style={{ fontSize: stat.small ? 11 : 18, fontWeight: stat.small ? 600 : 800, color: stat.color, lineHeight: 1.2 }}>
                            {stat.value}
                          </div>
                          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{stat.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* Personal Info */}
              <div style={{
                background: "#fff", border: "1px solid #E2E8F0",
                borderRadius: 16, padding: "24px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <SectionHeader title="Personal Information" subtitle="Contact and personal details" />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <InfoField icon={Mail}    label="Email Address"  value={teacher.email}              accent="#4F46E5" />
                  <InfoField icon={Phone}   label="Phone Number"   value={teacher.phone}              accent="#16A34A" />
                  <InfoField icon={Users}   label="Gender"         value={teacher.gender}             accent="#0284C7" />
                  <InfoField icon={MapPin}  label="Address"        value={teacher.address}            accent="#EA580C" />
                </div>
              </div>

              {/* Professional Info */}
              <div style={{
                background: "#fff", border: "1px solid #E2E8F0",
                borderRadius: 16, padding: "24px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <SectionHeader title="Professional Information" subtitle="Qualifications and employment details" />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <InfoField icon={GraduationCap} label="Qualification"  value={teacher.qualification}          accent="#9333EA" />
                  <InfoField icon={Briefcase}     label="Experience"      value={teacher.experience ? `${teacher.experience} ${teacher.experience === 1 ? "year" : "years"}` : null} accent="#D97706" />
                  <InfoField icon={Calendar}      label="Joining Date"    value={formatDate(teacher.joiningDate)} accent="#0284C7" />
                  <InfoField icon={IndianRupee}   label="Monthly Salary"  value={formatSalary(teacher.salary)}   accent="#16A34A" />
                </div>
              </div>

              {/* Assigned Classes */}
              <div style={{
                background: "#fff", border: "1px solid #E2E8F0",
                borderRadius: 16, padding: "24px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <SectionHeader title="Assigned Classes" subtitle={`${teacher.assignedClasses?.length || 0} classes assigned`} />
                {teacher.assignedClasses?.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {teacher.assignedClasses.map((cls, i) => (
                      <span key={i} style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 12,
                        fontWeight: 600, background: "#EEF2FF", color: "#4F46E5",
                        border: "1px solid #C7D2FE",
                      }}>
                        {cls}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: "center", padding: "24px 0",
                    color: "#94A3B8", fontSize: 13,
                  }}>
                    No classes assigned yet
                  </div>
                )}
              </div>

              {/* Subjects */}
              <div style={{
                background: "#fff", border: "1px solid #E2E8F0",
                borderRadius: 16, padding: "24px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <SectionHeader title="Subjects" subtitle={`${teacher.subjects?.length || 0} subjects assigned`} />
                {teacher.subjects?.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {teacher.subjects.map((sub, i) => (
                      <span key={i} style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 12,
                        fontWeight: 600, background: "#F0FDF4", color: "#16A34A",
                        border: "1px solid #BBF7D0",
                        display: "flex", alignItems: "center", gap: 5,
                      }}>
                        <BookOpen size={11} />
                        {sub}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: "center", padding: "24px 0",
                    color: "#94A3B8", fontSize: 13,
                  }}>
                    No subjects assigned yet
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
}