import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../firebase'
import { ref, get } from 'firebase/database'

const subjectConfig = {
  math:  { name: 'Mathematics', emoji: '📐', color: '#5C6BC0', grad: 'linear-gradient(90deg,#5C6BC0,#7986CB)' },
  phy:   { name: 'Physics',     emoji: '⚡', color: '#7E57C2', grad: 'linear-gradient(90deg,#7E57C2,#9575CD)' },
  chem:  { name: 'Chemistry',   emoji: '⚗️', color: '#FF7043', grad: 'linear-gradient(90deg,#FF7043,#FF8A65)' },
  eng:   { name: 'English',     emoji: '📖', color: '#00BFA5', grad: 'linear-gradient(90deg,#00BFA5,#00E5CC)' },
  hindi: { name: 'Hindi',       emoji: '📝', color: '#FFB300', grad: 'linear-gradient(90deg,#FFB300,#FFC107)' },
  sci:   { name: 'Science',     emoji: '🔬', color: '#26C6DA', grad: 'linear-gradient(90deg,#26C6DA,#4DD0E1)' },
  sst:   { name: 'Social Studies', emoji: '🌍', color: '#66BB6A', grad: 'linear-gradient(90deg,#66BB6A,#81C784)' },
}

const examLabels = {
  ut1: 'Unit Test 1', ut2: 'Unit Test 2',
  midterm: 'Mid Term', annual: 'Annual Exam',
  halfyearly: 'Half Yearly',
  weekly1: 'Weekly Test 1', weekly2: 'Weekly Test 2',
}

// Baad mein Auth se aayega
const MY_STUDENT_ID = 's6'
const MY_CLASS = 'Class_X_A'
const MY_NAME = 'Rahul Kumar'

