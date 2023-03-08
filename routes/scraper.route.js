const { SourceApi } = require('../components/SourceApi')

const processResult = async (tests, memberCode, queue) => {
    for (const test of tests) {
        const populated = test['$populated'].verifiedBy
        const verifiedBy = (populated != undefined) ? `${populated.name.lastName}, ${populated.name.firstName} ${populated.name.middleName || ''} ${populated.name.academicSuffix || ''}` : ``
        const finalizedBy = (test['$populated'].finalizedBy != undefined) ? `${test['$populated'].finalizedBy.name.lastName}, ${test['$populated'].finalizedBy.name.firstName} ${test['$populated'].finalizedBy.name.middleName || ''} ${test['$populated'].finalizedBy.name.academicSuffix || ''}` : '' 
        /**
         * scrapingProcessor - is the name of the processor set upon registering the processor
         */
        const processorNameScraping = process.env.QUEUE_SCRAPER_PROCESSOR_NAME || 'scrapingProcessor'
        await queue.add(processorNameScraping, { 
            type: test.type, // laboratory, radiology
            memberCode: memberCode,
            testId: test.test,
            testPathId: test.id,
            testName: test.testName,
            verifiedBy: verifiedBy,
            finalizedAt: (test.finalizedAt || '').toString(),
            finalizedBy: finalizedBy
        }, JSON.parse(process.env.JOB_OPTS || '{}'))
    }
}

module.exports.scraper = (router, args) => {
    const { queue } = args

    /**
     * @swagger
     * /request:
     *   get:
     *     summary: Request
     *     tags:
     *       - app
     *     description: Resource for requesting pdf result from source.
     *     responses:
     *       202:
     *         description: Acknowledgedment response
     *         links:
     *           getFilesByMemberCode:
     *              operationId: getLinksByPatient
     *              parameters:
     *                  memberCode: '$request.body#/data.requestId'
     *              description: >
     *                 The `requestId` value returned in the response can be used as
     *                   the `memberCode` parameter in `GET /links`.
     *     parameters:
     *      - in: query
     *        name: memberCode
     *        type: String
     *        required: true
     *        description: Member Code of the patient
     *      - in: query
     *        name: requestType
     *        type: String
     *        required: true
     *        description: Type of Result
     *        schema:
     *          type: string
     *          enum:
     *              - laboratory
     *              - radiology
     */
    router.get('/request', async (req, res) => {
        try {
            const { requestType, memberCode } = req.query
            const type = requestType

            if (!memberCode) return res.status(500).json({
                message: 'Missing required parameters',
                status: 500
            })

            const api = new SourceApi()
            const tests = await (await (await api.getPatientDetails(memberCode)).getListOfTests(type)).getTests()

            // await is not called in here to call the queue.add asynchronously
            if (tests.length > 0) {
                processResult(tests, memberCode, queue)
            } else {
                return res.status(200).json({
                    status: 200,
                    message: 'No finalized tests.'
                })
            }

            return res.status(202).json({
                status: 202,
                message: `Your request is queued for processing.`,
                data: {
                    requestId: memberCode,
                    processed: tests.length,
                    tests: tests.map(t => ({ testName: t.testName, testId: t.test, testType: t.type, testCreated: t.createdAt }))
                }
            })
        } catch (e) {
            if (e.response) {
                return res.status(e.response.status).json({
                    status: e.response.status,
                    message: `${e.response.statusText} : ${e.request.host}\nPlease validate if the URL is accessible ${e.request.host}`, 
                    data: []
                })
            }

            return res.status(404).json({
                status: 404,
                message: e.message, 
                data: []
            })
        }
    })

    return router
}