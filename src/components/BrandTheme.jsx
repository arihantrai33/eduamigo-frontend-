import { useLayoutEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { userTheme, brandCssVars } from "../utils/theme";

// Applies the signed-in user's school theme to the whole app as CSS variables (see utils/theme.js).
// Signed out, or a school without a brand colour: the EduAmigo defaults from index.css apply.
export default function BrandTheme() {
  const { user } = useAuth();
  const { primaryColor, accentColor, heroStyle } = user?.branding || {};

  useLayoutEffect(() => {
    const root = document.documentElement;
    const vars = brandCssVars(userTheme({ branding: { primaryColor, accentColor, heroStyle } }));
    if (!primaryColor) {
      Object.keys(vars).forEach((name) => root.style.removeProperty(name));
      return;
    }
    Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value));
  }, [primaryColor, accentColor, heroStyle]);

  return null;
}
