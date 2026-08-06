import React from 'react';
import { useSearchParams } from 'react-router';
import ComingSoon from './ComingSoon';

/** Sidebar destinations that are not yet built on LOA. */
export default function FeatureComingSoon() {
  const [params] = useSearchParams();
  const feature = params.get('feature') || 'This feature';
  return (
    <ComingSoon
      title={feature}
      description={`${feature} is coming soon to Livestock of America by Oatmeal AI. Explore the livestock marketplace and knowledgebase in the meantime.`}
    />
  );
}
