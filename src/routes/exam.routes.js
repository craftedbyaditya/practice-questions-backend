/**
 * Exam routes definition
 */
const express = require('express');
const router = express.Router();

const { 
  createExam, 
  getAllExams, 
  getExamById, 
  updateExamById, 
  deleteExamById,
  getExamsByUserId 
} = require('../controllers/exam.controller');
const { requireRoles } = require('../middleware/role.middleware');

// Define roles for different routes
const EXAM_ROLES = {
  CREATE_EXAM: ['teacher', 'admin', 'org'], // Only these roles can create exams
  VIEW_EXAMS: ['teacher', 'admin', 'org', 'student'], // All roles can view exams
  MANAGE_EXAMS: ['teacher', 'admin', 'org'] // Only certain roles can update/delete exams
};

// Routes with role-based access control and descriptive endpoint names
router.post('/createExam', requireRoles(EXAM_ROLES.CREATE_EXAM), createExam);
router.get('/getAllExams', requireRoles(EXAM_ROLES.VIEW_EXAMS), getAllExams);
router.get('/getExamsByUser', requireRoles(EXAM_ROLES.VIEW_EXAMS), getExamsByUserId);
router.get('/getExam/:id', requireRoles(EXAM_ROLES.VIEW_EXAMS), getExamById);
router.put('/updateExam/:id', requireRoles(EXAM_ROLES.MANAGE_EXAMS), updateExamById);
router.delete('/deleteExam/:id', requireRoles(EXAM_ROLES.MANAGE_EXAMS), deleteExamById);


module.exports = router;
