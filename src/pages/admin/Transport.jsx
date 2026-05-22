import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  getAllBuses, createBus, deleteBus,
  updateBusStops, getStudentsForBus, assignStudents
} from "../../api/transport";

const pinIcon = (label, isSchool) => L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;background:${isSchool ? '#F59E0B' : '#0EA5E9'};border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:${isSchool ? '14' : '12'}px;">${isSchool ? '🏫' : label}</div>`,
  iconSize: [30, 30], iconAnchor: [15, 15],
});

const pendingIcon = L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;background:#8B5CF6;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;">?</div>`,
  iconSize: [30, 30], iconAnchor: [15, 15],
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

export default function Transport() {
  const [buses, setBuses] = useState([]);
  const [view, setView] = useState('list');
  const [selectedBus, setSelectedBus] = useState(null);
  const [stops, setStops] = useState([]);
  const [pendingLatLng, setPendingLatLng] = useState(null);
  const [stopName, setStopName] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [form, setForm] = useState({
    busNumber: '', driverName: '', driverPhone: '', routeName: '', capacity: 40
  });
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => { fetchBuses(); }, []);

  useEffect(() => {
    if (view === 'stops') {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, [view]);

  const fetchBuses = async () => {
    setLoading(true);
    try {
      const res = await getAllBuses();
      setBuses(res.data || []);
    } catch { showToast('Failed to load buses'); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.busNumber || !form.driverName || !form.driverPhone || !form.routeName) {
      showToast('Please fill all fields'); return;
    }
    try {
      const res = await createBus(form);
      alert(`✅ Bus Created!\n\nBus: ${res.data.busNumber}\nDriver Token: ${res.data.driverToken}\n\nYe token driver ko share karo — Driver app mein use hoga.`);
      setView('list');
      setForm({ busNumber: '', driverName: '', driverPhone: '', routeName: '', capacity: 40 });
      fetchBuses();
    } catch (e) { showToast(e?.response?.data?.message || 'Create failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bus? All student assignments will be removed.')) return;
    try { await deleteBus(id); fetchBuses(); showToast('Bus deleted'); }
    catch { showToast('Delete failed'); }
  };

  const openStops = (bus) => {
    setSelectedBus(bus);
    const existing = (bus.stops || []).map(s => ({
      name: s.name, latitude: s.latitude, longitude: s.longitude, order: s.order
    }));
    setStops(existing);
    if (existing.length > 0) setMapCenter([existing[0].latitude, existing[0].longitude]);
    setPendingLatLng(null); setStopName('');
    setView('stops');
  };

  const openAssign = async (bus) => {
    setSelectedBus(bus);
    setAssignLoading(true);
    setView('assign');
    try {
      const res = await getStudentsForBus();
      setAllStudents(res.data || []);
      // Fix: toString() se compare karo
      const alreadyAssigned = (bus.assignedStudents || []).map(s =>
        typeof s === 'object' ? s._id?.toString() : s?.toString()
      );
      setSelectedStudents(alreadyAssigned);
    } catch { showToast('Failed to load students'); }
    setAssignLoading(false);
    setSearchQuery('');
  };

  const toggleStudent = (studentId) => {
    const id = studentId.toString();
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAssignSave = async () => {
    try {
      await assignStudents(selectedBus._id, selectedStudents);
      showToast(`✅ ${selectedStudents.length} students assigned!`);
      fetchBuses();
      setView('list');
    } catch { showToast('Assignment failed'); }
  };

  const addStop = () => {
    if (!pendingLatLng) { showToast('Pehle map pe tap karo'); return; }
    if (!stopName.trim()) { showToast('Stop ka naam likho'); return; }
    setStops(prev => [...prev, {
      name: stopName.trim(),
      latitude: pendingLatLng.lat,
      longitude: pendingLatLng.lng,
      order: prev.length + 1
    }]);
    setStopName(''); setPendingLatLng(null);
  };

  const removeStop = (idx) => {
    setStops(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const saveStops = async () => {
    if (stops.length < 2) { showToast('At least 2 stops required'); return; }
    try {
      await updateBusStops(selectedBus._id, stops);
      showToast('✅ Stops saved!'); fetchBuses(); setView('list');
    } catch { showToast('Save failed'); }
  };

  const filteredStudents = allStudents.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── LIST VIEW ──
  if (view === 'list') return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>🚌 Transport</div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>Manage school buses, routes and students</div>
        </div>
        <button style={s.addBtn} onClick={() => setView('create')}>+ New Bus</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Buses', value: buses.length, bg: '#EEEDFE', color: '#534AB7' },
          { label: 'On Route', value: buses.filter(b => b.busStatus === 'On Route').length, bg: '#FAEEDA', color: '#854F0B' },
          { label: 'Students Assigned', value: buses.reduce((a, b) => a + (b.assignedStudents?.length || 0), 0), bg: '#EAF3DE', color: '#3B6D11' },
        ].map((stat, i) => (
          <div key={i} style={{ background: stat.bg, borderRadius: 12, padding: '1rem' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: stat.color, marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>Loading...</div>}
      {!loading && buses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48 }}>🚌</div>
          <div style={{ color: '#1a1a1a', fontWeight: 600, fontSize: 15, marginTop: 12 }}>No buses yet</div>
          <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>Create your first bus to get started</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {buses.map(bus => (
          <div key={bus._id} style={s.busCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>🚌</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{bus.busNumber}</div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>👤 {bus.driverName} • 📞 {bus.driverPhone}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>🛣️ {bus.routeName} • {bus.stops?.length || 0} stops • {bus.assignedStudents?.length || 0} students</div>
                </div>
              </div>
              <span style={{
                fontSize: 10, padding: '4px 10px', borderRadius: 20, fontWeight: 600,
                background: bus.busStatus === 'On Route' ? '#EAF3DE' : bus.busStatus === 'Completed' ? '#EEEDFE' : '#F5F5F3',
                color: bus.busStatus === 'On Route' ? '#3B6D11' : bus.busStatus === 'Completed' ? '#534AB7' : '#888'
              }}>{bus.busStatus}</span>
            </div>

            <div style={{ marginTop: 10, padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, fontSize: 11, color: '#555', border: '1px solid #E8E8E5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>🔑 Driver Token: <strong style={{ color: '#0284C7', letterSpacing: 1 }}>{bus.driverToken}</strong></span>
              <button onClick={() => { navigator.clipboard.writeText(bus.driverToken); showToast('Token copied!'); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>📋</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button style={s.btnBlue} onClick={() => openStops(bus)}>📍 Stops ({bus.stops?.length || 0})</button>
              <button style={s.btnPurple} onClick={() => openAssign(bus)}>👥 Students ({bus.assignedStudents?.length || 0})</button>
              <button style={s.btnRed} onClick={() => handleDelete(bus._id)}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── CREATE VIEW ──
  if (view === 'create') return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => setView('list')} style={s.backBtn}>← Back</button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>New Bus</div>
          <div style={{ fontSize: 11, color: '#999' }}>A driver token will be auto-generated</div>
        </div>
      </div>
      <div style={s.formCard}>
        {[
          ['Bus Number', 'busNumber', 'e.g. BUS42', 'text'],
          ['Driver Name', 'driverName', 'e.g. Ramesh Kumar', 'text'],
          ['Driver Phone', 'driverPhone', '+91-XXXXXXXXXX', 'tel'],
          ['Route Name', 'routeName', 'e.g. Sector 62 Route', 'text'],
        ].map(([label, key, ph, type]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={s.label}>{label}</label>
            <input style={s.input} type={type} placeholder={ph} value={form[key]}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
          </div>
        ))}
        <div style={{ marginBottom: 20 }}>
          <label style={s.label}>Capacity (seats)</label>
          <input style={s.input} type="number" value={form.capacity}
            onChange={e => setForm(p => ({ ...p, capacity: +e.target.value }))} />
        </div>
        <button style={s.btnCreate} onClick={handleCreate}>✅ Create Bus</button>
        <p style={{ fontSize: 11, color: '#999', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
          A unique driver token will be generated.<br />Share this token with the driver to login to the driver app.
        </p>
      </div>
    </div>
  );

  // ── ASSIGN STUDENTS VIEW ──
  if (view === 'assign') return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => setView('list')} style={s.backBtn}>← Back</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>👥 Assign Students</div>
          <div style={{ fontSize: 11, color: '#999' }}>{selectedBus?.busNumber} — {selectedBus?.routeName}</div>
        </div>
      </div>

      <input
        style={{ ...s.input, marginBottom: 12 }}
        placeholder="🔍 Search by name, roll no, class..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />

      <div style={{ fontSize: 12, color: '#534AB7', fontWeight: 600, marginBottom: 10 }}>
        {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
      </div>

      {assignLoading && <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>Loading students...</div>}
      {!assignLoading && filteredStudents.length === 0 && (
        <div style={{ textAlign: 'center', color: '#ccc', padding: '30px 0' }}>
          {searchQuery ? 'No students found' : 'No students in database'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 80 }}>
        {filteredStudents.map(student => {
          const isSelected = selectedStudents.includes(student._id?.toString());
          const isOnOtherBus = student.bus && student.bus._id !== selectedBus._id;
          return (
            <div key={student._id}
              onClick={() => toggleStudent(student._id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                background: isSelected ? '#EFF6FF' : '#fff',
                border: `1.5px solid ${isSelected ? '#0EA5E9' : '#E8E8E5'}`,
                transition: 'all 0.15s'
              }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: isSelected ? '#0EA5E9' : '#F5F5F3',
                border: `2px solid ${isSelected ? '#0EA5E9' : '#D1D5DB'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {isSelected && <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{student.name}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  Roll: {student.rollNumber} • Class {student.class}-{student.section}
                  {isOnOtherBus && <span style={{ color: '#F59E0B', marginLeft: 6 }}>⚠️ On {student.bus.busNumber}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 210, right: 0, padding: '14px 20px', background: '#fff', borderTop: '1px solid #E8E8E5', zIndex: 100 }}>
        <button style={s.btnCreate} onClick={handleAssignSave}>
          💾 Save — {selectedStudents.length} Students Assigned
        </button>
      </div>
    </div>
  );

  // ── STOPS VIEW ──
  return (
    <div style={{ ...s.page, padding: 0, overflow: 'hidden', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {toast && <div style={s.toast}>{toast}</div>}
      <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid #E8E8E5', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setView('list')} style={s.backBtn}>← Back</button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>📍 {selectedBus?.busNumber} — Stops</div>
          <div style={{ fontSize: 11, color: '#999' }}>{selectedBus?.routeName}</div>
        </div>
      </div>

      <div style={{ height: 320, flexShrink: 0 }}>
        <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
          <MapClickHandler onMapClick={setPendingLatLng} />
          {stops.map((stop, i) => (
            <Marker key={i} position={[stop.latitude, stop.longitude]} icon={pinIcon(i + 1, i === stops.length - 1)}>
              <Popup><strong>{i + 1}. {stop.name}</strong><br />{i === stops.length - 1 ? '🏫 School' : `Stop ${i + 1}`}</Popup>
            </Marker>
          ))}
          {pendingLatLng && (
            <Marker position={[pendingLatLng.lat, pendingLatLng.lng]} icon={pendingIcon}>
              <Popup>Enter name and click Add</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 8 }}>
        <input
          style={{ ...s.input, flex: 1, margin: 0, fontSize: 13 }}
          placeholder={pendingLatLng ? 'Enter stop name...' : 'Tap on map first...'}
          value={stopName}
          onChange={e => setStopName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addStop()}
        />
        <button style={s.btnCreate2} onClick={addStop}>+ Add</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
        <div style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>
          💡 Tap on map → enter name → Add. Last stop = School.
        </div>
        {stops.length === 0 && <div style={{ textAlign: 'center', color: '#ccc', padding: '30px 0' }}>No stops added yet</div>}
        {stops.map((stop, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F5F5F3' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: i === stops.length - 1 ? '#FEF3C7' : '#EFF6FF', border: `2px solid ${i === stops.length - 1 ? '#F59E0B' : '#BAE6FD'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
              {i === stops.length - 1 ? '🏫' : i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{stop.name}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{stop.latitude?.toFixed(5)}, {stop.longitude?.toFixed(5)}</div>
            </div>
            <button onClick={() => removeStop(i)} style={{ background: '#FEF2F2', border: 'none', color: '#DC2626', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}>✕</button>
          </div>
        ))}
      </div>

      <div style={{ padding: 14, background: '#fff', borderTop: '1px solid #E8E8E5' }}>
        <button style={s.btnCreate} onClick={saveStops}>💾 Save {stops.length} Stop{stops.length !== 1 ? 's' : ''}</button>
      </div>
    </div>
  );
}

const s = {
  page:      { padding: 20, fontFamily: 'Inter, sans-serif', background: '#F8FAFC', minHeight: '100vh' },
  busCard:   { background: '#fff', borderRadius: 14, padding: '16px 18px', border: '0.5px solid #E8E8E5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  formCard:  { background: '#fff', borderRadius: 16, padding: 20, border: '0.5px solid #E8E8E5' },
  label:     { display: 'block', fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 },
  input:     { width: '100%', padding: '11px 13px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' },
  btnBlue:   { background: '#EFF6FF', color: '#0EA5E9', border: '1px solid #BAE6FD', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnPurple: { background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnRed:    { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '8px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' },
  btnCreate: { width: '100%', background: 'linear-gradient(135deg, #1a73e8, #0EA5E9)', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnCreate2:{ background: 'linear-gradient(135deg, #1a73e8, #0EA5E9)', color: '#fff', border: 'none', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  backBtn:   { background: '#F5F5F3', border: '1px solid #E8E8E5', color: '#1a1a1a', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  addBtn:    { background: '#1a73e8', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  toast:     { position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#1C2033', color: '#fff', padding: '10px 20px', borderRadius: 30, fontSize: 13, fontWeight: 600, zIndex: 9999, whiteSpace: 'nowrap' },
};