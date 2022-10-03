const app = require("express")();
const { default: axios } = require('axios');
const redis = require("redis");
const port = "3000"
const REDIS_PORT = 6739;

const base_URL = 'https://swapi.dev/api/';


const client = redis.createClient(REDIS_PORT);

(async () => {
    await client.connect();
})();

client.on('connect', () => console.log('::> Redis Client Connected'));
client.on('error', (err) => console.log('<:: Redis Client Error:::', err));


app.get('/', (req, res) => {
    res.send(`<h1>Hello Welcome to Redis Cache </h1>`);
})

var checkCache = (req, res, next) => {
    let query = req.params.query;
    client.get(query, (err, data) => {
        if (err) throw err;
        if (!data) {
            return next();
        } else {
            return res.json({ data: JSON.parse(data), info: 'data from cache' });
        }
    });
}

app.get('/starwars/:query', checkCache, async (req, res) => {
    let query = req.params.query;

    let data = await axios(base_URL + query);

    //caching received data using redis

    client.setex(query, 600, JSON.stringify(data.data));

    res.json({ data: data.data, info: 'data from 3rd party API' });
});



app.listen(port, () => {
    console.log(`server surviving on port ${port}`)
})
