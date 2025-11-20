import ConfirmDialog from "../common/ConfirmDialog";

interface ConfirmArchiveDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmArchiveDialog({ isOpen, onConfirm, onCancel }: ConfirmArchiveDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Archive Post-it"
      message="Are you sure you want to archive this post-it? It will be hidden from the main list."
      confirmText="Archive"
      cancelText="Cancel"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

