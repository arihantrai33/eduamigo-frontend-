import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../firebase'
import { ref, set } from 'firebase/database'

const classesData = ['Class X-A', 'Class X-B', 'Class IX-A', 'Class IX-B', 'Class VIII-A']

const examTypesData = {
  'Class X-A': [
    { id: 'ut1', name: 'Unit Test 1', maxMarks: 20, weightage: 10, status: 'published' },
    { id: 'midterm', name: 'Mid Term', maxMarks: 80, weightage: 30, status: 'published' },
    { id: 'ut2', name: 'Unit Test 2', maxMarks: 20, weightage: 10, status: 'open' },
    { id: 'annual', name: 'Annual Exam', maxMarks: 100, weightage: 50, status: 'open' },
    { id: 'surprise1', name: 'Surprise Test', maxMarks: 10, weightage: 0, status: 'open', custom: true },
  ],
  'Class IX-A': [
    { id: 'weekly1', name: 'Weekly Test 1', maxMarks: 25, weightage: 15, status: 'published' },
    { id: 'weekly2', name: 'Weekly Test 2', maxMarks: 25, weightage: 15, status: 'open' },
    { id: 'halfyearly', name: 'Half Yearly', maxMarks: 100, weightage: 35, status: 'open' },
    { id: 'annual', name: 'Annual Exam', maxMarks: 100, weightage: 35, status: 'open' },
  ],
}

const subjectsData = {
  'Class X-A': [
    { id: 'math', name: 'Mathematics', maxMarks: 100 },
    { id: 'phy', name: 'Physics', maxMarks: 100 },
    { id: 'chem', name: 'Chemistry', maxMarks: 100 },
    { id: 'eng', name: 'English', maxMarks: 100 },
    { id: 'bio', name: 'Biology', maxMarks: 100 },
  ],
  'Class IX-A': [
    { id: 'math', name: 'Mathematics', maxMarks: 100 },
    { id: 'sci', name: 'Science', maxMarks: 100 },
    { id: 'eng', name: 'English', maxMarks: 100 },
    { id: 'sst', name: 'Social Studies', maxMarks: 100 },
    { id: 'hindi', name: 'Hindi', maxMarks: 100 },
  ],
}

const studentsData = {
  'Class X-A': [
    { id: 1, name: 'Aarav Sharma', initials: 'AS', color: '#4361EE' },
    { id: 2, name: 'Priya Verma', initials: 'PV', color: '#E91E63' },
    { id: 3, name: 'Rohan Mehta', initials: 'RM', color: '#2E7D32' },
    { id: 4, name: 'Sneha Patel', initials: 'SP', color: '#FF6B00' },
    { id: 5, name: 'Arjun Singh', initials: 'AS', color: '#9C27B0' },
    { id: 6, name: 'Rahul Kumar', initials: 'RK', color: '#00897B' },
    { id: 7, name: 'Anjali Gupta', initials: 'AG', color: '#F57F17' },
  ],
  'Class IX-A': [
    { id: 1, name: 'Amit Yadav', initials: 'AY', color: '#4361EE' },
    { id: 2, name: 'Neha Joshi', initials: 'NJ', color: '#E91E63' },
    { id: 3, name: 'Karan Malhotra', initials: 'KM', color: '#2E7D32' },
  ],
}

const defaultStudents = [
  { id: 1, name: 'Aarav Sharma', initials: 'AS', color: '#4361EE' },
  { id: 2, name: 'Priya Verma', initials: 'PV', color: '#E91E63' },
  { id: 3, name: 'Rohan Mehta', initials: 'RM', color: '#2E7D32' },
  { id: 4, name: 'Sneha Patel', initials: 'SP', color: '#FF6B00' },
  { id: 5, name: 'Arjun Singh', initials: 'AS', color: '#9C27B0' },
  { id: 6, name: 'Rahul Kumar', initials: 'RK', color: '#00897B' },
  { id: 7, name: 'Anjali Gupta', initials: 'AG', color: '#F57F17' },
]

