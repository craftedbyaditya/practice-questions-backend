/**
 * Routes for user enrollment in exams
 */

const express = require('express');
const router = express.Router();

const {
  enrollInExams,
  unenrollFromExams,
  getUserEnrollments,
  getAllEnrollments
} = require('../controllers/enrollment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { requireRoles } = require('../middleware/role.middleware');

// Define roles for different routes
const ENROLLMENT_ROLES = {
  ENROLL: ['user', 'student', 'teacher', 'admin'], // Any authenticated user can enroll
  VIEW_OWN_ENROLLMENTS: ['user', 'student', 'teacher', 'admin'], // Any authenticated user can view their enrollments
  VIEW_ALL_ENROLLMENTS: ['teacher', 'admin', 'org'] // Teachers, admins and org roles can view all enrollments
};

// Routes with role-based access control
router.post('/enrollToExams', authMiddleware, requireRoles(ENROLLMENT_ROLES.ENROLL), enrollInExams);
router.post('/unenrollFromExam', authMiddleware, requireRoles(ENROLLMENT_ROLES.ENROLL), unenrollFromExams);
router.get('/viewMyEnrollments', authMiddleware, requireRoles(ENROLLMENT_ROLES.VIEW_OWN_ENROLLMENTS), getUserEnrollments);
router.get('/viewAllEnrollments', authMiddleware, requireRoles(ENROLLMENT_ROLES.VIEW_ALL_ENROLLMENTS), getAllEnrollments);

module.exports = router;
