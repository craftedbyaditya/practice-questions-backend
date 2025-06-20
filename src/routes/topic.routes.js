/**
 * Topic routes definition
 */
const express = require('express');
const router = express.Router();

const { 
  createTopic, 
  getAllTopics, 
  getTopicById, 
  updateTopicById, 
  deleteTopicById,
  getTopicsByUserId,
  getTopicsBySubjectId,
  getTopicsByExamId
} = require('../controllers/topic.controller');
const { requireRoles } = require('../middleware/role.middleware');

// Define roles for different routes - using the same role structure as exams/subjects
const TOPIC_ROLES = {
  CREATE_TOPIC: ['teacher', 'admin', 'org'], // Only these roles can create topics
  VIEW_TOPICS: ['teacher', 'admin', 'org', 'student'], // All roles can view topics
  MANAGE_TOPICS: ['teacher', 'admin', 'org'] // Only certain roles can update/delete topics
};

// Routes with role-based access control and descriptive endpoint names
router.post('/createTopic', requireRoles(TOPIC_ROLES.CREATE_TOPIC), createTopic);
router.get('/getAllTopics', requireRoles(TOPIC_ROLES.VIEW_TOPICS), getAllTopics);
router.get('/getTopicsByUser', requireRoles(TOPIC_ROLES.VIEW_TOPICS), getTopicsByUserId);
router.get('/getTopicsBySubject/:subjectId', requireRoles(TOPIC_ROLES.VIEW_TOPICS), getTopicsBySubjectId);
router.get('/getTopicsByExam/:examId', requireRoles(TOPIC_ROLES.VIEW_TOPICS), getTopicsByExamId);
router.get('/getTopic/:id', requireRoles(TOPIC_ROLES.VIEW_TOPICS), getTopicById);
router.put('/updateTopic/:id', requireRoles(TOPIC_ROLES.MANAGE_TOPICS), updateTopicById);
router.delete('/deleteTopic/:id', requireRoles(TOPIC_ROLES.MANAGE_TOPICS), deleteTopicById);

module.exports = router;
