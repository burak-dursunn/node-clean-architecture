const express = require('express');
const router = express.Router();
const AuditLogs = require('../db/models/AuditLogs');
const Response = require('../lib/Response')
const moment = require('moment');
const auth = require('../lib/auth');

router.get('/', auth.authenticate(), async (req, res) => {
    const body = req.body;
    try {
        let query = {};
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit);

        if (typeof skip !== 'number') {
            skip = 0;
        }

        if (isNaN(limit) || limit > 500) {
            limit = 500; ""
        }

        if (body.begin_date && body.end_date) {
            query.created_at = {
                $gte: new Date(req.query.begin_date),
                $lte: new Date(req.query.end_date)
            };
        } else {
            query.created_at = {
                $gte: moment().subtract(1, "day").startOf("day").toDate(),
                $lte: moment().toDate()
            };
        }

        const auditLogs = await AuditLogs.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        res.json(Response.successResponse(auditLogs));

    } catch (error) {
        const errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
})

module.exports = router;