import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

export default function TeacherProfile() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('eduamigo_user'));
        const res = await fetch(`${API}/teachers/me`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to load profile');
        setTeacher(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <p style={styles.loadingText}>Loading Profile...</p>
    </div>
  );

  if (error) return (
    <div style={styles.centered}>
      <p style={styles.errorText}>⚠️ {error}</p>
    </div>
  );

  if (!teacher) return (
    <div style={styles.centered}>
      <p style={styles.emptyText}>No profile data found.</p>
    </div>
  );

  const initials = teacher.name
    ? teacher.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'T';

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/teacher/home')} style={styles.backBtn}>←</button>
        <div>
          <p style={styles.portalLabel}>TEACHER PORTAL</p>
          <h1 style={styles.headerTitle}>My Profile</h1>
        </div>
      </div>

      <div style={styles.content}>
        {/* Avatar Card */}
        <div style={styles.avatarCard}>
          <div style={styles.avatar}>
            {teacher.photo
              ? <img src={teacher.photo} alt="Profile" style={styles.avatarImg} />
              : <span style={styles.avatarInitials}>{initials}</span>
            }
          </div>
          <h2 style={styles.teacherName}>{teacher.name}</h2>
          <p style={styles.teacherDesig}>
            {teacher.subjects?.length > 0 ? teacher.subjects.join(' • ') : 'Teacher'}
          </p>
          <div style={styles.badgeRow}>
            <span style={styles.badge}>🎓 {teacher.qualification || 'N/A'}</span>
            <span style={styles.badge}>🏫 {teacher.experience ? `${teacher.experience} yrs exp` : 'N/A'}</span>
          </div>
          {teacher.employeeId && (
            <p style={styles.empId}>Employee ID: {teacher.employeeId}</p>
          )}
        </div>

        {/* Personal Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Personal Information</h3>
          <div style={styles.card}>
            <InfoRow icon="✉️" label="Email" value={teacher.email || 'Not provided'} />
            <InfoRow icon="📱" label="Mobile" value={teacher.phone || 'Not provided'} />
            <InfoRow icon="⚧️" label="Gender" value={teacher.gender || 'Not provided'} />
            <InfoRow icon="🎂" label="Date of Birth" value={
              teacher.dateOfBirth
                ? new Date(teacher.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                : 'Not provided'
            } last />
          </div>
        </div>

        {/* Professional Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Professional Information</h3>
          <div style={styles.card}>
            <InfoRow icon="📚" label="Subjects" value={
              teacher.subjects?.length > 0 ? teacher.subjects.join(', ') : 'Not assigned'
            } />
            <InfoRow icon="🏛️" label="Assigned Classes" value={
              teacher.assignedClasses?.length > 0 ? teacher.assignedClasses.join(', ') : 'Not assigned'
            } />
            <InfoRow icon="🎓" label="Qualification" value={teacher.qualification || 'Not provided'} />
            <InfoRow icon="💼" label="Experience" value={
              teacher.experience ? `${teacher.experience} Years` : 'Not provided'
            } />
            <InfoRow icon="📅" label="Joining Date" value={
              teacher.joiningDate
                ? new Date(teacher.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                : 'Not provided'
            } last />
          </div>
        </div>

        {/* Contact Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Contact Information</h3>
          <div style={styles.card}>
            <InfoRow icon="📱" label="Mobile Number" value={teacher.phone || 'Not provided'} />
            <InfoRow icon="📍" label="Address" value={teacher.address || 'Not provided'} last />
          </div>
        </div>

        <div style={{ height: 100 }} />
      </div>

      {/* Bottom Nav */}
      <div style={styles.bottomNav}>
        <NavItem icon="🏠" label="Home" onClick={() => navigate('/teacher/home')} />
        <NavItem icon="✅" label="Attendance" onClick={() => navigate('/teacher/attendance')} />
        <NavItem icon="📤" label="Upload" onClick={() => navigate('/teacher/upload')} />
        <NavItem icon="💬" label="Messages" onClick={() => navigate('/teacher/chat')} />
        <NavItem icon="👤" label="Me" onClick={() => navigate('/teacher/profile')} active />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, last }) {
  return (
    <div style={{ ...styles.infoRow, borderBottom: last ? 'none' : '1px solid #F0F0F0' }}>
      <span style={styles.infoIcon}>{icon}</span>
      <div style={styles.infoContent}>
        <p style={styles.infoLabel}>{label}</p>
        <p style={styles.infoValue}>{value}</p>
      </div>
    </div>
  );
}

function NavItem({ icon, label, onClick, active }) {
  return (
    <button onClick={onClick} style={styles.navItem}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ ...styles.navLabel, color: active ? '#5C6BC0' : '#9E9E9E' }}>{label}</span>
    </button>
  );
}

const styles = {
  container: {
    fontFamily: "'Poppins', sans-serif",
    backgroundColor: '#F5F6FA',
    minHeight: '100vh',
    maxWidth: 420,
    margin: '0 auto',
    position: 'relative',
  },
  header: {
    background: 'linear-gradient(135deg, #5C6BC0, #3949AB)',
    padding: '20px 16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#fff',
    fontSize: 20,
    borderRadius: 10,
    width: 36,
    height: 36,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 1.5,
    margin: 0,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  content: {
    padding: '0 16px',
    marginTop: -12,
  },
  avatarCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '28px 20px 20px',
    textAlign: 'center',
    marginBottom: 16,
    boxShadow: '0 2px 12px rgba(92,107,192,0.10)',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #5C6BC0, #3949AB)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 700,
  },
  teacherName: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1A1A2E',
    margin: '0 0 4px',
  },
  teacherDesig: {
    fontSize: 13,
    color: '#5C6BC0',
    fontWeight: 500,
    margin: '0 0 12px',
  },
  badgeRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  badge: {
    background: '#EEF0FF',
    color: '#3949AB',
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 20,
  },
  empId: {
    fontSize: 12,
    color: '#9E9E9E',
    margin: 0,
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#5C6BC0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    margin: '0 0 8px 4px',
  },
  card: {
    background: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '14px 16px',
    gap: 12,
  },
  infoIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    margin: '0 0 2px',
  },
  infoValue: {
    fontSize: 14,
    color: '#1A1A2E',
    fontWeight: 500,
    margin: 0,
    wordBreak: 'break-word',
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 420,
    background: '#fff',
    borderTop: '1px solid #EEEEEE',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '8px 0 12px',
    zIndex: 100,
  },
  navItem: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    cursor: 'pointer',
    padding: '4px 12px',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: 600,
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontFamily: "'Poppins', sans-serif",
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #EEF0FF',
    borderTop: '3px solid #5C6BC0',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: '#5C6BC0', fontSize: 14, marginTop: 12 },
  errorText: { color: '#E53935', fontSize: 14 },
  emptyText: { color: '#9E9E9E', fontSize: 14 },
};