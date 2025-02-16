import {
  CardDb,
  FoodDb,
  GuestFoodDb,
  GuestFoodTransactionDb,
  FoodPhysicalPlate,
  Menu
} from '../../models/associations.js';
import {
  BREAKFAST_PRICE,
  LUNCH_PRICE,
  DINNER_PRICE,
  TYPE_EXPENSE,
  MSG_CANCEL_SUCCESSFUL,
  ERR_BOOKING_NOT_FOUND,
  ERR_INVALID_MEAL_TIME,
  ERR_FOOD_ALREADY_BOOKED,
  ERR_ROOM_MUST_BE_BOOKED,
  MSG_BOOKING_SUCCESSFUL,
  MSG_FETCH_SUCCESSFUL
} from '../../config/constants.js';
import {
  checkFlatAlreadyBooked,
  checkSpecialAllowance,
  isFoodBooked,
  validateDate
} from '../helper.js';
import {
  checkRoomAlreadyBooked
} from '../../helpers/roomBooking.helper.js';
import getDates from '../../utils/getDates.js';
import database from '../../config/database.js';
import moment from 'moment';
import Sequelize from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import ApiError from '../../utils/ApiError.js';
import { userIsPR } from '../../helpers/card.helper.js';
import { bookFoodForMumukshus, createGroupFoodRequest } from '../../helpers/foodBooking.helper.js';

export const issuePlate = async (req, res) => {
  const currentTime = moment.utc();
  const mealTimes = {
    breakfast: moment.utc().hour(4).minute(30).second(0),
    lunch: moment.utc().hour(8).minute(30).second(0),
    dinner: moment.utc().hour(13).minute(30).second(0)
  };

  const booking = await FoodDb.findOne({
    where: {
      cardno: req.params.cardno,
      date: currentTime.format('YYYY-MM-DD')
    }
  });

  if (!booking) {
    throw new ApiError(404, ERR_BOOKING_NOT_FOUND);
  }

  // Determine current meal period
  let currentMeal = null;
  for (const meal of ['breakfast', 'lunch', 'dinner']) {
    if (currentTime.isSameOrBefore(mealTimes[meal])) {
      currentMeal = meal;
      break;
    }
  }

  if (!currentMeal) {
    throw new ApiError(400, ERR_INVALID_MEAL_TIME);
  }

  // Check if meal is booked
  if (!booking[currentMeal]) {
    throw new ApiError(400, `${currentMeal} not booked`);
  }

  // Check if plate is already issued
  const plateField = `${currentMeal}_plate_issued`;
  if (booking[plateField]) {
    throw new ApiError(400, `Plate for ${currentMeal} already issued`);
  }

  // Issue plate
  await booking.update(
    {
      [plateField]: true
    }
  );

  return res.status(200).send({ message: `Plate for ${currentMeal} issued successfully` });
};

export const physicalPlatesIssued = async (req, res) => {
  const { date, type, count } = req.body;

  const alreadyExists = await FoodPhysicalPlate.findOne({
    where: {
      date: date,
      type: type
    }
  });
  if (alreadyExists)
    throw new ApiError(
      400,
      `Physical plate count already exists for ${type} on ${date}`
    );

  await FoodPhysicalPlate.create({
    date: date,
    type: type,
    count: count,
    updatedBy: req.user.username
  });

  return res
    .status(200)
    .send({ message: 'Added plate count successfully' });
};

export const fetchPhysicalPlateIssued = async (req, res) => {
  const page = parseInt(req.query.page) || req.body.page || 1;
  const pageSize = parseInt(req.query.page_size) || req.body.page_size || 10;
  const offset = (page - 1) * pageSize;

  const data = await FoodPhysicalPlate.findAll({
    offset,
    limit: pageSize,
    order: [['date', 'ASC']]
  });

  return res
    .status(200)
    .send({ message: MSG_FETCH_SUCCESSFUL, data: data });
};

export const bookFoodForMumukshu = async (req, res) => {
  const { 
    cardno, 
    start_date, 
    end_date, 
    breakfast, 
    lunch,
    dinner,
    spicy,
    high_tea
   } = req.body;

   var t = await database.transaction();
   req.transaction = t;

  const mumukshuGroup = createGroupFoodRequest(
    cardno,
    breakfast,
    lunch,
    dinner, 
    spicy,
    high_tea
  );
  
  await bookFoodForMumukshus(
    start_date,
    end_date,
    mumukshuGroup,
    null,
    null,
    req.user.username,
    t
  );

  await t.commit();
  return res.status(200).send({ message: MSG_BOOKING_SUCCESSFUL });
};

