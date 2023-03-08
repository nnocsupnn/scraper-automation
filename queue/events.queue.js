const { jobLogs } = require('./util.queue')

module.exports.eventsHandler = (queue, callbacks) => {
    queue.on("global:progress", async (jobId, progress) => {
        const jobLog = await queue.getJobLogs(jobId, 0, 1)
        console.log(`\n[EVENT][${queue.name}]: Job #${jobId} is ${progress}% ready! \n\t --> Logs: ${jobLog.logs.pop()}`);
        
        await jobLogs(queue)
    });

    queue.on("global:completed", async (jobId, result) => {
        console.log(`\n[EVENT][${queue.name}]: Job #${jobId} Completed with result:\n\t` + result);
        // queue.getJob(jobId).then((job) => job.remove());
        await jobLogs(queue)
    });

    queue
        .on("global:error", (error) => {
            // An error occured.
            console.log("Error occured " + error);
        })
        .on("error", (error) => {
            // An error occured.
            console.log("Error occured " + error);
        })
        .on("waiting", (jobId) => {
            // A Job is waiting to be processed as soon as a worker is idling.
            console.log(`\n[EVENT][${queue.name}]: Job #${jobId} added to waiting list.`);
        })
        .on("active", async (job, jobPromise) => {
            // A job has started. You can use `jobPromise.cancel()`` to abort it.
            console.log(`\n[EVENT][${queue.name}]: Job #${job.id} started. Attempts made (${job.attemptsMade})`);
        })
        .on("stalled", (job) => {
            // A job has been marked as stalled. This is useful for debugging job
            // workers that crash or pause the event loop.
            console.log(`\n[EVENT][${queue.name}]: Job #${job.id} has been marked as stalled. `);
        })
        .on("failed", (job, err) => {
            // A job failed with reason `err`!
            console.error(err)
            console.log(`\n[EVENT][${queue.name}]: Job #${job.id} has been marked as failed. `);
        })
        .on("paused", () => {
            // The queue has been paused.
            console.log(`\n[EVENT][${queue.name}]: Job #${jobId} is paused. `);
        })
        .on("resumed", (job) => {
            // The queue has been resumed.
            console.log(`\n[EVENT][${queue.name}]: Job #${jobId} is resumed. `);
        })
        .on("cleaned", (jobs, type) => {
            // Old jobs have been cleaned from the queue. `jobs` is an array of cleaned
            // jobs, and `type` is the type of jobs cleaned.
            console.log(`\n[EVENT][${queue.name}]: Jobs cleaned.`);
        })
        .on("drained", () => {
            // Emitted every time the queue has processed all the waiting jobs (even if there can be some delayed jobs not yet processed)
            console.log(`\n[EVENT][${queue.name}]: Jobs drained.`);
        })
        .on("removed", (job) => {
            // A job successfully removed.
            console.log(`\n[EVENT][${queue.name}]: Job #${job.id} removed`);
        });
}
