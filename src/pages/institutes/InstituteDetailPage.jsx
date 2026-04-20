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
  Building2,
  Users,
  BookOpen,
  Power,
  PowerOff,
} from "lucide-react";
import {
  fetchInstituteById,
  editInstitute,
  removeInstitute,
  deactivateInstituteThunk,
  activateInstituteThunk,
  addContactThunk,
  updateContactThunk,
  deleteContactThunk,
  addCourseOfferedThunk,
  updateCourseOfferedThunk,
  deleteCourseOfferedThunk,
  clearSelected,
} from "../../features/institutes/institutesSlice";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/roles";
import { formatCurrency } from "../../utils/formatCurrency";
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
import api from "../../config/axios";

// ── Info row ──────────────────────────────────────────────────────────────────
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

// ── Section ───────────────────────────────────────────────────────────────────
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

const InstituteDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { selected, detailLoading, detailError, mutating } = useSelector(
    (state) => state.institutes
  );

  usePageTitle(selected ? selected.name : "Institute");

  const canManage = [ROLES.ROOT, ROLES.ADMIN].includes(user?.role);

  // Edit core details
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showToggleDialog, setShowToggleDialog] = useState(false);

  // Contact modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    mobile: "",
    email: "",
    role: "",
  });
  const [deleteContactTarget, setDeleteContactTarget] = useState(null);

  // Course offered modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    courseId: "",
    fee: "",
    notes: "",
  });
  const [deleteCourseTarget, setDeleteCourseTarget] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);

  useEffect(() => {
    dispatch(fetchInstituteById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  useEffect(() => {
    if (selected) {
      setForm({
        name: selected.name || "",
        address: selected.address || "",
        email: selected.email || "",
        mobile: selected.mobile || "",
        notes: selected.notes || "",
      });
    }
  }, [selected]);

  // Load available courses for the course offered modal
  useEffect(() => {
    if (showCourseModal) {
      api
        .get("/courses")
        .then((res) =>
          setAvailableCourses(
            res.data.data.filter((c) => c.isActive && !c.isDeleted)
          )
        )
        .catch(() => { });
    }
  }, [showCourseModal]);

  // Pre-fill contact form
  useEffect(() => {
    if (editingContact) {
      setContactForm({
        name: editingContact.name || "",
        mobile: editingContact.mobile || "",
        email: editingContact.email || "",
        role: editingContact.role || "",
      });
    } else {
      setContactForm({ name: "", mobile: "", email: "", role: "" });
    }
  }, [editingContact]);

  // Pre-fill course form
  useEffect(() => {
    if (editingCourse) {
      setCourseForm({
        courseId: editingCourse.courseId?._id || "",
        fee: editingCourse.fee ?? "",
        notes: editingCourse.notes || "",
      });
    } else {
      setCourseForm({ courseId: "", fee: "", notes: "" });
    }
  }, [editingCourse]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const result = await dispatch(
      editInstitute({
        id,
        data: {
          name: form.name,
          address: form.address || undefined,
          email: form.email || undefined,
          mobile: form.mobile || undefined,
          notes: form.notes || undefined,
        },
      })
    );
    if (editInstitute.fulfilled.match(result)) {
      toastSuccess("Institute updated successfully.");
      setEditMode(false);
    } else {
      toastError(result.payload);
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(removeInstitute(id));
    if (removeInstitute.fulfilled.match(result)) {
      toastSuccess("Institute deleted.");
      navigate("/institutes");
    }
  };



  const handleToggle = async () => {
    if (selected?.isActive) {
      await dispatch(deactivateInstituteThunk(id));
      toastSuccess("Institute deactivated.");
    } else {
      await dispatch(activateInstituteThunk(id));
      toastSuccess("Institute activated.");
    }
    setShowToggleDialog(false);
  };

  // ── Contact handlers ────────────────────────────────────────────────────────
  const handleContactSubmit = async () => {
    if (!contactForm.name.trim()) return;
    let result;
    if (editingContact) {
      result = await dispatch(
        updateContactThunk({
          id,
          contactId: editingContact._id,
          data: contactForm,
        })
      );
    } else {
      result = await dispatch(addContactThunk({ id, data: contactForm }));
    }

    if (
      addContactThunk.fulfilled.match(result) ||
      updateContactThunk.fulfilled.match(result)
    ) {
      toastSuccess(editingContact ? "Contact updated." : "Contact added.");
      setShowContactModal(false);
      setEditingContact(null);
    }
  };

  const handleDeleteContact = async () => {
    if (!deleteContactTarget) return;
    await dispatch(
      deleteContactThunk({ id, contactId: deleteContactTarget._id })
    );
    setDeleteContactTarget(null);
  };

  // ── Course handlers ─────────────────────────────────────────────────────────
  const handleCourseSubmit = async () => {
    if (!courseForm.courseId && !editingCourse) return;
    let result;
    if (editingCourse) {
      result = await dispatch(
        updateCourseOfferedThunk({
          id,
          courseOfferedId: editingCourse._id,
          data: {
            fee: Number(courseForm.fee) || 0,
            notes: courseForm.notes || undefined,
          },
        })
      );
    } else {
      result = await dispatch(
        addCourseOfferedThunk({
          id,
          data: {
            courseId: courseForm.courseId,
            fee: Number(courseForm.fee) || 0,
            notes: courseForm.notes || undefined,
          },
        })
      );
    }


    if (
      addCourseOfferedThunk.fulfilled.match(result) ||
      updateCourseOfferedThunk.fulfilled.match(result)
    ) {
      toastSuccess(editingCourse ? "Course updated." : "Course added.");
      setShowCourseModal(false);
      setEditingCourse(null);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteCourseTarget) return;
    await dispatch(
      deleteCourseOfferedThunk({
        id,
        courseOfferedId: deleteCourseTarget._id,
      })
    );
    setDeleteCourseTarget(null);
  };

  const selectClass =
    "w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white text-text-main";

  // ── Loading ───────────────────────────────────────────────────────────────
  if (detailLoading) {
    return (
      <PageWrapper title="Institute">
        <div className="flex items-center justify-center py-32">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  if (detailError) {
    return (
      <PageWrapper title="Institute">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-danger font-medium">{detailError}</p>
          <Button variant="secondary" onClick={() => navigate("/institutes")}>
            Back to Institutes
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (!selected) return null;

  return (
    <PageWrapper title="Institute Detail">
      <section aria-label="Institute detail">

        {/* ── Page header ───────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/institutes")}
              className="p-2 rounded-lg text-muted hover:bg-white hover:text-text-main border border-border transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
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

        {/* ── Core details ──────────────────────────────────────────── */}
        <Section title="Institute Information" icon={Building2}>
          {editMode ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
              />
              <Input
                label="Mobile"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
              />
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  Address
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="Name" value={selected.name} />
              <InfoRow label="Email" value={selected.email} />
              <InfoRow label="Mobile" value={selected.mobile} />
              <InfoRow label="Address" value={selected.address} />
              <InfoRow label="Notes" value={selected.notes} />
            </div>
          )}
        </Section>

        {/* ── Contact persons ───────────────────────────────────────── */}
        <Section
          title="Contact Persons"
          icon={Users}
          action={
            canManage &&
            !selected.isDeleted && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setEditingContact(null);
                  setShowContactModal(true);
                }}
              >
                Add Contact
              </Button>
            )
          }
        >
          {selected.contacts?.length === 0 ? (
            <p className="text-sm text-muted italic">
              No contacts added yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {selected.contacts.map((contact) => (
                <li
                  key={contact._id}
                  className="flex items-center justify-between py-3 gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-main">
                      {contact.name}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {[contact.role, contact.mobile, contact.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {canManage && !selected.isDeleted && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setEditingContact(contact);
                          setShowContactModal(true);
                        }}
                        className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                        aria-label="Edit contact"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteContactTarget(contact)}
                        className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-50 transition-colors"
                        aria-label="Delete contact"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* ── Courses offered ───────────────────────────────────────── */}
        <Section
          title="Courses Offered"
          icon={BookOpen}
          action={
            canManage &&
            !selected.isDeleted && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setEditingCourse(null);
                  setShowCourseModal(true);
                }}
              >
                Add Course
              </Button>
            )
          }
        >
          {selected.coursesOffered?.length === 0 ? (
            <p className="text-sm text-muted italic">
              No courses offered added yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {selected.coursesOffered.map((co) => (
                <li
                  key={co._id}
                  className="flex items-center justify-between py-3 gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-main">
                      {co.courseId?.shortCode} —{" "}
                      {co.courseId?.name || "Unknown Course"}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Fee: {co.fee ? formatCurrency(co.fee) : "Not set"}
                      {co.avgResultDays
                        ? ` · Avg result: ${co.avgResultDays} days`
                        : ""}
                      {co.notes ? ` · ${co.notes}` : ""}
                    </p>
                  </div>
                  {canManage && !selected.isDeleted && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setEditingCourse(co);
                          setShowCourseModal(true);
                        }}
                        className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                        aria-label="Edit course offered"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteCourseTarget(co)}
                        className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-50 transition-colors"
                        aria-label="Remove course offered"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

      </section>

      {/* ── Contact modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          setEditingContact(null);
        }}
        title={editingContact ? "Edit Contact" : "Add Contact Person"}
        onConfirm={handleContactSubmit}
        confirmLabel={editingContact ? "Save Changes" : "Add Contact"}
        confirmLoading={mutating}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Name"
            name="name"
            value={contactForm.name}
            onChange={(e) =>
              setContactForm((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="Contact person's name"
            required
          />
          <Input
            label="Role / Designation"
            name="role"
            value={contactForm.role}
            onChange={(e) =>
              setContactForm((p) => ({ ...p, role: e.target.value }))
            }
            placeholder="e.g. Coordinator, Manager"
          />
          <Input
            label="Mobile"
            name="mobile"
            value={contactForm.mobile}
            onChange={(e) =>
              setContactForm((p) => ({ ...p, mobile: e.target.value }))
            }
            placeholder="10-digit mobile number"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={contactForm.email}
            onChange={(e) =>
              setContactForm((p) => ({ ...p, email: e.target.value }))
            }
            placeholder="contact@example.com"
          />
        </div>
      </Modal>

      {/* ── Course offered modal ──────────────────────────────────── */}
      <Modal
        isOpen={showCourseModal}
        onClose={() => {
          setShowCourseModal(false);
          setEditingCourse(null);
        }}
        title={editingCourse ? "Edit Course Offered" : "Add Course Offered"}
        onConfirm={handleCourseSubmit}
        confirmLabel={editingCourse ? "Save Changes" : "Add Course"}
        confirmLoading={mutating}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          {!editingCourse && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted uppercase tracking-wide">
                Course <span className="text-danger">*</span>
              </label>
              <select
                value={courseForm.courseId}
                onChange={(e) =>
                  setCourseForm((p) => ({
                    ...p,
                    courseId: e.target.value,
                  }))
                }
                className={selectClass}
              >
                <option value="">— Select a course —</option>
                {availableCourses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.shortCode} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {editingCourse && (
            <div className="px-3 py-2 bg-neutral rounded-lg">
              <p className="text-sm font-medium text-text-main">
                {editingCourse.courseId?.shortCode} —{" "}
                {editingCourse.courseId?.name}
              </p>
            </div>
          )}
          <Input
            label="Fee Charged"
            name="fee"
            type="number"
            value={courseForm.fee}
            onChange={(e) =>
              setCourseForm((p) => ({ ...p, fee: e.target.value }))
            }
            placeholder="e.g. 25000"
          />
          <Input
            label="Notes"
            name="notes"
            value={courseForm.notes}
            onChange={(e) =>
              setCourseForm((p) => ({ ...p, notes: e.target.value }))
            }
            placeholder="Any notes about this course at this institute"
          />
        </div>
      </Modal>

      {/* ── Delete contact confirm ────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteContactTarget}
        onClose={() => setDeleteContactTarget(null)}
        onConfirm={handleDeleteContact}
        loading={mutating}
        title="Remove Contact"
        message={`Are you sure you want to remove "${deleteContactTarget?.name}" from this institute?`}
        confirmLabel="Remove"
        variant="danger"
      />

      {/* ── Delete course confirm ─────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteCourseTarget}
        onClose={() => setDeleteCourseTarget(null)}
        onConfirm={handleDeleteCourse}
        loading={mutating}
        title="Remove Course Offered"
        message="Are you sure you want to remove this course from the institute's offerings?"
        confirmLabel="Remove"
        variant="danger"
      />

      {/* ── Toggle confirm ────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={showToggleDialog}
        onClose={() => setShowToggleDialog(false)}
        onConfirm={handleToggle}
        loading={mutating}
        title={selected.isActive ? "Deactivate Institute" : "Activate Institute"}
        message={
          selected.isActive
            ? `Deactivating "${selected.name}" will remove it from new enrollment forms.`
            : `Activating "${selected.name}" will make it available in enrollment forms again.`
        }
        confirmLabel={selected.isActive ? "Deactivate" : "Activate"}
        variant={selected.isActive ? "danger" : "primary"}
      />

      {/* ── Delete institute confirm ──────────────────────────────── */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        loading={mutating}
        title="Delete Institute"
        message={`Are you sure you want to delete "${selected.name}"? This will soft delete the record.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </PageWrapper>
  );
};

export default InstituteDetailPage;