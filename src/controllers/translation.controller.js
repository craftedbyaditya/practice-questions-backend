/**
 * Translation controller
 */

const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/response');
const db = require('../utils/db');

// Table name constant
const TRANSLATIONS_TABLE = 'translations';

/**
 * Create a new translation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createTranslation = async (req, res) => {
  try {
    const { key, english, hindi, marathi, is_published } = req.body;
    
    // Validate required fields
    if (!key) {
      return sendError(
        res,
        'Missing required field: key is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    if (!english) {
      return sendError(
        res,
        'Missing required field: english translation is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Check if user has authorized role (admin, org, or teacher)
    const userRoles = req.userRoles || [];
    if (!userRoles.some(role => ['admin', 'org', 'teacher'].includes(role))) {
      return sendError(
        res,
        'Only admin, org, or teacher roles can create translations',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Get the user_id from the authenticated user information
    const user_id = req.userId;
    
    if (!user_id) {
      return sendError(
        res,
        'User ID is required to create a translation',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Check if key already exists
    const existingTranslations = await db.fetchData(TRANSLATIONS_TABLE, {
      key: `eq.${key}`
    });
    
    if (existingTranslations && existingTranslations.length > 0) {
      return sendError(
        res,
        `Translation with key '${key}' already exists`,
        HTTP_STATUS.CONFLICT
      );
    }
    
    // Create translation with provided information
    const translationData = {
      key,
      english,
      hindi: hindi || null,
      marathi: marathi || null,
      is_published: is_published !== undefined ? is_published : false
      // Only include user IDs if they appear to be valid UUIDs
      // This prevents database errors with invalid UUID format
    };
    
    // Always include the user ID who created this record
    if (user_id) {
      translationData.created_by = user_id;
      translationData.updated_by = user_id;
    }
    
    // Insert translation in database
    const translation = await db.insertData(TRANSLATIONS_TABLE, translationData);
    
    // Return success response
    return sendSuccess(
      res,
      'Translation created successfully',
      translation,
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    console.error('Error creating translation:', error);
    return sendError(
      res,
      'Failed to create translation',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get all translations (admin, org, teacher only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllTranslations = async (req, res) => {
  try {
    // Check if user has authorized role (admin, org, or teacher)
    const userRoles = req.userRoles || [];
    if (!userRoles.some(role => ['admin', 'org', 'teacher'].includes(role))) {
      return sendError(
        res,
        'Only admin, org, or teacher roles can view all translations',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Get all translations from the database (including unpublished/deleted for admin view)
    const translations = await db.fetchData(TRANSLATIONS_TABLE);
    
    // Return success response
    return sendSuccess(
      res, 
      'Translations retrieved successfully',
      {
        translations,
        count: translations.length
      }
    );
  } catch (error) {
    console.error('Error retrieving translations:', error);
    return sendError(
      res,
      'Failed to retrieve translations',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get translations by language (authenticated access)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTranslationsByLanguage = async (req, res) => {
  try {
    // Check if user ID exists in the request (from auth middleware)
    if (!req.userId || req.userId === 'anonymous') {
      return sendError(
        res,
        'Authentication required. Valid X-User-ID header is needed.',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const { language } = req.params;
    
    if (!language || !['english', 'hindi', 'marathi'].includes(language)) {
      return sendError(
        res,
        'Invalid language parameter. Must be one of: english, hindi, marathi',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Get published and non-deleted translations
    const translations = await db.fetchData(TRANSLATIONS_TABLE, {
      is_published: 'eq.true',
      is_deleted: 'eq.false'
    });
    
    if (!translations || translations.length === 0) {
      return sendSuccess(
        res,
        'No translations found',
        {
          translations: [],
          count: 0
        }
      );
    }
    
    // Map translations to return only key and the requested language
    const languageTranslations = translations.map(translation => ({
      key: translation.key,
      [language]: translation[language]
    }));
    
    // Return success response
    return sendSuccess(
      res,
      `${language.charAt(0).toUpperCase() + language.slice(1)} translations retrieved successfully`,
      {
        translations: languageTranslations,
        count: languageTranslations.length
      }
    );
  } catch (error) {
    console.error('Error retrieving translations by language:', error);
    return sendError(
      res,
      'Failed to retrieve translations',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Update a translation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const { key, english, hindi, marathi, is_published } = req.body;
    
    if (!id) {
      return sendError(
        res,
        'Translation ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Check if user has authorized role (admin, org, or teacher)
    const userRoles = req.userRoles || [];
    if (!userRoles.some(role => ['admin', 'org', 'teacher'].includes(role))) {
      return sendError(
        res,
        'Only admin, org, or teacher roles can update translations',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Get the translation to check if it exists
    const translations = await db.fetchData(TRANSLATIONS_TABLE, { 
      id: `eq.${id}` 
    });
    
    if (!translations || translations.length === 0) {
      return sendError(
        res,
        `Translation with ID ${id} not found`,
        HTTP_STATUS.NOT_FOUND
      );
    }
    
    // Create update object with only the fields that are provided
    const updateData = {};
    if (key !== undefined) updateData.key = key;
    if (english !== undefined) updateData.english = english;
    if (hindi !== undefined) updateData.hindi = hindi;
    if (marathi !== undefined) updateData.marathi = marathi;
    if (is_published !== undefined) updateData.is_published = is_published;

    // Always include the user ID who is updating this record
    if (req.userId) {
      updateData.updated_by = req.userId;
    }
    
    // Always update the timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Update translation in database
    const updatedTranslation = await db.updateData(TRANSLATIONS_TABLE, updateData, { id });
    
    // Return success response
    return sendSuccess(
      res,
      'Translation updated successfully',
      updatedTranslation
    );
  } catch (error) {
    console.error('Error updating translation:', error);
    return sendError(
      res,
      'Failed to update translation',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Delete a translation (soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendError(
        res,
        'Translation ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Check if user has authorized role (admin, org, or teacher)
    const userRoles = req.userRoles || [];
    if (!userRoles.some(role => ['admin', 'org', 'teacher'].includes(role))) {
      return sendError(
        res,
        'Only admin, org, or teacher roles can delete translations',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Find translation to check if it exists
    const translations = await db.fetchData(TRANSLATIONS_TABLE, { 
      id: `eq.${id}`,
      is_deleted: 'eq.false'
    });
    
    if (!translations || translations.length === 0) {
      return sendError(
        res,
        `Translation with ID ${id} not found or already deleted`,
        HTTP_STATUS.NOT_FOUND
      );
    }
    
    // Soft delete the translation by updating flags
    const updateData = {
      is_deleted: true,
      is_published: false, // Unpublish when deleted
      updated_at: new Date().toISOString(),
      updated_by: req.userId
    };
    
    await db.updateData(TRANSLATIONS_TABLE, updateData, { id });
    
    // Return success response
    return sendSuccess(
      res, 
      'Translation deleted successfully',
      { id }
    );
  } catch (error) {
    console.error('Error deleting translation:', error);
    return sendError(
      res,
      'Failed to delete translation',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Create multiple translations at once
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const bulkCreateTranslations = async (req, res) => {
  try {
    const { translations } = req.body;
    
    if (!translations || !Array.isArray(translations) || translations.length === 0) {
      return sendError(
        res,
        'Missing required field: translations array is required with at least one item',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Check if user has authorized role (admin, org, or teacher)
    const userRoles = req.userRoles || [];
    if (!userRoles.some(role => ['admin', 'org', 'teacher'].includes(role))) {
      return sendError(
        res,
        'Only admin, org, or teacher roles can create translations',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Get the user_id from the authenticated user information
    const user_id = req.userId;
    
    if (!user_id) {
      return sendError(
        res,
        'User ID is required to create translations',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Validate each translation item
    const invalidItems = translations.filter(item => !item.key || !item.english);
    if (invalidItems.length > 0) {
      return sendError(
        res,
        'All translation items must have key and english fields',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Check for duplicate keys within the request
    const keys = translations.map(t => t.key);
    const uniqueKeys = new Set(keys);
    if (uniqueKeys.size !== keys.length) {
      return sendError(
        res,
        'Duplicate keys found in the request. All keys must be unique.',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Check which keys already exist in the database
    const existingKeys = [];
    for (const key of uniqueKeys) {
      const existing = await db.fetchData(TRANSLATIONS_TABLE, { key: `eq.${key}` });
      if (existing && existing.length > 0) {
        existingKeys.push(key);
      }
    }
    
    if (existingKeys.length > 0) {
      return sendError(
        res,
        `The following keys already exist: ${existingKeys.join(', ')}`,
        HTTP_STATUS.CONFLICT
      );
    }
    
    // Make user_id available for tracking who created the records
    
    // Create translation data objects
    const translationDataArray = translations.map(t => {
      const translationData = {
        key: t.key,
        english: t.english,
        hindi: t.hindi || null,
        marathi: t.marathi || null,
        is_published: t.is_published !== undefined ? t.is_published : false
      };
      
      // Always include the user ID who created this record
      if (user_id) {
        translationData.created_by = user_id;
        translationData.updated_by = user_id;
      }
      
      return translationData;
    });
    
    // Insert each translation
    const createdTranslations = [];
    for (const data of translationDataArray) {
      const translation = await db.insertData(TRANSLATIONS_TABLE, data);
      createdTranslations.push(translation);
    }
    
    // Return success response
    return sendSuccess(
      res,
      `${createdTranslations.length} translations created successfully`,
      createdTranslations,
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    console.error('Error creating bulk translations:', error);
    return sendError(
      res,
      'Failed to create translations',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

module.exports = {
  createTranslation,
  bulkCreateTranslations,
  getAllTranslations,
  getTranslationsByLanguage,
  updateTranslation,
  deleteTranslation
};
