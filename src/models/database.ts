import { Sequelize, Options } from 'sequelize';

// Database configuration
const dbOptions: Options = {
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'rahbar_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

export const sequelize = new Sequelize(dbOptions);

// Database class with connection management
class Database {
  private sequelize: Sequelize;

  constructor() {
    this.sequelize = sequelize;
  }

  public async connectWithRetry(retries: number): Promise<void> {
    try {
      await this.sequelize.authenticate();
      console.log('Database connection established successfully.');

      // Sync models
      await this.sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
      console.log('Database synchronized successfully.');
    } catch (err: any) {
      console.error('Unable to connect to the database:', err.message);
      if (retries > 0) {
        console.log(`Retrying connection... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.connectWithRetry(retries - 1);
      }
      process.exit(1);
    }
  }

  public async close(): Promise<void> {
    try {
      await this.sequelize.close();
      console.log('Database connection closed.');
    } catch (err: any) {
      console.error('Error closing database connection:', err.message);
      throw err;
    }
  }
}

export const database = new Database();
