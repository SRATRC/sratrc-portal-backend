import express from 'express';
const router = express.Router();
import {
  mumukshuBooking,
  validateBooking
} from '../../controllers/client/mumukshuBooking.controller.js'
import { validateCard, CheckDatesBlocked } from '../../middleware/validate.js';
import CatchAsync from '../../utils/CatchAsync.js';

router.use(validateCard);
router.post('/booking', CheckDatesBlocked, CatchAsync(mumukshuBooking));
router.post('/validate', CheckDatesBlocked, CatchAsync(validateBooking));

export default router;
