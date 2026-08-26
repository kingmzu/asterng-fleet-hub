import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE = 'https://asterng.lovable.app';
const BRAND = 'ASTERNG';

interface MetaEntry {
  title: string;
  description: string;
  noindex?: boolean;
}

const routeMeta: Record<string, MetaEntry> = {
  '/': {
    title: 'ASTERNG — Smart Mobility & Fleet Management in Nigeria',
    description:
      'ASTERNG builds smart mobility infrastructure: fleet management, smart meter trips, live GPS tracking, rider KYC and transparent remittance for Nigerian operators.',
  },
  '/login': {
    title: `Login — ${BRAND} Fleet Platform`,
    description:
      'Sign in to the ASTERNG fleet platform to manage riders, motorcycles, smart meter trips and remittances.',
  },
  '/signup': {
    title: `Create an account — ${BRAND} Fleet Platform`,
    description:
      'Create an ASTERNG account as an admin, operational manager or rider to access the fleet management platform.',
  },
  '/pending-approval': {
    title: `Account pending approval — ${BRAND}`,
    description: 'Your ASTERNG account is awaiting approval from an administrator.',
    noindex: true,
  },
  '/dashboard': { title: `Dashboard — ${BRAND}`, description: 'Fleet performance overview.', noindex: true },
  '/riders': { title: `Riders — ${BRAND}`, description: 'Rider records and onboarding.', noindex: true },
  '/motorcycles': { title: `Motorcycles — ${BRAND}`, description: 'Fleet vehicle records.', noindex: true },
  '/smart-meter': { title: `Smart Meter — ${BRAND}`, description: 'Live trip metering and fares.', noindex: true },
  '/remittances': { title: `Remittances — ${BRAND}`, description: 'Rider remittance payments.', noindex: true },
  '/expenses': { title: `Expenses — ${BRAND}`, description: 'Fleet operating expenses.', noindex: true },
  '/compliance': { title: `Compliance — ${BRAND}`, description: 'Documents, KYC and safety checks.', noindex: true },
  '/messages': { title: `Messages — ${BRAND}`, description: 'Internal messages and website enquiries.', noindex: true },
  '/profile': { title: `Profile — ${BRAND}`, description: 'Your ASTERNG account profile.', noindex: true },
  '/settings': { title: `Settings — ${BRAND}`, description: 'Platform settings and approvals.', noindex: true },
};

const fallback: MetaEntry = {
  title: `Page not found — ${BRAND}`,
  description: 'The page you are looking for does not exist on the ASTERNG platform.',
  noindex: true,
};

const RouteMeta = () => {
  const { pathname } = useLocation();
  const meta = routeMeta[pathname] ?? fallback;
  const url = `${SITE}${pathname === '/' ? '/' : pathname}`;

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={url} />
      {meta.noindex ? <meta name="robots" content="noindex, nofollow" /> : <meta name="robots" content="index, follow" />}
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
    </Helmet>
  );
};

export default RouteMeta;
