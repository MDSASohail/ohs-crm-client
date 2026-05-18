import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Upload,
  Search,
  Trash2,
  Download,
  Eye,
  Pencil,
  Tag,
  StickyNote,
  FileText,
  FileImage,
  File,
  X,
  Plus,
  FolderOpen,
} from 'lucide-react';

import {
  fetchVaultDocuments,
  uploadVaultDocument,
  renameVaultDocument,
  updateVaultDocumentTags,
  updateVaultDocumentNote,
  deleteVaultDocument,
} from '../../features/vaultDocument/vaultDocumentSlice';

import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { toastSuccess, toastError } from '../../utils/toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const PREDEFINED_TAGS = [
  'IGC',
  'Diploma',
  'Fire and Safety',
  'SSA',
  'GIFISET',
  'IOSH',
  'OSHA',
  'General',
];

const TAG_COLORS = {
  IGC: 'bg-accent/10 text-accent border border-accent/20',
  Diploma: 'bg-success/10 text-success border border-success/20',
  'Fire and Safety': 'bg-danger/10 text-danger border border-danger/20',
  SSA: 'bg-warning/10 text-warning border border-warning/20',
  GIFISET: 'bg-primary/10 text-primary border border-primary/20',
  IOSH: 'bg-accent/10 text-accent border border-accent/20',
  OSHA: 'bg-success/10 text-success border border-success/20',
  General: 'bg-neutral text-muted border border-border',
};

const getTagColor = (tag) =>
  TAG_COLORS[tag] || 'bg-neutral text-muted border border-border';

// ─── File Icon Helper ─────────────────────────────────────────────────────────

const FileIcon = ({ fileType, className = 'w-8 h-8' }) => {
  if (fileType?.startsWith('image/'))
    return <FileImage className={`${className} text-accent`} />;
  if (fileType === 'application/pdf')
    return <FileText className={`${className} text-danger`} />;
  return <File className={`${className} text-muted`} />;
};

// ─── Format File Size ─────────────────────────────────────────────────────────

const formatFileSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function VaultPage() {
  usePageTitle('Document Vault');

  const dispatch = useDispatch();
  const { canWrite, canManage } = useAuth();
  const { items, pagination, listLoading, mutating } = useSelector(
    (s) => s.vaultDocument
  );

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  // ── Upload Modal ───────────────────────────────────────────────────────────
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadTags, setUploadTags] = useState([]);
  const [uploadNote, setUploadNote] = useState('');
  const [uploadError, setUploadError] = useState('');

  // ── Rename Modal ───────────────────────────────────────────────────────────
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameName, setRenameName] = useState('');

  // ── Tags Modal ─────────────────────────────────────────────────────────────
  const [tagsTarget, setTagsTarget] = useState(null);
  const [editTags, setEditTags] = useState([]);
  const [customTag, setCustomTag] = useState('');

  // ── Note Modal ─────────────────────────────────────────────────────────────
  const [noteTarget, setNoteTarget] = useState(null);
  const [editNote, setEditNote] = useState('');

  // ── Delete Dialog ──────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadDocuments = useCallback(() => {
    dispatch(
      fetchVaultDocuments({
        search: debouncedSearch,
        tags: activeTagFilter,
        limit: 50,
      })
    );
  }, [dispatch, debouncedSearch, activeTagFilter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // ─── Upload Handlers ───────────────────────────────────────────────────────

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    setUploadName(file.name.replace(/\.[^/.]+$/, '')); // strip extension for display name
    setUploadError('');
  };

  const handleUploadTagToggle = (tag) => {
    setUploadTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      setUploadError('Please select a file.');
      return;
    }
    if (!uploadName.trim()) {
      setUploadError('Please enter a document name.');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('name', uploadName.trim());
    formData.append('tags', JSON.stringify(uploadTags));
    formData.append('note', uploadNote.trim());

    const result = await dispatch(uploadVaultDocument(formData));
    if (uploadVaultDocument.fulfilled.match(result)) {
      toastSuccess('Document uploaded successfully.');
      setUploadOpen(false);
      resetUploadForm();
    } else {
      toastError(result.payload);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadName('');
    setUploadTags([]);
    setUploadNote('');
    setUploadError('');
  };

  // ─── Rename Handlers ───────────────────────────────────────────────────────

  const openRename = (doc) => {
    setRenameTarget(doc);
    setRenameName(doc.name);
  };

  const handleRenameSubmit = async () => {
    if (!renameName.trim()) return;
    const result = await dispatch(
      renameVaultDocument({ id: renameTarget._id, name: renameName.trim() })
    );
    if (renameVaultDocument.fulfilled.match(result)) {
      toastSuccess('Document renamed.');
      setRenameTarget(null);
    } else {
      toastError(result.payload);
    }
  };

  // ─── Tags Handlers ─────────────────────────────────────────────────────────

  const openTags = (doc) => {
    setTagsTarget(doc);
    setEditTags([...doc.tags]);
    setCustomTag('');
  };

  const handleTagToggle = (tag) => {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed || editTags.includes(trimmed)) return;
    setEditTags((prev) => [...prev, trimmed]);
    setCustomTag('');
  };

  const handleTagsSubmit = async () => {
    const result = await dispatch(
      updateVaultDocumentTags({ id: tagsTarget._id, tags: editTags })
    );
    if (updateVaultDocumentTags.fulfilled.match(result)) {
      toastSuccess('Tags updated.');
      setTagsTarget(null);
    } else {
      toastError(result.payload);
    }
  };

  // ─── Note Handlers ─────────────────────────────────────────────────────────

  const openNote = (doc) => {
    setNoteTarget(doc);
    setEditNote(doc.note || '');
  };

  const handleNoteSubmit = async () => {
    const result = await dispatch(
      updateVaultDocumentNote({ id: noteTarget._id, note: editNote })
    );
    if (updateVaultDocumentNote.fulfilled.match(result)) {
      toastSuccess('Note saved.');
      setNoteTarget(null);
    } else {
      toastError(result.payload);
    }
  };

  // ─── Delete Handler ────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    const result = await dispatch(deleteVaultDocument(deleteTarget._id));
    if (deleteVaultDocument.fulfilled.match(result)) {
      toastSuccess('Document deleted.');
      setDeleteTarget(null);
    } else {
      toastError(result.payload);
    }
  };

  // ─── View / Download ───────────────────────────────────────────────────────

  const handleView = (doc) => {
    window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = (doc) => {
    const a = document.createElement('a');
    a.href = doc.fileUrl;
    a.download = doc.name;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <PageWrapper title="Document Vault">
      <section aria-label="Document Vault">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-text-main">Document Vault</h1>
            <p className="text-sm text-muted mt-0.5">
              {pagination.total ?? 0} document{pagination.total !== 1 ? 's' : ''} stored
            </p>
          </div>
          {canWrite && (
            <Button
              variant="primary"
              icon={Upload}
              onClick={() => setUploadOpen(true)}
            >
              Upload Document
            </Button>
          )}
        </header>

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <Card className="mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search by document name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white text-text-main"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-main"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tag filter dropdown */}
            <select
              value={activeTagFilter}
              onChange={(e) => setActiveTagFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white text-text-main"
            >
              <option value="">All Tags</option>
              {PREDEFINED_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Active tag filter pills */}
          {activeTagFilter && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted">Filtering by:</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(activeTagFilter)}`}
              >
                {activeTagFilter}
                <button onClick={() => setActiveTagFilter('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}
        </Card>

        {/* ── Document Grid ─────────────────────────────────────────────── */}
        {listLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" color="accent" />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="w-12 h-12 text-muted mb-3" />
              <p className="text-sm font-medium text-text-main">No documents found</p>
              <p className="text-xs text-muted mt-1">
                {search || activeTagFilter
                  ? 'Try adjusting your search or filter.'
                  : 'Upload your first document to get started.'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((doc) => (
              <DocumentCard
                key={doc._id}
                doc={doc}
                canWrite={canWrite}
                canManage={canManage}
                onView={handleView}
                onDownload={handleDownload}
                onRename={openRename}
                onTags={openTags}
                onNote={openNote}
                onDelete={(d) => setDeleteTarget(d)}
                getTagColor={getTagColor}
              />
            ))}
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          UPLOAD MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={uploadOpen}
        onClose={() => { setUploadOpen(false); resetUploadForm(); }}
        title="Upload Document"
        size="md"
      >
        <div className="space-y-4">

          {/* File drop zone */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-1.5">
              File <span className="text-danger">*</span>
            </label>
            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
              {uploadFile ? (
                <div className="flex items-center gap-3">
                  <FileIcon fileType={uploadFile.type} className="w-7 h-7" />
                  <div>
                    <p className="text-sm font-medium text-text-main">{uploadFile.name}</p>
                    <p className="text-xs text-muted">{formatFileSize(uploadFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setUploadFile(null); setUploadName(''); }}
                    className="ml-2 text-muted hover:text-danger"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted mb-2" />
                  <p className="text-sm text-text-main font-medium">Click to select a file</p>
                  <p className="text-xs text-muted mt-0.5">PDF, Word, Excel, PowerPoint, Images — max 20 MB</p>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                onChange={handleFileSelect}
              />
            </label>
            {uploadError && (
              <p className="text-xs text-danger mt-1">{uploadError}</p>
            )}
          </div>

          {/* Name */}
          <Input
            label="Document Name"
            name="uploadName"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="e.g. IGC Study Material 2026"
            required
          />

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleUploadTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    uploadTags.includes(tag)
                      ? getTagColor(tag)
                      : 'bg-white text-muted border-border hover:border-accent'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-1.5">
              Note <span className="text-muted text-xs normal-case">(optional)</span>
            </label>
            <textarea
              value={uploadNote}
              onChange={(e) => setUploadNote(e.target.value)}
              placeholder="Add a note about this document…"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white text-text-main resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => { setUploadOpen(false); resetUploadForm(); }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUploadSubmit}
              loading={mutating}
              icon={Upload}
            >
              Upload
            </Button>
          </div>
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════
          RENAME MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="Rename Document"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="New Name"
            name="renameName"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            placeholder="Enter document name"
            required
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRenameSubmit}
              loading={mutating}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════
          TAGS MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!tagsTarget}
        onClose={() => setTagsTarget(null)}
        title="Edit Tags"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-2">
              Select Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    editTags.includes(tag)
                      ? getTagColor(tag)
                      : 'bg-white text-muted border-border hover:border-accent'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Custom tag input */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-1.5">
              Custom Tag
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                placeholder="Type and press Enter"
                className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white text-text-main"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddCustomTag}
                icon={Plus}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Current tags preview */}
          {editTags.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-2">
                Applied Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {editTags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                  >
                    {tag}
                    <button onClick={() => handleTagToggle(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setTagsTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleTagsSubmit}
              loading={mutating}
            >
              Save Tags
            </Button>
          </div>
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════
          NOTE MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!noteTarget}
        onClose={() => setNoteTarget(null)}
        title="Edit Note"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-1.5">
              Note
            </label>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Add a note about this document…"
              rows={4}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white text-text-main resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setNoteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleNoteSubmit}
              loading={mutating}
            >
              Save Note
            </Button>
          </div>
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════
          DELETE CONFIRM
      ════════════════════════════════════════════════════════════════════ */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        variant="danger"
        loading={mutating}
      />
    </PageWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Document Card Sub-Component
// ─────────────────────────────────────────────────────────────────────────────

function DocumentCard({
  doc,
  canWrite,
  canManage,
  onView,
  onDownload,
  onRename,
  onTags,
  onNote,
  onDelete,
  getTagColor,
}) {
  return (
    <article className="bg-white border border-border rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">

      {/* Top row — icon + name + size */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-neutral rounded-lg">
          <FileIcon fileType={doc.fileType} className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-main truncate" title={doc.name}>
            {doc.name}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {formatFileSize(doc.fileSize)} · {formatDate(doc.createdAt)}
          </p>
          {doc.uploadedBy?.name && (
            <p className="text-xs text-muted">by {doc.uploadedBy.name}</p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 min-h-[24px]">
        {doc.tags && doc.tags.length > 0 ? (
          doc.tags.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted italic">No tags</span>
        )}
      </div>

      {/* Note preview */}
      {doc.note && (
        <div className="bg-warning/5 border border-warning/20 rounded-lg px-3 py-2">
          <p className="text-xs text-text-main line-clamp-2">{doc.note}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-border flex-wrap">
        {/* View */}
        <button
          onClick={() => onView(doc)}
          title="View"
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted hover:bg-accent/10 hover:text-accent transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </button>

        {/* Download */}
        <button
          onClick={() => onDownload(doc)}
          title="Download"
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted hover:bg-success/10 hover:text-success transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </button>

        {canWrite && (
          <>
            {/* Rename */}
            <button
              onClick={() => onRename(doc)}
              title="Rename"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted hover:bg-accent/10 hover:text-accent transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Rename
            </button>

            {/* Tags */}
            <button
              onClick={() => onTags(doc)}
              title="Edit Tags"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted hover:bg-accent/10 hover:text-accent transition-colors"
            >
              <Tag className="w-3.5 h-3.5" /> Tags
            </button>

            {/* Note */}
            <button
              onClick={() => onNote(doc)}
              title="Edit Note"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted hover:bg-warning/10 hover:text-warning transition-colors"
            >
              <StickyNote className="w-3.5 h-3.5" /> Note
            </button>
          </>
        )}

        {canManage && (
          <button
            onClick={() => onDelete(doc)}
            title="Delete"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted hover:bg-danger/10 hover:text-danger transition-colors ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        )}
      </div>
    </article>
  );
}