/* eslint-disable no-unused-vars */
const passport = require('passport');
const { ExtractJwt, Strategy } = require('passport-jwt');
const User = require('../db/models/Users');
const UserRoles = require('../db/models/UserRoles');
const RolePrivileges = require('../db/models/RolePrivileges');

const config = require('../config');

module.exports = function () {
    let strategy = new Strategy({
        secretOrKey: config.JWT.SECRET,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    }, async (payload, done) => {
        try {
            let user = await User.findOne({ _id: payload._id });
            
            if(!user) 
                return done(null, false)
            
            let rolePrivileges = [];

            let userRoles = await UserRoles.find({ user_id: payload._id });
            if (userRoles.length >0) {
                let rolePrivileges = await RolePrivileges.find({ 
                    role_id: { $in: userRoles.map(ur => ur.role_id) }
                });
            }

            return done(null, {
                user_id: user._id,
                roles: rolePrivileges,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                exp: parseInt(Date.now() / 1000) * config.JWT.EXPIRE_TIME
            })



        } catch (error) {
            return done(new Error('User has not found'), null);

        }
    });

    passport.use(Strategy);

    return {
        initialize: function () {
            passport.initialize()
        },
        authanticate: function() {
            passport.authenticate("jwt", { session: false})
        }

    }
}