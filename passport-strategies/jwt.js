const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

module.exports = new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.SECRET_KEY,
    issuer: 'scraper-tool'
}, (payload, done) => {
    // Find the user specified in the token
    // TODO: Database user implementation
    // User.findById(payload.sub, (err, user) => {
    //     if (err) {
    //       return done(err, false);
    //     }
    //     if (user) {
    //       return done(null, user);
    //     }
    //     return done(null, false);
    // });
    return done(null, payload);
});
