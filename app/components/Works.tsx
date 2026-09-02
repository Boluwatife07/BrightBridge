"use client";

import { useState } from "react";
import { WorksItem, WorksItemOwner, nextId } from "../lib/types";

function Status({ tone, children }: { tone: "green" | "amber" | "grey" | "red"; children: React.ReactNode }) {
  return <span className={`status ${tone}`}>{children}</span>;
}

/* ---------------------------------------------------------------------------
   Works checklist — only BBC marks items complete, based on confirmation
   from whichever party was responsible. Everyone else sees it read-only.
--------------------------------------------------------------------------- */

export function WorksChecklist({ role, items, onMarkComplete }: {
  role: "bbc" | "provider" | "partner";
  items: WorksItem[];
  onMarkComplete: (itemId: string) => void;
}) {
  const complete = items.filter(i => i.status === "Complete").length;
  return (
    <div className="modal-section">
      <h3>Schedule of works</h3>
      <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>{complete} of {items.length} items complete.</p>
      {items.map(i => (
        <div key={i.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{i.description}{i.essential && <span style={{ color: "#c23b3b", fontSize: 10, marginLeft: 6, fontWeight: 700 }}>essential</span>}</div>
            <div style={{ fontSize: 10, color: "var(--muted)" }}>{i.responsibility}</div>
          </div>
          {i.status === "Complete"
            ? <Status tone="green">Complete</Status>
            : role === "bbc"
              ? <button className="secondary" style={{ fontSize: 10, padding: "6px 10px" }} onClick={() => onMarkComplete(i.id)}>Mark complete</button>
              : <Status tone="amber">Outstanding</Status>}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Sign-off step — appears once every item is complete. Handles requesting
   the visit, waiting, and (for the provider) logging the outcome.
--------------------------------------------------------------------------- */

function SnaggingBuilder({ onSubmit, onCancel }: { onSubmit: (items: WorksItem[]) => void; onCancel: () => void }) {
  const [items, setItems] = useState<WorksItem[]>([]);
  const [desc, setDesc] = useState("");
  const [resp, setResp] = useState<WorksItemOwner>("Property source");

  function add() {
    if (!desc.trim()) return;
    setItems(prev => [...prev, { id: nextId("SNAG"), description: desc.trim(), responsibility: resp, essential: true, dueDate: "", status: "Outstanding" }]);
    setDesc("");
  }

  return (
    <div style={{ marginTop: 10 }}>
      {items.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {items.map(i => <div key={i.id} style={{ fontSize: 12, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>{i.description} <span style={{ color: "var(--muted)", fontSize: 10 }}>({i.responsibility})</span></div>)}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What still needs fixing?"
          style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", fontSize: 12 }} />
        <select value={resp} onChange={e => setResp(e.target.value as WorksItemOwner)} style={{ border: "1px solid var(--line)", borderRadius: 8, fontSize: 11 }}>
          <option>Property source</option><option>Care provider</option><option>To be negotiated</option>
        </select>
        <button type="button" className="secondary" style={{ fontSize: 11 }} onClick={add}>Add</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button className="secondary" onClick={onCancel}>Cancel</button>
        <button className="primary" disabled={items.length === 0} onClick={() => onSubmit(items)}>Send snagging list</button>
      </div>
    </div>
  );
}

export function SignOffStep({
  role, allComplete, hasPendingSignOff, hasConfirmedSignOff, onRequestSignOff, onApprove, onRaiseSnagging,
}: {
  role: "bbc" | "provider" | "partner";
  allComplete: boolean;
  hasPendingSignOff: boolean; // requested but not yet confirmed
  hasConfirmedSignOff: boolean; // confirmed, awaiting the provider's outcome
  onRequestSignOff: () => void;
  onApprove: () => void;
  onRaiseSnagging: (items: WorksItem[]) => void;
}) {
  const [snagging, setSnagging] = useState(false);

  if (!allComplete) return null;

  if (hasConfirmedSignOff) {
    if (role !== "provider") {
      return (
        <div className="modal-section">
          <p style={{ fontSize: 12, color: "var(--muted)" }}>Sign-off visit has taken place. Waiting on the care provider to confirm the works are complete.</p>
        </div>
      );
    }
    if (snagging) {
      return (
        <div className="modal-section">
          <h3>What still needs fixing?</h3>
          <SnaggingBuilder onSubmit={onRaiseSnagging} onCancel={() => setSnagging(false)} />
        </div>
      );
    }
    return (
      <div className="modal-section">
        <h3>How did the sign-off visit go?</h3>
        <div className="form-actions" style={{ padding: 0, borderTop: "none" }}>
          <button className="secondary" onClick={() => setSnagging(true)}>Raise snagging</button>
          <button className="primary" onClick={onApprove}>Sign off works</button>
        </div>
      </div>
    );
  }

  if (hasPendingSignOff) {
    return (
      <div className="modal-section">
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          {role === "provider" ? "Waiting on the property source to offer dates for the sign-off visit." : role === "partner" ? "Offer dates for the sign-off visit from the Viewings tab." : "Sign-off visit requested. No action needed from you."}
        </p>
      </div>
    );
  }

  return (
    <div className="modal-section">
      <p style={{ fontSize: 12, color: "var(--green)", fontWeight: 600, marginBottom: 10 }}>All works complete.</p>
      {role === "provider"
        ? <button className="primary" onClick={onRequestSignOff}>Request a sign-off visit</button>
        : <p style={{ fontSize: 12, color: "var(--muted)" }}>Waiting on the care provider to request a sign-off visit.</p>}
    </div>
  );
}
