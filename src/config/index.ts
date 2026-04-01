import dotenv from "dotenv";
dotenv.config();

export default {
  port: process.env.PORT,
  mongodbUrl: process.env.MONGODB_URL,
  nodeEnv: process.env.NODE_ENV,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS,
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
  jwtRefreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,

  email: {
    emailAddress: process.env.EMAIL_ADDRESS,
    emailPass: process.env.EMAIL_PASSWORD,
    adminEmail: process.env.ADMIN_EMAIL,
  },
  reset: {
    reset_password_token_secret: process.env.RESET_PASSWORD_TOKEN_SECRET,
    reset_password_token_expires: process.env.RESET_EXPIRES_IN,
  },

  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },

  security: {
    AES_KEY: process.env.AES_KEY,
    AES_IV: process.env.AES_IV,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
  },
  cron: {
    checkInterval: process.env.CRON_CHECK_INTERVAL || '*/10 * * * * *', // Every 10 seconds
    orderExpiryMinutes: Number(process.env.ORDER_EXPIRY_MINUTES) || 20,
    maxOrderAgeHours: Number(process.env.MAX_ORDER_AGE_HOURS) || 24,
  }
};
