import { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronDown, User, Menu } from "lucide-react";
import { logoutThunk } from "../../features/auth/authSlice";
import { useAuth } from "../../hooks/useAuth";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const Topbar = ({ title = "", onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useOutsideClick(dropdownRef, () => setDropdownOpen(false));

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate("/login");
  };

  return (
    <header
      className="fixed top-0 right-0 left-0 md:left-16 lg:left-64 h-16 bg-white border-b border-border z-20 flex items-center justify-between px-4 lg:px-6 transition-all duration-300"
    >
      {/* Left — hamburger on mobile + page title */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-muted hover:bg-neutral hover:text-text-main transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-text-main lg:text-lg">
          {title}
        </h1>
      </div>

      {/* Right — user dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral transition-colors lg:px-3"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-semibold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <span className="hidden sm:block text-sm font-medium text-text-main">
            {user?.name}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted" />
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-border py-1 z-50"
          >
            {/* User info */}
            <div className="px-4 py-2.5 border-b border-border">
              <p className="text-sm font-medium text-text-main truncate">
                {user?.name}
              </p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </div>

            {/* Profile */}
            <button
              role="menuitem"
              onClick={() => {
                navigate("/settings/profile");
                setDropdownOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-text-main hover:bg-neutral transition-colors"
            >
              <User className="h-4 w-4 text-muted" />
              Profile
            </button>

            {/* Logout */}
            <button
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;