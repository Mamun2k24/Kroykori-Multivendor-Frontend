import React, { useMemo } from "react";
import "./Snowfall.css";

const Snowfall = () => {
  const snowflakes = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 7 + Math.random() * 9,
      delay: Math.random() * 8,
      size: 8 + Math.random() * 22,
      opacity: 0.35 + Math.random() * 0.6,
      sway: 20 + Math.random() * 45,
      crystal: i % 3 === 0,
    }));
  }, []);

  return (
    <>
      <div className="winter-atmosphere" aria-hidden="true" />
      <div className="winter-frost" aria-hidden="true" />

      <div className="winter-icicles" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            style={{
              left: `${i * 5.8 + Math.random() * 2}%`,
              height: `${8 + Math.random() * 28}px`,
            }}
          />
        ))}
      </div>

      <div className="snowfall-container" aria-hidden="true">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="snowflake-item"
            style={{
              left: `${flake.left}%`,
              animationDuration: `${flake.duration}s`,
              animationDelay: `${flake.delay}s`,
              "--sway": `${flake.sway}px`,
              opacity: flake.opacity,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
            }}
          >
            {flake.crystal ? (
              <div className="snow-crystal">
                <span />
                <span />
                <span />
              </div>
            ) : (
              <div className="snow-dot" />
            )}
          </div>
        ))}
      </div>

      <div className="winter-mist" aria-hidden="true" />
    </>
  );
};

export default Snowfall;