// Reusable loading spinner — use whenever data is being fetched
const Spinner = ({ size = "md", color = "accent" }) => {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-4",
  };

  const colors = {
    accent: "border-accent",
    white: "border-white",
    primary: "border-primary",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`
          ${sizes[size]}
          ${colors[color]}
          rounded-full
          border-t-transparent
          animate-spin
        `}
      />
    </div>
  );
};

export default Spinner;