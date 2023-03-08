const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const API_BASEURI = process.env.API_BASEURI || '/api'
const { appEnv } = require('./util')
const pjson = require('./p.json')

const host = 'http://20.6.1.213'
const options = {
    failOnErrors: true,
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MedGO Result Scraper - API',
            url: 'https://medicardphils.com',
            version: pjson.version,
            description: 'API for scraping results and generating pdf for medicard Go.',
            contact: {
                name: 'Medicard Support',
                email: 'itservicedesk1@medicardphils.com',
                url: 'https://medicardphils.com'
            },
            license: {
                name: 'Apache 2.0',
                url: 'http://www.apache.org/licenses/LICENSE-2.0.html'
            }
        },
        servers: [{ url: host + API_BASEURI, description: appEnv() }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./routes/*.js'],

};

const swaggerSpec = swaggerJSDoc(options);

module.exports = (app) => {
    app.use('/docs/spec.json', (req, res) => res.json(swaggerSpec))
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        swaggerOptions: {
            urls: [
                {
                    name: 'Spec',
                    url: 'spec.json'
                }
            ]
        }
    }));
    return app
};
