// Ported from Oatmeal Farm Network (src/WebsiteBuilder.jsx). Mechanical adaptations only:
// router package, i18n hook, component paths and API base env var.
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import AccountLayout from '../../components/AccountLayout';
import { useAccount } from '../../lib/AccountContext';
import { isHidden } from '../../lib/hiddenFeatures';

// Lavendir is switched off from hiddenFeatures; see that file.
const LAVENDIR_ON = !isHidden('lavendir');
import WebsiteAIAgent from '../../components/WebsiteAIAgent';
import { LivestockAnimalDetailContent } from '../../components/website/LivestockAnimalDetailContent';

const API = import.meta.env.VITE_LIVESTOCK_API_URL;
const SITE_BASE_URL = 'https://www.OatmealFarmNetwork.com';

// ── Block type catalogue ─────────────────────────────────────────
const BI = ({ children }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const BLOCK_TYPES = [
  { type: 'hero',           icon: <BI><rect x="1" y="2" width="14" height="10" rx="1"/><line x1="1" y1="9" x2="15" y2="9"/><path d="M5 14h6"/></BI>, label: 'Hero Banner',        desc: 'Full-width hero with image, headline & CTA' },
  { type: 'slideshow',      icon: <BI><rect x="1" y="3" width="14" height="10" rx="1"/><line x1="4" y1="13" x2="4" y2="15"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="12" y1="13" x2="12" y2="15"/><circle cx="8" cy="14" r="0.7" fill="currentColor" stroke="none"/></BI>, label: 'Slideshow',           desc: 'Auto-rotating image slideshow with optional captions' },
  { type: 'about',          icon: <BI><path d="M2 8L8 2l6 6"/><path d="M3.5 7V14h3.5v-3.5h2V14H13V7"/></BI>, label: 'About Us',           desc: 'About section with text and image' },
  { type: 'content',        icon: <BI><rect x="3" y="1" width="10" height="14" rx="1"/><line x1="5" y1="5" x2="11" y2="5"/><line x1="5" y1="7.5" x2="11" y2="7.5"/><line x1="5" y1="10" x2="9" y2="10"/></BI>, label: '1 Column Widget',    desc: 'Heading, text, and optional image' },
  { type: 'content_2col',   icon: <BI><rect x="1" y="2" width="6" height="12" rx="1"/><rect x="9" y="2" width="6" height="12" rx="1"/></BI>, label: '2 Column Widget',    desc: 'Two side-by-side content columns (stack on mobile)' },
  { type: 'content_4col',   icon: <BI><rect x="1" y="2" width="3" height="12" rx="0.5"/><rect x="5" y="2" width="3" height="12" rx="0.5"/><rect x="9" y="2" width="3" height="12" rx="0.5"/><rect x="13" y="2" width="3" height="12" rx="0.5"/></BI>, label: '4 Column Widget',    desc: 'Four side-by-side content columns (stack on mobile)' },
  { type: 'livestock',      icon: <BI><ellipse cx="8" cy="10" rx="4.5" ry="3"/><circle cx="4.5" cy="6" r="1.5"/><circle cx="8" cy="5" r="1.5"/><circle cx="11.5" cy="6" r="1.5"/></BI>, label: 'Livestock For Sale', desc: 'Animals listed for sale from your inventory' },
  { type: 'studs',          icon: <BI><ellipse cx="8" cy="10" rx="4.5" ry="3"/><circle cx="4.5" cy="6" r="1.5"/><circle cx="8" cy="5" r="1.5"/><circle cx="11.5" cy="6" r="1.5"/><path d="M8 3.5V2"/><path d="M6.8 2.5l2.4 0"/></BI>, label: 'Stud Services',      desc: 'Stud animals available for breeding' },
  { type: 'produce',        icon: <BI><path d="M8 14V9"/><path d="M4 6c0-2.5 2-4 4-4s4 1.5 4 4-2 3-4 3-4-.5-4-3z"/></BI>, label: 'Produce',            desc: 'Fresh produce from your inventory' },
  { type: 'meat',           icon: <BI><path d="M10 3a4 4 0 0 1 3 6.5L9.5 13H6.5L3 9.5A4 4 0 0 1 6 3z"/><circle cx="8" cy="7" r="1.5"/></BI>, label: 'Meat',               desc: 'Meat inventory available for sale' },
  { type: 'processed_food', icon: <BI><rect x="4" y="5" width="8" height="9" rx="1"/><path d="M6 5V3h4v2"/><line x1="4" y1="8" x2="12" y2="8"/></BI>, label: 'Processed Foods',    desc: 'Value-added & processed food products' },
  { type: 'services',       icon: <BI><path d="M13 3a3.5 3.5 0 0 0-4.2 3.5L2.5 12.5a1.5 1.5 0 1 0 2 2L10 9a3.5 3.5 0 1 0 3-6z"/><circle cx="12.5" cy="3.5" r="1"/></BI>, label: 'Services',           desc: 'Services your business offers' },
  { type: 'marketplace',    icon: <BI><path d="M2 5h12l-1.5 7H3.5z"/><path d="M5.5 5L6.5 2M10.5 5l-1-3"/><circle cx="5.5" cy="13.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="10.5" cy="13.5" r="0.8" fill="currentColor" stroke="none"/></BI>, label: 'Marketplace',        desc: 'All active marketplace listings' },
  { type: 'gallery',        icon: <BI><rect x="1" y="1" width="6" height="6" rx="0.5"/><rect x="9" y="1" width="6" height="6" rx="0.5"/><rect x="1" y="9" width="6" height="6" rx="0.5"/><rect x="9" y="9" width="6" height="6" rx="0.5"/></BI>, label: 'Photo Gallery',      desc: 'Photo gallery from your albums' },
  { type: 'blog',           icon: <BI><path d="M11 2l3 3-8 8H3v-3z"/><line x1="9" y1="4" x2="12" y2="7"/></BI>, label: 'Blog Posts',         desc: 'Latest blog posts' },
  { type: 'events',         icon: <BI><rect x="2" y="3" width="12" height="11" rx="1"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="5" y1="1" x2="5" y2="5"/><line x1="11" y1="1" x2="11" y2="5"/></BI>, label: 'Upcoming Events',    desc: 'Your published upcoming events with dates and Register CTAs' },
  { type: 'contact',        icon: <BI><rect x="2" y="4" width="12" height="9" rx="1"/><path d="M2 4l6 5 6-5"/></BI>, label: 'Contact',            desc: 'Contact information and form' },
  { type: 'links',          icon: <BI><path d="M6 9a3 3 0 0 0 4.5 0L12 7.5A3 3 0 0 0 7.5 3L6 4.5"/><path d="M10 7a3 3 0 0 0-4.5 0L4 8.5A3 3 0 0 0 8.5 13L10 11.5"/></BI>, label: 'Links',              desc: 'Icon links with title and description' },
  { type: 'testimonials',    icon: <BI><path d="M3 3h10v7H3z"/><path d="M5 10v3l4-3"/><line x1="5" y1="6" x2="11" y2="6"/><line x1="5" y1="8" x2="9" y2="8"/></BI>, label: 'All Testimonials',   desc: 'Display all testimonials from your customers' },
  { type: 'testimonial_random', icon: <BI><path d="M2 3h12v8H2z"/><path d="M5 11v3l4-3"/><circle cx="6" cy="7" r="0.8" fill="currentColor" stroke="none"/><circle cx="8" cy="7" r="0.8" fill="currentColor" stroke="none"/><circle cx="10" cy="7" r="0.8" fill="currentColor" stroke="none"/></BI>, label: 'Random Testimonial', desc: 'Show a single random testimonial' },
  { type: 'packages',       icon: <BI><path d="M2 5l6-3 6 3v6l-6 3-6-3z"/><line x1="8" y1="2" x2="8" y2="14"/><path d="M2 5l6 3 6-3"/></BI>, label: 'Package Deals',      desc: 'Bundled animal packages with pricing & savings' },
  { type: 'member_directory', icon: <BI><circle cx="5.5" cy="5" r="2"/><circle cx="10.5" cy="5" r="2"/><path d="M1 14c0-2.5 2-3.5 4.5-3.5h5c2.5 0 4.5 1 4.5 3.5"/></BI>, label: 'Member Directory',   desc: 'Searchable directory of association members (association widget)' },
  { type: 'pedigree_search',  icon: <BI><circle cx="5" cy="11" r="3"/><circle cx="11" cy="5" r="3"/><line x1="8" y1="8" x2="5" y2="11"/><circle cx="8" cy="8" r="0.8" fill="currentColor" stroke="none"/></BI>, label: 'Pedigree / Registry Search', desc: 'Public registry lookup by name or reg number (association widget)' },
  { type: 'fee_schedule',     icon: <BI><rect x="2" y="3" width="12" height="10" rx="1"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="7" y1="3" x2="7" y2="13"/></BI>, label: 'Fee Schedule',       desc: 'Dues & registration fees in a clean table (association widget)' },
  { type: 'hours_of_operation', icon: <BI><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></BI>, label: 'Hours of Operation', desc: 'Weekly hours table — restaurants, vets, markets, tasting rooms' },
  { type: 'faq',            icon: <BI><circle cx="8" cy="8" r="6"/><path d="M6 6a2 2 0 0 1 4 0c0 1.5-2 2-2 3.5"/><circle cx="8" cy="12" r="0.6" fill="currentColor" stroke="none"/></BI>, label: 'FAQ',                 desc: 'Accordion FAQ — questions and answers' },
  { type: 'features',       icon: <BI><polygon points="8,1.5 10,6 15,6 11,9.5 12.5,14 8,11.5 3.5,14 5,9.5 1,6 6,6"/></BI>, label: 'Features / Services', desc: 'Icon-box card grid — what you offer / why choose us' },
  { type: 'team',           icon: <BI><circle cx="8" cy="5" r="2.5"/><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5"/></BI>, label: 'Team / Staff',        desc: 'Photo cards for your team members' },
  { type: 'pricing',        icon: <BI><path d="M9 2H14V7L8 13l-5-5z"/><circle cx="11.5" cy="4.5" r="1" fill="currentColor" stroke="none"/></BI>, label: 'Pricing / Plans',     desc: 'Column-based pricing tiers or rate cards' },
  { type: 'sponsors',       icon: <BI><path d="M8 2l1.5 3.5L13 6l-2.5 2.5.6 3.5L8 10.5l-3.1 1.5.6-3.5L3 6l3.5-.5z"/></BI>, label: 'Sponsors',           desc: 'Sponsor logo grid with names and links' },
  { type: 'cta',            icon: <BI><rect x="1" y="5" width="14" height="6" rx="1"/><line x1="4" y1="8" x2="10" y2="8"/><polyline points="8,6 10,8 8,10"/></BI>, label: 'CTA Banner',         desc: 'Full-width call-to-action bar with headline + button' },
  { type: 'map_location',   icon: <BI><path d="M8 1a4.5 4.5 0 0 0-4.5 4.5C3.5 9 8 15 8 15s4.5-6 4.5-9.5A4.5 4.5 0 0 0 8 1z"/><circle cx="8" cy="5.5" r="1.5"/></BI>, label: 'Map & Location',     desc: 'Address block with optional embedded map' },
  { type: 'divider',        icon: <BI><line x1="1" y1="8" x2="15" y2="8" strokeDasharray="2 2"/></BI>, label: 'Spacer / Divider',   desc: 'Visual separator between sections' },
];

const defaultBlockData = {
  hero:           { headline: 'Welcome to Our Farm', subtext: 'Fresh, local, and sustainably grown.', image_url: '', cta_text: 'Learn More', cta_link: '#about', overlay: true, align: 'center' },
  slideshow:      { images: [], interval_ms: 5000, show_dots: true },
  about:          { heading: 'About Us', body: 'Tell your story here...', image_url: '', images: [], image_position: 'right' },
  content:        { heading: '', body: '', image_url: '', images: [], image_position: 'right' },
  content_2col:   { columns: [
    { heading: '', body: '', image_url: '', images: [], image_position: 'right' },
    { heading: '', body: '', image_url: '', images: [], image_position: 'right' },
  ]},
  content_4col:   { columns: [
    { heading: '', body: '', image_url: '', images: [], image_position: 'right' },
    { heading: '', body: '', image_url: '', images: [], image_position: 'right' },
    { heading: '', body: '', image_url: '', images: [], image_position: 'right' },
    { heading: '', body: '', image_url: '', images: [], image_position: 'right' },
  ]},
  livestock:      { heading: 'Animals For Sale', show_for_sale: true, show_studs: false, max_items: 6 },
  studs:          { heading: 'Stud Services', show_for_sale: false, show_studs: true, max_items: 6 },
  produce:        { heading: 'Fresh Produce', max_items: 8 },
  meat:           { heading: 'Meat', max_items: 8 },
  processed_food: { heading: 'Farm Products', max_items: 8 },
  services:       { heading: 'Our Services', max_items: 6 },
  marketplace:    { heading: 'Shop Our Store', max_items: 12 },
  gallery:        { heading: 'Photo Gallery', columns: 3 },
  blog:           { heading: 'From the Blog', heading_style: 'h1', max_posts: 0, category: '' },
  events:         { heading: 'Upcoming Events', heading_style: 'h1', max_items: 6, layout: 'cards' },
  contact:        { heading: 'Get In Touch', sub_heading: 'Have a question about our products, want to place a bulk order, or just want to say hello? Fill out the form below and we\'ll get back to you as soon as possible.', show_form: true, contact_email: '' },
  links:          { heading: 'Links', columns: 3, groups: [
    { heading: 'Social Media', items: [{ icon_url: '', label: 'Link Title', url: '', description: 'Short description of this link' }] },
    { heading: 'Link Heading 2', items: [{ icon_url: '', label: 'Link Title', url: '', description: 'Short description of this link' }] },
  ]},
  testimonials:       { heading: '', heading_style: 'h1', intro_body: '', max_items: 0 },
  testimonial_random: { heading: '', heading_style: 'h1', intro_body: '', align: 'left' },
  packages:       { heading: 'Package Deals', heading_style: 'h1', intro_body: '' },
  member_directory: { heading: 'Member Directory', intro_body: '', show_search: true, show_state_filter: true, max_items: 24, columns: 3 },
  pedigree_search:  { heading: 'Registry Search', intro_body: 'Search the registry by animal name, registration number, or owner.', show_name: true, show_reg_number: true, show_owner: true, max_results: 20 },
  fee_schedule:     { heading: 'Fee Schedule', intro_body: '', rows: [
    { label: 'Membership — Active', amount: '$50', notes: 'Annual; voting rights' },
    { label: 'Membership — Associate', amount: '$30', notes: 'Annual; no voting' },
    { label: 'Registration — Member', amount: '$15', notes: 'Per animal' },
    { label: 'Registration — Non-member', amount: '$40', notes: 'Per animal' },
    { label: 'Transfer of Ownership', amount: '$10', notes: 'Per transfer' },
  ]},
  map_location: { heading: 'Find Us', address: '', embed_url: '', height: 320 },
  hours_of_operation: { heading: 'Hours', intro_body: '', timezone: '', hours: [
    { day: 'Monday',    open: '',  close: '', closed: false, notes: '' },
    { day: 'Tuesday',   open: '',  close: '', closed: false, notes: '' },
    { day: 'Wednesday', open: '',  close: '', closed: false, notes: '' },
    { day: 'Thursday',  open: '',  close: '', closed: false, notes: '' },
    { day: 'Friday',    open: '',  close: '', closed: false, notes: '' },
    { day: 'Saturday',  open: '',  close: '', closed: false, notes: '' },
    { day: 'Sunday',    open: '',  close: '', closed: true,  notes: '' },
  ]},
  divider:        { height: 40 },
  faq:            { heading: 'Frequently Asked Questions', items: [
    { question: 'What is your return policy?', answer: 'We offer a 30-day return policy on all items.' },
    { question: 'Do you ship nationwide?', answer: 'Yes, we ship to all 50 states.' },
    { question: 'How do I place an order?', answer: 'You can order through our website or by calling us directly.' },
  ]},
  features:       { heading: '', items: [
    { title: 'Feature One', description: 'Describe what makes this feature special.', icon_url: '' },
    { title: 'Feature Two', description: 'Describe what makes this feature special.', icon_url: '' },
    { title: 'Feature Three', description: 'Describe what makes this feature special.', icon_url: '' },
  ]},
  team:           { heading: 'Meet Our Team', members: [
    { name: 'Jane Smith', role: 'Farm Manager', bio: '', photo_url: '' },
    { name: 'John Doe',   role: 'Head Grower',  bio: '', photo_url: '' },
  ]},
  pricing:        { heading: 'Plans & Pricing', intro_body: '', tiers: [
    { name: 'Basic',    price: '$29', period: 'month', description: '', features: ['Feature one', 'Feature two'], highlight: false },
    { name: 'Pro',      price: '$79', period: 'month', description: '', features: ['Everything in Basic', 'Feature three', 'Feature four'], highlight: true },
    { name: 'Premium',  price: '$149', period: 'month', description: '', features: ['Everything in Pro', 'Feature five', 'Priority support'], highlight: false },
  ]},
  sponsors:       { heading: 'Our Sponsors', intro_body: '', columns: 4, logo_height: 80, show_names: true, sponsors: [] },
  cta:            { headline: "Don't Miss Out!", button_text: 'Learn More', button_link: '#', bg_color: '#1a1a1a', text_color: '#ffffff', button_bg_color: '', button_text_color: '#ffffff', align: 'split' },
};

// Normalize any size value to a px string. Accepts 'px', 'rem', 'em', or unitless.
// Returns '' for empty/invalid input so defaults can kick in upstream.
function remToPx(val) {
  if (val === null || val === undefined || val === '') return '';
  const s = String(val).trim();
  if (!s) return '';
  if (s.endsWith('px')) return s;
  const num = parseFloat(s);
  if (isNaN(num)) return '';
  if (s.endsWith('rem') || s.endsWith('em')) return `${Math.round(num * 16)}px`;
  return `${Math.round(num)}px`;
}

// Full web-friendly font list (alphabetical)
const WEB_FONTS = [
  { label: 'Arial',              value: 'Arial, sans-serif' },
  { label: 'Bitter',             value: 'Bitter, serif' },
  { label: 'Caveat',             value: 'Caveat, cursive' },
  { label: 'Courier Prime',      value: 'Courier Prime, monospace' },
  { label: 'Crimson Text',       value: 'Crimson Text, serif' },
  { label: 'Dancing Script',     value: 'Dancing Script, cursive' },
  { label: 'DM Sans',            value: 'DM Sans, sans-serif' },
  { label: 'EB Garamond',        value: 'EB Garamond, serif' },
  { label: 'Georgia',            value: 'Georgia, serif' },
  { label: 'Inter',              value: 'Inter, sans-serif' },
  { label: 'Lato',               value: 'Lato, sans-serif' },
  { label: 'Libre Baskerville',  value: 'Libre Baskerville, serif' },
  { label: 'Lobster',            value: 'Lobster, cursive' },
  { label: 'Lora',               value: 'Lora, serif' },
  { label: 'Manrope',            value: 'Manrope, sans-serif' },
  { label: 'Merriweather',       value: 'Merriweather, serif' },
  { label: 'Montserrat',         value: 'Montserrat, sans-serif' },
  { label: 'Mulish',             value: 'Mulish, sans-serif' },
  { label: 'Noto Sans',          value: 'Noto Sans, sans-serif' },
  { label: 'Nunito',             value: 'Nunito, sans-serif' },
  { label: 'Open Sans',          value: 'Open Sans, sans-serif' },
  { label: 'Oswald',             value: 'Oswald, sans-serif' },
  { label: 'Pacifico',           value: 'Pacifico, cursive' },
  { label: 'Playfair Display',   value: 'Playfair Display, serif' },
  { label: 'Poppins',            value: 'Poppins, sans-serif' },
  { label: 'PT Sans',            value: 'PT Sans, sans-serif' },
  { label: 'PT Serif',           value: 'PT Serif, serif' },
  { label: 'Quicksand',          value: 'Quicksand, sans-serif' },
  { label: 'Raleway',            value: 'Raleway, sans-serif' },
  { label: 'Roboto',             value: 'Roboto, sans-serif' },
  { label: 'Satisfy',            value: 'Satisfy, cursive' },
  { label: 'Source Code Pro',    value: 'Source Code Pro, monospace' },
  { label: 'Source Sans Pro',    value: 'Source Sans Pro, sans-serif' },
  { label: 'Space Mono',         value: 'Space Mono, monospace' },
  { label: 'Tempus Sans ITC',    value: '"Tempus Sans ITC", sans-serif' },
  { label: 'Times New Roman',    value: 'Times New Roman, serif' },
  { label: 'Ubuntu',             value: 'Ubuntu, sans-serif' },
  { label: 'Verdana',            value: 'Verdana, sans-serif' },
  { label: 'Vollkorn',           value: 'Vollkorn, serif' },
  { label: 'Work Sans',          value: 'Work Sans, sans-serif' },
];

// Keep FONTS array for DesignView compatibility
const FONTS = WEB_FONTS.map(f => f.value);

const TEMPLATES = [
  { id: 'farmstead',   name: 'Farmstead',      primary_color: '#3D6B34', secondary_color: '#819360', accent_color: '#FFC567', bg_color: '#FAFAF7', text_color: '#1a2e1a', nav_text_color: '#FFFFFF', footer_bg_color: '#3D6B34', font_family: 'Georgia, serif' },
  { id: 'harvest',     name: 'Harvest',         primary_color: '#8B4513', secondary_color: '#CD853F', accent_color: '#FFD700', bg_color: '#FFF8F0', text_color: '#3d1a00', nav_text_color: '#FFFFFF', footer_bg_color: '#8B4513', font_family: 'Georgia, serif' },
  { id: 'modern',      name: 'Modern Market',   primary_color: '#1E3A5F', secondary_color: '#2E86AB', accent_color: '#A8DADC', bg_color: '#F8FAFB', text_color: '#111827', nav_text_color: '#FFFFFF', footer_bg_color: '#1E3A5F', font_family: 'Inter, sans-serif' },
  { id: 'artisan',     name: 'Artisan',         primary_color: '#6B2737', secondary_color: '#A0522D', accent_color: '#DEB887', bg_color: '#FAF6F0', text_color: '#2d1a0e', nav_text_color: '#FFFFFF', footer_bg_color: '#6B2737', font_family: 'Playfair Display, serif' },
  { id: 'fresh',       name: 'Fresh',           primary_color: '#2E7D32', secondary_color: '#66BB6A', accent_color: '#FFF176', bg_color: '#F1F8F1', text_color: '#1B5E20', nav_text_color: '#FFFFFF', footer_bg_color: '#2E7D32', font_family: 'Montserrat, sans-serif' },
  { id: 'classic',     name: 'Classic',         primary_color: '#1a237e', secondary_color: '#3949AB', accent_color: '#FFD700', bg_color: '#FFFFFF',  text_color: '#111827', nav_text_color: '#FFFFFF', footer_bg_color: '#1a237e', font_family: 'Georgia, serif' },
  { id: 'meadow',      name: 'Meadow',          primary_color: '#4A7C59', secondary_color: '#80B192', accent_color: '#F6D365', bg_color: '#F5FAF6', text_color: '#1c3325', nav_text_color: '#FFFFFF', footer_bg_color: '#4A7C59', font_family: 'Raleway, sans-serif' },
  { id: 'sunset',      name: 'Sunset Ranch',    primary_color: '#C0392B', secondary_color: '#E67E22', accent_color: '#F9CA24', bg_color: '#FFF9F5', text_color: '#2c1206', nav_text_color: '#FFFFFF', footer_bg_color: '#922B21', font_family: 'Lato, sans-serif' },
  { id: 'slate',       name: 'Slate & Stone',   primary_color: '#37474F', secondary_color: '#607D8B', accent_color: '#80CBC4', bg_color: '#F5F7F8', text_color: '#1c2b33', nav_text_color: '#FFFFFF', footer_bg_color: '#263238', font_family: 'Montserrat, sans-serif' },
  { id: 'lavender',    name: 'Lavender Field',  primary_color: '#6A4C93', secondary_color: '#9B72CF', accent_color: '#FFD6E0', bg_color: '#FAF8FF', text_color: '#2d1b4e', nav_text_color: '#FFFFFF', footer_bg_color: '#6A4C93', font_family: 'Raleway, sans-serif' },
  { id: 'coastal',     name: 'Coastal',         primary_color: '#006D77', secondary_color: '#83C5BE', accent_color: '#FFDDD2', bg_color: '#F8FFFE', text_color: '#003d44', nav_text_color: '#FFFFFF', footer_bg_color: '#004E57', font_family: 'Open Sans, sans-serif' },
  { id: 'midnight',    name: 'Midnight',        primary_color: '#1A1A2E', secondary_color: '#16213E', accent_color: '#E94560', bg_color: '#F4F4F8', text_color: '#1A1A2E', nav_text_color: '#FFFFFF', footer_bg_color: '#0F0F1A', font_family: 'Inter, sans-serif' },
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function authHeaders() {
  const token = localStorage.getItem('access_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
async function apiFetch(path, opts = {}) {
  const r = await fetch(`${API}${path}`, { headers: authHeaders(), ...opts });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    let msg = 'Request failed';
    if (typeof e.detail === 'string') msg = e.detail;
    else if (Array.isArray(e.detail)) msg = e.detail.map(d => d.msg || String(d)).join(', ');
    throw new Error(msg);
  }
  return r.json();
}

// ── Shared form helpers ───────────────────────────────────────────
const inp  = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300";
const ta   = `${inp} resize-y min-h-[80px]`;

function FormField({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

// ── Image upload helper ───────────────────────────────────────────
async function uploadImageFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API}/api/website/upload-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url;
}

// ── Drag-and-drop image upload field ─────────────────────────────
function ImageUploadField({ label, value, onChange, hint, compact = false }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      onChange(url);
    } catch { alert('Image upload failed. Please try again.'); }
    finally { setUploading(false); }
  }, [onChange]);

  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      {value && (
        <div className="relative inline-block mb-2">
          <img src={value} alt="" className={`rounded-lg object-cover border border-gray-200 ${compact ? 'h-12 w-20' : 'h-24 w-36'}`} />
          <button onClick={() => onChange('')}
            className="absolute -top-1.5 -right-1.5 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none" style={{ background: '#C0382B' }}>×</button>
        </div>
      )}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors select-none
          ${compact ? 'py-2 px-3 text-xs' : 'py-5 px-4 text-sm'}
          ${dragging ? 'border-[#819360] bg-green-50' : 'border-gray-200 hover:border-[#819360] hover:bg-gray-50'}`}
      >
        {uploading
          ? <span className="text-gray-400 animate-pulse">Uploading…</span>
          : <span className="text-gray-400">Drop image here or <span className="text-[#3D6B34] font-medium">browse</span></span>}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => handleFiles(e.target.files)} />
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Header images manager ─────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

// Parse any stored date string (YYYY-MM-DD or 2000-MM-DD) into {month, day} (1-based).
function parseMD(dateStr) {
  if (!dateStr) return { month: '', day: '' };
  const parts = dateStr.split('-');
  return { month: parseInt(parts[1], 10) || '', day: parseInt(parts[2], 10) || '' };
}

// Encode month+day back to the sentinel format the DB expects.
function encodeMD(month, day) {
  if (!month || !day) return null;
  return `2000-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

// Compare MM-DD continuity: end + 1 day should equal nextStart, wrapping Dec 31 -> Jan 1.
function mdContinuous(endStr, nextStartStr) {
  const e = parseMD(endStr);
  const n = parseMD(nextStartStr);
  if (!e.month || !e.day || !n.month || !n.day) return true;
  const endDate = new Date(2000, e.month - 1, e.day);
  endDate.setDate(endDate.getDate() + 1);
  // wrap: Jan 1 of 2001 means Dec 31 -> Jan 1 is valid
  const endM = endDate.getMonth() + 1;
  const endD = endDate.getDate();
  return endM === n.month && endD === n.day;
}

function fmtMD(dateStr) {
  const { month, day } = parseMD(dateStr);
  if (!month || !day) return '';
  return `${MONTHS[month - 1]} ${day}`;
}

function HeaderImagesManager({ websiteId, hideTitle = false }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Tracks in-progress month/day selections per image before both fields are set.
  // { [imgId]: { start_date: {month, day}, end_date: {month, day} } }
  const [partials, setPartials] = useState({});

  useEffect(() => {
    if (!websiteId) return;
    fetch(`${API}/api/website/header-images/${websiteId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })
      .then(r => r.json())
      .then(data => {
        const imgs = Array.isArray(data) ? data : [];
        setImages(imgs);
        const init = {};
        imgs.forEach(img => {
          init[img.header_image_id] = {
            start_date: parseMD(img.start_date),
            end_date:   parseMD(img.end_date),
          };
        });
        setPartials(init);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [websiteId]);

  const validate = (imgs) => {
    if (imgs.length < 2) return '';
    const sorted = [...imgs].sort((a, b) => (a.start_date || '') < (b.start_date || '') ? -1 : 1);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (!sorted[i].end_date || !sorted[i + 1].start_date) continue;
      if (!mdContinuous(sorted[i].end_date, sorted[i + 1].start_date)) {
        return `Gap detected between "${fmtMD(sorted[i].end_date)}" and "${fmtMD(sorted[i + 1].start_date)}". Dates must be continuous with no gaps.`;
      }
    }
    return '';
  };

  const addImage = async (url) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/website/header-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ website_id: websiteId, image_url: url, sort_order: images.length }),
      });
      const newImg = await res.json();
      setImages(prev => [...prev, newImg]);
      setPartials(prev => ({ ...prev, [newImg.header_image_id]: { start_date: { month: '', day: '' }, end_date: { month: '', day: '' } } }));
    } finally { setSaving(false); }
  };

  const updateImage = async (id, field, value) => {
    const updated = images.map(img => img.header_image_id === id ? { ...img, [field]: value } : img);
    setImages(updated);
    const err = validate(updated);
    setError(err);
    if (!err) {
      await fetch(`${API}/api/website/header-images/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ [field]: value }),
      });
    }
  };

  const handleMDChange = (imgId, field, part, val) => {
    const cur = partials[imgId]?.[field] || { month: '', day: '' };
    const next = { ...cur, [part]: val ? parseInt(val, 10) : '' };
    setPartials(prev => ({ ...prev, [imgId]: { ...(prev[imgId] || {}), [field]: next } }));
    // Only persist to the backend once both month and day are chosen.
    if (next.month && next.day) {
      updateImage(imgId, field, encodeMD(next.month, next.day));
    }
  };

  const deleteImage = async (id) => {
    await fetch(`${API}/api/website/header-images/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    });
    const updated = images.filter(img => img.header_image_id !== id);
    setImages(updated);
    setPartials(prev => { const p = { ...prev }; delete p[id]; return p; });
    setError(validate(updated));
  };

  const sorted = [...images].sort((a, b) => (a.start_date || '') < (b.start_date || '') ? -1 : 1);
  const optional = images.length <= 1;

  return (
    <div>
      {!hideTitle && <h3 className="font-bold text-gray-800 mb-1 pb-2 border-b border-gray-100">Header Images</h3>}
      <p className="text-xs text-gray-400 mb-3">
        Upload one or more banner images. If using multiple, assign start/end month and day with no gaps between them.
      </p>
      {error && (
        <div className="mb-3 bg-amber-50 border border-amber-300 text-amber-700 rounded-lg px-3 py-2 text-xs">{error}</div>
      )}
      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-3 mb-3">
          {sorted.map((img) => {
            const sd = partials[img.header_image_id]?.start_date || { month: '', day: '' };
            const ed = partials[img.header_image_id]?.end_date   || { month: '', day: '' };
            return (
            <div key={img.header_image_id} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
              <div className="flex items-start gap-3">
                {img.image_url && (
                  <img src={img.image_url} alt="" className="w-20 h-12 object-cover rounded-lg border border-gray-200 shrink-0" />
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex gap-2">
                    {[['Start', sd, 'start_date'], ['End', ed, 'end_date']].map(([lbl, val, field]) => (
                      <div key={field} className="flex-1">
                        <label className="block text-xs text-gray-500 mb-0.5">
                          {lbl} {optional && <span className="text-gray-300">(Optional)</span>}
                        </label>
                        <div className="flex gap-1">
                          <select
                            value={val.month || ''}
                            onChange={e => handleMDChange(img.header_image_id, field, 'month', e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-1 py-1 text-xs bg-white"
                          >
                            <option value="">Month</option>
                            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                          </select>
                          <select
                            value={val.day || ''}
                            onChange={e => handleMDChange(img.header_image_id, field, 'day', e.target.value)}
                            className="w-14 border border-gray-200 rounded-lg px-1 py-1 text-xs bg-white"
                          >
                            <option value="">Day</option>
                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => deleteImage(img.header_image_id)}
                  className="shrink-0 text-red-400 hover:text-red-600 text-lg leading-none mt-0.5">×</button>
              </div>
              <div className="mt-2">
                <ImageUploadField compact value={img.image_url} onChange={url => updateImage(img.header_image_id, 'image_url', url)} />
              </div>
            </div>
            );
          })}
        </div>
      )}
      <ImageUploadField
        hint="Upload to add another header image"
        value=""
        onChange={url => url && addImage(url)}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// WYSIWYG CANVAS COMPONENTS
// ══════════════════════════════════════════════════════════════════

// ── PaletteColorPicker: swatch grid + custom color input ─────────
// paletteColors: array of hex strings from the active site theme
// onColor: (hexColor) => void
// dark: boolean — use dark toolbar styling
function PaletteColorPicker({ paletteColors = [], onColor, dark = false }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('#000000');
  const ref = useRef(null);

  // Standard web-safe-ish swatches (6 cols × 6 rows)
  const SWATCHES = [
    '#000000','#434343','#666666','#999999','#b7b7b7','#ffffff',
    '#ff0000','#ff4444','#ff9900','#ffff00','#00ff00','#00ffff',
    '#0000ff','#9900ff','#ff00ff','#ff99cc','#f6b26b','#ffd966',
    '#93c47d','#76a5af','#6fa8dc','#8e7cc3','#c27ba0','#e06666',
    '#cc0000','#e69138','#f1c232','#6aa84f','#45818e','#3d85c8',
    '#674ea7','#a61c00','#85200c','#7f6000','#274e13','#0c343d',
  ];

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const pick = (hex) => { onColor(hex); setOpen(false); };

  const bg     = dark ? '#2d2d3e' : '#fff';
  const border = dark ? '#444'    : '#d1d5db';
  const text   = dark ? '#e2e8f0' : '#111827';

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {/* Trigger button: coloured "A" */}
      <button
        onMouseDown={e => { e.preventDefault(); setOpen(p => !p); }}
        title="Text color"
        style={{
          height: 26, minWidth: 26, padding: '0 5px',
          border: `1px solid ${border}`, borderRadius: 4,
          background: bg, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 3,
          color: custom, fontWeight: 700, fontSize: 13,
        }}
      >
        A<span style={{ display: 'block', width: 12, height: 3, background: custom, borderRadius: 1 }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: '110%', left: 0, zIndex: 99999,
            background: '#fff', border: '1px solid #d1d5db',
            borderRadius: 10, padding: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            width: 220,
          }}
          onMouseDown={e => e.preventDefault()}
        >
          {/* Palette colors from the active theme */}
          {paletteColors.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Site Palette</div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
                {paletteColors.map(c => (
                  <button key={c} onMouseDown={() => { pick(c); setCustom(c); }}
                    title={c}
                    style={{ width: 22, height: 22, borderRadius: 4, background: c, border: '2px solid #e5e7eb', cursor: 'pointer', padding: 0 }} />
                ))}
              </div>
              <div style={{ height: 1, background: '#e5e7eb', margin: '6px 0' }} />
            </>
          )}

          {/* Standard swatches */}
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Standard Colors</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3, marginBottom: 8 }}>
            {SWATCHES.map(c => (
              <button key={c} onMouseDown={() => { pick(c); setCustom(c); }}
                title={c}
                style={{ width: '100%', aspectRatio: '1', borderRadius: 3, background: c, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>

          <div style={{ height: 1, background: '#e5e7eb', margin: '6px 0' }} />

          {/* Custom color */}
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Custom Color</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="color"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              style={{ width: 32, height: 32, border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', padding: 1 }}
            />
            <input
              type="text"
              value={custom}
              maxLength={7}
              onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setCustom(e.target.value); }}
              style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 4, padding: '4px 6px', fontSize: 12, fontFamily: 'monospace' }}
            />
            <button
              onMouseDown={() => { if (/^#[0-9a-fA-F]{6}$/.test(custom)) pick(custom); }}
              style={{ padding: '4px 8px', background: '#3D6B34', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── InlineColorPicker: swatch button that opens palette popup ────────
const SWATCHES = [
  '#000000','#434343','#666666','#999999','#b7b7b7','#ffffff',
  '#ff0000','#ff4444','#ff9900','#ffff00','#00ff00','#00ffff',
  '#0000ff','#9900ff','#ff00ff','#ff99cc','#f6b26b','#ffd966',
  '#93c47d','#76a5af','#6fa8dc','#8e7cc3','#c27ba0','#e06666',
  '#cc0000','#e69138','#f1c232','#6aa84f','#45818e','#3d85c8',
  '#674ea7','#a61c00','#85200c','#7f6000','#274e13','#0c343d',
];

function InlineColorPicker({ value, onChange, paletteColors = [], popupAlign = 'left' }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(value || '#ffffff');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const pick = (hex) => { onChange(hex); setCustom(hex); setOpen(false); };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={() => setOpen(p => !p)}
        title={value}
        style={{ width: 36, height: 36, background: value || '#ffffff', border: '2px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', flexShrink: 0 }}
      />
      <input
        type="text" value={value || ''} maxLength={7}
        onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value); }}
        style={{ width: 76, border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 7px', fontSize: 12, fontFamily: 'monospace', color: '#374151' }}
      />
      {open && (
        <div style={{ position: 'absolute', top: '110%', ...(popupAlign === 'right' ? { right: 0 } : { left: 0 }), zIndex: 99999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 10, padding: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: 220 }}
          onMouseDown={e => e.preventDefault()}>
          {paletteColors.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Site Palette</div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
                {paletteColors.map(c => (
                  <button key={c} onMouseDown={() => pick(c)} title={c}
                    style={{ width: 22, height: 22, borderRadius: 4, background: c, border: '2px solid #e5e7eb', cursor: 'pointer', padding: 0 }} />
                ))}
              </div>
              <div style={{ height: 1, background: '#e5e7eb', margin: '6px 0' }} />
            </>
          )}
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Standard Colors</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3, marginBottom: 8 }}>
            {SWATCHES.map(c => (
              <button key={c} onMouseDown={() => pick(c)} title={c}
                style={{ width: '100%', aspectRatio: '1', borderRadius: 3, background: c, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
          <div style={{ height: 1, background: '#e5e7eb', margin: '6px 0' }} />
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Custom Color</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="color" value={custom} onChange={e => setCustom(e.target.value)}
              style={{ width: 32, height: 32, border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', padding: 1 }} />
            <input type="text" value={custom} maxLength={7}
              onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setCustom(e.target.value); }}
              style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 4, padding: '4px 6px', fontSize: 12, fontFamily: 'monospace' }} />
            <button onMouseDown={() => { if (/^#[0-9a-fA-F]{6}$/.test(custom)) pick(custom); }}
              style={{ padding: '4px 8px', background: '#3D6B34', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── FontPickerDropdown: custom dropdown where each option renders in its own font ──
// globalFont: when set, adds a "(global)" entry at top; undefined = omit that entry (for transient pickers)
function FontPickerDropdown({ value, onChange, globalFont, dark = false, label = 'Font…' }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });

  const displayFont  = value || globalFont || 'inherit';
  const displayLabel = value
    ? (WEB_FONTS.find(f => f.value === value)?.label || value.split(',')[0].trim())
    : globalFont
      ? globalFont.split(',')[0].trim()
      : label;

  const openDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!btnRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onMouseDown={openDropdown}
        title={displayLabel}
        style={{
          fontFamily: displayFont,
          background: dark ? '#2d2d3e' : '#fff',
          color: dark ? '#e2e8f0' : '#374151',
          border: dark ? 'none' : '1px solid #e5e7eb',
          borderRadius: 4,
          fontSize: dark ? 11 : 12,
          padding: '3px 6px',
          cursor: 'pointer',
          maxWidth: dark ? 120 : 150,
          minWidth: dark ? 70 : 90,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'left',
        }}
      >
        {displayLabel} ▾
      </button>
      {open && createPortal(
        <div
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            zIndex: 999999,
            background: dark ? '#1e1e2e' : '#fff',
            border: dark ? '1px solid #555' : '1px solid #e5e7eb',
            borderRadius: 6,
            boxShadow: '0 6px 24px rgba(0,0,0,0.28)',
            maxHeight: 300,
            overflowY: 'auto',
            minWidth: 200,
          }}
        >
          {globalFont !== undefined && (
            <div
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onChange(''); setOpen(false); }}
              style={{
                fontFamily: globalFont || 'inherit',
                padding: '7px 14px',
                fontSize: 13,
                cursor: 'pointer',
                color: dark ? '#94a3b8' : '#6b7280',
                borderBottom: dark ? '1px solid #333' : '1px solid #f3f4f6',
                background: !value ? (dark ? '#2d2d3e' : '#f0fdf4') : 'transparent',
              }}
            >
              {globalFont ? globalFont.split(',')[0].trim() : 'Default'}
              <span style={{ fontSize: 11, opacity: 0.65, marginLeft: 6 }}>(global)</span>
            </div>
          )}
          {WEB_FONTS.map(f => (
            <div
              key={f.value}
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onChange(f.value); setOpen(false); }}
              style={{
                fontFamily: f.value,
                padding: '7px 14px',
                fontSize: 13,
                cursor: 'pointer',
                background: value === f.value ? (dark ? '#2d2d3e' : '#f0fdf4') : 'transparent',
                color: dark ? '#e2e8f0' : '#1f2937',
              }}
            >
              {f.label}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ── ToolbarColorPicker: compact "A" swatch for use inside dark editor toolbars ──
function ToolbarColorPicker({ color, onChange, paletteColors = [] }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(color || '#000000');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const pick = (hex) => { onChange(hex); setCustom(hex); setOpen(false); };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onMouseDown={e => { e.preventDefault(); setOpen(p => !p); }}
        title="Font color"
        style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '3px 7px', borderRadius: 4, cursor: 'pointer', gap: 2,
          border: '1px solid #475569', background: open ? '#475569' : '#334155', color: '#e2e8f0', lineHeight: 1,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700 }}>A</span>
        <span style={{ display: 'block', width: 14, height: 3, borderRadius: 1, background: color || '#ffffff' }} />
      </button>
      {open && (
        <div
          style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 99999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 10, padding: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.22)', width: 220 }}
          onMouseDown={e => e.preventDefault()}
        >
          {paletteColors.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Site Palette</div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
                {paletteColors.map(c => (
                  <button key={c} onMouseDown={() => pick(c)} title={c}
                    style={{ width: 22, height: 22, borderRadius: 4, background: c, border: '2px solid #e5e7eb', cursor: 'pointer', padding: 0 }} />
                ))}
              </div>
              <div style={{ height: 1, background: '#e5e7eb', margin: '6px 0' }} />
            </>
          )}
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Standard Colors</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3, marginBottom: 8 }}>
            {SWATCHES.map(c => (
              <button key={c} onMouseDown={() => pick(c)} title={c}
                style={{ width: '100%', aspectRatio: '1', borderRadius: 3, background: c, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
          <div style={{ height: 1, background: '#e5e7eb', margin: '6px 0' }} />
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Custom Color</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="color" value={custom} onChange={e => setCustom(e.target.value)}
              style={{ width: 32, height: 32, border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', padding: 1 }} />
            <input type="text" value={custom} maxLength={7}
              onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setCustom(e.target.value); }}
              style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 4, padding: '4px 6px', fontSize: 12, fontFamily: 'monospace' }} />
            <button onMouseDown={() => { if (/^#[0-9a-fA-F]{6}$/.test(custom)) pick(custom); }}
              style={{ padding: '4px 8px', background: '#3D6B34', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ToolbarBgColorPicker: compact "BG" button for block background color ──
function ToolbarBgColorPicker({ color, onChange, paletteColors = [] }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(color || '#ffffff');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const pick = (hex) => { onChange(hex); setCustom(hex); setOpen(false); };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onMouseDown={e => { e.preventDefault(); setOpen(p => !p); }}
        title="Block background color"
        style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '3px 6px', borderRadius: 4, cursor: 'pointer', gap: 2,
          border: '1px solid #475569', background: open ? '#475569' : '#334155', lineHeight: 1,
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8' }}>BG</span>
        <span style={{ display: 'block', width: 14, height: 3, borderRadius: 1, background: color || '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }} />
      </button>
      {open && (
        <div
          style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 99999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 10, padding: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.22)', width: 220 }}
          onMouseDown={e => e.preventDefault()}
        >
          {paletteColors.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Site Palette</div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
                {paletteColors.map(c => (
                  <button key={c} onMouseDown={() => pick(c)} title={c}
                    style={{ width: 22, height: 22, borderRadius: 4, background: c, border: '2px solid #e5e7eb', cursor: 'pointer', padding: 0 }} />
                ))}
              </div>
              <div style={{ height: 1, background: '#e5e7eb', margin: '6px 0' }} />
            </>
          )}
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Standard Colors</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3, marginBottom: 8 }}>
            {SWATCHES.map(c => (
              <button key={c} onMouseDown={() => pick(c)} title={c}
                style={{ width: '100%', aspectRatio: '1', borderRadius: 3, background: c, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
          <div style={{ height: 1, background: '#e5e7eb', margin: '6px 0' }} />
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>Custom Color</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="color" value={custom} onChange={e => setCustom(e.target.value)}
              style={{ width: 32, height: 32, border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', padding: 1 }} />
            <input type="text" value={custom} maxLength={7}
              onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setCustom(e.target.value); }}
              style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 4, padding: '4px 6px', fontSize: 12, fontFamily: 'monospace' }} />
            <button onMouseDown={() => { if (/^#[0-9a-fA-F]{6}$/.test(custom)) pick(custom); }}
              style={{ padding: '4px 8px', background: '#3D6B34', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
              Apply
            </button>
          </div>
          {color && (
            <button onMouseDown={() => { onChange(''); setOpen(false); }}
              style={{ marginTop: 8, width: '100%', padding: '4px', background: 'none', border: '1px solid #e5e7eb', borderRadius: 4, cursor: 'pointer', fontSize: 11, color: '#6b7280' }}>
              Reset to default
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared paste handler: strips all formatting, inserts plain text only ──
// Used for headings and captions where block format doesn't apply.
const pastePlainText = e => {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, text);
};

// ── Body paste handler: strips formatting AND resets to body/paragraph format ──
// Splits multi-line content into <p> elements so each line is body-formatted.
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pasteAsBodyText = e => {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text/plain');
  if (!text) return;
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return;
  if (lines.length === 1) {
    // Single line — reset block to paragraph then insert as plain text
    document.execCommand('formatBlock', false, 'p');
    document.execCommand('insertText', false, lines[0]);
  } else {
    // Multiple lines — insert each as its own <p> so all land in body format
    document.execCommand('insertHTML', false, lines.map(l => `<p>${esc(l)}</p>`).join(''));
  }
};

// ── CaptionField: editable image caption with visible placeholder ────────
function CaptionField({ initial, onSave }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (ref.current) ref.current.textContent = initial;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const isEmpty = !focused && !(ref.current?.textContent?.trim());
  return (
    <div style={{ position: 'relative', marginTop: 6 }}>
      {/* Placeholder shown when empty and not focused */}
      {isEmpty && (
        <span style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.76rem', color: '#94a3b8', fontStyle: 'italic',
          pointerEvents: 'none',
        }}>
          {wb('caption_ph')}
        </span>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setFocused(true)}
        onBlur={e => { setFocused(false); onSave(e.currentTarget.textContent.trim()); }}
        style={{
          outline: 'none', fontSize: '0.76rem', color: '#475569', fontStyle: 'italic',
          textAlign: 'center', padding: '4px 6px', minHeight: '1.5em',
          background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 4,
          cursor: 'text',
        }}
      />
    </div>
  );
}

// ── InlineContentEditor: direct canvas editing for about/content blocks ─
// `data` optional — when supplied (e.g. from a multi-column wrapper), the editor
// reads/writes that object instead of block.block_data. `onFieldSave(key, val)`
// is still called by the editor for every change, but the parent decides where
// the save goes (top-level vs. nested column).
function InlineContentEditor({ block, site, onFieldSave, data, compact, pages, bodyField = 'body', bodyOnly = false }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const d          = data || block.block_data || {};
  const fontFamily = site?.font_family        || 'inherit';
  const bgColor    = d.bg_color || site?.page_background_color || site?.bg_color || '#fff';
  const bgWidth    = site?.body_bg_width      || '100%';
  const cWidth     = compact ? '100%' : (site?.body_content_width || '100%');
  // Compact mode (4-col blocks) shrinks the outer padding so content isn't
  // smothered by ~40px side gutters when the column is already narrow.
  const outerPad   = bodyOnly ? '0.5rem' : compact ? '0.5rem 0.5rem' : '1.75rem 2.5rem';

  // Derive image source info first (needed for imgWidth initial state)
  const imgs    = Array.isArray(d.images) && d.images.length > 0 ? d.images : [];
  const img0Obj = imgs[0] && typeof imgs[0] !== 'string' ? imgs[0] : null;
  const rawUrl  = d.image_url || (img0Obj ? img0Obj.url : (typeof imgs[0] === 'string' ? imgs[0] : null));
  const pos     = d.image_position || img0Obj?.wrap || 'right';
  const isSide  = pos === 'left' || pos === 'right';
  const isLeft  = pos === 'left';

  const headingRef      = useRef(null);
  const bodyRef         = useRef(null);
  const savedSel        = useRef(null);   // cloned Range
  const activeEl        = useRef(null);   // which contenteditable last had focus
  const imgWrapRef      = useRef(null);
  const htmlTextareaRef = useRef(null);
  // Mirror normImages() in WebsitePublic: prefer d.image_width, then images[0].w, then default 38
  const [imgWidth, setImgWidth] = useState(d.image_width ?? img0Obj?.w ?? 38); // percent
  const [htmlMode, setHtmlMode] = useState(false);
  const [selStyle, setSelStyle] = useState('');
  const [selFont,  setSelFont]  = useState('');
  const [selSize,  setSelSize]  = useState('');
  const [selColor, setSelColor] = useState('#000000');

  // Image insertion panel + floating toolbar
  const fileInputRef    = useRef(null);
  const [imgPanel, setImgPanel]           = useState(false);
  const [imgUrl, setImgUrl]               = useState('');
  const [imgAlign, setImgAlign]           = useState('right');
  const [vidPanel, setVidPanel]           = useState(false);
  const [vidUrl, setVidUrl]               = useState('');
  const [vidAlign, setVidAlign]           = useState('center');
  const [linkPanel, setLinkPanel]         = useState(false);
  const [linkMode, setLinkMode]           = useState('url');   // 'url' | 'page'
  const [linkHref, setLinkHref]           = useState('');
  const [linkPageSlug, setLinkPageSlug]   = useState('');
  const [draggingOver, setDraggingOver]   = useState(false);
  const [panelDragging, setPanelDragging] = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [selectedImg, setSelectedImg]     = useState(null);
  const [imgToolbarPos, setImgToolbarPos] = useState({ top: 0, left: 0 });
  const [imgCaption, setImgCaption]       = useState('');
  const [imgRect, setImgRect]             = useState(null);
  const resizingRef                       = useRef(null);

  // Drag-to-resize image
  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX    = e.clientX;
    const startW    = imgWrapRef.current?.offsetWidth || 200;
    const container = imgWrapRef.current?.parentElement?.offsetWidth || 600;
    // left: drag right-edge rightward; right/center/full: drag left-edge leftward
    const dragRight = isLeft || !isSide;
    const onMove = (mv) => {
      const delta = dragRight ? mv.clientX - startX : startX - mv.clientX;
      const newPx = Math.max(80, Math.min(container * 0.95, startW + delta));
      const pct   = Math.round((newPx / container) * 100);
      setImgWidth(pct);
    };
    const onUp = (mv) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      const delta = dragRight ? mv.clientX - startX : startX - mv.clientX;
      const newPx = Math.max(80, Math.min(container * 0.95, startW + delta));
      const pct   = Math.round((newPx / container) * 100);
      onFieldSave('image_width', pct);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.textContent = d.heading || '';
      Object.assign(headingRef.current.style, headingTypoStyle(d.heading_style, site));
    }
    if (bodyRef.current) bodyRef.current.innerHTML = d[bodyField] || '';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save selection from whichever editable currently has focus
  const saveSel = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const anchor = sel.anchorNode;
    if (headingRef.current?.contains(anchor)) {
      activeEl.current  = headingRef.current;
      savedSel.current  = sel.getRangeAt(0).cloneRange();
    } else if (bodyRef.current?.contains(anchor)) {
      activeEl.current  = bodyRef.current;
      savedSel.current  = sel.getRangeAt(0).cloneRange();
    }
  };

  // Detect style/font/size at the current cursor position and update toolbar state
  const detectSelectionProps = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const anchor = sel.anchorNode;
    let el = anchor?.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor;

    // Walk up to find nearest block tag
    let walker = el;
    let blockTag = '';
    const roots = [bodyRef.current, headingRef.current].filter(Boolean);
    while (walker && !roots.includes(walker)) {
      const tag = walker.tagName?.toLowerCase();
      if (['h1','h2','h3','h4','p'].includes(tag)) { blockTag = tag; break; }
      walker = walker.parentElement;
    }
    setSelStyle(blockTag);

    // Walk up to find nearest inline font-family / font-size / color
    let fontVal = '';
    let sizeVal = '';
    let colorVal = '';
    let walker2 = el;
    while (walker2 && !roots.includes(walker2)) {
      if (!fontVal  && walker2.style?.fontFamily) fontVal  = walker2.style.fontFamily;
      if (!sizeVal  && walker2.style?.fontSize)   sizeVal  = walker2.style.fontSize;
      if (!colorVal && walker2.style?.color)      colorVal = walker2.style.color;
      if (fontVal && sizeVal && colorVal) break;
      walker2 = walker2.parentElement;
    }
    setSelFont(fontVal);
    setSelSize(sizeVal ? String(parseInt(sizeVal)) : '');
    // Normalise rgb() → hex for display in swatch
    if (colorVal) {
      const m = colorVal.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (m) {
        colorVal = '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
      }
      setSelColor(colorVal);
    }
  };

  const saveAndDetect = () => { saveSel(); detectSelectionProps(); };

  // Restore focus + selection to whichever editable was last active
  const restoreSel = () => {
    const el = activeEl.current || bodyRef.current;
    if (!el) return;
    el.focus();
    if (savedSel.current) {
      try {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedSel.current);
      } catch (_) { /* stale range — ignore */ }
    }
  };

  // ── Toolbar command helpers ──────────────────────────────────────

  // For BUTTONS: capture the live selection at mousedown (guaranteed valid),
  // prevent focus loss, re-apply the captured range, then exec the command.
  // This is more reliable than trusting e.preventDefault() alone to preserve
  // selection across all browsers.
  const btnCmd = (e, cmd, val = null) => {
    const sel = window.getSelection();
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : savedSel.current;
    const el = sel && sel.rangeCount > 0
      ? (headingRef.current?.contains(sel.anchorNode) ? headingRef.current
        : bodyRef.current?.contains(sel.anchorNode)  ? bodyRef.current
        : activeEl.current)
      : activeEl.current;
    e.preventDefault();
    if (el) {
      el.focus();
      if (range) {
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(range);
      }
    }
    document.execCommand(cmd, false, val);
    saveSel();
  };

  // Block-level style — heading and body handled differently:
  // • Heading: apply DB typography as inline styles + save heading_style to block_data
  // • Body: use formatBlock so h1/h2/h3/h4/p tags get .rte-body CSS
  const applyBlock = (tag) => {
    if (activeEl.current === headingRef.current && headingRef.current) {
      const styles = headingTypoStyle(tag, site);
      Object.assign(headingRef.current.style, styles);
      onFieldSave('heading_style', tag);
      return;
    }
    restoreSel();
    document.execCommand('formatBlock', false, tag);
    saveSel();
  };

  // Wrap selection in a span with an explicit font-family.
  // extractContents+insertNode works across element boundaries where surroundContents fails.
  const applyFont = (fontFam) => {
    restoreSel();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (sel.isCollapsed) {
      document.execCommand('fontName', false, fontFam);
      return;
    }
    try {
      const range    = sel.getRangeAt(0);
      const fragment = range.extractContents();
      const span     = document.createElement('span');
      span.style.fontFamily = fontFam;
      span.appendChild(fragment);
      range.insertNode(span);
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);
      saveSel();
    } catch (_) {
      document.execCommand('fontName', false, fontFam);
    }
  };

  const openLinkPanel = (e) => {
    e.preventDefault();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && (bodyRef.current?.contains(sel.anchorNode) || headingRef.current?.contains(sel.anchorNode))) {
      savedSel.current = sel.getRangeAt(0).cloneRange();
      activeEl.current = headingRef.current?.contains(sel.anchorNode) ? headingRef.current : bodyRef.current;
    }
    setLinkPanel(p => !p);
  };

  // Apply a URL link: external / mailto / https normalised
  const applyUrlLink = () => {
    const val = (linkHref || '').trim();
    if (!val) return;
    const href = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? `mailto:${val}`
               : /^https?:\/\//i.test(val)               ? val
               : /^mailto:/i.test(val)                   ? val
               : `https://${val}`;
    restoreSel();
    document.execCommand('createLink', false, href);
    const el = activeEl.current || bodyRef.current;
    el?.querySelectorAll('a[href="' + href + '"]').forEach(a => {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      a.removeAttribute('data-page-slug');
    });
    if (bodyRef.current) onFieldSave(bodyField, bodyRef.current.innerHTML);
    setLinkPanel(false);
    setLinkHref('');
  };

  // Apply an internal-page link: uses data-page-slug so the public SPA
  // intercepts the click and calls setActivePage.
  const applyPageLink = () => {
    if (!linkPageSlug) return;
    const sentinel = '#__ofn_page_link__';
    restoreSel();
    document.execCommand('createLink', false, sentinel);
    const el = activeEl.current || bodyRef.current;
    el?.querySelectorAll('a[href="' + sentinel + '"]').forEach(a => {
      a.setAttribute('href', '#');
      a.setAttribute('data-page-slug', linkPageSlug);
      a.removeAttribute('target');
      a.removeAttribute('rel');
    });
    if (bodyRef.current) onFieldSave(bodyField, bodyRef.current.innerHTML);
    setLinkPanel(false);
    setLinkPageSlug('');
  };

  const clearFormatting = () => {
    const el = activeEl.current || bodyRef.current;
    if (!el) return;
    el.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('removeFormat', false, null);
    el.querySelectorAll('[style]').forEach(n => n.removeAttribute('style'));
    el.querySelectorAll('font').forEach(n => {
      const span = document.createElement('span');
      span.textContent = n.textContent;
      n.replaceWith(span);
    });
  };

  const applyFontSize = (px) => {
    restoreSel();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    try {
      const range    = sel.getRangeAt(0);
      const fragment = range.extractContents();
      const span     = document.createElement('span');
      span.style.fontSize = px + 'px';
      span.appendChild(fragment);
      range.insertNode(span);
      const nr = document.createRange();
      nr.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(nr);
      saveSel();
    } catch (_) { /* ignore */ }
  };

  const applyFontColor = (hex) => {
    restoreSel();
    document.execCommand('foreColor', false, hex);
    setSelColor(hex);
    saveSel();
  };

  // ── Image insertion helpers ────────────────────────────────────────
  const openImgPanel = (e) => {
    e.preventDefault();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && bodyRef.current?.contains(sel.anchorNode)) {
      savedSel.current = sel.getRangeAt(0).cloneRange();
      activeEl.current = bodyRef.current;
    }
    setImgPanel(p => !p);
  };

  const _figCss = (align) => ({
    left:   'float:left;margin:0 1rem 0.75rem 0;max-width:50%;border-radius:6px;',
    right:  'float:right;margin:0 0 0.75rem 1rem;max-width:50%;border-radius:6px;',
    center: 'display:block;margin:0.75rem auto;max-width:80%;clear:both;border-radius:6px;',
  }[align] || 'display:block;margin:0.75rem auto;max-width:80%;clear:both;border-radius:6px;');

  const insertBodyImage = (url, align) => {
    if (!url || !bodyRef.current) return;
    const figure = document.createElement('figure');
    figure.style.cssText = _figCss(align);
    const img = document.createElement('img');
    img.src = url;
    img.style.cssText = 'width:100%;display:block;border-radius:6px;';
    const figcaption = document.createElement('figcaption');
    figcaption.style.cssText = 'font-size:0.82em;color:#6b7280;text-align:center;font-style:italic;margin-top:0.3em;min-height:1em;';
    figure.appendChild(img);
    figure.appendChild(figcaption);
    const range = savedSel.current;
    let refBlock = null;
    if (range && bodyRef.current.contains(range.commonAncestorContainer)) {
      let node = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      if (node === bodyRef.current) {
        refBlock = bodyRef.current.children[range.startOffset] || null;
      } else {
        while (node && node.parentElement !== bodyRef.current) node = node.parentElement;
        if (node && node !== bodyRef.current) refBlock = node;
      }
    }
    if (refBlock) {
      bodyRef.current.insertBefore(figure, refBlock);
    } else {
      bodyRef.current.appendChild(figure);
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      bodyRef.current.appendChild(p);
    }
    onFieldSave(bodyField, bodyRef.current.innerHTML);
    setImgPanel(false);
    setImgUrl('');
  };

  const handlePanelFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      insertBodyImage(url, imgAlign);
    } catch { alert('Image upload failed.'); }
    finally { setUploading(false); }
  };

  const openVidPanel = (e) => {
    e.preventDefault();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && bodyRef.current?.contains(sel.anchorNode)) {
      savedSel.current = sel.getRangeAt(0).cloneRange();
      activeEl.current = bodyRef.current;
    }
    setVidPanel(p => !p);
  };

  // Parse video URL → embed URL. Returns null for direct video files.
  const _parseVideoEmbed = (raw) => {
    const url = (raw || '').trim();
    if (!url) return null;
    // YouTube (watch, youtu.be, shorts, embed)
    const ytFull  = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/);
    const ytShort = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    const ytId = (ytFull && ytFull[1]) || (ytShort && ytShort[1]);
    if (ytId) return `https://www.youtube.com/embed/${ytId}`;
    // Vimeo
    const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
    return null;
  };

  // If the raw input contains an <iframe>, extract and sanitize it.
  // Accepts bare <iframe> tags or snippets wrapped in <div>/other markup.
  const _parseRawIframe = (raw) => {
    const txt = (raw || '').trim();
    if (!/<iframe[\s>]/i.test(txt)) return null;
    const tpl = document.createElement('template');
    tpl.innerHTML = txt;
    const iframe = tpl.content.querySelector('iframe');
    if (!iframe) return null;
    // Whitelist attributes — drop anything we don't explicitly allow
    const allowed = ['src','allow','allowfullscreen','title','loading','referrerpolicy'];
    [...iframe.attributes].forEach(a => {
      if (!allowed.includes(a.name.toLowerCase())) iframe.removeAttribute(a.name);
    });
    // Force responsive sizing
    iframe.setAttribute('frameborder', '0');
    iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:0;';
    return iframe;
  };

  const _vidFigCss = (align) => ({
    left:   'float:left;margin:0 1rem 0.75rem 0;width:60%;clear:both;',
    right:  'float:right;margin:0 0 0.75rem 1rem;width:60%;clear:both;',
    center: 'display:block;margin:0.75rem auto;width:80%;clear:both;',
  }[align] || 'display:block;margin:0.75rem auto;width:80%;clear:both;');

  const insertBodyVideo = (url, align) => {
    if (!url || !bodyRef.current) return;
    const rawIframe = _parseRawIframe(url);
    const embed = rawIframe ? null : _parseVideoEmbed(url);
    const figure = document.createElement('figure');
    figure.style.cssText = _vidFigCss(align);
    // Wrapper keeps 16:9 aspect ratio
    const wrap = document.createElement('div');
    wrap.className = 'wb-video-wrap';
    wrap.style.cssText = 'position:relative;width:100%;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;background:#000;';
    if (rawIframe) {
      wrap.appendChild(rawIframe);
    } else if (embed) {
      const iframe = document.createElement('iframe');
      iframe.src = embed;
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:0;';
      wrap.appendChild(iframe);
    } else {
      // Treat as a direct video file
      const video = document.createElement('video');
      video.src = url;
      video.controls = true;
      video.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
      wrap.appendChild(video);
    }
    // Click shield — intercepts clicks in the builder so the user can select
    // the video without the iframe swallowing input. Hidden on the public site.
    const shield = document.createElement('div');
    shield.className = 'wb-video-shield';
    shield.style.cssText = 'position:absolute;inset:0;z-index:2;cursor:pointer;';
    wrap.appendChild(shield);
    figure.appendChild(wrap);
    const figcaption = document.createElement('figcaption');
    figcaption.style.cssText = 'font-size:0.82em;color:#6b7280;text-align:center;font-style:italic;margin-top:0.3em;min-height:1em;';
    figure.appendChild(figcaption);

    const range = savedSel.current;
    let refBlock = null;
    if (range && bodyRef.current.contains(range.commonAncestorContainer)) {
      let node = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      if (node === bodyRef.current) {
        refBlock = bodyRef.current.children[range.startOffset] || null;
      } else {
        while (node && node.parentElement !== bodyRef.current) node = node.parentElement;
        if (node && node !== bodyRef.current) refBlock = node;
      }
    }
    if (refBlock) {
      bodyRef.current.insertBefore(figure, refBlock);
    } else {
      bodyRef.current.appendChild(figure);
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      bodyRef.current.appendChild(p);
    }
    onFieldSave(bodyField, bodyRef.current.innerHTML);
    setVidPanel(false);
    setVidUrl('');
  };

  const _rootBodyEl = (node) => {
    if (!node || !bodyRef.current) return null;
    let n = node;
    while (n && n.parentElement !== bodyRef.current) n = n.parentElement;
    return (n && n.parentElement === bodyRef.current) ? n : null;
  };

  const _liftToBody = (img) => {
    // Don't lift if already inside a figure that is a body child
    if (img.parentElement?.tagName === 'FIGURE') return;
    let node = img;
    while (node.parentElement && node.parentElement !== bodyRef.current) node = node.parentElement;
    if (node !== img && node.parentElement === bodyRef.current) {
      bodyRef.current.insertBefore(img, node);
      if (!node.textContent.trim() && node.children.length === 0) node.remove();
    }
  };

  const selectBodyImg = (img) => {
    setSelectedImg(img);
    const fig = img.parentElement?.tagName === 'FIGURE' ? img.parentElement : null;
    setImgCaption(fig ? (fig.querySelector('figcaption')?.textContent || '') : '');
    const r = img.getBoundingClientRect();
    setImgRect(r);
    setImgToolbarPos({ top: r.top - 80, left: r.left });
    const hide = () => { setSelectedImg(null); setImgRect(null); };
    window.addEventListener('scroll', hide, { once: true, capture: true });
  };

  const startBodyImgResize = (e, dir) => {
    e.preventDefault();
    e.stopPropagation();
    const img = selectedImg;
    if (!img) return;
    const isVideo  = img.classList?.contains('wb-video-wrap');
    const fig      = img.parentElement?.tagName === 'FIGURE' ? img.parentElement : null;
    const startX   = e.clientX;
    const startY   = e.clientY;
    const startW   = fig ? fig.offsetWidth : img.offsetWidth;
    const startH   = (isVideo && fig) ? fig.offsetHeight : img.offsetHeight;
    const aspect   = startH / startW;
    // n/s handles resize height only for images. Videos always keep 16:9 via the wrapper.
    const heightOnly = !isVideo && (dir === 'n' || dir === 's');
    resizingRef.current = true;
    const onMove = (mv) => {
      let newW = startW, newH = startH;
      if (heightOnly) {
        if (dir === 's') newH = Math.max(30, startH + (mv.clientY - startY));
        if (dir === 'n') newH = Math.max(30, startH - (mv.clientY - startY));
        img.style.height = newH + 'px';
        img.style.objectFit = img.style.objectFit || 'cover';
      } else {
        if (dir === 'e')  newW = Math.max(80, startW + (mv.clientX - startX));
        if (dir === 'w')  newW = Math.max(80, startW - (mv.clientX - startX));
        if (dir === 'se') newW = Math.max(80, startW + (mv.clientX - startX));
        if (dir === 'sw') newW = Math.max(80, startW - (mv.clientX - startX));
        if (dir === 'ne') newW = Math.max(80, startW + (mv.clientX - startX));
        if (dir === 'nw') newW = Math.max(80, startW - (mv.clientX - startX));
        if (fig) {
          // Resize the figure — keeps image + caption aligned within the same
          // width. For video wrappers the 16:9 aspect is preserved by CSS.
          fig.style.maxWidth = 'none';
          fig.style.width    = newW + 'px';
          if (!isVideo) {
            // Let the img fill the figure so it and the caption share its width.
            img.style.width  = '100%';
            img.style.height = 'auto';
          }
        } else {
          newH = Math.round(newW * aspect);
          img.style.width  = newW + 'px';
          img.style.height = newH + 'px';
        }
      }
      setImgRect(img.getBoundingClientRect());
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      resizingRef.current = false;
      onFieldSave(bodyField, bodyRef.current.innerHTML);
      setImgRect(img.getBoundingClientRect());
      setImgToolbarPos({ top: img.getBoundingClientRect().top - 80, left: img.getBoundingClientRect().left });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const applyCaption = (text) => {
    if (!selectedImg) return;
    const fig = selectedImg.parentElement?.tagName === 'FIGURE' ? selectedImg.parentElement : null;
    if (!fig) return;
    let fc = fig.querySelector('figcaption');
    if (!fc) {
      fc = document.createElement('figcaption');
      fc.style.cssText = 'font-size:0.82em;color:#6b7280;text-align:center;font-style:italic;margin-top:0.3em;min-height:1em;';
      fig.appendChild(fc);
    }
    fc.textContent = text;
    onFieldSave(bodyField, bodyRef.current.innerHTML);
  };

  const applyImgAlign = (align) => {
    if (!selectedImg) return;
    const isVideo = selectedImg.classList?.contains('wb-video-wrap');
    const fig = selectedImg.parentElement?.tagName === 'FIGURE' ? selectedImg.parentElement : null;
    if (fig) {
      fig.style.cssText = isVideo ? _vidFigCss(align) : _figCss(align);
    } else {
      _liftToBody(selectedImg);
      selectedImg.style.cssText = _figCss(align);
    }
    onFieldSave(bodyField, bodyRef.current.innerHTML);
    const r = selectedImg.getBoundingClientRect();
    setImgRect(r);
    setImgToolbarPos({ top: r.top - 80, left: r.left });
  };

  const deleteBodyImg = () => {
    if (!selectedImg) return;
    const fig = selectedImg.parentElement?.tagName === 'FIGURE' ? selectedImg.parentElement : null;
    if (fig) fig.remove();
    else selectedImg.remove();
    onFieldSave(bodyField, bodyRef.current.innerHTML);
    setSelectedImg(null);
    setImgRect(null);
  };

  // Toggle [data-no-style] — opts this image out of the site-wide image
  // styling (border radius, shadow, margin) set in Design → Images.
  const toggleImgRawStyle = () => {
    if (!selectedImg) return;
    const isVideo = selectedImg.classList?.contains('wb-video-wrap');
    const target  = isVideo ? selectedImg.querySelector('iframe,video') : selectedImg;
    if (!target) return;
    if (target.hasAttribute('data-no-style')) target.removeAttribute('data-no-style');
    else target.setAttribute('data-no-style', '');
    onFieldSave(bodyField, bodyRef.current.innerHTML);
    // force a rerender of the toolbar so the button reflects the new state
    setImgRect(selectedImg.getBoundingClientRect());
  };

  const moveBodyImg = (dir) => {
    if (!selectedImg) return;
    const root = _rootBodyEl(selectedImg);
    if (!root) return;
    if (dir < 0) { const prev = root.previousElementSibling; if (prev) bodyRef.current.insertBefore(root, prev); }
    else { const next = root.nextElementSibling; if (next) bodyRef.current.insertBefore(next, root); }
    onFieldSave(bodyField, bodyRef.current.innerHTML);
    setTimeout(() => {
      const r = selectedImg.getBoundingClientRect();
      setImgRect(r);
      setImgToolbarPos({ top: r.top - 80, left: r.left });
    }, 0);
  };

  const handleBodyClick = (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      selectBodyImg(e.target);
      return;
    }
    // Video: click on the shield/wrapper/iframe/video/figure picks the wrapper
    const wrap = e.target.closest?.('.wb-video-wrap');
    if (wrap) {
      e.preventDefault();
      selectBodyImg(wrap);
      return;
    }
    if (e.target.tagName === 'FIGCAPTION') {
      const fig = e.target.closest('figure');
      const img = fig?.querySelector('img');
      if (img) { selectBodyImg(img); return; }
      const vwrap = fig?.querySelector('.wb-video-wrap');
      if (vwrap) { selectBodyImg(vwrap); return; }
    }
    setSelectedImg(null);
  };

  const handleBodyDrop = (e) => {
    e.preventDefault();
    setDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      if (document.caretRangeFromPoint) {
        const r = document.caretRangeFromPoint(e.clientX, e.clientY);
        if (r) { savedSel.current = r; activeEl.current = bodyRef.current; }
      } else if (document.caretPositionFromPoint) {
        const cp = document.caretPositionFromPoint(e.clientX, e.clientY);
        if (cp) {
          const r = document.createRange();
          r.setStart(cp.offsetNode, cp.offset);
          savedSel.current = r; activeEl.current = bodyRef.current;
        }
      }
      handlePanelFile(files[0]);
    }
  };

  // When HTML mode turns on, populate and focus the textarea
  useEffect(() => {
    if (htmlMode && htmlTextareaRef.current && bodyRef.current) {
      htmlTextareaRef.current.value = bodyRef.current.innerHTML;
      htmlTextareaRef.current.focus();
    }
  }, [htmlMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleHtmlMode = () => {
    if (htmlMode) {
      // Leaving HTML mode — commit textarea back to body div
      if (htmlTextareaRef.current && bodyRef.current) {
        bodyRef.current.innerHTML = htmlTextareaRef.current.value;
        onFieldSave(bodyField, htmlTextareaRef.current.value);
      }
    }
    setHtmlMode(m => !m);
  };

  const tbBtn = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '3px 8px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
    border: '1px solid #475569', background: '#334155', color: '#e2e8f0', lineHeight: 1,
  };
  const tbSel = {
    fontSize: 11, border: '1px solid #475569', borderRadius: 4,
    padding: '3px 5px', background: '#334155', color: '#e2e8f0', cursor: 'pointer',
  };
  const tbDiv = { width: 1, background: '#475569', alignSelf: 'stretch', margin: '0 2px' };

  return (
    <div onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: bgWidth, fontFamily }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 10px', background: '#1e293b', alignItems: 'center' }}>
            <select style={tbSel} value={selStyle} onMouseDown={saveSel} onChange={e => { applyBlock(e.target.value); setSelStyle(e.target.value); }}>
              <option value="">{wb('toolbar_style')}</option>
              <option value="p">{wb('toolbar_body')}</option>
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="h4">H4</option>
            </select>
            <select style={{ ...tbSel, maxWidth: 120 }} value={selFont} onMouseDown={saveSel} onChange={e => { applyFont(e.target.value); setSelFont(e.target.value); }}>
              <option value="">{wb('toolbar_font')}</option>
              {WEB_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select style={{ ...tbSel, width: 62 }} value={selSize} onMouseDown={saveSel} onChange={e => { if (e.target.value) { applyFontSize(e.target.value); setSelSize(e.target.value); } }}>
              <option value="">{wb('toolbar_size')}</option>
              {[10,11,12,13,14,16,18,20,22,24,28,32,36,42,48,56,64,72].map(s => (
                <option key={s} value={String(s)}>{s}px</option>
              ))}
            </select>
            <ToolbarColorPicker
              color={selColor}
              onChange={applyFontColor}
              paletteColors={[site?.primary_color, site?.secondary_color, site?.accent_color, site?.text_color, site?.nav_text_color].filter(Boolean)}
            />
            <div style={tbDiv} />
            <button style={{ ...tbBtn, fontWeight: 700 }} title="Bold"
              onMouseDown={e => btnCmd(e, 'bold')}>B</button>
            <button style={{ ...tbBtn, textDecoration: 'underline' }} title="Underline"
              onMouseDown={e => btnCmd(e, 'underline')}>U</button>
            <button style={{ ...tbBtn, textDecoration: 'line-through' }} title="Strikethrough"
              onMouseDown={e => btnCmd(e, 'strikeThrough')}>S</button>
            <div style={tbDiv} />
            <button style={tbBtn} title="Align Left"
              onMouseDown={e => btnCmd(e, 'justifyLeft')}>
              <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor">
                <rect x="0" y="0" width="14" height="1.8"/><rect x="0" y="4" width="10" height="1.8"/><rect x="0" y="8" width="14" height="1.8"/>
              </svg>
            </button>
            <button style={tbBtn} title="Center"
              onMouseDown={e => btnCmd(e, 'justifyCenter')}>
              <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor">
                <rect x="0" y="0" width="14" height="1.8"/><rect x="2" y="4" width="10" height="1.8"/><rect x="0" y="8" width="14" height="1.8"/>
              </svg>
            </button>
            <button style={tbBtn} title="Align Right"
              onMouseDown={e => btnCmd(e, 'justifyRight')}>
              <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor">
                <rect x="0" y="0" width="14" height="1.8"/><rect x="4" y="4" width="10" height="1.8"/><rect x="0" y="8" width="14" height="1.8"/>
              </svg>
            </button>
            <div style={tbDiv} />
            <button style={tbBtn} title="Bullet List"
              onMouseDown={e => btnCmd(e, 'insertUnorderedList')}>
              <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor">
                <circle cx="1.4" cy="2" r="1.3"/>
                <rect x="4" y="1.2" width="10" height="1.6"/>
                <circle cx="1.4" cy="6" r="1.3"/>
                <rect x="4" y="5.2" width="10" height="1.6"/>
                <circle cx="1.4" cy="10" r="1.3"/>
                <rect x="4" y="9.2" width="10" height="1.6"/>
              </svg>
            </button>
            <button style={tbBtn} title="Numbered List"
              onMouseDown={e => btnCmd(e, 'insertOrderedList')}>
              <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor">
                <text x="0" y="3.5" fontSize="4" fontFamily="monospace">1.</text>
                <rect x="4" y="1.2" width="10" height="1.6"/>
                <text x="0" y="7.5" fontSize="4" fontFamily="monospace">2.</text>
                <rect x="4" y="5.2" width="10" height="1.6"/>
                <text x="0" y="11.5" fontSize="4" fontFamily="monospace">3.</text>
                <rect x="4" y="9.2" width="10" height="1.6"/>
              </svg>
            </button>
            <button style={tbBtn} title="Decrease indent"
              onMouseDown={e => { e.preventDefault(); try { document.execCommand('styleWithCSS', false, true); } catch(_){} btnCmd(e, 'outdent'); }}>
              <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor">
                <rect x="0" y="0" width="14" height="1.6"/>
                <rect x="4" y="4" width="10" height="1.6"/>
                <rect x="4" y="8" width="10" height="1.6"/>
                <polygon points="0,3 3,6 0,9"/>
              </svg>
            </button>
            <button style={tbBtn} title="Increase indent"
              onMouseDown={e => { e.preventDefault(); try { document.execCommand('styleWithCSS', false, true); } catch(_){} btnCmd(e, 'indent'); }}>
              <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor">
                <rect x="0" y="0" width="14" height="1.6"/>
                <rect x="0" y="4" width="10" height="1.6"/>
                <rect x="0" y="8" width="10" height="1.6"/>
                <polygon points="14,3 11,6 14,9"/>
              </svg>
            </button>
            <div style={tbDiv} />
            <button style={tbBtn} title="Insert Link"
              onMouseDown={openLinkPanel}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
            </button>
            <button style={{ ...tbBtn, fontSize: 10 }} title="Remove Link"
              onMouseDown={e => btnCmd(e, 'unlink')}>✕🔗</button>
            <div style={tbDiv} />
            <button style={{ ...tbBtn, fontSize: 10, color: '#fca5a5' }} title="Clear all formatting"
              onMouseDown={e => { e.preventDefault(); clearFormatting(); }}>Tx</button>
            <div style={tbDiv} />
            {/* Image insert */}
            <button style={tbBtn} title="Insert image"
              onMouseDown={openImgPanel}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { if (e.target.files[0]) handlePanelFile(e.target.files[0]); e.target.value = ''; }} />
            {/* Video insert */}
            <button style={tbBtn} title="Embed video (YouTube, Vimeo, or direct URL)"
              onMouseDown={openVidPanel}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="15" height="14" rx="2"/>
                <polygon points="17 9 22 6 22 18 17 15" fill="currentColor"/>
              </svg>
            </button>
            <div style={tbDiv} />
            {/* Block background color */}
            <ToolbarBgColorPicker
              color={d.bg_color || site?.bg_color || '#ffffff'}
              paletteColors={[site?.primary_color, site?.secondary_color, site?.accent_color, site?.bg_color, site?.text_color].filter(Boolean)}
              onChange={color => onFieldSave('bg_color', color)}
            />
            <div style={tbDiv} />
            <button
              title={htmlMode ? 'Back to rich text' : 'View / edit HTML source'}
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); toggleHtmlMode(); }}
              style={{
                ...tbBtn, fontFamily: 'monospace', fontSize: 11, letterSpacing: '-0.5px',
                background: htmlMode ? '#0f172a' : '#334155',
                color: htmlMode ? '#7dd3fc' : '#e2e8f0',
                border: `1px solid ${htmlMode ? '#1e40af' : '#475569'}`,
              }}
            >&lt;/&gt;</button>
          </div>

          {/* Image insertion panel */}
          {imgPanel && (
            <div style={{ background: '#0f172a', borderBottom: '1px solid #334155', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  autoFocus
                  type="text"
                  placeholder={wb('img_url_ph')}
                  value={imgUrl}
                  onChange={e => setImgUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && imgUrl) insertBodyImage(imgUrl, imgAlign); }}
                  style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '5px 8px', fontSize: 12, color: '#e2e8f0', outline: 'none' }}
                />
                <button
                  onMouseDown={e => { e.preventDefault(); if (imgUrl) insertBodyImage(imgUrl, imgAlign); }}
                  style={{ padding: '5px 12px', background: '#3D6B34', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {wb('img_insert')}
                </button>
                <button onMouseDown={e => { e.preventDefault(); setImgPanel(false); }}
                  style={{ padding: '5px 8px', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{wb('img_align')}:</span>
                {[[`left`,wb('img_align_left')],[`center`,wb('img_align_center')],[`right`,wb('img_align_right')]].map(([a, lbl]) => (
                  <button key={a} onMouseDown={e => { e.preventDefault(); setImgAlign(a); }}
                    style={{ padding: '3px 8px', borderRadius: 4, border: 'none', fontSize: 11, cursor: 'pointer', fontWeight: imgAlign === a ? 700 : 400, background: imgAlign === a ? '#3D6B34' : '#334155', color: imgAlign === a ? '#fff' : '#e2e8f0' }}>
                    {lbl}
                  </button>
                ))}
              </div>
              {/* File drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setPanelDragging(true); }}
                onDragLeave={() => setPanelDragging(false)}
                onDrop={e => { e.preventDefault(); setPanelDragging(false); if (e.dataTransfer.files[0]) handlePanelFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${panelDragging ? '#7dd3fc' : '#334155'}`,
                  borderRadius: 8, padding: '10px', textAlign: 'center', cursor: 'pointer',
                  background: panelDragging ? '#1e3a5f' : '#1e293b', transition: 'all 0.15s',
                }}
              >
                {uploading
                  ? <span style={{ fontSize: 12, color: '#94a3b8' }}>{wb('img_uploading')}</span>
                  : <span style={{ fontSize: 12, color: '#64748b' }}>{wb('img_drop')}<span style={{ color: '#7dd3fc' }}>{wb('img_browse')}</span></span>}
              </div>
            </div>
          )}

          {/* Video embed panel */}
          {vidPanel && (
            <div style={{ background: '#0f172a', borderBottom: '1px solid #334155', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <textarea
                  autoFocus
                  rows={2}
                  placeholder={wb('video_ph')}
                  value={vidUrl}
                  onChange={e => setVidUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && vidUrl) { e.preventDefault(); insertBodyVideo(vidUrl, vidAlign); } }}
                  style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '5px 8px', fontSize: 12, color: '#e2e8f0', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
                <button
                  onMouseDown={e => { e.preventDefault(); if (vidUrl) insertBodyVideo(vidUrl, vidAlign); }}
                  style={{ padding: '5px 12px', background: '#3D6B34', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {wb('video_embed')}
                </button>
                <button onMouseDown={e => { e.preventDefault(); setVidPanel(false); }}
                  style={{ padding: '5px 8px', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{wb('img_align')}:</span>
                {[[`left`,wb('img_align_left')],[`center`,wb('img_align_center')],[`right`,wb('img_align_right')]].map(([a, lbl]) => (
                  <button key={a} onMouseDown={e => { e.preventDefault(); setVidAlign(a); }}
                    style={{ padding: '3px 8px', borderRadius: 4, border: 'none', fontSize: 11, cursor: 'pointer', fontWeight: vidAlign === a ? 700 : 400, background: vidAlign === a ? '#3D6B34' : '#334155', color: vidAlign === a ? '#fff' : '#e2e8f0' }}>
                    {lbl}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.4 }}>
                {wb('video_hint')}
              </div>
            </div>
          )}

          {/* Link insert panel */}
          {linkPanel && (
            <div style={{ background: '#0f172a', borderBottom: '1px solid #334155', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[[`url`,wb('link_external')],[`page`,wb('link_internal')]].map(([m, lbl]) => (
                  <button key={m} onMouseDown={e => { e.preventDefault(); setLinkMode(m); }}
                    style={{ padding: '4px 10px', borderRadius: 4, border: 'none', fontSize: 11, cursor: 'pointer', fontWeight: linkMode === m ? 700 : 400, background: linkMode === m ? '#3D6B34' : '#334155', color: linkMode === m ? '#fff' : '#e2e8f0' }}>
                    {lbl}
                  </button>
                ))}
                <div style={{ flex: 1 }} />
                <button onMouseDown={e => { e.preventDefault(); setLinkPanel(false); }}
                  style={{ padding: '4px 8px', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>✕</button>
              </div>
              {linkMode === 'url' ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder={wb('link_ph')}
                    value={linkHref}
                    onChange={e => setLinkHref(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyUrlLink(); } }}
                    style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '5px 8px', fontSize: 12, color: '#e2e8f0', outline: 'none' }}
                  />
                  <button onMouseDown={e => { e.preventDefault(); applyUrlLink(); }}
                    style={{ padding: '5px 14px', background: '#3D6B34', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    {wb('link_btn')}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    autoFocus
                    value={linkPageSlug}
                    onChange={e => setLinkPageSlug(e.target.value)}
                    style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '5px 8px', fontSize: 12, color: '#e2e8f0', outline: 'none' }}>
                    <option value="">{wb('link_choose_page')}</option>
                    {(() => {
                      // Mirror the public nav: top-level first (sort_order),
                      // then each parent's children indented underneath.
                      // Nav-heading rows are non-selectable group labels.
                      const all = pages || [];
                      const byOrder = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0);
                      const tops = all.filter(p => !p.parent_page_id).sort(byOrder);
                      const childrenOf = (id) => all.filter(p => p.parent_page_id === id).sort(byOrder);
                      const rows = [];
                      tops.forEach(p => {
                        const kids = childrenOf(p.page_id);
                        const isHeading = p.is_nav_heading || (kids.length > 0 && !p.slug);
                        if (isHeading) {
                          rows.push(
                            <option key={`h-${p.page_id}`} value="" disabled style={{ color: '#94a3b8', fontWeight: 700 }}>
                              {p.page_name}
                            </option>
                          );
                        } else if (p.slug) {
                          rows.push(
                            <option key={p.page_id} value={p.slug}>{p.page_name}</option>
                          );
                        }
                        kids.forEach(c => {
                          if (!c.slug) return;
                          rows.push(
                            <option key={c.page_id} value={c.slug}>{`\u00A0\u00A0\u00A0\u00A0— ${c.page_name}`}</option>
                          );
                        });
                      });
                      return rows;
                    })()}
                  </select>
                  <button onMouseDown={e => { e.preventDefault(); applyPageLink(); }}
                    disabled={!linkPageSlug}
                    style={{ padding: '5px 14px', background: linkPageSlug ? '#3D6B34' : '#475569', color: '#fff', border: 'none', borderRadius: 6, cursor: linkPageSlug ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600 }}>
                    {wb('link_btn')}
                  </button>
                </div>
              )}
              <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.4 }}>
                {wb('link_hint')}
              </div>
            </div>
          )}

          {/* Editable content area */}
          <div style={{ background: d.bg_color || site?.bg_color || bgColor, padding: outerPad }}>
            <div style={{ maxWidth: cWidth, margin: '0 auto' }}>
              <div style={{ display: 'flex', flexDirection: isSide ? (isLeft ? 'row' : 'row-reverse') : 'column', gap: '2rem', alignItems: isSide ? 'flex-start' : 'stretch' }}>
                {!bodyOnly && rawUrl && (
                  <div ref={imgWrapRef} style={{ width: pos === 'full' ? '100%' : pos === 'center' ? `${Math.min(imgWidth, 100)}%` : `${imgWidth}%`, flexShrink: 0, position: 'relative', ...(pos === 'center' ? { alignSelf: 'center' } : {}) }}>
                    <img src={rawUrl} alt="" style={{ width: '100%', display: 'block', borderRadius: 8 }} />
                    {/* Resize handle */}
                    <div
                      onMouseDown={startResize}
                      title={wb('img_drag_resize')}
                      style={{
                        position: 'absolute', top: '50%', [isLeft ? 'right' : 'left']: -8,
                        transform: 'translateY(-50%)',
                        width: 16, height: 40, borderRadius: 4,
                        background: 'rgba(30,41,59,0.75)', border: '1px solid #94a3b8',
                        cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        userSelect: 'none', zIndex: 10,
                      }}
                    >
                      <svg width="8" height="20" viewBox="0 0 8 20" fill="#e2e8f0">
                        <rect x="1" y="0" width="2" height="20" rx="1"/><rect x="5" y="0" width="2" height="20" rx="1"/>
                      </svg>
                    </div>
                    {/* Caption */}
                    <CaptionField
                      initial={d.image_caption || ''}
                      onSave={val => onFieldSave('image_caption', val)}
                    />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="rte-body">
                    {/* Heading — plain text; styles applied via headingTypoStyle() */}
                    {!bodyOnly && (
                      <h2
                        ref={headingRef}
                        contentEditable
                        suppressContentEditableWarning
                        onMouseUp={saveAndDetect}
                        onKeyUp={saveAndDetect}
                        onPaste={pastePlainText}
                        onFocus={() => { activeEl.current = headingRef.current; }}
                        onBlur={e => onFieldSave('heading', e.currentTarget.textContent)}
                        style={{ outline: 'none', cursor: 'text', minHeight: '1.8rem', border: '1px dashed #cbd5e1', borderRadius: 4, padding: '4px 6px', marginBottom: 6, ...headingTypoStyle(d.heading_style, site) }}
                      />
                    )}
                    {/* Body — rich text (hidden in HTML mode) */}
                    <div
                      ref={bodyRef}
                      contentEditable
                      suppressContentEditableWarning
                      onMouseUp={saveAndDetect}
                      onKeyUp={saveAndDetect}
                      onPaste={pasteAsBodyText}
                      onFocus={() => { activeEl.current = bodyRef.current; }}
                      onInput={e => { if (!htmlMode) onFieldSave(bodyField, e.currentTarget.innerHTML); }}
                      onBlur={e => { if (!htmlMode) onFieldSave(bodyField, e.currentTarget.innerHTML); }}
                      onClick={handleBodyClick}
                      onDragOver={e => { e.preventDefault(); setDraggingOver(true); }}
                      onDragLeave={() => setDraggingOver(false)}
                      onDrop={handleBodyDrop}
                      style={{
                        display: htmlMode ? 'none' : 'block', outline: 'none', cursor: 'text',
                        minHeight: '3rem', borderRadius: 4, padding: '4px 6px',
                        border: draggingOver ? '2px dashed #7dd3fc' : '1px dashed #cbd5e1',
                        overflow: 'hidden',
                      }}
                    />
                    {/* HTML source textarea (shown in HTML mode) */}
                    {htmlMode && (
                      <textarea
                        ref={htmlTextareaRef}
                        onBlur={e => onFieldSave(bodyField, e.target.value)}
                        style={{
                          width: '100%', minHeight: '8rem', padding: '8px 10px',
                          fontSize: 11, fontFamily: 'monospace', lineHeight: 1.6,
                          color: '#0f172a', background: '#f1f5f9',
                          border: '1px solid #94a3b8', borderRadius: 4,
                          outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating image toolbar + resize handles */}
      {selectedImg && imgRect && createPortal(
        <>
          {/* Blue outline overlay */}
          <div style={{
            position: 'fixed', top: imgRect.top, left: imgRect.left,
            width: imgRect.width, height: imgRect.height,
            border: '2px solid #3b82f6', pointerEvents: 'none', zIndex: 99998,
          }} />
          {/* Size label */}
          <div style={{
            position: 'fixed', top: imgRect.bottom + 4, left: imgRect.left,
            fontSize: 10, color: '#fff', background: 'rgba(59,130,246,0.85)',
            padding: '1px 5px', borderRadius: 3, zIndex: 99999, pointerEvents: 'none',
          }}>
            {Math.round(imgRect.width)} × {Math.round(imgRect.height)}
          </div>
          {/* Resize handles */}
          {[
            { dir: 'nw', top: imgRect.top - 5,                      left: imgRect.left - 5 },
            { dir: 'ne', top: imgRect.top - 5,                      left: imgRect.right - 5 },
            { dir: 'sw', top: imgRect.bottom - 5,                   left: imgRect.left - 5 },
            { dir: 'se', top: imgRect.bottom - 5,                   left: imgRect.right - 5 },
            { dir: 'e',  top: imgRect.top + imgRect.height / 2 - 5, left: imgRect.right - 5 },
            { dir: 'w',  top: imgRect.top + imgRect.height / 2 - 5, left: imgRect.left - 5 },
            { dir: 'n',  top: imgRect.top - 5,                      left: imgRect.left + imgRect.width / 2 - 5 },
            { dir: 's',  top: imgRect.bottom - 5,                   left: imgRect.left + imgRect.width / 2 - 5 },
          ].map(({ dir, top, left }) => (
            <div key={dir} onMouseDown={e => startBodyImgResize(e, dir)}
              style={{
                position: 'fixed', top, left, width: 10, height: 10,
                background: dir === 'n' || dir === 's' ? '#f59e0b' : '#3b82f6',
                border: '1px solid #fff', borderRadius: 2,
                cursor: dir === 'e' || dir === 'w' ? 'ew-resize'
                      : dir === 'n' || dir === 's' ? 'ns-resize'
                      : dir === 'nw' || dir === 'se' ? 'nwse-resize' : 'nesw-resize',
                zIndex: 99999,
              }}
              title={dir === 'n' || dir === 's' ? wb('img_drag_height') : wb('img_drag_resize')}
            />
          ))}
          {/* Floating toolbar */}
          <div style={{ position: 'fixed', top: imgToolbarPos.top, left: imgToolbarPos.left, zIndex: 99999, background: '#1e293b', borderRadius: 6, padding: '5px 7px', display: 'flex', flexDirection: 'column', gap: 5, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            {/* Row 1: position + align + close */}
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#94a3b8', paddingRight: 2 }}>{wb('img_position')}</span>
              {[[-1,'↑'],[1,'↓']].map(([dir, icon]) => (
                <button key={dir} onMouseDown={e => { e.preventDefault(); moveBodyImg(dir); }}
                  style={{ padding: '3px 7px', borderRadius: 4, border: 'none', fontSize: 12, cursor: 'pointer', background: '#334155', color: '#e2e8f0' }}>
                  {icon}
                </button>
              ))}
              <div style={{ width: 1, background: '#475569', alignSelf: 'stretch', margin: '0 3px' }} />
              <span style={{ fontSize: 10, color: '#94a3b8', paddingRight: 2 }}>{wb('img_align')}</span>
              {[[`left`,wb('img_align_left')],[`center`,'↔'],[`right`,wb('img_align_right')]].map(([a, icon]) => (
                <button key={a} onMouseDown={e => { e.preventDefault(); applyImgAlign(a); }}
                  style={{ padding: '3px 8px', borderRadius: 4, border: 'none', fontSize: 11, cursor: 'pointer', background: '#334155', color: '#e2e8f0', fontWeight: 500 }}>
                  {icon}
                </button>
              ))}
              <div style={{ width: 1, background: '#475569', alignSelf: 'stretch', margin: '0 3px' }} />
              {(() => {
                const isVideo = selectedImg?.classList?.contains('wb-video-wrap');
                const target  = isVideo ? selectedImg?.querySelector('iframe,video') : selectedImg;
                const isRaw   = !!target?.hasAttribute?.('data-no-style');
                return (
                  <button onMouseDown={e => { e.preventDefault(); toggleImgRawStyle(); }}
                    title={isRaw ? wb('img_style_disabled') : wb('img_style_remove')}
                    style={{ padding: '3px 8px', borderRadius: 4, border: 'none', fontSize: 11, cursor: 'pointer', background: isRaw ? '#7dd3fc' : '#334155', color: isRaw ? '#0f172a' : '#e2e8f0', fontWeight: 600 }}>
                    {isRaw ? wb('img_raw_on') : wb('img_raw_off')}
                  </button>
                );
              })()}
              <div style={{ width: 1, background: '#475569', alignSelf: 'stretch', margin: '0 3px' }} />
              <button onMouseDown={e => { e.preventDefault(); deleteBodyImg(); }}
                title={wb('img_delete_title')}
                style={{ padding: '3px 8px', borderRadius: 4, border: 'none', fontSize: 11, cursor: 'pointer', background: '#7f1d1d', color: '#fecaca', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"/>
                </svg>
                {wb('img_delete')}
              </button>
              <button onMouseDown={e => { e.preventDefault(); setSelectedImg(null); setImgRect(null); }}
                style={{ padding: '3px 7px', borderRadius: 4, border: 'none', fontSize: 11, cursor: 'pointer', background: '#334155', color: '#94a3b8', marginLeft: 2 }}>✕</button>
            </div>
            {/* Row 2: caption input (only for figure-wrapped images) */}
            {selectedImg?.parentElement?.tagName === 'FIGURE' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>{wb('img_caption')}</span>
                <input
                  value={imgCaption}
                  onChange={e => setImgCaption(e.target.value)}
                  onBlur={() => applyCaption(imgCaption)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCaption(imgCaption); } }}
                  placeholder={wb('caption_ph')}
                  style={{ flex: 1, minWidth: 160, padding: '3px 7px', borderRadius: 4, border: 'none', fontSize: 11, background: '#334155', color: '#e2e8f0', outline: 'none' }}
                />
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ── MultiColumnInlineEditor: N InlineContentEditors side-by-side, one per column.
// Each column's data lives in block.block_data.columns[i] and is kept in sync
// through a local state copy that mirrors block.block_data.columns (so individual
// field saves don't clobber each other while React re-renders).
function MultiColumnInlineEditor({ block, site, onFieldSave, columnCount, pages }) {
  const initial = Array.isArray(block.block_data?.columns) && block.block_data.columns.length
    ? block.block_data.columns
    : Array.from({ length: columnCount }, () => ({ heading: '', body: '', image_url: '', images: [], image_position: 'right' }));
  // Pad/trim to columnCount
  const padded = [...initial];
  while (padded.length < columnCount) padded.push({ heading: '', body: '', image_url: '', images: [], image_position: 'right' });
  padded.length = columnCount;

  const columnsRef = useRef(padded);
  // Keep ref in sync when parent state changes (e.g., another save arrives)
  useEffect(() => {
    const fresh = Array.isArray(block.block_data?.columns) && block.block_data.columns.length
      ? block.block_data.columns
      : [];
    const next = [...fresh];
    while (next.length < columnCount) next.push({ heading: '', body: '', image_url: '', images: [], image_position: 'right' });
    next.length = columnCount;
    columnsRef.current = next;
  }, [block.block_data, columnCount]);

  const saveColumnField = (idx, key, val) => {
    const next = columnsRef.current.map((c, i) => i === idx ? { ...c, [key]: val } : c);
    columnsRef.current = next;
    onFieldSave('columns', next);
  };

  // Responsive: flex-wrap so columns stack automatically when the canvas narrows
  return (
    <div style={{ background: block.block_data?.bg_color || site?.bg_color || '#fff' }}>
      <div className="wb-multicol" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch' }}>
        {columnsRef.current.map((colData, i) => (
          <div key={i} className="wb-multicol-col" style={{ flex: `1 1 ${columnCount === 2 ? 'calc(50% - 1px)' : 'calc(25% - 1px)'}`, minWidth: columnCount === 4 ? 160 : 240, borderLeft: i === 0 ? 'none' : '1px dashed #e5e7eb' }}>
            <InlineContentEditor
              block={block}
              data={colData}
              site={site}
              onFieldSave={(k, v) => saveColumnField(i, k, v)}
              compact={columnCount === 4}
              pages={pages}
            />
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 900px) {
          .wb-multicol .wb-multicol-col { flex: 1 1 100% !important; border-left: none !important; }
        }
      `}</style>
    </div>
  );
}

// Returns a complete inline style object for the heading based on the stored
// style level (h1/h2/h3/h4/p) and site typography settings from the DB.
// Mirrors all properties generated by buildRteBodyCss so heading and body
// CSS stay in sync.
function headingTypoStyle(tag, site) {
  const k        = (!tag || tag === 'p') ? 'body' : tag;
  const ruleclr  = site?.[`${k}_rule_color`] || site?.text_color || '#000';
  const hasRule  = k !== 'body' && !!site?.[`${k}_rule`];
  const align    = site?.[`${k}_align`] || 'left';
  return {
    fontSize:       remToPx(site?.[`${k}_size`]) || (k==='body'?'16px':k==='h1'?'40px':k==='h2'?'29px':k==='h3'?'21px':'17px'),
    fontWeight:     site?.[`${k}_weight`] || (k==='body'?'400':k==='h1'?'800':k==='h2'?'700':'600'),
    color:          site?.[`${k}_color`]  || site?.text_color || '',
    fontFamily:     site?.[`${k}_font`]   || site?.font_family || '',
    textAlign:      align,
    fontStyle:      site?.[`${k}_italic`] ? 'italic' : 'normal',
    textDecoration: site?.[`${k}_underline`] ? 'underline' : 'none',
    borderBottom:   hasRule ? `2px solid ${ruleclr}` : 'none',
    paddingBottom:  hasRule ? '2px' : '0',
    marginTop:      (site?.[`${k}_margin_top`]    ?? 0)  + 'px',
    marginBottom:   (site?.[`${k}_margin_bottom`] ?? 8)  + 'px',
  };
}

// Normalize legacy links data (flat items → single group) or return groups as-is
function normLinksGroups(d) {
  if (Array.isArray(d.groups) && d.groups.length > 0) return d.groups;
  if (Array.isArray(d.items)  && d.items.length  > 0) return [{ heading: '', items: d.items }];
  return [{ heading: 'Links', items: [{ icon_url: '', label: 'Link Title', url: '', description: '' }] }];
}

// ── SimpleBlockPreview: read-only canvas preview of each block ────
function SimpleBlockPreview({ block, site, businessId, onFieldSave }) {
  const d   = block.block_data || {};
  const bt  = block.block_type;
  const primary    = site?.primary_color  || '#3D6B34';
  const accent     = site?.accent_color   || '#FFC567';
  const textColor  = site?.text_color     || '#111827';
  const fontFamily = site?.font_family    || 'inherit';
  const bgColor    = d.bg_color || site?.page_background_color || site?.bg_color || '#fff';
  const bgWidth    = site?.body_bg_width      || '100%';
  const cWidth     = site?.body_content_width || '100%';

  // Shared wrapper: outer div only centers (no bg); inner band carries the bg color up to bgWidth;
  // innermost div constrains content to cWidth — mirrors SectionWrap in WebsitePublic.jsx
  const BlockWrap = ({ children }) => (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: bgWidth, background: bgColor, padding: '1.75rem 2.5rem', fontFamily }}>
        <div style={{ maxWidth: cWidth, margin: '0 auto' }}>
          {children}
        </div>
      </div>
    </div>
  );

  if (bt === 'hero') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '100%', maxWidth: bgWidth,
          minHeight: d.min_height_px ? `${d.min_height_px}px` : 220,
          position: 'relative', display: 'flex', alignItems: 'center',
          justifyContent: d.align === 'left' ? 'flex-start' : d.align === 'right' ? 'flex-end' : 'center',
          background: d.image_url ? `url(${d.image_url}) center/cover no-repeat` : primary,
          fontFamily,
        }}>
          {d.overlay && <div style={{ position: 'absolute', inset: 0, background: d.overlay_color || 'rgba(0,0,0,0.42)' }} />}
          <div style={{ position: 'relative', zIndex: 1, padding: '2rem 3rem', textAlign: d.align || 'center', maxWidth: cWidth, width: '100%' }}>
            <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem', lineHeight: 1.2 }}>
              {d.headline || 'Your Headline'}
            </h1>
            {d.subtext && <div className="site-rte" style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1.05rem', margin: '0 0 1.2rem' }} dangerouslySetInnerHTML={{ __html: d.subtext }} />}
            {d.cta_text && (
              <span style={{ display: 'inline-block', background: accent, color: '#fff', padding: '0.5rem 1.5rem', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem' }}>
                {d.cta_text}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (bt === 'slideshow') {
    const raw = Array.isArray(d.images) ? d.images : [];
    const slides = raw.map(s => (typeof s === 'string' ? { url: s } : s)).filter(s => s && s.url);
    const first = slides[0];
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '100%', maxWidth: bgWidth,
          aspectRatio: '16 / 6', minHeight: 200, position: 'relative', overflow: 'hidden',
          background: first ? `url(${first.url}) center/cover no-repeat` : '#1f2937',
        }}>
          {!first && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          color: 'rgba(255,255,255,0.75)', fontFamily, fontSize: 14 }}>
              No slides yet — add images in the editor panel →
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0,
                        display: 'flex', justifyContent: 'center', gap: 6 }}>
            {slides.slice(0, 8).map((_, i) => (
              <span key={i} style={{ width: 8, height: 8, borderRadius: '50%',
                background: i === 0 ? '#fff' : 'rgba(255,255,255,0.5)' }} />
            ))}
          </div>
          <div style={{ position: 'absolute', top: 8, right: 10, color: 'rgba(255,255,255,0.85)',
                        fontSize: 11, fontFamily, background: 'rgba(0,0,0,0.45)',
                        padding: '2px 8px', borderRadius: 10 }}>
            {slides.length} slide{slides.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>
    );
  }

  if (bt === 'about' || bt === 'content') {
    const imgs       = Array.isArray(d.images) && d.images.length > 0 ? d.images : [];
    const _img0Obj   = imgs[0] && typeof imgs[0] !== 'string' ? imgs[0] : null;
    const rawUrl     = d.image_url || (_img0Obj ? _img0Obj.url : (typeof imgs[0] === 'string' ? imgs[0] : null));
    const pos        = d.image_position || _img0Obj?.wrap || 'right';
    const isSide     = pos === 'left' || pos === 'right';
    const flexDir    = isSide ? (pos === 'left' ? 'row' : 'row-reverse') : 'column';
    const _imgW      = d.image_width ?? _img0Obj?.w ?? 38;
    const imgW       = pos === 'full' ? '100%' : pos === 'center' ? `${Math.min(_imgW, 100)}%` : `${_imgW}%`;
    const imgAlign   = pos === 'center' ? { margin: '0 auto' } : {};
    const hasHeading = !!d.heading?.trim();
    const hasBody    = !!d.body && (!!d.body.replace(/<[^>]*>/g, '').trim() || /<(img|iframe|video|figure)\b/i.test(d.body));
    const hasImage   = !!rawUrl;
    const isEmpty    = !hasHeading && !hasBody && !hasImage;
    return (
      <BlockWrap>
        {isEmpty
          ? <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>Click to edit this block</p>
          : (
            <div style={{ display: 'flex', flexDirection: flexDir, gap: '2rem', alignItems: isSide ? 'flex-start' : 'stretch' }}>
              {hasImage && (
                <div style={{ width: imgW, flexShrink: 0, ...imgAlign }}>
                  <img src={rawUrl} alt={d.image_caption || ''} style={{ width: '100%', display: 'block', borderRadius: 8 }} />
                  {d.image_caption && (
                    <p style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center', margin: '4px 0 0' }}>
                      {d.image_caption}
                    </p>
                  )}
                </div>
              )}
              {(hasHeading || hasBody) && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="rte-body">
                    {hasHeading && <h2 style={headingTypoStyle(d.heading_style, site)}>{d.heading}</h2>}
                    {hasBody && <div dangerouslySetInnerHTML={{ __html: addLinkTargets(d.body) }} />}
                  </div>
                </div>
              )}
            </div>
          )
        }
      </BlockWrap>
    );
  }

  if (bt === 'content_2col' || bt === 'content_4col') {
    const columnCount = bt === 'content_2col' ? 2 : 4;
    const rawCols = Array.isArray(d.columns) ? d.columns : [];
    const cols = [...rawCols];
    while (cols.length < columnCount) cols.push({});
    cols.length = columnCount;
    const isEmpty = cols.every(c => !c.heading?.trim() && !(c.body && (c.body.replace(/<[^>]*>/g, '').trim() || /<(img|iframe|video|figure)\b/i.test(c.body))) && !c.image_url);
    return (
      <BlockWrap>
        {isEmpty
          ? <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>Click to edit this {columnCount}-column block</p>
          : (
            <div className="wb-multicol-preview" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
              {cols.map((c, i) => {
                const hasHeading = !!c.heading?.trim();
                const hasBody    = !!c.body && (!!c.body.replace(/<[^>]*>/g, '').trim() || /<(img|iframe|video|figure)\b/i.test(c.body));
                const imgUrl     = c.image_url;
                return (
                  <div key={i} className="wb-multicol-preview-col" style={{ flex: `1 1 ${columnCount === 2 ? 'calc(50% - 0.75rem)' : 'calc(25% - 1.125rem)'}`, minWidth: 0 }}>
                    {imgUrl && <img src={imgUrl} alt={c.image_caption || ''} style={{ width: '100%', display: 'block', borderRadius: 8, marginBottom: 8 }} />}
                    <div className="rte-body">
                      {hasHeading && <h2 style={headingTypoStyle(c.heading_style, site)}>{c.heading}</h2>}
                      {hasBody && <div dangerouslySetInnerHTML={{ __html: addLinkTargets(c.body) }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
        <style>{`
          @media (max-width: 900px) {
            .wb-multicol-preview .wb-multicol-preview-col { flex: 1 1 100% !important; }
          }
        `}</style>
      </BlockWrap>
    );
  }

  if (bt === 'links') {
    const groups = normLinksGroups(d);
    const cols   = d.columns || 3;
    return (
      <BlockWrap>
        {d.heading && <h1 style={{ ...headingTypoStyle('h1', site), marginBottom: '0.75rem' }}>{d.heading}</h1>}
        {groups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: '1.25rem' }}>
            {group.heading && <h2 style={{ ...headingTypoStyle('h2', site), marginBottom: '0.6rem' }}>{group.heading}</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0.75rem' }}>
              {(group.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  {item.icon_url && <img src={item.icon_url} alt="" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0, borderRadius: 4 }} />}
                  <div>
                    <div dangerouslySetInnerHTML={{ __html: item.label || 'Link' }} style={{ fontWeight: 600, fontSize: '0.87rem', color: primary }} />
                    {item.description && <div dangerouslySetInnerHTML={{ __html: item.description }} style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </BlockWrap>
    );
  }

  if (bt === 'divider') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: bgWidth, height: d.height || 40, background: bgColor }} />
      </div>
    );
  }

  // Blog block — shows live posts in a table with refresh
  if (bt === 'blog') return <BlogBlockCanvas block={block} site={site} businessId={businessId} />;
  if (bt === 'testimonials') return <TestimonialsBlockCanvas block={block} site={site} businessId={businessId} onFieldSave={onFieldSave} />;
  if (bt === 'testimonial_random') return <TestimonialRandomBlockCanvas block={block} site={site} businessId={businessId} onFieldSave={onFieldSave} />;

  // Packages block — package deals with animal thumbnails
  if (bt === 'packages') return <PackagesBlockCanvas block={block} site={site} businessId={businessId} onFieldSave={onFieldSave} />;

  // Livestock block — live listing with views / sort / search
  if (bt === 'livestock') return <LivestockBlockCanvas block={block} site={site} businessId={businessId} onFieldSave={onFieldSave} />;
  if (bt === 'studs') return <LivestockBlockCanvas block={block} site={site} businessId={businessId} onFieldSave={onFieldSave} mode="stud" />;

  // Contact block — show actual form preview
  if (bt === 'contact') {
    const inp = { border: '1px solid #E5E7EB', borderRadius: 8, padding: '0.5rem 0.8rem', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', background: '#fff', color: '#111' };
    const lbl = { display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#9CA3AF', marginBottom: 3, textTransform: 'lowercase' };
    return (
      <BlockWrap>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {d.heading && <h2 style={{ ...headingTypoStyle('h1', site), textAlign: 'center', marginBottom: '0.5rem' }}>{d.heading}</h2>}
          {d.sub_heading && <div className="site-rte" style={{ color: '#6B7280', textAlign: 'center', marginBottom: '1.2rem', fontSize: '0.9rem', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: d.sub_heading }} />}
          <div style={{ background: '#fff', borderRadius: 16, padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div><label style={lbl}>first name</label><div style={inp}>&nbsp;</div></div>
              <div><label style={lbl}>last name</label><div style={inp}>&nbsp;</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div><label style={lbl}>email</label><div style={inp}>&nbsp;</div></div>
              <div><label style={lbl}>phone number <span style={{ fontWeight: 400 }}>(optional)</span></label><div style={inp}>&nbsp;</div></div>
            </div>
            <div><label style={lbl}>organization <span style={{ fontWeight: 400 }}>(optional)</span></label><div style={inp}>&nbsp;</div></div>
            <div><label style={lbl}>message</label><div style={{ ...inp, minHeight: 70 }}>&nbsp;</div></div>
            <div style={{ background: primary, color: '#fff', fontWeight: 700, padding: '0.6rem', borderRadius: 8, textAlign: 'center', fontSize: '0.9rem' }}>
              Send Message
            </div>
          </div>
        </div>
      </BlockWrap>
    );
  }

  // Member Directory — placeholder card grid preview
  if (bt === 'member_directory') {
    const cols = Math.max(1, Math.min(4, Number(d.columns) || 3));
    return (
      <BlockWrap>
        {d.heading && <h2 style={{ ...headingTypoStyle('h1', site), marginBottom: '0.4rem' }}>{d.heading}</h2>}
        {d.intro_body && <div className="site-rte" style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '0.9rem' }} dangerouslySetInnerHTML={{ __html: d.intro_body }} />}
        {(d.show_search || d.show_state_filter) && (
          <div style={{ display: 'flex', gap: 8, marginBottom: '0.8rem' }}>
            {d.show_search && <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 6, padding: '0.45rem 0.7rem', fontSize: '0.82rem', color: '#9ca3af' }}>🔍 Search members…</div>}
            {d.show_state_filter && <div style={{ width: 120, background: '#f3f4f6', borderRadius: 6, padding: '0.45rem 0.7rem', fontSize: '0.82rem', color: '#9ca3af' }}>All states ▾</div>}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
          {[0,1,2,3,4,5].slice(0, cols * 2).map(i => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.7rem', display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e5e7eb' }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 10, background: '#e5e7eb', borderRadius: 3, marginBottom: 5, width: '70%' }} />
                <div style={{ height: 8, background: '#f3f4f6', borderRadius: 3, width: '90%' }} />
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 10, textAlign: 'center' }}>Live member data populates here on the published site.</p>
      </BlockWrap>
    );
  }

  // Pedigree / Registry Search — preview form + mock result row
  if (bt === 'pedigree_search') {
    return (
      <BlockWrap>
        {d.heading && <h2 style={{ ...headingTypoStyle('h1', site), marginBottom: '0.4rem' }}>{d.heading}</h2>}
        {d.intro_body && <div className="site-rte" style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '0.9rem' }} dangerouslySetInnerHTML={{ __html: d.intro_body }} />}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: '0.8rem' }}>
          {d.show_name !== false && <div style={{ background: '#f3f4f6', borderRadius: 6, padding: '0.5rem 0.7rem', fontSize: '0.82rem', color: '#9ca3af' }}>Animal name</div>}
          {d.show_reg_number !== false && <div style={{ background: '#f3f4f6', borderRadius: 6, padding: '0.5rem 0.7rem', fontSize: '0.82rem', color: '#9ca3af' }}>Reg #</div>}
          {d.show_owner !== false && <div style={{ background: '#f3f4f6', borderRadius: 6, padding: '0.5rem 0.7rem', fontSize: '0.82rem', color: '#9ca3af' }}>Owner</div>}
          <div style={{ background: primary, color: '#fff', borderRadius: 6, padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 700 }}>Search</div>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 90px', padding: '0.6rem 0.8rem', background: '#f9fafb', fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>
            <div>Name</div><div>Reg #</div><div>Owner</div><div style={{ textAlign: 'right' }}>Pedigree</div>
          </div>
          {[0,1,2].map(i => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 90px', padding: '0.55rem 0.8rem', fontSize: '0.82rem', borderTop: '1px solid #f3f4f6', color: '#6b7280' }}>
              <div>—</div><div>—</div><div>—</div><div style={{ textAlign: 'right', color: primary }}>View ›</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 10, textAlign: 'center' }}>Registry results appear here when visitors search.</p>
      </BlockWrap>
    );
  }

  // Fee Schedule — clean table of editable rows
  if (bt === 'fee_schedule') {
    const rows = Array.isArray(d.rows) ? d.rows : [];
    return (
      <BlockWrap>
        {d.heading && <h2 style={{ ...headingTypoStyle('h1', site), marginBottom: '0.4rem' }}>{d.heading}</h2>}
        {d.intro_body && <div className="site-rte" style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '0.9rem' }} dangerouslySetInnerHTML={{ __html: d.intro_body }} />}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', padding: '0.6rem 0.9rem', background: '#f9fafb', fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>
            <div>Item</div><div style={{ textAlign: 'right' }}>Amount</div><div style={{ paddingLeft: 16 }}>Notes</div>
          </div>
          {rows.length === 0 ? (
            <div style={{ padding: '0.9rem', color: '#9ca3af', fontStyle: 'italic', fontSize: '0.85rem' }}>Click to edit — add fee rows.</div>
          ) : rows.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', padding: '0.55rem 0.9rem', fontSize: '0.88rem', borderTop: '1px solid #f3f4f6', color: '#1f2937' }}>
              <div>{r.label || '—'}</div>
              <div style={{ textAlign: 'right', fontWeight: 700, color: primary }}>{r.amount || ''}</div>
              <div style={{ paddingLeft: 16, color: '#6b7280' }}>{r.notes || ''}</div>
            </div>
          ))}
        </div>
      </BlockWrap>
    );
  }

  // Map & Location — address + optional embedded map
  if (bt === 'map_location') {
    const isGoogleMapsEmbed = (url) => typeof url === 'string' && /^https:\/\/(www\.)?google\.com\/maps\/embed/.test(url);
    return (
      <BlockWrap>
        {d.heading && <h2 style={{ ...headingTypoStyle('h1', site), marginBottom: '0.4rem' }}>{d.heading}</h2>}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
          {isGoogleMapsEmbed(d.embed_url) ? (
            <iframe src={d.embed_url} style={{ border: 0, width: '100%', height: d.height || 320, display: 'block' }} loading="lazy" title="Location map" />
          ) : (
            <div style={{ height: d.height || 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#9ca3af', fontSize: 13 }}>
              🗺️ Map preview — paste a Google Maps embed URL in the editor.
            </div>
          )}
          {d.address && (
            <div style={{ padding: '0.7rem 1rem', borderTop: '1px solid #e5e7eb', fontSize: '0.92rem', color: '#1f2937' }}>
              📍 {d.address}
              {' '}<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.address)}`} target="_blank" rel="noreferrer"
                  style={{ color: primary, marginLeft: 6 }}>Get directions ›</a>
            </div>
          )}
        </div>
      </BlockWrap>
    );
  }

  // Hours of Operation — weekly hours table
  if (bt === 'hours_of_operation') {
    const rows = Array.isArray(d.hours) ? d.hours : [];
    return (
      <BlockWrap>
        {d.heading && <h2 style={{ ...headingTypoStyle('h1', site), marginBottom: '0.4rem' }}>{d.heading}</h2>}
        {d.intro_body && <div className="site-rte" style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '0.9rem' }} dangerouslySetInnerHTML={{ __html: d.intro_body }} />}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff', maxWidth: 480 }}>
          {rows.length === 0 ? (
            <div style={{ padding: '0.9rem', color: '#9ca3af', fontStyle: 'italic', fontSize: '0.85rem' }}>Click to edit — fill in your weekly hours.</div>
          ) : rows.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', padding: '0.55rem 0.9rem', fontSize: '0.9rem', borderTop: i ? '1px solid #f3f4f6' : 'none', color: '#1f2937' }}>
              <div style={{ fontWeight: 600 }}>{r.day || '—'}</div>
              <div style={{ textAlign: 'right', color: r.closed ? '#9ca3af' : '#1f2937' }}>
                {r.closed ? 'Closed' : (r.open && r.close ? `${r.open} – ${r.close}` : '—')}
                {r.notes && !r.closed ? <span style={{ color: '#6b7280', fontSize: '0.78rem', marginLeft: 6 }}>({r.notes})</span> : null}
              </div>
            </div>
          ))}
        </div>
        {d.timezone ? <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 8 }}>All times {d.timezone}.</p> : null}
      </BlockWrap>
    );
  }

  // FAQ accordion preview
  if (bt === 'faq') {
    const items = Array.isArray(d.items) ? d.items : [];
    const textColor = site?.text_color || '#111827';
    const primary = site?.primary_color || '#3D6B34';
    return (
      <BlockWrap>
        {d.heading && <h2 style={{ ...headingTypoStyle('h1', site), marginBottom: '1rem' }}>{d.heading}</h2>}
        {items.length === 0 ? (
          <div style={{ padding: '1.2rem', color: '#9ca3af', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: 8 }}>
            Click to edit — add FAQ items.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.slice(0, 5).map((item, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: textColor, lineHeight: 1.4 }}>{item.question || 'Question?'}</div>
                <span style={{ color: primary, fontSize: '1rem', flexShrink: 0 }}>+</span>
              </div>
            ))}
            {items.length > 5 && <div style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>+{items.length - 5} more</div>}
          </div>
        )}
      </BlockWrap>
    );
  }

  // Features grid — icon-box card preview
  if (bt === 'features') {
    const items = Array.isArray(d.items) ? d.items : [];
    const primary = site?.primary_color || '#3D6B34';
    const textColor = site?.text_color || '#111827';
    const cols = items.length <= 2 ? items.length || 1 : items.length <= 4 ? 2 : 3;
    return (
      <BlockWrap>
        {d.heading && <h2 style={{ ...headingTypoStyle('h1', site), marginBottom: '1rem' }}>{d.heading}</h2>}
        {items.length === 0 ? (
          <div style={{ padding: '1.2rem', color: '#9ca3af', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: 8 }}>
            Click to edit — add feature cards.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(cols, 3)}, 1fr)`, gap: '1rem' }}>
            {items.map((item, i) => (
              <div key={i} style={{ background: '#f9fafb', borderRadius: 10, padding: '1rem', border: '1px solid #e5e7eb' }}>
                {item.icon_url
                  ? <img src={item.icon_url} alt={item.title || ''} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6, marginBottom: 8 }} />
                  : <div style={{ width: 36, height: 36, borderRadius: 8, background: `${primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', marginBottom: 8 }}>✦</div>
                }
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: textColor, lineHeight: 1.3, marginBottom: 4 }}>{item.title || 'Feature'}</div>
                {item.description && <p style={{ margin: 0, fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.5 }}>{item.description.slice(0, 120)}{item.description.length > 120 ? '…' : ''}</p>}
              </div>
            ))}
          </div>
        )}
      </BlockWrap>
    );
  }

  // Team / staff preview
  if (bt === 'team') {
    const members = Array.isArray(d.members) ? d.members : [];
    const primary = site?.primary_color || '#3D6B34';
    const textColor = site?.text_color || '#111827';
    return (
      <BlockWrap>
        {d.heading && <h2 style={{ ...headingTypoStyle('h1', site), marginBottom: '1rem' }}>{d.heading}</h2>}
        {members.length === 0 ? (
          <div style={{ padding: '1.2rem', color: '#9ca3af', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: 8 }}>
            Click to edit — add team members.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(members.length, 3)}, 1fr)`, gap: '1.25rem' }}>
            {members.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
                {m.photo_url
                  ? <img src={m.photo_url} alt={m.name || ''} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${primary}30` }} />
                  : <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', color: primary }}>👤</div>
                }
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: textColor }}>{m.name || 'Name'}</div>
                  {m.role && <div style={{ fontSize: '0.78rem', color: primary, fontWeight: 600 }}>{m.role}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </BlockWrap>
    );
  }

  // Pricing / plans preview
  if (bt === 'pricing') {
    const tiers = Array.isArray(d.tiers) ? d.tiers : [];
    const primary = site?.primary_color || '#3D6B34';
    const textColor = site?.text_color || '#111827';
    return (
      <BlockWrap>
        {d.heading && <h2 style={{ ...headingTypoStyle('h1', site), marginBottom: '0.75rem' }}>{d.heading}</h2>}
        {tiers.length === 0 ? (
          <div style={{ padding: '1.2rem', color: '#9ca3af', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: 8 }}>
            Click to edit — add pricing tiers.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(tiers.length, 3)}, 1fr)`, gap: '0.75rem' }}>
            {tiers.map((tier, i) => (
              <div key={i} style={{
                background: tier.highlight ? primary : '#f9fafb',
                color: tier.highlight ? '#fff' : textColor,
                borderRadius: 10, padding: '1rem',
                border: tier.highlight ? `2px solid ${primary}` : '1px solid #e5e7eb',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>{tier.name}</div>
                <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{tier.price}{tier.period && <span style={{ fontSize: '0.7rem', fontWeight: 400, marginLeft: 2 }}>/{tier.period}</span>}</div>
                {Array.isArray(tier.features) && tier.features.slice(0, 3).map((f, j) => (
                  <div key={j} style={{ fontSize: '0.72rem', marginTop: 3, opacity: 0.85 }}>✓ {f}</div>
                ))}
              </div>
            ))}
          </div>
        )}
      </BlockWrap>
    );
  }

  // Sponsors — logo grid preview
  if (bt === 'sponsors') {
    const sponsors = Array.isArray(d.sponsors) ? d.sponsors : [];
    const cols = Math.max(1, Math.min(6, Number(d.columns) || 4));
    const logoH = Math.max(40, Math.min(200, Number(d.logo_height) || 80));
    return (
      <BlockWrap>
        {d.heading && <h2 style={{ ...headingTypoStyle('h1', site), marginBottom: '0.4rem' }}>{d.heading}</h2>}
        {d.intro_body && <div className="site-rte" style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '1rem' }} dangerouslySetInnerHTML={{ __html: d.intro_body }} />}
        {sponsors.length === 0 ? (
          <div style={{ padding: '1.2rem', color: '#9ca3af', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: 8 }}>
            Click to edit — add sponsor logos.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1.25rem', alignItems: 'center' }}>
            {sponsors.map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                {s.logo_url ? (
                  <img src={s.logo_url} alt={s.name || 'Sponsor'} style={{ maxHeight: logoH, maxWidth: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ height: logoH, width: '80%', background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
                    {s.name || 'Logo'}
                  </div>
                )}
                {d.show_names && s.name && <div style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 600, textAlign: 'center' }}>{s.name}</div>}
              </div>
            ))}
          </div>
        )}
      </BlockWrap>
    );
  }

  // CTA banner — full-width call-to-action preview
  if (bt === 'cta') {
    const bg    = d.bg_color       || '#1a1a1a';
    const fg    = d.text_color     || '#ffffff';
    const btnBg = d.button_bg_color || site?.accent_color || '#7CB342';
    const btnFg = d.button_text_color || '#ffffff';
    const align = d.align === 'center' ? 'center' : 'split';
    return (
      <BlockWrap noPad>
        <div style={{ background: bg, color: fg, padding: '2rem 1.5rem', borderRadius: 6 }}>
          <div style={{ display: 'flex', flexDirection: align === 'center' ? 'column' : 'row',
            justifyContent: align === 'center' ? 'center' : 'space-between',
            alignItems: 'center', gap: '1.25rem', textAlign: 'center' }}>
            {d.headline && (
              <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{d.headline}</div>
            )}
            {d.button_text && (
              <span style={{ display: 'inline-block', padding: '0.7rem 2rem', background: btnBg, color: btnFg,
                fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', borderRadius: 4, fontSize: '0.9rem' }}>
                {d.button_text}
              </span>
            )}
          </div>
        </div>
      </BlockWrap>
    );
  }

  // Data-backed blocks: livestock, produce, services, etc.
  const meta = BLOCK_TYPES.find(b => b.type === bt) || { icon: null, label: bt };
  return (
    <BlockWrap>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', color: '#3D6B34', marginBottom: '0.4rem' }}>{meta.icon}</div>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: primary, marginBottom: '0.25rem' }}>
          {d.heading || meta.label}
        </div>
        <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
          Live data from your account will appear here on the published site.
        </div>
      </div>
    </BlockWrap>
  );
}

// ── InlineLinksEditor: direct canvas editing for links blocks ────────

// Group heading (H2) — self-initializing contenteditable
function LinkGroupHeadingEditor({ heading, onSave, onMouseUp, onKeyUp, site }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.textContent = heading || ''; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <h2
      ref={ref}
      contentEditable suppressContentEditableWarning
      onPaste={pastePlainText}
      onMouseUp={onMouseUp} onKeyUp={onKeyUp}
      onBlur={e => onSave(e.currentTarget.textContent)}
      style={{ ...headingTypoStyle('h2', site), outline: 'none', cursor: 'text',
               borderBottom: '1px dashed #cbd5e1', paddingBottom: 2, marginBottom: '0.5rem' }}
    />
  );
}

// One link item — receives saveAndDetect from parent for toolbar sync
function LinkItemEditor({ item, index, linkColor, linkUline, bodyFont, bodySize, bodyColor, onSave, onMouseUp, onKeyUp }) {
  const labelRef = useRef(null);
  const descRef  = useRef(null);
  useEffect(() => {
    if (labelRef.current) labelRef.current.innerHTML = item.label || '';
    if (descRef.current)  descRef.current.innerHTML  = item.description || '';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
      {item.icon_url && (
        <img src={item.icon_url} alt="" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0, borderRadius: 4 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          ref={labelRef}
          contentEditable suppressContentEditableWarning
          onPaste={pastePlainText}
          onMouseUp={onMouseUp} onKeyUp={onKeyUp}
          onInput={e => onSave(index, 'label', e.currentTarget.innerHTML)}
          onBlur={e => onSave(index, 'label', e.currentTarget.innerHTML)}
          style={{ fontWeight: 600, fontFamily: bodyFont, fontSize: bodySize, color: linkColor,
                   textDecoration: linkUline ? 'underline' : 'none',
                   cursor: 'text', outline: 'none',
                   borderBottom: '1px dashed #cbd5e1', paddingBottom: 2, minHeight: '1.2em' }}
        />
        <div
          ref={descRef}
          contentEditable suppressContentEditableWarning
          onPaste={pasteAsBodyText}
          onMouseUp={onMouseUp} onKeyUp={onKeyUp}
          onInput={e => onSave(index, 'description', e.currentTarget.innerHTML)}
          onBlur={e => onSave(index, 'description', e.currentTarget.innerHTML)}
          style={{ fontFamily: bodyFont, fontSize: bodySize, color: bodyColor,
                   marginTop: 3, cursor: 'text', outline: 'none',
                   borderBottom: '1px dashed #cbd5e1', paddingBottom: 2, minHeight: '1.2em' }}
        />
      </div>
    </div>
  );
}

function InlineLinksEditor({ block, site, onFieldSave }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const d         = block.block_data || {};
  const groups    = normLinksGroups(d);
  const cols      = d.columns || 3;
  const bgColor   = d.bg_color || site?.bg_color || '#fff';
  const cWidth    = site?.body_content_width || '100%';
  const linkColor = site?.link_color || site?.accent_color || site?.primary_color || '#2563eb';
  const linkUline = site?.link_underline !== false;
  const bodyFont  = site?.body_font  || site?.font_family || 'inherit';
  const bodySize  = site?.body_size  || '1rem';
  const bodyColor = site?.body_color || site?.text_color  || '#111827';

  // Refs for selection management — containerRef tracks any contenteditable in the block
  const containerRef = useRef(null);
  const headingRef   = useRef(null);
  const activeEl     = useRef(null);
  const savedSel     = useRef(null);

  // Toolbar display state
  const [selStyle, setSelStyle] = useState('');
  const [selFont,  setSelFont]  = useState('');
  const [selSize,  setSelSize]  = useState('');
  const [selColor, setSelColor] = useState('#000000');

  useEffect(() => {
    if (headingRef.current) headingRef.current.textContent = d.heading || '';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Group / item mutation helpers ────────────────────────────────
  const saveGroups = (newGroups) => onFieldSave('groups', newGroups);

  const updateGroupHeading = (gi, text) => {
    const next = groups.map((g, i) => i === gi ? { ...g, heading: text } : g);
    saveGroups(next);
  };
  const addGroup = () => {
    saveGroups([...groups, { heading: 'New Group', items: [{ icon_url: '', label: 'Link Title', url: '', description: '' }] }]);
  };
  const removeGroup = (gi) => {
    if (groups.length <= 1) return;
    saveGroups(groups.filter((_, i) => i !== gi));
  };
  const saveItem = (gi, ii, key, val) => {
    const next = groups.map((g, i) => i !== gi ? g : {
      ...g, items: g.items.map((it, j) => j === ii ? { ...it, [key]: val } : it),
    });
    saveGroups(next);
  };
  const addItem = (gi) => {
    const next = groups.map((g, i) => i !== gi ? g : {
      ...g, items: [...g.items, { icon_url: '', label: 'Link Title', url: '', description: '' }],
    });
    saveGroups(next);
  };
  const removeItem = (gi, ii) => {
    const next = groups.map((g, i) => i !== gi ? g : {
      ...g, items: g.items.filter((_, j) => j !== ii),
    });
    saveGroups(next);
  };

  // ── Selection helpers ────────────────────────────────────────────
  const saveSel = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (containerRef.current?.contains(sel.anchorNode)) {
      activeEl.current = document.activeElement;
      savedSel.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSel = () => {
    const el = activeEl.current;
    if (!el) return;
    el.focus();
    if (savedSel.current) {
      try { const s = window.getSelection(); s.removeAllRanges(); s.addRange(savedSel.current); } catch (_) {}
    }
  };

  const detectSelectionProps = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let el = sel.anchorNode;
    if (el?.nodeType === Node.TEXT_NODE) el = el.parentElement;
    let blockTag = '', fontVal = '', sizeVal = '', colorVal = '';
    const root = containerRef.current;
    let walker = el;
    while (walker && walker !== root) {
      const tag = walker.tagName?.toLowerCase();
      if (!blockTag && ['h1','h2','h3','h4','p'].includes(tag)) blockTag = tag;
      if (!fontVal  && walker.style?.fontFamily) fontVal  = walker.style.fontFamily;
      if (!sizeVal  && walker.style?.fontSize)   sizeVal  = walker.style.fontSize;
      if (!colorVal && walker.style?.color)      colorVal = walker.style.color;
      if (blockTag && fontVal && sizeVal && colorVal) break;
      walker = walker.parentElement;
    }
    setSelStyle(blockTag);
    setSelFont(fontVal);
    setSelSize(sizeVal ? String(parseInt(sizeVal)) : '');
    if (colorVal) {
      const m = colorVal.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (m) colorVal = '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
      setSelColor(colorVal);
    }
  };

  const saveAndDetect = () => { saveSel(); detectSelectionProps(); };

  // ── Toolbar command helpers ──────────────────────────────────────
  const btnCmd = (e, cmd, val = null) => {
    const sel   = window.getSelection();
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : savedSel.current;
    const el    = (sel && sel.rangeCount > 0 && containerRef.current?.contains(sel.anchorNode))
      ? document.activeElement : activeEl.current;
    e.preventDefault();
    if (el) { el.focus(); if (range) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(range); } }
    document.execCommand(cmd, false, val);
    saveSel();
  };

  const applyBlock = (tag) => {
    restoreSel();
    document.execCommand('formatBlock', false, tag);
    const sel2 = window.getSelection();
    if (sel2 && sel2.rangeCount > 0) {
      let node = sel2.anchorNode;
      if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
      while (node && !['H1','H2','H3','H4','P'].includes(node.tagName)) node = node.parentElement;
      if (node) {
        const s = headingTypoStyle(tag, site);
        node.style.fontSize = s.fontSize || ''; node.style.fontWeight = s.fontWeight || '';
        node.style.color = s.color || ''; node.style.fontFamily = s.fontFamily || '';
        node.style.textAlign = s.textAlign || ''; node.style.textDecoration = s.textDecoration || '';
      }
    }
    saveSel();
  };

  const applyFont = (fontFam) => {
    restoreSel();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { document.execCommand('fontName', false, fontFam); return; }
    try {
      const range = sel.getRangeAt(0); const frag = range.extractContents();
      const span = document.createElement('span'); span.style.fontFamily = fontFam; span.appendChild(frag);
      range.insertNode(span);
      const nr = document.createRange(); nr.selectNodeContents(span);
      sel.removeAllRanges(); sel.addRange(nr); saveSel();
    } catch (_) { document.execCommand('fontName', false, fontFam); }
  };

  const applyFontSize = (px) => {
    restoreSel();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    try {
      const range = sel.getRangeAt(0); const frag = range.extractContents();
      const span = document.createElement('span'); span.style.fontSize = px + 'px'; span.appendChild(frag);
      range.insertNode(span);
      const nr = document.createRange(); nr.selectNodeContents(span);
      sel.removeAllRanges(); sel.addRange(nr); saveSel();
    } catch (_) {}
  };

  const applyFontColor = (hex) => { restoreSel(); document.execCommand('foreColor', false, hex); setSelColor(hex); saveSel(); };

  const insertLink = () => {
    // Save selection before prompt steals it
    saveSel();
    const input = window.prompt(wb('rte_link_prompt'));
    if (!input) return;
    const val = input.trim();
    const href = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? `mailto:${val}`
               : /^https?:\/\//i.test(val) ? val : /^mailto:/i.test(val) ? val : `https://${val}`;
    // Restore selection after prompt closes, then wrap with link
    restoreSel();
    document.execCommand('createLink', false, href);
    activeEl.current?.querySelectorAll('a').forEach(a => { a.target = '_blank'; a.rel = 'noopener noreferrer'; });
  };

  const clearFormatting = () => {
    const el = activeEl.current; if (!el) return;
    el.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('removeFormat', false, null);
    el.querySelectorAll('[style]').forEach(n => n.removeAttribute('style'));
    el.querySelectorAll('font').forEach(n => { const s = document.createElement('span'); s.textContent = n.textContent; n.replaceWith(s); });
  };

  // ── Shared toolbar styles ────────────────────────────────────────
  const tbBtn = { display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'3px 8px', borderRadius:4, fontSize:12, cursor:'pointer', border:'1px solid #475569', background:'#334155', color:'#e2e8f0', lineHeight:1 };
  const tbSel = { fontSize:11, border:'1px solid #475569', borderRadius:4, padding:'3px 5px', background:'#334155', color:'#e2e8f0', cursor:'pointer' };
  const tbDiv = { width:1, background:'#475569', alignSelf:'stretch', margin:'0 2px' };
  const paletteColors = [site?.primary_color, site?.secondary_color, site?.accent_color, site?.text_color, site?.nav_text_color].filter(Boolean);

  const addGroupBtn = {
    display: 'block', width: '100%', marginTop: '1rem', padding: '7px 0',
    border: '1px dashed #94a3b8', borderRadius: 8, background: 'none',
    color: '#64748b', fontSize: 13, cursor: 'pointer', textAlign: 'center',
  };
  const addItemBtn = {
    display: 'block', width: '100%', marginTop: '0.5rem', padding: '4px 0',
    border: '1px dashed #cbd5e1', borderRadius: 6, background: 'none',
    color: '#94a3b8', fontSize: 12, cursor: 'pointer', textAlign: 'center',
  };

  return (
    <div ref={containerRef} onClick={e => e.stopPropagation()}>
      {/* Toolbar */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:4, padding:'6px 10px', background:'#1e293b', alignItems:'center' }}>
        <select style={tbSel} value={selStyle} onMouseDown={saveSel} onChange={e => { applyBlock(e.target.value); setSelStyle(e.target.value); }}>
          <option value="">Style</option>
          <option value="p">Body</option>
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
          <option value="h4">H4</option>
        </select>
        <select style={{ ...tbSel, maxWidth:120 }} value={selFont} onMouseDown={saveSel} onChange={e => { applyFont(e.target.value); setSelFont(e.target.value); }}>
          <option value="">Font</option>
          {WEB_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select style={{ ...tbSel, width:62 }} value={selSize} onMouseDown={saveSel} onChange={e => { if (e.target.value) { applyFontSize(e.target.value); setSelSize(e.target.value); } }}>
          <option value="">Size</option>
          {[10,11,12,13,14,16,18,20,22,24,28,32,36,42,48,56,64,72].map(s => <option key={s} value={String(s)}>{s}px</option>)}
        </select>
        <ToolbarColorPicker color={selColor} onChange={applyFontColor} paletteColors={paletteColors} />
        <div style={tbDiv} />
        <button style={{ ...tbBtn, fontWeight:700 }} title="Bold" onMouseDown={e => btnCmd(e, 'bold')}>B</button>
        <button style={{ ...tbBtn, textDecoration:'underline' }} title="Underline" onMouseDown={e => btnCmd(e, 'underline')}>U</button>
        <button style={{ ...tbBtn, textDecoration:'line-through' }} title="Strikethrough" onMouseDown={e => btnCmd(e, 'strikeThrough')}>S</button>
        <div style={tbDiv} />
        <button style={tbBtn} title="Align Left" onMouseDown={e => btnCmd(e, 'justifyLeft')}>
          <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor"><rect x="0" y="0" width="14" height="1.8"/><rect x="0" y="4" width="10" height="1.8"/><rect x="0" y="8" width="14" height="1.8"/></svg>
        </button>
        <button style={tbBtn} title="Center" onMouseDown={e => btnCmd(e, 'justifyCenter')}>
          <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor"><rect x="0" y="0" width="14" height="1.8"/><rect x="2" y="4" width="10" height="1.8"/><rect x="0" y="8" width="14" height="1.8"/></svg>
        </button>
        <button style={tbBtn} title="Align Right" onMouseDown={e => btnCmd(e, 'justifyRight')}>
          <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor"><rect x="0" y="0" width="14" height="1.8"/><rect x="4" y="4" width="10" height="1.8"/><rect x="0" y="8" width="14" height="1.8"/></svg>
        </button>
        <div style={tbDiv} />
        <button style={tbBtn} title="Bullet List" onMouseDown={e => btnCmd(e, 'insertUnorderedList')}>
          <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor"><circle cx="1.4" cy="2" r="1.3"/><rect x="4" y="1.2" width="10" height="1.6"/><circle cx="1.4" cy="6" r="1.3"/><rect x="4" y="5.2" width="10" height="1.6"/><circle cx="1.4" cy="10" r="1.3"/><rect x="4" y="9.2" width="10" height="1.6"/></svg>
        </button>
        <button style={tbBtn} title="Numbered List" onMouseDown={e => btnCmd(e, 'insertOrderedList')}>
          <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor"><text x="0" y="3.5" fontSize="4" fontFamily="monospace">1.</text><rect x="4" y="1.2" width="10" height="1.6"/><text x="0" y="7.5" fontSize="4" fontFamily="monospace">2.</text><rect x="4" y="5.2" width="10" height="1.6"/><text x="0" y="11.5" fontSize="4" fontFamily="monospace">3.</text><rect x="4" y="9.2" width="10" height="1.6"/></svg>
        </button>
        <div style={tbDiv} />
        <button style={tbBtn} title="Insert Link" onMouseDown={e => { e.preventDefault(); insertLink(); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        </button>
        <button style={{ ...tbBtn, fontSize:10 }} title="Remove Link" onMouseDown={e => btnCmd(e, 'unlink')}>✕🔗</button>
        <div style={tbDiv} />
        <button style={{ ...tbBtn, fontSize:10, color:'#fca5a5' }} title="Clear all formatting"
          onMouseDown={e => { e.preventDefault(); clearFormatting(); }}>Tx</button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize:10, color:'#475569', fontStyle:'italic' }}>{wb('links_hint')}</span>
      </div>

      {/* Content */}
      <div style={{ background: bgColor, padding: '1.75rem 2.5rem' }}>
        <div style={{ maxWidth: cWidth, margin: '0 auto' }}>
          {/* H1 main heading */}
          <h1
            ref={headingRef}
            contentEditable suppressContentEditableWarning
            onPaste={pastePlainText}
            onMouseUp={saveAndDetect} onKeyUp={saveAndDetect}
            onBlur={e => onFieldSave('heading', e.currentTarget.textContent)}
            style={{ ...headingTypoStyle('h1', site), outline:'none', cursor:'text',
                     borderBottom:'1px dashed #cbd5e1', paddingBottom:4, marginBottom:'1.25rem' }}
          />

          {/* Groups */}
          {groups.map((group, gi) => (
            <div key={`${block.block_id}-g${gi}-${groups.length}`} style={{ marginBottom: '1.5rem' }}>
              {/* Group header row: H2 heading + remove button */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <LinkGroupHeadingEditor
                    key={`${block.block_id}-gh${gi}-${groups.length}`}
                    heading={group.heading}
                    onSave={text => updateGroupHeading(gi, text)}
                    onMouseUp={saveAndDetect} onKeyUp={saveAndDetect}
                    site={site}
                  />
                </div>
                {groups.length > 1 && (
                  <button
                    title="Remove this group"
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); removeGroup(gi); }}
                    style={{ flexShrink: 0, marginTop: 4, padding: '2px 8px', fontSize: 11, border: 'none', borderRadius: 4, background: '#C0382B', color: '#fff', cursor: 'pointer' }}
                  >{wb('links_remove_group')}</button>
                )}
              </div>

              {/* Link items grid */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0.75rem' }}>
                {(group.items || []).map((item, ii) => (
                  <div key={`${block.block_id}-g${gi}-i${ii}-${group.items.length}`} style={{ position: 'relative' }}>
                    <LinkItemEditor
                      item={item} index={ii}
                      linkColor={linkColor} linkUline={linkUline}
                      bodyFont={bodyFont} bodySize={bodySize} bodyColor={bodyColor}
                      onSave={(idx, key, val) => saveItem(gi, idx, key, val)}
                      onMouseUp={saveAndDetect} onKeyUp={saveAndDetect}
                    />
                    <button
                      title="Remove this link"
                      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); removeItem(gi, ii); }}
                      style={{ position: 'absolute', top: 0, right: 0, fontSize: 10, padding: '1px 5px', border: 'none', borderRadius: 3, background: '#C0382B', color: '#fff', cursor: 'pointer', lineHeight: 1.4 }}
                    >✕</button>
                  </div>
                ))}
              </div>

              {/* Add link button */}
              <button style={addItemBtn} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); addItem(gi); }}>
                {wb('links_add_link')}
              </button>
            </div>
          ))}

          {/* Add group button */}
          <button style={addGroupBtn} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); addGroup(); }}>
            {wb('links_add_group')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CanvasBlock: click-to-select with ↑↓ + delete controls ────────
function CanvasBlock({ block, index, isSelected, onSelect, onDelete, onMoveUp, onMoveDown, isFirst, isLast, onDragStart, onDragOver, onDrop, isDragging, site, onFieldSave, businessId, pages }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const meta = BLOCK_TYPES.find(b => b.type === block.block_type);
  // Blocks that edit in-place on the canvas — disable drag so text selection works.
  const INLINE_TYPES = ['about', 'content', 'content_2col', 'content_4col', 'links', 'livestock', 'studs', 'testimonials', 'testimonial_random', 'packages'];
  const isInlineType = INLINE_TYPES.includes(block.block_type);
  const isInlineEditable = isSelected && isInlineType;
  return (
    <div
      onClick={e => { e.stopPropagation(); onSelect(block); }}
      draggable={!isInlineType}
      onDragStart={e => { if (isInlineType) { e.preventDefault(); return; } onDragStart(e, index); }}
      onDragOver={e => { e.preventDefault(); onDragOver(e, index); }}
      onDrop={e => { e.preventDefault(); onDrop(e, index); }}
      style={{
        position: 'relative',
        marginTop: 5,
        outline: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
        outlineOffset: -2,
        cursor: isInlineType ? 'default' : 'pointer',
        opacity: isDragging ? 0.35 : 1,
        transition: 'outline 0.1s, opacity 0.1s',
      }}
      className="canvas-block"
    >
      {isInlineEditable && block.block_type === 'links'
        ? <InlineLinksEditor key={block.block_id} block={block} site={site} onFieldSave={onFieldSave} />
        : isInlineEditable && block.block_type === 'content_2col'
          ? <MultiColumnInlineEditor key={block.block_id} block={block} site={site} onFieldSave={onFieldSave} columnCount={2} pages={pages} />
          : isInlineEditable && block.block_type === 'content_4col'
            ? <MultiColumnInlineEditor key={block.block_id} block={block} site={site} onFieldSave={onFieldSave} columnCount={4} pages={pages} />
            : isInlineEditable && (block.block_type === 'livestock' || block.block_type === 'studs' || block.block_type === 'testimonials' || block.block_type === 'testimonial_random')
              ? <SimpleBlockPreview block={block} site={site} businessId={businessId} onFieldSave={onFieldSave} />
              : isInlineEditable
                ? <InlineContentEditor key={block.block_id} block={block} site={site} onFieldSave={onFieldSave} pages={pages} />
                : <SimpleBlockPreview block={block} site={site} businessId={businessId} onFieldSave={onFieldSave} />}

      {/* Controls — always visible when selected, shown on hover via CSS */}
      <div className="block-controls" style={{
        position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, zIndex: 10,
        opacity: isSelected ? 1 : 0, transition: 'opacity 0.15s',
      }}>
        <span style={{ background: '#3b82f6', color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, alignSelf: 'center', marginRight: 4 }}>
          {meta?.label || block.block_type}
        </span>
        {(block.block_type === 'livestock' || block.block_type === 'studs' || block.block_type === 'testimonials' || block.block_type === 'testimonial_random') && onFieldSave && (
          <>
            <label
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '2px 6px', fontSize: 11, color: '#374151' }}
            >
              <span style={{ fontWeight: 600, color: '#64748b' }}>{wb('canvas_heading_label')}</span>
              <select
                value={block.block_data?.heading_style || 'h1'}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onChange={e => { e.stopPropagation(); onFieldSave('heading_style', e.target.value); }}
                style={{ border: 'none', background: 'transparent', fontSize: 11, color: '#374151', cursor: 'pointer', outline: 'none' }}
              >
                <option value="h1">H1</option>
                <option value="h2">H2</option>
                <option value="h3">H3</option>
              </select>
            </label>
            {(block.block_type === 'livestock' || block.block_type === 'studs') && (
            <label
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '2px 6px', fontSize: 11, color: '#374151' }}
            >
              <span style={{ fontWeight: 600, color: '#64748b' }}>{wb('canvas_default_layout')}</span>
              <select
                value={block.block_data?.default_view || 'grid'}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                onChange={e => { e.stopPropagation(); onFieldSave('default_view', e.target.value); }}
                style={{ border: 'none', background: 'transparent', fontSize: 11, color: '#374151', cursor: 'pointer', outline: 'none' }}
              >
                <option value="grid">{wb('canvas_grid')}</option>
                <option value="list">{wb('canvas_list')}</option>
                <option value="table">{wb('canvas_table')}</option>
              </select>
            </label>
            )}
            {(block.block_type === 'testimonials' || block.block_type === 'testimonial_random') && (
            <>
              <label
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '2px 6px', fontSize: 11, color: '#374151' }}
              >
                <span style={{ fontWeight: 600, color: '#64748b' }}>{wb('canvas_font_label')}</span>
                <select
                  value={block.block_data?.testimonial_font || ''}
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onChange={e => { e.stopPropagation(); onFieldSave('testimonial_font', e.target.value); }}
                  style={{ border: 'none', background: 'transparent', fontSize: 11, color: '#374151', cursor: 'pointer', outline: 'none', maxWidth: 100 }}
                >
                  <option value="">{wb('canvas_site_default')}</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Inter, sans-serif">Inter</option>
                  <option value="Lato, sans-serif">Lato</option>
                  <option value="Lora, serif">Lora</option>
                  <option value="Merriweather, serif">Merriweather</option>
                  <option value="Montserrat, sans-serif">Montserrat</option>
                  <option value="Open Sans, sans-serif">Open Sans</option>
                  <option value="Playfair Display, serif">Playfair Display</option>
                  <option value="Poppins, sans-serif">Poppins</option>
                  <option value="Roboto, sans-serif">Roboto</option>
                  <option value="'Tempus Sans ITC', sans-serif">Tempus Sans ITC</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                </select>
              </label>
              <label
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '2px 6px', fontSize: 11, color: '#374151' }}
              >
                <span style={{ fontWeight: 600, color: '#64748b' }}>{wb('canvas_size_label')}</span>
                <select
                  value={block.block_data?.testimonial_size || ''}
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onChange={e => { e.stopPropagation(); onFieldSave('testimonial_size', e.target.value); }}
                  style={{ border: 'none', background: 'transparent', fontSize: 11, color: '#374151', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="">{wb('canvas_site_default')}</option>
                  <option value="0.75rem">XS</option>
                  <option value="0.875rem">S</option>
                  <option value="1rem">M</option>
                  <option value="1.125rem">L</option>
                  <option value="1.25rem">XL</option>
                  <option value="1.5rem">2XL</option>
                </select>
              </label>
            </>
            )}
            {block.block_type === 'testimonial_random' && (
              <label
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '2px 6px', fontSize: 11, color: '#374151' }}
              >
                <span style={{ fontWeight: 600, color: '#64748b' }}>{wb('canvas_align_label')}</span>
                <select
                  value={block.block_data?.align || 'left'}
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onChange={e => { e.stopPropagation(); onFieldSave('align', e.target.value); }}
                  style={{ border: 'none', background: 'transparent', fontSize: 11, color: '#374151', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="left">{wb('canvas_align_left')}</option>
                  <option value="center">{wb('canvas_align_center')}</option>
                  <option value="right">{wb('canvas_align_right')}</option>
                </select>
              </label>
            )}
          </>
        )}
        <button onClick={e => { e.stopPropagation(); onMoveUp(); }} disabled={isFirst}
          style={{ padding: '3px 8px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, cursor: isFirst ? 'default' : 'pointer', fontSize: 12, opacity: isFirst ? 0.35 : 1 }}>↑</button>
        <button onClick={e => { e.stopPropagation(); onMoveDown(); }} disabled={isLast}
          style={{ padding: '3px 8px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, cursor: isLast ? 'default' : 'pointer', fontSize: 12, opacity: isLast ? 0.35 : 1 }}>↓</button>
        <button onClick={e => { e.stopPropagation(); if (window.confirm(wb('canvas_delete_confirm'))) onDelete(block.block_id); }}
          style={{ padding: '3px 8px', background: '#C0382B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>🗑</button>
      </div>
      <style>{`.canvas-block:hover .block-controls { opacity: 1 !important; }`}</style>
    </div>
  );
}

// ── RichTextEditor: toolbar + contenteditable rich text ─────────────
function RichTextEditor({ value, onChange }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const editorRef  = useRef(null);
  const htmlRef    = useRef(null);
  const [htmlMode, setHtmlMode] = useState(false);

  // Set content on mount (key prop handles block switching via remount)
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = value || '';
    if (htmlRef.current)   htmlRef.current.value       = value || '';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync content whenever htmlMode flips
  useEffect(() => {
    if (htmlMode) {
      // Entering HTML view — copy rich-text innerHTML into textarea
      if (htmlRef.current && editorRef.current)
        htmlRef.current.value = editorRef.current.innerHTML;
    } else {
      // Returning to rich-text view — apply textarea HTML into editor
      if (editorRef.current && htmlRef.current)
        editorRef.current.innerHTML = htmlRef.current.value;
    }
  }, [htmlMode]);

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  const clearFormatting = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    // Select all content then remove formatting
    document.execCommand('selectAll', false, null);
    document.execCommand('removeFormat', false, null);
    // Strip any leftover inline style attributes from every element
    editorRef.current.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
    editorRef.current.querySelectorAll('font').forEach(el => {
      const span = document.createElement('span');
      span.innerHTML = el.innerHTML;
      el.replaceWith(span);
    });
    onChange(editorRef.current.innerHTML);
  };

  const handleBlur = () => {
    if (!htmlMode) onChange(editorRef.current?.innerHTML || '');
  };

  const applyBlock = (tag) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
  };

  const insertLink = () => {
    const input = window.prompt(wb('rte_link_prompt'));
    if (!input) return;
    const val  = input.trim();
    const href = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? `mailto:${val}`
               : /^https?:\/\//i.test(val)               ? val
               : /^mailto:/i.test(val)                   ? val
               : `https://${val}`;
    exec('createLink', href);
    // Ensure new link opens in a new tab
    editorRef.current?.querySelectorAll('a').forEach(a => { a.target = '_blank'; a.rel = 'noopener noreferrer'; });
  };

  const applyFont = (fontFamily) => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      document.execCommand('fontName', false, fontFamily);
      return;
    }
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontFamily = fontFamily;
    try { range.surroundContents(span); } catch { document.execCommand('fontName', false, fontFamily); }
  };

  const btn = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '3px 7px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
    border: '1px solid #d1d5db', background: '#fff', color: '#374151',
    lineHeight: 1,
  };
  const sel = {
    fontSize: 11, border: '1px solid #d1d5db', borderRadius: 4,
    padding: '3px 5px', background: '#fff', cursor: 'pointer', color: '#374151',
  };

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: 8, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 8px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
        {!htmlMode && <>
          <select style={sel} defaultValue="" onChange={e => { applyBlock(e.target.value); e.target.value = ''; }}>
            <option value="" disabled>{wb('toolbar_style')}</option>
            <option value="p">{wb('toolbar_body')}</option>
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
            <option value="h4">H4</option>
          </select>
          <select style={{ ...sel, maxWidth: 110 }} defaultValue="" onChange={e => { applyFont(e.target.value); e.target.value = ''; }}>
            <option value="" disabled>{wb('toolbar_font')}</option>
            {WEB_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch', margin: '0 2px' }} />
          <button style={{ ...btn, fontWeight: 700 }} title="Bold"
            onMouseDown={e => { e.preventDefault(); exec('bold'); }}>B</button>
          <button style={{ ...btn, textDecoration: 'underline' }} title="Underline"
            onMouseDown={e => { e.preventDefault(); exec('underline'); }}>U</button>
          <button style={{ ...btn, textDecoration: 'line-through' }} title="Strikethrough"
            onMouseDown={e => { e.preventDefault(); exec('strikeThrough'); }}>S</button>
          <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch', margin: '0 2px' }} />
          <button style={btn} title="Align Left"
            onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="1" width="13" height="1.5"/><rect x="0" y="4.5" width="9" height="1.5"/><rect x="0" y="8" width="13" height="1.5"/><rect x="0" y="11.5" width="9" height="1.5"/></svg>
          </button>
          <button style={btn} title="Center"
            onMouseDown={e => { e.preventDefault(); exec('justifyCenter'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="1" width="13" height="1.5"/><rect x="2" y="4.5" width="9" height="1.5"/><rect x="0" y="8" width="13" height="1.5"/><rect x="2" y="11.5" width="9" height="1.5"/></svg>
          </button>
          <button style={btn} title="Align Right"
            onMouseDown={e => { e.preventDefault(); exec('justifyRight'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="0" y="1" width="13" height="1.5"/><rect x="4" y="4.5" width="9" height="1.5"/><rect x="0" y="8" width="13" height="1.5"/><rect x="4" y="11.5" width="9" height="1.5"/></svg>
          </button>
          <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch', margin: '0 2px' }} />
          <button style={btn} title="Bullet List"
            onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
              <circle cx="1.5" cy="2.5" r="1.2"/>
              <rect x="4" y="1.8" width="9" height="1.4"/>
              <circle cx="1.5" cy="6.5" r="1.2"/>
              <rect x="4" y="5.8" width="9" height="1.4"/>
              <circle cx="1.5" cy="10.5" r="1.2"/>
              <rect x="4" y="9.8" width="9" height="1.4"/>
            </svg>
          </button>
          <button style={btn} title="Numbered List"
            onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
              <text x="0" y="4" fontSize="4.5" fontFamily="monospace">1.</text>
              <rect x="4" y="1.8" width="9" height="1.4"/>
              <text x="0" y="8" fontSize="4.5" fontFamily="monospace">2.</text>
              <rect x="4" y="5.8" width="9" height="1.4"/>
              <text x="0" y="12" fontSize="4.5" fontFamily="monospace">3.</text>
              <rect x="4" y="9.8" width="9" height="1.4"/>
            </svg>
          </button>
          <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch', margin: '0 2px' }} />
          <button style={btn} title="Insert Link"
            onMouseDown={e => { e.preventDefault(); insertLink(); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
          </button>
          <button style={{ ...btn, fontSize: 10 }} title="Remove Link"
            onMouseDown={e => { e.preventDefault(); exec('unlink'); }}>✕🔗</button>
          <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch', margin: '0 2px' }} />
          {/* Clear all formatting */}
          <button style={{ ...btn, fontSize: 10, color: '#b91c1c' }} title="Clear all formatting"
            onMouseDown={e => { e.preventDefault(); clearFormatting(); }}>Tx</button>
          <div style={{ width: 1, background: '#e5e7eb', alignSelf: 'stretch', margin: '0 2px' }} />
        </>}
        {/* HTML source toggle */}
        <button
          title={htmlMode ? 'Back to rich text' : 'View / edit HTML source'}
          onClick={() => setHtmlMode(m => !m)}
          style={{
            ...btn,
            fontFamily: 'monospace', fontSize: 11, letterSpacing: '-0.5px',
            background: htmlMode ? '#1e293b' : '#fff',
            color: htmlMode ? '#7dd3fc' : '#374151',
            border: `1px solid ${htmlMode ? '#334155' : '#d1d5db'}`,
          }}
        >&lt;/&gt;</button>
      </div>
      {/* Both areas always in DOM — toggled with display so refs are always valid */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onPaste={pasteAsBodyText}
        style={{
          display: htmlMode ? 'none' : 'block',
          minHeight: 160, padding: '10px 12px', fontSize: 13, lineHeight: 1.7,
          color: '#111827', outline: 'none', background: '#fff', overflowY: 'auto',
        }}
      />
      <textarea
        ref={htmlRef}
        onBlur={e => { onChange(e.target.value); }}
        style={{
          display: htmlMode ? 'block' : 'none',
          width: '100%', minHeight: 160, padding: '10px 12px',
          fontSize: 11, fontFamily: 'monospace', lineHeight: 1.6,
          color: '#0f172a', background: '#f8fafc', border: 'none', outline: 'none',
          resize: 'vertical', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

// ── BlogBlockCanvas: canvas preview of blog block showing live posts in a table ──
function renderBlogPostContent(content) {
  if (!content) return null;
  let blocks;
  try {
    blocks = JSON.parse(content);
    if (!Array.isArray(blocks)) throw new Error();
  } catch {
    return <div style={{ fontSize: '0.9rem', color: '#1f2937', lineHeight: 1.8, wordBreak: 'break-word' }} dangerouslySetInnerHTML={{ __html: content }} />;
  }
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'image') {
          return (
            <figure key={i} style={{ margin: '1.25rem 0', textAlign: block.align || 'center' }}>
              <img src={block.url} alt={block.caption || ''} style={{ width: block.width || '100%', maxWidth: '100%', borderRadius: 8, display: 'inline-block' }} onError={e => e.target.style.display = 'none'} />
              {block.caption && <figcaption style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.3rem', fontStyle: 'italic' }}>{block.caption}</figcaption>}
            </figure>
          );
        }
        return <div key={i} style={{ fontSize: '0.9rem', color: '#1f2937', lineHeight: 1.8, wordBreak: 'break-word', marginBottom: '0.4rem' }} dangerouslySetInnerHTML={{ __html: block.content || '' }} />;
      })}
    </>
  );
}

// Wrap testimonial HTML in curly quotes + italic, unless it already starts with a quote character.
// Inserts quotes inside the first/last block-level elements so they don't appear on separate lines.
// Optional font/size params are applied inline so they override any inner element styles.
function wrapTestimonialHtml(html, font, size) {
  if (!html) return html;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const txt = (tmp.textContent || '').trim();
  const hasQuote = /^[\u201C\u201D\u2018\u2019"']/.test(txt);
  if (!hasQuote) {
    const walker = document.createTreeWalker(tmp, NodeFilter.SHOW_TEXT);
    const first = walker.nextNode();
    if (first) first.textContent = '\u201C' + first.textContent;
    let last = first;
    while (walker.nextNode()) last = walker.currentNode;
    if (last) last.textContent = last.textContent + '\u201D';
  }
  // Apply font/size to all direct child elements so they override any inner inline styles
  if (font || size) {
    for (const child of tmp.querySelectorAll('*')) {
      if (font) child.style.fontFamily = font;
      if (size) child.style.fontSize = size;
    }
  }
  return `<em>${tmp.innerHTML}</em>`;
}

function TestimonialsBlockCanvas({ block, site, businessId, onFieldSave }) {
  const d = block.block_data || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const textColor  = site?.text_color    || '#111827';
  const fontFamily = site?.font_family   || 'inherit';
  const bgWidth    = site?.body_bg_width || '100%';
  const bgColor    = d.bg_color || site?.bg_color || '#fff';
  const cWidth     = site?.body_content_width || '100%';
  const bodyBaseStyle = {
    fontFamily: site?.body_font  || site?.font_family || 'inherit',
    fontSize:   site?.body_size  || '1rem',
    color:      site?.body_color || site?.text_color  || '#4B5563',
    lineHeight: site?.body_line_height || 1.75,
    fontStyle:  site?.body_italic ? 'italic' : 'normal',
  };

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    fetch(`${API}/api/testimonials?BusinessID=${businessId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [businessId]);

  const maxItems = d.max_items || 0;
  const visible = maxItems > 0 ? items.slice(0, maxItems) : items;
  const tFont = d.testimonial_font || bodyBaseStyle.fontFamily;
  const tSize = d.testimonial_size || bodyBaseStyle.fontSize;
  // Map fields for InlineContentEditor (same pattern as livestock)
  const inlineData = { heading: d.heading || '', heading_style: d.heading_style, body: d.intro_body, bg_color: d.bg_color };
  const inlineFieldSave = onFieldSave
    ? (field, val) => onFieldSave(field === 'body' ? 'intro_body' : field, val)
    : null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: bgWidth, background: bgColor, fontFamily }}>
        {/* Inline-editable heading + intro */}
        {onFieldSave ? (
          <div
            draggable={false}
            onDragStart={e => { e.preventDefault(); e.stopPropagation(); }}
            onMouseDown={e => e.stopPropagation()}
          >
            <InlineContentEditor
              key={block.block_id}
              block={block}
              site={site}
              onFieldSave={inlineFieldSave}
              data={inlineData}
            />
          </div>
        ) : (d.heading || d.intro_body) ? (
          <div style={{ padding: '1.75rem 2.5rem' }}>
            <div className="rte-body">
              {d.heading && <HeadTag style={headingTypoStyle(d.heading_style || 'h1', site)} dangerouslySetInnerHTML={{ __html: d.heading }} />}
              {d.intro_body && (
                <div style={{ ...bodyBaseStyle, marginTop: 6 }} dangerouslySetInnerHTML={{ __html: d.intro_body }} />
              )}
            </div>
          </div>
        ) : null}

        <div style={{ padding: (d.heading || d.intro_body || onFieldSave) ? '0 2.5rem 1.75rem' : '1.75rem 2.5rem', maxWidth: cWidth, margin: '0 auto' }}>
          {loading ? <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading testimonials...</p>
           : visible.length === 0 ? <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No testimonials yet.</p>
           : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {visible.map((t, i) => (
                <div key={t.TestimonialsID || i} style={{ background: '#f9fafb', borderRadius: 12, padding: '1.25rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontFamily: tFont, fontSize: tSize, color: textColor, lineHeight: 1.6, margin: 0 }} dangerouslySetInnerHTML={{ __html: wrapTestimonialHtml(t.Content, tFont, tSize) }} />
                  <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: textColor }}>
                      — {(t.AuthorName || 'Anonymous').split(' ')[0]}{(t.City || t.State) ? ', ' + [t.City, t.State].filter(Boolean).join(' ') : ''}
                    </p>
                    {t.Rating > 0 && <span style={{ fontSize: '0.82rem', color: '#f59e0b' }}>{'★'.repeat(t.Rating)}{'☆'.repeat(5 - t.Rating)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TestimonialRandomBlockCanvas({ block, site, businessId, onFieldSave }) {
  const d = block.block_data || {};
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const fontFamily = site?.font_family   || 'inherit';
  const bgWidth    = site?.body_bg_width || '100%';
  const bgColor    = d.bg_color || site?.bg_color || '#fff';
  const cWidth     = site?.body_content_width || '100%';
  const bodyBaseStyle = {
    fontFamily: site?.body_font  || site?.font_family || 'inherit',
    fontSize:   site?.body_size  || '1rem',
    color:      site?.body_color || site?.text_color  || '#4B5563',
    lineHeight: site?.body_line_height || 1.75,
    fontStyle:  site?.body_italic ? 'italic' : 'normal',
  };

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    fetch(`${API}/api/testimonials?BusinessID=${businessId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        if (arr.length > 0) setItem(arr[Math.floor(Math.random() * arr.length)]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessId]);

  const tFont = d.testimonial_font || bodyBaseStyle.fontFamily;
  const tSize = d.testimonial_size || bodyBaseStyle.fontSize;
  const tStyle = { ...bodyBaseStyle, fontFamily: tFont, fontSize: tSize };

  // Map fields for InlineContentEditor (same pattern as livestock/testimonials)
  const inlineData = { heading: d.heading || '', heading_style: d.heading_style, body: d.intro_body, bg_color: d.bg_color };
  const inlineFieldSave = onFieldSave
    ? (field, val) => onFieldSave(field === 'body' ? 'intro_body' : field, val)
    : null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: bgWidth, background: bgColor, fontFamily }}>
        {/* Inline-editable heading + intro */}
        {onFieldSave ? (
          <div
            draggable={false}
            onDragStart={e => { e.preventDefault(); e.stopPropagation(); }}
            onMouseDown={e => e.stopPropagation()}
          >
            <InlineContentEditor
              key={block.block_id}
              block={block}
              site={site}
              onFieldSave={inlineFieldSave}
              data={inlineData}
            />
          </div>
        ) : (d.heading || d.intro_body) ? (
          <div style={{ padding: '1.75rem 2.5rem' }}>
            <div className="rte-body">
              {d.heading && <HeadTag style={headingTypoStyle(d.heading_style || 'h1', site)} dangerouslySetInnerHTML={{ __html: d.heading }} />}
              {d.intro_body && (
                <div style={{ ...bodyBaseStyle, marginTop: 6 }} dangerouslySetInnerHTML={{ __html: d.intro_body }} />
              )}
            </div>
          </div>
        ) : null}

        <div style={{ padding: (d.heading || d.intro_body || onFieldSave) ? '0 2.5rem 1.75rem' : '1.75rem 2.5rem', maxWidth: cWidth, margin: '0 auto', textAlign: d.align || 'left' }}>
          {loading ? <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading...</p>
           : !item ? <p style={{ color: '#9ca3af', fontSize: 13 }}>No testimonials yet.</p>
           : (
            <div>
              <div style={{ ...tStyle, margin: 0 }} dangerouslySetInnerHTML={{ __html: wrapTestimonialHtml(item.Content, tStyle.fontFamily, tStyle.fontSize) }} />
              <div style={{ textAlign: d.align || 'left', marginTop: '0.75rem' }}>
                <p style={{ ...tStyle, margin: 0, fontWeight: 600 }}>
                  — {(item.AuthorName || 'Anonymous').split(' ')[0]}{(item.City || item.State) ? ', ' + [item.City, item.State].filter(Boolean).join(' ') : ''}
                </p>
                {item.Rating > 0 && <div style={{ fontSize: '1rem', color: '#f59e0b', marginTop: '0.25rem' }}>{'★'.repeat(item.Rating)}{'☆'.repeat(5 - item.Rating)}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BlogBlockCanvas({ block, site, businessId }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const d = block.block_data || {};
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const primary    = site?.primary_color  || '#3D6B34';
  const textColor  = site?.text_color     || '#111827';
  const fontFamily = site?.font_family    || 'inherit';
  const bgWidth    = site?.body_bg_width  || '100%';
  const bgColor    = d.bg_color || site?.bg_color || '#fff';

  const fetchPosts = useCallback(() => {
    if (!businessId) return;
    setLoading(true);
    const params = new URLSearchParams({ business_id: businessId, limit: d.max_posts || 100, show_on_website: 'true' });
    if (d.category) params.set('category_name', d.category);
    fetch(`${API}/api/blog/posts?${params}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [businessId, d.category, d.max_posts]);

  useEffect(() => { fetchPosts(); setSelectedIdx(null); }, [fetchPosts]);

  const heading = d.heading || (d.category || 'From the Blog');
  const HeadTag = d.heading_style || 'h1';
  const headStyle = headingTypoStyle(HeadTag, site);

  const bodySize  = site?.body_size  || '1rem';
  const navLink = (disabled, handler, label) => ({
    onMouseDown: e => { e.stopPropagation(); if (!disabled) handler(); },
    style: {
      background: 'none', border: 'none', padding: 0,
      cursor: disabled ? 'default' : 'pointer',
      fontFamily, fontSize: bodySize,
      color: disabled ? 'transparent' : primary,
      opacity: disabled ? 0 : 1, pointerEvents: disabled ? 'none' : 'auto',
    },
  });

  // ── Detail view ──────────────────────────────────────────────────
  if (selectedIdx !== null && posts[selectedIdx]) {
    const p = posts[selectedIdx];
    const dateStr = (p.published_at || p.created_at)
      ? new Date(p.published_at || p.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : '';
    const cover = p.cover_image || (p.content ? (p.content.match(/<img[^>]+src="([^"]+)"/)?.[1]) : null);
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: bgWidth, background: bgColor, fontFamily, padding: '1.75rem 2.5rem' }}>
          {/* Back link — upper left */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.75rem' }}>
            <button onMouseDown={e => { e.stopPropagation(); setSelectedIdx(null); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily, fontSize: bodySize, color: primary }}>{wb('blog_canvas_back', { heading })}</button>
          </div>

          {/* Article */}
          {cover && <img src={cover} alt="" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 10, display: 'block', marginBottom: '1rem' }} onError={e => e.target.style.display = 'none'} />}
          <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.4rem' }}>{dateStr}</div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: textColor, lineHeight: 1.3, marginBottom: '1rem' }}>{p.title}</div>
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
            {renderBlogPostContent(p.content)}
          </div>
          {/* Bottom nav — plain text arrows */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
            <button {...navLink(selectedIdx === 0, () => setSelectedIdx(selectedIdx - 1), wb('blog_canvas_prev'))}>{wb('blog_canvas_prev')}</button>
            <button {...navLink(selectedIdx === posts.length - 1, () => setSelectedIdx(selectedIdx + 1), wb('blog_canvas_next'))}>{wb('blog_canvas_next')}</button>
          </div>
        </div>
      </div>
    );
  }

  // ── List / table view ────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: bgWidth, background: bgColor, fontFamily, padding: '1.75rem 2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
          <div className="rte-body" style={{ flex: 1, minWidth: 0 }}>
            <HeadTag style={headStyle}>{heading}</HeadTag>
          </div>
          <button
            onClick={e => { e.stopPropagation(); fetchPosts(); }}
            style={{ padding: '4px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}
            title="Refresh posts"
          >
            {loading ? '…' : '↺'} {wb('blog_canvas_refresh')}
          </button>
        </div>
        {loading && posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem', fontSize: 13 }}>{wb('blog_canvas_loading')}</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem', fontSize: 13, border: '1px dashed #e2e8f0', borderRadius: 8 }}>
            {d.category ? wb('blog_canvas_none_cat', { category: d.category }) : wb('blog_canvas_none')}<br />
            <span style={{ fontSize: 11, marginTop: 4, display: 'block' }}>{wb('blog_canvas_publish_hint')}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {posts.map((p, i) => {
              const dateStr = (p.published_at || p.created_at)
                ? new Date(p.published_at || p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '';
              const cover = (() => {
                if (p.cover_image) return p.cover_image;
                if (!p.content) return null;
                try {
                  const blocks = JSON.parse(p.content);
                  if (Array.isArray(blocks)) {
                    const img = blocks.find(b => b.type === 'image' && b.url);
                    if (img) return img.url;
                    for (const b of blocks) {
                      if (b.type === 'text' && b.content) {
                        const m = b.content.match(/<img[^>]+src="([^"]+)"/i);
                        if (m) return m[1];
                      }
                    }
                  }
                } catch {}
                return p.content.match(/<img[^>]+src="([^"]+)"/i)?.[1] || null;
              })();
              const excerpt = (() => {
                if (!p.content) return '';
                let raw = p.content;
                try {
                  const blocks = JSON.parse(p.content);
                  if (Array.isArray(blocks)) {
                    raw = blocks.filter(b => b.type === 'text').map(b => b.content || '').join(' ');
                  }
                } catch {}
                // Captions can live inline as <figure><img><figcaption>…</figcaption></figure>
                // inside text blocks — strip whole figures so caption text never leaks.
                const stripped = raw
                  .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, ' ')
                  .replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/gi, ' ');
                const plain = stripped.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                if (!plain) return '';
                const words = plain.split(' ');
                return words.length <= 200 ? plain : words.slice(0, 200).join(' ') + '…';
              })();
              return (
                <div key={p.post_id || i}
                  onClick={e => { e.stopPropagation(); setSelectedIdx(i); }}
                  style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.11)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                >
                  {cover && (
                    <img src={cover} alt="" style={{ width: 250, minWidth: 250, objectFit: 'cover', flexShrink: 0, display: 'block' }} onError={e => e.target.style.display = 'none'} />
                  )}
                  <div style={{ padding: '0.9rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{dateStr}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: textColor, fontFamily, lineHeight: 1.35 }}>{p.title}</div>
                    {excerpt && <p style={{ margin: 0, fontSize: '0.82rem', color: '#4b5563', lineHeight: 1.6 }}>{excerpt}</p>}
                    <div style={{ marginTop: 'auto', paddingTop: '0.4rem', fontSize: '0.8rem', color: primary, fontWeight: 600 }}>{wb('blog_canvas_read_more')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PackagesBlockCanvas: package deals with animal thumbnails ──
function PackagesBlockCanvas({ block, site, businessId, onFieldSave }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const d = block.block_data || {};
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const primary   = site?.primary_color || '#3D6B34';
  const textColor = site?.text_color    || '#111827';
  const fontFamily = site?.font_family  || 'inherit';

  // Map fields for InlineContentEditor (same pattern as livestock)
  const inlineData = { heading: d.heading, heading_style: d.heading_style, body: d.intro_body, bg_color: d.bg_color };
  const inlineFieldSave = onFieldSave
    ? (field, val) => onFieldSave(field === 'body' ? 'intro_body' : field, val)
    : null;
  const HeadTag = d.heading_style || 'h1';
  const bodyBaseStyle = {
    fontFamily: site?.body_font  || site?.font_family || 'inherit',
    fontSize:   site?.body_size  || '1rem',
    color:      site?.body_color || site?.text_color  || '#4B5563',
    lineHeight: site?.body_line_height || 1.75,
  };

  const load = () => {
    setLoading(true);
    fetch(`${API}/api/website/content/packages?business_id=${businessId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setPackages(Array.isArray(data) ? data : []))
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [businessId]);

  const fmtPrice = (n) => {
    if (!n || Number(n) === 0) return '';
    return Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  };

  return (
    <div style={{ fontFamily }}>
      {/* Heading + intro text — same inline editor as other widgets */}
      {onFieldSave ? (
        <div
          draggable={false}
          onDragStart={e => { e.preventDefault(); e.stopPropagation(); }}
          onMouseDown={e => e.stopPropagation()}
        >
          <InlineContentEditor
            key={block.block_id}
            block={block}
            site={site}
            onFieldSave={inlineFieldSave}
            data={inlineData}
          />
        </div>
      ) : (
        <div style={{ padding: '1.75rem 2.5rem' }}>
          <div className="rte-body">
            {d.heading && <HeadTag style={headingTypoStyle(d.heading_style || 'h1', site)} dangerouslySetInnerHTML={{ __html: d.heading }} />}
            {d.intro_body && <div style={{ ...bodyBaseStyle, marginTop: 6 }} dangerouslySetInnerHTML={{ __html: d.intro_body }} />}
          </div>
        </div>
      )}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button onClick={load} style={{ fontSize: 11, padding: '3px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#6b7280' }}>
          {loading ? '...' : `↺ ${wb('pkg_refresh')}`}
        </button>
      </div>
      {packages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: 13 }}>
          {loading ? wb('pkg_loading') : wb('pkg_none')}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {packages.map(pkg => {
            const pkgPrice = Number(pkg.PackagePrice || 0);
            const totalVal = Number(pkg.total_value || 0);
            const savings = totalVal > 0 && pkgPrice > 0 && pkgPrice < totalVal ? totalVal - pkgPrice : 0;
            const pct = savings > 0 ? Math.round((savings / totalVal) * 100) : 0;
            return (
              <div key={pkg.PackageID} style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                {/* Animal thumbnails row */}
                {pkg.items?.length > 0 && (
                  <div style={{ display: 'flex', gap: 2, padding: '8px 8px 0', background: '#f9fafb' }}>
                    {pkg.items.map((it, i) => (
                      <div key={it.PackageItemID || i} style={{ flex: 1, position: 'relative', minWidth: 0, textAlign: 'center' }}>
                        {it.Photo1 ? (
                          <img src={it.Photo1} alt={it.FullName} style={{ width: '100%', height: 130, objectFit: 'contain', display: 'block', borderRadius: 6 }} />
                        ) : (
                          <div style={{ width: '100%', height: 130, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 28, borderRadius: 6 }}>🐄</div>
                        )}
                        <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>{it.FullName}</div>
                        {it.IncludeType === 'stud' && (
                          <span style={{ position: 'absolute', top: 2, right: 2, background: '#7C5CBF', color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>STUD</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ padding: '0.75rem 1rem' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: textColor }}>{pkg.Title}</h3>
                  {pkg.Description && <p style={{ margin: '4px 0 8px', fontSize: 13, color: '#6b7280', lineHeight: 1.4 }}>{pkg.Description}</p>}
                  {/* Per-animal detail links */}
                  <div style={{ fontSize: 11, marginBottom: 8, lineHeight: 1.8 }}>
                    {pkg.items?.map((it, i) => (
                      <div key={it.PackageItemID || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {it.FullName}{it.Breed ? ` (${it.Breed})` : ''}{it.IncludeType === 'stud' ? ' — Stud' : ''}
                        </span>
                        <span style={{ color: primary, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{wb('pkg_learn_more')}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: primary }}>{fmtPrice(pkgPrice)}</span>
                    {savings > 0 && (
                      <>
                        <span style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'line-through' }}>{fmtPrice(totalVal)}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: 4 }}>{wb('pkg_save', { pct })}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

// ── LivestockBlockCanvas: live "for sale" or "stud" animals, grouped by category ──
// mode='sale' (default) shows PublishForSale animals; mode='stud' shows PublishStud animals.
function LivestockBlockCanvas({ block, site, businessId, onFieldSave, mode = 'sale' }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const isStud = mode === 'stud';
  const d = block.block_data || {};
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [viewMode, setViewMode] = useState(d.default_view || 'grid'); // grid | list | table
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [detailAnimal, setDetailAnimal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Keep viewMode in sync when default_view is edited in the right panel
  useEffect(() => { setViewMode(d.default_view || 'grid'); }, [d.default_view]);


  const primary    = site?.primary_color  || '#3D6B34';
  const textColor  = site?.text_color     || '#111827';
  const fontFamily = site?.font_family    || 'inherit';
  const bgWidth    = site?.body_bg_width  || '100%';
  const bgColor    = d.bg_color || site?.bg_color || '#fff';
  const bodySize   = site?.body_size  || '1rem';
  // Match the public `BodyText` style so inline editor shows the site body typography
  const bodyBaseStyle = {
    fontFamily: site?.body_font  || site?.font_family || 'inherit',
    fontSize:   site?.body_size  || '1rem',
    color:      site?.body_color || site?.text_color  || '#4B5563',
    lineHeight: site?.body_line_height || 1.75,
    fontStyle:  site?.body_italic ? 'italic' : 'normal',
  };

  // Strip HTML tags from descriptions (backend stores rich text in Animals.Description)
  const stripHtml = (s) => {
    if (!s) return '';
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = s;
      return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
    } catch {
      return String(s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
  };

  const fmtPrice = (n) => {
    if (n === null || n === undefined || n === '' || Number(n) === 0) return '';
    const num = Number(n);
    if (Number.isNaN(num)) return '';
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  };

  // Whether to show StudFee for this animal
  const showStud = (a) => a.PublishStud && Number(a.StudFee || 0) > 0;

  const fetchAnimals = useCallback(() => {
    if (!businessId) return;
    setLoading(true);
    fetch(`${API}/api/website/content/livestock?business_id=${businessId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setAnimals(Array.isArray(data) ? data : []))
      .catch(() => setAnimals([]))
      .finally(() => setLoading(false));
  }, [businessId]);

  useEffect(() => { fetchAnimals(); setSelectedIdx(null); }, [fetchAnimals]);

  const defaultHeading = isStud ? 'Stud Services' : 'Animals For Sale';
  const heading = d.heading || defaultHeading;

  // Map livestock field names to InlineContentEditor's expected shape
  const inlineData = { heading: d.heading, heading_style: d.heading_style, body: d.intro_body, bg_color: d.bg_color };
  const inlineFieldSave = onFieldSave
    ? (field, val) => onFieldSave(field === 'body' ? 'intro_body' : field, val)
    : null;

  // Filter animals by mode
  const forSale = useMemo(
    () => animals.filter(a => isStud ? (a.PublishStud || Number(a.StudFee || 0) > 0) : a.PublishForSale),
    [animals, isStud]
  );

  // Apply search filter
  const visible = useMemo(() => {
    let list = forSale;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(a =>
        (a.FullName || '').toLowerCase().includes(q) ||
        (a.Breed || '').toLowerCase().includes(q) ||
        (a.CategoryName || '').toLowerCase().includes(q) ||
        (a.Description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [forSale, search]);

  // Group by category, sorted by CategoryOrder → name
  const groups = useMemo(() => {
    const map = new Map();
    for (const a of visible) {
      const key = a.CategoryName || 'Other';
      if (!map.has(key)) {
        map.set(key, {
          name: a.CategoryName || 'Other',
          plural: a.CategoryPlural || (a.CategoryName ? `${a.CategoryName}s` : 'Other'),
          order: a.CategoryOrder ?? 9999,
          items: [],
        });
      }
      map.get(key).items.push(a);
    }
    const arr = [...map.values()];
    arr.sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));
    // Sort items within each group by selected key
    const priceOf = (a) => {
      const s = Number(a.SalePrice || 0);
      const p = Number(a.Price || 0);
      return s > 0 ? s : p;
    };
    for (const g of arr) {
      g.items.sort((x, y) => {
        if (sortKey === 'name')       return (x.FullName || '').localeCompare(y.FullName || '');
        if (sortKey === 'breed')      return (x.Breed || '').localeCompare(y.Breed || '');
        if (sortKey === 'price_asc')  return priceOf(x) - priceOf(y);
        if (sortKey === 'price_desc') return priceOf(y) - priceOf(x);
        return 0;
      });
    }
    return arr;
  }, [visible, sortKey]);

  // Flat list of visible animals for prev/next in detail view
  const flat = useMemo(() => groups.flatMap(g => g.items), [groups]);

  // Distinct breeds across the visible set — used to hide "Sort: Breed" when only one breed exists
  const breedCount = useMemo(() => {
    const s = new Set();
    for (const a of forSale) {
      if (a.Breed) s.add(a.Breed);
    }
    return s.size;
  }, [forSale]);

  // If user previously picked "breed" but there's now only one breed, fall back to "name"
  useEffect(() => {
    if (sortKey === 'breed' && breedCount < 2) setSortKey('name');
  }, [breedCount, sortKey]);

  // ── Detail view ──────────────────────────────────────────────────
  // When an animal is selected, fetch the full marketplace detail payload so
  // we can render the same rich layout as the public page.
  const selectedStub = selectedIdx !== null ? flat[selectedIdx] : null;
  useEffect(() => {
    if (!selectedStub) { setDetailAnimal(null); return; }
    setDetailLoading(true);
    fetch(`${API}/api/marketplace/animal/${selectedStub.AnimalID}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setDetailAnimal(data))
      .catch(() => setDetailAnimal(null))
      .finally(() => setDetailLoading(false));
  }, [selectedStub?.AnimalID]);

  if (selectedIdx !== null && selectedStub) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
        <div style={{ width: '100%', maxWidth: bgWidth, background: bgColor, fontFamily }}>
          {detailLoading && !detailAnimal ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>{wb('ls_loading')}</div>
          ) : detailAnimal ? (
            <LivestockAnimalDetailContent
              animal={detailAnimal}
              siteMode
              onBack={() => setSelectedIdx(null)}
              backLabel={heading}
              onPrev={() => setSelectedIdx(selectedIdx - 1)}
              onNext={() => setSelectedIdx(selectedIdx + 1)}
              hasPrev={selectedIdx > 0}
              hasNext={selectedIdx < flat.length - 1}
              primaryColor={primary}
              fontFamily={fontFamily}
            />
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#ef4444', fontSize: 13 }}>
              {wb('ls_error')}
              <div style={{ marginTop: 12 }}>
                <button onClick={() => setSelectedIdx(null)} style={{ background: 'none', border: 'none', color: primary, cursor: 'pointer', fontSize: 13 }}>{wb('ls_back', { heading })}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Toolbar controls (stopPropagation so they don't select block) ──
  const stop = e => e.stopPropagation();
  const ctrlBtn = active => ({
    padding: '5px 10px',
    background: active ? primary : '#fff',
    color: active ? '#fff' : '#64748b',
    border: `1px solid ${active ? primary : '#e2e8f0'}`,
    borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
  });

  // Compute the flat index for a given animal so detail view shows the right one
  const indexOf = (animal) => flat.findIndex(x => x.AnimalID === animal.AnimalID);

  // Card renderer (grid view) — full-height uncropped image
  const renderGridCard = (a) => (
    <div key={a.AnimalID}
      onClick={e => { e.stopPropagation(); setSelectedIdx(indexOf(a)); }}
      style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'box-shadow 0.15s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.11)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
    >
      {a.Photo1
        ? <img src={a.Photo1} alt={a.FullName || ''} style={{ width: '100%', height: 'auto', display: 'block' }} onError={e => e.target.style.display = 'none'} />
        : <div style={{ aspectRatio: '4 / 3', background: `${primary}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>🐄</div>}
      <div style={{ padding: '0.75rem 0.9rem', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: textColor, lineHeight: 1.3 }}>{a.FullName}</div>
        {(a.Breed || a.CategoryName) && <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{a.Breed}{a.Breed && a.CategoryName ? ' · ' : ''}{a.CategoryName}</div>}
        {isStud ? (
          fmtPrice(a.StudFee) && (
            <div style={{ fontSize: '0.8rem', marginTop: 2 }}>
              <span style={{ color: primary, fontWeight: 700 }}>Stud Fee: {fmtPrice(a.StudFee)}</span>
            </div>
          )
        ) : (fmtPrice(a.Price) || showStud(a)) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: '0.8rem', marginTop: 2 }}>
            {fmtPrice(a.Price) && (
              <span style={{ color: primary, fontWeight: 700 }}>
                {fmtPrice(a.Price)}
                {fmtPrice(a.SalePrice) && <span style={{ color: '#ef4444', marginLeft: 4 }}>({fmtPrice(a.SalePrice)})</span>}
              </span>
            )}
            {showStud(a) && <span style={{ color: '#6B7280' }}>Stud {fmtPrice(a.StudFee)}</span>}
          </div>
        )}
        {a.PriceComments && <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontStyle: 'italic' }}>{stripHtml(a.PriceComments)}</div>}
      </div>
    </div>
  );

  const renderListCard = (a) => (
    <div key={a.AnimalID}
      onClick={e => { e.stopPropagation(); setSelectedIdx(indexOf(a)); }}
      style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', cursor: 'pointer', transition: 'box-shadow 0.15s', alignItems: 'stretch' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.11)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
    >
      {a.Photo1
        ? <img src={a.Photo1} alt={a.FullName || ''} style={{ width: 200, minWidth: 200, height: 'auto', objectFit: 'contain', alignSelf: 'flex-start', flexShrink: 0, display: 'block', background: '#f8fafc' }} onError={e => e.target.style.display = 'none'} />
        : <div style={{ width: 200, minWidth: 200, background: `${primary}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>🐄</div>}
      <div style={{ padding: '0.85rem 1.1rem', display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: textColor, lineHeight: 1.3 }}>{a.FullName}</div>
        {(a.Breed || a.CategoryName) && <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{a.Breed}{a.Breed && a.CategoryName ? ' · ' : ''}{a.CategoryName}</div>}
        {isStud ? (
          fmtPrice(a.StudFee) && (
            <div style={{ fontSize: '0.88rem', marginTop: 2 }}>
              <span style={{ color: primary, fontWeight: 700 }}>Stud Fee: {fmtPrice(a.StudFee)}</span>
            </div>
          )
        ) : (fmtPrice(a.Price) || showStud(a)) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: '0.88rem', marginTop: 2 }}>
            {fmtPrice(a.Price) && (
              <span style={{ color: primary, fontWeight: 700 }}>
                {fmtPrice(a.Price)}
                {fmtPrice(a.SalePrice) && <span style={{ color: '#ef4444', marginLeft: 4 }}>({fmtPrice(a.SalePrice)})</span>}
              </span>
            )}
            {showStud(a) && <span style={{ color: '#6B7280' }}>Stud: <strong style={{ color: textColor }}>{fmtPrice(a.StudFee)}</strong></span>}
          </div>
        )}
        {a.PriceComments && <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>{stripHtml(a.PriceComments)}</div>}
        {a.Description && <p style={{ margin: 0, fontSize: '0.82rem', color: '#4b5563', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{stripHtml(a.Description)}</p>}
      </div>
    </div>
  );

  const groupHeading = (g) => g.plural || g.name;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: bgWidth, background: bgColor, fontFamily }}>
        {/* Heading + intro text — same inline editor as the 1-column content block */}
        {onFieldSave ? (
          <div
            draggable={false}
            onDragStart={e => { e.preventDefault(); e.stopPropagation(); }}
            onMouseDown={e => e.stopPropagation()}
          >
            <InlineContentEditor
              key={block.block_id}
              block={block}
              site={site}
              onFieldSave={inlineFieldSave}
              data={inlineData}
            />
          </div>
        ) : (
          <div style={{ padding: '1.75rem 2.5rem' }}>
            <div className="rte-body">
              <HeadTag style={headingTypoStyle(d.heading_style || 'h1', site)} dangerouslySetInnerHTML={{ __html: d.heading || defaultHeading }} />
              {d.intro_body && (
                <div style={{ ...bodyBaseStyle, marginTop: 6 }} dangerouslySetInnerHTML={{ __html: d.intro_body }} />
              )}
            </div>
          </div>
        )}

        <div style={{ padding: '0 2.5rem 1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <button
            onClick={e => { e.stopPropagation(); fetchAnimals(); }}
            style={{ padding: '4px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}
            title="Refresh animals"
          >
            {loading ? '…' : '↺'} {wb('ls_refresh')}
          </button>
        </div>

        {/* Toolbar: search + sort + view mode */}
        <div
          onMouseDown={stop} onClick={stop}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem', padding: '0.6rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}
        >
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={wb('ls_no_match')}
            style={{ flex: '1 1 200px', minWidth: 160, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, background: '#fff' }}
          />
          <select value={sortKey} onChange={e => setSortKey(e.target.value)}
            style={{ padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, background: '#fff', color: '#374151' }}>
            <option value="name">{wb('ls_sort_name')}</option>
            {breedCount > 1 && <option value="breed">{wb('ls_sort_breed')}</option>}
            <option value="price_asc">{wb('ls_sort_price_low')}</option>
            <option value="price_desc">{wb('ls_sort_price_high')}</option>
          </select>
          <div style={{ display: 'flex', gap: 0, border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', marginLeft: 'auto' }}>
            <button onClick={() => setViewMode('grid')}  title="Grid view"  style={{ ...ctrlBtn(viewMode === 'grid'),  borderRadius: 0, border: 'none', borderRight: '1px solid #e2e8f0' }}>{wb('ls_view_grid')}</button>
            <button onClick={() => setViewMode('list')}  title="List view"  style={{ ...ctrlBtn(viewMode === 'list'),  borderRadius: 0, border: 'none', borderRight: '1px solid #e2e8f0' }}>{wb('ls_view_list')}</button>
            <button onClick={() => setViewMode('table')} title="Table view" style={{ ...ctrlBtn(viewMode === 'table'), borderRadius: 0, border: 'none' }}>{wb('ls_view_table')}</button>
          </div>
        </div>

        {loading && animals.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem', fontSize: 13 }}>{wb('ls_loading')}</div>
        ) : forSale.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem', fontSize: 13, border: '1px dashed #e2e8f0', borderRadius: 8, background: '#fff' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>{isStud ? '🐂' : '🐄'}</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{isStud ? wb('ls_no_stud') : wb('ls_no_animals')}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>{wb('ls_open_hint')}</div>
            <a href={`/animals?BusinessID=${businessId}`} target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ display: 'inline-block', padding: '6px 14px', background: primary, color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              {wb('ls_manage')}
            </a>
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem', fontSize: 13, border: '1px dashed #e2e8f0', borderRadius: 8, background: '#fff' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{wb('ls_no_match')}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{wb('ls_clear_hint')}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {groups.map(g => (
              <section key={g.name}>
                <h2 style={{ ...headingTypoStyle('h2', site), marginBottom: '0.75rem' }}>{groupHeading(g)}</h2>
                {viewMode === 'grid' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', alignItems: 'start' }}>
                    {g.items.map(renderGridCard)}
                  </div>
                ) : viewMode === 'list' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {g.items.map(renderListCard)}
                  </div>
                ) : (
                  <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                          <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #e5e7eb' }}>{wb('ls_th_photo')}</th>
                          <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #e5e7eb' }}>{wb('ls_th_name')}</th>
                          <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #e5e7eb' }}>{wb('ls_th_breed')}</th>
                          {isStud
                            ? <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{wb('ls_th_stud_fee')}</th>
                            : <>
                                <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{wb('ls_th_price')}</th>
                                <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{wb('ls_th_stud_fee')}</th>
                              </>
                          }
                          <th style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '1px solid #e5e7eb' }}>{wb('ls_th_description')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.items.map(a => (
                          <tr key={a.AnimalID}
                            onClick={e => { e.stopPropagation(); setSelectedIdx(indexOf(a)); }}
                            style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                          >
                            <td style={{ padding: '0.5rem 0.8rem' }}>
                              {a.Photo1
                                ? <img src={a.Photo1} alt="" style={{ width: 64, height: 'auto', borderRadius: 6, display: 'block' }} onError={e => e.target.style.display = 'none'} />
                                : <div style={{ width: 64, height: 48, borderRadius: 6, background: `${primary}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🐄</div>}
                            </td>
                            <td style={{ padding: '0.5rem 0.8rem', fontWeight: 600, color: textColor }}>{a.FullName}</td>
                            <td style={{ padding: '0.5rem 0.8rem', color: '#6B7280' }}>{a.Breed || '—'}</td>
                            {isStud ? (
                              <td style={{ padding: '0.5rem 0.8rem', textAlign: 'right', color: primary, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {fmtPrice(a.StudFee) || '—'}
                              </td>
                            ) : (
                              <>
                                <td style={{ padding: '0.5rem 0.8rem', textAlign: 'right', color: primary, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                  {fmtPrice(a.Price) || '—'}
                                  {fmtPrice(a.SalePrice) && <span style={{ color: '#ef4444', fontWeight: 600, marginLeft: 4 }}>({fmtPrice(a.SalePrice)})</span>}
                                </td>
                                <td style={{ padding: '0.5rem 0.8rem', textAlign: 'right', color: '#6B7280', whiteSpace: 'nowrap' }}>
                                  {showStud(a) ? fmtPrice(a.StudFee) : '—'}
                                </td>
                              </>
                            )}
                            <td style={{ padding: '0.5rem 0.8rem', color: '#6B7280', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {stripHtml(a.Description) || (a.PriceComments ? stripHtml(a.PriceComments) : '—')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

// ── EventsBlockEditor: right-panel editor for the Upcoming Events block ──
function EventsBlockEditor({ block, businessId, onFieldSave, BgField }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const d = block.block_data || {};
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState({});

  const loadEvents = () => {
    if (!businessId) return;
    setLoading(true);
    fetch(`${API}/api/my-events?business_id=${businessId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setMyEvents(Array.isArray(data) ? data : []))
      .catch(() => setMyEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadEvents(); }, [businessId]);

  const togglePublish = async (ev) => {
    const nextState = ev.IsPublished ? 0 : 1;
    setWorking(w => ({ ...w, [ev.EventID]: true }));
    try {
      const r = await fetch(`${API}/api/events/${ev.EventID}/publish`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ publish: !!nextState }),
      });
      const json = await r.json().catch(() => ({}));
      if (json.ok) {
        setMyEvents(evs => evs.map(e => e.EventID === ev.EventID ? { ...e, IsPublished: nextState } : e));
      } else {
        alert(json.error || 'Failed to update event.');
      }
    } catch (e) {
      alert('Network error.');
    } finally {
      setWorking(w => ({ ...w, [ev.EventID]: false }));
    }
  };

  const fmtDate = (iso) => {
    if (!iso) return 'TBD';
    try { return new Date(iso).toLocaleDateString(); } catch { return String(iso).split('T')[0]; }
  };

  const drafts = myEvents.filter(e => !e.IsPublished);
  const published = myEvents.filter(e => e.IsPublished);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>
        {wb('ev_panel_heading')}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{wb('ev_section_heading')}</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <select className={inp} style={{ width: 68, flexShrink: 0 }}
            value={d.heading_style || 'h1'}
            onChange={e => onFieldSave('heading_style', e.target.value)}>
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
          </select>
          <input className={inp}
            key={`${block.block_id}-eventsheading`}
            defaultValue={d.heading || ''}
            placeholder="Upcoming Events"
            onBlur={e => onFieldSave('heading', e.target.value)}
          />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{wb('ev_layout')}</div>
        <div>
          {[['cards','Cards'],['list','List']].map(([v,l]) => (
            <button key={v} onClick={() => onFieldSave('layout', v)}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                marginRight: 4, marginBottom: 4,
                border: '1px solid ' + ((d.layout || 'cards') === v ? '#3b82f6' : '#d1d5db'),
                background: (d.layout || 'cards') === v ? '#3b82f6' : '#f9fafb',
                color: (d.layout || 'cards') === v ? '#fff' : '#374151',
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{wb('ev_max')}</label>
        <input key={`${block.block_id}-maxevents`} type="number" className={inp}
          defaultValue={d.max_items || 6} min={1} max={50}
          onBlur={e => onFieldSave('max_items', Number(e.target.value) || 6)} />
      </div>

      {BgField && <BgField />}

      {/* Your events — publish drafts inline */}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{wb('ev_your_events')}</div>
          <button onClick={loadEvents} disabled={loading}
            style={{ fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            {loading ? wb('ev_loading') : wb('ev_refresh')}
          </button>
        </div>

        {drafts.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#b45309', marginBottom: 4 }}>
              {wb('ev_drafts', { n: drafts.length })}
            </div>
            {drafts.map(ev => (
              <div key={ev.EventID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 8px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, marginBottom: 4 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.EventName || 'Untitled'}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{fmtDate(ev.EventStartDate)}</div>
                </div>
                <button onClick={() => togglePublish(ev)} disabled={!!working[ev.EventID]}
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, background: '#059669', color: '#fff', border: 'none', cursor: working[ev.EventID] ? 'not-allowed' : 'pointer', opacity: working[ev.EventID] ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                  {working[ev.EventID] ? '…' : wb('ev_publish')}
                </button>
              </div>
            ))}
          </div>
        )}

        {published.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#047857', marginBottom: 4 }}>
              {wb('ev_published_n', { n: published.length })}
            </div>
            {published.slice(0, 5).map(ev => (
              <div key={ev.EventID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, marginBottom: 4 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.EventName || 'Untitled'}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{fmtDate(ev.EventStartDate)}</div>
                </div>
                <button onClick={() => togglePublish(ev)} disabled={!!working[ev.EventID]}
                  style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, background: '#fff', color: '#6b7280', border: '1px solid #d1d5db', cursor: working[ev.EventID] ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                  {working[ev.EventID] ? '…' : wb('ev_unpublish')}
                </button>
              </div>
            ))}
            {published.length > 5 && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>+ {published.length - 5} more</div>
            )}
          </div>
        )}

        {!loading && myEvents.length === 0 && (
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            {wb('ev_none')}
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12 }}>
        {wb('ev_hint')}
      </p>
    </div>
  );
}

// ── BlogBlockEditor: right-panel editor for blog blocks with category picker ──
function BlogBlockEditor({ block, site, businessId, onFieldSave }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const d = block.block_data || {};
  const [globalCats, setGlobalCats] = useState([]);
  const [customCats, setCustomCats] = useState([]);
  const [headingVal, setHeadingVal] = useState(d.heading || '');

  useEffect(() => {
    fetch(`${API}/api/blog/categories/global`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setGlobalCats(Array.isArray(data) ? data : []))
      .catch(() => {});
    if (businessId) {
      fetch(`${API}/api/blog/categories/custom?business_id=${businessId}`, { headers: authHeaders() })
        .then(r => r.json())
        .then(data => setCustomCats(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [businessId]);

  // Keep headingVal in sync if block data changes (e.g. from AI agent)
  useEffect(() => { setHeadingVal(d.heading || ''); }, [d.heading]);

  const handleCategoryChange = (catName) => {
    onFieldSave('category', catName);
    // Auto-update heading if it still matches the previous category or the generic default
    const prevCat  = d.category || '';
    const curHead  = (d.heading || '').trim();
    const defaults = ['', 'From the Blog', prevCat];
    if (defaults.includes(curHead)) {
      const newHead = catName || 'From the Blog';
      setHeadingVal(newHead);
      onFieldSave('heading', newHead);
    }
  };

  const paletteColors = [site?.primary_color, site?.secondary_color, site?.accent_color, site?.bg_color, site?.text_color].filter(Boolean);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>
        {wb('blog_panel_heading')}
      </div>

      {/* Category */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{wb('blog_category')}</label>
        <select className={inp} value={d.category || ''} onChange={e => handleCategoryChange(e.target.value)}>
          <option value="">{wb('blog_all_posts')}</option>
          {globalCats.length > 0 && (
            <optgroup label={wb('blog_network_cats')}>
              {globalCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </optgroup>
          )}
          {customCats.length > 0 && (
            <optgroup label={wb('blog_your_cats')}>
              {customCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </optgroup>
          )}
        </select>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, marginBottom: 0 }}>
          {wb('blog_filter_hint')}
        </p>
      </div>

      {/* Heading */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{wb('blog_section_heading')}</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          <select className={inp} style={{ width: 68, flexShrink: 0 }}
            value={d.heading_style || 'h1'}
            onChange={e => onFieldSave('heading_style', e.target.value)}>
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
          </select>
          <input className={inp}
            key={`${block.block_id}-heading`}
            value={headingVal}
            onChange={e => setHeadingVal(e.target.value)}
            onBlur={() => onFieldSave('heading', headingVal)}
            placeholder={wb('blog_from_blog_ph')}
          />
        </div>
      </div>

      {/* Max posts */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{wb('blog_max')}</label>
        <input key={`${block.block_id}-maxposts`} type="number" className={inp}
          defaultValue={d.max_posts || ''} min={1}
          placeholder={wb('blog_unlimited_ph')}
          onBlur={e => onFieldSave('max_posts', e.target.value ? Number(e.target.value) : 0)} />
      </div>

      {/* Background color */}
      <div style={{ marginBottom: 4 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{wb('blog_bg_color')}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {paletteColors.map(c => (
            <button key={c} onClick={() => onFieldSave('bg_color', c)}
              style={{ width: 24, height: 24, borderRadius: 4, background: c, border: d.bg_color === c ? '2px solid #3b82f6' : '1px solid #e5e7eb', cursor: 'pointer', flexShrink: 0 }} />
          ))}
          <input type="color" value={d.bg_color || site?.bg_color || '#ffffff'}
            onChange={e => onFieldSave('bg_color', e.target.value)}
            style={{ width: 28, height: 24, border: '1px solid #e5e7eb', borderRadius: 4, padding: 1, cursor: 'pointer' }} />
          {d.bg_color && (
            <button onClick={() => onFieldSave('bg_color', '')}
              style={{ fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              {wb('blog_reset')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── BlockEditorPanel: sidebar form editor for the selected block ───
function BlockEditorPanel({ block, onFieldSave, onFieldsSave, site, businessId, pages = [] }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  if (!block) return null;
  const d  = block.block_data || {};
  const bt = block.block_type;

  const paletteColors = [
    site?.primary_color, site?.secondary_color, site?.accent_color,
    site?.bg_color, site?.text_color,
  ].filter(Boolean);

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );

  // Uncontrolled text inputs — key ensures they remount when block changes
  const TxtInp = ({ field, placeholder = '' }) => (
    <input key={`${block.block_id}-${field}`} className={inp}
      defaultValue={d[field] || ''}
      placeholder={placeholder}
      onBlur={e => { if (e.target.value !== (d[field] || '')) onFieldSave(field, e.target.value); }}
    />
  );

  const TxtArea = ({ field, rows = 6, placeholder = '' }) => (
    <textarea key={`${block.block_id}-${field}`} className={ta} rows={rows}
      defaultValue={d[field] || ''}
      placeholder={placeholder}
      onBlur={e => { if (e.target.value !== (d[field] || '')) onFieldSave(field, e.target.value); }}
    />
  );

  // Rich body editor — same WYSIWYG (toolbar, formatting, link/image/video insert)
  // the `content` 1-column text widget uses, scoped to a single prose field.
  const RichBody = ({ field }) => (
    <div key={`${block.block_id}-${field}`} style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
      <InlineContentEditor
        block={block}
        site={site}
        data={d}
        onFieldSave={onFieldSave}
        pages={pages}
        bodyField={field}
        bodyOnly
      />
    </div>
  );

  const Pill = ({ label, active, onClick }) => (
    <button onClick={onClick}
      style={{
        padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
        marginRight: 4, marginBottom: 4,
        border: '1px solid ' + (active ? '#3b82f6' : '#d1d5db'),
        background: active ? '#3b82f6' : '#f9fafb',
        color: active ? '#fff' : '#374151',
      }}>
      {label}
    </button>
  );

  const BgField = () => (
    <Field label={wb('blog_bg_color')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {paletteColors.map(c => (
          <button key={c} onClick={() => onFieldSave('bg_color', c)}
            style={{ width: 24, height: 24, borderRadius: 4, background: c, border: d.bg_color === c ? '2px solid #3b82f6' : '1px solid #e5e7eb', cursor: 'pointer', flexShrink: 0 }} />
        ))}
        <input type="color" value={d.bg_color || site?.bg_color || '#ffffff'}
          onChange={e => onFieldSave('bg_color', e.target.value)}
          title="Custom color"
          style={{ width: 28, height: 24, border: '1px solid #e5e7eb', borderRadius: 4, padding: 1, cursor: 'pointer' }} />
        {d.bg_color && (
          <button onClick={() => onFieldSave('bg_color', '')}
            style={{ fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
            {wb('blog_reset')}
          </button>
        )}
      </div>
    </Field>
  );

  // ── Blog ──
  if (bt === 'blog') return (
    <BlogBlockEditor block={block} site={site} businessId={businessId} onFieldSave={onFieldSave} />
  );

  // ── Events ──
  if (bt === 'events') return (
    <EventsBlockEditor block={block} businessId={businessId} onFieldSave={onFieldSave} BgField={BgField} />
  );

  // ── Testimonials — heading + intro editing lives on the canvas (inline) ──
  if (bt === 'testimonials') return null;

  // ── Random Testimonial — heading + intro editing lives on the canvas (inline) ──
  if (bt === 'testimonial_random') return null;

  // ── Livestock / Studs — editing lives on the canvas (heading + intro inline, default view in block toolbar) ──
  if (bt === 'livestock' || bt === 'studs') return null;

  // ── Packages — heading + intro editing lives on the canvas (inline) ──
  if (bt === 'packages') return null;

  // ── Hero ──
  if (bt === 'hero') return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_hero')}</div>
      <Field label={wb('f_headline')}>
        <TxtInp field="headline" placeholder={wb('ph_welcome')} />
      </Field>
      <Field label={wb('f_subtext')}>
        <RichBody field="subtext" />
      </Field>
      <Field label={wb('f_button_text')}>
        <TxtInp field="cta_text" placeholder={wb('ph_learn_more')} />
      </Field>
      <Field label={wb('f_button_link')}>
        <TxtInp field="cta_link" placeholder={wb('ph_hash_or_url')} />
      </Field>
      <Field label={wb('f_bg_image')}>
        <ImageUploadField value={d.image_url || ''} onChange={url => onFieldSave('image_url', url)} />
      </Field>
      <Field label={wb('f_text_align')}>
        {[['left',wb('canvas_align_left')],['center',wb('canvas_align_center')],['right',wb('canvas_align_right')]].map(([v,l]) => (
          <Pill key={v} label={l} active={(d.align || 'center') === v} onClick={() => onFieldSave('align', v)} />
        ))}
      </Field>
      <Field label={wb('f_dark_overlay')}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
          <input type="checkbox" checked={!!d.overlay} onChange={e => onFieldSave('overlay', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#3b82f6' }} />
          {wb('overlay_show_dark')}
        </label>
      </Field>
      {d.overlay && (
        <Field label={wb('f_overlay_color')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              value={d.overlay_color || ''}
              onChange={e => onFieldSave('overlay_color', e.target.value)}
              placeholder={wb('ph_overlay_color')}
              style={{ flex: 1, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }}
            />
            {d.overlay_color && (
              <button
                onClick={() => onFieldSave('overlay_color', '')}
                style={{ padding: '4px 8px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#6b7280' }}
                title="Clear (use default dark overlay)"
              >
                ✕
              </button>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
            {wb('ph_overlay_hint')}
          </div>
        </Field>
      )}
      <Field label={d.min_height_px ? wb('f_banner_height_px', { px: d.min_height_px }) : wb('f_banner_height')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="range"
            min="220"
            max="900"
            step="10"
            value={d.min_height_px || 0}
            onChange={e => onFieldSave('min_height_px', parseInt(e.target.value, 10) || 0)}
            style={{ flex: 1 }}
          />
          {!!d.min_height_px && (
            <button
              onClick={() => onFieldSave('min_height_px', 0)}
              style={{ padding: '4px 8px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#6b7280' }}
              title={wb('banner_height_reset_title')}
            >
              {wb('banner_height_reset')}
            </button>
          )}
        </div>
      </Field>
      <BgField />
    </div>
  );

  // ── Slideshow ──
  if (bt === 'slideshow') {
    const raw    = Array.isArray(d.images) ? d.images : [];
    const slides = raw.map(s => (typeof s === 'string' ? { url: s, caption: '' } : { url: s.url || '', caption: s.caption || '' }));
    const setSlides = (next) => onFieldSave('images', next);
    const updateAt = (i, patch) => { const n = [...slides]; n[i] = { ...n[i], ...patch }; setSlides(n); };
    const removeAt = (i) => { const n = [...slides]; n.splice(i, 1); setSlides(n); };
    const addSlide = (url) => { if (!url) return; setSlides([...slides, { url, caption: '' }]); };
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_slideshow')}</div>
        <Field label={wb('f_interval')}>
          <TxtInp field="interval_ms" placeholder="5000" />
        </Field>
        <Field label={wb('f_show_dots')}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
            <input type="checkbox" checked={d.show_dots !== false}
                   onChange={e => onFieldSave('show_dots', e.target.checked)}
                   style={{ width: 16, height: 16, accentColor: '#3b82f6' }} />
            {wb('nav_dots_show')}
          </label>
        </Field>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', margin: '20px 0 10px' }}>
          {wb('f_slides_n', { n: slides.length })}
        </div>
        {slides.map((s, i) => (
          <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 8, background: '#fafafa' }}>
            {s.url && (
              <img src={s.url} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} />
            )}
            <input
              type="text"
              value={s.caption}
              onChange={e => updateAt(i, { caption: e.target.value })}
              placeholder={wb('f_caption')}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, marginBottom: 6 }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => removeAt(i)}
                      style={{ padding: '4px 10px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                {wb('f_remove')}
              </button>
              {i > 0 && (
                <button onClick={() => { const n = [...slides]; [n[i-1], n[i]] = [n[i], n[i-1]]; setSlides(n); }}
                        style={{ padding: '4px 10px', background: '#e5e7eb', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                  ↑
                </button>
              )}
              {i < slides.length - 1 && (
                <button onClick={() => { const n = [...slides]; [n[i+1], n[i]] = [n[i], n[i+1]]; setSlides(n); }}
                        style={{ padding: '4px 10px', background: '#e5e7eb', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                  ↓
                </button>
              )}
            </div>
          </div>
        ))}
        <Field label={wb('f_add_slide')}>
          <ImageUploadField value="" onChange={addSlide} />
        </Field>
        <BgField />
      </div>
    );
  }

  // ── About / Content ──
  if (bt === 'about' || bt === 'content') {
    // Normalise image url + position from either legacy or new format
    const imgs   = Array.isArray(d.images) && d.images.length > 0 ? d.images : [];
    const imgUrl = d.image_url || (imgs[0] ? (typeof imgs[0] === 'string' ? imgs[0] : imgs[0].url) : '');
    const imgPos = d.image_position || imgs[0]?.wrap || 'right';

    const setImg = (url) => {
      onFieldsSave({ image_url: url, images: url ? [{ url, wrap: imgPos }] : [] });
    };
    const setPos = (pos) => {
      const newImages = imgs.length > 0
        ? imgs.map(im => ({ ...(typeof im === 'string' ? { url: im } : im), wrap: pos }))
        : imgUrl ? [{ url: imgUrl, wrap: pos }] : [];
      onFieldsSave({ image_position: pos, images: newImages });
    };

    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>
          {bt === 'about' ? wb('block_about') : wb('block_content')}
        </div>
        <Field label={wb('f_image')}>
          <ImageUploadField value={imgUrl} onChange={setImg} />
        </Field>
        {imgUrl && (
          <Field label={wb('f_image_pos')}>
            {[['left',wb('canvas_align_left')],['center',wb('canvas_align_center')],['full','Full'],['right',wb('canvas_align_right')]].map(([v,l]) => (
              <Pill key={v} label={l} active={imgPos === v} onClick={() => setPos(v)} />
            ))}
          </Field>
        )}
        <BgField />
      </div>
    );
  }

  // ── Links ──
  if (bt === 'links') {
    const groups = normLinksGroups(d);
    const saveGroups = (g) => onFieldSave('groups', g);
    const updateItem = (gi, ii, key, val) => {
      saveGroups(groups.map((g, i) => i !== gi ? g : {
        ...g, items: g.items.map((it, j) => j === ii ? { ...it, [key]: val } : it),
      }));
    };

    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_links')}</div>
        <Field label={wb('f_columns')}>
          <select className={inp} defaultValue={d.columns || 3} onBlur={e => onFieldSave('columns', Number(e.target.value))}>
            {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{wb('links_icons_urls')}</label>
          <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10 }}>{wb('links_canvas_edit_hint')}</p>
          {groups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #f3f4f6' }}>
                {group.heading || wb('group_n', { n: gi + 1 })}
              </div>
              {(group.items || []).map((item, ii) => (
                <div key={ii} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, marginBottom: 6, background: '#f9fafb' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 5 }}>
                    {String(item.label || '').replace(/<[^>]*>/g, '') || wb('link_n', { n: ii + 1 })}
                  </div>
                  <div style={{ marginBottom: 5 }}>
                    <label style={{ display: 'block', fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{wb('links_icon_lbl')}</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {item.icon_url && <img src={item.icon_url} alt="" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 3, border: '1px solid #e5e7eb' }} />}
                      <ImageUploadField compact value={item.icon_url || ''} onChange={url => updateItem(gi, ii, 'icon_url', url)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{wb('links_url_lbl')}</label>
                    <input className={inp} defaultValue={item.url || ''} placeholder={wb('ph_https')}
                      onBlur={e => updateItem(gi, ii, 'url', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <BgField />
      </div>
    );
  }

  // ── Divider ──
  // ── Contact ──
  if (bt === 'contact') return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_contact')}</div>
      <Field label={wb('f_heading')}>
        <TxtInp field="heading" placeholder={wb('ph_contact_heading')} />
      </Field>
      <Field label={wb('f_subheading')}>
        <RichBody field="sub_heading" />
      </Field>
      <Field label={wb('f_send_to')}>
        <TxtInp field="contact_email" placeholder={wb('ph_contact_email')} />
      </Field>
      <BgField />
    </div>
  );

  if (bt === 'divider') return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_spacer')}</div>
      <Field label={wb('f_height_px')}>
        <input key={`${block.block_id}-height`} type="number" className={inp} defaultValue={d.height || 40} min={8} max={400}
          onBlur={e => onFieldSave('height', Number(e.target.value))} />
      </Field>
      <BgField />
    </div>
  );

  // ── Member Directory (association widget) ──
  if (bt === 'member_directory') return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_members')}</div>
      <Field label={wb('f_heading')}><TxtInp field="heading" placeholder={wb('ph_member_dir')} /></Field>
      <Field label={wb('f_intro')}><RichBody field="intro_body" /></Field>
      <Field label={wb('f_columns')}>
        <select className={inp} defaultValue={d.columns || 3} onBlur={e => onFieldSave('columns', Number(e.target.value))}>
          {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </Field>
      <Field label={wb('f_max_members')}>
        <input key={`${block.block_id}-max`} type="number" className={inp} defaultValue={d.max_items || 24} min={1} max={500}
          onBlur={e => onFieldSave('max_items', Number(e.target.value))} />
      </Field>
      <Field label={wb('f_show_search')}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
          <input type="checkbox" checked={!!d.show_search} onChange={e => onFieldSave('show_search', e.target.checked)} style={{ width: 16, height: 16 }} />
          {wb('f_keyword_search')}
        </label>
      </Field>
      <Field label={wb('f_show_state')}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
          <input type="checkbox" checked={!!d.show_state_filter} onChange={e => onFieldSave('show_state_filter', e.target.checked)} style={{ width: 16, height: 16 }} />
          {wb('f_state_dropdown')}
        </label>
      </Field>
      <BgField />
    </div>
  );

  // ── Pedigree / Registry Search (association widget) ──
  if (bt === 'pedigree_search') return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_pedigree')}</div>
      <Field label={wb('f_heading')}><TxtInp field="heading" placeholder={wb('ph_registry')} /></Field>
      <Field label={wb('f_intro')}><RichBody field="intro_body" /></Field>
      <Field label={wb('f_search_fields')}>
        {[
          ['show_name', wb('ped_field_name')],
          ['show_reg_number', wb('ped_field_reg')],
          ['show_owner', wb('ped_field_owner')],
        ].map(([key, lbl]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', marginBottom: 4 }}>
            <input type="checkbox" checked={d[key] !== false} onChange={e => onFieldSave(key, e.target.checked)} style={{ width: 16, height: 16 }} />
            {lbl}
          </label>
        ))}
      </Field>
      <Field label={wb('f_max_results')}>
        <input key={`${block.block_id}-maxr`} type="number" className={inp} defaultValue={d.max_results || 20} min={1} max={200}
          onBlur={e => onFieldSave('max_results', Number(e.target.value))} />
      </Field>
      <BgField />
    </div>
  );

  // ── Fee Schedule (association widget) ──
  if (bt === 'fee_schedule') {
    const rows = Array.isArray(d.rows) ? d.rows : [];
    const saveRows = (r) => onFieldSave('rows', r);
    const updateRow = (i, key, val) => saveRows(rows.map((r, j) => i !== j ? r : { ...r, [key]: val }));
    const addRow    = () => saveRows([...rows, { label: '', amount: '', notes: '' }]);
    const removeRow = (i) => saveRows(rows.filter((_, j) => j !== i));
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_fees')}</div>
        <Field label={wb('f_heading')}><TxtInp field="heading" placeholder={wb('ph_fee_schedule')} /></Field>
        <Field label={wb('f_intro')}><RichBody field="intro_body" /></Field>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{wb('f_rows')}</label>
          {rows.map((r, i) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, marginBottom: 6, background: '#f9fafb' }}>
              <input className={inp} defaultValue={r.label || ''} placeholder={wb('ph_item_label')}
                onBlur={e => updateRow(i, 'label', e.target.value)} style={{ marginBottom: 4 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 6 }}>
                <input className={inp} defaultValue={r.amount || ''} placeholder={wb('ph_amount')}
                  onBlur={e => updateRow(i, 'amount', e.target.value)} />
                <input className={inp} defaultValue={r.notes || ''} placeholder={wb('ph_notes')}
                  onBlur={e => updateRow(i, 'notes', e.target.value)} />
                <button type="button" onClick={() => removeRow(i)}
                  style={{ border: '1px solid #fca5a5', background: '#fff', color: '#b91c1c', borderRadius: 6, padding: '0 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addRow}
            style={{ border: '1px dashed #9ca3af', background: '#fff', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: '#374151', width: '100%' }}>{wb('add_row')}</button>
        </div>
        <BgField />
      </div>
    );
  }

  // ── Map & Location (universal widget) ──
  if (bt === 'map_location') return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_map')}</div>
      <Field label={wb('f_heading')}><TxtInp field="heading" placeholder={wb('ph_map')} /></Field>
      <Field label={wb('f_address')}><TxtArea field="address" rows={2} /></Field>
      <Field label={wb('map_embed_url_lbl')}>
        <TxtArea field="embed_url" rows={3} />
        <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4, lineHeight: 1.4 }}>
          {wb('map_embed_hint')}
        </p>
      </Field>
      <Field label={wb('map_height_lbl')}>
        <input key={`${block.block_id}-h`} type="number" className={inp} defaultValue={d.height || 320} min={150} max={800}
          onBlur={e => onFieldSave('height', Number(e.target.value))} />
      </Field>
      <BgField />
    </div>
  );

  // ── Hours of Operation (universal widget) ──
  if (bt === 'hours_of_operation') {
    const rows = Array.isArray(d.hours) ? d.hours : [];
    const saveRows = (r) => onFieldSave('hours', r);
    const updateRow = (i, key, val) => saveRows(rows.map((r, j) => i !== j ? r : { ...r, [key]: val }));
    const addRow = () => saveRows([...rows, { day: '', open: '', close: '', closed: false, notes: '' }]);
    const removeRow = (i) => saveRows(rows.filter((_, j) => j !== i));
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_hours')}</div>
        <Field label={wb('f_heading')}><TxtInp field="heading" placeholder={wb('ph_hours')} /></Field>
        <Field label={wb('f_intro')}><RichBody field="intro_body" /></Field>
        <Field label={wb('f_timezone')}><TxtInp field="timezone" placeholder={wb('ph_timezone')} /></Field>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{wb('f_weekly_hours')}</label>
          {rows.map((r, i) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, marginBottom: 6, background: '#f9fafb' }}>
              <input className={inp} defaultValue={r.day || ''} placeholder={wb('ph_day')}
                onBlur={e => updateRow(i, 'day', e.target.value)} style={{ marginBottom: 4 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, marginBottom: 4 }}>
                <input className={inp} defaultValue={r.open || ''} placeholder={wb('ph_open')}
                  onBlur={e => updateRow(i, 'open', e.target.value)} disabled={!!r.closed} />
                <input className={inp} defaultValue={r.close || ''} placeholder={wb('ph_close')}
                  onBlur={e => updateRow(i, 'close', e.target.value)} disabled={!!r.closed} />
                <button type="button" onClick={() => removeRow(i)}
                  style={{ border: '1px solid #fca5a5', background: '#fff', color: '#b91c1c', borderRadius: 6, padding: '0 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 6, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#374151' }}>
                  <input type="checkbox" checked={!!r.closed} onChange={e => updateRow(i, 'closed', e.target.checked)} style={{ width: 14, height: 14 }} />
                  {wb('f_closed')}
                </label>
                <input className={inp} defaultValue={r.notes || ''} placeholder={wb('f_notes_optional')}
                  onBlur={e => updateRow(i, 'notes', e.target.value)} />
              </div>
            </div>
          ))}
          <button type="button" onClick={addRow}
            style={{ border: '1px dashed #9ca3af', background: '#fff', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: '#374151', width: '100%' }}>{wb('add_day')}</button>
        </div>
        <BgField />
      </div>
    );
  }

  // ── FAQ ──
  if (bt === 'faq') {
    const items = Array.isArray(d.items) ? d.items : [];
    const saveItems = (its) => onFieldSave('items', its);
    const updateItem = (i, key, val) => saveItems(items.map((it, j) => i !== j ? it : { ...it, [key]: val }));
    const addItem = () => saveItems([...items, { question: '', answer: '' }]);
    const removeItem = (i) => saveItems(items.filter((_, j) => j !== i));
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_faq')}</div>
        <Field label={wb('f_section_heading')}><TxtInp field="heading" placeholder={wb('ph_faq')} /></Field>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{wb('f_questions_n', { n: items.length })}</label>
          {items.map((item, i) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, marginBottom: 6, background: '#f9fafb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{wb('q_n', { n: i + 1 })}</span>
                <button type="button" onClick={() => removeItem(i)}
                  style={{ border: '1px solid #fca5a5', background: '#fff', color: '#b91c1c', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>✕</button>
              </div>
              <input className={inp} defaultValue={item.question || ''} placeholder={wb('ph_question')}
                onBlur={e => updateItem(i, 'question', e.target.value)} style={{ marginBottom: 6 }} />
              <textarea className={inp} defaultValue={item.answer || ''} placeholder={wb('ph_answer')}
                onBlur={e => updateItem(i, 'answer', e.target.value)}
                rows={3} style={{ resize: 'vertical' }} />
            </div>
          ))}
          <button type="button" onClick={addItem}
            style={{ border: '1px dashed #9ca3af', background: '#fff', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: '#374151', width: '100%' }}>{wb('add_question')}</button>
        </div>
        <BgField />
      </div>
    );
  }

  // ── Features grid ──
  if (bt === 'features') {
    const items = Array.isArray(d.items) ? d.items : [];
    const saveItems = (its) => onFieldSave('items', its);
    const updateItem = (i, key, val) => saveItems(items.map((it, j) => i !== j ? it : { ...it, [key]: val }));
    const addItem = () => saveItems([...items, { title: '', description: '', icon_url: '' }]);
    const removeItem = (i) => saveItems(items.filter((_, j) => j !== i));
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_features')}</div>
        <Field label={wb('f_section_heading')}><TxtInp field="heading" placeholder={wb('ph_features')} /></Field>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{wb('f_cards_n', { n: items.length })}</label>
          {items.map((item, i) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, marginBottom: 6, background: '#f9fafb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{wb('card_n', { n: i + 1 })}</span>
                <button type="button" onClick={() => removeItem(i)}
                  style={{ border: '1px solid #fca5a5', background: '#fff', color: '#b91c1c', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>✕</button>
              </div>
              <input className={inp} defaultValue={item.title || ''} placeholder={wb('ph_title')}
                onBlur={e => updateItem(i, 'title', e.target.value)} style={{ marginBottom: 6 }} />
              <textarea className={inp} defaultValue={item.description || ''} placeholder={wb('ph_desc')}
                onBlur={e => updateItem(i, 'description', e.target.value)}
                rows={2} style={{ resize: 'vertical', marginBottom: 6 }} />
              <input className={inp} defaultValue={item.icon_url || ''} placeholder={wb('ph_icon_url')}
                onBlur={e => updateItem(i, 'icon_url', e.target.value)} />
            </div>
          ))}
          <button type="button" onClick={addItem}
            style={{ border: '1px dashed #9ca3af', background: '#fff', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: '#374151', width: '100%' }}>{wb('add_card')}</button>
        </div>
        <BgField />
      </div>
    );
  }

  // ── Team / Staff ──
  if (bt === 'team') {
    const members = Array.isArray(d.members) ? d.members : [];
    const saveMembers = (ms) => onFieldSave('members', ms);
    const updateMember = (i, key, val) => saveMembers(members.map((m, j) => i !== j ? m : { ...m, [key]: val }));
    const addMember = () => saveMembers([...members, { name: '', role: '', bio: '', photo_url: '' }]);
    const removeMember = (i) => saveMembers(members.filter((_, j) => j !== i));
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_team')}</div>
        <Field label={wb('f_section_heading')}><TxtInp field="heading" placeholder={wb('ph_team')} /></Field>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{wb('f_members_n', { n: members.length })}</label>
          {members.map((m, i) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, marginBottom: 8, background: '#f9fafb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{wb('member_n', { n: i + 1 })}</span>
                <button type="button" onClick={() => removeMember(i)}
                  style={{ border: '1px solid #fca5a5', background: '#fff', color: '#b91c1c', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                {m.photo_url && <img src={m.photo_url} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e5e7eb' }} />}
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{wb('photo_lbl')}</label>
                  <ImageUploadField compact value={m.photo_url || ''} onChange={url => updateMember(i, 'photo_url', url)} />
                </div>
              </div>
              <input className={inp} defaultValue={m.name || ''} placeholder={wb('ph_full_name')}
                onBlur={e => updateMember(i, 'name', e.target.value)} style={{ marginBottom: 4 }} />
              <input className={inp} defaultValue={m.role || ''} placeholder={wb('ph_title_role')}
                onBlur={e => updateMember(i, 'role', e.target.value)} style={{ marginBottom: 4 }} />
              <textarea className={inp} defaultValue={m.bio || ''} placeholder={wb('ph_short_bio')}
                onBlur={e => updateMember(i, 'bio', e.target.value)} rows={2} style={{ resize: 'vertical' }} />
            </div>
          ))}
          <button type="button" onClick={addMember}
            style={{ border: '1px dashed #9ca3af', background: '#fff', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: '#374151', width: '100%' }}>{wb('add_member')}</button>
        </div>
      </div>
    );
  }

  // ── Pricing / Plans ──
  if (bt === 'pricing') {
    const tiers = Array.isArray(d.tiers) ? d.tiers : [];
    const saveTiers = (ts) => onFieldSave('tiers', ts);
    const updateTier = (i, key, val) => saveTiers(tiers.map((t, j) => i !== j ? t : { ...t, [key]: val }));
    const addTier = () => saveTiers([...tiers, { name: '', price: '', period: 'month', description: '', features: [], highlight: false }]);
    const removeTier = (i) => saveTiers(tiers.filter((_, j) => j !== i));
    const updateFeatures = (i, raw) => updateTier(i, 'features', raw.split('\n').map(s => s.trim()).filter(Boolean));
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_pricing')}</div>
        <Field label={wb('f_section_heading')}><TxtInp field="heading" placeholder={wb('ph_pricing')} /></Field>
        <Field label={wb('f_intro_text')}><TxtInp field="intro_body" placeholder={wb('ph_plans_intro')} /></Field>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{wb('f_tiers_n', { n: tiers.length })}</label>
          {tiers.map((tier, i) => (
            <div key={i} style={{ border: `1px solid ${tier.highlight ? '#7C5CBF' : '#e5e7eb'}`, borderRadius: 6, padding: 8, marginBottom: 8, background: tier.highlight ? '#f5f3ff' : '#f9fafb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{wb('tier_n', { n: i + 1 })}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#7C5CBF', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!tier.highlight} onChange={e => updateTier(i, 'highlight', e.target.checked)} />
                    {wb('f_featured')}
                  </label>
                  <button type="button" onClick={() => removeTier(i)}
                    style={{ border: '1px solid #fca5a5', background: '#fff', color: '#b91c1c', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>✕</button>
                </div>
              </div>
              <input className={inp} defaultValue={tier.name || ''} placeholder={wb('ph_plan_name')}
                onBlur={e => updateTier(i, 'name', e.target.value)} style={{ marginBottom: 4 }} />
              <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                <input className={inp} defaultValue={tier.price || ''} placeholder={wb('ph_price')}
                  onBlur={e => updateTier(i, 'price', e.target.value)} style={{ flex: 2 }} />
                <select className={inp} defaultValue={tier.period || 'month'} onChange={e => updateTier(i, 'period', e.target.value)} style={{ flex: 1 }}>
                  <option value="">{wb('price_one_time')}</option>
                  <option value="month">{wb('price_per_month')}</option>
                  <option value="year">{wb('price_per_year')}</option>
                  <option value="week">{wb('price_per_week')}</option>
                </select>
              </div>
              <input className={inp} defaultValue={tier.description || ''} placeholder={wb('ph_plan_desc')}
                onBlur={e => updateTier(i, 'description', e.target.value)} style={{ marginBottom: 4 }} />
              <textarea className={inp}
                defaultValue={Array.isArray(tier.features) ? tier.features.join('\n') : ''}
                placeholder={wb('ph_feature_line')}
                onBlur={e => updateFeatures(i, e.target.value)}
                rows={3} style={{ resize: 'vertical' }} />
            </div>
          ))}
          <button type="button" onClick={addTier}
            style={{ border: '1px dashed #9ca3af', background: '#fff', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: '#374151', width: '100%' }}>{wb('add_tier')}</button>
        </div>
        <BgField />
      </div>
    );
  }

  // ── Sponsors ──
  if (bt === 'sponsors') {
    const sponsors = Array.isArray(d.sponsors) ? d.sponsors : [];
    const saveSponsors = (s) => onFieldSave('sponsors', s);
    const updateSponsor = (i, key, val) => saveSponsors(sponsors.map((s, j) => i !== j ? s : { ...s, [key]: val }));
    const addSponsor = () => saveSponsors([...sponsors, { logo_url: '', name: '', url: '' }]);
    const removeSponsor = (i) => saveSponsors(sponsors.filter((_, j) => j !== i));
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_sponsors')}</div>
        <Field label={wb('f_heading')}><TxtInp field="heading" placeholder={wb('ph_sponsors')} /></Field>
        <Field label={wb('f_intro')}><RichBody field="intro_body" /></Field>
        <Field label={wb('f_columns')}>
          <select className={inp} defaultValue={d.columns || 4} onBlur={e => onFieldSave('columns', Number(e.target.value))}>
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label={wb('f_logo_height')}>
          <input key={`${block.block_id}-lh`} type="number" className={inp} defaultValue={d.logo_height || 80} min={40} max={200}
            onBlur={e => onFieldSave('logo_height', Number(e.target.value))} />
        </Field>
        <Field label={wb('f_show_names')}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
            <input type="checkbox" checked={d.show_names !== false} onChange={e => onFieldSave('show_names', e.target.checked)} style={{ width: 16, height: 16 }} />
            {wb('f_show_name_caption')}
          </label>
        </Field>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{wb('f_sponsors_list')}</label>
          {sponsors.map((s, i) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, marginBottom: 6, background: '#f9fafb' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                {s.logo_url && <img src={s.logo_url} alt="" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 3, border: '1px solid #e5e7eb', background: '#fff' }} />}
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>{wb('links_icon_lbl')}</label>
                  <ImageUploadField compact value={s.logo_url || ''} onChange={url => updateSponsor(i, 'logo_url', url)} />
                </div>
                <button type="button" onClick={() => removeSponsor(i)}
                  style={{ border: '1px solid #fca5a5', background: '#fff', color: '#b91c1c', borderRadius: 6, padding: '0 10px', cursor: 'pointer', fontSize: 12, height: 28 }}>✕</button>
              </div>
              <input className={inp} defaultValue={s.name || ''} placeholder={wb('ph_sponsor_name')}
                onBlur={e => updateSponsor(i, 'name', e.target.value)} style={{ marginBottom: 4 }} />
              <input className={inp} defaultValue={s.url || ''} placeholder={wb('ph_sponsor_url')}
                onBlur={e => updateSponsor(i, 'url', e.target.value)} />
            </div>
          ))}
          <button type="button" onClick={addSponsor}
            style={{ border: '1px dashed #9ca3af', background: '#fff', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: '#374151', width: '100%' }}>{wb('add_sponsor')}</button>
        </div>
        <BgField />
      </div>
    );
  }

  // ── CTA Banner ──
  if (bt === 'cta') {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>{wb('block_cta')}</div>
        <Field label={wb('f_headline')}><TxtInp field="headline" placeholder={wb('ph_cta')} /></Field>
        <Field label={wb('f_button_text')}><TxtInp field="button_text" placeholder={wb('ph_cta2')} /></Field>
        <Field label={wb('f_button_link')}><TxtInp field="button_link" placeholder={wb('ph_cta_link')} /></Field>
        <Field label={wb('f_layout')}>
          <select className={inp} defaultValue={d.align || 'split'} onBlur={e => onFieldSave('align', e.target.value)}>
            <option value="split">{wb('layout_headline_left')}</option>
            <option value="center">{wb('layout_stacked')}</option>
          </select>
        </Field>
        <Field label={wb('blog_bg_color')}>
          <input type="color" className={inp} defaultValue={d.bg_color || '#1a1a1a'}
            onBlur={e => onFieldSave('bg_color', e.target.value)} style={{ height: 36, padding: 2 }} />
        </Field>
        <Field label={wb('cta_headline_color')}>
          <input type="color" className={inp} defaultValue={d.text_color || '#ffffff'}
            onBlur={e => onFieldSave('text_color', e.target.value)} style={{ height: 36, padding: 2 }} />
        </Field>
        <Field label={wb('cta_btn_bg')}>
          <input type="color" className={inp} defaultValue={d.button_bg_color || (site?.accent_color || '#7CB342')}
            onBlur={e => onFieldSave('button_bg_color', e.target.value)} style={{ height: 36, padding: 2 }} />
        </Field>
        <Field label={wb('cta_btn_color')}>
          <input type="color" className={inp} defaultValue={d.button_text_color || '#ffffff'}
            onBlur={e => onFieldSave('button_text_color', e.target.value)} style={{ height: 36, padding: 2 }} />
        </Field>
      </div>
    );
  }

  // ── Generic data blocks ──
  const meta = BLOCK_TYPES.find(b => b.type === bt) || { icon: null, label: bt };
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 4, paddingBottom: 10, borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#3D6B34', display: 'flex' }}>{meta.icon}</span>{meta.label}
      </div>
      <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 14, lineHeight: 1.5 }}>
        {wb('live_data_note')}
      </p>
      {d.heading !== undefined && (
        <Field label={wb('gen_section_heading')}>
          <TxtInp field="heading" placeholder={wb('ph_section_heading')} />
        </Field>
      )}
      {d.max_items !== undefined && (
        <Field label={wb('gen_max_items')}>
          <input key={`${block.block_id}-max`} type="number" className={inp} defaultValue={d.max_items} min={1} max={50}
            onBlur={e => onFieldSave('max_items', Number(e.target.value))} />
        </Field>
      )}
      {d.max_posts !== undefined && (
        <Field label={wb('gen_max_posts')}>
          <input key={`${block.block_id}-posts`} type="number" className={inp} defaultValue={d.max_posts} min={1} max={20}
            onBlur={e => onFieldSave('max_posts', Number(e.target.value))} />
        </Field>
      )}
      {d.max_posts !== undefined && (
        <Field label={wb('gen_filter_cat')}>
          <input key={`${block.block_id}-cat`} type="text" className={inp} defaultValue={d.category || ''}
            placeholder={wb('ph_category_filter')}
            onBlur={e => onFieldSave('category', e.target.value.trim())} />
        </Field>
      )}
      <BgField />
    </div>
  );
}

// ── Typography CSS for .rte-body containers (canvas + inline editor) ──
// Generates CSS that targets standard h1/h2/h3/h4/p tags within .rte-body.
// When typography settings change on the Design page, the style tag re-renders
// and ALL .rte-body elements pick up the new values automatically.
// Inline style overrides (e.g. from font picker) still win via specificity cascade.
// Ensure every external <a> tag opens in a new tab. Internal page links
// (marked with data-page-slug) stay same-tab so the SPA handler intercepts them.
const addLinkTargets = html =>
  html ? html.replace(/<a\b([^>]*)>/gi, (full, attrs) => {
    if (/\bdata-page-slug\s*=/i.test(attrs)) return full;
    const clean = attrs
      .replace(/\btarget\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\brel\s*=\s*["'][^"']*["']/gi, '');
    return `<a${clean} target="_blank" rel="noopener noreferrer">`;
  }) : html;

function buildRteBodyCss(site) {
  if (!site) return '';
  const linkColor = site.link_color || site.accent_color || '#2563eb';
  const linkUline = site.link_underline !== false;
  const linkRule  = `.rte-body a{color:${linkColor};${linkUline ? 'text-decoration:underline;' : 'text-decoration:none;'}}`;
  const liFont  = site.body_font  || site.font_family || 'inherit';
  const liSize  = remToPx(site.body_size) || '16px';
  const liColor = site.body_color || site.text_color  || 'inherit';
  const listRules = [
    `.rte-body ul{list-style:disc!important;padding-left:1.5em!important;margin:0.4em 0!important;}`,
    `.rte-body ol{list-style:decimal!important;padding-left:1.5em!important;margin:0.4em 0!important;}`,
    `.rte-body li{margin:0.2em 0;font-family:${liFont};font-size:${liSize};color:${liColor};}`,
    `.rte-body li *{font-family:inherit;font-size:inherit;color:inherit;}`,
  ].join('');
  const tagRules  = [
    ['h1', 'h1'], ['h2', 'h2'], ['h3', 'h3'], ['h4', 'h4'], ['body', 'p'],
  ].map(([k, tag]) => {
    const size    = remToPx(site[`${k}_size`]) || (k==='body'?'16px':k==='h1'?'40px':k==='h2'?'29px':k==='h3'?'21px':'17px');
    const weight  = site[`${k}_weight`]       || (k==='body'?'400':k==='h1'?'800':k==='h2'?'700':'600');
    const color   = site[`${k}_color`]        || site.text_color || '';
    const font    = site[`${k}_font`]         || site.font_family || '';
    const uline   = site[`${k}_underline`];
    const italic  = site[`${k}_italic`];
    const hasRule = k !== 'body' && site[`${k}_rule`];
    const ruleclr = site[`${k}_rule_color`]   || site.text_color || '#000';
    const align   = site[`${k}_align`]        || 'left';
    const mt      = site[`${k}_margin_top`]   ?? 0;
    const mb      = site[`${k}_margin_bottom`]?? (k === 'body' ? 12 : 8);
    let css = `font-size:${size};font-weight:${weight};margin-top:${mt}px;margin-bottom:${mb}px;`;
    if (font)    css += `font-family:${font};`;
    if (color)   css += `color:${color};`;
    if (italic)  css += `font-style:italic;`;
    if (uline)   css += `text-decoration:underline;`;
    if (hasRule) css += `border-bottom:2px solid ${ruleclr};padding-bottom:2px;`;
    if (align !== 'left') css += `text-align:${align};`;
    return `.rte-body ${tag}{${css}}`;
  }).join('\n');
  return linkRule + '\n' + listRules + '\n' + tagRules;
}

// Build CSS for site-wide image styling (rounded corners + drop shadow).
// Applies to all images rendered inside rich-text bodies (canvas + public site).
function buildImageCss(site) {
  if (!site) return '';
  const radius   = Number(site.image_border_radius ?? 0);
  const enabled  = !!site.image_shadow_enabled;
  const color    = site.image_shadow_color    || 'rgba(0,0,0,0.35)';
  const distance = Number(site.image_shadow_distance ?? 4);
  const blur     = Number(site.image_shadow_blur     ?? 8);
  const angle    = Number(site.image_shadow_angle    ?? 135);
  const rad = (angle * Math.PI) / 180;
  const ox  = Math.round(Math.cos(rad) * distance);
  const oy  = Math.round(Math.sin(rad) * distance);
  const parts = ['margin:8px !important;'];
  if (radius > 0)  parts.push(`border-radius:${radius}% !important;`);
  if (enabled)     parts.push(`box-shadow:${ox}px ${oy}px ${blur}px ${color} !important;`);
  const rule = parts.join('');
  // Margin rule applies to bare imgs only — imgs inside figures rely on the
  // figure's own margins so a 100%-wide img doesn't overflow its parent.
  // [data-no-style] opts an image out of all site-wide styling.
  const figRule = [];
  if (radius > 0) figRule.push(`border-radius:${radius}% !important;`);
  if (enabled)    figRule.push(`box-shadow:${ox}px ${oy}px ${blur}px ${color} !important;`);
  const figStyle = figRule.join('');
  return `.rte-body img:not([data-no-style]), .site-rte img:not([data-no-style]) { ${rule} }
.rte-body figure > img:not([data-no-style]), .site-rte figure > img:not([data-no-style]) { margin:0 !important; ${figStyle} }
.rte-body iframe:not([data-no-style]), .site-rte iframe:not([data-no-style]), .rte-body video:not([data-no-style]), .site-rte video:not([data-no-style]) { ${figStyle} }`;
}

// (legacy stub — kept so DesignView references compile)
function buildRteTypoCss(site) {
  if (!site) return '';
  return [['h1','h1'],['h2','h2'],['h3','h3'],['h4','h4'],['body','body']].map(([k]) => {
    const size       = remToPx(site[`${k}_size`]) || (k==='body'?'16px':k==='h1'?'40px':k==='h2'?'29px':k==='h3'?'21px':'17px');
    const weight     = site[`${k}_weight`] || (k==='body'?'400':k==='h1'?'800':k==='h2'?'700':k==='h3'?'600':'600');
    const color      = site[`${k}_color`]  || site.text_color || '';
    const fontFamily = site[`${k}_font`]   || site.font_family || '';
    const uline      = site[`${k}_underline`];
    const italic     = site[`${k}_italic`];
    const hasRule    = k !== 'body' && site[`${k}_rule`];
    const ruleclr    = site[`${k}_rule_color`] || site.text_color || '#000';
    const align      = site[`${k}_align`]  || 'left';
    let css = `font-size:${size};font-weight:${weight};`;
    if (fontFamily) css += `font-family:${fontFamily};`;
    if (color)      css += `color:${color};`;
    css += italic ? `font-style:italic;` : `font-style:normal;`;
    css += uline ? `text-decoration:underline;` : `text-decoration:none;`;
    css += hasRule ? `border-bottom:2px solid ${ruleclr};padding-bottom:2px;` : `border-bottom:none;padding-bottom:0;`;
    if (align !== 'left') css += `display:inline-block;text-align:${align};width:100%;`;
    return `.rte-editor [data-rte-style="${k}"] { ${css} }`;
  }).join('\n');
}

// (SelectionToolbar, FloatingBlockToolbar, HeroImageManager, WrapIcon, BlockImageEditor, AboutContentBlock removed — editing moved to BlockEditorPanel sidebar)

// ── getVideoInfo: YouTube / Vimeo URL parser ──────────────────────
function getVideoInfo(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (yt) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${yt[1]}`, thumb: `https://img.youtube.com/vi/${yt[1]}/mqdefault.jpg` };
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vm[1]}`, thumb: null };
  return { type: 'file', embedUrl: url, thumb: null };
}

// ── CanvasSiteHeader: simulated site header shown in the canvas ───
function CanvasSiteHeader({ site, pages = [], isMobile = false }) {
  if (!site) return null;
  const headerHeight = Number(site.header_height) || 120;
  const bgW = site.header_bg_width || '100%';
  const cW  = site.header_content_width || '100%';
  const topLevelNav = pages.filter(p => !p.parent_page_id && p.is_published !== false);
  const hasChildren = (pageId) => pages.some(p => p.parent_page_id === pageId);
  const navColor = site.nav_text_color || '#fff';
  const navBg = site.nav_bg_image_url ? `url(${site.nav_bg_image_url}) center/cover no-repeat` : (site.primary_color || '#3D6B34');
  return (
    <div style={{ display: 'flex', justifyContent: 'center', background: 'transparent', fontFamily: site.font_family }}>
      <div style={{ width: '100%', maxWidth: bgW, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {site.top_bar_enabled && site.top_bar_html && (
          <div style={{ width: '100%', maxWidth: cW, background: site.top_bar_bg_color || '#f8f5ef', padding: '5px 1rem', textAlign: site.top_bar_align || 'right' }}>
            <span style={{ fontSize: 12, color: site.top_bar_text_color || '#333' }}
              dangerouslySetInnerHTML={{ __html: site.top_bar_html }} />
          </div>
        )}
        {/* Banner */}
        <div style={{ width: '100%', maxWidth: cW, position: 'relative' }}>
          {site.header_banner_url ? (
            <img src={site.header_banner_url} alt="" style={{ width: '100%', display: 'block' }} />
          ) : (
            <div style={{ height: headerHeight, background: site.header_banner_bg_color || site.primary_color || '#3D6B34' }} />
          )}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '1rem' }}>
            {site.logo_url && (
              <img src={site.logo_url} alt="" style={{ height: Math.min(headerHeight * 0.55, 80), objectFit: 'contain', borderRadius: 4 }} />
            )}
            {site.show_site_name !== false && (
              <span style={{ fontWeight: 800, color: navColor, fontSize: '1.5rem', textShadow: site.header_banner_url ? '1px 1px 4px rgba(0,0,0,0.55)' : 'none' }}>{site.site_name}</span>
            )}
          </div>
        </div>
        {/* Nav — hamburger on mobile/tablet, full links on desktop */}
        <div style={{ width: '100%', maxWidth: cW, background: navBg, padding: '0 1rem', height: 48, display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-start', gap: 4 }}>
          {isMobile ? (
            <>
              <span style={{ color: navColor, fontSize: '0.9rem', fontWeight: 700 }}>
                {topLevelNav[0]?.page_name || 'Home'}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer', padding: '4px 6px' }}>
                <div style={{ width: 22, height: 2, background: navColor, borderRadius: 2 }} />
                <div style={{ width: 22, height: 2, background: navColor, borderRadius: 2 }} />
                <div style={{ width: 22, height: 2, background: navColor, borderRadius: 2 }} />
              </div>
            </>
          ) : (
            (topLevelNav.length > 0 ? topLevelNav : [{ page_name: 'Home', page_id: 0 }]).map(p => (
              <span key={p.page_id} style={{ color: navColor, fontSize: '0.85rem', fontWeight: 600, padding: '0.3rem 0.7rem', borderRadius: 6 }}>
                {p.page_name}{hasChildren(p.page_id) ? <span style={{ fontSize: '0.6rem', marginLeft: 3, opacity: 0.8 }}>▾</span> : null}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── CanvasSiteFooter: simulated site footer shown in the canvas ───
function CanvasSiteFooter({ site }) {
  if (!site) return null;
  const footerHeight = Number(site.footer_height) || 200;
  const bgW = site.footer_bg_width || '100%';
  const cW  = site.footer_content_width || '100%';
  const hasBgImg = !!site.footer_bg_image_url;
  const footerBg    = site.footer_bg_color    || site.primary_color || '#3D6B34';
  const copyrightBg = site.copyright_bar_bg_color || 'rgba(0,0,0,0.18)';
  const bottomRadius = Number(site.footer_bottom_radius) || 0;
  const fRadiusCss = bottomRadius ? `0 0 ${bottomRadius}px ${bottomRadius}px` : undefined;
  const copyrightIsTransparent = !copyrightBg || copyrightBg === 'transparent';
  const footerContentRadius = copyrightIsTransparent ? fRadiusCss : undefined;
  const copyrightRadius = copyrightIsTransparent ? undefined : fRadiusCss;

  // Strip a trailing "© ... all rights reserved" block from footer_html so
  // it never duplicates the dedicated copyright bar below.
  const _copyRx = /<(div|p|small|span)\b[^>]*>[\s\S]*?(?:&copy;|©)[\s\S]*?all\s+rights\s+reserved[\s\S]*?<\/\1>\s*$/i;
  let footerHtml = site.footer_html || '';
  let extractedCopy = '';
  const _m = footerHtml.match(_copyRx);
  if (_m) {
    extractedCopy = _m[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    footerHtml = footerHtml.replace(_copyRx, '');
  }
  const copyrightLine = site.copyright_text || extractedCopy || `© ${new Date().getFullYear()} ${site.site_name}`;

  const FooterContent = () => (
    <div style={{ background: footerBg }}>
      <div style={{ maxWidth: cW, margin: '0 auto' }}>
        {footerHtml ? (
          <div style={{ padding: '0.5rem 1rem', color: '#fff', fontSize: '0.9rem', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: footerHtml }} />
        ) : null}
      </div>
    </div>
  );

  const CopyrightStrip = () => (
    <div style={{ background: copyrightBg, borderRadius: copyrightRadius }}>
      <div style={{ maxWidth: cW, margin: '0 auto', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>
          {copyrightLine}
        </span>
        <a href="https://www.OatmealFarmNetwork.com" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
          Powered by Oatmeal Farm Network
        </a>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'center', background: 'transparent', fontFamily: site.font_family }}>
      <div style={{ width: '100%', maxWidth: bgW, borderRadius: fRadiusCss, overflow: bottomRadius ? 'hidden' : undefined }}>
        {hasBgImg ? (
          /* Image case: bg-image with cover + overlay so height stays compact */
          <>
            <div style={{
              position: 'relative',
              minHeight: footerHeight,
              backgroundImage: `url(${site.footer_bg_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              borderRadius: footerContentRadius,
              overflow: bottomRadius && copyrightIsTransparent ? 'hidden' : undefined,
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', maxWidth: cW, margin: '0 auto' }}>
                {footerHtml ? (
                  <div style={{ padding: '0.5rem 1rem', color: '#fff', fontSize: '0.9rem', lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: footerHtml }} />
                ) : null}
              </div>
            </div>
            <CopyrightStrip />
          </>
        ) : (
          /* No image: plain block siblings — minHeight on footer content drives the height slider */
          <>
            <div style={{ minHeight: footerHeight, background: footerBg, borderRadius: footerContentRadius }}>
              <div style={{ maxWidth: cW, margin: '0 auto' }}>
                {footerHtml ? (
                  <div style={{ padding: '1.5rem 1rem', color: '#fff', fontSize: '0.9rem', lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: footerHtml }} />
                ) : null}
              </div>
            </div>
            <CopyrightStrip />
          </>
        )}
      </div>
    </div>
  );
}

// ── MediaPanel: localStorage-based media library ──────────────────
function MediaPanel({ siteId }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const storageKey = `ofn_media_${siteId}`;
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
  });
  const [uploading, setUploading] = useState(false);
  const [mediaDragging, setMediaDragging] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const fileRef = useRef(null);

  const save = (newItems) => {
    setItems(newItems);
    localStorage.setItem(storageKey, JSON.stringify(newItems));
  };

  const handleUpload = async (files) => {
    setUploading(true);
    const newItems = [...items];
    for (const file of Array.from(files)) {
      try {
        const url = await uploadImageFile(file);
        newItems.push({ type: 'image', url, name: file.name });
      } catch {}
    }
    save(newItems);
    setUploading(false);
  };

  const addVideo = () => {
    if (!videoUrl.trim()) return;
    const info = getVideoInfo(videoUrl);
    save([...items, { type: 'video', url: videoUrl, embedUrl: info?.embedUrl, thumb: info?.thumb, name: 'Video' }]);
    setVideoUrl('');
  };

  const deleteItem = (idx) => save(items.filter((_, i) => i !== idx));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Upload controls */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); setMediaDragging(true); }}
          onDragLeave={() => setMediaDragging(false)}
          onDrop={e => { e.preventDefault(); e.stopPropagation(); setMediaDragging(false); handleUpload(e.dataTransfer.files); }}
          style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: `1.5px dashed ${mediaDragging ? '#3b82f6' : '#bfdbfe'}`, background: mediaDragging ? '#dbeafe' : '#eff6ff', color: mediaDragging ? '#1d4ed8' : '#3b82f6', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s', textAlign: 'center' }}>
          {uploading ? wb('media_uploading') : mediaDragging ? wb('media_dropping') : wb('media_upload_prompt')}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files)} />
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input
            style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 8px', fontSize: 11, outline: 'none' }}
            placeholder={wb('media_video_ph')}
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addVideo()} />
          <button onClick={addVideo}
            style={{ padding: '5px 10px', borderRadius: 6, background: '#f3f4f6', border: '1px solid #e5e7eb', fontSize: 11, cursor: 'pointer', color: '#374151', fontWeight: 600 }}>
            {wb('media_add_video')}
          </button>
        </div>
      </div>

      {/* Media grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🖼️</div>
            <div style={{ fontSize: 12 }}>{wb('media_empty_hint')}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {items.map((item, idx) => (
              <div key={idx}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('application/x-media-url', item.url);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb', aspectRatio: '1', background: '#f9fafb', cursor: 'grab' }}
                className="group"
              >
                {item.type === 'video' ? (
                  <div style={{ width: '100%', height: '100%', background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {item.thumb
                      ? <img src={item.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '2rem' }}>🎬</span>}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.85)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 12, marginLeft: 2 }}>▶</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <button onClick={() => deleteItem(idx)}
                  style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, lineHeight: 1, opacity: 0 }}
                  className="group-hover-opacity">
                  ×
                </button>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 9, padding: '2px 4px', opacity: 0, transition: 'opacity 0.15s' }}
                  className="media-label">
                  {wb('media_drag_to_block')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSS for hover states */}
      <style>{`
        .group:hover .group-hover-opacity { opacity: 1 !important; }
        .group:hover .media-label { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function WebsiteBuilder() {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const BusinessID = searchParams.get('BusinessID');
  const { Business, LoadBusiness, setWebsiteSlug } = useAccount();

  // If the OAT admin passed auth params via URL, seed localStorage so API calls work
  useEffect(() => {
    const urlPeopleId = searchParams.get('people_id');
    const urlToken    = searchParams.get('access_token');
    if (urlPeopleId) localStorage.setItem('people_id',    urlPeopleId);
    if (urlToken)    localStorage.setItem('access_token', urlToken);
  }, []);

  const [site, setSite]             = useState(null);
  const [pages, setPages]           = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [blocks, setBlocks]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [setupMode, setSetupMode]   = useState(false);

  // Page sidebar UI
  const [showNewPage, setShowNewPage]         = useState(false);
  const [newPageName, setNewPageName]         = useState('');
  const [editingPageId, setEditingPageId]     = useState(null);
  const [editingPageName, setEditingPageName] = useState('');
  const [nestingPageId, setNestingPageId]     = useState(null); // page showing parent picker

  // Templates modal
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [templates, setTemplates]                   = useState([]);
  const [templatesBusinessTypeId, setTemplatesBusinessTypeId] = useState(null);
  const [templatesLoading, setTemplatesLoading]     = useState(false);
  const [templateApplying, setTemplateApplying]     = useState(null); // template_key while POSTing
  const [collapsedParents, setCollapsedParents] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('wb_collapsedParents') || '[]')); }
    catch { return new Set(); }
  });
  const toggleCollapsed = (pageId) => {
    setCollapsedParents(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId); else next.add(pageId);
      try { localStorage.setItem('wb_collapsedParents', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  // Block picker
  const [showBlockPicker, setShowBlockPicker] = useState(false);

  // WYSIWYG canvas state
  const canvasRef     = useRef(null);
  const blocksRef     = useRef(blocks);
  useEffect(() => { blocksRef.current = blocks; }, [blocks]);

  // Inject/update CSS for [data-rte-style] spans so design changes apply live to existing styled text
  useEffect(() => {
    const css = buildRteTypoCss(site);
    let styleEl = document.getElementById('rte-typo-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'rte-typo-styles';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  }, [site]);

  const [selectedBlock, setSelectedBlock] = useState(null);
  const [activeTab, setActiveTab]         = useState('pages'); // 'pages' | 'blocks' | 'media'
  const [sidebarOpen, setSidebarOpen]     = useState(true);

  // Drag-to-reorder
  const dragIdx = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

  // Responsive preview
  const [previewMode, setPreviewMode] = useState('desktop');

  // Setup wizard data
  const [setupData, setSetupData] = useState({
    site_name: '', slug: '', tagline: '', logo_url: '',
    primary_color:   TEMPLATES[0].primary_color,
    secondary_color: TEMPLATES[0].secondary_color,
    accent_color:    TEMPLATES[0].accent_color,
    bg_color:        TEMPLATES[0].bg_color,
    text_color:      TEMPLATES[0].text_color,
    nav_text_color:  TEMPLATES[0].nav_text_color,
    footer_bg_color: TEMPLATES[0].footer_bg_color,
    font_family:     TEMPLATES[0].font_family,
    phone: '', email: '', address: '', facebook_url: '', instagram_url: '', twitter_url: '',
    import_enabled: false, import_url: '', import_legal_ack: false,
  });

  // Build-in-progress overlay (covers wizard/builder while createSite runs)
  const [building, setBuilding] = useState(false);
  const [buildStatus, setBuildStatus] = useState('');

  const paramPage = searchParams.get('page');
  const paramView = searchParams.get('view');

  useEffect(() => { LoadBusiness(BusinessID); }, [BusinessID]);
  useEffect(() => { if (BusinessID) loadSite(); }, [BusinessID]);

  useEffect(() => {
    if (!site) return;
    if (paramView === 'design' || paramView === 'settings' || paramView === 'delete' || paramView === 'manage-pages') {
      setActivePage(paramView);
      return;
    }
    if (paramPage && pages.length > 0) {
      const target = pages.find(p => p.page_id === parseInt(paramPage));
      if (target) selectPage(target);
    }
  }, [paramPage, paramView, site]);

  const loadSite = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/website/site?business_id=${BusinessID}`);
      if (!data) { setSetupMode(true); }
      else {
        setSite(data);
        await loadPages(data.website_id);
      }
    } catch { setSetupMode(true); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (setupMode && Business) {
      setSetupData(p => ({
        ...p,
        site_name: p.site_name || Business.BusinessName || '',
        slug: p.slug || slugify(Business.BusinessName || ''),
        email: p.email || Business.BusinessEmail || '',
        phone: p.phone || Business.BusinessPhone || '',
      }));
    }
  }, [setupMode, Business]);

  const loadPages = async (websiteId) => {
    const ps = await apiFetch(`/api/website/pages?website_id=${websiteId}`);
    setPages(ps);
    if (paramView === 'design' || paramView === 'settings' || paramView === 'delete' || paramView === 'manage-pages') {
      setActivePage(paramView);
      return;
    }
    if (ps.length > 0) {
      const target = paramPage ? ps.find(p => p.page_id === parseInt(paramPage)) : null;
      const chosen = target || ps.find(p => p.is_home_page) || ps[0];
      setActivePage(chosen);
      await loadBlocks(chosen.page_id);
    } else {
      setActivePage('manage-pages');
    }
  };

  const loadBlocks = async (pageId) => {
    const bs = await apiFetch(`/api/website/blocks/${pageId}`);
    setBlocks(bs);
    setSelectedBlock(null);
  };

  const selectPage = async (page) => {
    navigate(`?BusinessID=${BusinessID}&page=${page.page_id}`, { replace: true });
    setActivePage(page);
    setBlocks([]);
    setShowBlockPicker(false);
    setSelectedBlock(null);
    await loadBlocks(page.page_id);
  };

  // ── Site creation ──────────────────────────────────────────────
  const createSite = async () => {
    setSaving(true);
    setBuilding(true);
    setBuildStatus('Creating your site…');
    try {
      const bid = parseInt(BusinessID);
      const data = await apiFetch('/api/website/site', {
        method: 'POST',
        body: JSON.stringify({ ...setupData, business_id: bid }),
      });
      setSite(data);
      setSetupMode(false);
      setWebsiteSlug(data.slug ?? null);
      setBuildStatus('Setting up your default pages…');

      const mkPage = (name, slug, isHome, order) =>
        apiFetch('/api/website/pages', { method: 'POST', body: JSON.stringify({ website_id: data.website_id, business_id: bid, page_name: name, slug, is_home_page: isHome, sort_order: order }) });
      const mkBlock = (pageId, blockType, blockData, order) =>
        apiFetch('/api/website/blocks', { method: 'POST', body: JSON.stringify({ page_id: pageId, block_type: blockType, block_data: blockData, sort_order: order }) });

      const content = await apiFetch(`/api/website/content/check?business_id=${bid}`).catch(() => ({}));
      let order = 0;

      const homePage = await mkPage('Home', 'home', true, order++);
      await mkBlock(homePage.page_id, 'hero', { headline: `Welcome to ${setupData.site_name}`, subtext: setupData.tagline || 'Fresh, local, and sustainably grown.', image_url: '', cta_text: 'Learn More', cta_link: '#about', overlay: true, align: 'center' }, 0);
      await mkBlock(homePage.page_id, 'content', { heading: 'What We Offer', body: 'We are a local farm dedicated to bringing you the finest quality produce, livestock, and products.', image_url: '', images: [], image_position: 'none' }, 1);

      const aboutPage = await mkPage('About Us', 'about', false, order++);
      await mkBlock(aboutPage.page_id, 'hero', { headline: 'About Us', subtext: `Learn more about ${setupData.site_name}`, image_url: '', cta_text: '', cta_link: '', overlay: true, align: 'center' }, 0);
      await mkBlock(aboutPage.page_id, 'about', { heading: 'Our Story', body: 'Tell visitors who you are, where you are located, and what makes your farm special.', image_url: '', images: [], image_position: 'right' }, 1);

      if (content.livestock_for_sale) { const p = await mkPage('Livestock For Sale', 'livestock-for-sale', false, order++); await mkBlock(p.page_id, 'hero', { headline: 'Livestock For Sale', subtext: 'Browse our available animals.', image_url: '', cta_text: '', cta_link: '', overlay: true, align: 'center' }, 0); await mkBlock(p.page_id, 'livestock', { heading: 'Animals For Sale', show_for_sale: true, show_studs: false, max_items: 12 }, 1); }
      if (content.studs) { const p = await mkPage('Stud Services', 'stud-services', false, order++); await mkBlock(p.page_id, 'hero', { headline: 'Stud Services', subtext: 'Premium breeding genetics available.', image_url: '', cta_text: '', cta_link: '', overlay: true, align: 'center' }, 0); await mkBlock(p.page_id, 'studs', { heading: 'Stud Animals', show_for_sale: false, show_studs: true, max_items: 12 }, 1); }
      if (content.produce) { const p = await mkPage('Fresh Produce', 'produce', false, order++); await mkBlock(p.page_id, 'hero', { headline: 'Fresh Produce', subtext: 'Farm-fresh fruits and vegetables.', image_url: '', cta_text: '', cta_link: '', overlay: true, align: 'center' }, 0); await mkBlock(p.page_id, 'produce', { heading: 'What We Grow', max_items: 20 }, 1); }
      if (content.meat) { const p = await mkPage('Meat', 'meat', false, order++); await mkBlock(p.page_id, 'hero', { headline: 'Farm-Raised Meat', subtext: 'Pasture-raised, humanely harvested.', image_url: '', cta_text: '', cta_link: '', overlay: true, align: 'center' }, 0); await mkBlock(p.page_id, 'meat', { heading: 'Available Cuts', max_items: 20 }, 1); }
      if (content.processed_food) { const p = await mkPage('Farm Products', 'farm-products', false, order++); await mkBlock(p.page_id, 'hero', { headline: 'Farm Products', subtext: 'Handcrafted goods from our farm.', image_url: '', cta_text: '', cta_link: '', overlay: true, align: 'center' }, 0); await mkBlock(p.page_id, 'processed_food', { heading: 'Our Products', max_items: 20 }, 1); }
      if (content.services) { const p = await mkPage('Services', 'services', false, order++); await mkBlock(p.page_id, 'hero', { headline: 'Our Services', subtext: 'See what we offer.', image_url: '', cta_text: '', cta_link: '', overlay: true, align: 'center' }, 0); await mkBlock(p.page_id, 'services', { heading: 'What We Do', max_items: 20 }, 1); }
      if (content.marketplace) { const p = await mkPage('Shop', 'shop', false, order++); await mkBlock(p.page_id, 'hero', { headline: 'Shop Our Store', subtext: 'All of our listings in one place.', image_url: '', cta_text: '', cta_link: '', overlay: true, align: 'center' }, 0); await mkBlock(p.page_id, 'marketplace', { heading: 'All Listings', max_items: 24 }, 1); }

      const contactPage = await mkPage('Contact Us', 'contact', false, order++);
      await mkBlock(contactPage.page_id, 'hero', { headline: 'Contact Us', subtext: "We'd love to hear from you.", image_url: '', cta_text: '', cta_link: '', overlay: true, align: 'center' }, 0);
      await mkBlock(contactPage.page_id, 'contact', { heading: 'Get In Touch', custom_message: '', show_form: true }, 1);

      // Optional: scrape & copy from an existing website if requested
      if (LAVENDIR_ON && setupData.import_enabled && setupData.import_url.trim()) {
        try {
          const importUrl = setupData.import_url.trim();
          let importHost = importUrl;
          try { importHost = new URL(importUrl).hostname; } catch {}
          setBuildStatus(`Lavendir is scraping ${importHost} — this can take 15–30 seconds…`);
          const qs = new URLSearchParams({
            website_id: String(data.website_id),
            business_id: String(bid),
            url: importUrl,
            include: 'hero,about,design,nav',
          }).toString();
          const res = await apiFetch(`/api/lavendir/test-import?${qs}`, { method: 'POST' });
          if (res && res.ok === false) {
            alert(`Site created, but the import from ${importUrl} failed:\n\n${res.error || 'Unknown error'}`);
          }
        } catch (impErr) {
          alert(`Site created, but the import failed: ${impErr.message}`);
        }
      }

      setBuildStatus('Finishing up…');
      await loadPages(data.website_id);
      setActivePage('design');
    } catch (e) { alert(e.message); }
    finally {
      setSaving(false);
      setBuilding(false);
      setBuildStatus('');
    }
  };

  // ── Site update ────────────────────────────────────────────────
  const saveSite = async (updates) => {
    if (!site) return;
    setSaving(true);
    try {
      const updated = await apiFetch(`/api/website/site/${site.website_id}`, { method: 'PUT', body: JSON.stringify(updates) });
      setSite(updated);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const togglePublish = async () => { await saveSite({ is_published: !site.is_published }); };

  const deleteSite = async () => {
    if (!site) return;
    try {
      await apiFetch(`/api/website/site/${site.website_id}`, { method: 'DELETE' });
      setSite(null);
      setPages([]);
      setBlocks([]);
      setActivePage(null);
      setWebsiteSlug(null);
      setSetupMode(true);
    } catch (e) { alert(e.message); }
  };

  // ── Page CRUD ──────────────────────────────────────────────────
  const addPage = async () => {
    if (!newPageName.trim()) return;
    setSaving(true);
    try {
      const page = await apiFetch('/api/website/pages', { method: 'POST', body: JSON.stringify({ website_id: site.website_id, business_id: parseInt(BusinessID), page_name: newPageName, slug: slugify(newPageName), sort_order: pages.length }) });
      setPages(prev => [...prev, page]);
      setShowNewPage(false);
      setNewPageName('');
      await selectPage(page);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  // Fetch page templates for this business's BusinessTypeID
  const openTemplatesModal = async () => {
    setShowTemplatesModal(true);
    setTemplatesLoading(true);
    try {
      const resp = await apiFetch(`/api/website/templates?business_id=${parseInt(BusinessID)}`);
      setTemplates(resp?.templates || []);
      setTemplatesBusinessTypeId(resp?.business_type_id ?? null);
    } catch (e) {
      alert(e.message);
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Apply a template → creates page + seeded blocks, refreshes state, closes modal
  const applyTemplate = async (template_key) => {
    setTemplateApplying(template_key);
    try {
      const resp = await apiFetch('/api/website/pages/from-template', {
        method: 'POST',
        body: JSON.stringify({
          website_id: site.website_id,
          business_id: parseInt(BusinessID),
          template_key,
        }),
      });
      const newPage = resp?.page;
      if (newPage) {
        setPages(prev => [...prev, newPage]);
        setShowTemplatesModal(false);
        await selectPage(newPage);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setTemplateApplying(null);
    }
  };

  // Starter-pack key sets by BusinessTypeID. Keys match page_templates.py.
  const STARTER_PACKS = {
    1:  ['core_home_welcome', 'core_about', 'core_contact', 'assoc_join_renew', 'assoc_registry_search', 'assoc_annual_convention', 'assoc_board_of_directors'],
    8:  ['core_home_welcome', 'core_about', 'core_contact', 'farm_our_animals', 'farm_our_products', 'farm_tours'],
    9:  ['core_home_welcome', 'core_about', 'core_contact', 'restaurant_menu', 'restaurant_hours_location'],
    10: ['core_home_welcome', 'core_about', 'core_contact', 'foodhub_producers', 'foodhub_buyers'],
    11: ['core_home_welcome', 'core_about', 'core_contact', 'artisan_products', 'artisan_where_to_buy', 'commerce_store'],
    14: ['core_home_welcome', 'core_about', 'core_contact', 'coop_join', 'coop_board', 'coop_patronage'],
    15: ['core_home_welcome', 'core_about', 'core_contact', 'crafters_shows'],
    16: ['core_home_welcome', 'core_about', 'core_contact', 'mfg_capabilities', 'mfg_request_quote'],
    17: ['core_home_welcome', 'core_about', 'core_contact', 'vet_services', 'vet_team', 'vet_emergency'],
    18: ['core_home_welcome', 'core_about', 'core_contact', 'fibermill_services', 'fibermill_process'],
    19: ['core_home_welcome', 'core_about', 'core_contact', 'meatwholesale_cuts', 'meatwholesale_accounts'],
    20: ['core_home_welcome', 'core_about', 'core_contact', 'svc_what_we_do', 'svc_process'],
    21: ['core_home_welcome', 'core_about', 'core_contact', 'marina_slip_rentals', 'marina_services'],
    22: ['core_home_welcome', 'core_about', 'core_contact', 'fishery_catch', 'fishery_csf'],
    23: ['core_home_welcome', 'core_about', 'core_contact', 'fishery_catch', 'fishery_csf'],
    24: ['core_home_welcome', 'core_about', 'core_contact', 'retail_departments', 'retail_locations'],
    25: ['core_home_welcome', 'core_about', 'core_contact', 'coop_join', 'coop_board', 'coop_patronage'],
    26: ['core_home_welcome', 'core_about', 'core_contact', 'retail_departments', 'retail_locations'],
    27: ['core_home_welcome', 'core_about', 'core_contact', 'uni_programs', 'uni_extension', 'uni_research'],
    28: ['core_home_welcome', 'core_about', 'core_contact', 'resources_programs', 'resources_library'],
    29: ['core_home_welcome', 'core_about', 'core_contact', 'market_vendors', 'market_info'],
    30: ['core_home_welcome', 'core_about', 'core_contact', 'realestate_listings', 'realestate_buyers'],
    31: ['core_home_welcome', 'core_about', 'core_contact', 'herbtea_products', 'herbtea_brewing'],
    32: ['core_home_welcome', 'core_about', 'core_contact', 'transport_services', 'transport_request'],
    33: ['core_home_welcome', 'core_about', 'core_contact', 'winery_wines', 'winery_tastings'],
    34: ['core_home_welcome', 'core_about', 'core_contact', 'winery_wines', 'winery_tastings'],
    35: ['core_home_welcome', 'core_about', 'core_contact', 'hunger_get_help', 'hunger_donate'],
  };
  const getStarterPackKeys = () => STARTER_PACKS[templatesBusinessTypeId] || ['core_home_welcome', 'core_about', 'core_contact'];

  const applyStarterPack = async () => {
    const keys = getStarterPackKeys();
    if (!keys.length) return;
    if (!confirm(wb('templates_starter_confirm', { n: keys.length }))) return;
    setTemplateApplying('__starter__');
    try {
      const resp = await apiFetch('/api/website/pages/from-templates-bulk', {
        method: 'POST',
        body: JSON.stringify({
          website_id: site.website_id,
          business_id: parseInt(BusinessID),
          template_keys: keys,
        }),
      });
      const newPages = (resp?.created || []).map(c => c.page).filter(Boolean);
      if (newPages.length) {
        setPages(prev => [...prev, ...newPages]);
        setShowTemplatesModal(false);
        await selectPage(newPages[0]);
      }
      const skipped = resp?.skipped || [];
      if (skipped.length) {
        alert(`Created ${newPages.length}. Skipped ${skipped.length}: ${skipped.map(s => s.template_key).join(', ')}`);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setTemplateApplying(null);
    }
  };

  const renamePage = async (pageId) => {
    if (!editingPageName.trim()) return;
    try {
      const updated = await apiFetch(`/api/website/pages/${pageId}`, { method: 'PUT', body: JSON.stringify({ page_name: editingPageName, slug: slugify(editingPageName) }) });
      setPages(prev => prev.map(p => p.page_id === pageId ? updated : p));
      if (activePage?.page_id === pageId) setActivePage(updated);
      setEditingPageId(null);
    } catch (e) { alert(e.message); }
  };

  // Set or clear parent_page_id (null = promote to top-level)
  const setPageParent = async (pageId, parentId) => {
    try {
      const updated = await apiFetch(`/api/website/pages/${pageId}`, {
        method: 'PUT',
        body: JSON.stringify({ parent_page_id: parentId }),
      });
      setPages(prev => prev.map(p => p.page_id === pageId ? updated : p));
      if (activePage?.page_id === pageId) setActivePage(updated);
    } catch (e) { alert(e.message); }
    setNestingPageId(null);
  };

  const deletePage = async (pageId) => {
    if (!confirm(wb('delete_page_confirm'))) return;
    try {
      await apiFetch(`/api/website/pages/${pageId}`, { method: 'DELETE' });
      // Remove deleted page; children get promoted to top-level by backend
      const remaining = pages
        .filter(p => p.page_id !== pageId)
        .map(p => p.parent_page_id === pageId ? { ...p, parent_page_id: null } : p);
      setPages(remaining);
      if (activePage?.page_id === pageId) {
        if (remaining.length > 0) { await selectPage(remaining.find(p => p.is_home_page) || remaining[0]); }
        else { setActivePage('manage-pages'); setBlocks([]); }
      }
    } catch (e) { alert(e.message); }
  };

  const togglePagePublished = async (page) => {
    try {
      const updated = await apiFetch(`/api/website/pages/${page.page_id}`, { method: 'PUT', body: JSON.stringify({ is_published: !page.is_published }) });
      setPages(prev => prev.map(p => p.page_id === page.page_id ? updated : p));
      if (activePage?.page_id === page.page_id) setActivePage(updated);
    } catch (e) { alert(e.message); }
  };

  // Move page within its sibling group (same parent)
  const movePage = async (pageId, direction) => {
    const page = pages.find(p => p.page_id === pageId);
    if (!page) return;
    const siblings = pages
      .filter(p => p.parent_page_id === page.parent_page_id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const idx = siblings.findIndex(p => p.page_id === pageId);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    // Swap sort_orders between the two pages
    const swapPage = siblings[swapIdx];
    const myOrder = page.sort_order ?? idx;
    const theirOrder = swapPage.sort_order ?? swapIdx;
    // Optimistic update
    setPages(prev => prev.map(p => {
      if (p.page_id === pageId) return { ...p, sort_order: theirOrder };
      if (p.page_id === swapPage.page_id) return { ...p, sort_order: myOrder };
      return p;
    }));
    try {
      await Promise.all([
        apiFetch(`/api/website/pages/${pageId}`, { method: 'PUT', body: JSON.stringify({ sort_order: theirOrder }) }),
        apiFetch(`/api/website/pages/${swapPage.page_id}`, { method: 'PUT', body: JSON.stringify({ sort_order: myOrder }) }),
      ]);
    } catch { /* best-effort, state already updated */ }
  };

  const setHomePage = async (pageId) => {
    try {
      const updated = await apiFetch(`/api/website/pages/${pageId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_home_page: true }),
      });
      // Mark all others as not home page client-side
      setPages(prev => prev.map(p => p.page_id === pageId ? updated : { ...p, is_home_page: false }));
      if (activePage?.page_id === pageId) setActivePage(updated);
    } catch (e) { alert(e.message); }
  };

  // Accepts an array of page IDs in the desired order within their sibling group
  const reorderPages = async (orderedIds) => {
    // Optimistic update: assign new sort_orders 0,1,2,...
    setPages(prev => {
      const updated = [...prev];
      orderedIds.forEach((id, idx) => {
        const i = updated.findIndex(p => p.page_id === id);
        if (i !== -1) updated[i] = { ...updated[i], sort_order: idx };
      });
      return updated;
    });
    // Persist all in parallel (best-effort)
    try {
      await Promise.all(orderedIds.map((id, idx) =>
        apiFetch(`/api/website/pages/${id}`, { method: 'PUT', body: JSON.stringify({ sort_order: idx }) })
      ));
    } catch { /* state already updated */ }
  };

  const renameDirect = async (pageId, name) => {
    if (!name.trim()) return;
    try {
      const updated = await apiFetch(`/api/website/pages/${pageId}`, {
        method: 'PUT',
        body: JSON.stringify({ page_name: name.trim(), slug: slugify(name.trim()) }),
      });
      setPages(prev => prev.map(p => p.page_id === pageId ? updated : p));
      if (activePage?.page_id === pageId) setActivePage(updated);
    } catch (e) { alert(e.message); }
  };

  // ── Block CRUD ─────────────────────────────────────────────────
  const addBlock = async (blockType) => {
    setShowBlockPicker(false);
    if (!activePage || typeof activePage === 'string') return;
    try {
      const block = await apiFetch('/api/website/blocks', {
        method: 'POST',
        body: JSON.stringify({ page_id: activePage.page_id, block_type: blockType, block_data: defaultBlockData[blockType] || {}, sort_order: blocks.length }),
      });
      setBlocks(prev => [...prev, block]);
    } catch (e) { alert(e.message); }
  };

  const deleteBlock = async (blockId) => {
    if (!confirm(wb('canvas_delete_confirm'))) return;
    try {
      await apiFetch(`/api/website/blocks/${blockId}`, { method: 'DELETE' });
      setBlocks(prev => prev.filter(b => b.block_id !== blockId));
      if (selectedBlock?.block_id === blockId) setSelectedBlock(null);
    } catch (e) { alert(e.message); }
  };

  const moveBlock = async (index, direction) => {
    const nb = [...blocks];
    const si = index + direction;
    if (si < 0 || si >= nb.length) return;
    [nb[index], nb[si]] = [nb[si], nb[index]];
    const reordered = nb.map((b, i) => ({ ...b, sort_order: i }));
    setBlocks(reordered);
    try {
      await apiFetch('/api/website/blocks/reorder', { method: 'POST', body: JSON.stringify({ block_ids: reordered.map(b => b.block_id) }) });
    } catch { loadBlocks(activePage.page_id); }
  };

  // ── Inline field save ──────────────────────────────────────────
  const saveBlockField = useCallback(async (blockId, key, value) => {
    const block = blocksRef.current.find(b => b.block_id === blockId);
    if (!block) return;
    const newData = { ...block.block_data, [key]: value };
    setBlocks(prev => prev.map(b => b.block_id === blockId ? { ...b, block_data: newData } : b));
    setSelectedBlock(prev => prev?.block_id === blockId ? { ...prev, block_data: newData } : prev);
    try {
      await apiFetch(`/api/website/blocks/${blockId}`, { method: 'PUT', body: JSON.stringify({ block_data: newData }) });
    } catch {}
  }, []);

  const saveBlockFieldsMulti = useCallback(async (blockId, updates) => {
    const block = blocksRef.current.find(b => b.block_id === blockId);
    if (!block) return;
    const newData = { ...block.block_data, ...updates };
    setBlocks(prev => prev.map(b => b.block_id === blockId ? { ...b, block_data: newData } : b));
    setSelectedBlock(prev => prev?.block_id === blockId ? { ...prev, block_data: newData } : prev);
    try {
      await apiFetch(`/api/website/blocks/${blockId}`, { method: 'PUT', body: JSON.stringify({ block_data: newData }) });
    } catch {}
  }, []);

  const addImageToSelectedBlock = useCallback(async (file) => {
    if (!selectedBlock) return;
    try {
      const url = await uploadImageFile(file);
      const block = blocksRef.current.find(b => b.block_id === selectedBlock.block_id);
      if (!block) return;
      const raw = Array.isArray(block.block_data?.images) && block.block_data.images.length > 0
        ? block.block_data.images
        : (block.block_data?.image_url ? [block.block_data.image_url] : []);
      const existing = raw.map(img => typeof img === 'string' ? { url: img, position: block.block_data?.image_position || 'right' } : img);
      const newImg = { url, position: 'right' };
      await saveBlockFieldsMulti(selectedBlock.block_id, { images: [...existing, newImg], image_url: existing[0]?.url || url });
    } catch { alert('Image upload failed.'); }
  }, [selectedBlock, saveBlockFieldsMulti]);

  const handleMediaDrop = useCallback(async (blockId, url) => {
    const block = blocksRef.current.find(b => b.block_id === blockId);
    if (!block) return;
    const bt = block.block_type;
    if (bt === 'hero') {
      await saveBlockField(blockId, 'image_url', url);
    } else if (bt === 'about' || bt === 'content') {
      const raw = Array.isArray(block.block_data?.images) && block.block_data.images.length > 0
        ? block.block_data.images
        : (block.block_data?.image_url ? [block.block_data.image_url] : []);
      const existing = raw.map(img => typeof img === 'string' ? { url: img, position: block.block_data?.image_position || 'right' } : img);
      await saveBlockFieldsMulti(blockId, { images: [...existing, { url, position: 'right' }], image_url: existing[0]?.url || url });
    }
  }, [saveBlockField, saveBlockFieldsMulti]);

  // ── Drag-to-reorder handlers ───────────────────────────────────
  const handleDragStart = useCallback((e, idx) => {
    dragIdx.current = idx;
    setDraggingId(blocks[idx]?.block_id);
    e.dataTransfer.effectAllowed = 'move';
  }, [blocks]);

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    const nb = [...blocks];
    const dragged = nb.splice(dragIdx.current, 1)[0];
    nb.splice(idx, 0, dragged);
    dragIdx.current = idx;
    setBlocks(nb);
  }, [blocks]);

  const handleDrop = useCallback(async () => {
    setDraggingId(null);
    dragIdx.current = null;
    try {
      const reordered = blocks.map((b, i) => ({ ...b, sort_order: i }));
      setBlocks(reordered);
      await apiFetch('/api/website/blocks/reorder', { method: 'POST', body: JSON.stringify({ block_ids: reordered.map(b => b.block_id) }) });
    } catch { if (activePage?.page_id) loadBlocks(activePage.page_id); }
  }, [blocks, activePage]);

  // ── Render guards ──────────────────────────────────────────────
  const PeopleID = localStorage.getItem('people_id');

  if (loading) return (
    <AccountLayout wide Business={Business} BusinessID={BusinessID} PeopleID={PeopleID} pageTitle="Website Builder" breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Website Builder' }]}>
      <div className="p-8 text-gray-400">{wb('setup_loading')}</div>
    </AccountLayout>
  );

  // ── Build-in-progress overlay ──────────────────────────────────
  // Takes precedence over the setup wizard AND the main builder while
  // createSite is running, so the user never sees the empty Delete or
  // "Select a page" panel during the multi-second import flow.
  if (building) return (
    <AccountLayout wide Business={Business} BusinessID={BusinessID} PeopleID={PeopleID} pageTitle="Website Builder" breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Website Builder' }]}>
      <div style={{ minHeight: 'calc(100vh - 230px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
          <div style={{ width: 56, height: 56, margin: '0 auto 1.25rem', borderRadius: '50%', border: '4px solid #e5e7eb', borderTopColor: '#7C5CBF', animation: 'wb-spin 0.9s linear infinite' }} />
          <h2 className="text-lg font-bold text-gray-900 mb-1">{wb('setup_building')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {buildStatus || wb('setup_building_hint')}
          </p>
          {setupData.import_enabled && (
            <p className="text-xs text-gray-400 mt-3 italic">
              {wb('setup_building_lavendir_hint')}
            </p>
          )}
          <style>{`@keyframes wb-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </AccountLayout>
  );

  // ── Setup wizard ───────────────────────────────────────────────
  if (setupMode) return (
    <>
    <AccountLayout wide Business={Business} BusinessID={BusinessID} PeopleID={PeopleID} pageTitle="Website Builder" breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Website Builder' }]}>
      {/* Was capped at 700px, which is why the builder still looked narrow
          on the setup step even after the layout was widened. */}
      <div className="w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{wb('setup_heading')}</h1>
        <p className="text-gray-500 text-sm mb-6">{wb('setup_hint')}</p>

        <div className="bg-white rounded-xl border border-gray-100 shadow p-6 mb-4">
          <h2 className="text-base font-bold text-gray-800 mb-1">{wb('setup_design_heading')}</h2>
          <p className="text-xs text-gray-400 mb-4">{wb('setup_design_hint')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {TEMPLATES.map(t => (
              <button key={t.id}
                onClick={() => setSetupData(p => ({ ...p, primary_color: t.primary_color, secondary_color: t.secondary_color, accent_color: t.accent_color, bg_color: t.bg_color, text_color: t.text_color, nav_text_color: t.nav_text_color, footer_bg_color: t.footer_bg_color, font_family: t.font_family }))}
                className={`rounded-xl border-2 overflow-hidden text-left transition-all ${setupData.primary_color === t.primary_color ? 'border-[#3D6B34] shadow-md' : 'border-gray-100 hover:border-gray-300'}`}>
                <div className="flex h-8">{[t.primary_color, t.secondary_color, t.accent_color, t.bg_color].map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}</div>
                <div className="px-2 py-1" style={{ background: t.primary_color }}><span className="text-xs font-bold" style={{ color: t.nav_text_color, fontFamily: t.font_family }}>{t.name}</span></div>
                <div className="px-2 py-1.5" style={{ background: t.bg_color }}><span className="text-xs" style={{ color: t.text_color, fontFamily: t.font_family }}>{wb('setup_sample_text')}</span></div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow p-6 flex flex-col gap-3">
          <FormField label={wb('setup_site_name')}>
            <input className={inp} value={setupData.site_name} placeholder={wb('setup_site_name_ph')}
              onChange={e => setSetupData(p => ({ ...p, site_name: e.target.value }))} />
          </FormField>
          <FormField label={`${wb('slug_label')} (${wb('slug_hint', { url: `${SITE_BASE_URL}/sites/${setupData.slug || 'your-farm'}` })})`}>
            <input className={inp} value={setupData.slug} placeholder={wb('setup_slug_ph')}
              onChange={e => setSetupData(p => ({ ...p, slug: slugify(e.target.value) }))} />
          </FormField>
          <FormField label={wb('setup_tagline')}>
            <input className={inp} value={setupData.tagline} placeholder={wb('setup_tagline_ph')}
              onChange={e => setSetupData(p => ({ ...p, tagline: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={wb('setup_phone')}>
              <input className={inp} value={setupData.phone} onChange={e => setSetupData(p => ({ ...p, phone: e.target.value }))} />
            </FormField>
            <FormField label={wb('setup_email')}>
              <input className={inp} value={setupData.email} onChange={e => setSetupData(p => ({ ...p, email: e.target.value }))} />
            </FormField>
          </div>
          {/* Copying an existing site runs through Lavendir's scraper, so it
              goes when she does. */}
          <div className="border-t border-gray-100 pt-3 mt-1" hidden={!LAVENDIR_ON}>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!setupData.import_enabled}
                onChange={e => setSetupData(p => ({ ...p, import_enabled: e.target.checked }))}
                className="mt-1"
                style={{ width: 16, height: 16, accentColor: '#7C5CBF' }}
              />
              <span className="text-sm text-gray-700">
                <span className="font-semibold">{wb('setup_import')}</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {wb('setup_import_hint')}
                </span>
              </span>
            </label>
            {setupData.import_enabled && (
              <div className="mt-3">
                <input
                  className={inp}
                  type="url"
                  value={setupData.import_url}
                  placeholder={wb('setup_import_url_ph')}
                  onChange={e => setSetupData(p => ({ ...p, import_url: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">{wb('setup_import_url_hint')}</p>

                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-900 mb-1.5">{wb('setup_legal_heading')}</p>
                  <p className="text-xs text-amber-900 leading-relaxed mb-2">
                    {wb('setup_legal_warning')}
                  </p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!setupData.import_legal_ack}
                      onChange={e => setSetupData(p => ({ ...p, import_legal_ack: e.target.checked }))}
                      className="mt-0.5"
                      style={{ width: 16, height: 16, accentColor: '#7C5CBF' }}
                    />
                    <span className="text-xs text-amber-900 leading-relaxed">
                      {wb('setup_legal_ack')}
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <button onClick={createSite} disabled={saving || !setupData.site_name || !setupData.slug || (setupData.import_enabled && (!setupData.import_url.trim() || !setupData.import_legal_ack))}
            className="regsubmit2 w-full py-3 text-base mt-2 disabled:opacity-50">
            {saving ? (setupData.import_enabled ? wb('setup_creating_import') : wb('setup_creating')) : wb('setup_create_btn')}
          </button>
        </div>
      </div>
    </AccountLayout>
    {LAVENDIR_ON && paramView === 'lavendir' && (
      <WebsiteAIAgent
        websiteId={null}
        businessId={parseInt(BusinessID)}
        currentView="setup"
        autoOpen={true}
      />
    )}
    </>
  );

  // ── Main builder UI ────────────────────────────────────────────
  const isDesign      = activePage === 'design';
  const isSettings    = activePage === 'settings';
  const isDelete      = activePage === 'delete';
  const isManagePages = activePage === 'manage-pages';
  const isPage        = activePage && typeof activePage === 'object';

  // ── CANVAS PAGE EDITOR ─────────────────────────────────────────
  if (isPage) return (
    <>
      <AccountLayout wide Business={Business} BusinessID={BusinessID} PeopleID={PeopleID} pageTitle="Website Builder" breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Website Builder' }]}>
        <div className="-m-6 flex flex-col" style={{ height: 'calc(100vh - 72px)', overflow: 'hidden' }}>

          {/* ── Top bar ── */}
          <div style={{ height: 48, flexShrink: 0, background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{site.site_name}</span>
              <span style={{ color: '#9ca3af', fontSize: 13, marginLeft: 8 }}>/ {activePage.page_name}</span>
              <span className={`ml-3 text-xs font-medium px-2 py-0.5 rounded-full ${activePage.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {activePage.is_published ? wb('page_visible_badge') : wb('page_hidden_badge')}
              </span>
            </div>

            {/* Center note */}
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: '#9ca3af', fontStyle: 'italic', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              {wb('topbar_autosave')}
            </div>

            {/* Responsive preview */}
            <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              {[['desktop','🖥'],['tablet','📱'],['mobile','📲']].map(([id, icon]) => (
                <button key={id} onClick={() => setPreviewMode(id)}
                  style={{ padding: '4px 10px', background: previewMode === id ? '#3D6B34' : '#fff', color: previewMode === id ? '#fff' : '#6b7280', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                  {icon}
                </button>
              ))}
            </div>

            <button onClick={() => window.open(`/sites/${site.slug}?preview=1`, '_blank')}
              style={{ padding: '5px 14px', fontSize: 13, fontWeight: 500, color: '#374151', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
              {wb('topbar_preview')}
            </button>
            {site.is_published && (
              <a href={`/sites/${site.slug}`} target="_blank" rel="noreferrer"
                style={{ padding: '5px 14px', fontSize: 13, fontWeight: 500, color: '#3D6B34', background: '#fff', border: '1px solid #3D6B34', borderRadius: 8, cursor: 'pointer', textDecoration: 'none' }}>
                {wb('topbar_view_live')}
              </a>
            )}
            <button onClick={togglePublish} disabled={saving}
              style={{ padding: '5px 14px', fontSize: 13, fontWeight: 700, color: '#fff', background: site.is_published ? '#C0382B' : '#819360', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {site.is_published ? wb('topbar_unpublish') : wb('topbar_publish')}
            </button>
          </div>

          {/* ── Body ── */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* ── Left icon tabs (52px) ── */}
            <div style={{ width: 52, flexShrink: 0, background: '#f9fafb', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 4 }}>
              {[[`pages`,'📄',wb('tab_pages')],[`blocks`,'➕',wb('tab_blocks')]].map(([id, icon, label]) => (
                <button key={id} onClick={() => { if (activeTab === id) { setSidebarOpen(o => !o); } else { setActiveTab(id); setSidebarOpen(true); } }} title={label}
                  style={{ width: 40, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeTab === id && sidebarOpen ? '#e0f2fe' : 'transparent', color: activeTab === id && sidebarOpen ? '#0369a1' : '#6b7280' }}>
                  {icon}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button onClick={() => setActivePage('manage-pages')} title={wb('tab_manage_pages')}
                style={{ width: 40, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 18, background: 'transparent', color: '#6b7280', marginBottom: 4 }}>
                📋
              </button>
              <button onClick={() => setActivePage('design')} title={wb('tab_design')}
                style={{ width: 40, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 18, background: 'transparent', color: '#6b7280', marginBottom: 4 }}>
                🎨
              </button>
              <button onClick={() => setActivePage('settings')} title={wb('tab_settings')}
                style={{ width: 40, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 18, background: 'transparent', color: '#6b7280', marginBottom: 8 }}>
                ⚙️
              </button>
            </div>

            {/* ── Left content panel (240px, collapsible) ── */}
            <div style={{ width: sidebarOpen ? 240 : 0, flexShrink: 0, background: '#fff', borderRight: sidebarOpen ? '1px solid #e5e7eb' : 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'width 0.18s ease' }}>

              {/* Pages tab */}
              {activeTab === 'pages' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: 8, minWidth: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 8px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{wb('tab_pages')}</span>
                    <button onClick={() => setSidebarOpen(false)} title={wb('sidebar_close')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
                  </div>
                  {(() => {
                    // Build ordered tree: top-level pages, each followed by their children
                    const topLevel = pages.filter(p => !p.parent_page_id);
                    const childrenOf = parentId => pages.filter(p => p.parent_page_id === parentId);
                    const tree = [];
                    topLevel.forEach(p => {
                      tree.push({ page: p, depth: 0 });
                      if (!collapsedParents.has(p.page_id)) {
                        childrenOf(p.page_id).forEach(c => tree.push({ page: c, depth: 1 }));
                      }
                    });
                    return tree.map(({ page, depth }) => (
                      <div key={page.page_id} style={{ borderRadius: 8, marginBottom: 2, marginLeft: depth === 1 ? 12 : 0 }}>
                        {/* Parent picker shown inline when this page is being nested */}
                        {nestingPageId === page.page_id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                            <span style={{ fontSize: 11, color: '#3b82f6', whiteSpace: 'nowrap' }}>{wb('sidebar_nest_under')}</span>
                            <select autoFocus size={1}
                              style={{ flex: 1, fontSize: 11, border: '1px solid #93c5fd', borderRadius: 4, padding: '1px 3px' }}
                              defaultValue=""
                              onChange={e => { if (e.target.value) setPageParent(page.page_id, parseInt(e.target.value)); }}>
                              <option value="" disabled>{wb('sidebar_pick_parent')}</option>
                              {topLevel.filter(p => p.page_id !== page.page_id).map(p => (
                                <option key={p.page_id} value={p.page_id}>{p.page_name}</option>
                              ))}
                            </select>
                            <button onClick={() => setNestingPageId(null)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, lineHeight: 1, padding: '0 2px' }}>×</button>
                          </div>
                        ) : editingPageId === page.page_id ? (
                          <div style={{ display: 'flex', gap: 4, padding: '4px 6px' }}>
                            <input autoFocus value={editingPageName}
                              onChange={e => setEditingPageName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') renamePage(page.page_id); if (e.key === 'Escape') setEditingPageId(null); }}
                              onBlur={() => renamePage(page.page_id)}
                              style={{ flex: 1, border: '1px solid #3b82f6', borderRadius: 6, padding: '3px 6px', fontSize: 12 }} />
                            <button onMouseDown={e => e.preventDefault()} onClick={() => renamePage(page.page_id)} style={{ fontSize: 11, padding: '2px 6px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✓</button>
                          </div>
                        ) : (
                          <div
                            onClick={() => selectPage(page)}
                            style={{ display: 'flex', alignItems: 'center', padding: '7px 8px', borderRadius: 8, cursor: 'pointer', background: activePage?.page_id === page.page_id ? '#eff6ff' : 'transparent', gap: 4 }}
                            className="group"
                          >
                            {/* Expand/collapse toggle for parent pages with children */}
                            {depth === 0 && childrenOf(page.page_id).length > 0 ? (
                              <button
                                onClick={e => { e.stopPropagation(); toggleCollapsed(page.page_id); }}
                                title={collapsedParents.has(page.page_id) ? 'Expand' : 'Collapse'}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: '#6b7280', fontSize: 10, lineHeight: 1, flexShrink: 0, width: 14, textAlign: 'center' }}>
                                {collapsedParents.has(page.page_id) ? '▸' : '▾'}
                              </button>
                            ) : depth === 0 ? (
                              <span style={{ width: 14, flexShrink: 0 }} />
                            ) : null}
                            {/* Depth indicator for children */}
                            {depth === 1 && <span style={{ color: '#d1d5db', fontSize: 10, flexShrink: 0 }}>└</span>}
                            <span style={{ flex: 1, fontSize: 13, fontWeight: activePage?.page_id === page.page_id ? 600 : 400, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {page.page_name}
                            </span>
                            {!page.is_published && <span style={{ fontSize: 9, color: '#9ca3af', flexShrink: 0 }}>hidden</span>}
                            <div style={{ display: 'flex', gap: 1, flexShrink: 0, opacity: 0 }} className="group-actions">
                              <button onClick={e => { e.stopPropagation(); setEditingPageId(page.page_id); setEditingPageName(page.page_name); }}
                                style={{ padding: '1px 4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#6b7280' }} title="Rename">✏️</button>
                              {/* Nest (top-level → child) or Promote (child → top-level) */}
                              {depth === 0 && topLevel.length > 1 && childrenOf(page.page_id).length === 0 && (
                                <button onClick={e => { e.stopPropagation(); setNestingPageId(page.page_id); }}
                                  style={{ padding: '1px 4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#6b7280' }} title="Nest under another page">→</button>
                              )}
                              {depth === 1 && (
                                <button onClick={e => { e.stopPropagation(); setPageParent(page.page_id, null); }}
                                  style={{ padding: '1px 4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#6b7280' }} title="Promote to top-level">←</button>
                              )}
                              <button onClick={e => { e.stopPropagation(); togglePagePublished(page); }}
                                style={{ padding: '1px 4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }} title={page.is_published ? 'Hide from nav' : 'Show in nav'}>
                                {page.is_published ? '👁' : '🚫'}
                              </button>
                              <button onClick={e => { e.stopPropagation(); deletePage(page.page_id); }}
                                style={{ padding: '1px 4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#C0382B' }} title="Delete">🗑</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ));
                  })()}

                  {showNewPage ? (
                    <div style={{ display: 'flex', gap: 4, padding: '4px 6px', marginTop: 4 }}>
                      <input autoFocus value={newPageName} placeholder={wb('sidebar_page_name_ph')}
                        onChange={e => setNewPageName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addPage(); if (e.key === 'Escape') { setShowNewPage(false); setNewPageName(''); } }}
                        style={{ flex: 1, border: '1px solid #3b82f6', borderRadius: 6, padding: '4px 8px', fontSize: 12 }} />
                      <button onClick={addPage} style={{ padding: '2px 8px', background: '#3D6B34', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>+</button>
                      <button onClick={() => { setShowNewPage(false); setNewPageName(''); }} style={{ padding: '2px 6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9ca3af' }}>×</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button onClick={() => setShowNewPage(true)}
                        style={{ flex: 1, padding: '6px 10px', background: 'none', border: '1px dashed #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#6b7280', textAlign: 'left' }}>
                        {wb('sidebar_add_page')}
                      </button>
                      <button onClick={openTemplatesModal} title="Start from a page template"
                        style={{ padding: '6px 10px', background: '#f3f0ff', border: '1px solid #d8ccf5', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#7C5CBF', fontWeight: 600 }}>
                        {wb('sidebar_template')}
                      </button>
                    </div>
                  )}
                  <button onClick={() => setActivePage('manage-pages')}
                    style={{ width: '100%', marginTop: 10, padding: '6px 10px', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 11, color: '#6b7280', textAlign: 'center' }}>
                    {wb('sidebar_manage_pages')}
                  </button>
                  <style>{`.group:hover .group-actions { opacity: 1 !important; }`}</style>
                </div>
              )}

              {/* Blocks tab */}
              {activeTab === 'blocks' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: 8, minWidth: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 8px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{wb('sidebar_add_widget')}</span>
                    <button onClick={() => setSidebarOpen(false)} title={wb('sidebar_close')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {BLOCK_TYPES.map(bt => (
                      <button key={bt.type} onClick={() => addBlock(bt.type)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 6px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <span style={{ display: 'flex', color: '#3D6B34' }}>{bt.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 500, color: '#374151', lineHeight: 1.2 }}>{bt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Media tab */}
              {activeTab === 'media' && (
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px 4px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{wb('sidebar_media_library')}</span>
                    <button onClick={() => setSidebarOpen(false)} title={wb('sidebar_close')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <MediaPanel siteId={site?.website_id} />
                  </div>
                </div>
              )}
            </div>

            {/* ── Canvas ── */}
            <main
              ref={canvasRef}
              onClick={() => setSelectedBlock(null)}
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                background: '#e5e7eb',
                padding: '8px',
              }}
            >
              <div style={{
                margin: '0 auto',
                background: site?.bg_image_url
                  ? `url(${site.bg_image_url}) center/cover no-repeat`
                  : (site?.bg_gradient || site?.screen_background_color || site?.bg_color || '#fff'),
                color: site?.text_color || '#111827',
                fontFamily: site?.font_family || 'inherit',
                boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
                borderRadius: 4,
                overflow: 'hidden',
                maxWidth: previewMode === 'tablet' ? 768 : previewMode === 'mobile' ? 390 : '100%',
              }}>
                {/* Typography + image CSS — re-renders when site changes; applies to all .rte-body elements */}
                <style>{buildRteBodyCss(site) + '\n' + buildImageCss(site)}</style>

                {/* Simulated site header */}
                <CanvasSiteHeader site={site} pages={pages} isMobile={previewMode === 'mobile' || previewMode === 'tablet'} />

                {/* Body band centered at body_bg_width, filled with page_background_color.
                    Outside the band shows the screen background (matches header/footer sides). */}
                <div style={{ display: 'flex', justifyContent: 'center', background: 'transparent' }}>
                <div style={{ width: '100%', maxWidth: site?.body_bg_width || '100%', background: site?.page_background_color || 'transparent' }}>
                {/* Page blocks */}
                {blocks.length === 0 ? (
                  <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af', background: site?.page_background_color || site?.screen_background_color || site?.bg_color || '#fff' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📄</div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: '#374151' }}>{wb('canvas_empty')}</div>
                    <div style={{ fontSize: 13, marginBottom: 20 }}>{wb('canvas_empty_hint')}</div>
                    <button onClick={() => { setActiveTab('blocks'); setSidebarOpen(true); }}
                      style={{ padding: '8px 20px', background: site?.primary_color || '#3D6B34', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                      {wb('canvas_add_first')}
                    </button>
                  </div>
                ) : (
                  blocks.map((block, idx) => (
                    <CanvasBlock
                      key={block.block_id}
                      block={block}
                      index={idx}
                      isSelected={selectedBlock?.block_id === block.block_id}
                      onSelect={setSelectedBlock}
                      onDelete={deleteBlock}
                      onMoveUp={() => moveBlock(idx, -1)}
                      onMoveDown={() => moveBlock(idx, 1)}
                      isFirst={idx === 0}
                      isLast={idx === blocks.length - 1}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      isDragging={draggingId === block.block_id}
                      site={site}
                      businessId={parseInt(BusinessID)}
                      pages={pages}
                      onFieldSave={(key, val) => saveBlockField(block.block_id, key, val)}
                    />
                  ))
                )}
                </div>
                </div>
                {/* end body band */}

                {/* Simulated site footer */}
                <CanvasSiteFooter site={site} />
              </div>
            </main>

            {/* ── Right block editor panel (not shown for about/content/livestock — editing is inline on canvas) ── */}
            {selectedBlock && !['about', 'content', 'livestock', 'studs', 'testimonials', 'testimonial_random'].includes(selectedBlock.block_type) && (
              <div key={selectedBlock.block_id} style={{ width: 280, flexShrink: 0, background: '#fff', borderLeft: '1px solid #e5e7eb', overflowY: 'auto' }}>
                <BlockEditorPanel
                  block={selectedBlock}
                  onFieldSave={(key, val) => saveBlockField(selectedBlock.block_id, key, val)}
                  onFieldsSave={(updates) => saveBlockFieldsMulti(selectedBlock.block_id, updates)}
                  site={site}
                  businessId={parseInt(BusinessID)}
                  pages={pages}
                />
              </div>
            )}
          </div>
        </div>
      </AccountLayout>

      {site && LAVENDIR_ON && (
        <WebsiteAIAgent
          websiteId={site.website_id}
          businessId={parseInt(BusinessID)}
          currentView={activePage?.page_name || 'page'}
          autoOpen={paramView === 'lavendir'}
        />
      )}
    </>
  );

  // ── Design / Settings / Delete / No-page views ─────────────────
  return (
    <>
    <AccountLayout wide Business={Business} BusinessID={BusinessID} PeopleID={PeopleID} pageTitle="Website Builder" breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Website Builder' }]}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{site.site_name}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {site.is_published
              ? <span className="text-green-600 font-medium">{wb('topbar_published_badge')}</span>
              : <span className="text-gray-400">{wb('topbar_unpublished_badge')}</span>}
            <span className="ml-2">{SITE_BASE_URL}/sites/{site.slug}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            {[
              { id: 'desktop', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, title: 'Desktop' },
              { id: 'tablet',  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, title: 'Tablet' },
              { id: 'mobile',  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, title: 'Mobile' },
            ].map(({ id, icon, title }) => (
              <button key={id} onClick={() => setPreviewMode(id)} title={title}
                className={`px-2.5 py-2 transition-colors ${previewMode === id ? 'bg-[#3D6B34] text-white' : 'text-gray-400 hover:bg-gray-50'}`}>
                {icon}
              </button>
            ))}
          </div>
          <button onClick={() => window.open(`/sites/${site.slug}?preview=1`, '_blank')}
            className="text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            {wb('topbar_preview')}
          </button>
          {site.is_published && (
            <a href={`/sites/${site.slug}`} target="_blank" rel="noreferrer"
              className="text-sm font-medium text-[#3D6B34] border border-[#3D6B34]/30 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors">
              {wb('topbar_view_live')}
            </a>
          )}
          <button onClick={togglePublish} disabled={saving}
            className={`text-sm font-bold px-5 py-2 rounded-lg transition-colors ${site.is_published ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-[#3D6B34] text-white hover:bg-[#2d5226]'}`}>
            {site.is_published ? wb('topbar_unpublish') : wb('topbar_publish')}
          </button>
        </div>
      </div>

      <div style={{ minHeight: 'calc(100vh - 230px)' }}>
        <div className={`transition-all mx-auto ${previewMode === 'tablet' ? 'max-w-[768px]' : previewMode === 'mobile' ? 'max-w-[390px]' : 'max-w-none'}`}>
          {isDesign && <DesignView site={site} onSave={saveSite} saving={saving} onDelete={deleteSite} pages={pages} />}
          {isSettings && <SettingsView site={site} onSave={saveSite} saving={saving} onDelete={deleteSite} />}
          {isManagePages && (
            <PageManagementView
              pages={pages}
              site={site}
              onMovePage={movePage}
              onReorderPages={reorderPages}
              onTogglePublished={togglePagePublished}
              onSetHome={setHomePage}
              onDelete={deletePage}
              onSetParent={setPageParent}
              onRename={renameDirect}
              onAddPage={async (name, parentId, isNavHeading = false) => {
                if (!name.trim()) return;
                setSaving(true);
                try {
                  const siblings = pages.filter(p => p.parent_page_id === (parentId || null));
                  const page = await apiFetch('/api/website/pages', {
                    method: 'POST',
                    body: JSON.stringify({
                      website_id: site.website_id,
                      business_id: parseInt(BusinessID),
                      page_name: name.trim(),
                      slug: slugify(name.trim()),
                      sort_order: siblings.length,
                      parent_page_id: parentId || null,
                      is_nav_heading: isNavHeading,
                    }),
                  });
                  setPages(prev => [...prev, page]);
                } catch (e) { alert(e.message); }
                finally { setSaving(false); }
              }}
              onSelectPage={page => { selectPage(page); }}
            />
          )}
          {isDelete && (
            <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6 max-w-lg">
              <h2 className="text-lg font-bold text-red-700 mb-2">{wb('delete_site_btn')}</h2>
              <p className="text-sm text-gray-600 mb-4">{wb('delete_site_body_full', { name: site.site_name })}</p>
              <button onClick={deleteSite} className="px-6 py-2 text-white font-bold rounded-xl transition-colors" style={{ background: '#C0382B' }}>
                {wb('delete_site_confirm_btn')}
              </button>
            </div>
          )}
          {!isDesign && !isSettings && !isDelete && !isManagePages && (
            <div className="flex items-center justify-center bg-white rounded-xl border border-gray-100 text-gray-400 p-12">
              {wb('canvas_select_page')}
            </div>
          )}
        </div>

      </div>
    </AccountLayout>

    {site && LAVENDIR_ON && (
      <WebsiteAIAgent
        websiteId={site.website_id}
        businessId={parseInt(BusinessID)}
        currentView={isDesign ? 'design' : isSettings ? 'settings' : isManagePages ? 'pages' : 'page'}
        autoOpen={paramView === 'lavendir'}
      />
    )}

    {showTemplatesModal && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
           onClick={() => !templateApplying && setShowTemplatesModal(false)}>
        <div onClick={e => e.stopPropagation()}
             style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 880, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{wb('templates_heading')}</h2>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                {wb('templates_hint_full')}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {templates.length > 0 && (
                <button onClick={applyStarterPack} disabled={!!templateApplying}
                  style={{
                    background: templateApplying === '__starter__' ? '#9ca3af' : '#7C5CBF',
                    color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px',
                    fontSize: 13, fontWeight: 600, cursor: templateApplying ? 'not-allowed' : 'pointer',
                  }}>
                  {templateApplying === '__starter__' ? wb('templates_applying') : wb('templates_starter')}
                </button>
              )}
              <button onClick={() => !templateApplying && setShowTemplatesModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af', lineHeight: 1, padding: 4 }}>×</button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {templatesLoading ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>{wb('templates_loading')}</div>
            ) : templates.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <p style={{ margin: 0 }}>{wb('templates_none_full')}{templatesBusinessTypeId != null ? ` (BusinessTypeID ${templatesBusinessTypeId})` : ''}</p>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{wb('templates_blank_hint')}</p>
              </div>
            ) : (() => {
              const bySection = {};
              templates.forEach(t => {
                const s = t.section || 'Other';
                if (!bySection[s]) bySection[s] = [];
                bySection[s].push(t);
              });
              return Object.keys(bySection).sort().map(section => (
                <div key={section} style={{ marginBottom: 22 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: '#7C5CBF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{section}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                    {bySection[section].map(tpl => {
                      const applying = templateApplying === tpl.key;
                      return (
                        <button key={tpl.key} onClick={() => applyTemplate(tpl.key)} disabled={!!templateApplying}
                          style={{ textAlign: 'left', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', background: applying ? '#f3f0ff' : '#fff', cursor: templateApplying ? 'wait' : 'pointer', transition: 'all 0.1s' }}
                          onMouseEnter={e => { if (!templateApplying) e.currentTarget.style.borderColor = '#7C5CBF'; }}
                          onMouseLeave={e => { if (!templateApplying) e.currentTarget.style.borderColor = '#e5e7eb'; }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', marginBottom: 3 }}>{tpl.name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>/{tpl.slug}</div>
                          {tpl.meta_description && (
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 5, lineHeight: 1.4 }}>{tpl.meta_description}</div>
                          )}
                          {applying && <div style={{ fontSize: 11, color: '#7C5CBF', marginTop: 6, fontWeight: 600 }}>{wb('templates_creating')}</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ── TopBarEditor: mini WYSIWYG for the top bar HTML content ──────
function TopBarEditor({ value, onChange, bgColor, paletteColors = [], pages = [] }) {
  const ref = useRef(null);
  const editing = useRef(false);
  const savedRange = useRef(null);
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkMode, setLinkMode] = useState('url'); // 'url' | 'page'
  const [linkPageSlug, setLinkPageSlug] = useState('');

  useEffect(() => {
    if (ref.current && !editing.current) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && ref.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
  };

  const emit = () => { if (ref.current) onChange(ref.current.innerHTML); };

  const cmd = (command, val = null) => {
    restoreSelection();
    document.execCommand(command, false, val);
    emit();
  };

  const wrapSpan = (style) => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || !savedRange.current || sel.isCollapsed) return;
    // Use execCommand for color and fontSize — more reliable than surroundContents
    if (style.color) {
      document.execCommand('foreColor', false, style.color);
    }
    if (style.fontSize) {
      // execCommand fontSize only accepts 1-7; use a sentinel then fix the elements
      document.execCommand('fontSize', false, '7');
      ref.current?.querySelectorAll('font[size="7"]').forEach(f => {
        const span = document.createElement('span');
        span.style.fontSize = style.fontSize;
        span.innerHTML = f.innerHTML;
        f.replaceWith(span);
      });
    }
    if (style.fontFamily) {
      document.execCommand('fontName', false, style.fontFamily);
    }
    emit();
  };

  const insertLink = () => {
    if (linkMode === 'page') { insertPageLink(); return; }
    restoreSelection();
    let href = linkUrl.trim();
    if (!href) return;
    if (!href.startsWith('http') && !href.startsWith('mailto:')) {
      href = href.includes('@') ? `mailto:${href}` : `https://${href}`;
    }
    const displayText = linkText.trim() || (savedRange.current && !savedRange.current.collapsed ? savedRange.current.toString() : href);
    const a = document.createElement('a');
    a.href = href;
    a.textContent = displayText;
    if (savedRange.current && !savedRange.current.collapsed) {
      savedRange.current.deleteContents();
      savedRange.current.insertNode(a);
    } else {
      ref.current?.focus();
      document.execCommand('insertHTML', false, a.outerHTML);
    }
    emit();
    setShowLink(false);
    setLinkUrl('');
    setLinkText('');
  };

  const insertPageLink = () => {
    if (!linkPageSlug) return;
    restoreSelection();
    const sel = window.getSelection();
    const page = pages.find(p => p.slug === linkPageSlug);
    const displayText = linkText.trim() || (savedRange.current && !savedRange.current.collapsed ? savedRange.current.toString() : (page?.page_name || linkPageSlug));
    const a = document.createElement('a');
    a.href = '#';
    a.setAttribute('data-page-slug', linkPageSlug);
    a.textContent = displayText;
    if (savedRange.current && !savedRange.current.collapsed) {
      savedRange.current.deleteContents();
      savedRange.current.insertNode(a);
    } else {
      ref.current?.focus();
      document.execCommand('insertHTML', false, a.outerHTML);
    }
    emit();
    setShowLink(false);
    setLinkPageSlug('');
    setLinkText('');
  };

  const ToolBtn = ({ onMD, children, title, style = {} }) => (
    <button
      onMouseDown={e => { e.preventDefault(); saveSelection(); onMD(); }}
      title={title}
      style={{ height: 26, minWidth: 26, padding: '0 5px', border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', ...style }}>
      {children}
    </button>
  );

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: 8, overflow: 'visible', position: 'relative' }}>
      {/* Toolbar */}
      <div style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '5px 8px', display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', borderRadius: '8px 8px 0 0' }}>

        {/* Font family */}
        <select
          onMouseDown={saveSelection}
          onChange={e => { wrapSpan({ fontFamily: e.target.value }); e.target.value = ''; }}
          defaultValue=""
          style={{ fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 4, padding: '2px 4px', background: '#fff', maxWidth: 120, height: 26 }}>
          <option value="">Font…</option>
          {WEB_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        {/* Font size */}
        <select
          onMouseDown={saveSelection}
          onChange={e => { wrapSpan({ fontSize: e.target.value }); e.target.value = ''; }}
          defaultValue=""
          style={{ fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 4, padding: '2px 4px', background: '#fff', width: 64, height: 26 }}>
          <option value="">Size…</option>
          {['8px','9px','10px','11px','12px','13px','14px','15px','16px','18px','20px','22px','24px','28px','32px'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />

        {/* Bold */}
        <ToolBtn onMD={() => cmd('bold')} title="Bold" style={{ fontWeight: 700 }}>B</ToolBtn>
        {/* Italic */}
        <ToolBtn onMD={() => cmd('italic')} title="Italic" style={{ fontStyle: 'italic' }}>I</ToolBtn>
        {/* Underline */}
        <ToolBtn onMD={() => cmd('underline')} title="Underline" style={{ textDecoration: 'underline' }}>U</ToolBtn>

        <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />

        {/* Text color */}
        <PaletteColorPicker
          paletteColors={paletteColors}
          onColor={hex => { saveSelection(); wrapSpan({ color: hex }); }}
        />

        <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />

        {/* Link button */}
        <div style={{ position: 'relative' }}>
          <ToolBtn onMD={() => { saveSelection(); setShowLink(p => !p); }} title="Insert link / email">
            🔗
          </ToolBtn>
          {showLink && (
            <div style={{ position: 'absolute', top: 30, left: 0, zIndex: 200, background: '#fff', border: '1px solid #d1d5db', borderRadius: 10, padding: 14, boxShadow: '0 6px 24px rgba(0,0,0,0.15)', width: 300 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: '#111827' }}>Insert Link</div>
              <div style={{ display: 'flex', gap: 0, marginBottom: 10, borderRadius: 6, overflow: 'hidden', border: '1px solid #d1d5db' }}>
                <button onClick={() => setLinkMode('url')}
                  style={{ flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: linkMode === 'url' ? '#3D6B34' : '#f9fafb', color: linkMode === 'url' ? '#fff' : '#6b7280' }}>
                  URL / Email
                </button>
                <button onClick={() => setLinkMode('page')}
                  style={{ flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 600, border: 'none', borderLeft: '1px solid #d1d5db', cursor: 'pointer',
                    background: linkMode === 'page' ? '#3D6B34' : '#f9fafb', color: linkMode === 'page' ? '#fff' : '#6b7280' }}>
                  Site Page
                </button>
              </div>
              {linkMode === 'url' ? (
                <>
                  <input
                    placeholder="URL (https://…) or email address"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && insertLink()}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 8px', fontSize: 12, marginBottom: 6, boxSizing: 'border-box' }}
                    autoFocus
                  />
                  <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6 }}>
                    Tip: entering an email address automatically creates a mailto: link.
                  </div>
                </>
              ) : (
                <select
                  value={linkPageSlug}
                  onChange={e => setLinkPageSlug(e.target.value)}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 8px', fontSize: 12, marginBottom: 6, boxSizing: 'border-box' }}>
                  <option value="">— Choose a page —</option>
                  {(() => {
                    const all = pages || [];
                    const byOrder = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0);
                    const tops = all.filter(p => !p.parent_page_id).sort(byOrder);
                    const childrenOf = (id) => all.filter(p => p.parent_page_id === id).sort(byOrder);
                    const rows = [];
                    tops.forEach(p => {
                      const kids = childrenOf(p.page_id);
                      const isHeading = p.is_nav_heading || (kids.length > 0 && !p.slug);
                      if (isHeading) {
                        rows.push(<option key={`h-${p.page_id}`} value="" disabled style={{ color: '#94a3b8', fontWeight: 700 }}>{p.page_name}</option>);
                      } else if (p.slug) {
                        rows.push(<option key={p.page_id} value={p.slug}>{p.page_name}</option>);
                      }
                      kids.forEach(c => {
                        if (!c.slug) return;
                        rows.push(<option key={c.page_id} value={c.slug}>{`\u00A0\u00A0\u00A0\u00A0— ${c.page_name}`}</option>);
                      });
                    });
                    return rows;
                  })()}
                </select>
              )}
              <input
                placeholder="Display text (optional — uses selection)"
                value={linkText}
                onChange={e => setLinkText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && insertLink()}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 8px', fontSize: 12, marginBottom: 10, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={insertLink}
                  disabled={linkMode === 'url' ? !linkUrl.trim() : !linkPageSlug}
                  style={{ flex: 1, padding: '6px 0', background: (linkMode === 'url' ? linkUrl.trim() : linkPageSlug) ? '#3D6B34' : '#9ca3af', color: '#fff', border: 'none', borderRadius: 6, cursor: (linkMode === 'url' ? linkUrl.trim() : linkPageSlug) ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600 }}>
                  Insert
                </button>
                <button onClick={() => { setShowLink(false); setLinkUrl(''); setLinkText(''); setLinkPageSlug(''); setLinkMode('url'); }}
                  style={{ flex: 1, padding: '6px 0', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />

        {/* Text alignment */}
        <ToolBtn onMD={() => cmd('justifyLeft')} title="Align left" style={{ fontSize: 11 }}>⫷</ToolBtn>
        <ToolBtn onMD={() => cmd('justifyCenter')} title="Align center" style={{ fontSize: 11 }}>⫿</ToolBtn>
        <ToolBtn onMD={() => cmd('justifyRight')} title="Align right" style={{ fontSize: 11 }}>⫸</ToolBtn>

        <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />

        {/* Remove formatting */}
        <ToolBtn onMD={() => cmd('removeFormat')} title="Clear formatting" style={{ color: '#6b7280', fontSize: 11 }}>
          ✕ fmt
        </ToolBtn>
      </div>

      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => { editing.current = true; }}
        onBlur={() => { editing.current = false; emit(); }}
        onKeyUp={emit}
        onPaste={pastePlainText}
        style={{
          padding: '8px 12px',
          minHeight: 44,
          outline: 'none',
          fontSize: 13,
          lineHeight: 1.6,
          background: bgColor || '#f8f5ef',
          borderRadius: '0 0 8px 8px',
          fontFamily: 'inherit',
        }}
        data-placeholder="Type your top bar content here…"
      />
    </div>
  );
}

const WIDTH_PRESETS = ['100%', '1400px', '1200px', '1100px', '960px', '800px', '75%', '60%'];

// ── Width Diagram: live mini site mockup showing all 6 width zones ─
function WidthDiagram({ local }) {
  const MAX_PX = 1600;

  // Convert any width value to a CSS percentage string relative to MAX_PX viewport
  const toPct = (val) => {
    if (!val || val === '100%') return '100%';
    const s = String(val).trim();
    if (s.endsWith('%')) return `${Math.min(100, parseFloat(s))}%`;
    if (s.endsWith('px')) return `${Math.min(100, (parseFloat(s) / MAX_PX) * 100).toFixed(1)}%`;
    return '100%';
  };

  const screenBg = local.bg_image_url
    ? `url(${local.bg_image_url}) center/cover`
    : (local.bg_gradient || local.screen_background_color || local.bg_color || '#fff');

  // Zone renders the bg band (centered via margin:auto) and overlays a dashed
  // content-width indicator — both widths are relative to the same zone container
  // so percentages are always computed from the same full-width reference.
  const Zone = ({ bgWidth, contentWidth, bgColor, bgImage, children, labelRow }) => (
    <div style={{ position: 'relative' }}>
      {/* BG band: block element centered with margin:auto — width is % of zone container */}
      <div style={{
        width: toPct(bgWidth), margin: '0 auto',
        background: bgImage ? `url(${bgImage}) center/cover no-repeat` : bgColor,
        transition: 'width 0.25s ease',
        overflow: 'hidden',
      }}>
        {children}
      </div>
      {/* Content-width dashed guide — absolute so it's relative to the same zone container */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: toPct(contentWidth),
        borderLeft: '1px dashed rgba(255,255,255,0.55)',
        borderRight: '1px dashed rgba(255,255,255,0.55)',
        pointerEvents: 'none',
        transition: 'width 0.25s ease',
      }} />
      {/* Label bar */}
      {labelRow}
    </div>
  );

  const LabelBar = ({ left, right, dark }) => (
    <div style={{ background: dark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.38)', padding: '2px 5px', display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>{left}</span>
      <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.7)' }}>{right}</span>
    </div>
  );

  return (
    <div>
      {/* Browser chrome */}
      <div style={{ borderRadius: 8, border: '1px solid #d1d5db', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: 0 }}>
        {/* Tab bar */}
        <div style={{ background: '#e9ecef', padding: '8px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
          {['#ef4444','#f59e0b','#22c55e'].map(c => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
          ))}
          <div style={{ flex: 1, background: '#fff', borderRadius: 6, height: 18, marginLeft: 6, opacity: 0.8 }} />
        </div>

        {/* Page — outer area is the screen background (shows on sides of every zone) */}
        <div style={{ background: screenBg }}>

          {/* Header */}
          <Zone
            bgWidth={local.header_bg_width}
            contentWidth={local.header_content_width}
            bgColor={local.primary_color}
            bgImage={local.header_banner_url}
            labelRow={<LabelBar dark left={`Header BG: ${local.header_bg_width || '100%'}`} right={`Content: ${local.header_content_width || '100%'}`} />}
          >
            {/* Top bar */}
            {local.top_bar_enabled && (
              <div style={{ background: local.top_bar_bg_color || '#f8f5ef', padding: '5px 10px', display: 'flex', justifyContent: local.top_bar_align === 'left' ? 'flex-start' : local.top_bar_align === 'center' ? 'center' : 'flex-end' }}>
                <div style={{ width: 80, height: 5, background: local.top_bar_text_color || '#333', opacity: 0.4, borderRadius: 2 }} />
              </div>
            )}
            {/* Banner — full image at natural aspect ratio, no cropping */}
            {local.header_banner_url ? (
              <img src={local.header_banner_url} alt="" style={{ width: '100%', display: 'block' }} />
            ) : (
              <div style={{ minHeight: 80, background: local.primary_color, display: 'flex', alignItems: 'center', padding: '10px 10px', gap: 6 }}>
                {local.logo_url
                  ? <img src={local.logo_url} alt="" style={{ height: 36, objectFit: 'contain', flexShrink: 0 }} />
                  : <div style={{ width: 48, height: 22, background: 'rgba(255,255,255,0.5)', borderRadius: 3, flexShrink: 0 }} />}
                <div style={{ flex: 1, display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                  {[36,24,32,20].map((w, i) => <div key={i} style={{ width: w, height: 7, background: 'rgba(255,255,255,0.6)', borderRadius: 3 }} />)}
                </div>
              </div>
            )}
            {/* Logo overlay row when banner image is set */}
            {local.header_banner_url && (local.logo_url || local.show_site_name !== false) && (
              <div style={{ background: local.primary_color + 'cc', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                {local.logo_url && <img src={local.logo_url} alt="" style={{ height: 22, objectFit: 'contain' }} />}
                {local.show_site_name !== false && <div style={{ width: 64, height: 7, background: 'rgba(255,255,255,0.7)', borderRadius: 3 }} />}
              </div>
            )}
            {/* Nav bar */}
            <div style={{ background: local.nav_bg_image_url ? `url(${local.nav_bg_image_url}) center/cover` : 'rgba(0,0,0,0.18)', padding: '9px 10px', display: 'flex', gap: 7 }}>
              {[32,22,32,18].map((w, i) => <div key={i} style={{ width: w, height: 7, background: 'rgba(255,255,255,0.65)', borderRadius: 3 }} />)}
            </div>
          </Zone>

          {/* Body blocks — body band is page_background_color (or transparent, letting screen bg show through).
              The outer screenBg wrapper above fills the sides of each zone, matching the header/footer treatment. */}
          {[false, true, false].map((alt, bi) => {
            const pageBg = local.page_background_color || 'transparent';
            const stripeBg = alt && local.page_background_color
              ? (local.page_background_color + 'dd')
              : pageBg;
            return (
            <Zone
              key={bi}
              bgWidth={local.body_bg_width}
              contentWidth={local.body_content_width}
              bgColor={stripeBg}
              labelRow={bi === 1
                ? <LabelBar left={`Body BG: ${local.body_bg_width || '100%'}`} right={`Text: ${local.body_content_width || '100%'}`} />
                : null}
            >
              <div style={{ padding: '14px 10px' }}>
                <div style={{ height: 9, background: (local.text_color || '#111') + '55', borderRadius: 3, marginBottom: 5 }} />
                <div style={{ height: 6, background: (local.text_color || '#111') + '33', borderRadius: 3, marginBottom: 5 }} />
                <div style={{ height: 6, background: (local.text_color || '#111') + '22', borderRadius: 3, width: '75%' }} />
              </div>
            </Zone>
            );
          })}

          {/* Footer */}
          <Zone
            bgWidth={local.footer_bg_width}
            contentWidth={local.footer_content_width}
            bgColor={local.footer_bg_color || local.primary_color}
            labelRow={<LabelBar dark left={`Footer BG: ${local.footer_bg_width || '100%'}`} right={`Content: ${local.footer_content_width || '100%'}`} />}
          >
            {local.footer_bg_image_url ? (
              <div style={{ position: 'relative' }}>
                {/* Full image at natural aspect ratio — no cropping */}
                <img src={local.footer_bg_image_url} alt="" style={{ width: '100%', display: 'block' }} />
                {/* Content overlay */}
                <div style={{ position: 'absolute', inset: 0, background: (local.footer_bg_color || local.primary_color) + 'aa', padding: '14px 10px 10px' }}>
                  <div style={{ height: 7, background: 'rgba(255,255,255,0.4)', borderRadius: 3, marginBottom: 5 }} />
                  <div style={{ height: 7, background: 'rgba(255,255,255,0.25)', borderRadius: 3, width: '55%', marginBottom: 10 }} />
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ height: 5, width: '28%', background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
                    <div style={{ height: 5, width: '22%', background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '14px 10px 10px' }}>
                <div style={{ height: 7, background: 'rgba(255,255,255,0.4)', borderRadius: 3, marginBottom: 5 }} />
                <div style={{ height: 7, background: 'rgba(255,255,255,0.25)', borderRadius: 3, width: '55%', marginBottom: 10 }} />
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ height: 5, width: '28%', background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
                  <div style={{ height: 5, width: '22%', background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
                </div>
              </div>
            )}
          </Zone>

        </div>
      </div>
      <p style={{ fontSize: 9, color: '#9CA3AF', textAlign: 'center', marginTop: 4 }}>
        Live mockup · 1600px reference · dashed lines show content width
      </p>
    </div>
  );
}

function WidthControl({ label, hint, value, onChange }) {
  const isCustom = value && !WIDTH_PRESETS.includes(value);
  return (
    <div className="mt-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {WIDTH_PRESETS.map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors
              ${value === p ? 'bg-[#3D6B34] text-white border-[#3D6B34]' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
            {p}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={isCustom ? value : ''}
          placeholder="Custom (e.g. 1050px or 70%)"
          onChange={e => onChange(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        {isCustom && <span className="text-xs text-[#3D6B34] font-medium">✓ {value}</span>}
      </div>
      <p className="text-xs text-gray-400 mt-1">On mobile devices, always 100% width regardless of this setting.</p>
    </div>
  );
}

// ── Page Management Dashboard ─────────────────────────────────────
function PageManagementView({ pages, onMovePage, onReorderPages, onTogglePublished, onSetHome, onDelete, onSetParent, onRename, onAddPage, onSelectPage }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [newPageName, setNewPageName] = useState('');
  const [newPageParent, setNewPageParent] = useState('');
  const [addingType, setAddingType] = useState(null);
  const [dragSrcId, setDragSrcId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  // Build ordered tree: top-level sorted, each with sorted children
  const topLevel = [...pages.filter(p => !p.parent_page_id)].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const headings = topLevel.filter(p => p.is_nav_heading);
  const childrenOf = parentId => [...pages.filter(p => p.parent_page_id === parentId)].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const rows = [];
  topLevel.forEach(p => {
    rows.push({ page: p, depth: 0 });
    childrenOf(p.page_id).forEach(c => rows.push({ page: c, depth: 1 }));
  });

  // Drag-and-drop: reorder within the same sibling group
  const handleDragStart = (e, pageId) => {
    setDragSrcId(pageId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(pageId));
  };
  const handleDragOver = (e, pageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (pageId !== dragSrcId) setDragOverId(pageId);
  };
  const handleDrop = (e, targetPageId) => {
    e.preventDefault();
    const srcId = dragSrcId;
    setDragSrcId(null);
    setDragOverId(null);
    if (!srcId || srcId === targetPageId) return;
    const srcPage = pages.find(p => p.page_id === srcId);
    const tgtPage = pages.find(p => p.page_id === targetPageId);
    if (!srcPage || !tgtPage) return;
    // Only allow reorder within same parent group
    if (srcPage.parent_page_id !== tgtPage.parent_page_id) return;
    const siblings = (srcPage.parent_page_id
      ? pages.filter(p => p.parent_page_id === srcPage.parent_page_id)
      : pages.filter(p => !p.parent_page_id)
    ).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const srcIdx = siblings.findIndex(p => p.page_id === srcId);
    const tgtIdx = siblings.findIndex(p => p.page_id === targetPageId);
    if (srcIdx === -1 || tgtIdx === -1) return;
    const reordered = [...siblings];
    reordered.splice(srcIdx, 1);
    reordered.splice(tgtIdx, 0, srcPage);
    onReorderPages(reordered.map(p => p.page_id));
  };
  const handleDragEnd = () => { setDragSrcId(null); setDragOverId(null); };

  const commitRename = async (pageId) => {
    if (!editingName.trim()) return;
    await onRename(pageId, editingName);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!newPageName.trim()) return;
    const isHeading = addingType === 'heading';
    await onAddPage(newPageName, newPageParent ? parseInt(newPageParent) : null, isHeading);
    setNewPageName('');
    setNewPageParent('');
    setAddingType(null);
  };

  const btnBase = {
    padding: '3px 8px', fontSize: 11, borderRadius: 5,
    border: '1px solid #e5e7eb', cursor: 'pointer',
    background: '#fff', color: '#374151', whiteSpace: 'nowrap',
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>{wb('pm_heading')}</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>{wb('pm_hint')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setAddingType(t => t === 'heading' ? null : 'heading')}
            style={{ padding: '7px 14px', background: addingType === 'heading' ? '#7C5CBF' : '#f3f4f6', color: addingType === 'heading' ? '#fff' : '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {wb('pm_add_heading_btn')}
          </button>
          <button onClick={() => setAddingType(t => t === 'page' ? null : 'page')}
            style={{ padding: '7px 14px', background: addingType === 'page' ? '#3D6B34' : '#3D6B34', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {wb('pm_add_page_btn')}
          </button>
        </div>
      </div>

      {/* Add form (shared for page and heading) */}
      {addingType && (
        <div style={{ padding: '12px 20px', background: addingType === 'heading' ? '#f5f3ff' : '#f0fdf4', borderBottom: `1px solid ${addingType === 'heading' ? '#ddd6fe' : '#d1fae5'}`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: addingType === 'heading' ? '#7C5CBF' : '#3D6B34', whiteSpace: 'nowrap' }}>
            {addingType === 'heading' ? wb('pm_new_heading') : wb('pm_new_page')}
          </span>
          <input
            autoFocus
            value={newPageName}
            onChange={e => setNewPageName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAddingType(null); }}
            placeholder={addingType === 'heading' ? wb('pm_heading_ph') : wb('pm_page_ph')}
            style={{ flex: '1 1 160px', border: `1px solid ${addingType === 'heading' ? '#c4b5fd' : '#6ee7b7'}`, borderRadius: 6, padding: '6px 10px', fontSize: 13 }}
          />
          {addingType === 'page' && (
            <select value={newPageParent} onChange={e => setNewPageParent(e.target.value)}
              style={{ flex: '1 1 160px', border: '1px solid #6ee7b7', borderRadius: 6, padding: '6px 10px', fontSize: 13, background: '#fff' }}>
              <option value="">{wb('pm_top_level')}</option>
              {headings.map(h => <option key={h.page_id} value={h.page_id}>{wb('pm_under_heading', { name: h.page_name })}</option>)}
              {topLevel.filter(p => !p.is_nav_heading).map(p => <option key={p.page_id} value={p.page_id}>{wb('pm_under_page', { name: p.page_name })}</option>)}
            </select>
          )}
          <button onClick={handleAdd}
            style={{ padding: '6px 16px', background: addingType === 'heading' ? '#7C5CBF' : '#3D6B34', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {wb('pm_add_btn')}
          </button>
          <button onClick={() => { setAddingType(null); setNewPageName(''); setNewPageParent(''); }}
            style={{ padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', lineHeight: 1 }}>
            ×
          </button>
        </div>
      )}

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 200px 90px 72px 60px', padding: '6px 16px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
        {['', wb('pm_col_name'), wb('pm_col_parent'), wb('pm_col_visible'), wb('pm_col_home'), wb('pm_col_actions')].map((h, i) => (
          <span key={i} style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {rows.map(({ page, depth }) => {
        const isEditing = editingId === page.page_id;
        const isHeading = page.is_nav_heading;
        const isDragging = dragSrcId === page.page_id;
        const isOver    = dragOverId === page.page_id;

        return (
          <div key={page.page_id}
            draggable
            onDragStart={e => handleDragStart(e, page.page_id)}
            onDragOver={e => handleDragOver(e, page.page_id)}
            onDrop={e => handleDrop(e, page.page_id)}
            onDragEnd={handleDragEnd}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 200px 90px 72px 60px',
              padding: '8px 16px',
              borderBottom: '1px solid #f9fafb',
              alignItems: 'center',
              background: isDragging ? '#e0f2fe' : isOver ? '#fef9c3' : isHeading ? '#faf5ff' : depth === 1 ? '#fafafa' : '#fff',
              borderLeft: isHeading ? '3px solid #7C5CBF' : depth === 0 ? '3px solid #3D6B34' : '3px solid #d1fae5',
              opacity: isDragging ? 0.5 : 1,
              outline: isOver ? '2px dashed #f59e0b' : 'none',
              cursor: 'grab',
              transition: 'background 0.1s',
            }}
          >
            {/* Drag handle */}
            <div style={{ color: '#d1d5db', fontSize: 14, cursor: 'grab', userSelect: 'none', textAlign: 'center' }} title="Drag to reorder">⠿</div>

            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              {depth === 1 && <span style={{ color: '#d1d5db', fontSize: 12, flexShrink: 0 }}>└</span>}
              {isHeading && <span style={{ fontSize: 10, background: '#ede9fe', color: '#7C5CBF', borderRadius: 4, padding: '1px 5px', fontWeight: 700, flexShrink: 0 }}>HEADING</span>}
              {isEditing ? (
                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                  <input autoFocus value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(page.page_id); if (e.key === 'Escape') setEditingId(null); }}
                    onBlur={() => commitRename(page.page_id)}
                    style={{ flex: 1, border: '1px solid #3b82f6', borderRadius: 5, padding: '3px 7px', fontSize: 13 }} />
                  <button onMouseDown={e => e.preventDefault()} onClick={() => commitRename(page.page_id)} style={{ ...btnBase, background: '#3b82f6', color: '#fff', border: 'none' }}>✓</button>
                  <button onMouseDown={e => e.preventDefault()} onClick={() => setEditingId(null)} style={{ ...btnBase, color: '#9ca3af' }}>✕</button>
                </div>
              ) : (
                <button onClick={() => { setEditingId(page.page_id); setEditingName(page.page_name); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '2px 4px', borderRadius: 4, fontSize: 13, fontWeight: isHeading || depth === 0 ? 600 : 400, color: isHeading ? '#7C5CBF' : '#111827', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title="Click to rename">
                  {page.page_name}
                  {page.is_home_page && <span style={{ marginLeft: 6, fontSize: 10, background: '#fef9c3', color: '#92400e', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>HOME</span>}
                </button>
              )}
            </div>

            {/* Menu group (parent) — headings are always top-level */}
            {isHeading ? (
              <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>{wb('pm_top_level_dash')}</span>
            ) : (
              <select
                value={page.parent_page_id || ''}
                onChange={e => onSetParent(page.page_id, e.target.value ? parseInt(e.target.value) : null)}
                style={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 5, padding: '3px 6px', background: '#fff', color: '#374151', width: '100%' }}
              >
                <option value="">{wb('pm_top_level_cap')}</option>
                {topLevel.filter(p => p.page_id !== page.page_id).map(p => (
                  <option key={p.page_id} value={p.page_id}>{p.is_nav_heading ? '📌 ' : ''}{p.page_name}</option>
                ))}
              </select>
            )}

            {/* Visible toggle */}
            <button onClick={() => onTogglePublished(page)}
              title={isHeading && !page.is_published ? 'Group and all its pages are hidden from nav' : undefined}
              style={{ ...btnBase, background: page.is_published ? '#dcfce7' : '#f3f4f6', color: page.is_published ? '#166534' : '#6b7280', border: `1px solid ${page.is_published ? '#86efac' : '#e5e7eb'}`, fontWeight: 600, textAlign: 'center' }}>
              {page.is_published ? wb('pm_status_visible') : wb('pm_status_hidden')}
            </button>

            {/* Home — headings can't be home */}
            {isHeading ? (
              <span />
            ) : (
              <button onClick={() => !page.is_home_page && onSetHome(page.page_id)}
                title={page.is_home_page ? 'This is the home page' : 'Set as home page'}
                style={{ ...btnBase, background: page.is_home_page ? '#fef9c3' : 'transparent', color: page.is_home_page ? '#92400e' : '#d1d5db', border: `1px solid ${page.is_home_page ? '#fde68a' : '#e5e7eb'}`, fontSize: 15, textAlign: 'center', cursor: page.is_home_page ? 'default' : 'pointer' }}>
                {page.is_home_page ? '★' : '☆'}
              </button>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 3 }}>
              {!isHeading && (
                <button onClick={() => onSelectPage(page)} title="Edit page content"
                  style={{ ...btnBase, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '3px 7px' }}>
                  ✏️
                </button>
              )}
              <button onClick={() => onDelete(page.page_id)} title="Delete"
                style={{ ...btnBase, background: '#C0382B', color: '#fff', border: 'none', padding: '3px 7px' }}>
                🗑
              </button>
            </div>
          </div>
        );
      })}

      {rows.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
          {wb('pm_empty')}
        </div>
      )}
    </div>
  );
}

// ── Design full view ──────────────────────────────────────────────
function DesignView({ site, onSave, saving, pages = [] }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const [local, setLocal] = useState({
    primary_color:      site.primary_color      || '#3D6B34',
    secondary_color:    site.secondary_color    || '#819360',
    accent_color:       site.accent_color       || '#FFC567',
    bg_color:           site.bg_color           || '#FFFFFF',
    screen_background_color: site.screen_background_color || site.bg_color || '#FFFFFF',
    page_background_color:   site.page_background_color   || '',
    text_color:         site.text_color         || '#111827',
    font_family:        site.font_family        || 'Inter, sans-serif',
    logo_url:           site.logo_url           || '',
    favicon_url:        site.favicon_url        || '',
    nav_text_color:      site.nav_text_color      || '#FFFFFF',
    dropdown_bg_color:    site.dropdown_bg_color    || site.primary_color || '#3D6B34',
    dropdown_hover_color: site.dropdown_hover_color || 'rgba(255,255,255,0.15)',
    dropdown_bg_color2:   site.dropdown_bg_color2   || '',
    dropdown_gradient_dir:site.dropdown_gradient_dir|| '135deg',
    footer_bg_color:    site.footer_bg_color    || site.primary_color || '#3D6B34',
    copyright_text:     site.copyright_text     || '',
    // Top bar
    top_bar_enabled:    site.top_bar_enabled    || false,
    top_bar_html:       site.top_bar_html       || '',
    top_bar_bg_color:   site.top_bar_bg_color   || '#f8f5ef',
    top_bar_text_color: site.top_bar_text_color || '#333333',
    top_bar_align:      site.top_bar_align      || 'right',
    // Header banner
    header_banner_url:  site.header_banner_url  || '',
    header_height:      site.header_height      || 120,
    show_site_name:     site.show_site_name !== false, // default true
    header_layout:      site.header_layout      || 'banner_top',
    // Nav bar
    nav_bg_image_url:   site.nav_bg_image_url   || '',
    // Width controls
    header_bg_width:      site.header_bg_width      || '100%',
    header_content_width: site.header_content_width || '100%',
    body_content_width:   site.body_content_width   || '100%',
    body_bg_width:        site.body_bg_width        || '100%',
    footer_content_width: site.footer_content_width || '100%',
    footer_bg_width:      site.footer_bg_width      || '100%',
    // Footer
    footer_bg_image_url:   site.footer_bg_image_url   || '',
    footer_html:           site.footer_html           || '',
    footer_height:         Number(site.footer_height)  || 200,
    footer_bottom_radius:  Number(site.footer_bottom_radius) || 0,
    copyright_bar_bg_color: site.copyright_bar_bg_color || '',
    // Header banner background (blank = use primary_color)
    header_banner_bg_color: site.header_banner_bg_color || '',
    // Page background
    bg_image_url:        site.bg_image_url        || '',
    bg_gradient:         site.bg_gradient         || '',
    // Local-only UI state for the page background picker
    bg_mode: (() => {
      if (site.bg_gradient && site.bg_gradient.includes('gradient')) return 'gradient';
      if (site.bg_color && site.bg_color !== '#FFFFFF' && site.bg_color !== '#ffffff') return 'solid';
      return 'none';
    })(),
    bg_gradient_color1: (() => {
      const m = (site.bg_gradient || '').match(/#[0-9a-fA-F]{3,6}/g);
      return m && m[0] ? m[0] : '#e8f5e9';
    })(),
    bg_gradient_color2: (() => {
      const m = (site.bg_gradient || '').match(/#[0-9a-fA-F]{3,6}/g);
      return m && m[1] ? m[1] : '#ffffff';
    })(),
    // Typography / type scale — sizes always normalized to px
    h1_size:          remToPx(site.h1_size)   || '40px',
    h1_weight:        site.h1_weight          || '800',
    h1_color:         site.h1_color           || '',
    h1_align:         site.h1_align           || 'left',
    h1_underline:     !!site.h1_underline,
    h1_italic:        !!site.h1_italic,
    h1_rule:          !!site.h1_rule,
    h1_rule_color:    site.h1_rule_color      || '',
    h1_margin_top:    site.h1_margin_top      ?? 0,
    h1_margin_bottom: site.h1_margin_bottom   ?? 8,
    h1_font:          site.h1_font            || '',
    h2_size:          remToPx(site.h2_size)   || '29px',
    h2_weight:        site.h2_weight          || '700',
    h2_color:         site.h2_color           || '',
    h2_align:         site.h2_align           || 'left',
    h2_underline:     !!site.h2_underline,
    h2_italic:        !!site.h2_italic,
    h2_rule:          !!site.h2_rule,
    h2_rule_color:    site.h2_rule_color      || '',
    h2_margin_top:    site.h2_margin_top      ?? 0,
    h2_margin_bottom: site.h2_margin_bottom   ?? 8,
    h2_font:          site.h2_font            || '',
    h3_size:          remToPx(site.h3_size)   || '21px',
    h3_weight:        site.h3_weight          || '600',
    h3_color:         site.h3_color           || '',
    h3_align:         site.h3_align           || 'left',
    h3_underline:     !!site.h3_underline,
    h3_italic:        !!site.h3_italic,
    h3_rule:          !!site.h3_rule,
    h3_rule_color:    site.h3_rule_color      || '',
    h3_margin_top:    site.h3_margin_top      ?? 0,
    h3_margin_bottom: site.h3_margin_bottom   ?? 6,
    h3_font:          site.h3_font            || '',
    h4_size:          remToPx(site.h4_size)   || '17px',
    h4_weight:        site.h4_weight          || '600',
    h4_color:         site.h4_color           || '',
    h4_align:         site.h4_align           || 'left',
    h4_underline:     !!site.h4_underline,
    h4_italic:        !!site.h4_italic,
    h4_rule:          !!site.h4_rule,
    h4_rule_color:    site.h4_rule_color      || '',
    h4_margin_top:    site.h4_margin_top      ?? 0,
    h4_margin_bottom: site.h4_margin_bottom   ?? 4,
    h4_font:          site.h4_font            || '',
    body_size:        remToPx(site.body_size) || '16px',
    body_line_height: site.body_line_height   || '1.75',
    body_color:       site.body_color         || '',
    body_align:       site.body_align         || 'left',
    body_underline:   !!site.body_underline,
    body_italic:      !!site.body_italic,
    body_margin_top:    site.body_margin_top    ?? 0,
    body_margin_bottom: site.body_margin_bottom ?? 12,
    body_font:          site.body_font          || '',
    link_color:       site.link_color       || '',
    link_underline:   site.link_underline !== false,
    // Site-wide image styling
    image_border_radius:   Number(site.image_border_radius ?? 0),
    image_shadow_enabled:  !!site.image_shadow_enabled,
    image_shadow_color:    site.image_shadow_color    || 'rgba(0,0,0,0.35)',
    image_shadow_distance: Number(site.image_shadow_distance ?? 4),
    image_shadow_blur:     Number(site.image_shadow_blur     ?? 8),
    image_shadow_angle:    Number(site.image_shadow_angle    ?? 135),
  });

  const set = (key, val) => setLocal(p => ({ ...p, [key]: val }));
  const [designTab, setDesignTab] = useState('colors');
  const [autoSaved, setAutoSaved] = useState(false);
  const autoSaveTimer = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      onSave(local);
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 1500);
    return () => clearTimeout(autoSaveTimer.current);
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps

  // Temporarily show the site's favicon in the browser tab while the design panel is open.
  // Saves the original OFN favicon and restores it when the component unmounts.
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']");
    const originalHref = link ? link.href : '/images/OFNFavico.png';
    return () => {
      if (link) link.href = originalHref;
    };
  }, []); // run once on mount/unmount only

  useEffect(() => {
    if (!local.favicon_url) return; // no custom favicon — leave OFN favicon alone
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = local.favicon_url;
  }, [local.favicon_url]);

  const paletteColors = [local.primary_color, local.secondary_color, local.accent_color, local.bg_color, local.text_color, local.nav_text_color, local.footer_bg_color].filter(Boolean);

  const ColorRow = ({ label, field, hint }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <InlineColorPicker value={local[field]} onChange={v => set(field, v)} paletteColors={paletteColors} popupAlign="right" />
    </div>
  );

  // Checkerboard = transparent indicator
  const checkered = 'linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)';

  // Transparent-aware color picker row: shows color picker + "Transparent" toggle
  const ColorRowTransparent = ({ label, field, hint, fallback }) => {
    const isTransp = local[field] === 'transparent';
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
        <div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isTransp && (
            <InlineColorPicker value={local[field] || fallback} onChange={v => set(field, v)} paletteColors={paletteColors} popupAlign="right" />
          )}
          <button
            onClick={() => set(field, isTransp ? (fallback || '#ffffff') : 'transparent')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '4px 9px',
              borderRadius: 6, cursor: 'pointer', fontWeight: 500,
              border: isTransp ? '1.5px solid #3b82f6' : '1px solid #d1d5db',
              background: isTransp ? '#eff6ff' : '#fff',
              color: isTransp ? '#2563eb' : '#6b7280',
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: 2, display: 'inline-block', border: '1px solid #d1d5db',
              background: checkered, backgroundSize: '6px 6px',
              backgroundPosition: '0 0,0 3px,3px -3px,-3px 0' }} />
            {isTransp ? 'Transparent ✓' : 'Transparent'}
          </button>
        </div>
      </div>
    );
  };

  // ── Live header preview (all three zones) — called as function, not component ──
  const renderHeaderPreview = () => {
    const bgW = local.header_bg_width || '100%';
    const cW  = local.header_content_width || '100%';
    const transpTile = ['linear-gradient(45deg,#d1d5db 25%,transparent 25%)','linear-gradient(-45deg,#d1d5db 25%,transparent 25%)','linear-gradient(45deg,transparent 75%,#d1d5db 75%)','linear-gradient(-45deg,transparent 75%,#d1d5db 75%)'].join(',');
    const transpStyle = { backgroundImage: transpTile, backgroundSize: '14px 14px', backgroundPosition: '0 0,0 7px,7px -7px,-7px 0', backgroundColor: '#f9fafb' };
    const isTranspTopBar = local.top_bar_bg_color === 'transparent';
    const isTranspBanner = local.header_banner_bg_color === 'transparent';
    return (
      <div style={{ borderRadius: 8, overflow: 'hidden', marginTop: '0.75rem', border: '1px solid #e5e7eb', background: 'transparent', display: 'flex', justifyContent: 'center' }}>
        {/* Each zone carries its own background — outer band is transparent so transparent zones show page bg */}
        <div style={{ width: '100%', maxWidth: bgW, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {local.top_bar_enabled && (
            <div style={{ width: '100%', maxWidth: cW, padding: '4px 10px', textAlign: local.top_bar_align,
              ...(isTranspTopBar ? transpStyle : { background: local.top_bar_bg_color || '#f8f5ef' }) }}>
              <span style={{ fontSize: 11, color: isTranspTopBar ? '#374151' : local.top_bar_text_color, fontFamily: local.font_family }}
                dangerouslySetInnerHTML={{ __html: local.top_bar_html || '<em>your-email@example.com | 555-123-4567</em>' }} />
            </div>
          )}
          {/* Banner constrained to header_content_width */}
          <div style={{ width: '100%', maxWidth: cW, position: 'relative' }}>
            {local.header_banner_url ? (
              <img src={local.header_banner_url} alt="" style={{ width: '100%', display: 'block' }} />
            ) : (
              <div style={{ height: Number(local.header_height) || 120,
                ...(isTranspBanner ? transpStyle : { background: local.header_banner_bg_color || local.primary_color }) }} />
            )}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '0.75rem' }}>
              {local.logo_url && (
                <img src={local.logo_url} alt="" style={{ height: 52, objectFit: 'contain', borderRadius: 4 }} />
              )}
              {local.show_site_name !== false && (
                <span style={{ fontWeight: 800, color: local.nav_text_color, fontFamily: local.font_family, fontSize: '1.25rem', textShadow: local.header_banner_url ? '1px 1px 4px rgba(0,0,0,0.55)' : 'none' }}>{site.site_name}</span>
              )}
            </div>
          </div>
          {/* Nav constrained to header_content_width */}
          <div style={{ width: '100%', maxWidth: cW, background: local.nav_bg_image_url ? `url(${local.nav_bg_image_url}) center/cover no-repeat` : local.primary_color, padding: '0 1rem', height: 38, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {['Home', 'About Us', 'Services', 'Contact'].map(n => (
              <span key={n} style={{ color: local.nav_text_color, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.01em' }}>{n}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Called as a function (not <FooterPreview />) to avoid React unmount/remount on every
  // DesignView render, which would cause stale closure snapshots of `local`.
  const renderFooterPreview = () => {
    const hasBgImage = !!local.footer_bg_image_url;
    const footerHeight = Number(local.footer_height) || 200;
    const bgW = local.footer_bg_width || '100%';
    const cW  = local.footer_content_width || '100%';
    const copyrightBg       = local.copyright_bar_bg_color; // '' | 'transparent' | hex
    const isTranspCopyright = copyrightBg === 'transparent';
    const isTranspFooter    = local.footer_bg_color === 'transparent';

    // Checkerboard tile — makes transparent areas visually obvious in preview
    const transpTile = [
      'linear-gradient(45deg,#d1d5db 25%,transparent 25%)',
      'linear-gradient(-45deg,#d1d5db 25%,transparent 25%)',
      'linear-gradient(45deg,transparent 75%,#d1d5db 75%)',
      'linear-gradient(-45deg,transparent 75%,#d1d5db 75%)',
    ].join(',');
    const transpStyle = { backgroundImage: transpTile, backgroundSize: '14px 14px', backgroundPosition: '0 0,0 7px,7px -7px,-7px 0', backgroundColor: '#f9fafb' };

    // Footer content area — independent background, checkerboard if transparent
    const footerContentStyle = isTranspFooter
      ? transpStyle
      : { background: local.footer_bg_color || local.primary_color || '#3D6B34' };

    // Copyright strip — independent background, checkerboard if transparent
    const copyrightStripStyle = isTranspCopyright
      ? transpStyle
      : { background: copyrightBg || 'rgba(0,0,0,0.15)' };

    const fRadius = local.footer_bottom_radius || 0;
    const fRadiusCss = fRadius ? `0 0 ${fRadius}px ${fRadius}px` : undefined;
    // If copyright bar is transparent, the footer content is the visual bottom — it gets the radius
    const footerContentRadius = isTranspCopyright ? fRadiusCss : undefined;
    const copyrightBarRadius = isTranspCopyright ? undefined : fRadiusCss;

    const copyrightStrip = (
      <div style={{ ...copyrightStripStyle, borderRadius: copyrightBarRadius }}>
        <div style={{ maxWidth: cW, margin: '0 auto', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: isTranspCopyright ? '#374151' : 'rgba(255,255,255,0.65)' }}>
            {local.copyright_text || `© ${new Date().getFullYear()} ${site.site_name}`}
          </span>
          <a href="https://www.OatmealFarmNetwork.com" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.65rem', color: isTranspCopyright ? '#6b7280' : 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
            Powered by Oatmeal Farm Network
          </a>
        </div>
      </div>
    );

    return (
      <div style={{ borderRadius: `8px 8px ${Math.max(8, fRadius)}px ${Math.max(8, fRadius)}px`, overflow: 'hidden', marginTop: '0.75rem', display: 'flex', justifyContent: 'center', fontFamily: local.font_family, border: '1px solid #e5e7eb' }}>
        <div style={{ width: '100%', maxWidth: bgW, borderRadius: fRadiusCss, overflow: fRadius ? 'hidden' : undefined }}>
          {hasBgImage ? (
            /* Image case: image as bg, copyright below */
            <>
              <img src={local.footer_bg_image_url} alt="" style={{ width: '100%', display: 'block' }} />
              {copyrightStrip}
            </>
          ) : (
            /* No image: plain block siblings — minHeight on footer content drives the height slider */
            <>
              <div style={{ minHeight: footerHeight, ...footerContentStyle, borderRadius: footerContentRadius }}>
                <div style={{ maxWidth: cW, margin: '0 auto' }}>
                  {local.footer_html ? (
                    <div style={{ padding: '0.5rem 1rem', color: isTranspFooter ? '#374151' : '#fff', fontSize: '0.82rem', lineHeight: 1.6 }}
                      dangerouslySetInnerHTML={{ __html: local.footer_html }} />
                  ) : (
                    <div style={{ padding: '1rem', color: isTranspFooter ? '#9ca3af' : 'rgba(255,255,255,0.35)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                      No footer content — add some in the Footer Content box below.
                    </div>
                  )}
                </div>
              </div>
              {copyrightStrip}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-gray-900">{wb('design_heading')}</h2>
        <div className="flex items-center gap-3">
          {autoSaved && !saving && (
            <span className="text-xs text-green-600 font-medium animate-pulse">{wb('design_saved')}</span>
          )}
          <button onClick={() => onSave(local)} disabled={saving}
            className="regsubmit2 px-6 py-2 text-sm disabled:opacity-50">
            {saving ? wb('design_saving') : wb('design_save')}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">{wb('design_subheading')}</p>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
        {[['colors',wb('design_tab_colors')],['typography',wb('design_tab_type')],['images',wb('design_tab_images')],['header',wb('design_tab_header')]].map(([id, label]) => (
          <button key={id} onClick={() => setDesignTab(id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
              ${designTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ COLORS TAB ══ */}
      {designTab === 'colors' && (
        <div>
          {/* Colors: palettes + page colors */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
            <h3 className="font-bold text-gray-800 mb-1 pb-2 border-b border-gray-100">{wb('colors_heading')}</h3>
            <p className="text-xs text-gray-400 mb-4">{wb('colors_apply_preset')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
              {TEMPLATES.map(t => {
                const active = local.primary_color === t.primary_color && local.secondary_color === t.secondary_color;
                return (
                  <button key={t.id}
                    onClick={() => setLocal(p => ({ ...p, primary_color: t.primary_color, secondary_color: t.secondary_color, accent_color: t.accent_color, bg_color: t.bg_color, text_color: t.text_color, nav_text_color: t.nav_text_color, footer_bg_color: t.footer_bg_color, font_family: t.font_family }))}
                    className={`rounded-xl border-2 overflow-hidden text-left transition-all ${active ? 'border-[#3D6B34] shadow-md ring-2 ring-[#3D6B34]/20' : 'border-gray-100 hover:border-gray-300'}`}>
                    <div className="flex h-7">{[t.primary_color, t.secondary_color, t.accent_color, t.bg_color].map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}</div>
                    <div className="px-2 py-1" style={{ background: t.primary_color }}><span className="text-xs font-bold truncate block" style={{ color: t.nav_text_color, fontFamily: t.font_family }}>{t.name}</span></div>
                    <div className="px-2 py-1" style={{ background: t.bg_color }}><span className="text-xs truncate block" style={{ color: t.text_color, fontFamily: t.font_family }}>{wb('design_sample_text')}</span></div>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">{wb('colors_page')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: wb('colors_secondary'), field: 'secondary_color', hint: wb('colors_secondary_hint') },
                  { label: wb('colors_button'),    field: 'accent_color',    hint: wb('colors_button_hint') },
                  { label: wb('colors_body_text'), field: 'text_color',      hint: wb('colors_body_text_hint') },
                ].map(({ label, field, hint }) => (
                  <div key={field} className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-700 leading-tight">{label}</span>
                    <span className="text-[10px] text-gray-400 leading-tight">{hint}</span>
                    <InlineColorPicker value={local[field]} onChange={v => set(field, v)} paletteColors={paletteColors} />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Screen Background (outer viewport) ── */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">{wb('colors_screen_bg')}</p>
              <p className="text-[10px] text-gray-400 mb-3 leading-tight">
                {wb('colors_screen_bg_hint')}
              </p>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">{wb('colors_bg_type')}</label>
                <div className="flex gap-2">
                  {[['none',wb('colors_bg_none')],['solid',wb('colors_bg_solid')],['gradient',wb('colors_bg_gradient')]].map(([mode, label]) => (
                    <button key={mode} onClick={() => {
                      if (mode === 'none') setLocal(p => ({ ...p, bg_mode: 'none', bg_gradient: '', screen_background_color: '#FFFFFF' }));
                      else if (mode === 'solid') setLocal(p => ({ ...p, bg_mode: 'solid', bg_gradient: '' }));
                      else { const c1 = local.bg_gradient_color1 || '#e8f5e9'; const c2 = local.bg_gradient_color2 || '#ffffff'; setLocal(p => ({ ...p, bg_mode: 'gradient', bg_gradient: `linear-gradient(to bottom, ${c1}, ${c2})` })); }
                    }}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${local.bg_mode === mode ? 'bg-[#3D6B34] text-white border-[#3D6B34]' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {local.bg_mode === 'solid' && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">{wb('colors_color')}</label>
                  <InlineColorPicker value={local.screen_background_color} onChange={v => set('screen_background_color', v)} paletteColors={[local.primary_color, local.secondary_color, local.accent_color, local.screen_background_color, local.page_background_color, local.text_color].filter(Boolean)} />
                  <div className="mt-3 h-10 rounded-lg border border-gray-200" style={{ background: local.screen_background_color }} />
                </div>
              )}
              {local.bg_mode === 'gradient' && (
                <div className="mb-4">
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">{wb('colors_top_color')}</label>
                      <InlineColorPicker value={local.bg_gradient_color1} onChange={v => { const c2 = local.bg_gradient_color2 || '#ffffff'; setLocal(p => ({ ...p, bg_gradient_color1: v, bg_gradient: `linear-gradient(to bottom, ${v}, ${c2})` })); }} paletteColors={[local.primary_color, local.secondary_color, local.accent_color, local.screen_background_color, local.page_background_color, local.text_color].filter(Boolean)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">{wb('colors_bottom_color')}</label>
                      <InlineColorPicker value={local.bg_gradient_color2} onChange={v => { const c1 = local.bg_gradient_color1 || '#e8f5e9'; setLocal(p => ({ ...p, bg_gradient_color2: v, bg_gradient: `linear-gradient(to bottom, ${c1}, ${v})` })); }} paletteColors={[local.primary_color, local.secondary_color, local.accent_color, local.screen_background_color, local.page_background_color, local.text_color].filter(Boolean)} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-2">{wb('colors_presets')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[['Warm Sand','#fdf6e3','#e8d5b7'],['Soft Sky','#e0f2fe','#bae6fd'],['Meadow','#f0fdf4','#bbf7d0'],['Sunset','#fff7ed','#fed7aa'],['Slate','#f8fafc','#e2e8f0'],['Lavender','#faf5ff','#e9d5ff']].map(([name,c1,c2]) => (
                        <button key={name} onClick={() => setLocal(p => ({ ...p, bg_gradient_color1: c1, bg_gradient_color2: c2, bg_gradient: `linear-gradient(to bottom, ${c1}, ${c2})` }))}
                          className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 hover:border-gray-400 transition-colors font-medium" style={{ background: `linear-gradient(to bottom, ${c1}, ${c2})` }}>
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                  {local.bg_gradient && <div className="mt-3 h-14 rounded-lg border border-gray-200" style={{ background: local.bg_gradient }} />}
                </div>
              )}
              <div className={local.bg_mode !== 'none' ? 'mt-2 pt-4 border-t border-gray-100' : ''}>
                <ImageUploadField label={wb('colors_screen_bg_img_lbl')} value={local.bg_image_url} onChange={url => set('bg_image_url', url)} hint={wb('colors_screen_bg_img_hint')} />
              </div>
            </div>

            {/* ── Page Background (inner content band) ── */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">{wb('colors_page_bg')}</p>
              <p className="text-[10px] text-gray-400 mb-3 leading-tight">
                {wb('colors_page_bg_hint')}
              </p>
              <InlineColorPicker
                value={local.page_background_color || ''}
                onChange={v => set('page_background_color', v)}
                paletteColors={[local.primary_color, local.secondary_color, local.accent_color, local.screen_background_color, local.page_background_color, local.text_color].filter(Boolean)}
              />
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-10 rounded-lg border border-gray-200" style={{ background: local.page_background_color || 'transparent' }} />
                {local.page_background_color && (
                  <button onClick={() => set('page_background_color', '')}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:border-gray-400">
                    {wb('f_clear')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content Widths */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
            <h3 className="font-bold text-gray-800 mb-1 pb-2 border-b border-gray-100">{wb('colors_content_widths')}</h3>
            <p className="text-xs text-gray-400 mb-4">{wb('colors_content_widths_hint')}</p>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex flex-col gap-4 flex-1">
                <div className="border-l-4 pl-3" style={{ borderColor: local.primary_color }}>
                  <p className="text-xs font-semibold text-gray-500 mb-1">{wb('colors_header_sub')}</p>
                  <WidthControl label={wb('colors_header_bg_width')} hint={wb('colors_header_bg_width_hint')} value={local.header_bg_width} onChange={v => set('header_bg_width', v)} />
                  <WidthControl label={wb('colors_header_content_width')} hint={wb('colors_header_content_width_hint')} value={local.header_content_width} onChange={v => set('header_content_width', v)} />
                </div>
                <div className="border-l-4 pl-3" style={{ borderColor: local.secondary_color }}>
                  <p className="text-xs font-semibold text-gray-500 mb-1">{wb('colors_body_sub')}</p>
                  <WidthControl label={wb('colors_body_bg_width')} hint={wb('colors_body_bg_width_hint')} value={local.body_bg_width} onChange={v => set('body_bg_width', v)} />
                  <WidthControl label={wb('colors_body_text_width')} hint={wb('colors_body_text_width_hint')} value={local.body_content_width} onChange={v => set('body_content_width', v)} />
                </div>
                <div className="border-l-4 pl-3" style={{ borderColor: local.footer_bg_color }}>
                  <p className="text-xs font-semibold text-gray-500 mb-1">{wb('colors_footer_sub')}</p>
                  <WidthControl label={wb('colors_footer_bg_width')} hint={wb('colors_footer_bg_width_hint')} value={local.footer_bg_width} onChange={v => set('footer_bg_width', v)} />
                  <WidthControl label={wb('colors_footer_content_width')} hint={wb('colors_footer_content_width_hint')} value={local.footer_content_width} onChange={v => set('footer_content_width', v)} />
                </div>
              </div>
              <div className="flex-1 min-w-0 lg:min-w-72">
                <p className="text-xs font-semibold text-gray-500 mb-2">{wb('colors_live_preview')}</p>
                <WidthDiagram local={local} />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ══ TYPOGRAPHY TAB ══ */}
      {designTab === 'typography' && (
        <div>
          {/* Base font */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
            <h3 className="font-bold text-gray-800 mb-1 pb-2 border-b border-gray-100">{wb('typo_base_font')}</h3>
            <p className="text-xs text-gray-400 mb-3">{wb('typo_base_font_hint')}</p>
            <FontPickerDropdown
              value={local.font_family}
              onChange={v => set('font_family', v)}
              dark={false}
            />
            <div className="mt-3 p-4 rounded-lg border border-gray-100 grid grid-cols-2 gap-4" style={{ background: local.bg_color, fontFamily: local.font_family }}>
              <div>
                <p style={{ color: local.text_color, fontWeight: 800, fontSize: '1.5rem', margin: '0 0 2px 0', lineHeight: 1.2 }}>Heading</p>
                <p style={{ color: local.text_color, fontSize: '0.9rem', margin: 0, opacity: 0.75, lineHeight: 1.6 }}>Body paragraph text. The quick brown fox jumps over the lazy dog.</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: local.text_color, fontWeight: 600, fontSize: '1rem', margin: '0 0 2px 0' }}>Subheading</p>
                <p style={{ color: local.link_color || local.accent_color, fontSize: '0.9rem', margin: 0, textDecoration: local.link_underline !== false ? 'underline' : 'none' }}>Link example</p>
                <p style={{ color: local.text_color, fontSize: '0.75rem', margin: '4px 0 0 0', opacity: 0.5 }}>0 1 2 3 4 5 6 7 8 9</p>
              </div>
            </div>
          </div>

          {/* Type scale */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
            <h3 className="font-bold text-gray-800 mb-1 pb-2 border-b border-gray-100">{wb('typo_scale')}</h3>
            <p className="text-xs text-gray-400 mb-4">{wb('typo_scale_hint')}</p>

            {[
              { key: 'h1',   label: 'H1',        sample: 'Page Title',           defaultSize: '40px', defaultWeight: '800', hasRule: true },
              { key: 'h2',   label: 'H2',        sample: 'Section Heading',      defaultSize: '29px', defaultWeight: '700', hasRule: true },
              { key: 'h3',   label: 'H3',        sample: 'Sub Heading',          defaultSize: '21px', defaultWeight: '600', hasRule: true },
              { key: 'h4',   label: 'H4 / Lead', sample: 'Card Title',           defaultSize: '17px', defaultWeight: '600', hasRule: true },
              { key: 'body', label: 'Body',       sample: 'Paragraph body text — the main content of your pages.', defaultSize: '16px', defaultWeight: '400', hasRule: false },
            ].map(({ key, label, sample, defaultSize, defaultWeight, hasRule }) => {
              const sizeKey        = `${key}_size`;
              const weightKey      = `${key}_weight`;
              const colorKey       = `${key}_color`;
              const alignKey       = `${key}_align`;
              const underlineKey   = `${key}_underline`;
              const italicKey      = `${key}_italic`;
              const ruleKey        = `${key}_rule`;
              const ruleColorKey   = `${key}_rule_color`;
              const marginTopKey   = `${key}_margin_top`;
              const marginBotKey   = `${key}_margin_bottom`;
              const fontKey        = `${key}_font`;
              const color     = local[colorKey] || local.text_color || '#111827';
              const align     = local[alignKey] || 'left';
              const ruleColor = local[ruleColorKey] || local.text_color || '#111827';
              const currentSize = remToPx(local[sizeKey]) || defaultSize;
              const SIZE_PRESETS = ['10px','12px','14px','16px','18px','20px','24px','30px','36px','48px'];
              const ALIGN_LABELS = { left: wb('align_left'), center: wb('align_center'), right: wb('align_right'), justify: wb('align_justify') };
              return (
                <div key={key} className="py-3 border-b border-gray-50 last:border-0">
                  {/* Row 1: Level | Preview | Size | Weight | Color */}
                  <div className="grid items-center gap-2 mb-2" style={{ gridTemplateColumns: '64px 1fr 120px 110px auto' }}>
                    <span className="text-xs font-bold text-gray-500">{label}</span>
                    <div className="min-w-0 overflow-hidden">
                      <p className="truncate m-0" style={{
                        fontFamily: local[fontKey] || local.font_family,
                        fontSize: currentSize,
                        fontWeight: local[weightKey] || defaultWeight,
                        color,
                        lineHeight: 1.3,
                        textAlign: align,
                        fontStyle: local[italicKey] ? 'italic' : 'normal',
                        textDecoration: local[underlineKey] ? 'underline' : 'none',
                        borderBottom: hasRule && local[ruleKey] ? `2px solid ${ruleColor}` : 'none',
                        paddingBottom: hasRule && local[ruleKey] ? 4 : 0,
                        display: 'inline-block',
                        width: '100%',
                      }}>
                        {sample}
                      </p>
                    </div>
                    {/* Size: custom input + preset dropdown; always saved as px */}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="6"
                        max="200"
                        value={parseInt(currentSize, 10) || ''}
                        onChange={e => set(sizeKey, e.target.value ? `${parseInt(e.target.value, 10)}px` : '')}
                        className="w-14 border border-gray-200 rounded-lg px-1.5 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-green-300"
                        title="Font size in px"
                      />
                      <span className="text-[10px] text-gray-400">px</span>
                      <select
                        value={SIZE_PRESETS.includes(currentSize) ? currentSize : ''}
                        onChange={e => { if (e.target.value) set(sizeKey, e.target.value); }}
                        className="border border-gray-200 rounded-lg px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-300"
                        title="Preset sizes"
                      >
                        <option value="">▾</option>
                        {SIZE_PRESETS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <select value={local[weightKey] || defaultWeight} onChange={e => set(weightKey, e.target.value)}
                      className="border border-gray-200 rounded-lg px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-300">
                      <option value="400">{wb('typo_weight_normal')}</option>
                      <option value="500">{wb('typo_weight_medium')}</option>
                      <option value="600">{wb('typo_weight_semibold')}</option>
                      <option value="700">{wb('typo_weight_bold')}</option>
                      <option value="800">{wb('typo_weight_extrabold')}</option>
                    </select>
                    <InlineColorPicker value={color} onChange={v => set(colorKey, v)} paletteColors={paletteColors} popupAlign="right" />
                  </div>
                  {/* Row 2: Align | Underline | Rule (headings only) */}
                  <div className="flex items-center gap-3 pl-16 flex-wrap">
                    <div className="flex gap-1">
                      {['left','center','right','justify'].map(a => (
                        <button key={a} onClick={() => set(alignKey, a)} title={ALIGN_LABELS[a]}
                          className={`w-7 h-7 rounded text-xs flex items-center justify-center border transition-colors ${align === a ? 'bg-blue-50 border-blue-400 text-blue-600' : 'border-gray-200 text-gray-400 hover:border-gray-400'}`}>
                          {a === 'left' ? '▤' : a === 'center' ? '▥' : a === 'right' ? '▦' : '▪'}
                        </button>
                      ))}
                    </div>
                    <div className="w-px h-5 bg-gray-200" />
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={!!local[underlineKey]} onChange={e => set(underlineKey, e.target.checked)} className="w-3.5 h-3.5 accent-blue-500" />
                      <span className="text-xs text-gray-500" style={{ textDecoration: 'underline' }}>{wb('typo_underline')}</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={!!local[italicKey]} onChange={e => set(italicKey, e.target.checked)} className="w-3.5 h-3.5 accent-blue-500" />
                      <span className="text-xs text-gray-500" style={{ fontStyle: 'italic' }}>{wb('typo_italic')}</span>
                    </label>
                    {hasRule && (
                      <>
                        <div className="w-px h-5 bg-gray-200" />
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input type="checkbox" checked={!!local[ruleKey]} onChange={e => set(ruleKey, e.target.checked)} className="w-3.5 h-3.5 accent-blue-500" />
                          <span className="text-xs text-gray-500">{wb('typo_rule')}</span>
                        </label>
                        {local[ruleKey] && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">{wb('typo_color')}</span>
                            <InlineColorPicker value={ruleColor} onChange={v => set(ruleColorKey, v)} paletteColors={paletteColors} popupAlign="right" />
                          </div>
                        )}
                      </>
                    )}
                    <div className="w-px h-5 bg-gray-200" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">{wb('typo_margin')}</span>
                      <span className="text-xs text-gray-400">↑</span>
                      <input type="number" min="0" max="200" value={local[marginTopKey] ?? 0}
                        onChange={e => set(marginTopKey, Number(e.target.value))}
                        className="w-12 border border-gray-200 rounded px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-green-300" />
                      <span className="text-xs text-gray-400">↓</span>
                      <input type="number" min="0" max="200" value={local[marginBotKey] ?? 0}
                        onChange={e => set(marginBotKey, Number(e.target.value))}
                        className="w-12 border border-gray-200 rounded px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-green-300" />
                      <span className="text-xs text-gray-400">px</span>
                    </div>
                    <div className="w-px h-5 bg-gray-200" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">{wb('typo_font')}</span>
                      <FontPickerDropdown
                        value={local[fontKey] || ''}
                        onChange={v => set(fontKey, v)}
                        globalFont={local.font_family}
                        dark={false}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Body line height row */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100 mt-1">
              <span className="text-xs font-bold text-gray-500 w-16 shrink-0">{wb('typo_line_height')}</span>
              <input type="text" value={local.body_line_height || '1.75'} onChange={e => set('body_line_height', e.target.value)}
                className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-green-300" />
              <span className="text-xs text-gray-400">{wb('typo_body_line_height_hint')}</span>
            </div>
          </div>

          {/* Links */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-1 pb-2 border-b border-gray-100">{wb('typo_links')}</h3>
            <p className="text-xs text-gray-400 mb-4">{wb('typo_links_hint')}</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 p-3 rounded-lg border border-gray-100" style={{ background: local.bg_color }}>
                <span style={{
                  fontFamily: local.font_family,
                  fontSize: local.body_size || '1rem',
                  color: local.link_color || local.accent_color || '#FFC567',
                  textDecoration: local.link_underline !== false ? 'underline' : 'none',
                }}>
                  {wb('typo_link_example')}
                </span>
              </div>
              <div className="flex flex-col gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600 w-12">{wb('typo_color')}</label>
                  <InlineColorPicker value={local.link_color || local.accent_color || '#FFC567'} onChange={v => set('link_color', v)} paletteColors={paletteColors} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={local.link_underline !== false} onChange={e => set('link_underline', e.target.checked)} className="w-4 h-4 accent-green-600" />
                  <span className="text-xs font-medium text-gray-600" style={{ textDecoration: 'underline' }}>{wb('typo_link_underline')}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ IMAGES TAB ══ */}
      {designTab === 'images' && (
        <div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
            <h3 className="font-bold text-gray-800 mb-1 pb-2 border-b border-gray-100">{wb('img_styling_heading')}</h3>
            <p className="text-xs text-gray-400 mb-4">{wb('img_styling_hint')}</p>

            {/* Live preview */}
            {(() => {
              const radius = Number(local.image_border_radius || 0);
              const enabled = !!local.image_shadow_enabled;
              const rad = (Number(local.image_shadow_angle || 0) * Math.PI) / 180;
              const ox = Math.round(Math.cos(rad) * Number(local.image_shadow_distance || 0));
              const oy = Math.round(Math.sin(rad) * Number(local.image_shadow_distance || 0));
              const blur = Number(local.image_shadow_blur || 0);
              const color = local.image_shadow_color || 'rgba(0,0,0,0.35)';
              const boxShadow = enabled ? `${ox}px ${oy}px ${blur}px ${color}` : 'none';
              return (
                <div className="flex items-center justify-center p-6 rounded-lg mb-5" style={{ background: local.page_background_color || '#f9fafb', minHeight: 200 }}>
                  <div style={{ width: 260, height: 160, background: `url('/images/QualsHeader.jpg') center/cover no-repeat, linear-gradient(135deg, ${local.primary_color || '#3D6B34'}, ${local.accent_color || '#FFC567'})`, borderRadius: `${radius}%`, boxShadow }} />
                </div>
              );
            })()}

            {/* Rounded corners */}
            <div className="pt-2 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">{wb('img_rounded_corners')}</span>
                <span className="text-xs font-mono text-gray-500">{local.image_border_radius || 0}%</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">{wb('img_rounded_hint')}</p>
              <input
                type="range" min="0" max="50" step="1"
                value={local.image_border_radius || 0}
                onChange={e => set('image_border_radius', Number(e.target.value))}
                className="w-full accent-green-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{wb('img_sq')}</span>
                <span>{wb('img_25pct')}</span>
                <span>{wb('img_circle')}</span>
              </div>
            </div>

            {/* Drop shadow */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">{wb('img_drop_shadow')}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!local.image_shadow_enabled}
                    onChange={e => set('image_shadow_enabled', e.target.checked)}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className="text-xs font-medium text-gray-600">{wb('img_shadow_enabled')}</span>
                </label>
              </div>
              {local.image_shadow_enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{wb('img_shadow_color')}</label>
                    <InlineColorPicker
                      value={local.image_shadow_color || 'rgba(0,0,0,0.35)'}
                      onChange={v => set('image_shadow_color', v)}
                      paletteColors={paletteColors}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-600">{wb('img_shadow_distance')}</label>
                      <span className="text-xs font-mono text-gray-500">{local.image_shadow_distance || 0}px</span>
                    </div>
                    <input
                      type="range" min="0" max="60" step="1"
                      value={local.image_shadow_distance || 0}
                      onChange={e => set('image_shadow_distance', Number(e.target.value))}
                      className="w-full accent-green-600"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-600">{wb('img_shadow_angle')}</label>
                      <span className="text-xs font-mono text-gray-500">{local.image_shadow_angle || 0}°</span>
                    </div>
                    <input
                      type="range" min="0" max="359" step="1"
                      value={local.image_shadow_angle || 0}
                      onChange={e => set('image_shadow_angle', Number(e.target.value))}
                      className="w-full accent-green-600"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>{wb('img_shadow_angle_0')}</span>
                      <span>{wb('img_shadow_angle_90')}</span>
                      <span>{wb('img_shadow_angle_180')}</span>
                      <span>{wb('img_shadow_angle_270')}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-600">{wb('img_shadow_blur')}</label>
                      <span className="text-xs font-mono text-gray-500">{local.image_shadow_blur || 0}px</span>
                    </div>
                    <input
                      type="range" min="0" max="60" step="1"
                      value={local.image_shadow_blur || 0}
                      onChange={e => set('image_shadow_blur', Number(e.target.value))}
                      className="w-full accent-green-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ HEADER TAB ══ */}
      {designTab === 'header' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Bar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
              <div>
                <h3 className="font-bold text-gray-800">{wb('header_top_bar')}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{wb('header_top_bar_hint')}</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!local.top_bar_enabled} onChange={e => set('top_bar_enabled', e.target.checked)} className="w-4 h-4 accent-green-600" />
                <span className="text-sm font-medium text-gray-700">{wb('header_top_bar_enabled')}</span>
              </label>
            </div>
            {local.top_bar_enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{wb('header_top_bar_content')}</label>
                  <TopBarEditor value={local.top_bar_html} onChange={v => set('top_bar_html', v)} bgColor={local.top_bar_bg_color}
                    paletteColors={[local.primary_color, local.secondary_color, local.accent_color, local.bg_color, local.text_color, local.nav_text_color, local.footer_bg_color, local.top_bar_bg_color, local.top_bar_text_color].filter(Boolean)}
                    pages={pages} />
                  <p className="text-xs text-gray-400 mt-1">{wb('header_top_bar_content_hint')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{wb('header_top_bar_bg')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {local.top_bar_bg_color !== 'transparent' && (
                      <InlineColorPicker value={local.top_bar_bg_color || '#f8f5ef'} onChange={v => set('top_bar_bg_color', v)} paletteColors={paletteColors} />
                    )}
                    <button
                      onClick={() => set('top_bar_bg_color', local.top_bar_bg_color === 'transparent' ? '#f8f5ef' : 'transparent')}
                      style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, padding:'4px 9px', borderRadius:6, cursor:'pointer', fontWeight:500,
                        border: local.top_bar_bg_color === 'transparent' ? '1.5px solid #3b82f6' : '1px solid #d1d5db',
                        background: local.top_bar_bg_color === 'transparent' ? '#eff6ff' : '#fff',
                        color: local.top_bar_bg_color === 'transparent' ? '#2563eb' : '#6b7280' }}>
                      <span style={{ width:12, height:12, borderRadius:2, display:'inline-block', border:'1px solid #d1d5db',
                        background: checkered, backgroundSize:'6px 6px', backgroundPosition:'0 0,0 3px,3px -3px,-3px 0' }} />
                      {local.top_bar_bg_color === 'transparent' ? wb('transparent_checked') : wb('transparent')}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{wb('header_top_bar_text')}</label>
                  <InlineColorPicker value={local.top_bar_text_color} onChange={v => set('top_bar_text_color', v)} paletteColors={paletteColors} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{wb('header_top_bar_align')}</label>
                  <div className="flex gap-2">
                    {[['left',wb('align_left')],['center',wb('align_center')],['right',wb('align_right')]].map(([v,l]) => (
                      <button key={v} onClick={() => set('top_bar_align', v)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${local.top_bar_align === v ? 'bg-[#3D6B34] text-white border-[#3D6B34]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Header Banner */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-1 pb-2 border-b border-gray-100">{wb('header_banner')}</h3>
            <p className="text-xs text-gray-400 mb-3">{wb('header_banner_hint')}</p>
            <FormField label={wb('header_layout_lbl')}>
              <div className="flex gap-2">
                {[
                  ['banner_top', wb('header_layout_banner_top'), 'Logo on a colored banner, then the nav bar'],
                  ['nav_top', wb('header_layout_nav_top'), 'Slim nav bar on top, large centered logo below'],
                ].map(([v, l, hint]) => (
                  <button key={v}
                    onClick={() => set('header_layout', v)}
                    title={hint}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${(local.header_layout || 'banner_top') === v ? 'bg-[#3D6B34] text-white border-[#3D6B34]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </FormField>
            <HeaderImagesManager websiteId={site.website_id} hideTitle />
            <div className="mt-4 pt-4 border-t border-gray-100">
              <FormField label={wb('banner_height_lbl')}>
                <div className="flex items-center gap-3">
                  <input type="range" min={60} max={400} value={local.header_height || 120} onChange={e => set('header_height', Number(e.target.value))} className="flex-1 accent-green-600" />
                  <span className="text-sm font-mono text-gray-600 w-12">{local.header_height || 120}px</span>
                </div>
              </FormField>
              <div className="mt-3">
                <ImageUploadField label={wb('logo_lbl')} value={local.logo_url} onChange={url => set('logo_url', url)} hint={wb('logo_hint')} />
              </div>
              <div className="mt-3">
                <ImageUploadField label={wb('favicon_lbl')} value={local.favicon_url} onChange={url => set('favicon_url', url)} hint={wb('favicon_hint')} />
              </div>
              <ColorRowTransparent label={wb('banner_bg_lbl')} field="header_banner_bg_color" fallback={local.primary_color || '#3D6B34'} hint={wb('banner_bg_hint')} />
              <ColorRow label={wb('site_name_color_lbl')} field="nav_text_color" hint={wb('site_name_color_hint')} />
              <div className="flex items-center justify-between py-3 border-t border-gray-50 mt-1">
                <div>
                  <span className="text-sm font-medium text-gray-700">{wb('show_site_name_lbl')}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{wb('show_site_name_hint')}</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={local.show_site_name !== false} onChange={e => set('show_site_name', e.target.checked)} className="w-4 h-4 accent-green-600" />
                  <span className="text-sm text-gray-600">{local.show_site_name !== false ? wb('show_site_name_visible') : wb('show_site_name_hidden')}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-1 pb-2 border-b border-gray-100">{wb('nav_heading')}</h3>
            <p className="text-xs text-gray-400 mb-3">{wb('nav_hint')}</p>
            <div className="mb-3">
              <ImageUploadField label={wb('nav_bg_img_lbl')} value={local.nav_bg_image_url} onChange={url => set('nav_bg_image_url', url)} hint={wb('nav_bg_img_hint')} />
            </div>
            <ColorRow label={wb('nav_bg_color_lbl')} field="primary_color" hint={wb('nav_bg_color_hint')} />
            <ColorRow label={wb('nav_link_color_lbl')} field="nav_text_color" hint={wb('nav_link_color_hint')} />
            <ColorRow label={wb('nav_dropdown_bg_lbl')} field="dropdown_bg_color" hint={wb('nav_dropdown_bg_hint')} />
            <ColorRow label={wb('nav_dropdown_hover_lbl')} field="dropdown_hover_color" hint={wb('nav_dropdown_hover_hint')} />
            {/* Gradient second color + direction */}
            <div className="py-3 border-b border-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">{wb('nav_gradient_lbl')}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{wb('nav_gradient_hint')}</p>
                </div>
                <InlineColorPicker value={local.dropdown_bg_color2 || '#000000'} onChange={v => set('dropdown_bg_color2', v)} paletteColors={paletteColors} popupAlign="right" />
              </div>
              {local.dropdown_bg_color2 && (
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 shrink-0">{wb('nav_gradient_dir_lbl')}</span>
                  <select
                    value={local.dropdown_gradient_dir || '135deg'}
                    onChange={e => set('dropdown_gradient_dir', e.target.value)}
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white"
                  >
                    <option value="to bottom">{wb('nav_dir_top_bottom')}</option>
                    <option value="to right">{wb('nav_dir_left_right')}</option>
                    <option value="135deg">{wb('nav_dir_diag_down')}</option>
                    <option value="45deg">{wb('nav_dir_diag_up')}</option>
                  </select>
                  <button
                    onClick={() => set('dropdown_bg_color2', '')}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded border border-gray-200 hover:border-red-300"
                  >{wb('nav_gradient_clear')}</button>
                  <div style={{
                    width: 40, height: 20, borderRadius: 4, border: '1px solid #e5e7eb',
                    background: `linear-gradient(${local.dropdown_gradient_dir || '135deg'}, ${local.dropdown_bg_color || local.primary_color || '#3D6B34'}, ${local.dropdown_bg_color2})`
                  }} />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3">{wb('nav_preview_hint')}</p>
            {renderHeaderPreview()}
          </div>

          {/* ── Footer ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
            <h3 className="font-bold text-gray-800 mb-1 pb-2 border-b border-gray-100">{wb('footer_heading')}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-3">
              <div>
                <div className="mb-3">
                  <ImageUploadField label={wb('footer_bg_img_lbl')} value={local.footer_bg_image_url} onChange={url => set('footer_bg_image_url', url)} hint={wb('footer_bg_img_hint')} />
                </div>
                <ColorRowTransparent label={wb('footer_bg_color_lbl')} field="footer_bg_color" fallback={local.primary_color || '#3D6B34'} hint={wb('footer_bg_color_hint')} />
                <ColorRowTransparent label={wb('footer_copyright_bar_lbl')} field="copyright_bar_bg_color" fallback="rgba(0,0,0,0.15)" hint={wb('footer_copyright_bar_hint')} />
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{wb('footer_height_lbl')}</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={80} max={600} value={local.footer_height || 200} onChange={e => set('footer_height', Number(e.target.value))} className="flex-1 accent-green-600" />
                    <span className="text-sm font-mono text-gray-600 w-12">{local.footer_height || 200}px</span>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{wb('footer_radius_lbl')}</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={60} value={local.footer_bottom_radius || 0} onChange={e => set('footer_bottom_radius', Number(e.target.value))} className="flex-1 accent-green-600" />
                    <span className="text-sm font-mono text-gray-600 w-12">{local.footer_bottom_radius || 0}px</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{wb('footer_copyright_text_lbl')}</label>
                <p className="text-xs text-gray-400 mb-2">{wb('footer_copyright_hint')}</p>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  placeholder={`© ${new Date().getFullYear()} ${site.site_name} · All rights reserved`}
                  value={local.copyright_text} onChange={e => set('copyright_text', e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">{wb('footer_copyright_blank_hint')}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">{wb('footer_content_lbl')}</label>
                  <p className="text-xs text-gray-400 mt-0.5">{wb('footer_content_hint')}</p>
                </div>
                {local.footer_html && (
                  <button onClick={() => set('footer_html', '')} className="text-xs text-white rounded-lg px-3 py-1 transition-colors" style={{ background: '#C0382B' }}>
                    {wb('footer_remove_content')}
                  </button>
                )}
              </div>
              <TopBarEditor value={local.footer_html} onChange={v => set('footer_html', v)}
                bgColor={local.footer_bg_image_url ? undefined : local.footer_bg_color}
                paletteColors={[local.primary_color, local.secondary_color, local.accent_color, local.bg_color, local.text_color, local.nav_text_color, local.footer_bg_color].filter(Boolean)}
                pages={pages} />
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2 font-medium">{wb('footer_preview')}</p>
              {renderFooterPreview()}
            </div>
          </div>
        </div>
      )}

      {/* Always visible: palette strip + save */}
      <div className="mt-5 flex items-center justify-end gap-3">
        {autoSaved && !saving && (
          <span className="text-xs text-green-600 font-medium animate-pulse">{wb('design_auto_saved')}</span>
        )}
        <button onClick={() => onSave(local)} disabled={saving}
          className="regsubmit2 px-8 py-2.5 text-sm disabled:opacity-50">
          {saving ? wb('design_saving') : wb('design_save')}
        </button>
      </div>
    </div>
  );
}

// ── Version History panel ─────────────────────────────────────────
function VersionHistoryPanel({ websiteId }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const [versions, setVersions]   = useState([]);
  const [label, setLabel]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [restoring, setRestoring] = useState(false);

  const load = () => {
    fetch(`${API}/api/website/versions/${websiteId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } })
      .then(r => r.json()).then(d => setVersions(Array.isArray(d) ? d : [])).catch(() => {});
  };
  useEffect(() => { if (websiteId) load(); }, [websiteId]);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/api/website/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ website_id: websiteId, version_label: label || undefined }),
      });
      setLabel('');
      load();
    } catch { alert(wb('version_save_error')); }
    finally { setSaving(false); }
  };

  const restore = async (vid, lbl) => {
    if (!window.confirm(wb('version_restore_confirm', { label: lbl }))) return;
    setRestoring(vid);
    try {
      await fetch(`${API}/api/website/versions/${vid}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      window.location.reload();
    } catch { alert(wb('version_restore_error')); }
    finally { setRestoring(false); }
  };

  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-1 pb-2 border-b border-gray-100">{wb('version_heading')}</h3>
      <p className="text-xs text-gray-400 mb-3">{wb('version_hint')}</p>
      <div className="flex gap-2 mb-4">
        <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          placeholder={wb('version_label_ph')}
          value={label} onChange={e => setLabel(e.target.value)} />
        <button onClick={save} disabled={saving}
          className="bg-[#3D6B34] text-white text-sm font-semibold px-4 rounded-lg hover:bg-[#2d5226] transition-colors disabled:opacity-50">
          {saving ? '…' : wb('version_save_btn')}
        </button>
      </div>
      {versions.length === 0
        ? <p className="text-xs text-gray-400">{wb('version_none')}</p>
        : (
          <div className="space-y-2">
            {versions.map(v => (
              <div key={v.version_id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">{v.version_label || wb('version_n', { n: v.version_id })}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(v.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => restore(v.version_id, v.version_label || wb('version_n', { n: v.version_id }))}
                  disabled={restoring === v.version_id}
                  className="text-xs font-medium text-[#3D6B34] border border-[#3D6B34]/30 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50">
                  {restoring === v.version_id ? wb('version_restoring') : wb('version_restore')}
                </button>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ── Settings full view ────────────────────────────────────────────
function SettingsView({ site, onSave, saving, onDelete }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [local, setLocal] = useState({
    site_name:     site.site_name     || '',
    slug:          site.slug          || '',
    tagline:       site.tagline       || '',
    phone:         site.phone         || '',
    email:         site.email         || '',
    address:       site.address       || '',
    facebook_url:  site.facebook_url  || '',
    instagram_url: site.instagram_url || '',
    twitter_url:   site.twitter_url   || '',
    meta_title:    site.meta_title    || '',
    canonical_url: site.canonical_url || '',
    og_image_url:  site.og_image_url  || '',
    seo_extras_json: site.seo_extras_json || '{}',
  });

  const fi = (key, label, placeholder = '', type = 'text') => (
    <FormField label={label}>
      <input type={type} className={inp} value={local[key]} placeholder={placeholder}
        onChange={e => setLocal(p => ({ ...p, [key]: e.target.value }))} />
    </FormField>
  );

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">{wb('settings_heading')}</h2>
      <p className="text-sm text-gray-500 mb-5">{wb('settings_hint')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">{wb('settings_site_info')}</h3>
          {fi('site_name', wb('settings_site_name'))}
          <FormField label={wb('settings_url_slug')}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 shrink-0">{SITE_BASE_URL}/sites/</span>
              <input className={inp} value={local.slug} placeholder="my-farm"
                onChange={e => setLocal(p => ({ ...p, slug: slugify(e.target.value) }))} />
            </div>
          </FormField>
          {fi('tagline', wb('settings_tagline'), wb('settings_tagline_ph'))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">{wb('settings_contact')}</h3>
          {fi('phone', wb('settings_phone'), wb('settings_phone_ph'), 'tel')}
          {fi('email', wb('settings_email'), wb('settings_email_ph'), 'email')}
          {fi('address', wb('settings_address'), wb('settings_address_ph'))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">{wb('settings_social')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {fi('facebook_url',  wb('settings_facebook'),  wb('settings_facebook_ph'))}
            {fi('instagram_url', wb('settings_instagram'), wb('settings_instagram_ph'))}
            {fi('twitter_url',   wb('settings_twitter'),   wb('settings_twitter_ph'))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">{wb('settings_seo')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={wb('settings_meta_title')}>
              <input className={inp} value={local.meta_title} placeholder={local.site_name}
                onChange={e => setLocal(p => ({ ...p, meta_title: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1">{wb('settings_meta_title_hint')}</p>
            </FormField>
            <FormField label={wb('settings_canonical')}>
              <input className={inp} value={local.canonical_url} placeholder={wb('settings_canonical_ph')}
                onChange={e => setLocal(p => ({ ...p, canonical_url: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1">{wb('settings_canonical_hint')}</p>
            </FormField>
            <FormField label={wb('settings_og_image')}>
              <input className={inp} value={local.og_image_url} placeholder={wb('settings_og_image_ph')}
                onChange={e => setLocal(p => ({ ...p, og_image_url: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1">{wb('settings_og_image_hint')}</p>
            </FormField>
            <FormField label={wb('settings_schema')}>
              <textarea className={`${inp} font-mono text-xs min-h-[80px] resize-y`}
                value={(() => { try { const p = JSON.parse(local.seo_extras_json || '{}'); return p.schema_jsonld || ''; } catch { return ''; } })()}
                placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "LocalBusiness",\n  "name": "Your Farm"\n}'}
                onChange={e => {
                  try {
                    const parsed = JSON.parse(local.seo_extras_json || '{}');
                    setLocal(p => ({ ...p, seo_extras_json: JSON.stringify({ ...parsed, schema_jsonld: e.target.value }) }));
                  } catch { setLocal(p => ({ ...p, seo_extras_json: JSON.stringify({ schema_jsonld: e.target.value }) })); }
                }} />
              <p className="text-xs text-gray-400 mt-1">{wb('settings_schema_hint')}</p>
            </FormField>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-1 pb-2 border-b border-gray-100">{wb('settings_custom_domain')}</h3>
          <DomainInstructions siteSlug={site.slug} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button onClick={() => setConfirmDelete(true)}
          className="text-sm text-white rounded-xl px-4 py-2.5 transition-colors" style={{ background: '#C0382B' }}>
          {wb('settings_delete')}
        </button>
        <button onClick={() => onSave(local)} disabled={saving}
          className="regsubmit2 px-8 py-2.5 text-sm disabled:opacity-50">
          {saving ? wb('settings_saving') : wb('settings_save')}
        </button>
      </div>

      <div className="mt-5 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <VersionHistoryPanel websiteId={site.website_id} />
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 36, marginBottom: 12, textAlign: 'center' }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8, textAlign: 'center' }}>{wb('settings_delete_title')}</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 6, textAlign: 'center' }}>
              {wb('settings_delete_body')}
            </p>
            <p style={{ fontSize: 14, color: '#C0382B', fontWeight: 600, marginBottom: 24, textAlign: 'center' }}>
              {wb('settings_delete_warning')}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(false)}
                style={{ flex: 1, padding: '10px 20px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {wb('settings_delete_cancel')}
              </button>
              <button onClick={() => { setConfirmDelete(false); onDelete(); }}
                style={{ flex: 1, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#C0382B', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {wb('settings_delete_yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Domain connection instructions ───────────────────────────────
function DomainInstructions({ siteSlug }) {
  const { t } = useTranslation(); const wb = k => t(`website_builder.${k}`);
  const [registrar, setRegistrar] = useState('godaddy');
  const [domain, setDomain] = useState('');
  const [copied, setCopied] = useState(null);

  const CNAME_TARGET = 'oatmealfarmnetwork-802455386518.us-central1.run.app';
  const PUBLIC_URL   = `https://oatmealfarmnetwork.com/sites/${siteSlug}`;

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, id }) => (
    <button onClick={() => copy(text, id)}
      className={`ml-2 px-2 py-0.5 text-xs rounded font-medium transition-colors ${copied === id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
      {copied === id ? wb('domain_copied') : wb('domain_copy')}
    </button>
  );

  const CodeLine = ({ label, value, id }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-500 w-24 shrink-0">{label}</span>
      <span className="flex-grow font-mono text-sm text-gray-800 bg-gray-50 rounded px-2 py-1 mx-2 break-all">{value}</span>
      <CopyBtn text={value} id={id} />
    </div>
  );

  return (
    <div className="mt-3">
      <p className="text-sm text-gray-600 mb-4">
        {wb('domain_intro')}
        <a href={PUBLIC_URL} target="_blank" rel="noreferrer" className="ml-1 text-[#3D6B34] underline break-all">{PUBLIC_URL}</a>
      </p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { id: 'godaddy',    label: wb('domain_godaddy') },
          { id: 'namecheap',  label: wb('domain_namecheap') },
          { id: 'cloudflare', label: wb('domain_cloudflare') },
          { id: 'other',      label: wb('domain_other') },
        ].map(r => (
          <button key={r.id} onClick={() => setRegistrar(r.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${registrar === r.id ? 'bg-[#3D6B34] text-white border-[#3D6B34]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-1">{wb('domain_your_domain')}</label>
        <input className={inp + ' max-w-sm'} placeholder={wb('domain_ph')} value={domain}
          onChange={e => setDomain(e.target.value.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, ''))} />
      </div>

      {registrar === 'godaddy' && (
        <div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">GoDaddy — Step by Step</p>
            <p className="text-xs text-amber-700">Follow these steps in your GoDaddy account. DNS changes can take up to 48 hours to propagate.</p>
          </div>
          <ol className="flex flex-col gap-4">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[#3D6B34] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div><p className="text-sm font-semibold text-gray-800">Log in to GoDaddy</p><p className="text-xs text-gray-500 mt-0.5">Go to <a href="https://dcc.godaddy.com/manage/dns" target="_blank" rel="noreferrer" className="text-[#3D6B34] underline">GoDaddy DNS Manager</a> and select <strong>{domain || 'your domain'}</strong>.</p></div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[#3D6B34] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Add a CNAME record for <code className="bg-gray-100 px-1 rounded">www</code></p>
                <div className="mt-2 bg-white border border-gray-200 rounded-lg px-3 py-1">
                  <CodeLine label="Type"  value="CNAME"        id="gd-type" />
                  <CodeLine label="Name"  value="www"          id="gd-name" />
                  <CodeLine label="Value" value={CNAME_TARGET} id="gd-value" />
                  <CodeLine label="TTL"   value="1 Hour"       id="gd-ttl" />
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[#3D6B34] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Redirect the root domain to www</p>
                <div className="mt-2 bg-white border border-gray-200 rounded-lg px-3 py-1">
                  <CodeLine label="Forward" value={domain ? `http://${domain}` : 'http://yourdomain.com'} id="gd-fwd-from" />
                  <CodeLine label="To"      value={domain ? `https://www.${domain}` : 'https://www.yourdomain.com'} id="gd-fwd-to" />
                  <CodeLine label="Type"    value="Permanent (301)" id="gd-fwd-type" />
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-[#3D6B34] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
              <div><p className="text-sm font-semibold text-gray-800">Contact us to complete setup</p><p className="text-xs text-gray-500 mt-0.5">Email <a href="mailto:john@oatmealfarmnetwork.com" className="text-[#3D6B34] underline">john@oatmealfarmnetwork.com</a> with your domain name so we can configure SSL and routing on our end.</p></div>
            </li>
          </ol>
        </div>
      )}

      {registrar === 'namecheap' && (
        <div className="flex flex-col gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">Namecheap — DNS Records</p>
            <p className="text-xs text-blue-700">Go to <strong>Domain List → Manage → Advanced DNS</strong> and add these records.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-1">
            <CodeLine label="Type"  value="CNAME"        id="nc-type" />
            <CodeLine label="Host"  value="www"          id="nc-host" />
            <CodeLine label="Value" value={CNAME_TARGET} id="nc-value" />
            <CodeLine label="TTL"   value="Automatic"    id="nc-ttl" />
          </div>
          <p className="text-xs text-gray-500">Then email <a href="mailto:john@oatmealfarmnetwork.com" className="text-[#3D6B34] underline">john@oatmealfarmnetwork.com</a> with your domain to complete SSL setup.</p>
        </div>
      )}

      {registrar === 'cloudflare' && (
        <div className="flex flex-col gap-4">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-orange-800 mb-1">Cloudflare — DNS Records</p>
            <p className="text-xs text-orange-700">In Cloudflare, go to your domain → <strong>DNS → Records → Add record</strong>. Set the proxy to <strong>DNS only</strong> (grey cloud) initially.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-1">
            <CodeLine label="Type"   value="CNAME"        id="cf-type" />
            <CodeLine label="Name"   value="www"          id="cf-name" />
            <CodeLine label="Target" value={CNAME_TARGET} id="cf-target" />
            <CodeLine label="Proxy"  value="DNS only (grey cloud)" id="cf-proxy" />
          </div>
          <p className="text-xs text-gray-500">Then email <a href="mailto:john@oatmealfarmnetwork.com" className="text-[#3D6B34] underline">john@oatmealfarmnetwork.com</a> with your domain to complete SSL setup.</p>
        </div>
      )}

      {registrar === 'other' && (
        <div className="flex flex-col gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-1">Any Registrar — CNAME Record</p>
            <p className="text-xs text-gray-600">Log in to your domain registrar and add the following DNS record. The exact steps vary by provider.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-1">
            <CodeLine label="Type"          value="CNAME"        id="oth-type" />
            <CodeLine label="Name / Host"   value="www"          id="oth-name" />
            <CodeLine label="Value / Points to" value={CNAME_TARGET} id="oth-value" />
          </div>
          <p className="text-xs text-gray-500">After adding the DNS record, email <a href="mailto:john@oatmealfarmnetwork.com" className="text-[#3D6B34] underline">john@oatmealfarmnetwork.com</a> with your domain name. We'll configure SSL and routing on our servers — usually within 1 business day.</p>
        </div>
      )}

      <div className="mt-5 p-4 rounded-xl bg-[#3D6B34]/5 border border-[#3D6B34]/20">
        <p className="text-sm font-semibold text-[#3D6B34] mb-1">{wb('domain_need_help')}</p>
        <p className="text-xs text-gray-600">
          Email <a href="mailto:john@oatmealfarmnetwork.com" className="text-[#3D6B34] underline font-medium">john@oatmealfarmnetwork.com</a> with:
          <br />• Your domain name (e.g. {domain || 'yourfarm.com'})
          <br />• Your registrar (GoDaddy, Namecheap, etc.)
          <br />We'll handle the rest and have your domain live within 1 business day.
        </p>
      </div>
    </div>
  );
}
