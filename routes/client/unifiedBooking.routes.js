import express from 'express';
const router = express.Router();
import { unifiedBooking } from '../../controllers/client/unifiedBooking.controller.js';
import CatchAsync from '../../utils/CatchAsync.js';
import { validateCard, CheckDatesBlocked } from '../../middleware/validate.js';

router.use(validateCard);

router.post('/booking', CheckDatesBlocked, CatchAsync(unifiedBooking));

export default router;