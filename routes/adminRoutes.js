const express = require('express');
const router  = express.Router();
const { getOverview, getStudents, getTeachers, createUser, toggleUser, deleteUser, getLogs, getStudentActivity, getTeacherActivity } = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.use(protect, requireRole('admin'));

router.get('/overview',          getOverview);
router.get('/students',          getStudents);
router.get('/teachers',          getTeachers);
router.post('/users',            createUser);
router.patch('/users/:id/toggle',toggleUser);
router.delete('/users/:id',      deleteUser);
router.get('/logs',              getLogs);
router.get('/activity/students', getStudentActivity);
router.get('/activity/teachers', getTeacherActivity);

module.exports = router;