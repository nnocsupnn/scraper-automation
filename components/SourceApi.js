
const { axiosMiddleWare } = require('../plugins')
const { UriBuilder } = require('../util')

/**
 * 
 * Implementation of MyCure API
 * 
 * @author Nino Casupanan
 */
module.exports.SourceApi = class SourceApi {
    constructor({ healthTest } = { healthTest: false }) {
        this.patient = undefined
        this.tests = []
        
        if (healthTest) this.testServer()
    }


    async testServer() {
        console.info(`[SourceApi] Initializing health test..`)
        const request = await axiosMiddleWare()
        return await request.get('/health', { timeout: 5000 })
    }

    
    /**
     * Get the patient details - Load the patient
     * @param {*} memberCode Medicard Member Code
     * @returns SourceApi
     */
    async getPatientDetails(memberCode) {
        const request = await axiosMiddleWare()
        let builder = new UriBuilder('/personal-details')
        let uri = builder.addQuery('insuranceCards.number', memberCode).getUri()
        let patient = await request.get(uri).then(res => res.data.data)

        if (patient.length == 0) {
            builder = new UriBuilder('/personal-details')
            uri = builder.addQuery('emergencyNo', memberCode).getUri()
            patient = await request.get(uri, { timeout: 5000 }).then(res => res.data.data)

            this.patient = patient.pop()
        }

        this.patient = patient.pop()
        return this
    }


    /**
     * Get the list of test
     * @param {*} type type of test in mycure there are two types - `radiology` and `laboratory`
     * @param {*} testId if want to select specific testId
     * @returns SourceApi
     */
    async getListOfTests (type = 'radiology', testId) {
        if (this.patient === undefined) throw Error('Patient not found.')

        const builder = new UriBuilder('/diagnostic-order-tests')
        builder.addQuery('patient', this.patient.id)
            .addQuery('finalizedAt[$exists]', '%23true')
            .addQuery('$populate[verifiedBy][service]', 'personal-details')
            .addQuery('$populate[verifiedBy][method]', 'findOne')
            .addQuery('$populate[verifiedBy][localKey]', 'verifiedBy')
            .addQuery('$populate[verifiedBy][foreignKey]', 'id')
            .addQuery('$populate[verifiedBy][$select][]', 'name')

        if (testId) {
            builder.addQuery('test', testId)
        }

        if (type !== undefined) {
            builder.addQuery('type', type)
        }

        let uri = builder.addQuery('$populate[finalizedBy][service]', 'personal-details')
            .addQuery('$populate[finalizedBy][method]', 'findOne')
            .addQuery('$populate[finalizedBy][localKey]', 'finalizedBy')
            .addQuery('$populate[finalizedBy][foreignKey]', 'id')
            .addQuery('$populate[finalizedBy][$select][]', 'name')
            .getUri()

        const request = await axiosMiddleWare()
        const listOfTests = await request.get(uri).then(res => res.data.data).catch(undefined)

        // filter test results only either with result or attachment
        this.tests = listOfTests.filter(test => {
            if (
                (Object.keys(test).includes('results') 
                && test.results.length > 0 )
                || (Object.keys(test).includes('attachmentURLs') 
                && test.attachmentURLs.length > 0)
            ) {
                return true
            } else {
                return false
            }
        })

        return this
    }


    /**
     * Get the loaded test. Returns empty if `getListOfTests` is not called
     * @returns Array
     */
    async getTests() {
        return this.tests
    }


    /**
     * Get the patient object
     * @returns Object
     */
    async getPatient() {
        return this.patient
    }


    async getTestDetails(testIds = []) {
        const builder = new UriBuilder('/diagnostic-tests')
        builder.addQuery('$select[]', 'name')
            .addQuery('$select[]', 'type')
            .addQuery('$select[]', 'section')
            .addQuery('$select[]', 'id')

        for (let test of testIds) {
            builder.addQuery('id[$in][]', test)
        }

        let uri = builder.getUri()

        const request = await axiosMiddleWare()
        return await request.get(uri).then(res => res.data.data).catch(undefined)
    }

    
    /**
     * Get all available testNames for the patient
     * @returns 
     */
    async getTestNames() {
        let tests = this.tests.map(test => test.testName)
        return [...new Set(tests)]
    }
}