"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */

import { useState } from "react";
type Role = "provider" | "partner" | "bbc";
type View = "overview" | "requirements" | "properties" | "viewings" | "messages" | "settings";

/* ---------------------------------------------------------------------------
   Documents
   Every document moves through the same four states, and every state change
   goes through BrightBridge. A care provider never asks a property source
   directly and never sees a document before it has been released.
--------------------------------------------------------------------------- */

type DocState = "Requested" | "Being obtained" | "On file" | "Released";
type DocItem = { id: string; label: string; standard: boolean; askedForBy: "" | "provider" | "requirement"; state: DocState };

const STANDARD_DOCS = [
  "EICR (electrical installation)", "Gas safety certificate (CP12)", "EPC (energy performance)",
  "Fire risk assessment", "Fire alarm installation certificate", "HMO licence (where applicable)", "Legionella risk assessment", "Floor plan with room dimensions",
];
const REQUIRED_DOCS = STANDARD_DOCS.slice(0, 5);

/* Common extras care providers ask for, offered as a checklist so they aren't
   guessing at what we already collect. */
const COMMON_EXTRA_DOCS = [
  "Buildings insurance certificate", "Asbestos survey", "Boiler service record",
  "PAT testing certificate", "Planning use class confirmation", "Recent works or refurbishment record",
];

let idCounter = 1000;
const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

const standardDocs = (onFile: boolean[] = []): DocItem[] => STANDARD_DOCS.map((label, i) => ({
  id: `DOC-STD-${i}-${Math.random().toString(36).slice(2, 7)}`, label, standard: true, askedForBy: "",
  state: onFile[i] ? "On file" : "Being obtained",
}));

type PropertyRecord = {
  id: string; name: string; area: string; propertyType: string; bedrooms: string | number; bathrooms: string | number;
  condition: string; rent: string; leaseOffer: string; availableFrom: string; description: string; images: string[];
  status: string; declineReason: string; matchedReq: string | null; documents: DocItem[];
  passedOn: { reqId: string; reason: string }[];
};

type RequirementRecord = {
  id: string; title: string; area: string; serviceType: string; residentGroup: string; propertyType: string;
  bedrooms: string | number; bathrooms: string | number; capacity: string | number;
  budget: string; leaseMin: string; leaseMax: string; neededBy: string;
  accessibility: string[]; features: string[]; extraDocs: string[]; notes: string;
  status: "Draft" | "Open" | "Withdrawn"; operator: string; matchedPropertyIds: string[]; postedOn: string;
};

type ViewingRecord = {
  id: string; propertyId: string; propertyName: string; reqId: string | null;
  candidateDates: string[]; partnerSelectedDate: string | null; confirmedDate: string | null; declineNote: string | null;
  status: "Requested" | "Shared with property source" | "Awaiting BrightBridge confirmation" | "Reschedule needed" | "Confirmed";
};

const seedRequirements: RequirementRecord[] = [
  { id: "REQ-1048", title: "6 bed supported living home", area: "Wolverhampton", serviceType: "Supported living", residentGroup: "Adults (18+)", propertyType: "HMO (up to 6 bed)", bedrooms: 6, bathrooms: 3, capacity: "5 to 6 residents", budget: "£3,600 pcm", leaseMin: "5 years", leaseMax: "10 years", neededBy: "12 Oct 2026", accessibility: ["Ground floor bedroom", "Step free access"], features: ["Outdoor space", "Off street parking"], extraDocs: ["Buildings insurance certificate"], notes: "", status: "Open", operator: "Willow Care Group", matchedPropertyIds: ["PROP-231", "PROP-234"], postedOn: "28 Jul 2026" },
  { id: "REQ-1044", title: "Children's home with garden", area: "Stoke-on-Trent", serviceType: "Children's home", residentGroup: "Young people (16 to 25)", propertyType: "Larger format (7+ bed)", bedrooms: 7, bathrooms: 3, capacity: "6 to 7 residents", budget: "£4,200 pcm", leaseMin: "5 years", leaseMax: "", neededBy: "1 Nov 2026", accessibility: [], features: ["Outdoor space", "Off street parking"], extraDocs: ["Planning use class confirmation"], notes: "", status: "Open", operator: "Willow Care Group", matchedPropertyIds: [], postedOn: "4 Aug 2026" },
  { id: "REQ-1039", title: "Accessible 4 bed bungalow", area: "Walsall", serviceType: "Supported living", residentGroup: "Adults (18+)", propertyType: "Family home (2 to 3 bed)", bedrooms: 4, bathrooms: 2, capacity: "3 to 4 residents", budget: "£3,100 pcm", leaseMin: "5 years", leaseMax: "", neededBy: "20 Sep 2026", accessibility: ["Wheelchair accessible", "Wet room", "Wider doorways"], features: [], extraDocs: [], notes: "", status: "Draft", operator: "Willow Care Group", matchedPropertyIds: [], postedOn: "" },
];

