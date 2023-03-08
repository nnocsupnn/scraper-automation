const jwt = require('jsonwebtoken');
const { decode } = require('jwt-check-expiry')

const verifyUser = (username, password) => {
    // This data should be from a database
    // TODO: Database configuration
    const user = (username == process.env.ADMIN_USER) ? {
        id: username,
        username,
        password: process.env.ADMIN_PASSWORD || 'pass123!',
        verifyPassword: function(pw) {
            return this.password == pw
        }
    } : undefined

    return (user != undefined && user.verifyPassword(password)) ? user : undefined
}

/**
 * @swagger
 * /authenticate:
 *   post:
 *     summary: Authentication
 *     tags:
 *      - app
 *     description: Resource for authorization
 *     responses:
 *       201:
 *         description: Generated token response
 *     requestBody:
 *         description: Credential
 *         required: true
 *         content:
 *           application/json:
 *              schema:
 *                  type: object
 *                  properties: 
 *                      username: 
 *                          type: string
 *                      password:
 *                          type: string
 *              required:
 *                  - username
 *                  - password
 */
module.exports.auth = (baseUri, server) => {
    server.post(`${baseUri}/authenticate`, (req, res) => {
        try {
            // Validate user credentials
            const { username, password } = req.body;

            const user = verifyUser(username, password)
            if (!user) {
                return res.status(401).json({ 
                    message: 'Invalid login credentials',
                    status: 401
                });
            }
        
            // Generate a JWT for the user
            const token = jwt.sign(
                user, 
                process.env.SECRET_KEY, 
                { 
                    expiresIn: '30m',
                    issuer: 'mycure-scraper-tool',
                    algorithm: 'HS256'
                }
            );

            const p = decode(token)
            res.status(201).json({ 
                status: 201,
                accessToken: token,
                expiresIn: new Date(p.payload.exp * 1000).getTime()
            });
        } catch (e) {
            res.status(500).json({
                status: 500,
                message: e.message
            })
        }
    });

    return server
}