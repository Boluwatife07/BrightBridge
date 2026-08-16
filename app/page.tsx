"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */

import { useMemo, useState } from "react";

type Role = "provider" | "partner" | "bbc";
type View = "overview" | "requirements" | "properties" | "deals" | "messages" | "settings";

// Requirements are always shown without revealing which Operator posted them to
// Property Partners. Partners only ever see the reference number and the spec.
const requirements = [
  { id: "REQ-1048", title: "6-bed supported living home", area: "Wolverhampton", serviceType: "Supported living", propertyType: "HMO (up to 6 bed)", bedrooms: 6, budget: "£3,600 pcm", leaseLength: "Minimum 5 years", neededBy: "12 Oct 2026", status: "Open", matches: 1, operator: "Willow Care Group" },
  { id: "REQ-1044", title: "Children's home with garden", area: "Stoke-on-Trent", serviceType: "Children's home", propertyType: "Larger Format (7+ bed)", bedrooms: 7, budget: "£4,200 pcm", leaseLength: "Minimum 5 years", neededBy: "1 Nov 2026", status: "Open", matches: 0, operator: "Horizon Supported Living" },
  { id: "REQ-1039", title: "Accessible 4-bed bungalow", area: "Walsall", serviceType: "Supported living", propertyType: "Family Home (2-3 bed)", bedrooms: 4, budget: "£3,100 pcm", leaseLength: "Minimum 5 years", neededBy: "20 Sep 2026", status: "Open", matches: 0, operator: "Choice Pathways" },
];

// Properties never reveal the Operator's identity to a Partner, and never reveal
// which Partner supplied them to an Operator, until BBC has matched them and
// chooses to make an introduction. Status always starts at "Submitted" and
// requires an explicit BBC decision -- nothing is auto-approved.
const seedProperties = [
  { id: "PROP-231", name: "Detached home, Penn", area: "Wolverhampton, WV4", propertyType: "HMO (up to 6 bed)", bedrooms: 6, condition: "Furnished", rent: "£3,450 pcm", availableFrom: "Immediate", status: "Accepted", matchedReq: "REQ-1048", certs: { eicr: true, gasSafety: true, epc: true, fireRisk: true, hmoLicence: true, legionella: true } },
  { id: "PROP-229", name: "Corner house, Hanley", area: "Stoke-on-Trent, ST1", propertyType: "Larger Format (7+ bed)", bedrooms: 5, condition: "Furnished", rent: "£3,900 pcm", availableFrom: "1 Oct 2026", status: "Under Review", matchedReq: null, certs: { eicr: true, gasSafety: true, epc: false, fireRisk: true, hmoLicence: false, legionella: false } },
  { id: "PROP-226", name: "Accessible bungalow", area: "Walsall, WS3", propertyType: "Family Home (2-3 bed)", bedrooms: 4, condition: "Unfurnished", rent: "£2,950 pcm", availableFrom: "Immediate", status: "Submitted", matchedReq: null, certs: { eicr: true, gasSafety: false, epc: false, fireRisk: false, hmoLicence: false, legionella: false } },
];

const deals = [
  { id: "DEAL-1", property: "Detached home, Penn", reqId: "REQ-1048", stage: "Viewing arranged", date: "19 Aug, 11:00" },
  { id: "DEAL-2", property: "17-bed former hotel", reqId: "REQ-1044", stage: "Heads of Terms", date: "Updated today" },
  { id: "DEAL-3", property: "Newcastle en-suite scheme", reqId: "REQ-1039", stage: "Lease in progress", date: "Solicitors instructed" },
];

const CERT_LABELS: Record<string, string> = {
  eicr: "EICR (Electrical Installation)",
  gasSafety: "Gas Safety Certificate (CP12)",
  epc: "EPC (Energy Performance)",
  fireRisk: "Fire Risk Assessment",
  hmoLicence: "HMO Licence (if applicable)",
  legionella: "Legionella Assessment",
};
const REQUIRED_CERTS = ["eicr", "gasSafety", "epc", "fireRisk"];