const seedProperties: PropertyRecord[] = [
  { id: "PROP-231", name: "Detached home, Penn", images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop"], area: "Wolverhampton, WV4", propertyType: "HMO (up to 6 bed)", bedrooms: 6, bathrooms: 3, condition: "Furnished", rent: "£3,450 pcm", leaseOffer: "5 to 10 years", availableFrom: "Immediate", description: "Spacious detached property recently refurbished throughout, six double bedrooms, three bathrooms, enclosed rear garden and driveway parking.", status: "Matched", declineReason: "", matchedReq: "REQ-1048", documents: [...standardDocs([true, true, true, true, true, false, false, false]), { id: "DOC-REQ-1", label: "Buildings insurance certificate", standard: false, askedForBy: "requirement", state: "On file" }], passedOn: [] },
  { id: "PROP-234", name: "Semi-detached, Bilston", images: ["https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1560185127-6a3c7c4e7261?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop"], area: "Wolverhampton, WV14", propertyType: "HMO (up to 6 bed)", bedrooms: 6, bathrooms: 2, condition: "Furnished", rent: "£3,100 pcm", leaseOffer: "5 years minimum", availableFrom: "1 Sep 2026", description: "End of terrace converted to six bedrooms across two floors. Close to bus routes. Small rear yard.", status: "Matched", declineReason: "", matchedReq: "REQ-1048", documents: standardDocs([true, true, true, true, false, false, false, false]), passedOn: [] },
  { id: "PROP-229", name: "Corner house, Hanley", images: ["https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1600573472556-e636c2acda9e?w=400&h=300&fit=crop"], area: "Stoke-on-Trent, ST1", propertyType: "Larger format (7+ bed)", bedrooms: 7, bathrooms: 2, condition: "Furnished", rent: "£3,900 pcm", leaseOffer: "5 years minimum", availableFrom: "1 Oct 2026", description: "", status: "Submitted", declineReason: "", matchedReq: "REQ-1044", documents: standardDocs([true, true, false, true, false, false, false, false]), passedOn: [] },
  { id: "PROP-226", name: "Accessible bungalow", images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=400&h=300&fit=crop"], area: "Walsall, WS3", propertyType: "Family home (2 to 3 bed)", bedrooms: 4, bathrooms: 2, condition: "Unfurnished", rent: "£2,950 pcm", leaseOffer: "3 to 7 years", availableFrom: "Immediate", description: "", status: "Accepted", declineReason: "", matchedReq: null, documents: standardDocs([true, false, false, false, false, false, false, false]), passedOn: [] },
];

function Status({ children, tone = "purple" }: { children: React.ReactNode; tone?: "purple" | "green" | "amber" | "grey" | "red" }) { return <span className={`status ${tone}`}>{children}</span>; }

const propTone = (s: string) => ["Accepted", "Matched", "Viewing confirmed"].includes(s) ? "green" : s === "Declined" ? "red" : s === "Draft" || s === "Withdrawn" ? "grey" : "amber";
const reqTone = (s: string) => s === "Open" ? "green" : s === "Draft" ? "amber" : "grey";
const docTone = (s: DocState) => s === "Released" ? "green" : s === "On file" ? "purple" : s === "Requested" ? "amber" : "grey";

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
  const required = documents.filter(d => REQUIRED_DOCS.includes(d.label));
  return `${required.filter(d => d.state === "On file" || d.state === "Released").length}/${required.length} required docs`;
}

const NAV: Record<View, { id: View; label: string; icon: string }> = {
  overview: { id: "overview", label: "Overview", icon: "⌂" },
  requirements: { id: "requirements", label: "Requirements", icon: "▤" },
  properties: { id: "properties", label: "Properties", icon: "◇" },
  viewings: { id: "viewings", label: "Viewings", icon: "↗" },
  messages: { id: "messages", label: "Messages", icon: "□" },
  settings: { id: "settings", label: "Settings", icon: "⚙" },
};

function navFor(role: Role): { id: View; label: string; icon: string }[] {
  const ids: View[] = role === "bbc"
    ? ["overview", "requirements", "properties", "viewings", "messages"]
    : ["overview", "requirements", "properties", "viewings", "messages"];
  return ids.map(id => NAV[id]);
}

export default function Home() {
  const [screen, setScreen] = useState<"landing" | "onboardProvider" | "onboardPartner" | "app">("landing");
  const [role, setRole] = useState<Role>("bbc");
  const [view, setView] = useState<View>("overview");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"requirement" | "property" | "detail" | "upload" | "docRequest" | "viewingRequest" | "declineDates" | "passOn" | null>(null);
  const [toast, setToast] = useState("");
  const [requirements, setRequirements] = useState<RequirementRecord[]>(seedRequirements);
  const [properties, setProperties] = useState<PropertyRecord[]>(seedProperties);
  const [viewings, setViewings] = useState<ViewingRecord[]>([]);
  const [selectedProp, setSelectedProp] = useState<PropertyRecord | null>(null);
  const [selectedReq, setSelectedReq] = useState<RequirementRecord | null>(null);
  const [activeViewing, setActiveViewing] = useState<ViewingRecord | null>(null);
  const [editingReq, setEditingReq] = useState<RequirementRecord | null>(null);
  const [editingProp, setEditingProp] = useState<PropertyRecord | null>(null);
  const [uploadStep, setUploadStep] = useState(1);
  const [uploadForReqId, setUploadForReqId] = useState<string | null>(null);
  const [reqFilter, setReqFilter] = useState<"all" | "open" | "draft">("all");
  const [returnToReq, setReturnToReq] = useState(false);

  const myName = role === "bbc" ? "BrightBridge" : role === "provider" ? "Willow Care Group" : "Kush Properties";
  const roleName = role === "bbc" ? "BrightBridge workspace" : role === "provider" ? "Care provider portal" : "Property partner portal";
  const heading = view === "overview" ? `Welcome back, ${myName.split(" ").slice(0, 2).join(" ")}` : NAV[view]?.label;
  const navItems = navFor(role);
  const bbcViewingsPending = viewings.filter(v => v.status === "Requested" || v.status === "Awaiting BrightBridge confirmation").length;
  const partnerViewingsPending = viewings.filter(v => v.status === "Shared with property source").length;
  const bbcDocRequests = properties.reduce((n, p) => n + p.documents.filter(d => d.state === "Requested").length, 0);
  const filteredProps = properties.filter(p => `${p.name} ${p.area}`.toLowerCase().includes(search.toLowerCase()));
  const today = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  function notify(message: string) { setToast(message); setTimeout(() => setToast(""), 3600); }
  function changeRole(next: Role) { setRole(next); setView("overview"); setModal(null); }
  function enterAppAs(next: Role) { setRole(next); setScreen("app"); setView("overview"); }
  function backToStart() { setScreen("landing"); setView("overview"); setModal(null); }

  /* ---------------- requirements ---------------- */
  function saveRequirement(fields: any, asDraft: boolean, existingId?: string) {
    if (existingId) {
      setRequirements(prev => prev.map(r => r.id === existingId ? { ...r, ...fields, status: asDraft ? "Draft" : "Open", postedOn: r.postedOn || (asDraft ? "" : today()) } : r));
      notify(asDraft ? "Saved as draft" : "Requirement updated and shared with property partners");
    } else {
      const req: RequirementRecord = { id: nextId("REQ"), status: asDraft ? "Draft" : "Open", operator: myName, matchedPropertyIds: [], postedOn: asDraft ? "" : today(), ...fields };
      setRequirements(prev => [req, ...prev]);
      notify(asDraft ? "Saved as draft" : `${req.id} is live, every property partner covering ${fields.area || "this area"} has been notified`);
    }
    setModal(null); setEditingReq(null);
  }
  function publishRequirement(id: string) {
    setRequirements(prev => prev.map(r => r.id === id ? { ...r, status: "Open", postedOn: today() } : r));
    notify("Requirement is live, every property partner covering this area has been notified");
    setModal(null);
  }
  function withdrawRequirement(id: string) { setRequirements(prev => prev.map(r => r.id === id ? { ...r, status: "Withdrawn" } : r)); notify("Requirement withdrawn"); setModal(null); }

  /* ---------------- properties ---------------- */
  function docsForRequirement(reqId: string | null, docs: DocItem[]) {
    const req = requirements.find(r => r.id === reqId);
    if (!req) return docs;
    const extra = req.extraDocs.filter(label => !docs.some(d => d.label === label))
      .map(label => ({ id: nextId("DOC"), label, standard: false, askedForBy: "requirement" as const, state: "Being obtained" as DocState }));
    return [...docs, ...extra];
  }
  function saveProperty(fields: any, docs: DocItem[], asDraft: boolean, forReqId: string | null, existingId?: string) {
    if (existingId) {
      setProperties(prev => prev.map(p => p.id === existingId ? { ...p, ...fields, documents: docs, status: asDraft ? "Draft" : (["Draft", "Declined"].includes(p.status) ? "Submitted" : p.status), declineReason: ["Draft", "Declined"].includes(p.status) ? "" : p.declineReason } : p));
      notify(asDraft ? "Draft saved" : "Property updated and sent to BrightBridge");
    } else {
      const prop: PropertyRecord = { id: nextId("PROP"), status: asDraft ? "Draft" : "Submitted", declineReason: "", matchedReq: forReqId, images: [], documents: docsForRequirement(forReqId, docs), passedOn: [], ...fields };
      setProperties(prev => [prop, ...prev]);
      notify(asDraft ? "Saved as a draft, nothing has been sent to BrightBridge" : (forReqId ? `Property submitted against ${forReqId}, BrightBridge will review it` : "Property submitted, BrightBridge will review it"));
    }
    setModal(null); setEditingProp(null);
  }
  function withdrawProperty(id: string) { setProperties(prev => prev.map(p => p.id === id ? { ...p, status: "Withdrawn" } : p)); notify("Property withdrawn"); setModal(null); }
  function decideProperty(id: string, decision: "Accepted" | "Declined", reason?: string) { setProperties(prev => prev.map(p => p.id === id ? { ...p, status: decision, declineReason: reason || "" } : p)); notify(decision === "Accepted" ? "Property accepted, ready to match to a requirement" : "Property declined, the partner has been told why"); setModal(null); }
  function matchProperty(propId: string, reqId: string) {
    setProperties(prev => prev.map(p => p.id !== propId ? p : { ...p, status: "Matched", matchedReq: reqId, documents: docsForRequirement(reqId, p.documents) }));
    setRequirements(prev => prev.map(r => r.id === reqId ? { ...r, matchedPropertyIds: r.matchedPropertyIds.includes(propId) ? r.matchedPropertyIds : [...r.matchedPropertyIds, propId] } : r));
    notify(`Matched to ${reqId}, the care provider has been notified`);
    setModal(null);
  }
  /* A care provider passing on a property returns it to the accepted pool with
     the reason kept against the property. Nothing is ever deleted. */
  function passOnProperty(prop: PropertyRecord, reason: string) {
    setProperties(prev => prev.map(p => p.id === prop.id ? { ...p, status: "Accepted", matchedReq: null, passedOn: [...p.passedOn, { reqId: prop.matchedReq || "", reason }] } : p));
    if (prop.matchedReq) setRequirements(prev => prev.map(r => r.id === prop.matchedReq ? { ...r, matchedPropertyIds: r.matchedPropertyIds.filter(id => id !== prop.id) } : r));
    notify("Passed on, BrightBridge has the reason and will keep looking");
    setModal(null);
  }

  /* ---------------- documents ---------------- */
  function updateDoc(propId: string, docId: string, patch: Partial<DocItem>) {
    const apply = (p: PropertyRecord) => p.id !== propId ? p : { ...p, documents: p.documents.map(d => d.id === docId ? { ...d, ...patch } : d) };
    setProperties(prev => prev.map(apply));
    setSelectedProp(prev => prev && prev.id === propId ? apply(prev) : prev);
  }
  function requestDocs(prop: PropertyRecord, labels: string[]) {
    const fresh = labels.filter(l => !prop.documents.some(d => d.label === l))
      .map(label => ({ id: nextId("DOC"), label, standard: false, askedForBy: "provider" as const, state: "Requested" as DocState }));
    const apply = (p: PropertyRecord) => p.id !== prop.id ? p : { ...p, documents: [...p.documents, ...fresh] };
    setProperties(prev => prev.map(apply));
    setSelectedProp(prev => prev && prev.id === prop.id ? apply(prev) : prev);
    notify(fresh.length ? "Sent to BrightBridge, we will get these from the property source" : "Those are already on the list for this property");
    setModal("property");
  }
  function askPartnerForDoc(propId: string, docId: string) { updateDoc(propId, docId, { state: "Being obtained" }); notify("Passed to the property source"); }
  function markDocOnFile(propId: string, docId: string) { updateDoc(propId, docId, { state: "On file" }); notify("Marked as received"); }
  function releaseDoc(propId: string, docId: string) { updateDoc(propId, docId, { state: "Released" }); notify("Released to the care provider"); }

  /* ---------------- viewings ---------------- */
  function requestViewing(prop: PropertyRecord, dates: string[]) {
    const v: ViewingRecord = { id: nextId("VIEW"), propertyId: prop.id, propertyName: prop.name, reqId: prop.matchedReq, candidateDates: dates, partnerSelectedDate: null, confirmedDate: null, declineNote: null, status: "Requested" };
    setViewings(prev => [v, ...prev]);
    setProperties(prev => prev.map(p => p.id === prop.id ? { ...p, status: "Viewing requested" } : p));
    notify("Viewing requested, BrightBridge is arranging it with the property source");
    setModal(null);
  }
  function shareWithPartner(viewId: string) { setViewings(prev => prev.map(v => v.id === viewId ? { ...v, status: "Shared with property source" } : v)); notify("Shared with the property source, awaiting their availability"); }
  function partnerPickDate(viewId: string, date: string) { setViewings(prev => prev.map(v => v.id === viewId ? { ...v, partnerSelectedDate: date, status: "Awaiting BrightBridge confirmation" } : v)); notify("Availability sent to BrightBridge to confirm"); }
  function partnerDecline(viewId: string, note: string) { setViewings(prev => prev.map(v => v.id === viewId ? { ...v, status: "Reschedule needed", declineNote: note } : v)); notify("BrightBridge notified, none of the dates worked"); setModal(null); }
  function proposeNewDates(viewId: string, dates: string[]) { setViewings(prev => prev.map(v => v.id === viewId ? { ...v, candidateDates: dates, partnerSelectedDate: null, declineNote: null, status: "Requested" } : v)); notify("New dates sent to BrightBridge"); setModal(null); }
  function confirmViewing(viewId: string) {
    const v = viewings.find(x => x.id === viewId);
    setViewings(prev => prev.map(x => x.id === viewId ? { ...x, status: "Confirmed", confirmedDate: x.partnerSelectedDate || "Date to be confirmed" } : x));
    if (v) setProperties(prev => prev.map(p => p.id === v.propertyId ? { ...p, status: "Viewing confirmed", documents: p.documents.map(d => d.state === "On file" ? { ...d, state: "Released" as DocState } : d) } : p));
    notify("Viewing confirmed, all parties emailed and documents on file released to the care provider");
  }

  const partnerSafeReq = (r: RequirementRecord) => { const { operator, ...rest } = r; return rest; };
  const reqListFiltered = (list: RequirementRecord[]) => reqFilter === "open" ? list.filter(r => r.status === "Open") : reqFilter === "draft" ? list.filter(r => r.status === "Draft") : list;
  const openProperty = (p: PropertyRecord, fromReq = false) => { setSelectedProp(p); setReturnToReq(fromReq); setModal("property"); };

  /* ---------------- entry ---------------- */
  if (screen === "landing") return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 40, background: "#fff" }}>
    <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Bright<span style={{ color: "var(--purple)" }}>Bridge</span> Connect</div>
    <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 52 }}>Connecting housing with care</div>
    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 28 }}>Create an account</div>
    <div style={{ display: "flex", gap: 20, maxWidth: 620, width: "100%" }}>
      <div onClick={() => setScreen("onboardProvider")} style={{ flex: 1, border: "2px solid var(--line)", borderRadius: 14, padding: "36px 24px", textAlign: "center", cursor: "pointer" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Care provider</div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>Supported living providers, children&apos;s homes and local authorities looking for property</div>
      </div>
      <div onClick={() => setScreen("onboardPartner")} style={{ flex: 1, border: "2px solid var(--line)", borderRadius: 14, padding: "36px 24px", textAlign: "center", cursor: "pointer" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Property partner</div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>Landlords and sourcers supplying property to the care sector</div>
      </div>
    </div>
    <button className="text-button" style={{ marginTop: 36 }} onClick={() => enterAppAs("bbc")}>BrightBridge team, go to the internal workspace →</button>
  </div>;

  if (screen === "onboardProvider") return <RegisterProvider onBack={() => setScreen("landing")} onDone={() => enterAppAs("provider")}/>;
  if (screen === "onboardPartner") return <RegisterPartner onBack={() => setScreen("landing")} onDone={() => enterAppAs("partner")}/>;

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><img src="/brightbridge-logo.png" alt=""/><div><strong>BrightBridge</strong><span>Connect</span></div></div><div className="workspace-label">Workspace</div>
    <button className="role-switch" onClick={() => changeRole(role === "bbc" ? "provider" : role === "provider" ? "partner" : "bbc")}><span className="role-avatar">{role === "bbc" ? "BB" : myName.split(" ").map(x => x[0]).slice(0, 2).join("")}</span><span><b>{roleName}</b><small>Switch workspace (demo)</small></span><i>⌄</i></button>
    <nav>{navItems.map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><span>{item.icon}</span>{item.label}
      {item.id === "viewings" && role === "bbc" && bbcViewingsPending > 0 && <em>{bbcViewingsPending}</em>}
      {item.id === "properties" && role === "bbc" && bbcDocRequests > 0 && <em>{bbcDocRequests}</em>}
      {item.id === "viewings" && role === "partner" && partnerViewingsPending > 0 && <em>{partnerViewingsPending}</em>}</button>)}</nav>
    <div className="sidebar-bottom"><button onClick={() => setView("settings")} className={view === "settings" ? "active" : ""}><span>⚙</span>Settings</button><button onClick={backToStart}><span>⇠</span>Sign out</button><div className="help-card"><span>?</span><strong>Need some help?</strong><small>Talk to your BrightBridge contact</small><button onClick={() => setView("messages")}>Open messages</button></div></div></aside>

    <main className="main"><header><div><p>{roleName}</p><h1>{heading}</h1></div><div className="header-actions">{<label className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"/></label>}<button className="notification" onClick={() => notify("You are all caught up")}>♢<i/></button><button className="avatar">{role === "bbc" ? "BB" : myName.split(" ").map(x => x[0]).slice(0, 2).join("")}</button></div></header>

      {view === "overview" && <Overview role={role} setView={setView} requirements={requirements} properties={properties} viewings={viewings} openRequirement={() => { setEditingReq(null); setModal("requirement"); }} openProperty={openProperty} notify={notify} onUpload={() => { setEditingProp(null); setUploadForReqId(null); setUploadStep(1); setModal("upload"); }} openReqDetail={(r: RequirementRecord) => { setSelectedReq(r); setModal("detail"); }}/>}
      {view === "requirements" && <Requirements role={role} requirements={requirements} reqFilter={reqFilter} setReqFilter={setReqFilter} reqListFiltered={reqListFiltered} openDetail={(r: RequirementRecord) => { setSelectedReq(r); setModal("detail"); }} create={() => { setEditingReq(null); setModal("requirement"); }} partnerSafeReq={partnerSafeReq}/>}
      {view === "properties" && <Properties role={role} items={filteredProps} requirements={requirements} openProperty={openProperty} add={() => { setEditingProp(null); setUploadForReqId(null); setUploadStep(1); setModal("upload"); }}/>}
      {view === "viewings" && <Viewings role={role} viewings={viewings} shareWithPartner={shareWithPartner} partnerPickDate={partnerPickDate} confirmViewing={confirmViewing} onDeclineDates={(v: ViewingRecord) => { setActiveViewing(v); setModal("declineDates"); }} onNewDates={(v: ViewingRecord) => { setActiveViewing(v); setModal("viewingRequest"); }} setView={setView}/>}
      {view === "messages" && <Messages role={role} myName={myName} properties={properties} requirements={requirements}/>}
      {view === "settings" && <Settings role={role}/>}
    </main>

    {modal === "requirement" && <Modal title={editingReq ? `Edit ${editingReq.id}` : "New requirement"} onClose={() => { setModal(null); setEditingReq(null); }} wide>
      <RequirementForm initial={editingReq} onCancel={() => { setModal(null); setEditingReq(null); }} onSubmit={(fields: any, asDraft: boolean) => saveRequirement(fields, asDraft, editingReq?.id)}/>
    </Modal>}

    {modal === "property" && selectedProp && <PropertyModal role={role} prop={properties.find(p => p.id === selectedProp.id) || selectedProp} requirements={requirements}
      onClose={() => { if (returnToReq) { setReturnToReq(false); setModal("detail"); } else setModal(null); }}
      onDecide={decideProperty} onMatch={matchProperty}
      onRequestDocs={() => setModal("docRequest")} onAskPartner={askPartnerForDoc} onMarkOnFile={markDocOnFile} onRelease={releaseDoc}
      onRequestViewing={() => setModal("viewingRequest")} onPassOn={() => setModal("passOn")}
      onEdit={() => { setEditingProp(selectedProp); setUploadForReqId(selectedProp.matchedReq); setUploadStep(1); setModal("upload"); }}
      onWithdraw={() => withdrawProperty(selectedProp.id)}
    />}

    {modal === "docRequest" && selectedProp && <Modal title="Ask for more documents" onClose={() => setModal("property")} wide>
      <DocRequestForm existing={selectedProp.documents} onCancel={() => setModal("property")} onSubmit={(labels: string[]) => requestDocs(selectedProp, labels)}/>
    </Modal>}

    {modal === "passOn" && selectedProp && <Modal title="Pass on this property" onClose={() => setModal("property")}>
      <PassOnForm onCancel={() => setModal("property")} onSubmit={(reason: string) => passOnProperty(selectedProp, reason)}/>
    </Modal>}

    {modal === "viewingRequest" && (selectedProp || activeViewing) && <Modal title={activeViewing ? "Offer new dates" : "Request a viewing"} onClose={() => { setActiveViewing(null); setModal(selectedProp ? "property" : null); }}>
      <ViewingRequestForm onCancel={() => { setActiveViewing(null); setModal(selectedProp ? "property" : null); }} onSubmit={(dates: string[]) => { if (activeViewing) { proposeNewDates(activeViewing.id, dates); setActiveViewing(null); } else if (selectedProp) requestViewing(selectedProp, dates); }}/>
    </Modal>}

    {modal === "declineDates" && activeViewing && <Modal title="None of these dates work" onClose={() => { setActiveViewing(null); setModal(null); }}>
      <DeclineDatesForm onCancel={() => { setActiveViewing(null); setModal(null); }} onSubmit={(note: string) => { partnerDecline(activeViewing.id, note); setActiveViewing(null); }}/>
    </Modal>}

    {modal === "detail" && selectedReq && <RequirementDetailModal role={role} req={requirements.find(r => r.id === selectedReq.id) || selectedReq} properties={properties}
      onClose={() => setModal(null)}
      onEdit={() => { setEditingReq(selectedReq); setModal("requirement"); }}
      onPublish={() => publishRequirement(selectedReq.id)}
      onWithdraw={() => withdrawRequirement(selectedReq.id)}
      onOpenProperty={(p: PropertyRecord) => openProperty(p, true)}
      onSubmitProperty={() => { setEditingProp(null); setUploadForReqId(selectedReq.id); setUploadStep(1); setModal("upload"); }}
    />}

    {modal === "upload" && <UploadWizard step={uploadStep} setStep={setUploadStep} forReq={requirements.find(r => r.id === uploadForReqId) || null} initial={editingProp} onCancel={() => { setModal(null); setEditingProp(null); }} onSubmit={(fields: any, docs: DocItem[], asDraft: boolean) => saveProperty(fields, docs, asDraft, uploadForReqId, editingProp?.id)}/>}

    {toast && <div className="toast"><span>✓</span>{toast}</div>}</div>;
}

/* ---------------------------------------------------------------------------
   Overview
--------------------------------------------------------------------------- */

function Overview({ role, setView, requirements, properties, viewings, openRequirement, openProperty, notify, onUpload, openReqDetail }: any) {
  const isBBC = role === "bbc";
  const underReview = properties.filter((p: PropertyRecord) => p.status === "Submitted").length;
  const accepted = properties.filter((p: PropertyRecord) => ["Accepted", "Matched"].includes(p.status)).length;
  const providerVisible = properties.filter((p: PropertyRecord) => ["Matched", "Viewing requested", "Viewing confirmed"].includes(p.status));
  const openReqs = requirements.filter((r: RequirementRecord) => r.status === "Open").length;
  const pendingViewings = viewings.filter((v: ViewingRecord) => v.status !== "Confirmed").length;

  const stats = isBBC
    ? [["Live requirements", String(openReqs), "Shared with partners"], ["Properties to review", String(underReview), "Needs a decision"], ["Viewings to coordinate", String(pendingViewings), "Needs action"], ["Properties accepted", String(accepted), "Ready or matched"]]
    : role === "provider"
    ? [["Live requirements", String(openReqs), `${requirements.filter((r: RequirementRecord) => r.status === "Draft").length} in draft`], ["Properties to review", String(providerVisible.filter((p: PropertyRecord) => p.status === "Matched").length), "Matched to your briefs"], ["Viewings in progress", String(pendingViewings), "Being arranged"], ["Viewings confirmed", String(viewings.filter((v: ViewingRecord) => v.status === "Confirmed").length), "Booked in"]]
    : [["Properties submitted", String(properties.filter((p: PropertyRecord) => !["Withdrawn", "Draft"].includes(p.status)).length), `${underReview} under review`], ["Accepted", String(accepted), "Ready or matched"], ["Viewing requests", String(viewings.filter((v: ViewingRecord) => v.status === "Shared with property source").length), "Needs your availability"], ["Fees earned", "£750", "Lifetime"]];

  const visibleReqs = role === "partner" ? requirements.filter((r: RequirementRecord) => r.status === "Open") : requirements.filter((r: RequirementRecord) => r.status !== "Withdrawn");
  const visibleProps = role === "provider" ? providerVisible : properties.filter((p: PropertyRecord) => p.status !== "Withdrawn");

  return <div className="page-content">
    <section className="welcome"><p>{isBBC ? "Everything waiting on BrightBridge today." : role === "provider" ? "Properties appear here once BrightBridge has checked them against your requirements." : "New requirements reach you the moment they go live."}</p>
      <button className="primary" onClick={role === "provider" ? openRequirement : role === "partner" ? onUpload : () => setView("properties")}><span>＋</span>{role === "provider" ? "New requirement" : isBBC ? "Review properties" : "Submit property"}</button></section>

    <section className="stats-grid">{stats.map((s: string[], i: number) => <article key={s[0]}><div className="stat-icon">{["▤", "◇", "↗", "✓"][i]}</div><span>{s[0]}</span><strong>{s[1]}</strong><small>{s[2]}</small></article>)}</section>

    <div className="content-grid">
      <section className="panel"><div className="panel-head"><div><h2>{isBBC ? "Property review queue" : role === "provider" ? "Properties for your requirements" : "Your recent submissions"}</h2><p>{isBBC ? "Review submissions before they can be matched" : role === "provider" ? "Matched by BrightBridge, waiting on you" : "Status of properties you have submitted"}</p></div><button className="text-button" onClick={() => setView("properties")}>View all →</button></div>
        <div>{visibleProps.slice(0, 3).map((p: PropertyRecord) => <div className="property-row" key={p.id} onClick={() => openProperty(p)}><div className="building-thumb" style={{ overflow: "hidden" }}>{p.images?.[0] ? <img src={p.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}/> : <span>⌂</span>}</div><div className="row-main"><strong>{p.name}</strong><span>{p.area} · {p.bedrooms} beds{p.matchedReq ? ` · ${p.matchedReq}` : ""}</span></div><div className="match"><b>{docSummary(p.documents).split(" ")[0]}</b><span>docs</span></div><Status tone={propTone(p.status)}>{p.status}</Status>{isBBC && p.status === "Submitted" && <button className="mini-action" onClick={e => { e.stopPropagation(); openProperty(p); }}>Review</button>}</div>)}
        {visibleProps.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing here yet. {role === "provider" ? "Submit a requirement and matches will appear." : ""}</div>}</div></section>

      <section className="panel"><div className="panel-head"><div><h2>Viewings</h2><p>Live coordination</p></div><button className="text-button" onClick={() => setView("viewings")}>View all →</button></div><div className="pipeline">{viewings.slice(0, 4).map((v: ViewingRecord, i: number) => <div key={v.id}><span className={`pipeline-dot dot-${i % 4}`}></span><div><strong>{v.propertyName}</strong><p>{v.status}</p><small>{v.confirmedDate || v.partnerSelectedDate || v.candidateDates[0]}</small></div></div>)}{viewings.length === 0 && <div style={{ padding: 20, color: "var(--muted)", fontSize: 11 }}>No viewings arranged yet.</div>}</div></section>
    </div>

    <section className="panel"><div className="panel-head"><div><h2>{role === "partner" ? "Live requirements" : "Your requirements"}</h2><p>{role === "partner" ? "Care sector demand you can submit properties against" : "Briefs currently with property partners"}</p></div><button className="text-button" onClick={() => setView("requirements")}>View all →</button></div>
      <div className="requirements-row">{visibleReqs.slice(0, 3).map((r: RequirementRecord) => <article key={r.id} onClick={() => openReqDetail(r)}><div><span>{r.propertyType}</span><Status tone={reqTone(r.status)}>{r.status}</Status></div><h3>{r.title || "Untitled draft"}</h3><p>⌖ {r.area}</p><footer><strong>{r.budget}</strong><small>{r.matchedPropertyIds.length > 0 ? `${r.matchedPropertyIds.length} propert${r.matchedPropertyIds.length === 1 ? "y" : "ies"} matched` : `Needed by ${r.neededBy || "—"}`}</small></footer></article>)}</div></section>
  </div>;
}

/* ---------------------------------------------------------------------------
   Requirements
--------------------------------------------------------------------------- */

function Requirements({ role, requirements, reqFilter, setReqFilter, reqListFiltered, openDetail, create, partnerSafeReq }: any) {
  const base = role === "partner" ? requirements.filter((r: RequirementRecord) => r.status === "Open").map(partnerSafeReq) : requirements.filter((r: RequirementRecord) => r.status !== "Withdrawn");
  const list = role === "provider" ? reqListFiltered(base) : base;
  return <div className="page-content">
    <div className="page-toolbar"><p>{role === "partner" ? "Every live requirement, shared with you under a reference number." : role === "bbc" ? "Every requirement across the platform." : "Your requirements, live and draft."}</p>{role === "provider" && <button className="primary" onClick={create}>＋ New requirement</button>}</div>
    <section className="panel">
      {role === "provider" && <div className="filterbar">
        <button className={reqFilter === "all" ? "selected" : ""} onClick={() => setReqFilter("all")}>All <b>{base.length}</b></button>
        <button className={reqFilter === "open" ? "selected" : ""} onClick={() => setReqFilter("open")}>Live <b>{base.filter((r: any) => r.status === "Open").length}</b></button>
        <button className={reqFilter === "draft" ? "selected" : ""} onClick={() => setReqFilter("draft")}>Drafts <b>{base.filter((r: any) => r.status === "Draft").length}</b></button>
      </div>}
      <div className="data-table"><div className="table-header"><span>Requirement</span><span>Location</span><span>Monthly rent</span><span>Status</span><span>Properties</span></div>
        {list.map((r: any) => <button className="data-row" key={r.id} onClick={() => openDetail(r)}>
          <span><b>{r.title || "Untitled draft"}</b><small>{r.id} · {r.serviceType} · {r.bedrooms} beds</small></span>
          <span>{r.area || "—"}</span><span>{r.budget || "—"}</span>
          <span><Status tone={reqTone(r.status)}>{r.status}</Status></span>
          <span>{r.matchedPropertyIds.length > 0 ? `${r.matchedPropertyIds.length} matched` : r.status === "Open" ? "Waiting" : "—"}　→</span>
        </button>)}
        {list.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>Nothing matches this filter.</div>}</div>
    </section>
  </div>;
}

function RequirementDetailModal({ role, req, properties, onClose, onEdit, onPublish, onWithdraw, onSubmitProperty, onOpenProperty }: any) {
  const matched = properties.filter((p: PropertyRecord) => req.matchedPropertyIds.includes(p.id));
  return <Modal title={`${req.id} · Requirement`} onClose={onClose} wide>
    <div className="requirement-detail">
      <Status tone={reqTone(req.status)}>{req.status}</Status>
      <h2>{req.title || "Untitled draft"}</h2>
      <p>{role === "partner" ? "A care provider is looking for a long term let matching this brief." : req.status === "Open" ? `Live since ${req.postedOn}, shared with every property partner covering ${req.area}.` : "Saved as draft."}</p>
      <div className="detail-grid">
        <div><small>Location</small><strong>{req.area || "—"}</strong></div>
        <div><small>Monthly rent</small><strong>{req.budget || "—"}</strong></div>
        <div><small>Needed by</small><strong>{req.neededBy || "—"}</strong></div>
        <div><small>Lease length</small><strong>{req.leaseMin ? `${req.leaseMin}${req.leaseMax ? ` to ${req.leaseMax}` : " minimum"}` : "—"}</strong></div>
        <div><small>Property type</small><strong>{req.propertyType}</strong></div>
        <div><small>Bedrooms</small><strong>{req.bedrooms || "—"}</strong></div>
        <div><small>Bathrooms</small><strong>{req.bathrooms || "—"}</strong></div>
        <div><small>Occupancy</small><strong>{req.capacity || "—"}</strong></div>
        <div><small>Service</small><strong>{req.serviceType}</strong></div>
        <div><small>Who it is for</small><strong>{req.residentGroup || "—"}</strong></div>
      </div>
      {req.accessibility?.length > 0 && <><h3 style={{ fontSize: 13, margin: "18px 0 8px" }}>Accessibility</h3><div className="tag-row">{req.accessibility.map((a: string) => <span key={a}>{a}</span>)}</div></>}
      {req.features?.length > 0 && <><h3 style={{ fontSize: 13, margin: "18px 0 8px" }}>Features</h3><div className="tag-row">{req.features.map((a: string) => <span key={a}>{a}</span>)}</div></>}
      {req.notes && <><h3 style={{ fontSize: 13, margin: "18px 0 8px" }}>Notes</h3><p style={{ fontSize: 12 }}>{req.notes}</p></>}
    </div>

    <div className="modal-section" style={{ borderTop: "1px solid var(--line)" }}>
      <h3>Documents collected for every property</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", marginTop: 10 }}>
        {STANDARD_DOCS.map(d => <div key={d} style={{ fontSize: 11, padding: "5px 0", display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "var(--purple)", fontWeight: 700 }}>✓</span>{d}</div>)}
        {req.extraDocs?.map((d: string) => <div key={d} style={{ fontSize: 11, padding: "5px 0", display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "var(--purple)", fontWeight: 700 }}>＋</span><strong>{d}</strong></div>)}
      </div>
      {role === "provider" && req.extraDocs?.length > 0 && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>Items marked ＋ are your additions.</p>}
      {role === "partner" && req.extraDocs?.length > 0 && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>Items marked ＋ are extra to the standard set and are required on this brief.</p>}
    </div>

    {role !== "partner" && <div className="modal-section" style={{ borderTop: "1px solid var(--line)" }}>
      <h3>Matched properties {matched.length > 0 && `(${matched.length})`}</h3>
      {matched.length > 1 && role === "provider" && <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>Multiple properties have been matched to this brief. Review each one and request a viewing for any that look right, or pass on the ones that do not.</p>}
      {matched.length === 0
        ? <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>{req.status === "Open" ? "Nothing matched yet. BrightBridge checks every submission against this brief and you will be emailed the moment one lands." : "This requirement is not live yet."}</p>
        : matched.map((p: PropertyRecord) => <div className="property-row" key={p.id} style={{ paddingLeft: 0, paddingRight: 0 }} onClick={() => onOpenProperty(p)}>
            <div className="building-thumb" style={{ overflow: "hidden" }}>{p.images?.[0] ? <img src={p.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}/> : <span>⌂</span>}</div>
            <div className="row-main"><strong>{p.name}</strong><span>{p.area} · {p.bedrooms} beds · {p.rent}</span></div>
            <Status tone={propTone(p.status)}>{p.status}</Status>
            <button className="mini-action" onClick={e => { e.stopPropagation(); onOpenProperty(p); }}>Open</button>
          </div>)}
    </div>}

    <div className="form-actions">
      {role === "provider" && req.status !== "Withdrawn" && <button className="secondary" onClick={onEdit}>Edit</button>}
      {role === "provider" && req.status === "Open" && <button className="secondary" style={{ color: "#c23b3b" }} onClick={onWithdraw}>Withdraw</button>}
      {role === "provider" && req.status === "Draft" && <button className="primary" onClick={onPublish}>Submit requirement</button>}
      {role === "partner" && req.status === "Open" && (() => {
        const mine = properties.filter((p: PropertyRecord) => p.matchedReq === req.id && p.status !== "Withdrawn");
        return <div>
          {mine.length > 0 && <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Your submissions against this requirement ({mine.length})</p>
            {mine.map((p: PropertyRecord) => <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⌂</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 10, color: "var(--muted)" }}>{p.id} · {p.area} · {p.rent}</div></div>
              <Status tone={propTone(p.status)}>{p.status}</Status>
            </div>)}
          </div>}
          <button className="primary" onClick={onSubmitProperty}>{mine.length > 0 ? "Submit another property" : "Submit a property"}</button>
        </div>;
      })()}
    </div>
  </Modal>;
}

/* ---------------------------------------------------------------------------
   Properties
--------------------------------------------------------------------------- */

function Properties({ role, items, requirements, openProperty, add }: any) {
  const [propFilter, setPropFilter] = useState<"all" | "action" | "accepted" | "declined">("all");
  const visible = role === "provider"
    ? items.filter((p: PropertyRecord) => ["Matched", "Viewing requested", "Viewing confirmed"].includes(p.status))
    : items.filter((p: PropertyRecord) => p.status !== "Withdrawn");
  const filtered = role === "partner"
    ? propFilter === "action" ? visible.filter((p: PropertyRecord) => ["Submitted", "Being obtained"].includes(p.status) || p.documents.some((d: DocItem) => d.state === "Being obtained"))
      : propFilter === "accepted" ? visible.filter((p: PropertyRecord) => ["Accepted", "Matched", "Viewing requested", "Viewing confirmed"].includes(p.status))
      : propFilter === "declined" ? visible.filter((p: PropertyRecord) => p.status === "Declined")
      : visible
    : visible;
  const reqTitle = (id: string | null) => requirements.find((r: RequirementRecord) => r.id === id)?.title;
  const needsAction = visible.filter((p: PropertyRecord) => p.status === "Submitted" || p.documents.some((d: DocItem) => d.state === "Being obtained")).length;

  return <div className="page-content">
    <div className="page-toolbar"><p>{role === "bbc" ? "Review, accept and match every submitted property." : role === "provider" ? "Properties BrightBridge has matched to your requirements." : "Your submissions and their status."}</p>{role === "partner" && <button className="primary" onClick={add}>＋ Submit property</button>}</div>
    {role === "partner" && <section className="panel" style={{ marginBottom: 0, borderBottom: "none", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}><div className="filterbar">
      <button className={propFilter === "all" ? "selected" : ""} onClick={() => setPropFilter("all")}>All <b>{visible.length}</b></button>
      <button className={propFilter === "action" ? "selected" : ""} onClick={() => setPropFilter("action")}>Needs action <b>{needsAction}</b></button>
      <button className={propFilter === "accepted" ? "selected" : ""} onClick={() => setPropFilter("accepted")}>Accepted <b>{visible.filter((p: PropertyRecord) => ["Accepted", "Matched", "Viewing requested", "Viewing confirmed"].includes(p.status)).length}</b></button>
      <button className={propFilter === "declined" ? "selected" : ""} onClick={() => setPropFilter("declined")}>Declined <b>{visible.filter((p: PropertyRecord) => p.status === "Declined").length}</b></button>
    </div></section>}
    <div className="property-cards">{filtered.map((p: PropertyRecord) => <article key={p.id} onClick={() => openProperty(p)}>
      <div className="property-image">{p.images?.[0] ? <img src={p.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/> : <div>⌂</div>}<span>{docSummary(p.documents)}</span></div>
      <div className="card-content">
        <div><Status tone={propTone(p.status)}>{p.status}</Status><small>{p.id}</small></div>
        <h3>{p.name || "Untitled draft"}</h3>
        <p>{p.area}</p>
        {p.matchedReq && <p style={{ marginTop: 6, color: "var(--purple)", fontWeight: 700 }}>{role === "provider" ? "For" : "Matched to"} {p.matchedReq}{reqTitle(p.matchedReq) ? ` · ${reqTitle(p.matchedReq)}` : ""}</p>}
        <div className="property-meta"><span><b>{p.bedrooms}</b> beds</span><span><b>{p.bathrooms}</b> baths</span><span><b>{p.rent}</b></span>{p.leaseOffer && <span>{p.leaseOffer}</span>}</div>
        <button className="secondary">View property →</button>
      </div></article>)}
      {filtered.length === 0 && <div style={{ padding: 24, color: "var(--muted)", fontSize: 12 }}>{propFilter === "all" ? "Nothing here yet. Submit a property to get started." : "Nothing in this filter."}</div>}</div>
  </div>;
}

function DecidePropertyPanel({ propId, onDecide }: { propId: string; onDecide: (id: string, decision: "Accepted" | "Declined", reason?: string) => void }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const REASONS = ["Property does not meet minimum safety standards", "Location not in demand from current providers", "Rent significantly above market for the area", "Insufficient information to assess", "Property needs substantial refurbishment"];
  if (!declining) return <div className="form-actions"><button className="secondary" onClick={() => setDeclining(true)}>Decline</button><button className="primary" onClick={() => onDecide(propId, "Accepted")}>Accept property</button></div>;
  return <div className="modal-section">
    <h3>Why is this being declined?</h3>
    <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>The partner sees this word for word.</p>
    <Chips options={REASONS} selected={reason ? [reason] : []} onToggle={v => setReason(reason === v ? "" : v)}/>
    <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Or write a specific reason" style={{ width: "100%", marginTop: 10, minHeight: 60, border: "1px solid var(--line)", borderRadius: 9, padding: 12, fontSize: 12, fontFamily: "inherit" }}/>
    <div className="form-actions"><button className="secondary" onClick={() => setDeclining(false)}>Cancel</button><button className="secondary" style={{ color: "#c23b3b" }} disabled={!reason.trim()} onClick={() => onDecide(propId, "Declined", reason.trim())}>Decline with this reason</button></div>
  </div>;
}

function PropertyModal({ role, prop, requirements, onClose, onDecide, onMatch, onRequestDocs, onAskPartner, onMarkOnFile, onRelease, onRequestViewing, onPassOn, onEdit, onWithdraw }: any) {
  const partnerActions = role === "partner" && !["Withdrawn", "Declined"].includes(prop.status) ? [{ icon: "✎", label: "Edit", onClick: onEdit }, { icon: "⊘", label: "Withdraw, no longer available", onClick: onWithdraw, danger: true }] : [];

  return <Modal title={`${prop.id} · Property`} onClose={onClose} actions={partnerActions} wide>
    {role === "partner" && prop.status === "Declined" && <div style={{ margin: "16px 24px 0", padding: "14px 16px", borderRadius: 10, background: "#fdeceb", fontSize: 12, lineHeight: 1.6 }}><strong style={{ display: "block", marginBottom: 4 }}>BrightBridge declined this property</strong>{prop.declineReason || "No reason given."}<div style={{ marginTop: 10 }}><button className="secondary" style={{ fontSize: 11 }} onClick={onEdit}>Edit and re-submit</button></div></div>}
    <div className="property-hero"><div><Status tone={propTone(prop.status)}>{prop.status}</Status><h2>{prop.name || "Untitled draft"}</h2><p>{prop.area} · {prop.bedrooms} bedrooms · {prop.bathrooms} bathrooms · {prop.condition} · {prop.rent}{prop.leaseOffer ? ` · ${prop.leaseOffer}` : ""}</p>{prop.matchedReq && role === "partner" && (() => { const mr = requirements.find((r: RequirementRecord) => r.id === prop.matchedReq); return mr ? <p style={{ fontSize: 12, marginTop: 4, color: "var(--purple)" }}>Matched to {mr.id}: {mr.title} · {mr.area} · {mr.bedrooms} beds · {mr.budget}</p> : <p style={{ fontSize: 12, marginTop: 4 }}>Matched to {prop.matchedReq}</p>; })()}
    {prop.matchedReq && role !== "partner" && <p style={{ fontSize: 12, marginTop: 4 }}>Matched to {prop.matchedReq}</p>}</div><div className="property-art" style={{ overflow: "hidden" }}>{prop.images?.[0] ? <img src={prop.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}/> : <span style={{ fontSize: 48 }}>⌂</span>}</div></div>

    {role === "partner" && <div style={{ padding: "0 24px" }}><div style={{ padding: "12px 16px", borderRadius: 10, fontSize: 12, lineHeight: 1.6, background: prop.status === "Submitted" ? "var(--purple-soft)" : prop.status === "Accepted" ? "#e8f5e9" : prop.status === "Matched" ? "#e8f5e9" : prop.status === "Viewing requested" ? "var(--amber-bg)" : prop.status === "Viewing confirmed" ? "#e8f5e9" : "transparent", color: "var(--ink)", marginBottom: 4 }}>
      {prop.status === "Submitted" && "BrightBridge is reviewing this property. You will hear back within two working days."}
      {prop.status === "Accepted" && "Property accepted. BrightBridge is looking for the right care provider match."}
      {prop.status === "Matched" && "A care provider is reviewing this property against their requirement."}
      {prop.status === "Viewing requested" && "The care provider wants to view this property. BrightBridge will share the dates with you."}
      {prop.status === "Viewing confirmed" && "Viewing is booked. Check the Viewings tab for the confirmed date."}
    </div></div>}

    <div className="modal-section"><h3>Photos</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {(prop.images?.length > 0 ? prop.images : [null, null, null, null, null, null]).map((src: string | null, i: number) => (
          <div key={i} style={{ aspectRatio: "4/3", background: "linear-gradient(135deg, var(--surface), #e9e7ec)", borderRadius: 8, overflow: "hidden", position: "relative" }}>
            {src ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 20, color: "var(--muted)" }}>⌂</div>}
          </div>
        ))}
      </div>
    </div>

    <div className="modal-section"><h3>Availability</h3>
      <div className="detail-grid" style={{ padding: "14px 0", gridTemplateColumns: "repeat(3,1fr)" }}>
        <div><small>Available from</small><strong>{prop.availableFrom || "—"}</strong></div>
        <div><small>Property type</small><strong>{prop.propertyType}</strong></div>
        <div><small>Condition</small><strong>{prop.condition}</strong></div>
        <div><small>Lease offered</small><strong>{prop.leaseOffer || "—"}</strong></div>
      </div>
    </div>

    {prop.description && <div className="modal-section"><h3>About this property</h3><p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>{prop.description}</p></div>}

    {role === "provider" ? <>
      <div className="modal-section">
        <h3>Documents</h3>
        {(() => { const released = prop.documents.filter((d: DocItem) => d.state === "Released"); const pending = prop.documents.filter((d: DocItem) => d.state !== "Released"); return <>
          {released.length > 0 && <><p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>{released.length} document{released.length > 1 ? "s" : ""} available</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", marginBottom: 14 }}>{released.map((d: DocItem) => <div key={d.id} style={{ fontSize: 12, padding: "6px 0", display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span>{d.label}<button className="secondary" style={{ fontSize: 9, padding: "3px 8px", marginLeft: "auto" }}>Open</button></div>)}</div></>}
          {pending.length > 0 && <><p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>{pending.length} document{pending.length > 1 ? "s" : ""} pending{prop.status !== "Viewing confirmed" ? ", released once your viewing is confirmed" : ""}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>{pending.map((d: DocItem) => <div key={d.id} style={{ fontSize: 12, padding: "6px 0", display: "flex", alignItems: "center", gap: 6, color: "var(--muted)" }}><span>○</span>{d.label}</div>)}</div></>}
        </>; })()}
        <button className="secondary" style={{ marginTop: 14 }} onClick={onRequestDocs}>Ask for more documents</button>
      </div>

      {prop.status === "Matched" && <div className="form-actions"><button className="secondary" style={{ color: "#c23b3b" }} onClick={onPassOn}>Not suitable</button><button className="primary" onClick={onRequestViewing}>Request a viewing</button></div>}
      {prop.status === "Viewing requested" && <div className="modal-section" style={{ padding: "12px 24px" }}><p style={{ fontSize: 12, color: "var(--muted)" }}>Viewing requested. BrightBridge is arranging a date with the property source and will confirm with you by email.</p></div>}
      {prop.status === "Viewing confirmed" && <div className="modal-section" style={{ padding: "12px 24px" }}><p style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>Viewing confirmed. Check the Viewings tab for the date.</p></div>}
    </> : <>
      <div className="modal-section">
        <h3>Documents</h3>
        {prop.documents.map((d: DocItem) => (
          <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>{d.label}</span>
              {d.askedForBy === "provider" && <span style={{ color: "var(--purple)", fontSize: 10, marginLeft: 6, fontWeight: 700 }}>asked for by the care provider</span>}
              {d.askedForBy === "requirement" && <span style={{ color: "var(--purple)", fontSize: 10, marginLeft: 6 }}>required by {prop.matchedReq}</span>}
              {REQUIRED_DOCS.includes(d.label) && !["On file", "Released"].includes(d.state) && <span style={{ color: "#c23b3b", fontSize: 10, marginLeft: 6, fontWeight: 700 }}>required</span>}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Status tone={docTone(d.state)}>{d.state}</Status>
              {role === "bbc" && d.state === "Requested" && <button className="mini-action" onClick={() => onAskPartner(prop.id, d.id)}>Ask the property source</button>}
              {role === "partner" && d.state === "Being obtained" && <button className="primary" style={{ fontSize: 10, padding: "7px 10px" }} onClick={() => onMarkOnFile(prop.id, d.id)}>↑ Upload</button>}
              {role === "bbc" && d.state === "Being obtained" && <button className="secondary" style={{ fontSize: 10, padding: "6px 10px" }} onClick={() => onMarkOnFile(prop.id, d.id)}>Mark received</button>}
              {role === "bbc" && d.state === "On file" && <button className="mini-action" onClick={() => onRelease(prop.id, d.id)}>Release</button>}
            </div>
          </div>
        ))}
      </div>

      {prop.passedOn.length > 0 && role === "bbc" && <div className="modal-section"><h3>Passed on</h3>{prop.passedOn.map((x: any, i: number) => <p key={i} style={{ fontSize: 11, color: "var(--muted)" }}>{x.reqId}: {x.reason}</p>)}</div>}

      {role === "bbc" && prop.status === "Submitted" && <DecidePropertyPanel propId={prop.id} onDecide={onDecide}/>}
      {role === "bbc" && prop.status === "Accepted" && <div className="modal-section"><h3>Match to a requirement</h3>
        {prop.matchedReq && <p style={{ fontSize: 11, color: "var(--purple)", marginBottom: 8 }}>This property was submitted against {prop.matchedReq}.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{requirements.filter((r: RequirementRecord) => r.status === "Open").map((r: RequirementRecord) => (<button key={r.id} className="secondary" style={{ textAlign: "left", fontWeight: r.id === prop.matchedReq ? 700 : 400, borderColor: r.id === prop.matchedReq ? "var(--purple)" : undefined }} onClick={() => onMatch(prop.id, r.id)}>{r.id} · {r.title} · {r.area} · {r.bedrooms} beds · {r.budget}{r.matchedPropertyIds.length > 0 ? ` · ${r.matchedPropertyIds.length} already matched` : ""}</button>))}{requirements.filter((r: RequirementRecord) => r.status === "Open").length === 0 && <p style={{ fontSize: 11, color: "var(--muted)" }}>No live requirements to match against.</p>}</div></div>}
    </>}
  </Modal>;
}

/* ---------------------------------------------------------------------------
   Viewings
--------------------------------------------------------------------------- */

function Viewings({ role, viewings, shareWithPartner, partnerPickDate, confirmViewing, onDeclineDates, onNewDates, setView }: any) {
  const visible = role === "partner" ? viewings.filter((v: ViewingRecord) => v.status !== "Requested") : viewings;
  if (visible.length === 0) return <div className="page-content"><div className="page-toolbar"><p>{role === "provider" ? "No viewings yet. Open a matched property to request one." : role === "partner" ? "No viewing requests yet. When a care provider wants to see one of your properties, BrightBridge shares the dates with you here." : "No viewings to coordinate."}</p></div></div>;

  return <div className="page-content">
    <div className="page-toolbar"><p>{role === "bbc" ? "Coordinate every viewing between the care provider and the property source." : role === "partner" ? "Viewing requests BrightBridge has shared with you." : "Your viewing requests, from first ask to a confirmed date."}</p></div>
    {visible.map((v: ViewingRecord) => (
      <div className="panel" key={v.id} style={{ marginBottom: 14, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div><strong style={{ fontSize: 13 }}>{v.propertyName}</strong><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{v.id} · {v.reqId || "—"}</div></div>
          <Status tone={v.status === "Confirmed" ? "green" : v.status === "Reschedule needed" ? "red" : v.status === "Awaiting BrightBridge confirmation" ? "amber" : "purple"}>{v.status}</Status>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Dates offered: <strong style={{ color: "var(--ink)" }}>{v.candidateDates.join(" · ")}</strong></div>
        {v.partnerSelectedDate && <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Property source can do: <strong style={{ color: "var(--ink)" }}>{v.partnerSelectedDate}</strong></div>}
        {v.declineNote && role !== "provider" && <div style={{ fontSize: 12, color: "#c23b3b", marginBottom: 10 }}>{v.declineNote}</div>}
        {v.confirmedDate && <div style={{ fontSize: 12, color: "var(--green)", marginBottom: 10, fontWeight: 700 }}>Confirmed for {v.confirmedDate}</div>}

        {role === "bbc" && v.status === "Requested" && <button className="primary" style={{ fontSize: 11 }} onClick={() => shareWithPartner(v.id)}>Share with property source</button>}
        {role === "bbc" && v.status === "Awaiting BrightBridge confirmation" && <button className="primary" style={{ fontSize: 11 }} onClick={() => confirmViewing(v.id)}>Confirm and notify everyone</button>}
        {role === "bbc" && v.status === "Reschedule needed" && <p style={{ fontSize: 11, color: "var(--muted)" }}>Waiting on the care provider to offer new dates.</p>}

        {role === "partner" && v.status === "Shared with property source" && <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {v.candidateDates.map((d: string) => <button key={d} className="secondary" style={{ fontSize: 11 }} onClick={() => partnerPickDate(v.id, d)}>Available {d}</button>)}
          <button className="secondary" style={{ fontSize: 11, color: "#c23b3b" }} onClick={() => onDeclineDates(v)}>None of these work</button>
        </div>}

        {role === "provider" && v.status === "Reschedule needed" && <div style={{ display: "flex", gap: 8 }}><button className="primary" style={{ fontSize: 11 }} onClick={() => onNewDates(v)}>Offer new dates</button><button className="secondary" style={{ fontSize: 11 }} onClick={() => setView("messages")}>Message BrightBridge</button></div>}
        {role === "provider" && v.status === "Confirmed" && <p style={{ fontSize: 11, color: "var(--muted)" }}>Everyone has been emailed. Documents on file for this property have been released to you.</p>}
        {role === "partner" && v.status === "Confirmed" && <p style={{ fontSize: 11, color: "var(--muted)" }}>Viewing confirmed. BrightBridge will be in touch about next steps after the visit.</p>}
      </div>
    ))}
  </div>;
}

function Messages({ role, myName, properties, requirements }: any) {
  /* Threads are per-property once matched. All three parties (BBC, provider, partner) 
     share one thread but names are anonymised: providers see "Property source", 
     partners see "Care provider", BBC sees real names. */
  type MsgThread = { propertyId: string; propertyName: string; reqId: string; preview: string; time: string; messages: { from: "bbc" | "provider" | "partner"; text: string; time: string }[] };

  const threads: MsgThread[] = [
    { propertyId: "PROP-231", propertyName: "Detached home, Penn", reqId: "REQ-1048", preview: role === "provider" ? "Certificate on its way…" : role === "partner" ? "Upload the fire alarm cert…" : "Waiting on the cert…", time: "09:42",
      messages: [
        { from: "bbc", text: "This property has been matched to REQ-1048. I will be coordinating between you both from here.", time: "Mon 14:20" },
        { from: "provider", text: "Great, can you check if they have the fire alarm installation certificate? We need it before the viewing.", time: "Mon 15:02" },
        { from: "bbc", text: "Will do, passing that on now.", time: "Mon 15:10" },
        { from: "partner", text: "I will get the fire alarm cert from the installer, should have it by end of week.", time: "Tue 09:18" },
        { from: "bbc", text: "Thanks, I will let them know.", time: "Tue 09:42" },
      ] },
    { propertyId: "PROP-229", propertyName: "Corner house, Hanley", reqId: "", preview: "Under review…", time: "Yesterday",
      messages: [
        { from: "bbc", text: "We have received your submission for this property. Currently reviewing it against our live requirements.", time: "Thu 11:30" },
        { from: "partner", text: "Thanks, let me know if you need anything else.", time: "Thu 11:45" },
      ] },
  ];

  const visibleThreads = role === "provider"
    ? threads.filter(t => t.messages.some(m => m.from === "provider" || m.from === "bbc"))
    : role === "partner"
    ? threads.filter(t => t.messages.some(m => m.from === "partner" || m.from === "bbc"))
    : threads;

  const [active, setActive] = useState(0);
  const thread = visibleThreads[active] || visibleThreads[0];

  function senderName(from: "bbc" | "provider" | "partner") {
    if (from === "bbc") return "BrightBridge";
    if (role === "bbc") return from === "provider" ? "Willow Care Group" : "Kush Properties";
    if (role === "provider") return from === "provider" ? "You" : from === "partner" ? "Property source" : "BrightBridge";
    return from === "partner" ? "You" : from === "provider" ? "Care provider" : "BrightBridge";
  }

  function senderInitials(from: "bbc" | "provider" | "partner") {
    if (from === "bbc") return "BB";
    if (role === "bbc") return from === "provider" ? "WC" : "KP";
    return from === role ? "You" : from === "provider" ? "CP" : "PS";
  }

  return <div className="page-content message-layout">
    <section className="conversation-list">
      <div className="message-search">⌕ Search conversations</div>
      {visibleThreads.map((t, i) => <button className={active === i ? "active" : ""} onClick={() => setActive(i)} key={t.propertyId}>
        <span>⌂</span>
        <div><strong>{t.propertyName}</strong><p>{t.preview}</p></div>
        <small>{t.time}</small>
      </button>)}
      {visibleThreads.length === 0 && <div style={{ padding: 20, fontSize: 11, color: "var(--muted)" }}>No conversations yet. A thread is created when a property is matched to a requirement.</div>}
    </section>
    {thread ? <section className="chat">
      <header>
        <div className="avatar">⌂</div>
        <div>
          <strong>{thread.propertyName}</strong>
          <p>{thread.reqId ? `${thread.reqId} · ` : ""}
            {role === "bbc" ? "Willow Care Group + Kush Properties" : role === "provider" ? "You, BrightBridge, Property source" : "You, BrightBridge, Care provider"}
          </p>
        </div>
      </header>
      <div className="chat-body">
        <span className="date-label">This week</span>
        {thread.messages.map((m, i) => {
          const isMe = m.from === role;
          return <div key={i} className={`bubble ${isMe ? "outgoing" : "incoming"}`}>
            {!isMe && <div style={{ fontSize: 10, fontWeight: 700, color: m.from === "bbc" ? "var(--purple)" : "var(--muted)", marginBottom: 3 }}>{senderName(m.from)}</div>}
            {m.text}
            <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 4, textAlign: isMe ? "right" : "left" }}>{m.time}</div>
          </div>;
        })}
      </div>
      <form className="composer" onSubmit={e => e.preventDefault()}>
        <button>＋</button>
        <input placeholder="Write a message"/>
        <button className="send">↑</button>
      </form>
    </section> : <section className="chat" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 12 }}>Select a conversation</section>}
  </div>;
}

function Settings({ role }: any) {
  if (role === "bbc") return <div className="page-content settings"><section className="panel"><h2>Workspace</h2><p>Internal BrightBridge settings.</p><div className="form"><div className="field"><label>Organisation</label><input defaultValue="Bright Bridge Connect Ltd"/></div><div className="field"><label>Contact email</label><input defaultValue="hello@brightbridgeconnect.co.uk"/></div><div className="form-actions"><button className="primary">Save changes</button></div></div></section></div>;

  return <div className="page-content settings">
    <section className="panel">
      <h2>Your account</h2><p>Update your contact details and preferences.</p>
      <div className="form">
        <div className="field"><label>Organisation</label><input defaultValue={role === "provider" ? "Willow Care Group" : "Kush Properties Ltd"}/></div>
        <div className="field"><label>Contact name</label><input defaultValue={role === "provider" ? "Amara Nwosu" : "Kush Singh"}/></div>
        <div className="field"><label>Email</label><input defaultValue={role === "provider" ? "amara@willowcare.co.uk" : "kush@openblock.co.uk"}/></div>
        <div className="field"><label>Phone</label><input defaultValue="07700 900412"/></div>
        <div className="form-actions"><button className="primary">Save changes</button></div>
      </div>
    </section>
    {role === "partner" && <section className="panel" style={{ marginTop: 16, padding: 24 }}>
      <h2>Coverage and property types</h2>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Requirements are only sent to you for the areas and property types you cover. Update these if your reach has changed.</p>
      <h3 style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Coverage areas</h3>
      <div className="tag-row">{["West Midlands", "Greater Manchester"].map(t => <span key={t}>{t}</span>)}</div>
      <h3 style={{ fontSize: 12, fontWeight: 700, margin: "16px 0 8px" }}>Property types</h3>
      <div className="tag-row">{["HMO (up to 6 bed)", "Larger format (7+ bed)"].map(t => <span key={t}>{t}</span>)}</div>
      <button className="secondary" style={{ marginTop: 16 }}>Edit coverage</button>
    </section>}
    {role === "provider" && <section className="panel" style={{ marginTop: 16, padding: 24 }}>
      <h2>Services and coverage</h2>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>What you deliver and where you need property.</p>
      <div className="tag-row">{["Supported living", "West Midlands", "Staffordshire"].map(t => <span key={t}>{t}</span>)}</div>
      <button className="secondary" style={{ marginTop: 16 }}>Edit services and coverage</button>
    </section>}
  </div>;
}

/* ---------------------------------------------------------------------------
   Forms
--------------------------------------------------------------------------- */

const ACCESSIBILITY_OPTIONS = ["Ground floor bedroom", "Wheelchair accessible", "Wet room", "Step free access", "Wider doorways", "Ceiling track hoist"];
const FEATURE_OPTIONS = ["Outdoor space", "Off street parking", "Garage", "Separate staff or sleep in room", "Close to public transport", "Two reception rooms"];
const LEASE_TERMS = ["3 years", "5 years", "7 years", "10 years", "15 years"];

function Chips({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
    {options.map(o => <span key={o} onClick={() => onToggle(o)} style={{ padding: "7px 13px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: `1px solid ${selected.includes(o) ? "var(--purple)" : "var(--line)"}`, background: selected.includes(o) ? "var(--purple-soft)" : "transparent", color: selected.includes(o) ? "var(--purple)" : "var(--muted)" }}>{o}</span>)}
  </div>;
}

function RequirementForm({ initial, onCancel, onSubmit }: { initial: RequirementRecord | null; onCancel: () => void; onSubmit: (f: any, asDraft: boolean) => void }) {
  const [f, setF] = useState({
    title: initial?.title || "", area: initial?.area || "", serviceType: initial?.serviceType || "Supported living",
    residentGroup: initial?.residentGroup || "Adults (18+)", propertyType: initial?.propertyType || "Family home (2 to 3 bed)",
    bedrooms: initial ? String(initial.bedrooms) : "", bathrooms: initial ? String(initial.bathrooms) : "", capacity: initial?.capacity || "",
    budget: initial?.budget || "", leaseMin: initial?.leaseMin || "5 years", leaseMax: initial?.leaseMax || "", neededBy: initial?.neededBy || "",
    accessibility: initial?.accessibility || [], features: initial?.features || [], extraDocs: initial?.extraDocs || [], notes: initial?.notes || "",
  });
  const [otherDoc, setOtherDoc] = useState("");
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));
  const toggle = (k: "accessibility" | "features" | "extraDocs", v: string) => setF(p => ({ ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v] }));
  const addOther = () => { const v = otherDoc.trim(); if (v && !f.extraDocs.includes(v)) { set("extraDocs", [...f.extraDocs, v]); setOtherDoc(""); } };

  return <form onSubmit={e => { e.preventDefault(); onSubmit(f, false); }} className="form">
    <div className="field full"><label>What do you need?</label><input required value={f.title} onChange={e => set("title", e.target.value)} placeholder="e.g. 6 bed supported living home"/></div>
    <div className="field"><label>Location</label><input required value={f.area} onChange={e => set("area", e.target.value)} placeholder="Town, borough or postcode"/></div>
    <div className="field"><label>Service</label><select value={f.serviceType} onChange={e => set("serviceType", e.target.value)}><option>Supported living</option><option>Children&apos;s home</option><option>Residential care</option><option>Semi independent (16 to 25)</option><option>Temporary and emergency accommodation</option></select></div>
    <div className="field"><label>Who is it for?</label><select value={f.residentGroup} onChange={e => set("residentGroup", e.target.value)}><option>Adults (18+)</option><option>Young people (16 to 25)</option><option>Children (under 16)</option><option>Mixed</option></select></div>
    <div className="field"><label>Occupancy</label><input value={f.capacity} onChange={e => set("capacity", e.target.value)} placeholder="e.g. 5 to 6 residents"/></div>
    <div className="field"><label>Property type</label><select value={f.propertyType} onChange={e => set("propertyType", e.target.value)}><option>Family home (2 to 3 bed)</option><option>HMO (up to 6 bed)</option><option>Larger format (7+ bed)</option><option>Bungalow</option><option>Self contained flats</option></select></div>
    <div className="field"><label>Bedrooms</label><input type="number" min="1" required value={f.bedrooms} onChange={e => set("bedrooms", e.target.value)} placeholder="e.g. 6"/></div>
    <div className="field"><label>Bathrooms</label><input type="number" min="1" value={f.bathrooms} onChange={e => set("bathrooms", e.target.value)} placeholder="e.g. 3"/></div>
    <div className="field"><label>Monthly rent</label><input required value={f.budget} onChange={e => set("budget", e.target.value)} placeholder="£3,500 pcm"/></div>
    <div className="field"><label>Minimum lease length</label><select value={f.leaseMin} onChange={e => set("leaseMin", e.target.value)}>{LEASE_TERMS.map(t => <option key={t}>{t}</option>)}</select></div>
    <div className="field"><label>Maximum lease length</label><select value={f.leaseMax} onChange={e => set("leaseMax", e.target.value)}><option value="">No maximum</option>{LEASE_TERMS.map(t => <option key={t}>{t}</option>)}</select></div>
    <div className="field"><label>Needed by</label><input type="date" onChange={e => set("neededBy", new Date(e.target.value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))}/></div>

    <div className="field full"><label>Accessibility</label><Chips options={ACCESSIBILITY_OPTIONS} selected={f.accessibility} onToggle={v => toggle("accessibility", v)}/></div>
    <div className="field full"><label>Features</label><Chips options={FEATURE_OPTIONS} selected={f.features} onToggle={v => toggle("features", v)}/></div>

    <div className="field full">
      <label>Documentation</label>
      <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 8px", lineHeight: 1.6 }}>BrightBridge collects these for every property as standard.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", margin: "8px 0 16px" }}>{STANDARD_DOCS.map(d => <div key={d} style={{ fontSize: 11, color: "var(--ink)", padding: "6px 0", display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "var(--purple)", fontWeight: 700 }}>✓</span>{d}</div>)}</div>
      <label style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: "block" }}>Anything else you need beyond the standard set?</label>
      <Chips options={COMMON_EXTRA_DOCS} selected={f.extraDocs} onToggle={v => toggle("extraDocs", v)}/>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input value={otherDoc} onChange={e => setOtherDoc(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOther(); } }} placeholder="Something else you need" style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px" }}/>
        <button type="button" className="secondary" onClick={addOther}>Add</button>
      </div>
      {f.extraDocs.filter(d => !COMMON_EXTRA_DOCS.includes(d)).length > 0 && <div className="tag-row" style={{ marginTop: 10 }}>{f.extraDocs.filter(d => !COMMON_EXTRA_DOCS.includes(d)).map(d => <span key={d} onClick={() => toggle("extraDocs", d)} style={{ cursor: "pointer" }}>{d} ×</span>)}</div>}
    </div>

    <div className="field full"><label>Notes</label><textarea value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Any other context that would help find the right property"/></div>
    <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="button" className="secondary" onClick={() => onSubmit(f, true)}>Save as draft</button><button className="primary">{initial ? "Save and submit" : "Submit requirement"}</button></div>
  </form>;
}

