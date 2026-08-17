"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */

import { useState } from "react";

type Role = "provider" | "partner" | "bbc";
type View = "overview" | "requirements" | "properties" | "viewings" | "messages" | "settings";

const STANDARD_DOC_LABELS = [
  "EICR (Electrical Installation)", "Gas Safety Certificate (CP12)", "EPC (Energy Performance)",
  "Fire Risk Assessment", "HMO Licence (if applicable)", "Legionella Assessment",
];
const REQUIRED_LABELS = STANDARD_DOC_LABELS.slice(0, 4);

type DocItem = { id: string; label: string; standard: boolean; onFile: boolean; shared: boolean };
const standardDocs = (onFileMap?: Record<string, boolean>): DocItem[] => STANDARD_DOC_LABELS.map((label, i) => ({
  id: `DOC-STD-${i}`, label, standard: true, onFile: onFileMap ? Object.values(onFileMap)[i] : false, shared: false,
}));

type PropertyRecord = {
  id: string; name: string; area: string; propertyType: string; bedrooms: string | number; bathrooms: string | number; condition: string; rent: string; availableFrom: string; description: string;
  status: string; matchedReq: string | null; documents: DocItem[];
};
type RequirementRecord = {
  id: string; title: string; area: string; serviceType: string; residentProfile: string; propertyType: string; bedrooms: string | number; capacity: string | number;
  budget: string; leaseLength: string; neededBy: string; accessibility: string[]; outdoorSpace: boolean; parking: boolean; standingDocs: string; notes: string;
  status: string; operator: string; matchedPropertyIds: string[];
};
type ViewingRecord = {
  id: string; propertyId: string; propertyName: string; reqId: string | null;
  candidateDates: string[]; partnerSelectedDate: string | null; confirmedDate: string | null; declineNote: string | null;
  status: "Requested" | "Shared with Property Source" | "Awaiting BBC Confirmation" | "Reschedule Needed" | "Confirmed";
};

const seedRequirements: RequirementRecord[] = [
  { id: "REQ-1048", title: "6-bed supported living home", area: "Wolverhampton", serviceType: "Supported living", residentProfile: "Adults with learning disabilities", propertyType: "HMO (up to 6 bed)", bedrooms: 6, capacity: "5-6 residents", budget: "£3,600 pcm", leaseLength: "Minimum 5 years", neededBy: "12 Oct 2026", accessibility: ["Ground floor bedroom", "Step-free access"], outdoorSpace: true, parking: false, standingDocs: "Buildings insurance certificate for every property, please.", notes: "", status: "Open", operator: "Willow Care Group", matchedPropertyIds: [] },
  { id: "REQ-1044", title: "Children's home with garden", area: "Stoke-on-Trent", serviceType: "Children's home", residentProfile: "Young people leaving care", propertyType: "Larger Format (7+ bed)", bedrooms: 7, capacity: "6-7 residents", budget: "£4,200 pcm", leaseLength: "Minimum 5 years", neededBy: "1 Nov 2026", accessibility: [], outdoorSpace: true, parking: true, standingDocs: "", notes: "", status: "Open", operator: "Horizon Supported Living", matchedPropertyIds: [] },
  { id: "REQ-1039", title: "Accessible 4-bed bungalow", area: "Walsall", serviceType: "Supported living", residentProfile: "Adults with physical disabilities", propertyType: "Family Home (2-3 bed)", bedrooms: 4, capacity: "3-4 residents", budget: "£3,100 pcm", leaseLength: "Minimum 5 years", neededBy: "20 Sep 2026", accessibility: ["Wheelchair accessible", "Wet room", "Wider doorways"], outdoorSpace: false, parking: true, standingDocs: "", notes: "", status: "Open", operator: "Choice Pathways", matchedPropertyIds: [] },
];

const seedProperties: PropertyRecord[] = [
  { id: "PROP-231", name: "Detached home, Penn", area: "Wolverhampton, WV4", propertyType: "HMO (up to 6 bed)", bedrooms: 6, bathrooms: 3, condition: "Furnished", rent: "£3,450 pcm", availableFrom: "Immediate", description: "Spacious detached property recently refurbished to a high standard.", status: "Matched", matchedReq: "REQ-1048", documents: standardDocs({ a: true, b: true, c: true, d: true, e: true, f: true }) },
  { id: "PROP-229", name: "Corner house, Hanley", area: "Stoke-on-Trent, ST1", propertyType: "Larger Format (7+ bed)", bedrooms: 5, bathrooms: 2, condition: "Furnished", rent: "£3,900 pcm", availableFrom: "1 Oct 2026", description: "", status: "Under Review", matchedReq: null, documents: standardDocs({ a: true, b: true, c: false, d: true, e: false, f: false }) },
  { id: "PROP-226", name: "Accessible bungalow", area: "Walsall, WS3", propertyType: "Family Home (2-3 bed)", bedrooms: 4, bathrooms: 2, condition: "Unfurnished", rent: "£2,950 pcm", availableFrom: "Immediate", description: "", status: "Submitted", matchedReq: null, documents: standardDocs({ a: true, b: false, c: false, d: false, e: false, f: false }) },
];

const seedViewings: ViewingRecord[] = [];
let idCounter = 1000;
const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

function Status({ children, tone = "purple" }: { children: React.ReactNode; tone?: "purple" | "green" | "amber" | "grey" | "red" }) { return <span className={`status ${tone}`}>{children}</span>; }

