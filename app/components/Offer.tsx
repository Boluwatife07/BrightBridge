"use client";

import { useState } from "react";
import { OfferRound, LEASE_TERMS } from "../lib/types";

function Status({ tone, children }: { tone: "green" | "amber" | "grey" | "red"; children: React.ReactNode }) {
  return <span className={`status ${tone}`}>{children}</span>;
}
const offerTone = (s: OfferRound["status"]): "green" | "amber" | "grey" | "red" =>
  s === "Accepted" ? "green" : s === "Rejected" || s === "Withdrawn" ? "red" : s === "Countered" ? "grey" : "amber";

/* ---------------------------------------------------------------------------
   Offer / counter form — shared by the initial offer, a counter, and a
   fresh offer after a rejection or withdrawal.
--------------------------------------------------------------------------- */

function OfferForm({ title, blurb, onSubmit, onCancel }: {
  title: string; blurb: string; onSubmit: (rent: string, leaseLength: string, message: string) => void; onCancel?: () => void;
}) {
  const [rent, setRent] = useState("");
  const [leaseLength, setLeaseLength] = useState("");
  const [message, setMessage] = useState("");
  const canSubmit = rent.trim() && leaseLength;

  return (
    <div className="modal-section">
      <h3>{title}</h3>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{blurb}</p>
      <div className="form" style={{ padding: 0 }}>
        <div className="field"><label>Rent</label>
          <input value={rent} onChange={e => setRent(e.target.value)} placeholder="£3,300 pcm" /></div>
        <div className="field"><label>Lease length</label>
          <select value={leaseLength} onChange={e => setLeaseLength(e.target.value)}>
            <option value="">Select</option>
            {LEASE_TERMS.map(t => <option key={t}>{t}</option>)}
          </select></div>
        <div className="field full"><label>Message (optional)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Any context for this number" /></div>
      </div>
      <div className="form-actions">
        {onCancel && <button className="secondary" onClick={onCancel}>Cancel</button>}
        <button className="primary" disabled={!canSubmit} onClick={() => onSubmit(rent.trim(), leaseLength, message.trim())}>Send</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   History row — one line per past round
--------------------------------------------------------------------------- */

function OfferHistory({ offers, myRole }: { offers: OfferRound[]; myRole: "provider" | "partner" | "bbc" }) {
  const label = (actor: "provider" | "partner") =>
    myRole === "bbc" ? (actor === "provider" ? "Care provider" : "Property source") :
    myRole === actor ? "You" : (actor === "provider" ? "Care provider" : "Property source");

  return (
    <div style={{ marginBottom: 14 }}>
      {offers.map(o => (
        <div key={o.id} style={{ padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12 }}><strong>{label(o.actor)}</strong> · {o.rent} on a {o.leaseLength} lease</span>
            <Status tone={offerTone(o.status)}>{o.status}</Status>
          </div>
          {o.message && <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0" }}>{o.message}</p>}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Main step — reads the latest round and decides what to show
--------------------------------------------------------------------------- */

export function OfferStep({
  role, offers, onSubmitOffer, onAccept, onCounter, onReject, onWithdraw,
}: {
  role: "provider" | "partner" | "bbc";
  offers: OfferRound[];
  onSubmitOffer: (rent: string, leaseLength: string, message: string) => void;
  onAccept: () => void;
  onCounter: (rent: string, leaseLength: string, message: string) => void;
  onReject: (message: string) => void;
  onWithdraw: () => void;
}) {
  const [countering, setCountering] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectMsg, setRejectMsg] = useState("");

  if (offers.length === 0) {
    if (role === "provider") {
      return <OfferForm title="Make an offer" blurb="Propose the rent and lease length. This goes directly to the property source." onSubmit={onSubmitOffer} />;
    }
    return (
      <div className="modal-section">
        <p style={{ fontSize: 12, color: "var(--muted)" }}>Waiting on the care provider to make an offer.</p>
      </div>
    );
  }

  const latest = offers[offers.length - 1];
  const myTurn = latest.status === "Offered" && latest.actor !== role;

  return (
    <div className="modal-section">
      <h3>Offer</h3>
      <OfferHistory offers={offers} myRole={role} />

      {latest.status === "Accepted" && (
        <p style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>Agreed: {latest.rent} on a {latest.leaseLength} lease.</p>
      )}

      {latest.status === "Offered" && !myTurn && (
        <p style={{ fontSize: 12, color: "var(--muted)" }}>Waiting on {role === "bbc" ? (latest.actor === "provider" ? "the property source" : "the care provider") : "the other side"} to respond.</p>
      )}

      {/* Partner responding to the provider's live offer */}
      {role === "partner" && myTurn && !countering && !rejecting && (
        <div className="form-actions" style={{ padding: "0", borderTop: "none" }}>
          <button className="secondary" style={{ color: "#c23b3b" }} onClick={() => setRejecting(true)}>Reject</button>
          <button className="secondary" onClick={() => setCountering(true)}>Counter</button>
          <button className="primary" onClick={onAccept}>Accept</button>
        </div>
      )}

      {/* Provider responding to the partner's counter */}
      {role === "provider" && myTurn && !countering && (
        <div className="form-actions" style={{ padding: "0", borderTop: "none" }}>
          <button className="secondary" style={{ color: "#c23b3b" }} onClick={onWithdraw}>Withdraw</button>
          <button className="secondary" onClick={() => setCountering(true)}>Counter</button>
          <button className="primary" onClick={onAccept}>Accept</button>
        </div>
      )}

      {countering && (
        <OfferForm title="Counter" blurb="Propose different terms. This goes directly to the other side."
          onCancel={() => setCountering(false)}
          onSubmit={(rent, leaseLength, message) => { onCounter(rent, leaseLength, message); setCountering(false); }} />
      )}

      {rejecting && (
        <div style={{ marginTop: 10 }}>
          <textarea value={rejectMsg} onChange={e => setRejectMsg(e.target.value)} placeholder="Why is this not going to work? (optional)"
            style={{ width: "100%", minHeight: 60, border: "1px solid var(--line)", borderRadius: 9, padding: 10, fontSize: 12, fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="secondary" onClick={() => { setRejecting(false); setRejectMsg(""); }}>Cancel</button>
            <button className="secondary" style={{ color: "#c23b3b" }} onClick={() => { onReject(rejectMsg.trim()); setRejecting(false); setRejectMsg(""); }}>Confirm reject</button>
          </div>
        </div>
      )}

      {(latest.status === "Rejected" || latest.status === "Withdrawn") && role === "provider" && (
        <OfferForm title="Make a new offer" blurb="Propose fresh terms to restart the negotiation." onSubmit={onSubmitOffer} />
      )}
      {(latest.status === "Rejected" || latest.status === "Withdrawn") && role !== "provider" && (
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          {latest.status === "Rejected"
            ? (role === "bbc" ? "The property source rejected the offer." : "You rejected the offer. Waiting to see if the care provider makes a new one.")
            : "The care provider withdrew their offer."}
        </p>
      )}
    </div>
  );
}
