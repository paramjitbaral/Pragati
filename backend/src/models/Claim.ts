import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Claim extends Model {
  public id!: string;
  public userId!: string;
  public disruptionType!: string; // 'rain', 'wind', 'temp'
  public amount!: number;
  public status!: 'pending' | 'approved' | 'rejected' | 'flagged';
  public trustScore!: number;
  public gpsLat!: number;
  public gpsLong!: number;
  public ipLat!: number;
  public ipLong!: number;
  public weatherDataJson!: string; // Agreement between multiple sources
  public fraudNotes!: string;
  public proofUrl!: string;
}

Claim.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    disruptionType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
      defaultValue: 'pending',
    },
    trustScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    gpsLat: {
      type: DataTypes.FLOAT,
    },
    gpsLong: {
      type: DataTypes.FLOAT,
    },
    ipLat: {
      type: DataTypes.FLOAT,
    },
    ipLong: {
      type: DataTypes.FLOAT,
    },
    weatherDataJson: {
      type: DataTypes.TEXT, // Store verified weather JSON
    },
    fraudNotes: {
      type: DataTypes.TEXT,
    },
    proofUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Claim',
  }
);

export default Claim;
