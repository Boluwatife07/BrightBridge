"use client";

import { useState } from "react";
import {
  RequirementRecord, SERVICES, RESIDENT_GROUPS, LEASE_TERMS,
  ACCESSIBILITY_OPTIONS, FEATURE_OPTIONS, COMMON_EXTRA_DOCS, STANDARD_DOCS,
} from "../lib/types";

const PROPERTY_TYPES = [
  "Family home (2-3 bed)", "HMO (up to 6 bed)", "Larger format (7+ bed)",
  "Bungalow", "Self-contained flats",
];

function Chips({ options, selected, onToggle }: { options: readonly string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
      {options.map(o => (
        <span key={o} onClick={() => onToggle(o)} style={{
          padding: "7px 13px", borderRadius: 20, fontSize: 12, cursor: "pointer",
          border: `1px solid ${selected.includes(o) ? "var(--purple)" : "var(--line)"}`,
          background: selected.includes(o) ? "var(--purple-soft)" : "transparent",
          color: selected.includes(o) ? "var(--purple)" : "var(--muted)",
        }}>{o}</span>
      ))}
    </div>
  );
}

function toggle(list: string[], v: string): string[] {
  return list.includes(v) ? list.filter(x => x !== v) : [...list, v];
}

/** Fields the form edits. Deliberately separate from RequirementRecord so the
 *  form never has to know about id/operatorAccountId/status/matches/dates —
 *  those are set by the caller on save. */
export type RequirementFields = Pick<RequirementRecord,
  "title" | "area" | "serviceType" | "residentGroup" | "propertyType" | "bedrooms" | "bathrooms" |
  "capacity" | "budget" | "leaseMin" | "leaseMax" | "neededBy" | "accessibility" | "features" | "extraDocs" | "notes">;

