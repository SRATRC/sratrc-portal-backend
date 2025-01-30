import express from 'express';
const router = express.Router();
import {
  AvailabilityCalender,
  ViewAllBookings,
  CancelBooking,
} from '../../controllers/client/roomBooking.controller.js';
import CatchAsync from '../../utils/CatchAsync.js';
import { validateCard, CheckDatesBlocked } from '../../middleware/validate.js';

router.use(validateCard);

router.get('/availablity', CatchAsync(AvailabilityCalender));
router.post('/cancel', CatchAsync(CancelBooking));
router.get('/bookings', CatchAsync(ViewAllBookings));

export default router;
