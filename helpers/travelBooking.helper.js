import {
  ERR_TRAVEL_ALREADY_BOOKED,
  STATUS_CONFIRMED,
  STATUS_WAITING
} from '../config/constants.js';
import { TravelDb } from '../models/associations.js';
import ApiError from '../utils/ApiError.js';
import { validateCards } from './card.helper.js';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

export async function checkTravelAlreadyBooked(date, ...mumukshus) {
  const booking = await TravelDb.findOne({
    where: {
      cardno: mumukshus,
      status: [STATUS_CONFIRMED, STATUS_WAITING],
      date: date
    }
  });

  if (booking) {
    throw new ApiError(400, ERR_TRAVEL_ALREADY_BOOKED);
  }
}

export async function bookTravelForMumukshus(date, mumukshuGroup, t, user) {
  const today = moment().format('YYYY-MM-DD');
  if (date <= today) {
    throw new ApiError(400, ERR_INVALID_DATE);
  }

  const mumukshus = mumukshuGroup.flatMap((group) => group.mumukshus);
  await validateCards(mumukshus);
  await checkTravelAlreadyBooked(date, mumukshus);

  var bookingsToCreate = [];
  for (const group of mumukshuGroup) {
    const { pickup_point, drop_point, luggage, comments, type, mumukshus } =
      group;

    for (const mumukshu of mumukshus) {
      bookingsToCreate.push({
        bookingid: uuidv4(),
        cardno: mumukshu,
        status: STATUS_WAITING,
        date,
        type,
        pickup_point,
        drop_point,
        luggage,
        comments,
        updatedBy: user.cardno
      });
    }
  }

  await TravelDb.bulkCreate(bookingsToCreate, { transaction: t });
  return t;
}
