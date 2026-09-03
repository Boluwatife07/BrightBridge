"use client";

import { useState } from "react";
import { HeadsOfTerms } from "../lib/types";

function Status({ tone, children }: { tone: "green" | "amber" | "grey" | "red"; children: React.ReactNode }) {
  return <span className={`status ${tone}`}>{children}</span>;
}

/** Whose turn it is to act, given the current status. BBC drafts and
 *  publishes once; after that the property source and care provider
 *  negotiate the finer terms directly — same pattern as the offer stage. */
function turn(hot: HeadsOfTerms): "bbc" | "provider" | "partner" | "none" {
  if (hot.status === "Draft") return "bbc";
  if (hot.status === "Published") return "partner"; // property source responds first
  if (hot.status === "Countered") return hot.counteredBy === "partner" ? "provider" : "partner";
  return "none"; // Agreed
}

const hotTone = (s: HeadsOfTerms["status"]): "green" | "amber" | "grey" | "red" =>
  s === "Agreed" ? "green" : s === "Countered" ? "red" : s === "Published" ? "amber" : "grey";

/* ---------------------------------------------------------------------------
   BBC's drafting form — pre-filled rent/lease length come from the property,
   already set by the accepted offer. BBC fills in the rest.
--------------------------------------------------------------------------- */

export type HoTDraftFields = Omit<HeadsOfTerms, "status" | "counterNote" | "counteredBy" | "publishedOn">;

