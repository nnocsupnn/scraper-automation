// This method for implementing custom headers
module.exports.headers = (req, res, next) => {
    res.set('Access-Control-Allow-Methods', 'GET,POST');
    next()
}