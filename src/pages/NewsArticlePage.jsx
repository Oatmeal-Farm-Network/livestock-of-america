import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ArticleDetail from './ArticleDetail';

export default function NewsArticlePage() {
  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#f7f2e8' }}>
      <Header />
      <div className="flex-1 max-w-[1100px] mx-auto w-full px-4 py-6">
        <ArticleDetail />
      </div>
      <Footer />
    </div>
  );
}
