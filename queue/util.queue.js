
module.exports.jobLogs = async (queue) => {
    const jobCounts = await queue.getJobCounts()
    const dt = new Date()
    console.info(
        `\n\t --- ${queue.name.toUpperCase()} - JOB COUNTS asof (${(dt.getMonth() +1)}/${dt.getDate()}/${dt.getFullYear()} ${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}) ---`,
        '\n\t', `> waiting: ${jobCounts.waiting}`,
        '\n\t', `> active: ${jobCounts.active}`,
        '\n\t', `> completed: ${jobCounts.completed}`,
        '\n\t', `> failed: ${jobCounts.failed}`,
        '\n\t', `> delayed: ${jobCounts.delayed}`,
        '\n\t', `> paused: ${jobCounts.paused}\n`
    )
}

module.exports.getCurrentDateStr = () => {
    const now = new Date()
    let str = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate()} `
    str += `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds()}.${now.getMilliseconds().toString().padStart(2, '0')}`
    return str
}