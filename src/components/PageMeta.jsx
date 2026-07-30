import { useEffect } from 'react';

const SITE_NAME = 'Livestock of America';
const DEFAULT_IMG = 'https://livestockofamerica.com/images/loa-header-logo.webp';
const BASE_URL = 'https://livestockofamerica.com';
const JSONLD_MARKER = 'data-pagemeta-jsonld';

function setMeta(name, content) {
  if (content == null) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setOG(property, content) {
  if (content == null) return;
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function clearJsonLd() {
  document.querySelectorAll(`script[${JSONLD_MARKER}]`).forEach((el) => el.remove());
}

function addJsonLd(data) {
  if (!data) return;
  const items = Array.isArray(data) ? data : [data];
  items.forEach((item) => {
    if (!item) return;
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute(JSONLD_MARKER, 'true');
    el.text = JSON.stringify(item);
    document.head.appendChild(el);
  });
}

export default function PageMeta({
  title,
  description,
  keywords,
  image,
  imageAlt,
  canonical,
  noIndex = false,
  ogType = 'website',
  jsonLd,
}) {
  useEffect(() => {
    const fullTitle = title
      ? (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`)
      : SITE_NAME;
    document.title = fullTitle;

    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('robots', noIndex ? 'noindex,nofollow' : 'index,follow');

    setOG('og:site_name', SITE_NAME);
    setOG('og:title', fullTitle);
    setOG('og:description', description);
    setOG('og:type', ogType);
    setOG('og:image', image || DEFAULT_IMG);
    if (imageAlt) setOG('og:image:alt', imageAlt);

    setCanonical(canonical || `${BASE_URL}${window.location.pathname}`);

    clearJsonLd();
    addJsonLd(jsonLd);
    return () => clearJsonLd();
  }, [title, description, keywords, image, imageAlt, canonical, noIndex, ogType, jsonLd]);

  return null;
}
