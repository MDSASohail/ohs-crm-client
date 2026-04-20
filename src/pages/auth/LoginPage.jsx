import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { loginThunk } from "../../features/auth/authSlice";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { usePageTitle } from "../../hooks/usePageTitle";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useAuth();
  usePageTitle("Sign In");

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Enter a valid email address.";
    if (!formData.password) errors.password = "Password is required.";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    dispatch(loginThunk(formData));
  };

  return (
    <main className="min-h-screen bg-neutral flex items-center justify-center p-4">
      <section className="w-full max-w-md">
        {/* Brand */}
        <header className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-text-main">OHS CRM</h1>
          <p className="text-sm text-muted mt-1">
            Sign in to your workspace
          </p>
        </header>

        {/* Card */}
        <article className="bg-white rounded-2xl shadow-sm border border-border p-8">
          <h2 className="text-lg font-semibold text-text-main mb-6">
            Welcome back
          </h2>

          {/* Server error */}
          {error && (
            <div
              role="alert"
              className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-danger"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <fieldset className="space-y-4" disabled={isLoading}>
              <legend className="sr-only">Login credentials</legend>

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                icon={Mail}
                error={formErrors.email}
                required
              />

              {/* Password field with show/hide toggle */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-muted uppercase tracking-wide"
                >
                  Password <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-muted" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`
                      w-full pl-9 pr-10 py-2 text-sm text-text-main bg-white
                      border rounded-lg transition-colors placeholder:text-muted
                      focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                      disabled:bg-neutral disabled:cursor-not-allowed disabled:opacity-60
                      ${formErrors.password ? "border-danger focus:ring-danger" : "border-border"}
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-text-main transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-xs text-danger">{formErrors.password}</p>
                )}
              </div>
            </fieldset>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
              className="mt-12"
            >
              Sign In
            </Button>
          </form>
        </article>

        <footer className="text-center mt-6">
          <p className="text-xs text-muted">
            OHS CRM &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </section>
    </main>
  );
};

export default LoginPage;