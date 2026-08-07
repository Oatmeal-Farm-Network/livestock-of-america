import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { API_ENDPOINTS } from '../config';
import photoNotAvailable from '../images/photo not available .jpg';
import { DIRECTORY_TYPE_TO_IMAGE, DIRECTORY_TYPE_TO_BUSINESS_TYPE } from './directoryMappings';
const IcoFacebook  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
const IcoPinterest = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.03-2.83.19-.77 1.27-5.38 1.27-5.38s-.32-.65-.32-1.61c0-1.51.87-2.64 1.96-2.64.92 0 1.37.69 1.37 1.53 0 .93-.59 2.33-.9 3.62-.26 1.08.54 1.96 1.6 1.96 1.92 0 3.4-2.02 3.4-4.94 0-2.58-1.86-4.39-4.51-4.39-3.07 0-4.87 2.3-4.87 4.68 0 .93.36 1.92.8 2.46.09.11.1.2.07.31-.08.34-.26 1.08-.3 1.23-.05.2-.17.24-.38.14-1.39-.65-2.26-2.68-2.26-4.32 0-3.51 2.55-6.74 7.36-6.74 3.86 0 6.86 2.75 6.86 6.42 0 3.83-2.41 6.91-5.76 6.91-1.12 0-2.18-.58-2.55-1.27l-.69 2.59c-.25.97-.93 2.18-1.39 2.92.75.23 1.54.36 2.36.36 5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>;
const IcoTwitterX  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
const IcoInstagram = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>;
const IcoLinkedIn  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
const IcoYouTube   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45a2.78 2.78 0 0 0-1.95 1.97A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>;
const IcoGlobe     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';

const BLOG_API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function getExcerpt(content, wordLimit = 35) {
  if (!content) return '';
  let text = content;
  try {
    const blocks = JSON.parse(content);
    if (Array.isArray(blocks))
      text = blocks.filter(b => b.type === 'text').map(b => b.content || '').join(' ');
  } catch {}
  const plain = text.replace(/<[^>]*>/g, '').trim();
  const words = plain.split(/\s+/);
  if (words.length <= wordLimit) return plain;
  return words.slice(0, wordLimit).join(' ') + '…';
}

function getCoverImage(content, fallback) {
  if (fallback) return fallback;
  try {
    const blocks = JSON.parse(content || '');
    if (Array.isArray(blocks)) {
      const img = blocks.find(b => b.type === 'image' && b.url);
      if (img) return img.url;
    }
  } catch {}
  return null;
}

