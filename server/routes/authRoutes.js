const express = require('express');
const { check } = require('express-validator');
const { registerUser, loginUser, getMe, getAgents } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('role', 'Role must be Manager or Agent').optional().isIn(['Manager', 'Agent']),
  ],
  validate,
  registerUser
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  validate,
  loginUser
);

router.get('/me', protect, getMe);
router.get('/agents', protect, getAgents);

module.exports = router;
