import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'job';
  gaMeasurementId?: string;
}

export function SEOHead({
  title = "Kaam Bazar (काम बाज़ार) — Blue-Collar Job & Labour Marketplace",
  description = "India's premier blue-collar job & labour marketplace. Find skilled workers or get hired near you.",
  keywords = "jobs, blue collar, labor, hiring, worker, gig work, daily wage, construction, driver, maid, plumber",
  canonicalUrl,
  ogImage = "/icon-512.png",
  ogType = "website",
  gaMeasurementId,
}: SEOHeadProps) {
  useEffect(() => {
    // 1. Update Title
    document.title = title;

    // 2. Helper to set or update meta tag
    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard Meta
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);

    // OpenGraph Meta
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    const currentUrl = canonicalUrl || window.location.href;
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', currentUrl);

    // Twitter Card Meta
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // 3. Dynamic GA4 Injection if GA ID is present
    if (gaMeasurementId && !document.getElementById('ga-gtag-script')) {
      const script1 = document.createElement('script');
      script1.id = 'ga-gtag-script';
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.id = 'ga-inline-script';
      script2.textContent = [
        'window.dataLayer = window.dataLayer || [];',
        'function gtag(){dataLayer.push(arguments);}',
        "gtag('js', new Date());",
        `gtag('config', '${gaMeasurementId.replace(/[^A-Za-z0-9-]/g, '')}');`,
      ].join(' ');
      document.head.appendChild(script2);
    }
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, gaMeasurementId]);

  return null;
}
