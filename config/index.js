module.exports = {
    "PORT": process.env.PORT || '3000',
    "CONNECTION_STRING": process.env.CONNECTION_STRING || "mongodb://127.0.0.1/node-clean-architecture",
    "LOG_LEVEL": process.env.LOG_LEVEL || 'debug',
    "JWT": {
        "SECRET": process.env.SECRET,
        "EXPIRE_TIME": !isNaN(parseInt(process.env.TOKEN_EXPIRE_TIME))? process.env.TOKEN_EXPIRE_TIME : 24 * 60 * 60
    }
    
}