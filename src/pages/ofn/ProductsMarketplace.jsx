// Ported from Oatmeal Farm Network (src/ProductsMarketplace.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/ProductsMarketplace.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { getPeopleId } from '../../lib/auth';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

const SORT_OPTIONS = [
  { key: 'newest' },
  { key: 'price_asc' },
  { key: 'price_desc' },
  { key: 'name_asc' },
];

function getCart() {
  try { return JSON.parse(localStorage.getItem('marketplace_cart') || '[]'); } catch { return []; }
}
function saveCart(cart) { localStorage.setItem('marketplace_cart', JSON.stringify(cart)); }

export default function ProductsMarketplace() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('access_token');
  const peopleId   = getPeopleId();

  const [products,      setProducts]      = useState([]);
  const [categories,    setCategories]    = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [searchInput,   setSearchInput]   = useState('');
  const [category,      setCategory]      = useState('all');
  const [catId,         setCatId]         = useState(null);
  const [subcatId,      setSubcatId]      = useState(null);
  const [sort,          setSort]          = useState('newest');
  const [cart,        setCart]        = useState(getCart);
  const [showCart,    setShowCart]    = useState(false);
  const [addedId,     setAddedId]     = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Sign-in state
  const [showSignIn,    setShowSignIn]    = useState(false);
  const [signInEmail,   setSignInEmail]   = useState('');
  const [signInPass,    setSignInPass]    = useState('');
  const [signInError,   setSignInError]   = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [loggedIn,      setLoggedIn]      = useState(isLoggedIn);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInError('');
    setSignInLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: signInEmail, Password: signInPass }),
      });
      const data = await res.json();
      if (!res.ok) { setSignInError(data.detail || t('prod_mkt.login_failed')); return; }
      localStorage.setItem('access_token', data.AccessToken);
      localStorage.setItem('people_id', data.PeopleID);
      localStorage.setItem('first_name', data.PeopleFirstName);
      localStorage.setItem('last_name', data.PeopleLastName);
      setLoggedIn(true);
      setShowSignIn(false);
    } catch { setSignInError(t('prod_mkt.connect_error')); } finally { setSignInLoading(false); }
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (search)     params.set('search', search);
      if (catId)      params.set('cat_id', catId);
      if (subcatId)   params.set('subcat_id', subcatId);
      const res  = await fetch(`${API}/api/sfproducts?${params}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { setProducts([]); } finally { setLoading(false); }
  }, [search, catId, subcatId, sort]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Load categories from SFProducts API
  useEffect(() => {
    fetch(`${API}/api/sfproducts/categories`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // When category changes, load subcategories
  useEffect(() => {
    if (!catId) { setSubcategories([]); setSubcatId(null); return; }
    fetch(`${API}/api/sfproducts/categories/${catId}/subcategories`)
      .then(r => r.json())
      .then(d => setSubcategories(Array.isArray(d) ? d : []))
      .catch(() => setSubcategories([]));
  }, [catId]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const addToCart = (product) => {
    if (!loggedIn) { setShowCart(true); setShowSignIn(true); return; }
    const listingId = `G${product.ProdID}`;
    setCart(prev => {
      const existing = prev.find(i => i.listingId === listingId);
      const next = existing
        ? prev.map(i => i.listingId === listingId ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, {
            listingId,
            title:      product.Title,
            price:      product.UnitPrice,
            unit:       'each',
            sellerName: product.SellerName,
            sellerBid:  product.BusinessID,
            imageUrl:   product.ImageURL,
            quantity:   1,
          }];
      saveCart(next);
      return next;
    });
    setAddedId(listingId);
    setTimeout(() => setAddedId(null), 1500);
  };

  const selectCategory = (cat) => {
    setCategory(cat ? cat.CatName : 'all');
    setCatId(cat ? cat.CatID : null);
    setSubcatId(null);
  };

  const selectSubcat = (sub) => {
    setSubcatId(sub ? sub.SubCatID : null);
  };

  const updateQty = (listingId, delta) => {
    setCart(prev => {
      const next = prev.map(i =>
        i.listingId === listingId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
      ).filter(i => i.quantity > 0);
      saveCart(next);
      return next;
    });
  };

  const removeItem = (listingId) => {
    setCart(prev => { const next = prev.filter(i => i.listingId !== listingId); saveCart(next); return next; });
  };

  const checkout = async () => {
    if (!loggedIn) { setShowSignIn(true); return; }
    if (!cart.length) return;
    setCheckoutLoading(true);
    try {
      const pid = parseInt(getPeopleId());
      // Sync cart items to backend
      for (const item of cart) {
        await fetch(`${API}/api/marketplace/cart`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ BuyerPeopleID: pid, ListingID: item.listingId, Quantity: item.quantity }),
        });
      }
      navigate('/cart');
    } catch { alert(t('prod_mkt.checkout_error')); }
    finally { setCheckoutLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageMeta
        title="Farm Products Marketplace | Shop Local Farm Goods"
        description="Shop farm-fresh products including produce, meat, dairy, fiber, and value-added goods. Buy directly from local farmers and small food businesses on Livestock Of America."
        keywords="farm products, farm marketplace, shop local farms, farm goods, handcrafted products, farm direct"
        canonical="https://livestockofamerica.com/marketplace/products"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Farm Products Marketplace',
          url: 'https://livestockofamerica.com/marketplace/products',
          description: 'Farm-fresh products and handcrafted goods from local farmers.'
        }}
      />
      <Header />

      {/* ── Hero ── */}
      <div className="mx-auto w-full px-4 pt-2 md:pt-6" style={{ maxWidth: '1300px' }}>
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Marketplaces', to: '/marketplaces' },
          { label: 'Products' },
        ]} />

        {/* Image — shorter on mobile, taller on desktop */}
        <div className="relative w-full overflow-hidden rounded-xl rounded-b-none md:rounded-b-xl">
          <img
            src="/images/ProductmarketplaceHeader.webp"
            alt="Products Marketplace"
            className="w-full object-cover block h-[160px] md:h-[250px]"
            loading="eager"
          />
          {/* Gradient + text overlay — desktop only */}
          <div className="hidden md:block absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.72) 45%, rgba(255,255,255,0) 75%)' }} />
          <div className="hidden md:flex absolute inset-0 flex-col justify-center px-8 py-6" style={{ maxWidth: '780px' }}>
            <h1 style={{ color: '#000000', fontFamily: "'Lora','Times New Roman',serif", fontSize: '2rem', fontWeight: 'bold', margin: '0 0 12px', lineHeight: 1.2 }}>
              {t('prod_mkt.title')}
            </h1>
            <p style={{ color: '#111111', fontSize: '0.92rem', margin: '0 0 12px', lineHeight: 1.6 }}>
              {t('prod_mkt.hero_body')}
            </p>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
              <input
                value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder={t('prod_mkt.search_placeholder')}
                className="flex-grow px-4 py-2 rounded-lg text-gray-900 text-sm bg-white border border-gray-300 focus:outline-none focus:border-[#3D6B34]"
              />
              <button type="submit" className="bg-[#3D6B34] text-white font-semibold px-5 py-2 rounded-lg hover:bg-[#2d5226] transition-colors">
                {t('prod_mkt.search_btn')}
              </button>
            </form>
          </div>
        </div>

        {/* Text below image — mobile only */}
        <div className="md:hidden bg-white px-5 py-4 rounded-b-xl border border-t-0 border-gray-200">
          <h1 style={{ color: '#000000', fontFamily: "'Lora','Times New Roman',serif", fontSize: '1.4rem', fontWeight: 'bold', margin: '0 0 8px', lineHeight: 1.2 }}>
            {t('prod_mkt.title')}
          </h1>
          <p style={{ color: '#111111', fontSize: '0.85rem', margin: '0 0 10px', lineHeight: 1.6 }}>
            {t('prod_mkt.hero_body')}
          </p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder={t('prod_mkt.search_placeholder')}
              className="flex-grow px-3 py-2 rounded-lg text-gray-900 text-sm bg-white border border-gray-300 focus:outline-none focus:border-[#3D6B34]"
            />
            <button type="submit" className="bg-[#3D6B34] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#2d5226] transition-colors text-sm">
              {t('prod_mkt.search_btn')}
            </button>
          </form>
        </div>

      </div>

      <div className="mx-auto w-full px-4 py-6 flex gap-6 flex-grow" style={{ maxWidth: '1300px' }}>

        {/* Sidebar filters */}
        <aside className="w-48 shrink-0 hidden md:block">
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{t('prod_mkt.category')}</h3>
            <ul className="space-y-1">
              <li>
                <button onClick={() => selectCategory(null)}
                  className={`text-sm w-full text-left px-2 py-1 rounded-lg ${category === 'all' ? 'bg-green-50 text-[#3D6B34] font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {t('prod_mkt.all_products')}
                </button>
              </li>
              {categories.map(cat => (
                <li key={cat.CatID}>
                  <button onClick={() => selectCategory(cat)}
                    className={`text-sm w-full text-left px-2 py-1 rounded-lg ${category === cat.CatName ? 'bg-green-50 text-[#3D6B34] font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {cat.CatName}
                  </button>
                  {/* Subcategories */}
                  {catId === cat.CatID && subcategories.length > 0 && (
                    <ul className="ml-3 mt-1 space-y-0.5">
                      <li>
                        <button onClick={() => selectSubcat(null)}
                          className={`text-xs w-full text-left px-2 py-0.5 rounded ${!subcatId ? 'text-[#3D6B34] font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
                          {t('prod_mkt.all')}
                        </button>
                      </li>
                      {subcategories.map(sub => (
                        <li key={sub.SubCatID}>
                          <button onClick={() => selectSubcat(sub)}
                            className={`text-xs w-full text-left px-2 py-0.5 rounded ${subcatId === sub.SubCatID ? 'text-[#3D6B34] font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
                            {sub.SubCatName}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{t('prod_mkt.sort')}</h3>
            <ul className="space-y-1">
              {SORT_OPTIONS.map(o => (
                <li key={o.key}>
                  <button onClick={() => setSort(o.key)}
                    className={`text-sm w-full text-left px-2 py-1 rounded-lg ${sort === o.key ? 'bg-green-50 text-[#3D6B34] font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {t('prod_mkt.sort_' + o.key)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {loading ? t('prod_mkt.loading') : t('prod_mkt.product_count', { count: products.length })}
            </p>
            {/* Cart button */}
            <button onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 bg-[#3D6B34] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#2d5226] transition-colors">
              🛒 {t('prod_mkt.cart_btn')}
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 animate-pulse h-64" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-16 text-center text-gray-400">
              <div className="flex justify-center mb-3"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>
              <p className="font-medium">{t('prod_mkt.no_products')}</p>
              {search && <button onClick={() => { setSearch(''); setSearchInput(''); }} className="mt-2 text-sm text-[#3D6B34] hover:underline">{t('prod_mkt.clear_search')}</button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map(product => {
                const listingId  = `G${product.ProdID}`;
                const isOnSale   = product.IsFeatured && product.WholesalePrice > 0 && product.WholesalePrice < product.UnitPrice;
                const madeInUSA  = /^(usa|us|america)$/i.test(product.prodMadeIn || '');
                return (
                  <div key={product.ProdID} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:border-gray-200 hover:shadow transition-all">
                    <Link to={`/marketplace/products/${product.ProdID}`} className="block aspect-square bg-gray-100 overflow-hidden relative">
                      {product.ImageURL
                        ? <img src={product.ImageURL} alt={product.Title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
                      }
                      {isOnSale && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">SALE</span>
                      )}
                      {madeInUSA && (
                        <span className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">🇺🇸 USA</span>
                      )}
                    </Link>
                    <div className="p-4 flex flex-col flex-grow">
                      {product.CategoryName && (
                        <span className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">{product.CategoryName}</span>
                      )}
                      <Link to={`/marketplace/products/${product.ProdID}`} className="font-semibold text-sm text-gray-900 hover:text-[#3D6B34] line-clamp-2 mb-1 leading-snug">
                        {product.Title}
                      </Link>
                      <p className="text-xs text-gray-400 mb-2">
                        {product.SellerName}{product.SellerCity ? ` · ${product.SellerCity}` : ''}
                        {product.SellerState ? `, ${product.SellerState}` : ''}
                      </p>
                      <div className="mt-auto flex items-end justify-between gap-2">
                        {product.prodCallforPrice ? (
                          <span className="text-sm text-gray-500 font-medium">{t('prod_mkt.contact_for_price')}</span>
                        ) : (
                          <div>
                            <span className="text-lg font-bold text-[#3D6B34]">${(product.UnitPrice || 0).toFixed(2)}</span>
                            {isOnSale && (
                              <span className="text-xs text-gray-400 line-through ml-1">${(product.WholesalePrice || 0).toFixed(2)}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {!product.prodCallforPrice && (
                        <button
                          onClick={() => addToCart(product)}
                          className={`mt-3 w-full text-sm font-semibold py-2 rounded-lg transition-all ${
                            addedId === listingId
                              ? 'bg-green-100 text-green-700'
                              : 'bg-[#3D6B34] text-white hover:bg-[#2d5226]'
                          }`}>
                          {addedId === listingId ? t('prod_mkt.added') : t('prod_mkt.add_to_cart')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-grow bg-black/40" onClick={() => { setShowCart(false); setShowSignIn(false); }} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">{t('prod_mkt.cart_title')}</h2>
              <button onClick={() => { setShowCart(false); setShowSignIn(false); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            {/* Sign-in prompt */}
            {showSignIn && !loggedIn && (
              <div className="px-5 py-4 bg-amber-50 border-b border-amber-100">
                <p className="text-sm font-semibold text-amber-800 mb-3">{t('prod_mkt.sign_in_checkout')}</p>
                <form onSubmit={handleSignIn} className="space-y-2">
                  <input type="email" required placeholder={t('prod_mkt.email_placeholder')} value={signInEmail} onChange={e => setSignInEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <input type="password" required placeholder={t('prod_mkt.password_placeholder')} value={signInPass} onChange={e => setSignInPass(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  {signInError && <p className="text-xs text-red-600">{signInError}</p>}
                  <button type="submit" disabled={signInLoading}
                    className="w-full bg-[#3D6B34] text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50">
                    {signInLoading ? t('prod_mkt.signing_in') : t('prod_mkt.sign_in')}
                  </button>
                </form>
                <p className="text-xs text-center mt-2">
                  <Link to="/signup" className="text-[#3D6B34] hover:underline">{t('prod_mkt.create_account')}</Link>
                  {' · '}
                  <button onClick={() => setShowSignIn(false)} className="text-gray-400 hover:underline">{t('prod_mkt.continue_browsing')}</button>
                </p>
              </div>
            )}

            <div className="flex-grow overflow-y-auto px-5 py-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-400 py-16">
                  <div className="flex justify-center mb-3"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>
                  <p>{t('prod_mkt.cart_empty')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.listingId} className="flex gap-3 items-center">
                      <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-400">{item.sellerName}</p>
                        <p className="text-sm font-bold text-[#3D6B34]">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.listingId, -1)}
                          className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 text-sm font-bold">−</button>
                        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.listingId, 1)}
                          className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 text-sm font-bold">+</button>
                        <button onClick={() => removeItem(item.listingId)}
                          className="ml-1 text-red-400 hover:text-red-600 text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100">
                <div className="flex justify-between text-sm font-semibold text-gray-700 mb-3">
                  <span>{t('prod_mkt.subtotal')}</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <button onClick={checkout} disabled={checkoutLoading}
                  className="w-full bg-[#3D6B34] text-white font-bold py-3 rounded-xl hover:bg-[#2d5226] transition-colors disabled:opacity-50 text-sm">
                  {checkoutLoading ? t('prod_mkt.checkout_loading') : loggedIn ? t('prod_mkt.checkout') : t('prod_mkt.checkout_signin')}
                </button>
                <p className="text-center text-xs text-gray-400 mt-2">
                  {t('prod_mkt.mix_note_pre')} <Link to="/marketplaces/farm-to-table" className="text-[#3D6B34] hover:underline">{t('prod_mkt.browse_food')}</Link>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
