const { AzureBlobService } = require("../../components/AzureBlobService")
const { getCurrentDateStr } = require("../util.queue")
const hostname = require("os").hostname();

module.exports = async (job, done) => {
    job.log(`[${getCurrentDateStr()}][PICKEDUP_BY]: ${hostname}`)

    const request = job.data.result
    const info = job.data.job
    const testInfo = job.data.job.data
    const azureService = new AzureBlobService()

    if (request.file === null) {
        job.log(`Result already uploaded. (${request.file}). Skipping ..`)
        job.progress(100)
        done(null, {
            blobName: request.requestBlobName,
            requestId: null,
            status: 200
        })

        return
    }

    job.data.processor = hostname

    const meta = {
        finalizedAt: testInfo.finalizedAt,
        jobId: info.id,
        finishedOn: `${info.finishedOn}`,
        processedOn: `${info.processedOn}`,
        attemptsMade: `${info.attemptsMade}`,
        processor: hostname
    }
    
    const uploadResponse = await azureService.upload(request.requestBlobName, request.file, meta)

    if (!uploadResponse) done(new Error('Something went wrong. During upload.'))

    done(null, {
        blobName: request.requestBlobName,
        requestId: uploadResponse.requestId,
        status: uploadResponse._response.status
    })
}