import { config } from 'dotenv';
import { parseTestDatabaseUrl } from '../../../scripts/test-database.mjs';
config();
const url = parseTestDatabaseUrl(process.env.DATABASE_TEST_URL);
process.env.DATABASE_TEST_URL = url.href;
process.env.DATABASE_URL = url.href;
process.env.NODE_ENV = 'test';
process.env.THROTTLE_ENABLED = 'false';
