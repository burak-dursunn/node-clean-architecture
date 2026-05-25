const express = require('express');
const router = express.Router();
const AuditLogs = require('../db/models/AuditLogs');
const Response = require('../lib/Response');
const moment = require('moment');
const auth = require('../lib/auth');

//! Authentication Middleware
router.all('*', auth.authenticate(), (req, res, next) => {
    next();
});

router.get('/', auth.checkPrivilege('auditlogs_view'), async (req, res) => {
    try {
        let query = {};
        let skip = parseInt(req.query.skip) || 0;
        let limit = parseInt(req.query.limit);

        if (typeof skip !== 'number') {
            skip = 0;
        }

        if (isNaN(limit) || limit > 500) {
            limit = 500;
        }

        if (req.query.begin_date && req.query.end_date) {
            query.timestamp = {
                $gte: new Date(req.query.begin_date),
                $lte: new Date(req.query.end_date)
            };
        } else {
            query.timestamp = {
                $gte: moment().subtract(1, "day").startOf("day").toDate(),
                $lte: moment().toDate()
            };
        }

        const auditLogs = await AuditLogs.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        res.json(Response.successResponse(auditLogs));

    } catch (error) {
        const errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
})

module.exports = router;