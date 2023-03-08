const { AzureBlobService } = require("../components/AzureBlobService")
const { SourceApi } = require("../components/SourceApi")
const { replaceProperties } = require('../util')

module.exports.app = (router, args) => {
    const sourceApi = new SourceApi()

    /**
     * @swagger
     * /links:
     *   get:
     *     summary: Blobs
     *     tags:
     *       - blob
     *     operationId: getLinksByPatient
     *     description: Resource for getting the blob links of the generated results from srouce.
     *     responses:
     *       200:
     *         description: List of links generated
     *     parameters:
     *      - in: query
     *        name: memberCode
     *        type: String
     *        required: true
     *        description: Member Code of the patient
     *      - in: query
     *        name: requestType
     *        required: false
     *        description: Type of result
     *        schema:
     *          type: string
     *          default: all
     *          enum:
     *              - laboratory
     *              - radiology
     */
    router.get('/links', async (req, res) => {
        try {
            const { memberCode, requestType } = req.query
            let type = requestType
            if (!type || type == '') type = 'laboratory'
            if (!memberCode) throw new Error("memberCode is not supplied.")
            const azureStorage = new AzureBlobService()
            const blobs = await azureStorage.listBlobHierarchical(memberCode)

            let links = {
                memberCode: '',
                testCount: 0,
                resultCount: blobs.length,
                tests: [],
            }


            const testIds = blobs.map(b => b.name.split('.')[0].split("_")[1])
            const testDetails = await sourceApi.getTestDetails(testIds)

            for (blob of blobs) {
                const [ code, testId, worklistId ] = blob.name.split(".")[0].split("_")
                links.memberCode = code

                const testDetail = testDetails.find(t => t.id === testId)
                
                let test = {
                    testId,
                    results: []
                }

                if (testDetail !== undefined) {
                    delete testDetail.isUsed
                    test = { ...testDetail, ...test }
                }

                for (blobx of blobs) {
                    const [ codex, testIdx, worklistIdx ] = blobx.name.split(".")[0].split("_")
                    if (!test.results.includes(blobx.name) && test.testId === testIdx) {
                        const properties = await blobx.getProperties()
                        const sasBlobLink = await azureStorage.generateSasLink(blobx)

                        replaceProperties(properties.metadata, 'jobid', 'queueJob')
                        replaceProperties(properties.metadata, 'testpathid', 'workListId')
                        replaceProperties(properties.metadata, 'processedon', 'processedOn')
                        replaceProperties(properties.metadata, 'reviewdate', 'systemReviewDate')
                        replaceProperties(properties.metadata, 'uploaddate', 'uploadDate')
                        replaceProperties(properties.metadata, 'attemptsmade', 'attemptsMade')
                        replaceProperties(properties.metadata, 'finalizedat', 'finalizedAt')
                        replaceProperties(properties.metadata, 'finishedon', 'finishedOn')

                        let blobFile = {
                            file: blobx.name,
                            ...properties.metadata,
                            url: sasBlobLink.url,
                            urlExpiration: sasBlobLink.expiresOn
                        }

                        test.results.push(blobFile)
                    }
                }

                const find = links.tests.find(t => t.testId == test.testId)
                if (!find) {
                    links.tests.push(test)
                    links.testCount++
                }
            }

            // apply filter
            if (type != 'all') links.tests = links.tests.filter(test => test.type == type)

            // Update the counts
            links.testCount = links.tests.length
            links.resultCount = links.tests.reduce((partialSum, n) => partialSum + n.results.length, 0)

            res.status(200).json(links)
        } catch (e) {
            console.error(e)
            res.status(500).json({
                status: 500,
                message: e.message
            })
        }
    })

    return router
}