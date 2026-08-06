// src/ArticleDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import PageMeta from '../components/PageMeta';

const NEWS_API =
  import.meta.env.VITE_NEWS_API_URL ||
  import.meta.env.VITE_LIVESTOCK_API_URL ||
  'https://oatmeal-ai.com';

const CATEGORY_IMAGES = {
  Markets: '/images/news/news-markets.svg',
  Weather: '/images/news/news-weather.svg',
  Policy: '/images/news/news-policy.svg',
  AgTech: '/images/news/news-agtech.svg',
  Livestock: '/images/news/news-livestock.svg',
  General: '/images/news/news-general.svg',
};

const getHeroImage = (article) => {
  const img = article?.image?.trim();
  if (img && img.startsWith('http')) return img;
  return article?.placeholderImage || CATEGORY_IMAGES[article?.category] || CATEGORY_IMAGES.General;
};

const PREVIEW_TEXT_CHARS = 450;

const buildPreviewHtml = (html) => {
  if (!html) return '';
  if (typeof window === 'undefined' || !window.DOMParser) {
    return html.slice(0, 800);
  }
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const children = Array.from(doc.body.children);
    if (children.length === 0) {
      const text = (doc.body.textContent || '').slice(0, PREVIEW_TEXT_CHARS);
      return `<p>${text}…</p>`;
    }
    const parts = [];
    let charCount = 0;
    for (const node of children) {
      parts.push(node.outerHTML);
      charCount += (node.textContent || '').length;
      if (charCount >= PREVIEW_TEXT_CHARS) break;
    }
    return parts.join('');
  } catch {
    return html.slice(0, 800);
  }
};

const ArticleDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${NEWS_API}/api/news/${id}`);
        if (!response.ok) throw new Error('Article not found');
        const data = await response.json();
        setArticle(data);
      } catch (err) {
        setError('Failed to load article.');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  if (loading) return <div style={{ paddingTop: '3rem', textAlign: 'center', color: '#6b7280' }}>{t('article.loading')}</div>;
  if (error || !article) return <div style={{ paddingTop: '3rem', textAlign: 'center', color: '#dc2626' }}>{error || t('article.not_found')}</div>;

  const tokenRaw = localStorage.getItem('access_token') || localStorage.getItem('AccessToken');
  const isSignedIn = !!(tokenRaw && tokenRaw !== 'undefined' && tokenRaw !== 'null');
  const fullContent = article.content || '';
  const displayContent = isSignedIn ? fullContent : buildPreviewHtml(fullContent);

  const heroImg = getHeroImage(article);
  const articleCanonical = `https://livestockofamerica.com/news/${id}`;
  const pubIso = article.pubDate ? new Date(article.pubDate).toISOString() : undefined;
  const articleDesc = article.description
    ? article.description.replace(/<[^>]+>/g, '').slice(0, 155)
    : article.title;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem', paddingBottom: '3rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
      <PageMeta
        title={article.title}
        description={articleDesc}
        keywords={`${article.category || 'agriculture'}, farm news, agricultural news, ${article.source}, Livestock of America`}
        image={heroImg?.startsWith('http') ? heroImg : undefined}
        imageAlt={article.title}
        canonical={articleCanonical}
        ogType="article"
        publishedTime={pubIso}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            'headline': article.title,
            'description': articleDesc,
            ...(heroImg?.startsWith('http') ? { 'image': heroImg } : {}),
            ...(pubIso ? { 'datePublished': pubIso, 'dateModified': pubIso } : {}),
            'author': { '@type': 'Organization', 'name': article.source || 'Livestock of America' },
            'publisher': {
              '@type': 'Organization',
              'name': 'Livestock of America',
              'logo': { '@type': 'ImageObject', 'url': 'https://livestockofamerica.com/images/OFN-Logo.png' },
            },
            'mainEntityOfPage': { '@type': 'WebPage', '@id': articleCanonical },
            ...(article.link ? { 'url': article.link } : {}),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://livestockofamerica.com' },
              { '@type': 'ListItem', 'position': 2, 'name': 'News', 'item': 'https://livestockofamerica.com/news' },
              { '@type': 'ListItem', 'position': 3, 'name': article.title, 'item': articleCanonical },
            ],
          },
        ]}
      />
      <button onClick={() => navigate('/news')}
        style={{ background: 'none', border: 'none', color: '#819360', cursor: 'pointer', fontWeight: 600, marginBottom: '1rem', fontSize: '0.9rem' }}>
        {t('article.back_news')}
      </button>

      <img src={getHeroImage(article)} alt={article.title}
        style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1.5rem', background: '#f3f4f6' }}
        onError={(e) => {
          const fallback = CATEGORY_IMAGES[article.category] || CATEGORY_IMAGES.General;
          if (e.target.src !== window.location.origin + fallback) e.target.src = fallback;
        }} />


      <div style={{ marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>{article.source}</span>
        <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '0.75rem' }}>{new Date(article.pubDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3, margin: '0 0 1.5rem', color: '#111827' }}>{article.title}</h1>

      {article.content ? (
        <div style={{ position: 'relative' }}>
          <div className="article-content" style={{ fontSize: '1rem', lineHeight: 1.8, color: '#374151' }}
            dangerouslySetInnerHTML={{ __html: displayContent }} />
          {!isSignedIn && (
            <div style={{ marginTop: '1.5rem', padding: '1.25rem 1.5rem', background: 'linear-gradient(180deg, #f9fafb 0%, #eef2e8 100%)', border: '1px solid #d6dec5', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                {t('article.sign_in_title')}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 0.9rem', lineHeight: 1.5 }}>
                {t('article.sign_in_body')}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/login')}
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', fontWeight: 600, border: 'none', backgroundColor: '#819360', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>
                  {t('article.sign_in_btn')}
                </button>
                <button onClick={() => navigate('/register')}
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #819360', backgroundColor: '#fff', color: '#819360', borderRadius: '6px', cursor: 'pointer' }}>
                  {t('article.create_account')}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#374151' }}>{article.description}</p>
      )}

      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isSignedIn && article.link ? (
          <a href={article.link} target="_blank" rel="noopener noreferrer"
            style={{ color: '#819360', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
            {t('article.view_original', { source: article.source })}
          </a>
        ) : <span />}
        <button onClick={() => navigate('/news')}
          style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem', paddingLeft: '1.25rem', paddingRight: '1.25rem', backgroundColor: '#111827', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
          {t('article.back_news')}
        </button>
      </div>

      <style>{`.article-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; }
        .article-content a { color: #819360; } .article-content p { margin-bottom: 1rem; }
        .article-content textarea, .article-content input, .article-content select, .article-content button, .article-content form { display: none !important; }`}</style>
    </div>
  );
};

export default ArticleDetail;
