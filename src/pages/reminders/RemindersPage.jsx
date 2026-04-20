import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  Bell,
  Plus,
  Send,
  X,
  Trash2,
  RefreshCw,
  Filter,
  Mail,
  MessageSquare,
  BellRing,
} from "lucide-react";
import {
  getReminders,
  createReminder,
  sendReminder,
  cancelReminder,
  deleteReminder,
} from "../../services/reminder.service";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/roles";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import api from "../../config/axios";

// ── Type icon ─────────────────────────────────────────────────────────────────
const TypeIcon = ({ type }) => {
  if (type === "email")
    return <Mail className="h-4 w-4 text-accent" />;
  if (type === "whatsapp")
    return <MessageSquare className="h-4 w-4 text-success" />;
  return <BellRing className="h-4 w-4 text-warning" />;
};

// ── Status badge ──────────────────────────────────────────────────────────────
const ReminderStatusBadge = ({ status }) => {
  const map = {
    pending: "bg-yellow-100 text-yellow-700",
    sent: "bg-green-100 text-success",
    failed: "bg-red-100 text-danger",
    cancelled: "bg-gray-100 text-muted",
  };
  return (
    <Badge
      label={status.charAt(0).toUpperCase() + status.slice(1)}
      colorClass={map[status] || "bg-gray-100 text-muted"}
      dot
    />
  );
};

const selectClass =
  "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white text-text-main";

const INITIAL_FORM = {
  candidateId: "",
  enrollmentId: "",
  type: "internal",
  subject: "",
  message: "",
  scheduledAt: "",
};

const RemindersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  usePageTitle("Reminders");

  const prefilledCandidateId = searchParams.get("candidateId") || "";

  const canWrite = [ROLES.ROOT, ROLES.ADMIN, ROLES.STAFF].includes(user?.role);

  // Data
  const [reminders, setReminders] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    candidateId: prefilledCandidateId,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    ...INITIAL_FORM,
    candidateId: prefilledCandidateId,
  });
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  // Action targets
  const [sendTarget, setSendTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actioning, setActioning] = useState(false);

  // Dropdown data
  const [candidates, setCandidates] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [candidateSearch, setCandidateSearch] = useState("");

  // Load candidates for dropdown
  useEffect(() => {
    api
      .get("/candidates", { params: { limit: 100 } })
      .then((res) => setCandidates(res.data.data.candidates || []))
      .catch(() => { });
  }, []);

  // Load enrollments when candidate is selected
  useEffect(() => {
    if (form.candidateId) {
      api
        .get("/enrollments", {
          params: { candidateId: form.candidateId, limit: 50 },
        })
        .then((res) => setEnrollments(res.data.data.enrollments || []))
        .catch(() => { });
    } else {
      setEnrollments([]);
      setForm((prev) => ({ ...prev, enrollmentId: "" }));
    }
  }, [form.candidateId]);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.candidateId) params.candidateId = filters.candidateId;

      const res = await getReminders(params);
      setReminders(res.data.data.reminders);
      setPagination(res.data.data.pagination);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ type: "", status: "", candidateId: "" });
    setPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleCreate = async () => {
    setFormError("");
    if (!form.candidateId) {
      setFormError("Please select a candidate.");
      return;
    }
    if (!form.message.trim()) {
      setFormError("Message is required.");
      return;
    }
    if (form.type === "email" && !form.subject.trim()) {
      setFormError("Subject is required for email reminders.");
      return;
    }

    setCreating(true);
    try {
      await createReminder({
        candidateId: form.candidateId,
        enrollmentId: form.enrollmentId || undefined,
        type: form.type,
        subject: form.subject || undefined,
        message: form.message,
        scheduledAt: form.scheduledAt || undefined,
      });
      setShowCreateModal(false);
      setForm({ ...INITIAL_FORM, candidateId: prefilledCandidateId });
      setFormError("");
      await loadReminders();
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Failed to create reminder."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async () => {
    if (!sendTarget) return;
    setActioning(true);
    try {
      await sendReminder(sendTarget._id);
      setSendTarget(null);
      await loadReminders();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send reminder.");
    } finally {
      setActioning(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setActioning(true);
    try {
      await cancelReminder(cancelTarget._id);
      setCancelTarget(null);
      await loadReminders();
    } catch {
      // Silent fail
    } finally {
      setActioning(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActioning(true);
    try {
      await deleteReminder(deleteTarget._id);
      setDeleteTarget(null);
      await loadReminders();
    } catch {
      // Silent fail
    } finally {
      setActioning(false);
    }
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      !c.isDeleted &&
      (c.fullName.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        c.mobile.includes(candidateSearch))
  );

  return (
    <PageWrapper title="Reminders">
      <section aria-label="Reminders management">

        {/* ── Page header ───────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-main">
              Reminders
            </h2>
            <p className="text-sm text-muted mt-0.5">
              {pagination.total} reminder
              {pagination.total !== 1 ? "s" : ""} total
            </p>
          </div>
          {canWrite && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              New Reminder
            </Button>
          )}
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
                onClick={loadReminders}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted border border-border rounded-lg hover:bg-neutral transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  Type
                </label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className={selectClass}
                >
                  <option value="">All Types</option>
                  <option value="internal">Internal</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
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
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          )}
        </Card>

        {/* ── Reminders list ────────────────────────────────────────── */}
        <Card padding={false}>
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="md" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Bell className="h-8 w-8 text-muted" />
              <p className="text-sm text-muted italic">
                No reminders found.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {reminders.map((reminder) => (
                <li key={reminder._id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Type icon */}
                    <div className="h-9 w-9 rounded-lg bg-neutral flex items-center justify-center shrink-0 mt-0.5">
                      <TypeIcon type={reminder.type} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-medium text-text-main">
                          {reminder.candidateId?.fullName || "Unknown"}
                        </p>
                        <ReminderStatusBadge status={reminder.status} />
                        <Badge
                          label={
                            reminder.type.charAt(0).toUpperCase() +
                            reminder.type.slice(1)
                          }
                          colorClass="bg-blue-50 text-accent"
                        />
                      </div>

                      {reminder.subject && (
                        <p className="text-sm font-medium text-text-main">
                          {reminder.subject}
                        </p>
                      )}

                      <p className="text-sm text-muted mt-1 line-clamp-2">
                        {reminder.message}
                      </p>

                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="text-xs text-muted">
                          Created {formatDate(reminder.createdAt)}
                        </span>
                        {reminder.scheduledAt && (
                          <span className="text-xs text-muted">
                            Scheduled {formatDateTime(reminder.scheduledAt)}
                          </span>
                        )}
                        {reminder.sentAt && (
                          <span className="text-xs text-success">
                            Sent {formatDateTime(reminder.sentAt)}
                          </span>
                        )}
                        {reminder.createdBy?.name && (
                          <span className="text-xs text-muted">
                            By {reminder.createdBy.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {canWrite && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Send — only for pending or failed */}
                        {["pending", "failed"].includes(
                          reminder.status
                        ) && (
                            <button
                              onClick={() => setSendTarget(reminder)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-success border border-success/30 rounded-lg hover:bg-green-50 transition-colors"
                              title="Send now"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Send
                            </button>
                          )}

                        {/* Cancel — only for pending */}
                        {reminder.status === "pending" && (
                          <button
                            onClick={() => setCancelTarget(reminder)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-warning border border-warning/30 rounded-lg hover:bg-yellow-50 transition-colors"
                            title="Cancel reminder"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(reminder)}
                          className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-50 transition-colors"
                          title="Delete reminder"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted">
                Page {pagination.page} of {pagination.totalPages}
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

      {/* ── Create reminder modal ─────────────────────────────────── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setForm({ ...INITIAL_FORM, candidateId: prefilledCandidateId });
          setFormError("");
        }}
        title="New Reminder"
        onConfirm={handleCreate}
        confirmLabel="Create Reminder"
        confirmLoading={creating}
        size="md"
      >
        {formError && (
          <div
            role="alert"
            className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-danger"
          >
            {formError}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Candidate selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">
              Candidate <span className="text-danger">*</span>
            </label>
            {prefilledCandidateId && form.candidateId ? (
              <div className="px-3 py-2 bg-neutral border border-border rounded-lg">
                <p className="text-sm text-text-main">
                  {candidates.find((c) => c._id === form.candidateId)
                    ?.fullName || "Selected candidate"}
                </p>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Search by name or mobile..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted"
                />

                <div className="border border-border rounded-lg overflow-hidden">
                  {filteredCandidates.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted">
                      {candidateSearch
                        ? `No candidates found for "${candidateSearch}"`
                        : "No candidates available"}
                    </div>
                  ) : (
                    <ul className="max-h-48 overflow-y-auto divide-y divide-border">
                      {filteredCandidates.map((c) => (
                        <li key={c._id}>
                          <button
                            type="button"
                            onClick={() => {
                              setForm((p) => ({ ...p, candidateId: c._id }));
                              setCandidateSearch("");
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent/5 ${form.candidateId === c._id ? "bg-accent/10" : "bg-white"
                              }`}
                          >
                            <div>
                              <p className="text-sm font-medium text-text-main">
                                {c.fullName}
                              </p>
                              <p className="text-xs text-muted mt-0.5">
                                {c.mobile}
                                {c.email ? ` · ${c.email}` : ""}
                              </p>
                            </div>
                            {form.candidateId === c._id && (
                              <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full shrink-0 ml-3">
                                Selected
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Enrollment — optional */}
          {enrollments.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted uppercase tracking-wide">
                Enrollment (Optional)
              </label>
              <select
                value={form.enrollmentId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, enrollmentId: e.target.value }))
                }
                className={selectClass}
              >
                <option value="">— Not linked to enrollment —</option>
                {enrollments.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.courseId?.shortCode} · {e.instituteId?.name} ·{" "}
                    {e.status}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">
              Type <span className="text-danger">*</span>
            </label>
            <div className="flex gap-2">
              {["internal", "email", "whatsapp"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, type: t }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg border transition-colors ${form.type === t
                      ? "bg-accent text-white border-accent"
                      : "bg-white text-muted border-border hover:bg-neutral"
                    }`}
                >
                  <TypeIcon type={t} />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Subject — email only */}
          {form.type === "email" && (
            <Input
              label="Subject"
              name="subject"
              value={form.subject}
              onChange={(e) =>
                setForm((p) => ({ ...p, subject: e.target.value }))
              }
              placeholder="Email subject line"
              required
            />
          )}

          {/* Message */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">
              Message <span className="text-danger">*</span>
            </label>
            <textarea
              value={form.message}
              onChange={(e) =>
                setForm((p) => ({ ...p, message: e.target.value }))
              }
              placeholder="Write your reminder message..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted resize-none"
            />
          </div>

          {/* Scheduled at */}
          <Input
            label="Schedule For (Optional)"
            name="scheduledAt"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) =>
              setForm((p) => ({ ...p, scheduledAt: e.target.value }))
            }
            helperText="Leave empty to send manually"
          />
        </div>
      </Modal>

      {/* ── Send confirm ──────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!sendTarget}
        onClose={() => setSendTarget(null)}
        onConfirm={handleSend}
        loading={actioning}
        title="Send Reminder"
        message={`Send this ${sendTarget?.type} reminder to ${sendTarget?.candidateId?.fullName} now?`}
        confirmLabel="Send Now"
        variant="primary"
      />

      {/* ── Cancel confirm ────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        loading={actioning}
        title="Cancel Reminder"
        message="Are you sure you want to cancel this reminder?"
        confirmLabel="Cancel Reminder"
        variant="danger"
      />

      {/* ── Delete confirm ────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={actioning}
        title="Delete Reminder"
        message="Are you sure you want to delete this reminder?"
        confirmLabel="Delete"
        variant="danger"
      />
    </PageWrapper>
  );
};

export default RemindersPage;