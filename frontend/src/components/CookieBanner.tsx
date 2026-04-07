import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { setCookie, getCookie } from "../utils/cookies";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookie("cookie_consent");
    if (!consent) {
      setVisible(true);
    }
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
    <div className="fixed bottom-0 left-0 w-full bg-black text-white p-4 z-50">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        <p className="text-sm">
          We use cookies to improve your experience. See our{" "}
          <Link to="/privacy" className="underline text-blue-300">
            Privacy Policy
          </Link>.
        </p>

        <div className="flex gap-2">
          <button onClick={accept} className="bg-green-500 px-4 py-2 rounded">
            Accept
          </button>
          <button onClick={decline} className="bg-gray-500 px-4 py-2 rounded">
            Decline
          </button>
        </div>

      </div>
    </div>
  );
}