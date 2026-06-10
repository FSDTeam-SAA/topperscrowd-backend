import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Toppers Crowd API',
    description: 'Complete API Documentation for Toppers Crowd — Kathorian Publishing LLC',
    version: '1.0.0',
    contact: {
      name: 'Kathorian Publishing LLC',
      url: 'https://kathorianpublishingllc.com',
    },
  },
  servers: [
    { url: 'http://localhost:5000', description: 'Development' },
    { url: 'https://api.kathorianpublishingllc.com', description: 'Production' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication & session management' },
    { name: 'Users', description: 'User registration & profile management' },
    { name: 'Books', description: 'Audiobook CRUD operations' },
    { name: 'Book Categories', description: 'Book category management' },
    { name: 'Cart', description: 'Shopping cart operations' },
    { name: 'Orders', description: 'Checkout, payment & order history' },
    { name: 'Coupons', description: 'Discount coupon management' },
    { name: 'Reviews', description: 'Book review operations' },
    { name: 'Chatroom', description: 'Live chatroom messaging' },
    { name: 'Library', description: 'User library & listening stats' },
    { name: 'Listener Progress', description: 'Audiobook playback progress tracking' },
    { name: 'Favorites', description: 'User favorite books' },
    { name: 'Admin Dashboard', description: 'Admin analytics & management' },
    { name: 'Ebooks', description: 'E-book management & downloads' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
    },
  },
};

const outputFile = '../swagger_output.json';
const endpointsFiles = ['./app.ts'];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc);
