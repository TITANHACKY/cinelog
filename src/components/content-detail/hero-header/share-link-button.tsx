"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { Toast } from "@/components/ui/toast";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

export function ShareLinkButton() {
  const { message, copy, clear } = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    const title = document.title || "CineLog";

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          url,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          return;
        }
      }
    }

    await copy(
      url,
      "Link copied to clipboard",
      "Unable to copy the link. Please copy the URL manually.",
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        aria-label="Share"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-on-surface transition hover:bg-surface-container-high"
        onClick={() => void handleShare()}
        title="Share"
        type="button"
      >
        {copied ? (
          <Check className="h-4 w-4 text-brand-primary" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
      </button>

      {message ? <Toast message={message} onDismiss={clear} /> : null}
    </>
  );
}

export default ShareLinkButton;
