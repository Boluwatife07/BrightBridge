"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";

/* ---------------------------------------------------------------------------
   Account and verification model
   Nobody sees anything on this platform until BBC has verified who they are.
--------------------------------------------------------------------------- */

export type AccountStatus = "Submitted" | "Under review" | "More information requested" | "Verified" | "Rejected";
export type AccountRole = "provider" | "partner";
export type EntityType = "company" | "publicBody" | "individual";

export type AccountRecord = {
  id: string;
  role: AccountRole;
  entityType: EntityType;
  // organisation
  orgName: string;
  companyNumber: string;
  registeredAddress: string;
  companyStatus: string;
  department: string;
  // individual
  legalName: string;
  homeAddress: string;
  idDocType: string;
  idDocOnFile: boolean;
  icoNumber: string;
  // contact
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  // profile
  services: string[];
  regulators: { cqc: string; ofsted: string; rsh: string };
  coverage: string[];
  propertyTypes: string[];
  // verification
  status: AccountStatus;
  reviewNote: string;
  submittedOn: string;
};

export const LOCATIONS = ["Warrington", "St Helens", "Wider Cheshire", "Greater Manchester", "Yorkshire", "West Midlands", "Staffordshire", "North London", "North West"];
export const SERVICES = ["Supported living", "Children's home", "Residential care", "Semi-independent (16-25)", "Temporary and emergency accommodation", "Housing management (RSL)", "Commissioning (local authority)"];
export const PROPERTY_TYPES = ["Family Home (2-3 bed)", "HMO (up to 6 bed)", "Larger Format (7+ bed)"];
export const ID_DOC_TYPES = ["UK passport", "UK driving licence", "Biometric residence permit", "National identity card (EEA)"];

const today = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

let accCounter = 500;
export const nextAccountId = () => `ACC-${accCounter++}`;

export const blankAccount = (role: AccountRole, entityType: EntityType): AccountRecord => ({
  id: nextAccountId(), role, entityType,
  orgName: "", companyNumber: "", registeredAddress: "", companyStatus: "", department: "",
  legalName: "", homeAddress: "", idDocType: "", idDocOnFile: false, icoNumber: "",
  contactName: "", contactRole: "", email: "", phone: "",
  services: [], regulators: { cqc: "", ofsted: "", rsh: "" }, coverage: [], propertyTypes: [],
  status: "Submitted", reviewNote: "", submittedOn: today(),
});

/* Seeded accounts. The two verified ones are what the demo role switch signs you
   in as. The two pending ones give BBC a queue to actually work through. */
export const seedAccounts: AccountRecord[] = [
  { ...blankAccount("provider", "company"), id: "ACC-101", orgName: "Willow Care Group", companyNumber: "09482716", registeredAddress: "14 Tettenhall Road, Wolverhampton, WV1 4SA", companyStatus: "Active", contactName: "Amara Nwosu", contactRole: "Head of Estates", email: "amara@willowcare.co.uk", phone: "07700 900412", services: ["Supported living"], regulators: { cqc: "1-2094817263", ofsted: "", rsh: "" }, coverage: ["West Midlands", "Staffordshire"], status: "Verified", submittedOn: "2 Jun 2026" },
  { ...blankAccount("partner", "company"), id: "ACC-102", orgName: "Kush Properties Ltd", companyNumber: "14464283", registeredAddress: "27 Old Gloucester Street, London, WC1N 3AX", companyStatus: "Active", contactName: "Kush Singh", contactRole: "Director", email: "kush@openblock.co.uk", phone: "07700 900733", coverage: ["West Midlands", "Greater Manchester"], propertyTypes: ["HMO (up to 6 bed)", "Larger Format (7+ bed)"], status: "Verified", submittedOn: "9 Jun 2026" },
  { ...blankAccount("provider", "publicBody"), id: "ACC-103", orgName: "Walsall Metropolitan Borough Council", department: "Children's Services, Commissioning", contactName: "Rachel Doyle", contactRole: "Commissioning Manager", email: "rachel.doyle@walsall.gov.uk", phone: "01922 650000", services: ["Commissioning (local authority)", "Children's home"], regulators: { cqc: "", ofsted: "", rsh: "" }, coverage: ["West Midlands"], status: "Submitted", submittedOn: "14 Aug 2026" },
  { ...blankAccount("partner", "individual"), id: "ACC-104", legalName: "Daniel Mehrnia", homeAddress: "8 Ashfield Grove, Stoke-on-Trent, ST4 2QP", idDocType: "UK passport", idDocOnFile: true, icoNumber: "ZB419227", contactName: "Daniel Mehrnia", contactRole: "Individual landlord", email: "d.mehrnia@outlook.com", phone: "07700 900188", coverage: ["Staffordshire", "Yorkshire"], propertyTypes: ["Family Home (2-3 bed)"], status: "Submitted", submittedOn: "15 Aug 2026" },
];

