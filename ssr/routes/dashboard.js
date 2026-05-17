// ssr/routes/dashboard.js

const express = require('express');

const dashboardController =
    require('../controllers/dashboard');

module.exports = function(baseContext) {

    const router = express.Router();

    router.get(
        '/',
        (req, res) =>
            dashboardController.dashboardPage(
                req,
                res,
                baseContext
            )
    );

    return router;
};
