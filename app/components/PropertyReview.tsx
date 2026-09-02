"use client";

import { useState } from "react";
import { PropertyRecord, RequirementRecord, DocItem } from "../lib/types";
import { DECLINE_REASONS } from "../lib/propertySeed";

function Status({ tone, children }: { tone: "green" | "amber" | "grey" | "red"; children: React.ReactNode }) {
  return <span className={`status ${tone}`}>{children}</span>;
}
export const propTone = (s: string): "green" | "amber" | "grey" | "red" =>
  ["Accepted", "Matched", "Viewing confirmed", "Completed"].includes(s) ? "green" :
  s === "Declined" ? "red" :
  s === "Draft" || s === "Withdrawn" ? "grey" : "amber";

export function docSummary(documents: DocItem[]) {
  const collected = documents.filter(d => d.state === "On file" || d.state === "Released").length;
  return `${collected}/${documents.length} docs`;
}

/* ---------------------------------------------------------------------------
   BBC review queue — filterable list of every submitted property
--------------------------------------------------------------------------- */

export function PropertyReviewQueue({ properties, onOpen }: {
  properties: PropertyRecord[];
  onOpen: (p: PropertyRecord) => void;
}) {
  const [filter, setFilter] = useState<"awaiting" | "accepted" | "declined" | "all">("awaiting");
  const visible = properties.filter(p => p.status !== "Draft" && p.status !== "Withdrawn");
  const filtered = visible.filter(p =>
    filter === "awaiting" ? p.status === "Submitted" :
    filter === "accepted" ? ["Accepted", "Matched", "Viewing requested", "Viewing confirmed", "Offer", "Heads of terms", "Works", "Compliance review", "Lease"].includes(p.status) :
    filter === "declined" ? p.status === "Declined" : true);

  const counts = {
    awaiting: visible.filter(p => p.status === "Submitted").length,
    accepted: visible.filter(p => ["Accepted", "Matched", "Viewing requested", "Viewing confirmed", "Offer", "Heads of terms", "Works", "Compliance review", "Lease"].includes(p.status)).length,
    declined: visible.filter(p => p.status === "Declined").length,
    all: visible.length,
  };

  return (
    <div className="page-content">
      <div className="page-toolbar"><p>Review, accept and match every property partners submit. Requirements are not gatekept, only properties.</p></div>
      <section className="panel">
        <div className="filterbar">
          <button className={filter === "awaiting" ? "selected" : ""} onClick={() => setFilter("awaiting")}>Awaiting review <b>{counts.awaiting}</b></button>
          <button className={filter === "accepted" ? "selected" : ""} onClick={() => setFilter("accepted")}>Accepted <b>{counts.accepted}</b></button>
          <button className={filter === "declined" ? "selected" : ""} onClick={() => setFilter("declined")}>Declined <b>{counts.declined}</b></button>
          <button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>All <b>{counts.all}</b></button>
        </div>
        <div className="data-table">
          <div className="table-header"><span>Property</span><span>Type</span><span>Rent</span><span>Status</span><span>Documents</span></div>
          {filtered.map(p => (
            <button className="data-row" key={p.id} onClick={() => onOpen(p)}>
              <span><b>{p.name || "Untitled draft"}</b><small>{p.id} · {p.area}{p.matchedReqId ? ` · submitted against ${p.matchedReqId}` : ""}</small></span>
              <span>{p.propertyType || "—"}</span>
              <span>{p.rent || "—"}</span>
              <span><Status tone={propTone(p.status)}>{p.status}</Status></span>
              <span>{docSummary(p.documents)}　→</span>
            </button>
          ))}
          {filtered.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing in this filter.</div>}
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   BBC decide panel — used inside the shared detail modal
--------------------------------------------------------------------------- */

export function DecidePropertyPanel({ onDecide }: { onDecide: (decision: "Accepted" | "Declined", reason: string) => void }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  if (!declining) {
    return (
      <div className="form-actions">
        <button className="secondary" style={{ color: "#c23b3b" }} onClick={() => setDeclining(true)}>Decline</button>
        <button className="primary" onClick={() => onDecide("Accepted", "")}>Accept property</button>
      </div>
    );
  }

  return (
    <div className="modal-section">
      <h3>Why is this being declined?</h3>
      <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>The partner sees this word for word.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {DECLINE_REASONS.map(r => (
          <span key={r} onClick={() => setReason(reason === r ? "" : r)} style={{
            padding: "7px 13px", borderRadius: 20, fontSize: 12, cursor: "pointer",
            border: `1px solid ${reason === r ? "var(--purple)" : "var(--line)"}`,
            background: reason === r ? "var(--purple-soft)" : "transparent",
            color: reason === r ? "var(--purple)" : "var(--muted)",
          }}>{r}</span>
        ))}
      </div>
      <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Or write a specific reason"
        style={{ width: "100%", marginTop: 10, minHeight: 60, border: "1px solid var(--line)", borderRadius: 9, padding: 12, fontSize: 12, fontFamily: "inherit" }} />
      <div className="form-actions">
        <button className="secondary" onClick={() => setDeclining(false)}>Cancel</button>
        <button className="secondary" style={{ color: "#c23b3b" }} disabled={!reason.trim()} onClick={() => onDecide("Declined", reason.trim())}>Decline with this reason</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   BBC match-to-requirement panel
--------------------------------------------------------------------------- */

export function MatchPanel({ property, requirements, onMatch }: {
  property: PropertyRecord; requirements: RequirementRecord[]; onMatch: (reqId: string) => void;
}) {
  const live = requirements.filter(r => r.status === "Open");
  return (
    <div className="modal-section">
      <h3>Match to a requirement</h3>
      {property.matchedReqId && <p style={{ fontSize: 11, color: "var(--purple)", marginBottom: 8 }}>This property was submitted against {property.matchedReqId}.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {live.map(r => (
          <button key={r.id} className="secondary" style={{
            textAlign: "left",
            fontWeight: r.id === property.matchedReqId ? 700 : 400,
            borderColor: r.id === property.matchedReqId ? "var(--purple)" : undefined,
          }} onClick={() => onMatch(r.id)}>
            {r.id} · {r.title} · {r.area} · {r.bedrooms} beds · {r.budget}
            {r.matchedPropertyIds.length > 0 ? ` · ${r.matchedPropertyIds.length} already matched` : ""}
          </button>
        ))}
        {live.length === 0 && <p style={{ fontSize: 11, color: "var(--muted)" }}>No live requirements to match against.</p>}
      </div>
    </div>
  );
}
