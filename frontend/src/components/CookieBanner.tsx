import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { setCookie, getCookie } from "../utils/cookies";

export default function CookieBanner() {
  const [visible, setVisible] = useState(() => {
    const consent = getCookie("cookie_consent");
    return !consent;
  });

  useEffect(() => {
    // Effect cleanup or external system updates can go here if needed
  }, []);

  const accept = () => {
    setCookie("cookie_consent", "accepted");
  
    document.cookie = "analytics=true; path=/";
  
    setVisible(false);
  };

  const decline = () => {
    setCookie("cookie_consent", "declined");
  
    document.cookie = "analytics=; Max-Age=0; path=/";
  
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[var(--color-surface-container-low)] border-t border-[var(--color-outline-variant)] z-50 shadow-[var(--shadow-floating)]">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 px-6 py-4">

        <p className="text-sm text-[var(--color-on-surface-variant)]">
          We use cookies to improve your experience. See our{" "}
          <Link to="/privacy" className="text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-container)] transition-colors">
            Privacy Policy
          </Link>.
        </p>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="cursor-pointer px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="cursor-pointer px-4 py-2 text-sm font-semibold rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white hover:opacity-90 hover:translate-y-[-1px] transition-all"
          >
            Accept
          </button>
        </div>

      </div>
    </div>
  );
}