const nav: { id: View; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "⌂" }, { id: "requirements", label: "Requirements", icon: "▤" },
  { id: "properties", label: "Properties", icon: "◇" }, { id: "deals", label: "Deals", icon: "↗" },
  { id: "messages", label: "Messages", icon: "□" },
];

function Status({ children, tone = "purple" }: { children: React.ReactNode; tone?: "purple" | "green" | "amber" | "grey" | "red" }) { return <span className={`status ${tone}`}>{children}</span>; }
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e => e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>{children}</div></div>; }

function certStatus(certs: Record<string, boolean>) {
  const required = REQUIRED_CERTS.filter(c => certs[c]).length;
  return `${required}/${REQUIRED_CERTS.length} required docs`;
}

export default function Home() {
  const [role, setRole] = useState<Role>("bbc");
  const [view, setView] = useState<View>("overview");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"requirement" | "property" | "detail" | "upload" | null>(null);
  const [toast, setToast] = useState("");
  const [properties, setProperties] = useState(seedProperties);
  const [selectedProp, setSelectedProp] = useState<any>(null);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [uploadStep, setUploadStep] = useState(1);

  const roleName = role === "bbc" ? "BrightBridge workspace" : role === "provider" ? "Care provider portal" : "Property partner portal";
  const heading = view === "overview" ? (role === "bbc" ? "Good morning, Dorcas" : role === "provider" ? "Welcome back, Willow Care" : "Welcome back, Kush") : nav.find(n => n.id === view)?.label;
  const filteredProps = useMemo(() => properties.filter(p => `${p.name} ${p.area}`.toLowerCase().includes(search.toLowerCase())), [properties, search]);

  function notify(message: string) { setToast(message); setTimeout(() => setToast(""), 2800); }
  function changeRole(next: Role) { setRole(next); setView("overview"); setModal(null); }

  function decideProperty(id: string, decision: "Accepted" | "Declined") {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status: decision } : p));
    notify(decision === "Accepted" ? "Property accepted — ready to match to a requirement" : "Property declined");
    setModal(null);
  }

  function matchProperty(id: string, reqId: string) {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status: "Matched", matchedReq: reqId } : p));
    notify("Property matched — the care provider has been notified");
    setModal(null);
  }

  function partnerSafeReq(r: any) {
    const { operator, ...rest } = r;
    return rest;
  }
  function providerSafeProperty(p: any) {
    return { id: p.id, name: p.name, area: p.area, propertyType: p.propertyType, bedrooms: p.bedrooms, condition: p.condition, rent: p.rent, availableFrom: p.availableFrom, certs: p.certs, status: p.status };
  }

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><img src="/brightbridge-logo.png" alt=""/><div><strong>BrightBridge</strong><span>Connect</span></div></div><div className="workspace-label">Workspace</div>
    <button className="role-switch" onClick={() => changeRole(role === "bbc" ? "provider" : role === "provider" ? "partner" : "bbc")}><span className="role-avatar">{role === "bbc" ? "BB" : role === "provider" ? "WC" : "KP"}</span><span><b>{roleName}</b><small>Switch workspace</small></span><i>⌄</i></button>
    <nav>{nav.map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><span>{item.icon}</span>{item.label}{item.id === "messages" && <em>2</em>}</button>)}</nav>
    <div className="sidebar-bottom"><button onClick={() => setView("settings")} className={view === "settings" ? "active" : ""}><span>⚙</span>Settings</button><div className="help-card"><span>?</span><strong>Need some help?</strong><small>Visit the support centre</small><button onClick={() => notify("Support centre opened")}>Get support</button></div></div></aside>
    <main className="main"><header><div><p>{roleName}</p><h1>{heading}</h1></div><div className="header-actions"><label className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search platform"/></label><button className="notification" onClick={() => notify("You're all caught up")}>♢<i/></button><button className="avatar">{role === "bbc" ? "DA" : role === "provider" ? "WC" : "KP"}</button></div></header>
      {view === "overview" && <Overview role={role} setView={setView} properties={properties} openRequirement={() => setModal("requirement")} openProperty={(p: any) => { setSelectedProp(p); setModal("property"); }} notify={notify}/>}
      {view === "requirements" && <Requirements role={role} openDetail={(r: any) => { setSelectedReq(r); setModal("detail"); }} create={() => setModal("requirement")} partnerSafeReq={partnerSafeReq}/>}
      {view === "properties" && <Properties role={role} items={filteredProps} openProperty={(p: any) => { setSelectedProp(p); setModal("property"); }} add={() => { setUploadStep(1); setModal("upload"); }} providerSafeProperty={providerSafeProperty}/>}
      {view === "deals" && <Deals notify={notify}/>}
      {view === "messages" && <Messages role={role}/>}
      {view === "settings" && <Settings role={role}/>}
    </main>

    {modal === "requirement" && <Modal title="Post a property requirement" onClose={() => setModal(null)}><form onSubmit={e => { e.preventDefault(); setModal(null); notify("Requirement submitted — BBC will review before it's published"); }} className="form">
      <div className="field full"><label>What property do you need?</label><input required placeholder="e.g. 6-bed supported living home"/></div>
      <div className="field"><label>Location</label><input required placeholder="Town, borough or postcode"/></div>
      <div className="field"><label>Service type</label><select><option>Supported living</option><option>Children&apos;s home</option><option>Local authority</option><option>Housing association / RSL</option></select></div>
      <div className="field"><label>Property type</label><select><option>Family Home (2-3 bed)</option><option>HMO (up to 6 bed)</option><option>Larger Format (7+ bed)</option></select></div>
      <div className="field"><label>Bedrooms</label><input type="number" min="1" required placeholder="e.g. 6"/></div>
      <div className="field"><label>Maximum monthly rent</label><input required placeholder="£3,500"/></div>
      <div className="field"><label>Minimum lease length</label><input placeholder="e.g. 5 years"/></div>
      <div className="field"><label>Needed by</label><input type="date" required/></div>
      <div className="field full"><label>Essential requirements</label><textarea placeholder="Accessibility, parking, garden, location needs…"/></div>
      <div className="form-actions"><button type="button" className="secondary" onClick={() => setModal(null)}>Cancel</button><button className="primary">Submit requirement</button></div>
    </form></Modal>}

    {modal === "property" && selectedProp && <Modal title={`${selectedProp.id} · Property`} onClose={() => setModal(null)}>
      <div className="property-hero"><div><Status tone={selectedProp.status === "Accepted" || selectedProp.status === "Matched" ? "green" : selectedProp.status === "Declined" ? "red" : "amber"}>{selectedProp.status}</Status><h2>{selectedProp.name}</h2><p>{selectedProp.area} · {selectedProp.bedrooms} bedrooms · {selectedProp.rent}</p></div><div className="property-art">⌂</div></div>
      <div className="detail-grid"><div><small>Property type</small><strong>{selectedProp.propertyType}</strong></div><div><small>Condition</small><strong>{selectedProp.condition}</strong></div><div><small>Available</small><strong>{selectedProp.availableFrom}</strong></div><div><small>Compliance</small><strong>{certStatus(selectedProp.certs)}</strong></div></div>
      <div className="modal-section"><h3>Compliance documents</h3><ul className="checks">{Object.entries(CERT_LABELS).map(([key, label]) => (<li key={key} style={{ opacity: selectedProp.certs[key] ? 1 : 0.4 }}>{selectedProp.certs[key] ? "✓" : "○"} {label}{REQUIRED_CERTS.includes(key) && !selectedProp.certs[key] && <span style={{ color: "var(--amber)", marginLeft: 6, fontWeight: 700 }}>required</span>}</li>))}</ul></div>
      {role === "bbc" && selectedProp.status === "Submitted" && <div className="form-actions"><button className="secondary" onClick={() => decideProperty(selectedProp.id, "Declined")}>Decline</button><button className="primary" onClick={() => decideProperty(selectedProp.id, "Accepted")}>Accept property</button></div>}
      {role === "bbc" && selectedProp.status === "Accepted" && <div className="modal-section"><h3>Match to a requirement</h3><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{requirements.filter(r => r.status === "Open").map(r => (<button key={r.id} className="secondary" style={{ textAlign: "left" }} onClick={() => matchProperty(selectedProp.id, r.id)}>{r.id} — {r.title} ({r.operator})</button>))}</div></div>}
      {role !== "bbc" && <div className="form-actions"><button className="secondary" onClick={() => setModal(null)}>Close</button>{role === "provider" && selectedProp.status === "Matched" && <button className="primary" onClick={() => { setModal(null); notify("Interest sent to BrightBridge"); }}>Express interest</button>}</div>}
    </Modal>}

    {modal === "detail" && selectedReq && <Modal title={`${selectedReq.id} · Requirement`} onClose={() => setModal(null)}>
      <div className="requirement-detail"><Status tone={selectedReq.status === "Open" ? "grey" : "purple"}>{selectedReq.status}{selectedReq.matches ? ` · ${selectedReq.matches} match` : " · accepting properties"}</Status><h2>{selectedReq.title}</h2>
      <p>{role === "partner" ? "A care provider is seeking a long-term property matching this brief." : `${selectedReq.operator ?? "A care provider"} is seeking a long-term property for this brief.`}</p>
      <div className="detail-grid"><div><small>Location</small><strong>{selectedReq.area}</strong></div><div><small>Budget</small><strong>{selectedReq.budget}</strong></div><div><small>Needed by</small><strong>{selectedReq.neededBy}</strong></div><div><small>Lease</small><strong>{selectedReq.leaseLength}</strong></div></div>
      <h3>Essential requirements</h3><div className="tag-row"><span>{selectedReq.bedrooms} bedrooms</span><span>{selectedReq.propertyType}</span><span>{selectedReq.serviceType}</span></div></div>
      <div className="form-actions"><button className="secondary" onClick={() => setModal(null)}>Close</button>{role === "partner" && <button className="primary" onClick={() => { setUploadStep(1); setModal("upload"); }}>Submit a matching property</button>}</div>
    </Modal>}

    {modal === "upload" && <UploadWizard step={uploadStep} setStep={setUploadStep} onCancel={() => setModal(null)} onSubmit={() => { setModal(null); notify("Property submitted — BBC will review within 10 business days"); }}/>}

    {toast && <div className="toast"><span>✓</span>{toast}</div>}</div>;
}

