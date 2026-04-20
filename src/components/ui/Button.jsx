import Spinner from "./Spinner";

// Reusable button — covers all variants used across the app
const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon = null,
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-accent text-white hover:bg-accent/90 focus:ring-accent",
    secondary:
      "bg-white text-text-main border border-border hover:bg-neutral focus:ring-accent",
    danger: "bg-danger text-white hover:bg-danger/90 focus:ring-danger",
    ghost: "bg-transparent text-accent hover:bg-accent/10 focus:ring-accent",
    dark: "bg-primary text-white hover:bg-primary/90 focus:ring-primary",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${base}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
      `}
    >
      {loading ? (
        <Spinner size="sm" color={variant === "secondary" ? "accent" : "white"} />
      ) : (
        Icon && <Icon className="h-4 w-4" />
      )}
      {children}
    </button>
  );
};

export default Button;