// Ported from Oatmeal Farm Network (src/OrgProfile.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams, useNavigate, useLocation } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { useAccount } from '../../lib/AccountContext';
import { getPeopleId } from '../../lib/auth';
const IcoFacebook  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
const IcoPinterest = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.03-2.83.19-.77 1.27-5.38 1.27-5.38s-.32-.65-.32-1.61c0-1.51.87-2.64 1.96-2.64.92 0 1.37.69 1.37 1.53 0 .93-.59 2.33-.9 3.62-.26 1.08.54 1.96 1.6 1.96 1.92 0 3.4-2.02 3.4-4.94 0-2.58-1.86-4.39-4.51-4.39-3.07 0-4.87 2.3-4.87 4.68 0 .93.36 1.92.8 2.46.09.11.1.2.07.31-.08.34-.26 1.08-.3 1.23-.05.2-.17.24-.38.14-1.39-.65-2.26-2.68-2.26-4.32 0-3.51 2.55-6.74 7.36-6.74 3.86 0 6.86 2.75 6.86 6.42 0 3.83-2.41 6.91-5.76 6.91-1.12 0-2.18-.58-2.55-1.27l-.69 2.59c-.25.97-.93 2.18-1.39 2.92.75.23 1.54.36 2.36.36 5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>;
const IcoTwitterX  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
const IcoInstagram = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>;
const IcoLinkedIn  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
const IcoYouTube   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45a2.78 2.78 0 0 0-1.95 1.97A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>;
const IcoGlobe     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IcoBlog      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1" fill="currentColor" stroke="none"/></svg>;

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const GCP = 'https://storage.googleapis.com/oatmeal-farm-network-images/Animals/Uploads';

const SOCIAL_LINKS = [
  { key: 'facebook',    label: 'Facebook',    icon: <IcoFacebook />,  base: 'https://facebook.com/',          color: 'bg-[#1877F2]' },
  { key: 'instagram',   label: 'Instagram',   icon: <IcoInstagram />, base: 'https://instagram.com/',         color: 'bg-[#E1306C]' },
  { key: 'linkedin',    label: 'LinkedIn',    icon: <IcoLinkedIn />,  base: 'https://linkedin.com/company/',  color: 'bg-[#0A66C2]' },
  { key: 'x',          label: 'Twitter / X', icon: <IcoTwitterX />,  base: 'https://twitter.com/',           color: 'bg-black' },
  { key: 'pinterest',  label: 'Pinterest',   icon: <IcoPinterest />, base: 'https://pinterest.com/',         color: 'bg-[#E60023]' },
  { key: 'youtube',    label: 'YouTube',     icon: <IcoYouTube />,   base: 'https://youtube.com/',           color: 'bg-[#FF0000]' },
  { key: 'blog',       label: 'Blog',        icon: <IcoBlog />,      base: '',                               color: 'bg-[#507033]' },
  { key: 'truth_social',label:'Truth Social', icon: <IcoGlobe />,    base: '',                               color: 'bg-[#5b2d8e]' },
  { key: 'other_social1',label:'Social',      icon: <IcoGlobe />,    base: '',                               color: 'bg-gray-500' },
  { key: 'other_social2',label:'Social',      icon: <IcoGlobe />,    base: '',                               color: 'bg-gray-500' },
];

