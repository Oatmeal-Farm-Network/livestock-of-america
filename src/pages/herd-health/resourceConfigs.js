// src/pages/herd-health/resourceConfigs.js
/** Structured configs for each Herd Health CRUD module (sectioned forms). */

const animalSection = (extra = []) => ({
  title: 'Animal',
  fields: [
    {
      name: 'AnimalID',
      label: 'Animal from herd',
      type: 'animal',
      tagField: 'AnimalTag',
    },
    {
      name: 'AnimalTag',
      label: 'Animal tag / name',
      type: 'text',
      placeholder: 'e.g. Cow #42',
      hint: 'Used when the animal is not in the herd list yet.',
    },
    ...extra,
  ],
});

export const EVENTS = {
  resource: 'events',
  idKey: 'EventID',
  labelKey: 'Title',
  title: 'Events',
  titleKey: 'herd_health.nav_events',
  singular: 'Event',
  emptyText: 'No records yet — Add event.',
  searchKeys: ['Title', 'AnimalTag', 'EventType', 'Severity'],
  columns: [
    { key: 'EventDate', label: 'Date', format: 'date' },
    { key: 'EventType', label: 'Type' },
    { key: 'Severity', label: 'Severity' },
    { key: 'Title', label: 'Title' },
    { key: 'AnimalTag', label: 'Animal' },
  ],
  sections: [
    animalSection(),
    {
      title: 'Event details',
      fields: [
        { name: 'EventDate', label: 'Event date', type: 'date', required: true },
        {
          name: 'EventType',
          label: 'Type',
          type: 'select',
          required: true,
          options: ['Illness', 'Injury', 'Observation', 'Reproductive', 'Other'],
        },
        {
          name: 'Severity',
          label: 'Severity',
          type: 'select',
          options: ['Critical', 'High', 'Medium', 'Low'],
        },
        { name: 'Title', label: 'Title', type: 'text', required: true, fullWidth: true },
        { name: 'Description', label: 'Description', type: 'textarea', fullWidth: true },
        { name: 'Treatment', label: 'Treatment notes', type: 'textarea', fullWidth: true },
      ],
    },
    {
      title: 'Resolution',
      fields: [
        { name: 'ResolvedDate', label: 'Resolved date', type: 'date' },
        { name: 'ResolvedNotes', label: 'Resolved notes', type: 'textarea', fullWidth: true },
        { name: 'RecordedBy', label: 'Recorded by', type: 'text' },
      ],
    },
  ],
};

