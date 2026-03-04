const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Base URL from environment variable
const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Growth ERP API Documentation',
    version: '1.0.0',
    description: 'Complete API documentation for Growth ERP system',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: baseUrl,
      description: 'API Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token obtained from login endpoint',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          status: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
          errorMessage: {
            type: 'string',
            example: 'Detailed error message',
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          status: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Success message',
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// Options for swagger-jsdoc
const path = require('path');
const options = {
  swaggerDefinition,
  apis: [
    path.join(__dirname, 'controllers', '*.js'), // Path to controller-specific documentation files
  ],
};

// Generate swagger spec
const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
