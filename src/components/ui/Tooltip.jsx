import { useState } from "react";

// Simple tooltip — shows on hover above the wrapped element
const Tooltip = ({ text, children, position = "top" }) => {
  const [visible, setVisible] = useState(false);

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`
            absolute z-50 ${positions[position]}
            px-2.5 py-1.5
            bg-primary text-white
            text-xs font-medium rounded-lg
            whitespace-nowrap shadow-lg
            pointer-events-none
          `}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;