export default function TeacherMarks() {
  const navigate = useNavigate()

  const [selectedClass, setSelectedClass] = useState('Class X-A')
  const [selectedExamId, setSelectedExamId] = useState('ut2')
  const [selectedSubjectId, setSelectedSubjectId] = useState('math')
  const [marks, setMarks] = useState({})
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [published, setPublished] = useState(false)
  const [showCustomExam, setShowCustomExam] = useState(false)
  const [customExamName, setCustomExamName] = useState('')
  const [customMaxMarks, setCustomMaxMarks] = useState('')
  const [customWeightage, setCustomWeightage] = useState('')
  const [examTypes, setExamTypes] = useState(examTypesData)
  const [showSuccess, setShowSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const exams = examTypes[selectedClass] || examTypes['Class X-A']
  const subjects = subjectsData[selectedClass] || subjectsData['Class X-A']
  const students = studentsData[selectedClass] || defaultStudents
  const selectedExam = exams.find((e) => e.id === selectedExamId) || exams[0]
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0]
  const isLocked = selectedExam?.status === 'published'
  const maxMarks = selectedExam?.maxMarks || 100

  const handleMarkChange = (studentId, value) => {
    if (isLocked) return
    const num = parseInt(value)
    if (value === '') {
      setMarks((prev) => ({ ...prev, [`${selectedExamId}_${selectedSubjectId}_${studentId}`]: '' }))
      return
    }
    if (!isNaN(num) && num >= 0 && num <= maxMarks) {
      setMarks((prev) => ({ ...prev, [`${selectedExamId}_${selectedSubjectId}_${studentId}`]: num }))
    }
  }

  const getMarkValue = (studentId) => {
    const key = `${selectedExamId}_${selectedSubjectId}_${studentId}`
    return marks[key] !== undefined ? marks[key] : ''
  }

  const filledCount = students.filter((s) => getMarkValue(s.id) !== '').length

  const handlePublish = async () => {
    setSaving(true)
    try {
      const classKey = selectedClass.replace(/\s+/g, '_').replace(/-/g, '_')

      const marksToSave = {}
      students.forEach((s) => {
        marksToSave[s.id] = {
          name: s.name,
          marks: getMarkValue(s.id),
        }
      })

      await set(
        ref(db, `marks/${classKey}/${selectedExamId}/${selectedSubjectId}`),
        {
          studentMarks: marksToSave,
          maxMarks: maxMarks,
          examName: selectedExam?.name,
          subjectName: selectedSubject?.name,
          className: selectedClass,
          publishedAt: new Date().toISOString(),
        }
      )

      setExamTypes((prev) => {
        const updated = { ...prev }
        const classExams = [...(updated[selectedClass] || [])]
        const idx = classExams.findIndex((e) => e.id === selectedExamId)
        if (idx !== -1) classExams[idx] = { ...classExams[idx], status: 'published' }
        updated[selectedClass] = classExams
        return updated
      })

      setShowPublishModal(false)
      setPublished(true)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

    } catch (error) {
      alert('Firebase Error: ' + error.message)
    }
    setSaving(false)
  }

  const handleAddCustomExam = () => {
    if (!customExamName || !customMaxMarks) return
    const newExam = {
      id: `custom_${Date.now()}`,
      name: customExamName,
      maxMarks: parseInt(customMaxMarks),
      weightage: parseInt(customWeightage) || 0,
      status: 'open',
      custom: true,
    }
    setExamTypes((prev) => ({
      ...prev,
      [selectedClass]: [...(prev[selectedClass] || []), newExam],
    }))
    setSelectedExamId(newExam.id)
    setCustomExamName('')
    setCustomMaxMarks('')
    setCustomWeightage('')
    setShowCustomExam(false)
  }

  return (
    <div style={styles.screen}>

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/teacher/home')}>←</button>
        <h1 style={styles.headerTitle}>📊 Enter Marks</h1>
        <div style={{ width: 36 }} />
      </div>

      <div style={styles.scroll}>

        {/* Class + Exam Row */}
        <div style={styles.rowTwo}>
          <div style={styles.fieldWrap}>
            <div style={styles.fieldLabel}>CLASS</div>
            <select
              style={styles.select}
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value)
                setSelectedExamId(examTypes[e.target.value]?.[0]?.id || '')
                setSelectedSubjectId(subjectsData[e.target.value]?.[0]?.id || 'math')
                setMarks({})
              }}
            >
              {classesData.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={styles.fieldWrap}>
            <div style={styles.fieldLabel}>EXAM</div>
            <select
              style={styles.select}
              value={selectedExamId}
              onChange={(e) => { setSelectedExamId(e.target.value); setMarks({}) }}
            >
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} {e.status === 'published' ? '🔒' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject */}
        <div style={styles.fieldWrapFull}>
          <div style={styles.fieldLabel}>SUBJECT</div>
          <select
            style={styles.select}
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (Max: {maxMarks})
              </option>
            ))}
          </select>
        </div>

        {/* Exam Info Bar */}
        <div style={styles.examInfoBar}>
          <div style={styles.examInfoItem}>
            <div style={styles.examInfoVal}>{maxMarks}</div>
            <div style={styles.examInfoLabel}>Max Marks</div>
          </div>
          <div style={styles.examInfoItem}>
            <div style={styles.examInfoVal}>{selectedExam?.weightage || 0}%</div>
            <div style={styles.examInfoLabel}>Weightage</div>
          </div>
          <div style={styles.examInfoItem}>
            <div style={styles.examInfoVal}>{filledCount}/{students.length}</div>
            <div style={styles.examInfoLabel}>Filled</div>
          </div>
          <div style={{
            ...styles.examStatusPill,
            background: isLocked ? '#E8F5E9' : '#FFF8E1',
            color: isLocked ? '#2E7D32' : '#F57F17',
          }}>
            {isLocked ? '🔒 Locked' : '✏️ Open'}
          </div>
        </div>

        {/* Locked Warning */}
        {isLocked && (
          <div style={styles.lockedBanner}>
            <span style={{ fontSize: 18 }}>🔒</span>
            <div>
              <div style={styles.lockedTitle}>Results Published & Locked</div>
              <div style={styles.lockedSub}>Contact Admin to request edit unlock</div>
            </div>
          </div>
        )}

        {/* Custom Exam Button */}
        {!isLocked && (
          <button style={styles.customExamBtn} onClick={() => setShowCustomExam(true)}>
            ＋ Add Custom Exam / Surprise Test
          </button>
        )}

        {/* Students List */}
        <div style={styles.sectionLabel}>
          {selectedClass} — ENTER MARKS
        </div>

        <div style={styles.studentsList}>
          {students.map((student) => (
            <div key={student.id} style={styles.studentRow}>
              <div style={{ ...styles.avatar, background: student.color }}>
                {student.initials}
              </div>
              <div style={styles.studentName}>{student.name}</div>
              <div style={styles.markInputWrap}>
                <input
                  style={{
                    ...styles.markInput,
                    ...(isLocked ? styles.markInputLocked : {}),
                    ...(getMarkValue(student.id) !== '' ? styles.markInputFilled : {}),
                  }}
                  type="number"
                  min="0"
                  max={maxMarks}
                  placeholder={isLocked ? '—' : ''}
                  value={getMarkValue(student.id)}
                  onChange={(e) => handleMarkChange(student.id, e.target.value)}
                  disabled={isLocked}
                />
                <span style={styles.maxMarksLabel}>/{maxMarks}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 120 }} />
      </div>

      {/* Bottom Publish Button */}
      {!isLocked && (
        <div style={styles.bottomBar}>
          <div style={styles.progressRow}>
            <div style={styles.progressBarBg}>
              <div style={{
                ...styles.progressBarFill,
                width: `${(filledCount / students.length) * 100}%`,
              }} />
            </div>
            <span style={styles.progressText}>{filledCount}/{students.length} filled</span>
          </div>
          <button
            style={{
              ...styles.publishBtn,
              opacity: filledCount === students.length ? 1 : 0.5,
            }}
            onClick={() => filledCount === students.length && setShowPublishModal(true)}
          >
            💾 Save & Publish Results
          </button>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div style={styles.toast}>
          ✅ Results saved to Firebase successfully!
        </div>
      )}

      {/* Publish Confirm Modal */}
      {showPublishModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.dragHandle} />
            <div style={{ fontSize: 48, textAlign: 'center' }}>🔒</div>
            <h2 style={styles.modalTitle}>Publish Results?</h2>
            <p style={styles.modalSub}>
              Once published, marks will be <strong>locked</strong> and visible to students.
              Editing will require <strong>Admin approval</strong>.
            </p>
            <div style={styles.modalInfo}>
              <div style={styles.modalInfoRow}>
                <span>📚 Class</span>
                <span style={{ fontWeight: 700 }}>{selectedClass}</span>
              </div>
              <div style={styles.modalInfoRow}>
                <span>📝 Exam</span>
                <span style={{ fontWeight: 700 }}>{selectedExam?.name}</span>
              </div>
              <div style={styles.modalInfoRow}>
                <span>🔬 Subject</span>
                <span style={{ fontWeight: 700 }}>{selectedSubject?.name}</span>
              </div>
              <div style={styles.modalInfoRow}>
                <span>👥 Students</span>
                <span style={{ fontWeight: 700 }}>{students.length}</span>
              </div>
            </div>
            <button
              style={{ ...styles.confirmBtn, opacity: saving ? 0.7 : 1 }}
              onClick={handlePublish}
              disabled={saving}
            >
              {saving ? '⏳ Saving to Firebase...' : '✅ Yes, Publish & Lock'}
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
            <h2 style={styles.modalTitle}>➕ Add Custom Exam</h2>
            <p style={styles.modalSub}>Add a surprise test, weekly quiz, or any custom exam</p>
            <div style={styles.fieldLabel}>EXAM NAME</div>
            <input
              style={styles.input}
              placeholder="e.g. Surprise Test, Weekly Quiz"
              value={customExamName}
              onChange={(e) => setCustomExamName(e.target.value)}
            />
            <div style={styles.rowTwo}>
              <div style={styles.fieldWrap}>
                <div style={styles.fieldLabel}>MAX MARKS</div>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="e.g. 20"
                  value={customMaxMarks}
                  onChange={(e) => setCustomMaxMarks(e.target.value)}
                />
              </div>
              <div style={styles.fieldWrap}>
                <div style={styles.fieldLabel}>WEIGHTAGE %</div>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="e.g. 5"
                  value={customWeightage}
                  onChange={(e) => setCustomWeightage(e.target.value)}
                />
              </div>
            </div>
            <button style={styles.confirmBtn} onClick={handleAddCustomExam}>
              ➕ Add Exam
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
    padding: '16px 20px 12px', background: '#fff', borderBottom: '1px solid #F0F0F0',
    position: 'sticky', top: 0, zIndex: 10,
  },
  backBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#333', padding: '4px 8px' },
  headerTitle: { fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: 0 },
  scroll: { flex: 1, overflowY: 'auto', padding: '0 16px' },
  rowTwo: { display: 'flex', gap: 12, marginTop: 16 },
  fieldWrap: { flex: 1 },
  fieldWrapFull: { marginTop: 14 },
  fieldLabel: { fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: 1, marginBottom: 6 },
  select: {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: '1.5px solid #E8E8F0', background: '#fff',
    fontSize: 14, color: '#1A1A2E', outline: 'none', cursor: 'pointer',
  },
  input: {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: '1.5px solid #E8E8F0', background: '#fff',
    fontSize: 14, color: '#1A1A2E', outline: 'none', boxSizing: 'border-box', marginTop: 4,
  },
  examInfoBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fff', borderRadius: 14, padding: '12px 16px',
    marginTop: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  },
  examInfoItem: { flex: 1, textAlign: 'center' },
  examInfoVal: { fontSize: 16, fontWeight: 800, color: '#4361EE' },
  examInfoLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  examStatusPill: { padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0 },
  lockedBanner: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#FFF3E0', borderRadius: 14, padding: '14px 16px', marginTop: 14,
    border: '1.5px solid #FFB74D',
  },
  lockedTitle: { fontSize: 13, fontWeight: 700, color: '#E65100' },
  lockedSub: { fontSize: 12, color: '#F57F17', marginTop: 2 },
  customExamBtn: {
    width: '100%', marginTop: 12, padding: '11px',
    background: '#F0F4FF', border: '1.5px dashed #4361EE',
    borderRadius: 12, color: '#4361EE', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: 1, margin: '20px 0 10px' },
  studentsList: {
    background: '#fff', borderRadius: 20,
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
  studentName: { flex: 1, fontSize: 14, fontWeight: 600, color: '#1A1A2E' },
  markInputWrap: { display: 'flex', alignItems: 'center', gap: 4 },
  markInput: {
    width: 64, padding: '8px 10px', borderRadius: 10,
    border: '1.5px solid #E0E0E0', background: '#F8F9FB',
    fontSize: 14, fontWeight: 700, color: '#1A1A2E', outline: 'none', textAlign: 'center',
  },
  markInputFilled: { border: '1.5px solid #4361EE', background: '#F0F4FF' },
  markInputLocked: { background: '#F5F5F5', color: '#999', cursor: 'not-allowed' },
  maxMarksLabel: { fontSize: 13, color: '#999', fontWeight: 600 },
  bottomBar: {
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 420, background: '#fff',
    borderTop: '1px solid #F0F0F0', padding: '12px 16px 24px', zIndex: 100,
  },
  progressRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  progressBarBg: { flex: 1, height: 6, background: '#F0F0F0', borderRadius: 99, overflow: 'hidden' },
  progressBarFill: { height: '100%', background: '#4361EE', borderRadius: 99, transition: 'width 0.3s ease' },
  progressText: { fontSize: 12, fontWeight: 600, color: '#666', flexShrink: 0 },
  publishBtn: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #4361EE, #3A0CA3)',
    color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  toast: {
    position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
    background: '#2E7D32', color: '#fff', padding: '12px 24px',
    borderRadius: 30, fontSize: 13, fontWeight: 700, zIndex: 999,
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    background: '#fff', borderRadius: '24px 24px 0 0',
    padding: '12px 24px 40px', width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column',
  },
  dragHandle: { width: 40, height: 4, background: '#E0E0E0', borderRadius: 4, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 700, color: '#1A1A2E', margin: '8px 0', textAlign: 'center' },
  modalSub: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 },
  modalInfo: { background: '#F8F9FB', borderRadius: 14, padding: '14px 16px', marginBottom: 20 },
  modalInfoRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 13, color: '#555', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid #F0F0F0',
  },
  confirmBtn: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #4361EE, #3A0CA3)',
    color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  cancelBtn: {
    marginTop: 12, background: 'none', border: 'none',
    color: '#4361EE', fontSize: 15, fontWeight: 600, cursor: 'pointer', alignSelf: 'center',
  },
}