// ── Contact form ──────────────────────────────────────────────────────────────
function ContactForm({ ranch }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', state: '', country: '', message: '' });
  const [answer, setAnswer] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [q] = useState(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { a, b, answer: a + b };
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.firstName || !form.lastName || !form.email) { setError(t('org_profile.form_error_fields')); return; }
    if (parseInt(answer) !== q.answer) { setError(t('org_profile.form_error_math')); return; }
    setSent(true);
  };

  if (sent) return (
    <div style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
      <div style={{ marginBottom: '8px', display:'flex', justifyContent:'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#155724" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h3 style={{ color: '#155724', margin: '0 0 8px' }}>{t('org_profile.form_sent_title')}</h3>
      <p style={{ color: '#155724', margin: 0 }}>{t('org_profile.form_sent_body', { name: ranch.business_name })}</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', padding: '12px', marginBottom: '16px', color: '#721c24', fontSize: '0.9rem' }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={formLabel}>{t('org_profile.form_first_name')}</label>
          <input value={form.firstName} onChange={set('firstName')} required style={formInput} />
        </div>
        <div>
          <label style={formLabel}>{t('org_profile.form_last_name')}</label>
          <input value={form.lastName} onChange={set('lastName')} required style={formInput} />
        </div>
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={formLabel}>{t('org_profile.form_email')}</label>
        <input type="email" value={form.email} onChange={set('email')} required style={formInput} />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={formLabel}>{t('org_profile.form_phone')} <span style={{ color: '#999', fontWeight: 400 }}>{t('org_profile.form_phone_opt')}</span></label>
        <input type="tel" value={form.phone} onChange={set('phone')} style={formInput} />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={formLabel}>{t('org_profile.form_state')} <span style={{ color: '#999', fontWeight: 400 }}>{t('org_profile.form_state_opt')}</span></label>
        <input value={form.state} onChange={set('state')} style={formInput} />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={formLabel}>{t('org_profile.form_message')} <span style={{ color: '#999', fontWeight: 400 }}>{t('org_profile.form_message_opt')}</span></label>
        <textarea value={form.message} onChange={set('message')} rows={5} style={{ ...formInput, resize: 'vertical' }} />
      </div>
      <div style={{ backgroundColor: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
        <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: '0.9rem' }}>{t('org_profile.form_verify')}</p>
        <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#666' }}>{t('org_profile.form_verify_body')}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{q.a} + {q.b} =</span>
          <input type="number" value={answer} onChange={e => setAnswer(e.target.value)}
            placeholder="?" style={{ width: '70px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem', textAlign: 'center' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" style={{ padding: '12px 32px', backgroundColor: '#819360', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>
          {t('org_profile.form_send')}
        </button>
      </div>
    </form>
  );
}

// ── Animal card ───────────────────────────────────────────────────────────────
function AnimalCard({ animal, isStuds }) {
  const { t } = useTranslation();
  const [imgFailed, setImgFailed] = useState(false);
  const detailUrl = `/livestockmarketplace/Animals/Details.asp?ID=${animal.animal_id}`;
  const priceVal = isStuds ? animal.stud_fee : animal.price;

  return (
    <div style={{ border: '1px solid #e8e8e8', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ height: '160px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {!imgFailed && animal.photo ? (
          <a href={detailUrl}>
            <img src={animal.photo} alt={animal.full_name} loading="lazy"
              onError={() => setImgFailed(true)}
              style={{ width: '100%', height: '160px', objectFit: 'contain' }} />
          </a>
        ) : (
          <div style={{ color: '#ccc', fontSize: '12px', textAlign: 'center' }}>{t('org_profile.no_photo')}</div>
        )}
      </div>
      <div style={{ padding: '12px' }}>
        <a href={detailUrl} style={{ fontWeight: 600, color: '#333', textDecoration: 'none', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
          {animal.full_name}
        </a>
        {animal.breeds?.length > 0 && <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: '#888' }}>{animal.breeds.join(', ')}</p>}
        <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 600, color: '#507033' }}>
          {priceVal ? `$${Math.round(priceVal).toLocaleString()}` : t('org_profile.call_for_price')}
        </p>
        <a href={detailUrl} style={{ fontSize: '0.8rem', color: '#fff', backgroundColor: '#6c757d', padding: '4px 10px', borderRadius: '4px', textDecoration: 'none' }}>
          {t('org_profile.view_details')}
        </a>
      </div>
    </div>
  );
}

// ── Animals tab ───────────────────────────────────────────────────────────────
function AnimalsTab({ businessId, isStuds }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/ranches/profile/${businessId}/animals?page=${page}&studs_only=${isStuds}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [businessId, page, isStuds]);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse" style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ height: '160px', backgroundColor: '#e8e8e8' }} />
          <div style={{ padding: '12px' }}>
            <div style={{ height: '14px', backgroundColor: '#e8e8e8', borderRadius: '4px', marginBottom: '8px' }} />
            <div style={{ height: '12px', backgroundColor: '#e8e8e8', borderRadius: '4px', width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  );

  if (!data || data.animals.length === 0) return (
    <p style={{ color: '#888', padding: '20px 0' }}>
      {isStuds ? t('org_profile.no_stud_animals') : t('org_profile.no_sale_animals')}
    </p>
  );

  return (
    <div>
      <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '16px' }}>{data.total} animal{data.total !== 1 ? 's' : ''}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {data.animals.map(a => <AnimalCard key={a.animal_id} animal={a} isStuds={isStuds} />)}
      </div>
      {data.total_pages > 1 && (
        <div style={{ display: 'flex', gap: '4px' }}>
          {page > 1 && <button onClick={() => setPage(p => p - 1)} style={btnStyle}>{t('org_profile.prev')}</button>}
          {page < data.total_pages && <button onClick={() => setPage(p => p + 1)} style={btnStyle}>{t('org_profile.next')}</button>}
        </div>
      )}
    </div>
  );
}

