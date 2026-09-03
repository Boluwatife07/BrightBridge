"use client";

import { useState } from "react";

/**
 * Gates heads of terms preparation until the landlord is on the platform.
 * Per Property Partner PRD 3.4-3.6: the introducer cannot agree to heads of
 * terms or sign a lease on someone else's property, so before BBC can draft
 * the document, the landlord needs to be invited and join directly.
 */
export function InviteLandlordPanel({
  role, isIntroducerHere, propertyName, onInvite,
}: {
  role: "bbc" | "provider" | "partner";
  /** true if the CURRENT partner persona is the introducer on THIS property
   *  (not some other landlord/introducer who happens to also be role="partner") */
  isIntroducerHere: boolean;
  propertyName: string;
  onInvite: (name: string, email: string, phone: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const canSend = name.trim() && email.trim() && phone.trim();

  if (role === "partner" && isIntroducerHere) {
    return (
      <div className="modal-section">
        <h3>Invite the landlord</h3>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14, lineHeight: 1.6 }}>
          Before BrightBridge can prepare heads of terms for {propertyName}, the landlord needs to be on the platform to
          review and agree to the terms directly — this isn&apos;t something you can do on their behalf. Once they join,
          they become the active party on this property and you&apos;ll see the deal progress here as a read-only observer,
          same as always for your introduction fee.
        </p>
        <div className="form" style={{ padding: 0 }}>
          <div className="field"><label>Landlord&apos;s name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" /></div>
          <div className="field"><label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="landlord@email.com" /></div>
          <div className="field"><label>Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XXX XXXXXX" /></div>
        </div>
        <div className="form-actions" style={{ padding: "14px 0 0", borderTop: "none" }}>
          <button className="primary" disabled={!canSend} onClick={() => canSend && onInvite(name.trim(), email.trim(), phone.trim())}>
            Send invitation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-section">
      <p style={{ fontSize: 12, color: "var(--muted)" }}>
        {role === "provider"
          ? "The property source is bringing the landlord onto the platform before heads of terms can be prepared."
          : role === "partner"
            ? "The introducer is bringing the landlord onto the platform. You'll be able to act on this property once they've joined."
            : "Waiting on the introducer to invite the landlord onto the platform."}
      </p>
    </div>
  );
}

/** Small read-only banner shown to the introducer once the landlord has
 *  taken over, so it's never ambiguous why they can't act anymore. */
export function IntroducerReadOnlyBanner({ landlordName }: { landlordName: string }) {
  return (
    <div style={{ margin: "0 24px 16px", padding: "12px 14px", borderRadius: 10, background: "var(--surface)", fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
      <strong style={{ color: "var(--ink)" }}>{landlordName}</strong> joined the platform and is now the active party on this deal.
      You can follow its progress here, but the landlord handles everything from here on. Your introduction fee is tracked automatically at completion.
    </div>
  );
}
