// Ported from Oatmeal Farm Network (src/AboutThaiyme.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
﻿// src/AboutThaiyme.jsx
// Route: /platform/thaiyme
import React from 'react';
import { Link } from 'react-router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useIsLoggedIn } from '../../lib/useIsLoggedIn';

const ACCENT = '#7A5A3D';
const ACCENT_LIGHT = '#fdf6ee';
const ACCENT_BORDER = '#e8d5bc';

export default function AboutThaiyme() {
  const isLoggedIn = useIsLoggedIn();
  const S = (p) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ACCENT}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p} />
  );

  const capabilities = [
    {
      icon: <S><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></S>,
      title: 'Accounting Assistant',
      body: 'Revenue snapshot, open invoices, recent payments, customer search — answers questions about your books in plain language without you leaving the page.',
    },
    {
      icon: <S><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></S>,
      title: 'Event Registration',
      body: 'Lists registrants with payment status, and can propose updates to payment status, contact info, or notes — and cancel registrations — via a one-click confirmation card.',
    },
    {
      icon: <S><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></S>,
      title: 'Sponsorship',
      body: 'Revenue by tier, slots sold vs available, and a filterable sponsor list with paid/pending/declined status — so you always know where your sponsorship program stands.',
    },
    {
      icon: <S><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/></S>,
      title: 'Floor Plan & Booth Services',
      body: 'Booth-sales status breakdown (available / reserved / sold / blocked) by tier, plus à la carte services revenue (electrical, water, AV, internet) from add-on purchases.',
    },
    {
      icon: <S><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></S>,
      title: 'Certificates of Insurance',
      body: 'COI status counts (pending / approved / rejected / expired) for your event, plus a flag for any certificates expiring within 30 days.',
    },
    {
      icon: <S><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></S>,
      title: 'Exhibitor Lead Retrieval',
      body: 'Your badge-scan leads from an event, filterable by follow-up status (new / contacted / qualified / won / lost) and minimum star rating — all PII masked.',
    },
    {
      icon: <S><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></S>,
      title: 'Precision Ag Fields',
      body: 'Your satellite-monitored fields: agronomy snapshot, spray decisions, NDVI trend over time, and stress-zone mapping — all from the same chat bubble.',
    },
    {
      icon: <S><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></S>,
      title: 'Confirm Before Executing',
      body: 'Every write action surfaces as a confirmation card you approve explicitly. Thaiyme never mutates data — registrations, payment status, notes — without your say-so.',
    },
    {
      icon: <S><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></S>,
      title: 'PII-Safe by Design',
      body: 'SSNs, card numbers, routing numbers, emails, and phone numbers are redacted server-side before any payload reaches the AI model. The model never sees raw sensitive data.',
    },
    {
      icon: <S><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></S>,
      title: 'Context-Aware',
      body: 'Knows which page you\'re on and loads the relevant data automatically — accounting, event registrations, sponsorship, floor plan — based on what\'s in scope.',
    },
  ];

  const questionGroups = [
    {
      label: 'Accounting',
      questions: [
        '"What was my total revenue last month, and how does that compare to the prior month?"',
        '"Which of my invoices are more than 30 days overdue?"',
        '"Show me the last ten payments I received."',
      ],
    },
    {
      label: 'Event Registration',
      questions: [
        '"Show me all registrants for the Fall Harvest Fair who haven\'t paid yet."',
        '"Are there any duplicate registrations in tonight\'s event?"',
        '"Mark registration #284 as paid."',
      ],
    },
    {
      label: 'Sponsorship & Floor Plan',
      questions: [
        '"How is the Gold sponsorship tier selling — any slots left?"',
        '"How many booths have been sold versus what\'s still available?"',
        '"How much have we collected in booth services add-ons so far?"',
      ],
    },
    {
      label: 'Leads & COI',
      questions: [
        '"Show me my qualified leads from the Midwest Ag Expo, 3 stars and up."',
        '"How many COIs are still pending approval for the trade show?"',
        '"Any insurance certificates expiring in the next 30 days?"',
      ],
    },
    {
      label: 'Precision Ag',
      questions: [
        '"What\'s the NDVI trend on my North Field over the last 6 months?"',
        '"Should I be spraying fungicide on Field 3 right now?"',
        '"Which zones in my South Field are showing stress?"',
      ],
    },
  ];

  const where = [
    {
      icon: <S><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></S>,
      title: 'Accounting Dashboard',
      body: 'Available on every accounting page — invoices, expenses, customers, vendors, and reports.',
      to: '/accounting',
    },
    {
      icon: <S><rect x="2" y="3" width="20" height="15" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/></S>,
      title: 'Event Management Pages',
      body: 'Appears on event registration, check-in, floor plan, sponsorship, leads, and COI pages.',
      to: '/events',
    },
  ];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="Thaiyme | Business Operations AI for OFN"
        description="Thaiyme is the Livestock Of America business-operations AI — accounting assistant, event organizer analyst, sponsorship tracker, lead retrieval, and precision-ag field advisor."
        keywords="business operations AI, accounting AI assistant, event management software, sponsorship tracking, lead retrieval AI, Thaiyme AI, Livestock Of America, farm business software"
        canonical="https://livestockofamerica.com/platform/thaiyme"
        // Not indexed: Thaiyme is not built here, so this page markets something a
        // visitor cannot get to.
        noIndex
        imageAlt="Thaiyme Business Operations AI — Livestock Of America"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            'name': 'Thaiyme',
            'applicationCategory': 'BusinessApplication',
            'operatingSystem': 'Web',
            'url': 'https://livestockofamerica.com/platform/thaiyme',
            'description': 'AI business-operations consultant — accounting analysis, event management, sponsorship tracking, lead retrieval, and field reporting.',
            'featureList': ['Accounting analysis', 'Event management', 'Sponsorship tracking', 'Lead retrieval', 'Floor plan management', 'Field reports'],
            'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
            'provider': { '@type': 'Organization', 'name': 'Livestock Of America', 'url': 'https://livestockofamerica.com' },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://livestockofamerica.com' },
              { '@type': 'ListItem', 'position': 2, 'name': 'Thaiyme', 'item': 'https://livestockofamerica.com/platform/thaiyme' },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: capabilities.map(c => ({
              '@type': 'Question',
              name: c.title,
              acceptedAnswer: { '@type': 'Answer', text: c.body },
            })),
          },
        ]}
      />
      <Header />

      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Our Services', to: '/platform' },
          { label: 'Thaiyme' },
        ]} />
      </div>

      {/* Hero */}
      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl" style={{ backgroundImage: 'url(/images/ThaiymeBanner.webp)', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: 260 }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(30,15,5,0.72) 0%, rgba(30,15,5,0.45) 65%, rgba(30,15,5,0.1) 100%)' }} />
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-8" style={{ maxWidth: '720px' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
                <img src="/images/ThaiymeAIIcon.webp" alt="Thaiyme" width="28" height="28" style={{ display: 'block', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.85)' }}>Business Operations AI</span>
            </div>
            <h1 style={{ color: '#ffffff', fontFamily: "'Lora','Times New Roman',serif", fontSize: '2rem', fontWeight: 'bold', margin: '0 0 10px', lineHeight: 1.2 }}>
              Meet Thaiyme
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.92rem', margin: '0 0 6px', lineHeight: 1.6 }}>
              The AI agent that lives inside your accounting, event management, and field monitoring pages. Ask about revenue, dig into registrant data, check sponsorship sales, retrieve exhibitor leads, or review your fields — all without leaving the page you're on.
            </p>
            <div className="flex flex-wrap gap-3">
              {!isLoggedIn && (
                <Link to="/signup"
                  className="bg-white font-bold px-5 py-2.5 rounded-lg shadow hover:shadow-md transition text-sm"
                  style={{ color: ACCENT }}>
                  Open My Account →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        {/* What Thaiyme does */}
        <section className="mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            What Thaiyme Does
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Thaiyme is an AI consultant integrated directly into your OFN account. By analyzing your financial records, event data, floor plan sales, and field reports, it provides clear answers to your complex operational questions. When making updates, Thaiyme always drafts the changes for your approval before taking action. To ensure security, all personal identifying information is removed before data is processed, keeping your sensitive details private.
          </p>
        </section>

        {/* Capabilities */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capabilities.map(c => (
              <div key={c.title} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center shrink-0">{c.icon}</span>
                  <h3 className="font-bold text-gray-900">{c.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Where to find Thaiyme */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            Where You'll Find Him
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {where.map(w => (
              <div key={w.title} className="flex bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="shrink-0 flex items-center justify-center"
                     style={{ width: '100px', minHeight: '100px', backgroundColor: ACCENT_LIGHT, color: ACCENT }}>
                  {w.icon}
                </div>
                <div className="flex flex-col justify-between px-5 py-4 flex-1 min-w-0">
                  <div>
                    <p className="font-bold text-sm mb-1" style={{ color: ACCENT }}>{w.title}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{w.body}</p>
                  </div>
                  <div className="mt-3">
                    <Link to={w.to} className="text-xs font-bold hover:underline" style={{ color: ACCENT }}>
                      GO THERE →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Look for the brown bubble in the bottom-right corner of any accounting or event management page.
          </p>
        </section>

        {/* Example questions — grouped by topic */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-5"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            What You Can Ask
          </h2>
          <div className="space-y-6">
            {questionGroups.map(group => (
              <div key={group.label}>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>
                  {group.label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {group.questions.map((q, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-800 italic">
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How the confirm flow works */}
        <section className="mt-10 bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            How the Confirm Flow Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'You ask', body: 'Type a question or request into the Thaiyme bubble on any supported page.' },
              { step: '2', title: 'Thaiyme proposes', body: 'For read actions, he answers immediately. For write actions, he surfaces a confirmation card summarizing exactly what will change.' },
              { step: '3', title: 'You approve', body: 'Click Yes to execute, or No to discard. Nothing in your account changes until you confirm.' },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white" style={{ backgroundColor: ACCENT }}>
                  {s.step}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900 mb-1">{s.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-10 text-center bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            Thaiyme Is Already in Your Account
          </h3>
          <p className="text-sm text-gray-600 mb-5 max-w-xl mx-auto">
            No installation. No configuration. Open your accounting dashboard or any event management page and tap the brown bubble in the corner.
          </p>
          {!isLoggedIn && (
            <Link to="/signup"
              className="inline-block px-6 py-3 rounded-lg font-bold shadow hover:shadow-md transition text-white"
              style={{ backgroundColor: ACCENT, color: '#ffffff' }}>
              Create an Account
            </Link>
          )}
        </section>

      </div>
      <Footer />
    </div>
  );
}
