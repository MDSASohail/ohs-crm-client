// Reusable card container — wraps sections of content on pages
const Card = ({ children, className = "", padding = true }) => {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-border
        ${padding ? "p-6" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Card header with title and optional right-side action
Card.Header = ({ title, subtitle = "", action = null }) => {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-text-main">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
};

export default Card;