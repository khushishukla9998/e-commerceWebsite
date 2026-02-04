const express = require("express")
const routes = express.Router()
const routeArray = require("./route");
const commonUtils = require("../utils/commonUtils");



commonUtils.routeArray(routeArray, routes ,true);

module.exports = routes