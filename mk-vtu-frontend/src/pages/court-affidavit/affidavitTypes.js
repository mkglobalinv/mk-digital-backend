import {
  Calendar, Edit3, User, ShieldCheck, AlertCircle, Heart, Home, FileText,
} from 'lucide-react';

/**
 * Court Affidavit — data model.
 *
 * Source of truth: user-supplied screenshots of a reference implementation
 * (idgate360.com.ng/services — used purely as UI/UX and content reference,
 * not integrated with or copied from in any technical sense) plus the
 * accompanying written specification. Nothing here is shared with, derived
 * from, or connected to the Birth Attestation Letter service — this is a
 * fully independent draft.
 */

// Nigeria's 36 states + FCT — factual, fixed list (not an invented dataset),
// needed for State of Origin / Wrong State / Correct State selectors.
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'Federal Capital Territory', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
  'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
  'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
];

export const COURT_TYPE_OPTIONS = [
  'Federal High Court', 'State High Court', 'Magistrates Court',
  'Customary Court', 'Area Court',
];

// Not shown open in any screenshot — no options were visible to copy.
// Using a minimal, standard set as a placeholder; confirm/adjust before this
// is finalized (see final report).
export const GENDER_OPTIONS = ['Male', 'Female'];
export const TITLE_OPTIONS = ['Mr.', 'Mrs.', 'Miss', 'Ms.', 'Dr.'];
export const RELIGION_OPTIONS = ['Christianity', 'Islam', 'Traditional', 'Other'];

// Sections A/B/C are identical across every type (per spec + screenshots).
// D is reserved exclusively for "Parents Information" (Declaration of Age
// only) — every other type skips straight from C to E, matching the letter
// badges shown in the screenshots exactly (not sequential per-type).
const COURT_INFO_SECTION = {
  letter: 'A',
  title: 'Court Information',
  fields: [
    { name: 'courtName', label: 'Court Name', required: true, placeholder: 'e.g. Lagos State High Court' },
    { name: 'courtType', label: 'Court Type', required: true, type: 'select', options: COURT_TYPE_OPTIONS, placeholder: 'Select court type...' },
    { name: 'judicialDivision', label: 'Judicial Division / Magisterial District', required: true, placeholder: 'e.g. Lagos Judicial Division' },
  ],
};

const PERSONAL_INFO_SECTION = {
  letter: 'B',
  title: 'Personal Information',
  fields: [
    { name: 'gender', label: 'Gender', required: true, type: 'select', options: GENDER_OPTIONS, placeholder: 'Select...', col: 1 },
    { name: 'title', label: 'Title', required: true, type: 'select', options: TITLE_OPTIONS, placeholder: 'Select...', col: 2 },
    { name: 'surname', label: 'Surname', required: true, placeholder: 'Last name', col: 1 },
    { name: 'firstName', label: 'First Name', required: true, placeholder: 'First name', col: 2 },
    { name: 'middleName', label: 'Middle Name', required: false, placeholder: 'Middle name', col: 1 },
    { name: 'maidenName', label: 'Maiden Name', required: false, placeholder: 'Maiden / family name', col: 2 },
    { name: 'currentAddress', label: 'Current Address', required: true, placeholder: 'House No., Street, City, State' },
    // Not shown in the reference screenshots — added because the shared
    // Assisted Service backend (processAssistedIdentityService) requires a
    // whatsappNumber to create the request; this also doubles as the number
    // used for the post-submission WhatsApp handoff, same as every other
    // assisted service in this app.
    { name: 'phoneNumber', label: 'Phone Number', required: true, type: 'tel', placeholder: 'e.g. 08012345678' },
    { name: 'religion', label: 'Religion', required: true, type: 'select', options: RELIGION_OPTIONS, placeholder: 'Select...', col: 1 },
    { name: 'placeOfOrigin', label: 'Place of Origin', required: true, placeholder: 'Town/Village of origin', col: 2 },
    { name: 'stateOfOrigin', label: 'State of Origin', required: true, type: 'select', options: NIGERIAN_STATES, placeholder: 'Select state...' },
    { name: 'localGovernment', label: 'Local Government', required: true, placeholder: 'LGA', col: 1 },
    { name: 'town', label: 'Town', required: true, placeholder: 'Town', col: 2 },
    { name: 'passportPhotograph', label: 'Passport Photograph', required: false, type: 'file', accept: 'image/jpeg,image/png', maxSizeMB: 3, helpText: 'JPG/PNG, max 3MB' },
  ],
};

