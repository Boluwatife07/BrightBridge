"use client";

import { useState } from "react";
import { ViewingRecord } from "../lib/types";

function Status({ tone, children }: { tone: "green" | "amber" | "grey" | "red"; children: React.ReactNode }) {
  return <span className={`status ${tone}`}>{children}</span>;
}
const viewingTone = (s: ViewingRecord["status"]): "green" | "amber" | "grey" | "red" =>
  s === "Confirmed" || s === "Completed" ? "green" : s === "Reschedule needed" ? "red" : s === "Cancelled" ? "grey" : "amber";

/* ---------------------------------------------------------------------------
   Offer dates form — used by the partner both for a fresh request and when
   a reschedule is needed. Up to three date/time slots.
--------------------------------------------------------------------------- */

function OfferDatesForm({ onSubmit, onCancel }: { onSubmit: (dates: string[]) => void; onCancel: () => void }) {
  const [slots, setSlots] = useState([{ date: "", time: "" }, { date: "", time: "" }, { date: "", time: "" }]);
  const setSlot = (i: number, k: "date" | "time", v: string) => setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  const formatted = slots.filter(s => s.date).map(s =>
    `${new Date(s.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}${s.time ? `, ${s.time}` : ""}`);

  return (
    <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: "var(--surface)" }}>
      <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>Offer up to three dates. The care provider will pick one.</p>
      {slots.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input type="date" value={s.date} onChange={e => setSlot(i, "date", e.target.value)}
            style={{ flex: 2, border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", fontSize: 12 }} />
          <input type="time" value={s.time} onChange={e => setSlot(i, "time", e.target.value)}
            style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", fontSize: 12 }} />
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <button type="button" className="secondary" style={{ fontSize: 11 }} onClick={onCancel}>Cancel</button>
        <button type="button" className="primary" style={{ fontSize: 11 }} disabled={formatted.length === 0} onClick={() => onSubmit(formatted)}>Send to care provider</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Main Viewings list — role determines which actions are shown
--------------------------------------------------------------------------- */

export function ViewingsList({
  role, viewings, onPickDate, onDeclineDates, onOfferDates, onCancel,
}: {
  role: "provider" | "partner" | "bbc";
  viewings: ViewingRecord[];
  onPickDate: (v: ViewingRecord, date: string) => void;
  onDeclineDates: (v: ViewingRecord, note: string) => void;
  onOfferDates: (v: ViewingRecord, dates: string[]) => void;
  onCancel: (v: ViewingRecord, reason: string) => void;
}) {
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineText, setDeclineText] = useState("");
  const [offeringId, setOfferingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelText, setCancelText] = useState("");

  if (viewings.length === 0) {
    return (
      <div className="page-content">
        <div className="page-toolbar">
          <p>
            {role === "provider" && "No viewings yet. Open a matched property to request one."}
            {role === "partner" && "No viewing requests yet. A care provider will propose a visit directly here once they want to view one of your properties."}
            {role === "bbc" && "No viewings yet."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-toolbar">
        <p>
          {role === "provider" && "Your viewing requests, agreed directly with the property source."}
          {role === "partner" && "Pick a date that works, or let the care provider know none of these do."}
          {role === "bbc" && "The care provider and property source agree dates directly. You are notified once a viewing is confirmed — no action needed."}
        </p>
      </div>

      {viewings.map(v => (
        <div className="panel" key={v.id} style={{ marginBottom: 14, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div><strong style={{ fontSize: 13 }}>{v.propertyName}</strong>{v.isSignOff && <span style={{ fontSize: 10, marginLeft: 8, padding: "2px 8px", borderRadius: 10, background: "var(--purple-soft)", color: "var(--purple)", fontWeight: 700 }}>SIGN-OFF VISIT</span>}<div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{v.id} · {v.reqId || "—"}</div></div>
            <Status tone={viewingTone(v.status)}>{v.status}</Status>
          </div>

          {v.requestMessage && <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}><em>&quot;{v.requestMessage}&quot;</em></p>}
          {v.offeredDates.length > 0 && (
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
              Dates offered: <strong style={{ color: "var(--ink)" }}>{v.offeredDates.join(" · ")}</strong>
            </p>
          )}
          {v.declineNote && <p style={{ fontSize: 12, color: "#c23b3b", marginBottom: 8 }}>{v.declineNote}</p>}
          {v.confirmedDate && <p style={{ fontSize: 12, color: "var(--green)", fontWeight: 700, marginBottom: 8 }}>Confirmed for {v.confirmedDate}</p>}
          {v.status === "Cancelled" && <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Cancelled by {v.cancelledBy === "provider" ? "the care provider" : "the property source"}{v.cancelReason ? `: ${v.cancelReason}` : "."}</p>}

          {/* ---------------- BBC: pure observer ---------------- */}
          {role === "bbc" && v.status === "Requested" && <p style={{ fontSize: 11, color: "var(--muted)" }}>Waiting on the property source to offer dates. No action needed from you.</p>}
          {role === "bbc" && v.status === "Dates offered" && <p style={{ fontSize: 11, color: "var(--muted)" }}>Waiting on the care provider to pick a date.</p>}
          {role === "bbc" && v.status === "Reschedule needed" && <p style={{ fontSize: 11, color: "var(--muted)" }}>None of the dates worked. Waiting on the property source to offer new ones.</p>}
          {role === "bbc" && v.status === "Confirmed" && <p style={{ fontSize: 11, color: "var(--muted)" }}>Agreed directly between the care provider and property source.</p>}

          {/* ---------------- Partner: offers dates, can cancel ---------------- */}
          {role === "partner" && (v.status === "Requested" || v.status === "Reschedule needed") && offeringId !== v.id && (
            <button className="primary" style={{ fontSize: 11 }} onClick={() => setOfferingId(v.id)}>Offer dates</button>
          )}
          {role === "partner" && offeringId === v.id && (
            <OfferDatesForm onCancel={() => setOfferingId(null)} onSubmit={dates => { onOfferDates(v, dates); setOfferingId(null); }} />
          )}
          {role === "partner" && v.status === "Dates offered" && <p style={{ fontSize: 11, color: "var(--muted)" }}>Waiting on the care provider to pick a date.</p>}
          {role === "partner" && v.status === "Confirmed" && cancellingId !== v.id && (
            <button className="secondary" style={{ fontSize: 11, color: "#c23b3b" }} onClick={() => setCancellingId(v.id)}>Cancel this viewing</button>
          )}

          {/* ---------------- Provider: picks a date, can decline or cancel ---------------- */}
          {role === "provider" && v.status === "Requested" && <p style={{ fontSize: 11, color: "var(--muted)" }}>Waiting on the property source to offer dates.</p>}
          {role === "provider" && v.status === "Dates offered" && decliningId !== v.id && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {v.offeredDates.map(d => <button key={d} className="secondary" style={{ fontSize: 11 }} onClick={() => onPickDate(v, d)}>Confirm {d}</button>)}
              <button className="secondary" style={{ fontSize: 11, color: "#c23b3b" }} onClick={() => setDecliningId(v.id)}>None of these work</button>
            </div>
          )}
          {role === "provider" && v.status === "Reschedule needed" && <p style={{ fontSize: 11, color: "var(--muted)" }}>Waiting on the property source to offer new dates.</p>}
          {role === "provider" && v.status === "Confirmed" && cancellingId !== v.id && (
            <button className="secondary" style={{ fontSize: 11, color: "#c23b3b" }} onClick={() => setCancellingId(v.id)}>Cancel this viewing</button>
          )}

          {decliningId === v.id && (
            <div style={{ marginTop: 10 }}>
              <textarea value={declineText} onChange={e => setDeclineText(e.target.value)} placeholder="What would work instead? (optional)"
                style={{ width: "100%", minHeight: 60, border: "1px solid var(--line)", borderRadius: 9, padding: 10, fontSize: 12, fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="secondary" style={{ fontSize: 11 }} onClick={() => { setDecliningId(null); setDeclineText(""); }}>Cancel</button>
                <button className="primary" style={{ fontSize: 11 }} onClick={() => { onDeclineDates(v, declineText.trim()); setDecliningId(null); setDeclineText(""); }}>Send to property source</button>
              </div>
            </div>
          )}

          {cancellingId === v.id && (
            <div style={{ marginTop: 10 }}>
              <textarea value={cancelText} onChange={e => setCancelText(e.target.value)} placeholder="Reason for cancelling (optional)"
                style={{ width: "100%", minHeight: 60, border: "1px solid var(--line)", borderRadius: 9, padding: 10, fontSize: 12, fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="secondary" style={{ fontSize: 11 }} onClick={() => { setCancellingId(null); setCancelText(""); }}>Keep viewing</button>
                <button className="secondary" style={{ fontSize: 11, color: "#c23b3b" }} onClick={() => { onCancel(v, cancelText.trim()); setCancellingId(null); setCancelText(""); }}>Cancel viewing</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
