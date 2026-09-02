import { ProviderAccount, PartnerAccount, nextId } from "./types";

/* Seed accounts used to demo each role without going through registration
   every time. In production these would not exist — every account is
   created via the registration flow. */

export const seedProviderAccount: ProviderAccount = {
  id: "ACC-P-101",
  kind: "provider",
  organisationName: "Willow Care Group",
  contactName: "Amara Nwosu",
  jobTitle: "Head of Estates",
  email: "amara@willowcare.co.uk",
  phone: "07700 900412",
  services: ["Supported living"],
  coverageAreas: ["West Midlands", "Staffordshire"],
};

/* Landlord — owns their own property, full active flow from day one. */
export const seedLandlordAccount: PartnerAccount = {
  id: "ACC-L-201",
  kind: "partner",
  fullName: "Sarah Whitfield",
  email: "sarah.whitfield@outlook.com",
  phone: "07700 900556",
  companyName: "",
  coverageAreas: ["West Midlands"],
  propertyTypes: ["HMO (up to 6 bed)", "Family home (2-3 bed)"],
};

/* Introducer — Kush's path. Does not own the properties he submits. */
export const seedIntroducerAccount: PartnerAccount = {
  id: "ACC-I-202",
  kind: "partner",
  fullName: "Kush Singh",
  email: "kush@openblock.co.uk",
  phone: "07700 900733",
  companyName: "Open Block Investments",
  coverageAreas: ["West Midlands", "Greater Manchester"],
  propertyTypes: ["HMO (up to 6 bed)", "Larger format (7+ bed)"],
};

export function blankProviderAccount(): ProviderAccount {
  return {
    id: nextId("ACC-P"),
    kind: "provider",
    organisationName: "",
    contactName: "",
    jobTitle: "",
    email: "",
    phone: "",
    services: [],
    coverageAreas: [],
  };
}

export function blankPartnerAccount(): PartnerAccount {
  return {
    id: nextId("ACC-PP"),
    kind: "partner",
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
    coverageAreas: [],
    propertyTypes: [],
  };
}
