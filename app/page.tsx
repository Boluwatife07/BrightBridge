"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */

import { useState } from "react";

type Role = "provider" | "partner" | "bbc";
type View = "overview" | "requirements" | "properties" | "viewings" | "messages" | "settings";

const CERT_LABELS: Record<string, string> = {
  eicr: "EICR (Electrical Installation)",
  gasSafety: "Gas Safety Certificate (CP12)",
  epc: "EPC (Energy Performance)",
  fireRisk: "Fire Risk Assessment",
  hmoLicence: "HMO Licence (if applicable)",
  legionella: "Legionella Assessment",
};
const REQUIRED_CERTS = ["eicr", "gasSafety", "epc", "fireRisk"];
const emptyCerts = () => Object.fromEntries(Object.keys(CERT_LABELS).map(k => [k, false])) as Record<string, boolean>;

type PropertyRecord = {
  id: string; name: string; area: string; propertyType: string; bedrooms: string | number; condition: string; rent: string; availableFrom: string;
  status: string; matchedReq: string | null; certs: Record<string, boolean>; docRequests: string[];
};
type RequirementRecord = {
  id: string; title: string; area: string; serviceType: string; propertyType: string; bedrooms: string | number; budget: string; leaseLength: string; neededBy: string;
  status: string; operator: string; matchedPropertyIds: string[];
};
type ViewingRecord = {
  id: string; propertyId: string; propertyName: string; reqId: string | null;
  proposedByProvider: string; partnerProposedDate: string | null; confirmedDate: string | null;
  status: "Requested" | "Shared with Property Source" | "Date Proposed" | "Confirmed";
};

const seedRequirements: RequirementRecord[] = [
  { id: "REQ-1048", title: "6-bed supported living home", area: "Wolverhampton", serviceType: "Supported living", propertyType: "HMO (up to 6 bed)", bedrooms: 6, budget: "£3,600 pcm", leaseLength: "Minimum 5 years", neededBy: "12 Oct 2026", status: "Open", operator: "Willow Care Group", matchedPropertyIds: [] },
  { id: "REQ-1044", title: "Children's home with garden", area: "Stoke-on-Trent", serviceType: "Children's home", propertyType: "Larger Format (7+ bed)", bedrooms: 7, budget: "£4,200 pcm", leaseLength: "Minimum 5 years", neededBy: "1 Nov 2026", status: "Open", operator: "Horizon Supported Living", matchedPropertyIds: [] },
  { id: "REQ-1039", title: "Accessible 4-bed bungalow", area: "Walsall", serviceType: "Supported living", propertyType: "Family Home (2-3 bed)", bedrooms: 4, budget: "£3,100 pcm", leaseLength: "Minimum 5 years", neededBy: "20 Sep 2026", status: "Open", operator: "Choice Pathways", matchedPropertyIds: [] },
];

const seedProperties: PropertyRecord[] = [
  { id: "PROP-231", name: "Detached home, Penn", area: "Wolverhampton, WV4", propertyType: "HMO (up to 6 bed)", bedrooms: 6, condition: "Furnished", rent: "£3,450 pcm", availableFrom: "Immediate", status: "Matched", matchedReq: "REQ-1048", certs: { eicr: true, gasSafety: true, epc: true, fireRisk: true, hmoLicence: true, legionella: true }, docRequests: [] },
  { id: "PROP-229", name: "Corner house, Hanley", area: "Stoke-on-Trent, ST1", propertyType: "Larger Format (7+ bed)", bedrooms: 5, condition: "Furnished", rent: "£3,900 pcm", availableFrom: "1 Oct 2026", status: "Under Review", matchedReq: null, certs: { eicr: true, gasSafety: true, epc: false, fireRisk: true, hmoLicence: false, legionella: false }, docRequests: [] },
  { id: "PROP-226", name: "Accessible bungalow", area: "Walsall, WS3", propertyType: "Family Home (2-3 bed)", bedrooms: 4, condition: "Unfurnished", rent: "£2,950 pcm", availableFrom: "Immediate", status: "Submitted", matchedReq: null, certs: { eicr: true, gasSafety: false, epc: false, fireRisk: false, hmoLicence: false, legionella: false }, docRequests: [] },
];

const seedViewings: ViewingRecord[] = [];

let idCounter = 1000;
const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

function Status({ children, tone = "purple" }: { children: React.ReactNode; tone?: "purple" | "green" | "amber" | "grey" | "red" }) { return <span className={`status ${tone}`}>{children}</span>; }
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e => e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>{children}</div></div>; }
function certStatus(certs: Record<string, boolean>) { const n = REQUIRED_CERTS.filter(c => certs[c]).length; return `${n}/${REQUIRED_CERTS.length} required docs on file`; }

const nav: { id: View; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "⌂" }, { id: "requirements", label: "Requirements", icon: "▤" },
  { id: "properties", label: "Properties", icon: "◇" }, { id: "viewings", label: "Viewings", icon: "↗" },
  { id: "messages", label: "Messages", icon: "□" },
];

