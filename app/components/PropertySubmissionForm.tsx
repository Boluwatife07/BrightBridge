"use client";

import { useState } from "react";
import { DocItem, PermissionAnswer, RequirementRecord, STANDARD_DOCS } from "../lib/types";
import { PROPERTY_TYPES } from "../lib/propertySeed";

const LEASE_OFFERS = ["3 years minimum", "5 years minimum", "3 to 5 years", "5 to 10 years", "10+ years", "Negotiable"];

/** Fields the form edits. Ownership is decided once at the top and is not
 *  part of the editable field set afterwards — re-declaring ownership on
 *  every edit would be confusing and the PRD treats it as fixed per property. */
export type PropertyFields = {
  name: string; area: string; propertyType: string; bedrooms: string; bathrooms: string;
  condition: string; rent: string; leaseOffer: string; availableFrom: string; description: string;
  hasMortgage: PermissionAnswer; lenderConsented: PermissionAnswer;
  isLeasehold: PermissionAnswer; superiorLeaseAllowsSubletting: PermissionAnswer;
  planningUseClass: string; hasHmoLicence: PermissionAnswer; article4OrLicensingAware: PermissionAnswer;
};

function PermissionRow({ label, value, onChange, sublabel }: {
  label: string; value: PermissionAnswer; onChange: (v: PermissionAnswer) => void; sublabel?: string;
}) {
  const options: PermissionAnswer[] = ["Yes", "No", "Not sure"];
  return (
    <div className="field full" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 14, marginBottom: 4 }}>
      <label>{label}</label>
      {sublabel && <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 8px" }}>{sublabel}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        {options.map(o => (
          <span key={o} onClick={() => onChange(o)} style={{
            padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
            border: `1px solid ${value === o ? "var(--purple)" : "var(--line)"}`,
            background: value === o ? "var(--purple-soft)" : "transparent",
            color: value === o ? "var(--purple)" : "var(--muted)",
          }}>{o}</span>
        ))}
      </div>
    </div>
  );
}

