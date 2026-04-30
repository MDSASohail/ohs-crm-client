import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/roles";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  CreditCard,
  Bell,
  BarChart2,
  Settings,
  ScrollText,
  ShieldCheck,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: [ROLES.ROOT, ROLES.ADMIN, ROLES.STAFF, ROLES.VIEWER],
  },
  {
    label: "Candidates",
    path: "/candidates",
    icon: Users,
    allowedRoles: [ROLES.ROOT, ROLES.ADMIN, ROLES.STAFF, ROLES.VIEWER],
  },
  {
    label: "Enrollments",
    path: "/enrollments",
    icon: GraduationCap,
    allowedRoles: [ROLES.ROOT, ROLES.ADMIN, ROLES.STAFF, ROLES.VIEWER],
  },
  {
    label: "Payments",
    path: "/payments",
    icon: CreditCard,
    allowedRoles: [ROLES.ROOT, ROLES.ADMIN, ROLES.STAFF, ROLES.VIEWER],
  },
  {
    label: "Institutes",
    path: "/institutes",
    icon: Building2,
    allowedRoles: [ROLES.ROOT, ROLES.ADMIN],
  },
  {
    label: "Courses",
    path: "/courses",
    icon: BookOpen,
    allowedRoles: [ROLES.ROOT, ROLES.ADMIN],
  },
  {
    label: "Reminders",
    path: "/reminders",
    icon: Bell,
    allowedRoles: [ROLES.ROOT, ROLES.ADMIN, ROLES.STAFF, ROLES.VIEWER],
  },
  {
    label: "Reports",
    path: "/reports",
    icon: BarChart2,
    allowedRoles: [ROLES.ROOT, ROLES.ADMIN],
  },
  {
    label: "Activity Log",
    path: "/activity",
    icon: ScrollText,
    allowedRoles: [ROLES.ROOT, ROLES.ADMIN],
  },
  {
  label: "Settings",
  path: "/settings",
  icon: Settings,
  allowedRoles: [ROLES.ROOT, ROLES.ADMIN, ROLES.STAFF, ROLES.VIEWER],
},
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(user?.role)
  );

  return (
    <>
      {/* ── Mobile overlay backdrop ────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ─────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-primary z-40 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:w-16 lg:w-64`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-3 py-5 border-b border-white/10 lg:px-6">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          {/* Label hidden on tablet, visible on desktop */}
          <div className="hidden lg:block min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">
              OHS CRM
            </p>
            <p className="text-white/50 text-xs leading-tight truncate">
              Workspace
            </p>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="ml-auto lg:hidden text-white/60 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto lg:px-3">
          <ul className="space-y-0.5">
            {visibleItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  title={item.label}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors md:justify-center lg:justify-start ${isActive
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {/* Label hidden on tablet, visible on desktop and mobile */}
                  <span className="lg:block md:hidden">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info at bottom */}
        <div className="px-2 py-4 border-t border-white/10 lg:px-4">
          <div className="flex items-center gap-3 md:justify-center lg:justify-start">
            <div className="h-8 w-8 rounded-full bg-accent/30 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="hidden lg:block min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {user?.name || "User"}
              </p>
              <p className="text-white/50 text-xs capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;