export default function Home() {
  const [role, setRole] = useState<Role>("bbc");
  const [view, setView] = useState<View>("overview");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"requirement" | "property" | "detail" | "upload" | "docRequest" | "viewingRequest" | null>(null);
  const [toast, setToast] = useState("");
  const [requirements, setRequirements] = useState<RequirementRecord[]>(seedRequirements);
  const [properties, setProperties] = useState<PropertyRecord[]>(seedProperties);
  const [viewings, setViewings] = useState<ViewingRecord[]>(seedViewings);
  const [selectedProp, setSelectedProp] = useState<PropertyRecord | null>(null);
  const [selectedReq, setSelectedReq] = useState<RequirementRecord | null>(null);
  const [uploadStep, setUploadStep] = useState(1);
  const [uploadForReqId, setUploadForReqId] = useState<string | null>(null);

  const roleName = role === "bbc" ? "BrightBridge workspace" : role === "provider" ? "Care provider portal" : "Property partner portal";
  const heading = view === "overview" ? (role === "bbc" ? "Good morning, Dorcas" : role === "provider" ? "Welcome back, Willow Care" : "Welcome back, Kush") : nav.find(n => n.id === view)?.label;
  const filteredProps = properties.filter(p => `${p.name} ${p.area}`.toLowerCase().includes(search.toLowerCase()));

  function notify(message: string) { setToast(message); setTimeout(() => setToast(""), 3200); }
  function changeRole(next: Role) { setRole(next); setView("overview"); setModal(null); }

  function createRequirement(fields: any) {
    const req: RequirementRecord = { id: nextId("REQ"), status: "Open", operator: "Willow Care Group", matchedPropertyIds: [], ...fields };
    setRequirements(prev => [req, ...prev]);
    notify(`${req.id} posted — every property partner has been notified`);
  }

  function createProperty(fields: any, certs: Record<string, boolean>, forReqId: string | null) {
    const prop: PropertyRecord = { id: nextId("PROP"), status: "Submitted", matchedReq: null, certs, docRequests: [], ...fields };
    setProperties(prev => [prop, ...prev]);
    notify(forReqId ? `Property submitted against ${forReqId} — BBC will review within 10 business days` : "Property submitted — BBC will review within 10 business days");
  }

  function decideProperty(id: string, decision: "Accepted" | "Declined") {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status: decision } : p));
    notify(decision === "Accepted" ? "Property accepted — ready to match to a requirement" : "Property declined");
    setModal(null);
  }

  function matchProperty(propId: string, reqId: string) {
    setProperties(prev => prev.map(p => p.id === propId ? { ...p, status: "Matched", matchedReq: reqId } : p));
    setRequirements(prev => prev.map(r => r.id === reqId ? { ...r, status: "Matched", matchedPropertyIds: [...r.matchedPropertyIds, propId] } : r));
    notify(`Matched to ${reqId} — the care provider has been notified`);
    setModal(null);
  }

  function requestDocs(prop: PropertyRecord, text: string) {
    setProperties(prev => prev.map(p => p.id === prop.id ? { ...p, docRequests: [...p.docRequests, text] } : p));
    notify("Document request sent to BrightBridge");
    setModal(null);
  }

  function requestViewing(prop: PropertyRecord, preferredDates: string) {
    const v: ViewingRecord = { id: nextId("VIEW"), propertyId: prop.id, propertyName: prop.name, reqId: prop.matchedReq, proposedByProvider: preferredDates, partnerProposedDate: null, confirmedDate: null, status: "Requested" };
    setViewings(prev => [v, ...prev]);
    setProperties(prev => prev.map(p => p.id === prop.id ? { ...p, status: "Viewing Requested" } : p));
    notify("Viewing requested — BrightBridge will coordinate with the property source");
    setModal(null);
  }

  function shareWithPartner(viewId: string) {
    setViewings(prev => prev.map(v => v.id === viewId ? { ...v, status: "Shared with Property Source" } : v));
    notify("Shared with the property source — awaiting their availability");
  }

  function partnerProposeDate(viewId: string, date: string) {
    setViewings(prev => prev.map(v => v.id === viewId ? { ...v, partnerProposedDate: date, status: "Date Proposed" } : v));
    notify("Date proposed — sent back to BrightBridge to confirm");
  }

  function confirmViewing(viewId: string) {
    setViewings(prev => prev.map(v => {
      if (v.id !== viewId) return v;
      const confirmed = v.partnerProposedDate || "Date to be confirmed";
      return { ...v, status: "Confirmed", confirmedDate: confirmed };
    }));
    const v = viewings.find(x => x.id === viewId);
    if (v) setProperties(prev => prev.map(p => p.id === v.propertyId ? { ...p, status: "Viewing Confirmed" } : p));
    notify("Viewing confirmed — all parties notified by email");
  }

  function partnerSafeReq(r: RequirementRecord) { const { operator, ...rest } = r; return rest; }
  function providerSafeProperty(p: PropertyRecord) { return { id: p.id, name: p.name, area: p.area, propertyType: p.propertyType, bedrooms: p.bedrooms, condition: p.condition, rent: p.rent, availableFrom: p.availableFrom, status: p.status, matchedReq: p.matchedReq, docRequests: p.docRequests }; }

  const bbcViewingsPending = viewings.filter(v => v.status === "Requested").length;
  const partnerViewingsPending = viewings.filter(v => v.status === "Shared with Property Source").length;

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><img src="/brightbridge-logo.png" alt=""/><div><strong>BrightBridge</strong><span>Connect</span></div></div><div className="workspace-label">Workspace</div>
    <button className="role-switch" onClick={() => changeRole(role === "bbc" ? "provider" : role === "provider" ? "partner" : "bbc")}><span className="role-avatar">{role === "bbc" ? "BB" : role === "provider" ? "WC" : "KP"}</span><span><b>{roleName}</b><small>Switch workspace</small></span><i>⌄</i></button>
    <nav>{nav.map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><span>{item.icon}</span>{item.label}{item.id === "viewings" && role === "bbc" && bbcViewingsPending > 0 && <em>{bbcViewingsPending}</em>}{item.id === "viewings" && role === "partner" && partnerViewingsPending > 0 && <em>{partnerViewingsPending}</em>}</button>)}</nav>
    <div className="sidebar-bottom"><button onClick={() => setView("settings")} className={view === "settings" ? "active" : ""}><span>⚙</span>Settings</button><div className="help-card"><span>?</span><strong>Need some help?</strong><small>Visit the support centre</small><button onClick={() => notify("Support centre opened")}>Get support</button></div></div></aside>
    <main className="main"><header><div><p>{roleName}</p><h1>{heading}</h1></div><div className="header-actions"><label className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search platform"/></label><button className="notification" onClick={() => notify("You're all caught up")}>♢<i/></button><button className="avatar">{role === "bbc" ? "DA" : role === "provider" ? "WC" : "KP"}</button></div></header>

      {view === "overview" && <Overview role={role} setView={setView} requirements={requirements} properties={properties} viewings={viewings} openRequirement={() => setModal("requirement")} openProperty={(p: PropertyRecord) => { setSelectedProp(p); setModal("property"); }} notify={notify} onUpload={() => { setUploadForReqId(null); setUploadStep(1); setModal("upload"); }}/>}
      {view === "requirements" && <Requirements role={role} requirements={requirements} openDetail={(r: RequirementRecord) => { setSelectedReq(r); setModal("detail"); }} create={() => setModal("requirement")} partnerSafeReq={partnerSafeReq}/>}
      {view === "properties" && <Properties role={role} items={filteredProps} openProperty={(p: PropertyRecord) => { setSelectedProp(p); setModal("property"); }} add={() => { setUploadForReqId(null); setUploadStep(1); setModal("upload"); }} providerSafeProperty={providerSafeProperty}/>}
      {view === "viewings" && <Viewings role={role} viewings={viewings} shareWithPartner={shareWithPartner} partnerProposeDate={partnerProposeDate} confirmViewing={confirmViewing} notify={notify}/>}
      {view === "messages" && <Messages role={role}/>}
      {view === "settings" && <Settings role={role}/>}
    </main>

    {modal === "requirement" && <Modal title="Post a property requirement" onClose={() => setModal(null)}>
      <RequirementForm onCancel={() => setModal(null)} onSubmit={(fields: any) => { createRequirement(fields); setModal(null); }}/>
    </Modal>}

    {modal === "property" && selectedProp && <PropertyModal role={role} prop={selectedProp} requirements={requirements}
      onClose={() => setModal(null)}
      onDecide={decideProperty}
      onMatch={matchProperty}
      onRequestDocs={() => setModal("docRequest")}
      onRequestViewing={() => setModal("viewingRequest")}
    />}

    {modal === "docRequest" && selectedProp && <Modal title="Request additional documentation" onClose={() => setModal("property")}>
      <DocRequestForm onCancel={() => setModal("property")} onSubmit={(text: string) => requestDocs(selectedProp, text)}/>
    </Modal>}

    {modal === "viewingRequest" && selectedProp && <Modal title="Request a viewing" onClose={() => setModal("property")}>
      <ViewingRequestForm onCancel={() => setModal("property")} onSubmit={(dates: string) => requestViewing(selectedProp, dates)}/>
    </Modal>}

    {modal === "detail" && selectedReq && <Modal title={`${selectedReq.id} · Requirement`} onClose={() => setModal(null)}>
      <div className="requirement-detail"><Status tone={selectedReq.status === "Open" ? "grey" : "purple"}>{selectedReq.status}{selectedReq.matchedPropertyIds?.length ? ` · ${selectedReq.matchedPropertyIds.length} matched` : " · accepting properties"}</Status><h2>{selectedReq.title}</h2>
      <p>{role === "partner" ? "A care provider is seeking a long-term property matching this brief." : `${selectedReq.operator ?? "A care provider"} is seeking a long-term property for this brief.`}</p>
      <div className="detail-grid"><div><small>Location</small><strong>{selectedReq.area}</strong></div><div><small>Budget</small><strong>{selectedReq.budget}</strong></div><div><small>Needed by</small><strong>{selectedReq.neededBy}</strong></div><div><small>Lease</small><strong>{selectedReq.leaseLength}</strong></div></div>
      <h3>Essential requirements</h3><div className="tag-row"><span>{selectedReq.bedrooms} bedrooms</span><span>{selectedReq.propertyType}</span><span>{selectedReq.serviceType}</span></div></div>
      <div className="form-actions"><button className="secondary" onClick={() => setModal(null)}>Close</button>{role === "partner" && selectedReq.status === "Open" && <button className="primary" onClick={() => { setUploadForReqId(selectedReq.id); setUploadStep(1); setModal("upload"); }}>Submit a matching property</button>}</div>
    </Modal>}

    {modal === "upload" && <UploadWizard step={uploadStep} setStep={setUploadStep} forReqId={uploadForReqId} onCancel={() => setModal(null)} onSubmit={(fields: any, certs: any) => { createProperty(fields, certs, uploadForReqId); setModal(null); }}/>}

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
    ? [["Requirements posted", String(requirements.length), "By your organisation"], ["Matched properties", String(providerVisible.length), "Awaiting your review"], ["Viewings requested", String(viewings.filter((v: ViewingRecord) => v.status !== "Confirmed").length), "In progress"], ["Viewings confirmed", String(viewings.filter((v: ViewingRecord) => v.status === "Confirmed").length), "Scheduled"]]
    : [["Properties submitted", String(properties.length), `${underReview} under review`], ["Accepted", String(accepted), "Ready or matched"], ["Viewing requests for you", String(viewings.filter((v: ViewingRecord) => v.status === "Shared with Property Source").length), "Needs your availability"], ["Fees earned", "£750", "Lifetime"]];
  const visibleReqs = role === "partner" ? requirements.map(({ operator, ...r }: RequirementRecord) => r) : requirements;
  const visibleProps = role === "provider" ? providerVisible : properties;

  return <div className="page-content"><section className="welcome"><p>{isBBC ? "Here's what's happening across the platform today." : role === "provider" ? "Properties are matched to your requirements as BBC finds them." : "New requirements are shared with you the moment they're posted."}</p><button className="primary" onClick={role === "provider" ? openRequirement : role === "partner" ? onUpload : () => notify("Use the Properties tab to review submissions")}><span>＋</span>{role === "provider" ? "Post requirement" : isBBC ? "Review properties" : "Submit property"}</button></section>
  <section className="stats-grid">{stats.map((s: string[], i: number) => <article key={s[0]}><div className="stat-icon">{["▤", "◇", "↗", "✓"][i]}</div><span>{s[0]}</span><strong>{s[1]}</strong><small>{s[2]}</small></article>)}</section>
  <div className="content-grid">
    <section className="panel"><div className="panel-head"><div><h2>{isBBC ? "Property review queue" : role === "provider" ? "Matched properties" : "Your recent submissions"}</h2><p>{isBBC ? "Review submissions before they can be matched" : role === "provider" ? "Properties BBC has matched to your requirements" : "Status of properties you've submitted"}</p></div><button className="text-button" onClick={() => setView("properties")}>View all →</button></div>
      <div>{visibleProps.slice(0, 3).map((p: PropertyRecord) => <div className="property-row" key={p.id} onClick={() => openProperty(p)}><div className="building-thumb">⌂</div><div className="row-main"><strong>{p.name}</strong><span>{p.area} · {p.bedrooms} beds</span></div><div className="match"><b>{p.certs ? certStatus(p.certs).split("/")[0] : ""}</b><span>docs</span></div><Status tone={["Accepted", "Matched", "Viewing Confirmed"].includes(p.status) ? "green" : p.status === "Declined" ? "red" : "amber"}>{p.status}</Status>{isBBC && p.status === "Submitted" && <button className="mini-action" onClick={e => { e.stopPropagation(); openProperty(p); }}>Review</button>}</div>)}
      {visibleProps.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing to show yet.</div>}</div></section>
    <section className="panel"><div className="panel-head"><div><h2>Viewings</h2><p>Live coordination</p></div><button className="text-button" onClick={() => setView("viewings")}>View all →</button></div><div className="pipeline">{viewings.slice(0, 4).map((v: ViewingRecord, i: number) => <div key={v.id}><span className={`pipeline-dot dot-${i % 4}`}></span><div><strong>{v.propertyName}</strong><p>{v.status}</p><small>{v.confirmedDate || v.partnerProposedDate || v.proposedByProvider}</small></div></div>)}{viewings.length === 0 && <div style={{ padding: 20, color: "var(--muted)", fontSize: 11 }}>No viewings requested yet.</div>}</div></section>
  </div>
  <section className="panel"><div className="panel-head"><div><h2>{role === "partner" ? "Open requirements" : "Recent requirements"}</h2><p>{role === "partner" ? "Live care-sector demand — submit properties to fulfil them" : "Care needs currently looking for the right property"}</p></div><button className="text-button" onClick={() => setView("requirements")}>View all requirements →</button></div>
  <div className="requirements-row">{visibleReqs.slice(0, 3).map((r: any) => <article key={r.id} onClick={() => setView("requirements")}><div><span>{r.propertyType}</span><Status tone={r.status === "Open" ? "grey" : "purple"}>{r.status}</Status></div><h3>{r.title}</h3><p>⌖ {r.area}</p><footer><strong>{r.budget}</strong><small>Needed by {r.neededBy}</small></footer></article>)}</div></section></div>;
}

