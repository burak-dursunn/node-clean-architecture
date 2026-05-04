/* eslint-disable no-unused-vars */
const passport = require('passport');
const { ExtractJwt, Strategy } = require('passport-jwt');
const User = require('../db/models/Users');
const UserRoles = require('../db/models/UserRoles');
const RolePrivileges = require('../db/models/RolePrivileges');

const config = require('../config');

const strategy = new Strategy({
    secretOrKey: config.JWT.SECRET,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
}, async (payload, done) => {
    try {
        let user = await User.findOne({ _id: payload.id });

        if (!user)
            return done(null, false);

        let rolePrivileges = [];

        let userRoles = await UserRoles.find({ user_id: payload.id });
        if (userRoles.length > 0) {
            rolePrivileges = await RolePrivileges.find({
                role_id: { $in: userRoles.map(ur => ur.role_id) }
            });
        }

        return done(null, {
            id: user._id,
            roles: rolePrivileges,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            exp: payload.exp
        });

    } catch (error) {
        return done(error, null);
    }
});

passport.use(strategy);

module.exports = {
    initialize: () => passport.initialize(),
    authenticate: () => passport.authenticate("jwt", { session: false })
};