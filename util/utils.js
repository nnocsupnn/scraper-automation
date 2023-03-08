const { execSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs')

module.exports.appEnv = () => {
    const env = process.env.NODE_ENV
    return env || 'staging'
}


module.exports.existOrCreateDir = (dir) => {
    try {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true })
        }

        return true
    } catch (e) {
        console.error(e.message)
        return false
    }
}


/**
 * Util for generating percentage
 * @param {*} current 
 * @param {*} total 
 * @returns 
 */
module.exports.getPercentageOfCompletion = (current, total) => {
    return parseFloat((parseFloat(current) / parseFloat(total)) * 100).toFixed(2)
}

/**
 * Util for logging upload
 * @param {*} bytes 
 * @param {*} decimals 
 * @returns 
 */
module.exports.formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * For replacing properties in an object
 * @param {*} obj 
 * @param {*} oldPropName the prop name to be replace
 * @param {*} newPropName the new prop name 
 */
module.exports.replaceProperties = (obj, oldPropName, newPropName) => {
    for (prop in obj) {
        if (prop === oldPropName) {
            const oldVal = obj[prop]
            delete obj[prop]
            obj[newPropName] = oldVal
        }
    }

    return obj
}