import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL

export default function TeacherMarks() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [classes, setClasses]         = useState([])
  const [subjects, setSubjects]       = useState([])
  const [students, setStudents]       = useState([])
  const [existingMarks, setExistingMarks] = useState([])

  const [selectedClass, setSelectedClass]     = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [examName, setExamName]               = useState('')
  const [examType, setExamType]               = useState('Unit Test')
  const [maxMarks, setMaxMarks]               = useState(100)
  const [weightage, setWeightage]             = useState(0)
  const [academicYear, setAcademicYear]       = useState('2025-26')

  const [marks, setMarks]                   = useState({})
  const [isPublished, setIsPublished]       = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showCustomExam, setShowCustomExam] = useState(false)
  const [customExamName, setCustomExamName] = useState('')
  const [customMaxMarks, setCustomMaxMarks] = useState('')
  const [customWeightage, setCustomWeightage] = useState('')

  const [loadingClasses, setLoadingClasses]   = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingMarks, setLoadingMarks]       = useState(false)
  const [saving, setSaving]                   = useState(false)
  const [publishing, setPublishing]           = useState(false)
  const [toast, setToast]                     = useState(null)
  const [error, setError]                     = useState(null)

  const examTypes = ['Unit Test', 'Mid Term', 'Half Yearly', 'Annual', 'Custom']

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Fetch teacher's assigned classes & subjects
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true)
        const res = await fetch(`${API}/marks/classes`, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setClasses(data.classes || [])
        setSubjects(data.subjects || [])
        if (data.classes?.length > 0) {
          const first = data.classes[0]
          const parts = first.split('-')
          setSelectedClass(parts[0]?.trim() || first)
          setSelectedSection(parts[1]?.trim() || '')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoadingClasses(false)
      }
    }
    if (user?.token) fetchClasses()
  }, [user])

  // Fetch students when class/section changes
  useEffect(() => {
    if (!selectedClass) return
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true)
        setStudents([])
        setMarks({})
        setExistingMarks([])
        setIsPublished(false)
        const res = await fetch(
          `${API}/marks/students?class=${selectedClass}&section=${selectedSection}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setStudents(data)
      } catch (err) {
        showToast(err.message, 'error')
      } finally {
        setLoadingStudents(false)
      }
    }
    fetchStudents()
  }, [selectedClass, selectedSection])

  // Fetch existing marks when filters change
  useEffect(() => {
    if (!selectedClass || !selectedSubject || !examName) return
    const fetchMarks = async () => {
      try {
        setLoadingMarks(true)
        const res = await fetch(
          `${API}/marks?class=${selectedClass}&section=${selectedSection}&subject=${selectedSubject}&examName=${examName}&academicYear=${academicYear}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setExistingMarks(data)
        const marksMap = {}
        let published = false
        data.forEach(m => {
          marksMap[m.student._id] = m.marksObtained
          if (m.status === 'published') published = true
        })
        setMarks(marksMap)
        setIsPublished(published)
      } catch (err) {
        showToast(err.message, 'error')
      } finally {
        setLoadingMarks(false)
      }
    }
    fetchMarks()
  }, [selectedClass, selectedSection, selectedSubject, examName, academicYear])

  const handleClassChange = (val) => {
    const parts = val.split('-')
    setSelectedClass(parts[0]?.trim() || val)
    setSelectedSection(parts[1]?.trim() || '')
  }

  const handleMarkChange = (studentId, value) => {
    if (isPublished) return
    if (value === '') { setMarks(p => ({ ...p, [studentId]: '' })); return }
    const num = parseInt(value)
    if (!isNaN(num) && num >= 0 && num <= maxMarks) {
      setMarks(p => ({ ...p, [studentId]: num }))
    }
  }

  const filledCount = students.filter(s => marks[s._id] !== undefined && marks[s._id] !== '').length

  const handleSave = async () => {
    if (!examName || !selectedSubject) {
      showToast('Please select subject and enter exam name', 'error'); return
    }
    const marksData = students.map(s => ({
      studentId: s._id,
      marksObtained: marks[s._id] ?? null,
    })).filter(m => m.marksObtained !== null && m.marksObtained !== '')

    if (marksData.length === 0) {
      showToast('No marks entered', 'error'); return
    }
    try {
      setSaving(true)
      const res = await fetch(`${API}/marks/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          marksData, class: selectedClass, section: selectedSection,
          subject: selectedSubject, examName, examType,
          maxMarks, weightage, academicYear,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      showToast('Marks saved successfully')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    try {
      setPublishing(true)
      const res = await fetch(`${API}/marks/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          class: selectedClass, section: selectedSection,
          subject: selectedSubject, examName, academicYear,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setIsPublished(true)
      setShowPublishModal(false)
      showToast('Results published successfully')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setPublishing(false)
    }
  }

  const handleAddCustomExam = () => {
    if (!customExamName || !customMaxMarks) return
    setExamName(customExamName)
    setExamType('Custom')
    setMaxMarks(parseInt(customMaxMarks))
    setWeightage(parseInt(customWeightage) || 0)
    setCustomExamName('')
    setCustomMaxMarks('')
    setCustomWeightage('')
    setShowCustomExam(false)
  }

  const getInitials = (name) =>
    name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'

  const avatarColors = ['#4361EE','#E91E63','#2E7D32','#FF6B00','#9C27B0','#00897B','#F57F17','#0288D1']
  const getColor = (idx) => avatarColors[idx % avatarColors.length]

  if (loadingClasses) return (
    <div style={styles.centered}>
      <div style={styles.spinner} />
      <p style={styles.loadingText}>Loading your classes...</p>
    </div>
  )

  if (error) return (
    <div style={styles.centered}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <p style={{ color: '#EF5350', fontWeight: 600 }}>{error}</p>
      <button style={styles.retryBtn} onClick={() => window.location.reload()}>Retry</button>
    </div>
  )

  return (
    <div style={styles.screen}>

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/teacher/home')}>←</button>
        <h1 style={styles.headerTitle}>Enter Marks</h1>
        <div style={{ width: 36 }} />
      </div>

      <div style={styles.scroll}>

        {/* Filters */}
        <div style={styles.card}>
          <div style={styles.rowTwo}>
            <div style={styles.fieldWrap}>
              <div style={styles.fieldLabel}>CLASS</div>
              <select
                style={styles.select}
                value={`${selectedClass}${selectedSection ? '-' + selectedSection : ''}`}
                onChange={e => handleClassChange(e.target.value)}
              >
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={styles.fieldWrap}>
              <div style={styles.fieldLabel}>ACADEMIC YEAR</div>
              <select
                style={styles.select}
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
              >
                {['2025-26', '2024-25', '2026-27'].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div style={styles.fieldWrapFull}>
            <div style={styles.fieldLabel}>SUBJECT</div>
            <select
              style={styles.select}
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
            >
              <option value=''>— Select Subject —</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ ...styles.rowTwo, marginTop: 14 }}>
            <div style={styles.fieldWrap}>
              <div style={styles.fieldLabel}>EXAM TYPE</div>
              <select
                style={styles.select}
                value={examType}
                onChange={e => setExamType(e.target.value)}
              >
                {examTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={styles.fieldWrap}>
              <div style={styles.fieldLabel}>MAX MARKS</div>
              <input
                style={styles.select}
                type='number'
                value={maxMarks}
                onChange={e => setMaxMarks(parseInt(e.target.value) || 100)}
                disabled={isPublished}
              />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={styles.fieldLabel}>EXAM NAME</div>
            <input
              style={{ ...styles.select, width: '100%' }}
              placeholder='e.g. Unit Test 1, Mid Term'
              value={examName}
              onChange={e => setExamName(e.target.value)}
              disabled={isPublished}
            />
          </div>
        </div>

        {/* Stats Bar */}
        {examName && selectedSubject && (
          <div style={styles.statsBar}>
            <div style={styles.statItem}>
              <div style={styles.statVal}>{students.length}</div>
              <div style={styles.statLabel}>Total</div>
            </div>
            <div style={styles.statItem}>
              <div style={{ ...styles.statVal, color: '#4361EE' }}>{filledCount}</div>
              <div style={styles.statLabel}>Filled</div>
            </div>
            <div style={styles.statItem}>
              <div style={{ ...styles.statVal, color: '#FF6B00' }}>{students.length - filledCount}</div>
              <div style={styles.statLabel}>Pending</div>
            </div>
            <div style={{
              ...styles.statusPill,
              background: isPublished ? '#E8F5E9' : '#FFF8E1',
              color: isPublished ? '#2E7D32' : '#F57F17',
            }}>
              {isPublished ? '🔒 Published' : '✏️ Draft'}
            </div>
          </div>
        )}

        {/* Locked Banner */}
        {isPublished && (
          <div style={styles.lockedBanner}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <div>
              <div style={styles.lockedTitle}>Results Published & Locked</div>
              <div style={styles.lockedSub}>Contact Admin to request edit unlock</div>
            </div>
          </div>
        )}

        {/* Custom Exam Button */}
        {!isPublished && examName === '' && (
          <button style={styles.customBtn} onClick={() => setShowCustomExam(true)}>
            + Add Custom / Surprise Exam
          </button>
        )}

        {/* Students List */}
        {selectedSubject && examName && (
          <>
            <div style={styles.sectionLabel}>
              {selectedClass}{selectedSection ? ` - ${selectedSection}` : ''} — STUDENT MARKS
            </div>

            {loadingStudents || loadingMarks ? (
              <div style={styles.centered}>
                <div style={styles.spinner} />
              </div>
            ) : students.length === 0 ? (
              <div style={styles.emptyState}>
                No students found for this class.
              </div>
            ) : (
              <div style={styles.studentsList}>
                {students.map((student, idx) => (
                  <div key={student._id} style={styles.studentRow}>
                    <div style={{ ...styles.avatar, background: getColor(idx) }}>
                      {getInitials(student.name)}
                    </div>
                    <div style={styles.studentInfo}>
                      <div style={styles.studentName}>{student.name}</div>
                      <div style={styles.studentRoll}>Roll: {student.rollNumber}</div>
                    </div>
                    <div style={styles.markInputWrap}>
                      <input
                        style={{
                          ...styles.markInput,
                          ...(isPublished ? styles.markInputLocked : {}),
                          ...(marks[student._id] !== undefined && marks[student._id] !== ''
                            ? styles.markInputFilled : {}),
                        }}
                        type='number'
                        min='0'
                        max={maxMarks}
                        placeholder='—'
                        value={marks[student._id] ?? ''}
                        onChange={e => handleMarkChange(student._id, e.target.value)}
                        disabled={isPublished}
                      />
                      <span style={styles.maxLabel}>/{maxMarks}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {(!selectedSubject || !examName) && (
          <div style={styles.emptyState}>
            Select subject and enter exam name to load students.
          </div>
        )}

        <div style={{ height: 140 }} />
      </div>

      {/* Bottom Action Bar */}
      {!isPublished && selectedSubject && examName && students.length > 0 && (
        <div style={styles.bottomBar}>
          <div style={styles.progressRow}>
            <div style={styles.progressBg}>
              <div style={{
                ...styles.progressFill,
                width: `${students.length > 0 ? (filledCount / students.length) * 100 : 0}%`
              }} />
            </div>
            <span style={styles.progressText}>{filledCount}/{students.length}</span>
          </div>
          <div style={styles.actionRow}>
            <button
              style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              style={{
                ...styles.publishBtn,
                opacity: filledCount === students.length ? 1 : 0.4,
              }}
              onClick={() => filledCount === students.length && setShowPublishModal(true)}
              disabled={filledCount !== students.length}
            >
              Publish Results
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.type === 'error' ? '#C62828' : '#2E7D32'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Publish Confirm Modal */}
      {showPublishModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.dragHandle} />
            <div style={{ fontSize: 44, textAlign: 'center' }}>🔒</div>
            <h2 style={styles.modalTitle}>Publish Results?</h2>
            <p style={styles.modalSub}>
              Once published, marks will be locked and visible to students.
              Editing will require Admin approval.
            </p>
            <div style={styles.modalInfo}>
              {[
                { label: 'Class', value: `${selectedClass}${selectedSection ? ' - ' + selectedSection : ''}` },
                { label: 'Subject', value: selectedSubject },
                { label: 'Exam', value: examName },
                { label: 'Students', value: students.length },
                { label: 'Academic Year', value: academicYear },
              ].map(r => (
                <div key={r.label} style={styles.modalRow}>
                  <span style={styles.modalRowLabel}>{r.label}</span>
                  <span style={styles.modalRowVal}>{r.value}</span>
                </div>
              ))}
            </div>
            <button
              style={{ ...styles.confirmBtn, opacity: publishing ? 0.7 : 1 }}
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? 'Publishing...' : 'Confirm & Publish'}
            </button>
            <button style={styles.cancelBtn} onClick={() => setShowPublishModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Custom Exam Modal */}
      {showCustomExam && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.dragHandle} />
            <h2 style={styles.modalTitle}>Add Custom Exam</h2>
            <div style={styles.fieldLabel}>EXAM NAME</div>
            <input
              style={styles.input}
              placeholder='e.g. Surprise Test, Weekly Quiz'
              value={customExamName}
              onChange={e => setCustomExamName(e.target.value)}
            />
            <div style={styles.rowTwo}>
              <div style={styles.fieldWrap}>
                <div style={styles.fieldLabel}>MAX MARKS</div>
                <input
                  style={styles.input}
                  type='number'
                  placeholder='e.g. 20'
                  value={customMaxMarks}
                  onChange={e => setCustomMaxMarks(e.target.value)}
                />
              </div>
              <div style={styles.fieldWrap}>
                <div style={styles.fieldLabel}>WEIGHTAGE %</div>
                <input
                  style={styles.input}
                  type='number'
                  placeholder='e.g. 5'
                  value={customWeightage}
                  onChange={e => setCustomWeightage(e.target.value)}
                />
              </div>
            </div>
            <button style={styles.confirmBtn} onClick={handleAddCustomExam}>
              Add Exam
            </button>
            <button style={styles.cancelBtn} onClick={() => setShowCustomExam(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

const styles = {
  screen: {
    maxWidth: 420, margin: '0 auto', minHeight: '100vh',
    background: '#F8F9FB', fontFamily: "'Poppins', sans-serif",
    display: 'flex', flexDirection: 'column', position: 'relative',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px 12px', background: '#fff',
    borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10,
  },
  backBtn: {
    background: 'none', border: 'none', fontSize: 20,
    cursor: 'pointer', color: '#333', padding: '4px 8px',
  },
  headerTitle: { fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: 0 },
  scroll: { flex: 1, overflowY: 'auto', padding: '16px' },
  card: {
    background: '#fff', borderRadius: 16,
    padding: '16px', marginBottom: 14,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  rowTwo: { display: 'flex', gap: 12 },
  fieldWrap: { flex: 1 },
  fieldWrapFull: { marginTop: 14 },
  fieldLabel: {
    fontSize: 11, fontWeight: 700, color: '#999',
    letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase',
  },
  select: {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #E8E8F0', background: '#fff',
    fontSize: 14, color: '#1A1A2E', outline: 'none',
    fontFamily: "'Poppins', sans-serif",
  },
  input: {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #E8E8F0', background: '#fff',
    fontSize: 14, color: '#1A1A2E', outline: 'none',
    fontFamily: "'Poppins', sans-serif",
    boxSizing: 'border-box', marginTop: 4, marginBottom: 12,
  },
  statsBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fff', borderRadius: 14, padding: '12px 16px',
    marginBottom: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  },
  statItem: { flex: 1, textAlign: 'center' },
  statVal: { fontSize: 18, fontWeight: 800, color: '#1A1A2E' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  statusPill: {
    padding: '6px 12px', borderRadius: 20,
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  lockedBanner: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#FFF3E0', borderRadius: 14, padding: '14px 16px',
    marginBottom: 14, border: '1.5px solid #FFB74D',
  },
  lockedTitle: { fontSize: 13, fontWeight: 700, color: '#E65100' },
  lockedSub: { fontSize: 12, color: '#F57F17', marginTop: 2 },
  customBtn: {
    width: '100%', padding: '11px', marginBottom: 14,
    background: '#F0F4FF', border: '1.5px dashed #4361EE',
    borderRadius: 12, color: '#4361EE', fontSize: 13,
    fontWeight: 700, cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  },
  sectionLabel: {
    fontSize: 11, fontWeight: 700, color: '#999',
    letterSpacing: 1, margin: '4px 0 10px',
    textTransform: 'uppercase',
  },
  studentsList: {
    background: '#fff', borderRadius: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden',
  },
  studentRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderBottom: '1px solid #F5F5F5',
  },
  avatar: {
    width: 38, height: 38, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
  },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: 600, color: '#1A1A2E' },
  studentRoll: { fontSize: 11, color: '#999', marginTop: 2 },
  markInputWrap: { display: 'flex', alignItems: 'center', gap: 4 },
  markInput: {
    width: 64, padding: '8px 10px', borderRadius: 10,
    border: '1.5px solid #E0E0E0', background: '#F8F9FB',
    fontSize: 14, fontWeight: 700, color: '#1A1A2E',
    outline: 'none', textAlign: 'center',
    fontFamily: "'Poppins', sans-serif",
  },
  markInputFilled: { border: '1.5px solid #4361EE', background: '#F0F4FF' },
  markInputLocked: { background: '#F5F5F5', color: '#999', cursor: 'not-allowed' },
  maxLabel: { fontSize: 13, color: '#999', fontWeight: 600 },
  bottomBar: {
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 420, background: '#fff',
    borderTop: '1px solid #F0F0F0', padding: '12px 16px 28px', zIndex: 100,
  },
  progressRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  progressBg: { flex: 1, height: 5, background: '#F0F0F0', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#4361EE', borderRadius: 99, transition: 'width 0.3s ease' },
  progressText: { fontSize: 12, fontWeight: 600, color: '#666', flexShrink: 0 },
  actionRow: { display: 'flex', gap: 10 },
  saveBtn: {
    flex: 1, padding: '13px',
    background: '#F0F4FF', color: '#4361EE',
    border: '1.5px solid #4361EE', borderRadius: 12,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  },
  publishBtn: {
    flex: 2, padding: '13px',
    background: 'linear-gradient(135deg, #4361EE, #3A0CA3)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  },
  toast: {
    position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
    color: '#fff', padding: '12px 24px', borderRadius: 30,
    fontSize: 13, fontWeight: 700, zIndex: 999,
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    background: '#fff', borderRadius: '24px 24px 0 0',
    padding: '12px 24px 40px', width: '100%', maxWidth: 420,
    display: 'flex', flexDirection: 'column',
  },
  dragHandle: {
    width: 40, height: 4, background: '#E0E0E0',
    borderRadius: 4, alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20, fontWeight: 700, color: '#1A1A2E',
    margin: '8px 0', textAlign: 'center',
  },
  modalSub: {
    fontSize: 13, color: '#666', textAlign: 'center',
    marginBottom: 20, lineHeight: 1.5,
  },
  modalInfo: { background: '#F8F9FB', borderRadius: 14, padding: '14px 16px', marginBottom: 20 },
  modalRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 13, color: '#555', paddingBottom: 8,
    marginBottom: 8, borderBottom: '1px solid #F0F0F0',
  },
  modalRowLabel: { color: '#888' },
  modalRowVal: { fontWeight: 700, color: '#1A1A2E' },
  confirmBtn: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #4361EE, #3A0CA3)',
    color: '#fff', border: 'none', borderRadius: 14,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  },
  cancelBtn: {
    marginTop: 12, background: 'none', border: 'none',
    color: '#4361EE', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', alignSelf: 'center',
    fontFamily: "'Poppins', sans-serif",
  },
  centered: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '60vh', gap: 12,
  },
  spinner: {
    width: 36, height: 36, borderRadius: '50%',
    border: '3px solid #E8E8F0', borderTop: '3px solid #4361EE',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { fontSize: 14, color: '#888', fontWeight: 500 },
  retryBtn: {
    padding: '10px 24px', background: '#4361EE', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  emptyState: {
    textAlign: 'center', padding: '40px 20px',
    color: '#999', fontSize: 14, fontWeight: 500,
  },
}