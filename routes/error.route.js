module.exports.error = (req, res, next) => {
    res.status(404).json({
        status: 404,
        message: 'Invalid route definition. Please check the method and route path.'
    })
}