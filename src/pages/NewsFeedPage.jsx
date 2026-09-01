import React from 'react';
import Header from '../components/Header';
import Breadcrumbs from '../components/Breadcrumbs';
import Footer from '../components/Footer';
import NewsFeed from './NewsFeed';

/** LOA shell around the OFN NewsFeed component. */
export default function NewsFeedPage() {
  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#f7f2e8' }}>
      <Header />

      {/* Breadcrumbs sit directly under the header on every page but Home. */}
      <div className="mx-auto w-full px-4" style={{ maxWidth: '1100px' }}>
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'News Feed' },
          ]}
        />
      </div>
      <div className="flex-1">
        <NewsFeed />
      </div>
      <Footer />
    </div>
  );
}