function Requirements({ role, requirements, openDetail, create, partnerSafeReq }: any) {
  const list = role === "partner" ? requirements.map(partnerSafeReq) : requirements;
  return <div className="page-content"><div className="page-toolbar"><p>{role === "partner" ? "Every requirement here is notified to you the moment it's posted — no BBC gatekeeping on this side." : "View, manage and match current care-provider requirements."}</p>{role === "provider" && <button className="primary" onClick={create}>＋ Post requirement</button>}</div>
  <section className="panel"><div className="filterbar"><button className="selected">All requirements <b>{list.length}</b></button><button>Open <b>{list.filter((r: any) => r.status === "Open").length}</b></button></div>
  <div className="data-table"><div className="table-header"><span>Requirement</span><span>Location</span><span>Budget</span><span>Status</span><span>Needed by</span></div>
  {list.map((r: any, i: number) => <button className="data-row" key={i} onClick={() => openDetail(r)}><span><b>{r.title}</b><small>{r.id} · {r.serviceType}</small></span><span>{r.area}</span><span>{r.budget}</span><span><Status tone={r.status === "Open" ? "grey" : "purple"}>{r.status}</Status></span><span>{r.neededBy}　→</span></button>)}
  {list.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>No requirements yet.</div>}</div></section></div>;
}