function Modal({ title, children, onClose, actions, wide }: { title: string; children: React.ReactNode; onClose: () => void; actions?: { icon: string; label: string; onClick: () => void; danger?: boolean }[]; wide?: boolean }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" style={wide ? { width: "min(780px,100%)" } : undefined} onMouseDown={e => e.stopPropagation()}>
    <div className="modal-head">
      <h2>{title}</h2>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {actions?.map(a => <button key={a.label} title={a.label} onClick={a.onClick} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: a.danger ? "#fdeceb" : "var(--surface)", color: a.danger ? "#c23b3b" : "var(--ink)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>{a.icon}</button>)}
        <button className="icon-button" onClick={onClose} aria-label="Close">×</button>
      </div>
    </div>
    {children}
  </div></div>;
}

function docSummary(documents: DocItem[]) {
  const required = documents.filter(d => REQUIRED_LABELS.includes(d.label));
  return `${required.filter(d => d.onFile).length}/${required.length} required docs on file`;
}

const nav: { id: View; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "⌂" }, { id: "requirements", label: "Requirements", icon: "▤" },
  { id: "properties", label: "Properties", icon: "◇" }, { id: "viewings", label: "Viewings", icon: "↗" },
  { id: "messages", label: "Messages", icon: "□" },
];

export default function Home() {
  const [screen, setScreen] = useState<"landing" | "onboardProvider" | "onboardPartner" | "app">("landing");
  const [role, setRole] = useState<Role>("bbc");
  const [view, setView] = useState<View>("overview");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"requirement" | "property" | "detail" | "upload" | "docRequest" | "viewingRequest" | "declineDates" | null>(null);
  const [toast, setToast] = useState("");
  const [requirements, setRequirements] = useState<RequirementRecord[]>(seedRequirements);
  const [properties, setProperties] = useState<PropertyRecord[]>(seedProperties);
  const [viewings, setViewings] = useState<ViewingRecord[]>(seedViewings);
  const [selectedProp, setSelectedProp] = useState<PropertyRecord | null>(null);
  const [selectedReq, setSelectedReq] = useState<RequirementRecord | null>(null);
  const [activeViewing, setActiveViewing] = useState<ViewingRecord | null>(null);
  const [editingReq, setEditingReq] = useState<RequirementRecord | null>(null);
  const [editingProp, setEditingProp] = useState<PropertyRecord | null>(null);
  const [uploadStep, setUploadStep] = useState(1);
  const [uploadForReqId, setUploadForReqId] = useState<string | null>(null);
  const [reqFilter, setReqFilter] = useState<"all" | "open" | "draft">("all");

  const roleName = role === "bbc" ? "BrightBridge workspace" : role === "provider" ? "Care provider portal" : "Property partner portal";
  const heading = view === "overview" ? (role === "bbc" ? "Good morning, Dorcas" : role === "provider" ? "Welcome back, Willow Care" : "Welcome back, Kush") : nav.find(n => n.id === view)?.label;
  const filteredProps = properties.filter(p => `${p.name} ${p.area}`.toLowerCase().includes(search.toLowerCase()));

  function notify(message: string) { setToast(message); setTimeout(() => setToast(""), 3200); }
  function changeRole(next: Role) { setRole(next); setView("overview"); setModal(null); }
  function enterAppAs(next: Role) { setRole(next); setScreen("app"); setView("overview"); }
  function backToStart() { setScreen("landing"); setView("overview"); setModal(null); }

  function saveRequirement(fields: any, asDraft: boolean, existingId?: string) {
    if (existingId) {
      setRequirements(prev => prev.map(r => r.id === existingId ? { ...r, ...fields, status: asDraft ? "Draft" : (r.status === "Draft" ? "Open" : r.status) } : r));
      notify(asDraft ? "Draft updated" : "Requirement updated");
    } else {
      const req: RequirementRecord = { id: nextId("REQ"), status: asDraft ? "Draft" : "Open", operator: "Willow Care Group", matchedPropertyIds: [], ...fields };
      setRequirements(prev => [req, ...prev]);
      notify(asDraft ? "Saved as draft — not yet visible to property partners" : `${req.id} posted — every property partner has been notified`);
    }
    setModal(null); setEditingReq(null);
  }
  function publishRequirement(id: string) { setRequirements(prev => prev.map(r => r.id === id ? { ...r, status: "Open" } : r)); notify("Requirement published — every property partner has been notified"); setModal(null); }
  function withdrawRequirement(id: string) { setRequirements(prev => prev.map(r => r.id === id ? { ...r, status: "Withdrawn" } : r)); notify("Requirement withdrawn"); setModal(null); }

  function saveProperty(fields: any, docs: DocItem[], asDraft: boolean, forReqId: string | null, existingId?: string) {
    if (existingId) {
      setProperties(prev => prev.map(p => p.id === existingId ? { ...p, ...fields, documents: docs, status: asDraft ? "Draft" : (p.status === "Draft" ? "Submitted" : p.status) } : p));
      notify(asDraft ? "Draft updated" : "Property updated and submitted to BBC");
    } else {
      let docList = docs;
      if (forReqId) {
        const req = requirements.find(r => r.id === forReqId);
        if (req?.standingDocs) docList = [...docs, { id: nextId("DOC"), label: req.standingDocs, standard: false, onFile: false, shared: false }];
      }
      const prop: PropertyRecord = { id: nextId("PROP"), status: asDraft ? "Draft" : "Submitted", matchedReq: forReqId, documents: docList, ...fields };
      setProperties(prev => [prop, ...prev]);
      notify(asDraft ? "Saved as draft — not yet sent to BBC" : (forReqId ? `Property submitted against ${forReqId} — BBC will review within 10 business days` : "Property submitted — BBC will review within 10 business days"));
    }
    setModal(null); setEditingProp(null);
  }
  function withdrawProperty(id: string) { setProperties(prev => prev.map(p => p.id === id ? { ...p, status: "Withdrawn" } : p)); notify("Property withdrawn"); setModal(null); }
  function decideProperty(id: string, decision: "Accepted" | "Declined") { setProperties(prev => prev.map(p => p.id === id ? { ...p, status: decision } : p)); notify(decision === "Accepted" ? "Property accepted — ready to match to a requirement" : "Property declined"); setModal(null); }
  function matchProperty(propId: string, reqId: string) {
    const req = requirements.find(r => r.id === reqId);
    setProperties(prev => prev.map(p => {
      if (p.id !== propId) return p;
      let docs = p.documents;
      if (req?.standingDocs && !docs.some(d => d.label === req.standingDocs)) docs = [...docs, { id: nextId("DOC"), label: req.standingDocs, standard: false, onFile: false, shared: false }];
      return { ...p, status: "Matched", matchedReq: reqId, documents: docs };
    }));
    setRequirements(prev => prev.map(r => r.id === reqId ? { ...r, status: "Matched", matchedPropertyIds: [...r.matchedPropertyIds, propId] } : r));
    notify(`Matched to ${reqId} — the care provider has been notified`);
    setModal(null);
  }

  function addDocRequest(prop: PropertyRecord, label: string) {
    const doc: DocItem = { id: nextId("DOC"), label, standard: false, onFile: false, shared: false };
    setProperties(prev => prev.map(p => p.id === prop.id ? { ...p, documents: [...p.documents, doc] } : p));
    setSelectedProp(prev => prev && prev.id === prop.id ? { ...prev, documents: [...prev.documents, doc] } : prev);
    notify("Added to the document list — BrightBridge will action this");
  }
  function markDocObtained(propId: string, docId: string) {
    setProperties(prev => prev.map(p => p.id === propId ? { ...p, documents: p.documents.map(d => d.id === docId ? { ...d, onFile: true } : d) } : p));
    setSelectedProp(prev => prev && prev.id === propId ? { ...prev, documents: prev.documents.map(d => d.id === docId ? { ...d, onFile: true } : d) } : prev);
    notify("Marked as obtained");
  }
  function shareDoc(propId: string, docId: string) {
    setProperties(prev => prev.map(p => p.id === propId ? { ...p, documents: p.documents.map(d => d.id === docId ? { ...d, shared: true } : d) } : p));
    setSelectedProp(prev => prev && prev.id === propId ? { ...prev, documents: prev.documents.map(d => d.id === docId ? { ...d, shared: true } : d) } : prev);
    notify("Shared with the care provider");
  }

  function requestViewing(prop: PropertyRecord, dates: string[]) {
    const v: ViewingRecord = { id: nextId("VIEW"), propertyId: prop.id, propertyName: prop.name, reqId: prop.matchedReq, candidateDates: dates, partnerSelectedDate: null, confirmedDate: null, declineNote: null, status: "Requested" };
    setViewings(prev => [v, ...prev]);
    setProperties(prev => prev.map(p => p.id === prop.id ? { ...p, status: "Viewing Requested" } : p));
    notify("Viewing requested — BrightBridge will coordinate with the property source");
    setModal(null);
  }
  function proposeNewDates(viewId: string, dates: string[]) {
    setViewings(prev => prev.map(v => v.id === viewId ? { ...v, candidateDates: dates, partnerSelectedDate: null, declineNote: null, status: "Requested" } : v));
    notify("New dates sent to BrightBridge");
    setModal(null);
  }
  function shareWithPartner(viewId: string) { setViewings(prev => prev.map(v => v.id === viewId ? { ...v, status: "Shared with Property Source" } : v)); notify("Shared with the property source — awaiting their availability"); }
  function partnerPickDate(viewId: string, date: string) { setViewings(prev => prev.map(v => v.id === viewId ? { ...v, partnerSelectedDate: date, status: "Awaiting BBC Confirmation" } : v)); notify("Availability sent to BrightBridge to confirm"); }
  function partnerDecline(viewId: string, note: string) { setViewings(prev => prev.map(v => v.id === viewId ? { ...v, status: "Reschedule Needed", declineNote: note } : v)); notify("Care provider notified — none of the dates worked"); setModal(null); }
  function confirmViewing(viewId: string) {
    const v = viewings.find(x => x.id === viewId);
    setViewings(prev => prev.map(x => x.id === viewId ? { ...x, status: "Confirmed", confirmedDate: x.partnerSelectedDate || "Date to be confirmed" } : x));
    if (v) setProperties(prev => prev.map(p => p.id === v.propertyId ? { ...p, status: "Viewing Confirmed", documents: p.documents.map(d => d.onFile ? { ...d, shared: true } : d) } : p));
    notify("Viewing confirmed — all parties notified by email, compliance documents released to the care provider");
  }

  function partnerSafeReq(r: RequirementRecord) { const { operator, ...rest } = r; return rest; }
  function providerSafeProperty(p: PropertyRecord) { const { ...rest } = p; return rest; }

  const bbcViewingsPending = viewings.filter(v => v.status === "Requested" || v.status === "Awaiting BBC Confirmation").length;
  const partnerViewingsPending = viewings.filter(v => v.status === "Shared with Property Source").length;

  const reqListFiltered = (list: RequirementRecord[]) => reqFilter === "open" ? list.filter(r => r.status === "Open") : reqFilter === "draft" ? list.filter(r => r.status === "Draft") : list;

  // ---- Onboarding: no one lands in a dashboard without creating an account first ----
  if (screen === "landing") return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 40, background: "#fff" }}>
    <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, color: "var(--ink)" }}>Bright<span style={{ color: "var(--purple)" }}>Bridge</span> Connect</div>
    <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 52 }}>Connecting housing with care</div>
    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 28 }}>I am a...</div>
    <div style={{ display: "flex", gap: 20, maxWidth: 620, width: "100%" }}>
      <div onClick={() => setScreen("onboardProvider")} style={{ flex: 1, border: "2px solid var(--line)", borderRadius: 14, padding: "36px 24px", textAlign: "center", cursor: "pointer" }}>
        <div style={{ fontSize: 32, marginBottom: 14 }}>🏥</div>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Care Provider</div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>SLPs, children&apos;s homes, local authorities — submit your property requirements</div>
      </div>
      <div onClick={() => setScreen("onboardPartner")} style={{ flex: 1, border: "2px solid var(--line)", borderRadius: 14, padding: "36px 24px", textAlign: "center", cursor: "pointer" }}>
        <div style={{ fontSize: 32, marginBottom: 14 }}>🔑</div>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Property Partner</div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>Landlords and agents — upload properties for care providers</div>
      </div>
    </div>
    <button className="text-button" style={{ marginTop: 36 }} onClick={() => enterAppAs("bbc")}>BrightBridge team member? Go to internal workspace →</button>
  </div>;

  if (screen === "onboardProvider") return <OnboardProvider onBack={() => setScreen("landing")} onSubmit={() => enterAppAs("provider")}/>;
  if (screen === "onboardPartner") return <OnboardPartner onBack={() => setScreen("landing")} onSubmit={() => enterAppAs("partner")}/>;

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><img src="/brightbridge-logo.png" alt=""/><div><strong>BrightBridge</strong><span>Connect</span></div></div><div className="workspace-label">Workspace</div>
    <button className="role-switch" onClick={() => changeRole(role === "bbc" ? "provider" : role === "provider" ? "partner" : "bbc")}><span className="role-avatar">{role === "bbc" ? "BB" : role === "provider" ? "WC" : "KP"}</span><span><b>{roleName}</b><small>Switch workspace (demo)</small></span><i>⌄</i></button>
    <nav>{nav.map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><span>{item.icon}</span>{item.label}{item.id === "viewings" && role === "bbc" && bbcViewingsPending > 0 && <em>{bbcViewingsPending}</em>}{item.id === "viewings" && role === "partner" && partnerViewingsPending > 0 && <em>{partnerViewingsPending}</em>}</button>)}</nav>
    <div className="sidebar-bottom"><button onClick={() => setView("settings")} className={view === "settings" ? "active" : ""}><span>⚙</span>Settings</button><button onClick={backToStart}><span>⇠</span>Sign out</button><div className="help-card"><span>?</span><strong>Need some help?</strong><small>Visit the support centre</small><button onClick={() => notify("Support centre opened")}>Get support</button></div></div></aside>
    <main className="main"><header><div><p>{roleName}</p><h1>{heading}</h1></div><div className="header-actions"><label className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search platform"/></label><button className="notification" onClick={() => notify("You're all caught up")}>♢<i/></button><button className="avatar">{role === "bbc" ? "DA" : role === "provider" ? "WC" : "KP"}</button></div></header>

      {view === "overview" && <Overview role={role} setView={setView} requirements={requirements} properties={properties} viewings={viewings} openRequirement={() => { setEditingReq(null); setModal("requirement"); }} openProperty={(p: PropertyRecord) => { setSelectedProp(p); setModal("property"); }} notify={notify} onUpload={() => { setEditingProp(null); setUploadForReqId(null); setUploadStep(1); setModal("upload"); }}/>}
      {view === "requirements" && <Requirements role={role} requirements={requirements} reqFilter={reqFilter} setReqFilter={setReqFilter} reqListFiltered={reqListFiltered} openDetail={(r: RequirementRecord) => { setSelectedReq(r); setModal("detail"); }} create={() => { setEditingReq(null); setModal("requirement"); }} partnerSafeReq={partnerSafeReq}/>}
      {view === "properties" && <Properties role={role} items={filteredProps} openProperty={(p: PropertyRecord) => { setSelectedProp(p); setModal("property"); }} add={() => { setEditingProp(null); setUploadForReqId(null); setUploadStep(1); setModal("upload"); }} providerSafeProperty={providerSafeProperty}/>}
      {view === "viewings" && <Viewings role={role} viewings={viewings} shareWithPartner={shareWithPartner} partnerPickDate={partnerPickDate} confirmViewing={confirmViewing} onDeclineDates={(v: ViewingRecord) => { setActiveViewing(v); setModal("declineDates"); }} setView={setView}/>}
      {view === "messages" && <Messages role={role}/>}
      {view === "settings" && <Settings role={role}/>}
    </main>

    {modal === "requirement" && <Modal title={editingReq ? `Edit ${editingReq.id}` : "Post a property requirement"} onClose={() => { setModal(null); setEditingReq(null); }} wide>
      <RequirementForm initial={editingReq} onCancel={() => { setModal(null); setEditingReq(null); }} onSubmit={(fields: any, asDraft: boolean) => saveRequirement(fields, asDraft, editingReq?.id)}/>
    </Modal>}

    {modal === "property" && selectedProp && <PropertyModal role={role} prop={selectedProp} requirements={requirements}
      onClose={() => setModal(null)} onDecide={decideProperty} onMatch={matchProperty}
      onRequestDocs={() => setModal("docRequest")} onMarkObtained={markDocObtained} onShareDoc={shareDoc}
      onRequestViewing={() => setModal("viewingRequest")}
      onEdit={() => { setEditingProp(selectedProp); setUploadForReqId(selectedProp.matchedReq); setUploadStep(1); setModal("upload"); }}
      onWithdraw={() => withdrawProperty(selectedProp.id)}
    />}

    {modal === "docRequest" && selectedProp && <Modal title="Request additional documentation" onClose={() => setModal("property")}>
      <DocRequestForm onCancel={() => setModal("property")} onSubmit={(text: string) => { addDocRequest(selectedProp, text); setModal("property"); }}/>
    </Modal>}

    {modal === "viewingRequest" && selectedProp && <Modal title="Request a viewing" onClose={() => setModal("property")}>
      <ViewingRequestForm onCancel={() => setModal("property")} onSubmit={(dates: string[]) => requestViewing(selectedProp, dates)}/>
    </Modal>}

    {modal === "declineDates" && activeViewing && <Modal title="None of these dates work" onClose={() => setModal("viewings" as any)}>
      <DeclineDatesForm onCancel={() => setModal(null)} onSubmit={(note: string) => { partnerDecline(activeViewing.id, note); setModal(null); }}/>
    </Modal>}

    {modal === "detail" && selectedReq && <RequirementDetailModal role={role} req={selectedReq}
      onClose={() => setModal(null)}
      onEdit={() => { setEditingReq(selectedReq); setModal("requirement"); }}
      onPublish={() => publishRequirement(selectedReq.id)}
      onWithdraw={() => withdrawRequirement(selectedReq.id)}
      onSubmitProperty={() => { setEditingProp(null); setUploadForReqId(selectedReq.id); setUploadStep(1); setModal("upload"); }}
    />}

    {modal === "upload" && <UploadWizard step={uploadStep} setStep={setUploadStep} forReqId={uploadForReqId} initial={editingProp} onCancel={() => { setModal(null); setEditingProp(null); }} onSubmit={(fields: any, docs: DocItem[], asDraft: boolean) => saveProperty(fields, docs, asDraft, uploadForReqId, editingProp?.id)}/>}

    {toast && <div className="toast"><span>✓</span>{toast}</div>}</div>;
}