export function RequirementForm({ initial, onCancel, onSubmit }: {
  initial: RequirementRecord | null;
  onCancel: () => void;
  onSubmit: (fields: RequirementFields, asDraft: boolean) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [area, setArea] = useState(initial?.area ?? "");
  const [serviceType, setServiceType] = useState(initial?.serviceType ?? "");
  const [residentGroup, setResidentGroup] = useState(initial?.residentGroup ?? "");
  const [propertyType, setPropertyType] = useState(initial?.propertyType ?? "");
  const [bedrooms, setBedrooms] = useState(initial ? String(initial.bedrooms) : "");
  const [bathrooms, setBathrooms] = useState(initial ? String(initial.bathrooms) : "");
  const [capacity, setCapacity] = useState(initial?.capacity ?? "");
  const [budget, setBudget] = useState(initial?.budget ?? "");
  const [leaseMin, setLeaseMin] = useState(initial?.leaseMin ?? "");
  const [leaseMax, setLeaseMax] = useState(initial?.leaseMax ?? "");
  const [neededBy, setNeededBy] = useState(initial?.neededBy ?? "");
  const [neededByRaw, setNeededByRaw] = useState("");
  const [accessibility, setAccessibility] = useState<string[]>(initial?.accessibility ?? []);
  const [features, setFeatures] = useState<string[]>(initial?.features ?? []);
  const [extraDocs, setExtraDocs] = useState<string[]>(initial?.extraDocs ?? []);
  const [otherDoc, setOtherDoc] = useState("");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function addOtherDoc() {
    const v = otherDoc.trim();
    if (v && !extraDocs.includes(v)) setExtraDocs([...extraDocs, v]);
    setOtherDoc("");
  }

  function fields(): RequirementFields {
    return {
      title: title.trim(), area: area.trim(), serviceType, residentGroup, propertyType,
      bedrooms: bedrooms.trim(), bathrooms: bathrooms.trim(), capacity: capacity.trim(), budget: budget.trim(),
      leaseMin, leaseMax, neededBy, accessibility, features, extraDocs, notes: notes.trim(),
    };
  }

  // Required for a live submission: title, area, service, resident group, property type, bedrooms, budget.
  const canPublish = title.trim() && area.trim() && serviceType && residentGroup && propertyType && bedrooms.trim() && budget.trim();
  // A draft only needs a title, so the provider can start jotting something down.
  const canDraft = title.trim().length > 0;

  return (
    <form onSubmit={e => { e.preventDefault(); if (canPublish) onSubmit(fields(), false); }} className="form">
      <div className="field full"><label>What do you need?</label>
        <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 6 bed supported living home" /></div>

      <div className="field"><label>Location</label>
        <input required value={area} onChange={e => setArea(e.target.value)} placeholder="Town, borough or postcode" /></div>
      <div className="field"><label>Service</label>
        <select required value={serviceType} onChange={e => setServiceType(e.target.value)}>
          <option value="">Select</option>
          {SERVICES.filter(s => s !== "Housing management (RSL)" && s !== "Local authority commissioning").map(s => <option key={s}>{s}</option>)}
        </select></div>

      <div className="field"><label>Who is it for?</label>
        <select required value={residentGroup} onChange={e => setResidentGroup(e.target.value)}>
          <option value="">Select</option>
          {RESIDENT_GROUPS.map(g => <option key={g}>{g}</option>)}
        </select></div>
      <div className="field"><label>Occupancy</label>
        <input value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 5 to 6 residents" /></div>

      <div className="field"><label>Property type</label>
        <select required value={propertyType} onChange={e => setPropertyType(e.target.value)}>
          <option value="">Select</option>
          {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
        </select></div>
      <div className="field"><label>Bedrooms</label>
        <input required type="number" min="1" value={bedrooms} onChange={e => setBedrooms(e.target.value)} placeholder="e.g. 6" /></div>

      <div className="field"><label>Bathrooms</label>
        <input type="number" min="1" value={bathrooms} onChange={e => setBathrooms(e.target.value)} placeholder="e.g. 3" /></div>
      <div className="field"><label>Monthly rent</label>
        <input required value={budget} onChange={e => setBudget(e.target.value)} placeholder="£3,600 pcm" /></div>

      <div className="field"><label>Minimum lease length</label>
        <select value={leaseMin} onChange={e => setLeaseMin(e.target.value)}>
          <option value="">Select</option>
          {LEASE_TERMS.map(t => <option key={t}>{t}</option>)}
        </select></div>
      <div className="field"><label>Maximum lease length</label>
        <select value={leaseMax} onChange={e => setLeaseMax(e.target.value)}>
          <option value="">No maximum</option>
          {LEASE_TERMS.map(t => <option key={t}>{t}</option>)}
        </select></div>

      <div className="field full"><label>Needed by</label>
        <input type="date" value={neededByRaw} onChange={e => {
          setNeededByRaw(e.target.value);
          setNeededBy(e.target.value ? new Date(e.target.value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
        }} />
      </div>

      <div className="field full"><label>Accessibility</label>
        <Chips options={ACCESSIBILITY_OPTIONS} selected={accessibility} onToggle={v => setAccessibility(toggle(accessibility, v))} /></div>

      <div className="field full"><label>Features</label>
        <Chips options={FEATURE_OPTIONS} selected={features} onToggle={v => setFeatures(toggle(features, v))} /></div>

      <div className="field full">
        <label>Documentation</label>
        <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 8px", lineHeight: 1.6 }}>BrightBridge collects these for every property as standard.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", margin: "8px 0 16px" }}>
          {STANDARD_DOCS.map(d => (
            <div key={d} style={{ fontSize: 11, color: "var(--ink)", padding: "6px 0", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "var(--purple)", fontWeight: 700 }}>✓</span>{d}
            </div>
          ))}
        </div>
        <label style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: "block" }}>Anything else you need beyond the standard set?</label>
        <Chips options={COMMON_EXTRA_DOCS} selected={extraDocs} onToggle={v => setExtraDocs(toggle(extraDocs, v))} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input value={otherDoc} onChange={e => setOtherDoc(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOtherDoc(); } }}
            placeholder="Something else you need" style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px" }} />
          <button type="button" className="secondary" onClick={addOtherDoc}>Add</button>
        </div>
        {extraDocs.filter(d => !COMMON_EXTRA_DOCS.includes(d as typeof COMMON_EXTRA_DOCS[number])).length > 0 && (
          <div className="tag-row" style={{ marginTop: 10 }}>
            {extraDocs.filter(d => !COMMON_EXTRA_DOCS.includes(d as typeof COMMON_EXTRA_DOCS[number])).map(d => (
              <span key={d} onClick={() => setExtraDocs(toggle(extraDocs, d))} style={{ cursor: "pointer" }}>{d} ×</span>
            ))}
          </div>
        )}
      </div>

      <div className="field full"><label>Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any other context that would help find the right property" /></div>

      <div className="form-actions">
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        {(!initial || initial.status === "Draft") && (
          <button type="button" className="secondary" disabled={!canDraft} style={{ opacity: canDraft ? 1 : .4 }}
            onClick={() => canDraft && onSubmit(fields(), true)}>Save as draft</button>
        )}
        <button className="primary" disabled={!canPublish} style={{ opacity: canPublish ? 1 : .4 }}>
          {initial && initial.status !== "Draft" ? "Save changes" : "Submit requirement"}
        </button>
      </div>
    </form>
  );
}
