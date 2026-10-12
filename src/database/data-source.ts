import 'dotenv/config';
import { DataSource } from 'typeorm';

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export default new DataSource({
  type: 'mysql',
  host: requiredEnvironmentVariable('DB_HOST'),
  port: Number(process.env.DB_PORT ?? 3306),
  username: requiredEnvironmentVariable('DB_USERNAME'),
  password: requiredEnvironmentVariable('DB_PASSWORD'),
  database: requiredEnvironmentVariable('DB_NAME'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
