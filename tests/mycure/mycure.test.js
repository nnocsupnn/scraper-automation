const { SourceApi } = require('../../components/SourceApi')
const { expect } = require('chai')

/**
 * 
 * MyCure API tests 
 * 
 * @author Nino Casupanan
 * @memberof Medicard
 */
describe('* Test MyCure API', () => {
    const memberCode = "RXER22891"
    describe('should be able to get the patient details', () => {
        it(`should match the data of ${memberCode}`, async () => {
            const api = new SourceApi()
            const res = await api.getPatientDetails(memberCode)
            expect(typeof res).to.equal('object')
            expect(res.patient.insuranceCards.length).greaterThan(0)
            expect(res.patient.insuranceCards[0].number, 'Expect to recieved the data from API').equal(memberCode)
        })
    })
})