/* ---------------------------------------------------------------------------
   Companies House lookup (mocked)
   In production this is a live call to the Companies House public API.
--------------------------------------------------------------------------- */

const CH_FIXTURES: Record<string, { name: string; address: string; status: string }> = {
  "16415199": { name: "Bright Bridge Connect Ltd", address: "71-75 Shelton Street, London, WC2H 9JQ", status: "Active" },
  "14464283": { name: "Open Block Investments Ltd", address: "27 Old Gloucester Street, London, WC1N 3AX", status: "Active" },
  "15041758": { name: "Insted Limited", address: "Suite 4, Kingfisher House, York, YO30 4XT", status: "Active" },
  "09482716": { name: "Willow Care Group Limited", address: "14 Tettenhall Road, Wolverhampton, WV1 4SA", status: "Active" },
};

export function lookupCompany(number: string) {
  const clean = number.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(clean)) return { found: false as const, reason: "A company number is 8 characters, for example 09482716 or SC123456." };
  if (CH_FIXTURES[clean]) return { found: true as const, ...CH_FIXTURES[clean], number: clean };
  return { found: true as const, name: "Registered company " + clean, address: "Registered address returned by Companies House", status: "Active", number: clean, demo: true };
}

/* ---------------------------------------------------------------------------
   Shared bits
--------------------------------------------------------------------------- */

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return <span onClick={onClick} style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: `1px solid ${on ? "var(--purple)" : "var(--line)"}`, background: on ? "var(--purple-soft)" : "transparent", color: on ? "var(--purple)" : "var(--muted)" }}>{label}</span>;
}

function Steps({ labels, step }: { labels: string[]; step: number }) {
  return <div style={{ display: "flex", gap: 4, marginBottom: 30 }}>{labels.map((l, i) => (
    <div key={l} style={{ flex: 1, textAlign: "center" }}>
      <div style={{ width: 26, height: 26, borderRadius: "50%", margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: i + 1 <= step ? "var(--ink)" : "#f0eef1", color: i + 1 <= step ? "#fff" : "var(--muted)" }}>{i + 1}</div>
      <div style={{ fontSize: 10, color: i + 1 <= step ? "var(--ink)" : "var(--muted)", fontWeight: i + 1 === step ? 700 : 400 }}>{l}</div>
      <div style={{ height: 3, background: i + 1 <= step ? "var(--ink)" : "#f0eef1", borderRadius: 2, marginTop: 6 }} />
    </div>))}</div>;
}

function Shell({ eyebrow, title, blurb, onBack, children }: any) {
  return <div style={{ minHeight: "100vh", background: "#fff" }}>
    <div style={{ padding: "16px 28px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ fontWeight: 800 }}>Bright<span style={{ color: "var(--purple)" }}>Bridge</span> Connect</span>
      {onBack && <span onClick={onBack} style={{ fontSize: 12, color: "var(--purple)", cursor: "pointer", fontWeight: 600 }}>← Back</span>}
    </div>
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "44px 20px 70px" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--purple)", fontWeight: 700, marginBottom: 8 }}>{eyebrow}</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28, lineHeight: 1.6 }}>{blurb}</div>
      {children}
    </div>
  </div>;
}

function CompanyLookup({ number, setNumber, result, setResult }: any) {
  const [error, setError] = useState("");
  function run() {
    const r = lookupCompany(number);
    if (!r.found) { setError(r.reason); setResult(null); return; }
    setError(""); setResult(r);
  }
  return <div className="field full">
    <label>Companies House number</label>
    <div style={{ display: "flex", gap: 8 }}>
      <input value={number} onChange={e => { setNumber(e.target.value); setResult(null); }} placeholder="e.g. 09482716" style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 9, padding: "11px 12px" }}/>
      <button type="button" className="secondary" onClick={run}>Look up</button>
    </div>
    {error && <p style={{ fontSize: 11, color: "#c23b3b", margin: "8px 0 0" }}>{error}</p>}
    {result && <div style={{ marginTop: 12, border: "1px solid var(--line)", borderRadius: 11, padding: 14, background: "var(--surface)" }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{result.name}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", margin: "5px 0" }}>{result.address}</div>
      <span className={`status ${result.status === "Active" ? "green" : "amber"}`}>{result.status} on the register</span>
      <p style={{ fontSize: 10, color: "var(--muted)", margin: "10px 0 0" }}>Check this is your organisation before continuing. BrightBridge verifies it against the register again before your account is approved.</p>
    </div>}
  </div>;
}

