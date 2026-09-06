import { Router } from 'express';
import { SeoController } from '../controllers/SeoController';

const router = Router();

router.get('/robots.txt', SeoController.getRobotsTxt);
router.get('/sitemap.xml', SeoController.getSitemapXml);

export default router;
