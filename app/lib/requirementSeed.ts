import { RequirementRecord, nextId, today } from "./types";

/* A handful of requirements across statuses so the Requirements screen has
   something real to show: two live, one draft, one withdrawn. All belong to
   the seeded provider account (ACC-P-101, Willow Care Group). */

export const seedRequirements: RequirementRecord[] = [
  {
    id: "REQ-1048",
    operatorAccountId: "ACC-P-101",
    title: "6 bed supported living home",
    area: "Wolverhampton",
    serviceType: "Supported living",
    residentGroup: "Adults (18+)",
    propertyType: "HMO (up to 6 bed)",
    bedrooms: 6,
    bathrooms: 3,
    capacity: "5 to 6 residents",
    budget: "£3,600 pcm",
    leaseMin: "5 years",
    leaseMax: "10 years",
    neededBy: "12 Oct 2026",
    accessibility: ["Ground floor bedroom", "Step-free access"],
    features: ["Outdoor space", "Off-street parking"],
    extraDocs: ["Buildings insurance certificate"],
    notes: "",
    status: "Open",
    matchedPropertyIds: ["PROP-231"],
    postedOn: "28 Jul 2026",
    createdOn: "26 Jul 2026",
  },
  {
    id: "REQ-1044",
    operatorAccountId: "ACC-P-101",
    title: "Children's home with garden",
    area: "Stoke-on-Trent",
    serviceType: "Children's home",
    residentGroup: "Young people (16-25)",
    propertyType: "Larger format (7+ bed)",
    bedrooms: 7,
    bathrooms: 3,
    capacity: "6 to 7 residents",
    budget: "£4,200 pcm",
    leaseMin: "5 years",
    leaseMax: "",
    neededBy: "1 Nov 2026",
    accessibility: [],
    features: ["Outdoor space", "Off-street parking"],
    extraDocs: ["Planning use class confirmation"],
    notes: "",
    status: "Open",
    matchedPropertyIds: [],
    postedOn: "4 Aug 2026",
    createdOn: "2 Aug 2026",
  },
  {
    id: "REQ-1039",
    operatorAccountId: "ACC-P-101",
    title: "Accessible 4 bed bungalow",
    area: "Walsall",
    serviceType: "Supported living",
    residentGroup: "Adults (18+)",
    propertyType: "Family home (2-3 bed)",
    bedrooms: 4,
    bathrooms: 2,
    capacity: "3 to 4 residents",
    budget: "£3,100 pcm",
    leaseMin: "5 years",
    leaseMax: "",
    neededBy: "20 Sep 2026",
    accessibility: ["Wheelchair accessible", "Wet room", "Wider doorways"],
    features: [],
    extraDocs: [],
    notes: "",
    status: "Draft",
    matchedPropertyIds: [],
    postedOn: "",
    createdOn: "18 Aug 2026",
  },
  {
    id: "REQ-1021",
    operatorAccountId: "ACC-P-101",
    title: "Semi-independent flat cluster",
    area: "Birmingham",
    serviceType: "Semi-independent (16-25)",
    residentGroup: "Young people (16-25)",
    propertyType: "Self-contained flats",
    bedrooms: 5,
    bathrooms: 5,
    capacity: "5 residents",
    budget: "£3,800 pcm",
    leaseMin: "5 years",
    leaseMax: "10 years",
    neededBy: "",
    accessibility: [],
    features: ["Close to public transport"],
    extraDocs: [],
    notes: "Prefer self-contained units over shared facilities.",
    status: "Withdrawn",
    matchedPropertyIds: [],
    postedOn: "2 Jul 2026",
    createdOn: "28 Jun 2026",
  },
];

/** A blank requirement, used both for "new" and as the base for duplication. */
export function blankRequirement(operatorAccountId: string): RequirementRecord {
  return {
    id: nextId("REQ"),
    operatorAccountId,
    title: "", area: "", serviceType: "", residentGroup: "", propertyType: "",
    bedrooms: "", bathrooms: "", capacity: "", budget: "", leaseMin: "", leaseMax: "", neededBy: "",
    accessibility: [], features: [], extraDocs: [], notes: "",
    status: "Draft",
    matchedPropertyIds: [],
    postedOn: "",
    createdOn: today(),
  };
}

/** Duplicate an existing requirement (including withdrawn ones) as a fresh
 *  draft. Per Care Provider PRD 5.4/US-REQ-08: new id, cleared status/dates/
 *  matches, everything else carried over as a starting point. */
export function duplicateRequirement(source: RequirementRecord): RequirementRecord {
  return {
    ...source,
    id: nextId("REQ"),
    status: "Draft",
    matchedPropertyIds: [],
    postedOn: "",
    createdOn: today(),
    title: source.title ? `${source.title} (copy)` : "",
  };
}