function Properties({ role, items, openProperty, add, providerSafeProperty }: any) {
  const visible = role === "provider" ? items.filter((p: PropertyRecord) => ["Matched", "Viewing Requested", "Viewing Confirmed"].includes(p.status)).map(providerSafeProperty) : items;
  return <div className="page-content"><div className="page-toolbar"><p>{role === "bbc" ? "Review, accept and match every submitted property." : role === "provider" ? "Properties BBC has matched to your requirements." : "Track your submitted properties and their review status."}</p>{role === "partner" && <button className="primary" onClick={add}>＋ Upload property</button>}</div>
  <div className="property-cards">{visible.map((p: any) => <article key={p.id} onClick={() => openProperty(p)}><div className="property-image"><span>{p.certs ? certStatus(p.certs) : "Details on request"}</span><div>⌂</div></div><div className="card-content"><div><Status tone={["Accepted", "Matched", "Viewing Confirmed"].includes(p.status) ? "green" : p.status === "Declined" ? "red" : "amber"}>{p.status}</Status><small>{p.id}</small></div><h3>{p.name}</h3><p>{p.area}</p><div className="property-meta"><span><b>{p.bedrooms}</b> beds</span><span><b>{p.condition}</b></span><span><b>{p.rent}</b></span></div><button className="secondary">View property →</button></div></article>)}
  {visible.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing to show yet.</div>}</div></div>;
}

