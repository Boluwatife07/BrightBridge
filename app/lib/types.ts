/* ---------------------------------------------------------------------------
   BrightBridge Connect — core data model
   Built from: Care Provider PRD v4.0, Property Partner PRD v1.0
   This is the single source of truth for shapes used across the platform.
--------------------------------------------------------------------------- */

export type Role = "provider" | "partner" | "bbc";

/* ===========================================================================
   Accounts
   One account type per role. Ownership (landlord vs introducer) is recorded
   per PROPERTY, not per account — see PropertyRecord.ownership below.
=========================================================================== */

export type ProviderAccount = {
  id: string;
  kind: "provider";
  organisationName: string;
  contactName: string;
  jobTitle: string;
  email: string;
  phone: string;
  services: string[];
  coverageAreas: string[];
};

export type PartnerAccount = {
  id: string;
  kind: "partner";
  fullName: string;
  email: string;
  phone: string;
  companyName: string; // blank if individual landlord
  coverageAreas: string[];
  propertyTypes: string[];
  /** true once this account has been created via a landlord-invitation link
   *  rather than self-registration. Informational only — behaviour is the
   *  same either way once the account exists. */
  invitedByIntroducerId?: string;
};

export type Account = ProviderAccount | PartnerAccount;

export const SERVICES = [
  "Supported living",
  "Children's home",
  "Residential care",
  "Semi-independent (16-25)",
  "Temporary and emergency accommodation",
  "Housing management (RSL)",
  "Local authority commissioning",
] as const;

export const LOCATIONS = [
  "Warrington", "St Helens", "Wider Cheshire", "Greater Manchester",
  "Yorkshire", "West Midlands", "Staffordshire", "North London", "North West",
] as const;

export const PARTNER_PROPERTY_TYPES = [
  "Family home (2-3 bed)", "HMO (up to 6 bed)", "Larger format (7+ bed)",
  "Bungalow", "Self-contained flats",
] as const;

/* ===========================================================================
   Requirements  (Care Provider PRD, Phase 2)
=========================================================================== */

export type RequirementStatus = "Draft" | "Open" | "Withdrawn";

export type RequirementRecord = {
  id: string;
  operatorAccountId: string;
  title: string;
  area: string;
  serviceType: string;
  residentGroup: string;
  propertyType: string;
  bedrooms: string | number;
  bathrooms: string | number;
  capacity: string;
  budget: string;
  leaseMin: string;
  leaseMax: string;
  neededBy: string;
  accessibility: string[];
  features: string[];
  extraDocs: string[];
  notes: string;
  status: RequirementStatus;
  matchedPropertyIds: string[];
  postedOn: string;
  createdOn: string;
};

export const ACCESSIBILITY_OPTIONS = [
  "Ground floor bedroom", "Wheelchair accessible", "Wet room",
  "Step-free access", "Wider doorways", "Ceiling track hoist",
] as const;

export const FEATURE_OPTIONS = [
  "Outdoor space", "Off-street parking", "Garage",
  "Separate staff/sleep-in room", "Close to public transport", "Two reception rooms",
] as const;

export const LEASE_TERMS = ["3 years", "5 years", "7 years", "10 years", "15 years"] as const;

export const RESIDENT_GROUPS = ["Adults (18+)", "Young people (16-25)", "Children (under 16)", "Mixed"] as const;

/* ===========================================================================
   Documents  (shared standard set, referenced by requirement, property, HoT)
=========================================================================== */

export type DocState = "Requested" | "Being obtained" | "On file" | "Released";

export type DocItem = {
  id: string;
  label: string;
  standard: boolean;
  askedForBy: "" | "provider" | "requirement";
  state: DocState;
  issueDate?: string;
  expiryDate?: string;
};

export const STANDARD_DOCS = [
  "Gas safety certificate (CP12)",
  "EICR (electrical installation)",
  "EPC (energy performance)",
  "Fire risk assessment",
  "Fire alarm installation certificate",
  "HMO licence (where applicable)",
  "Legionella risk assessment",
  "Floor plan with room dimensions",
] as const;

/** The five documents that must be provided before the provider can complete
 *  compliance review (PRD Phase 9 / Care Provider PRD 5.2). */
export const REQUIRED_DOCS = STANDARD_DOCS.slice(0, 5);

