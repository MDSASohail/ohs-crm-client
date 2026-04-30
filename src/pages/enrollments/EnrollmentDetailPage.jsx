import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { toastSuccess, toastError } from "../../utils/toast";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  Trash2,
  GraduationCap,
  ClipboardList,
  Calendar,
  Award,
  MessageSquare,
  CheckCircle2,
  Circle,
  SkipForward,
  CreditCard,
  User,
} from "lucide-react";
import {
  fetchEnrollmentById,
  editEnrollment,
  removeEnrollment,
  markStepDoneThunk,
  markStepUndoneThunk,
  skipStepThunk,
  clearSelected,
} from "../../features/enrollments/enrollmentsSlice";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/roles";
import { formatDate, formatMonthYear } from "../../utils/formatDate";
import {
  ENROLLMENT_STATUS_IGC,
  ENROLLMENT_STATUS_LABELS_IGC,
  ENROLLMENT_STATUS_COLORS_IGC,
  getStatusLabel,
  getStatusColor,
  getStatusesByCourse,
  getCourseConfig
} from "../../constants/statuses";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { EnrollmentStatusBadge, DeletedBadge } from "../../components/ui/StatusBadge";

// ── Reusable info row ─────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
      {label}
    </p>
    <p className="text-sm text-text-main">
      {value || <span className="text-muted italic">Not provided</span>}
    </p>
  </div>
);

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children, action }) => (
  <Card className="mb-6">
    <header className="flex items-center justify-between mb-5 pb-4 border-b border-border">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-accent" />
        </div>
        <h3 className="text-base font-semibold text-text-main">{title}</h3>
      </div>
      {action && <div>{action}</div>}
    </header>
    {children}
  </Card>
);

