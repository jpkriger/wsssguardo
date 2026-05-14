import { type ReactElement } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useTheme } from "@/hooks/use-theme";

export function Toaster(props: ToasterProps): ReactElement {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "border border-border bg-card text-card-foreground",
          title: "text-sm font-medium",
          description: "text-sm text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
