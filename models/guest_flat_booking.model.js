import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import {
  ROOM_STATUS_CHECKEDIN,
  ROOM_STATUS_CHECKEDOUT,
  ROOM_STATUS_PENDING_CHECKIN,
  STATUS_CANCELLED,
  STATUS_REJECTED,
  STATUS_WAITING
} from '../config/constants.js';

const GuestFlatBooking = sequelize.define(
  'GuestFlatBooking',
  {
    bookingid: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    cardno: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'card_db',
        key: 'cardno'
      }
    },
    guest: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'guest_db',
        key: 'id'
      }
    },
    flatno: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'flatdb',
        key: 'flatno'
      }
    },
    checkin: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    checkout: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    nights: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: [
        ROOM_STATUS_CHECKEDOUT,
        STATUS_CANCELLED,
        STATUS_WAITING,
        STATUS_REJECTED,
        ROOM_STATUS_CHECKEDIN,
        ROOM_STATUS_PENDING_CHECKIN
      ]
    },
    updatedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'USER'
    }
  },
  {
    tableName: 'guest_flat_booking',
    timestamps: true
  }
);

export default GuestFlatBooking;
