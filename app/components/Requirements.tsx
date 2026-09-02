"use client";

import { useState } from "react";
import { RequirementRecord, PropertyRecord } from "../lib/types";

function Status({ tone, children }: { tone: "green" | "amber" | "grey"; children: React.ReactNode }) {
  return <span className={`status ${tone}`}>{children}</span>;
}
const reqTone = (s: string) => s === "Open" ? "green" : s === "Draft" ? "amber" : "grey";

/* ---------------------------------------------------------------------------
   List — sort by date created, matched count, or status; filter by status.
   Per Care Provider PRD 5.5.
--------------------------------------------------------------------------- */

type SortKey = "newest" | "oldest" | "matched" | "status";
type FilterKey = "all" | "live" | "draft" | "withdrawn";

export function RequirementsList({ requirements, onOpen, onCreate }: {
  requirements: RequirementRecord[];
  onOpen: (r: RequirementRecord) => void;
  onCreate: () => void;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const filtered = requirements.filter(r =>
    filter === "all" ? true :
    filter === "live" ? r.status === "Open" :
    filter === "draft" ? r.status === "Draft" :
    r.status === "Withdrawn");

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "matched") return b.matchedPropertyIds.length - a.matchedPropertyIds.length;
    if (sort === "status") return a.status.localeCompare(b.status);
    // newest/oldest: createdOn is a display string, but seed + creation order is stable enough
    // to fall back to comparing by numeric suffix of id, which increases with creation order.
    const an = parseInt(a.id.split("-").pop() || "0", 10);
    const bn = parseInt(b.id.split("-").pop() || "0", 10);
    return sort === "newest" ? bn - an : an - bn;
  });

  const counts = {
    all: requirements.length,
    live: requirements.filter(r => r.status === "Open").length,
    draft: requirements.filter(r => r.status === "Draft").length,
    withdrawn: requirements.filter(r => r.status === "Withdrawn").length,
  };

  return (
    <div className="page-content">
      <div className="page-toolbar">
        <p>Your requirements, live and draft. A requirement stays live and keeps collecting matched properties until you withdraw it.</p>
        <button className="primary" onClick={onCreate}>＋ New requirement</button>
      </div>

      <section className="panel">
        <div className="filterbar">
          <button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>All <b>{counts.all}</b></button>
          <button className={filter === "live" ? "selected" : ""} onClick={() => setFilter("live")}>Live <b>{counts.live}</b></button>
          <button className={filter === "draft" ? "selected" : ""} onClick={() => setFilter("draft")}>Drafts <b>{counts.draft}</b></button>
          <button className={filter === "withdrawn" ? "selected" : ""} onClick={() => setFilter("withdrawn")}>Withdrawn <b>{counts.withdrawn}</b></button>
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
            style={{ marginLeft: "auto", border: "1px solid var(--line)", borderRadius: 8, padding: "7px 10px", fontSize: 11, color: "var(--muted)" }}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="matched">Most matched properties</option>
            <option value="status">By status</option>
          </select>
        </div>

        <div className="data-table">
          <div className="table-header"><span>Requirement</span><span>Location</span><span>Monthly rent</span><span>Status</span><span>Properties</span></div>
          {sorted.map(r => (
            <button className="data-row" key={r.id} onClick={() => onOpen(r)}>
              <span><b>{r.title || "Untitled draft"}</b><small>{r.id} · {r.serviceType || "—"} · {r.bedrooms || "—"} beds</small></span>
              <span>{r.area || "—"}</span>
              <span>{r.budget || "—"}</span>
              <span><Status tone={reqTone(r.status)}>{r.status}</Status></span>
              <span>{r.matchedPropertyIds.length > 0 ? `${r.matchedPropertyIds.length} matched` : r.status === "Open" ? "Waiting" : "—"}　→</span>
            </button>
          ))}
          {sorted.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing in this filter.</div>}
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Detail modal — full fields, edit / withdraw / re-publish / duplicate.
--------------------------------------------------------------------------- */

export function RequirementDetail({ requirement, properties, onOpenProperty, onClose, onEdit, onWithdraw, onRePublish, onDuplicate }: {
  requirement: RequirementRecord;
  properties: PropertyRecord[];
  onOpenProperty: (p: PropertyRecord) => void;
  onClose: () => void;
  onEdit: () => void;
  onWithdraw: () => void;
  onRePublish: () => void;
  onDuplicate: () => void;
}) {
  const r = requirement;
  const matched = properties.filter(p => r.matchedPropertyIds.includes(p.id));
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" style={{ width: "min(720px,100%)" }} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head"><h2>{r.id} · Requirement</h2><button className="icon-button" onClick={onClose}>×</button></div>

        <div className="requirement-detail">
          <Status tone={reqTone(r.status)}>{r.status}</Status>
          <h2>{r.title || "Untitled draft"}</h2>
          <p>
            {r.status === "Open" && `Live since ${r.postedOn}, visible to every property partner covering ${r.area}.`}
            {r.status === "Draft" && "Saved as draft. Not visible to anyone until you submit it."}
            {r.status === "Withdrawn" && "Withdrawn. No longer visible to property partners, but you can re-publish it."}
          </p>

          <div className="detail-grid">
            <div><small>Location</small><strong>{r.area || "—"}</strong></div>
            <div><small>Monthly rent</small><strong>{r.budget || "—"}</strong></div>
            <div><small>Needed by</small><strong>{r.neededBy || "—"}</strong></div>
            <div><small>Lease length</small><strong>{r.leaseMin ? `${r.leaseMin}${r.leaseMax ? ` to ${r.leaseMax}` : " minimum"}` : "—"}</strong></div>
            <div><small>Property type</small><strong>{r.propertyType || "—"}</strong></div>
            <div><small>Bedrooms</small><strong>{r.bedrooms || "—"}</strong></div>
            <div><small>Bathrooms</small><strong>{r.bathrooms || "—"}</strong></div>
            <div><small>Occupancy</small><strong>{r.capacity || "—"}</strong></div>
            <div><small>Service</small><strong>{r.serviceType || "—"}</strong></div>
            <div><small>Who it is for</small><strong>{r.residentGroup || "—"}</strong></div>
          </div>

          {r.accessibility.length > 0 && <><h3 style={{ fontSize: 13, margin: "18px 0 8px" }}>Accessibility</h3><div className="tag-row">{r.accessibility.map(a => <span key={a}>{a}</span>)}</div></>}
          {r.features.length > 0 && <><h3 style={{ fontSize: 13, margin: "18px 0 8px" }}>Features</h3><div className="tag-row">{r.features.map(a => <span key={a}>{a}</span>)}</div></>}
          {r.extraDocs.length > 0 && <><h3 style={{ fontSize: 13, margin: "18px 0 8px" }}>Extra documents requested</h3><div className="tag-row">{r.extraDocs.map(d => <span key={d}>{d}</span>)}</div></>}
          {r.notes && <><h3 style={{ fontSize: 13, margin: "18px 0 8px" }}>Notes</h3><p style={{ fontSize: 12 }}>{r.notes}</p></>}

          <div className="modal-section" style={{ borderTop: "1px solid var(--line)", padding: "20px 0 0", marginTop: 20 }}>
            <h3>Matched properties {matched.length > 0 && `(${matched.length})`}</h3>
            {matched.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                {r.status === "Open" ? "Nothing matched yet. BrightBridge checks every submission against this brief and you will be emailed the moment one lands." : "This requirement is not live, so nothing can be matched to it."}
              </p>
            ) : (
              <>
                {matched.length > 1 && <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>Multiple properties have been matched to this brief. Review each one independently.</p>}
                {matched.map(p => (
                  <div key={p.id} onClick={() => onOpenProperty(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)", cursor: "pointer" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 8, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>⌂</div>
                    <div style={{ flex: 1 }}><strong style={{ fontSize: 12 }}>{p.area}</strong><div style={{ fontSize: 10, color: "var(--muted)" }}>{p.id} · {p.bedrooms} beds · {p.rent}</div></div>
                    <span style={{ fontSize: 11, color: "var(--purple)" }}>Open →</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="form-actions">
          {r.status !== "Withdrawn" && <button className="secondary" onClick={onEdit}>Edit</button>}
          <button className="secondary" onClick={onDuplicate}>Duplicate</button>
          {r.status === "Open" && <button className="secondary" style={{ color: "#c23b3b" }} onClick={onWithdraw}>Withdraw</button>}
          {r.status === "Withdrawn" && <button className="primary" onClick={onRePublish}>Re-publish</button>}
        </div>
      </div>
    </div>
  );
}
