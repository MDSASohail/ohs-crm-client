// Reusable input field with label, error, and helper text support
const Input = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  error = "",
  helperText = "",
  disabled = false,
  required = false,
  icon: Icon = null,
}) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={name}
          className="text-xs font-medium text-muted uppercase tracking-wide"
        >
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-muted" />
          </div>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full
            ${Icon ? "pl-9" : "px-3"}
            py-2
            text-sm
            text-text-main
            bg-white
            border rounded-lg
            transition-colors
            placeholder:text-muted
            focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
            disabled:bg-neutral disabled:cursor-not-allowed disabled:opacity-60
            ${error ? "border-danger focus:ring-danger" : "border-border"}
          `}
        />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-muted">{helperText}</p>
      )}
    </div>
  );
};

export default Input;