// ── Status pipeline component ─────────────────────────────────────────────────
const StatusPipeline = ({ current, status,  courseJourney }) => {
  const steps = Object.values(courseJourney || []);
  const statusArray = Object.values(status||[]);
  const currentIndex = statusArray.indexOf(current);

  console.log("steps", steps);
  console.log("Current", current);
  console.log("Index", currentIndex);
  console.log("Statu", status)


  return (
    <div className="w-full overflow-x-auto pb-2">
      <ol className="flex items-center min-w-max gap-0">
        {steps.map((step, index) => {
          const isDone = index < currentIndex;
          const isActive = index === currentIndex;
          return (
            <li key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${isDone
                    ? "bg-success border-success text-white"
                    : isActive
                      ? "bg-accent border-accent text-white"
                      : "bg-white border-border text-muted"
                    }`}
                >
                  {isDone ? "✓" : index + 1}
                </div>
                <span
                  className={`text-xs font-medium text-center max-w-[72px] leading-tight ${isActive ? "text-accent" : isDone ? "text-success" : "text-muted"
                    }`}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-8 mx-1 mt-[-14px] transition-colors ${isDone ? "bg-success" : "bg-border"
                    }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

// ── Checklist step component ──────────────────────────────────────────────────
const ChecklistStep = ({ step, enrollmentId, canEdit, onMarkDone, onMarkUndone, onSkip }) => {
  const [expanded, setExpanded] = useState(false);
  const [skipMode, setSkipMode] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [stepForm, setStepForm] = useState({
    date: step.date ? step.date.split("T")[0] : "",
    assignedTo: step.assignedTo || "",
    note: step.note || "",
  });
  const [saving, setSaving] = useState(false);

  const handleMarkDone = async () => {
    setSaving(true);
    await onMarkDone(enrollmentId, step._id, {
      ...(step.hasDate && { date: stepForm.date || undefined }),
      ...(step.hasAssignedTo && { assignedTo: stepForm.assignedTo || undefined }),
      ...(step.hasNote && { note: stepForm.note || undefined }),
    });
    setSaving(false);
    setExpanded(false);
  };

  const handleMarkUndone = async () => {
    setSaving(true);
    await onMarkUndone(enrollmentId, step._id);
    setSaving(false);
  };

  const handleSkip = async () => {
    if (!skipReason.trim()) return;
    setSaving(true);
    await onSkip(enrollmentId, step._id, { skipReason: skipReason.trim() });
    setSaving(false);
    setSkipMode(false);
    setSkipReason("");
  };

  const handleUnskip = async () => {
    setSaving(true);
    await onMarkUndone(enrollmentId, step._id);
    setSaving(false);
  };

  return (
    <li className={`rounded-xl border transition-colors ${step.isDone
      ? "border-success/30 bg-green-50/50"
      : step.skipped
        ? "border-border bg-neutral/50"
        : "border-border bg-white"
      }`}>
      {/* Step header */}
      <div className="flex items-start gap-3 p-4">
        {/* Status icon */}
        <div className="shrink-0 mt-0.5">
          {step.isDone ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : step.skipped ? (
            <SkipForward className="h-5 w-5 text-muted" />
          ) : (
            <Circle className="h-5 w-5 text-border" />
          )}
        </div>

        {/* Step info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-medium ${step.isDone
              ? "text-success line-through"
              : step.skipped
                ? "text-muted line-through"
                : "text-text-main"
              }`}>
              {step.title}
            </p>
            {step.isRequired && !step.isDone && !step.skipped && (
              <span className="text-xs font-medium text-danger bg-red-50 px-1.5 py-0.5 rounded">
                Required
              </span>
            )}
            {step.skipped && (
              <span className="text-xs font-medium text-muted bg-neutral px-1.5 py-0.5 rounded">
                Skipped
              </span>
            )}
          </div>

          {/* Done info */}
          {step.isDone && step.doneAt && (
            <p className="text-xs text-muted mt-1">
              Completed on {formatDate(step.doneAt)}
              {step.doneBy?.name ? ` by ${step.doneBy.name}` : ""}
            </p>
          )}

          {/* Skip reason */}
          {step.skipped && step.skipReason && (
            <p className="text-xs text-muted mt-1 italic">
              Reason: {step.skipReason}
            </p>
          )}

          {/* Extra fields in read mode */}
          {!expanded && (step.date || step.assignedTo || step.note) && (
            <div className="mt-2 flex flex-wrap gap-3">
              {step.date && (
                <span className="text-xs text-muted">
                  📅 {formatDate(step.date)}
                </span>
              )}
              {step.assignedTo && (
                <span className="text-xs text-muted">
                  👤 {step.assignedTo}
                </span>
              )}
              {step.note && (
                <span className="text-xs text-muted">
                  📝 {step.note}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {canEdit && !step.skipped && (
          <div className="flex items-center gap-1.5 shrink-0">
            {step.isDone ? (
              <button
                onClick={handleMarkUndone}
                disabled={saving}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:bg-neutral transition-colors disabled:opacity-50"
              >
                Undo
              </button>
            ) : (
              <>
                <button
                  onClick={() => setExpanded((p) => !p)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
                >
                  {expanded ? "Close" : "Mark Done"}
                </button>
                {!step.isRequired && (
                  <button
                    onClick={() => setSkipMode((p) => !p)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:bg-neutral transition-colors"
                  >
                    Skip
                  </button>
                )}
              </>
            )}
            {step.skipped && canEdit && (
              <button
                onClick={handleUnskip}
                disabled={saving}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:bg-neutral transition-colors disabled:opacity-50"
              >
                Unskip
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded — mark done form */}
      {expanded && canEdit && (
        <div className="px-4 pb-4 pt-0 border-t border-border mt-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-4">
            {step.hasDate && (
              <Input
                label="Date"
                name="date"
                type="date"
                value={stepForm.date}
                onChange={(e) =>
                  setStepForm((p) => ({ ...p, date: e.target.value }))
                }
              />
            )}
            {step.hasAssignedTo && (
              <Input
                label="Assigned To"
                name="assignedTo"
                value={stepForm.assignedTo}
                onChange={(e) =>
                  setStepForm((p) => ({ ...p, assignedTo: e.target.value }))
                }
                placeholder="Person responsible"
              />
            )}
            {step.hasNote && (
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  Note
                </label>
                <textarea
                  value={stepForm.note}
                  onChange={(e) =>
                    setStepForm((p) => ({ ...p, note: e.target.value }))
                  }
                  rows={2}
                  placeholder="Add a note..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted resize-none"
                />
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 mt-3">
            <button
              onClick={() => setExpanded(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted hover:bg-neutral transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkDone}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded-lg bg-success text-white hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? (
                <Spinner size="sm" color="white" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Confirm Done
            </button>
          </div>
        </div>
      )}

      {/* Skip mode */}
      {skipMode && canEdit && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="mt-4 flex flex-col gap-2">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">
              Skip Reason <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="Why is this step being skipped?"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted"
            />
            <div className="flex items-center justify-end gap-2 mt-1">
              <button
                onClick={() => {
                  setSkipMode(false);
                  setSkipReason("");
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted hover:bg-neutral transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSkip}
                disabled={saving || !skipReason.trim()}
                className="text-xs px-3 py-1.5 rounded-lg bg-warning text-white hover:bg-warning/90 transition-colors disabled:opacity-50"
              >
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const EnrollmentDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();





  const { selected, detailLoading, detailError, mutating } = useSelector(
    (state) => state.enrollments
  );

  // console.log("Selected", selected)
  // console.log("Course", selected?.status)
  const course = selected?.courseId?.shortCode; // dynamic (from DB / API)
  const status = selected?.status;

  // const label = getStatusLabel(course, status);
  // const color = getStatusColor(course, status);
  const courseJourney = getStatusesByCourse(course);
  const configrationByCourse = getCourseConfig(course)
  console.log("Config", configrationByCourse)






  usePageTitle(
    selected
      ? `${selected.candidateId?.fullName} — ${selected.courseId?.shortCode}`
      : "Enrollment"
  );
  const [editMode, setEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [form, setForm] = useState({});

  const selectClass =
    "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white text-text-main";

  useEffect(() => {
    dispatch(fetchEnrollmentById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  useEffect(() => {
    if (selected) {
      setForm({
        status: selected.status || ENROLLMENT_STATUS_IGC.ENQUIRY,
        learnerNumber: selected.learnerNumber || "",
        ig1Date: selected.ig1Date ? selected.ig1Date.split("T")[0] : "",
        ig2Date: selected.ig2Date ? selected.ig2Date.split("T")[0] : "",
        interviewDate: selected.interviewDate
          ? selected.interviewDate.split("T")[0]
          : "",
        resultDate: selected.resultDate
          ? selected.resultDate.split("T")[0]
          : "",
        result: selected.result || "",
        certificateSent: selected.certificateSent || false,
        certificateSentDate: selected.certificateSentDate
          ? selected.certificateSentDate.split("T")[0]
          : "",
        certificateSentVia: selected.certificateSentVia || "",
        remarks: selected.remarks || "",
      });
    }
  }, [selected]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    const payload = {
      status: form.status,
      learnerNumber: form.learnerNumber || undefined,
      ig1Date: form.ig1Date || undefined,
      ig2Date: form.ig2Date || undefined,
      interviewDate: form.interviewDate || undefined,
      resultDate: form.resultDate || undefined,
      result: form.result || undefined,
      certificateSent: form.certificateSent,
      certificateSentDate: form.certificateSentDate || undefined,
      certificateSentVia: form.certificateSentVia || undefined,
      remarks: form.remarks || undefined,
    };

    const result = await dispatch(editEnrollment({ id, data: payload }));
    if (editEnrollment.fulfilled.match(result)) {
      toastSuccess("Enrollment updated successfully.");
      setEditMode(false);
      dispatch(fetchEnrollmentById(id));
    } else {
      toastError(result.payload);
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(removeEnrollment(id));
    if (removeEnrollment.fulfilled.match(result)) {
      toastSuccess("Enrollment deleted.");
      navigate("/enrollments");
    } else {
      toastError("Failed to delete enrollment.");
    }
  };

  const handleStepDone = async (enrollmentId, stepId, data) => {
    await dispatch(markStepDoneThunk({ enrollmentId, stepId, data }));
  };

  const handleStepUndone = async (enrollmentId, stepId) => {
    await dispatch(markStepUndoneThunk({ enrollmentId, stepId }));
  };

  const handleStepSkip = async (enrollmentId, stepId, data) => {
    await dispatch(skipStepThunk({ enrollmentId, stepId, data }));
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (detailLoading) {
    return (
      <PageWrapper title="Enrollment">
        <div className="flex items-center justify-center py-32">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (detailError) {
    return (
      <PageWrapper title="Enrollment">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-danger font-medium">{detailError}</p>
          <Button variant="secondary" onClick={() => navigate("/enrollments")}>
            Back to Enrollments
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (!selected) return null;

  const canEdit = user?.role !== ROLES.VIEWER && !selected.isDeleted;
  const canDelete =
    [ROLES.ROOT, ROLES.ADMIN].includes(user?.role) && !selected.isDeleted;

  const doneSteps = selected.checklist?.filter((s) => s.isDone).length || 0;
  const totalSteps = selected.checklist?.length || 0;

  return (
    <PageWrapper title="Enrollment Detail">
      <section aria-label="Enrollment detail">

        {/* ── Page header ───────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/enrollments")}
              className="p-2 rounded-lg text-muted hover:bg-white hover:text-text-main border border-border transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-text-main">
                  {selected.candidateId?.fullName}
                </h2>
                <span className="text-muted">·</span>
                <span className="text-sm font-medium text-accent">
                  {selected.courseId?.shortCode}
                </span>
                {selected.isDeleted && <DeletedBadge />}
              </div>
              <p className="text-sm text-muted mt-0.5">
                {selected.instituteId?.name} ·{" "}
                {formatMonthYear(
                  selected.enrollmentMonth,
                  selected.enrollmentYear
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {editMode ? (
              <>
                <Button
                  variant="secondary"
                  icon={X}
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={Save}
                  onClick={handleSave}
                  loading={mutating}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                {canDelete && (
                  <Button
                    variant="danger"
                    icon={Trash2}
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete
                  </Button>
                )}
                {canEdit && (
                  <Button
                    variant="primary"
                    icon={Edit2}
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </Button>
                )}
                {canEdit && (
                  <Button
                    variant="secondary"
                    icon={CreditCard}
                    onClick={() => navigate(`/payments?enrollmentId=${selected._id}`)}
                  >
                    Payments
                  </Button>
                )}
              </>
            )}
          </div>
        </header>

        {/* ── Status pipeline ───────────────────────────────────────── */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text-main">
              Journey Status
            </h3>
            <EnrollmentStatusBadge status={selected.status} />
          </div>
          <StatusPipeline current={status} status={configrationByCourse?.statuses || []} courseJourney={configrationByCourse?.labels || []} />
        </Card>

        {/* ── Enrollment Info ───────────────────────────────────────── */}
        <Section title="Enrollment Information" icon={GraduationCap}>
          {editMode ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Status */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={selectClass}
                >
                  {Object.entries(configrationByCourse?.labels || {}).map(([status, label]) => (
                    <option key={status} value={status}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Learner Number"
                name="learnerNumber"
                value={form.learnerNumber}
                onChange={handleChange}
                placeholder="e.g. IGC-2025-001"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow
                label="Candidate"
                value={selected.candidateId?.fullName}
              />
              <InfoRow
                label="Course"
                value={`${selected.courseId?.shortCode} — ${selected.courseId?.name}`}
              />
              <InfoRow
                label="Institute"
                value={selected.instituteId?.name}
              />
              <InfoRow
                label="Batch"
                value={formatMonthYear(
                  selected.enrollmentMonth,
                  selected.enrollmentYear
                )}
              />
              <InfoRow
                label="Enrollment Date"
                value={formatDate(selected.enrollmentDate)}
              />
              <InfoRow
                label="Learner Number"
                value={selected.learnerNumber}
              />
              <InfoRow
                label="Created By"
                value={selected.createdBy?.name}
              />
              <InfoRow
                label="Created On"
                value={formatDate(selected.createdAt)}
              />
            </div>
          )}
        </Section>

        {/* ── Exam Dates & Result ───────────────────────────────────── */}
        <Section title="Exam Dates & Result" icon={Calendar}>
          {editMode ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="IG-1 Date"
                name="ig1Date"
                type="date"
                value={form.ig1Date}
                onChange={handleChange}
              />
              <Input
                label="IG-2 Date"
                name="ig2Date"
                type="date"
                value={form.ig2Date}
                onChange={handleChange}
              />
              <Input
                label="Interview Date"
                name="interviewDate"
                type="date"
                value={form.interviewDate}
                onChange={handleChange}
              />
              <Input
                label="Result Date"
                name="resultDate"
                type="date"
                value={form.resultDate}
                onChange={handleChange}
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  Result
                </label>
                <select
                  name="result"
                  value={form.result}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="">— Not yet —</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="IG-1 Date" value={formatDate(selected.ig1Date)} />
              <InfoRow label="IG-2 Date" value={formatDate(selected.ig2Date)} />
              <InfoRow
                label="Interview Date"
                value={formatDate(selected.interviewDate)}
              />
              <InfoRow
                label="Result Date"
                value={formatDate(selected.resultDate)}
              />
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                  Result
                </p>
                {selected.result ? (
                  <span
                    className={`text-sm font-semibold ${selected.result === "pass"
                      ? "text-success"
                      : selected.result === "fail"
                        ? "text-danger"
                        : "text-warning"
                      }`}
                  >
                    {selected.result.charAt(0).toUpperCase() +
                      selected.result.slice(1)}
                  </span>
                ) : (
                  <span className="text-muted italic text-sm">
                    Not yet declared
                  </span>
                )}
              </div>
            </div>
          )}
        </Section>

        {/* ── Certificate Tracking ──────────────────────────────────── */}
        <Section title="Certificate Tracking" icon={Award}>
          {editMode ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Certificate sent toggle */}
              <div className="sm:col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="certificateSent"
                  name="certificateSent"
                  checked={form.certificateSent}
                  onChange={handleChange}
                  className="h-4 w-4 accent-accent rounded"
                />
                <label
                  htmlFor="certificateSent"
                  className="text-sm font-medium text-text-main cursor-pointer"
                >
                  Certificate has been sent to candidate
                </label>
              </div>

              {form.certificateSent && (
                <>
                  <Input
                    label="Sent Date"
                    name="certificateSentDate"
                    type="date"
                    value={form.certificateSentDate}
                    onChange={handleChange}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted uppercase tracking-wide">
                      Sent Via
                    </label>
                    <select
                      name="certificateSentVia"
                      value={form.certificateSentVia}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option value="">— Select method —</option>
                      <option value="courier">Courier</option>
                      <option value="email">Email</option>
                      <option value="hand">By Hand</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                  Certificate Sent
                </p>
                <span
                  className={`text-sm font-medium ${selected.certificateSent ? "text-success" : "text-warning"
                    }`}
                >
                  {selected.certificateSent ? "✓ Yes" : "✗ Not yet"}
                </span>
              </div>
              {selected.certificateSent && (
                <>
                  <InfoRow
                    label="Sent Date"
                    value={formatDate(selected.certificateSentDate)}
                  />
                  <InfoRow
                    label="Sent Via"
                    value={
                      selected.certificateSentVia
                        ? selected.certificateSentVia.charAt(0).toUpperCase() +
                        selected.certificateSentVia.slice(1)
                        : null
                    }
                  />
                </>
              )}
            </div>
          )}
        </Section>

        {/* ── Checklist ─────────If necessary just uncomment only────────────────────────────────────── */}
        {/* <Section
          
          title="Checklist"
          icon={ClipboardList}
          action={
            totalSteps > 0 && (
              <span className="text-xs font-medium text-muted bg-neutral px-2.5 py-1 rounded-full">
                {doneSteps}/{totalSteps} done
              </span>
            )
          }
        >
          {selected.checklist?.length === 0 ? (
            <p className="text-sm text-muted italic">
              No checklist steps defined for this course.
            </p>
          ) : (
            <>
              Progress bar
              {totalSteps > 0 && (
                <div className="mb-4">
                  <div className="h-2 bg-neutral rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((doneSteps / totalSteps) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted mt-1.5">
                    {Math.round((doneSteps / totalSteps) * 100)}% complete
                  </p>
                </div>
              )}

              <ul className="space-y-3">
                {[...(selected.checklist || [])]
                  .sort((a, b) => a.order - b.order)
                  .map((step) => (
                    <ChecklistStep
                      key={step._id}
                      step={step}
                      enrollmentId={selected._id}
                      canEdit={canEdit}
                      onMarkDone={handleStepDone}
                      onMarkUndone={handleStepUndone}
                      onSkip={handleStepSkip}
                    />
                  ))}
              </ul>
            </>
          )}
        </Section> */}

        {/* ── Remarks ───────────────────────────────────────────────── */}
        <Section title="Remarks" icon={MessageSquare}>
          {editMode ? (
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              rows={4}
              placeholder="Add remarks about this enrollment..."
              className="w-full px-3 py-2 text-sm text-text-main border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted resize-none"
            />
          ) : (
            <p className="text-sm text-text-main leading-relaxed">
              {selected.remarks || (
                <span className="text-muted italic">No remarks added.</span>
              )}
            </p>
          )}
        </Section>

      </section>

      {/* ── Delete confirmation ───────────────────────────────────── */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        loading={mutating}
        title="Delete Enrollment"
        message={`Are you sure you want to delete this enrollment for "${selected.candidateId?.fullName}"? This will soft delete the record.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </PageWrapper>
  );
};

export default EnrollmentDetailPage;