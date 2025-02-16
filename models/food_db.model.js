import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FoodDb = sequelize.define(
  'FoodDb',
  {
    id: {
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    guest: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'guest_db',
        key: 'id'
      }
    },
    breakfast: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    breakfast_plate_issued: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    lunch: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    lunch_plate_issued: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    dinner: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    dinner_plate_issued: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    hightea: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: ['TEA', 'COFFEE', 'NONE'],
      defaultValue: 'NONE'
    },
    spicy: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    updatedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'USER'
    }
  },
  {
    tableName: 'food_db',
    timestamps: true
  }
);

export default FoodDb;
