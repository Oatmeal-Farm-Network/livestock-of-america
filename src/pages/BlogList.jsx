// src/pages/BlogList.jsx
// Public blog index — /blog. Mirrors oatmealfarmnetwork.com/blog: a global feed
// of published posts from every business, with search + category filtering.
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const MAROON = '#441c15';
const LORA = "'Lora', 'Times New Roman', serif";

const CATEGORY_COLORS = {
  'Farm News': '#15803d',
  'Recipes': '#b45309',
  'Seasonal': '#0891b2',
  'Events': '#7c5cbf',
  'Education': '#1d4ed8',
  'Market Updates': '#be185d',
  'Community': '#6b7280',
  'General': '#6b7280',
};

// Resolve an image reference: absolute URLs pass through; relative /uploads
// paths are served by the backend, so prefix them with the API base.
function resolveImg(src) {
  if (!src || typeof src !== 'string') return null;
  if (/^(https?:|data:)/i.test(src)) return src;
  if (src.startsWith('/')) return `${API_URL}${src}`;
  return src;
}

// Pull the first <img> out of a post body — content is stored as JSON text
// blocks with embedded <figure><img>, so most posts have no explicit cover
// image but do carry one inside their content.
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

function getExcerpt(content, wordLimit = 90) {
  if (!content) return '';
  let text = content;
  try {
    const blocks = JSON.parse(content);
    if (Array.isArray(blocks)) {
      text = blocks.filter((b) => b.type === 'text').map((b) => b.content || '').join(' ');
    }
  } catch { /* plain HTML */ }
  const plain = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = plain.split(/\s+/);
  if (words.length <= wordLimit) return plain;
  return words.slice(0, wordLimit).join(' ') + '…';
}

function PostCard({ post }) {
  const { t } = useTranslation();
  const catColor = CATEGORY_COLORS[post.category] || '#6b7280';
  const date = (post.published_at || post.created_at)
    ? new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  const excerpt = getExcerpt(post.content, 90);
  const image = resolveImg(post.cover_image) || firstImageFromContent(post.content);

  return (
    <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md">
      {image && (
        <img
          src={image}
          alt={post.title}
          className="block object-cover"
          style={{ width: 180, minWidth: 180, flexShrink: 0 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {post.category && (
            <span
              className="rounded-full px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide"
              style={{ color: catColor, background: catColor + '18' }}
            >
              {post.category}
            </span>
          )}
          {date && <span className="text-xs text-gray-400">{date}</span>}
          {post.business_name && (
            <span className="text-xs text-gray-400">
              · {t('blog.by_label', 'by')}{' '}
              <Link
                to={`/directory/business/${post.business_id}`}
                className="font-semibold no-underline"
                style={{ color: OLIVE }}
              >
                {post.business_name}
              </Link>
            </span>
          )}
        </div>
        <Link to={`/blog/${post.blog_id}`} className="no-underline" style={{ color: 'inherit' }}>
          <h3 className="mb-1 mt-0.5 text-base font-bold leading-snug text-gray-900" style={{ fontFamily: LORA }}>
            {post.title}
          </h3>
        </Link>
        {excerpt && <p className="m-0 text-sm leading-relaxed text-gray-600">{excerpt}</p>}
        <div className="mt-auto pt-2">
          <Link to={`/blog/${post.blog_id}`} className="text-sm font-semibold no-underline" style={{ color: OLIVE }}>
            {t('blog.read_more', 'Read more →')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BlogList() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const activeCategory = searchParams.get('category') || '';

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${API_URL}/api/blog/categories/global`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data.map((c) => c.name) : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    // Livestock of America covers North America, so the public blog shows only
    // posts from businesses in the USA, Canada, Mexico or Greenland. Filtered
    // server-side so the limit counts posts that will actually be displayed.
    const params = new URLSearchParams({ limit: '50', north_america: 'true' });
    if (activeCategory) params.set('category_name', activeCategory);
    fetch(`${API_URL}/api/blog/posts?${params}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPosts(Array.isArray(data) ? data : (data?.posts || data?.data || [])))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? posts.filter((p) =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.content || '').toLowerCase().includes(q) ||
        (p.business_name || '').toLowerCase().includes(q))
    : posts;

  return (
    <div className="flex min-h-screen flex-col font-sans" style={{ backgroundColor: CREAM }}>
      <PageMeta
        title="Farm & Ranch Blog | Livestock of America"
        description="Read the latest posts from farmers, ranchers, and breeders on Livestock of America — herd news, breeding notes, seasonal updates, and community stories."
        keywords="livestock blog, ranch blog, breeder stories, farm news, animal husbandry, cattle blog, sheep blog"
        canonical="https://livestockofamerica.com/blog"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Livestock of America Blog',
          url: 'https://livestockofamerica.com/blog',
          description: 'Stories from farmers, ranchers, and breeders.',
        }}
      />
      <Header />

      <div className="mx-auto w-full flex-1 px-6 pb-8 pt-4" style={{ maxWidth: '1100px', boxSizing: 'border-box' }}>
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: t('blog.title', 'Blog') }]} />

        <div className="mb-8 text-center">
          <h1 className="mb-1 text-3xl font-extrabold text-gray-900" style={{ fontFamily: LORA }}>
            {t('blog.title', 'Blog')}
          </h1>
          <p className="m-0 text-sm text-gray-500">
            {t('blog.subtitle', 'Stories from farmers, ranchers, and breeders.')}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            placeholder={t('blog.search_placeholder', 'Search posts…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSearchParams({})}
              className="rounded-full border px-3.5 py-1.5 text-xs"
              style={{
                fontWeight: activeCategory ? 400 : 700,
                background: activeCategory ? '#fff' : OLIVE,
                color: activeCategory ? '#374151' : '#fff',
                borderColor: activeCategory ? '#d1d5db' : OLIVE,
              }}
            >
              {t('blog.all_label', 'All')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSearchParams({ category: cat })}
                className="rounded-full border px-3.5 py-1.5 text-xs"
                style={{
                  fontWeight: activeCategory === cat ? 700 : 400,
                  background: activeCategory === cat ? OLIVE : '#fff',
                  color: activeCategory === cat ? '#fff' : '#374151',
                  borderColor: activeCategory === cat ? OLIVE : '#d1d5db',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="py-12 text-center text-gray-400">{t('blog.loading', 'Loading…')}</p>}
        {!loading && filtered.length === 0 && (
          <p className="py-12 text-center text-gray-400">{t('blog.no_posts', 'No blog posts yet.')}</p>
        )}

        <div className="flex flex-col gap-4">
          {filtered.map((post) => <PostCard key={post.blog_id} post={post} />)}
        </div>
      </div>

      <Footer />
    </div>
  );
}
