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
const { join } = require('path')
const { Queue } = require('./components/Queue')

const { jobLogs, eventsHandler } = require('./queue/util.queue')

const processorPathScrapeQueue = join(__dirname, 'queue', 'processors', 'scraper.queue.processor.js'), processorNameScraping = process.env.QUEUE_SCRAPER_PROCESSOR_NAME || 'scrapingProcessor'
const processorPathUploading = join(__dirname, 'queue', 'processors', 'uploader.queue.processor.js'), processorNameUploading = process.env.QUEUE_UPLOADER_PROCESSOR_NAME || 'uploadingProcessor'
const concurrency = parseInt(process.env.CONCURRENCY || 2)
const queueNameScraper = process.env.QUEUE_SCRAPER_QUEUE_NAME || 'ScrapingQueue'
const queueNameUploading = process.env.QUEUE_UPLOADER_QUEUE_NAME || 'UploadingQueue'

// SECRET KEY
process.env.SECRET_KEY = process.env.SECRET_KEY || 'PN1dbHle2QJy'

/**
 * 
 * Queue Config Block
 */

// Uploading Queue
const uploadingQueue = new Queue({
    queueName: queueNameUploading, 
    queueOption: JSON.parse(process.env.QUEUE_OPTS || '{}')
})

const uploadQueueInstance = uploadingQueue.registerProcess(processorNameUploading, concurrency, processorPathUploading)
    .registerEventHandler(eventsHandler)
    .getQueue()

// Scraping Queue
const queue = new Queue({
    queueName: queueNameScraper, 
    queueOption: JSON.parse(process.env.QUEUE_OPTS || '{}')
})

queue.registerProcess(processorNameScraping, concurrency, processorPathScrapeQueue)
    .registerEventHandler(eventsHandler)
    .registerQueueCompleteCallback(uploadQueueInstance, processorNameUploading, JSON.parse(process.env.JOB_OPTS || '{}'))