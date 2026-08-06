import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const BASE_URL = 'https://livestockofamerica.com';
const MARKER = 'data-breadcrumb-jsonld';

export default function Breadcrumbs({ items = [], className = '', style = {} }) {
  const key = JSON.stringify(items);

  useEffect(() => {
    if (!items.length) return;
    const list = items.map((it, i) => {
      const entry = { '@type': 'ListItem', position: i + 1, name: it.label };
      if (it.to) entry.item = BASE_URL + it.to;
      return entry;
    });
    document.querySelectorAll(`script[${MARKER}]`).forEach((el) => el.remove());
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute(MARKER, 'true');
    el.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: list,
    });
    document.head.appendChild(el);
    return () => {
      document.querySelectorAll(`script[${MARKER}]`).forEach((n) => n.remove());
    };
  }, [key]);

  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`py-3 text-sm ${className}`}
      style={{ color: '#3D6B34', ...style }}
    >
      {items.map((it, i) => (
        <span key={`${it.label}-${i}`}>
          {i > 0 && <span style={{ margin: '0 0.4rem', opacity: 0.6 }}>›</span>}
          {it.to && i < items.length - 1 ? (
            <Link to={it.to} style={{ color: '#3D6B34', textDecoration: 'none', fontWeight: 600 }}>
              {it.label}
            </Link>
          ) : (
            <span style={{ color: '#555' }}>{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