function Overview({ role, setView, requirements, properties, viewings, openRequirement, openProperty, notify, onUpload }: any) {
  const isBBC = role === "bbc";
  const underReview = properties.filter((p: PropertyRecord) => p.status === "Submitted").length;
  const accepted = properties.filter((p: PropertyRecord) => p.status === "Accepted" || p.status === "Matched").length;
  const providerVisible = properties.filter((p: PropertyRecord) => ["Matched", "Viewing Requested", "Viewing Confirmed"].includes(p.status));
  const openReqs = requirements.filter((r: RequirementRecord) => r.status === "Open").length;
  const pendingViewings = viewings.filter((v: ViewingRecord) => v.status !== "Confirmed").length;
  const stats = isBBC
    ? [["Open requirements", String(openReqs), "Notified to all partners"], ["Properties awaiting review", String(underReview), "Needs a decision"], ["Viewings to coordinate", String(pendingViewings), "Needs action"], ["Properties accepted", String(accepted), "Ready or matched"]]
    : role === "provider"
    ? [["Requirements posted", String(requirements.filter((r: RequirementRecord) => r.status !== "Withdrawn").length), "Including drafts"], ["Matched properties", String(providerVisible.length), "Awaiting your review"], ["Viewings requested", String(viewings.filter((v: ViewingRecord) => v.status !== "Confirmed").length), "In progress"], ["Viewings confirmed", String(viewings.filter((v: ViewingRecord) => v.status === "Confirmed").length), "Scheduled"]]
    : [["Properties submitted", String(properties.filter((p: PropertyRecord) => p.status !== "Withdrawn" && p.status !== "Draft").length), `${underReview} under review`], ["Accepted", String(accepted), "Ready or matched"], ["Viewing requests for you", String(viewings.filter((v: ViewingRecord) => v.status === "Shared with Property Source").length), "Needs your availability"], ["Fees earned", "£750", "Lifetime"]];
  const visibleReqs = role === "partner" ? requirements.filter((r: RequirementRecord) => r.status === "Open").map(({ operator, ...r }: RequirementRecord) => r) : requirements.filter((r: RequirementRecord) => r.status !== "Withdrawn");
  const visibleProps = role === "provider" ? providerVisible : properties.filter((p: PropertyRecord) => p.status !== "Withdrawn");

  return <div className="page-content"><section className="welcome"><p>{isBBC ? "Here's what's happening across the platform today." : role === "provider" ? "Properties are matched to your requirements as BBC finds them." : "New requirements are shared with you the moment they're published."}</p><button className="primary" onClick={role === "provider" ? openRequirement : role === "partner" ? onUpload : () => notify("Use the Properties tab to review submissions")}><span>＋</span>{role === "provider" ? "Post requirement" : isBBC ? "Review properties" : "Submit property"}</button></section>
  <section className="stats-grid">{stats.map((s: string[], i: number) => <article key={s[0]}><div className="stat-icon">{["▤", "◇", "↗", "✓"][i]}</div><span>{s[0]}</span><strong>{s[1]}</strong><small>{s[2]}</small></article>)}</section>
  <div className="content-grid">
    <section className="panel"><div className="panel-head"><div><h2>{isBBC ? "Property review queue" : role === "provider" ? "Matched properties" : "Your recent submissions"}</h2><p>{isBBC ? "Review submissions before they can be matched" : role === "provider" ? "Properties BBC has matched to your requirements" : "Status of properties you've submitted"}</p></div><button className="text-button" onClick={() => setView("properties")}>View all →</button></div>
      <div>{visibleProps.slice(0, 3).map((p: PropertyRecord) => <div className="property-row" key={p.id} onClick={() => openProperty(p)}><div className="building-thumb">⌂</div><div className="row-main"><strong>{p.name}</strong><span>{p.area} · {p.bedrooms} beds</span></div><div className="match"><b>{docSummary(p.documents).split("/")[0]}</b><span>docs</span></div><Status tone={["Accepted", "Matched", "Viewing Confirmed"].includes(p.status) ? "green" : p.status === "Declined" ? "red" : p.status === "Draft" ? "grey" : "amber"}>{p.status}</Status>{isBBC && p.status === "Submitted" && <button className="mini-action" onClick={e => { e.stopPropagation(); openProperty(p); }}>Review</button>}</div>)}
      {visibleProps.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing to show yet.</div>}</div></section>
    <section className="panel"><div className="panel-head"><div><h2>Viewings</h2><p>Live coordination</p></div><button className="text-button" onClick={() => setView("viewings")}>View all →</button></div><div className="pipeline">{viewings.slice(0, 4).map((v: ViewingRecord, i: number) => <div key={v.id}><span className={`pipeline-dot dot-${i % 4}`}></span><div><strong>{v.propertyName}</strong><p>{v.status}</p><small>{v.confirmedDate || v.partnerSelectedDate || v.candidateDates[0]}</small></div></div>)}{viewings.length === 0 && <div style={{ padding: 20, color: "var(--muted)", fontSize: 11 }}>No viewings requested yet.</div>}</div></section>
  </div>
  <section className="panel"><div className="panel-head"><div><h2>{role === "partner" ? "Open requirements" : "Recent requirements"}</h2><p>{role === "partner" ? "Live care-sector demand — submit properties to fulfil them" : "Care needs currently looking for the right property"}</p></div><button className="text-button" onClick={() => setView("requirements")}>View all requirements →</button></div>
  <div className="requirements-row">{visibleReqs.slice(0, 3).map((r: any) => <article key={r.id} onClick={() => setView("requirements")}><div><span>{r.propertyType}</span><Status tone={r.status === "Open" ? "grey" : r.status === "Draft" ? "amber" : "purple"}>{r.status}</Status></div><h3>{r.title}</h3><p>⌖ {r.area}</p><footer><strong>{r.budget}</strong><small>Needed by {r.neededBy}</small></footer></article>)}</div></section></div>;
}

