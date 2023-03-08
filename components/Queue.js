const BullQueue = require('bull')

/**
 * Queue - Implementation of bulljs Queue
 * @author Nino Casupanan
 */
module.exports.Queue = class Queue {
    constructor({ queueName, queueOption }) {
        this.queueName = queueName
        this.queue = new BullQueue(queueName, queueOption)
        console.info(`[QUEUE][${this.queueName}] Redis configured. [${queueOption.redis.host}:${queueOption.redis.port}]`)

    }

    /**
     * Register a process worker method
     * @param {*} concurrency concurrency of the worker
     * @param {*} path full path of the worker js file
     * @returns Queue
     */
    registerProcess(name = '__default__', concurrency = 2, path) {
        this.queue.process(name, concurrency, path)
        console.info(`[QUEUE][${this.queueName}] Queue is registered with Queue Name ${this.queue.name}`)
        return this
    }


    /**
     * Register event handlers
     * @param {*} func provide a method that accepts 1 argument from `Queue`
     * @returns Queue
     * 
     * @example 
     * ```javascript
     * module.exports.function = (queue) => {
     *      queue.on('complete', (jobId, result) => {
     *          // process
     *      })
     * }
     * ```
     */
    registerEventHandler(func = () => {}) {
        func(this.queue)
        return this
    }

    /**
     * ## Register another queue for separate node processing
     * @param {BullQueue} queue Queue instance from BullQueue
     * @returns 
     */
    registerQueueCompleteCallback(queue, processorName = '__default__', jobOpts = {}) {
        this.queue.on('completed', async (job, result) => {
            await queue.add(processorName, {
                job,
                result
            }, jobOpts)
        })

        console.info(`[QUEUE][${this.queueName}] A queue is registered as 'complete' callback ${queue.name}`)

        return this
    }

    getQueue() {
        return this.queue
    }
}