function Overview({ role, setView, properties, openRequirement, openProperty, notify }: any) {
  const isBBC = role === "bbc";
  const underReview = properties.filter((p: any) => p.status === "Submitted").length;
  const accepted = properties.filter((p: any) => p.status === "Accepted" || p.status === "Matched").length;
  const stats = isBBC
    ? [["Open requirements", "3", "Live on platform"], ["Properties awaiting review", String(underReview), "Needs a decision"], ["Active deals", "3", "In the pipeline"], ["Properties accepted", String(accepted), "Ready or matched"]]
    : role === "provider"
    ? [["Open requirements", "3", "1 needs an update"], ["Matched properties", "1", "Awaiting your review"], ["Active viewings", "1", "Next: 19 Aug"], ["Deals progressing", "1", "Heads of Terms"]]
    : [["Properties submitted", "3", "1 under review"], ["Accepted", "1", "Ready to be matched"], ["Active deals", "1", "1 viewing booked"], ["Fees earned", "£750", "Lifetime"]];
  const visibleReqs = role === "partner" ? requirements.map(({ operator, ...r }: any) => r) : requirements;
  const visibleProps = role === "provider" ? properties.filter((p: any) => p.status === "Matched") : properties;

  return <div className="page-content"><section className="welcome"><p>{isBBC ? "Here's what's happening across the platform today." : role === "provider" ? "Properties are matched to your requirements as BBC finds them." : "Track your submissions and see open demand."}</p><button className="primary" onClick={role === "provider" ? openRequirement : () => notify(role === "partner" ? "Use Properties → Upload property" : "Use the Properties tab to review submissions")}><span>＋</span>{role === "provider" ? "Post requirement" : isBBC ? "Review properties" : "Submit property"}</button></section>
  <section className="stats-grid">{stats.map((s: string[], i: number) => <article key={s[0]}><div className="stat-icon">{["▤", "◇", "↗", "✓"][i]}</div><span>{s[0]}</span><strong>{s[1]}</strong><small>{s[2]}</small></article>)}</section>
  <div className="content-grid">
    <section className="panel"><div className="panel-head"><div><h2>{isBBC ? "Property review queue" : role === "provider" ? "Matched properties" : "Your recent submissions"}</h2><p>{isBBC ? "Review submissions before they can be matched" : role === "provider" ? "Properties BBC has matched to your requirements" : "Status of properties you've submitted"}</p></div><button className="text-button" onClick={() => setView("properties")}>View all →</button></div>
      <div>{visibleProps.slice(0, 3).map((p: any) => <div className="property-row" key={p.id} onClick={() => openProperty(p)}><div className="building-thumb">⌂</div><div className="row-main"><strong>{p.name}</strong><span>{p.area} · {p.bedrooms} beds</span></div><div className="match"><b>{p.certs ? certStatus(p.certs).split(" ")[0] : ""}</b><span>docs</span></div><Status tone={p.status === "Accepted" || p.status === "Matched" ? "green" : p.status === "Declined" ? "red" : "amber"}>{p.status}</Status>{isBBC && p.status === "Submitted" && <button className="mini-action" onClick={e => { e.stopPropagation(); openProperty(p); }}>Review</button>}</div>)}
      {visibleProps.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing to show yet.</div>}</div></section>
    <section className="panel"><div className="panel-head"><div><h2>Deal pipeline</h2><p>Live progression</p></div><button className="text-button" onClick={() => setView("deals")}>View all →</button></div><div className="pipeline">{deals.map((d, i) => <div key={d.id}><span className={`pipeline-dot dot-${i}`}></span><div><strong>{d.property}</strong><p>{d.stage}</p><small>{d.date}</small></div></div>)}</div></section>
  </div>
  <section className="panel"><div className="panel-head"><div><h2>{role === "partner" ? "Open requirements" : "Recent requirements"}</h2><p>{role === "partner" ? "Live care-sector demand — submit properties to fulfil them" : "Care needs currently looking for the right property"}</p></div><button className="text-button" onClick={() => setView("requirements")}>View all requirements →</button></div>
  <div className="requirements-row">{visibleReqs.map((r: any) => <article key={r.id} onClick={() => setView("requirements")}><div><span>{r.propertyType}</span><Status tone={r.status === "Open" ? "grey" : "purple"}>{r.status}</Status></div><h3>{r.title}</h3><p>⌖ {r.area}</p><footer><strong>{r.budget}</strong><small>Needed by {r.neededBy}</small></footer></article>)}</div></section></div>;
}

