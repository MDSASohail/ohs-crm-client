import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  PlusCircle,
  Eye,
  Trash2,
  RefreshCw,
  Filter,
  X,
} from "lucide-react";
import { fetchEnrollments, removeEnrollment } from "../../features/enrollments/enrollmentsSlice";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/roles";
import { formatDate, formatMonthYear } from "../../utils/formatDate";
import {
  ENROLLMENT_STATUS,
  ENROLLMENT_STATUS_LABELS,
} from "../../constants/statuses";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import Card from "../../components/ui/Card";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { EnrollmentStatusBadge, DeletedBadge } from "../../components/ui/StatusBadge";
import api from "../../config/axios";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

const EnrollmentsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  usePageTitle("Enrollments");

  const { enrollments, pagination, listLoading, mutating } = useSelector(
    (state) => state.enrollments
  );



 
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Dropdown data
  const [courses, setCourses] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [searchParams] = useSearchParams();
    const prefilledCandidateId = searchParams.get("candidateId") || "";

     // Filter state
  const [filters, setFilters] = useState({
  courseId: "",
  instituteId: "",
  status: "",
  result: "",
  month: "",
  year: "",
  candidateId: prefilledCandidateId,
});


  // Fetch courses and institutes for filter dropdowns
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [cRes, iRes] = await Promise.all([
          api.get("/courses"),
          api.get("/institutes"),
        ]);
        // Only show active, non-deleted
        setCourses(
          cRes.data.data.filter((c) => c.isActive && !c.isDeleted)
        );
        setInstitutes(
          iRes.data.data.filter((i) => i.isActive && !i.isDeleted)
        );
      } catch {
        // Dropdowns fail silently — filters just won't be populated
      }
    };
    loadDropdowns();
  }, []);

  const buildParams = useCallback(() => {
  const params = { page, limit: 20 };
  if (filters.courseId) params.courseId = filters.courseId;
  if (filters.instituteId) params.instituteId = filters.instituteId;
  if (filters.status) params.status = filters.status;
  if (filters.result) params.result = filters.result;
  if (filters.month) params.month = filters.month;
  if (filters.year) params.year = filters.year;
  if (filters.candidateId) params.candidateId = filters.candidateId;
  return params;
}, [filters, page]);

  const loadEnrollments = useCallback(() => {
    dispatch(fetchEnrollments(buildParams()));
  }, [dispatch, buildParams]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      courseId: "",
      instituteId: "",
      status: "",
      result: "",
      month: "",
      year: "",
    });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(removeEnrollment(deleteTarget._id));
    setDeleteTarget(null);
  };

  // Select element styling — reused across all filter dropdowns
  const selectClass =
    "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white text-text-main";

  const columns = [
    {
      key: "candidateId",
      label: "Candidate",
      render: (value) => (
        <div>
          <p className="font-medium text-text-main">{value?.fullName || "—"}</p>
          <p className="text-xs text-muted">{value?.mobile || "—"}</p>
        </div>
      ),
    },
    {
      key: "courseId",
      label: "Course",
      render: (value) => (
        <div>
          <p className="font-medium text-text-main">{value?.shortCode || "—"}</p>
          <p className="text-xs text-muted truncate max-w-[160px]">
            {value?.name || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "instituteId",
      label: "Institute",
      render: (value) => value?.name || "—",
    },
    {
      key: "enrollmentMonth",
      label: "Batch",
      render: (value, row) =>
        formatMonthYear(row.enrollmentMonth, row.enrollmentYear),
    },
    {
      key: "status",
      label: "Status",
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <EnrollmentStatusBadge status={value} />
          {row.isDeleted && <DeletedBadge />}
        </div>
      ),
    },
    {
      key: "result",
      label: "Result",
      render: (value) => {
        if (!value) return <span className="text-muted text-xs">—</span>;
        const colors = {
          pass: "text-success font-medium",
          fail: "text-danger font-medium",
          pending: "text-warning font-medium",
        };
        return (
          <span className={`text-sm ${colors[value] || ""}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Created",
      render: (value) => formatDate(value),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/enrollments/${row._id}`)}
            className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
            title="View enrollment"
            aria-label={`View enrollment for ${row.candidateId?.fullName}`}
          >
            <Eye className="h-4 w-4" />
          </button>
          {user?.role !== ROLES.VIEWER && !row.isDeleted && (
            <button
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-50 transition-colors"
              title="Delete enrollment"
              aria-label={`Delete enrollment for ${row.candidateId?.fullName}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageWrapper title="Enrollments">
      <section aria-label="Enrollments management">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-main">
              All Enrollments
            </h2>
            <p className="text-sm text-muted mt-0.5">
              {pagination.total} enrollment{pagination.total !== 1 ? "s" : ""}{" "}
              in your workspace
            </p>
          </div>
          {user?.role !== ROLES.VIEWER && (
            <Button
              variant="primary"
              icon={PlusCircle}
              onClick={() => navigate("/enrollments/add")}
            >
              New Enrollment
            </Button>
          )}
        </header>

        {/* ── Filter bar ───────────────────────────────────────────────── */}
        <Card className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setShowFilters((prev) => !prev)}
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
                onClick={loadEnrollments}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted border border-border rounded-lg hover:bg-neutral transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Expanded filter panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Course filter */}
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

              {/* Institute filter */}
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

              {/* Status filter */}
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
                  {Object.entries(ENROLLMENT_STATUS).map(([key, value]) => (
                    <option key={key} value={value}>
                      {ENROLLMENT_STATUS_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Result filter */}
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

              {/* Month filter */}
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

              {/* Year filter */}
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

        {/* ── Enrollments table ─────────────────────────────────────────── */}
        <Card padding={false}>
          <Table
            columns={columns}
            data={enrollments}
            loading={listLoading}
            emptyMessage="No enrollments found. Try adjusting your filters or create a new enrollment."
          />

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
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
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

      {/* ── Delete confirmation ───────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={mutating}
        title="Delete Enrollment"
        message={`Are you sure you want to delete the enrollment for "${deleteTarget?.candidateId?.fullName}"? This will soft delete the record.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </PageWrapper>
  );
};

export default EnrollmentsPage;