const DOB_SECTION = {
  letter: 'C',
  title: 'Date of Birth',
  fields: [
    { name: 'dateOfBirth', label: 'Date of Birth', required: true, type: 'date' },
  ],
};

const PARENTS_INFO_SECTION = {
  letter: 'D',
  title: "Parents Information",
  groups: [
    {
      heading: 'FATHER',
      fields: [
        { name: 'fatherSurname', label: 'Surname', required: true, placeholder: "Father's surname", col: 1 },
        { name: 'fatherFirstName', label: 'First Name', required: true, placeholder: "Father's first name", col: 2 },
      ],
    },
    {
      heading: 'MOTHER',
      fields: [
        { name: 'motherSurname', label: 'Surname', required: true, placeholder: "Mother's surname", col: 1 },
        { name: 'motherFirstName', label: 'First Name', required: true, placeholder: "Mother's first name", col: 2 },
        { name: 'motherMaidenName', label: "Mother's Maiden Name", required: false, placeholder: "Mother's maiden / family name" },
      ],
    },
  ],
};

const BIRTH_DETAILS_SECTION = {
  letter: 'E',
  title: 'Birth Details',
  fields: [
    { name: 'locationOfBirth', label: 'Location of Birth', required: true, placeholder: 'e.g. General Hospital, Lagos' },
  ],
};

