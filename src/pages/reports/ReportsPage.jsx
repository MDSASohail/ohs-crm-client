import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  BarChart2,
  Download,
  Filter,
  X,
  RefreshCw,
  TrendingUp,
  Building2,
  CreditCard,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import { formatDate, formatMonthYear } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  ENROLLMENT_STATUS_LABELS,
} from "../../constants/statuses";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/roles";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import { EnrollmentStatusBadge, PaymentStatusBadge } from "../../components/ui/StatusBadge";
import api from "../../config/axios";

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { key: "enrollments", label: "Enrollments", icon: GraduationCap },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "institutes", label: "Institutes", icon: Building2 },
];

const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" },
  { value: 3, label: "March" }, { value: 4, label: "April" },
  { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" },
  { value: 9, label: "September" }, { value: 10, label: "October" },
  { value: 11, label: "November" }, { value: 12, label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

const selectClass =
  "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white text-text-main";

// ── Summary stat ──────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color = "text-text-main" }) => (
  <div className="bg-neutral rounded-xl p-4 flex flex-col gap-1">
    <p className="text-xs font-medium text-muted uppercase tracking-wide">
      {label}
    </p>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
  </div>
);

const ReportsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canExport = [ROLES.ROOT, ROLES.ADMIN].includes(user?.role);
  usePageTitle("Reports");

  const [activeTab, setActiveTab] = useState("enrollments");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);

  // Data states
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [instituteData, setInstituteData] = useState(null);

  // Dropdown data
  const [courses, setCourses] = useState([]);
  const [institutes, setInstitutes] = useState([]);

  // Shared filters
  const [filters, setFilters] = useState({
    courseId: "",
    instituteId: "",
    status: "",
    result: "",
    month: "",
    year: "",
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Load dropdown data once
  useEffect(() => {
    api.get("/courses").then((res) =>
      setCourses(res.data.data.filter((c) => c.isActive && !c.isDeleted))
    ).catch(() => {});
    api.get("/institutes").then((res) =>
      setInstitutes(res.data.data.filter((i) => i.isActive && !i.isDeleted))
    ).catch(() => {});
  }, []);

  const buildParams = useCallback(() => {
    const params = { page, limit: 50 };
    if (filters.courseId) params.courseId = filters.courseId;
    if (filters.instituteId) params.instituteId = filters.instituteId;
    if (filters.status) params.status = filters.status;
    if (filters.result) params.result = filters.result;
    if (filters.month) params.month = filters.month;
    if (filters.year) params.year = filters.year;
    return params;
  }, [filters, page]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "enrollments") {
        const res = await api.get("/reports/enrollments", {
          params: buildParams(),
        });
        setEnrollmentData(res.data.data);
      } else if (activeTab === "payments") {
        const res = await api.get("/reports/payments", {
          params: buildParams(),
        });
        setPaymentData(res.data.data);
      } else if (activeTab === "institutes") {
        const res = await api.get("/reports/institutes");
        setInstituteData(res.data.data);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [activeTab, buildParams]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Reset page when filters or tab change
  useEffect(() => {
    setPage(1);
  }, [filters, activeTab]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      courseId: "", instituteId: "", status: "",
      result: "", month: "", year: "",
    });
  };

  // ── Excel export ────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = buildParams();
      const endpoint =
        activeTab === "enrollments"
          ? "/reports/enrollments/export"
          : "/reports/payments/export";

      // Fetch file as blob
      const res = await api.get(endpoint, {
        params,
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${activeTab}-report-${Date.now()}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageWrapper title="Reports">
      <section aria-label="Reports">

        {/* ── Page header ───────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-main">Reports</h2>
            <p className="text-sm text-muted mt-0.5">
              View and export data reports for your workspace.
            </p>
          </div>
          {canExport && activeTab !== "institutes" && (
            <Button
              variant="secondary"
              icon={Download}
              onClick={handleExport}
              loading={exporting}
            >
              Export Excel
            </Button>
          )}
        </header>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <nav className="flex gap-1 mb-6 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? "text-accent border-b-2 border-accent bg-white"
                  : "text-muted hover:text-text-main hover:bg-neutral"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── Filters — not shown for institutes tab ────────────────── */}
        {activeTab !== "institutes" && (
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
                  onClick={loadReport}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted border border-border rounded-lg hover:bg-neutral transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted uppercase tracking-wide">
                    Course
                  </label>
                  <select
                    name="courseId"
                    value={filters.courseId}
                    onChange={handleFilterChange}
                    className={selectClass}
                  >
                    <option value="">All Courses</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.shortCode} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted uppercase tracking-wide">
                    Institute
                  </label>
                  <select
                    name="instituteId"
                    value={filters.instituteId}
                    onChange={handleFilterChange}
                    className={selectClass}
                  >
                    <option value="">All Institutes</option>
                    {institutes.map((i) => (
                      <option key={i._id} value={i._id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
                {activeTab === "enrollments" && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted uppercase tracking-wide">
                        Status
                      </label>
                      <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className={selectClass}
                      >
                        <option value="">All Statuses</option>
                        {Object.entries(ENROLLMENT_STATUS_LABELS).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted uppercase tracking-wide">
                        Result
                      </label>
                      <select
                        name="result"
                        value={filters.result}
                        onChange={handleFilterChange}
                        className={selectClass}
                      >
                        <option value="">All Results</option>
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted uppercase tracking-wide">
                    Month
                  </label>
                  <select
                    name="month"
                    value={filters.month}
                    onChange={handleFilterChange}
                    className={selectClass}
                  >
                    <option value="">All Months</option>
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted uppercase tracking-wide">
                    Year
                  </label>
                  <select
                    name="year"
                    value={filters.year}
                    onChange={handleFilterChange}
                    className={selectClass}
                  >
                    <option value="">All Years</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ── Loading ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-32">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* ════════════════════════════════════════════════════════
                ENROLLMENTS TAB
            ════════════════════════════════════════════════════════ */}
            {activeTab === "enrollments" && enrollmentData && (
              <div>
                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
                  <StatCard
                    label="Total Enrollments"
                    value={enrollmentData.summary.totalEnrollments}
                  />
                  <StatCard
                    label="Passed"
                    value={enrollmentData.summary.passed}
                    color="text-success"
                  />
                  <StatCard
                    label="Failed"
                    value={enrollmentData.summary.failed}
                    color="text-danger"
                  />
                  <StatCard
                    label="Certificates Sent"
                    value={enrollmentData.summary.certificatesSent}
                    color="text-accent"
                  />
                </div>

                {/* Table */}
                <Card padding={false}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral border-b border-border">
                        <tr>
                          {[
                            "Candidate",
                            "Course",
                            "Institute",
                            "Batch",
                            "Status",
                            "Result",
                            "Certificate",
                            "Remarks",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wide whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-white">
                        {enrollmentData.enrollments.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-4 py-12 text-center text-sm text-muted"
                            >
                              No enrollments found for the selected filters.
                            </td>
                          </tr>
                        ) : (
                          enrollmentData.enrollments.map((e) => (
                            <tr
                              key={e._id}
                              className="hover:bg-neutral/40 transition-colors cursor-pointer"
                              onClick={() =>
                                navigate(`/enrollments/${e._id}`)
                              }
                            >
                              <td className="px-4 py-3">
                                <p className="font-medium text-text-main">
                                  {e.candidateId?.fullName}
                                </p>
                                <p className="text-xs text-muted">
                                  {e.candidateId?.mobile}
                                </p>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                                  {e.courseId?.shortCode}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-text-main whitespace-nowrap">
                                {e.instituteId?.name || "—"}
                              </td>
                              <td className="px-4 py-3 text-text-main whitespace-nowrap">
                                {formatMonthYear(
                                  e.enrollmentMonth,
                                  e.enrollmentYear
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <EnrollmentStatusBadge status={e.status} />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {e.result ? (
                                  <span
                                    className={`text-sm font-semibold ${
                                      e.result === "pass"
                                        ? "text-success"
                                        : e.result === "fail"
                                        ? "text-danger"
                                        : "text-warning"
                                    }`}
                                  >
                                    {e.result.charAt(0).toUpperCase() +
                                      e.result.slice(1)}
                                  </span>
                                ) : (
                                  <span className="text-muted text-xs">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {e.certificateSent ? (
                                  <span className="text-success text-xs font-medium">
                                    ✓ Sent
                                  </span>
                                ) : (
                                  <span className="text-muted text-xs">
                                    Not sent
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 max-w-[200px]">
                                <p className="text-xs text-muted truncate">
                                  {e.remarks || "—"}
                                </p>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {enrollmentData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                      <p className="text-sm text-muted">
                        Page {enrollmentData.pagination.page} of{" "}
                        {enrollmentData.pagination.totalPages} —{" "}
                        {enrollmentData.pagination.total} total
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={enrollmentData.pagination.page === 1}
                          className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-neutral disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setPage((p) =>
                              Math.min(
                                enrollmentData.pagination.totalPages,
                                p + 1
                              )
                            )
                          }
                          disabled={
                            enrollmentData.pagination.page ===
                            enrollmentData.pagination.totalPages
                          }
                          className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-neutral disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                PAYMENTS TAB
            ════════════════════════════════════════════════════════ */}
            {activeTab === "payments" && paymentData && (
              <div>
                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
                  <StatCard
                    label="Total Fee"
                    value={formatCurrency(paymentData.totals.totalFeeCharged)}
                  />
                  <StatCard
                    label="Total Paid"
                    value={formatCurrency(paymentData.totals.totalPaid)}
                    color="text-success"
                  />
                  <StatCard
                    label="Outstanding"
                    value={formatCurrency(paymentData.totals.totalOutstanding)}
                    color="text-danger"
                  />
                  <StatCard
                    label="Total Expenses"
                    value={formatCurrency(paymentData.totals.totalExpenses)}
                    color="text-warning"
                  />
                </div>

                {/* Table */}
                <Card padding={false}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral border-b border-border">
                        <tr>
                          {[
                            "Candidate",
                            "Course",
                            "Institute",
                            "Total Fee",
                            "Paid",
                            "Balance",
                            "Expenses",
                            "Status",
                            "Deadline",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wide whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-white">
                        {paymentData.payments.length === 0 ? (
                          <tr>
                            <td
                              colSpan={9}
                              className="px-4 py-12 text-center text-sm text-muted"
                            >
                              No payment records found.
                            </td>
                          </tr>
                        ) : (
                          paymentData.payments.map((p) => (
                            <tr
                              key={p._id}
                              className="hover:bg-neutral/40 transition-colors cursor-pointer"
                              onClick={() =>
                                navigate(
                                  `/payments?enrollmentId=${p.enrollmentId?._id}`
                                )
                              }
                            >
                              <td className="px-4 py-3">
                                <p className="font-medium text-text-main">
                                  {p.candidateId?.fullName}
                                </p>
                                <p className="text-xs text-muted">
                                  {p.candidateId?.mobile}
                                </p>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                                  {p.enrollmentId?.courseId?.shortCode}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-text-main">
                                {p.enrollmentId?.instituteId?.name || "—"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap font-medium text-text-main">
                                {formatCurrency(p.totalFeeCharged)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap font-medium text-success">
                                {formatCurrency(p.totalPaid)}
                              </td>
                              <td
                                className={`px-4 py-3 whitespace-nowrap font-medium ${
                                  p.remainingBalance > 0
                                    ? "text-danger"
                                    : "text-success"
                                }`}
                              >
                                {formatCurrency(
                                  Math.max(0, p.remainingBalance)
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-warning font-medium">
                                {formatCurrency(p.totalExpenses)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <PaymentStatusBadge
                                  status={p.paymentStatus}
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-muted">
                                {formatDate(p.paymentDeadline)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {paymentData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                      <p className="text-sm text-muted">
                        Page {paymentData.pagination.page} of{" "}
                        {paymentData.pagination.totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={paymentData.pagination.page === 1}
                          className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-neutral disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setPage((p) =>
                              Math.min(
                                paymentData.pagination.totalPages,
                                p + 1
                              )
                            )
                          }
                          disabled={
                            paymentData.pagination.page ===
                            paymentData.pagination.totalPages
                          }
                          className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-neutral disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                INSTITUTES TAB
            ════════════════════════════════════════════════════════ */}
            {activeTab === "institutes" && instituteData && (
              <div>
                {instituteData.institutes.length === 0 ? (
                  <Card>
                    <div className="flex justify-center py-12">
                      <p className="text-sm text-muted italic">
                        No institute data available.
                      </p>
                    </div>
                  </Card>
                ) : (
                  <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {instituteData.institutes.map((inst) => (
                      <li key={inst.instituteId}>
                        <article
                          className="bg-white rounded-xl border border-border p-5 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() =>
                            navigate(`/institutes/${inst.instituteId}`)
                          }
                        >
                          <header className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-semibold text-text-main">
                              {inst.instituteName}
                            </h3>
                            <ChevronRight className="h-4 w-4 text-muted shrink-0 mt-0.5" />
                          </header>

                          {/* Stats grid */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-neutral rounded-lg p-3 text-center">
                              <p className="text-lg font-bold text-text-main">
                                {inst.totalEnrollments}
                              </p>
                              <p className="text-xs text-muted mt-0.5">
                                Enrollments
                              </p>
                            </div>
                            <div className="bg-neutral rounded-lg p-3 text-center">
                              <p className="text-lg font-bold text-success">
                                {inst.passed}
                              </p>
                              <p className="text-xs text-muted mt-0.5">
                                Passed
                              </p>
                            </div>
                            <div className="bg-neutral rounded-lg p-3 text-center">
                              <p className="text-lg font-bold text-danger">
                                {inst.failed}
                              </p>
                              <p className="text-xs text-muted mt-0.5">
                                Failed
                              </p>
                            </div>
                          </div>

                          {/* Pass rate bar */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-muted">
                                Pass Rate
                              </span>
                              <span className="text-sm font-semibold text-text-main">
                                {inst.passRate !== null
                                  ? `${inst.passRate}%`
                                  : "No results yet"}
                              </span>
                            </div>
                            {inst.passRate !== null && (
                              <div className="h-2 bg-neutral rounded-full overflow-hidden flex">
                                <div
                                  className="h-full bg-success"
                                  style={{ width: `${inst.passRate}%` }}
                                />
                                <div
                                  className="h-full bg-danger"
                                  style={{
                                    width: `${100 - inst.passRate}%`,
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Courses offered */}
                          {inst.coursesOffered?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {inst.coursesOffered.map((co) => (
                                <span
                                  key={co._id}
                                  className="text-xs font-medium bg-accent/10 text-accent px-2 py-0.5 rounded-full"
                                >
                                  {co.courseId?.shortCode}
                                  {co.fee
                                    ? ` · ${formatCurrency(co.fee)}`
                                    : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </article>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </PageWrapper>
  );
};

export default ReportsPage;