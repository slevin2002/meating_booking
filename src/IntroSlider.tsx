import React, { useState, useEffect } from "react";
import AllRooms from "./components/AllRooms";
import AllEmployees from "./components/AllEmployees";

interface IntroSliderProps {
  teams: any[];
  onFinish: () => void;
}

const SLIDE_INTERVAL_MS = 5000; // 3 seconds per slide
const ANIMATION_DURATION = 0.8; // seconds
const SLIDE_DIRECTIONS = ["up", "down", "left", "right"] as const;
const FLIP_AXES = ["x", "y"] as const;
const ZOOM_TYPES = ["in", "out"] as const;
const EFFECTS = ["slide", "flip", "zoom", "fade", "blur"] as const;
type SlideDirection = (typeof SLIDE_DIRECTIONS)[number];
type FlipAxis = (typeof FLIP_AXES)[number];
type ZoomType = (typeof ZOOM_TYPES)[number];
type Effect = (typeof EFFECTS)[number];

const IntroSlider: React.FC<IntroSliderProps> = ({ teams, onFinish }) => {
  // You can add more slides here!
  const slides = [
    <AllRooms key="rooms" teams={teams} />,
    <AllEmployees key="employees" teams={teams} />,
  ];
  const [step, setStep] = useState(0);
  const [prevStep, setPrevStep] = useState(0);
  const [effect, setEffect] = useState<Effect>("slide");
  const [slideDirection, setSlideDirection] = useState<SlideDirection>("up");
  const [flipAxis, setFlipAxis] = useState<FlipAxis>("y");
  const [zoomType, setZoomType] = useState<ZoomType>("in");
  const [parallax, setParallax] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevStep(step);
      // Randomly pick an effect
      const randomEffect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
      setEffect(randomEffect);
      // If slide, pick a direction
      if (randomEffect === "slide") {
        setSlideDirection(
          SLIDE_DIRECTIONS[Math.floor(Math.random() * SLIDE_DIRECTIONS.length)]
        );
      }
      // If flip, pick axis
      if (randomEffect === "flip") {
        setFlipAxis(FLIP_AXES[Math.floor(Math.random() * FLIP_AXES.length)]);
      }
      // If zoom, pick in/out
      if (randomEffect === "zoom") {
        setZoomType(ZOOM_TYPES[Math.floor(Math.random() * ZOOM_TYPES.length)]);
      }
      // Parallax: move background position
      setParallax((p) => (p + 1) % 4);
      setStep((prev) => (prev + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [step, slides.length]);

  // Parallax background positions
  const bgPositions = ["0% 0%", "100% 0%", "100% 100%", "0% 100%"];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #e0e7ff 0%, #f0abfc 100%)",
        backgroundPosition: bgPositions[parallax],
        backgroundSize: "200% 200%",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        overflow: "hidden",
        backdropFilter: "blur(12px)",
        transition: `background-position ${ANIMATION_DURATION}s cubic-bezier(.4,0,.2,1)`,
      }}
    >
      {/* Modern slide and animated button styles */}
      <style>{`
        @keyframes float-glow {
          0% { transform: translateY(0); box-shadow: 0 2px 8px rgba(102,126,234,0.12), 0 0 0 0 #a5b4fc; }
          50% { transform: translateY(-8px); box-shadow: 0 8px 24px rgba(102,126,234,0.18), 0 0 16px 4px #a5b4fc44; }
          100% { transform: translateY(0); box-shadow: 0 2px 8px rgba(102,126,234,0.12), 0 0 0 0 #a5b4fc; }
        }
        .modern-animated-btn {
          animation: float-glow 2.4s ease-in-out infinite;
          backdrop-filter: blur(8px);
          background: linear-gradient(90deg, #667eeaee 0%, #764ba2ee 100%);
          background-blend-mode: overlay;
        }
        .modern-animated-btn:hover {
          filter: brightness(1.08);
        }
        .slide-anim {
          position: absolute;
          top: 0; left: 0; width: 100vw; height: 100vh;
          transition: transform ${ANIMATION_DURATION}s cubic-bezier(.4,0,.2,1), opacity ${ANIMATION_DURATION}s cubic-bezier(.4,0,.2,1), filter ${ANIMATION_DURATION}s cubic-bezier(.4,0,.2,1);
          will-change: transform, opacity, filter;
          box-shadow: 0 8px 32px 0 rgba(76,0,128,0.10), 0 1.5px 8px 0 rgba(102,126,234,0.10);
          border-radius: 18px;
          overflow: hidden;
          background: white;
        }
        /* Slide directions */
        .slide-in-up { transform: translateY(0); opacity: 1; z-index: 2; }
        .slide-out-up { transform: translateY(-100vh); opacity: 0; z-index: 1; }
        .slide-in-down { transform: translateY(0); opacity: 1; z-index: 2; }
        .slide-out-down { transform: translateY(100vh); opacity: 0; z-index: 1; }
        .slide-in-left { transform: translateX(0); opacity: 1; z-index: 2; }
        .slide-out-left { transform: translateX(-100vw); opacity: 0; z-index: 1; }
        .slide-in-right { transform: translateX(0); opacity: 1; z-index: 2; }
        .slide-out-right { transform: translateX(100vw); opacity: 0; z-index: 1; }
        /* Flip */
        .flip-in-x { transform: rotateX(0deg); opacity: 1; z-index: 2; }
        .flip-out-x { transform: rotateX(90deg); opacity: 0; z-index: 1; }
        .flip-in-y { transform: rotateY(0deg); opacity: 1; z-index: 2; }
        .flip-out-y { transform: rotateY(90deg); opacity: 0; z-index: 1; }
        /* Zoom */
        .zoom-in-in { transform: scale(1); opacity: 1; z-index: 2; }
        .zoom-in-out { transform: scale(1.2); opacity: 0; z-index: 1; }
        .zoom-out-in { transform: scale(1); opacity: 1; z-index: 2; }
        .zoom-out-out { transform: scale(0.8); opacity: 0; z-index: 1; }
        /* Fade */
        .fade-in { opacity: 1; z-index: 2; }
        .fade-out { opacity: 0; z-index: 1; }
        /* Blur */
        .blur-in { filter: blur(0px); opacity: 1; z-index: 2; }
        .blur-out { filter: blur(12px); opacity: 0; z-index: 1; }
      `}</style>
      {/* Slide animation overlays */}
      {slides.map((slide, idx) => {
        let className = "slide-anim ";
        if (step === idx) {
          if (effect === "slide") className += `slide-in-${slideDirection}`;
          else if (effect === "flip") className += `flip-in-${flipAxis}`;
          else if (effect === "zoom") className += `zoom-${zoomType}-in`;
          else if (effect === "fade") className += "fade-in";
          else if (effect === "blur") className += "blur-in";
        } else if (prevStep === idx) {
          if (effect === "slide") className += `slide-out-${slideDirection}`;
          else if (effect === "flip") className += `flip-out-${flipAxis}`;
          else if (effect === "zoom") className += `zoom-${zoomType}-out`;
          else if (effect === "fade") className += "fade-out";
          else if (effect === "blur") className += "blur-out";
        } else {
          className += "";
        }
        return (
          <div
            key={idx}
            className={className}
            style={{ pointerEvents: step === idx ? "auto" : "none" }}
          >
            {slide}
          </div>
        );
      })}
      {/* Always show the button in the bottom-right */}
      <button
        className="modern-animated-btn"
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          transform: "none",
          padding: "10px 20px",
          fontSize: 15,
          fontWeight: 600,
          borderRadius: 20,
          border: "none",
          color: "#fff",
          cursor: "pointer",
          letterSpacing: 1,
          transition: "transform 0.2s, box-shadow 0.2s, background 0.2s",
          zIndex: 10000,
        }}
        onClick={onFinish}
      >
        Go to App
      </button>
    </div>
  );
};

export default IntroSlider;
