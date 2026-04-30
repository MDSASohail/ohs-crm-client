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
  Plus,
  BookOpen,
  ClipboardList,
  Power,
  PowerOff,
  GripVertical,
  CheckSquare,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import {
  fetchCourseById,
  editCourse,
  removeCourse,
  deactivateCourseThunk,
  activateCourseThunk,
  fetchChecklistTemplate,
  createChecklistThunk,
  addStepThunk,
  updateStepThunk,
  deleteStepThunk,
  clearSelected,
} from "../../features/courses/coursesSlice";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/roles";
import { formatDate } from "../../utils/formatDate";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { DeletedBadge } from "../../components/ui/StatusBadge";

// ── Step form initial state ───────────────────────────────────────────────────
const INITIAL_STEP = {
  title: "",
  description: "",
  hasDate: false,
  hasAssignedTo: false,
  hasNote: false,
  isRequired: false,
};

// ── Checkbox field ────────────────────────────────────────────────────────────
const CheckboxField = ({ label, checked, onChange, icon: Icon }) => (
  <label className="flex items-center gap-2.5 cursor-pointer group">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 accent-accent rounded"
    />
    <div className="flex items-center gap-1.5">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted" />}
      <span className="text-sm text-text-main group-hover:text-accent transition-colors">
        {label}
      </span>
    </div>
  </label>
);

const CourseDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    selected,
    detailLoading,
    detailError,
    checklist,
    checklistLoading,
    mutating,
    mutateError,
  } = useSelector((state) => state.courses);

  usePageTitle(selected ? `${selected.shortCode} — ${selected.name}` : "Course");

  const canManage = [ROLES.ROOT, ROLES.ADMIN].includes(user?.role);

  // Core details edit
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showToggleDialog, setShowToggleDialog] = useState(false);

  // Checklist step modal
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [stepForm, setStepForm] = useState(INITIAL_STEP);
  const [deleteStepTarget, setDeleteStepTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchCourseById(id));
    dispatch(fetchChecklistTemplate(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  useEffect(() => {
    if (selected) {
      setForm({
        name: selected.name || "",
        shortCode: selected.shortCode || "",
        description: selected.description || "",
      });
    }
  }, [selected]);

  useEffect(() => {
    if (editingStep) {
      setStepForm({
        title: editingStep.title || "",
        description: editingStep.description || "",
        hasDate: editingStep.hasDate || false,
        hasAssignedTo: editingStep.hasAssignedTo || false,
        hasNote: editingStep.hasNote || false,
        isRequired: editingStep.isRequired || false,
      });
    } else {
      setStepForm(INITIAL_STEP);
    }
  }, [editingStep]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.shortCode.trim()) return;
    const result = await dispatch(
      editCourse({
        id,
        data: {
          name: form.name,
          shortCode: form.shortCode,
          description: form.description || undefined,
        },
      })
    );

    if (editCourse.fulfilled.match(result)) {
      toastSuccess("Course updated successfully.");
      setEditMode(false);
    } else {
      toastError(result.payload);
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(removeCourse(id));

    if (removeCourse.fulfilled.match(result)) {
      toastSuccess("Course deleted.");
      navigate("/courses");
    }
  };

  const handleToggle = async () => {
    if (selected?.isActive) {
      await dispatch(deactivateCourseThunk(id));
    } else {
      await dispatch(activateCourseThunk(id));
    }
    setShowToggleDialog(false);
  };

  // ── Checklist handlers ──────────────────────────────────────────────────────
  const handleStepSubmit = async () => {
    if (!stepForm.title.trim()) return;

    if (!checklist) {
      // No template yet — create one with this first step
      await dispatch(
        createChecklistThunk({
          courseId: id,
          data: { steps: [stepForm] },
        })
      );
    } else if (editingStep) {
      await dispatch(
        updateStepThunk({
          courseId: id,
          stepId: editingStep._id,
          data: stepForm,
        })
      );
    } else {
      await dispatch(addStepThunk({ courseId: id, data: stepForm }));
    }




    toastSuccess(editingStep ? "Step updated." : "Step added.");
    setShowStepModal(false);
    setEditingStep(null);
  };

  const handleDeleteStep = async () => {
    if (!deleteStepTarget) return;
    await dispatch(
      deleteStepThunk({ courseId: id, stepId: deleteStepTarget._id })
    );
    setDeleteStepTarget(null);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (detailLoading) {
    return (
      <PageWrapper title="Course">
        <div className="flex items-center justify-center py-32">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  if (detailError) {
    return (
      <PageWrapper title="Course">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-danger font-medium">{detailError}</p>
          <Button variant="secondary" onClick={() => navigate("/courses")}>
            Back to Courses
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (!selected) return null;

  const sortedSteps = checklist
    ? [...checklist.steps].sort((a, b) => a.order - b.order)
    : [];

  return (
    <PageWrapper title="Course Detail">
      <section aria-label="Course detail">

        {/* ── Page header ───────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/courses")}
              className="p-2 rounded-lg text-muted hover:bg-white hover:text-text-main border border-border transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-lg">
                  {selected.shortCode}
                </span>
                <h2 className="text-xl font-semibold text-text-main">
                  {selected.name}
                </h2>
                {selected.isDeleted ? (
                  <DeletedBadge />
                ) : selected.isActive ? (
                  <Badge
                    label="Active"
                    colorClass="bg-green-100 text-success"
                    dot
                  />
                ) : (
                  <Badge
                    label="Inactive"
                    colorClass="bg-yellow-100 text-warning"
                    dot
                  />
                )}
              </div>
              <p className="text-sm text-muted mt-0.5">
                Added {formatDate(selected.createdAt)}
              </p>
            </div>
          </div>

          {/* Actions */}
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
              canManage &&
              !selected.isDeleted && (
                <>
                  <Button
                    variant="secondary"
                    icon={selected.isActive ? PowerOff : Power}
                    onClick={() => setShowToggleDialog(true)}
                  >
                    {selected.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="danger"
                    icon={Trash2}
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="primary"
                    icon={Edit2}
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </Button>
                </>
              )
            )}
          </div>
        </header>

        {/* ── Course details ────────────────────────────────────────── */}
        <Card className="mb-6">
          <header className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-accent" />
            </div>
            <h3 className="text-base font-semibold text-text-main">
              Course Information
            </h3>
          </header>

          {editMode ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Course Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <Input
                label="Short Code"
                name="shortCode"
                value={form.shortCode}
                onChange={handleChange}
                helperText="Will be uppercased automatically"
                required
              />
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                  Name
                </p>
                <p className="text-sm text-text-main">{selected.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                  Short Code
                </p>
                <p className="text-sm font-bold text-accent">
                  {selected.shortCode}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                  Description
                </p>
                <p className="text-sm text-text-main">
                  {selected.description || (
                    <span className="text-muted italic">Not provided</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* ── Checklist template builder ────────────────────────────── */}
        <Card>
          <header className="flex items-center justify-between mb-5 pb-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-main">
                  Checklist Template
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Steps copied into every new enrollment for this course
                </p>
              </div>
            </div>
            {canManage && !selected.isDeleted && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setEditingStep(null);
                  setShowStepModal(true);
                }}
              >
                Add Step
              </Button>
            )}
          </header>

          {checklistLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : sortedSteps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <ClipboardList className="h-8 w-8 text-muted" />
              <p className="text-sm text-muted text-center">
                No checklist steps yet. Add steps to define the workflow
                for this course.
              </p>
              {canManage && !selected.isDeleted && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    setEditingStep(null);
                    setShowStepModal(true);
                  }}
                >
                  Add First Step
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Template version */}
              {checklist?.version && (
                <p className="text-xs text-muted mb-4">
                  Template version {checklist.version} ·{" "}
                  {sortedSteps.length} step
                  {sortedSteps.length !== 1 ? "s" : ""}
                </p>
              )}

              <ul className="space-y-3">
                {sortedSteps.map((step, index) => (
                  <li
                    key={step._id}
                    className="flex items-start gap-3 p-4 rounded-xl border border-border bg-neutral/40 hover:bg-neutral transition-colors"
                  >
                    {/* Order number */}
                    <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-accent">
                        {index + 1}
                      </span>
                    </div>

                    {/* Step info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-text-main">
                          {step.title}
                        </p>
                        {step.isRequired && (
                          <span className="text-xs font-medium text-danger bg-red-50 px-1.5 py-0.5 rounded">
                            Required
                          </span>
                        )}
                      </div>

                      {step.description && (
                        <p className="text-xs text-muted mt-1">
                          {step.description}
                        </p>
                      )}

                      {/* Optional fields indicators */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {step.hasDate && (
                          <span className="flex items-center gap-1 text-xs text-muted bg-white border border-border px-2 py-0.5 rounded-full">
                            <Calendar className="h-3 w-3" />
                            Date field
                          </span>
                        )}
                        {step.hasAssignedTo && (
                          <span className="flex items-center gap-1 text-xs text-muted bg-white border border-border px-2 py-0.5 rounded-full">
                            <User className="h-3 w-3" />
                            Assign field
                          </span>
                        )}
                        {step.hasNote && (
                          <span className="flex items-center gap-1 text-xs text-muted bg-white border border-border px-2 py-0.5 rounded-full">
                            <FileText className="h-3 w-3" />
                            Note field
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {canManage && !selected.isDeleted && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setEditingStep(step);
                            setShowStepModal(true);
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                          aria-label="Edit step"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteStepTarget(step)}
                          className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-50 transition-colors"
                          aria-label="Delete step"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {/* Warning */}
              <div className="mt-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-warning font-medium">
                  ⚠ Template changes only affect new enrollments. Existing
                  enrollments keep their original checklist snapshot.
                </p>
              </div>
            </>
          )}
        </Card>
      </section>

      {/* ── Add/Edit step modal ───────────────────────────────────── */}
      <Modal
        isOpen={showStepModal}
        onClose={() => {
          setShowStepModal(false);
          setEditingStep(null);
        }}
        title={editingStep ? "Edit Step" : "Add Checklist Step"}
        onConfirm={handleStepSubmit}
        confirmLabel={editingStep ? "Save Changes" : "Add Step"}
        confirmLoading={mutating}
        size="md"
      >
        {mutateError && (
          <div
            role="alert"
            className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-danger"
          >
            {mutateError}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <Input
            label="Step Title"
            name="title"
            value={stepForm.title}
            onChange={(e) =>
              setStepForm((p) => ({ ...p, title: e.target.value }))
            }
            placeholder="e.g. Submit Application, Collect Documents"
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={stepForm.description}
              onChange={(e) =>
                setStepForm((p) => ({
                  ...p,
                  description: e.target.value,
                }))
              }
              placeholder="Optional description for this step..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted resize-none"
            />
          </div>

          {/* Optional fields */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">
              Optional Fields
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <CheckboxField
                label="Include date field"
                checked={stepForm.hasDate}
                onChange={(e) =>
                  setStepForm((p) => ({ ...p, hasDate: e.target.checked }))
                }
                icon={Calendar}
              />
              <CheckboxField
                label="Include assigned to field"
                checked={stepForm.hasAssignedTo}
                onChange={(e) =>
                  setStepForm((p) => ({
                    ...p,
                    hasAssignedTo: e.target.checked,
                  }))
                }
                icon={User}
              />
              <CheckboxField
                label="Include note field"
                checked={stepForm.hasNote}
                onChange={(e) =>
                  setStepForm((p) => ({ ...p, hasNote: e.target.checked }))
                }
                icon={FileText}
              />
              <CheckboxField
                label="Required step"
                checked={stepForm.isRequired}
                onChange={(e) =>
                  setStepForm((p) => ({
                    ...p,
                    isRequired: e.target.checked,
                  }))
                }
                icon={CheckSquare}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Delete step confirm ───────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteStepTarget}
        onClose={() => setDeleteStepTarget(null)}
        onConfirm={handleDeleteStep}
        loading={mutating}
        title="Delete Step"
        message={`Are you sure you want to delete the step "${deleteStepTarget?.title}"? This will not affect existing enrollments.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* ── Toggle confirm ────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={showToggleDialog}
        onClose={() => setShowToggleDialog(false)}
        onConfirm={handleToggle}
        loading={mutating}
        title={selected.isActive ? "Deactivate Course" : "Activate Course"}
        message={
          selected.isActive
            ? `Deactivating "${selected.name}" will prevent it from being selected in new enrollments.`
            : `Activating "${selected.name}" will make it available in enrollment forms again.`
        }
        confirmLabel={selected.isActive ? "Deactivate" : "Activate"}
        variant={selected.isActive ? "danger" : "primary"}
      />

      {/* ── Delete course confirm ─────────────────────────────────── */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        loading={mutating}
        title="Delete Course"
        message={`Are you sure you want to delete "${selected.name}"? This will soft delete the record.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </PageWrapper>
  );
};

export default CourseDetailPage;