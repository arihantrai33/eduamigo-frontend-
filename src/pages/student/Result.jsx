import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const gradeColor = (g) =>
  g === 'A+' ? '#00897B' : g === 'A' ? '#43A047' : g === 'B' ? '#FB8C00' :
  g === 'C' ? '#F4511E' : g === 'D' ? '#E53935' : '#B71C1C';

export default function StudentResult() {
  const navigate = useNavigate();
  const [results, setResults]         = useState([]);
  const [avgMarks, setAvgMarks]       = useState(null);
  const [overallGrade, setOverallGrade] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeExam, setActiveExam]   = useState('All');

  useEffect(() => { fetchResults(); }, []);

  const fetchResults = async () => {
    try {
      const res = await axios.get(`${API}/exams/my-results`, authHeader());
      if (res.data.success) {
        setResults(res.data.data || []);
        setAvgMarks(res.data.averagePercentage);
        setOverallGrade(res.data.overallGrade);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Exam type tabs
  const examTypes = ['All', ...new Set(results.map(r => r.examType).filter(Boolean))];

  const filtered = activeExam === 'All'
    ? results
    : results.filter(r => r.examType === activeExam);

  const totalScored = filtered.reduce((a, r) => a + Number(r.marksObtained), 0);
  const totalMax    = filtered.reduce((a, r) => a + Number(r.totalMarks), 0);
  const percentage  = totalMax > 0 ? ((totalScored / totalMax) * 100).toFixed(1) : null;

  const best  = filtered.length > 0 ? filtered.reduce((a, b) => Number(a.percentage) > Number(b.percentage) ? a : b) : null;
  const worst = filtered.length > 0 ? filtered.reduce((a, b) => Number(a.percentage) < Number(b.percentage) ? a : b) : null;

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#5C6BC0' }}>
      Loading results...
    </div>
  );

  if (results.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif',
      gap: 12, padding: 24, background: '#F4F6FB' }}>
      <div style={{ fontSize: 48 }}>📭</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1C2033' }}>No Results Yet</div>
      <div style={{ fontSize: 14, color: '#7B8099', textAlign: 'center' }}>
        No results have been published yet. Check back later.
      </div>
      <button onClick={() => navigate('/student/home')}
        style={{ marginTop: 12, padding: '12px 24px', background: '#5C6BC0',
          color: '#fff', border: 'none', borderRadius: 12, fontSize: 14,
          fontWeight: 700, cursor: 'pointer' }}>
        ← Back to Home
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh',
      background: '#F4F6FB', fontFamily: 'Inter, sans-serif',
      display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(145deg,#1C2033,#3949AB,#5C6BC0)',
        paddingBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '48px 18px 10px' }}>
          <button onClick={() => navigate('/student/home')}
            style={{ width: 38, height: 38, borderRadius: 12, border: 'none',
              background: 'rgba(255,255,255,.18)', color: '#fff', fontSize: 20, cursor: 'pointer' }}>
            ←
          </button>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Academic Results</span>
          <div style={{ width: 38 }} />
        </div>

        {/* Exam Type Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,.12)', borderRadius: 12,
          padding: 4, margin: '0 16px 12px', gap: 3, flexWrap: 'wrap' }}>
          {examTypes.map(e => (
            <button key={e} onClick={() => setActiveExam(e)}
              style={{ flex: 1, padding: '8px 4px', borderRadius: 9, fontSize: 11,
                fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                background: activeExam === e ? 'rgba(255,255,255,.22)' : 'none',
                color: activeExam === e ? '#fff' : 'rgba(255,255,255,.6)' }}>
              {e}
            </button>
          ))}
        </div>

        {/* Score Summary */}
        <div style={{ display: 'flex', alignItems: 'center',
          justifyContent: 'space-around', padding: '0 16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 60, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {percentage ?? '—'}%
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>
              Grade: {overallGrade ?? '—'}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Scored', value: totalScored || '—' },
              { label: 'Total',  value: totalMax   || '—' },
            ].map(p => (
              <div key={p.label} style={{ background: 'rgba(255,255,255,.13)',
                borderRadius: 14, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{p.value}</div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.7)',
                  fontWeight: 700, textTransform: 'uppercase' }}>{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 80px' }}>

        {/* Subject Cards */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 18,
          marginBottom: 14, boxShadow: '0 2px 16px rgba(92,107,192,.10)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7B8099',
            textTransform: 'uppercase', letterSpacing: .6, marginBottom: 14 }}>
            Subject-wise Performance
          </div>
          {filtered.length === 0 ? (
            <div style={{ color: '#7B8099', fontSize: 14, textAlign: 'center', padding: 20 }}>
              No results for this exam type.
            </div>
          ) : (
            filtered.map((r, i) => {
              const pct = ((Number(r.marksObtained) / Number(r.totalMarks)) * 100).toFixed(1);
              return (
                <div key={r._id} style={{ marginBottom: i === filtered.length - 1 ? 0 : 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 7 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1C2033' }}>
                      📚 {r.subject}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: '#E8EAF6', color: gradeColor(r.grade),
                        borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                        {r.grade}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#5C6BC0' }}>
                        {r.marksObtained}/{r.totalMarks}
                      </span>
                    </div>
                  </div>
                  <div style={{ background: '#E8EAF0', borderRadius: 20, height: 10, overflow: 'hidden' }}>
                    <div style={{ borderRadius: 20, height: 10,
                      width: `${pct}%`, background: 'linear-gradient(90deg,#5C6BC0,#7986CB)',
                      transition: 'width .8s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#7B8099', marginTop: 4 }}>
                    {pct}% • {r.examType || '—'}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Strength & Focus */}
        {best && worst && best._id !== worst._id && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Strength',   emoji: '💪', sub: best.subject,  val: `${best.marks}/${best.maxMarks}`,   bg: 'linear-gradient(135deg,#E0F7F4,#B2DFDB)' },
              { label: 'Focus Area', emoji: '📌', sub: worst.subject, val: `${worst.marks}/${worst.maxMarks}`, bg: 'linear-gradient(135deg,#FFEBEE,#FFCDD2)' },
            ].map(c => (
              <div key={c.label} style={{ background: c.bg, borderRadius: 16, padding: 14 }}>
                <div style={{ fontSize: 22 }}>{c.emoji}</div>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                  color: '#7B8099', marginTop: 4 }}>{c.label}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1C2033' }}>{c.sub}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7B8099' }}>{c.val}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, height: 66, background: '#fff',
        display: 'flex', borderTop: '1px solid #E8EAF0',
        boxShadow: '0 -4px 24px rgba(92,107,192,.08)', zIndex: 200 }}>
        {[
          ['🏠', 'Home',   '/student/home'],
          ['🚌', 'Bus',    '/student/bus'],
          ['📚', 'Learn',  '/student/notes'],
          ['📊', 'Result', '/student/result'],
          ['👤', 'Me',     '/student/profile'],
        ].map(([ico, lbl, path]) => (
          <button key={lbl} onClick={() => navigate(path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, cursor: 'pointer', fontSize: 9.5, fontWeight: 700,
              color: path === '/student/result' ? '#5C6BC0' : '#7B8099',
              border: 'none', background: 'none', textTransform: 'uppercase' }}>
            <span style={{ fontSize: 22 }}>{ico}</span>
            <span>{lbl}</span>
          </button>
        ))}
      </div>
    </div>
  );
}