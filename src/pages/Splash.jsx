import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const redirected = useRef(false);
  const [minTimeDone, setMinTimeDone] = useState(false);

  // Minimum splash display time (1500ms)
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeDone(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Redirect only when BOTH: auth loaded + min time passed
  useEffect(() => {
    if (!loading && minTimeDone && !redirected.current) {
      redirected.current = true;
      if (user) {
        navigate(`/${user.role}/home`, { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [loading, minTimeDone, user, navigate]);

  return (
    <div style={{
      height: "100vh",
      background: "linear-gradient(135deg, #0A0E27 0%, #0D1F5C 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "0px",
      position: "relative",
      overflow: "hidden",
      fontFamily: "Georgia, serif",
    }}>

      {/* Background glow blobs */}
      <div style={{
        position: "absolute",
        width: "350px", height: "350px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,111,232,0.25) 0%, transparent 70%)",
        top: "15%", left: "50%",
        transform: "translateX(-50%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        width: "250px", height: "250px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(108,59,232,0.18) 0%, transparent 70%)",
        bottom: "20%", right: "-10%",
        pointerEvents: "none",
      }} />

      {/* Outer rings */}
      <div style={{
        position: "absolute",
        width: "280px", height: "280px",
        borderRadius: "50%",
        border: "0.5px solid rgba(79,142,247,0.2)",
        top: "50%", left: "50%",
        transform: "translate(-50%, -62%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        width: "220px", height: "220px",
        borderRadius: "50%",
        border: "0.5px solid rgba(123,92,240,0.15)",
        top: "50%", left: "50%",
        transform: "translate(-50%, -62%)",
        pointerEvents: "none",
      }} />

      {/* Stars */}
      {[
        { top: "12%", left: "15%", size: 3 },
        { top: "18%", left: "78%", size: 2 },
        { top: "8%",  left: "55%", size: 2 },
        { top: "75%", left: "12%", size: 2 },
        { top: "80%", left: "85%", size: 3 },
      ].map((s, i) => (
        <div key={i} style={{
          position: "absolute",
          top: s.top, left: s.left,
          width: s.size, height: s.size,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.35)",
          animation: `twinkle 2s ease-in-out ${i * 0.4}s infinite`,
        }} />
      ))}

      {/* Logo card */}
      <div style={{
        width: "88px", height: "88px",
        borderRadius: "22px",
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "42px",
        marginBottom: "28px",
        boxShadow: "0 0 0 8px rgba(79,142,247,0.1), 0 0 0 16px rgba(79,142,247,0.05)",
        animation: "floatUp 0.6s ease-out both",
      }}>
        🎓
      </div>

      {/* App name */}
      <h1 style={{
        color: "white",
        fontSize: "34px",
        fontWeight: "700",
        margin: "0 0 8px 0",
        letterSpacing: "2px",
        animation: "floatUp 0.6s ease-out 0.15s both",
      }}>
        EduAmigo
      </h1>

      {/* Tagline */}
      <p style={{
        color: "#8BA4D4",
        fontSize: "11px",
        letterSpacing: "4px",
        margin: "0 0 20px 0",
        fontWeight: "400",
        animation: "floatUp 0.6s ease-out 0.25s both",
      }}>
        YOUR SCHOOL COMPANION
      </p>

      {/* Divider */}
      <div style={{
        width: "60px", height: "0.5px",
        background: "linear-gradient(90deg, transparent, #4F8EF7, transparent)",
        marginBottom: "28px",
        animation: "floatUp 0.6s ease-out 0.3s both",
      }} />

      {/* Dots */}
      <div style={{
        display: "flex", gap: "8px",
        animation: "floatUp 0.6s ease-out 0.4s both",
      }}>
        {[
          "rgba(79,142,247,0.9)",
          "rgba(255,255,255,0.3)",
          "rgba(123,92,240,0.7)"
        ].map((color, i) => (
          <div key={i} style={{
            width: "6px", height: "6px",
            borderRadius: "50%",
            background: color,
            animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      {/* Bottom watermark */}
      <p style={{
        position: "absolute",
        bottom: "28px",
        color: "#1E3A6E",
        fontSize: "10px",
        letterSpacing: "3px",
        margin: 0,
        animation: "floatUp 0.6s ease-out 0.5s both",
      }}>
        POWERED BY EDUAMIGO
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}