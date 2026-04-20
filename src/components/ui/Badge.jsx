// Reusable badge/pill component for statuses, roles, labels
const Badge = ({ label, colorClass, dot = false }) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-0.5
        rounded-full
        text-xs font-medium
        ${colorClass}
      `}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      )}
      {label}
    </span>
  );
};

export default Badge;