export const AFFIDAVIT_TYPES = [
  {
    id: 'date-of-birth-affidavit',
    name: 'Date of Birth Affidavit',
    description: 'Confirm your date of birth for official use',
    icon: Calendar,
    tint: { bg: 'rgba(59,130,246,0.1)', color: '#2563EB' },
    extraSections: [BIRTH_DETAILS_SECTION],
  },
  {
    id: 'name-correction-affidavit',
    name: 'Name Correction Affidavit',
    description: 'Correct discrepancies in name across documents',
    icon: Edit3,
    tint: { bg: 'rgba(249,115,22,0.1)', color: '#EA580C' },
    extraSections: [{
      letter: 'E',
      title: 'Correction Details',
      fields: [
        { name: 'nameOnDocumentIncorrect', label: 'Name on Document (incorrect)', required: true, placeholder: 'Name as it wrongly appears' },
        { name: 'correctName', label: 'Correct Name', required: true, placeholder: 'Your correct name' },
        { name: 'documentName', label: 'Document Name', required: true, placeholder: 'e.g. National ID, School Certificate' },
      ],
    }],
  },
  {
    id: 'change-of-name-affidavit',
    name: 'Change of Name Affidavit',
    description: 'Formally adopt a new name and notify the public',
    icon: User,
    tint: { bg: 'rgba(168,85,247,0.1)', color: '#9333EA' },
    extraSections: [{
      letter: 'E',
      title: 'Name Change Details',
      fields: [
        { name: 'formerName', label: 'Former Name (Old Name)', required: true, placeholder: 'Name as previously used' },
        { name: 'newName', label: 'New Name', required: true, placeholder: 'Name to be adopted henceforth' },
      ],
    }],
  },
  {
    id: 'declaration-of-age',
    name: 'Declaration of Age',
    description: 'Swear to your correct age for legal purposes',
    icon: ShieldCheck,
    tint: { bg: 'rgba(34,197,94,0.1)', color: '#16A34A' },
    extraSections: [PARENTS_INFO_SECTION, BIRTH_DETAILS_SECTION],
  },
  {
    id: 'affidavit-correction-date-of-birth',
    name: 'Affidavit for Correction of Date of Birth',
    description: 'Correct a wrong date of birth on official documents',
    icon: AlertCircle,
    tint: { bg: 'rgba(239,68,68,0.1)', color: '#DC2626' },
    extraSections: [{
      letter: 'E',
      title: 'Date of Birth Correction Details',
      fields: [
        { name: 'documentName', label: 'Document Name', required: true, placeholder: 'e.g. NIN, WAEC Certificate, Passport' },
        { name: 'wrongDateOfBirth', label: 'Wrong Date of Birth', required: true, type: 'date', col: 1 },
        { name: 'correctDateOfBirth', label: 'Correct Date of Birth', required: true, type: 'date', col: 2 },
        { name: 'nameOfInstitution', label: 'Name of Institution', required: true, placeholder: 'e.g. NIMC, WAEC, NPC' },
      ],
    }],
  },
  {
    id: 'affidavit-of-marriage',
    name: 'Affidavit of Marriage',
    description: 'Confirm traditional marriage for official record',
    icon: Heart,
    tint: { bg: 'rgba(236,72,153,0.1)', color: '#DB2777' },
    extraSections: [{
      letter: 'E',
      title: 'Marriage Details',
      fields: [
        { name: 'spouseFullName', label: "Spouse's Full Name", required: true, placeholder: "Spouse's full name" },
        { name: 'spouseAddress', label: "Spouse's Address", required: true, placeholder: "Spouse's residential address" },
        { name: 'dateOfMarriage', label: 'Date of Marriage', required: true, type: 'date' },
        { name: 'marriageLocation', label: 'Marriage Location', required: true, placeholder: 'Address where marriage took place' },
        { name: 'tribeCustom', label: 'Tribe / Custom', required: true, placeholder: 'e.g. Yoruba, Igbo, Hausa' },
      ],
    }],
  },
  {
    id: 'affidavit-correction-state-of-origin',
    name: 'Affidavit for Correction of State of Origin',
    description: 'Correct wrong state of origin on official documents',
    icon: Home,
    tint: { bg: 'rgba(20,184,166,0.1)', color: '#0D9488' },
    extraSections: [{
      letter: 'E',
      title: 'State of Origin Correction Details',
      fields: [
        { name: 'documentName', label: 'Document Name', required: true, placeholder: 'e.g. NIN, Staff ID, Certificate' },
        { name: 'wrongState', label: 'Wrong State (as captured)', required: true, type: 'select', options: NIGERIAN_STATES, placeholder: 'Select state...', col: 1 },
        { name: 'correctState', label: 'Correct State', required: true, type: 'select', options: NIGERIAN_STATES, placeholder: 'Select state...', col: 2 },
        { name: 'nameOfInstitution', label: 'Name of Institution', required: true, placeholder: 'e.g. NIMC, NNPC, Federal Ministry' },
      ],
    }],
  },
  {
    id: 'other-affidavit-of-fact',
    name: 'Other (Affidavit of Fact)',
    description: 'General sworn statement for other legal purposes',
    icon: FileText,
    tint: { bg: 'rgba(100,116,139,0.1)', color: '#475569' },
    extraSections: [{
      letter: 'E',
      title: 'Statement of Facts',
      fields: [
        { name: 'statementOfFacts', label: 'Write your statement', required: true, type: 'textarea', placeholder: 'Write the facts you wish to swear to. Be specific and detailed.' },
      ],
    }],
  },
];

export const getAffidavitType = (id) => AFFIDAVIT_TYPES.find((t) => t.id === id) || null;

// Full section list for a given type: A, B, C are always shared; D/E come
// from the type's own extraSections.
export const getSectionsForType = (id) => {
  const type = getAffidavitType(id);
  if (!type) return [];
  return [COURT_INFO_SECTION, PERSONAL_INFO_SECTION, DOB_SECTION, ...type.extraSections];
};
