const NodeCache = require('node-cache');

module.exports = new NodeCache({stdTTL: process.env.CACHE_STD_TTL, checkperiod: process.env.CACHE_CHECK_PERIOD});