// Care Provider first view is deliberately limited to non-compliance details and
// photos. Documents are never shown on first view -- the Provider can request
// specific documentation instead, since BBC never claims the standard six
// certificates cover everything a given placement might need.
function PropertyModal({ role, prop, requirements, onClose, onDecide, onMatch, onRequestDocs, onRequestViewing }: any) {
  return <Modal title={`${prop.id} · Property`} onClose={onClose}>
    <div className="property-hero"><div><Status tone={["Accepted", "Matched", "Viewing Confirmed"].includes(prop.status) ? "green" : prop.status === "Declined" ? "red" : "amber"}>{prop.status}</Status><h2>{prop.name}</h2><p>{prop.area} · {prop.bedrooms} bedrooms · {prop.rent}</p></div><div className="property-art">⌂</div></div>

    {role === "provider" ? (
      <>
        <div className="detail-grid"><div><small>Property type</small><strong>{prop.propertyType}</strong></div><div><small>Condition</small><strong>{prop.condition}</strong></div><div><small>Available</small><strong>{prop.availableFrom}</strong></div><div><small>Rent</small><strong>{prop.rent}</strong></div></div>
        <div className="modal-section"><h3>Photos</h3><div className="tag-row"><span>Living room</span><span>Kitchen</span><span>Bedrooms</span><span>Bathroom</span><span>Exterior</span></div></div>
        <div className="modal-section"><p style={{ fontSize: 11, color: "var(--muted)" }}>Compliance documents aren&apos;t shown at this stage. If there&apos;s something specific you need to see before booking a viewing, request it directly.</p></div>
        {prop.docRequests?.length > 0 && <div className="modal-section"><h3>Your document requests</h3>{prop.docRequests.map((d: string, i: number) => <p key={i} style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>• {d}</p>)}</div>}
        {(prop.status === "Viewing Requested" || prop.status === "Viewing Confirmed") && <div className="modal-section"><Status tone={prop.status === "Viewing Confirmed" ? "green" : "amber"}>{prop.status === "Viewing Confirmed" ? "Viewing confirmed — check Viewings for the date" : "Viewing requested — BrightBridge is coordinating"}</Status></div>}
        <div className="form-actions">
          <button className="secondary" onClick={onClose}>Close</button>
          <button className="secondary" onClick={onRequestDocs}>Request documentation</button>
          {prop.status === "Matched" && <button className="primary" onClick={onRequestViewing}>Request a viewing</button>}
        </div>
      </>
    ) : (
      <>
        <div className="detail-grid"><div><small>Property type</small><strong>{prop.propertyType}</strong></div><div><small>Condition</small><strong>{prop.condition}</strong></div><div><small>Available</small><strong>{prop.availableFrom}</strong></div><div><small>Compliance</small><strong>{certStatus(prop.certs)}</strong></div></div>
        <div className="modal-section"><h3>Compliance documents</h3><ul className="checks">{Object.entries(CERT_LABELS).map(([key, label]) => (<li key={key} style={{ opacity: prop.certs[key] ? 1 : 0.4 }}>{prop.certs[key] ? "✓" : "○"} {label}{REQUIRED_CERTS.includes(key) && !prop.certs[key] && <span style={{ color: "var(--amber)", marginLeft: 6, fontWeight: 700 }}>required</span>}</li>))}</ul></div>
        {prop.docRequests?.length > 0 && <div className="modal-section"><h3>Documentation requested by the care provider</h3>{prop.docRequests.map((d: string, i: number) => <p key={i} style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>• {d}</p>)}</div>}
        {role === "bbc" && prop.status === "Submitted" && <div className="form-actions"><button className="secondary" onClick={() => onDecide(prop.id, "Declined")}>Decline</button><button className="primary" onClick={() => onDecide(prop.id, "Accepted")}>Accept property</button></div>}
        {role === "bbc" && prop.status === "Accepted" && <div className="modal-section"><h3>Match to a requirement</h3><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{requirements.filter((r: RequirementRecord) => r.status === "Open").map((r: RequirementRecord) => (<button key={r.id} className="secondary" style={{ textAlign: "left" }} onClick={() => onMatch(prop.id, r.id)}>{r.id} — {r.title} ({r.operator})</button>))}{requirements.filter((r: RequirementRecord) => r.status === "Open").length === 0 && <p style={{ fontSize: 11, color: "var(--muted)" }}>No open requirements to match against right now.</p>}</div></div>}
        {role === "partner" && <div className="form-actions"><button className="secondary" onClick={onClose}>Close</button></div>}
      </>
    )}
  </Modal>;
}

