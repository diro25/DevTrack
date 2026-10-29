import { useEffect, useState } from "react";
import { wakeBackend } from "../wakeUp";
import { useToast } from "../ToastContext";

const SLOW_AFTER_MS = 3000; // show the message if the server hasn't answered by then
const IDLE_AFTER_MS = 10 * 60 * 1000; // wake it again after 10 minutes in a hidden tab

function WakeBanner() {
  const { showToast } = useToast();
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let running = false;
    let lastWarm = 0;

    async function warm() {
      if (running) return;
      running = true;
      lastWarm = Date.now();

      let slow = false;
      let ok = false;
      const timer = setTimeout(() => {
        slow = true;
        if (!cancelled) setWaking(true);
      }, SLOW_AFTER_MS);

      try {
        await wakeBackend();
        ok = true;
      } catch (err) {
        // If the server can't be reached, the pages show their own error messages
      } finally {
        clearTimeout(timer);
        running = false;
        if (!cancelled) {
          setWaking(false);
          if (slow && ok) showToast("The server is ready", "success");
        }
      }
    }

    // Coming back to a tab that has been open for a while: wake the server again
    function onVisible() {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastWarm > IDLE_AFTER_MS
      ) {
        warm();
      }
    }

    warm();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [showToast]);

  if (!waking) return null;

  return (
    <div className="wake-banner" role="status">
      ☕ The server is waking up (free hosting). The first visit can take up to a
      minute. Thanks for waiting!
    </div>
  );
}

export default WakeBanner;