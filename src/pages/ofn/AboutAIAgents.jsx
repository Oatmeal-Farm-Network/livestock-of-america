// Ported from Oatmeal Farm Network (src/AboutAIAgents.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
﻿import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';

const S = ({ children, size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

// Static data: only non-text fields (icon, color, cta.to, learnMore.to, capCount)
const AGENT_DATA = [
  {
    key: 'saige',
    color: '#3D6B34',
    icon: (
      <svg width="36" height="36" viewBox="0 0 16 16" fill="none" stroke="white"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 14V8"/>
        <path d="M5 11c0-3 3-4 3-7 0 3 3 4 3 7a3 3 0 0 1-6 0z"/>
        <path d="M3 8c1-2 2.5-2.5 5-2"/>
        <path d="M13 8c-1-2-2.5-2.5-5-2"/>
      </svg>
    ),
    ctaTo: '/saige',
    learnMoreTo: '/platform/saige',
    capCount: 5,
  },
  {
    key: 'pairsley',
    color: '#2f7d4a',
    icon: (
      <svg width="36" height="36" viewBox="0 0 16 16" fill="none" stroke="white"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 2v5a3 3 0 0 0 6 0V2"/>
        <line x1="8" y1="10" x2="8" y2="14"/>
        <line x1="5" y1="14" x2="11" y2="14"/>
        <line x1="5" y1="4" x2="5" y2="2"/>
      </svg>
    ),
    ctaTo: '/restaurant/farms',
    learnMoreTo: '/platform/pairsley',
    capCount: 5,
  },
  {
    key: 'rosemarie',
    color: '#8B5CF6',
    icon: (
      <svg width="36" height="36" viewBox="0 0 16 16" fill="none" stroke="white"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2c-1 2-3 3-3 5.5A3 3 0 0 0 8 11a3 3 0 0 0 3-3.5C11 5 9 4 8 2z"/>
        <path d="M6 10c-1 1-1.5 2.5-1 3.5"/>
        <path d="M10 10c1 1 1.5 2.5 1 3.5"/>
        <line x1="8" y1="11" x2="8" y2="14"/>
      </svg>
    ),
    ctaTo: '/account',
    learnMoreTo: '/platform/rosemarie',
    capCount: 5,
  },
  {
    key: 'thaiyme',
    color: '#7A5A3D',
    icon: (
      <img src="/images/ThaiymeAIIcon.webp" alt="Thaiyme"
        style={{ width: 36, height: 36, display: 'block', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
    ),
    ctaTo: '/signup',
    learnMoreTo: null,
    capCount: 5,
  },
  // Lavendir's card is dropped while she is switched off in
  // lib/hiddenFeatures.js -- no point advertising an agent with no way in.
];

export default function AboutAIAgents() {
  const { t } = useTranslation();

  const agents = AGENT_DATA.map(a => ({
    ...a,
    name: a.key.charAt(0).toUpperCase() + a.key.slice(1),
    tagline: t(`ai_agents.${a.key}_tagline`),
    audience: t(`ai_agents.${a.key}_audience`),
    description: t(`ai_agents.${a.key}_desc`),
    capabilities: Array.from({ length: a.capCount }, (_, i) => t(`ai_agents.${a.key}_cap${i + 1}`)),
    cta: { label: t(`ai_agents.${a.key}_cta`), to: a.ctaTo },
    learnMore: a.learnMoreTo ? { label: t(`ai_agents.${a.key}_learn`), to: a.learnMoreTo } : null,
  }));

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f2e8' }}>
      <PageMeta
        title="AI Agents | Livestock Of America"
        description="Meet Saige, Pairsley, Rosemarie, Thaiyme, and Lavendir — five purpose-built AI agents covering every role in the food system, from field to fork to website."
        canonical="https://livestockofamerica.com/ai-agents"
      />
      <Header />

      {/* Breadcrumbs */}
      <div className="mx-auto px-4 pt-4" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'AI Agents' },
        ]} />
      </div>

      {/* Hero — photo + gradient overlay */}
      <div className="mx-auto px-4 pt-2" style={{ maxWidth: '1300px' }}>
        <div className="relative w-full overflow-hidden rounded-xl">
          <img
            src="/images/CoreFeaturesFarm2Table.webp"
            alt="AI Agents for Agriculture"
            className="w-full object-cover"
            style={{ height: '260px', display: 'block' }}
            loading="eager"
            onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(18,72,38,0.92) 0%, rgba(18,72,38,0.75) 45%, rgba(18,72,38,0) 78%)' }}
          />
          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6" style={{ maxWidth: '720px' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.22)', color: 'white' }}>
                <S size={22}>
                  <circle cx="8" cy="5" r="2.5"/>
                  <path d="M3 14c0-3.3 2.2-5 5-5s5 1.7 5 5"/>
                  <circle cx="13" cy="4" r="1.5"/>
                  <circle cx="3" cy="4" r="1.5"/>
                  <path d="M14.5 11c0-2.2-1-3.5-1.5-3.5"/>
                  <path d="M1.5 11c0-2.2 1-3.5 1.5-3.5"/>
                </S>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ffffff' }}>{t('ai_agents.hero_badge')}</span>
            </div>
            <h1 style={{ color: '#ffffff', fontFamily: "'Lora','Times New Roman',serif", fontSize: '2rem', fontWeight: 'bold', margin: '0 0 10px', lineHeight: 1.2 }}>
              {t('ai_agents.hero_title')}
            </h1>
            <p style={{ color: '#ffffff', fontSize: '0.92rem', margin: '0 0 16px', lineHeight: 1.6 }}>
              {t('ai_agents.hero_body')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/saige" className="bg-white font-bold px-5 py-2.5 rounded-lg shadow hover:shadow-md transition text-sm" style={{ color: '#3D6B34' }}>
                {t('ai_agents.hero_cta1')}
              </Link>
              <Link to="/signup" className="border-2 font-bold px-5 py-2.5 rounded-lg transition text-sm hover:bg-white/10" style={{ borderColor: '#ffffff', color: '#ffffff' }}>
                {t('ai_agents.hero_cta2')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1300px' }}>

        <p className="mt-6 text-gray-700 leading-relaxed max-w-3xl">
          {t('ai_agents.intro')}
        </p>

        {/* Agent Cards */}
        <div className="mt-8 space-y-6">
          {agents.map(agent => (
            <AgentCard key={agent.key} agent={agent} />
          ))}
        </div>

        {/* Shared traits */}
        <section className="mt-12 bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('ai_agents.common_title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Trait title={t('ai_agents.trait1_title')} body={t('ai_agents.trait1_body')} />
            <Trait title={t('ai_agents.trait2_title')} body={t('ai_agents.trait2_body')} />
            <Trait title={t('ai_agents.trait3_title')} body={t('ai_agents.trait3_body')} />
          </div>
        </section>

        {/* CTA */}
        <section className="mt-8 text-center bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: "'Lora','Times New Roman',serif" }}>
            {t('ai_agents.cta_title')}
          </h3>
          <p className="text-sm text-gray-600 mb-5">
            {t('ai_agents.cta_body')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/saige"
              className="px-6 py-3 rounded-lg text-white font-bold shadow hover:shadow-md transition"
              style={{ backgroundColor: '#3D6B34' }}>
              {t('ai_agents.cta1')}
            </Link>
            <Link to="/signup"
              className="px-6 py-3 rounded-lg font-bold border-2 transition hover:bg-green-50"
              style={{ color: '#3D6B34', borderColor: '#3D6B34' }}>
              {t('ai_agents.cta2')}
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}

function AgentCard({ agent }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-5 flex items-start gap-4" style={{ backgroundColor: agent.color }}>
        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          {agent.icon}
        </div>
        <div className="text-white min-w-0">
          <div className="text-xs font-bold uppercase tracking-widest text-white/80 mb-0.5">{t('ai_agents.agent_badge')}</div>
          <h2 className="text-2xl font-bold leading-tight">{agent.name}</h2>
          <div className="text-sm text-white/90 font-semibold">{agent.tagline}</div>
          <div className="text-xs text-white/70 mt-0.5 italic">{agent.audience}</div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <p className="text-gray-700 leading-relaxed text-sm mb-4">{agent.description}</p>

        <ul className="space-y-1.5 mb-5">
          {agent.capabilities.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-0.5 shrink-0 font-bold" style={{ color: agent.color }}>→</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2">
          <Link to={agent.cta.to}
            className="px-4 py-2 rounded-lg text-white text-sm font-bold shadow hover:shadow-md transition"
            style={{ backgroundColor: agent.color }}>
            {agent.cta.label}
          </Link>
          {agent.learnMore && (
            <Link to={agent.learnMore.to}
              className="px-4 py-2 rounded-lg text-sm font-bold border-2 transition hover:bg-gray-50"
              style={{ color: agent.color, borderColor: agent.color }}>
              {agent.learnMore.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Trait({ title, body }) {
  return (
    <div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  );
}