function Requirements({ role, requirements, reqFilter, setReqFilter, reqListFiltered, openDetail, create, partnerSafeReq }: any) {
  const base = role === "partner" ? requirements.filter((r: RequirementRecord) => r.status === "Open").map(partnerSafeReq) : requirements.filter((r: RequirementRecord) => r.status !== "Withdrawn");
  const list = role === "provider" ? reqListFiltered(base) : base;
  return <div className="page-content"><div className="page-toolbar"><p>{role === "partner" ? "Every open requirement here is notified to you the moment it's published — no BBC gatekeeping on this side." : "Manage your requirements — including drafts you haven't published yet."}</p>{role === "provider" && <button className="primary" onClick={create}>＋ Post requirement</button>}</div>
  <section className="panel">{role === "provider" && <div className="filterbar">
    <button className={reqFilter === "all" ? "selected" : ""} onClick={() => setReqFilter("all")}>All <b>{base.length}</b></button>
    <button className={reqFilter === "open" ? "selected" : ""} onClick={() => setReqFilter("open")}>Open <b>{base.filter((r: any) => r.status === "Open").length}</b></button>
    <button className={reqFilter === "draft" ? "selected" : ""} onClick={() => setReqFilter("draft")}>Drafts <b>{base.filter((r: any) => r.status === "Draft").length}</b></button>
  </div>}
  <div className="data-table"><div className="table-header"><span>Requirement</span><span>Location</span><span>Budget</span><span>Status</span><span>Needed by</span></div>
  {list.map((r: any, i: number) => <button className="data-row" key={i} onClick={() => openDetail(r)}><span><b>{r.title || "Untitled draft"}</b><small>{r.id} · {r.serviceType}</small></span><span>{r.area}</span><span>{r.budget}</span><span><Status tone={r.status === "Open" ? "grey" : r.status === "Draft" ? "amber" : "purple"}>{r.status}</Status></span><span>{r.neededBy}　→</span></button>)}
  {list.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing matches this filter.</div>}</div></section></div>;
}

