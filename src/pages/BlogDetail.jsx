// src/pages/BlogDetail.jsx
// Single blog post — /blog/:postId. Renders JSON content blocks (text + image)
// exactly like oatmealfarmnetwork.com/blog/:id, styled for Livestock of America.
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from '../lib/i18n';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';

const API_URL = import.meta.env.VITE_LIVESTOCK_API_URL || '';
const CREAM = '#f7f2e8';
const OLIVE = '#3d6b34';
const OLIVE_DARK = '#507033';
const LORA = "'Lora', 'Times New Roman', serif";

const CATEGORY_COLORS = {
  'Farm News': '#15803d', 'Recipes': '#b45309', 'Seasonal': '#0891b2',
  'Events': '#7c5cbf', 'Education': '#1d4ed8', 'Market Updates': '#be185d',
  'Community': '#6b7280', 'General': '#6b7280',
};

function resolveImg(src) {
  if (!src || typeof src !== 'string') return null;
  if (/^(https?:|data:)/i.test(src)) return src;
  if (src.startsWith('/')) return `${API_URL}${src}`;
  return src;
}

function buildExcerpt(content, max = 160) {
  if (!content) return '';
  let text = content;
  try {
    const blocks = JSON.parse(content);
    if (Array.isArray(blocks)) {
      text = blocks.filter((b) => b.type === 'text').map((b) => b.content || '').join(' ');
    }
  } catch { /* plain HTML */ }
  const plain = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.length > max ? plain.slice(0, max - 1) + '…' : plain;
}

function renderContent(content) {
  if (!content) return null;
  let blocks;
  try {
    blocks = JSON.parse(content);
    if (!Array.isArray(blocks)) throw new Error();
  } catch {
    return (
      <div
        className="break-words text-base leading-8 text-gray-800"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'image') {
          return (
            <figure key={i} style={{ margin: '1.75rem 0', textAlign: block.align || 'center' }}>
              <img
                src={resolveImg(block.url)}
                alt={block.caption || ''}
                style={{ width: block.width || '100%', maxWidth: '100%', borderRadius: 10, display: 'inline-block', objectFit: 'contain' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              {block.caption && (
                <figcaption className="mt-1.5 text-sm italic text-gray-500">{block.caption}</figcaption>
              )}
            </figure>
          );
        }
        return (
          <div
            key={i}
            className="mb-2 break-words text-base leading-8 text-gray-800"
            dangerouslySetInnerHTML={{ __html: block.content || '' }}
          />
        );
      })}
    </>
  );
}

