import { useEffect, useState } from "react";

const AnimatedCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hidden, setHidden] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);

  useEffect(() => {
    const addEventListeners = () => {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseenter", onMouseEnter);
      document.addEventListener("mouseleave", onMouseLeave);
      document.addEventListener("mousedown", onMouseDown);
      document.addEventListener("mouseup", onMouseUp);
    };

    const removeEventListeners = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      updateCursorHover(e.target);
    };

    const onMouseLeave = () => {
      setHidden(true);
    };

    const onMouseEnter = () => {
      setHidden(false);
    };

    const onMouseDown = () => {
      setClicked(true);
    };

    const onMouseUp = () => {
      setClicked(false);
    };

    const updateCursorHover = (target) => {
      const isLink = target.closest("a, button, [role='button']");
      setLinkHovered(!!isLink);
    };

    addEventListeners();
    return () => removeEventListeners();
  }, []);

  const cursorClasses = [
    "cursor-dot",
    hidden && "cursor-hidden",
    clicked && "cursor-clicked",
    linkHovered && "cursor-link-hovered"
  ].filter(Boolean).join(" ");

  const cursorOuterClasses = [
    "cursor-dot-outline",
    hidden && "cursor-hidden",
    clicked && "cursor-clicked",
    linkHovered && "cursor-link-hovered"
  ].filter(Boolean).join(" ");

  return (
    <>
      <div
        className={cursorClasses}
        style={{
          left: position.x,
          top: position.y,
          transition: hidden ? "none" : "transform .15s cubic-bezier(.4,0,.2,1)"
        }}
      />
      <div
        className={cursorOuterClasses}
        style={{
          left: position.x,
          top: position.y,
          transition: hidden ? "none" : "transform .15s cubic-bezier(.4,0,.2,1)"
        }}
      />
      <style>
        {`
          .cursor-dot,
          .cursor-dot-outline {
            pointer-events: none;
            position: fixed;
            z-index: 9999;
            border-radius: 50%;
            opacity: 1;
            transform: translate(-50%, -50%);
          }
          
          .cursor-dot {
            width: 8px;
            height: 8px;
            background: var(--accent-primary);
          }
          
          .cursor-dot-outline {
            width: 40px;
            height: 40px;
            background: rgba(var(--accent-primary-rgb), 0.1);
            transition: transform .15s cubic-bezier(.4,0,.2,1);
          }
          
          .cursor-hidden {
            opacity: 0;
          }
          
          .cursor-clicked {
            transform: translate(-50%, -50%) scale(0.8);
          }
          
          .cursor-link-hovered {
            transform: translate(-50%, -50%) scale(1.2);
          }
          
          .cursor-dot.cursor-link-hovered {
            background: var(--accent-hover);
          }
          
          .cursor-dot-outline.cursor-link-hovered {
            background: rgba(var(--accent-hover-rgb), 0.2);
          }
          
          @media (hover: none) {
            .cursor-dot,
            .cursor-dot-outline {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
};

export default AnimatedCursor;