module.exports.invalid = (req, res) => {
    res.status(404).json({
        status: 404,
        message: 'Request method or route is not found.'
    })
} 

module.exports.unauthorize = (err, req, res, next) => {
    if (err.name === 'AuthenticationError') {
        // Send a customized response for authentication failure
        return res.status(err.status).json({ 
            status: err.status,
            message: 'The provided JWT Header is invalid or Missing.'
        })
    }
}