function DocRequestForm({ existing, onCancel, onSubmit }: { existing: DocItem[]; onCancel: () => void; onSubmit: (labels: string[]) => void }) {
  const onList = existing.map(d => d.label);
  const available = COMMON_EXTRA_DOCS.filter(d => !onList.includes(d));
  const [picked, setPicked] = useState<string[]>([]);
  const [other, setOther] = useState("");
  const toggle = (v: string) => setPicked(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const all = [...picked, ...(other.trim() ? [other.trim()] : [])];

  return <div style={{ padding: "22px 24px" }}>
    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Already on the list for this property:</p>
    <div className="tag-row" style={{ marginBottom: 18 }}>{onList.map(l => <span key={l}>{l}</span>)}</div>
    {available.length > 0 && <><label style={{ fontSize: 10, fontWeight: 700 }}>Commonly asked for</label><Chips options={available} selected={picked} onToggle={toggle}/></>}
    <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginTop: 18 }}>Something else</label>
    <input value={other} onChange={e => setOther(e.target.value)} placeholder="e.g. Planning permission history" style={{ width: "100%", marginTop: 6, border: "1px solid var(--line)", borderRadius: 9, padding: "11px 12px", fontSize: 12 }}/>
    <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 14 }}>BrightBridge collects these from the property source and releases them to you.</p>
    <div className="form-actions" style={{ margin: "16px -24px -22px", padding: "16px 24px 0" }}><button className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={all.length === 0} onClick={() => onSubmit(all)}>Send request</button></div>
  </div>;
}

function PassOnForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (reason: string) => void }) {
  const REASONS = ["Too small", "Wrong location", "Rent too high", "Condition not suitable", "Layout will not work for the service", "No longer needed"];
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  return <div style={{ padding: "22px 24px" }}>
    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>This tells BrightBridge what to rule out next time. The property source is not told who passed on it.</p>
    <Chips options={REASONS} selected={reason ? [reason] : []} onToggle={v => setReason(reason === v ? "" : v)}/>
    <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Anything more we should know (optional)" style={{ width: "100%", marginTop: 14, minHeight: 70, border: "1px solid var(--line)", borderRadius: 9, padding: 12, fontSize: 12, fontFamily: "inherit" }}/>
    <div className="form-actions" style={{ margin: "16px -24px -22px", padding: "16px 24px 0" }}><button className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={!reason} onClick={() => onSubmit(note.trim() ? `${reason}. ${note.trim()}` : reason)}>Pass on this property</button></div>
  </div>;
}

function ViewingRequestForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (dates: string[]) => void }) {
  const [slots, setSlots] = useState([{ date: "", time: "" }, { date: "", time: "" }, { date: "", time: "" }]);
  const setSlot = (i: number, k: "date" | "time", v: string) => setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  const valid = slots.filter(s => s.date).map(s => `${new Date(s.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}${s.time ? `, ${s.time}` : ""}`);
  return <div style={{ padding: "22px 24px" }}>
    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Offer up to three dates. BrightBridge confirms one with the property source and emails everyone.</p>
    {slots.map((s, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
      <input type="date" value={s.date} onChange={e => setSlot(i, "date", e.target.value)} style={{ flex: 2, border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}/>
      <input type="time" value={s.time} onChange={e => setSlot(i, "time", e.target.value)} style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}/>
    </div>)}
    <div className="form-actions" style={{ margin: "16px -24px -22px", padding: "16px 24px 0" }}><button className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={valid.length === 0} onClick={() => onSubmit(valid)}>Send request</button></div>
  </div>;
}

function DeclineDatesForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (note: string) => void }) {
  const [note, setNote] = useState("");
  return <div style={{ padding: "22px 24px" }}>
    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Tell BrightBridge what would work instead.</p>
    <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Not available that week, any afternoon the week after works" style={{ width: "100%", minHeight: 80, border: "1px solid var(--line)", borderRadius: 9, padding: 12, fontSize: 12, fontFamily: "inherit" }}/>
    <div className="form-actions" style={{ margin: "16px -24px -22px", padding: "16px 24px 0" }}><button className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={!note.trim()} onClick={() => onSubmit(note.trim())}>Send to BrightBridge</button></div>
  </div>;
}

