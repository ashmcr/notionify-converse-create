import { ToastAction } from "@/components/ui/toast";

interface ToastTemplateActionProps {
  url: string;
}

export const ToastTemplateAction = ({ url }: ToastTemplateActionProps) => (
  <ToastAction onClick={() => window.open(url, '_blank')}>
    Open Template
  </ToastAction>
);