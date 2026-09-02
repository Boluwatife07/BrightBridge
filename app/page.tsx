"use client";

import { useState } from "react";
import { RegisterProvider, RegisterPartner } from "./components/Registration";
import { RequirementForm, RequirementFields } from "./components/RequirementForm";
import { RequirementsList, RequirementDetail } from "./components/Requirements";
import { PropertySubmissionForm, PropertyFields } from "./components/PropertySubmissionForm";
import { PropertyReviewQueue } from "./components/PropertyReview";
import { PartnerPropertiesList, ProviderPropertiesList, PropertyDetailModal } from "./components/PropertiesViews";
import { HoTDraftFields } from "./components/HeadsOfTerms";
import { ViewingsList } from "./components/Viewings";
import { ProviderAccount, PartnerAccount, Role, RequirementRecord, PropertyRecord, DocItem, DocState, ViewingRecord, OfferRound, HeadsOfTerms, nextId, now, today } from "./lib/types";
import { seedProviderAccount, seedLandlordAccount, seedIntroducerAccount } from "./lib/seed";
import { seedRequirements, blankRequirement, duplicateRequirement } from "./lib/requirementSeed";
import { seedProperties, blankProperty } from "./lib/propertySeed";
import { seedViewings, blankViewingRequest } from "./lib/viewingSeed";

type Screen = "landing" | "onboardProvider" | "onboardPartner" | "app";
type View = "overview" | "requirements" | "properties" | "viewings" | "activity" | "settings";
type ReqModal = "form" | "detail" | null;
type PropModal = "form" | "detail" | null;

const NAV: { id: View; label: string; icon: string; builtInStage: number }[] = [
  { id: "overview", label: "Overview", icon: "⌂", builtInStage: 1 },
  { id: "requirements", label: "Requirements", icon: "▤", builtInStage: 2 },
  { id: "properties", label: "Properties", icon: "◇", builtInStage: 3 },
  { id: "viewings", label: "Viewings", icon: "↗", builtInStage: 4 },
  { id: "activity", label: "Activity", icon: "□", builtInStage: 10 },
  { id: "settings", label: "Settings", icon: "⚙", builtInStage: 1 },
];