/* ---------------------------------------------------------------------------
   Property submission
--------------------------------------------------------------------------- */

function UploadWizard({ step, setStep, forReq, initial, onCancel, onSubmit }: { step: number; setStep: (n: number) => void; forReq: RequirementRecord | null; initial: PropertyRecord | null; onCancel: () => void; onSubmit: (f: any, docs: DocItem[], asDraft: boolean) => void }) {
  const [f, setF] = useState({
    name: initial?.name || "", area: initial?.area || "", propertyType: initial?.propertyType || "Family home (2 to 3 bed)",
    bedrooms: initial ? String(initial.bedrooms) : "", bathrooms: initial ? String(initial.bathrooms) : "", condition: initial?.condition || "Furnished",
    rent: initial?.rent || "", leaseOffer: initial?.leaseOffer || "", availableFrom: initial?.availableFrom || "", description: initial?.description || "",
  });
  const [docs, setDocs] = useState<DocItem[]>(() => {
    if (initial) return initial.documents;
    const base = standardDocs();
    const extra = (forReq?.extraDocs || []).map(label => ({ id: nextId("DOC"), label, standard: false, askedForBy: "requirement" as const, state: "Being obtained" as DocState }));
    return [...base, ...extra];
  });
  const set = (k: string, v: string) => setF(prev => ({ ...prev, [k]: v }));
  const setAddress = (v: string) => setF(prev => ({ ...prev, name: v, area: v }));
  const toggleDoc = (id: string) => setDocs(prev => prev.map(d => d.id === id ? { ...d, state: d.state === "On file" ? "Being obtained" : "On file" } : d));
  const labels = ["Property", "Photos", "Documents", "Review"];
  const onFile = docs.filter(d => d.state === "On file");

  return <div className="modal-backdrop" onMouseDown={onCancel}><div className="modal" style={{ width: "min(780px,100%)" }} onMouseDown={e => e.stopPropagation()}>
    <div className="modal-head"><h2>{initial ? `Edit ${initial.id}` : forReq ? `Submit a property for ${forReq.id}` : "Submit a property"}</h2><button className="icon-button" onClick={onCancel}>×</button></div>
    <div style={{ display: "flex", gap: 4, padding: "0 24px" }}>{labels.map((l, i) => (
      <div key={l} style={{ flex: 1, textAlign: "center" }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: i + 1 <= step ? "var(--ink)" : "#f0eef1", color: i + 1 <= step ? "#fff" : "var(--muted)" }}>{i + 1}</div>
        <div style={{ fontSize: 10, color: i + 1 <= step ? "var(--ink)" : "var(--muted)", fontWeight: i + 1 === step ? 700 : 400 }}>{l}</div>
        <div style={{ height: 3, background: i + 1 <= step ? "var(--ink)" : "#f0eef1", borderRadius: 2, marginTop: 6 }} />
      </div>))}</div>

    {step === 1 && <div className="form" style={{ paddingTop: 22 }}>
      {forReq && <p style={{ gridColumn: "1/3", fontSize: 11, color: "var(--purple)", background: "var(--purple-soft)", padding: "10px 12px", borderRadius: 8, margin: 0 }}>Submitting against {forReq.id}: {forReq.bedrooms} beds, {forReq.propertyType.toLowerCase()}, {forReq.area}, up to {forReq.budget}</p>}
      <div className="field full"><label>Address</label><input required value={f.name} onChange={e => setAddress(e.target.value)} placeholder="42 Wellington Road, Birmingham, B15 3AB"/></div>
      <div className="field"><label>Property type</label><select value={f.propertyType} onChange={e => set("propertyType", e.target.value)}><option>Family home (2 to 3 bed)</option><option>HMO (up to 6 bed)</option><option>Larger format (7+ bed)</option><option>Bungalow</option><option>Self contained flats</option></select></div>
      <div className="field"><label>Bedrooms</label><input type="number" required value={f.bedrooms} onChange={e => set("bedrooms", e.target.value)} placeholder="e.g. 6"/></div>
      <div className="field"><label>Bathrooms</label><input type="number" value={f.bathrooms} onChange={e => set("bathrooms", e.target.value)} placeholder="e.g. 3"/></div>
      <div className="field"><label>Condition</label><select value={f.condition} onChange={e => set("condition", e.target.value)}><option>Furnished</option><option>Unfurnished</option><option>Needs refurbishment</option></select></div>
      <div className="field"><label>Monthly rent</label><input required value={f.rent} onChange={e => set("rent", e.target.value)} placeholder="£3,450 pcm"/></div>
      <div className="field"><label>Lease length offered</label><select value={f.leaseOffer} onChange={e => set("leaseOffer", e.target.value)}><option value="">Select</option><option>3 years minimum</option><option>5 years minimum</option><option>3 to 5 years</option><option>5 to 10 years</option><option>10+ years</option><option>Negotiable</option></select></div>
      <div className="field"><label>Available from</label><input type="date" onChange={e => set("availableFrom", new Date(e.target.value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))}/></div>
      <div className="field full"><label>About the property</label><textarea value={f.description} onChange={e => set("description", e.target.value)} placeholder="Layout, recent works, parking, outdoor space, anything a care provider would want to know"/></div>
    </div>}

    {step === 2 && <div style={{ padding: "22px 24px" }}>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>At least six photos: living room, kitchen, bedrooms, bathrooms and exterior.</p>
      <div style={{ border: "2px dashed var(--line)", borderRadius: 12, padding: "48px 20px", textAlign: "center", color: "var(--muted)" }}>
        <div style={{ fontSize: 12, fontWeight: 700 }}>Drag images here or click to browse</div>
        <div style={{ fontSize: 10, marginTop: 4 }}>JPG or PNG, up to 5MB each</div>
      </div>
    </div>}

    {step === 3 && <div style={{ padding: "22px 24px" }}>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Upload what you have. Anything missing is chased by BrightBridge, not by the care provider.</p>
      {docs.map(d => (
        <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{d.label}
            {REQUIRED_DOCS.includes(d.label) && <span style={{ color: "#c23b3b", marginLeft: 6, fontWeight: 700, fontSize: 10 }}>required</span>}
            {d.askedForBy === "requirement" && <span style={{ color: "var(--purple)", marginLeft: 6, fontWeight: 700, fontSize: 10 }}>asked for on {forReq?.id}</span>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="date" style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "6px 8px", fontSize: 10, width: 110 }} title="Issue date"/>
            <input type="date" style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "6px 8px", fontSize: 10, width: 110 }} title="Expiry date"/>
            <button type="button" className="secondary" style={{ fontSize: 10, padding: "7px 10px" }} onClick={() => toggleDoc(d.id)}>{d.state === "On file" ? "✓ Uploaded" : "↑ Upload"}</button>
          </div>
        </div>
      ))}
    </div>}

    {step === 4 && <div style={{ padding: "22px 24px" }}>
      <div className="detail-grid" style={{ padding: "14px 0" }}>
        <div><small>Address</small><strong>{f.name || "—"}</strong></div>
        <div><small>Type</small><strong>{f.propertyType}</strong></div>
        <div><small>Bedrooms</small><strong>{f.bedrooms || "—"}</strong></div>
        <div><small>Bathrooms</small><strong>{f.bathrooms || "—"}</strong></div>
        <div><small>Monthly rent</small><strong>{f.rent || "—"}</strong></div>
        <div><small>Lease offered</small><strong>{f.leaseOffer || "—"}</strong></div>
        <div><small>Available</small><strong>{f.availableFrom || "—"}</strong></div>
        <div><small>Documents uploaded</small><strong>{onFile.length} of {docs.length}</strong></div>
        <div><small>Required documents</small><strong>{docs.filter(d => REQUIRED_DOCS.includes(d.label) && d.state === "On file").length} of {REQUIRED_DOCS.length}</strong></div>
      </div>
      <p style={{ fontSize: 11, color: "#95631b", background: "var(--amber-bg)", padding: "10px 12px", borderRadius: 8, marginTop: 8, lineHeight: 1.6 }}>Submitting sends this to BrightBridge for review. It is not visible to any care provider until we accept and match it.</p>
    </div>}

    <div className="form-actions">
      <button type="button" className="secondary" onClick={() => step === 1 ? onCancel() : setStep(step - 1)}>{step === 1 ? "Cancel" : "Back"}</button>
      <div style={{ display: "flex", gap: 10 }}>
        {step === 4 && <button type="button" className="secondary" onClick={() => onSubmit(f, docs, true)}>Save as draft</button>}
        {step < 4 ? <button className="primary" onClick={() => setStep(step + 1)}>Continue</button> : <button className="primary" onClick={() => onSubmit(f, docs, false)}>{initial ? "Save and submit" : "Submit property"}</button>}
      </div>
    </div>
  </div></div>;
}

