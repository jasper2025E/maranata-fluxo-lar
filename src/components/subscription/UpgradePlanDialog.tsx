// UpgradePlanDialog - Not used in single-tenant system
// Component kept for backwards compatibility

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: string;
  tenantId?: string;
  onSuccess?: () => void;
}

export function UpgradePlanDialog({ open, onOpenChange }: UpgradePlanDialogProps) {
  // Single-tenant system has no subscription management
  return null;
}
