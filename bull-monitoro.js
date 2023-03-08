
const { appEnv } = require('./util')
// Load application env based on git branch
require('custom-env').env(appEnv())
const monitoro = require('monitoro'), 
Express = require('express'), 
Queue = require('bull');


const app = Express();
const queueOptions = JSON.parse(process.env.QUEUE_OPTS || '{}')
const basePath = '/queues'
const PORT = process.env.BULL_BOARD_PORT || 8000

app.locals.MonitoroQueues = (['ScrapingQueue', 'UploadingQueue']).map(q => Queue(q, queueOptions))

app.use(basePath, monitoro)
app.listen(PORT, () => {
    console.log(`Running on ${PORT}...`);
    console.log(`Open http://localhost:${PORT}${basePath}`);
    console.log('Make sure Redis is running on port 6379 by default');
});