function BusinessBlogPosts({ businessId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    fetch(`${BLOG_API}/api/blog/posts?business_id=${businessId}&limit=6`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [businessId]);

  if (loading || posts.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-[#4d734d] mb-4">Blog Posts</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {posts.map(post => {
          const cover = getCoverImage(post.content, post.cover_image);
          const date = (post.published_at || post.created_at)
            ? new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '';
          return (
            <Link key={post.blog_id} to={`/blog/${post.blog_id}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', transition: 'box-shadow 0.2s', cursor: 'pointer', background: '#fafafa' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.09)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                {cover ? (
                  <img src={cover} alt={post.title} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
                    onError={e => e.target.style.display = 'none'} />
                ) : (
                  <div style={{ width: '100%', height: 80, background: 'linear-gradient(135deg,#f3f4f6,#e5e7eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.75rem' }}>📝</span>
                  </div>
                )}
                <div style={{ padding: '0.7rem 0.85rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: 3 }}>{date}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.title}
                  </div>
                  {post.content && (
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {getExcerpt(post.content)}
                    </p>
                  )}
                  <span style={{ display: 'inline-block', marginTop: '0.4rem', fontSize: '0.75rem', color: '#7C5CBF', fontWeight: 600 }}>Read more →</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


const BusinessProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const initialBusiness = location.state?.business;
    const directoryType = location.state?.directoryType;
    const selectedCountry = location.state?.selectedCountry;
    const selectedState = location.state?.selectedState;
    const nameFilter = location.state?.nameFilter;
    const [business, setBusiness] = useState(initialBusiness);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setBusiness(initialBusiness);
    }, [initialBusiness]);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phone: '', comments: ''
    });
    const [mathQuestion, setMathQuestion] = useState({ num1: 0, num2: 0, answer: '' });
    const [userMathAnswer, setUserMathAnswer] = useState('');
    const [formSubmitted, setFormSubmitted] = useState(false);

    const generateMathQuestion = () => {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        setMathQuestion({ num1, num2, answer: num1 + num2 });
        setUserMathAnswer('');
    };

    useEffect(() => { generateMathQuestion(); }, []);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        setIsLoggedIn(Boolean(token));
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (parseInt(userMathAnswer) !== mathQuestion.answer) {
            alert('Please answer the math question correctly.');
            return;
        }
        if (!formData.firstName || !formData.lastName || !formData.email) {
            alert('Please fill in all required fields.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Please enter a valid email address.');
            return;
        }
        console.log('Form submitted:', formData);
        alert('Thank you for your message! We will get back to you soon.');
        setFormData({ firstName: '', lastName: '', email: '', phone: '', comments: '' });
        setUserMathAnswer('');
        generateMathQuestion();
        setFormSubmitted(true);
    };

    const backToListings = () => navigate(`/directory/${directoryType || 'agricultural-associations'}`, {
        state: { selectedCountry, selectedState, nameFilter }
    });

    const socialLinks = [
        { key: 'BusinessFacebook',  label: 'Facebook',  icon: <IcoFacebook />,  base: 'https://facebook.com/',  color: 'bg-[#1877F2]' },
        { key: 'BusinessPinterest', label: 'Pinterest', icon: <IcoPinterest />, base: 'https://pinterest.com/', color: 'bg-[#E60023]' },
        { key: 'BusinessX',         label: 'Twitter',   icon: <IcoTwitterX />,  base: 'https://twitter.com/',   color: 'bg-black' },
        { key: 'BusinessInstagram', label: 'Instagram', icon: <IcoInstagram />, base: 'https://instagram.com/', color: 'bg-[#E1306C]' },
        { key: 'BusinessLinkedIn',  label: 'LinkedIn',  icon: <IcoLinkedIn />,  base: 'https://linkedin.com/company/', color: 'bg-[#0A66C2]' },
        { key: 'BusinessYouTube',   label: 'YouTube',   icon: <IcoYouTube />,   base: 'https://youtube.com/',   color: 'bg-[#FF0000]' },
        { key: 'BusinessWebsite',   label: 'Website',   icon: <IcoGlobe />,     base: '',                       color: 'bg-[#4d734d]' },
    ];

    if (!business) {
        return (
            <div className="min-h-screen font-sans">
                <Header />
                <header className="header">
                    <div className="logo-container">
                        <img src={DIRECTORY_TYPE_TO_IMAGE[directoryType] || photoNotAvailable} className="logo-image" />
                        <span className="logo-text">{DIRECTORY_TYPE_TO_BUSINESS_TYPE[directoryType] || 'Business'}</span>
                    </div>
                </header>
                <div className="profile-page-container">
                    <p>No business information available.</p>
                    <button
                        onClick={() => navigate(`/directory/${directoryType || 'agricultural-associations'}`, {
                            state: { selectedCountry, selectedState, nameFilter }
                        })}
                        className="back-button"
                    >
                        ← Back to Listings
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    const fullAddress = [business.AddressStreet, business.AddressCity, business.AddressState, business.AddressZip, business.AddressCountry].filter(Boolean).join(', ');
    const bizLocation = [business.AddressCity, business.AddressState].filter(Boolean).join(', ');
    const bizDesc = business.BusinessDescription
      ? business.BusinessDescription.replace(/<[^>]+>/g, '').slice(0, 155)
      : `${business.BusinessName}${bizLocation ? ' in ' + bizLocation : ''} — ${DIRECTORY_TYPE_TO_BUSINESS_TYPE[directoryType] || 'food business'} on Oatmeal Farm Network.`;
    const bizTypeLabel = DIRECTORY_TYPE_TO_BUSINESS_TYPE[directoryType] || 'Business';

    return (
        <div className="min-h-screen font-sans">
            <PageMeta
                title={`${business.BusinessName}${bizLocation ? ' · ' + bizLocation : ''} | ${bizTypeLabel}`}
                description={bizDesc}
                keywords={`${business.BusinessName}, ${bizTypeLabel}, ${bizLocation}, farm directory, local food business`}
                image={business.ProfileImage || undefined}
                ogType="business.business"
                jsonLd={{
                    '@context': 'https://schema.org',
                    '@type': 'LocalBusiness',
                    name: business.BusinessName,
                    description: bizDesc,
                    ...(business.ProfileImage ? { image: business.ProfileImage } : {}),
                    ...(business.BusinessWebsite ? { url: business.BusinessWebsite } : {}),
                    ...(business.BusinessPhone ? { telephone: business.BusinessPhone } : {}),
                    ...(business.AddressCity || business.AddressStreet ? {
                        address: {
                            '@type': 'PostalAddress',
                            ...(business.AddressStreet ? { streetAddress: business.AddressStreet } : {}),
                            ...(business.AddressCity ? { addressLocality: business.AddressCity } : {}),
                            ...(business.AddressState ? { addressRegion: business.AddressState } : {}),
                            ...(business.AddressZip ? { postalCode: business.AddressZip } : {}),
                            ...(business.AddressCountry ? { addressCountry: business.AddressCountry } : {}),
                        },
                    } : {}),
                }}
            />
            <Header />

            {/* Main container */}
            <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '1rem 1rem 3rem' }}>
                <Breadcrumbs items={[
                    { label: 'Home', to: '/' },
                    { label: 'Directory', to: '/directory' },
                    ...(directoryType ? [{
                        label: bizTypeLabel,
                        to: `/directory/${directoryType}`,
                    }] : []),
                    { label: business.BusinessName },
                ]} />

                {/* Back button */}
                <button onClick={backToListings} className="text-[#4d734d] font-semibold hover:underline mb-3 inline-flex items-center gap-1">
                    ← Back to Listings
                </button>


                {/* Business name */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">{business.BusinessName}</h1>
                </div>

                {/* Two column layout */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* LEFT COLUMN */}
                    <div className="flex-1 space-y-6">

                        {/* Business Information — top card, includes profile image + social icons */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row gap-6">
                            <img
                                src={business.ProfileImage || photoNotAvailable}
                                alt={business.BusinessName}
                                className="w-40 h-40 object-cover rounded-xl border border-gray-200 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-bold text-[#4d734d] mb-3">Business Information</h2>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-700 mb-4">
                                    {[
                                        ['Business Name', business.BusinessName],
                                        ['Business Type', DIRECTORY_TYPE_TO_BUSINESS_TYPE[directoryType] || 'Business'],
                                        ['Phone', business.BusinessPhone
                                            ? <a href={`tel:${business.BusinessPhone}`} className="text-[#4d734d] hover:underline">{business.BusinessPhone}</a>
                                            : null],
                                        ['Website', business.BusinessWebsite
                                            ? <a href={business.BusinessWebsite} target="_blank" rel="noopener noreferrer" className="text-[#4d734d] hover:underline break-all">{business.BusinessWebsite}</a>
                                            : null],
                                        ['Address', business.AddressStreet],
                                        ['City', business.AddressCity],
                                        ['State', business.AddressState],
                                        ['Zip Code', business.AddressZip],
                                        ['Country', business.AddressCountry],
                                    ].filter(([, val]) => val).map(([label, val]) => (
                                        <div key={label} className="flex flex-col">
                                            <dt className="font-semibold text-gray-500 text-xs uppercase tracking-wide">{label}</dt>
                                            <dd className="mt-0.5">{val}</dd>
                                        </div>
                                    ))}
                                </dl>

                                {/* Social icons — icon only */}
                                {socialLinks.some(({ key, base }) => {
                                    const val = business[key];
                                    return val && (val.startsWith('http') ? val : `${base}${val}`);
                                }) && (
                                    <div className="flex flex-wrap gap-2">
                                        {socialLinks.map(({ key, label, icon, base, color }) => {
                                            const val = business[key];
                                            const href = val ? (val.startsWith('http') ? val : `${base}${val}`) : null;
                                            if (!href) return null;
                                            return (
                                                <a key={key} href={href} target="_blank" rel="noopener noreferrer" title={label}
                                                    className={`flex items-center justify-center ${color} text-white rounded-lg hover:opacity-80 transition-opacity`}
                                                    style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>
                                                    {icon}
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* END business information */}

                        {/* About */}
                        {business.BusinessDescription && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h2 className="text-lg font-bold text-[#4d734d] mb-2">About</h2>
                                <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: business.BusinessDescription }} />
                            </div>
                        )}

                        {/* Blog Posts */}
                        <BusinessBlogPosts businessId={business.BusinessID} />

                    </div>
                    {/* END LEFT COLUMN */}

                    {/* RIGHT COLUMN — Contact Form */}
                    <div className="w-full lg:w-80 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
                            <h2 className="text-lg font-bold text-[#4d734d] mb-4">Contact {business.BusinessName}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {[
                                    { id: 'firstName', label: 'First Name', type: 'text',  required: true },
                                    { id: 'lastName',  label: 'Last Name',  type: 'text',  required: true },
                                    { id: 'email',     label: 'Email',      type: 'email', required: true },
                                    { id: 'phone',     label: 'Phone',      type: 'tel',   required: false, optional: true },
                                ].map(({ id, label, type, required, optional }) => (
                                    <div key={id}>
                                        <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">
                                            {label} {optional && <span className="text-gray-400 font-normal">(Optional)</span>}
                                        </label>
                                        <input
                                            type={type}
                                            id={id}
                                            name={id}
                                            value={formData[id]}
                                            onChange={handleInputChange}
                                            required={required}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#4d734d] focus:outline-none focus:ring-2 focus:ring-[#4d734d]/20"
                                        />
                                    </div>
                                ))}

                                <div>
                                    <label htmlFor="comments" className="block text-sm font-semibold text-gray-700 mb-1">
                                        Comments / Questions <span className="text-gray-400 font-normal">(Optional)</span>
                                    </label>
                                    <textarea
                                        id="comments"
                                        name="comments"
                                        value={formData.comments}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#4d734d] focus:outline-none focus:ring-2 focus:ring-[#4d734d]/20"
                                    />
                                </div>

                                {/* Math captcha */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">Human Verification</p>
                                    <p className="text-xs text-gray-500 mb-2">Answer the simple math question below.</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-gray-800">{mathQuestion.num1} + {mathQuestion.num2} =</span>
                                        <input
                                            type="number"
                                            value={userMathAnswer}
                                            onChange={(e) => setUserMathAnswer(e.target.value)}
                                            required
                                            placeholder="?"
                                            className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#4d734d] focus:outline-none focus:ring-2 focus:ring-[#4d734d]/20"
                                        />
                                    </div>
                                </div>

                                <button type="submit"
                                    className="w-full bg-[#4d734d] text-white font-semibold py-2.5 rounded-lg hover:bg-[#3d5e3d] transition-colors text-sm">
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                    {/* END RIGHT COLUMN */}

                </div>
                {/* END two column layout */}

            </div>
            {/* END main container */}

            <Footer />

        </div>
        /* END min-h-screen */
    );
};

export default BusinessProfile;