/* ---------------------------------------------------------------------------
   Care provider onboarding
--------------------------------------------------------------------------- */

export function OnboardProvider({ onBack, onSubmit }: { onBack: () => void; onSubmit: (a: AccountRecord) => void }) {
  const [step, setStep] = useState(1);
  const [entityType, setEntityType] = useState<EntityType>("company");
  const [number, setNumber] = useState("");
  const [ch, setCh] = useState<any>(null);
  const [f, setF] = useState({ orgName: "", department: "", contactName: "", contactRole: "", email: "", phone: "", cqc: "", ofsted: "", rsh: "" });
  const [services, setServices] = useState<string[]>([]);
  const [coverage, setCoverage] = useState<string[]>([]);
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const toggle = (list: string[], setList: any, v: string) => setList(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const isLA = entityType === "publicBody";
  const govEmail = /\.gov\.uk$|\.nhs\.uk$/i.test(f.email.trim());
  const step1Done = isLA ? f.orgName.trim().length > 2 : !!ch;
  const step2Done = f.contactName.trim() && f.email.trim() && f.phone.trim() && (!isLA || govEmail);
  const step3Done = services.length > 0;
  const step4Done = coverage.length > 0;
  const canContinue = [step1Done, step2Done, step3Done, step4Done, true][step - 1];

  function submit() {
    const a = blankAccount("provider", entityType);
    onSubmit({
      ...a,
      orgName: isLA ? f.orgName : ch.name, companyNumber: isLA ? "" : ch.number,
      registeredAddress: isLA ? "" : ch.address, companyStatus: isLA ? "" : ch.status, department: f.department,
      contactName: f.contactName, contactRole: f.contactRole, email: f.email, phone: f.phone,
      services, regulators: { cqc: f.cqc, ofsted: f.ofsted, rsh: f.rsh }, coverage,
    });
  }

  return <Shell eyebrow="Care provider" title="Create your account" blurb="Every account is verified by BrightBridge before it goes live. Requirements you post are shared with property partners under a reference number only, never your organisation name." onBack={onBack}>
    <Steps labels={["Organisation", "Contact", "Services", "Coverage", "Review"]} step={step}/>

    {step === 1 && <div className="form" style={{ padding: 0 }}>
      <div className="field full"><label>What kind of organisation are you?</label>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          {[["company", "Registered company or charity"], ["publicBody", "Local authority or public body"]].map(([v, l]) => (
            <div key={v} onClick={() => setEntityType(v as EntityType)} style={{ flex: 1, border: `2px solid ${entityType === v ? "var(--purple)" : "var(--line)"}`, background: entityType === v ? "var(--purple-soft)" : "#fff", borderRadius: 12, padding: "16px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{l}</div>
          ))}
        </div>
      </div>
      {isLA ? <>
        <div className="field full"><label>Full name of the authority or body</label><input value={f.orgName} onChange={e => set("orgName", e.target.value)} placeholder="e.g. Walsall Metropolitan Borough Council"/></div>
        <div className="field full"><label>Department or team</label><input value={f.department} onChange={e => set("department", e.target.value)} placeholder="e.g. Children's Services, Commissioning"/></div>
        <p style={{ gridColumn: "1/3", fontSize: 11, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>Public bodies are not on the Companies House register, so we verify you through your work email domain and a check against the authority&apos;s published contact details instead.</p>
      </> : <CompanyLookup number={number} setNumber={setNumber} result={ch} setResult={setCh}/>}
    </div>}

    {step === 2 && <div className="form" style={{ padding: 0 }}>
      <div className="field"><label>Your name</label><input value={f.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Full name"/></div>
      <div className="field"><label>Your job title</label><input value={f.contactRole} onChange={e => set("contactRole", e.target.value)} placeholder="e.g. Head of Estates"/></div>
      <div className="field"><label>Work email</label><input type="email" value={f.email} onChange={e => set("email", e.target.value)} placeholder={isLA ? "you@council.gov.uk" : "you@organisation.co.uk"}/></div>
      <div className="field"><label>Phone</label><input value={f.phone} onChange={e => set("phone", e.target.value)} placeholder="07XXX XXXXXX"/></div>
      {isLA && f.email.trim() !== "" && !govEmail && <p style={{ gridColumn: "1/3", fontSize: 11, color: "#c23b3b", margin: 0 }}>Use your gov.uk or nhs.uk work address. It is how we confirm you work for the authority.</p>}
    </div>}

    {step === 3 && <div>
      <div className="field full" style={{ marginBottom: 24 }}><label>What services do you deliver?</label>
        <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 10px" }}>Pick everything that applies. This describes what you do, not what type of company you are.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{SERVICES.map(s => <Chip key={s} label={s} on={services.includes(s)} onClick={() => toggle(services, setServices, s)}/>)}</div>
      </div>
      <div className="form" style={{ padding: 0 }}>
        <div className="field full"><label>Regulator registrations</label><p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 4px" }}>Optional, but an active registration is the fastest route through verification. Leave blank if you are not yet registered.</p></div>
        <div className="field"><label>CQC provider ID</label><input value={f.cqc} onChange={e => set("cqc", e.target.value)} placeholder="1-XXXXXXXXX"/></div>
        <div className="field"><label>Ofsted URN</label><input value={f.ofsted} onChange={e => set("ofsted", e.target.value)} placeholder="SCXXXXXXX"/></div>
        <div className="field"><label>RSH registration</label><input value={f.rsh} onChange={e => set("rsh", e.target.value)} placeholder="LHXXXX"/></div>
      </div>
    </div>}

    {step === 4 && <div>
      <div className="field full"><label>Where do you need properties?</label>
        <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 10px" }}>Pick at least one area.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{LOCATIONS.map(l => <Chip key={l} label={l} on={coverage.includes(l)} onClick={() => toggle(coverage, setCoverage, l)}/>)}</div>
      </div>
    </div>}

    {step === 5 && <div>
      <div className="detail-grid" style={{ padding: "16px 0", gridTemplateColumns: "repeat(2,1fr)" }}>
        <div><small>Organisation</small><strong>{isLA ? f.orgName : ch?.name}</strong></div>
        <div><small>{isLA ? "Department" : "Company number"}</small><strong>{isLA ? f.department || "—" : ch?.number}</strong></div>
        <div><small>Contact</small><strong>{f.contactName}{f.contactRole ? `, ${f.contactRole}` : ""}</strong></div>
        <div><small>Email</small><strong>{f.email}</strong></div>
        <div><small>Services</small><strong>{services.join(", ")}</strong></div>
        <div><small>Coverage</small><strong>{coverage.join(", ")}</strong></div>
        <div><small>Regulator IDs</small><strong>{[f.cqc, f.ofsted, f.rsh].filter(Boolean).join(", ") || "None provided"}</strong></div>
      </div>
      <p style={{ fontSize: 11, color: "#95631b", background: "var(--amber-bg)", padding: "12px 14px", borderRadius: 8, lineHeight: 1.6 }}>Submitting sends your account to BrightBridge for verification. You will not be able to post a requirement until it is approved, and no property partner can see anything from you before then.</p>
    </div>}

    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26 }}>
      <button type="button" className="secondary" onClick={() => step === 1 ? onBack() : setStep(step - 1)}>{step === 1 ? "Cancel" : "Back"}</button>
      {step < 5
        ? <button type="button" className="primary" disabled={!canContinue} style={{ opacity: canContinue ? 1 : .4 }} onClick={() => setStep(step + 1)}>Continue</button>
        : <button type="button" className="primary" onClick={submit}>Submit for verification</button>}
    </div>
  </Shell>;
}

/* ---------------------------------------------------------------------------
   Property partner onboarding
--------------------------------------------------------------------------- */

export function OnboardPartner({ onBack, onSubmit }: { onBack: () => void; onSubmit: (a: AccountRecord) => void }) {
  const [step, setStep] = useState(1);
  const [entityType, setEntityType] = useState<EntityType>("company");
  const [number, setNumber] = useState("");
  const [ch, setCh] = useState<any>(null);
  const [f, setF] = useState({ legalName: "", homeAddress: "", idDocType: ID_DOC_TYPES[0], icoNumber: "", contactName: "", contactRole: "", email: "", phone: "" });
  const [idOnFile, setIdOnFile] = useState(false);
  const [coverage, setCoverage] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const toggle = (list: string[], setList: any, v: string) => setList(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const isIndividual = entityType === "individual";
  const step1Done = isIndividual ? (f.legalName.trim() && f.homeAddress.trim() && idOnFile && f.icoNumber.trim()) : !!ch;
  const step2Done = f.contactName.trim() && f.email.trim() && f.phone.trim();
  const step3Done = coverage.length > 0 && types.length > 0;
  const canContinue = [step1Done, step2Done, step3Done, true][step - 1];

  function submit() {
    const a = blankAccount("partner", entityType);
    onSubmit({
      ...a,
      orgName: isIndividual ? "" : ch.name, companyNumber: isIndividual ? "" : ch.number,
      registeredAddress: isIndividual ? "" : ch.address, companyStatus: isIndividual ? "" : ch.status,
      legalName: f.legalName, homeAddress: f.homeAddress, idDocType: isIndividual ? f.idDocType : "", idDocOnFile: idOnFile, icoNumber: f.icoNumber,
      contactName: f.contactName, contactRole: f.contactRole, email: f.email, phone: f.phone,
      coverage, propertyTypes: types,
    });
  }

  return <Shell eyebrow="Property partner" title="Create your account" blurb="Landlord or sourcer, the account is the same. Whether a property is yours or introduced by you is recorded property by property, not here." onBack={onBack}>
    <Steps labels={["Identity", "Contact", "Coverage", "Review"]} step={step}/>

    {step === 1 && <div className="form" style={{ padding: 0 }}>
      <div className="field full"><label>Are you registered as a company?</label>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          {[["company", "Yes, I have a company"], ["individual", "No, I am an individual"]].map(([v, l]) => (
            <div key={v} onClick={() => setEntityType(v as EntityType)} style={{ flex: 1, border: `2px solid ${entityType === v ? "var(--purple)" : "var(--line)"}`, background: entityType === v ? "var(--purple-soft)" : "#fff", borderRadius: 12, padding: "16px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{l}</div>
          ))}
        </div>
      </div>
      {isIndividual ? <>
        <div className="field full"><label>Full legal name</label><input value={f.legalName} onChange={e => set("legalName", e.target.value)} placeholder="As it appears on your ID"/></div>
        <div className="field full"><label>Home address</label><input value={f.homeAddress} onChange={e => set("homeAddress", e.target.value)} placeholder="Including postcode"/></div>
        <div className="field"><label>ID document</label><select value={f.idDocType} onChange={e => set("idDocType", e.target.value)}>{ID_DOC_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
        <div className="field"><label>Upload your ID</label><button type="button" className="secondary" onClick={() => setIdOnFile(!idOnFile)} style={{ height: 42 }}>{idOnFile ? "✓ Uploaded" : "↑ Upload document"}</button></div>
        <div className="field full"><label>ICO data protection registration number</label><input value={f.icoNumber} onChange={e => set("icoNumber", e.target.value)} placeholder="e.g. ZB419227"/>
          <p style={{ fontSize: 11, color: "var(--muted)", margin: "6px 0 0", lineHeight: 1.6 }}>You handle personal data about the people who will live in your property, so you need to be registered with the ICO and paying the data protection fee. Register at ico.org.uk first if you are not.</p>
        </div>
      </> : <CompanyLookup number={number} setNumber={setNumber} result={ch} setResult={setCh}/>}
    </div>}

    {step === 2 && <div className="form" style={{ padding: 0 }}>
      <div className="field"><label>Your name</label><input value={f.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Full name"/></div>
      <div className="field"><label>Your role</label><input value={f.contactRole} onChange={e => set("contactRole", e.target.value)} placeholder="e.g. Director, Individual landlord"/></div>
      <div className="field"><label>Email</label><input type="email" value={f.email} onChange={e => set("email", e.target.value)} placeholder="you@email.com"/></div>
      <div className="field"><label>Phone</label><input value={f.phone} onChange={e => set("phone", e.target.value)} placeholder="07XXX XXXXXX"/></div>
    </div>}

    {step === 3 && <div>
      <div className="field full" style={{ marginBottom: 24 }}><label>Where can you source properties?</label>
        <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 10px" }}>Requirements are only sent to you for the areas you cover, so pick everything you genuinely work in.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{LOCATIONS.map(l => <Chip key={l} label={l} on={coverage.includes(l)} onClick={() => toggle(coverage, setCoverage, l)}/>)}</div>
      </div>
      <div className="field full"><label>What property types can you supply?</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>{PROPERTY_TYPES.map(t => <Chip key={t} label={t} on={types.includes(t)} onClick={() => toggle(types, setTypes, t)}/>)}</div>
      </div>
    </div>}

    {step === 4 && <div>
      <div className="detail-grid" style={{ padding: "16px 0", gridTemplateColumns: "repeat(2,1fr)" }}>
        {isIndividual ? <>
          <div><small>Legal name</small><strong>{f.legalName}</strong></div>
          <div><small>ID document</small><strong>{f.idDocType} {idOnFile ? "· uploaded" : ""}</strong></div>
          <div><small>Home address</small><strong>{f.homeAddress}</strong></div>
          <div><small>ICO registration</small><strong>{f.icoNumber}</strong></div>
        </> : <>
          <div><small>Company</small><strong>{ch?.name}</strong></div>
          <div><small>Company number</small><strong>{ch?.number}</strong></div>
          <div><small>Registered address</small><strong>{ch?.address}</strong></div>
          <div><small>Status</small><strong>{ch?.status}</strong></div>
        </>}
        <div><small>Contact</small><strong>{f.contactName}{f.contactRole ? `, ${f.contactRole}` : ""}</strong></div>
        <div><small>Email</small><strong>{f.email}</strong></div>
        <div><small>Coverage</small><strong>{coverage.join(", ")}</strong></div>
        <div><small>Property types</small><strong>{types.join(", ")}</strong></div>
      </div>
      <p style={{ fontSize: 11, color: "#95631b", background: "var(--amber-bg)", padding: "12px 14px", borderRadius: 8, lineHeight: 1.6 }}>Submitting sends your account to BrightBridge for verification. Live requirements are not shared with you until it is approved.</p>
    </div>}

    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26 }}>
      <button type="button" className="secondary" onClick={() => step === 1 ? onBack() : setStep(step - 1)}>{step === 1 ? "Cancel" : "Back"}</button>
      {step < 4
        ? <button type="button" className="primary" disabled={!canContinue} style={{ opacity: canContinue ? 1 : .4 }} onClick={() => setStep(step + 1)}>Continue</button>
        : <button type="button" className="primary" onClick={submit}>Submit for verification</button>}
    </div>
  </Shell>;
}

/* ---------------------------------------------------------------------------
   Verification status, shown to the account holder
--------------------------------------------------------------------------- */

export function VerificationPanel({ account, onSignOut }: { account: AccountRecord; onSignOut: () => void }) {
  const tone = account.status === "Verified" ? "green" : account.status === "Rejected" ? "red" : account.status === "More information requested" ? "amber" : "purple";
  const copy: Record<AccountStatus, string> = {
    "Submitted": "Your account is in the queue. BrightBridge checks every account by hand, usually within two working days.",
    "Under review": "A member of the BrightBridge team is checking your details against the public register now.",
    "More information requested": "BrightBridge needs something else from you before your account can go live. Reply in Messages and it goes straight back into the queue.",
    "Verified": "Your account is live.",
    "Rejected": "BrightBridge was not able to verify this account.",
  };
  return <div className="page-content">
    <section className="panel" style={{ padding: 26, maxWidth: 720 }}>
      <span className={`status ${tone}`}>{account.status}</span>
      <h2 style={{ fontSize: 19, margin: "14px 0 8px" }}>{account.status === "Verified" ? "You're verified" : "We're verifying your account"}</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{copy[account.status]}</p>

      {account.reviewNote && <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: account.status === "Rejected" ? "#fdeceb" : "var(--amber-bg)", fontSize: 12, lineHeight: 1.6 }}>
        <strong style={{ display: "block", marginBottom: 5 }}>From BrightBridge</strong>{account.reviewNote}
      </div>}

      <div className="detail-grid" style={{ marginTop: 22, gridTemplateColumns: "repeat(2,1fr)", padding: "18px 0" }}>
        <div><small>Account</small><strong>{account.orgName || account.legalName}</strong></div>
        <div><small>Submitted</small><strong>{account.submittedOn}</strong></div>
        <div><small>Type</small><strong>{account.entityType === "company" ? "Registered company" : account.entityType === "publicBody" ? "Local authority or public body" : "Individual"}</strong></div>
        <div><small>Reference</small><strong>{account.id}</strong></div>
      </div>

      <h3 style={{ fontSize: 13, margin: "20px 0 10px" }}>What you can do meanwhile</h3>
      <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", fontSize: 12, lineHeight: 1.9 }}>
        {account.role === "provider"
          ? <><li>Draft your requirements so they are ready to publish the moment you are verified</li><li>Message the BrightBridge team with anything urgent</li></>
          : <><li>Message the BrightBridge team with anything urgent</li><li>Have your compliance documents to hand, you will need them per property</li></>}
      </ul>
      <button className="secondary" style={{ marginTop: 22 }} onClick={onSignOut}>Sign out</button>
    </section>
  </div>;
}

/* ---------------------------------------------------------------------------
   BBC verification queue
--------------------------------------------------------------------------- */

const statusTone = (s: AccountStatus) => s === "Verified" ? "green" : s === "Rejected" ? "red" : s === "More information requested" ? "amber" : "purple";

export function AccountsQueue({ accounts, openAccount }: { accounts: AccountRecord[]; openAccount: (a: AccountRecord) => void }) {
  const [filter, setFilter] = useState<"pending" | "verified" | "all">("pending");
  const pending = accounts.filter(a => ["Submitted", "Under review", "More information requested"].includes(a.status));
  const list = filter === "pending" ? pending : filter === "verified" ? accounts.filter(a => a.status === "Verified") : accounts;

  return <div className="page-content">
    <div className="page-toolbar"><p>Nobody sees a requirement or a property until you approve them here.</p></div>
    <section className="panel">
      <div className="filterbar">
        <button className={filter === "pending" ? "selected" : ""} onClick={() => setFilter("pending")}>Awaiting review <b>{pending.length}</b></button>
        <button className={filter === "verified" ? "selected" : ""} onClick={() => setFilter("verified")}>Verified <b>{accounts.filter(a => a.status === "Verified").length}</b></button>
        <button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>All <b>{accounts.length}</b></button>
      </div>
      <div className="data-table">
        <div className="table-header"><span>Account</span><span>Type</span><span>Role</span><span>Status</span><span>Submitted</span></div>
        {list.map(a => <button className="data-row" key={a.id} onClick={() => openAccount(a)}>
          <span><b>{a.orgName || a.legalName}</b><small>{a.id} · {a.contactName}</small></span>
          <span>{a.entityType === "company" ? `Company ${a.companyNumber}` : a.entityType === "publicBody" ? "Public body" : "Individual"}</span>
          <span>{a.role === "provider" ? "Care provider" : "Property partner"}</span>
          <span><span className={`status ${statusTone(a.status)}`}>{a.status}</span></span>
          <span>{a.submittedOn}　→</span>
        </button>)}
        {list.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing in this list.</div>}
      </div>
    </section>
  </div>;
}

export function AccountReviewModal({ account, onClose, onDecide }: { account: AccountRecord; onClose: () => void; onDecide: (id: string, status: AccountStatus, note: string) => void }) {
  const [note, setNote] = useState(account.reviewNote || "");
  const isCompany = account.entityType === "company";
  const isIndividual = account.entityType === "individual";
  const decided = account.status === "Verified" || account.status === "Rejected";

  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" style={{ width: "min(780px,100%)" }} onMouseDown={e => e.stopPropagation()}>
    <div className="modal-head"><h2>{account.id} · Account verification</h2><button className="icon-button" onClick={onClose}>×</button></div>

    <div className="property-hero"><div>
      <span className={`status ${statusTone(account.status)}`}>{account.status}</span>
      <h2>{account.orgName || account.legalName}</h2>
      <p>{account.role === "provider" ? "Care provider" : "Property partner"} · submitted {account.submittedOn}</p>
    </div></div>

    <div className="modal-section">
      <h3>Evidence to check</h3>
      {isCompany && <div className="detail-grid" style={{ gridTemplateColumns: "repeat(2,1fr)", padding: "14px 0" }}>
        <div><small>Company number</small><strong>{account.companyNumber}</strong></div>
        <div><small>Register status</small><strong>{account.companyStatus}</strong></div>
        <div><small>Registered address</small><strong>{account.registeredAddress}</strong></div>
        <div><small>Check</small><strong><a href={`https://find-and-update.company-information.service.gov.uk/company/${account.companyNumber}`} target="_blank" rel="noreferrer" style={{ color: "var(--purple)" }}>Open on Companies House ↗</a></strong></div>
      </div>}
      {account.entityType === "publicBody" && <div className="detail-grid" style={{ gridTemplateColumns: "repeat(2,1fr)", padding: "14px 0" }}>
        <div><small>Authority</small><strong>{account.orgName}</strong></div>
        <div><small>Department</small><strong>{account.department || "—"}</strong></div>
        <div><small>Work email domain</small><strong>{account.email.split("@")[1] || "—"}</strong></div>
        <div><small>Check</small><strong>Confirm the contact against the authority&apos;s published directory</strong></div>
      </div>}
      {isIndividual && <div className="detail-grid" style={{ gridTemplateColumns: "repeat(2,1fr)", padding: "14px 0" }}>
        <div><small>Legal name</small><strong>{account.legalName}</strong></div>
        <div><small>ID document</small><strong>{account.idDocType} {account.idDocOnFile ? "· on file" : "· missing"}</strong></div>
        <div><small>Home address</small><strong>{account.homeAddress}</strong></div>
        <div><small>ICO registration</small><strong>{account.icoNumber || "Not provided"}</strong></div>
      </div>}
    </div>

    <div className="modal-section">
      <h3>Contact</h3>
      <div className="detail-grid" style={{ gridTemplateColumns: "repeat(2,1fr)", padding: "14px 0" }}>
        <div><small>Name</small><strong>{account.contactName}{account.contactRole ? `, ${account.contactRole}` : ""}</strong></div>
        <div><small>Email</small><strong>{account.email}</strong></div>
        <div><small>Phone</small><strong>{account.phone}</strong></div>
        <div><small>Coverage</small><strong>{account.coverage.join(", ") || "—"}</strong></div>
      </div>
    </div>

    {account.role === "provider" && <div className="modal-section">
      <h3>Services and regulators</h3>
      <div className="tag-row">{account.services.map(s => <span key={s}>{s}</span>)}{account.services.length === 0 && <span>None listed</span>}</div>
      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
        CQC {account.regulators.cqc || "not provided"} · Ofsted {account.regulators.ofsted || "not provided"} · RSH {account.regulators.rsh || "not provided"}
      </p>
    </div>}

    {account.role === "partner" && <div className="modal-section">
      <h3>Property types</h3>
      <div className="tag-row">{account.propertyTypes.map(t => <span key={t}>{t}</span>)}{account.propertyTypes.length === 0 && <span>None listed</span>}</div>
    </div>}

    {!decided && <div className="modal-section">
      <h3>Note to the applicant</h3>
      <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 8px" }}>Required if you are asking for more information or rejecting. They see this word for word.</p>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. The name on your ID does not match the name on the ICO registration. Could you send the certificate?" style={{ width: "100%", minHeight: 76, border: "1px solid var(--line)", borderRadius: 9, padding: 12, fontSize: 12, fontFamily: "inherit" }}/>
    </div>}

    <div className="form-actions" style={{ margin: 0, padding: "16px 24px" }}>
      {decided
        ? <button className="secondary" onClick={onClose}>Close</button>
        : <>
          <button className="secondary" style={{ color: "#c23b3b" }} disabled={!note.trim()} onClick={() => onDecide(account.id, "Rejected", note.trim())}>Reject</button>
          <button className="secondary" disabled={!note.trim()} onClick={() => onDecide(account.id, "More information requested", note.trim())}>Request more information</button>
          <button className="primary" onClick={() => onDecide(account.id, "Verified", note.trim())}>Verify account</button>
        </>}
    </div>
  </div></div>;
}