function Requirements({ role, openDetail, create, partnerSafeReq }: any) {
  const list = role === "partner" ? requirements.map(partnerSafeReq) : requirements;
  return <div className="page-content"><div className="page-toolbar"><p>{role === "partner" ? "See open demand and submit properties that match." : "View, manage and match current care-provider requirements."}</p>{role === "provider" && <button className="primary" onClick={create}>＋ Post requirement</button>}</div>
  <section className="panel"><div className="filterbar"><button className="selected">All requirements <b>{list.length}</b></button><button>Open <b>{list.filter((r: any) => r.status === "Open").length}</b></button></div>
  <div className="data-table"><div className="table-header"><span>Requirement</span><span>Location</span><span>Budget</span><span>Status</span><span>Needed by</span></div>
  {list.map((r: any, i: number) => <button className="data-row" key={i} onClick={() => openDetail(r)}><span><b>{r.title}</b><small>{r.id} · {r.serviceType}</small></span><span>{r.area}</span><span>{r.budget}</span><span><Status tone={r.status === "Open" ? "grey" : "purple"}>{r.status}</Status></span><span>{r.neededBy}　→</span></button>)}</div></section></div>;
}

function Properties({ role, items, openProperty, add, providerSafeProperty }: any) {
  const visible = role === "provider" ? items.filter((p: any) => p.status === "Matched").map(providerSafeProperty) : items;
  return <div className="page-content"><div className="page-toolbar"><p>{role === "bbc" ? "Review, accept and match every submitted property." : role === "provider" ? "Properties BBC has matched to your requirements." : "Track your submitted properties and their review status."}</p>{role === "partner" && <button className="primary" onClick={add}>＋ Upload property</button>}</div>
  <div className="property-cards">{visible.map((p: any) => <article key={p.id} onClick={() => openProperty(p)}><div className="property-image"><span>{certStatus(p.certs)}</span><div>⌂</div></div><div className="card-content"><div><Status tone={p.status === "Accepted" || p.status === "Matched" ? "green" : p.status === "Declined" ? "red" : "amber"}>{p.status}</Status><small>{p.id}</small></div><h3>{p.name}</h3><p>{p.area}</p><div className="property-meta"><span><b>{p.bedrooms}</b> beds</span><span><b>{p.condition}</b></span><span><b>{p.rent}</b></span></div><button className="secondary">View property →</button></div></article>)}
  {visible.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing to show yet.</div>}</div></div>;
}