function RequirementDetailModal({ role, req, onClose, onEdit, onPublish, onWithdraw, onSubmitProperty }: any) {
  const actions = role === "provider" && req.status !== "Withdrawn" ? [{ icon: "✎", label: "Edit", onClick: onEdit }, ...(req.status === "Open" ? [{ icon: "⊘", label: "Withdraw", onClick: onWithdraw, danger: true }] : [])] : [];
  return <Modal title={`${req.id} · Requirement`} onClose={onClose} actions={actions} wide>
    <div className="requirement-detail"><Status tone={req.status === "Open" ? "grey" : req.status === "Draft" ? "amber" : "purple"}>{req.status}{req.matchedPropertyIds?.length ? ` · ${req.matchedPropertyIds.length} matched` : ""}</Status><h2>{req.title || "Untitled draft"}</h2>
    <p>{role === "partner" ? "A care provider is seeking a long-term property matching this brief." : `${req.operator ?? "A care provider"} is seeking a long-term property for this brief.`}</p>
    <div className="detail-grid"><div><small>Location</small><strong>{req.area || "—"}</strong></div><div><small>Budget</small><strong>{req.budget || "—"}</strong></div><div><small>Needed by</small><strong>{req.neededBy || "—"}</strong></div><div><small>Lease</small><strong>{req.leaseLength || "—"}</strong></div>
    <div><small>Bedrooms</small><strong>{req.bedrooms || "—"}</strong></div><div><small>Capacity</small><strong>{req.capacity || "—"}</strong></div><div><small>Resident profile</small><strong>{req.residentProfile || "—"}</strong></div><div><small>Property type</small><strong>{req.propertyType}</strong></div></div>
    {req.accessibility?.length > 0 && <><h3>Accessibility requirements</h3><div className="tag-row">{req.accessibility.map((a: string) => <span key={a}>{a}</span>)}</div></>}
    <div className="tag-row" style={{ marginTop: 10 }}>{req.outdoorSpace && <span>Outdoor space required</span>}{req.parking && <span>Parking required</span>}</div>
    {req.standingDocs && <div className="modal-section"><h3>Standard documentation requested for every match</h3><p style={{ fontSize: 12, color: "var(--muted)" }}>{req.standingDocs}</p></div>}
    {req.notes && <div className="modal-section"><h3>Additional notes</h3><p style={{ fontSize: 12, color: "var(--muted)" }}>{req.notes}</p></div>}
    </div>
    <div className="form-actions">
      {role === "provider" && req.status === "Draft" && <button className="primary" onClick={onPublish}>Publish</button>}
      {role === "partner" && req.status === "Open" && <button className="primary" onClick={onSubmitProperty}>Submit a matching property</button>}
    </div>
  </Modal>;
}

function Properties({ role, items, openProperty, add, providerSafeProperty }: any) {
  const visible = role === "provider"
    ? items.filter((p: PropertyRecord) => ["Matched", "Viewing Requested", "Viewing Confirmed"].includes(p.status)).map(providerSafeProperty)
    : items.filter((p: PropertyRecord) => p.status !== "Withdrawn");
  return <div className="page-content"><div className="page-toolbar"><p>{role === "bbc" ? "Review, accept and match every submitted property." : role === "provider" ? "Properties BBC has matched to your requirements." : "Track your submitted properties, including drafts. You can withdraw a property at any point if it's no longer available."}</p>{role === "partner" && <button className="primary" onClick={add}>＋ Upload property</button>}</div>
  <div className="property-cards">{visible.map((p: any) => <article key={p.id} onClick={() => openProperty(p)}><div className="property-image"><span>{docSummary(p.documents)}</span><div>⌂</div></div><div className="card-content"><div><Status tone={["Accepted", "Matched", "Viewing Confirmed"].includes(p.status) ? "green" : p.status === "Declined" ? "red" : p.status === "Draft" ? "grey" : "amber"}>{p.status}</Status><small>{p.id}</small></div><h3>{p.name || "Untitled draft"}</h3><p>{p.area}</p><div className="property-meta"><span><b>{p.bedrooms}</b> beds</span><span><b>{p.condition}</b></span><span><b>{p.rent}</b></span></div><button className="secondary">View property →</button></div></article>)}
  {visible.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing to show yet.</div>}</div></div>;
}

function PropertyModal({ role, prop, requirements, onClose, onDecide, onMatch, onRequestDocs, onMarkObtained, onShareDoc, onRequestViewing, onEdit, onWithdraw }: any) {
  const partnerActions = role === "partner" && prop.status !== "Withdrawn" ? [{ icon: "✎", label: "Edit", onClick: onEdit }, { icon: "⊘", label: "Withdraw — no longer available", onClick: onWithdraw, danger: true }] : [];

  return <Modal title={`${prop.id} · Property`} onClose={onClose} actions={partnerActions} wide>
    <div className="property-hero"><div><Status tone={["Accepted", "Matched", "Viewing Confirmed"].includes(prop.status) ? "green" : prop.status === "Declined" ? "red" : prop.status === "Draft" ? "grey" : "amber"}>{prop.status}</Status><h2>{prop.name || "Untitled draft"}</h2><p>{prop.area} · {prop.bedrooms} bedrooms · {prop.bathrooms} bathrooms · {prop.rent}</p></div><div className="property-art">⌂</div></div>

    <div className="modal-section"><h3>Photos</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {["Living room", "Kitchen", "Bedroom 1", "Bedroom 2", "Bathroom", "Exterior"].map(label => (
          <div key={label} style={{ aspectRatio: "4/3", background: "linear-gradient(135deg, var(--surface), #e9e7ec)", borderRadius: 8, display: "flex", alignItems: "flex-end", padding: 8, fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>{label}</div>
        ))}
      </div>
    </div>

    {prop.description && <div className="modal-section"><h3>Description</h3><p style={{ fontSize: 12, color: "var(--muted)" }}>{prop.description}</p></div>}

    {role === "provider" ? (
      <>
        <div className="modal-section">
          <h3>Documents</h3>
          <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>We collect these for every property. Raw documents can include the property owner&apos;s name and contact details, so they&apos;re held back until your viewing is confirmed — at which point everything on file is released automatically. Need something sooner? Ask below.</p>
          {prop.documents.map((d: DocItem) => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontSize: 12 }}><span style={{ fontWeight: 600 }}>{d.label}</span>{!d.standard && <span style={{ color: "var(--purple)", fontSize: 10, marginLeft: 6 }}>Requested</span>}</div>
              <Status tone={d.shared ? "green" : d.onFile ? "amber" : "grey"}>{d.shared ? "Shared with you" : d.onFile ? "On file" : "Not yet provided"}</Status>
            </div>
          ))}
          <button className="secondary" style={{ marginTop: 14 }} onClick={onRequestDocs}>Request additional documentation</button>
        </div>

        {(prop.status === "Viewing Requested" || prop.status === "Viewing Confirmed") && <div className="modal-section"><Status tone={prop.status === "Viewing Confirmed" ? "green" : "amber"}>{prop.status === "Viewing Confirmed" ? "Viewing confirmed — see Viewings for the date" : "Viewing requested — BrightBridge is coordinating"}</Status></div>}
        <div className="form-actions">{prop.status === "Matched" && <button className="primary" onClick={onRequestViewing}>Request a viewing</button>}</div>
      </>
    ) : (
      <>
        <div className="modal-section">
          <h3>Documents</h3>
          {prop.documents.map((d: DocItem) => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontSize: 12 }}><span style={{ fontWeight: 600 }}>{d.label}</span>{!d.standard && <span style={{ color: "var(--purple)", fontSize: 10, marginLeft: 6 }}>Requested by care provider</span>}{REQUIRED_LABELS.includes(d.label) && !d.onFile && <span style={{ color: "#c23b3b", fontSize: 10, marginLeft: 6, fontWeight: 700 }}>required</span>}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {!d.onFile && <button className="secondary" style={{ fontSize: 10, padding: "6px 10px" }} onClick={() => onMarkObtained(prop.id, d.id)}>Mark as obtained</button>}
                {d.onFile && !d.shared && role === "bbc" && <button className="secondary" style={{ fontSize: 10, padding: "6px 10px" }} onClick={() => onShareDoc(prop.id, d.id)}>Share now</button>}
                {d.onFile && !d.shared && role === "partner" && <Status tone="amber">On file</Status>}
                {d.shared && <Status tone="green">Shared</Status>}
              </div>
            </div>
          ))}
        </div>

        {role === "bbc" && prop.status === "Submitted" && <div className="form-actions"><button className="secondary" onClick={() => onDecide(prop.id, "Declined")}>Decline</button><button className="primary" onClick={() => onDecide(prop.id, "Accepted")}>Accept property</button></div>}
        {role === "bbc" && prop.status === "Accepted" && <div className="modal-section"><h3>Match to a requirement</h3><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{requirements.filter((r: RequirementRecord) => r.status === "Open").map((r: RequirementRecord) => (<button key={r.id} className="secondary" style={{ textAlign: "left" }} onClick={() => onMatch(prop.id, r.id)}>{r.id} — {r.title} ({r.operator})</button>))}{requirements.filter((r: RequirementRecord) => r.status === "Open").length === 0 && <p style={{ fontSize: 11, color: "var(--muted)" }}>No open requirements to match against right now.</p>}</div></div>}
      </>
    )}
  </Modal>;
}