// Viewings are always mediated by BBC. A Provider's request is never sent
// straight to the Property Source -- it lands with BBC first, BBC shares it
// with the Source once ready, the Source proposes a date from their own
// panel, and BBC confirms it, which is the point every party would be
// notified by email in a live system.
function Viewings({ role, viewings, shareWithPartner, partnerProposeDate, confirmViewing, notify }: any) {
  const [dateDraft, setDateDraft] = useState<Record<string, string>>({});
  if (viewings.length === 0) return <div className="page-content"><div className="page-toolbar"><p>No viewings requested yet.</p></div></div>;

  const visible = role === "partner" ? viewings.filter((v: ViewingRecord) => v.status !== "Requested") : viewings;

  return <div className="page-content"><div className="page-toolbar"><p>{role === "bbc" ? "Coordinate every viewing between the care provider and the property source." : role === "partner" ? "Viewing requests BrightBridge has shared with you." : "Track your requested viewings through to a confirmed date."}</p></div>
  {visible.map((v: ViewingRecord) => (
    <div className="panel" key={v.id} style={{ marginBottom: 14, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div><strong style={{ fontSize: 13 }}>{v.propertyName}</strong><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{v.id} · {v.reqId || "—"}</div></div>
        <Status tone={v.status === "Confirmed" ? "green" : v.status === "Date Proposed" ? "amber" : "purple"}>{v.status}</Status>
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Provider&apos;s preferred dates: <strong style={{ color: "var(--ink)" }}>{v.proposedByProvider}</strong></div>
      {v.partnerProposedDate && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Property source proposed: <strong style={{ color: "var(--ink)" }}>{v.partnerProposedDate}</strong></div>}
      {v.confirmedDate && <div style={{ fontSize: 12, color: "var(--green)", marginBottom: 10, fontWeight: 700 }}>Confirmed: {v.confirmedDate}</div>}

      {role === "bbc" && v.status === "Requested" && <button className="primary" style={{ fontSize: 11 }} onClick={() => shareWithPartner(v.id)}>Share with property source</button>}
      {role === "bbc" && v.status === "Date Proposed" && <button className="primary" style={{ fontSize: 11 }} onClick={() => confirmViewing(v.id)}>Confirm viewing &amp; notify all parties</button>}

      {role === "partner" && v.status === "Shared with Property Source" && <div style={{ display: "flex", gap: 8 }}>
        <input placeholder="e.g. Thu 21 Aug, 2pm" value={dateDraft[v.id] || ""} onChange={e => setDateDraft(d => ({ ...d, [v.id]: e.target.value }))} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", fontSize: 11, flex: 1 }}/>
        <button className="primary" style={{ fontSize: 11 }} onClick={() => { if (!dateDraft[v.id]) { notify("Enter a proposed date first"); return; } partnerProposeDate(v.id, dateDraft[v.id]); }}>Propose date</button>
      </div>}
    </div>
  ))}
  {visible.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing here yet.</div>}
  </div>;
}

function Messages({ role }: any) {
  const threads = role === "bbc" ? ["Willow Care Group", "Kush Properties", "Horizon Supported Living"] : ["BrightBridge Team"];
  const [active, setActive] = useState(0);
  return <div className="page-content message-layout"><section className="conversation-list"><div className="message-search">⌕ Search conversations</div>{threads.map((p, i) => <button className={active === i ? "active" : ""} onClick={() => setActive(i)} key={p}><span>{p.split(" ").map(x => x[0]).slice(0, 2).join("")}</span><div><strong>{p}</strong><p>{i === 0 ? "The viewing is confirmed for…" : "Thanks, I'll send that over…"}</p></div><small>{i === 0 ? "09:42" : "Yesterday"}</small></button>)}</section>
  <section className="chat"><header><div className="avatar">{threads[active].split(" ").map(x => x[0]).slice(0, 2).join("")}</div><div><strong>{threads[active]}</strong><p>{role === "bbc" ? "Regarding an active viewing" : "Your BrightBridge point of contact"}</p></div></header>
  <div className="chat-body"><span className="date-label">Today</span><div className="bubble incoming">Hello, we&apos;ve reviewed the property details and would like to arrange a viewing.</div><div className="bubble outgoing">Great — I&apos;ve confirmed availability and added the viewing to the schedule.</div><div className="bubble incoming">Perfect, that works. Thank you.</div></div>
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

function RequirementForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (f: any) => void }) {
  const [f, setF] = useState({ title: "", area: "", serviceType: "Supported living", propertyType: "Family Home (2-3 bed)", bedrooms: "", budget: "", leaseLength: "", neededBy: "" });
  const set = (k: string, v: string) => setF(prev => ({ ...prev, [k]: v }));
  return <form onSubmit={e => { e.preventDefault(); onSubmit(f); }} className="form">
    <div className="field full"><label>What property do you need?</label><input required value={f.title} onChange={e => set("title", e.target.value)} placeholder="e.g. 6-bed supported living home"/></div>
    <div className="field"><label>Location</label><input required value={f.area} onChange={e => set("area", e.target.value)} placeholder="Town, borough or postcode"/></div>
    <div className="field"><label>Service type</label><select value={f.serviceType} onChange={e => set("serviceType", e.target.value)}><option>Supported living</option><option>Children&apos;s home</option><option>Local authority</option><option>Housing association / RSL</option></select></div>
    <div className="field"><label>Property type</label><select value={f.propertyType} onChange={e => set("propertyType", e.target.value)}><option>Family Home (2-3 bed)</option><option>HMO (up to 6 bed)</option><option>Larger Format (7+ bed)</option></select></div>
    <div className="field"><label>Bedrooms</label><input type="number" min="1" required value={f.bedrooms} onChange={e => set("bedrooms", e.target.value)} placeholder="e.g. 6"/></div>
    <div className="field"><label>Maximum monthly rent</label><input required value={f.budget} onChange={e => set("budget", e.target.value)} placeholder="£3,500 pcm"/></div>
    <div className="field"><label>Minimum lease length</label><input value={f.leaseLength} onChange={e => set("leaseLength", e.target.value)} placeholder="e.g. Minimum 5 years"/></div>
    <div className="field"><label>Needed by</label><input type="date" required onChange={e => set("neededBy", new Date(e.target.value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))}/></div>
    <div className="field full"><label>Essential requirements</label><textarea placeholder="Accessibility, parking, garden, location needs…"/></div>
    <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button className="primary">Post requirement</button></div>
  </form>;
}

function DocRequestForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");
  return <div style={{ padding: "22px 24px" }}>
    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>We collect a standard set of compliance documents, but that won&apos;t always cover everything you need for this placement. Tell us what else you&apos;d like to see.</p>
    <textarea value={text} onChange={e => setText(e.target.value)} placeholder="e.g. Could we see the most recent fire alarm service record, and confirm the HMO licence covers this configuration?" style={{ width: "100%", minHeight: 100, border: "1px solid var(--line)", borderRadius: 9, padding: 12, fontSize: 12, fontFamily: "inherit" }}/>
    <div className="form-actions" style={{ margin: "16px -24px -22px", padding: "16px 24px 0" }}><button className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={!text.trim()} onClick={() => onSubmit(text.trim())}>Send request</button></div>
  </div>;
}

function ViewingRequestForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (dates: string) => void }) {
  const [dates, setDates] = useState("");
  return <div style={{ padding: "22px 24px" }}>
    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Let us know a few dates and times that would work. We&apos;ll coordinate with the property source and confirm a slot.</p>
    <textarea value={dates} onChange={e => setDates(e.target.value)} placeholder="e.g. Thu 21 Aug (afternoon), Fri 22 Aug (any time), or w/c 25 Aug" style={{ width: "100%", minHeight: 80, border: "1px solid var(--line)", borderRadius: 9, padding: 12, fontSize: 12, fontFamily: "inherit" }}/>
    <div className="form-actions" style={{ margin: "16px -24px -22px", padding: "16px 24px 0" }}><button className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={!dates.trim()} onClick={() => onSubmit(dates.trim())}>Request viewing</button></div>
  </div>;
}

function UploadWizard({ step, setStep, forReqId, onCancel, onSubmit }: { step: number; setStep: (n: number) => void; forReqId: string | null; onCancel: () => void; onSubmit: (f: any, c: any) => void }) {
  const [f, setF] = useState({ address: "", propertyType: "Family Home (2-3 bed)", bedrooms: "", condition: "Furnished", rent: "", availableFrom: "" });
  const [certs, setCerts] = useState<Record<string, boolean>>(emptyCerts());
  const set = (k: string, v: string) => setF(prev => ({ ...prev, [k]: v }));
  const labels = ["Property Details", "Images", "Compliance", "Review"];

  return <div className="modal-backdrop" onMouseDown={onCancel}><div className="modal" style={{ width: "min(760px,100%)" }} onMouseDown={e => e.stopPropagation()}>
    <div className="modal-head"><h2>{forReqId ? `Submit a property for ${forReqId}` : "Submit a property"}</h2><button className="icon-button" onClick={onCancel}>×</button></div>
    <div style={{ display: "flex", gap: 4, padding: "0 24px" }}>{labels.map((l, i) => (
      <div key={l} style={{ flex: 1, textAlign: "center" }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: i + 1 <= step ? "var(--ink)" : "#f0eef1", color: i + 1 <= step ? "#fff" : "var(--muted)" }}>{i + 1}</div>
        <div style={{ fontSize: 10, color: i + 1 <= step ? "var(--ink)" : "var(--muted)", fontWeight: i + 1 === step ? 700 : 400 }}>{l}</div>
        <div style={{ height: 3, background: i + 1 <= step ? "var(--ink)" : "#f0eef1", borderRadius: 2, marginTop: 6 }} />
      </div>))}</div>

    {step === 1 && <div className="form" style={{ paddingTop: 22 }}>
      <div className="field full"><label>Address</label><input required value={f.address} onChange={e => set("address", e.target.value)} placeholder="42 Wellington Road, Birmingham, B15 3AB"/></div>
      <div className="field"><label>Property type</label><select value={f.propertyType} onChange={e => set("propertyType", e.target.value)}><option>Family Home (2-3 bed)</option><option>HMO (up to 6 bed)</option><option>Larger Format (7+ bed)</option></select></div>
      <div className="field"><label>Bedrooms</label><input type="number" required value={f.bedrooms} onChange={e => set("bedrooms", e.target.value)} placeholder="e.g. 6"/></div>
      <div className="field"><label>Condition</label><select value={f.condition} onChange={e => set("condition", e.target.value)}><option>Furnished</option><option>Unfurnished</option><option>Needs refurbishment</option></select></div>
      <div className="field"><label>Monthly rent</label><input required value={f.rent} onChange={e => set("rent", e.target.value)} placeholder="£1,800 pcm"/></div>
      <div className="field"><label>Available from</label><input type="date" required onChange={e => set("availableFrom", new Date(e.target.value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))}/></div>
      <div className="field full"><label>Description</label><textarea placeholder="Describe the property and what makes it suitable for care providers…"/></div>
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
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Upload certificates where available. Properties with complete documentation are reviewed faster. This is the standard set BBC collects — it won&apos;t always be everything a provider asks for, and that&apos;s expected.</p>
      {Object.entries(CERT_LABELS).map(([key, label]) => (
        <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{label}{REQUIRED_CERTS.includes(key) && <span style={{ color: "#c23b3b", marginLeft: 6, fontWeight: 700, fontSize: 10 }}>Required</span>}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="date" style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "6px 8px", fontSize: 10, width: 110 }} title="Issue date"/>
            <input type="date" style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "6px 8px", fontSize: 10, width: 110 }} title="Expiry date"/>
            <button type="button" className="secondary" style={{ fontSize: 10, padding: "7px 10px" }} onClick={() => setCerts(c => ({ ...c, [key]: !c[key] }))}>{certs[key] ? "✓ Uploaded" : "↑ Upload"}</button>
          </div>
        </div>
      ))}
    </div>}

    {step === 4 && <div style={{ padding: "22px 24px" }}>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Check everything below before submitting to BBC.</p>
      <div className="detail-grid" style={{ padding: "14px 0" }}>
        <div><small>Address</small><strong>{f.address || "—"}</strong></div>
        <div><small>Type</small><strong>{f.propertyType}</strong></div>
        <div><small>Bedrooms</small><strong>{f.bedrooms || "—"}</strong></div>
        <div><small>Rent</small><strong>{f.rent || "—"}</strong></div>
        <div><small>Compliance</small><strong>{Object.values(certs).filter(Boolean).length} / {Object.keys(CERT_LABELS).length} uploaded</strong></div>
        <div><small>Required docs</small><strong>{REQUIRED_CERTS.filter(k => certs[k]).length} / {REQUIRED_CERTS.length}</strong></div>
      </div>
      <p style={{ fontSize: 11, color: "#95631b", background: "var(--amber-bg)", padding: "10px 12px", borderRadius: 8, marginTop: 8 }}>⚠ Submitting does not mean the property has been accepted or matched. BBC will review within 10 business days.</p>
    </div>}

    <div className="form-actions">
      <button type="button" className="secondary" onClick={() => step === 1 ? onCancel() : setStep(step - 1)}>{step === 1 ? "Cancel" : "Back"}</button>
      {step < 4 ? <button className="primary" onClick={() => setStep(step + 1)}>Continue</button> : <button className="primary" onClick={() => onSubmit(f, certs)}>Submit property</button>}
    </div>
  </div></div>;
}
