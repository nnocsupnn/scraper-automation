/**
 * 
 * Scraper for Result
 * 
 * @author Nino Casupanan
 * @memberof Medicardphils
 * 
 */
const { appEnv } = require('./util')
// Load application env based on git branch
require('custom-env').env(appEnv())
const { ExpressApi } = require("expressjs-app")
const { Queue } = require('./components/Queue')
const swaggerDoc = require('./swagger')
const jwtStrategy = require('./passport-strategies/jwt')


const { scraper, auth, app } = require('./routes')
const { jobLogs } = require('./queue/util.queue')
const { unauthorize, headers, invalid } = require('./middlewares')

const baseUri = process.env.API_BASEURI || '/v1/api'

// SECRET KEY
process.env.SECRET_KEY = process.env.SECRET_KEY || 'PN1dbHle2QJy'
const queueNameScraper = process.env.QUEUE_SCRAPER_QUEUE_NAME || 'ScrapingQueue'
const queueNameUploading = process.env.QUEUE_UPLOADER_QUEUE_NAME || 'UploadingQueue'

/**
 * 
 * Queue Config Block
 */

// Scraping Queue
const queue = new Queue({
    queueName: queueNameScraper, 
    queueOption: JSON.parse(process.env.QUEUE_OPTS || '{}')
}).getQueue()

/**
 * 
 * API Config Block
 */
const apiInstance = new ExpressApi({ enableCors: true, lastRouteHandler: invalid, docsModule: swaggerDoc, jwtStrategy })
apiInstance.registerRoutes(
        {
            method: scraper, args: { queue: queue }, name: 'scraper'
        }, 
        {
            method: app, args: undefined, name: 'app'
        }
    )
    .registerAuthenticationRoute(baseUri, auth, `${baseUri}*`)
    .registerMiddlewares(headers, unauthorize)
    // Start the API/App
    .start(async () => {
        const option = JSON.parse(process.env.QUEUE_OPTS || '{}')
        const jobOpt = JSON.parse(process.env.JOB_OPTS || '{}')
        console.info(`Redis Configuration: ${JSON.stringify(option.redis, null, 4)}`)
        console.info(`Queue Configuration: ${JSON.stringify(jobOpt, null, 4)}`)
    })