export const COMMON_EXTRA_DOCS = [
  "Buildings insurance certificate", "Asbestos survey", "Boiler service record",
  "PAT testing certificate", "Planning use class confirmation", "Recent works or refurbishment record",
] as const;

/* ===========================================================================
   Viewings  (Care Provider PRD, Phase 4)
   Provider requests -> property source offers dates -> provider picks one.
   Confirms immediately, no BBC sign-off (P2 in both PRDs).
=========================================================================== */

export type ViewingStatus = "Requested" | "Dates offered" | "Confirmed" | "Reschedule needed" | "Cancelled";

export type ViewingRecord = {
  id: string;
  propertyId: string;
  propertyName: string;
  reqId: string | null;
  /** true once this is a post-works sign-off visit rather than the original viewing */
  isSignOff: boolean;
  requestMessage: string;
  offeredDates: string[];
  declineNote: string | null;
  confirmedDate: string | null;
  cancelledBy: "provider" | "partner" | null;
  cancelReason: string;
  status: ViewingStatus;
  createdOn: string;
};

/* ===========================================================================
   Schedule of works  (Care Provider PRD, Phase 5 + 8)
=========================================================================== */

export type WorksItemOwner = "To be negotiated" | "Care provider" | "Property source";

export type WorksItem = {
  id: string;
  description: string;
  responsibility: WorksItemOwner;
  essential: boolean;
  dueDate: string;
  status: "Outstanding" | "Complete";
};

/* ===========================================================================
   Viewing outcome  (Care Provider PRD, Phase 5)
=========================================================================== */

export type OutcomeChoice = "Proceeding" | "Second viewing needed" | "Not proceeding";

export const PASS_ON_REASONS = [
  "Too small", "Wrong location", "Rent too high", "Condition not suitable",
  "Layout will not work for the service", "No longer needed",
] as const;

/* ===========================================================================
   Offer  (Care Provider PRD, Phase 6)
   Structured rent/lease-length negotiation. Direct between provider and
   whichever party is active on the property (landlord or introducer).
=========================================================================== */

export type OfferStatus = "Offered" | "Countered" | "Accepted" | "Rejected" | "Withdrawn";

export type OfferRound = {
  id: string;
  round: number;
  actor: "provider" | "partner";
  rent: string;
  leaseLength: string;
  message: string;
  status: OfferStatus;
  timestamp: string;
};

/* ===========================================================================
   Heads of terms  (Care Provider PRD, Phase 7)
   Identity reveal happens HERE — the document names both real parties.
=========================================================================== */

export type HoTStatus = "Draft" | "Published" | "Countered" | "Agreed";

export type HeadsOfTerms = {
  rent: string;
  leaseLength: string;
  breakClause: string;
  rentReview: string;
  repairsLandlord: string;
  repairsTenant: string;
  alterations: string;
  worksSummary: string; // rolled up from WorksItem[] at publish time
  deposit: string;
  rentFreePeriod: string;
  permittedUse: string;
  sublettingRights: string;
  status: HoTStatus;
  counterNote: string;
  publishedOn: string;
};

/* ===========================================================================
   Fees  (Landlord Services Agreement / Introduction Agency Agreements)
=========================================================================== */

export type FeeRecord = {
  placementFeeStatus: "Not due" | "Due" | "Paid";
  placementFeeAmount: string; // "£1,800 + VAT" — landlord only
  rentalFeeStatus: "Not started" | "Active"; // 8% ongoing — landlord only
  introductionFeeStatus: "Not applicable" | "Payable" | "Paid"; // £750 inc VAT — introducer only
  introductionFeeAmount: string;
  leaseSignedOn: string;
};

/* ===========================================================================
   Deal stage  (drives the progress tracker on the property detail)
=========================================================================== */

export type DealStage =
  | "None"                 // before viewing confirmed
  | "Awaiting outcome"      // viewing confirmed, waiting on provider
  | "Not proceeding"        // terminal — provider passed after viewing
  | "Offer"                 // works list issued (or skipped), negotiating rent/length
  | "Heads of terms"        // offer accepted, BBC drafting/mediating HoT
  | "Works"                 // HoT agreed, works being completed + sign-off visit
  | "Compliance review"     // works signed off (or skipped), docs being reviewed
  | "Lease"                 // compliance confirmed, solicitors instructed
  | "Completed";            // lease signed

