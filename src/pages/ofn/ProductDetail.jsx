// Ported from Oatmeal Farm Network (src/ProductDetail.jsx). Mechanical adaptations
// only: router package, i18n hook, component paths, API base env var,
// people-id accessor.
// src/ProductDetail.jsx
// Public product detail page — /marketplace/products/:id
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useTranslation } from '../../lib/i18n';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageMeta from '../../components/PageMeta';
import Breadcrumbs from '../../components/Breadcrumbs';
import { getPeopleId } from '../../lib/auth';

const API = import.meta.env.VITE_LIVESTOCK_API_URL || '';

function isMadeInUSA(val) {
  return /^(usa|us|america|united states)$/i.test((val || '').trim());
}

function getCart() {
  try { return JSON.parse(localStorage.getItem('marketplace_cart') || '[]'); } catch { return []; }
}
function saveCart(c) { localStorage.setItem('marketplace_cart', JSON.stringify(c)); }

export default function ProductDetail() {
  const { t }      = useTranslation();
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isLoggedIn = !!localStorage.getItem('access_token');

  const [product,  setProduct]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [related,  setRelated]  = useState([]);
  const [mainImg,  setMainImg]  = useState(null);
  const [selectedSize,  setSelectedSize]  = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [qty,      setQty]      = useState(1);
  const [added,    setAdded]    = useState(false);
  const [cartCount, setCartCount] = useState(() => getCart().reduce((s, i) => s + i.quantity, 0));

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    fetch(`${API}/api/sfproducts/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        setProduct(d);
        // Pick first available image
        const firstImg = d.photos?.[0]
          || d.ProductImage1
          || d.ImageURL
          || null;
        setMainImg(firstImg);

        // Load related products
        if (d.BusinessID) {
          fetch(`${API}/api/sfproducts?business_id=${d.BusinessID}`)
            .then(r => r.json())
            .then(list => {
              if (Array.isArray(list)) {
                setRelated(list.filter(p => p.ProdID !== d.ProdID).slice(0, 4));
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const allPhotos = () => {
    if (!product) return [];
    const imgs = [];
    for (let i = 1; i <= 8; i++) {
      const url = product[`ProductImage${i}`] || product.photos?.[i - 1];
      if (url) imgs.push(url);
    }
    // Fallback to ImageURL if no productsphotos
    if (!imgs.length && product.ImageURL) imgs.push(product.ImageURL);
    return imgs;
  };

  const addToCart = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    const extraCost = selectedSize?.ExtraCost ? parseFloat(selectedSize.ExtraCost) : 0;
    const price = (product.prodCallforPrice ? 0 : (parseFloat(product.prodPrice) || 0)) + extraCost;
    const listingId = `G${product.ProdID}`;

    // Sync to backend
    try {
      await fetch(`${API}/api/marketplace/cart`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          BuyerPeopleID: parseInt(getPeopleId()),
          ListingID: listingId,
          Quantity: qty,
        }),
      });
    } catch {}

    // Update local cart
    const cart = getCart();
    const existing = cart.find(i => i.listingId === listingId);
    const next = existing
      ? cart.map(i => i.listingId === listingId ? { ...i, quantity: i.quantity + qty } : i)
      : [...cart, {
          listingId,
          title:      product.prodName || product.Title,
          price,
          unit:       'each',
          sellerName: product.SellerName,
          sellerBid:  product.BusinessID,
          imageUrl:   allPhotos()[0] || null,
          quantity:   qty,
        }];
    saveCart(next);
    setCartCount(next.reduce((s, i) => s + i.quantity, 0));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const retailPrice   = product ? parseFloat(product.prodPrice) || 0 : 0;
  const salePrice     = product ? parseFloat(product.SalePrice) || 0 : 0;
  const isOnSale      = product?.prodSaleIsActive && salePrice > 0 && salePrice < retailPrice;
  const displayPrice  = isOnSale ? salePrice : retailPrice;
  const photos        = product ? allPhotos() : [];

  const fiberContent = product?.fiber_content?.filter(f => f.type) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-grow flex items-center justify-center text-gray-400 text-lg">{t('prod_detail.loading')}</div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center gap-4">
          <p className="text-gray-500 text-lg">{t('prod_detail.not_found')}</p>
          <Link to="/marketplace/products" className="text-[#3D6B34] hover:underline">{t('prod_detail.browse_all')}</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const productName = product.prodName || product.Title || 'Farm Product';
  const productDesc = product.prodDescription || product.Description || '';
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PageMeta
        title={`${productName} | Farm Products Marketplace`}
        description={productDesc
          ? productDesc.replace(/<[^>]+>/g, '').slice(0, 155)
          : `Shop ${productName} from ${product.SellerName || 'a local farm'} on Oatmeal Farm Network. Buy farm-fresh products directly from farmers.`}
        keywords={`${productName}, ${product.SellerName || 'farm products'}, ${product.CategoryName || 'local farm goods'}, buy direct from farm`}
        image={mainImg || undefined}
        ogType="product"
        canonical={`https://oatmealfarmnetwork.com/marketplace/products/${id}`}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: productName,
            description: productDesc ? productDesc.replace(/<[^>]+>/g, '').slice(0, 500) : undefined,
            image: mainImg || undefined,
            ...(product.SellerName ? { brand: { '@type': 'Brand', name: product.SellerName } } : {}),
            ...(product.prodPrice ? {
              offers: {
                '@type': 'Offer',
                price: product.prodPrice,
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
              }
            } : {})
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://oatmealfarmnetwork.com' },
              { '@type': 'ListItem', position: 2, name: 'Marketplaces', item: 'https://oatmealfarmnetwork.com/marketplaces' },
              { '@type': 'ListItem', position: 3, name: 'Products', item: 'https://oatmealfarmnetwork.com/marketplace/products' },
              ...(product.CategoryName ? [{ '@type': 'ListItem', position: 4, name: product.CategoryName, item: `https://oatmealfarmnetwork.com/marketplace/products` }, { '@type': 'ListItem', position: 5, name: productName, item: `https://oatmealfarmnetwork.com/marketplace/products/${id}` }] : [{ '@type': 'ListItem', position: 4, name: productName, item: `https://oatmealfarmnetwork.com/marketplace/products/${id}` }]),
            ],
          },
        ]}
      />
      <Header />

      <div className="max-w-6xl mx-auto w-full px-4 pt-4">
        <Breadcrumbs items={[
          { label: 'Home', to: '/' },
          { label: 'Marketplaces', to: '/marketplaces' },
          { label: 'Products', to: '/marketplace/products' },
          ...(product.CategoryName ? [{ label: product.CategoryName }] : []),
          { label: productName },
        ]} />
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* ── Image Gallery ── */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3 aspect-square">
              {mainImg
                ? <img src={mainImg} alt={product.prodName} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-6xl text-gray-200">🛍️</div>
              }
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {photos.map((url, i) => (
                  <button key={i} onClick={() => setMainImg(url)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${mainImg === url ? 'border-[#3D6B34]' : 'border-gray-100 hover:border-gray-300'}`}>
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <div className="space-y-5">

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.prodCustomorder && (
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">{t('prod_detail.custom_orders')}</span>
              )}
              {isOnSale && (
                <span className="bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">{t('prod_detail.on_sale')}</span>
              )}
              {isMadeInUSA(product.prodMadeIn) && (
                <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">{t('prod_detail.made_in_usa')}</span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.prodName || product.Title}</h1>

            {/* Short description */}
            {product.prodShortDescription && (
              <p className="text-gray-500 text-sm">{product.prodShortDescription}</p>
            )}

            {/* Price */}
            {product.prodCallforPrice ? (
              <div className="flex items-center gap-3">
                <span className="text-gray-600 text-base font-medium">{t('prod_detail.price_on_request')}</span>
                <a href={`mailto:?subject=Inquiry about ${encodeURIComponent(product.prodName || '')}`}
                  className="bg-[#3D6B34] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#2d5226]">
                  {t('prod_detail.contact_seller')}
                </a>
              </div>
            ) : (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-[#3D6B34]">
                  ${(displayPrice + (selectedSize?.ExtraCost ? parseFloat(selectedSize.ExtraCost) : 0)).toFixed(2)}
                </span>
                {isOnSale && (
                  <span className="text-lg text-gray-400 line-through">${retailPrice.toFixed(2)}</span>
                )}
              </div>
            )}

            {/* Seller */}
            <div className="text-sm text-gray-500">
              {t('prod_detail.sold_by')} <span className="font-semibold text-gray-700">{product.SellerName}</span>
              {product.SellerCity && ` · ${product.SellerCity}`}
              {product.SellerState && `, ${product.SellerState}`}
            </div>

            {/* Fiber content */}
            {fiberContent.length > 0 && (
              <div className="bg-amber-50 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">{t('prod_detail.fiber_content')}</p>
                <p className="text-sm text-amber-900 font-medium">
                  {fiberContent.map((f, i) => (
                    `${f.percent != null ? f.percent + '% ' : ''}${f.type}`
                  )).join(' / ')}
                </p>
              </div>
            )}

            {/* Materials */}
            {product.Materials && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('prod_detail.materials')}</p>
                <p className="text-sm text-gray-700">{product.Materials}</p>
              </div>
            )}

            {/* Dimensions */}
            {product.ProdDimensions && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('prod_detail.dimensions')}</p>
                <p className="text-sm text-gray-700">{product.ProdDimensions}</p>
              </div>
            )}

            {/* Animals */}
            {(product.ProdAnimalID || product.animals?.length > 0) && (
              <div className="bg-green-50 rounded-xl px-4 py-3 text-sm text-green-800">
                {t('prod_detail.made_from_fiber')}
                {product.animals?.length > 0 && (
                  <span className="ml-1 text-green-600">
                    ({product.animals.map(a => a.AnimalName || a.AnimalID).join(', ')})
                  </span>
                )}
              </div>
            )}

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('prod_detail.size')}</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(s => (
                    <button key={s.SizeID}
                      onClick={() => setSelectedSize(selectedSize?.SizeID === s.SizeID ? null : s)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                        selectedSize?.SizeID === s.SizeID
                          ? 'border-[#3D6B34] bg-[#3D6B34] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                      }`}>
                      {s.Size}
                      {s.ExtraCost > 0 && <span className="ml-1 text-xs opacity-75">+${parseFloat(s.ExtraCost).toFixed(2)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {selectedColor ? t('prod_detail.color_selected', { name: selectedColor.Color }) : t('prod_detail.color')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(c => (
                    <button key={c.ColorID}
                      onClick={() => setSelectedColor(selectedColor?.ColorID === c.ColorID ? null : c)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                        selectedColor?.ColorID === c.ColorID
                          ? 'border-[#3D6B34] bg-[#3D6B34] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                      }`}>
                      {c.Color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            {!product.prodCallforPrice && (
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-50 font-bold text-lg">−</button>
                  <span className="px-4 py-2 text-sm font-semibold text-gray-900">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-50 font-bold text-lg">+</button>
                </div>
                <button onClick={addToCart}
                  className={`flex-grow py-3 rounded-xl font-semibold text-sm transition-all ${
                    added
                      ? 'bg-green-100 text-green-700'
                      : 'bg-[#3D6B34] text-white hover:bg-[#2d5226]'
                  }`}>
                  {added ? t('prod_detail.added') : t('prod_detail.add_to_cart')}
                </button>
              </div>
            )}

            {/* Cart count link */}
            {cartCount > 0 && (
              <Link to="/cart" className="block text-center text-sm text-[#3D6B34] hover:underline">
                {t('prod_detail.view_cart', { count: cartCount })}
              </Link>
            )}
          </div>
        </div>

        {/* ── Full Description ── */}
        {product.prodDescription && (
          <div className="mt-10 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('prod_detail.description_heading')}</h2>
            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{product.prodDescription}</div>
          </div>
        )}

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('prod_detail.more_from', { name: product.SellerName })}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map(p => {
                const imgUrl = p.ImageURL || null;
                const price  = parseFloat(p.UnitPrice) || 0;
                return (
                  <Link key={p.ProdID} to={`/marketplace/products/${p.ProdID}`}
                    className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow transition-shadow group">
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      {imgUrl
                        ? <img src={imgUrl} alt={p.Title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl text-gray-200">🛍️</div>
                      }
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-800 line-clamp-2">{p.Title}</p>
                      <p className="text-sm font-bold text-[#3D6B34] mt-1">
                        {p.prodCallforPrice ? t('prod_detail.contact_for_price') : `$${price.toFixed(2)}`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
