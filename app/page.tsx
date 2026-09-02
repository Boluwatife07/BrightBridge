"use client";

import { useState } from "react";
import { RegisterProvider, RegisterPartner } from "./components/Registration";
import { ProviderAccount, PartnerAccount, Role } from "./lib/types";
import { seedProviderAccount, seedLandlordAccount, seedIntroducerAccount } from "./lib/seed";

type Screen = "landing" | "onboardProvider" | "onboardPartner" | "app";
type View = "overview" | "requirements" | "properties" | "viewings" | "activity" | "settings";

const NAV: { id: View; label: string; icon: string; builtInStage: number }[] = [
  { id: "overview", label: "Overview", icon: "⌂", builtInStage: 1 },
  { id: "requirements", label: "Requirements", icon: "▤", builtInStage: 2 },
  { id: "properties", label: "Properties", icon: "◇", builtInStage: 3 },
  { id: "viewings", label: "Viewings", icon: "↗", builtInStage: 4 },
  { id: "activity", label: "Activity", icon: "□", builtInStage: 10 },
  { id: "settings", label: "Settings", icon: "⚙", builtInStage: 1 },
];

const CURRENT_STAGE = 1;

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [view, setView] = useState<View>("overview");
  const [role, setRole] = useState<Role>("bbc");
  const [providerAccount, setProviderAccount] = useState<ProviderAccount>(seedProviderAccount);
  const [partnerAccount, setPartnerAccount] = useState<PartnerAccount>(seedLandlordAccount);
  const [partnerVariant, setPartnerVariant] = useState<"landlord" | "introducer">("landlord");

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
                Next: Stage 2 builds the Requirements flow (post, edit, withdraw, duplicate) on top of this account data.
              </div>
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

        {view !== "overview" && view !== "settings" && (
          <div className="page-content">
            <section className="panel" style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🛠</div>
              <h2 style={{ fontSize: 15 }}>{NAV.find(n => n.id === view)?.label} — coming in Stage {NAV.find(n => n.id === view)?.builtInStage}</h2>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>Not built yet. This screen is a placeholder so navigation is honest about what exists.</p>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
