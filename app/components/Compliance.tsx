"use client";

import { useState } from "react";
import { DocItem, REQUIRED_DOCS } from "../lib/types";

function Status({ tone, children }: { tone: "green" | "amber" | "grey" | "red"; children: React.ReactNode }) {
  return <span className={`status ${tone}`}>{children}</span>;
}

const isRequired = (label: string) => (REQUIRED_DOCS as readonly string[]).includes(label);

export function ComplianceStep({
  role, documents, onMarkOnFile, onReleaseAll, onFlagIssue, onConfirm,
}: {
  role: "bbc" | "provider" | "partner";
  documents: DocItem[];
  onMarkOnFile: (docId: string) => void;
  onReleaseAll: () => void;
  onFlagIssue: (docId: string, message: string) => void;
  onConfirm: () => void;
}) {
  const [flaggingId, setFlaggingId] = useState<string | null>(null);
  const [flagText, setFlagText] = useState("");

  const onFile = documents.filter(d => d.state === "On file");
  const releasedCount = documents.filter(d => d.state === "Released").length;
  const requiredReleased = REQUIRED_DOCS.filter(label => documents.find(d => d.label === label)?.state === "Released").length;
  const allRequiredReleased = requiredReleased === REQUIRED_DOCS.length;
  const hasOpenIssues = documents.some(d => d.flaggedIssue);

  return (
    <div className="modal-section">
      <h3>Compliance documents</h3>
      <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>
        {role === "provider" && "Review these before the lease is signed. Required documents must all be released and any issues resolved before you can confirm."}
        {role === "partner" && "Upload anything still outstanding. BrightBridge releases documents to the care provider once they're on file."}
        {role === "bbc" && "Release documents to the care provider once the partner has them on file."}
      </p>
      <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>{requiredReleased} of {REQUIRED_DOCS.length} required documents released · {releasedCount} of {documents.length} total released.</p>

      {documents.map(d => (
        <div key={d.id} style={{ padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>{d.label}</span>
              {isRequired(d.label) && <span style={{ color: "#c23b3b", fontSize: 10, marginLeft: 6, fontWeight: 700 }}>required</span>}
            </div>
            <Status tone={d.state === "Released" ? "green" : d.state === "On file" ? "amber" : d.flaggedIssue ? "red" : "grey"}>
              {d.flaggedIssue && d.state !== "Released" ? "Issue flagged" : d.state}
            </Status>
          </div>

          {d.flaggedIssue && (
            <p style={{ fontSize: 11, color: "#c23b3b", margin: "4px 0 0" }}>
              {role === "provider" ? "You flagged: " : "Care provider flagged: "}{d.flaggedIssue}
            </p>
          )}

          {role === "partner" && d.state !== "On file" && d.state !== "Released" && (
            <button className="secondary" style={{ fontSize: 10, padding: "5px 9px", marginTop: 6 }} onClick={() => onMarkOnFile(d.id)}>Mark as uploaded</button>
          )}

          {role === "provider" && d.state === "Released" && flaggingId !== d.id && (
            <button className="secondary" style={{ fontSize: 10, padding: "5px 9px", marginTop: 6 }} onClick={() => setFlaggingId(d.id)}>Flag an issue</button>
          )}
          {role === "provider" && flaggingId === d.id && (
            <div style={{ marginTop: 8 }}>
              <textarea value={flagText} onChange={e => setFlagText(e.target.value)} placeholder="What's wrong with this document?"
                style={{ width: "100%", minHeight: 50, border: "1px solid var(--line)", borderRadius: 8, padding: 8, fontSize: 11, fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button className="secondary" style={{ fontSize: 10 }} onClick={() => { setFlaggingId(null); setFlagText(""); }}>Cancel</button>
                <button className="primary" style={{ fontSize: 10 }} disabled={!flagText.trim()} onClick={() => { onFlagIssue(d.id, flagText.trim()); setFlaggingId(null); setFlagText(""); }}>Send</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {role === "bbc" && (
        <div className="form-actions" style={{ padding: "14px 0 0", borderTop: "none" }}>
          <button className="primary" disabled={onFile.length === 0} onClick={onReleaseAll}>
            Release {onFile.length > 0 ? `${onFile.length} document${onFile.length > 1 ? "s" : ""}` : "documents"} to the care provider
          </button>
        </div>
      )}

      {role === "provider" && (
        <div className="form-actions" style={{ padding: "14px 0 0", borderTop: "none" }}>
          <button className="primary" disabled={!allRequiredReleased || hasOpenIssues} onClick={onConfirm}>
            Confirm satisfied, ready for lease
          </button>
        </div>
      )}
      {role === "provider" && !allRequiredReleased && (
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>Waiting on the remaining required documents.</p>
      )}
      {role === "provider" && allRequiredReleased && hasOpenIssues && (
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>Waiting on a fix for the flagged document before you can confirm.</p>
      )}
    </div>
  );
}
