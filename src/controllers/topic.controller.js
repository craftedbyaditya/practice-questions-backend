/**
 * Controller for topic-related operations
 */
const db = require('../utils/db');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/response');

// Table name for topics in Supabase
const TOPICS_TABLE = 'topics';

/**
 * Create a new topic
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createTopic = async (req, res) => {
  try {
    const { name, description, subject_id } = req.body;
    
    // Validate required fields
    if (!name) {
      return sendError(
        res, 
        'Missing required field: name is required', 
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (!subject_id) {
      return sendError(
        res, 
        'Missing required field: subject_id is required', 
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Check if user has authorized role (admin, org, or teacher)
    const userRoles = req.userRoles || [];
    if (!userRoles.some(role => ['admin', 'org', 'teacher'].includes(role))) {
      return sendError(
        res,
        'Only admin, org, or teacher roles can create topics',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Get the user_id from the authenticated user information
    const user_id = req.userId;
    
    if (!user_id) {
      return sendError(
        res, 
        'User ID is required to create a topic', 
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Check if a topic with the same name already exists for this subject
    const existingTopics = await db.fetchData(TOPICS_TABLE, { 
      name: `eq.${name}`,
      subject_id: `eq.${subject_id}`
    });
    
    if (existingTopics && existingTopics.length > 0) {
      return sendError(
        res,
        `A topic with the name "${name}" already exists for this subject`,
        HTTP_STATUS.CONFLICT
      );
    }
    
    // Create topic object with provided fields
    const topicData = {
      name,
      description: description || null,
      user_id,
      subject_id
      // created_at and updated_at will be set automatically by database triggers
    };
    
    // Insert topic into database
    const topic = await db.insertData(TOPICS_TABLE, topicData);
    
    console.log(`Topic ${topic.id} created by user ${user_id} for subject ${subject_id}`);
    
    // Return success response
    return sendSuccess(
      res,
      'Topic created successfully',
      topic,
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    console.error('Error creating topic:', error);
    // Check for specific database error codes
    if (error.response && error.response.data && error.response.data.code === '23505') {
      // This is a duplicate key violation
      return sendError(
        res,
        'A topic with this name already exists for this subject',
        HTTP_STATUS.CONFLICT
      );
    }
    return sendError(
      res,
      'Failed to create topic',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get all topics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllTopics = async (req, res) => {
  try {
    // Get all active topics from the database
    const topics = await db.fetchData(TOPICS_TABLE, {
      is_deleted: 'eq.false',
      is_active: 'eq.true'
    });
    
    // Return success response with topics
    return sendSuccess(
      res,
      'Topics retrieved successfully',
      {
        topics,
        count: topics.length
      }
    );
  } catch (error) {
    console.error('Error retrieving topics:', error);
    return sendError(
      res,
      'Failed to retrieve topics',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get topics by subject ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTopicsBySubjectId = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    if (!subjectId) {
      return sendError(
        res,
        'Subject ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Find active topics with the given subject ID
    const topics = await db.fetchData(TOPICS_TABLE, { 
      subject_id: `eq.${subjectId}`,
      is_deleted: 'eq.false',
      is_active: 'eq.true'
    });
    
    // Return success response with topics
    return sendSuccess(
      res,
      'Topics retrieved successfully',
      {
        topics,
        count: topics.length
      }
    );
  } catch (error) {
    console.error('Error retrieving topics:', error);
    return sendError(
      res,
      'Failed to retrieve topics',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get topics by exam ID (requires joining topics with subjects)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTopicsByExamId = async (req, res) => {
  try {
    const { examId } = req.params;
    
    if (!examId) {
      return sendError(
        res,
        'Exam ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // First get all active subjects for this exam
    const subjects = await db.fetchData('subjects', { 
      exam_id: `eq.${examId}`,
      is_deleted: 'eq.false',
      is_active: 'eq.true'
    });
    
    if (!subjects || subjects.length === 0) {
      return sendSuccess(
        res,
        'No subjects found for this exam',
        {
          topics: [],
          count: 0
        }
      );
    }
    
    // Get subject IDs
    const subjectIds = subjects.map(subject => subject.id);
    
    // Get topics for these subjects - this is a bit of a workaround since
    // we can't do complex joins directly with the db utility functions
    let allTopics = [];
    
    for (const subjectId of subjectIds) {
      const topics = await db.fetchData(TOPICS_TABLE, { 
        subject_id: `eq.${subjectId}`,
        is_deleted: 'eq.false',
        is_active: 'eq.true' 
      });
      
      if (topics && topics.length > 0) {
        // Add subject details to each topic
        const topicsWithSubject = topics.map(topic => ({
          ...topic,
          subject: subjects.find(s => s.id === topic.subject_id)
        }));
        
        allTopics = [...allTopics, ...topicsWithSubject];
      }
    }
    
    // Return success response with topics
    return sendSuccess(
      res,
      'Topics retrieved successfully',
      {
        topics: allTopics,
        count: allTopics.length
      }
    );
  } catch (error) {
    console.error('Error retrieving topics by exam ID:', error);
    return sendError(
      res,
      'Failed to retrieve topics',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get topic by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTopicById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendError(
        res,
        'Topic ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Find the active topic with the given ID
    const topics = await db.fetchData(TOPICS_TABLE, { 
      id: `eq.${id}`,
      is_deleted: 'eq.false',
      is_active: 'eq.true'
    });
    
    if (!topics || topics.length === 0) {
      return sendError(
        res,
        `Topic with ID ${id} not found or has been deleted`,
        HTTP_STATUS.NOT_FOUND
      );
    }
    
    // Return success response with topic
    return sendSuccess(
      res,
      'Topic retrieved successfully',
      topics[0]
    );
  } catch (error) {
    console.error('Error retrieving topic:', error);
    return sendError(
      res,
      'Failed to retrieve topic',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Update topic by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateTopicById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, subject_id } = req.body;
    
    if (!id) {
      return sendError(
        res,
        'Topic ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Check if user has authorized role (admin, org, or teacher)
    const userRoles = req.userRoles || [];
    if (!userRoles.some(role => ['admin', 'org', 'teacher'].includes(role))) {
      return sendError(
        res,
        'Only admin, org, or teacher roles can update topics',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Find the topic first to check if it exists and belongs to the user
    const topics = await db.fetchData(TOPICS_TABLE, { 
      id: `eq.${id}` 
    });
    
    if (!topics || topics.length === 0) {
      return sendError(
        res,
        `Topic with ID ${id} not found`,
        HTTP_STATUS.NOT_FOUND
      );
    }
    
    // Get the user_id from the authenticated user information
    const userId = req.userId;
    
    // Check if user has authorized role (admin, org, or teacher)
    const hasAuthorizedRole = userRoles.some(role => ['admin', 'org', 'teacher'].includes(role));
    if (!hasAuthorizedRole || (topics[0].user_id !== userId && !userRoles.includes('admin'))) {
      return sendError(
        res,
        'Only admin, org, and teacher roles can update topics (non-admin users can only update their own topics)',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Create update data
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (subject_id) updateData.subject_id = subject_id;
    
    // Update topic in database
    const updatedTopic = await db.updateData(TOPICS_TABLE, updateData, { id });
    
    console.log(`Topic ${id} updated by user ${userId}`);
    
    // Return success response
    return sendSuccess(
      res,
      'Topic updated successfully',
      updatedTopic,
      HTTP_STATUS.OK
    );
  } catch (error) {
    console.error('Error updating topic:', error);
    return sendError(
      res,
      'Failed to update topic',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Soft delete topic by ID by setting is_deleted=true and is_active=false
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteTopicById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendError(
        res,
        'Topic ID is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Check if user has authorized role (admin, org, or teacher)
    const userRoles = req.userRoles || [];
    if (!userRoles.some(role => ['admin', 'org', 'teacher'].includes(role))) {
      return sendError(
        res,
        'Only admin, org, or teacher roles can delete topics',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Find the topic first to check if it exists and belongs to the user
    const topics = await db.fetchData(TOPICS_TABLE, { 
      id: `eq.${id}`,
      is_deleted: 'eq.false' // Only operate on non-deleted topics
    });
    
    if (!topics || topics.length === 0) {
      return sendError(
        res,
        `Topic with ID ${id} not found or already deleted`,
        HTTP_STATUS.NOT_FOUND
      );
    }
    
    // Get the user_id from the authenticated user information
    const userId = req.userId;
    
    // Check if user has authorized role (admin, org, or teacher)
    const hasAuthorizedRole = userRoles.some(role => ['admin', 'org', 'teacher'].includes(role));
    if (!hasAuthorizedRole || (topics[0].user_id !== userId && !userRoles.includes('admin'))) {
      return sendError(
        res,
        'Only admin, org, and teacher roles can delete topics (non-admin users can only delete their own topics)',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // Soft delete the topic by updating flags
    const updateData = {
      is_deleted: true,
      is_active: false
    };
    
    await db.updateData(TOPICS_TABLE, updateData, { id });
    
    console.log(`Topic ${id} soft deleted by user ${userId}`);
    
    // Return success response
    return sendSuccess(
      res,
      'Topic deleted successfully',
      { id },
      HTTP_STATUS.OK
    );
  } catch (error) {
    console.error('Error deleting topic:', error);
    return sendError(
      res,
      'Failed to delete topic',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Get topics by user ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTopicsByUserId = async (req, res) => {
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
    
    // Find active topics with the given user ID
    const topics = await db.fetchData(TOPICS_TABLE, { 
      user_id: `eq.${userId}`,
      is_deleted: 'eq.false',
      is_active: 'eq.true'
    });
    
    // Return success response with topics
    return sendSuccess(
      res,
      'Topics retrieved successfully',
      {
        topics,
        count: topics.length
      }
    );
  } catch (error) {
    console.error('Error retrieving topics:', error);
    return sendError(
      res,
      'Failed to retrieve topics',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

module.exports = {
  createTopic,
  getAllTopics,
  getTopicById,
  getTopicsBySubjectId,
  getTopicsByExamId,
  updateTopicById,
  deleteTopicById,
  getTopicsByUserId
};
