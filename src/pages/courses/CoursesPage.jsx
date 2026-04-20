import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  Plus,
  Eye,
  Trash2,
  RefreshCw,
  BookOpen,
  Power,
  PowerOff,
} from "lucide-react";
import {
  fetchCourses,
  addCourse,
  removeCourse,
  deactivateCourseThunk,
  activateCourseThunk,
} from "../../features/courses/coursesSlice";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/roles";
import { formatDate } from "../../utils/formatDate";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { DeletedBadge } from "../../components/ui/StatusBadge";

const INITIAL_FORM = { name: "", shortCode: "", description: "" };

const CoursesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  usePageTitle("Courses");

  const { courses, listLoading, mutating, mutateError } = useSelector(
    (state) => state.courses
  );

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);

  const canManage = [ROLES.ROOT, ROLES.ADMIN].includes(user?.role);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name])
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Course name is required.";
    if (!form.shortCode.trim()) errs.shortCode = "Short code is required.";
    return errs;
  };

  const handleAdd = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    const result = await dispatch(
      addCourse({
        name: form.name,
        shortCode: form.shortCode,
        description: form.description || undefined,
      })
    );
    if (addCourse.fulfilled.match(result)) {
      setShowAddModal(false);
      setForm(INITIAL_FORM);
      setFormErrors({});
      navigate(`/courses/${result.payload._id}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(removeCourse(deleteTarget._id));
    setDeleteTarget(null);
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    if (toggleTarget.isActive) {
      await dispatch(deactivateCourseThunk(toggleTarget._id));
    } else {
      await dispatch(activateCourseThunk(toggleTarget._id));
    }
    setToggleTarget(null);
  };

  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.shortCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageWrapper title="Courses">
      <section aria-label="Courses management">

        {/* ── Page header ───────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-main">
              All Courses
            </h2>
            <p className="text-sm text-muted mt-0.5">
              {courses.filter((c) => !c.isDeleted).length} course
              {courses.filter((c) => !c.isDeleted).length !== 1 ? "s" : ""}{" "}
              in your workspace
            </p>
          </div>
          {canManage && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowAddModal(true)}
            >
              Add Course
            </Button>
          )}
        </header>

        {/* ── Search ───────────────────────────────────────────────── */}
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or short code..."
              className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted"
            />
            <button
              onClick={() => dispatch(fetchCourses())}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted border border-border rounded-lg hover:bg-neutral transition-colors shrink-0"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </Card>

        {/* ── Courses grid ──────────────────────────────────────────── */}
        {listLoading ? (
          <div className="flex justify-center py-32">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <BookOpen className="h-10 w-10 text-muted" />
              <p className="text-sm text-muted">
                {search
                  ? `No courses found for "${search}"`
                  : "No courses yet. Add your first course."}
              </p>
            </div>
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <li key={course._id}>
                <article
                  className={`bg-white rounded-xl border p-5 flex flex-col gap-4 transition-shadow hover:shadow-md ${
                    course.isDeleted
                      ? "border-red-200 opacity-70"
                      : course.isActive
                      ? "border-border"
                      : "border-warning/40"
                  }`}
                >
                  {/* Header */}
                  <header className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {/* Short code pill */}
                      <span className="inline-block text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-lg mb-2">
                        {course.shortCode}
                      </span>
                      <h3 className="text-base font-semibold text-text-main leading-snug">
                        {course.name}
                      </h3>
                    </div>
                    <div className="shrink-0">
                      {course.isDeleted ? (
                        <DeletedBadge />
                      ) : course.isActive ? (
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
                  </header>

                  {/* Description */}
                  {course.description ? (
                    <p className="text-xs text-muted leading-relaxed line-clamp-2">
                      {course.description}
                    </p>
                  ) : (
                    <p className="text-xs text-muted italic">
                      No description added.
                    </p>
                  )}

                  {/* Added on */}
                  <p className="text-xs text-muted">
                    Added {formatDate(course.createdAt)}
                  </p>

                  {/* Actions */}
                  <footer className="flex items-center gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => navigate(`/courses/${course._id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>

                    {canManage && !course.isDeleted && (
                      <>
                        <button
                          onClick={() => setToggleTarget(course)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            course.isActive
                              ? "text-warning border-warning/30 hover:bg-yellow-50"
                              : "text-success border-success/30 hover:bg-green-50"
                          }`}
                        >
                          {course.isActive ? (
                            <PowerOff className="h-3.5 w-3.5" />
                          ) : (
                            <Power className="h-3.5 w-3.5" />
                          )}
                          {course.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          onClick={() => setDeleteTarget(course)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-danger border border-danger/30 rounded-lg hover:bg-red-50 transition-colors ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </>
                    )}
                  </footer>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Add course modal ──────────────────────────────────────── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setForm(INITIAL_FORM);
          setFormErrors({});
        }}
        title="Add New Course"
        onConfirm={handleAdd}
        confirmLabel="Create Course"
        confirmLoading={mutating}
        size="sm"
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
            label="Course Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. NEBOSH International General Certificate"
            error={formErrors.name}
            required
          />
          <Input
            label="Short Code"
            name="shortCode"
            value={form.shortCode}
            onChange={handleChange}
            placeholder="e.g. IGC"
            error={formErrors.shortCode}
            helperText="Unique identifier — will be uppercased automatically"
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Brief description of the course..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* ── Toggle confirm ────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggle}
        loading={mutating}
        title={
          toggleTarget?.isActive ? "Deactivate Course" : "Activate Course"
        }
        message={
          toggleTarget?.isActive
            ? `Deactivating "${toggleTarget?.name}" will prevent it from being selected in new enrollments.`
            : `Activating "${toggleTarget?.name}" will make it available in enrollment forms again.`
        }
        confirmLabel={toggleTarget?.isActive ? "Deactivate" : "Activate"}
        variant={toggleTarget?.isActive ? "danger" : "primary"}
      />

      {/* ── Delete confirm ────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={mutating}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will soft delete the record.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </PageWrapper>
  );
};

export default CoursesPage;