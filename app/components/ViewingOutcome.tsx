"use client";

import { useState } from "react";
import { WorksItem, WorksItemOwner } from "../lib/types";
import { PASS_ON_REASONS } from "../lib/propertySeed";
import { nextId } from "../lib/types";

/* ---------------------------------------------------------------------------
   Outcome choice — shown once a confirmed viewing has taken place.
   In this prototype "has taken place" is simplified to "status is Viewing
   confirmed" rather than comparing against a real calendar date, since
   viewing dates are stored as display strings, not machine-comparable ones.
--------------------------------------------------------------------------- */

type OutcomeChoice = "none" | "not-proceeding" | "second-viewing" | "proceeding";

export function ViewingOutcomeStep({
  onNotProceeding, onSecondViewing, onProceed,
}: {
  onNotProceeding: (reason: string, note: string) => void;
  onSecondViewing: (message: string) => void;
  onProceed: (works: WorksItem[], note: string) => void;
}) {
  const [choice, setChoice] = useState<OutcomeChoice>("none");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [readyAsIs, setReadyAsIs] = useState<boolean | null>(null);
  const [items, setItems] = useState<WorksItem[]>([]);
  const [newDesc, setNewDesc] = useState("");
  const [newResp, setNewResp] = useState<WorksItemOwner>("To be negotiated");
  const [newEssential, setNewEssential] = useState(true);

  function addItem() {
    if (!newDesc.trim()) return;
    setItems(prev => [...prev, { id: nextId("WORK"), description: newDesc.trim(), responsibility: newResp, essential: newEssential, dueDate: "", status: "Outstanding" }]);
    setNewDesc(""); setNewResp("To be negotiated"); setNewEssential(true);
  }
  function removeItem(id: string) { setItems(prev => prev.filter(i => i.id !== id)); }

  if (choice === "none") {
    return (
      <div className="modal-section">
        <h3>How did the viewing go?</h3>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>This starts the next stage of the deal, or releases the property back to the pool if it is not a fit.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="secondary" style={{ textAlign: "left", color: "#c23b3b" }} onClick={() => setChoice("not-proceeding")}>Not proceeding</button>
          <button className="secondary" style={{ textAlign: "left" }} onClick={() => setChoice("second-viewing")}>Second viewing needed</button>
          <button className="primary" style={{ textAlign: "left" }} onClick={() => setChoice("proceeding")}>We want to proceed</button>
        </div>
      </div>
    );
  }

  if (choice === "not-proceeding") {
    return (
      <div className="modal-section">
        <h3>Why is this not going ahead?</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {PASS_ON_REASONS.map(r => (
            <span key={r} onClick={() => setReason(reason === r ? "" : r)} style={{
              padding: "7px 13px", borderRadius: 20, fontSize: 12, cursor: "pointer",
              border: `1px solid ${reason === r ? "var(--purple)" : "var(--line)"}`,
              background: reason === r ? "var(--purple-soft)" : "transparent",
              color: reason === r ? "var(--purple)" : "var(--muted)",
            }}>{r}</span>
          ))}
        </div>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Anything more we should know (optional)"
          style={{ width: "100%", marginTop: 12, minHeight: 60, border: "1px solid var(--line)", borderRadius: 9, padding: 10, fontSize: 12, fontFamily: "inherit" }} />
        <div className="form-actions">
          <button className="secondary" onClick={() => setChoice("none")}>Back</button>
          <button className="secondary" style={{ color: "#c23b3b" }} disabled={!reason} onClick={() => onNotProceeding(reason, note.trim())}>Confirm not proceeding</button>
        </div>
      </div>
    );
  }

  if (choice === "second-viewing") {
    return (
      <div className="modal-section">
        <h3>Who needs to come back, and why?</h3>
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="e.g. Our compliance officer needs to assess the fire safety layout"
          style={{ width: "100%", minHeight: 70, border: "1px solid var(--line)", borderRadius: 9, padding: 10, fontSize: 12, fontFamily: "inherit" }} />
        <div className="form-actions">
          <button className="secondary" onClick={() => setChoice("none")}>Back</button>
          <button className="primary" disabled={!message.trim()} onClick={() => onSecondViewing(message.trim())}>Request a second viewing</button>
        </div>
      </div>
    );
  }

  // choice === "proceeding"
  if (readyAsIs === null) {
    return (
      <div className="modal-section">
        <h3>Does the property need any work before you could lease it?</h3>
        <div className="form-actions" style={{ padding: "14px 0 0", borderTop: "none" }}>
          <button className="secondary" onClick={() => setChoice("none")}>Back</button>
          <button className="secondary" onClick={() => setReadyAsIs(true)}>No, it&apos;s ready as-is</button>
          <button className="primary" onClick={() => setReadyAsIs(false)}>Yes, I need to list some works</button>
        </div>
      </div>
    );
  }

  if (readyAsIs) {
    return (
      <div className="modal-section">
        <h3>Property is ready as-is</h3>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>No works needed. This moves straight to negotiating rent and lease length.</p>
        <div className="form-actions" style={{ padding: "0", borderTop: "none" }}>
          <button className="secondary" onClick={() => setReadyAsIs(null)}>Back</button>
          <button className="primary" onClick={() => onProceed([], "")}>Confirm and move to offer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-section">
      <h3>What needs to be done?</h3>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>List everything the property needs before it can be leased. The property source will see this before negotiating rent.</p>

      {items.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {items.map(i => (
            <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{i.description}{i.essential && <span style={{ color: "#c23b3b", fontSize: 10, marginLeft: 6, fontWeight: 700 }}>essential</span>}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>{i.responsibility}</div>
              </div>
              <button type="button" onClick={() => removeItem(i.id)} style={{ border: "none", background: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: 14, borderRadius: 10, background: "var(--surface)" }}>
        <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="e.g. Fit interlinked smoke alarms"
          style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 8, padding: "9px 11px", fontSize: 12, marginBottom: 8 }} />
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={newResp} onChange={e => setNewResp(e.target.value as WorksItemOwner)}
            style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "7px 9px", fontSize: 11 }}>
            <option>To be negotiated</option><option>Care provider</option><option>Property source</option>
          </select>
          <span onClick={() => setNewEssential(!newEssential)} style={{
            padding: "6px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer",
            border: `1px solid ${newEssential ? "var(--purple)" : "var(--line)"}`,
            background: newEssential ? "var(--purple-soft)" : "transparent",
            color: newEssential ? "var(--purple)" : "var(--muted)",
          }}>{newEssential ? "Essential" : "Preferred"}</span>
          <button type="button" className="secondary" style={{ fontSize: 11, marginLeft: "auto" }} disabled={!newDesc.trim()} onClick={addItem}>Add item</button>
        </div>
      </div>

      <div className="form-actions">
        <button className="secondary" onClick={() => setReadyAsIs(null)}>Back</button>
        <button className="primary" disabled={items.length === 0} onClick={() => onProceed(items, note.trim())}>Send schedule of works</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Read-only works list — shown to BBC and the property partner once a
   schedule has been submitted.
--------------------------------------------------------------------------- */

export function WorksListReadOnly({ items }: { items: WorksItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="modal-section">
      <h3>Schedule of works</h3>
      <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>What the care provider says the property needs before they can lease it.</p>
      {items.map(i => (
        <div key={i.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{i.description}{i.essential && <span style={{ color: "#c23b3b", fontSize: 10, marginLeft: 6, fontWeight: 700 }}>essential</span>}</div>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>{i.responsibility}</div>
        </div>
      ))}
    </div>
  );
}
