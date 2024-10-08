import express from 'express';
const router = express.Router();
import {
  addData,
  getCountries,
  getStates,
  getCities
} from '../../controllers/client/location.controller.js';
import CatchAsync from '../../utils/CatchAsync.js';

router.post('/', CatchAsync(addData));
router.get('/countries', CatchAsync(getCountries));
router.get('/states/:country', CatchAsync(getStates));
router.get('/cities/:country/:state', CatchAsync(getCities));

export default router;
