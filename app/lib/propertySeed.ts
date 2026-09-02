import {
  PropertyRecord, DocItem, DocState, PermissionAnswer,
  STANDARD_DOCS, nextId, today,
} from "./types";

/* ---------------------------------------------------------------------------
   Document checklist builder
   Every property carries the eight standard documents. `onFile` lets seed
   data mark some as already collected; everything else starts as
   "Being obtained" (with BBC), matching the real submission flow where a
   partner rarely has every certificate ready on day one.
--------------------------------------------------------------------------- */

export function standardDocs(onFile: boolean[] = []): DocItem[] {
  return STANDARD_DOCS.map((label, i) => ({
    id: `DOC-STD-${i}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    standard: true,
    askedForBy: "",
    state: (onFile[i] ? "On file" : "Being obtained") as DocState,
  }));
}

const blankFees = () => ({
  placementFeeStatus: "Not due" as const,
  placementFeeAmount: "£1,800 + VAT",
  rentalFeeStatus: "Not started" as const,
  introductionFeeStatus: "Not applicable" as const,
  introductionFeeAmount: "£750 inc VAT",
  leaseSignedOn: "",
});

const NP: PermissionAnswer = "Not sure";

/** A fresh, empty property for the submission form to start from. */
export function blankProperty(partnerAccountId: string, owns: boolean): PropertyRecord {
  return {
    id: nextId("PROP"),
    partnerAccountId,
    ownership: owns ? { kind: "landlord" } : { kind: "introducer", landlordAccountId: null },
    name: "", area: "", propertyType: "", bedrooms: "", bathrooms: "", condition: "",
    rent: "", leaseOffer: "", availableFrom: "", description: "", images: [],
    hasMortgage: NP, lenderConsented: NP, isLeasehold: NP, superiorLeaseAllowsSubletting: NP,
    planningUseClass: "", hasHmoLicence: NP, article4OrLicensingAware: NP,
    status: "Draft", declineReason: "", matchedReqId: null,
    documents: standardDocs(), passedOn: [],
    dealStage: "None", viewingOutcomeNote: "", worksItems: [], offers: [], headsOfTerms: null,
    fees: blankFees(),
    createdOn: today(),
  };
}

/* ---------------------------------------------------------------------------
   Seed properties
   ACC-L-201 = Sarah Whitfield, landlord. ACC-I-202 = Kush Singh, introducer.
   One of each status so both the BBC queue and the provider's matched list
   have something real to show.
--------------------------------------------------------------------------- */

export const seedProperties: PropertyRecord[] = [
  {
    id: "PROP-231", partnerAccountId: "ACC-L-201", ownership: { kind: "landlord" },
    name: "Detached home, Penn", area: "Wolverhampton, WV4", propertyType: "HMO (up to 6 bed)",
    bedrooms: 6, bathrooms: 3, condition: "Furnished", rent: "£3,450 pcm", leaseOffer: "5 to 10 years",
    availableFrom: "Immediate",
    description: "Spacious detached property recently refurbished throughout, six double bedrooms, three bathrooms, enclosed rear garden and driveway parking.",
    images: [],
    hasMortgage: "Yes", lenderConsented: "Yes", isLeasehold: "No", superiorLeaseAllowsSubletting: "Not applicable",
    planningUseClass: "C3(b)", hasHmoLicence: "No", article4OrLicensingAware: "No",
    status: "Viewing confirmed", declineReason: "", matchedReqId: "REQ-1048",
    documents: [...standardDocs([true, true, true, true, true, false, false, false]),
      { id: "DOC-REQ-1", label: "Buildings insurance certificate", standard: false, askedForBy: "requirement", state: "On file" }],
    passedOn: [],
    dealStage: "None", viewingOutcomeNote: "", worksItems: [], offers: [], headsOfTerms: null, fees: blankFees(),
    createdOn: "27 Jul 2026",
  },
  {
    id: "PROP-234", partnerAccountId: "ACC-L-201", ownership: { kind: "landlord" },
    name: "Semi-detached, Bilston", area: "Wolverhampton, WV14", propertyType: "HMO (up to 6 bed)",
    bedrooms: 6, bathrooms: 2, condition: "Furnished", rent: "£3,100 pcm", leaseOffer: "5 years minimum",
    availableFrom: "1 Sep 2026",
    description: "End of terrace converted to six bedrooms across two floors. Close to bus routes. Small rear yard.",
    images: [],
    hasMortgage: "No", lenderConsented: "Not applicable", isLeasehold: "No", superiorLeaseAllowsSubletting: "Not applicable",
    planningUseClass: "C3(b)", hasHmoLicence: "No", article4OrLicensingAware: "No",
    status: "Matched", declineReason: "", matchedReqId: "REQ-1048",
    documents: standardDocs([true, true, true, true, false, false, false, false]),
    passedOn: [],
    dealStage: "None", viewingOutcomeNote: "", worksItems: [], offers: [], headsOfTerms: null, fees: blankFees(),
    createdOn: "1 Aug 2026",
  },
  {
    id: "PROP-229", partnerAccountId: "ACC-I-202", ownership: { kind: "introducer", landlordAccountId: null },
    name: "Corner house, Hanley", area: "Stoke-on-Trent, ST1", propertyType: "Larger format (7+ bed)",
    bedrooms: 7, bathrooms: 2, condition: "Furnished", rent: "£3,900 pcm", leaseOffer: "5 years minimum",
    availableFrom: "1 Oct 2026", description: "",
    images: [],
    hasMortgage: "Not sure", lenderConsented: "Not sure", isLeasehold: "Not sure", superiorLeaseAllowsSubletting: "Not sure",
    planningUseClass: "", hasHmoLicence: "Not sure", article4OrLicensingAware: "Not sure",
    status: "Submitted", declineReason: "", matchedReqId: "REQ-1044",
    documents: standardDocs([true, true, false, true, false, false, false, false]),
    passedOn: [],
    dealStage: "None", viewingOutcomeNote: "", worksItems: [], offers: [], headsOfTerms: null, fees: blankFees(),
    createdOn: "3 Aug 2026",
  },
  {
    id: "PROP-226", partnerAccountId: "ACC-L-201", ownership: { kind: "landlord" },
    name: "Accessible bungalow", area: "Walsall, WS3", propertyType: "Family home (2-3 bed)",
    bedrooms: 4, bathrooms: 2, condition: "Unfurnished", rent: "£2,950 pcm", leaseOffer: "3 to 7 years",
    availableFrom: "Immediate", description: "",
    images: [],
    hasMortgage: "No", lenderConsented: "Not applicable", isLeasehold: "No", superiorLeaseAllowsSubletting: "Not applicable",
    planningUseClass: "C3", hasHmoLicence: "Not applicable", article4OrLicensingAware: "No",
    status: "Accepted", declineReason: "", matchedReqId: null,
    documents: standardDocs([true, false, false, false, false, false, false, false]),
    passedOn: [],
    dealStage: "None", viewingOutcomeNote: "", worksItems: [], offers: [], headsOfTerms: null, fees: blankFees(),
    createdOn: "12 Aug 2026",
  },
  {
    id: "PROP-218", partnerAccountId: "ACC-I-202", ownership: { kind: "introducer", landlordAccountId: null },
    name: "Terrace, Smethwick", area: "Smethwick, B66", propertyType: "HMO (up to 6 bed)",
    bedrooms: 5, bathrooms: 2, condition: "Needs refurbishment", rent: "£3,200 pcm", leaseOffer: "Negotiable",
    availableFrom: "1 Dec 2026", description: "Needs modernisation but good bones and a large garden.",
    images: [],
    hasMortgage: "Not sure", lenderConsented: "Not sure", isLeasehold: "Not sure", superiorLeaseAllowsSubletting: "Not sure",
    planningUseClass: "", hasHmoLicence: "Not sure", article4OrLicensingAware: "Not sure",
    status: "Declined", declineReason: "Property needs substantial refurbishment beyond what providers would accept.",
    matchedReqId: null,
    documents: standardDocs([false, false, true, false, false, false, false, false]),
    passedOn: [],
    dealStage: "None", viewingOutcomeNote: "", worksItems: [], offers: [], headsOfTerms: null, fees: blankFees(),
    createdOn: "14 Aug 2026",
  },
];

/* ---------------------------------------------------------------------------
   Common decline reasons (BBC review, PRD 8.3)
--------------------------------------------------------------------------- */

export const DECLINE_REASONS = [
  "Property does not meet minimum safety standards",
  "Location not in demand from current providers",
  "Rent significantly above market for the area",
  "Insufficient information to assess",
  "Property needs substantial refurbishment beyond what providers would accept",
  "Planning or licensing issue identified",
] as const;

export const PASS_ON_REASONS = [
  "Too small", "Wrong location", "Rent too high", "Condition not suitable",
  "Layout will not work for the service", "No longer needed",
] as const;

export const PROPERTY_TYPES = [
  "Family home (2-3 bed)", "HMO (up to 6 bed)", "Larger format (7+ bed)",
  "Bungalow", "Self-contained flats",
] as const;
