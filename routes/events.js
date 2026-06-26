const express = require('express');
const router = express.Router();
const { HTTP_CODES } = require('../config/Enum');
const emitter = require('../lib/Emitter');

router.get('/', (req, res) => {
    res.writeHead(HTTP_CODES.OK, {
        "Content-Type": "text/event-stream",
        "Connection": "keep-alive",
        "Cache-Control": "no-cache, np-transform"
    });

    const listener = (data) => {
        res.write("data" + JSON.stringify(data) + "\n\n");
    };

    emitter.getEmitter("notifications").on("messages", listener);

    req.on("close", () => {
        // emitter.getEmitter("notifications").removeListener("messages", listener);
        emitter.getEmitter("notifications").off("messages", listener);
        console.log("Client disconnected");
    })
});

module.exports = router;