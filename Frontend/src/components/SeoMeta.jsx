import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://yourcaly.com';
const DEFAULT_OG_IMAGE = 'https://yourcaly.com/YourCalyLogo.png';

export default function SeoMeta({ title, description, canonical, ogImage }) {
  const fullTitle = title ? `YourCaly | ${title}` : 'YourCaly | Scheduling Platform For Indian Professionals';
  const fullDesc = description || 'Create booking pages and schedule meetings easily. Built for coaches, consultants and freelancers in India.';
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL;
  const image = ogImage || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDesc} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDesc} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDesc} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
