"use client";

import { FeeRecord, Ownership } from "../lib/types";

/* ---------------------------------------------------------------------------
   Lease phase — BBC has exactly two actions here. Solicitors negotiate and
   sign entirely outside the platform; BBC is not a party to the lease and
   not in the signing chain, so there is no DocuSign integration and no fake
   intermediate statuses pretending to track solicitor progress.
--------------------------------------------------------------------------- */

export function LeaseStep({
  role, solicitorsInstructedOn, onInstructSolicitors, onMarkSigned,
}: {
  role: "bbc" | "provider" | "partner";
  solicitorsInstructedOn?: string;
  onInstructSolicitors: () => void;
  onMarkSigned: () => void;
}) {
  if (!solicitorsInstructedOn) {
    return (
      <div className="modal-section">
        <h3>Lease</h3>
        {role === "bbc" ? (
          <>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
              Compliance is confirmed. Instruct both parties to engage solicitors so the lease can be drafted from the agreed heads of terms.
            </p>
            <button className="primary" onClick={onInstructSolicitors}>Instruct solicitors</button>
          </>
        ) : (
          <p style={{ fontSize: 12, color: "var(--muted)" }}>Compliance confirmed. Waiting on BrightBridge to instruct solicitors.</p>
        )}
      </div>
    );
  }

  return (
    <div className="modal-section">
      <h3>Lease</h3>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
        Solicitors are finalising the lease. This happens outside the platform, over email, so there is nothing further to track here until it is signed.
      </p>
      {role === "bbc" && (
        <button className="primary" onClick={onMarkSigned}>Mark lease as signed</button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Completion — the terminal state. Fee information is never shown to the
   care provider (Care Provider PRD 14.5) — they pay nothing and should not
   see BBC's commercial arrangement with the landlord or introducer.
--------------------------------------------------------------------------- */

export function CompletionSummary({
  role, ownership, rent, leaseLength, fees,
}: {
  role: "bbc" | "provider" | "partner";
  ownership: Ownership;
  rent: string; leaseLength: string;
  fees: FeeRecord;
}) {
  return (
    <div className="modal-section">
      <h3>Completed</h3>
      <p style={{ fontSize: 12, color: "var(--green)", fontWeight: 600, marginBottom: 12 }}>
        Lease signed on {fees.leaseSignedOn}: {rent} on a {leaseLength} lease.
      </p>

      {role === "provider" && (
        <p style={{ fontSize: 12, color: "var(--muted)" }}>All documents are available in the Documents section above.</p>
      )}

      {role !== "provider" && ownership.kind === "landlord" && (
        <div className="detail-grid" style={{ gridTemplateColumns: "1fr 1fr", padding: "0 0 8px" }}>
          <div><small>Placement fee</small><strong>{fees.placementFeeAmount} — {fees.placementFeeStatus}</strong></div>
          <div><small>Ongoing rental fee</small><strong>8% — {fees.rentalFeeStatus}</strong></div>
        </div>
      )}

      {role !== "provider" && ownership.kind === "introducer" && (
        <div className="detail-grid" style={{ gridTemplateColumns: "1fr 1fr", padding: "0 0 8px" }}>
          <div><small>Introduction fee</small><strong>{fees.introductionFeeAmount} — {fees.introductionFeeStatus}</strong></div>
          <div><small>Payment window</small><strong>Within 60 days of completion</strong></div>
        </div>
      )}
    </div>
  );
}
