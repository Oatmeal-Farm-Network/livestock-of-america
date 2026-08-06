import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NewsFeed from './NewsFeed';

/** LOA shell around the OFN NewsFeed component. */
export default function NewsFeedPage() {
  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#f7f2e8' }}>
      <Header />
      <div className="flex-1">
        <NewsFeed />
      </div>
      <Footer />
    </div>
  );
}
