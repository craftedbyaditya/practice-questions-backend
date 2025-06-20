/**
 * Controller for exam-related operations
 */
const db = require('../utils/db');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/response');

// Table name for exams in Supabase
const EXAMS_TABLE = 'exams';

/**
 * Create a new exam
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createExam = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Validate required fields
    if (!name) {
      return sendError(
        res, 
        'Missing required field: name is required', 
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Get the user_id from the authenticated user information
    // Assuming user_id is attached to request by auth middleware
    const user_id = req.userId;
    
    if (!user_id) {
      return sendError(
        res, 
        'User ID is required to create an exam', 
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Create exam object with provided fields
    const examData = {
      name,
      description: description || null,
      user_id
      // created_at and updated_at will be set automatically by database triggers
    };
    
    // Insert exam into database
    const exam = await db.insertData(EXAMS_TABLE, examData);
    
    console.log(`Exam ${exam.id} created by user ${user_id}`);
    
    // Return success response
    return sendSuccess(
      res,
      'Exam created successfully',
      exam,
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    console.error('Error creating exam:', error);
    return sendError(
      res,
      'Failed to create exam',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get all exams
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllExams = async (req, res) => {
  try {
    // Get all exams from database
    const exams = await db.fetchData(EXAMS_TABLE);
    
    // Return success response with exams
    return sendSuccess(
      res,
      'Exams retrieved successfully',
      {
        exams,
        count: exams.length
      }
    );
  } catch (error) {
    console.error('Error retrieving exams:', error);
    return sendError(
      res,
      'Failed to retrieve exams',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get exam by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendError(
        res,
        'Exam ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Find the exam with the given ID
    const exams = await db.fetchData(EXAMS_TABLE, { 
      id: `eq.${id}` 
    });
    
    if (!exams || exams.length === 0) {
      return sendError(
        res,
        `Exam with ID ${id} not found`,
        HTTP_STATUS.NOT_FOUND
      );
    }
    
    // Return success response with exam
    return sendSuccess(
      res,
      'Exam retrieved successfully',
      exams[0]
    );
  } catch (error) {
    console.error('Error retrieving exam:', error);
    return sendError(
      res,
      'Failed to retrieve exam',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Update exam by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateExamById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!id) {
      return sendError(
        res,
        'Exam ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Find the exam first to check if it exists and belongs to the user
    const exams = await db.fetchData(EXAMS_TABLE, { 
      id: `eq.${id}` 
    });
    
    if (!exams || exams.length === 0) {
      return sendError(
        res,
        `Exam with ID ${id} not found`,
        HTTP_STATUS.NOT_FOUND
      );
    }
    
    // Get the user_id from the authenticated user information
    const userId = req.userId;
    
    // Only allow update if the exam belongs to the current user or user is admin
    if (exams[0].user_id !== userId && !req.userRoles.includes('admin')) {
      return sendError(
        res,
        'You do not have permission to update this exam',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Create update data
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    // Update exam in database
    const updatedExam = await db.updateData(EXAMS_TABLE, updateData, { id });
    
    console.log(`Exam ${id} updated by user ${userId}`);
    
    // Return success response
    return sendSuccess(
      res,
      'Exam updated successfully',
      updatedExam,
      HTTP_STATUS.OK
    );
  } catch (error) {
    console.error('Error updating exam:', error);
    return sendError(
      res,
      'Failed to update exam',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Delete exam by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteExamById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendError(
        res,
        'Exam ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Find the exam first to check if it exists and belongs to the user
    const exams = await db.fetchData(EXAMS_TABLE, { 
      id: `eq.${id}` 
    });
    
    if (!exams || exams.length === 0) {
      return sendError(
        res,
        `Exam with ID ${id} not found`,
        HTTP_STATUS.NOT_FOUND
      );
    }
    
    // Get the user_id from the authenticated user information
    const userId = req.userId;
    
    // Only allow deletion if the exam belongs to the current user or user is admin
    if (exams[0].user_id !== userId && !req.userRoles.includes('admin')) {
      return sendError(
        res,
        'You do not have permission to delete this exam',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Delete exam from database
    await db.deleteData(EXAMS_TABLE, { id });
    
    console.log(`Exam ${id} deleted by user ${userId}`);
    
    // Return success response
    return sendSuccess(
      res,
      'Exam deleted successfully',
      { id },
      HTTP_STATUS.OK
    );
  } catch (error) {
    console.error('Error deleting exam:', error);
    return sendError(
      res,
      'Failed to delete exam',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get exams by user ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getExamsByUserId = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return sendError(
        res,
        'User ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Find exams with the given user ID
    const exams = await db.fetchData(EXAMS_TABLE, { 
      user_id: `eq.${userId}` 
    });
    
    // Return success response with exams
    return sendSuccess(
      res,
      'Exams retrieved successfully',
      {
        exams,
        count: exams.length
      }
    );
  } catch (error) {
    console.error('Error retrieving exams:', error);
    return sendError(
      res,
      'Failed to retrieve exams',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get exam with nested subjects and topics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getExamWithSubjectsAndTopics = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendError(res, 'Exam ID is required', HTTP_STATUS.BAD_REQUEST);
    }
    
    // Get exam first
    const exams = await db.fetchData(EXAMS_TABLE, { id: `eq.${id}` });
    if (!exams || exams.length === 0) {
      return sendError(res, `Exam with ID ${id} not found`, HTTP_STATUS.NOT_FOUND);
    }
    const exam = exams[0];
    
    // Get subjects for this exam
    const subjects = await db.fetchData('subjects', { exam_id: `eq.${id}` });
    
    // For each subject, get its topics
    const subjectsWithTopics = [];
    
    for (const subject of subjects) {
      const topics = await db.fetchData('topics', { subject_id: `eq.${subject.id}` });
      
      subjectsWithTopics.push({
        ...subject,
        topics: topics || []
      });
    }
    
    // Return response with exam and nested subjects/topics
    const result = {
      ...exam,
      subjects: subjectsWithTopics || []
    };
    
    return sendSuccess(
      res,
      'Exam with subjects and topics retrieved successfully',
      result
    );
  } catch (error) {
    console.error('Error retrieving exam with subjects and topics:', error);
    return sendError(
      res,
      'Failed to retrieve exam with subjects and topics',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

module.exports = {
  createExam,
  getAllExams,
  getExamById,
  updateExamById,
  deleteExamById,
  getExamsByUserId,
  getExamWithSubjectsAndTopics
};
