import Modal from "./Modal";

// Specialized modal for delete/destructive action confirmations
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  variant = "danger",
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onConfirm={onConfirm}
      confirmLoading={loading}
      confirmVariant={variant}
    >
      <p className="text-sm text-muted leading-relaxed">{message}</p>
    </Modal>
  );
};

export default ConfirmDialog;