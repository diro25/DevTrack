import { useEffect, useRef } from "react";

function AnimatedBackground() {
  const glowRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 3;
    let x = targetX;
    let y = targetY;
    let frame;

    function onMove(e) {
      targetX = e.clientX;
      targetY = e.clientY;
    }

    function tick() {
      // The glow eases toward the mouse instead of jumping to it
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${x - 250}px, ${y - 250}px)`;
      }
      frame = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", onMove);
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="bg-layer" aria-hidden="true">
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="bg-blob blob-3" />
      <div className="bg-glow" ref={glowRef} />
    </div>
  );
}

export default AnimatedBackground;