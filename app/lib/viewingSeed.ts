import { ViewingRecord, nextId } from "./types";

/** A fresh viewing request. Only the provider's message is set at creation —
 *  per Care Provider PRD Phase 4, the provider does not propose dates. The
 *  property source offers availability once they receive the request. */
export function blankViewingRequest(propertyId: string, propertyName: string, reqId: string | null, message: string): ViewingRecord {
  return {
    id: nextId("VIEW"),
    propertyId, propertyName, reqId,
    isSignOff: false,
    requestMessage: message,
    offeredDates: [],
    declineNote: null,
    confirmedDate: null,
    cancelledBy: null,
    cancelReason: "",
    status: "Requested",
    createdOn: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
  };
}

/* One seed viewing already confirmed, so the Viewings tab has something real
   to show for every role without requiring a fresh demo walkthrough first.
   Tied to PROP-231 / REQ-1048, the same pairing used elsewhere in seed data. */
export const seedViewings: ViewingRecord[] = [
  {
    id: "VIEW-1", propertyId: "PROP-231", propertyName: "Detached home, Penn", reqId: "REQ-1048",
    isSignOff: false,
    requestMessage: "We will bring our estates manager and compliance officer.",
    offeredDates: ["Mon 17 Aug, 10:00", "Wed 19 Aug, 14:00", "Thu 20 Aug, 11:00"],
    declineNote: null,
    confirmedDate: "Wed 19 Aug, 14:00",
    cancelledBy: null,
    cancelReason: "",
    status: "Confirmed",
    createdOn: "12 Aug 2026",
  },
];
