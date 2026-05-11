const passport = require('passport');
const { ExtractJwt, Strategy } = require('passport-jwt');
const config = require('../config');
const { HTTP_CODES, SUPER_ADMIN } = require('../config/Enum');
const User = require('../db/models/Users');
const Roles = require('../db/models/Roles');
const UserRoles = require('../db/models/UserRoles');
const RolePrivileges = require('../db/models/RolePrivileges');
const Response = require('./Response');
const CustomError = require('./Error');

async function resolveUserAccess(userId) {
    const userRoles = await UserRoles.find({ user_id: userId }).lean();

    if (!userRoles.length) {
        return { isSuperAdmin: false, privileges: [] };
    }

    const roleIds = userRoles.map(ur => ur.role_id);

    const roles = await Roles.find({ _id: { $in: roleIds } }).lean();
    const isSuperAdmin = roles.some(r => r.role_name === SUPER_ADMIN);

    if (isSuperAdmin) {
        return { isSuperAdmin: true, privileges: [] };
    }
    const rolePrivileges = await RolePrivileges.find({ role_id: { $in: roleIds } }).lean();
    const privileges = rolePrivileges.map(rp => rp.permission);

    return { isSuperAdmin: false, privileges };
}

// JWT Strategy
const strategy = new Strategy(
    {
        secretOrKey: config.JWT.SECRET,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    },
    async (payload, done) => {
        try {
            const user = await User.findOne({ _id: payload.id }).lean();
            if (!user) return done(null, false);

            const { isSuperAdmin, privileges } = await resolveUserAccess(payload.id);

            return done(null, {
                id: user._id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                isSuperAdmin,   // boolean
                privileges,     // string[]: ["role_view", "category_add", ...]
                exp: payload.exp
            });
        } catch (error) {
            return done(error, null);
        }
    }
);

passport.use(strategy);

function checkPrivilege(...expectedPrivileges) {
    return (req, res, next) => {
        if (!expectedPrivileges.length) return next();

        if (req.user?.isSuperAdmin) return next();

        const userPrivileges = req.user?.privileges ?? [];
        const hasAccess = expectedPrivileges.some(p => userPrivileges.includes(p));
        if (hasAccess) return next();

        return res
            .status(HTTP_CODES.FORBIDDEN)
            .json(Response.errorResponse(
                new CustomError(
                    HTTP_CODES.FORBIDDEN,
                    'Forbidden',
                    'You do not have permission to access this resource.'
                )
            ));
    };
}

module.exports = {
    initialize: () => passport.initialize(),
    authenticate: () => passport.authenticate('jwt', { session: false }),
    checkPrivilege
};