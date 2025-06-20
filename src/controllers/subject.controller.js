/**
 * Controller for subject-related operations
 */
const db = require('../utils/db');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/response');

// Table name for subjects in Supabase
const SUBJECTS_TABLE = 'subjects';

/**
 * Create a new subject
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createSubject = async (req, res) => {
  try {
    const { name, description, exam_id } = req.body;
    
    // Validate required fields
    if (!name) {
      return sendError(
        res, 
        'Missing required field: name is required', 
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (!exam_id) {
      return sendError(
        res, 
        'Missing required field: exam_id is required', 
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Check if user has authorized role (admin, org, or teacher)
    const userRoles = req.userRoles || [];
    if (!userRoles.some(role => ['admin', 'org', 'teacher'].includes(role))) {
      return sendError(
        res,
        'Only admin, org, or teacher roles can create subjects',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Get the user_id from the authenticated user information
    const user_id = req.userId;
    
    if (!user_id) {
      return sendError(
        res, 
        'User ID is required to create a subject', 
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Create subject object with provided fields
    const subjectData = {
      name,
      description: description || null,
      user_id,
      exam_id
      // created_at and updated_at will be set automatically by database triggers
    };
    
    // Insert subject into database
    const subject = await db.insertData(SUBJECTS_TABLE, subjectData);
    
    console.log(`Subject ${subject.id} created by user ${user_id} for exam ${exam_id}`);
    
    // Return success response
    return sendSuccess(
      res,
      'Subject created successfully',
      subject,
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    console.error('Error creating subject:', error);
    return sendError(
      res,
      'Failed to create subject',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get all subjects
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllSubjects = async (req, res) => {
  try {
    // Get all active subjects from the database
    const subjects = await db.fetchData(SUBJECTS_TABLE, {
      is_deleted: 'eq.false',
      is_active: 'eq.true'
    });
    
    // Return success response
    return sendSuccess(
      res, 
      'Subjects retrieved successfully',
      {
        subjects,
        count: subjects.length
      },
      HTTP_STATUS.OK
    );
  } catch (error) {
    console.error('Error retrieving subjects:', error);
    return sendError(res, 'Failed to retrieve subjects', HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * Get subjects by exam ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSubjectsByExamId = async (req, res) => {
  try {
    const { examId } = req.params;
    
    if (!examId) {
      return sendError(
        res,
        'Exam ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Find active subjects with the given exam ID
    const subjects = await db.fetchData(SUBJECTS_TABLE, { 
      exam_id: `eq.${examId}`,
      is_deleted: 'eq.false',
      is_active: 'eq.true'
    });
    
    // Return success response with subjects
    return sendSuccess(
      res,
      'Subjects retrieved successfully',
      {
        subjects,
        count: subjects.length
      }
    );
  } catch (error) {
    console.error('Error retrieving subjects:', error);
    return sendError(
      res,
      'Failed to retrieve subjects',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get subject by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendError(
        res,
        'Subject ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Find the active subject with the given ID
    const subjects = await db.fetchData(SUBJECTS_TABLE, { 
      id: `eq.${id}`,
      is_deleted: 'eq.false',
      is_active: 'eq.true'
    });
    
    if (!subjects || subjects.length === 0) {
      return sendError(
        res,
        `Subject with ID ${id} not found or has been deleted`,
        HTTP_STATUS.NOT_FOUND
      );
    }
    
    // Return success response with subject
    return sendSuccess(
      res,
      'Subject retrieved successfully',
      subjects[0]
    );
  } catch (error) {
    console.error('Error retrieving subject:', error);
    return sendError(
      res,
      'Failed to retrieve subject',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Update subject by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, exam_id } = req.body;
    
    if (!id) {
      return sendError(
        res,
        'Subject ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Check if user has authorized role (admin, org, or teacher)
    const userRoles = req.userRoles || [];
    if (!userRoles.some(role => ['admin', 'org', 'teacher'].includes(role))) {
      return sendError(
        res,
        'Only admin, org, or teacher roles can update subjects',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Find the subject first to check if it exists and belongs to the user
    const subjects = await db.fetchData(SUBJECTS_TABLE, { 
      id: `eq.${id}` 
    });
    
    if (!subjects || subjects.length === 0) {
      return sendError(
        res,
        `Subject with ID ${id} not found`,
        HTTP_STATUS.NOT_FOUND
      );
    }
    
    // Get the user_id from the authenticated user information
    const userId = req.userId;
    
    // Check if user has authorized role (admin, org, or teacher)
    const hasAuthorizedRole = userRoles.some(role => ['admin', 'org', 'teacher'].includes(role));
    if (!hasAuthorizedRole || (subjects[0].user_id !== userId && !userRoles.includes('admin'))) {
      return sendError(
        res,
        'Only admin, org, and teacher roles can update subjects (non-admin users can only update their own subjects)',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Create update data
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (exam_id) updateData.exam_id = exam_id;
    
    // Update subject in database
    const updatedSubject = await db.updateData(SUBJECTS_TABLE, updateData, { id });
    
    console.log(`Subject ${id} updated by user ${userId}`);
    
    // Return success response
    return sendSuccess(
      res,
      'Subject updated successfully',
      updatedSubject,
      HTTP_STATUS.OK
    );
  } catch (error) {
    console.error('Error updating subject:', error);
    return sendError(
      res,
      'Failed to update subject',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Soft delete subject by ID by setting is_deleted=true and is_active=false
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendError(
        res,
        'Subject ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Check if user has authorized role (admin, org, or teacher)
    const userRoles = req.userRoles || [];
    if (!userRoles.some(role => ['admin', 'org', 'teacher'].includes(role))) {
      return sendError(
        res,
        'Only admin, org, or teacher roles can delete subjects',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Find the subject first to check if it exists and belongs to the user
    const subjects = await db.fetchData(SUBJECTS_TABLE, { 
      id: `eq.${id}`,
      is_deleted: 'eq.false' // Only operate on non-deleted subjects
    });
    
    if (!subjects || subjects.length === 0) {
      return sendError(
        res,
        `Subject with ID ${id} not found or already deleted`,
        HTTP_STATUS.NOT_FOUND
      );
    }
    
    // Get the user_id from the authenticated user information
    const userId = req.userId;
    
    // Check if user has authorized role (admin, org, or teacher)
    const hasAuthorizedRole = userRoles.some(role => ['admin', 'org', 'teacher'].includes(role));
    if (!hasAuthorizedRole || (subjects[0].user_id !== userId && !userRoles.includes('admin'))) {
      return sendError(
        res,
        'Only admin, org, and teacher roles can delete subjects (non-admin users can only delete their own subjects)',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Soft delete the subject by updating flags
    const updateData = {
      is_deleted: true,
      is_active: false
    };
    
    await db.updateData(SUBJECTS_TABLE, updateData, { id });
    
    console.log(`Subject ${id} soft deleted by user ${userId}`);
    
    // Return success response
    return sendSuccess(
      res,
      'Subject deleted successfully',
      { id },
      HTTP_STATUS.OK
    );
  } catch (error) {
    console.error('Error deleting subject:', error);
    return sendError(
      res,
      'Failed to delete subject',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get subjects by user ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSubjectsByUserId = async (req, res) => {
  try {
    // Get user_id from authenticated user
    const userId = req.userId;
    
    if (!userId) {
      return sendError(
        res,
        'User ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Find active subjects with the given user ID
    const subjects = await db.fetchData(SUBJECTS_TABLE, { 
      user_id: `eq.${userId}`,
      is_deleted: 'eq.false',
      is_active: 'eq.true'
    });
    
    // Return success response with subjects
    return sendSuccess(
      res,
      'Subjects retrieved successfully',
      {
        subjects,
        count: subjects.length
      }
    );
  } catch (error) {
    console.error('Error retrieving subjects by user ID:', error);
    return sendError(
      res,
      'Failed to retrieve subjects',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

module.exports = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  getSubjectsByExamId,
  updateSubjectById,
  deleteSubjectById,
  getSubjectsByUserId
};
