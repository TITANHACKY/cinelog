"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used inside Dialog.");
  }
  return context;
}

function Dialog({
  children,
  onOpenChange,
  open: controlledOpen,
}: {
  children: ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  function setOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({
  children,
  render,
}: {
  children?: ReactNode;
  render?: ReactElement<{ onClick?: MouseEventHandler<HTMLElement> }>;
}) {
  const { setOpen } = useDialogContext();
  const trigger = render ?? Children.only(children);

  if (!isValidElement(trigger)) {
    return null;
  }

  const typedTrigger = trigger as ReactElement<{
    onClick?: MouseEventHandler<HTMLElement>;
  }>;

  return cloneElement(typedTrigger, {
    onClick: (event) => {
      typedTrigger.props.onClick?.(event);
      if (!event.defaultPrevented) {
        setOpen(true);
      }
    },
  });
}

function DialogClose({ children, ...props }: ComponentProps<typeof Button>) {
  const { setOpen } = useDialogContext();
  return (
    <Button
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) {
          setOpen(false);
        }
      }}
    >
      {children}
    </Button>
  );
}

function DialogOverlay({
  className,
  dismissible = true,
  ...props
}: ComponentProps<"div"> & { dismissible?: boolean }) {
  const { setOpen } = useDialogContext();
  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 backdrop-blur-xs",
        className,
      )}
      onMouseDown={() => {
        if (dismissible) {
          setOpen(false);
        }
      }}
      {...props}
    />
  );
}

const dialogAlignClasses = {
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  top: "left-1/2 -translate-x-1/2",
} as const;

function DialogContent({
  align = "center",
  children,
  className,
  dismissible = true,
  showCloseButton = true,
  ...props
}: ComponentProps<"div"> & {
  align?: keyof typeof dialogAlignClasses;
  dismissible?: boolean;
  showCloseButton?: boolean;
}) {
  const { open, setOpen } = useDialogContext();

  useEffect(() => {
    if (!open || !dismissible) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dismissible, open, setOpen]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <DialogOverlay dismissible={dismissible} />
      <div
        aria-modal="true"
        className={cn(
          "fixed z-50 flex max-h-dvh w-full max-w-[calc(100%-1.5rem)] flex-col gap-4 overflow-hidden rounded-xl bg-surface-container p-4 text-sm text-on-surface shadow-xl outline-none",
          dialogAlignClasses[align],
          className,
        )}
        role="dialog"
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogClose
            aria-label="Close dialog"
            className="absolute top-2 right-2"
            size="icon-sm"
            variant="ghost"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogClose>
        )}
      </div>
    </>,
    document.body,
  );
}

function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />;
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: ComponentProps<"div"> & { showCloseButton?: boolean }) {
  return (
    <div
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t border-outline-alt bg-surface-container-low p-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && <DialogClose variant="darkFilled">Close</DialogClose>}
    </div>
  );
}

function DialogTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "font-heading text-base leading-none font-medium",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-sm text-secondary", className)} {...props} />;
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