function Deals({ notify }: any) {
  const stages = ["Interested", "Viewing", "Heads of Terms", "Lease in progress"];
  return <div className="page-content"><div className="page-toolbar"><p>Track every introduction from first interest through to signed lease.</p><button className="secondary" onClick={() => notify("Pipeline exported")}>↓ Export pipeline</button></div>
  <div className="kanban">{stages.map((stage, i) => <section key={stage}><header><span className={`pipeline-dot dot-${i}`}></span><h3>{stage}</h3><b>{deals.filter((_, x) => x === Math.min(i, 2)).length}</b></header>{deals.filter((_, x) => x === Math.min(i, 2)).map(d => <article key={d.id}><Status tone={i > 1 ? "green" : "purple"}>Active</Status><h4>{d.property}</h4><p>{d.reqId}</p><div><small>{d.date}</small><button onClick={() => notify("Deal record opened")}>→</button></div></article>)}</section>)}</div></div>;
}

// All messaging is mediated by BBC. Providers and Partners never see or message
// each other's identity directly -- every conversation is with "BrightBridge Team",
// which keeps BBC as the single point of contact between both sides.
function Messages({ role }: any) {
  const threads = role === "bbc"
    ? ["Willow Care Group", "Kush Properties", "Horizon Supported Living"]
    : ["BrightBridge Team"];
  const [active, setActive] = useState(0);
  return <div className="page-content message-layout"><section className="conversation-list"><div className="message-search">⌕ Search conversations</div>{threads.map((p, i) => <button className={active === i ? "active" : ""} onClick={() => setActive(i)} key={p}><span>{p.split(" ").map(x => x[0]).slice(0, 2).join("")}</span><div><strong>{p}</strong><p>{i === 0 ? "The viewing is confirmed for…" : "Thanks, I'll send that over…"}</p></div><small>{i === 0 ? "09:42" : "Yesterday"}</small></button>)}</section>
  <section className="chat"><header><div className="avatar">{threads[active].split(" ").map(x => x[0]).slice(0, 2).join("")}</div><div><strong>{threads[active]}</strong><p>{role === "bbc" ? "Regarding: Detached home, Penn" : "Your BrightBridge point of contact"}</p></div></header>
  <div className="chat-body"><span className="date-label">Today</span><div className="bubble incoming">Hello, we&apos;ve reviewed the property details and would like to arrange a viewing.</div><div className="bubble outgoing">Great — I&apos;ve confirmed availability and added the viewing to the deal.</div><div className="bubble incoming">Perfect, that works. Thank you.</div></div>
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

function UploadWizard({ step, setStep, onCancel, onSubmit }: { step: number; setStep: (n: number) => void; onCancel: () => void; onSubmit: () => void }) {
  const [certs, setCerts] = useState<Record<string, boolean>>({});
  const labels = ["Property Details", "Images", "Compliance", "Review"];
  return <div className="modal-backdrop" onMouseDown={onCancel}><div className="modal" style={{ width: "min(760px,100%)" }} onMouseDown={e => e.stopPropagation()}>
    <div className="modal-head"><h2>Submit a property</h2><button className="icon-button" onClick={onCancel}>×</button></div>
    <div style={{ display: "flex", gap: 4, padding: "0 24px" }}>{labels.map((l, i) => (
      <div key={l} style={{ flex: 1, textAlign: "center" }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: i + 1 <= step ? "var(--ink)" : "#f0eef1", color: i + 1 <= step ? "#fff" : "var(--muted)" }}>{i + 1}</div>
        <div style={{ fontSize: 10, color: i + 1 <= step ? "var(--ink)" : "var(--muted)", fontWeight: i + 1 === step ? 700 : 400 }}>{l}</div>
        <div style={{ height: 3, background: i + 1 <= step ? "var(--ink)" : "#f0eef1", borderRadius: 2, marginTop: 6 }} />
      </div>))}</div>

    {step === 1 && <div className="form" style={{ paddingTop: 22 }}>
      <div className="field full"><label>Address</label><input required placeholder="42 Wellington Road, Birmingham, B15 3AB"/></div>
      <div className="field"><label>Property type</label><select><option>Family Home (2-3 bed)</option><option>HMO (up to 6 bed)</option><option>Larger Format (7+ bed)</option></select></div>
      <div className="field"><label>Bedrooms</label><input type="number" required placeholder="e.g. 6"/></div>
      <div className="field"><label>Condition</label><select><option>Furnished</option><option>Unfurnished</option><option>Needs refurbishment</option></select></div>
      <div className="field"><label>Monthly rent</label><input required placeholder="£1,800"/></div>
      <div className="field"><label>Available from</label><input type="date" required/></div>
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
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Upload certificates where available. Properties with complete documentation are reviewed faster.</p>
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
      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 14, background: "var(--surface)", padding: "10px 12px", borderRadius: 8 }}>ℹ Uploading documents does not mark the property as verified — BBC still reviews the submission.</p>
    </div>}

    {step === 4 && <div style={{ padding: "22px 24px" }}>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Check everything below before submitting to BBC.</p>
      <div className="detail-grid" style={{ padding: "14px 0" }}>
        <div><small>Compliance</small><strong>{Object.keys(certs).filter(k => certs[k]).length} / {Object.keys(CERT_LABELS).length} uploaded</strong></div>
        <div><small>Required docs</small><strong>{REQUIRED_CERTS.filter(k => certs[k]).length} / {REQUIRED_CERTS.length}</strong></div>
      </div>
      <p style={{ fontSize: 11, color: "#95631b", background: "var(--amber-bg)", padding: "10px 12px", borderRadius: 8, marginTop: 8 }}>⚠ Submitting does not mean the property has been accepted or matched. BBC will review within 10 business days.</p>
    </div>}

    <div className="form-actions">
      <button type="button" className="secondary" onClick={() => step === 1 ? onCancel() : setStep(step - 1)}>{step === 1 ? "Cancel" : "Back"}</button>
      {step < 4 ? <button className="primary" onClick={() => setStep(step + 1)}>Continue</button> : <button className="primary" onClick={onSubmit}>Submit property</button>}
    </div>
  </div></div>;
}
