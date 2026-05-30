import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [darkMode]);

  const colors = darkMode ? {
    bg: "#0f0f1a",
    card: "#1a1a2e",
    card2: "#16213e",
    text: "#f1f1f1",
    subtext: "#aaa",
    subtext2: "#bbb",
    border: "#2a2a4a",
    inputBg: "#1a1a2e",
    navBg: "#16213e",
    tileBg: "#1a1a2e",
  } : {
    bg: "#f5f6fa",
    card: "white",
    card2: "#f5f6fa",
    text: "#111",
    subtext: "#888",
    subtext2: "#666",
    border: "#f0f0f0",
    inputBg: "#f5f6fa",
    navBg: "white",
    tileBg: "white",
  };

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
