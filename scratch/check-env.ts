import dotenv from 'dotenv';
dotenv.config();
console.log('PAYPAL_MODE:', process.env.PAYPAL_MODE);
console.log('PAYPAL_MODE (trimmed):', process.env.PAYPAL_MODE?.trim());
