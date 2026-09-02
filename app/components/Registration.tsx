"use client";

import { useState } from "react";
import { ProviderAccount, PartnerAccount, SERVICES, LOCATIONS, PARTNER_PROPERTY_TYPES, nextId } from "../lib/types";

/* ---------------------------------------------------------------------------
   Shared shell + chip picker for both registration forms
--------------------------------------------------------------------------- */

function RegShell({ eyebrow, title, blurb, onBack, children }: {
  eyebrow: string; title: string; blurb: string; onBack: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <div style={{ padding: "16px 28px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontWeight: 800 }}>Bright<span style={{ color: "var(--purple)" }}>Bridge</span> Connect</span>
        <span onClick={onBack} style={{ fontSize: 12, color: "var(--purple)", cursor: "pointer", fontWeight: 600 }}>← Back</span>
      </div>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--purple)", fontWeight: 700, marginBottom: 8 }}>{eyebrow}</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28, lineHeight: 1.6 }}>{blurb}</div>
        {children}
      </div>
    </div>
  );
}

function Chips({ options, selected, onToggle }: { options: readonly string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
      {options.map(o => (
        <span key={o} onClick={() => onToggle(o)} style={{
          padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
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

/* ---------------------------------------------------------------------------
   Care provider registration
   Fields per Care Provider PRD 4.1. No verification, no approval step.
--------------------------------------------------------------------------- */

export function RegisterProvider({ onBack, onDone }: { onBack: () => void; onDone: (account: ProviderAccount) => void }) {
  const [organisationName, setOrganisationName] = useState("");
  const [contactName, setContactName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [coverageAreas, setCoverageAreas] = useState<string[]>([]);

  const valid = organisationName.trim() && contactName.trim() && email.trim() && phone.trim()
    && services.length > 0 && coverageAreas.length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const account: ProviderAccount = {
      id: nextId("ACC-P"), kind: "provider",
      organisationName: organisationName.trim(), contactName: contactName.trim(), jobTitle: jobTitle.trim(),
      email: email.trim(), phone: phone.trim(), services, coverageAreas,
    };
    onDone(account);
  }

  return (
    <RegShell eyebrow="Care provider" title="Create your account"
      blurb="Tell us about your organisation so we can match you with the right properties. You're in immediately — no approval or verification step."
      onBack={onBack}>
      <form onSubmit={submit} className="form" style={{ padding: 0 }}>
        <div className="field full"><label>Organisation name</label>
          <input required value={organisationName} onChange={e => setOrganisationName(e.target.value)} placeholder="e.g. Willow Care Group" /></div>
        <div className="field"><label>Contact name</label>
          <input required value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Full name" /></div>
        <div className="field"><label>Job title</label>
          <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Head of Estates" /></div>
        <div className="field"><label>Email</label>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@organisation.co.uk" /></div>
        <div className="field"><label>Phone</label>
          <input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XXX XXXXXX" /></div>
        <div className="field full"><label>Services you deliver</label>
          <Chips options={SERVICES} selected={services} onToggle={v => setServices(toggle(services, v))} /></div>
        <div className="field full"><label>Where do you need properties?</label>
          <Chips options={LOCATIONS} selected={coverageAreas} onToggle={v => setCoverageAreas(toggle(coverageAreas, v))} /></div>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onBack}>Cancel</button>
          <button className="primary" disabled={!valid} style={{ opacity: valid ? 1 : .4 }}>Create account</button>
        </div>
      </form>
    </RegShell>
  );
}

/* ---------------------------------------------------------------------------
   Property partner registration
   Fields per Property Partner PRD 5.1. One account type for both landlords
   and introducers — the distinction is recorded per property, not here.
--------------------------------------------------------------------------- */

export function RegisterPartner({ onBack, onDone }: { onBack: () => void; onDone: (account: PartnerAccount) => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [coverageAreas, setCoverageAreas] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

  const valid = fullName.trim() && email.trim() && phone.trim()
    && coverageAreas.length > 0 && propertyTypes.length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const account: PartnerAccount = {
      id: nextId("ACC-PP"), kind: "partner",
      fullName: fullName.trim(), email: email.trim(), phone: phone.trim(),
      companyName: companyName.trim(), coverageAreas, propertyTypes,
    };
    onDone(account);
  }

  return (
    <RegShell eyebrow="Property partner" title="Create your account"
      blurb="Whether you own a single property or introduce properties on behalf of landlords you work with, the same account applies. Ownership is recorded per property, not here."
      onBack={onBack}>
      <form onSubmit={submit} className="form" style={{ padding: 0 }}>
        <div className="field"><label>Your name</label>
          <input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" /></div>
        <div className="field"><label>Email</label>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" /></div>
        <div className="field"><label>Phone</label>
          <input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XXX XXXXXX" /></div>
        <div className="field"><label>Company name</label>
          <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Leave blank if you are an individual landlord" /></div>
        <div className="field full"><label>Where can you source or offer properties?</label>
          <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 6px" }}>Live requirements are only shown to you for the areas you cover.</p>
          <Chips options={LOCATIONS} selected={coverageAreas} onToggle={v => setCoverageAreas(toggle(coverageAreas, v))} /></div>
        <div className="field full"><label>Property types you work with</label>
          <Chips options={PARTNER_PROPERTY_TYPES} selected={propertyTypes} onToggle={v => setPropertyTypes(toggle(propertyTypes, v))} /></div>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onBack}>Cancel</button>
          <button className="primary" disabled={!valid} style={{ opacity: valid ? 1 : .4 }}>Create account</button>
        </div>
      </form>
    </RegShell>
  );
}
