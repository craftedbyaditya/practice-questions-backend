/**
 * Subject routes definition
 */
const express = require('express');
const router = express.Router();

const { 
  createSubject, 
  getAllSubjects, 
  getSubjectById, 
  updateSubjectById, 
  deleteSubjectById,
  getSubjectsByUserId,
  getSubjectsByExamId
} = require('../controllers/subject.controller');
const { requireRoles } = require('../middleware/role.middleware');

// Define roles for different routes - using the same role structure as exams
const SUBJECT_ROLES = {
  CREATE_SUBJECT: ['teacher', 'admin', 'org'], // Only these roles can create subjects
  VIEW_SUBJECTS: ['teacher', 'admin', 'org', 'student'], // All roles can view subjects
  MANAGE_SUBJECTS: ['teacher', 'admin', 'org'] // Only certain roles can update/delete subjects
};

// Routes with role-based access control and descriptive endpoint names
router.post('/createSubject', requireRoles(SUBJECT_ROLES.CREATE_SUBJECT), createSubject);
router.get('/getAllSubjects', requireRoles(SUBJECT_ROLES.VIEW_SUBJECTS), getAllSubjects);
router.get('/getSubjectsByUser', requireRoles(SUBJECT_ROLES.VIEW_SUBJECTS), getSubjectsByUserId);
router.get('/getSubjectsByExam/:examId', requireRoles(SUBJECT_ROLES.VIEW_SUBJECTS), getSubjectsByExamId);
router.get('/getSubject/:id', requireRoles(SUBJECT_ROLES.VIEW_SUBJECTS), getSubjectById);
router.put('/updateSubject/:id', requireRoles(SUBJECT_ROLES.MANAGE_SUBJECTS), updateSubjectById);
router.delete('/deleteSubject/:id', requireRoles(SUBJECT_ROLES.MANAGE_SUBJECTS), deleteSubjectById);

module.exports = router;