export const cancelFoodByCard = async (req, res) => {
  const { food_data, cardno } = req.body;

  const t = await database.transaction();

  for (const item of food_data) {
    const booking = await FoodDb.findOne({
      where: {
        cardno: cardno,
        date: item.date
      }
    });
    if (booking) {
      booking.breakfast = item.breakfast;
      booking.lunch = item.lunch;
      booking.dinner = item.dinner;
      await booking.save({ transaction: t });
    }
  }

  await t.commit();
  return res
    .status(200)
    .send({ message: MSG_CANCEL_SUCCESSFUL });
};

export const cancelFoodByMob = async (req, res) => {
  const { food_data, mobno } = req.body;

  const card = await CardDb.findOne({
    where: { mobno }
  });

  if (!card) {
    throw new ApiError(404, 'No user found with given mobile number');
  }

  const t = await database.transaction();

  for (const item of food_data) {
    const booking = await FoodDb.findOne({
      where: {
        cardno: card.cardno,
        date: item.date
      }
    });

    if (booking) {
      booking.breakfast = item.breakfast;
      booking.lunch = item.lunch;
      booking.dinner = item.dinner;
      await booking.save({ transaction: t });
    }
  }

  await t.commit();
  return res
    .status(200)
    .send({ message: MSG_CANCEL_SUCCESSFUL });
};

export const bookFoodForGuest = async (req, res) => {
  const { 
    start_date, 
    end_date, 
    breakfast, 
    lunch, 
    dinner, 
    spicy, 
    hightea, 
    guests 
  } = req.body;

  const t = await database.transaction();
  req.transaction = t;

  validateDate(start_date, end_date);
  const allDates = getDates(start_date, end_date);
  
  const days = allDates.length;

  // TODO: get guest details
  // TODO: take phone number of the Mumukshu
  var food_data = [];
  const bookingid = uuidv4();
  for (const date of allDates) {
    for (const guestId of guests) {
      food_data.push({
        bookingid: bookingid,
        cardno: req.body.cardno,
        date: date,
        guest_count: guest_count,
        breakfast: req.body.breakfast,
        lunch: req.body.lunch,
        dinner: req.body.dinner,
        updatedBy: req.user.username
      });
    }
  }

  await GuestFoodDb.bulkCreate(food_data, { transaction: t });

  const food_cost =
    (breakfast ? BREAKFAST_PRICE : 0) +
    (lunch ? LUNCH_PRICE : 0) +
    (dinner ? DINNER_PRICE : 0);
  const amount = food_cost * guest_count * days;

  await GuestFoodTransactionDb.create(
    {
      cardno: req.body.cardno,
      bookingid: bookingid,
      type: TYPE_EXPENSE,
      amount: amount,
      description: `Food Booking for ${guest_count} guests`,
      updatedBy: req.user.username
    },
    { transaction: t }
  );

  await t.commit();

  return res.status(201).send({ message: MSG_BOOKING_SUCCESSFUL });
};

export const cancelFoodForGuest = async (req, res) => {
  const updateData = req.body.food_data;

  const t = await database.transaction();

  for (let i = 0; i < updateData.length; i++) {
    const isAvailable = await GuestFoodDb.findOne({
      where: {
        cardno: req.body.cardno,
        bookingid: req.body.food_data[i].bookingid,
        date: req.body.food_data[i].date
      }
    });
    if (!isAvailable) continue;

    await GuestFoodDb.update(
      {
        guest_count: updateData[i].guest_count,
        breakfast: updateData[i].breakfast,
        lunch: updateData[i].lunch,
        dinner: updateData[i].dinner,
        updatedBy: req.user.username
      },
      {
        where: {
          id: updateData[i].id
        },
        transaction: t
      }
    );
  }

  await GuestFoodDb.destroy({
    where: {
      breakfast: false,
      lunch: false,
      dinner: false
    },
    transaction: t
  });

  await t.commit();

  const revisedPayments = await GuestFoodDb.findAll({
    where: {
      bookingid: updateData[0].bookingid
    }
  });

  var total = 0;

  for (let data of revisedPayments) {
    total +=
      data.dataValues.guest_count *
      ((data.dataValues.breakfast ? BREAKFAST_PRICE : 0) +
        (data.dataValues.lunch ? LUNCH_PRICE : 0) +
        (data.dataValues.dinner ? DINNER_PRICE : 0));
  }

  const makeTransaction = await GuestFoodTransactionDb.update(
    {
      amount: total,
      updatedBy: req.user.username
    },
    {
      where: {
        bookingid: updateData[0].bookingid
      }
    }
  );

  if (makeTransaction != 1)
    throw new ApiError(500, 'Error occured while updating transaction');

  return res.status(200).send({ message: 'Successfully deleted' });
};

