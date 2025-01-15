import express from 'express';
const router = express.Router();
import {
  verifyMobno,
  login,
  logout,
  updatePassword
} from '../../controllers/client/auth.controller.js';
import CatchAsync from '../../utils/CatchAsync.js';

router.get('/verify', CatchAsync(verifyMobno));
router.post('/login', CatchAsync(login));
router.get('/logout', CatchAsync(logout));
router.post('/updatePassword', CatchAsync(updatePassword));

export default router;
