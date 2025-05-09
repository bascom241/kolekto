import express from 'express';

const router = express.Router();

import { createContributor } from '../controller/createContributorController.js';
// In your routes file
router.post('/collections/:collectionId/contributors', createContributor);

export default router;