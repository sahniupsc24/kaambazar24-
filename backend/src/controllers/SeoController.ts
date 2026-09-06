import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppDataSource } from '../config/data-source';
import { Job } from '../entities/Job';
import { Category } from '../entities/Category';
import { JobStatus } from '../entities/enums';

export const SeoController = {
  getRobotsTxt: asyncHandler(async (req: Request, res: Response) => {
    const host = req.get('host') || 'localhost:4000';
    const protocol = req.protocol || 'https';
    const baseUrl = `${protocol}://${host}`;

    const content = `User-agent: *
Allow: /
Allow: /jobs
Allow: /jobs/*
Allow: /about
Allow: /contact
Allow: /privacy-policy
Allow: /terms
Disallow: /admin/
Disallow: /worker/
Disallow: /employer/
Disallow: /api/

# AI Search & LLM Bots (Explicitly Allowed for AI SEO)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ByteSpider
Allow: /

User-agent: CCBot
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;

    res.header('Content-Type', 'text/plain');
    res.send(content);
  }),

  getSitemapXml: asyncHandler(async (req: Request, res: Response) => {
    const host = req.get('host') || 'localhost:4000';
    const protocol = req.protocol || 'https';
    const baseUrl = `${protocol}://${host}`;

    const jobRepo = AppDataSource.getRepository(Job);
    const categoryRepo = AppDataSource.getRepository(Category);

    const jobs = await jobRepo.find({
      where: { status: JobStatus.OPEN },
      order: { updatedAt: 'DESC' },
      take: 500,
    });

    const categories = await categoryRepo.find();

    const now = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static Pages
    const staticPages = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/jobs`, priority: '0.9', changefreq: 'hourly' },
      { loc: `${baseUrl}/about`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/contact`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/privacy-policy`, priority: '0.3', changefreq: 'yearly' },
      { loc: `${baseUrl}/terms`, priority: '0.3', changefreq: 'yearly' },
    ];

    staticPages.forEach((p) => {
      xml += `  <url>\n    <loc>${p.loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
    });

    // Categories
    categories.forEach((c) => {
      xml += `  <url>\n    <loc>${baseUrl}/jobs?categoryId=${c.id}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    // Jobs
    jobs.forEach((j) => {
      const lastmod = j.updatedAt ? new Date(j.updatedAt).toISOString() : now;
      xml += `  <url>\n    <loc>${baseUrl}/jobs/${j.id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  }),
};
