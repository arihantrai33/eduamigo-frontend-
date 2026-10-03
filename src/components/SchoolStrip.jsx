// Small school logo + name shown at the top of signed-in home screens.
export default function SchoolStrip({ user, theme, look }) {
  const name = user?.branding?.appName || user?.school || "";
  if (!name) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      {user?.branding?.logoUrl ? (
        <img src={user.branding.logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: "50%", background: "#fff", objectFit: "contain", border: `2px solid ${theme.accent}` }} />
      ) : (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: theme.accent, color: theme.onAccent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{name[0]}</div>
      )}
      <div style={{ fontSize: 12, fontWeight: 800, color: look.text, letterSpacing: 0.2 }}>{name}</div>
    </div>
  );
}