export const VACCINATIONS = {
  resource: 'vaccinations',
  idKey: 'VaccinationID',
  labelKey: 'VaccineName',
  title: 'Vaccinations',
  titleKey: 'herd_health.nav_vaccinations',
  singular: 'Vaccination',
  emptyText: 'No records yet — Add vaccination.',
  searchKeys: ['VaccineName', 'AnimalTag', 'GroupName', 'LotNumber'],
  columns: [
    { key: 'AdministeredDate', label: 'Date', format: 'date' },
    { key: 'VaccineName', label: 'Vaccine' },
    { key: 'AnimalTag', label: 'Animal' },
    { key: 'NextDueDate', label: 'Next due', format: 'date' },
  ],
  sections: [
    animalSection([
      {
        name: 'GroupName',
        label: 'Group / pen',
        type: 'text',
        placeholder: 'e.g. Heifers 2025',
        hint: 'Optional — for group vaccinations.',
      },
    ]),
    {
      title: 'Vaccine',
      fields: [
        { name: 'VaccineName', label: 'Vaccine name', type: 'text', required: true },
        { name: 'VaccineManufacturer', label: 'Manufacturer', type: 'text' },
        {
          name: 'VaccineType',
          label: 'Type',
          type: 'select',
          options: ['MLV', 'Killed', 'Toxoid', 'Recombinant', 'Other'],
        },
        { name: 'LotNumber', label: 'Lot number', type: 'text' },
        { name: 'ExpirationDate', label: 'Product expiration', type: 'date' },
      ],
    },
    {
      title: 'Administration',
      fields: [
        { name: 'AdministeredDate', label: 'Administered', type: 'date', required: true },
        { name: 'NextDueDate', label: 'Next due', type: 'date' },
        { name: 'Dosage', label: 'Dosage', type: 'text', placeholder: 'e.g. 2 mL' },
        {
          name: 'Route',
          label: 'Route',
          type: 'select',
          options: ['IM', 'SQ', 'IN', 'Oral', 'Other'],
        },
        { name: 'AdministeredBy', label: 'Administered by', type: 'text' },
        { name: 'Notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ],
    },
  ],
};

export const TREATMENTS = {
  resource: 'treatments',
  idKey: 'TreatmentID',
  labelKey: 'Diagnosis',
  title: 'Treatments',
  titleKey: 'herd_health.nav_treatments',
  singular: 'Treatment',
  emptyText: 'No records yet — Add treatment.',
  searchKeys: ['Diagnosis', 'Medication', 'AnimalTag', 'Outcome'],
  columns: [
    { key: 'TreatmentDate', label: 'Date', format: 'date' },
    { key: 'Diagnosis', label: 'Diagnosis' },
    { key: 'Medication', label: 'Medication' },
    { key: 'AnimalTag', label: 'Animal' },
    { key: 'Outcome', label: 'Outcome' },
  ],
  sections: [
    animalSection(),
    {
      title: 'Treatment',
      fields: [
        { name: 'TreatmentDate', label: 'Treatment date', type: 'date', required: true },
        { name: 'Diagnosis', label: 'Diagnosis', type: 'text', required: true },
        { name: 'Medication', label: 'Medication', type: 'text' },
        { name: 'ActiveIngredient', label: 'Active ingredient', type: 'text' },
        { name: 'Dosage', label: 'Dosage', type: 'text' },
        {
          name: 'Route',
          label: 'Route',
          type: 'select',
          options: ['IM', 'SQ', 'IV', 'Oral', 'Topical', 'Other'],
        },
        { name: 'Frequency', label: 'Frequency', type: 'text', placeholder: 'e.g. BID × 5 days' },
        { name: 'DurationDays', label: 'Duration (days)', type: 'number', min: 0 },
      ],
    },
    {
      title: 'Withdrawal & outcome',
      fields: [
        { name: 'WithdrawalDate', label: 'Meat withdrawal end', type: 'date' },
        { name: 'WithdrawalMilk', label: 'Milk withdrawal end', type: 'date' },
        { name: 'PrescribedBy', label: 'Prescribed by', type: 'text' },
        { name: 'AdministeredBy', label: 'Administered by', type: 'text' },
        { name: 'Cost', label: 'Cost ($)', type: 'number', min: 0 },
        {
          name: 'Outcome',
          label: 'Outcome',
          type: 'select',
          options: ['Recovered', 'Ongoing', 'Died', 'Culled'],
        },
        { name: 'Notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ],
    },
  ],
};

export const QUARANTINE = {
  resource: 'quarantine',
  idKey: 'QuarantineID',
  labelKey: 'AnimalTag',
  title: 'Quarantine',
  titleKey: 'herd_health.nav_quarantine',
  singular: 'Quarantine',
  emptyText: 'No records yet — Add quarantine.',
  searchKeys: ['AnimalTag', 'Reason', 'Status', 'Location'],
  columns: [
    { key: 'StartDate', label: 'Start', format: 'date' },
    { key: 'AnimalTag', label: 'Animal' },
    { key: 'Reason', label: 'Reason' },
    { key: 'Status', label: 'Status' },
    { key: 'PlannedEndDate', label: 'Planned end', format: 'date' },
  ],
  sections: [
    animalSection(),
    {
      title: 'Quarantine details',
      fields: [
        { name: 'StartDate', label: 'Start date', type: 'date', required: true },
        { name: 'PlannedEndDate', label: 'Planned end', type: 'date' },
        { name: 'ActualEndDate', label: 'Actual end', type: 'date' },
        { name: 'Reason', label: 'Reason', type: 'text', required: true },
        { name: 'Location', label: 'Location / pen', type: 'text' },
        {
          name: 'Status',
          label: 'Status',
          type: 'select',
          options: ['Active', 'Released', 'Extended'],
          default: 'Active',
          required: true,
        },
        { name: 'MonitoringFreq', label: 'Monitoring frequency', type: 'text' },
        { name: 'MonitoringNotes', label: 'Monitoring notes', type: 'textarea', fullWidth: true },
      ],
    },
    {
      title: 'Release',
      fields: [
        { name: 'ReleasedBy', label: 'Released by', type: 'text' },
        { name: 'ReleaseConditions', label: 'Release conditions', type: 'text', fullWidth: true },
        { name: 'Notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ],
    },
  ],
};

export const MEDICATIONS = {
  resource: 'medications',
  idKey: 'MedicationID',
  labelKey: 'MedicationName',
  title: 'Medications',
  titleKey: 'herd_health.nav_medications',
  singular: 'Medication',
  emptyText: 'No records yet — Add medication.',
  searchKeys: ['MedicationName', 'Category', 'LotNumber', 'Supplier'],
  columns: [
    { key: 'MedicationName', label: 'Name' },
    { key: 'Category', label: 'Category' },
    { key: 'QuantityOnHand', label: 'Qty' },
    { key: 'Unit', label: 'Unit' },
    { key: 'ExpirationDate', label: 'Expires', format: 'date' },
  ],
  sections: [
    {
      title: 'Product',
      fields: [
        { name: 'MedicationName', label: 'Name', type: 'text', required: true },
        { name: 'ActiveIngredient', label: 'Active ingredient', type: 'text' },
        {
          name: 'Category',
          label: 'Category',
          type: 'select',
          options: ['Antibiotic', 'Vaccine', 'Dewormer', 'Anti-inflammatory', 'Hormone', 'Other'],
        },
        { name: 'Manufacturer', label: 'Manufacturer', type: 'text' },
        { name: 'LotNumber', label: 'Lot number', type: 'text' },
        { name: 'ExpirationDate', label: 'Expiration', type: 'date' },
        { name: 'Prescription', label: 'Prescription required', type: 'checkbox' },
      ],
    },
    {
      title: 'Inventory',
      fields: [
        { name: 'QuantityOnHand', label: 'Qty on hand', type: 'number', min: 0 },
        { name: 'Unit', label: 'Unit', type: 'text', placeholder: 'e.g. bottles, mL' },
        { name: 'ReorderPoint', label: 'Reorder point', type: 'number', min: 0 },
        { name: 'UnitCost', label: 'Unit cost ($)', type: 'number', min: 0 },
        { name: 'Supplier', label: 'Supplier', type: 'text' },
        { name: 'StorageReq', label: 'Storage requirements', type: 'text' },
        { name: 'WithdrawalMeat', label: 'Meat withdrawal', type: 'text' },
        { name: 'WithdrawalMilk', label: 'Milk withdrawal', type: 'text' },
        { name: 'Notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ],
    },
  ],
};

export const VET_VISITS = {
  resource: 'vet-visits',
  idKey: 'VisitID',
  labelKey: 'VetName',
  title: 'Vet visits',
  titleKey: 'herd_health.nav_vet_visits',
  singular: 'Vet visit',
  emptyText: 'No records yet — Add vet visit.',
  searchKeys: ['VetName', 'ClinicName', 'VisitType', 'Diagnoses'],
  columns: [
    { key: 'VisitDate', label: 'Date', format: 'date' },
    { key: 'VetName', label: 'Vet' },
    { key: 'VisitType', label: 'Type' },
    { key: 'Cost', label: 'Cost', format: 'money' },
  ],
  sections: [
    {
      title: 'Visit',
      fields: [
        { name: 'VisitDate', label: 'Visit date', type: 'date', required: true },
        { name: 'VetName', label: 'Vet name', type: 'text', required: true },
        { name: 'ClinicName', label: 'Clinic', type: 'text' },
        {
          name: 'VisitType',
          label: 'Visit type',
          type: 'select',
          options: ['Routine', 'Emergency', 'Follow-up', 'Consultation'],
        },
        { name: 'AffectedAnimals', label: 'Affected animals', type: 'text', fullWidth: true },
        { name: 'Cost', label: 'Cost ($)', type: 'number', min: 0 },
      ],
    },
    {
      title: 'Clinical notes',
      fields: [
        { name: 'ChiefComplaint', label: 'Chief complaint', type: 'textarea', fullWidth: true },
        { name: 'Findings', label: 'Findings', type: 'textarea', fullWidth: true },
        { name: 'Diagnoses', label: 'Diagnoses', type: 'textarea', fullWidth: true },
        { name: 'ProceduresPerformed', label: 'Procedures', type: 'textarea', fullWidth: true },
        { name: 'Prescriptions', label: 'Prescriptions', type: 'textarea', fullWidth: true },
        { name: 'FollowUpDate', label: 'Follow-up date', type: 'date' },
        { name: 'FollowUpNotes', label: 'Follow-up notes', type: 'textarea', fullWidth: true },
        { name: 'Notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ],
    },
  ],
};

export const WEIGHTS = {
  resource: 'weights',
  idKey: 'WeightID',
  labelKey: 'AnimalTag',
  title: 'Weights',
  titleKey: 'herd_health.nav_weights',
  singular: 'Weight record',
  emptyText: 'No records yet — Add weight record.',
  searchKeys: ['AnimalTag', 'Method', 'RecordedBy'],
  columns: [
    { key: 'RecordDate', label: 'Date', format: 'date' },
    { key: 'AnimalTag', label: 'Animal' },
    { key: 'WeightLbs', label: 'Lbs' },
    { key: 'BodyConditionScore', label: 'BCS' },
  ],
  sections: [
    animalSection(),
    {
      title: 'Measurements',
      fields: [
        { name: 'RecordDate', label: 'Record date', type: 'date', required: true },
        { name: 'WeightLbs', label: 'Weight (lbs)', type: 'number', min: 0 },
        { name: 'WeightKg', label: 'Weight (kg)', type: 'number', min: 0 },
        { name: 'BodyConditionScore', label: 'Body condition score', type: 'number', min: 1, max: 9, step: 0.5 },
        { name: 'FrameScore', label: 'Frame score', type: 'number', min: 1, max: 9 },
        {
          name: 'Method',
          label: 'Method',
          type: 'select',
          options: ['Scale', 'Tape', 'Estimate', 'Other'],
        },
        { name: 'RecordedBy', label: 'Recorded by', type: 'text' },
        { name: 'Notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ],
    },
  ],
};

export const PARASITES = {
  resource: 'parasites',
  idKey: 'ParasiteID',
  labelKey: 'AnimalTag',
  title: 'Parasites',
  titleKey: 'herd_health.nav_parasites',
  singular: 'Parasite record',
  emptyText: 'No records yet — Add parasite record.',
  searchKeys: ['AnimalTag', 'TestType', 'ParasiteType', 'Dewormer'],
  columns: [
    { key: 'TestDate', label: 'Date', format: 'date' },
    { key: 'AnimalTag', label: 'Animal' },
    { key: 'TestType', label: 'Test' },
    { key: 'EggCount', label: 'EPG' },
    { key: 'Dewormer', label: 'Dewormer' },
  ],
  sections: [
    animalSection(),
    {
      title: 'Test',
      fields: [
        { name: 'TestDate', label: 'Test date', type: 'date', required: true },
        {
          name: 'TestType',
          label: 'Test type',
          type: 'select',
          options: ['Fecal egg count', 'FAMACHA', 'Skin scrape', 'Other'],
        },
        { name: 'FAMACHAScore', label: 'FAMACHA score', type: 'number', min: 1, max: 5 },
        { name: 'EggCount', label: 'Egg count (EPG)', type: 'number', min: 0 },
        { name: 'ParasiteType', label: 'Parasite type', type: 'text' },
      ],
    },
    {
      title: 'Treatment',
      fields: [
        { name: 'TreatmentGiven', label: 'Treatment given', type: 'text' },
        { name: 'Dewormer', label: 'Dewormer', type: 'text' },
        { name: 'DosageGiven', label: 'Dosage', type: 'text' },
        { name: 'NextTestDate', label: 'Next test', type: 'date' },
        { name: 'RecordedBy', label: 'Recorded by', type: 'text' },
        { name: 'Notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ],
    },
  ],
};

export const MORTALITY = {
  resource: 'mortality',
  idKey: 'MortalityID',
  labelKey: 'AnimalTag',
  title: 'Mortality',
  titleKey: 'herd_health.nav_mortality',
  singular: 'Mortality record',
  emptyText: 'No records yet — Add mortality record.',
  searchKeys: ['AnimalTag', 'CauseOfDeath', 'DeathCategory', 'AnimalSpecies'],
  columns: [
    { key: 'DeathDate', label: 'Date', format: 'date' },
    { key: 'AnimalTag', label: 'Animal' },
    { key: 'CauseOfDeath', label: 'Cause' },
    { key: 'DeathCategory', label: 'Category' },
  ],
  sections: [
    animalSection([
      { name: 'AnimalSpecies', label: 'Species', type: 'text' },
    ]),
    {
      title: 'Death details',
      fields: [
        { name: 'DeathDate', label: 'Death date', type: 'date', required: true },
        { name: 'CauseOfDeath', label: 'Cause of death', type: 'text', required: true },
        {
          name: 'DeathCategory',
          label: 'Category',
          type: 'select',
          options: ['Disease', 'Injury', 'Predation', 'Birthing', 'Unknown', 'Other'],
        },
        { name: 'Location', label: 'Location', type: 'text' },
        { name: 'AgeAtDeath', label: 'Age at death', type: 'text' },
        { name: 'WeightAtDeath', label: 'Weight at death', type: 'number', min: 0 },
        { name: 'DisposalMethod', label: 'Disposal method', type: 'text' },
        { name: 'ReportedTo', label: 'Reported to', type: 'text' },
      ],
    },
    {
      title: 'Post-mortem & insurance',
      fields: [
        { name: 'PostMortemDone', label: 'Post-mortem done', type: 'checkbox' },
        { name: 'PostMortemDate', label: 'Post-mortem date', type: 'date' },
        { name: 'PostMortemFindings', label: 'Findings', type: 'textarea', fullWidth: true },
        { name: 'InsuranceClaim', label: 'Insurance claim', type: 'checkbox' },
        { name: 'InsuranceAmount', label: 'Insurance amount ($)', type: 'number', min: 0 },
        { name: 'EstimatedValue', label: 'Estimated value ($)', type: 'number', min: 0 },
        { name: 'Notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ],
    },
  ],
};

export const LAB_RESULTS = {
  resource: 'lab-results',
  idKey: 'LabResultID',
  labelKey: 'TestType',
  title: 'Lab results',
  titleKey: 'herd_health.nav_lab_results',
  singular: 'Lab result',
  emptyText: 'No records yet — Add lab result.',
  searchKeys: ['TestType', 'AnimalTag', 'LabName', 'AccessionNumber'],
  columns: [
    { key: 'SampleDate', label: 'Sample date', format: 'date' },
    { key: 'TestType', label: 'Test' },
    { key: 'AnimalTag', label: 'Animal' },
    { key: 'LabName', label: 'Lab' },
  ],
  sections: [
    animalSection([
      { name: 'GroupName', label: 'Group / pen', type: 'text' },
    ]),
    {
      title: 'Sample',
      fields: [
        { name: 'SampleDate', label: 'Sample date', type: 'date', required: true },
        { name: 'SampleType', label: 'Sample type', type: 'text', placeholder: 'e.g. Blood, fecal' },
        { name: 'LabName', label: 'Lab name', type: 'text' },
        { name: 'AccessionNumber', label: 'Accession #', type: 'text' },
        { name: 'TestType', label: 'Test type', type: 'text', required: true },
        { name: 'OrderedBy', label: 'Ordered by', type: 'text' },
      ],
    },
    {
      title: 'Results',
      fields: [
        { name: 'ResultDate', label: 'Result date', type: 'date' },
        { name: 'Results', label: 'Results', type: 'textarea', fullWidth: true, required: true },
        { name: 'ReferenceRange', label: 'Reference range', type: 'text' },
        { name: 'Interpretation', label: 'Interpretation', type: 'textarea', fullWidth: true },
        {
          name: 'AttachmentURL',
          label: 'Attachment URL',
          type: 'text',
          fullWidth: true,
          hint: 'Paste a link to the lab PDF or image (file upload not supported yet).',
        },
        { name: 'Notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ],
    },
  ],
};

export const BIOSECURITY = {
  resource: 'biosecurity',
  idKey: 'BiosecurityID',
  labelKey: 'EventType',
  title: 'Biosecurity',
  titleKey: 'herd_health.nav_biosecurity',
  singular: 'Biosecurity event',
  emptyText: 'No records yet — Add biosecurity event.',
  searchKeys: ['EventType', 'PersonOrCompany', 'Purpose', 'OriginLocation'],
  columns: [
    { key: 'EventDate', label: 'Date', format: 'date' },
    { key: 'EventType', label: 'Type' },
    { key: 'PersonOrCompany', label: 'Person / company' },
    { key: 'Purpose', label: 'Purpose' },
  ],
  sections: [
    {
      title: 'Event',
      fields: [
        { name: 'EventDate', label: 'Event date', type: 'date', required: true },
        {
          name: 'EventType',
          label: 'Event type',
          type: 'select',
          required: true,
          options: ['Visitor', 'Vehicle', 'New animal', 'Equipment', 'Other'],
        },
        { name: 'PersonOrCompany', label: 'Person / company', type: 'text' },
        { name: 'ContactInfo', label: 'Contact info', type: 'text' },
        { name: 'Purpose', label: 'Purpose', type: 'text' },
        { name: 'OriginLocation', label: 'Origin location', type: 'text' },
      ],
    },
    {
      title: 'Protocols',
      fields: [
        { name: 'AnimalsContact', label: 'Animal contact', type: 'checkbox' },
        { name: 'AreasAccessed', label: 'Areas accessed', type: 'text', fullWidth: true },
        { name: 'CleaningProtocol', label: 'Cleaning protocol followed', type: 'checkbox' },
        { name: 'PPEUsed', label: 'PPE used', type: 'checkbox' },
        { name: 'HealthCertificate', label: 'Health certificate verified', type: 'checkbox' },
        { name: 'ProtocolsFollowed', label: 'Protocols followed', type: 'textarea', fullWidth: true },
        { name: 'Notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ],
    },
  ],
};

export const VET_CONTACTS = {
  resource: 'vet-contacts',
  idKey: 'VetContactID',
  labelKey: 'Name',
  title: 'Vet contacts',
  titleKey: 'herd_health.nav_vet_contacts',
  singular: 'Vet contact',
  emptyText: 'No records yet — Add vet contact.',
  searchKeys: ['Name', 'ClinicName', 'Phone', 'Email', 'Specialties'],
  columns: [
    { key: 'Name', label: 'Name' },
    { key: 'ClinicName', label: 'Clinic' },
    { key: 'Phone', label: 'Phone' },
    { key: 'IsPreferred', label: 'Preferred', format: 'bool' },
  ],
  sections: [
    {
      title: 'Contact',
      fields: [
        { name: 'Name', label: 'Name', type: 'text', required: true },
        { name: 'ClinicName', label: 'Clinic', type: 'text' },
        { name: 'Role', label: 'Role', type: 'text', placeholder: 'e.g. Large animal vet' },
        { name: 'LicenseNumber', label: 'License #', type: 'text' },
        { name: 'Phone', label: 'Phone', type: 'text' },
        { name: 'EmergencyPhone', label: 'Emergency phone', type: 'text' },
        { name: 'Email', label: 'Email', type: 'text' },
        { name: 'Address', label: 'Address', type: 'textarea', fullWidth: true },
      ],
    },
    {
      title: 'Practice details',
      fields: [
        { name: 'Specialties', label: 'Specialties', type: 'text' },
        { name: 'Species', label: 'Species served', type: 'text' },
        { name: 'IsPreferred', label: 'Preferred contact', type: 'checkbox' },
        { name: 'IsEmergency', label: 'Emergency contact', type: 'checkbox' },
        { name: 'Notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ],
    },
  ],
};

export const REPRODUCTION = {
  resource: 'reproduction',
  idKey: 'ReproductionID',
  labelKey: 'AnimalTag',
  title: 'Reproduction',
  titleKey: 'herd_health.nav_reproduction',
  singular: 'Reproduction record',
  emptyText: 'No records yet — Add reproduction record.',
  searchKeys: ['AnimalTag', 'EventType', 'PregnancyStatus', 'SireTag', 'SireName'],
  columns: [
    { key: 'EventDate', label: 'Date', format: 'date' },
    { key: 'AnimalTag', label: 'Animal' },
    { key: 'EventType', label: 'Type' },
    { key: 'PregnancyStatus', label: 'Status' },
    { key: 'ExpectedDueDate', label: 'Due', format: 'date' },
  ],
  sections: [
    {
      title: 'Dam / event',
      fields: [
        { name: 'AnimalTag', label: 'Animal tag', type: 'text', required: true },
        { name: 'Species', label: 'Species', type: 'text' },
        {
          name: 'EventType',
          label: 'Event type',
          type: 'select',
          required: true,
          options: ['Breeding', 'Pregnancy check', 'Birth', 'Weaning', 'Other'],
        },
        { name: 'EventDate', label: 'Event date', type: 'date', required: true },
        {
          name: 'BreedingMethod',
          label: 'Breeding method',
          type: 'select',
          options: ['Natural', 'AI', 'ET', 'Other'],
        },
        { name: 'PerformedBy', label: 'Performed by', type: 'text' },
      ],
    },
    {
      title: 'Sire',
      fields: [
        { name: 'SireTag', label: 'Sire tag', type: 'text' },
        { name: 'SireName', label: 'Sire name', type: 'text' },
        { name: 'SireBreed', label: 'Sire breed', type: 'text' },
        { name: 'SireRegNumber', label: 'Sire reg #', type: 'text' },
      ],
    },
    {
      title: 'Pregnancy & birth',
      fields: [
        {
          name: 'PregnancyStatus',
          label: 'Pregnancy status',
          type: 'select',
          options: ['Open', 'Bred', 'Pregnant', 'Open (checked)', 'Aborted', 'Birthed'],
        },
        { name: 'PregnancyCheckDate', label: 'Check date', type: 'date' },
        { name: 'PregnancyCheckMethod', label: 'Check method', type: 'text' },
        { name: 'ExpectedDueDate', label: 'Expected due', type: 'date' },
        { name: 'ActualBirthDate', label: 'Birth date', type: 'date' },
        { name: 'NumberBorn', label: 'Number born', type: 'number', min: 0 },
        { name: 'NumberBornAlive', label: 'Born alive', type: 'number', min: 0 },
        { name: 'BirthWeightLbs', label: 'Birth weight (lbs)', type: 'number', min: 0 },
        {
          name: 'BirthEase',
          label: 'Birth ease',
          type: 'select',
          options: ['Unassisted', 'Easy pull', 'Hard pull', 'C-section', 'Other'],
        },
        { name: 'OffspringTags', label: 'Offspring tags', type: 'text', fullWidth: true },
        { name: 'WeanDate', label: 'Wean date', type: 'date' },
        { name: 'WeanWeightLbs', label: 'Wean weight (lbs)', type: 'number', min: 0 },
        { name: 'Notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ],
    },
  ],
};
