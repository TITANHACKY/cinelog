"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Toast } from "@/components/ui/toast";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

export function CopyLinkButton() {
  const { message, copy, clear } = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copy(
      window.location.href,
      "Link copied. You can share it now.",
      "Unable to copy the link. Please copy the URL manually.",
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        aria-label="Copy title link"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-on-surface transition hover:bg-surface-container-high"
        onClick={() => void handleCopy()}
        title="Copy link"
        type="button"
      >
        {copied ? (
          <Check className="h-4 w-4 text-brand-primary" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>

      {message ? <Toast message={message} onDismiss={clear} /> : null}
    </>
  );
}

export default CopyLinkButton;