function Viewings({ role, viewings, shareWithPartner, partnerPickDate, confirmViewing, onDeclineDates, setView }: any) {
  if (viewings.length === 0) return <div className="page-content"><div className="page-toolbar"><p>No viewings requested yet.</p></div></div>;
  const visible = role === "partner" ? viewings.filter((v: ViewingRecord) => v.status !== "Requested") : viewings;

  return <div className="page-content"><div className="page-toolbar"><p>{role === "bbc" ? "Coordinate every viewing between the care provider and the property source." : role === "partner" ? "Viewing requests BrightBridge has shared with you." : "Track your requested viewings through to a confirmed date."}</p></div>
  {visible.map((v: ViewingRecord) => (
    <div className="panel" key={v.id} style={{ marginBottom: 14, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div><strong style={{ fontSize: 13 }}>{v.propertyName}</strong><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{v.id} · {v.reqId || "—"}</div></div>
        <Status tone={v.status === "Confirmed" ? "green" : v.status === "Reschedule Needed" ? "red" : v.status === "Awaiting BBC Confirmation" ? "amber" : "purple"}>{v.status}</Status>
      </div>

      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Candidate dates: <strong style={{ color: "var(--ink)" }}>{v.candidateDates.join(" · ")}</strong></div>
      {v.partnerSelectedDate && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Property source can do: <strong style={{ color: "var(--ink)" }}>{v.partnerSelectedDate}</strong></div>}
      {v.declineNote && <div style={{ fontSize: 12, color: "#c23b3b", marginBottom: 10 }}>None of these worked: &quot;{v.declineNote}&quot;</div>}
      {v.confirmedDate && <div style={{ fontSize: 12, color: "var(--green)", marginBottom: 10, fontWeight: 700 }}>Confirmed: {v.confirmedDate}</div>}

      {role === "bbc" && v.status === "Requested" && <button className="primary" style={{ fontSize: 11 }} onClick={() => shareWithPartner(v.id)}>Share with property source</button>}
      {role === "bbc" && v.status === "Awaiting BBC Confirmation" && <button className="primary" style={{ fontSize: 11 }} onClick={() => confirmViewing(v.id)}>Confirm viewing &amp; notify all parties</button>}
      {role === "bbc" && v.status === "Reschedule Needed" && <p style={{ fontSize: 11, color: "var(--muted)" }}>Waiting on the care provider to propose new dates, or <span style={{ color: "var(--purple)", cursor: "pointer" }} onClick={() => setView("messages")}>discuss in Messages</span>.</p>}

      {role === "partner" && v.status === "Shared with Property Source" && <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {v.candidateDates.map((d: string) => <button key={d} className="secondary" style={{ fontSize: 11 }} onClick={() => partnerPickDate(v.id, d)}>Available {d}</button>)}
        <button className="secondary" style={{ fontSize: 11, color: "#c23b3b" }} onClick={() => onDeclineDates(v)}>None of these work</button>
      </div>}

      {role === "provider" && v.status === "Reschedule Needed" && <p style={{ fontSize: 11, color: "var(--muted)" }}>Open this property and request a viewing again with new dates, or <span style={{ color: "var(--purple)", cursor: "pointer" }} onClick={() => setView("messages")}>message BrightBridge</span>.</p>}
    </div>
  ))}
  {visible.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing here yet.</div>}
  </div>;
}

function Messages({ role }: any) {
  const threads = role === "bbc" ? ["Willow Care Group", "Kush Properties", "Horizon Supported Living"] : ["BrightBridge Team"];
  const [active, setActive] = useState(0);
  return <div className="page-content message-layout"><section className="conversation-list"><div className="message-search">⌕ Search conversations</div>{threads.map((p, i) => <button className={active === i ? "active" : ""} onClick={() => setActive(i)} key={p}><span>{p.split(" ").map(x => x[0]).slice(0, 2).join("")}</span><div><strong>{p}</strong><p>{i === 0 ? "The viewing dates didn't work…" : "Thanks, I'll send that over…"}</p></div><small>{i === 0 ? "09:42" : "Yesterday"}</small></button>)}</section>
  <section className="chat"><header><div className="avatar">{threads[active].split(" ").map(x => x[0]).slice(0, 2).join("")}</div><div><strong>{threads[active]}</strong><p>{role === "bbc" ? "Regarding an active viewing" : "Your BrightBridge point of contact"}</p></div></header>
  <div className="chat-body"><span className="date-label">Today</span><div className="bubble incoming">None of the dates we proposed work for the property owner — could we look at the following week instead?</div><div className="bubble outgoing">Of course — I&apos;ll ask the care provider for fresh availability and come back to you.</div></div>
  <form className="composer" onSubmit={e => e.preventDefault()}><button>＋</button><input placeholder="Write a message…"/><button className="send">↑</button></form></section></div>;
}

function Settings({ role }: any) {
  return <div className="page-content settings"><section className="panel"><h2>Workspace profile</h2><p>Manage the organisation details shown across BrightBridge Connect.</p>
  <div className="profile-block"><div className="large-avatar">{role === "bbc" ? "BB" : role === "provider" ? "WC" : "KP"}</div><button className="secondary">Change logo</button></div>
  <div className="form"><div className="field"><label>Organisation name</label><input defaultValue={role === "bbc" ? "Bright Bridge Connect Ltd" : role === "provider" ? "Willow Care Group" : "Kush Properties"}/></div>
  <div className="field"><label>Contact email</label><input defaultValue="hello@brightbridgeconnect.co.uk"/></div>
  <div className="field full"><label>Office address</label><input defaultValue="Birmingham, United Kingdom"/></div>
  <div className="form-actions"><button className="primary">Save changes</button></div></div></section></div>;
}

const LOCATIONS = ["Warrington", "St Helens", "Wider Cheshire", "Greater Manchester", "Yorkshire", "West Midlands", "Staffordshire", "North London", "North West"];

function OnboardProvider({ onBack, onSubmit }: { onBack: () => void; onSubmit: () => void }) {
  const [locs, setLocs] = useState<string[]>([]);
  const toggle = (l: string) => setLocs(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  return <div style={{ minHeight: "100vh", background: "#fff" }}>
    <div style={{ padding: "16px 28px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ fontWeight: 800 }}>Bright<span style={{ color: "var(--purple)" }}>Bridge</span> Connect</span>
      <span onClick={onBack} style={{ fontSize: 12, color: "var(--purple)", cursor: "pointer", fontWeight: 600 }}>← Back</span>
    </div>
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--purple)", fontWeight: 700, marginBottom: 8 }}>Care Provider</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Tell us about your organisation</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28 }}>You&apos;ll only hear from us when we find a genuine match. No browsing, no noise.</div>
      <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="form">
        <div className="field full"><label>Organisation name</label><input required placeholder="e.g. Willow Care Group"/></div>
        <div className="field"><label>Contact name</label><input required placeholder="Full name"/></div>
        <div className="field"><label>Phone</label><input required placeholder="07XXX XXXXXX"/></div>
        <div className="field full"><label>Email</label><input required type="email" placeholder="you@company.co.uk"/></div>
        <div className="field full"><label>Service category</label><select required><option value="">Select category</option><option>Supported living</option><option>Children&apos;s home</option><option>Local authority</option><option>Housing association / RSL</option><option>Other</option></select></div>
        <div className="field full">
          <label>Where are you looking for properties?</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {LOCATIONS.map(l => <span key={l} onClick={() => toggle(l)} style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: `1px solid ${locs.includes(l) ? "var(--purple)" : "var(--line)"}`, background: locs.includes(l) ? "var(--purple-soft)" : "transparent", color: locs.includes(l) ? "var(--purple)" : "var(--muted)" }}>{l}</span>)}
          </div>
        </div>
        <div className="form-actions"><button type="button" className="secondary" onClick={onBack}>Cancel</button><button className="primary">Create account</button></div>
      </form>
    </div>
  </div>;
}

function OnboardPartner({ onBack, onSubmit }: { onBack: () => void; onSubmit: () => void }) {
  return <div style={{ minHeight: "100vh", background: "#fff" }}>
    <div style={{ padding: "16px 28px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ fontWeight: 800 }}>Bright<span style={{ color: "var(--purple)" }}>Bridge</span> Connect</span>
      <span onClick={onBack} style={{ fontSize: 12, color: "var(--purple)", cursor: "pointer", fontWeight: 600 }}>← Back</span>
    </div>
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--purple)", fontWeight: 700, marginBottom: 8 }}>Property Partner</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Tell us about yourself</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28 }}>Whether you&apos;re a landlord with a single property or an agent with a portfolio, the same process applies.</div>
      <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="form">
        <div className="field full"><label>Name</label><input required placeholder="Full name"/></div>
        <div className="field"><label>Email</label><input required type="email" placeholder="you@email.com"/></div>
        <div className="field"><label>Phone</label><input required placeholder="07XXX XXXXXX"/></div>
        <div className="field full"><label>Organisation</label><input placeholder="Leave blank if you're an individual landlord"/></div>
        <div className="form-actions"><button type="button" className="secondary" onClick={onBack}>Cancel</button><button className="primary">Create account</button></div>
      </form>
    </div>
  </div>;
}


const ACCESSIBILITY_OPTIONS = ["Ground floor bedroom", "Wheelchair accessible", "Wet room", "Step-free access", "Wider doorways"];

function RequirementForm({ initial, onCancel, onSubmit }: { initial: RequirementRecord | null; onCancel: () => void; onSubmit: (f: any, asDraft: boolean) => void }) {
  const [f, setF] = useState({
    title: initial?.title || "", area: initial?.area || "", serviceType: initial?.serviceType || "Supported living",
    residentProfile: initial?.residentProfile || "", propertyType: initial?.propertyType || "Family Home (2-3 bed)",
    bedrooms: initial ? String(initial.bedrooms) : "", capacity: initial?.capacity || "",
    budget: initial?.budget || "", leaseLength: initial?.leaseLength || "", neededBy: initial?.neededBy || "",
    accessibility: initial?.accessibility || [] as string[], outdoorSpace: initial?.outdoorSpace || false, parking: initial?.parking || false,
    standingDocs: initial?.standingDocs || "", notes: initial?.notes || "",
  });
  const set = (k: string, v: any) => setF(prev => ({ ...prev, [k]: v }));
  const toggleAccess = (opt: string) => setF(prev => ({ ...prev, accessibility: prev.accessibility.includes(opt) ? prev.accessibility.filter(a => a !== opt) : [...prev.accessibility, opt] }));

  return <form onSubmit={e => { e.preventDefault(); onSubmit(f, false); }} className="form">
    <div className="field full"><label>What property do you need?</label><input required value={f.title} onChange={e => set("title", e.target.value)} placeholder="e.g. 6-bed supported living home"/></div>
    <div className="field"><label>Location</label><input required value={f.area} onChange={e => set("area", e.target.value)} placeholder="Town, borough or postcode"/></div>
    <div className="field"><label>Service type</label><select value={f.serviceType} onChange={e => set("serviceType", e.target.value)}><option>Supported living</option><option>Children&apos;s home</option><option>Local authority</option><option>Housing association / RSL</option></select></div>
    <div className="field"><label>Resident profile</label><select value={f.residentProfile} onChange={e => set("residentProfile", e.target.value)}><option value="">Select</option><option>Adults with learning disabilities</option><option>Adults with physical disabilities</option><option>Adults with mental health needs</option><option>Young people leaving care</option><option>Older adults</option><option>Other</option></select></div>
    <div className="field"><label>Property type</label><select value={f.propertyType} onChange={e => set("propertyType", e.target.value)}><option>Family Home (2-3 bed)</option><option>HMO (up to 6 bed)</option><option>Larger Format (7+ bed)</option></select></div>
    <div className="field"><label>Bedrooms needed</label><input type="number" min="1" required value={f.bedrooms} onChange={e => set("bedrooms", e.target.value)} placeholder="e.g. 6"/></div>
    <div className="field"><label>Resident capacity</label><input value={f.capacity} onChange={e => set("capacity", e.target.value)} placeholder="e.g. 5-6 residents"/></div>
    <div className="field"><label>Maximum monthly rent</label><input required value={f.budget} onChange={e => set("budget", e.target.value)} placeholder="£3,500 pcm"/></div>
    <div className="field"><label>Minimum lease length</label><input value={f.leaseLength} onChange={e => set("leaseLength", e.target.value)} placeholder="e.g. Minimum 5 years"/></div>
    <div className="field"><label>Needed by</label><input type="date" onChange={e => set("neededBy", new Date(e.target.value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))}/></div>

    <div className="field full">
      <label>Accessibility requirements</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
        {ACCESSIBILITY_OPTIONS.map(opt => <label key={opt} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, border: "1px solid var(--line)", borderRadius: 20, padding: "6px 12px", cursor: "pointer", background: f.accessibility.includes(opt) ? "var(--purple-soft)" : "transparent" }}>
          <input type="checkbox" checked={f.accessibility.includes(opt)} onChange={() => toggleAccess(opt)} style={{ margin: 0 }}/> {opt}
        </label>)}
      </div>
    </div>
    <div className="field"><label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={f.outdoorSpace} onChange={e => set("outdoorSpace", e.target.checked)}/> Outdoor space required</label></div>
    <div className="field"><label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={f.parking} onChange={e => set("parking", e.target.checked)}/> Parking required</label></div>

    <div className="field full"><label>Standard documentation for every match</label><textarea value={f.standingDocs} onChange={e => set("standingDocs", e.target.value)} placeholder="Anything you always need to see, beyond the standard six compliance documents — this gets added automatically to every property matched to this requirement."/></div>
    <div className="field full"><label>Additional notes</label><textarea value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Anything else worth knowing…"/></div>
    <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="button" className="secondary" onClick={() => onSubmit(f, true)}>Save as draft</button><button className="primary">{initial ? "Save & publish" : "Post requirement"}</button></div>
  </form>;
}

function DocRequestForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");
  return <div style={{ padding: "22px 24px" }}>
    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>This gets added straight to the document list for this property.</p>
    <textarea value={text} onChange={e => setText(e.target.value)} placeholder="e.g. Planning permission history" style={{ width: "100%", minHeight: 90, border: "1px solid var(--line)", borderRadius: 9, padding: 12, fontSize: 12, fontFamily: "inherit" }}/>
    <div className="form-actions" style={{ margin: "16px -24px -22px", padding: "16px 24px 0" }}><button className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={!text.trim()} onClick={() => onSubmit(text.trim())}>Add to document list</button></div>
  </div>;
}

function ViewingRequestForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (dates: string[]) => void }) {
  const [slots, setSlots] = useState([{ date: "", time: "" }, { date: "", time: "" }, { date: "", time: "" }]);
  const setSlot = (i: number, k: "date" | "time", v: string) => setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  const valid = slots.filter(s => s.date).map(s => `${new Date(s.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}${s.time ? `, ${s.time}` : ""}`);
  return <div style={{ padding: "22px 24px" }}>
    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Offer up to three dates and times that would work. We&apos;ll coordinate with the property source and confirm one.</p>
    {slots.map((s, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      <input type="date" value={s.date} onChange={e => setSlot(i, "date", e.target.value)} style={{ flex: 2, border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}/>
      <input type="time" value={s.time} onChange={e => setSlot(i, "time", e.target.value)} style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}/>
    </div>)}
    <div className="form-actions" style={{ margin: "16px -24px -22px", padding: "16px 24px 0" }}><button className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={valid.length === 0} onClick={() => onSubmit(valid)}>Request viewing</button></div>
  </div>;
}

function DeclineDatesForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (note: string) => void }) {
  const [note, setNote] = useState("");
  return <div style={{ padding: "22px 24px" }}>
    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Let BrightBridge know why, so they can ask the care provider for better dates.</p>
    <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Not available any of those days — could do the following week instead" style={{ width: "100%", minHeight: 80, border: "1px solid var(--line)", borderRadius: 9, padding: 12, fontSize: 12, fontFamily: "inherit" }}/>
    <div className="form-actions" style={{ margin: "16px -24px -22px", padding: "16px 24px 0" }}><button className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={!note.trim()} onClick={() => onSubmit(note.trim())}>Send to BrightBridge</button></div>
  </div>;
}

