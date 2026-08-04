// Thin module pages — each wires a resource config into HerdResourcePage.
import React from 'react';
import HerdResourcePage from './HerdResourcePage';
import {
  EVENTS,
  VACCINATIONS,
  TREATMENTS,
  QUARANTINE,
  MEDICATIONS,
  VET_VISITS,
  WEIGHTS,
  PARASITES,
  MORTALITY,
  LAB_RESULTS,
  BIOSECURITY,
  VET_CONTACTS,
  REPRODUCTION,
} from './resourceConfigs';

export default function HerdHealthEvents() {
  return <HerdResourcePage config={EVENTS} />;
}

export function HerdHealthVaccinations() {
  return <HerdResourcePage config={VACCINATIONS} />;
}

export function HerdHealthTreatments() {
  return <HerdResourcePage config={TREATMENTS} />;
}

export function HerdHealthQuarantine() {
  return <HerdResourcePage config={QUARANTINE} />;
}

export function HerdHealthMedications() {
  return <HerdResourcePage config={MEDICATIONS} />;
}

export function HerdHealthVetVisits() {
  return <HerdResourcePage config={VET_VISITS} />;
}

export function HerdHealthWeights() {
  return <HerdResourcePage config={WEIGHTS} />;
}

export function HerdHealthParasites() {
  return <HerdResourcePage config={PARASITES} />;
}

export function HerdHealthMortality() {
  return <HerdResourcePage config={MORTALITY} />;
}

export function HerdHealthLabResults() {
  return <HerdResourcePage config={LAB_RESULTS} />;
}

export function HerdHealthBiosecurity() {
  return <HerdResourcePage config={BIOSECURITY} />;
}

export function HerdHealthVetContacts() {
  return <HerdResourcePage config={VET_CONTACTS} />;
}

export function HerdHealthReproduction() {
  return <HerdResourcePage config={REPRODUCTION} />;
}
