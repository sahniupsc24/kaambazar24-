import { useEffect } from 'react';

interface JobPostingData {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  workType?: string;
  compensationType?: string;
  compensationRate?: string | number;
  locationName?: string;
  businessName?: string;
}

export function JobPostingSchema({ job }: { job: JobPostingData }) {
  useEffect(() => {
    if (!job) return;

    // Map workType to schema.org employmentType
    let employmentType = 'FULL_TIME';
    if (job.workType === 'PART_TIME') employmentType = 'PART_TIME';
    if (job.workType === 'GIG' || job.workType === 'CONTRACT') employmentType = 'CONTRACTOR';

    // Map unitText for salary
    let unitText = 'DAY';
    if (job.compensationType === 'HOURLY') unitText = 'HOUR';
    if (job.compensationType === 'WEEKLY') unitText = 'WEEK';
    if (job.compensationType === 'MONTHLY') unitText = 'MONTH';

    const schemaData = {
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": job.title,
      "description": job.description,
      "identifier": {
        "@type": "PropertyValue",
        "name": "Kaam Bazar",
        "value": job.id
      },
      "datePosted": job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
      "employmentType": employmentType,
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.businessName || "Kaam Bazar Employer",
        "sameAs": window.location.origin
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": job.locationName || "India",
          "addressCountry": "IN"
        }
      },
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "INR",
        "value": {
          "@type": "QuantitativeValue",
          "value": job.compensationRate || 0,
          "unitText": unitText
        }
      }
    };

    let script = document.getElementById(`schema-job-${job.id}`) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = `schema-job-${job.id}`;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(schemaData);

    return () => {
      const existing = document.getElementById(`schema-job-${job.id}`);
      if (existing) existing.remove();
    };
  }, [job]);

  return null;
}

export function WebSiteSchema() {
  useEffect(() => {
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${window.location.origin}/#website`,
          "url": window.location.origin,
          "name": "Kaam Bazar (काम बाज़ार)",
          "description": "India's premier blue-collar job & labour marketplace.",
          "publisher": {
            "@id": `${window.location.origin}/#organization`
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${window.location.origin}/jobs?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@type": "Organization",
          "@id": `${window.location.origin}/#organization`,
          "name": "Kaam Bazar",
          "url": window.location.origin,
          "logo": `${window.location.origin}/icon-512.png`,
          "description": "Connecting skilled blue-collar workers with local employers across India."
        }
      ]
    };

    let script = document.getElementById('schema-website') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'schema-website';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(schemaData);

    return () => {
      const existing = document.getElementById('schema-website');
      if (existing) existing.remove();
    };
  }, []);

  return null;
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  useEffect(() => {
    if (!items || items.length === 0) return;

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url
      }))
    };

    let script = document.getElementById('schema-breadcrumb') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'schema-breadcrumb';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(schemaData);

    return () => {
      const existing = document.getElementById('schema-breadcrumb');
      if (existing) existing.remove();
    };
  }, [items]);

  return null;
}