export const foodReport = async (req, res) => {
  const date = req.query.date;

  const report = await database.query(
    `SELECT
  date,
  SUM(CASE WHEN breakfast = 1 THEN 1 ELSE 0 END) AS breakfast,
  SUM(CASE WHEN lunch = 1 THEN 1 ELSE 0 END) AS lunch,
  SUM(CASE WHEN dinner = 1 THEN 1 ELSE 0 END) as dinner,
  SUM(CASE WHEN breakfast_plate_issued = 1 THEN 1 ELSE 0 END) as breakfast_plate_issued,
  SUM(CASE WHEN lunch_plate_issued = 1 THEN 1 ELSE 0 END) AS lunch_plate_issued,
  SUM(CASE WHEN dinner_plate_issued = 1 THEN 1 ELSE 0 END) AS dinner_plate_issued,
  SUM(CASE WHEN breakfast_plate_issued = 0 THEN 1 ELSE 0 END) AS breakfast_noshow,
  SUM(CASE WHEN lunch_plate_issued = 0 THEN 1 ELSE 0 END) AS lunch_noshow,
  SUM(CASE WHEN dinner_plate_issued = 0 THEN 1 ELSE 0 END) AS dinner_noshow,
  SUM(CASE WHEN hightea = 'TEA' THEN 1 ELSE 0 END) AS tea,
  SUM(CASE WHEN hightea = 'COFFEE' THEN 1 ELSE 0 END) AS coffee
FROM
  food_db
WHERE
  date = :date
GROUP BY
  date;`,
    {
      replacements: { date: date },
      type: Sequelize.QueryTypes.SELECT
    }
  );

  const physical_plates = await FoodPhysicalPlate.findAll({
    attributes: ['date', 'type', 'count'],
    where: { date }
  });
  
  const data = {
    report: report[0],
    physical_plates
  };

  return res.status(200).send({ data: data });
};

export const foodReportDetails = async (req, res) => {
  const { meal, is_issued, date } = req.query;
  const page = parseInt(req.query.page) || req.body.page || 1;
  const pageSize = parseInt(req.query.page_size) || req.body.page_size || 10;
  const offset = (page - 1) * pageSize;

  const data = await database.query(
    `SELECT food_db.date, card_db.mobno, card_db.issuedto
    FROM food_db 
    join card_db 
    on food_db.cardno = card_db.cardno
    WHERE date='${date}' AND ${meal}_plate_issued=${is_issued} LIMIT ${offset}, ${pageSize} ;`,
    {
      type: Sequelize.QueryTypes.SELECT
    }
  );

  return res.status(200).send({ data: data });
};

export const fetchMenu = async (req, res) => {
  const menu = await Menu.findAll({
    where: {
      date: {
        [Sequelize.Op.gte]: moment().format('YYYY-MM-DD')
      }
    }
  });

  return res.status(200).send({ data: menu });
};

export const addMenu = async (req, res) => {
  const { date, breakfast, lunch, dinner } = req.body;

  const menu = await Menu.findOne({
    where: { date }
  });

  if (menu) {
    throw new ApiError(400, 'Menu already exists for given date');
  }

  await Menu.create({
    date,
    breakfast,
    lunch,
    dinner,
    updatedBy: req.user.username
  });

  return res.status(200).send({ message: 'Menu added' });
};

export const updateMenu = async (req, res) => {
  const { old_date, date, breakfast, lunch, dinner } = req.body;

  const menu = await Menu.findOne({
    where: { date: old_date }
  });

  if (!menu) {
    throw new ApiError(404, 'Menu not found');
  }

  await menu.update(
    {
      date,
      breakfast,
      lunch,
      dinner,
      updatedBy: req.user.username
    }
  );

  return res.status(200).send({ message: 'Menu updated' });
};

export const deleteMenu = async (req, res) => {
  const { date } = req.query;

  const item = await Menu.destroy({
    where: {
      date: date
    }
  });

  if (item == 0) throw new ApiError(404, 'Menu not found');

  return res.status(200).send({ message: 'Menu deleted' });
};
