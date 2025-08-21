import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IT Helpdesk Simulator API',
      version: '1.0.0',
      description: 'API documentation for the IT Helpdesk Simulator application',
      contact: {
        name: 'API Support',
        email: 'support@helpdesksimu.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.helpdesksimu.com',
        description: 'Production server',
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
          required: ['id', 'email', 'level', 'xp', 'isVerified'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the user',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            firstName: {
              type: 'string',
              nullable: true,
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              nullable: true,
              description: 'User last name',
            },
            level: {
              type: 'integer',
              minimum: 1,
              description: 'User level in the system',
            },
            xp: {
              type: 'integer',
              minimum: 0,
              description: 'User experience points',
            },
            timezone: {
              type: 'string',
              description: 'User timezone',
            },
            isVerified: {
              type: 'boolean',
              description: 'Whether the user email is verified',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Last login timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          required: ['message', 'statusCode'],
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
            },
            code: {
              type: 'string',
              description: 'Internal error code',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
        ValidationError: {
          type: 'object',
          required: ['message', 'statusCode', 'errors'],
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field name with validation error',
                  },
                  message: {
                    type: 'string',
                    description: 'Validation error message',
                  },
                },
              },
            },
          },
        },
        HealthCheck: {
          type: 'object',
          required: ['status', 'timestamp'],
          properties: {
            status: {
              type: 'string',
              enum: ['ok', 'error'],
              description: 'Health check status',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Health check timestamp',
            },
            version: {
              type: 'string',
              description: 'Application version',
            },
            uptime: {
              type: 'number',
              description: 'Application uptime in seconds',
            },
            database: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['connected', 'disconnected', 'error'],
                  description: 'Database connection status',
                },
                responseTime: {
                  type: 'number',
                  description: 'Database response time in milliseconds',
                },
              },
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
  },
  apis: ['./src/routes/*.ts', './src/middleware/*.ts', './src/controllers/*.ts'],
};

const specs = swaggerJSDoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #1f2937; }
    `,
    customSiteTitle: 'IT Helpdesk Simulator API Documentation',
  }));

  // JSON endpoint for the OpenAPI spec
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}

export { specs };