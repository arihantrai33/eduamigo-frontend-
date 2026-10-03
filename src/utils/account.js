import axios from "axios";
import { toast, errorMessage, confirmAction } from "./toast";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

// Ends every session of this account (lost phone, shared device), then signs out here too.
export async function signOutEverywhere(logout, navigate) {
  const ok = await confirmAction("Sign out on all devices, including this one? You will need your password to log in again.", { confirmLabel: "Sign out everywhere" });
  if (!ok) return;
  try {
    await axios.post(`${API}/users/logout-all`, {}, auth());
    logout();
    navigate("/login", { replace: true });
  } catch (err) {
    toast.error(errorMessage(err));
  }
}

// New temporary password for a student's login (used by parents and teachers).
export async function resetStudentPassword(student) {
  const ok = await confirmAction(`Give ${student.name} a new temporary password? Their old password stops working at once.`, { confirmLabel: "Reset password", danger: false });
  if (!ok) return null;
  try {
    const res = await axios.post(`${API}/students/${student._id}/reset-password`, {}, auth());
    return res.data.credentials;
  } catch (err) {
    toast.error(errorMessage(err));
    return null;
  }
}