// ── Services tab ──────────────────────────────────────────────────────────────
function ServicesTab({ businessId }) {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/services/business/${businessId}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setServices(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [businessId]);

  if (loading) return <div style={{ color: '#888', padding: '20px 0' }}>{t('org_profile.loading_services')}</div>;
  if (!services.length) return <p style={{ color: '#888', padding: '20px 0' }}>{t('org_profile.no_services')}</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {services.map(svc => (
        <a key={svc.ServicesID} href={`/services/public/${svc.ServicesID}`}
          style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: '#fff', border: '1px solid #eee', borderRadius: '10px', padding: '16px', textDecoration: 'none', color: 'inherit', transition: 'box-shadow 0.2s' }}
          onMouseOver={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)'}
          onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
        >
          {svc.Photo1 ? (
            <img src={svc.Photo1} alt={svc.ServiceTitle}
              style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
              onError={e => e.target.style.display = 'none'} />
          ) : (
            <div style={{ width: '72px', height: '72px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
          )}
          <div style={{ flexGrow: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#222', marginBottom: '4px' }}>{svc.ServiceTitle}</div>
            {svc.ServicesCategory && <div style={{ fontSize: '0.8rem', color: '#507033', marginBottom: '4px' }}>{svc.ServicesCategory}</div>}
            {svc.ServicesDescription && <div style={{ fontSize: '0.85rem', color: '#555', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{svc.ServicesDescription}</div>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {svc.ServiceContactForPrice ? (
              <span style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>{t('org_profile.contact_for_price')}</span>
            ) : svc.ServicePrice ? (
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#507033' }}>${parseFloat(svc.ServicePrice).toLocaleString()}</span>
            ) : null}
            {svc.ServiceAvailable && <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>{svc.ServiceAvailable}</div>}
          </div>
        </a>
      ))}
    </div>
  );
}

// ── Produce tab ───────────────────────────────────────────────────────────────
function ProduceTab({ items }) {
  const { t } = useTranslation();
  if (!items.length) return <p style={{ color: '#888', padding: '20px 0' }}>{t('org_profile.no_produce')}</p>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
      {items.map(p => (
        <div key={p.ProduceID} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#222', marginBottom: '6px' }}>{p.IngredientName}</div>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>
            Qty: {p.Quantity} {p.MeasurementAbbreviation || p.Measurement || ''}
          </div>
          {(p.RetailPrice || p.WholesalePrice) && (
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#507033' }}>
              {p.RetailPrice ? `$${parseFloat(p.RetailPrice).toFixed(2)} retail` : ''}
              {p.RetailPrice && p.WholesalePrice ? ' · ' : ''}
              {p.WholesalePrice ? `$${parseFloat(p.WholesalePrice).toFixed(2)} wholesale` : ''}
            </div>
          )}
          {p.AvailableDate && <div style={{ fontSize: '0.78rem', color: '#999', marginTop: '4px' }}>Available: {p.AvailableDate}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Meat tab ──────────────────────────────────────────────────────────────────
function MeatTab({ items }) {
  const { t } = useTranslation();
  if (!items.length) return <p style={{ color: '#888', padding: '20px 0' }}>{t('org_profile.no_meat')}</p>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
      {items.map(m => (
        <div key={m.MeatInventoryID} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#222', marginBottom: '6px' }}>{m.IngredientName || m.Cut || 'Meat'}</div>
          {m.Cut && m.Cut !== m.IngredientName && <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '4px' }}>{m.Cut}</div>}
          {m.Weight && <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>{m.Weight} {m.WeightUnit || 'lbs'}</div>}
          {(m.RetailPrice || m.WholesalePrice) && (
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#507033' }}>
              {m.RetailPrice ? `$${parseFloat(m.RetailPrice).toFixed(2)} retail` : ''}
              {m.RetailPrice && m.WholesalePrice ? ' · ' : ''}
              {m.WholesalePrice ? `$${parseFloat(m.WholesalePrice).toFixed(2)} wholesale` : ''}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Processed food / value-added tab ─────────────────────────────────────────
function ProcessedFoodTab({ items }) {
  const { t } = useTranslation();
  if (!items.length) return <p style={{ color: '#888', padding: '20px 0' }}>{t('org_profile.no_value_added')}</p>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
      {items.map(f => (
        <div key={f.ProcessedFoodID} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#222', marginBottom: '6px' }}>{f.Name}</div>
          {f.CategoryName && <div style={{ fontSize: '0.8rem', color: '#507033', marginBottom: '4px' }}>{f.CategoryName}</div>}
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Qty: {f.Quantity}</div>
          {(f.RetailPrice || f.WholesalePrice) && (
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#507033' }}>
              {f.RetailPrice ? `$${parseFloat(f.RetailPrice).toFixed(2)} retail` : ''}
              {f.RetailPrice && f.WholesalePrice ? ' · ' : ''}
              {f.WholesalePrice ? `$${parseFloat(f.WholesalePrice).toFixed(2)} wholesale` : ''}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Small-farm products tab ───────────────────────────────────────────────────
function SFProductsTab({ items }) {
  const { t } = useTranslation();
  if (!items.length) return <p style={{ color: '#888', padding: '20px 0' }}>{t('org_profile.no_products')}</p>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
      {items.map(p => (
        <div key={p.SourceID || p.ProdID} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
          {p.ImageURL ? (
            <img src={p.ImageURL} alt={p.Title || p.prodName} style={{ width: '100%', height: '140px', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
          ) : (
            <div style={{ height: '80px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
          )}
          <div style={{ padding: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#222', marginBottom: '4px' }}>{p.Title || p.prodName}</div>
            {p.CategoryName && <div style={{ fontSize: '0.78rem', color: '#507033', marginBottom: '4px' }}>{p.CategoryName}</div>}
            {p.Description && <div style={{ fontSize: '0.82rem', color: '#555', marginBottom: '6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.Description}</div>}
            {p.UnitPrice && <div style={{ fontWeight: 700, color: '#507033' }}>${parseFloat(p.UnitPrice).toFixed(2)}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Blog tab ──────────────────────────────────────────────────────────────────
const BLOG_CATEGORY_COLORS = {
  'Farm News':      '#15803d',
  'Recipes':        '#b45309',
  'Seasonal':       '#0891b2',
  'Events':         '#7C5CBF',
  'Education':      '#1d4ed8',
  'Market Updates': '#be185d',
  'Community':      '#6b7280',
  'General':        '#6b7280',
};

function blogExcerpt(content, wordLimit = 100) {
  if (!content) return '';
  let text = content;
  try {
    const blocks = JSON.parse(content);
    if (Array.isArray(blocks))
      text = blocks.filter(b => b.type === 'text').map(b => b.content || '').join(' ');
  } catch {}
  const plain = text.replace(/<[^>]*>/g, '').trim();
  const words = plain.split(/\s+/);
  return words.length <= wordLimit ? plain : words.slice(0, wordLimit).join(' ') + '…';
}

// Pull the first usable image out of a post so the card can show it when the
// post has no explicit cover_image. Content is stored as JSON blocks whose text
// blocks hold HTML (images live inside a <figure>…<img>); fall back to plain HTML.
function firstImageFromContent(content) {
  if (!content) return null;
  const findImg = (html) => {
    if (typeof html !== 'string') return null;
    const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return m ? m[1] : null;
  };
  try {
    const blocks = JSON.parse(content);
    if (Array.isArray(blocks)) {
      for (const b of blocks) {
        if (!b) continue;
        if (b.type === 'image' || b.type === 'img') {
          const src = b.url || b.src || b.image || (typeof b.content === 'string' ? b.content : null);
          if (typeof src === 'string' && /^(https?:|\/|data:)/.test(src)) return src;
        }
        const inHtml = findImg(b.content) || findImg(b.html) || findImg(b.text);
        if (inHtml) return inHtml;
      }
      return null;
    }
  } catch { /* not JSON — treat as HTML below */ }
  return findImg(String(content));
}

function BlogPostCard({ post }) {
  const { t } = useTranslation();
  const catColor = BLOG_CATEGORY_COLORS[post.category] || '#6b7280';
  const cardImage = post.cover_image || firstImageFromContent(post.content);
  const date = (post.published_at || post.created_at)
    ? new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  const excerpt = blogExcerpt(post.content, 100);
  return (
    <div
      style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden', transition: 'box-shadow 0.2s', display: 'flex', gap: 0 }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {cardImage && (
        <img
          src={cardImage} alt={post.title}
          style={{ width: 180, minWidth: 180, objectFit: 'cover', display: 'block', flexShrink: 0 }}
          onError={e => e.target.style.display = 'none'}
        />
      )}
      <div style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {post.category && (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: catColor, background: catColor + '18', padding: '2px 8px', borderRadius: '10px' }}>
              {post.category}
            </span>
          )}
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{date}</span>
        </div>
        <Link to={`/blog/${post.blog_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 style={{ margin: '0.1rem 0 0.3rem', fontSize: '1.05rem', fontWeight: 700, color: '#111827', lineHeight: 1.35 }}>
            {post.title}
          </h3>
        </Link>
        {excerpt && (
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.6 }}>{excerpt}</p>
        )}
        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          <Link to={`/blog/${post.blog_id}`} style={{ fontSize: '0.83rem', color: '#819360', fontWeight: 600, textDecoration: 'none' }}>
            {t('org_profile.read_more')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function BlogTab({ posts }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const categories = [...new Set(posts.map(p => p.category).filter(Boolean))];

  const filtered = posts.filter(p => {
    const matchesCat = !activeCategory || p.category === activeCategory;
    const matchesSearch = !search.trim() ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.content || '').toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (!posts.length) return <p style={{ color: '#888', padding: '20px 0' }}>{t('org_profile.no_blog')}</p>;

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder={t('org_profile.search_posts')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem' }}
        />
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveCategory('')}
              style={{ padding: '0.35rem 0.85rem', borderRadius: '20px', border: '1px solid', fontSize: '0.82rem', cursor: 'pointer', fontWeight: activeCategory ? 400 : 700, background: activeCategory ? '#f9fafb' : '#819360', color: activeCategory ? '#374151' : '#fff', borderColor: activeCategory ? '#d1d5db' : '#819360' }}
            >
              {t('org_profile.all_posts')}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? '' : cat)}
                style={{ padding: '0.35rem 0.85rem', borderRadius: '20px', border: '1px solid', fontSize: '0.82rem', cursor: 'pointer', fontWeight: activeCategory === cat ? 700 : 400, background: activeCategory === cat ? '#819360' : '#f9fafb', color: activeCategory === cat ? '#fff' : '#374151', borderColor: activeCategory === cat ? '#819360' : '#d1d5db' }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>
      {filtered.length === 0 && <p style={{ color: '#9ca3af', padding: '2rem 0' }}>{t('org_profile.no_posts_found')}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(post => <BlogPostCard key={post.blog_id} post={post} />)}
      </div>
    </div>
  );
}

// ── Events tab ────────────────────────────────────────────────────────────────
function EventsTab({ events }) {
  const { t } = useTranslation();
  if (!events.length) return <p style={{ color: '#888', padding: '20px 0' }}>{t('org_profile.no_events')}</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {events.map(ev => {
        const startDate = ev.EventStartDate ? new Date(ev.EventStartDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : '';
        const endDate   = ev.EventEndDate   ? new Date(ev.EventEndDate).toLocaleDateString('en-US',   { month: 'long', day: 'numeric', year: 'numeric' }) : '';
        const location  = [ev.EventLocationName, ev.EventLocationCity, ev.EventLocationState].filter(Boolean).join(', ');
        return (
          <a key={ev.EventID} href={`/events/${ev.EventID}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px', overflow: 'hidden', display: 'flex', gap: 0, transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.09)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              {ev.EventImage && (
                <img src={ev.EventImage} alt={ev.EventName} style={{ width: '120px', height: '120px', objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
              )}
              <div style={{ padding: '14px 16px', flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#222', marginBottom: '4px' }}>{ev.EventName}</div>
                {startDate && <div style={{ fontSize: '0.82rem', color: '#507033', fontWeight: 600, marginBottom: '2px' }}>{startDate}{endDate && endDate !== startDate ? ` – ${endDate}` : ''}</div>}
                {location && <div style={{ fontSize: '0.82rem', color: '#666', marginBottom: '4px', display:'flex', alignItems:'center', gap:3 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> {location}</div>}
                {ev.EventType && <span style={{ fontSize: '0.75rem', background: '#f0f4ed', color: '#507033', borderRadius: '4px', padding: '2px 8px', fontWeight: 600 }}>{ev.EventType}</span>}
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OrgProfile() {
  const { t } = useTranslation();
  const { businessId: urlBusinessId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const routerLocation = useLocation();
  const { businesses } = useAccount();
  const [ranch, setRanch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ for_sale: 0, studs: 0, services: 0 });
  const [produceItems, setProduceItems]             = useState([]);
  const [meatItems, setMeatItems]                   = useState([]);
  const [processedFoodItems, setProcessedFoodItems] = useState([]);
  const [sfProductItems, setSfProductItems]         = useState([]);
  const [blogPosts, setBlogPosts]                   = useState([]);
  const [upcomingEvents, setUpcomingEvents]         = useState([]);

  const hasFoodListings = produceItems.length > 0 || meatItems.length > 0 || processedFoodItems.length > 0;

  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'home';
  const setTab = (tab) => navigate(
    { pathname: routerLocation.pathname, search: `?tab=${tab}` },
    { state: routerLocation.state, replace: true }
  );

  const restaurantBusinessId = Array.isArray(businesses)
    ? businesses.find(b => (b.BusinessType || '').toLowerCase() === 'restaurant')?.BusinessID
    : null;
  const [isSavedFarm, setIsSavedFarm] = useState(false);

  const directoryBusiness = routerLocation.state?.business || null;
  const businessId = urlBusinessId
    || directoryBusiness?.BusinessID
    || businesses?.[0]?.BusinessID
    || localStorage.getItem('selected_business_id');

  useEffect(() => {
    if (directoryBusiness && !urlBusinessId) {
      const b = directoryBusiness;
      setRanch({
        business_id: b.BusinessID,
        business_name: b.BusinessName || '',
        logo: b.ProfileImage || b.BusinessLogo || null,
        header_image: null,
        home_heading: '',
        home_text: '',
        home_text2: '',
        description: b.BusinessDescription || '',
        address_street: b.AddressStreet || '',
        address_city: b.AddressCity || '',
        address_state: b.AddressState || '',
        address_zip: b.AddressZip || '',
        address_country: b.AddressCountry || '',
        website: b.BusinessWebsite || '',
        phone: b.BusinessPhone || '',
        contact_first_name: '',
        contact_last_name: '',
        facebook: b.BusinessFacebook || '',
        instagram: b.BusinessInstagram || '',
        linkedin: b.BusinessLinkedIn || '',
        x: b.BusinessX || '',
        pinterest: b.BusinessPinterest || '',
        youtube: b.BusinessYouTube || '',
        blog: b.BusinessBlog || '',
        truth_social: b.BusinessTruthSocial || '',
        other_social1: b.BusinessOtherSocial1 || '',
        other_social2: b.BusinessOtherSocial2 || '',
      });
      setLoading(false);
    } else if (businessId) {
      fetch(`${API_URL}/api/ranches/profile/${businessId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { setRanch(d); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }

    if (businessId) {
      fetch(`${API_URL}/api/ranches/profile/${businessId}/animals?page=1&studs_only=false`)
        .then(r => r.ok ? r.json() : null)
        .then(d => d && setCounts(p => ({ ...p, for_sale: d.total })))
        .catch(() => {});

      fetch(`${API_URL}/api/ranches/profile/${businessId}/animals?page=1&studs_only=true`)
        .then(r => r.ok ? r.json() : null)
        .then(d => d && setCounts(p => ({ ...p, studs: d.total })))
        .catch(() => {});

      fetch(`${API_URL}/api/services/business/${businessId}`)
        .then(r => r.ok ? r.json() : [])
        .then(d => d && setCounts(p => ({ ...p, services: Array.isArray(d) ? d.length : 0 })))
        .catch(() => {});

      fetch(`${API_URL}/api/produce/inventory?BusinessID=${businessId}`).then(r => r.ok ? r.json() : []).then(d => setProduceItems(Array.isArray(d) ? d : [])).catch(() => {});
      fetch(`${API_URL}/api/meat/inventory?BusinessID=${businessId}`).then(r => r.ok ? r.json() : []).then(d => setMeatItems(Array.isArray(d) ? d : [])).catch(() => {});
      fetch(`${API_URL}/api/processed-food/inventory?BusinessID=${businessId}`).then(r => r.ok ? r.json() : []).then(d => setProcessedFoodItems(Array.isArray(d) ? d : [])).catch(() => {});

      fetch(`${API_URL}/api/sfproducts/?business_id=${businessId}`).then(r => r.ok ? r.json() : []).then(d => setSfProductItems(Array.isArray(d) ? d : [])).catch(() => {});
      fetch(`${API_URL}/api/blog/posts?business_id=${businessId}&limit=50`).then(r => r.ok ? r.json() : []).then(d => setBlogPosts(Array.isArray(d) ? d : [])).catch(() => {});
      fetch(`${API_URL}/api/events?business_id=${businessId}`).then(r => r.ok ? r.json() : []).then(d => setUpcomingEvents(Array.isArray(d) ? d : [])).catch(() => {});
    }
  }, [businessId]);

  useEffect(() => {
    if (!restaurantBusinessId || !businessId) { setIsSavedFarm(false); return; }
    if (parseInt(restaurantBusinessId) === parseInt(businessId)) { setIsSavedFarm(false); return; }
    fetch(`${API_URL}/api/marketplace/saved-farms?buyer_business_id=${restaurantBusinessId}`)
      .then(r => r.ok ? r.json() : [])
      .then(rows => setIsSavedFarm((rows || []).some(r => parseInt(r.FarmBusinessID) === parseInt(businessId))))
      .catch(() => setIsSavedFarm(false));
  }, [restaurantBusinessId, businessId]);

  const toggleSaveFarm = async () => {
    if (!restaurantBusinessId || !businessId) return;
    const wasSaved = isSavedFarm;
    setIsSavedFarm(!wasSaved);
    try {
      if (wasSaved) {
        await fetch(`${API_URL}/api/marketplace/saved-farms?buyer_business_id=${restaurantBusinessId}&farm_business_id=${businessId}`, { method: 'DELETE' });
      } else {
        const peopleId = getPeopleId();
        await fetch(`${API_URL}/api/marketplace/saved-farms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            BuyerBusinessID: parseInt(restaurantBusinessId),
            FarmBusinessID:  parseInt(businessId),
            AddedByPeopleID: peopleId ? parseInt(peopleId) : null,
          }),
        });
      }
    } catch {
      setIsSavedFarm(wasSaved);
    }
  };

  if (loading) return (
    <div className="min-h-screen font-sans">
      <Header />
      <div style={{ maxWidth: '1400px', margin: '40px auto', padding: '0 16px' }} className="animate-pulse">
        <div style={{ height: '100px', backgroundColor: '#e8e8e8', borderRadius: '8px', marginBottom: '24px' }} />
        <div style={{ height: '48px', backgroundColor: '#e8e8e8', borderRadius: '4px', marginBottom: '24px' }} />
        <div style={{ height: '300px', backgroundColor: '#f0f0f0', borderRadius: '8px' }} />
      </div>
      <Footer />
    </div>
  );

  if (!ranch) return (
    <div className="min-h-screen font-sans">
      <Header />
      <div style={{ textAlign: 'center', padding: '80px 16px' }}>
        <p style={{ color: '#888', marginBottom: '16px' }}>{t('org_profile.not_found')}</p>
        <Link to="/marketplaces/livestock" style={{ color: '#507033' }}>{t('org_profile.back_marketplace')}</Link>
      </div>
      <Footer />
    </div>
  );

  const TABS = [
    { key: 'home',          label: t('org_profile.tab_home'),                                               show: true },
    { key: 'blog',          label: t('org_profile.tab_blog',        { count: blogPosts.length }),           show: blogPosts.length > 0 },
    { key: 'events',        label: t('org_profile.tab_events',      { count: upcomingEvents.length }),      show: upcomingEvents.length > 0 },
    { key: 'animals',       label: t('org_profile.tab_animals',     { count: counts.for_sale }),            show: counts.for_sale > 0 },
    { key: 'studs',         label: t('org_profile.tab_studs',       { count: counts.studs }),               show: counts.studs > 0 },
    { key: 'produce',       label: t('org_profile.tab_produce',     { count: produceItems.length }),        show: produceItems.length > 0 },
    { key: 'meat',          label: t('org_profile.tab_meat',        { count: meatItems.length }),           show: meatItems.length > 0 },
    { key: 'processedFood', label: t('org_profile.tab_value_added', { count: processedFoodItems.length }), show: processedFoodItems.length > 0 },
    { key: 'sfProducts',    label: t('org_profile.tab_products',    { count: sfProductItems.length }),      show: sfProductItems.length > 0 },
    { key: 'services',      label: t('org_profile.tab_services',    { count: counts.services }),            show: counts.services > 0 },
    { key: 'contact',       label: t('org_profile.tab_contact'),                                            show: true },
  ].filter(tab => tab.show);

  const location = [ranch.address_city, ranch.address_state].filter(Boolean).join(', ');
  const activeSocials = SOCIAL_LINKS.filter(s => ranch[s.key]);
  const socialHref = (s) => {
    const val = ranch[s.key];
    if (!val) return null;
    return val.startsWith('http') ? val : `${s.base}${val}`;
  };

  const metaDesc = (ranch.description || ranch.home_text || `${ranch.business_name}${location ? ' in ' + location : ''} — a ranch or farm on Oatmeal Farm Network.`)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  const metaImage = ranch.header_image || ranch.logo || undefined;
  const metaCanonical = businessId ? `https://oatmealfarmnetwork.com/marketplaces/livestock/ranch/${businessId}` : undefined;
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ranch.business_name,
    ...(metaImage ? { image: metaImage, logo: ranch.logo || metaImage } : {}),
    ...(ranch.website ? { url: ranch.website } : metaCanonical ? { url: metaCanonical } : {}),
    ...(ranch.phone ? { telephone: ranch.phone } : {}),
    ...(metaDesc ? { description: metaDesc } : {}),
    ...(ranch.address_street || ranch.address_city || ranch.address_state ? {
      address: {
        '@type': 'PostalAddress',
        ...(ranch.address_street ? { streetAddress: ranch.address_street } : {}),
        ...(ranch.address_city ? { addressLocality: ranch.address_city } : {}),
        ...(ranch.address_state ? { addressRegion: ranch.address_state } : {}),
        ...(ranch.address_zip ? { postalCode: ranch.address_zip } : {}),
        ...(ranch.address_country ? { addressCountry: ranch.address_country } : {}),
      },
    } : {}),
  };

  return (
    <div className="min-h-screen font-sans">
      <PageMeta
        title={`${ranch.business_name}${location ? ' · ' + location : ''}`}
        description={metaDesc}
        image={metaImage}
        canonical={metaCanonical}
        ogType="profile"
        jsonLd={orgJsonLd}
      />
      <Header />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px 60px' }}>
        <div style={{ paddingTop: '0.75rem' }}>
          <Breadcrumbs items={[
            { label: 'Home', to: '/' },
            { label: 'Directory', to: '/directory' },
            { label: ranch.business_name },
          ]} />
        </div>

        {/* ── Ranch header ── */}
        <div style={{ textAlign: 'center', padding: '32px 0 20px', borderBottom: '1px solid #eee' }}>
          {ranch.header_image ? (
            <img src={ranch.header_image} alt={ranch.business_name}
              style={{ display: 'block', maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', margin: '0 auto 12px' }}
              onError={e => e.target.style.display = 'none'} />
          ) : ranch.logo ? (
            <img src={ranch.logo} alt={ranch.business_name}
              style={{ display: 'block', maxHeight: '100px', maxWidth: '100%', objectFit: 'contain', margin: '0 auto 12px' }}
              onError={e => e.target.style.display = 'none'} />
          ) : null}
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#222', margin: '0 0 6px' }}>
            {ranch.business_name}
          </h1>
          {location && <p style={{ color: '#888', margin: 0, fontSize: '0.95rem' }}>{location}</p>}
          {ranch.business_id && (
            <div style={{ marginTop: '12px', display: 'inline-flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {hasFoodListings && (
                <a
                  href={`/provenance/${ranch.business_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#3D6B34',
                    backgroundColor: '#fff',
                    border: '1px solid #3D6B34',
                    borderRadius: '6px',
                    textDecoration: 'none',
                  }}
                  title="Printable 'Sourced From' card for menus, table tents, and social"
                >
                  {t('org_profile.get_sourcing_card')}
                </a>
              )}
              {restaurantBusinessId && parseInt(restaurantBusinessId) !== parseInt(ranch.business_id) && (
                <button
                  onClick={toggleSaveFarm}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: isSavedFarm ? '#fff' : '#A3301E',
                    backgroundColor: isSavedFarm ? '#A3301E' : '#fff',
                    border: '1px solid #A3301E',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                  title={isSavedFarm ? t('org_profile.saved_to_farms') : t('org_profile.save_to_farms')}
                >
                  {isSavedFarm ? t('org_profile.saved_to_farms') : t('org_profile.save_to_farms')}
                </button>
              )}
            </div>
          )}

          {(ranch.cuisine || ranch.head_chef || ranch.seating_capacity || ranch.year_opened || ranch.restaurant_hours) && (
            <div style={{
              marginTop: '16px',
              display: 'inline-flex',
              flexWrap: 'wrap',
              gap: '6px 14px',
              justifyContent: 'center',
              fontSize: '0.85rem',
              color: '#555',
            }}>
              {ranch.cuisine          && <span style={{display:'inline-flex',alignItems:'center',gap:3}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg> <strong>{ranch.cuisine}</strong></span>}
              {ranch.head_chef        && <span style={{display:'inline-flex',alignItems:'center',gap:3}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7a4 4 0 0 0-4-4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0-4 4 4 4 0 0 0 4 4h8a4 4 0 0 0 4-4z"/><path d="M8 11v9h8v-9"/></svg> Chef <strong>{ranch.head_chef}</strong></span>}
              {ranch.seating_capacity && <span style={{display:'inline-flex',alignItems:'center',gap:3}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.7 17a2 2 0 0 1 .3 1v2H3v-2a2 2 0 0 1 .3-1l3-6H6V8a2 2 0 0 1 4 0v3h4V8a2 2 0 0 1 4 0v3h-.3l3 6z"/></svg> Seats <strong>{ranch.seating_capacity}</strong></span>}
              {ranch.year_opened      && <span style={{display:'inline-flex',alignItems:'center',gap:3}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Est. <strong>{ranch.year_opened}</strong></span>}
              {ranch.restaurant_hours && <span>🕐 {ranch.restaurant_hours}</span>}
            </div>
          )}
          {ranch.sourcing_philosophy && (
            <p style={{
              marginTop: '12px',
              maxWidth: '640px',
              marginLeft: 'auto',
              marginRight: 'auto',
              fontSize: '0.9rem',
              color: '#555',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}>
              "{ranch.sourcing_philosophy}"
            </p>
          )}
        </div>

        {/* ── Tab nav ── */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e0e0e0', overflowX: 'auto', marginBottom: '32px' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setTab(tab.key)} style={{
              padding: '12px 22px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              backgroundColor: activeTab === tab.key ? '#507033' : 'transparent',
              color: activeTab === tab.key ? '#fff' : '#555',
              fontWeight: activeTab === tab.key ? 700 : 400,
              fontSize: '0.95rem', borderBottom: activeTab === tab.key ? '2px solid #507033' : 'none',
              transition: 'background 0.2s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Home tab ── */}
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1400px' }}>
            {(ranch.home_heading || ranch.description || ranch.home_text || ranch.home_text2) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold mb-3" style={{ color: '#507033' }}>{t('org_profile.biz_about')} {ranch.business_name}</h2>
                {ranch.description && (
                  <div className="prose prose-sm max-w-none text-sm text-gray-700 leading-relaxed mb-3"
                    dangerouslySetInnerHTML={{ __html: ranch.description }} />
                )}
                {ranch.home_text && (
                  <div style={{ fontSize: '0.95rem', lineHeight: 1.8, color: '#444', marginBottom: '12px' }}
                    dangerouslySetInnerHTML={{ __html: ranch.home_text }} />
                )}
                {ranch.home_text2 && (
                  <div style={{ fontSize: '0.95rem', lineHeight: 1.8, color: '#444' }}
                    dangerouslySetInnerHTML={{ __html: ranch.home_text2 }} />
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              {(ranch.logo || ranch.header_image) && (
                <div className="flex justify-center mb-4">
                  <img
                    src={ranch.logo || ranch.header_image}
                    alt={ranch.business_name}
                    style={{ maxHeight: '100px', maxWidth: '240px', objectFit: 'contain' }}
                    onError={e => { e.target.parentElement.style.display = 'none'; }}
                  />
                </div>
              )}
              <h3 className="text-base font-bold mb-4" style={{ color: '#507033' }}>{t('org_profile.biz_info')}</h3>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-gray-700 mb-4">
                <div className="flex flex-col">
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('org_profile.biz_name_label')}</dt>
                  <dd className="mt-0.5 font-medium">{ranch.business_name}</dd>
                </div>
                {location && (
                  <div className="flex flex-col">
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('org_profile.location_label')}</dt>
                    <dd className="mt-0.5 font-medium">{location}</dd>
                  </div>
                )}
                {(ranch.contact_first_name || ranch.contact_last_name) && (
                  <div className="flex flex-col">
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('org_profile.contact_label')}</dt>
                    <dd className="mt-0.5 font-medium">{[ranch.contact_first_name, ranch.contact_last_name].filter(Boolean).join(' ')}</dd>
                  </div>
                )}
                {ranch.phone && (
                  <div className="flex flex-col">
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('org_profile.phone_label')}</dt>
                    <dd className="mt-0.5 font-medium">
                      <a href={`tel:${ranch.phone}`} style={{ color: '#507033', textDecoration: 'none' }}>{ranch.phone}</a>
                    </dd>
                  </div>
                )}
                {ranch.website && (
                  <div className="flex flex-col">
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('org_profile.website_label')}</dt>
                    <dd className="mt-0.5">
                      <a href={ranch.website.startsWith('http') ? ranch.website : `https://${ranch.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#507033', wordBreak: 'break-all' }}>{ranch.website}</a>
                    </dd>
                  </div>
                )}
              </dl>
              {activeSocials.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeSocials.map(s => (
                    <a key={s.key} href={socialHref(s)} target="_blank" rel="noopener noreferrer" title={s.label}
                      className={`flex items-center justify-center ${s.color} text-white rounded-lg hover:opacity-80 transition-opacity`}
                      style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>
                      {s.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'animals' && <AnimalsTab businessId={businessId} isStuds={false} />}
        {activeTab === 'studs' && <AnimalsTab businessId={businessId} isStuds={true} />}
        {activeTab === 'services' && <ServicesTab businessId={businessId} />}
        {activeTab === 'blog' && <BlogTab posts={blogPosts} />}
        {activeTab === 'events' && <EventsTab events={upcomingEvents} />}
        {activeTab === 'produce' && <ProduceTab items={produceItems} />}
        {activeTab === 'meat' && <MeatTab items={meatItems} />}
        {activeTab === 'processedFood' && <ProcessedFoodTab items={processedFoodItems} />}
        {activeTab === 'sfProducts' && <SFProductsTab items={sfProductItems} />}

        {/* ── About / Contact tab ── */}
        {activeTab === 'contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1400px' }}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              {(ranch.logo || ranch.header_image) && (
                <div className="flex justify-center mb-4">
                  <img
                    src={ranch.logo || ranch.header_image}
                    alt={ranch.business_name}
                    style={{ maxHeight: '100px', maxWidth: '240px', objectFit: 'contain' }}
                    onError={e => { e.target.parentElement.style.display = 'none'; }}
                  />
                </div>
              )}
              <h3 className="text-base font-bold mb-4" style={{ color: '#507033' }}>{t('org_profile.biz_info')}</h3>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-gray-700 mb-4">
                <div className="flex flex-col">
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('org_profile.biz_name_label')}</dt>
                  <dd className="mt-0.5 font-medium">{ranch.business_name}</dd>
                </div>
                {location && (
                  <div className="flex flex-col">
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('org_profile.location_label')}</dt>
                    <dd className="mt-0.5 font-medium">{location}</dd>
                  </div>
                )}
                {ranch.address_street && (
                  <div className="flex flex-col col-span-2">
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('org_profile.address_label')}</dt>
                    <dd className="mt-0.5 font-medium">
                      {[ranch.address_street, `${location} ${ranch.address_zip}`.trim(), ranch.address_country].filter(Boolean).join(', ')}
                    </dd>
                  </div>
                )}
                {(ranch.contact_first_name || ranch.contact_last_name) && (
                  <div className="flex flex-col">
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('org_profile.contact_label')}</dt>
                    <dd className="mt-0.5 font-medium">{[ranch.contact_first_name, ranch.contact_last_name].filter(Boolean).join(' ')}</dd>
                  </div>
                )}
                {ranch.phone && (
                  <div className="flex flex-col">
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('org_profile.phone_label')}</dt>
                    <dd className="mt-0.5 font-medium">
                      <a href={`tel:${ranch.phone}`} style={{ color: '#507033', textDecoration: 'none' }}>{ranch.phone}</a>
                    </dd>
                  </div>
                )}
                {ranch.website && (
                  <div className="flex flex-col">
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('org_profile.website_label')}</dt>
                    <dd className="mt-0.5">
                      <a href={ranch.website.startsWith('http') ? ranch.website : `https://${ranch.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#507033', wordBreak: 'break-all' }}>{ranch.website}</a>
                    </dd>
                  </div>
                )}
              </dl>
              {activeSocials.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeSocials.map(s => (
                    <a key={s.key} href={socialHref(s)} target="_blank" rel="noopener noreferrer" title={s.label}
                      className={`flex items-center justify-center ${s.color} text-white rounded-lg hover:opacity-80 transition-opacity`}
                      style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>
                      {s.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#fff', border: '1px solid #e8e8e8', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: '#333' }}>
                {t('org_profile.contact_form_title', { name: ranch.business_name })}
              </h3>
              <ContactForm ranch={ranch} />
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

const btnStyle = { padding: '5px 12px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.85rem' };
const formLabel = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: '4px' };
const formInput = { width: '100%', padding: '9px 12px', border: '1px solid #d0d0d0', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' };
