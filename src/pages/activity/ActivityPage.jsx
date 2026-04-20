import { useEffect, useState, useCallback } from "react";
import { ScrollText, Filter, X, RefreshCw, User } from "lucide-react";
import { formatDateTime } from "../../utils/formatDate";
import { useAuth } from "../../hooks/useAuth";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Badge from "../../components/ui/Badge";
import api from "../../config/axios";
import { usePageTitle } from "../../hooks/usePageTitle";


// ── Action color map ──────────────────────────────────────────────────────────
const getActionColor = (action) => {
  if (!action) return "bg-gray-100 text-gray-600";
  if (action.startsWith("CREATE")) return "bg-green-100 text-green-700";
  if (action.startsWith("UPDATE") || action.startsWith("EDIT"))
    return "bg-blue-100 text-blue-700";
  if (
    action.startsWith("DELETE") ||
    action.startsWith("DEACTIVATE") ||
    action.includes("FAILED")
  )
    return "bg-red-100 text-danger";
  if (action.startsWith("ACTIVATE") || action.includes("DONE"))
    return "bg-green-100 text-success";
  if (action === "LOGIN" || action === "LOGOUT")
    return "bg-purple-100 text-purple-700";
  if (action.includes("SEND") || action.includes("REMINDER"))
    return "bg-yellow-100 text-yellow-700";
  if (action.includes("CHECKLIST") || action.includes("STEP"))
    return "bg-indigo-100 text-indigo-700";
  return "bg-gray-100 text-gray-600";
};

// ── Entity type color map ─────────────────────────────────────────────────────
const getEntityColor = (entityType) => {
  const map = {
    candidate: "bg-blue-50 text-blue-700",
    enrollment: "bg-purple-50 text-purple-700",
    payment: "bg-green-50 text-success",
    document: "bg-orange-50 text-orange-700",
    reminder: "bg-yellow-50 text-yellow-700",
    institute: "bg-indigo-50 text-indigo-700",
    course: "bg-pink-50 text-pink-700",
    user: "bg-gray-100 text-gray-700",
    checklist: "bg-teal-50 text-teal-700",
  };
  return map[entityType] || "bg-gray-100 text-gray-600";
};

// ── Format action label ───────────────────────────────────────────────────────
const formatAction = (action) => {
  if (!action) return "—";
  return action
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
};

const ENTITY_TYPES = [
  "candidate",
  "enrollment",
  "payment",
  "document",
  "reminder",
  "institute",
  "course",
  "user",
  "checklist",
];

const selectClass =
  "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white text-text-main";

const ActivityPage = () => {
  const { user } = useAuth();
  usePageTitle("Activity Log");

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    entityType: "",
    action: "",
    from: "",
    to: "",
  });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.action) params.action = filters.action;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const res = await api.get("/activity-logs", { params });
      setLogs(res.data.data.logs);
      setPagination(res.data.data.pagination);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ entityType: "", action: "", from: "", to: "" });
    setPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <PageWrapper title="Activity Log">
      <section aria-label="Activity log">

        {/* ── Page header ───────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-main">
              Activity Log
            </h2>
            <p className="text-sm text-muted mt-0.5">
              {pagination.total} action
              {pagination.total !== 1 ? "s" : ""} recorded in your workspace
            </p>
          </div>
        </header>

        {/* ── Filters ───────────────────────────────────────────────── */}
        <Card className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setShowFilters((p) => !p)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-neutral transition-colors"
            >
              <Filter className="h-4 w-4 text-muted" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="h-5 w-5 rounded-full bg-accent text-white text-xs flex items-center justify-center font-medium">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-danger border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
              <button
                onClick={loadLogs}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted border border-border rounded-lg hover:bg-neutral transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Entity type */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  Entity Type
                </label>
                <select
                  name="entityType"
                  value={filters.entityType}
                  onChange={handleFilterChange}
                  className={selectClass}
                >
                  <option value="">All Types</option>
                  {ENTITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action keyword */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  Action Contains
                </label>
                <input
                  type="text"
                  name="action"
                  value={filters.action}
                  onChange={handleFilterChange}
                  placeholder="e.g. CREATE, DELETE, LOGIN"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted"
                />
              </div>

              {/* Date from */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  From Date
                </label>
                <input
                  type="date"
                  name="from"
                  value={filters.from}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Date to */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  To Date
                </label>
                <input
                  type="date"
                  name="to"
                  value={filters.to}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          )}
        </Card>

        {/* ── Logs list ─────────────────────────────────────────────── */}
        <Card padding={false}>
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="md" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ScrollText className="h-8 w-8 text-muted" />
              <p className="text-sm text-muted italic">
                No activity logs found.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {logs.map((log) => (
                <li
                  key={log._id}
                  className="flex items-start gap-4 px-4 py-3 hover:bg-neutral/40 transition-colors"
                >
                  {/* User avatar */}
                  <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-accent text-xs font-semibold">
                      {log.userId?.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Action badge */}
                      <Badge
                        label={formatAction(log.action)}
                        colorClass={getActionColor(log.action)}
                      />
                      {/* Entity type badge */}
                      {log.entityType && (
                        <Badge
                          label={
                            log.entityType.charAt(0).toUpperCase() +
                            log.entityType.slice(1)
                          }
                          colorClass={getEntityColor(log.entityType)}
                        />
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-text-main leading-relaxed line-clamp-2">
                      {log.description}
                    </p>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <User className="h-3 w-3" />
                        {log.userId?.name || "Unknown"}
                        {log.userId?.role && (
                          <span className="text-muted/60">
                            ({log.userId.role})
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted">
                Page {pagination.page} of {pagination.totalPages} —{" "}
                {pagination.total} total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-neutral disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.min(pagination.totalPages, p + 1)
                    )
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-neutral disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
      </section>
    </PageWrapper>
  );
};

export default ActivityPage;