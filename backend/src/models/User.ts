import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class User extends Model {
  public id!: string;
  public email!: string;
  public trustScore!: number;
  public workingHoursStart!: string; // HH:mm
  public workingHoursEnd!: string;   // HH:mm
  public lastClaimAt!: Date | null;
  public activePlanId!: string;
  public location!: string;
}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    trustScore: {
      type: DataTypes.INTEGER,
      defaultValue: 100, // New users start with 100
    },
    workingHoursStart: {
      type: DataTypes.STRING,
      defaultValue: '08:00',
    },
    workingHoursEnd: {
      type: DataTypes.STRING,
      defaultValue: '22:00',
    },
    lastClaimAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    activePlanId: {
      type: DataTypes.STRING,
      defaultValue: 'basic-plan',
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
  }
);

export default User;
