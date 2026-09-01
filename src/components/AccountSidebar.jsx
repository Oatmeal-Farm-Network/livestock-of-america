import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { useAccount } from '../lib/AccountContext';
import { LIVESTOCK_API_URL } from '../config/api';

const API_URL = LIVESTOCK_API_URL || '';

/** Keep LOA-live routes; everything else from the left menu → Coming Soon. */
const LOA_LIVE = [
  /^\/account\/?(\?|$)/,
  /^\/account\/settings/,
  /^\/account\/profile/,
  /^\/account\/users/,
  /^\/account\/associations/,
  /^\/accounts\//,
  /^\/seller\//,
  /^\/herd-health/,
  /^\/animals(\/|$|\?)/,
  /^\/marketplaces\/livestock/,
  /^\/livestock(\/|$|\?)/,
  /^\/news(\/|$|\?)/,
  /^\/events(\/|$|\?)/,
  /^\/about(\/|$|\?)/,
  /^\/blog(\/|$|\?)/,
  /^\/directory(\/|$|\?)/,
  /^\/over-the-fence/,
  /^\/coming-soon/,
];

function remapTo(to, label) {
  if (!to || typeof to !== 'string') return to;
  let next = to
    .replace(/^\/animals\/add/, '/seller/animals/add')
    .replace(/^\/animals\?(.*BusinessID=)/, '/seller/animals?$1')
    .replace(/^\/animals\/delete.*/, '/coming-soon?feature=Delete%20Animals')
    .replace(/^\/animals\/transfer.*/, '/coming-soon?feature=Transfer%20Animals')
    .replace(/^\/animals\/packages.*/, '/coming-soon?feature=Animal%20Packages')
    .replace(/^\/animals\/stats.*/, '/coming-soon?feature=Animal%20Statistics')
    .replace(/^\/animals\/?(\?|$)/, '/seller/animals$1')
    .replace(/^\/dashboard/, '/account')
    .replace(/^\/account\/team/, '/account/users')
    .replace(/^\/app\/news/, '/news');
  if (LOA_LIVE.some((re) => re.test(next))) return next;
  const feature = (typeof label === 'string' && label) || next.replace(/^\//, '').split(/[/?#]/)[0] || 'Feature';
  return `/coming-soon?feature=${encodeURIComponent(feature)}`;
}

let _sidebarNavigate = null;
const t = (key, fallback) =>
  (typeof fallback === 'string' && fallback) || String(key).split('.').pop().replace(/_/g, ' ');


// ─── Minimal SVG icons ────────────────────────────────────────────────────────
const S = ({ children }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const ICONS = {
  navGroup:      <S><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></S>,
  // Top-level group icons (NavGroup only)
  farmOps:       <S><path d="M2 14h12"/><path d="M4 14V8l4-5 4 5v6"/><line x1="7" y1="14" x2="7" y2="11"/><line x1="9" y1="14" x2="9" y2="11"/><path d="M1 8h3M12 8h3"/><circle cx="2.5" cy="8" r="1"/><circle cx="13.5" cy="8" r="1"/></S>,
  marketplace:   <S><path d="M2 5h12l-1.5 7H3.5z"/><path d="M5.5 5L6.5 2M10.5 5l-1-3"/><circle cx="5.5" cy="13.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="10.5" cy="13.5" r="0.8" fill="currentColor" stroke="none"/></S>,
  community:     <S><circle cx="5.5" cy="5" r="2"/><circle cx="10.5" cy="5.5" r="1.7"/><path d="M1.5 14c0-2.2 1.8-3.5 4-3.5h1"/><path d="M8.5 14c0-1.8 1.5-3 3.5-3s3.5 1.2 3.5 3"/></S>,
  programs:      <S><path d="M8 1.5L3 4v4.5c0 3 2.1 5.8 5 6.5 2.9-.7 5-3.5 5-6.5V4z"/><path d="M6 8l1.5 1.5L10.5 6.5"/></S>,
  businessMgmt:  <S><rect x="2" y="5" width="12" height="9" rx="1"/><path d="M5 5V4a3 3 0 0 1 6 0v1"/><line x1="2" y1="9" x2="14" y2="9"/></S>,
  administration:<S><path d="M8 1.5L2.5 4v3.5c0 3.5 2.3 6.5 5.5 7.5 3.2-1 5.5-4 5.5-7.5V4z"/><circle cx="8" cy="7.5" r="1.5"/><path d="M8 9v2.5"/></S>,
  accounts:        <S><circle cx="8" cy="5" r="2.5"/><path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5"/></S>,
  personalSettings:(
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2"/>
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M12.95 3.05l-1.06 1.06M4.11 11.89l-1.06 1.06"/>
    </svg>
  ),
  dashboard:     <S><path d="M2 8L8 2l6 6"/><path d="M3 7.5V14h3.5v-3h3v3H13V7.5"/></S>,
  blog:          <S><path d="M11 2l3 3-8 8H3v-3z"/><line x1="9" y1="4" x2="12" y2="7"/></S>,
  precisionAg:   <S><rect x="2" y="2" width="12" height="12" rx="1"/><line x1="2" y1="6" x2="14" y2="6"/><line x1="2" y1="10" x2="14" y2="10"/><line x1="6" y1="6" x2="6" y2="14"/></S>,
  farm2table:    <S><path d="M2 5h12l-1.5 7H3.5z"/><path d="M5.5 5L6.5 2M10.5 5l-1-3"/><circle cx="5.5" cy="13.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="10.5" cy="13.5" r="0.8" fill="currentColor" stroke="none"/></S>,
  restaurant:    <S><line x1="5" y1="2" x2="5" y2="14"/><path d="M3 2v4a2 2 0 0 0 4 0V2"/><line x1="11" y1="2" x2="11" y2="14"/><path d="M9 2h3a0 0 0 0 1 0 4v0"/></S>,
  livestock:     <S><ellipse cx="8" cy="9.5" rx="4.5" ry="3"/><circle cx="4" cy="5" r="1.5"/><circle cx="8" cy="4" r="1.5"/><circle cx="12" cy="5" r="1.5"/></S>,
  products:      <S><path d="M2 5l6-3 6 3v6l-6 3-6-3z"/><line x1="8" y1="2" x2="8" y2="14"/><path d="M2 5l6 3 6-3"/></S>,
  services:      <S><path d="M13 3a3.5 3.5 0 0 0-4.2 3.5L2.5 12.5a1.5 1.5 0 1 0 2 2L10 9a3.5 3.5 0 1 0 3-6z"/><circle cx="12.5" cy="3.5" r="1"/></S>,
  events:        <S><rect x="2" y="3" width="12" height="11" rx="1"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="5" y1="1" x2="5" y2="5"/><line x1="11" y1="1" x2="11" y2="5"/><circle cx="5.5" cy="10.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="8" cy="10.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="10.5" cy="10.5" r="0.8" fill="currentColor" stroke="none"/></S>,
  foodAgg:       <S><circle cx="8" cy="8" r="1.8"/><circle cx="2.5" cy="4" r="1.2"/><circle cx="13.5" cy="4" r="1.2"/><circle cx="2.5" cy="12" r="1.2"/><circle cx="13.5" cy="12" r="1.2"/><line x1="3.6" y1="4.8" x2="6.3" y2="6.6"/><line x1="12.4" y1="4.8" x2="9.7" y2="6.6"/><line x1="3.6" y1="11.2" x2="6.3" y2="9.4"/><line x1="12.4" y1="11.2" x2="9.7" y2="9.4"/></S>,
  testimonials:  <S><polygon points="8,1.5 10,6 15,6 11,9.5 12.5,14 8,11.5 3.5,14 5,9.5 1,6 6,6"/></S>,
  chef:          <S><path d="M4 10h8v4H4z"/><path d="M4 10a3 3 0 0 1-1-2 3 3 0 0 1 3-3 3 3 0 0 1 4 0 3 3 0 0 1 3 3 3 3 0 0 1-1 2"/></S>,
  rosemarie:     <S><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="3.5" r="1.5"/><circle cx="8" cy="12.5" r="1.5"/><circle cx="3.5" cy="8" r="1.5"/><circle cx="12.5" cy="8" r="1.5"/></S>,
  properties:    <S><path d="M2 8L8 2l6 6"/><path d="M3.5 7V14h3.5v-3.5h2V14H13V7"/></S>,
  website:       <S><circle cx="8" cy="8" r="6"/><path d="M8 2c-2 1.5-3 3.5-3 6s1 4.5 3 6"/><path d="M8 2c2 1.5 3 3.5 3 6s-1 4.5-3 6"/><line x1="2" y1="8" x2="14" y2="8"/></S>,
  accounting:    <S><rect x="2" y="3" width="12" height="10" rx="1"/><line x1="5" y1="7" x2="11" y2="7"/><line x1="5" y1="9.5" x2="9" y2="9.5"/><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/></S>,
  equipment:     <S><rect x="1" y="4" width="9" height="8" rx="1"/><path d="M10 7h3l2 2v3h-5V7z"/><circle cx="3.5" cy="13" r="1.2"/><circle cx="12" cy="13" r="1.2"/></S>,
  foodWanted:    <S><rect x="3" y="2" width="10" height="12" rx="1"/><line x1="6" y1="6" x2="10" y2="6"/><line x1="6" y1="8.5" x2="10" y2="8.5"/><line x1="6" y1="11" x2="8.5" y2="11"/><circle cx="5" cy="6" r="0.7" fill="currentColor" stroke="none"/><circle cx="5" cy="8.5" r="0.7" fill="currentColor" stroke="none"/><circle cx="5" cy="11" r="0.7" fill="currentColor" stroke="none"/></S>,
  settings:      <S><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2"/><path d="M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M12.8 3.2l-1.4 1.4M4.6 11.4l-1.4 1.4"/></S>,
  otfDM: <S><circle cx="8" cy="8" r="5.5"/><path d="M5 9c1 1.5 2 2 3 2s2-.5 3-2"/><circle cx="5.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="10.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/></S>,
  jobBoard:      <S><path d="M4 4h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M6 4V3a1 1 0 0 1 2 0v1"/><line x1="5" y1="8" x2="11" y2="8"/><line x1="5" y1="11" x2="9" y2="11"/></S>,
  csa:           <S><path d="M8 1L9.5 5.5H14L10.5 8.5 12 13 8 10 4 13 5.5 8.5 2 5.5H6.5z"/></S>,
  land:          <S><path d="M1 13L6 4l4 5 3-3 2 7z"/><line x1="1" y1="13" x2="15" y2="13"/></S>,
  certifications:<S><circle cx="8" cy="7" r="4"/><path d="M5.5 13l.5-2h4l.5 2"/><line x1="8" y1="11" x2="8" y2="15"/></S>,
  suppliers:     <S><rect x="2" y="9" width="5" height="5" rx="0.5"/><rect x="9" y="9" width="5" height="5" rx="0.5"/><rect x="5.5" y="2" width="5" height="5" rx="0.5"/><line x1="8" y1="7" x2="8" y2="9"/><line x1="4.5" y1="9" x2="4.5" y2="8"/><line x1="11.5" y1="9" x2="11.5" y2="8"/></S>,
  grants:        <S><rect x="2" y="5" width="12" height="9" rx="1"/><path d="M5 5V4a3 3 0 0 1 6 0v1"/><line x1="8" y1="8" x2="8" y2="11"/><line x1="6.5" y1="9.5" x2="9.5" y2="9.5"/></S>,
  education:     <S><path d="M2 8l6-4 6 4-6 4z"/><path d="M14 8v4"/><path d="M5 10v3a5 3 0 0 0 6 0v-3"/></S>,
  commodityPrices:<S><polyline points="2,12 6,8 9,10 13,4"/><line x1="13" y1="4" x2="15" y2="4"/><line x1="13" y1="4" x2="13" y2="6"/></S>,
  forums:        <S><path d="M2 3h9a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5L2 12V4a1 1 0 0 1 1-1z"/><path d="M14 6h1a1 1 0 0 1 1 1v4l-2 2v-3h-2"/></S>,
  landLeasing:   <S><path d="M2 13h12"/><path d="M4 13V7l4-4 4 4v6"/><line x1="7" y1="13" x2="7" y2="10"/><line x1="9" y1="13" x2="9" y2="10"/></S>,
  csaAdvanced:   <S><circle cx="8" cy="8" r="5"/><line x1="8" y1="5" x2="8" y2="8"/><line x1="8" y1="8" x2="11" y2="8"/><circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/><line x1="5" y1="3" x2="5" y2="1.5"/><line x1="11" y1="3" x2="11" y2="1.5"/></S>,
  coldChain:     <S><rect x="1" y="5" width="10" height="7" rx="1"/><path d="M11 7h2l2 2v3h-4V7z"/><circle cx="3.5" cy="13" r="1.2"/><circle cx="9" cy="13" r="1.2"/><circle cx="13.5" cy="13" r="1.2"/><line x1="5" y1="5" x2="5" y2="2"/><line x1="5" y1="2" x2="7" y2="2"/><line x1="6" y1="1" x2="6" y2="3.5"/></S>,
  farmerPay:     <S><circle cx="8" cy="8" r="5.5"/><line x1="8" y1="4.5" x2="8" y2="11.5"/><path d="M6 6.5h2.5a1.5 1.5 0 0 1 0 3h-2.5"/><path d="M5.5 9.5h3"/></S>,
  supplyChain:   <S><rect x="1" y="6" width="5" height="5" rx="1"/><rect x="10" y="6" width="5" height="5" rx="1"/><line x1="6" y1="8.5" x2="10" y2="8.5"/><circle cx="3.5" cy="3" r="1.5"/><path d="M3.5 4.5v1.5"/><circle cx="12.5" cy="3" r="1.5"/><path d="M12.5 4.5v1.5"/></S>,
  hrManagement:      <S><circle cx="5.5" cy="5" r="2"/><circle cx="10.5" cy="5" r="2"/><path d="M1 14c0-2.2 2-3.5 4.5-3.5h5c2.5 0 4.5 1.3 4.5 3.5"/></S>,
  farmInputs:        <S><path d="M6 2h4l1 3H5z"/><rect x="4" y="5" width="8" height="9" rx="1"/><line x1="8" y1="8" x2="8" y2="11"/><line x1="6.5" y1="9.5" x2="9.5" y2="9.5"/></S>,
  cropBudget:        <S><rect x="2" y="3" width="12" height="10" rx="1"/><polyline points="5,11 7,8 9,10 13,5"/><line x1="2" y1="7" x2="5" y2="7"/></S>,
  traceability:      <S><rect x="2" y="2" width="5" height="5" rx="0.5"/><rect x="9" y="2" width="5" height="5" rx="0.5"/><rect x="2" y="9" width="5" height="5" rx="0.5"/><path d="M11.5 9v2.5h2.5"/><line x1="9" y1="11.5" x2="11.5" y2="11.5"/></S>,
  farmInfrastructure:<S><path d="M2 14h12"/><path d="M4 14V8l4-5 4 5v6"/><line x1="7" y1="14" x2="7" y2="11"/><line x1="9" y1="14" x2="9" y2="11"/><line x1="5" y1="10" x2="11" y2="10"/></S>,
  farmKpi:           <S><path d="M3 13c1-4 2.5-6 5-6s4 2 5 6"/><path d="M8 7V3"/><circle cx="8" cy="13" r="1" fill="currentColor" stroke="none"/><line x1="5" y1="4.5" x2="6.5" y2="6"/><line x1="11" y1="4.5" x2="9.5" y2="6"/></S>,
  nursery:           <S><path d="M8 13V7"/><path d="M5 7c0-2 1.5-5 3-5s3 3 3 5"/><path d="M4 10c-1-1-1.5-3 0-4"/><path d="M12 10c1-1 1.5-3 0-4"/><line x1="3" y1="14" x2="13" y2="14"/></S>,
  outgrower:         <S><circle cx="4" cy="5" r="1.5"/><circle cx="12" cy="5" r="1.5"/><path d="M4 6.5v3l4 2 4-2v-3"/><path d="M8 8.5V14"/><line x1="5" y1="14" x2="11" y2="14"/></S>,
  procurement:       <S><rect x="3" y="5" width="10" height="9" rx="1"/><path d="M6 5V4a2 2 0 0 1 4 0v1"/><line x1="6" y1="9" x2="10" y2="9"/><line x1="8" y1="7" x2="8" y2="11"/></S>,
  workOrders:        <S><rect x="2" y="3" width="9" height="12" rx="1"/><line x1="5" y1="7" x2="8" y2="7"/><line x1="5" y1="9.5" x2="8" y2="9.5"/><line x1="5" y1="12" x2="7" y2="12"/><circle cx="12" cy="11" r="3"/><line x1="14.1" y1="13.1" x2="15.5" y2="14.5"/></S>,
  packhouseQC:       <S><rect x="2" y="6" width="12" height="8" rx="1"/><path d="M5 6V4h6v2"/><polyline points="5,10 7,12 11,8"/></S>,
  plantTagging:      <S><circle cx="8" cy="6" r="3"/><path d="M8 9v6"/><path d="M5.5 13h5"/><line x1="8" y1="3" x2="8" y2="1"/><line x1="11" y1="4" x2="12.5" y2="2.5"/><line x1="5" y1="4" x2="3.5" y2="2.5"/></S>,
  exportCompliance:  <S><rect x="2" y="3" width="10" height="12" rx="1"/><line x1="5" y1="7" x2="9" y2="7"/><line x1="5" y1="9.5" x2="9" y2="9.5"/><line x1="5" y1="12" x2="7.5" y2="12"/><path d="M13 8l2 2-2 2"/><line x1="10" y1="10" x2="15" y2="10"/></S>,
  permissions:       <S><circle cx="8" cy="5.5" r="2"/><path d="M4 14v-1.5a4 4 0 0 1 8 0V14"/><line x1="10.5" y1="9" x2="14" y2="5.5"/><circle cx="14" cy="4.5" r="1.2"/></S>,
  scouting:          <S><circle cx="8" cy="8" r="2"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14"/><path d="M4.2 4.2l1 1M10.8 10.8l1 1M11.8 4.2l-1 1M5.2 10.8l-1 1"/></S>,
  irrigation:        <S><path d="M8 2v6"/><path d="M5 5l3 3 3-3"/><path d="M3 12c0 2.8 2 4 5 4s5-1.2 5-4"/><path d="M3 12c0-1.5 1-2.5 2.5-2.5S8 10.5 8 12"/><path d="M13 12c0-1.5-1-2.5-2.5-2.5"/></S>,
  equipmentMaint:    <S><path d="M13.5 2.5l-9 9"/><circle cx="3.5" cy="12.5" r="1.5"/><path d="M14 3l-1-1-2 2 1 1z"/><path d="M7 9l-3.5 3.5"/><circle cx="12.5" cy="3.5" r="1.2"/></S>,
  soilTests:         <S><path d="M8 14V6"/><path d="M4 10h8"/><path d="M5 7c0-2 1.3-4 3-5 1.7 1 3 3 3 5"/><circle cx="8" cy="14" r="1" fill="currentColor" stroke="none"/><line x1="3" y1="14" x2="13" y2="14"/></S>,
  cashFlow:          <S><polyline points="2,12 6,7 9,10 13,5"/><line x1="13" y1="5" x2="14" y2="5"/><line x1="13" y1="5" x2="13" y2="6"/><line x1="6" y1="13" x2="6" y2="15"/><line x1="10" y1="13" x2="10" y2="15"/></S>,
  fieldActivity:     <S><rect x="3" y="2" width="10" height="13" rx="1"/><line x1="5" y1="5" x2="10" y2="5"/><line x1="5" y1="7.5" x2="10" y2="7.5"/><line x1="5" y1="10" x2="8" y2="10"/><path d="M12 10v5h3"/></S>,
  yieldRecords:      <S><path d="M2 12l3-4 3 3 3-5 4 5"/><line x1="1" y1="12" x2="15" y2="12"/><path d="M7 13v2"/><line x1="5" y1="15" x2="9" y2="15"/></S>,
  reports:           <S><rect x="3" y="2" width="10" height="12" rx="1"/><line x1="5" y1="5" x2="10" y2="5"/><line x1="5" y1="7.5" x2="10" y2="7.5"/><line x1="5" y1="10" x2="8" y2="10"/><path d="M8 14v2l-2 1h4z"/></S>,
  fieldHealth:       <S><path d="M2 10l4-5 3 3 3-4 4 6H2z"/><line x1="2" y1="14" x2="14" y2="14"/><line x1="8" y1="10" x2="8" y2="14"/></S>,
  nutrientMgmt:      <S><path d="M8 14V8"/><path d="M5 8c0-2 1.3-4 3-5 1.7 1 3 3 3 5"/><line x1="2" y1="14" x2="14" y2="14"/><line x1="11" y1="6" x2="13" y2="4"/><line x1="5" y1="6" x2="3" y2="4"/></S>,
  farmPL:            <S><polyline points="2,12 5,8 8,10 11,5 14,9"/><line x1="1" y1="12" x2="15" y2="12"/><line x1="5" y1="13" x2="5" y2="15"/><line x1="11" y1="13" x2="11" y2="15"/></S>,
  documentVault:     <S><path d="M10 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5z"/><polyline points="10 2 10 5 13 5"/><line x1="5" y1="7" x2="9" y2="7"/><line x1="5" y1="9.5" x2="9" y2="9.5"/></S>,
  weather:           <S><circle cx="8" cy="9" r="3"/><path d="M3 14h10a3 3 0 0 0 0-6H12a5 5 0 1 0-9 3"/><line x1="5" y1="14" x2="5" y2="15.5"/><line x1="8" y1="14" x2="8" y2="16"/><line x1="11" y1="14" x2="11" y2="15.5"/></S>,
  cropPlanning:      <S><rect x="2" y="3" width="12" height="11" rx="1"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="5" y1="3" x2="5" y2="14"/><line x1="9" y1="3" x2="9" y2="14"/><path d="M15 9h-1"/><rect x="14" y="9" width="2" height="5" rx="0.5"/></S>,
  seedVarieties:     <S><circle cx="8" cy="10" r="3"/><path d="M8 7V3"/><path d="M5.5 8.5L3 6"/><path d="M10.5 8.5L13 6"/><line x1="4" y1="14" x2="12" y2="14"/><path d="M6 14v1.5a2 2 0 0 0 4 0V14"/></S>,
  farmSafety:        <S><path d="M8 2L3 5v5c0 3.3 2.1 6.4 5 7.4 2.9-1 5-4.1 5-7.4V5z"/><polyline points="5.5,8 7,9.5 10.5,6"/></S>,
  buyerCRM:          <S><circle cx="5.5" cy="5" r="2"/><path d="M1 13c0-2 2-3.5 4.5-3.5h1"/><rect x="8" y="8" width="7" height="5" rx="1"/><line x1="10" y1="10.5" x2="13" y2="10.5"/></S>,
  complianceAudit:   <S><path d="M3 3h10a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><polyline points="5,8 6.5,9.5 10,6"/><line x1="5" y1="11" x2="9" y2="11"/></S>,
  harvestSchedule:   <S><rect x="2" y="3" width="12" height="11" rx="1"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="5" y1="1" x2="5" y2="5"/><line x1="11" y1="1" x2="11" y2="5"/><path d="M5 10h6"/><path d="M5 13h4"/></S>,
  priceList:         <S><rect x="2" y="3" width="9" height="11" rx="1"/><line x1="4" y1="7" x2="9" y2="7"/><line x1="4" y1="9.5" x2="9" y2="9.5"/><line x1="4" y1="12" x2="7" y2="12"/><path d="M12 9l2 2-2 2"/><line x1="11" y1="11" x2="14" y2="11"/></S>,
  farmStand:         <S><path d="M2 7h12l-1 7H3z"/><path d="M1 4h14"/><path d="M5 4V2h6v2"/><path d="M6 11v2"/><path d="M10 11v2"/></S>,
  deliveryRoutes:    <S><rect x="1" y="6" width="10" height="7" rx="1"/><path d="M11 9h2l2 3v2h-4"/><circle cx="4" cy="15" r="1.5"/><circle cx="12" cy="15" r="1.5"/></S>,
  meetings:          <S><rect x="2" y="3" width="12" height="10" rx="1"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="5" y1="1" x2="5" y2="5"/><line x1="11" y1="1" x2="11" y2="5"/><path d="M5 10h6"/></S>,
  agroConsult:       <S><circle cx="6" cy="5" r="2.5"/><path d="M4 9a4 4 0 0 0-3 4"/><path d="M10 13s1-1.5 3-1.5 3 1.5 3 1.5"/><path d="M13 8.5c0 2.5-3 4-3 4s-3-1.5-3-4a3 3 0 0 1 6 0z"/></S>,
};

const CollapseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="14" y1="2" x2="14" y2="14" />
    <line x1="2" y1="8" x2="11" y2="8" />
    <polyline points="6,4 2,8 6,12" />
  </svg>
);

const ExpandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="2" x2="2" y2="14" />
    <line x1="5" y1="8" x2="14" y2="8" />
    <polyline points="10,4 14,8 10,12" />
  </svg>
);

