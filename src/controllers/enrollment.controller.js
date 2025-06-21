/**
 * Controller for managing user enrollments in exams
 */

const db = require('../utils/db');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/response');

// Table names
const ENROLLMENTS_TABLE = 'enrollments';
const EXAMS_TABLE = 'exams';

/**
 * Enroll a user in one or more exams
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const enrollInExams = async (req, res) => {
  try {
    // Get the user ID from request (set by auth middleware)
    const userId = req.userId;
    
    if (!userId || userId === 'anonymous') {
      return sendError(
        res,
        'Authentication required to enroll in exams',
        HTTP_STATUS.UNAUTHORIZED
      );
    }
    
    const { examIds } = req.body;
    
    if (!examIds || !Array.isArray(examIds) || examIds.length === 0) {
      return sendError(
        res,
        'Please provide an array of exam IDs to enroll in',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Validate that all exams exist
    for (const examId of examIds) {
      const exams = await db.fetchData(EXAMS_TABLE, { id: `eq.${examId}` });
      if (!exams || exams.length === 0) {
        return sendError(
          res,
          `Exam with ID ${examId} not found`,
          HTTP_STATUS.NOT_FOUND
        );
      }
    }
    
    // Check if the user already has enrollment
    const existingEnrollments = await db.fetchData(ENROLLMENTS_TABLE, { user_id: `eq.${userId}` });
    
    let result;
    
    if (existingEnrollments && existingEnrollments.length > 0) {
      // User already has enrollments, update them
      const existingExamIds = existingEnrollments[0].exam_ids || [];
      
      // Combine existing and new exam IDs, removing duplicates
      const uniqueExamIds = [...new Set([...existingExamIds, ...examIds])];
      
      // Update the enrollment
      result = await db.updateData(
        ENROLLMENTS_TABLE, 
        { exam_ids: uniqueExamIds }, 
        { user_id: userId }
      );
    } else {
      // Create a new enrollment
      result = await db.insertData(ENROLLMENTS_TABLE, {
        user_id: userId,
        exam_ids: examIds
      });
    }
    
    return sendSuccess(
      res,
      'Successfully enrolled in exams',
      result,
      HTTP_STATUS.OK
    );
  } catch (error) {
    console.error('Error enrolling in exams:', error);
    return sendError(
      res,
      'Failed to enroll in exams',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Remove enrollment from one or more exams
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const unenrollFromExams = async (req, res) => {
  try {
    // Get the user ID from request (set by auth middleware)
    const userId = req.userId;
    
    if (!userId || userId === 'anonymous') {
      return sendError(
        res,
        'Authentication required to manage enrollments',
        HTTP_STATUS.UNAUTHORIZED
      );
    }
    
    const { examIds } = req.body;
    
    if (!examIds || !Array.isArray(examIds) || examIds.length === 0) {
      return sendError(
        res,
        'Please provide an array of exam IDs to unenroll from',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Check if the user has any enrollments
    const existingEnrollments = await db.fetchData(ENROLLMENTS_TABLE, { user_id: `eq.${userId}` });
    
    if (!existingEnrollments || existingEnrollments.length === 0) {
      return sendError(
        res,
        'No enrollments found for this user',
        HTTP_STATUS.NOT_FOUND
      );
    }
    
    // Filter out the exam IDs to unenroll from
    const currentExamIds = existingEnrollments[0].exam_ids || [];
    const updatedExamIds = currentExamIds.filter(id => !examIds.includes(id));
    
    // Update the enrollment
    const result = await db.updateData(
      ENROLLMENTS_TABLE,
      { exam_ids: updatedExamIds },
      { user_id: userId }
    );
    
    return sendSuccess(
      res,
      'Successfully unenrolled from exams',
      result,
      HTTP_STATUS.OK
    );
  } catch (error) {
    console.error('Error unenrolling from exams:', error);
    return sendError(
      res,
      'Failed to unenroll from exams',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get a user's enrollments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserEnrollments = async (req, res) => {
  try {
    // Get the user ID from request (set by auth middleware)
    const userId = req.userId;
    const requestedUserId = req.query.userId || userId;
    
    // If not the same user and not admin/teacher, then unauthorized
    if (userId !== requestedUserId && 
        !req.userRoles.some(role => ['admin', 'teacher'].includes(role))) {
      return sendError(
        res,
        'You are not authorized to view enrollments for other users',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Fetch enrollments
    const enrollments = await db.fetchData(ENROLLMENTS_TABLE, { user_id: `eq.${requestedUserId}` });
    
    if (!enrollments || enrollments.length === 0) {
      return sendSuccess(
        res,
        'No enrollments found for this user',
        { userId: requestedUserId, enrollments: [] }
      );
    }
    
    // Get detailed exam information for each enrolled exam
    const enrolledExamIds = enrollments[0].exam_ids || [];
    const enrolledExams = [];
    
    if (enrolledExamIds.length > 0) {
      for (const examId of enrolledExamIds) {
        const exams = await db.fetchData(EXAMS_TABLE, { id: `eq.${examId}` });
        if (exams && exams.length > 0) {
          enrolledExams.push(exams[0]);
        }
      }
    }
    
    return sendSuccess(
      res,
      'Successfully retrieved enrollments',
      {
        userId: requestedUserId,
        enrollments: enrolledExams,
        count: enrolledExams.length
      }
    );
  } catch (error) {
    console.error('Error retrieving enrollments:', error);
    return sendError(
      res,
      'Failed to retrieve enrollments',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get all enrollments (for admin, teacher, org roles)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllEnrollments = async (req, res) => {
  try {
    // Get user roles from request (set by auth middleware)
    const userRoles = req.userRoles || [];
    
    // Check if user has authorized role (not student)
    if (userRoles.includes('student') && 
        !userRoles.some(role => ['admin', 'teacher', 'org'].includes(role))) {
      return sendError(
        res,
        'Students cannot view all enrollments',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Fetch all enrollments
    const enrollments = await db.fetchData(ENROLLMENTS_TABLE);
    
    if (!enrollments || enrollments.length === 0) {
      return sendSuccess(
        res,
        'No enrollments found',
        { enrollments: [], count: 0 }
      );
    }
    
    // Get detailed user and exam information for each enrollment
    const detailedEnrollments = await Promise.all(enrollments.map(async enrollment => {
      // Get user information
      const users = await db.fetchData('users', { user_id: `eq.${enrollment.user_id}` });
      const user = users && users.length > 0 ? users[0] : { user_id: enrollment.user_id };
      
      // Get exam details for each enrolled exam
      const examIds = enrollment.exam_ids || [];
      const enrolledExams = [];
      
      if (examIds.length > 0) {
        for (const examId of examIds) {
          const exams = await db.fetchData(EXAMS_TABLE, { id: `eq.${examId}` });
          if (exams && exams.length > 0) {
            enrolledExams.push(exams[0]);
          }
        }
      }
      
      return {
        ...enrollment,
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        exams: enrolledExams,
        exam_count: enrolledExams.length
      };
    }));
    
    return sendSuccess(
      res,
      'Successfully retrieved all enrollments',
      {
        enrollments: detailedEnrollments,
        count: detailedEnrollments.length
      }
    );
  } catch (error) {
    console.error('Error retrieving all enrollments:', error);
    return sendError(
      res,
      'Failed to retrieve enrollments',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

module.exports = {
  enrollInExams,
  unenrollFromExams,
  getUserEnrollments,
  getAllEnrollments
};
