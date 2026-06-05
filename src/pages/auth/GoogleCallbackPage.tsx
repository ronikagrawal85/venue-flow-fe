import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Zap } from "lucide-react";
import toast from "react-hot-toast";

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { login: _login } = useAuth();
  console.log("login: ", _login);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = window.location.hash; // "#token=eyJ..."
    const params = new URLSearchParams(hash.replace("#", "?"));
    const token = params.get("token");

    if (!token) {
      toast.error("Google login failed — no token received");
      navigate("/login", { replace: true });
      return;
    }

    try {
      // Decode the JWT payload (base64url → JSON) — no verification needed
      // since the backend already validated it; we just need the user fields.
      const payloadBase64 = token.split(".")[1];
      const paddedPayload =
        payloadBase64 + "=".repeat((4 - (payloadBase64.length % 4)) % 4);
      const payload = JSON.parse(atob(paddedPayload)) as {
        id: string;
        email: string;
        role: string;
        name?: string;
      };

      const userData = {
        id: payload.id,
        email: payload.email,
        role: payload.role as "USER" | "ADMIN" | "ORGANIZER",
        name: payload.name,
      };

      localStorage.setItem("vf_token", token);
      localStorage.setItem("vf_user", JSON.stringify(userData));

      // Clear the hash so the token isn't visible in the URL bar
      window.history.replaceState(null, "", window.location.pathname);

      toast.success(`Welcome, ${userData.name ?? userData.email}!`);
      navigate("/", { replace: true });
    } catch {
      toast.error("Google login failed — could not parse token");
      navigate("/login", { replace: true });
    }
  }, [navigate, _login]);

  return (
    <div className="auth-page">
      <div
        className="auth-card"
        style={{ textAlign: "center", padding: "3rem 2rem" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <Zap size={28} color="var(--accent-500)" />
          <span style={{ fontSize: "1.25rem", fontWeight: 800 }}>
            VenueFlow
          </span>
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid var(--accent-500)",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 20px",
          }}
        />
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Completing Google sign-in…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
