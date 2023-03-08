const {
    BlobServiceClient,
    generateBlobSASQueryParameters,
    StorageSharedKeyCredential,
    ContainerSASPermissions,
    SASProtocol,
    BlobTier
} = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');
const { getPercentageOfCompletion, formatBytes } = require('../util')
const { unlink } = require('fs').promises

/**
 * 
 * ## Implementation of Azure Blob uploading
 * @package `@azure/storage-blob`
 * @author Nino Casupanan
 */
module.exports.AzureBlobService = class AzureBlobService {
    constructor() {
        this.accountKey = process.env.AZURE_BLOB_KEY
        this.accountName = process.env.AZURE_BLOB_NAME
        this.endpointSuffix = process.env.AZURE_BLOB_ENDPOINT
        this.containerName = process.env.AZURE_BLOB_CONTAINER

        this.connectionString = `DefaultEndpointsProtocol=https;AccountName=${this.accountName};AccountKey=${this.accountKey};EndpointSuffix=${this.endpointSuffix}`;

        this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString)
        this.sharedKeyCredential = new StorageSharedKeyCredential(this.accountName, this.accountKey)
        this.tempFolderName = process.env.AZURE_TEMP_FOLDER_NAME || 'temp'

        this.TIERS = {
            COOL: 'Cool',
            ARCHIVE: 'Archive',
            HOT: 'Hot'
        }
    }

    /**
     * ### Get the blob Client
     * @returns BlobServiceClient
     */
    getBlobServiceClient() {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString)
        return this.blobServiceClient
    }

    /**
     * ### Get container client
     * @returns 
     */
    getContainerClient() {
        return this.getBlobServiceClient().getContainerClient(this.containerName)
    }

    getBlobBlockClient(blobName) {
        return this.getContainerClient().getBlockBlobClient(blobName)
    }

    getBlobClient(blobName) {
        return this.getContainerClient().getBlobClient(blobName)
    }

    /**
     * ### Get and download the blob locally
     * @param {*} blobName blob name to download
     */
    async getAndDownload(blobName) {
        const fileNameClean = blobName.replace(/_/g, "/")
        const pathExplode = fileNameClean.split("/")

        pathExplode.pop()

        const dirPath = path.join(this.tempFolderName, pathExplode.join("/").concat("/"))
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })

        const finalFileName = path.join(this.tempFolderName, fileNameClean)
        const blobClient = this.getBlobBlockClient(blobName)
        await blobClient.downloadToFile(finalFileName)
    }

    /**
     * ### Generate SAS Link
     * @param {*} blobName set the blob name
     * @param {int} expirationInMinutes set the expiration time in minutes
     * @returns {string} SAS link of the blob name
     */
    async generateSasLink(blob, blobName, expirationInMinutes = 0) {
        const blobBlockClient = (blob === undefined || blob === null) ? this.getBlobBlockClient(blobName) : blob
        const expr_min = (expirationInMinutes > 0) ? expirationInMinutes : process.env.AZURE_BLOB_LINK_EXPRY || 30

        const expiresOn = new Date(), startsOn = new Date()
        expiresOn.setMinutes(expiresOn.getMinutes() + expr_min);
        startsOn.setMinutes(startsOn.getMinutes() - expr_min)

        const sasOptions = {
            containerName: this.containerName,
            blobName: blobName,
            protocol: SASProtocol.Https,
            startsOn: startsOn,
            expiresOn: expiresOn,
            permissions: ContainerSASPermissions.parse(process.env.AZURE_BLOB_PERMISION || "r") // Read permission only
        }

        const url = await blobBlockClient.generateSasUrl(sasOptions)

        return { url, expiresOn };
    }

    /**
     * ### Upload a file to blob storage
     * @param {*} blobName desire blob name
     * @param {*} filePath path of the file, must be full path.
     * @param {Boolean} returnSasLink wether to return the SAS Link or return the class
     * @param {Object} metadata pass a meta data for the uploaded blob
     * @returns {*} returns either the AzureBlobService or the SAS link depends on `returnSasLink` param
     */
    async upload(blobName, filePath, metadata = {}, accessTier = this.TIERS.COOL) {
        try {
            const dt = new Date()
            const fileSize = fs.statSync(filePath).size
            const dtstr = `${(dt.getMonth() + 1)}/${dt.getDate()}/${dt.getFullYear()} ${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`
            const uploadOpts = {
                metadata: { reviewer: 'system', reviewDate: dtstr, ...metadata, uploadDate: dtstr },
                tags: { project: 'mycure-scraper', owner: 'medicardphils' },
                onProgress: (prog) => {
                    console.info(`${getPercentageOfCompletion(prog.loadedBytes, fileSize)}% (${formatBytes(prog.loadedBytes)}) of ${formatBytes(fileSize)} uploaded. `)
                },
                tier: accessTier
            }

            const blockBlobClient = this.getBlobBlockClient(blobName)

            return await blockBlobClient.uploadFile(filePath, uploadOpts)
        } catch (e) {
            console.error(e.message)
            return false
        }
    }

    /**
     * ### Get blob details
     * @param {*} blobName blob name
     * @returns BlockBlobClient
     */
    getBlobDetails(blobName) {
        const blob = this.getBlobBlockClient(blobName)
        return blob
    }

    /**
     * ### Get list of blobs by passing prefix
     * @param {*} prefixStr 
     */
    async listBlobHierarchical(prefixStr) {
        const containerClient = this.getContainerClient()
        // page size - artificially low as example
        const maxPageSize = 2;
        const blobs = []

        // some options for filtering list
        const listOptions = {
            includeMetadata: true,
            includeSnapshots: false,
            includeTags: true,
            includeVersions: false,
            prefix: prefixStr
        };

        let delimiter = '/', i = 1;
        // console.log(`Folder ${delimiter}${prefixStr}`);

        for await (const response of containerClient.listBlobsByHierarchy(delimiter, listOptions).byPage({ maxPageSize })) {

            // console.log(`   Page ${i++}`);
            const segment = response.segment;

            if (segment.blobPrefixes) {

                // Do something with each virtual folder
                for await (const prefix of segment.blobPrefixes) {
                    // build new prefix from current virtual folder
                    await listBlobHierarchical(containerClient, prefix.name);
                }
            }

            for (const blob of response.segment.blobItems) {
                const blobRef = await this.getBlobDetails(blob.name)
                blobs.push(blobRef)
            }
        }

        return blobs
    }

    /**
     * Delete file name locally
     * @param {*} fileName 
     * @returns 
     */
    async delete(fileName) {
        return await unlink(fileName)
    }

    /**
     * Check if blob exists
     * @param {*} blobName 
     * @returns 
     */
    async isBlobExists(blobName) {
        return await this.getBlobBlockClient(blobName).exists()
    }
}