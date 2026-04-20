import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  Plus,
  Eye,
  Trash2,
  RefreshCw,
  Building2,
  Power,
  PowerOff,
} from "lucide-react";
import {
  fetchInstitutes,
  addInstitute,
  removeInstitute,
  deactivateInstituteThunk,
  activateInstituteThunk,
} from "../../features/institutes/institutesSlice";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/roles";
import { formatDate } from "../../utils/formatDate";
import { formatCurrency } from "../../utils/formatCurrency";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { DeletedBadge } from "../../components/ui/StatusBadge";

const INITIAL_FORM = {
  name: "",
  address: "",
  email: "",
  mobile: "",
  notes: "",
};

const InstitutesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  usePageTitle("Institutes");

  const { institutes, listLoading, mutating, mutateError } = useSelector(
    (state) => state.institutes
  );

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);

  const canManage = [ROLES.ROOT, ROLES.ADMIN].includes(user?.role);

  useEffect(() => {
    dispatch(fetchInstitutes());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name])
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Institute name is required.";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Enter a valid email address.";
    return errs;
  };

  const handleAdd = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    const payload = {
      name: form.name,
      address: form.address || undefined,
      email: form.email || undefined,
      mobile: form.mobile || undefined,
      notes: form.notes || undefined,
    };
    const result = await dispatch(addInstitute(payload));
    if (addInstitute.fulfilled.match(result)) {
      setShowAddModal(false);
      setForm(INITIAL_FORM);
      setFormErrors({});
      navigate(`/institutes/${result.payload._id}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(removeInstitute(deleteTarget._id));
    setDeleteTarget(null);
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    if (toggleTarget.isActive) {
      await dispatch(deactivateInstituteThunk(toggleTarget._id));
    } else {
      await dispatch(activateInstituteThunk(toggleTarget._id));
    }
    setToggleTarget(null);
  };

  // Filter institutes by search
  const filtered = institutes.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.email?.toLowerCase().includes(search.toLowerCase()) ||
    i.mobile?.includes(search)
  );

  return (
    <PageWrapper title="Institutes">
      <section aria-label="Institutes management">

        {/* ── Page header ───────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-main">
              All Institutes
            </h2>
            <p className="text-sm text-muted mt-0.5">
              {institutes.filter((i) => !i.isDeleted).length} institute
              {institutes.filter((i) => !i.isDeleted).length !== 1 ? "s" : ""}{" "}
              in your workspace
            </p>
          </div>
          {canManage && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowAddModal(true)}
            >
              Add Institute
            </Button>
          )}
        </header>

        {/* ── Search & refresh ──────────────────────────────────────── */}
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or mobile..."
              className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted"
            />
            <button
              onClick={() => dispatch(fetchInstitutes())}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted border border-border rounded-lg hover:bg-neutral transition-colors shrink-0"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </Card>

        {/* ── Institutes grid ───────────────────────────────────────── */}
        {listLoading ? (
          <div className="flex justify-center py-32">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Building2 className="h-10 w-10 text-muted" />
              <p className="text-sm text-muted">
                {search
                  ? `No institutes found for "${search}"`
                  : "No institutes yet. Add your first institute."}
              </p>
            </div>
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((institute) => (
              <li key={institute._id}>
                <article
                  className={`bg-white rounded-xl border p-5 flex flex-col gap-4 transition-shadow hover:shadow-md ${
                    institute.isDeleted
                      ? "border-red-200 opacity-70"
                      : institute.isActive
                      ? "border-border"
                      : "border-warning/40"
                  }`}
                >
                  {/* Header */}
                  <header className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-text-main truncate">
                        {institute.name}
                      </h3>
                      {institute.address && (
                        <p className="text-xs text-muted mt-0.5 truncate">
                          {institute.address}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {institute.isDeleted ? (
                        <DeletedBadge />
                      ) : institute.isActive ? (
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

                  {/* Contact info */}
                  <div className="flex flex-col gap-1.5">
                    {institute.email && (
                      <p className="text-xs text-muted truncate">
                        ✉ {institute.email}
                      </p>
                    )}
                    {institute.mobile && (
                      <p className="text-xs text-muted">
                        📞 {institute.mobile}
                      </p>
                    )}
                    <p className="text-xs text-muted">
                      👥 {institute.contacts?.length || 0} contact
                      {institute.contacts?.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Courses offered */}
                  {institute.coursesOffered?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {institute.coursesOffered.map((co) => (
                        <span
                          key={co._id}
                          className="text-xs font-medium bg-accent/10 text-accent px-2 py-0.5 rounded-full"
                        >
                          {co.courseId?.shortCode || "—"}
                          {co.fee
                            ? ` · ${formatCurrency(co.fee)}`
                            : ""}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Added on */}
                  <p className="text-xs text-muted">
                    Added {formatDate(institute.createdAt)}
                  </p>

                  {/* Actions */}
                  <footer className="flex items-center gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() =>
                        navigate(`/institutes/${institute._id}`)
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>

                    {canManage && !institute.isDeleted && (
                      <>
                        <button
                          onClick={() => setToggleTarget(institute)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            institute.isActive
                              ? "text-warning border-warning/30 hover:bg-yellow-50"
                              : "text-success border-success/30 hover:bg-green-50"
                          }`}
                          title={
                            institute.isActive ? "Deactivate" : "Activate"
                          }
                        >
                          {institute.isActive ? (
                            <PowerOff className="h-3.5 w-3.5" />
                          ) : (
                            <Power className="h-3.5 w-3.5" />
                          )}
                          {institute.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          onClick={() => setDeleteTarget(institute)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-danger border border-danger/30 rounded-lg hover:bg-red-50 transition-colors ml-auto"
                          title="Delete institute"
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

      {/* ── Add institute modal ───────────────────────────────────── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setForm(INITIAL_FORM);
          setFormErrors({});
        }}
        title="Add New Institute"
        onConfirm={handleAdd}
        confirmLabel="Create Institute"
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
            label="Institute Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. NEBOSH Training Center Kolkata"
            error={formErrors.name}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="contact@institute.com"
            error={formErrors.email}
          />
          <Input
            label="Mobile"
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            placeholder="10-digit mobile number"
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">
              Address
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Full address"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted resize-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted uppercase tracking-wide">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any notes about this institute..."
              rows={2}
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
          toggleTarget?.isActive
            ? "Deactivate Institute"
            : "Activate Institute"
        }
        message={
          toggleTarget?.isActive
            ? `Are you sure you want to deactivate "${toggleTarget?.name}"? It will no longer appear in new enrollment forms.`
            : `Are you sure you want to activate "${toggleTarget?.name}"?`
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
        title="Delete Institute"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will soft delete the record.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </PageWrapper>
  );
};

export default InstitutesPage;