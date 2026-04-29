import { useState } from "react";
import { Loader2, X, Phone, Mail, CheckCircle2 } from "lucide-react";

interface EliteSponsorLeadModalProps {
  open: boolean;
  onClose: () => void;
  slotId: string;
  sponsorName: string;
  categoryLabel: string;
  stateCode: string | null;
}

export default function EliteSponsorLeadModal({
  open,
  onClose,
  slotId,
  sponsorName,
  categoryLabel,
  stateCode,
}: EliteSponsorLeadModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!open) return null;

  function reset() {
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setError(null);
    setDone(false);
    setSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Please provide an email or phone number.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/elite-sponsor/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: slotId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim(),
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || "Could not send your request");
      }
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      data-testid="modal-elite-sponsor-lead"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-amber-700">
              Elite Sponsor
            </div>
            <h3
              className="text-lg font-semibold text-stone-900"
              data-testid="text-sponsor-name"
            >
              {sponsorName}
            </h3>
            <p className="text-xs text-stone-500">
              {categoryLabel}
              {stateCode ? ` · ${stateCode}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="p-1 rounded-md hover:bg-stone-100"
            aria-label="Close"
            data-testid="button-close-lead-modal"
          >
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center text-center py-6 gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            {/* Founder spec 2026-04-29: confirmation copy must match the
                user-confirmation email body exactly so the in-app moment and
                the email reinforce each other. */}
            <p
              className="text-sm text-stone-700"
              data-testid="text-lead-success"
            >
              Thanks for your request — {sponsorName} will contact you within
              24 hours.
            </p>
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="mt-2 inline-flex items-center px-4 py-2 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
              data-testid="button-close-confirmation"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Full name"
                data-testid="input-lead-name"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="you@example.com"
                data-testid="input-lead-email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="(555) 555-5555"
                data-testid="input-lead-phone"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                What do you need help with? (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full px-3 py-2 rounded-md border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Briefly describe what you're looking for..."
                data-testid="textarea-lead-message"
              />
            </div>
            {error && (
              <div
                className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2"
                data-testid="text-lead-error"
              >
                {error}
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-stone-500">
                We share your contact only with this sponsor.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                data-testid="button-submit-lead"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Send request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
