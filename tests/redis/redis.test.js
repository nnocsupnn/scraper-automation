const Redis = require('ioredis')
const { expect } = require('chai')
/**
 * 
 * Tests for redis configuration and connection
 * 
 * @author Nino Casupanan
 * @memberof Medicard
 */
describe('* Test Redis Connection', () => {
    it(`should be able to connect to Redis and set/get key`, async () => {
        const redisConfig = JSON.parse(process.env.QUEUE_OPTS || '{}').redis || { port: 6379, host: '127.0.0.1' }
        const redis = new Redis({ ...redisConfig })

        const keyVal = 'test'
        await redis.set(keyVal, keyVal)
        expect(await redis.get(keyVal), 'Expect to recieved the data from redis').equal(keyVal)
    })
})