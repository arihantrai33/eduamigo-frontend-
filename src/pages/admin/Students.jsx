import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", rollNumber: "",
    class: "", section: "", gender: "", dateOfBirth: "",
    address: "", parentName: "", parentPhone: "", feeStatus: "Pending"
  });

  useEffect(() => { fetchStudents(); }, [search, filterClass]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/students`, {
        params: { search, class: filterClass },
        ...authHeader()
      });
      setStudents(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editStudent) {
        await axios.put(`${API}/students/${editStudent._id}`, form, authHeader());
      } else {
        await axios.post(`${API}/students`, form, authHeader());
      }
      setShowModal(false);
      setEditStudent(null);
      setForm({
        name: "", email: "", phone: "", rollNumber: "",
        class: "", section: "", gender: "", dateOfBirth: "",
        address: "", parentName: "", parentPhone: "", feeStatus: "Pending"
      });
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || "Error!");
    }
  };

  const handleEdit = (student) => {
    setEditStudent(student);
    setForm({ ...student, dateOfBirth: student.dateOfBirth?.split("T")[0] || "" });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await axios.delete(`${API}/students/${id}`, authHeader());
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const classes = ["1","2","3","4","5","6","7","8","9","10","11","12"];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Students</h1>
          <p className="text-gray-500 text-sm">Manage all students</p>
        </div>
        <button
          onClick={() => { setEditStudent(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Add Student
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text" placeholder="Search students..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select
          value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {["Roll No", "Name", "Class", "Parent", "Phone", "Fee Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-8 text-gray-400">No students found</td></tr>
            ) : students.map((s) => (
              <tr key={s._id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{s.rollNumber}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.email}</div>
                </td>
                <td className="px-4 py-3 text-sm">Class {s.class}-{s.section}</td>
                <td className="px-4 py-3 text-sm">{s.parentName}</td>
                <td className="px-4 py-3 text-sm">{s.phone}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    s.feeStatus === "Paid" ? "bg-green-100 text-green-700" :
                    s.feeStatus === "Pending" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"}`}>
                    {s.feeStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleEdit(s)} className="text-blue-600 hover:underline text-sm mr-3">Edit</button>
                  <button onClick={() => handleDelete(s._id)} className="text-red-500 hover:underline text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editStudent ? "Edit Student" : "Add Student"}</h2>
            <div style={{ fontSize: 12, color: "#92400E", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "8px 12px", marginBottom: 16 }}>
              ℹ️ Login credentials — Email: <strong>{form.email || "student email"}</strong> / Password: <strong>{form.phone || "phone number"}</strong>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {[
                { label: "Full Name *", key: "name", type: "text" },
                { label: "Email *", key: "email", type: "email" },
                { label: "Phone *", key: "phone", type: "text" },
                { label: "Roll Number *", key: "rollNumber", type: "text" },
                { label: "Parent Name", key: "parentName", type: "text" },
                { label: "Parent Phone", key: "parentPhone", type: "text" },
                { label: "Address", key: "address", type: "text" },
                { label: "Date of Birth", key: "dateOfBirth", type: "date" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <input
                    type={type} value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-gray-700">Class *</label>
                <select value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Section *</label>
                <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Section</option>
                  {["A","B","C","D"].map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Fee Status</label>
                <select value={form.feeStatus} onChange={(e) => setForm({ ...form, feeStatus: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>
              <div className="col-span-2 flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editStudent ? "Update" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}