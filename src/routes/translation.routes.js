/**
 * Translation routes
 */

const express = require('express');
const router = express.Router();
const translationController = require('../controllers/translation.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Create a new translation (admin, org, teacher only)
router.post('/addCmsKey', authMiddleware, translationController.createTranslation);

// Bulk create multiple translations (admin, org, teacher only)
router.post('/bulkAddCmsKey', authMiddleware, translationController.bulkCreateTranslations);

// Get all translations (admin, org, teacher only)
router.get('/allTranslations', authMiddleware, translationController.getAllTranslations);

// Get translations by language (authenticated)
router.get('/:language', authMiddleware, translationController.getTranslationsByLanguage);

// Update a translation (admin, org, teacher only)
router.put('/updateTranslation/:id', authMiddleware, translationController.updateTranslation);

// Delete a translation (admin, org, teacher only)
router.delete('/deleteTranslationKey/:id', authMiddleware, translationController.deleteTranslation);

module.exports = router;
