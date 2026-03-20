import { Sequelize, Options } from 'sequelize';

class Database {
  private static instance: Database;
  private sequelize: Sequelize;
  private db: string = process.env.DB_NAME || 'rahbar_db';
  private username: string = process.env.DB_USER || 'postgres';
  private password: string = process.env.DB_PASSWORD || '';
  private host: string = process.env.DB_HOST || 'localhost';
  private port: number = Number(process.env.DB_PORT) || 5432;
  /** Managed Postgres (e.g. Render) requires SSL; enable via DB_SSL=true or NODE_ENV=production */
  private shouldUseSsl: boolean =
    process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';
  private options: Options = {
    dialect: 'postgres',
    // logging: process.env.NODE_ENV === 'development' ? console.log : false,
    logging: false, // Set to console.log to debug SQL queries
    pool: {
      max: 10,
      min: 1,
      acquire: 30000,
      idle: 10000,
    },
    retry: {
      max: 3,
      match: [/Deadlock/i, /ConnectionError/i],
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
    },
  };

  private constructor() {
    console.log('db ---> ', this.db);
    console.log('port ---> ', this.port);

    const sslOptions = this.shouldUseSsl
      ? {
          require: true,
          rejectUnauthorized: false,
        }
      : undefined;

    const sequelizeOptions: Options = {
      ...this.options,
      ssl: this.shouldUseSsl ? true : undefined,
      dialectOptions: this.shouldUseSsl
        ? {
            ssl: sslOptions,
          }
        : undefined,
    };

    this.sequelize = new Sequelize(this.db, this.username, this.password, {
      host: this.host,
      port: this.port,
      ...sequelizeOptions,
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getSequelize(): Sequelize {
    return this.sequelize;
  }

  public getDbConfig() {
    return {
      username: this.username,
      password: this.password,
      database: this.db,
      host: this.host,
      port: this.port,
      ...this.options,
    };
  }

  public async connectWithRetry(retries: number): Promise<void> {
    try {
      await this.sequelize.authenticate();
      console.log('\nPG Connection has been established successfully.');
      console.log('node_env --->', process.env.NODE_ENV);

      // Import models to register them with Sequelize
      await import('./content/UserModel');
      await import('./content/PayamModel');
      await import('./content/QuranModel');
      // New Quran normalized models
      await import('./content/SurahModel');
      await import('./content/ParahModel');
      await import('./content/AyahModel');
      await import('./content/AyahTranslationModel');
      // Raahbar books
      await import('./content/RaahbarBookModel');
      // OTP model
      await import('./content/OtpModel');
      // Dua model
      await import('./content/DuaModel');
      // PDF Index model
      await import('./content/PdfIndexModel');

      // Note: alter: true disabled due to Sequelize bug with ENUM columns
      // Use migrations for schema changes instead
      await this.sequelize.sync().then(() => {
        console.log('Database synchronized! \n');
      });

      // Associations after syncing
      Object.values(this.sequelize.models).forEach((model: any) => {
        if (model && model.associate) {
          model.associate(this.sequelize.models);
        }
      });
    } catch (err) {
      console.error('Unable to connect to the database:', err);
      if (retries) {
        console.log(`Retrying connection. Retries left: ${retries}`);
        retries -= 1;
        setTimeout(() => this.connectWithRetry(retries), 2000);
      } else {
        console.error('Exceeded maximum connection retries. Exiting...');
        process.exit(1);
      }
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

// Export singleton instances
const database = Database.getInstance();
const sequelize = database.getSequelize();
const dbConfig = database.getDbConfig();

export { sequelize, database, dbConfig };

// Re-export models for convenience (lazy loaded)
export { default as PayamModel } from './content/PayamModel';
export { default as QuranModel } from './content/QuranModel';
export { default as UserModel } from './content/UserModel';
// New Quran normalized models
export { default as SurahModel } from './content/SurahModel';
export { default as ParahModel } from './content/ParahModel';
export { default as AyahModel } from './content/AyahModel';
export { default as AyahTranslationModel } from './content/AyahTranslationModel';
// Raahbar books
export { default as RaahbarBookModel } from './content/RaahbarBookModel';
// OTP model
export { default as OtpModel } from './content/OtpModel';
// Dua model
export { default as DuaModel } from './content/DuaModel';
// PDF Index model
export { default as PdfIndexModel } from './content/PdfIndexModel';
// Pillar of Islam model
export { default as PillarOfIslamModel } from './content/PillarOfIslamModel';

// Aliases for backward compatibility
import PayamModel from './content/PayamModel';
import QuranModel from './content/QuranModel';
import UserModel from './content/UserModel';
import SurahModel from './content/SurahModel';
import ParahModel from './content/ParahModel';
import AyahModel from './content/AyahModel';
import AyahTranslationModel from './content/AyahTranslationModel';
import RaahbarBookModel from './content/RaahbarBookModel';
import OtpModel from './content/OtpModel';
import DuaModel from './content/DuaModel';
import PillarOfIslamModel from './content/PillarOfIslamModel';
import PdfIndexModel from './content/PdfIndexModel';

export { PayamModel as Payam, QuranModel as Quran, UserModel as User };
export { SurahModel as Surah, ParahModel as Parah, AyahModel as Ayah, AyahTranslationModel as AyahTranslation };
export { RaahbarBookModel as RaahbarBook };
export { OtpModel as Otp };
export { DuaModel as Dua };
export { PillarOfIslamModel as PillarOfIslam };
export { PdfIndexModel as PdfIndex };

// Export types
export type { PayamAttributes, PayamCreationAttributes } from './content/PayamModel';
export type { QuranAttributes, QuranCreationAttributes } from './content/QuranModel';
export type { UserAttributes, UserCreationAttributes } from './content/UserModel';
export type { SurahAttributes, SurahCreationAttributes } from './content/SurahModel';
export type { ParahAttributes, ParahCreationAttributes } from './content/ParahModel';
export type { AyahAttributes, AyahCreationAttributes } from './content/AyahModel';
export type { AyahTranslationAttributes, AyahTranslationCreationAttributes, TranslationLanguage } from './content/AyahTranslationModel';
export type { RaahbarBookAttributes, RaahbarBookCreationAttributes } from './content/RaahbarBookModel';
export type { OtpAttributes, OtpCreationAttributes } from './content/OtpModel';
export type { DuaAttributes, DuaCreationAttributes } from './content/DuaModel';
export type { PillarOfIslamAttributes, PillarOfIslamCreationAttributes } from './content/PillarOfIslamModel';
export type { PdfIndexAttributes, PdfIndexCreationAttributes } from './content/PdfIndexModel';

// Model map for dynamic access
export const models = {
  PayamModel,
  QuranModel,
  UserModel,
  SurahModel,
  ParahModel,
  AyahModel,
  AyahTranslationModel,
  RaahbarBookModel,
  OtpModel,
  DuaModel,
  PillarOfIslamModel,
  PdfIndexModel,
  // Aliases
  Payam: PayamModel,
  Quran: QuranModel,
  User: UserModel,
  Surah: SurahModel,
  Parah: ParahModel,
  Ayah: AyahModel,
  AyahTranslation: AyahTranslationModel,
  RaahbarBook: RaahbarBookModel,
  Otp: OtpModel,
  Dua: DuaModel,
  PillarOfIslam: PillarOfIslamModel,
} as const;

export type ModelName = keyof typeof models;

