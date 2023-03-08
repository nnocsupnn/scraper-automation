/**
 * 
 * This file is to order the sequence of the tests
 * 
 * For every test created, should be added on this file to execute.
 * 
 * @author Nino Casupanan
 * @memberof Medicard
 * 
 * Date: Jan 6, 2023
 */
const { appEnv } = require('../util')
require('custom-env').env(appEnv())
// Tests
// require('./redis/redis.test')
require('./source/source.test')
require('./azure/upload.test')