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
  User,
  Phone,
  BookOpen,
  Briefcase,
  Users,
  Mail,
  MapPin,
  Calendar,
  Building2,
  Trash2,
  FileText,
  Upload,
  Download,
  Eye,
  File,
  GraduationCap,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import {
  fetchCandidateById,
  editCandidate,
  removeCandidate,
  clearSelected,
} from "../../features/candidates/candidatesSlice";
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
  permanentDeleteDocument,
  updateDocument,
} from "../../services/document.service";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../constants/roles";
import { formatDate } from "../../utils/formatDate";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { DeletedBadge } from "../../components/ui/StatusBadge";

// ── Read-only info row ────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="h-8 w-8 rounded-lg bg-neutral flex items-center justify-center shrink-0 mt-0.5">
      <Icon className="h-4 w-4 text-muted" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-text-main mt-0.5 break-words">
        {value || <span className="text-muted italic">Not provided</span>}
      </p>
    </div>
  </div>
);

// ── Section card ──────────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children }) => (
  <Card className="mb-6">
    <header className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border">
      <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <h3 className="text-base font-semibold text-text-main">{title}</h3>
    </header>
    {children}
  </Card>
);

// ── File icon by type ─────────────────────────────────────────────────────────
const FileIcon = ({ mimeType }) => {
  const isImage = mimeType?.startsWith("image/");
  const isPdf = mimeType === "application/pdf";
  return (
    <div
      className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isImage
        ? "bg-purple-50"
        : isPdf
          ? "bg-red-50"
          : "bg-blue-50"
        }`}
    >
      <File
        className={`h-5 w-5 ${isImage
          ? "text-purple-500"
          : isPdf
            ? "text-danger"
            : "text-accent"
          }`}
      />
    </div>
  );
};

// ── Format file size ──────────────────────────────────────────────────────────
const formatFileSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Documents Tab ─────────────────────────────────────────────────────────────
const DocumentsTab = ({ candidateId, canWrite, isRoot }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [renameTarget, setRenameTarget] = useState(null);
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [permDeleteTarget, setPermDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await getDocuments(candidateId);
      setDocuments(res.data.data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [candidateId]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "name",
        file.name.replace(/\.[^/.]+$/, "") // strip extension for display name
      );
      await uploadDocument(candidateId, formData);
      await loadDocuments();
    } catch (err) {
      setUploadError(
        err.response?.data?.message || "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !newName.trim()) return;
    try {
      await updateDocument(candidateId, renameTarget._id, {
        name: newName.trim(),
      });
      setRenameTarget(null);
      setNewName("");
      await loadDocuments();
    } catch {
      // Silent fail
    }
  };

  const handleSoftDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument(candidateId, deleteTarget._id);
      setDeleteTarget(null);
      await loadDocuments();
    } catch {
      // Silent fail
    } finally {
      setDeleting(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!permDeleteTarget) return;
    setDeleting(true);
    try {
      await permanentDeleteDocument(candidateId, permDeleteTarget._id);
      setPermDeleteTarget(null);
      await loadDocuments();
    } catch {
      // Silent fail
    } finally {
      setDeleting(false);
    }
  };

  const activeDocuments = documents.filter((d) => !d.isDeleted);
  const deletedDocuments = documents.filter((d) => d.isDeleted);

  return (
    <div>
      {/* Upload area */}
      {canWrite && (
        <div className="mb-6">
          <label
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading
              ? "border-accent bg-accent/5 cursor-not-allowed"
              : "border-border hover:border-accent hover:bg-accent/5"
              }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Spinner size="sm" />
                <p className="text-sm text-muted">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-7 w-7 text-muted" />
                <p className="text-sm text-text-main font-medium">
                  Click to upload a file
                </p>
                <p className="text-xs text-muted">
                  PDF, Word, Excel, Images — max 5MB
                </p>
              </div>
            )}
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
            />
          </label>
          {uploadError && (
            <p className="text-xs text-danger mt-2">{uploadError}</p>
          )}
        </div>
      )}

      {/* Documents list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" />
        </div>
      ) : activeDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <FileText className="h-8 w-8 text-muted" />
          <p className="text-sm text-muted italic">
            No documents uploaded yet.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {activeDocuments.map((doc) => (
            <li
              key={doc._id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-white hover:bg-neutral/40 transition-colors"
            >
              <FileIcon mimeType={doc.fileType} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main truncate">
                  {doc.name}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {formatFileSize(doc.fileSize)} ·{" "}
                  {formatDate(doc.createdAt)} ·{" "}
                  {doc.uploadedBy?.name || "Unknown"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* View */}
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                  title="View file">
                  <Eye className="h-4 w-4" />
                </a>

                {/* Download */}
                <a
                  href={doc.fileUrl}
                  download={doc.name}
                  className="p-1.5 rounded-lg text-muted hover:text-success hover:bg-green-50 transition-colors"
                  title="Download file"
                >
                  <Download className="h-4 w-4" />
                </a>

                {/* Rename */}
                {canWrite && (
                  <button
                    onClick={() => {
                      setRenameTarget(doc);
                      setNewName(doc.name);
                    }}
                    className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                    title="Rename document"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}

                {/* Delete */}
                {canWrite && (
                  <button
                    onClick={() => setDeleteTarget(doc)}
                    className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-50 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Deleted documents — root only */}
      {isRoot && deletedDocuments.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
            Deleted Documents (Root Only)
          </p>
          <ul className="space-y-2">
            {deletedDocuments.map((doc) => (
              <li
                key={doc._id}
                className="flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-red-50/50 opacity-70"
              >
                <FileIcon mimeType={doc.fileType} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-main truncate line-through">
                    {doc.name}
                  </p>
                  <p className="text-xs text-muted">
                    Deleted {formatDate(doc.deletedAt)}
                  </p>
                </div>
                <button
                  onClick={() => setPermDeleteTarget(doc)}
                  className="text-xs text-danger hover:underline shrink-0"
                >
                  Permanent Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rename modal */}
      <Modal
        isOpen={!!renameTarget}
        onClose={() => {
          setRenameTarget(null);
          setNewName("");
        }}
        title="Rename Document"
        onConfirm={handleRename}
        confirmLabel="Save Name"
        size="sm"
      >
        <Input
          label="Document Name"
          name="newName"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter new name"
        />
      </Modal>

      {/* Soft delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleSoftDelete}
        loading={deleting}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Permanent delete confirm */}
      <ConfirmDialog
        isOpen={!!permDeleteTarget}
        onClose={() => setPermDeleteTarget(null)}
        onConfirm={handlePermanentDelete}
        loading={deleting}
        title="Permanently Delete Document"
        message={`This will permanently delete "${permDeleteTarget?.name}" and remove the physical file. This cannot be undone.`}
        confirmLabel="Permanently Delete"
        variant="danger"
      />
    </div>
  );
};

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ["Profile", "Documents"];

// ── Main Page ─────────────────────────────────────────────────────────────────
const CandidateDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { selected, detailLoading, detailError, mutating } = useSelector(
    (state) => state.candidates
  );

  usePageTitle(selected ? selected.fullName : "Candidate");

  const [activeTab, setActiveTab] = useState("Profile");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    dispatch(fetchCandidateById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  useEffect(() => {
    if (selected) {
      setForm({
        fullName: selected.fullName || "",
        nameOnCertificate: selected.nameOnCertificate || "",
        dob: selected.dob ? selected.dob.split("T")[0] : "",
        email: selected.email || "",
        mobile: selected.mobile || "",
        alternativeMobile: selected.alternativeMobile || "",
        address: selected.address || "",
        qualification: selected.qualification || "",
        currentCompany: selected.currentCompany || "",
        fatherName: selected.fatherName || "",
        fatherMobile: selected.fatherMobile || "",
        fatherOccupation: selected.fatherOccupation || "",
        motherName: selected.motherName || "",
        motherMobile: selected.motherMobile || "",
        credentialEmail: selected.emailCredential?.email || "",
        credentialPassword: selected.emailCredential?.password || "",
        referredBy: selected.referredBy || "",
        notes: selected.notes || "",
      });
    }
  }, [selected]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required.";
    if (!form.mobile.trim()) errs.mobile = "Mobile number is required.";
    else if (!/^\d{10}$/.test(form.mobile.trim()))
      errs.mobile = "Enter a valid 10-digit mobile number.";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Enter a valid email address.";
    if (
      form.alternativeMobile &&
      !/^\d{10}$/.test(form.alternativeMobile.trim())
    )
      errs.alternativeMobile = "Enter a valid 10-digit number.";
    if (form.fatherMobile && !/^\d{10}$/.test(form.fatherMobile.trim()))
      errs.fatherMobile = "Enter a valid 10-digit number.";
    if (form.motherMobile && !/^\d{10}$/.test(form.motherMobile.trim()))
      errs.motherMobile = "Enter a valid 10-digit number.";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const payload = {
      fullName: form.fullName,
      nameOnCertificate: form.nameOnCertificate || undefined,
      dob: form.dob || undefined,
      email: form.email || undefined,
      mobile: form.mobile,
      alternativeMobile: form.alternativeMobile || undefined,
      address: form.address || undefined,
      qualification: form.qualification || undefined,
      currentCompany: form.currentCompany || undefined,
      fatherName: form.fatherName || undefined,
      fatherMobile: form.fatherMobile || undefined,
      fatherOccupation: form.fatherOccupation || undefined,
      motherName: form.motherName || undefined,
      motherMobile: form.motherMobile || undefined,
      emailCredential: {
        email: form.credentialEmail || undefined,
        password: form.credentialPassword || undefined,
      },
      referredBy: form.referredBy || undefined,
      notes: form.notes || undefined,
    };
    const result = await dispatch(editCandidate({ id, data: payload }));
    if (editCandidate.fulfilled.match(result)) {
      toastSuccess("Candidate updated successfully.");
      setEditMode(false);
      setErrors({});
    } else {
      toastError(result.payload);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setErrors({});
    if (selected) {
      setForm({
        fullName: selected.fullName || "",
        nameOnCertificate: selected.nameOnCertificate || "",
        dob: selected.dob ? selected.dob.split("T")[0] : "",
        email: selected.email || "",
        mobile: selected.mobile || "",
        alternativeMobile: selected.alternativeMobile || "",
        address: selected.address || "",
        qualification: selected.qualification || "",
        currentCompany: selected.currentCompany || "",
        fatherName: selected.fatherName || "",
        fatherMobile: selected.fatherMobile || "",
        fatherOccupation: selected.fatherOccupation || "",
        motherName: selected.motherName || "",
        motherMobile: selected.motherMobile || "",
        credentialEmail: selected.emailCredential?.email || "",
        credentialPassword: selected.emailCredential?.password || "",
        referredBy: selected.referredBy || "",
        notes: selected.notes || "",
      });
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(removeCandidate(id));
    if (removeCandidate.fulfilled.match(result)) {
      toastSuccess("Candidate deleted.");
      navigate("/candidates");
    } else {
      toastError("Failed to delete candidate.");
    }
  };

  if (detailLoading) {
    return (
      <PageWrapper title="Candidate">
        <div className="flex items-center justify-center py-32">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  if (detailError) {
    return (
      <PageWrapper title="Candidate">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-danger font-medium">{detailError}</p>
          <Button
            variant="secondary"
            onClick={() => navigate("/candidates")}
          >
            Back to Candidates
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (!selected) return null;

  const canEdit = user?.role !== ROLES.VIEWER && !selected.isDeleted;
  const canDelete =
    [ROLES.ROOT, ROLES.ADMIN].includes(user?.role) && !selected.isDeleted;
  const isRoot = user?.role === ROLES.ROOT;

  return (
    <PageWrapper title="Candidate Detail">
      <section aria-label="Candidate detail">

        {/* ── Page header ───────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/candidates")}
              className="p-2 rounded-lg text-muted hover:bg-white hover:text-text-main border border-border transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-text-main">
                  {selected.fullName}
                </h2>
                {selected.isDeleted && <DeletedBadge />}
              </div>
              <p className="text-sm text-muted mt-0.5">
                Added on {formatDate(selected.createdAt)} by{" "}
                {selected.createdBy?.name || "—"}
              </p>
            </div>
          </div>

          {/* Action buttons — only shown on Profile tab */}
          {activeTab === "Profile" && (
            <div className="flex items-center gap-2 flex-wrap">
              {editMode ? (
                <>
                  <Button variant="secondary" icon={X} onClick={handleCancelEdit}>
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
                  {/* Quick navigation buttons */}
                  <Button
                    variant="secondary"
                    icon={GraduationCap}
                    onClick={() =>
                      navigate(`/enrollments?candidateId=${selected._id}`)
                    }
                  >
                    Enrollments
                  </Button>

                  {canEdit && (
                    <Button
                      variant="secondary"
                      icon={GraduationCap}
                      onClick={() =>
                        navigate(`/enrollments/add?candidateId=${selected._id}`)
                      }
                    >
                      New Enrollment
                    </Button>
                  )}

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
                </>
              )}
            </div>
          )}
        </header>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <nav
          className="flex gap-1 mb-6 border-b border-border"
          aria-label="Candidate tabs"
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab
                ? "text-accent border-b-2 border-accent bg-white"
                : "text-muted hover:text-text-main hover:bg-neutral"
                }`}
            >
              {tab === "Documents" ? (
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Documents
                </span>
              ) : (
                tab
              )}
            </button>
          ))}
        </nav>

        {/* ── Profile Tab ───────────────────────────────────────────── */}
        {activeTab === "Profile" && (
          <>
            {/* Personal Information */}
            <Section title="Personal Information" icon={User}>
              {editMode ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Full Name"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    error={errors.fullName}
                    required
                  />
                  <Input
                    label="Name on Certificate"
                    name="nameOnCertificate"
                    value={form.nameOnCertificate}
                    onChange={handleChange}
                  />
                  <Input
                    label="Date of Birth"
                    name="dob"
                    type="date"
                    value={form.dob}
                    onChange={handleChange}
                  />
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    error={errors.email}
                  />
                  <Input
                    label="Mobile Number"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    error={errors.mobile}
                    required
                  />
                  <Input
                    label="Alternative Mobile"
                    name="alternativeMobile"
                    value={form.alternativeMobile}
                    onChange={handleChange}
                    error={errors.alternativeMobile}
                  />
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-1">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 text-sm text-text-main border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted resize-none"
                    />
                  </div>
                  <Input
                    label="Referred By"
                    name="referredBy"
                    value={form.referredBy}
                    onChange={handleChange}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoRow icon={User} label="Full Name" value={selected.fullName} />
                  <InfoRow
                    icon={User}
                    label="Name on Certificate"
                    value={selected.nameOnCertificate}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Date of Birth"
                    value={formatDate(selected.dob)}
                  />
                  <InfoRow icon={Mail} label="Email Address" value={selected.email} />
                  <InfoRow icon={Phone} label="Mobile" value={selected.mobile} />
                  <InfoRow
                    icon={Phone}
                    label="Alternative Mobile"
                    value={selected.alternativeMobile}
                  />
                  <InfoRow icon={MapPin} label="Address" value={selected.address} />
                  <InfoRow
                    icon={User}
                    label="Referred By"
                    value={selected.referredBy}
                  />
                </div>
              )}
            </Section>

            {/* Qualification & Employment */}
            <Section title="Qualification & Employment" icon={BookOpen}>
              {editMode ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Qualification"
                    name="qualification"
                    value={form.qualification}
                    onChange={handleChange}
                  />
                  <Input
                    label="Current Company"
                    name="currentCompany"
                    value={form.currentCompany}
                    onChange={handleChange}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoRow
                    icon={BookOpen}
                    label="Qualification"
                    value={selected.qualification}
                  />
                  <InfoRow
                    icon={Building2}
                    label="Current Company"
                    value={selected.currentCompany}
                  />
                </div>
              )}
            </Section>

            {/* Family Information */}
            <Section title="Family Information" icon={Users}>
              {editMode ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Father's Name"
                    name="fatherName"
                    value={form.fatherName}
                    onChange={handleChange}
                  />
                  <Input
                    label="Father's Mobile"
                    name="fatherMobile"
                    value={form.fatherMobile}
                    onChange={handleChange}
                    error={errors.fatherMobile}
                  />
                  <Input
                    label="Father's Occupation"
                    name="fatherOccupation"
                    value={form.fatherOccupation}
                    onChange={handleChange}
                  />
                  <Input
                    label="Mother's Name"
                    name="motherName"
                    value={form.motherName}
                    onChange={handleChange}
                  />
                  <Input
                    label="Mother's Mobile"
                    name="motherMobile"
                    value={form.motherMobile}
                    onChange={handleChange}
                    error={errors.motherMobile}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoRow
                    icon={Users}
                    label="Father's Name"
                    value={selected.fatherName}
                  />
                  <InfoRow
                    icon={Phone}
                    label="Father's Mobile"
                    value={selected.fatherMobile}
                  />
                  <InfoRow
                    icon={Briefcase}
                    label="Father's Occupation"
                    value={selected.fatherOccupation}
                  />
                  <InfoRow
                    icon={Users}
                    label="Mother's Name"
                    value={selected.motherName}
                  />
                  <InfoRow
                    icon={Phone}
                    label="Mother's Mobile"
                    value={selected.motherMobile}
                  />
                </div>
              )}
            </Section>

            {/* Institute Portal Credentials */}
            <Section title="Institute Portal Credentials" icon={Briefcase}>
              {editMode ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Portal Email"
                    name="credentialEmail"
                    type="email"
                    value={form.credentialEmail}
                    onChange={handleChange}
                  />
                  <Input
                    label="Portal Password"
                    name="credentialPassword"
                    value={form.credentialPassword}
                    onChange={handleChange}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoRow
                    icon={Mail}
                    label="Portal Email"
                    value={selected.emailCredential?.email}
                  />
                  <InfoRow
                    icon={User}
                    label="Portal Password"
                    value={selected.emailCredential?.password}
                  />
                </div>
              )}
            </Section>

            {/* Notes */}
            <Section title="Additional Notes" icon={User}>
              {editMode ? (
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 text-sm text-text-main border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-muted resize-none"
                  placeholder="Any additional notes..."
                />
              ) : (
                <p className="text-sm text-text-main leading-relaxed">
                  {selected.notes || (
                    <span className="text-muted italic">No notes added.</span>
                  )}
                </p>
              )}
            </Section>
          </>
        )}

        {/* ── Documents Tab ─────────────────────────────────────────── */}
        {activeTab === "Documents" && (
          <Card>
            <header className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-main">
                  Documents
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Files uploaded for this candidate
                </p>
              </div>
            </header>
            <DocumentsTab
              candidateId={id}
              canWrite={canEdit}
              isRoot={isRoot}
            />
          </Card>
        )}

      </section>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        loading={mutating}
        title="Delete Candidate"
        message={`Are you sure you want to delete "${selected.fullName}"? This action will soft delete the record.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </PageWrapper>
  );
};

export default CandidateDetailPage;