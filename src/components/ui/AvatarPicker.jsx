import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import Avatar from "./Avatar";
import { useAuth } from "../../context/AuthContext";
import { toast, errorMessage } from "../../utils/toast";

const API = import.meta.env.VITE_API_URL;
const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX = 5 * 1024 * 1024;

// A person's own profile photo with a camera button to change it and a bin to remove it. The new photo is saved on the
// server (a student's photo is the one on the school's record, so lists and the ID card show it too) and shown at once.
//   <AvatarPicker name="Riya Sharma" photo={url} />
export default function AvatarPicker({ name, photo, size = "lg" }) {
  const { user, updateUser } = useAuth();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState(undefined); // set after a change here, so an older photo passed in cannot show again
  const shown = local !== undefined ? local || undefined : user?.avatar || photo;
  const token = () => localStorage.getItem("token");

  const upload = async (file) => {
    if (!file) return;
    if (!TYPES.includes(file.type)) return toast.error("Choose a JPEG, PNG or WebP photo.");
    if (file.size > MAX) return toast.error("That photo is bigger than 5 MB. Choose a smaller one.");
    setBusy(true);
    try {
      const body = new FormData();
      body.append("photo", file);
      const res = await fetch(`${API}/users/me/avatar`, { method: "PUT", headers: { Authorization: `Bearer ${token()}` }, body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || "The photo could not be saved.");
      updateUser({ avatar: data.avatar });
      setLocal(data.avatar);
      toast.success("Profile photo updated.");
    } catch (err) {
      toast.error(errorMessage(err, "The photo could not be saved. Please try again."));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/users/me/avatar`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error("The photo could not be removed.");
      updateUser({ avatar: undefined });
      setLocal(null);
      toast.success("Profile photo removed.");
    } catch (err) {
      toast.error(errorMessage(err, "The photo could not be removed."));
    } finally { setBusy(false); }
  };

  return (
    <div className="ea-avatar-picker">
      <div className="ea-avatar-picker__frame">
        <Avatar name={name} photo={shown} size={size} alt={shown ? `${name || "Your"} photo` : ""} />
        <button type="button" className="ea-avatar-picker__btn" onClick={() => input.current?.click()} disabled={busy} aria-label={shown ? "Change profile photo" : "Add a profile photo"}>
          <Camera size={15} aria-hidden="true" />
        </button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => upload(e.target.files?.[0])} />
      </div>
      {shown && <button type="button" className="ea-avatar-picker__remove" onClick={remove} disabled={busy}><Trash2 size={13} aria-hidden="true" />Remove photo</button>}
    </div>
  );
}
