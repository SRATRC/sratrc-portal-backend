import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UtsavDb = sequelize.define(
  'UtsavDb',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    max_guests: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM,
      allowNull: true,
      values: ['open', 'closed'],
      defaultValue: 'open'
    }
  },
  {
    tableName: 'utsav_db',
    timestamps: true
  }
);

export default UtsavDb;
