import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { UserPlus, Search, Eye, Trash2, RefreshCw } from "lucide-react";
import { fetchCandidates, removeCandidate } from "../../features/candidates/candidatesSlice";
import { useAuth } from "../../hooks/useAuth";
import { useDebounce } from "../../hooks/useDebounce";
import { ROLES } from "../../constants/roles";
import { formatDate } from "../../utils/formatDate";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Card from "../../components/ui/Card";
import { usePageTitle } from "../../hooks/usePageTitle";

const CandidatesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  usePageTitle("Candidates");

  const { candidates, pagination, listLoading, mutating } = useSelector(
    (state) => state.candidates
  );

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null); // candidate to delete

  const debouncedSearch = useDebounce(search, 400);

  // Fetch candidates whenever search or page changes
  const loadCandidates = useCallback(() => {
    dispatch(
      fetchCandidates({
        search: debouncedSearch || undefined,
        page,
        limit: 20,
      })
    );
  }, [dispatch, debouncedSearch, page]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(removeCandidate(deleteTarget._id));
    setDeleteTarget(null);
  };

  // Table column definitions
  const columns = [
    {
      key: "fullName",
      label: "Name",
      render: (value, row) => (
        <div>
          <p className="font-medium text-text-main">{value}</p>
          <p className="text-xs text-muted">{row.email || "—"}</p>
        </div>
      ),
    },
    {
      key: "mobile",
      label: "Mobile",
    },
    {
      key: "qualification",
      label: "Qualification",
      render: (value) => value || "—",
    },
    {
      key: "referredBy",
      label: "Referred By",
      render: (value) =>
        value ? (
          <Badge
            label={value}
            colorClass="bg-blue-50 text-blue-700"
          />
        ) : (
          "—"
        ),
    },
    {
      key: "isDeleted",
      label: "Status",
      render: (value) =>
        value ? (
          <Badge label="Deleted" colorClass="bg-red-100 text-danger" dot />
        ) : (
          <Badge label="Active" colorClass="bg-green-100 text-success" dot />
        ),
    },
    {
      key: "createdAt",
      label: "Added On",
      render: (value) => formatDate(value),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {/* View detail */}
          <button
            onClick={() => navigate(`/candidates/${row._id}`)}
            className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
            title="View candidate"
            aria-label={`View ${row.fullName}`}
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Delete — hidden for viewer */}
          {user?.role !== ROLES.VIEWER && !row.isDeleted && (
            <button
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-50 transition-colors"
              title="Delete candidate"
              aria-label={`Delete ${row.fullName}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageWrapper title="Candidates">
      <section aria-label="Candidates management">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-main">
              All Candidates
            </h2>
            <p className="text-sm text-muted mt-0.5">
              {pagination.total} candidate{pagination.total !== 1 ? "s" : ""}{" "}
              in your workspace
            </p>
          </div>

          {/* Add button — hidden for viewer */}
          {user?.role !== ROLES.VIEWER && (
            <Button
              variant="primary"
              icon={UserPlus}
              onClick={() => navigate("/candidates/add")}
            >
              Add Candidate
            </Button>
          )}
        </header>

        {/* ── Search & controls ─────────────────────────────────────────── */}
        <Card className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted" />
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or mobile..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-muted"
                aria-label="Search candidates"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={loadCandidates}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted border border-border rounded-lg hover:bg-neutral transition-colors self-start sm:self-auto"
              title="Refresh list"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </Card>

        {/* ── Candidates table ──────────────────────────────────────────── */}
        <Card padding={false}>
          <Table
            columns={columns}
            data={candidates}
            loading={listLoading}
            emptyMessage={
              search
                ? `No candidates found for "${search}".`
                : "No candidates yet. Add your first candidate."
            }
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

      {/* ── Delete confirmation dialog ─────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={mutating}
        title="Delete Candidate"
        message={`Are you sure you want to delete "${deleteTarget?.fullName}"? This action will soft delete the record and can only be recovered from the database.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </PageWrapper>
  );
};

export default CandidatesPage;