function NavChild({ to, label, onNavigate }) {
  const href = remapTo(to, typeof label === 'string' ? label : undefined);
  return (
    <Link
      to={href}
      onClick={onNavigate || _sidebarNavigate || undefined}
      className="flex items-center px-3 py-1.5 ml-4 rounded-lg hover:bg-white/50 text-gray-600 text-xs transition-all no-underline"
    >
      {label}
    </Link>
  );
}

function NavSection({ icon, label, expanded, isOpen, onToggle, children, iconOnly = false }) {
  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        title={(!expanded || iconOnly) ? label : undefined}
        className={`w-full flex items-center py-2 rounded-lg hover:bg-white/50 text-gray-700 text-sm transition-all ${
          expanded ? 'gap-3 px-3' : 'justify-center'
        }`}
      >
        <span className="w-4 h-4 shrink-0 flex items-center justify-center">{icon}</span>
        {expanded && !iconOnly && (
          <>
            <span className="grow text-left whitespace-nowrap">{label}</span>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
              {isOpen ? <path d="M3 10l5-5 5 5" /> : <path d="M3 6l5 5 5-5" />}
            </svg>
          </>
        )}
        {expanded && iconOnly && (
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0 ml-auto">
            {isOpen ? <path d="M3 10l5-5 5 5" /> : <path d="M3 6l5 5 5-5" />}
          </svg>
        )}
      </button>
      {isOpen && expanded && (
        <div className="flex flex-col gap-0.5 mt-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Collapsible top-level GROUP (contains NavSections) ────────────────────────
function NavGroup({ icon, label, expanded, isOpen, onToggle, children }) {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        title={!expanded ? label : undefined}
        className={`w-full flex items-center py-2.5 rounded-lg bg-white hover:bg-gray-50 shadow-sm border border-gray-200 text-gray-900 text-[13px] font-semibold transition-all ${
          expanded ? 'gap-2 px-3' : 'justify-center'
        }`}
      >
        <span className="w-4 h-4 shrink-0 flex items-center justify-center text-gray-700">{icon}</span>
        {expanded && (
          <>
            <span className="grow text-left whitespace-nowrap">{label}</span>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
              {isOpen ? <path d="M3 10l5-5 5 5" /> : <path d="M3 6l5 5 5-5" />}
            </svg>
          </>
        )}
      </button>
      {isOpen && expanded && (
        <div className="flex flex-col gap-0.5 mt-1 mb-2 pl-1">
          {children}
        </div>
      )}
    </div>
  );
}

export default function AccountSidebar({ onNavigate }) {
  _sidebarNavigate = onNavigate || null;
  const { Business, BusinessID, Expanded, setExpanded, OpenSections, setOpenSections, businesses, websiteSlug, setWebsiteSlug } = useAccount() || {};

  /**
   * Append ?BusinessID= only when there actually is one.
   *
   * Interpolating a null straight into a template literal produces the string
   * "BusinessID=null", which every destination page then reads as a real id and
   * sends to the API — the reason /seller/animals?BusinessID=null reported
   * "Unable to load animals" rather than simply prompting for a business.
   */
  const biz = (path, extra = '') => {
    const parts = [];
    if (extra) parts.push(extra);
    if (BusinessID != null && BusinessID !== '') parts.push(`BusinessID=${BusinessID}`);
    return parts.length ? `${path}?${parts.join('&')}` : path;
  };
  const peopleId = typeof window !== 'undefined' ? localStorage.getItem('people_id') || '' : '';
  const [features, setFeatures] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (!BusinessID) {
      setWebsiteSlug?.(null);
      return;
    }
    if (!API_URL) return;
    fetch(`${API_URL}/api/website/site?business_id=${BusinessID}`)
      .then(r => r.ok ? r.json() : null)
      .then(site => setWebsiteSlug?.(site?.slug ?? null))
      .catch(() => setWebsiteSlug?.(null));
  }, [BusinessID, setWebsiteSlug]);

  useEffect(() => {
    if (!API_URL) { setFeatures({}); return; }
    const url = BusinessID
      ? `${API_URL}/api/company/features?business_id=${BusinessID}`
      : `${API_URL}/api/company/features`;
    fetch(url)
      .then(r => r.ok ? r.json() : [])
      .then(rows => {
        const map = {};
        rows.forEach(f => { map[f.feature_key] = f.is_enabled; });
        setFeatures(map);
      })
      .catch(() => setFeatures({}));
  }, [BusinessID]);

  const on = (_key) => true;
  const anyOn = (..._keys) => true;
  
  useEffect(() => {
    if (location.pathname.startsWith('/website/')) {
      setOpenSections?.(prev => prev?.['My Website'] ? prev : { ...prev, 'My Website': true });
    }
    if (location.pathname.startsWith('/seller') || location.pathname.startsWith('/herd-health') || location.pathname.includes('/animals')) {
      setOpenSections?.(prev => ({
        ...prev,
        g_livestock: true,
      }));
    }
  }, [location.pathname, setOpenSections]);

  const toggleSection = (label) => {
    setOpenSections?.(prev => ({ ...prev, [label]: !prev?.[label] }));
  };

  const isAccountOpen = OpenSections?.Account || false;

  return (
    <div
      className="relative h-full z-60 flex flex-col transition-all duration-300 border-r border-gray-300/40"
      style={{ backgroundColor: '#faf6ef', width: Expanded !== false ? '211px' : '67px' }}
    >
      <button
        onClick={() => setExpanded?.(!(Expanded !== false))}
        className="flex items-center justify-end px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-white/20 transition-all border-b border-gray-300/30 shrink-0 bg-transparent border-x-0 border-t-0 cursor-pointer"
        title={Expanded !== false ? t('account_sidebar.toggle_collapse', 'Collapse') : t('account_sidebar.toggle_expand', 'Expand')}
      >
        {Expanded !== false ? <CollapseIcon /> : <ExpandIcon />}
      </button>

      {/* Dashboard — pinned above the account picker so the first thing in the
          sidebar is the way back to the workspace. It sits outside <nav> now, so
          it carries the horizontal padding <nav> used to supply. */}
      <div className="px-2 pt-2 shrink-0">
            <div className="mb-1">
              <div className={`flex items-center rounded-lg hover:bg-white/50 transition-all ${Expanded === false ? 'justify-center' : ''}`}>
                <Link
                  to={BusinessID ? biz('/account', `PeopleID=${peopleId}`) : '/account'}
                  onClick={onNavigate}
                  title={Expanded === false ? t('account_sidebar.sec_dashboard', 'Dashboard') : undefined}
                  className={`flex items-center py-2 text-gray-700 text-sm flex-1 min-w-0 no-underline ${(Expanded !== false) ? 'gap-3 px-3' : 'justify-center'}`}
                >
                  <span className="w-4 h-4 shrink-0 flex items-center justify-center">{ICONS.dashboard}</span>
                  {(Expanded !== false) && <span className="grow text-left whitespace-nowrap">{t('account_sidebar.sec_dashboard', 'Dashboard')}</span>}
                </Link>
                {(Expanded !== false) && (
                  <button
                    onClick={() => toggleSection('Account')}
                    className="pr-3 py-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      {isAccountOpen ? <path d="M3 10l5-5 5 5" /> : <path d="M3 6l5 5 5-5" />}
                    </svg>
                  </button>
                )}
              </div>
              {isAccountOpen && Expanded !== false && (
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <NavChild to={biz('/account/profile')} label={t('account_sidebar.edit_profile', 'Edit Profile')} />
                  <NavChild to={biz('/account/team')} label={t('account_sidebar.team_members', 'Team Members')} />
                  <NavChild to={biz('/account/change-type')} label={t('account_sidebar.change_account_type', 'Change Account Type')} />
                  <NavChild to={biz('/account/delete')} label={t('account_sidebar.delete_account', 'Delete Account')} />
                </div>
              )}
            </div>
      </div>

      {/* Accounts dropdown — always visible */}
      <div className="px-2 pt-2 pb-2 border-b border-gray-300/50 shrink-0">
        <NavSection
          icon={ICONS.accounts}
          label={t('nav.accounts', 'Accounts')}
          expanded={Expanded !== false}
          isOpen={OpenSections?.['Accounts'] || false}
          onToggle={() => toggleSection('Accounts')}
        >
          <NavChild to="/dashboard" label={t('nav.accounts', 'Accounts')} />
          <NavChild to={`/accounts/new?PeopleID=${peopleId}`} label={t('nav.add_account', 'Add Account')} />
          <NavChild to="/account/settings" label={t('nav.settings', 'Settings')} />
          {Array.isArray(businesses) && businesses.length > 0 && (
            <>
              <div className="mx-3 my-1 border-t border-gray-200" />
              {businesses.map(b => (
                <NavChild
                  key={b.BusinessID}
                  to={`/account?PeopleID=${peopleId}&BusinessID=${b.BusinessID}`}
                  label={b.BusinessName.substring(0, 25)}
                />
              ))}
            </>
          )}
        </NavSection>
      </div>

      {/* Business name + all feature nav — only shown when an org account is selected */}
      <>
          {(Expanded !== false) && (
            <div className="px-3 py-3 border-b border-gray-300/50 shrink-0">
              <p className="text-gray-800 font-bold text-sm truncate">{Business?.BusinessName || businesses?.[0]?.BusinessName || 'Livestock of America'}</p>
              <p className="text-gray-500 text-xs truncate">{Business?.BusinessType || businesses?.[0]?.BusinessType || 'Other'}</p>
            </div>
          )}

          <nav className="flex flex-col gap-1 p-2 grow overflow-y-auto">

        {/* ── Grouped feature navigation ── */}
        {/* Livestock sits at the top level rather than under a Farm Operations
            group. That group only ever held this one section, so it cost a
            click and a level of nesting to reach the animals list. */}
        <NavGroup icon={ICONS.livestock} label={t('account_sidebar.sec_livestock', 'Livestock')} expanded={Expanded !== false} isOpen={OpenSections?.['g_livestock'] || false} onToggle={() => toggleSection('g_livestock')}>
          <NavChild to={biz('/animals')} label={t('account_sidebar.animals_list', 'Animals List')} />
          <NavChild to={biz('/animals/add')} label={t('account_sidebar.add', 'Add')} />
          <NavChild to={biz('/animals/delete')} label={t('account_sidebar.delete', 'Delete')} />
          <NavChild to={biz('/animals/transfer')} label={t('account_sidebar.transfer', 'Transfer')} />
          <NavChild to={biz('/animals/packages')} label={t('account_sidebar.packages', 'Packages')} />
          <NavChild to={biz('/animals/stats')} label={t('account_sidebar.statistics', 'Statistics')} />
          <NavChild to={biz('/herd-health')} label="Herd Health" />
        </NavGroup>

        <NavGroup icon={ICONS.community} label="Community" expanded={Expanded !== false} isOpen={OpenSections?.['g_community'] || false} onToggle={() => toggleSection('g_community')}>
        {on('blog') && (
          <NavSection icon={ICONS.blog} label={t('account_sidebar.sec_blog')} expanded={Expanded !== false}
            isOpen={OpenSections?.['Blog'] || false} onToggle={() => toggleSection('Blog')}>
            <NavChild to={biz('/blog/manage')} label={t('account_sidebar.manage_blog')} />
            <NavChild to={biz('/blog/manage', 'view=new')} label={t('account_sidebar.add_post')} />
            <NavChild to={biz('/blog/manage', 'tab=categories')} label={t('account_sidebar.blog_categories')} />
            <NavChild to={biz('/blog/authors/manage')} label={t('account_sidebar.authors')} />
          </NavSection>
        )}

        {on('forums') && (
          <NavSection icon={ICONS.forums} label="Forums" expanded={Expanded !== false}
            isOpen={OpenSections?.['Forums'] || false} onToggle={() => toggleSection('Forums')}>
            <NavChild to="/forums" label="Browse Forums" />
            <NavChild to="/over-the-fence" label="Over the Fence DM" />
          </NavSection>
        )}

        {on('events') && (
          <NavSection icon={ICONS.events} label={t('account_sidebar.sec_events')} expanded={Expanded !== false}
            isOpen={OpenSections?.Events || false} onToggle={() => toggleSection('Events')}>
            <NavChild to="/events" label={t('account_sidebar.browse_events')} />
            <NavChild to={biz('/events/manage')} label={t('account_sidebar.my_events')} />
            <NavChild to={biz('/events/add')} label={t('account_sidebar.add_event')} />
            <NavChild to="/my-registrations" label={t('account_sidebar.my_registrations')} />
          </NavSection>
        )}

        {on('testimonials') && (
          <NavSection icon={ICONS.testimonials} label={t('account_sidebar.sec_testimonials')} expanded={Expanded !== false}
            isOpen={OpenSections?.Testimonials || false} onToggle={() => toggleSection('Testimonials')}>
            <NavChild to={biz('/testimonials/manage')} label={t('account_sidebar.manage_testimonials')} />
            <NavChild to={biz('/testimonials/request')} label={t('account_sidebar.request_testimonials')} />
          </NavSection>
        )}

        {(on('chef_dashboard') || on('pairsley') || on('provenance')) && (
          <NavSection icon={ICONS.chef} label={t('account_sidebar.sec_chef')} expanded={Expanded !== false}
            isOpen={OpenSections?.['Chef Dashboard'] || false} onToggle={() => toggleSection('Chef Dashboard')}>
            {on('chef_dashboard') && <NavChild to={biz('/chef')} label={t('account_sidebar.sec_chef')} />}
            {on('pairsley')       && <NavChild to={biz('/platform/pairsley')} label={t('account_sidebar.pairsley_ai')} />}
            {on('provenance')     && <NavChild to={`/provenance/${BusinessID}`} label={t('account_sidebar.provenance_card')} />}
          </NavSection>
        )}

{on('properties') && (
          <NavSection icon={ICONS.properties} label={t('account_sidebar.sec_properties')} expanded={Expanded !== false}
            isOpen={OpenSections?.Properties || false} onToggle={() => toggleSection('Properties')}>
            <NavChild to={biz('/properties')} label={t('account_sidebar.list')} />
            <NavChild to={biz('/properties/add')} label={t('account_sidebar.add')} />
          </NavSection>
        )}

        </NavGroup>

        {anyOn('certifications','commodity_prices','education_center','grants_programs') && (
        <NavGroup icon={ICONS.programs} label="Programs" expanded={Expanded !== false} isOpen={OpenSections?.['g_programs'] || false} onToggle={() => toggleSection('g_programs')}>
        {on('certifications') && (
          <NavSection icon={ICONS.certifications} label="Certifications" expanded={Expanded !== false}
            isOpen={OpenSections?.['Certifications'] || false} onToggle={() => toggleSection('Certifications')}>
            <NavChild to={biz('/certifications')} label="My Certifications" />
          </NavSection>
        )}

        {on('grants_programs') && (
          <NavSection icon={ICONS.grants} label="Grants & Programs" expanded={Expanded !== false}
            isOpen={OpenSections?.['Grants & Programs'] || false} onToggle={() => toggleSection('Grants & Programs')}>
            <NavChild to="/grants" label="Browse Programs" />
            <NavChild to={biz('/grants', 'tab=my-tracking')} label="My Tracker" />
          </NavSection>
        )}

        {on('education_center') && (
          <NavSection icon={ICONS.education} label="Education Center" expanded={Expanded !== false}
            isOpen={OpenSections?.['Education Center'] || false} onToggle={() => toggleSection('Education Center')}>
            <NavChild to="/education" label="Courses & Articles" />
          </NavSection>
        )}

        {on('commodity_prices') && (
          <NavSection icon={ICONS.commodityPrices} label="Commodity Prices" expanded={Expanded !== false}
            isOpen={OpenSections?.['Commodity Prices'] || false} onToggle={() => toggleSection('Commodity Prices')}>
            <NavChild to="/commodity-prices" label="Market Prices" />
          </NavSection>
        )}

        </NavGroup>
        )}

        {anyOn('accounting','cash_flow_forecast','document_vault','farm_pl','meetings','my_website','report_center') && (
        <NavGroup icon={ICONS.businessMgmt} label="Business Mgmt" expanded={Expanded !== false} isOpen={OpenSections?.['g_business'] || false} onToggle={() => toggleSection('g_business')}>
        {on('my_website') && (
          <NavSection icon={ICONS.website} label={t('account_sidebar.sec_website')} expanded={Expanded !== false}
            isOpen={OpenSections?.['My Website'] || false} onToggle={() => toggleSection('My Website')}>
            <NavChild to={biz('/website/builder', 'view=lavendir')} label={t('account_sidebar.lavendir_ai')} />
            {!websiteSlug ? (
              <NavChild to={biz('/website/builder')} label={t('account_sidebar.create_website')} />
            ) : (
              <>
                <NavChild to={biz('/website/builder', 'view=manage-pages')} label={t('account_sidebar.sec_dashboard', 'Dashboard')} />
                <NavChild to={biz('/website/builder', 'view=design')} label={t('account_sidebar.design')} />
                <NavChild to={biz('/website/builder', 'view=settings')} label={t('account_sidebar.website_settings')} />
                <NavChild to={biz('/website/builder', 'view=delete')} label={t('account_sidebar.delete_website')} />
                <a
                  href={`/sites/${websiteSlug}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center px-3 py-1.5 ml-4 rounded-lg hover:bg-white/50 text-gray-600 text-xs transition-all"
                >
                  {t('account_sidebar.view_live')}
                </a>
              </>
            )}
          </NavSection>
        )}

        {on('accounting') && (
          <NavSection icon={ICONS.accounting} label={t('account_sidebar.sec_accounting')} expanded={Expanded !== false}
            isOpen={OpenSections?.['Accounting'] || false} onToggle={() => toggleSection('Accounting')}>
            <NavChild to={biz('/accounting')} label={t('account_sidebar.sec_dashboard')} />
            <NavChild to={`${biz('/accounting')}#invoices`} label={t('account_sidebar.invoices')} />
            <NavChild to={`${biz('/accounting')}#customers`} label={t('account_sidebar.customers')} />
            <NavChild to={`${biz('/accounting')}#vendors`} label={t('account_sidebar.vendors')} />
            <NavChild to={`${biz('/accounting')}#reports`} label={t('account_sidebar.reports')} />
            {on('cash_flow_forecast') && (
              <NavChild to={biz('/cash-flow')} label="Cash Flow Forecast" />
            )}
            {on('report_center') && (
              <NavChild to={biz('/reports')} label="Reports & Export" />
            )}
            {on('farm_pl') && (
              <NavChild to={biz('/farm-pl')} label="Farm P&L Dashboard" />
            )}
          </NavSection>
        )}

        {on('document_vault') && (
          <NavSection icon={ICONS.documentVault} label="Document Vault" expanded={Expanded !== false}
            isOpen={OpenSections?.['Document Vault'] || false} onToggle={() => toggleSection('Document Vault')}>
            <NavChild to={biz('/documents')} label="All Documents" />
            <NavChild to={biz('/documents', 'category=Certifications')} label="Certifications" />
            <NavChild to={biz('/documents', 'category=Contracts')} label="Contracts" />
            <NavChild to={biz('/documents', 'category=Compliance')} label="Compliance" />
          </NavSection>
        )}


        {on('meetings') && (
          <NavSection icon={ICONS.meetings} label="Meetings" expanded={Expanded !== false}
            isOpen={OpenSections?.['Meetings'] || false} onToggle={() => toggleSection('Meetings')}>
            <NavChild to={biz('/meetings')} label="All Meetings" />
            <NavChild to={biz('/meetings', 'status=draft')} label="Drafts" />
            <NavChild to={biz('/meetings', 'status=minutes')} label="Minutes" />
          </NavSection>
        )}

        </NavGroup>
        )}

        <NavGroup icon={ICONS.administration} label="Administration" expanded={Expanded !== false} isOpen={OpenSections?.['g_admin'] || false} onToggle={() => toggleSection('g_admin')}>
        <NavSection icon={ICONS.permissions} label="Roles & Permissions" expanded={Expanded !== false}
          isOpen={OpenSections?.['Permissions'] || false} onToggle={() => toggleSection('Permissions')}>
          <NavChild to={biz('/permissions')} label="Roles" />
          <NavChild to={biz('/permissions', 'tab=members')} label="Team Members" />
          <NavChild to={biz('/permissions', 'tab=audit')} label="Audit Log" />
        </NavSection>

        <NavSection icon={ICONS.settings} label={t('account_sidebar.sec_settings')} expanded={Expanded !== false}
          isOpen={OpenSections?.['Account Settings'] || false} onToggle={() => toggleSection('Account Settings')}>
          <NavChild to={biz('/account/change-type')} label={t('account_sidebar.change_account_type')} />
          <NavChild to={biz('/account/profile')} label={t('account_sidebar.account_profile')} />
          <NavChild to={biz('/account/subscription')} label={t('account_sidebar.subscription')} />
          <NavChild to={biz('/account/delete')} label={t('account_sidebar.delete_account')} />
        </NavSection>

        </NavGroup>

          </nav>
        </>
    </div>
  );
}