function DraftForm({ rent, leaseLength, worksSummary, onPublish }: {
  rent: string; leaseLength: string; worksSummary: string;
  onPublish: (fields: HoTDraftFields) => void;
}) {
  const [breakClause, setBreakClause] = useState("");
  const [rentReview, setRentReview] = useState("");
  const [repairsLandlord, setRepairsLandlord] = useState("Structure and exterior");
  const [repairsTenant, setRepairsTenant] = useState("Internal decoration and fixtures");
  const [alterations, setAlterations] = useState("");
  const [deposit, setDeposit] = useState("");
  const [rentFreePeriod, setRentFreePeriod] = useState("");
  const [permittedUse, setPermittedUse] = useState("Supported accommodation");
  const [sublettingRights, setSublettingRights] = useState("Provider may grant occupation to residents");

  return (
    <div className="modal-section">
      <h3>Prepare heads of terms</h3>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Rent and lease length carry forward from the agreed offer. This is the point both parties&apos; real identities are shared, so make sure the terms below are ready before publishing.</p>
      <div className="detail-grid" style={{ padding: "0 0 14px", gridTemplateColumns: "1fr 1fr" }}>
        <div><small>Rent</small><strong>{rent}</strong></div>
        <div><small>Lease length</small><strong>{leaseLength}</strong></div>
      </div>
      <div className="form" style={{ padding: 0 }}>
        <div className="field"><label>Break clause</label>
          <input value={breakClause} onChange={e => setBreakClause(e.target.value)} placeholder="e.g. Mutual break at year 5" /></div>
        <div className="field"><label>Rent review</label>
          <input value={rentReview} onChange={e => setRentReview(e.target.value)} placeholder="e.g. RPI-linked, every 3 years" /></div>
        <div className="field"><label>Repairs — landlord</label>
          <input value={repairsLandlord} onChange={e => setRepairsLandlord(e.target.value)} /></div>
        <div className="field"><label>Repairs — tenant</label>
          <input value={repairsTenant} onChange={e => setRepairsTenant(e.target.value)} /></div>
        <div className="field"><label>Deposit</label>
          <input value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="e.g. 1 month" /></div>
        <div className="field"><label>Rent-free period</label>
          <input value={rentFreePeriod} onChange={e => setRentFreePeriod(e.target.value)} placeholder="Leave blank if none" /></div>
        <div className="field full"><label>Permitted alterations</label>
          <input value={alterations} onChange={e => setAlterations(e.target.value)} placeholder="e.g. Fire doors, accessibility adaptations, alarms" /></div>
        <div className="field"><label>Permitted use</label>
          <input value={permittedUse} onChange={e => setPermittedUse(e.target.value)} /></div>
        <div className="field"><label>Subletting / occupancy rights</label>
          <input value={sublettingRights} onChange={e => setSublettingRights(e.target.value)} /></div>
        {worksSummary && (
          <div className="field full"><label>Schedule of works</label>
            <textarea value={worksSummary} readOnly style={{ background: "var(--surface)", color: "var(--muted)" }} /></div>
        )}
      </div>
      <div className="form-actions">
        <button className="primary" onClick={() => onPublish({
          rent, leaseLength, breakClause, rentReview, repairsLandlord, repairsTenant, alterations,
          worksSummary, deposit, rentFreePeriod, permittedUse, sublettingRights,
        })}>Publish heads of terms</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Read view — the full document, with identities revealed
--------------------------------------------------------------------------- */

function HoTDocument({ hot, providerName, partnerName }: { hot: HeadsOfTerms; providerName: string; partnerName: string }) {
  return (
    <>
      <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--purple-soft)", marginBottom: 14 }}>
        <p style={{ fontSize: 11, color: "var(--purple)", fontWeight: 700, margin: 0 }}>Parties</p>
        <p style={{ fontSize: 12, margin: "4px 0 0" }}>Care provider: <strong>{providerName}</strong> · Property source: <strong>{partnerName}</strong></p>
      </div>
      <div className="detail-grid" style={{ gridTemplateColumns: "1fr 1fr", padding: "0 0 14px" }}>
        <div><small>Rent</small><strong>{hot.rent}</strong></div>
        <div><small>Lease length</small><strong>{hot.leaseLength}</strong></div>
        <div><small>Break clause</small><strong>{hot.breakClause || "—"}</strong></div>
        <div><small>Rent review</small><strong>{hot.rentReview || "—"}</strong></div>
        <div><small>Repairs — landlord</small><strong>{hot.repairsLandlord || "—"}</strong></div>
        <div><small>Repairs — tenant</small><strong>{hot.repairsTenant || "—"}</strong></div>
        <div><small>Deposit</small><strong>{hot.deposit || "—"}</strong></div>
        <div><small>Rent-free period</small><strong>{hot.rentFreePeriod || "—"}</strong></div>
        <div><small>Permitted use</small><strong>{hot.permittedUse || "—"}</strong></div>
        <div><small>Subletting rights</small><strong>{hot.sublettingRights || "—"}</strong></div>
      </div>
      {hot.alterations && <p style={{ fontSize: 12, marginBottom: 8 }}><strong>Permitted alterations:</strong> {hot.alterations}</p>}
      {hot.worksSummary && <p style={{ fontSize: 12, marginBottom: 8 }}><strong>Schedule of works:</strong> {hot.worksSummary}</p>}
    </>
  );
}

/* ---------------------------------------------------------------------------
   Main step
--------------------------------------------------------------------------- */

export function HeadsOfTermsStep({
  role, hot, rent, leaseLength, worksSummary, providerName, partnerName, onPublish, onAccept, onCounter, readOnly,
}: {
  role: "bbc" | "provider" | "partner";
  hot: HeadsOfTerms | null;
  rent: string; leaseLength: string; worksSummary: string;
  providerName: string; partnerName: string;
  onPublish: (fields: HoTDraftFields) => void;
  onAccept: () => void;
  onCounter: (note: string) => void;
  readOnly?: boolean;
}) {
  const [countering, setCountering] = useState(false);
  const [note, setNote] = useState("");

  if (!hot) {
    if (role === "bbc") return <DraftForm rent={rent} leaseLength={leaseLength} worksSummary={worksSummary} onPublish={onPublish} />;
    return (
      <div className="modal-section">
        <p style={{ fontSize: 12, color: "var(--muted)" }}>Waiting on BrightBridge to prepare heads of terms.</p>
      </div>
    );
  }

  const myTurn = turn(hot) === role;

  return (
    <div className="modal-section">
      <h3>Heads of terms <Status tone={hotTone(hot.status)}>{hot.status}</Status></h3>
      <div style={{ marginTop: 12 }}>
        <HoTDocument hot={hot} providerName={providerName} partnerName={partnerName} />
      </div>

      {hot.status === "Agreed" && (
        <p style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>Terms agreed by both parties.</p>
      )}

      {hot.counterNote && hot.status === "Countered" && (
        <div style={{ padding: "10px 12px", borderRadius: 8, background: "#fdeceb", fontSize: 12, marginBottom: 12 }}>
          <strong style={{ display: "block", marginBottom: 3 }}>
            {hot.counteredBy === "partner" ? "Property source" : "Care provider"} countered
          </strong>
          {hot.counterNote}
        </div>
      )}

      {(hot.status === "Published" || hot.status === "Countered") && myTurn && !readOnly && !countering && (
        <div className="form-actions" style={{ padding: 0, borderTop: "none" }}>
          <button className="secondary" onClick={() => setCountering(true)}>Counter</button>
          <button className="primary" onClick={onAccept}>Accept</button>
        </div>
      )}
      {(hot.status === "Published" || hot.status === "Countered") && myTurn && readOnly && (
        <p style={{ fontSize: 12, color: "var(--muted)" }}>The landlord needs to respond to this.</p>
      )}

      {(hot.status === "Published" || hot.status === "Countered") && !myTurn && role !== "bbc" && (
        <p style={{ fontSize: 12, color: "var(--muted)" }}>Waiting on {turn(hot) === "provider" ? "the care provider" : "the property source"} to respond.</p>
      )}
      {(hot.status === "Published" || hot.status === "Countered") && role === "bbc" && (
        <p style={{ fontSize: 12, color: "var(--muted)" }}>Waiting on {turn(hot) === "provider" ? "the care provider" : "the property source"} to respond.</p>
      )}

      {countering && (
        <div style={{ marginTop: 10 }}>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What would you like to change?"
            style={{ width: "100%", minHeight: 70, border: "1px solid var(--line)", borderRadius: 9, padding: 10, fontSize: 12, fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="secondary" onClick={() => { setCountering(false); setNote(""); }}>Cancel</button>
            <button className="primary" disabled={!note.trim()} onClick={() => { onCounter(note.trim()); setCountering(false); setNote(""); }}>Send counter</button>
          </div>
        </div>
      )}
    </div>
  );
}