/* ===========================================================================
   Property ownership  (Property Partner PRD, Section 3)
   Recorded per property, not per account.
=========================================================================== */

export type Ownership =
  | { kind: "landlord" }                                   // partner owns it
  | { kind: "introducer"; landlordAccountId: string | null }; // null until landlord onboarded

export type PropertyStatus =
  | "Draft" | "Submitted" | "Accepted" | "Declined" | "Matched"
  | "Viewing requested" | "Viewing confirmed"
  | "Offer" | "Heads of terms" | "Works" | "Compliance review" | "Lease"
  | "Not proceeding" | "Withdrawn" | "Completed";

export type PermissionAnswer = "Yes" | "No" | "Not sure" | "Not applicable";

export type PropertyRecord = {
  id: string;
  partnerAccountId: string; // the submitting account (landlord OR introducer)
  ownership: Ownership;

  name: string;
  area: string;
  propertyType: string;
  bedrooms: string | number;
  bathrooms: string | number;
  condition: string;
  rent: string;
  leaseOffer: string;
  availableFrom: string;
  description: string;
  images: string[];

  // Planning & permissions (Property Partner PRD 7.3)
  hasMortgage: PermissionAnswer;
  lenderConsented: PermissionAnswer;
  isLeasehold: PermissionAnswer;
  superiorLeaseAllowsSubletting: PermissionAnswer;
  planningUseClass: string;
  hasHmoLicence: PermissionAnswer;
  article4OrLicensingAware: PermissionAnswer;

  status: PropertyStatus;
  declineReason: string;
  matchedReqId: string | null;
  documents: DocItem[];
  passedOn: { reqId: string; reason: string }[];

  dealStage: DealStage;
  viewingOutcomeNote: string;
  worksItems: WorksItem[];
  offers: OfferRound[];
  headsOfTerms: HeadsOfTerms | null;
  fees: FeeRecord;

  createdOn: string;
};

/* ===========================================================================
   Messaging  (Care Provider PRD Section 3 / Property Partner PRD Section 4)
   Group thread (all active parties, anonymised until HoT) + private BBC
   threads (one per party, never visible to the other side).
=========================================================================== */

export type ThreadKind = "group" | "private-provider" | "private-partner" | "private-introducer";

export type MessageEntry = {
  id: string;
  propertyId: string;
  thread: ThreadKind;
  authorRole: Role;
  text: string;
  timestamp: string;
};

/* ===========================================================================
   Activity timeline  (system-generated entries, Appendix A/B of both PRDs)
=========================================================================== */

export type TimelineActionType =
  | "property_matched" | "document_requested" | "document_collected" | "documents_released"
  | "property_passed_on" | "viewing_requested" | "dates_offered" | "viewing_confirmed"
  | "dates_declined" | "viewing_cancelled" | "outcome_proceeding" | "outcome_second_viewing"
  | "outcome_not_proceeding" | "works_submitted" | "works_shared" | "works_item_completed"
  | "signoff_requested" | "signoff_approved" | "snagging_raised"
  | "offer_submitted" | "offer_countered" | "offer_accepted" | "offer_rejected" | "offer_withdrawn"
  | "hot_published" | "hot_countered" | "hot_agreed"
  | "compliance_confirmed" | "compliance_issue_flagged"
  | "solicitors_instructed" | "lease_signed"
  | "landlord_invited" | "landlord_joined"
  | "bbc_message" | "property_withdrawn" | "property_accepted" | "property_declined";

export type TimelineEntry = {
  id: string;
  propertyId: string;
  actionType: TimelineActionType;
  actorRole: Role;
  message?: string;
  metadata?: Record<string, string>;
  timestamp: string;
};

/* ===========================================================================
   Notifications  (Appendix A of both PRDs)
=========================================================================== */

export type NotificationChannel = "in-app" | "email" | "in-app+email";

export type NotificationEntry = {
  id: string;
  recipientAccountId: string;
  propertyId: string;
  text: string;
  channel: NotificationChannel;
  read: boolean;
  timestamp: string;
};

/* ===========================================================================
   Small id helper — used across all seed/builder modules
=========================================================================== */

let counter = 1000;
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function today(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function now(): string {
  return new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
