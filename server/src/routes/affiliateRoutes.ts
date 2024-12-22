import express from 'express';
import { createAffiliateRequest, getAffiliateRequestByEmail } from '../controllers/affiliateController';

const router = express.Router();

router.use(express.json());

router.post('/create', createAffiliateRequest);
router.get('/:email', getAffiliateRequestByEmail);

export default router;