function UploadWizard({ step, setStep, forReqId, initial, onCancel, onSubmit }: { step: number; setStep: (n: number) => void; forReqId: string | null; initial: PropertyRecord | null; onCancel: () => void; onSubmit: (f: any, docs: DocItem[], asDraft: boolean) => void }) {
  const [f, setF] = useState({
    name: initial?.name || "", area: initial?.area || "", propertyType: initial?.propertyType || "Family Home (2-3 bed)",
    bedrooms: initial ? String(initial.bedrooms) : "", bathrooms: initial ? String(initial.bathrooms) : "", condition: initial?.condition || "Furnished",
    rent: initial?.rent || "", availableFrom: initial?.availableFrom || "", description: initial?.description || "",
  });
  const [docs, setDocs] = useState<DocItem[]>(initial?.documents || standardDocs());
  const set = (k: string, v: string) => setF(prev => ({ ...prev, [k]: v }));
  const setAddress = (v: string) => setF(prev => ({ ...prev, name: v, area: v }));
  const toggleDoc = (id: string) => setDocs(prev => prev.map(d => d.id === id ? { ...d, onFile: !d.onFile } : d));
  const labels = ["Property Details", "Images", "Compliance", "Review"];

  return <div className="modal-backdrop" onMouseDown={onCancel}><div className="modal" style={{ width: "min(780px,100%)" }} onMouseDown={e => e.stopPropagation()}>
    <div className="modal-head"><h2>{initial ? `Edit ${initial.id}` : forReqId ? `Submit a property for ${forReqId}` : "Submit a property"}</h2><button className="icon-button" onClick={onCancel}>×</button></div>
    <div style={{ display: "flex", gap: 4, padding: "0 24px" }}>{labels.map((l, i) => (
      <div key={l} style={{ flex: 1, textAlign: "center" }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: i + 1 <= step ? "var(--ink)" : "#f0eef1", color: i + 1 <= step ? "#fff" : "var(--muted)" }}>{i + 1}</div>
        <div style={{ fontSize: 10, color: i + 1 <= step ? "var(--ink)" : "var(--muted)", fontWeight: i + 1 === step ? 700 : 400 }}>{l}</div>
        <div style={{ height: 3, background: i + 1 <= step ? "var(--ink)" : "#f0eef1", borderRadius: 2, marginTop: 6 }} />
      </div>))}</div>

    {step === 1 && <div className="form" style={{ paddingTop: 22 }}>
      <div className="field full"><label>Address</label><input required value={f.name} onChange={e => setAddress(e.target.value)} placeholder="42 Wellington Road, Birmingham, B15 3AB"/></div>
      <div className="field"><label>Property type</label><select value={f.propertyType} onChange={e => set("propertyType", e.target.value)}><option>Family Home (2-3 bed)</option><option>HMO (up to 6 bed)</option><option>Larger Format (7+ bed)</option></select></div>
      <div className="field"><label>Bedrooms</label><input type="number" required value={f.bedrooms} onChange={e => set("bedrooms", e.target.value)} placeholder="e.g. 6"/></div>
      <div className="field"><label>Bathrooms</label><input type="number" value={f.bathrooms} onChange={e => set("bathrooms", e.target.value)} placeholder="e.g. 2"/></div>
      <div className="field"><label>Condition</label><select value={f.condition} onChange={e => set("condition", e.target.value)}><option>Furnished</option><option>Unfurnished</option><option>Needs refurbishment</option></select></div>
      <div className="field"><label>Monthly rent</label><input required value={f.rent} onChange={e => set("rent", e.target.value)} placeholder="£1,800 pcm"/></div>
      <div className="field"><label>Available from</label><input type="date" onChange={e => set("availableFrom", new Date(e.target.value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))}/></div>
      <div className="field full"><label>Description</label><textarea value={f.description} onChange={e => set("description", e.target.value)} placeholder="Describe the property and what makes it suitable for care providers…"/></div>
    </div>}

    {step === 2 && <div style={{ padding: "22px 24px" }}>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Minimum 6 photos — living room, kitchen, bedrooms, bathrooms, exterior.</p>
      <div style={{ border: "2px dashed var(--line)", borderRadius: 12, padding: "48px 20px", textAlign: "center", color: "var(--muted)" }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>📷</div>
        <div style={{ fontSize: 12, fontWeight: 700 }}>Drag images here or click to browse</div>
        <div style={{ fontSize: 10, marginTop: 4 }}>JPG, PNG — max 5MB each</div>
      </div>
    </div>}

    {step === 3 && <div style={{ padding: "22px 24px" }}>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Upload certificates where available. Properties with complete documentation are reviewed faster.</p>
      {docs.filter(d => d.standard).map(d => (
        <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{d.label}{REQUIRED_LABELS.includes(d.label) && <span style={{ color: "#c23b3b", marginLeft: 6, fontWeight: 700, fontSize: 10 }}>Required</span>}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="date" style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "6px 8px", fontSize: 10, width: 110 }} title="Issue date"/>
            <input type="date" style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "6px 8px", fontSize: 10, width: 110 }} title="Expiry date"/>
            <button type="button" className="secondary" style={{ fontSize: 10, padding: "7px 10px" }} onClick={() => toggleDoc(d.id)}>{d.onFile ? "✓ Uploaded" : "↑ Upload"}</button>
          </div>
        </div>
      ))}
    </div>}

    {step === 4 && <div style={{ padding: "22px 24px" }}>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Check everything below before submitting to BBC.</p>
      <div className="detail-grid" style={{ padding: "14px 0" }}>
        <div><small>Address</small><strong>{f.name || "—"}</strong></div>
        <div><small>Type</small><strong>{f.propertyType}</strong></div>
        <div><small>Bedrooms</small><strong>{f.bedrooms || "—"}</strong></div>
        <div><small>Rent</small><strong>{f.rent || "—"}</strong></div>
        <div><small>Compliance</small><strong>{docs.filter(d => d.onFile).length} / {docs.length} uploaded</strong></div>
        <div><small>Required docs</small><strong>{docs.filter(d => REQUIRED_LABELS.includes(d.label) && d.onFile).length} / {REQUIRED_LABELS.length}</strong></div>
      </div>
      <p style={{ fontSize: 11, color: "#95631b", background: "var(--amber-bg)", padding: "10px 12px", borderRadius: 8, marginTop: 8 }}>⚠ Submitting does not mean the property has been accepted or matched. BBC will review within 10 business days.</p>
    </div>}

    <div className="form-actions">
      <button type="button" className="secondary" onClick={() => step === 1 ? onCancel() : setStep(step - 1)}>{step === 1 ? "Cancel" : "Back"}</button>
      <div style={{ display: "flex", gap: 10 }}>
        {step === 4 && <button type="button" className="secondary" onClick={() => onSubmit(f, docs, true)}>Save as draft</button>}
        {step < 4 ? <button className="primary" onClick={() => setStep(step + 1)}>Continue</button> : <button className="primary" onClick={() => onSubmit(f, docs, false)}>{initial ? "Save & submit" : "Submit property"}</button>}
      </div>
    </div>
  </div></div>;
}
