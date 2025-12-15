import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_BASE_URL = 'https://back.diabetesjalisco.org';

const sanitizeBaseUrl = (value = DEFAULT_BASE_URL) => {
  if (!value) return DEFAULT_BASE_URL;
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const rawBaseUrl = process.env.APP_URL || DEFAULT_BASE_URL;
export const BASE_URL = sanitizeBaseUrl(rawBaseUrl);

export const buildPublicUrl = (inputPath = '') => {
  if (!inputPath) return BASE_URL;
  return `${BASE_URL}${inputPath.startsWith('/') ? inputPath : `/${inputPath}`}`;
};
