import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import {
  STATUS_CONFIRMED,
  STATUS_CANCELLED,
  STATUS_WAITING,
  STATUS_PAYMENT_PENDING
} from '../config/constants.js';

const UtsavBooking = sequelize.define(
  'UtsavBooking',
  {
    bookingid: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    utsavid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'utsav_db',
        key: 'id'
      }
    },
    packageid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'utsav_packages_db',
        key: 'id'
      }
    },
    cardno: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'card_db',
        key: 'cardno'
      }
    },
    status: {
      type: DataTypes.ENUM,
      allowNull: true,
      values: [STATUS_CONFIRMED, STATUS_CANCELLED, STATUS_PAYMENT_PENDING]
    },
    updatedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'USER'
    }
  },
  {
    tableName: 'utsav_booking',
    timestamps: true
  }
);

export default UtsavBooking;