export function PropertySubmissionForm({
  isOwner, requirements, defaultRequirementId, existingDocuments, onCancel, onSubmit,
}: {
  isOwner: boolean;
  requirements: RequirementRecord[];
  defaultRequirementId?: string | null;
  existingDocuments?: DocItem[];
  onCancel: () => void;
  onSubmit: (fields: PropertyFields, requirementId: string | null, uploaded: string[], asDraft: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [condition, setCondition] = useState("");
  const [rent, setRent] = useState("");
  const [leaseOffer, setLeaseOffer] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [description, setDescription] = useState("");

  const [hasMortgage, setHasMortgage] = useState<PermissionAnswer>("Not sure");
  const [lenderConsented, setLenderConsented] = useState<PermissionAnswer>("Not sure");
  const [isLeasehold, setIsLeasehold] = useState<PermissionAnswer>("Not sure");
  const [superiorLeaseAllowsSubletting, setSuperiorLeaseAllowsSubletting] = useState<PermissionAnswer>("Not sure");
  const [planningUseClass, setPlanningUseClass] = useState("");
  const [hasHmoLicence, setHasHmoLicence] = useState<PermissionAnswer>("Not sure");
  const [article4OrLicensingAware, setArticle4OrLicensingAware] = useState<PermissionAnswer>("Not sure");

  const [requirementId, setRequirementId] = useState<string>(defaultRequirementId ?? "");
  const [uploaded, setUploaded] = useState<string[]>(
    (existingDocuments ?? []).filter(d => d.state === "On file" || d.state === "Released").map(d => d.label)
  );

  function toggleUpload(label: string) {
    setUploaded(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]);
  }

  function fields(): PropertyFields {
    return {
      name: name.trim(), area: area.trim(), propertyType, bedrooms: bedrooms.trim(), bathrooms: bathrooms.trim(),
      condition, rent: rent.trim(), leaseOffer, availableFrom, description: description.trim(),
      hasMortgage, lenderConsented: hasMortgage === "Yes" ? lenderConsented : "Not applicable",
      isLeasehold, superiorLeaseAllowsSubletting: isLeasehold === "Yes" ? superiorLeaseAllowsSubletting : "Not applicable",
      planningUseClass: planningUseClass.trim(), hasHmoLicence, article4OrLicensingAware,
    };
  }

  const canSubmit = name.trim() && propertyType && bedrooms.trim() && bathrooms.trim() && condition && rent.trim() && leaseOffer && availableFrom;
  const canDraft = name.trim().length > 0;

  return (
    <form onSubmit={e => { e.preventDefault(); if (canSubmit) onSubmit(fields(), requirementId || null, uploaded, false); }} className="form">
      {!isOwner && (
        <div className="field full" style={{ padding: "10px 12px", borderRadius: 8, background: "var(--purple-soft)" }}>
          <p style={{ fontSize: 11, color: "var(--purple)", margin: 0, lineHeight: 1.6 }}>
            You are submitting this as an introducer, not as the property owner. No landlord details are needed yet —
            BrightBridge will ask you to bring the landlord onto the platform once this reaches the offer stage.
          </p>
        </div>
      )}

      <div className="field full"><label>Address</label>
        <input required value={name} onChange={e => setName(e.target.value)} placeholder="Full address including postcode" /></div>

      {requirements.length > 0 && (
        <div className="field full"><label>Submit against a requirement (optional)</label>
          <select value={requirementId} onChange={e => setRequirementId(e.target.value)}>
            <option value="">Submit speculatively, not against a specific requirement</option>
            {requirements.map(r => <option key={r.id} value={r.id}>{r.id} · {r.title} · {r.area}</option>)}
          </select>
        </div>
      )}

      <div className="field"><label>Property type</label>
        <select required value={propertyType} onChange={e => setPropertyType(e.target.value)}>
          <option value="">Select</option>
          {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
        </select></div>
      <div className="field"><label>Condition</label>
        <select required value={condition} onChange={e => setCondition(e.target.value)}>
          <option value="">Select</option>
          <option>Furnished</option><option>Unfurnished</option><option>Needs refurbishment</option>
        </select></div>

      <div className="field"><label>Bedrooms</label>
        <input required type="number" min="1" value={bedrooms} onChange={e => setBedrooms(e.target.value)} placeholder="e.g. 6" /></div>
      <div className="field"><label>Bathrooms</label>
        <input required type="number" min="1" value={bathrooms} onChange={e => setBathrooms(e.target.value)} placeholder="e.g. 3" /></div>

      <div className="field"><label>Monthly rent</label>
        <input required value={rent} onChange={e => setRent(e.target.value)} placeholder="£3,450 pcm" /></div>
      <div className="field"><label>Lease length offered</label>
        <select required value={leaseOffer} onChange={e => setLeaseOffer(e.target.value)}>
          <option value="">Select</option>
          {LEASE_OFFERS.map(l => <option key={l}>{l}</option>)}
        </select></div>

      <div className="field full"><label>Available from</label>
        <input required value={availableFrom} onChange={e => setAvailableFrom(e.target.value)} placeholder="Immediate, or a date" /></div>

      <div className="field full"><label>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Layout, recent works, parking, outdoor space, anything a care provider would want to know" /></div>

      <div className="field full" style={{ borderTop: "1px solid var(--line)", paddingTop: 18, marginTop: 4 }}>
        <label style={{ fontSize: 13 }}>Planning and permissions</label>
        <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 4px" }}>&quot;Not sure&quot; is a fine answer. This helps BrightBridge flag risks early rather than at lease stage.</p>
      </div>

      <PermissionRow label="Is there a mortgage on this property?" value={hasMortgage} onChange={setHasMortgage} />
      {hasMortgage === "Yes" && (
        <PermissionRow label="Has the lender consented to this type of letting?" value={lenderConsented} onChange={setLenderConsented} />
      )}
      <PermissionRow label="Is the property leasehold?" value={isLeasehold} onChange={setIsLeasehold} />
      {isLeasehold === "Yes" && (
        <PermissionRow label="Does the superior lease allow subletting for this use?" value={superiorLeaseAllowsSubletting} onChange={setSuperiorLeaseAllowsSubletting} />
      )}
      <div className="field full">
        <label>Current planning use class (if known)</label>
        <input value={planningUseClass} onChange={e => setPlanningUseClass(e.target.value)} placeholder="e.g. C3, C3(b), C4" />
      </div>
      <PermissionRow label="Is there an HMO licence?" value={hasHmoLicence} onChange={setHasHmoLicence} />
      <PermissionRow label="Are you aware of any Article 4 Direction or selective licensing in this area?" value={article4OrLicensingAware} onChange={setArticle4OrLicensingAware} />

      <div className="field full" style={{ borderTop: "1px solid var(--line)", paddingTop: 18, marginTop: 4 }}>
        <label style={{ fontSize: 13 }}>Compliance documents</label>
        <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 10px" }}>Upload whatever you have now. Anything missing is chased by BrightBridge, not by the care provider — required documents just need to be ready before the compliance review stage, not at submission.</p>
        {STANDARD_DOCS.map(d => (
          <div key={d} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 12 }}>{d}</span>
            <button type="button" className="secondary" style={{ fontSize: 10, padding: "6px 10px" }} onClick={() => toggleUpload(d)}>
              {uploaded.includes(d) ? "✓ Uploaded" : "↑ Upload"}
            </button>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className="secondary" disabled={!canDraft} style={{ opacity: canDraft ? 1 : .4 }}
          onClick={() => canDraft && onSubmit(fields(), requirementId || null, uploaded, true)}>Save as draft</button>
        <button className="primary" disabled={!canSubmit} style={{ opacity: canSubmit ? 1 : .4 }}>Submit property</button>
      </div>
    </form>
  );
}