/* ---------------------------------------------------------------------------
   Registration: two short forms, straight into the dashboard
--------------------------------------------------------------------------- */

const LOCATIONS = ["Warrington", "St Helens", "Wider Cheshire", "Greater Manchester", "Yorkshire", "West Midlands", "Staffordshire", "North London", "North West"];
const SERVICES = ["Supported living", "Children's home", "Residential care", "Semi independent (16 to 25)", "Temporary and emergency accommodation", "Housing management (RSL)", "Local authority commissioning"];
const PARTNER_TYPES = ["Family home (2 to 3 bed)", "HMO (up to 6 bed)", "Larger format (7+ bed)", "Bungalow", "Self contained flats"];

function Reg({ eyebrow, title, blurb, onBack, children }: any) {
  return <div style={{ minHeight: "100vh", background: "#fff" }}>
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
  </div>;
}

function RegChips({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
    {options.map(o => <span key={o} onClick={() => onToggle(o)} style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: `1px solid ${selected.includes(o) ? "var(--purple)" : "var(--line)"}`, background: selected.includes(o) ? "var(--purple-soft)" : "transparent", color: selected.includes(o) ? "var(--purple)" : "var(--muted)" }}>{o}</span>)}
  </div>;
}

function RegisterProvider({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [services, setServices] = useState<string[]>([]);
  const [coverage, setCoverage] = useState<string[]>([]);
  const toggle = (list: string[], setList: any, v: string) => setList(list.includes(v) ? list.filter((x: string) => x !== v) : [...list, v]);

  return <Reg eyebrow="Care provider" title="Create your account" blurb="Tell us about your organisation so we can match you with the right properties." onBack={onBack}>
    <form onSubmit={e => { e.preventDefault(); onDone(); }} className="form" style={{ padding: 0 }}>
      <div className="field full"><label>Organisation name</label><input required placeholder="e.g. Willow Care Group"/></div>
      <div className="field"><label>Contact name</label><input required placeholder="Full name"/></div>
      <div className="field"><label>Job title</label><input placeholder="e.g. Head of Estates"/></div>
      <div className="field"><label>Email</label><input required type="email" placeholder="you@organisation.co.uk"/></div>
      <div className="field"><label>Phone</label><input required placeholder="07XXX XXXXXX"/></div>
      <div className="field full"><label>Services you deliver</label>
        <RegChips options={SERVICES} selected={services} onToggle={v => toggle(services, setServices, v)}/>
      </div>
      <div className="field full"><label>Where do you need properties?</label>
        <RegChips options={LOCATIONS} selected={coverage} onToggle={v => toggle(coverage, setCoverage, v)}/>
      </div>
      <div className="form-actions"><button type="button" className="secondary" onClick={onBack}>Cancel</button><button className="primary" disabled={services.length === 0 || coverage.length === 0} style={{ opacity: services.length > 0 && coverage.length > 0 ? 1 : .4 }}>Create account</button></div>
    </form>
  </Reg>;
}

function RegisterPartner({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [coverage, setCoverage] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const toggle = (list: string[], setList: any, v: string) => setList(list.includes(v) ? list.filter((x: string) => x !== v) : [...list, v]);

  return <Reg eyebrow="Property partner" title="Create your account" blurb="Whether you own a single property or source across a region, the same account applies." onBack={onBack}>
    <form onSubmit={e => { e.preventDefault(); onDone(); }} className="form" style={{ padding: 0 }}>
      <div className="field full"><label>Your name</label><input required placeholder="Full name"/></div>
      <div className="field"><label>Email</label><input required type="email" placeholder="you@email.com"/></div>
      <div className="field"><label>Phone</label><input required placeholder="07XXX XXXXXX"/></div>
      <div className="field full"><label>Company name</label><input placeholder="Leave blank if you are an individual landlord"/></div>
      <div className="field full"><label>Where can you source properties?</label>
        <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 6px" }}>Requirements are only sent to you for the areas you cover.</p>
        <RegChips options={LOCATIONS} selected={coverage} onToggle={v => toggle(coverage, setCoverage, v)}/>
      </div>
      <div className="field full"><label>Property types you work with</label>
        <RegChips options={PARTNER_TYPES} selected={types} onToggle={v => toggle(types, setTypes, v)}/>
      </div>
      <div className="form-actions"><button type="button" className="secondary" onClick={onBack}>Cancel</button><button className="primary" disabled={coverage.length === 0 || types.length === 0} style={{ opacity: coverage.length > 0 && types.length > 0 ? 1 : .4 }}>Create account</button></div>
    </form>
  </Reg>;
}
