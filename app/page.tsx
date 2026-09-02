"use client";

import { useState } from "react";
import { RegisterProvider, RegisterPartner } from "./components/Registration";
import { RequirementForm, RequirementFields } from "./components/RequirementForm";
import { RequirementsList, RequirementDetail } from "./components/Requirements";
import { ProviderAccount, PartnerAccount, Role, RequirementRecord } from "./lib/types";
import { seedProviderAccount, seedLandlordAccount, seedIntroducerAccount } from "./lib/seed";
import { seedRequirements, blankRequirement, duplicateRequirement } from "./lib/requirementSeed";

type Screen = "landing" | "onboardProvider" | "onboardPartner" | "app";
type View = "overview" | "requirements" | "properties" | "viewings" | "activity" | "settings";
type ReqModal = "form" | "detail" | null;

const NAV: { id: View; label: string; icon: string; builtInStage: number }[] = [
  { id: "overview", label: "Overview", icon: "⌂", builtInStage: 1 },
  { id: "requirements", label: "Requirements", icon: "▤", builtInStage: 2 },
  { id: "properties", label: "Properties", icon: "◇", builtInStage: 3 },
  { id: "viewings", label: "Viewings", icon: "↗", builtInStage: 4 },
  { id: "activity", label: "Activity", icon: "□", builtInStage: 10 },
  { id: "settings", label: "Settings", icon: "⚙", builtInStage: 1 },
];

const CURRENT_STAGE = 2;

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
                {role === "provider"
                  ? <>Stage 2 is built: post, edit, withdraw, re-publish and duplicate requirements from the Requirements tab. Next: Stage 3 builds property submission and matching.</>
                  : <>Stage 2 built the Requirements flow for care providers. Next: Stage 3 builds property submission and matching.</>}
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
                {role === "partner" ? "Browsing requirements — coming in Stage 3" : "BBC requirement oversight — not part of the current build"}
              </h2>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                {role === "partner"
                  ? "Requirements now exist on the platform (created by care providers). Property partners will be able to browse and submit against them once Stage 3 (property submission) is built."
                  : "BBC does not review or approve requirements — they go live directly. There is no BBC action needed here."}
              </p>
            </section>
          </div>
        )}

        {view === "settings" && (
          <div className="page-content">
            <section className="panel" style={{ padding: 26 }}>
              <h2 style={{ fontSize: 16, marginBottom: 14 }}>Account settings</h2>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>Editable in a later stage. Currently read-only, reflecting what you entered at registration.</p>
            </section>
          </div>
        )}

        {view !== "overview" && view !== "settings" && view !== "requirements" && (
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
          onClose={() => setReqModal(null)}
          onEdit={() => openEditRequirement(requirements.find(r => r.id === selectedReq.id) || selectedReq)}
          onWithdraw={() => withdrawRequirement(selectedReq)}
          onRePublish={() => rePublishRequirement(selectedReq)}
          onDuplicate={() => duplicateAndOpen(requirements.find(r => r.id === selectedReq.id) || selectedReq)}
        />
      )}

      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}
