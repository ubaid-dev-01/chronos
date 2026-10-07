// Shared test environment defaults so unit/integration tests don't depend on
// a real `.env` file or external services being configured.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-jwt-access-secret-32-characters-min';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://localhost:3000';
process.env.API_KEY_PEPPER = process.env.API_KEY_PEPPER || 'test-api-key-pepper';
