import express from 'express';
const router = express.Router();
import {
  CancelFood,
  FetchFoodBookings,
  FetchGuestsForFilter,
  fetchMenu
} from '../../controllers/client/foodBooking.controller.js';
import { validateCard } from '../../middleware/validate.js';
import CatchAsync from '../../utils/CatchAsync.js';

router.use(validateCard);

router.patch('/cancel', CatchAsync(CancelFood));
router.get('/get', CatchAsync(FetchFoodBookings));
router.get('/getGuestsForFilter', CatchAsync(FetchGuestsForFilter));
router.get('/menu', CatchAsync(fetchMenu));
export default router;
