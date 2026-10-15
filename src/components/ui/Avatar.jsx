// A person's photo, or their initials on the brand tint. The same colour for everyone: a role is shown with a badge.
//   <Avatar name="Riya Sharma" photo={url} size="md" />   sizes: sm 32, md 40, lg 72 (px)
// The name is normally written next to the avatar, so the initials are hidden from screen readers; a photo keeps
// the alt text the caller gives it.
export default function Avatar({ name = "", photo, size = "md", alt = "" }) {
  const cls = `ea-avatar ea-avatar--${size === "sm" || size === "lg" ? size : "md"}`;
  if (photo) return <img src={photo} alt={alt} className={`${cls} ea-avatar--img`} />;
  const initials = name.trim() ? name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() : "?";
  return <span className={cls} aria-hidden="true">{initials}</span>;
}