export default function StudentResult() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [allData, setAllData] = useState(null)
  const [activeExam, setActiveExam] = useState(null)
  const [examList, setExamList] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await get(ref(db, `marks/${MY_CLASS}`))
        if (snap.exists()) {
          const data = snap.val()
          setAllData(data)
          const exams = Object.keys(data)
          setExamList(exams)
          setActiveExam(exams[exams.length - 1])
        }
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const currentExamData = allData && activeExam ? allData[activeExam] : null

  const subjectResults = currentExamData
    ? Object.entries(currentExamData).map(([subId, subData]) => {
        const config = subjectConfig[subId] || { name: subId, emoji: '📚', color: '#999', grad: '#999' }
        const studentMark = subData.studentMarks?.[MY_STUDENT_ID]?.marks ?? '—'
        const maxMarks = subData.maxMarks || 100
        const allMarks = subData.studentMarks
          ? Object.values(subData.studentMarks).map(s => Number(s.marks)).filter(m => !isNaN(m))
          : []
        const classAvg = allMarks.length > 0
          ? Math.round(allMarks.reduce((a, b) => a + b, 0) / allMarks.length)
          : 0
        // Trend vs class avg
        const markNum = studentMark !== '—' ? Number(studentMark) : null
        const trend = markNum === null ? 'eq' : markNum > classAvg ? 'up' : markNum < classAvg ? 'dn' : 'eq'
        const delta = markNum === null ? '—' : markNum > classAvg ? `+${markNum - classAvg}` : markNum < classAvg ? `${markNum - classAvg}` : '0'
        return { subId, config, studentMark, maxMarks, classAvg, trend, delta }
      })
    : []

  const validMarks = subjectResults.filter(s => s.studentMark !== '—')
  const totalScored = validMarks.reduce((a, s) => a + Number(s.studentMark), 0)
  const totalMax = validMarks.reduce((a, s) => a + s.maxMarks, 0)
  const percentage = totalMax > 0 ? ((totalScored / totalMax) * 100).toFixed(1) : '—'
  const grade = percentage === '—' ? '—'
    : percentage >= 90 ? 'A+' : percentage >= 80 ? 'A'
    : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : 'C'

  // Best & Worst subject
  const marksOnly = validMarks.map(s => Number(s.studentMark))
  const bestIdx = marksOnly.length > 0 ? marksOnly.indexOf(Math.max(...marksOnly)) : -1
  const worstIdx = marksOnly.length > 0 ? marksOnly.indexOf(Math.min(...marksOnly)) : -1

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
        minHeight:'100vh', fontFamily:"'Poppins',sans-serif", fontSize:16, color:'#5C6BC0' }}>
        ⏳ Loading results...
      </div>
    )
  }

  if (!allData || examList.length === 0) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', minHeight:'100vh', fontFamily:"'Poppins',sans-serif",
        gap:12, padding:24 }}>
        <div style={{ fontSize:48 }}>📭</div>
        <div style={{ fontSize:18, fontWeight:700, color:'#1C2033' }}>No Results Yet</div>
        <div style={{ fontSize:14, color:'#7B8099', textAlign:'center' }}>
          Teacher ne abhi tak koi result publish nahi kiya hai.
        </div>
        <button style={{ marginTop:12, padding:'12px 24px', background:'#5C6BC0',
          color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}
          onClick={() => navigate('/student/home')}>
          ← Back to Home
        </button>
      </div>
    )
  }

  return (
    <div style={s.screen}>

      {/* ── HERO ── */}
      <div style={s.hero}>
        <div style={s.topbar}>
          <button style={s.backBtn} onClick={() => navigate('/student/home')}>←</button>
          <span style={s.topTitle}>📊 Academic Results</span>
          <button style={s.iconBtn} onClick={() => alert('Share!')}>📤</button>
        </div>

        {/* Exam Tabs */}
        <div style={s.tabsWrap}>
          {examList.map((examId) => (
            <button key={examId}
              style={{ ...s.tab, ...(activeExam === examId ? s.tabOn : {}) }}
              onClick={() => setActiveExam(examId)}>
              {examLabels[examId] || examId}
            </button>
          ))}
        </div>

        <div style={s.chip}>👤 {MY_NAME} &nbsp;•&nbsp; Class X-A</div>

        {/* Score Row */}
        <div style={s.scoreRow}>
          <div style={s.pillCol}>
            <div style={s.pill}><div style={s.pillVal}>{totalScored}</div><div style={s.pillLbl}>Scored</div></div>
            <div style={s.pill}><div style={s.pillVal}>{totalMax}</div><div style={s.pillLbl}>Total</div></div>
          </div>
          <div style={s.scoreCenter}>
            <div style={s.scorePct}>{percentage}%</div>
            <div style={s.scoreGrade}>Grade: {grade} 🏆</div>
          </div>
          <div style={s.pillCol}>
            <div style={s.pill}>
              <div style={{ ...s.pillVal, fontSize: 13 }}>
                {examLabels[activeExam] || activeExam}
              </div>
              <div style={s.pillLbl}>Exam</div>
            </div>
            <div style={s.pill}>
              <div style={{ ...s.pillVal, fontSize: 13, color: '#80CBC4' }}>
                {validMarks.length} Subj
              </div>
              <div style={s.pillLbl}>Counted</div>
            </div>
          </div>
        </div>

        {/* Improve strip — shows avg vs class */}
        {validMarks.length > 0 && (
          <div style={s.improveStrip}>
            <span style={{ fontSize: 18 }}>📈</span>
            <span style={s.improveText}>
              {percentage >= 75
                ? 'Above class average — great work!'
                : 'Keep pushing — you can beat the class avg!'}
            </span>
            <span style={s.improveDelta}>{percentage}%</span>
          </div>
        )}
      </div>

      {/* ── SCROLL CONTENT ── */}
      <div style={s.scroll}>

        {/* Subject Marks */}
        <div style={s.card}>
          <div style={s.ct}>Subject-wise Performance</div>
          {subjectResults.length === 0 ? (
            <div style={{ color:'#7B8099', fontSize:14, textAlign:'center', padding:20 }}>
              Is exam mein koi marks nahi hain abhi.
            </div>
          ) : (
            subjectResults.map(({ subId, config, studentMark, maxMarks, classAvg, trend, delta }, i) => {
              const pct = studentMark !== '—' ? (Number(studentMark) / maxMarks) * 100 : 0
              return (
                <div key={subId} style={{ marginBottom: i === subjectResults.length - 1 ? 0 : 16 }}>
                  <div style={s.subRow}>
                    <div style={s.subLeft}>
                      <span style={{ fontSize: 15 }}>{config.emoji}</span>
                      <span style={s.subName}>{config.name}</span>
                    </div>
                    <div style={s.subRight}>
                      <span style={{
                        ...s.trend,
                        background: trend === 'up' ? '#E0F7F4' : trend === 'dn' ? '#FFEBEE' : '#F3F4FD',
                        color: trend === 'up' ? '#00695C' : trend === 'dn' ? '#EF5350' : '#7B8099',
                      }}>
                        {trend === 'up' ? '↑ ' : trend === 'dn' ? '↓ ' : '→ '}{delta}
                      </span>
                      <span style={{ ...s.subMark, color: config.color }}>
                        {studentMark}/{maxMarks}
                      </span>
                    </div>
                  </div>
                  <div style={s.barBg}>
                    <div style={{ ...s.barFill, width: `${pct}%`, background: config.grad }} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Insights */}
        {bestIdx !== -1 && worstIdx !== -1 && (
          <>
            <div style={s.ct2}>Insights</div>
            <div style={s.swGrid}>
              <div style={{ ...s.swCard, background: 'linear-gradient(135deg,#E0F7F4,#B2DFDB)' }}>
                <div style={{ fontSize: 22 }}>💪</div>
                <div style={s.swTitle}>Strength</div>
                <div style={s.swSub}>{validMarks[bestIdx]?.config?.name || '—'}</div>
                <div style={s.swVal}>{validMarks[bestIdx]?.studentMark}/{validMarks[bestIdx]?.maxMarks}</div>
              </div>
              <div style={{ ...s.swCard, background: 'linear-gradient(135deg,#FFEBEE,#FFCDD2)' }}>
                <div style={{ fontSize: 22 }}>📌</div>
                <div style={s.swTitle}>Focus Area</div>
                <div style={s.swSub}>{validMarks[worstIdx]?.config?.name || '—'}</div>
                <div style={s.swVal}>{validMarks[worstIdx]?.studentMark}/{validMarks[worstIdx]?.maxMarks}</div>
              </div>
            </div>
          </>
        )}

        {/* Subject vs Class Avg Bar Chart */}
        {subjectResults.length > 0 && (
          <div style={s.card}>
            <div style={s.ct}>Your Score vs Class Avg</div>
            <div style={s.chartWrap}>
              {subjectResults.map(({ subId, config, studentMark, maxMarks, classAvg }, i) => {
                const maxH = 80
                const myH = studentMark !== '—' ? Math.round((Number(studentMark) / maxMarks) * maxH) : 0
                const avgH = Math.round((classAvg / maxMarks) * maxH)
                return (
                  <div key={subId} style={s.barCol}>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:maxH }}>
                      <div style={{ width:13, background: config.color, borderRadius:'4px 4px 0 0', height: myH }} />
                      <div style={{ width:9, background:'#FFB300', opacity:.8, borderRadius:'4px 4px 0 0', height: avgH }} />
                    </div>
                    <div style={s.barLbl}>{config.emoji}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ borderTop:'1px solid #E8EAF0', paddingTop:10, display:'flex', gap:16 }}>
              {[['#5C6BC0','My Score'],['#FFB300','Class Avg']].map(([c,l],i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:'#7B8099' }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:c }} />
                  {l}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teacher Remark — static for now, baad mein Firebase se aayega */}
        <div style={s.remark}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={s.rmAv}>CT</div>
            <div>
              <div style={{ fontSize:12.5, fontWeight:700, color:'#1C2033' }}>Class Teacher</div>
              <div style={{ fontSize:10.5, color:'#7B8099' }}>Term Remark</div>
            </div>
            <div style={{ marginLeft:'auto', ...s.badge }}>Remark</div>
          </div>
          <div style={{ fontSize:13, color:'#1C2033', lineHeight:1.6, fontStyle:'italic' }}>
            "Keep up the great effort! Focus on your weaker subjects and you'll see the rank improve. 🌟"
          </div>
        </div>

        {/* Download */}
        <div style={{ display:'flex', gap:10, marginBottom:30 }}>
          <button style={s.dlPdf} onClick={() => alert('Downloading PDF...')}>📄 Download PDF</button>
          <button style={s.dlShare} onClick={() => alert('Sharing...')}>📤 Share</button>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={s.bn}>
        {[['🏠','Home','/student/home'],['🚌','Bus','/student/bus'],
          ['📚','Learn','/student/notes'],['📊','Result','/student/result'],
          ['👤','Me','/student/home']].map(([ico,lbl,path]) => (
          <button key={lbl} style={{ ...s.ni, ...(path === '/student/result' ? s.niOn : {}) }}
            onClick={() => navigate(path)}>
            <span style={{ fontSize: 22 }}>{ico}</span>
            <span>{lbl}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const s = {
  screen: { maxWidth:420, margin:'0 auto', minHeight:'100vh', background:'#F4F6FB',
    fontFamily:"'Poppins',sans-serif", display:'flex', flexDirection:'column' },
  hero: { background:'linear-gradient(145deg,#1C2033 0%,#3949AB 50%,#5C6BC0 100%)',
    paddingBottom:16, flexShrink:0 },
  topbar: { display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'44px 18px 10px' },
  backBtn: { width:38, height:38, borderRadius:12, border:'none', cursor:'pointer',
    background:'rgba(255,255,255,.18)', color:'#fff', fontSize:20,
    display:'flex', alignItems:'center', justifyContent:'center' },
  iconBtn: { width:38, height:38, borderRadius:12, border:'none', cursor:'pointer',
    background:'rgba(255,255,255,.18)', color:'#fff', fontSize:18,
    display:'flex', alignItems:'center', justifyContent:'center' },
  topTitle: { fontSize:17, fontWeight:800, color:'#fff', fontFamily:"'Baloo 2',cursive" },
  tabsWrap: { display:'flex', background:'rgba(255,255,255,.12)', borderRadius:12,
    padding:4, margin:'0 16px 12px', gap:3, flexWrap:'wrap' },
  tab: { flex:1, padding:'8px 4px', borderRadius:9, fontSize:11, fontWeight:700,
    color:'rgba(255,255,255,.6)', border:'none', background:'none', cursor:'pointer', whiteSpace:'nowrap' },
  tabOn: { background:'rgba(255,255,255,.22)', color:'#fff' },
  chip: { display:'inline-flex', background:'rgba(255,255,255,.12)', borderRadius:20,
    padding:'6px 14px', fontSize:11.5, fontWeight:700, color:'rgba(255,255,255,.9)',
    margin:'0 18px 14px' },
  scoreRow: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px' },
  pillCol: { display:'flex', flexDirection:'column', gap:10, alignItems:'center' },
  pill: { background:'rgba(255,255,255,.13)', borderRadius:14, padding:'10px 14px', textAlign:'center' },
  pillVal: { fontSize:17, fontWeight:800, color:'#fff' },
  pillLbl: { fontSize:9.5, color:'rgba(255,255,255,.7)', fontWeight:700,
    textTransform:'uppercase', letterSpacing:.4, marginTop:2 },
  scoreCenter: { textAlign:'center' },
  scorePct: { fontFamily:"'Baloo 2',cursive", fontSize:64, fontWeight:800,
    color:'#fff', lineHeight:1, letterSpacing:-2 },
  scoreGrade: { fontSize:14, fontWeight:700, color:'rgba(255,255,255,.85)', marginTop:2 },
  improveStrip: { margin:'14px 16px 0', background:'rgba(0,191,165,.15)',
    border:'1px solid rgba(0,191,165,.3)', borderRadius:14,
    padding:'10px 14px', display:'flex', alignItems:'center', gap:10 },
  improveText: { fontSize:12, fontWeight:700, color:'#B2DFDB', flex:1 },
  improveDelta: { background:'rgba(0,191,165,.25)', borderRadius:10,
    padding:'4px 10px', fontSize:13, fontWeight:800, color:'#80CBC4' },
  scroll: { flex:1, overflowY:'auto', padding:'14px 16px 0' },
  card: { background:'#fff', borderRadius:20, padding:18, marginBottom:14,
    boxShadow:'0 2px 16px rgba(92,107,192,.10)' },
  ct: { fontSize:11, fontWeight:700, color:'#7B8099', textTransform:'uppercase',
    letterSpacing:.6, marginBottom:14 },
  ct2: { fontSize:11, fontWeight:700, color:'#7B8099', textTransform:'uppercase',
    letterSpacing:.6, marginBottom:10 },
  subRow: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 },
  subLeft: { display:'flex', alignItems:'center', gap:7 },
  subName: { fontSize:13.5, fontWeight:700, color:'#1C2033' },
  subRight: { display:'flex', alignItems:'center', gap:6 },
  subMark: { fontSize:13, fontWeight:800 },
  trend: { fontSize:10.5, fontWeight:700, padding:'2px 8px', borderRadius:10 },
  barBg: { background:'#E8EAF0', borderRadius:20, height:10, overflow:'hidden' },
  barFill: { borderRadius:20, height:10, transition:'width .8s ease' },
  swGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 },
  swCard: { borderRadius:16, padding:14, display:'flex', flexDirection:'column', gap:6 },
  swTitle: { fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:.5, color:'#7B8099' },
  swSub: { fontSize:13, fontWeight:800, color:'#1C2033' },
  swVal: { fontSize:11, fontWeight:700, color:'#7B8099' },
  chartWrap: { display:'flex', alignItems:'flex-end', gap:8,
    height:100, paddingBottom:4, marginBottom:10 },
  barCol: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 },
  barLbl: { fontSize:14, marginTop:4 },
  remark: { background:'linear-gradient(135deg,#F3F4FD,#EDE7F6)',
    borderRadius:20, padding:16, marginBottom:14, borderLeft:'4px solid #5C6BC0' },
  rmAv: { width:34, height:34, borderRadius:'50%', background:'#5C6BC0',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 },
  badge: { background:'#E8EAF6', color:'#5C6BC0', borderRadius:20,
    padding:'3px 10px', fontSize:10.5, fontWeight:700 },
  dlPdf: { flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
    padding:13, borderRadius:14, border:'none', cursor:'pointer',
    background:'#5C6BC0', color:'#fff', fontSize:12.5, fontWeight:700,
    boxShadow:'0 6px 20px rgba(92,107,192,.35)' },
  dlShare: { flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
    padding:13, borderRadius:14, border:'none', cursor:'pointer',
    background:'#E8EAF6', color:'#5C6BC0', fontSize:12.5, fontWeight:700 },
  bn: { position:'sticky', bottom:0, left:0, right:0, height:66,
    background:'#fff', display:'flex', borderTop:'1px solid #E8EAF0',
    boxShadow:'0 -4px 24px rgba(92,107,192,.08)', zIndex:200 },
  ni: { flex:1, display:'flex', flexDirection:'column', alignItems:'center',
    justifyContent:'center', gap:3, cursor:'pointer', fontSize:9.5,
    fontWeight:700, color:'#7B8099', border:'none', background:'none',
    letterSpacing:.3, textTransform:'uppercase' },
  niOn: { color:'#5C6BC0' },
}