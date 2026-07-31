const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hospital Management System API',
      version: '1.0.0',
      description: 'Complete API documentation for Hospital Management System',
      contact: {
        name: 'API Support',
        email: 'support@hospitalms.com',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000/api',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
            phone: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Patient: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            patientId: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
            dateOfBirth: { type: 'string', format: 'date' },
            gender: { type: 'string' },
            bloodGroup: { type: 'string' },
            allergies: { type: 'array', items: { type: 'string' } },
            chronicConditions: { type: 'array', items: { type: 'string' } },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            patient: { $ref: '#/components/schemas/Patient' },
            doctor: { $ref: '#/components/schemas/Doctor' },
            date: { type: 'string', format: 'date' },
            time: { type: 'string' },
            type: { type: 'string' },
            status: { type: 'string' },
          },
        },
        Doctor: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
            specialization: { type: 'string' },
            department: { type: 'string' },
            qualifications: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = {
  swaggerUi,
  swaggerDocs,
};
