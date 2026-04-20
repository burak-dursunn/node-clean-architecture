var express = require('express');
var router = express.Router();
const AuditLogs = require('../db/models/AuditLogs');
const Enum = require('../config/Enum');
const httpCodes = Enum.HTTP_CODES;
const Response = require('../lib/Response')
const CustomError = require('../lib/Error');
const moment = require('moment');

router.get('/', async (req, res) => {
    const body = req.body;
    let query = {};
    let skip = body.skip;
    let limit = body.limit;
    try {
        if (!body) 
            throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:','body part must be filled');

        if (typeof body.skip !== 'numeric') {
            skip = 0;
        }

        if (typeof body.limit !== 'numeric' || body.limit > 500) {
            limit = 500;
        }
        
        if (body.begin_date && body.end_date) {
            query.created_at = {
                $gte: body.begin_date,
                $lte: body.end_date
            }
            
        } else {
            query.created_at = {
                $gte: moment().subtract(1, "day").startOf("day"),
                $lte: moment()
            }

            let auditLogs = await AuditLogs.find(query).sort({ created_at: -1}).skip(skip).limit(limit);

            res.json(Response.successResponse(auditLogs));
        }
        
    } catch (error) {
        const errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
        
    }
})

module.exports = router;