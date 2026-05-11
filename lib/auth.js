/* eslint-disable no-unused-vars */
const passport = require('passport');
const { ExtractJwt, Strategy } = require('passport-jwt');
const User = require('../db/models/Users');
const UserRoles = require('../db/models/UserRoles');
const RolePrivileges = require('../db/models/RolePrivileges');
const privs = require('../config/role_privileges');
const Response = require('./Response');
const CustomError = require('./Error');
const { HTTP_CODES } = require('../config/Enum');

const strategy = new Strategy({
    secretOrKey: config.JWT.SECRET,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
}, async (payload, done) => {
    try {
        let user = await User.findOne({ _id: payload.id });

        if (!user)
            return done(null, false);

        let rolePrivileges = [];
        let privileges = [];

        let userRoles = await UserRoles.find({ user_id: payload.id });
        if (userRoles.length > 0) {
            rolePrivileges = await RolePrivileges.find({
                role_id: { $in: userRoles.map(ur => ur.role_id) }
            });

            userPrivileges = rolePrivileges.map(rp => privs.privileges.map(x => x.key == rp.permission))
        }

        return done(null, {
            id: user._id,
            roles: userPrivileges,
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
    authenticate: () => passport.authenticate("jwt", { session: false }),
    checkRoles: (...expectedRoles) => {
        return (req, res, next) => {
            if (!expectedRoles.length)
                return next();

            let privileges = req.user.roles.map(r => r.key);

            for (let i = 0; i < expectedRoles.length; i++) {
                if (privileges.includes(expectedRoles[i])) {
                    return next();
                }
            }

            return res.status(HTTP_CODES.UNAUTHORIZED).json(Response.errorResponse(new CustomError(HTTP_CODES.UNAUTHORIZED, "Unauthorized", "You do not have permission to access this resource.")));
        }
    }
};