import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Upload,
  Eye,
  Download,
  Edit2,
  Trash2,
  FileText,
  FolderOpen,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  fetchCandidateRequiredDocs,
  uploadRequiredDocFile,
  renameRequiredDocFile,
  deleteRequiredDocFile,
} from "../../features/candidateRequiredDoc/candidateRequiredDocSlice";
import { toastSuccess, toastError } from "../../utils/toast";
import { formatDate } from "../../utils/formatDate";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

// ── Format file size ──────────────────────────────────────────────────────────
const formatFileSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── File icon by mime type ────────────────────────────────────────────────────
const FileIcon = ({ mimeType }) => {
  const isImage = mimeType?.startsWith("image/");
  const isPdf = mimeType === "application/pdf";
  return (
    <div
      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
        isImage ? "bg-purple-50" : isPdf ? "bg-red-50" : "bg-blue-50"
      }`}
    >
      <FileText
        className={`h-4 w-4 ${
          isImage ? "text-purple-500" : isPdf ? "text-danger" : "text-accent"
        }`}
      />
    </div>
  );
};

// ── Single slot card ──────────────────────────────────────────────────────────
const SlotCard = ({ doc, candidateId, canWrite }) => {
  const dispatch = useDispatch();
  const { mutating } = useSelector((state) => state.candidateRequiredDoc);

  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [renameTarget, setRenameTarget] = useState(null);
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isFulfilled = doc.files.length > 0;

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const name = file.name.replace(/\.[^/.]+$/, "");
      const result = await dispatch(
        uploadRequiredDocFile({ candidateId, docId: doc._id, file, name })
      );
      if (uploadRequiredDocFile.fulfilled.match(result)) {
        toastSuccess("File uploaded.");
      } else {
        toastError(result.payload);
        setUploadError(result.payload || "Upload failed.");
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !newName.trim()) return;
    const result = await dispatch(
      renameRequiredDocFile({
        candidateId,
        docId: doc._id,
        fileId: renameTarget._id,
        name: newName.trim(),
      })
    );
    if (renameRequiredDocFile.fulfilled.match(result)) {
      toastSuccess("File renamed.");
      setRenameTarget(null);
      setNewName("");
    } else {
      toastError(result.payload);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(
      deleteRequiredDocFile({
        candidateId,
        docId: doc._id,
        fileId: deleteTarget._id,
      })
    );
    if (deleteRequiredDocFile.fulfilled.match(result)) {
      toastSuccess("File deleted.");
      setDeleteTarget(null);
    } else {
      toastError(result.payload);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      {/* Slot header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-3 p-4 hover:bg-neutral/40 transition-colors text-left"
      >
        {/* Fulfilled indicator */}
        {isFulfilled ? (
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
        ) : (
          <Circle className="h-5 w-5 text-muted shrink-0" />
        )}

        {/* Label + helper */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-text-main">{doc.slotLabel}</p>
            {doc.isRequired ? (
              <span className="text-xs font-medium text-danger bg-red-50 px-1.5 py-0.5 rounded">
                Required
              </span>
            ) : (
              <span className="text-xs font-medium text-muted bg-neutral border border-border px-1.5 py-0.5 rounded">
                Optional
              </span>
            )}
            {isFulfilled && (
              <span className="text-xs font-medium text-success bg-green-50 px-1.5 py-0.5 rounded">
                {doc.files.length} file{doc.files.length !== 1 ? "s" : ""} uploaded
              </span>
            )}
          </div>
          {doc.slotHelperText && (
            <p className="text-xs text-muted mt-0.5">{doc.slotHelperText}</p>
          )}
        </div>

        {/* Expand toggle */}
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted shrink-0" />
        )}
      </button>

      {/* Slot body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border">

          {/* Upload area */}
          {canWrite && (
            <div className="mt-3 mb-3">
              <label
                className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  uploading
                    ? "border-accent bg-accent/5 cursor-not-allowed"
                    : "border-border hover:border-accent hover:bg-accent/5"
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <Spinner size="sm" />
                    <p className="text-xs text-muted">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <Upload className="h-5 w-5 text-muted" />
                    <p className="text-xs text-text-main font-medium">
                      Click to upload
                    </p>
                    <p className="text-xs text-muted">PDF, Word, Images — max 5MB</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                />
              </label>
              {uploadError && (
                <p className="text-xs text-danger mt-1.5">{uploadError}</p>
              )}
            </div>
          )}

          {/* Files list */}
          {doc.files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <FolderOpen className="h-6 w-6 text-muted" />
              <p className="text-xs text-muted italic">No files uploaded yet.</p>
            </div>
          ) : (
            <ul className="space-y-2 mt-3">
              {doc.files.map((file) => (
                <li
                  key={file._id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-neutral/40 hover:bg-neutral transition-colors"
                >
                  <FileIcon mimeType={file.fileType} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-main truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {formatFileSize(file.fileSize)} ·{" "}
                      {formatDate(file.uploadedAt)} ·{" "}
                      {file.uploadedBy?.name || "Unknown"}
                    </p>
                  </div>

                  {/* File actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* View */}
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                      title="View file"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </a>

                    {/* Download */}
                     <a
                      href={file.fileUrl}
                      download={file.name}
                      className="p-1.5 rounded-lg text-muted hover:text-success hover:bg-green-50 transition-colors"
                      title="Download file"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>

                    {/* Rename */}
                    {canWrite && (
                      <button
                        onClick={() => {
                          setRenameTarget(file);
                          setNewName(file.name);
                        }}
                        className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                        title="Rename file"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Delete */}
                    {canWrite && (
                      <button
                        onClick={() => setDeleteTarget(file)}
                        className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-50 transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Rename modal */}
      <Modal
        isOpen={!!renameTarget}
        onClose={() => { setRenameTarget(null); setNewName(""); }}
        title="Rename File"
        onConfirm={handleRename}
        confirmLabel="Save Name"
        confirmLoading={mutating}
        size="sm"
      >
        <Input
          label="File Name"
          name="newName"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter new name"
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={mutating}
        title="Delete File"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

// ── Course group ──────────────────────────────────────────────────────────────
const CourseGroup = ({ courseId, courseName, shortCode, docs, candidateId, canWrite }) => {
  const fulfilled = docs.filter((d) => d.files.length > 0).length;
  const total = docs.length;

  return (
    <div className="mb-6">
      {/* Course header */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-lg">
          {shortCode}
        </span>
        <h4 className="text-sm font-semibold text-text-main">{courseName}</h4>
        <span className="text-xs text-muted ml-auto">
          {fulfilled}/{total} fulfilled
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-neutral rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-success rounded-full transition-all duration-300"
          style={{ width: total > 0 ? `${(fulfilled / total) * 100}%` : "0%" }}
        />
      </div>

      {/* Slots */}
      <div className="space-y-3">
        {docs.map((doc) => (
          <SlotCard
            key={doc._id}
            doc={doc}
            candidateId={candidateId}
            canWrite={canWrite}
          />
        ))}
      </div>
    </div>
  );
};

// ── Main RequiredDocsTab ──────────────────────────────────────────────────────
const RequiredDocsTab = ({ candidateId, canWrite }) => {
  const dispatch = useDispatch();
  const { docs, listLoading, listError } = useSelector(
    (state) => state.candidateRequiredDoc
  );

  useEffect(() => {
    dispatch(fetchCandidateRequiredDocs(candidateId));
  }, [dispatch, candidateId]);

  if (listLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="md" />
      </div>
    );
  }

  if (listError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-sm text-danger">{listError}</p>
        <button
          onClick={() => dispatch(fetchCandidateRequiredDocs(candidateId))}
          className="text-sm text-accent hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <FolderOpen className="h-10 w-10 text-muted" />
        <p className="text-sm font-medium text-text-main">
          No required documents yet
        </p>
        <p className="text-xs text-muted text-center max-w-xs">
          Required documents will appear here once the candidate is enrolled
          in a course that has a required documents template configured.
        </p>
      </div>
    );
  }

  // Group docs by courseId
  const groups = docs.reduce((acc, doc) => {
    const key = doc.courseId?._id || doc.courseId;
    if (!acc[key]) {
      acc[key] = {
        courseId: key,
        courseName: doc.courseId?.name || "Unknown Course",
        shortCode: doc.courseId?.shortCode || "—",
        docs: [],
      };
    }
    acc[key].docs.push(doc);
    return acc;
  }, {});

  return (
    <div>
      {Object.values(groups).map((group) => (
        <CourseGroup
          key={group.courseId}
          courseId={group.courseId}
          courseName={group.courseName}
          shortCode={group.shortCode}
          docs={group.docs}
          candidateId={candidateId}
          canWrite={canWrite}
        />
      ))}
    </div>
  );
};

export default RequiredDocsTab;