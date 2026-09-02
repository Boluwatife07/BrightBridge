"use client";

import { useState } from "react";
import { PropertyRecord, RequirementRecord, DocItem, REQUIRED_DOCS } from "../lib/types";
import { PASS_ON_REASONS } from "../lib/propertySeed";
import { propTone, docSummary, DecidePropertyPanel, MatchPanel } from "./PropertyReview";

function Status({ tone, children }: { tone: "green" | "amber" | "grey" | "red"; children: React.ReactNode }) {
  return <span className={`status ${tone}`}>{children}</span>;
}

/* ---------------------------------------------------------------------------
   Partner's own properties — every status, with re-submit after decline
--------------------------------------------------------------------------- */

export function PartnerPropertiesList({ properties, onOpen, onCreate }: {
  properties: PropertyRecord[]; onOpen: (p: PropertyRecord) => void; onCreate: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "action" | "accepted" | "declined">("all");
  const visible = properties.filter(p => p.status !== "Withdrawn");
  const filtered = visible.filter(p =>
    filter === "action" ? p.status === "Submitted" || p.documents.some(d => d.state === "Being obtained") :
    filter === "accepted" ? ["Accepted", "Matched", "Viewing requested", "Viewing confirmed"].includes(p.status) :
    filter === "declined" ? p.status === "Declined" : true);

  return (
    <div className="page-content">
      <div className="page-toolbar">
        <p>Your submissions and their status.</p>
        <button className="primary" onClick={onCreate}>＋ Submit property</button>
      </div>
      <section className="panel" style={{ marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <div className="filterbar">
          <button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>All <b>{visible.length}</b></button>
          <button className={filter === "action" ? "selected" : ""} onClick={() => setFilter("action")}>Needs action <b>{visible.filter(p => p.status === "Submitted" || p.documents.some(d => d.state === "Being obtained")).length}</b></button>
          <button className={filter === "accepted" ? "selected" : ""} onClick={() => setFilter("accepted")}>Accepted <b>{visible.filter(p => ["Accepted", "Matched", "Viewing requested", "Viewing confirmed"].includes(p.status)).length}</b></button>
          <button className={filter === "declined" ? "selected" : ""} onClick={() => setFilter("declined")}>Declined <b>{visible.filter(p => p.status === "Declined").length}</b></button>
        </div>
      </section>
      <section className="panel" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: "none" }}>
        <div className="data-table">
          <div className="table-header"><span>Property</span><span>Type</span><span>Rent</span><span>Status</span><span>Documents</span></div>
          {filtered.map(p => (
            <button className="data-row" key={p.id} onClick={() => onOpen(p)}>
              <span><b>{p.name || "Untitled draft"}</b><small>{p.id} · {p.area}{p.matchedReqId ? ` · ${p.matchedReqId}` : ""}</small></span>
              <span>{p.propertyType || "—"}</span>
              <span>{p.rent || "—"}</span>
              <span><Status tone={propTone(p.status)}>{p.status}</Status></span>
              <span>{docSummary(p.documents)}　→</span>
            </button>
          ))}
          {filtered.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing in this filter. Submit a property to get started.</div>}
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Provider's matched properties — Stage 3 shows properties BBC has matched.
   Later stages add viewing/offer/etc statuses to this same list.
--------------------------------------------------------------------------- */

export function ProviderPropertiesList({ properties, requirements, onOpen }: {
  properties: PropertyRecord[]; requirements: RequirementRecord[]; onOpen: (p: PropertyRecord) => void;
}) {
  const matched = properties.filter(p => ["Matched", "Viewing requested", "Viewing confirmed"].includes(p.status));
  const reqTitle = (id: string | null) => requirements.find(r => r.id === id)?.title;

  return (
    <div className="page-content">
      <div className="page-toolbar"><p>Properties BrightBridge has matched to your requirements.</p></div>
      <div className="property-cards">
        {matched.map(p => (
          <article key={p.id} onClick={() => onOpen(p)}>
            <div className="property-image"><span>{docSummary(p.documents)}</span><div>⌂</div></div>
            <div className="card-content">
              <div><Status tone={propTone(p.status)}>{p.status}</Status><small>{p.id}</small></div>
              <h3>{p.area}</h3>
              <p>{p.propertyType}</p>
              {p.matchedReqId && <p style={{ marginTop: 6, color: "var(--purple)", fontWeight: 700 }}>For {p.matchedReqId}{reqTitle(p.matchedReqId) ? ` · ${reqTitle(p.matchedReqId)}` : ""}</p>}
              <div className="property-meta"><span><b>{p.bedrooms}</b> beds</span><span><b>{p.bathrooms}</b> baths</span><span><b>{p.rent}</b></span></div>
              <button className="secondary">View property →</button>
            </div>
          </article>
        ))}
        {matched.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing matched yet. Post a requirement and BrightBridge will notify you the moment a property lands.</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Shared detail modal — role-aware content, one modal for all three roles
--------------------------------------------------------------------------- */

export function PropertyDetailModal({
  role, property, requirements, isOwnProperty, onClose, onEdit, onDecide, onMatch, onPassOn, onRequestDoc, onRequestViewing,
}: {
  role: "bbc" | "partner" | "provider";
  property: PropertyRecord;
  requirements: RequirementRecord[];
  isOwnProperty: boolean; // for partner role: is this actually theirs?
  onClose: () => void;
  onEdit?: () => void;
  onDecide?: (decision: "Accepted" | "Declined", reason: string) => void;
  onMatch?: (reqId: string) => void;
  onPassOn?: (reason: string) => void;
  onRequestDoc?: (label: string) => void;
  onRequestViewing?: (message: string) => void;
  }) {
  const p = property;
  const [passingOn, setPassingOn] = useState(false);
  const [passReason, setPassReason] = useState("");
  const [requestingDoc, setRequestingDoc] = useState(false);
  const [docLabel, setDocLabel] = useState("");
  const [requestingViewing, setRequestingViewing] = useState(false);
  const [viewingMessage, setViewingMessage] = useState("");

  const canEditListing = role === "partner" && isOwnProperty && (p.status === "Draft" || p.status === "Declined");

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" style={{ width: "min(760px,100%)" }} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{p.id} · Property</h2>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {canEditListing && <button title="Edit" onClick={onEdit} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer" }}>✎</button>}
            <button className="icon-button" onClick={onClose}>×</button>
          </div>
        </div>

        {role === "partner" && isOwnProperty && p.status === "Declined" && (
          <div style={{ margin: "16px 24px 0", padding: "14px 16px", borderRadius: 10, background: "#fdeceb", fontSize: 12, lineHeight: 1.6 }}>
            <strong style={{ display: "block", marginBottom: 4 }}>BrightBridge declined this property</strong>
            {p.declineReason || "No reason given."}
            <div style={{ marginTop: 10 }}><button className="secondary" style={{ fontSize: 11 }} onClick={onEdit}>Edit and re-submit</button></div>
          </div>
        )}

        <div className="property-hero">
          <div>
            <Status tone={propTone(p.status)}>{p.status}</Status>
            <h2>{p.name || "Untitled draft"}</h2>
            <p>{p.area} · {p.bedrooms} bedrooms · {p.bathrooms} bathrooms · {p.condition || "—"} · {p.rent}{p.leaseOffer ? ` · ${p.leaseOffer}` : ""}</p>
            {p.matchedReqId && (() => {
              const mr = requirements.find(r => r.id === p.matchedReqId);
              return role === "provider" && mr
                ? <p style={{ fontSize: 12, marginTop: 4, color: "var(--purple)" }}>Matched to {mr.id}: {mr.title} · {mr.area} · {mr.bedrooms} beds · {mr.budget}</p>
                : <p style={{ fontSize: 12, marginTop: 4 }}>{role === "bbc" ? "Submitted against" : "Matched to"} {p.matchedReqId}</p>;
            })()}
          </div>
          <div className="property-art"><span style={{ fontSize: 42 }}>⌂</span></div>
        </div>

        {p.description && <div className="modal-section"><h3>About this property</h3><p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>{p.description}</p></div>}

        {role !== "provider" && (
          <div className="modal-section">
            <h3>Ownership</h3>
            <p style={{ fontSize: 12 }}>{p.ownership.kind === "landlord" ? "Submitted by the property owner." : "Submitted by an introducer, does not own this property."}</p>
          </div>
        )}

        {role === "bbc" && (
          <div className="modal-section">
            <h3>Planning and permissions</h3>
            <div className="detail-grid" style={{ padding: "14px 0" }}>
              <div><small>Mortgage</small><strong>{p.hasMortgage}</strong></div>
              <div><small>Lender consented</small><strong>{p.lenderConsented}</strong></div>
              <div><small>Leasehold</small><strong>{p.isLeasehold}</strong></div>
              <div><small>Superior lease allows subletting</small><strong>{p.superiorLeaseAllowsSubletting}</strong></div>
              <div><small>Planning use class</small><strong>{p.planningUseClass || "—"}</strong></div>
              <div><small>HMO licence</small><strong>{p.hasHmoLicence}</strong></div>
              <div><small>Article 4 / licensing aware</small><strong>{p.article4OrLicensingAware}</strong></div>
            </div>
          </div>
        )}

        {/* Documents: three different views for three different roles */}
        <div className="modal-section">
          <h3>Documents</h3>

          {role === "provider" && (() => {
            const collected = p.documents.filter(d => d.state === "On file" || d.state === "Released");
            const pending = p.documents.filter(d => d.state !== "On file" && d.state !== "Released");
            return <>
              <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>{collected.length} of {p.documents.length} collected. Full copies are released once the lease is signed.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                {p.documents.map(d => (
                  <div key={d.id} style={{ fontSize: 12, padding: "6px 0", display: "flex", alignItems: "center", gap: 6, color: (d.state === "On file" || d.state === "Released") ? "var(--ink)" : "var(--muted)" }}>
                    <span style={{ color: (d.state === "On file" || d.state === "Released") ? "var(--green)" : "var(--muted)", fontWeight: 700 }}>{(d.state === "On file" || d.state === "Released") ? "✓" : "○"}</span>
                    {d.label}
                  </div>
                ))}
              </div>
              {!requestingDoc ? (
                <button className="secondary" style={{ marginTop: 14 }} onClick={() => setRequestingDoc(true)}>Ask for more documents</button>
              ) : (
                <div style={{ marginTop: 14 }}>
                  <input value={docLabel} onChange={e => setDocLabel(e.target.value)} placeholder="e.g. Planning permission history"
                    style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px", fontSize: 12 }} />
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button className="secondary" onClick={() => { setRequestingDoc(false); setDocLabel(""); }}>Cancel</button>
                    <button className="primary" disabled={!docLabel.trim()} onClick={() => { onRequestDoc?.(docLabel.trim()); setRequestingDoc(false); setDocLabel(""); }}>Send request</button>
                  </div>
                </div>
              )}
            </>;
          })()}

          {(role === "bbc" || role === "partner") && (
            <div>
              {p.documents.map(d => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ fontWeight: 600 }}>{d.label}</span>
                    {d.askedForBy === "provider" && <span style={{ color: "var(--purple)", fontSize: 10, marginLeft: 6, fontWeight: 700 }}>asked for by the care provider</span>}
                    {d.askedForBy === "requirement" && <span style={{ color: "var(--purple)", fontSize: 10, marginLeft: 6 }}>required by {p.matchedReqId}</span>}
                    {REQUIRED_DOCS.includes(d.label as typeof REQUIRED_DOCS[number]) && d.state !== "On file" && d.state !== "Released" && (
                      <span style={{ color: "#c23b3b", fontSize: 10, marginLeft: 6, fontWeight: 700 }}>required</span>
                    )}
                  </div>
                  <Status tone={d.state === "On file" || d.state === "Released" ? "green" : d.state === "Requested" ? "amber" : "grey"}>{d.state}</Status>
                </div>
              ))}
            </div>
          )}
        </div>

        {role === "provider" && p.status === "Matched" && !passingOn && !requestingViewing && (
          <div className="form-actions">
            <button className="secondary" style={{ color: "#c23b3b" }} onClick={() => setPassingOn(true)}>Not suitable</button>
            <button className="primary" onClick={() => setRequestingViewing(true)}>Request a viewing</button>
          </div>
        )}
        {role === "provider" && requestingViewing && (
          <div className="modal-section">
            <h3>Request a viewing</h3>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>This goes directly to the property source. They will offer you dates to choose from.</p>
            <textarea value={viewingMessage} onChange={e => setViewingMessage(e.target.value)} placeholder="Optional message, e.g. who will be attending"
              style={{ width: "100%", minHeight: 70, border: "1px solid var(--line)", borderRadius: 9, padding: 12, fontSize: 12, fontFamily: "inherit" }} />
            <div className="form-actions">
              <button className="secondary" onClick={() => { setRequestingViewing(false); setViewingMessage(""); }}>Cancel</button>
              <button className="primary" onClick={() => { onRequestViewing?.(viewingMessage.trim()); setRequestingViewing(false); setViewingMessage(""); }}>Send request</button>
            </div>
          </div>
        )}
        {role === "provider" && p.status === "Viewing requested" && (
          <div className="modal-section" style={{ padding: "12px 24px" }}>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>Viewing requested. Check the Viewings tab once the property source offers dates.</p>
          </div>
        )}
        {role === "provider" && p.status === "Viewing confirmed" && (
          <div className="modal-section" style={{ padding: "12px 24px" }}>
            <p style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>Viewing confirmed. Check the Viewings tab for the date.</p>
          </div>
        )}
        {role === "partner" && p.status === "Viewing requested" && (
          <div className="modal-section" style={{ padding: "12px 24px" }}>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>A care provider wants to view this property. Offer some dates from the Viewings tab.</p>
          </div>
        )}
        {role === "partner" && p.status === "Viewing confirmed" && (
          <div className="modal-section" style={{ padding: "12px 24px" }}>
            <p style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>Viewing confirmed. Check the Viewings tab for the date.</p>
          </div>
        )}
        {role === "provider" && passingOn && (
          <div className="modal-section">
            <h3>Pass on this property</h3>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>This tells BrightBridge what to rule out next time. The property source is not told who passed.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PASS_ON_REASONS.map(r => (
                <span key={r} onClick={() => setPassReason(passReason === r ? "" : r)} style={{
                  padding: "7px 13px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                  border: `1px solid ${passReason === r ? "var(--purple)" : "var(--line)"}`,
                  background: passReason === r ? "var(--purple-soft)" : "transparent",
                  color: passReason === r ? "var(--purple)" : "var(--muted)",
                }}>{r}</span>
              ))}
            </div>
            <div className="form-actions">
              <button className="secondary" onClick={() => setPassingOn(false)}>Cancel</button>
              <button className="secondary" style={{ color: "#c23b3b" }} disabled={!passReason} onClick={() => onPassOn?.(passReason)}>Pass on this property</button>
            </div>
          </div>
        )}

        {role === "bbc" && p.passedOn.length > 0 && (
          <div className="modal-section"><h3>Passed on</h3>{p.passedOn.map((x, i) => <p key={i} style={{ fontSize: 11, color: "var(--muted)" }}>{x.reqId}: {x.reason}</p>)}</div>
        )}

        {role === "bbc" && p.status === "Submitted" && onDecide && <DecidePropertyPanel onDecide={onDecide} />}
        {role === "bbc" && p.status === "Accepted" && onMatch && <MatchPanel property={p} requirements={requirements} onMatch={onMatch} />}
      </div>
    </div>
  );
}