export default function BlogDetail() {
  const { t } = useTranslation();
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [ranch, setRanch] = useState(null);

  useEffect(() => {
    if (!postId) return;
    window.scrollTo(0, 0);
    setLoading(true);
    setNotFound(false);
    fetch(`${API_URL}/api/blog/posts/${postId}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then((data) => { if (data) setPost(data); else setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    if (!post?.business_id) return;
    fetch(`${API_URL}/api/ranches/profile/${post.business_id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setRanch(d); })
      .catch(() => {});
  }, [post?.business_id]);

  const formatDate = (dt) => (dt ? new Date(dt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '');
  const catColor = post ? (CATEGORY_COLORS[post.category] || '#6b7280') : '#6b7280';
  const postDesc = post ? (post.excerpt || buildExcerpt(post.content, 160)) : '';
  const cover = post ? resolveImg(post.cover_image) : null;
  const profileBase = post?.business_id ? `/directory/business/${post.business_id}` : null;
  const ranchLocation = ranch ? [ranch.address_city, ranch.address_state].filter(Boolean).join(', ') : '';

  return (
    <div className="flex min-h-screen flex-col font-sans" style={{ backgroundColor: CREAM }}>
      {post && (
        <PageMeta
          title={`${post.title}${post.business_name ? ' · ' + post.business_name : ''}`}
          description={postDesc}
          image={cover || undefined}
          canonical={`https://livestockofamerica.com/blog/${postId}`}
          ogType="article"
        />
      )}
      <Header />

      <div className="mx-auto w-full flex-1 px-4 pb-16" style={{ maxWidth: '1000px', boxSizing: 'border-box' }}>
        <div className="pt-3">
          <Breadcrumbs items={[
            { label: 'Home', to: '/' },
            { label: t('blog.title', 'Blog'), to: '/blog' },
            ...(post?.business_name ? [{ label: post.business_name, to: profileBase }] : []),
            { label: post?.title || 'Post' },
          ]} />
        </div>

        {loading && <p className="py-12 text-center text-gray-400">{t('blog.loading_post', 'Loading post…')}</p>}

        {notFound && !loading && (
          <div className="py-12 text-center">
            <h2 className="text-gray-700" style={{ fontFamily: LORA }}>{t('blog.post_not_found', 'Post Not Found')}</h2>
            <p className="text-gray-400">{t('blog.post_removed', 'This blog post is no longer available.')}</p>
            <Link to="/blog" className="text-sm font-bold no-underline" style={{ color: OLIVE }}>
              {t('blog.back', '← Back to Blog')}
            </Link>
          </div>
        )}

        {post && !loading && (
          <>
            {(ranch?.header_image || ranch?.logo || post.business_name) && (
              <div className="border-b border-gray-200 py-6 text-center">
                {ranch?.header_image ? (
                  <img src={ranch.header_image} alt={post.business_name}
                    className="mx-auto mb-3" style={{ maxHeight: 130, maxWidth: '100%', objectFit: 'contain' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : ranch?.logo ? (
                  <img src={ranch.logo} alt={post.business_name}
                    className="mx-auto mb-3" style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : null}
                {post.business_name && (
                  profileBase ? (
                    <Link to={profileBase} className="no-underline">
                      <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: LORA }}>{post.business_name}</h1>
                    </Link>
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: LORA }}>{post.business_name}</h1>
                  )
                )}
                {ranchLocation && <p className="mt-1 text-sm text-gray-500">{ranchLocation}</p>}
              </div>
            )}

            <article className="mx-auto pt-8" style={{ maxWidth: 780 }}>
              <Link
                to={profileBase ? `${profileBase}?tab=blog` : '/blog'}
                className="mb-6 inline-block text-sm no-underline"
                style={{ color: OLIVE }}
              >
                {post.business_name
                  ? t('blog.back_to_blog', `← More from ${post.business_name}`, { name: post.business_name })
                  : t('blog.back', '← Back to Blog')}
              </Link>

              {cover && (
                <img
                  src={cover}
                  alt={post.title}
                  className="mb-6 block w-full rounded-xl object-cover"
                  style={{ maxHeight: 400 }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}

              <div className="mb-3 flex flex-wrap items-center gap-3">
                {post.category && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide"
                    style={{ color: catColor, background: catColor + '18' }}
                  >
                    {post.category}
                  </span>
                )}
                <span className="text-sm text-gray-400">{formatDate(post.published_at || post.created_at)}</span>
              </div>

              <h2 className="mb-4 text-3xl font-extrabold leading-tight text-gray-900" style={{ fontFamily: LORA }}>
                {post.title}
              </h2>

              <div className="mb-7 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-7">
                <span className="text-sm text-gray-500">{t('blog.by_label', 'by')}</span>
                {post.author ? (
                  <span className="text-sm font-semibold text-gray-700">{post.author}</span>
                ) : (
                  <Link to={profileBase || '/directory'} className="text-sm font-semibold no-underline" style={{ color: OLIVE }}>
                    {post.business_name}
                  </Link>
                )}
                {post.author && post.business_name && (
                  <>
                    <span className="text-sm text-gray-400">·</span>
                    <Link to={profileBase || '/directory'} className="text-sm text-gray-400 no-underline">
                      {post.business_name}
                    </Link>
                  </>
                )}
              </div>

              {post.excerpt && (
                <p className="mb-6 text-lg italic leading-relaxed text-gray-600">{post.excerpt}</p>
              )}

              {renderContent(post.content)}

              <div className="mt-10 border-t border-gray-200 pt-6">
                <Link
                  to={profileBase || '/directory'}
                  className="inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white no-underline"
                  style={{ backgroundColor: OLIVE_DARK }}
                >
                  {post.business_name
                    ? t('blog.view_profile', `View ${post.business_name}`, { name: post.business_name })
                    : t('blog.view_directory', 'Browse Directory')}
                </Link>
                <Link to="/blog" className="ml-4 text-sm no-underline" style={{ color: OLIVE }}>
                  {t('blog.all_posts', 'All posts')}
                </Link>
              </div>
            </article>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
