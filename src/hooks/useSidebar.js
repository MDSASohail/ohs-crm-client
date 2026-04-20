import { useState, useEffect } from "react";

// Manages sidebar open/close state across screen sizes
export const useSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when screen grows to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return { isOpen, open, close, toggle };
};