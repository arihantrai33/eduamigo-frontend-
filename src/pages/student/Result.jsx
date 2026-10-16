import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';

import Glyph from "../../components/Glyph";
import BottomNav from "../../layout/BottomNav";
import PortalHeader from "../../components/ui/PortalHeader";
import SummaryCard from "../../components/ui/SummaryCard";
import Segmented from "../../components/ui/Segmented";
const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

// By grade band, so both scales work: A+/A/B/C/D and the CBSE A1, A2, B1 ... E. Only E/F get the fail red.
const gradeColor = (grade) => { const g = String(grade || ''); return (
  g === 'A+' || g === 'A1' ? '#00695C' : g[0] === 'A' ? '#2E7D32' : g[0] === 'B' ? '#B45309' :
  g[0] === 'C' ? '#C2410C' : g[0] === 'D' ? '#C62828' : '#B71C1C'); };

export default function StudentResult() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [results, setResults]           = useState([]);
  const [avgMarks, setAvgMarks]         = useState(null);
  const [overallGrade, setOverallGrade] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeExam, setActiveExam]     = useState('All');

  const dm = darkMode;

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
      setError('Failed to load results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const examTypes = ['All', ...new Set(results.map(r => r.examType).filter(Boolean))];
  const filtered  = activeExam === 'All' ? results : results.filter(r => r.examType === activeExam);

  const totalScored = filtered.reduce((a, r) => a + Number(r.marksObtained), 0);
  const totalMax    = filtered.reduce((a, r) => a + Number(r.totalMarks), 0);
  const percentage  = totalMax > 0 ? ((totalScored / totalMax) * 100).toFixed(1) : null;
  const displayGrade = activeExam === 'All' ? overallGrade : null;

  const best  = filtered.length > 0 ? filtered.reduce((a, b) => Number(a.percentage) > Number(b.percentage) ? a : b) : null;
  const worst = filtered.length > 0 ? filtered.reduce((a, b) => Number(a.percentage) < Number(b.percentage) ? a : b) : null;

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'inherit', color: 'var(--brand)',
      background: dm ? '#0f172a' : '#F4F6FB' }}>
      Loading results...
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', fontFamily: 'inherit',
      gap: 12, padding: 24, background: dm ? '#0f172a' : '#F4F6FB' }}>
      <div style={{ fontSize: 48 }}><Glyph e="⚠" /></div>
      <div style={{ fontSize: 18, fontWeight: 700, color: dm ? '#f1f5f9' : '#1C2033' }}>Something went wrong</div>
      <div style={{ fontSize: 14, color: dm ? 'var(--ea-muted)' : '#7B8099', textAlign: 'center' }}>{error}</div>
      <button onClick={fetchResults}
        style={{ marginTop: 12, padding: '12px 24px', background: 'var(--brand)',
          color: '#fff', border: 'none', borderRadius: 12, fontSize: 14,
          fontWeight: 700, cursor: 'pointer' }}>
        Retry
      </button>
    </div>
  );

  if (results.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', fontFamily: 'inherit',
      gap: 12, padding: 24, background: dm ? '#0f172a' : '#F4F6FB' }}>
      <div style={{ fontSize: 48 }}><Glyph e="📭" /></div>
      <div style={{ fontSize: 18, fontWeight: 700, color: dm ? '#f1f5f9' : '#1C2033' }}>No Results Published</div>
      <div style={{ fontSize: 14, color: dm ? 'var(--ea-muted)' : '#7B8099', textAlign: 'center' }}>
        No results have been published yet. Check back later.
      </div>
      <button onClick={() => navigate('/student/home')}
        style={{ marginTop: 12, padding: '12px 24px', background: 'var(--brand)',
          color: '#fff', border: 'none', borderRadius: 12, fontSize: 14,
          fontWeight: 700, cursor: 'pointer' }}>
        Back to Home
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh',
      background: dm ? '#0f172a' : '#F4F6FB', fontFamily: 'inherit',
      display: 'flex', flexDirection: 'column' }}>

      <PortalHeader title="Academic Results" onBack={() => navigate('/student/home')}
        actions={<button type="button" className="ea-portal-head__btn" onClick={() => navigate('/report-card?studentId=me')} aria-label="Report card">Report Card</button>} />

      <div className="ea-pd-body ea-pd-cols" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 80px' }}>
        <div className="ea-pd-full" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          {examTypes.length > 1 && <Segmented label="Exam type" value={activeExam} onChange={setActiveExam} options={examTypes.map((e) => ({ value: e, label: e }))} />}
          <SummaryCard title="Overall result" value={`${percentage ?? '—'}%`} caption={`Grade: ${displayGrade ?? '—'}`}
            items={[{ label: 'Scored', value: totalScored || '—' }, { label: 'Total', value: totalMax || '—' }]} />
        </div>
        <div className="ea-pd-main" style={{ background: dm ? '#1e293b' : '#fff', borderRadius: 20, padding: 18,
          marginBottom: 14, boxShadow: dm ? '0 2px 16px rgba(0,0,0,.3)' : '0 2px 16px color-mix(in srgb, var(--brand) 10%, transparent)' }}>
          <h2 className="ea-section-title" style={{ marginBottom: 14 }}>
            Subject-wise Performance
          </h2>
          {filtered.length === 0 ? (
            <div style={{ color: dm ? 'var(--ea-muted)' : '#7B8099', fontSize: 14, textAlign: 'center', padding: 20 }}>
              No results for this exam type.
            </div>
          ) : (
            filtered.map((r, i) => {
              const pct = ((Number(r.marksObtained) / Number(r.totalMarks)) * 100).toFixed(1);
              return (
                <div key={r._id} style={{ marginBottom: i === filtered.length - 1 ? 0 : 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 7 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: dm ? '#f1f5f9' : '#1C2033' }}>
                      <Glyph e="📚" /> {r.subject}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: 'var(--brand-soft)',
                        color: gradeColor(r.grade),
                        borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                        {r.grade}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand)' }}>
                        {r.absent ? 'Absent' : `${r.marksObtained}/${r.totalMarks}`}
                      </span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--ea-hover)', borderRadius: 20, height: 10, overflow: 'hidden' }}>
                    <div style={{ borderRadius: 20, height: 10,
                      width: `${pct}%`, background: 'var(--brand)',
                      transition: 'width .8s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: dm ? 'var(--ea-muted)' : '#7B8099', marginTop: 4 }}>
                    {pct}% • {r.examType || '—'}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {best && worst && best._id !== worst._id && (
          <div className="ea-pd-side ea-pd-onecol" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Strength',   emoji: <Glyph e="🏆" />, sub: best.subject,  val: `${best.marksObtained}/${best.totalMarks}`,   tone: 'success' },
              { label: 'Focus area', emoji: <Glyph e="📌" />, sub: worst.subject, val: `${worst.marksObtained}/${worst.totalMarks}`, tone: 'warning' },
            ].map(c => (
              <div key={c.label} className="ea-card" style={{ padding: 14 }}>
                <span className={`ea-icon-chip ea-icon-chip--${c.tone}`} aria-hidden="true" style={{ fontSize: 18 }}>{c.emoji}</span>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ea-muted)', marginTop: 8 }}>{c.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ea-ink)' }}>{c.sub}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ea-muted)' }}>{c.val}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav role="student" />
    </div>
  );
}
