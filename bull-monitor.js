const { appEnv } = require('./util')
// Load application env based on git branch
require('custom-env').env(appEnv())
const { BullMonitorExpress } = require('@bull-monitor/express');
const { BullAdapter } = require('@bull-monitor/root/dist/bull-adapter');

const Express = require('express');
const Queue = require('bull');

const basePath = '/queues'
const PORT = process.env.BULL_BOARD_PORT || 8000
const queueNameScraper = process.env.QUEUE_SCRAPER_QUEUE_NAME || 'ScrapingQueue'
const queueNameUploading = process.env.QUEUE_UPLOADER_QUEUE_NAME || 'UploadingQueue'

;(async () => {
    const app = Express();
    const queueOptions = JSON.parse(process.env.QUEUE_OPTS || '{}')
    const monitor = new BullMonitorExpress({
        queues: [
            new BullAdapter(new Queue(queueNameScraper, queueOptions)),
            new BullAdapter(new Queue(queueNameUploading, queueOptions)),
        ],
        // enables graphql introspection query. false by default if NODE_ENV == production, true otherwise
        gqlIntrospection: true,
        // enable metrics collector. false by default
        // metrics are persisted into redis as a list
        // with keys in format "bull_monitor::metrics::{{queue}}"
        metrics: {
            // collect metrics every X
            // where X is any value supported by https://github.com/kibertoad/toad-scheduler
            collectInterval: { minutes: 1 },
            maxMetrics: 100,
            // disable metrics for specific queues
            // blacklist: ['ScrapingQueue'],
        },
    });
    await monitor.init();
    app.use(basePath, monitor.router);
    app.listen(PORT, () => {
        console.log(`\n\nRunning on ${PORT}...`);
        console.log(`Open http://localhost:${PORT}${basePath}`);
        console.log('Make sure Redis is running on port 6379 by default\n\n');
    });

    // replace queues
    // monitor.setQueues([new BullAdapter(new Queue('ScrapingQueue', queueOptions))]);
})();