const { MyCureScraper } = require('../../components/MyCureScraper')
const { AzureBlobService } = require('../../components/AzureBlobService')
const { getCurrentDateStr } = require("../util.queue")
const hostname = require("os").hostname();

module.exports = async (job, done) => {
    return new Promise(async (resolve, reject) => {
        const azureStorage = new AzureBlobService()
        job.log(`[${getCurrentDateStr()}][PICKEDUP_BY]: ${hostname}`)
    
        const request = job.data

        job.data.processor = hostname

        await job.progress(5)

        const fileName = `${request.memberCode}_${request.testId}_${request.testPathId}.pdf`
        
        const isAlreadyScraped = await azureStorage.isBlobExists(fileName)

        if (isAlreadyScraped) {
            job.log(`Result already scraped. (${fileName}). Skipping ..`)
            job.progress(100)
            done(null, {
                requestBlobName: fileName,
                file: null
            })

            return
        }

        const scraper = new MyCureScraper(request, job, true)
        await scraper.startBrowser()
        await scraper.scrape(done)
            .then(res => resolve(res))
            .catch(err => reject(err))
    })
}