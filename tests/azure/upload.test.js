const { AzureBlobService } = require('../../components/AzureBlobService')
const fs = require('fs'), { join } = require('path'), { unlink } = require('fs').promises
const { expect } = require('chai')

/**
 * 
 * Azure Blob Tests
 * 
 * @author Nino Casupanan
 * @memberof Medicard
 */
describe('* Test Azure Blob Saving', () => {
    const configDir = __dirname + process.env.SCRAPER_PDF_FOLDER
    if (configDir == undefined) throw new Error("SCRAPER_PDF_FOLDER is not set in env variables."); 
    const dir = configDir
    const fileName = 'test.txt'

    describe('Create a test PDF file', () => {
        it('should be able to create the file', (done) => {
            try {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true })
                }
    
                fs.writeFileSync(
                    join(dir, fileName), 
                    `\n------------------------------------------------------------------\nThis is a test file. Executed in mocha. Dated ${new Date().toLocaleString()}\n------------------------------------------------------------------\n`
                )
                done()

            } catch (e) {
                done(e)
            }
        })
    })

    describe('Test upload to Azure Blob Storage', () => {
        it('should upload and respond status 201', async () => {
            const azStorage = new AzureBlobService()
            // disable log
            console.info = () => {}

            const res = await azStorage.upload(fileName, join(dir, fileName), {
                testExecuted: new Date().toLocaleDateString()
            })

            if (!res) console.error(res)

            expect(res._response.status, 'Expect response status code').equal(201)
        })
    })

    describe('Test if can generate blob SAS Link', () => {
        it('should return valid blob link', async () => {
            const azStorage = new AzureBlobService()
            // disable log
            console.info = () => {}
            const { url, expiresOn } = await azStorage.generateSasLink(undefined, fileName, 10)
            const regex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(:[0-9]+)?|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/
            expect(regex.test(url)).equal(true)
        })
    })


    describe('Delete the test blob', () => {
        it('should delete the blob', async () => {
            const azStorage = new AzureBlobService()
            const blobBlock = azStorage.getBlobBlockClient(fileName)
            const response = await blobBlock.delete()
            
            expect(response._response.status, 'Expect to recieved status 202').equal(202)
        })
    })


    describe('Delete the test file locally', () => {
        it(`should delete the file ${join(dir, fileName)}`, async () => {
            return unlink(join(dir, fileName))
        })
    })
})