const CURRENT_STAGE = 4;

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [view, setView] = useState<View>("overview");
  const [role, setRole] = useState<Role>("bbc");
  const [providerAccount, setProviderAccount] = useState<ProviderAccount>(seedProviderAccount);
  const [partnerAccount, setPartnerAccount] = useState<PartnerAccount>(seedLandlordAccount);
  const [partnerVariant, setPartnerVariant] = useState<"landlord" | "introducer">("landlord");

  const [requirements, setRequirements] = useState<RequirementRecord[]>(seedRequirements);
  const [reqModal, setReqModal] = useState<ReqModal>(null);
  const [selectedReq, setSelectedReq] = useState<RequirementRecord | null>(null);
  const [editingReq, setEditingReq] = useState<RequirementRecord | null>(null);

  const [properties, setProperties] = useState<PropertyRecord[]>(seedProperties);
  const [propModal, setPropModal] = useState<PropModal>(null);
  const [selectedProp, setSelectedProp] = useState<PropertyRecord | null>(null);
  const [editingProp, setEditingProp] = useState<PropertyRecord | null>(null);
  const [submitForReqId, setSubmitForReqId] = useState<string | null>(null);

  const [viewings, setViewings] = useState<ViewingRecord[]>(seedViewings);

  const [toast, setToast] = useState("");

  function notify(message: string) { setToast(message); setTimeout(() => setToast(""), 3200); }

  function enterAppAs(next: Role) {
    setRole(next);
    setScreen("app");
    setView("overview");
  }

  function onProviderRegistered(account: ProviderAccount) {
    setProviderAccount(account);
    enterAppAs("provider");
  }

  function onPartnerRegistered(account: PartnerAccount) {
    setPartnerAccount(account);
    enterAppAs("partner");
  }

  function backToStart() {
    setScreen("landing");
    setView("overview");
  }

  function switchDemoRole() {
    if (role === "bbc") { setPartnerVariant("landlord"); setPartnerAccount(seedLandlordAccount); enterAppAs("provider"); }
    else if (role === "provider") { setPartnerVariant("landlord"); setPartnerAccount(seedLandlordAccount); enterAppAs("partner"); }
    else if (role === "partner" && partnerVariant === "landlord") { setPartnerVariant("introducer"); setPartnerAccount(seedIntroducerAccount); enterAppAs("partner"); }
    else enterAppAs("bbc");
  }

  /* ---------------- requirements (Care Provider PRD, Phase 2) ---------------- */
  function openCreateRequirement() { setEditingReq(null); setReqModal("form"); }
  function openEditRequirement(r: RequirementRecord) { setEditingReq(r); setSelectedReq(null); setReqModal("form"); }
  function openRequirementDetail(r: RequirementRecord) { setSelectedReq(r); setReqModal("detail"); }
  function closeReqModal() { setReqModal(null); setEditingReq(null); }

  function saveRequirement(fields: RequirementFields, asDraft: boolean) {
    if (editingReq) {
      setRequirements(prev => prev.map(r => r.id === editingReq.id ? {
        ...r, ...fields,
        status: asDraft ? "Draft" : "Open",
        postedOn: !asDraft && !r.postedOn ? new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : r.postedOn,
      } : r));
      notify(asDraft ? "Saved as draft" : "Requirement updated");
    } else {
      const r: RequirementRecord = {
        ...blankRequirement(providerAccount.id), ...fields,
        status: asDraft ? "Draft" : "Open",
        postedOn: asDraft ? "" : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      };
      setRequirements(prev => [r, ...prev]);
      notify(asDraft ? "Saved as draft" : `${r.id} is live, every property partner covering ${fields.area} has been notified`);
    }
    closeReqModal();
  }

  function withdrawRequirement(r: RequirementRecord) {
    setRequirements(prev => prev.map(x => x.id === r.id ? { ...x, status: "Withdrawn" } : x));
    notify("Requirement withdrawn");
    setReqModal(null);
  }

  function rePublishRequirement(r: RequirementRecord) {
    setRequirements(prev => prev.map(x => x.id === r.id ? {
      ...x, status: "Open",
      postedOn: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    } : x));
    notify("Requirement is live again");
    setReqModal(null);
  }

  function duplicateAndOpen(r: RequirementRecord) {
    const copy = duplicateRequirement(r);
    setRequirements(prev => [copy, ...prev]);
    notify("Duplicated as a new draft");
    setEditingReq(copy);
    setReqModal("form");
  }

  /* ---------------- properties (Property Partner PRD, Phase 3-4) ---------------- */
  const currentPartnerId = partnerAccount.id;
  const isOwner = partnerVariant === "landlord";

  function openSubmitProperty(forReqId: string | null = null) {
    setEditingProp(null);
    setSubmitForReqId(forReqId);
    setPropModal("form");
  }
  function openEditProperty(p: PropertyRecord) {
    setEditingProp(p);
    setSubmitForReqId(p.matchedReqId);
    setSelectedProp(null);
    setPropModal("form");
  }
  function openPropertyDetail(p: PropertyRecord) { setSelectedProp(p); setPropModal("detail"); }
  function closePropModal() { setPropModal(null); setEditingProp(null); setSubmitForReqId(null); }

  function saveProperty(fields: PropertyFields, requirementId: string | null, uploadedLabels: string[], asDraft: boolean) {
    const applyUploads = (docs: DocItem[]): DocItem[] =>
      docs.map(d => uploadedLabels.includes(d.label) ? { ...d, state: "On file" as DocState } : d);

    if (editingProp) {
      setProperties(prev => prev.map(p => p.id === editingProp.id ? {
        ...p, ...fields,
        matchedReqId: requirementId,
        documents: applyUploads(p.documents),
        status: asDraft ? "Draft" : "Submitted",
        declineReason: asDraft ? p.declineReason : "",
      } : p));
      notify(asDraft ? "Saved as draft" : (editingProp.status === "Declined" ? "Re-submitted, BrightBridge will take another look" : "Property updated"));
    } else {
      const base = blankProperty(currentPartnerId, isOwner);
      const p: PropertyRecord = {
        ...base, ...fields,
        matchedReqId: requirementId,
        documents: applyUploads(base.documents),
        status: asDraft ? "Draft" : "Submitted",
      };
      setProperties(prev => [p, ...prev]);
      notify(asDraft ? "Saved as draft" : (requirementId ? `Property submitted against ${requirementId}, BrightBridge will review it` : "Property submitted, BrightBridge will review it"));
    }
    closePropModal();
  }

  function decideProperty(p: PropertyRecord, decision: "Accepted" | "Declined", reason: string) {
    setProperties(prev => prev.map(x => x.id === p.id ? { ...x, status: decision, declineReason: reason } : x));
    notify(decision === "Accepted" ? "Property accepted, ready to match to a requirement" : "Property declined, the partner has been told why");
    setPropModal(null);
  }

  function matchProperty(p: PropertyRecord, reqId: string) {
    setProperties(prev => prev.map(x => x.id === p.id ? { ...x, status: "Matched", matchedReqId: reqId } : x));
    setRequirements(prev => prev.map(r => {
      if (r.id === reqId) return r.matchedPropertyIds.includes(p.id) ? r : { ...r, matchedPropertyIds: [...r.matchedPropertyIds, p.id] };
      // if the property was previously matched to a different requirement, unlink it there
      if (p.matchedReqId && r.id === p.matchedReqId && r.id !== reqId) return { ...r, matchedPropertyIds: r.matchedPropertyIds.filter(id => id !== p.id) };
      return r;
    }));
    notify(`Matched to ${reqId}, the care provider has been notified`);
    setPropModal(null);
  }

  function passOnProperty(p: PropertyRecord, reason: string) {
    setProperties(prev => prev.map(x => x.id === p.id ? { ...x, status: "Accepted", matchedReqId: null, passedOn: [...x.passedOn, { reqId: p.matchedReqId || "", reason }] } : x));
    if (p.matchedReqId) setRequirements(prev => prev.map(r => r.id === p.matchedReqId ? { ...r, matchedPropertyIds: r.matchedPropertyIds.filter(id => id !== p.id) } : r));
    notify("Passed on, BrightBridge has the reason and will keep looking");
    setPropModal(null);
  }

  function requestExtraDoc(p: PropertyRecord, label: string) {
    if (p.documents.some(d => d.label.toLowerCase() === label.toLowerCase())) { notify("That document is already on the list"); return; }
    const newDoc: DocItem = { id: `DOC-${Date.now()}`, label, standard: false, askedForBy: "provider", state: "Requested" };
    const apply = (x: PropertyRecord) => x.id === p.id ? { ...x, documents: [...x.documents, newDoc] } : x;
    setProperties(prev => prev.map(apply));
    setSelectedProp(prev => prev && prev.id === p.id ? apply(prev) : prev);
    notify("Sent to BrightBridge, we will chase the property source");
  }

  /* ---------------- viewings (Care Provider PRD, Phase 4) ---------------- */
  function requestViewing(p: PropertyRecord, message: string) {
    const v = blankViewingRequest(p.id, p.name, p.matchedReqId, message);
    setViewings(prev => [v, ...prev]);
    setProperties(prev => prev.map(x => x.id === p.id ? { ...x, status: "Viewing requested" } : x));
    notify("Viewing request sent directly to the property source");
    setPropModal(null);
  }

  function offerDates(v: ViewingRecord, dates: string[]) {
    setViewings(prev => prev.map(x => x.id === v.id ? { ...x, offeredDates: dates, status: "Dates offered" } : x));
    notify("Dates sent to the care provider");
  }

  function pickDate(v: ViewingRecord, date: string) {
    setViewings(prev => prev.map(x => x.id === v.id ? { ...x, confirmedDate: date, status: "Confirmed" } : x));
    setProperties(prev => prev.map(p => p.id === v.propertyId ? { ...p, status: "Viewing confirmed" } : p));
    notify("Date confirmed with the property source");
  }

  function declineDates(v: ViewingRecord, note: string) {
    setViewings(prev => prev.map(x => x.id === v.id ? {
      ...x, status: "Reschedule needed",
      declineNote: note || "None of those dates work.",
    } : x));
    notify("Sent to the property source, none of the dates worked");
  }

  function cancelViewing(v: ViewingRecord, reason: string) {
    setViewings(prev => prev.map(x => x.id === v.id ? { ...x, status: "Cancelled", cancelledBy: role === "provider" ? "provider" : "partner", cancelReason: reason } : x));
    setProperties(prev => prev.map(p => p.id === v.propertyId ? { ...p, status: "Matched" } : p));
    notify("Viewing cancelled");
  }

  /* ---------------- viewing outcome & schedule of works (Care Provider PRD, Phase 5) ---------------- */
  function notProceeding(p: PropertyRecord, reason: string, note: string) {
    setProperties(prev => prev.map(x => x.id === p.id ? {
      ...x, status: "Accepted", matchedReqId: null, dealStage: "None",
      passedOn: [...x.passedOn, { reqId: p.matchedReqId || "", reason: note ? `${reason}. ${note}` : reason }],
    } : x));
    if (p.matchedReqId) setRequirements(prev => prev.map(r => r.id === p.matchedReqId ? { ...r, matchedPropertyIds: r.matchedPropertyIds.filter(id => id !== p.id) } : r));
    notify("Outcome recorded, property returned to the accepted pool");
    setPropModal(null);
  }

  function secondViewingNeeded(p: PropertyRecord, message: string) {
    const v = blankViewingRequest(p.id, p.name, p.matchedReqId, message);
    setViewings(prev => [v, ...prev]);
    setProperties(prev => prev.map(x => x.id === p.id ? { ...x, status: "Viewing requested" } : x));
    notify("Second viewing requested directly with the property source");
    setPropModal(null);
  }

  function proceedWithWorks(p: PropertyRecord, works: PropertyRecord["worksItems"], note: string) {
    setProperties(prev => prev.map(x => x.id === p.id ? {
      ...x, status: "Offer", dealStage: "Offer", worksItems: works, viewingOutcomeNote: note,
    } : x));
    notify(works.length > 0 ? "Schedule of works sent to the property source" : "Confirmed as ready, moving to offer");
    setPropModal(null);
  }

  /* ---------------- offer negotiation (Care Provider PRD, Phase 6) ---------------- */
  function submitOffer(p: PropertyRecord, rent: string, leaseLength: string, message: string) {
    const round: OfferRound = { id: nextId("OFFER"), round: p.offers.length + 1, actor: "provider", rent, leaseLength, message, status: "Offered", timestamp: now() };
    const apply = (x: PropertyRecord) => x.id === p.id ? { ...x, offers: [...x.offers, round] } : x;
    setProperties(prev => prev.map(apply));
    setSelectedProp(prev => prev && prev.id === p.id ? apply(prev) : prev);
    notify(`Offer sent: ${rent} on a ${leaseLength} lease`);
  }

  function acceptOffer(p: PropertyRecord) {
    const apply = (x: PropertyRecord) => {
      if (x.id !== p.id || x.offers.length === 0) return x;
      const offers = x.offers.map((o, i) => i === x.offers.length - 1 ? { ...o, status: "Accepted" as const } : o);
      const last = offers[offers.length - 1];
      return { ...x, offers, rent: last.rent, leaseOffer: last.leaseLength, status: "Heads of terms" as const, dealStage: "Heads of terms" as const };
    };
    setProperties(prev => prev.map(apply));
    setSelectedProp(prev => prev && prev.id === p.id ? apply(prev) : prev);
    notify("Offer accepted, terms agreed");
  }

  function counterOffer(p: PropertyRecord, rent: string, leaseLength: string, message: string) {
    const respondingActor = role === "provider" ? "provider" : "partner";
    const apply = (x: PropertyRecord) => {
      if (x.id !== p.id || x.offers.length === 0) return x;
      const offers = x.offers.map((o, i) => i === x.offers.length - 1 ? { ...o, status: "Countered" as const } : o);
      const round: OfferRound = { id: nextId("OFFER"), round: offers.length + 1, actor: respondingActor, rent, leaseLength, message, status: "Offered", timestamp: now() };
      return { ...x, offers: [...offers, round] };
    };
    setProperties(prev => prev.map(apply));
    setSelectedProp(prev => prev && prev.id === p.id ? apply(prev) : prev);
    notify(`Counter sent: ${rent} on a ${leaseLength} lease`);
  }

  function rejectOffer(p: PropertyRecord, message: string) {
    const apply = (x: PropertyRecord) => {
      if (x.id !== p.id || x.offers.length === 0) return x;
      const offers = x.offers.map((o, i) => i === x.offers.length - 1
        ? { ...o, status: "Rejected" as const, message: message ? `${o.message ? o.message + " — " : ""}Declined: ${message}` : o.message }
        : o);
      return { ...x, offers };
    };
    setProperties(prev => prev.map(apply));
    setSelectedProp(prev => prev && prev.id === p.id ? apply(prev) : prev);
    notify("Offer rejected");
  }

  /* ---------------- identity resolution for heads of terms ----------------
     Resolves real names from the PROPERTY's actual owner/requirement, not
     from whichever demo persona happens to be selected right now — a
     provider can view a property owned by either seeded partner account,
     and showing the wrong name here would defeat the point of this stage. */
  function resolvePartnerName(p: PropertyRecord): string {
    if (p.partnerAccountId === seedLandlordAccount.id) return seedLandlordAccount.fullName;
    if (p.partnerAccountId === seedIntroducerAccount.id) return seedIntroducerAccount.companyName || seedIntroducerAccount.fullName;
    if (p.partnerAccountId === partnerAccount.id) return partnerAccount.companyName || partnerAccount.fullName;
    return "Property source";
  }
  function resolveProviderName(p: PropertyRecord): string {
    const req = requirements.find(r => r.id === p.matchedReqId);
    if (req?.operatorAccountId === providerAccount.id) return providerAccount.organisationName;
    if (req?.operatorAccountId === seedProviderAccount.id) return seedProviderAccount.organisationName;
    return "Care provider";
  }

  function withdrawOffer(p: PropertyRecord) {
    const apply = (x: PropertyRecord) => {
      if (x.id !== p.id || x.offers.length === 0) return x;
      const offers = x.offers.map((o, i) => i === x.offers.length - 1 ? { ...o, status: "Withdrawn" as const } : o);
      return { ...x, offers };
    };
    setProperties(prev => prev.map(apply));
    setSelectedProp(prev => prev && prev.id === p.id ? apply(prev) : prev);
    notify("Offer withdrawn");
  }

  /* ---------------- heads of terms (Care Provider PRD, Phase 7) ---------------- */
  function publishHoT(p: PropertyRecord, fields: HoTDraftFields) {
    const hot: HeadsOfTerms = { ...fields, status: "Published", counterNote: "", counteredBy: null, publishedOn: today() };
    const apply = (x: PropertyRecord) => x.id === p.id ? { ...x, headsOfTerms: hot } : x;
    setProperties(prev => prev.map(apply));
    setSelectedProp(prev => prev && prev.id === p.id ? apply(prev) : prev);
    notify("Heads of terms published. Real identities are now shared between both parties.");
  }

  function acceptHoT(p: PropertyRecord) {
    const apply = (x: PropertyRecord) => {
      if (x.id !== p.id || !x.headsOfTerms) return x;
      return {
        ...x, headsOfTerms: { ...x.headsOfTerms, status: "Agreed" as const, counteredBy: null },
        status: "Works" as const, dealStage: "Works" as const,
      };
    };
    setProperties(prev => prev.map(apply));
    setSelectedProp(prev => prev && prev.id === p.id ? apply(prev) : prev);
    notify("Terms agreed by both parties");
  }

  function counterHoT(p: PropertyRecord, note: string) {
    const counterer = role === "provider" ? "provider" : "partner";
    const apply = (x: PropertyRecord) => x.id === p.id && x.headsOfTerms
      ? { ...x, headsOfTerms: { ...x.headsOfTerms, status: "Countered" as const, counterNote: note, counteredBy: counterer as "provider" | "partner" } }
      : x;
    setProperties(prev => prev.map(apply));
    setSelectedProp(prev => prev && prev.id === p.id ? apply(prev) : prev);
    notify("Counter sent");
  }

  /* ---------------- landing ---------------- */
  if (screen === "landing") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 40, background: "#fff" }}>
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
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>Landlords and introducers supplying property to the care sector</div>
          </div>
        </div>
        <button className="text-button" style={{ marginTop: 36 }} onClick={() => enterAppAs("bbc")}>BrightBridge team, go to the internal workspace →</button>
      </div>
    );
  }

  if (screen === "onboardProvider") return <RegisterProvider onBack={() => setScreen("landing")} onDone={onProviderRegistered} />;
  if (screen === "onboardPartner") return <RegisterPartner onBack={() => setScreen("landing")} onDone={onPartnerRegistered} />;

  /* ---------------- app shell ---------------- */
  const myName = role === "bbc" ? "BrightBridge" : role === "provider" ? providerAccount.organisationName : (partnerAccount.companyName || partnerAccount.fullName);
  const initials = (myName || "?").split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const roleName = role === "bbc" ? "BrightBridge workspace" : role === "provider" ? "Care provider portal" : partnerVariant === "introducer" ? "Property partner portal (introducer)" : "Property partner portal (landlord)";
  const heading = view === "overview" ? `Welcome, ${myName || "there"}` : NAV.find(n => n.id === view)?.label;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div style={{ width: 35, height: 35, borderRadius: 9, background: "var(--purple)" }} /><div><strong>BrightBridge</strong><span>Connect</span></div></div>
        <div className="workspace-label">Workspace</div>
        <button className="role-switch" onClick={switchDemoRole}>
          <span className="role-avatar">{role === "bbc" ? "BB" : initials}</span>
          <span><b>{roleName}</b><small>Switch demo role →</small></span>
          <i>⌄</i>
        </button>
        <nav>
          {NAV.map(item => (
            <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>
              <span>{item.icon}</span>{item.label}
              {item.builtInStage > CURRENT_STAGE && <em style={{ background: "var(--muted)" }}>{item.builtInStage}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={backToStart}><span>⇠</span>Sign out</button>
        </div>
      </aside>

      <main className="main">
        <header>
          <div><p>{roleName}</p><h1>{heading}</h1></div>
          <div className="header-actions">
            <button className="avatar">{role === "bbc" ? "BB" : initials}</button>
          </div>
        </header>

        {view === "overview" && (
          <div className="page-content">
            <section className="panel" style={{ padding: 26 }}>
              <h2 style={{ fontSize: 16, marginBottom: 4 }}>Account created</h2>
              <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 18 }}>Stage 1 of the build: data model and registration. Everything below is what was captured at sign-up.</p>

              {role === "provider" && (
                <div className="detail-grid" style={{ gridTemplateColumns: "repeat(2,1fr)", padding: "0 0 18px" }}>
                  <div><small>Organisation</small><strong>{providerAccount.organisationName}</strong></div>
                  <div><small>Contact</small><strong>{providerAccount.contactName}{providerAccount.jobTitle ? `, ${providerAccount.jobTitle}` : ""}</strong></div>
                  <div><small>Email</small><strong>{providerAccount.email}</strong></div>
                  <div><small>Phone</small><strong>{providerAccount.phone}</strong></div>
                  <div><small>Services</small><strong>{providerAccount.services.join(", ") || "—"}</strong></div>
                  <div><small>Coverage areas</small><strong>{providerAccount.coverageAreas.join(", ") || "—"}</strong></div>
                </div>
              )}

              {role === "partner" && (
                <div className="detail-grid" style={{ gridTemplateColumns: "repeat(2,1fr)", padding: "0 0 18px" }}>
                  <div><small>Name</small><strong>{partnerAccount.fullName}</strong></div>
                  <div><small>Company</small><strong>{partnerAccount.companyName || "Individual landlord"}</strong></div>
                  <div><small>Email</small><strong>{partnerAccount.email}</strong></div>
                  <div><small>Phone</small><strong>{partnerAccount.phone}</strong></div>
                  <div><small>Coverage areas</small><strong>{partnerAccount.coverageAreas.join(", ") || "—"}</strong></div>
                  <div><small>Property types</small><strong>{partnerAccount.propertyTypes.join(", ") || "—"}</strong></div>
                  <div><small>Demo variant</small><strong style={{ textTransform: "capitalize" }}>{partnerVariant}</strong>
                    <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>{partnerVariant === "introducer" ? "This account submits properties it does not own (Kush's path)." : "This account owns the properties it submits."}</p>
                  </div>
                </div>
              )}

              {role === "bbc" && (
                <p style={{ fontSize: 12, color: "var(--muted)" }}>BBC internal workspace. Property review, matching, and mediation actions are built in later stages.</p>
              )}

              <div style={{ marginTop: 8, padding: "14px 16px", borderRadius: 10, background: "var(--purple-soft)", fontSize: 12, color: "var(--ink)", lineHeight: 1.6 }}>
                {role === "provider" && <>Stage 7 is built: BrightBridge drafts heads of terms from the agreed offer, and real identities are shared for the first time once it is published. The seeded Tunstall property already has a published document awaiting the property source&apos;s response. Next: schedule of works completion and sign-off.</>}
                {role === "partner" && <>Stage 7 is built: once BrightBridge publishes heads of terms, you see the care provider&apos;s real name for the first time and can accept or counter the terms. Next: schedule of works completion and sign-off.</>}
                {role === "bbc" && <>Stage 7 is built: draft and publish heads of terms from the agreed offer terms. Publishing is the moment both parties&apos; real identities are shared. After that, they negotiate the finer terms directly. Next: schedule of works completion and sign-off.</>}
              </div>
            </section>
          </div>
        )}

        {view === "requirements" && role === "provider" && (
          <RequirementsList
            requirements={requirements.filter(r => r.operatorAccountId === providerAccount.id)}
            onOpen={openRequirementDetail}
            onCreate={openCreateRequirement}
          />
        )}

        {view === "requirements" && role !== "provider" && (
          <div className="page-content">
            <section className="panel" style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🛠</div>
              <h2 style={{ fontSize: 15 }}>
                {role === "partner" ? "Browsing requirements from here — not yet built" : "BBC requirement oversight — not part of the current build"}
              </h2>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                {role === "partner"
                  ? "You can already submit a property against a specific requirement from the Properties tab (the submission form lists every live requirement). A dedicated page for browsing requirements before submitting is a future refinement."
                  : "BBC does not review or approve requirements — they go live directly. There is no BBC action needed here."}
              </p>
            </section>
          </div>
        )}

        {view === "properties" && role === "bbc" && (
          <PropertyReviewQueue properties={properties} onOpen={openPropertyDetail} />
        )}

        {view === "properties" && role === "partner" && (
          <PartnerPropertiesList
            properties={properties.filter(p => p.partnerAccountId === currentPartnerId)}
            onOpen={openPropertyDetail}
            onCreate={() => openSubmitProperty(null)}
          />
        )}

        {view === "properties" && role === "provider" && (
          <ProviderPropertiesList
            properties={properties.filter(p => {
              const req = requirements.find(r => r.id === p.matchedReqId);
              return req?.operatorAccountId === providerAccount.id;
            })}
            requirements={requirements}
            onOpen={openPropertyDetail}
          />
        )}

        {view === "viewings" && (
          <ViewingsList
            role={role === "bbc" ? "bbc" : role === "partner" ? "partner" : "provider"}
            viewings={viewings.filter(v => {
              if (role === "bbc") return true;
              if (role === "partner") return properties.some(p => p.id === v.propertyId && p.partnerAccountId === currentPartnerId);
              // provider: viewings tied to a requirement they own
              return v.reqId ? requirements.find(r => r.id === v.reqId)?.operatorAccountId === providerAccount.id : false;
            })}
            onPickDate={pickDate}
            onDeclineDates={declineDates}
            onOfferDates={offerDates}
            onCancel={cancelViewing}
          />
        )}

        {view === "settings" && (
          <div className="page-content">
            <section className="panel" style={{ padding: 26 }}>
              <h2 style={{ fontSize: 16, marginBottom: 14 }}>Account settings</h2>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>Editable in a later stage. Currently read-only, reflecting what you entered at registration.</p>
            </section>
          </div>
        )}

        {view !== "overview" && view !== "settings" && view !== "requirements" && view !== "properties" && view !== "viewings" && (
          <div className="page-content">
            <section className="panel" style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🛠</div>
              <h2 style={{ fontSize: 15 }}>{NAV.find(n => n.id === view)?.label} — coming in Stage {NAV.find(n => n.id === view)?.builtInStage}</h2>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>Not built yet. This screen is a placeholder so navigation is honest about what exists.</p>
            </section>
          </div>
        )}
      </main>

      {reqModal === "form" && (
        <div className="modal-backdrop" onMouseDown={closeReqModal}>
          <div className="modal" style={{ width: "min(780px,100%)" }} onMouseDown={e => e.stopPropagation()}>
            <div className="modal-head"><h2>{editingReq ? `Edit ${editingReq.id}` : "New requirement"}</h2><button className="icon-button" onClick={closeReqModal}>×</button></div>
            <RequirementForm initial={editingReq} onCancel={closeReqModal} onSubmit={saveRequirement} />
          </div>
        </div>
      )}

      {reqModal === "detail" && selectedReq && (
        <RequirementDetail
          requirement={requirements.find(r => r.id === selectedReq.id) || selectedReq}
          properties={properties}
          onOpenProperty={(p) => { setReqModal(null); openPropertyDetail(p); }}
          onClose={() => setReqModal(null)}
          onEdit={() => openEditRequirement(requirements.find(r => r.id === selectedReq.id) || selectedReq)}
          onWithdraw={() => withdrawRequirement(selectedReq)}
          onRePublish={() => rePublishRequirement(selectedReq)}
          onDuplicate={() => duplicateAndOpen(requirements.find(r => r.id === selectedReq.id) || selectedReq)}
        />
      )}

      {propModal === "form" && (
        <div className="modal-backdrop" onMouseDown={closePropModal}>
          <div className="modal" style={{ width: "min(780px,100%)" }} onMouseDown={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editingProp ? `Edit ${editingProp.id}` : submitForReqId ? `Submit a property for ${submitForReqId}` : "Submit a property"}</h2>
              <button className="icon-button" onClick={closePropModal}>×</button>
            </div>
            <PropertySubmissionForm
              isOwner={isOwner}
              requirements={requirements.filter(r => r.status === "Open")}
              defaultRequirementId={submitForReqId}
              existingDocuments={editingProp?.documents}
              onCancel={closePropModal}
              onSubmit={saveProperty}
            />
          </div>
        </div>
      )}

      {propModal === "detail" && selectedProp && (() => {
        const current = properties.find(p => p.id === selectedProp.id) || selectedProp;
        const isOwnProperty = role === "partner" && current.partnerAccountId === currentPartnerId;
        return (
          <PropertyDetailModal
            role={role === "bbc" ? "bbc" : role === "partner" ? "partner" : "provider"}
            property={current}
            requirements={requirements}
            isOwnProperty={isOwnProperty}
            onClose={() => setPropModal(null)}
            onEdit={() => openEditProperty(current)}
            onDecide={(decision, reason) => decideProperty(current, decision, reason)}
            onMatch={(reqId) => matchProperty(current, reqId)}
            onPassOn={(reason) => passOnProperty(current, reason)}
            onRequestDoc={(label) => requestExtraDoc(current, label)}
            onRequestViewing={(message) => requestViewing(current, message)}
            onNotProceeding={(reason, note) => notProceeding(current, reason, note)}
            onSecondViewing={(message) => secondViewingNeeded(current, message)}
            onProceedWithWorks={(works, note) => proceedWithWorks(current, works, note)}
            onSubmitOffer={(rent, leaseLength, message) => submitOffer(current, rent, leaseLength, message)}
            onAcceptOffer={() => acceptOffer(current)}
            onCounterOffer={(rent, leaseLength, message) => counterOffer(current, rent, leaseLength, message)}
            onRejectOffer={(message) => rejectOffer(current, message)}
            onWithdrawOffer={() => withdrawOffer(current)}
            providerName={resolveProviderName(current)}
            partnerName={resolvePartnerName(current)}
            onPublishHoT={(fields) => publishHoT(current, fields)}
            onAcceptHoT={() => acceptHoT(current)}
            onCounterHoT={(note) => counterHoT(current, note)}
          />
        );
      })()}

      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}
