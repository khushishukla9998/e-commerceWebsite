const redis = require('redis');
 const appStrings = require("./appString")

const client = redis.createClient({
    url: 'redis://localhost:6379'
});

client.on('error', (err) => {
    console.error(appStrings.REDIS_CLIENT_ERROR, err);
});

client.on('connect', () => {
    console.log(appStrings.REDIS_CONNECT);
});

(async () => {
    try {
        await client.connect();
    } catch (err) {
        console.error(appStrings.REDIS_FAILED, err);
    }
})();

module.exports = client;
