const fs = require('fs');
const { AzureBlobService } = require('./AzureBlobService');
/**
 * Storage Service
 * @param {boolean} useService whether to use local storage for storing data, otherwise 
 * it will use azure blob
 */
module.exports.StorageService = class StorageService {
    constructor () {
        this.blobStorage = new AzureBlobService()
    }

    save(blob, directory, filename, fileType = '.pdf') {
        try {
            
            const finalFileName = `${directory}/${filename}${fileType}`
            if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
            fs.writeFileSync(finalFileName, blob)

            return true
        } catch (e) {
            console.error("ERror", e)
            return false
        }
    }

    // async save(blobName, filePath) {
    //     return await this.blobStorage.upload(blobName, filePath, true)
    // }
}