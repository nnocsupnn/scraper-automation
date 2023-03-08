/**
 * 
 * Dynamically require all js files ffrom specified folder.
 */
module.exports.importer = (dirPath) => {
    const fs = require("fs")
    const path = require("path")

    let modules = {}

    fs.readdirSync(dirPath).forEach(file => {
        const filePath = path.join(dirPath, file)
        if (!file.includes("index")) modules = { ...modules, ...require(filePath) }
    })

    return modules
}