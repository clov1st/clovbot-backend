const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Clovbot Backend API',
      version: '1.0.0',
      description: 'API documentation for Clovbot backend (WhatsApp Bot Builder & Hosting)',
    },
    servers: [
      { url: 'http://localhost:3000/api' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js'], // Path ke file route kamu
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
