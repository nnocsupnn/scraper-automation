const puppeteer = require("puppeteer");
const path = require('path')
const { existOrCreateDir } = require('../util')
const { StorageService } = require("./StorageService");
const { join } = require("path");
const chromeOptions = {
	headless: false,
    args: ['--no-sandbox'], // for running ubuntu
    ignoreHTTPSErrors: true
};
const defaultTimeout = 120000;
let myCureData = {
	host: "https://stg-mycure-cms.medicardphils.com/",
	login: {
		email: "superadmin@medicardphils.com",
		password: "strongadminpassword",
	},
};

/**
 * 
 * Implementation of puppeteer for custom use
 * @author Nino Casupanan
 */
module.exports.MyCureScraper = class MyCureScraper {
    constructor(params, job, headless = true) {
        chromeOptions.headless = headless

        this.params = params // type, memberCode, testPathId
        myCureData.host = process.env.SOURCE_HOST || 'https://source-scraper.com/'
        myCureData.login = {
            email: process.env.SOURCE_EMAIL || "superadmin@medicardphils.com",
            password: process.env.SOURCE_PASSWORD || "strongadminpassword"
        }

        this.browser = undefined
        this.job = job
        this.storage = new StorageService()

        this.classNamesPerType = {
            radiology: '#RisOrderTestPrintPageRoot',
            laboratory: '#LisOrderTestPrintPageRoot'
        }

        this.containerFolder = process.env.SCRAPER_PDF_FOLDER || 'bin'
    }
    
    async startBrowser() {
        this.browser = await puppeteer.launch(chromeOptions);
    }

    delay(time) {
        return new Promise(function(resolve) { 
            setTimeout(resolve, time)
        });
    }

    /**
     * Wait for the browser to fire an event (including custom events)
     * @param {string} eventName - Event name
     * @param {integer} seconds - number of seconds to wait.
     * @param {string} callFunction - call function is the function name defined in the savePdf method. this can be used if you defined custom method to page
     * @returns {Promise} resolves when event fires or timeout is reached
     */
    async waitForEvent(eventName, timeout, page, callFunction) {
        timeout = (timeout || 30) * 1000;

        return Promise.race([
            page.waitForNetworkIdle({
                idleTime: 500,
                timeout: defaultTimeout
            }),
            page.evaluate(async function(eventName, callFunction) {
                return new Promise(async (resolve) => {
                    window.addEventListener(eventName, async (e) => {
                        
                    })

                    window.addEventListener('afterprint', async () => {
                        await window.captureAsPdf()
                        resolve(true)
                    })
                })
            }, eventName, callFunction),
            // wait for timeout
            new Promise(resolve => setTimeout(() => resolve(false), timeout))
        ])
    }


    async login(page) {
        await page.waitForSelector('input', { timeout: defaultTimeout })

        console.log(`\n[EVENT][#${this.job.id}][LOGIN]: Logging in..`)
        // Enter the username and password
        const username = await page.$('input[type="email"]');
        await username.type(myCureData.login.email);
    
        const password = await page.$('input[type="password"]');
        await password.type(myCureData.login.password);
    
        // Submit the login form
        await page.click('[data-test-id="login-btn"]');
    
        // Wait for the page to load
        await page.waitForNavigation();
    
        // You are now logged in!
        console.log(`\n[EVENT][#${this.job.id}][LOGIN]: Successfull login!`);
    }

    /**
     * Save PDF Locally
     * 
     * TODO: Save pdf to azure blob
     * @param {*} page 
     * @param {*} filename 
     */
    async savePdf(page, dir, filename, testUri) {
        if (this.params.type in this.classNamesPerType) {
            const result = await page.waitForSelector(this.classNamesPerType[this.params.type]).catch(undefined)
            if (!result) throw Error(`${this.classNamesPerType[this.params.type]} not loaded`)
        }

        // if (this.params.type === 'radiology') {
        //     const result = await page.waitForSelector('#RisOrderTestPrintPageRoot').catch(undefined)
        //     if (!result) throw Error("#LisOrderTestPrintPageRoot not loaded")
        //     // await page.waitForSelector('tbody:nth-child(2) > tr > td > div.print-body')
        // } else {
        //     const result = await page.waitForSelector('#LisOrderTestPrintPageRoot').catch(undefined)
        //     if (!result) throw Error("#LisOrderTestPrintPageRoot not loaded")
        //     // await page.waitForSelector('tbody:nth-child(2) > tr > td > div.print-body')
        // }

        console.log(`[EVENT][#${this.job.id}][PDF]: Capturing screen and save as PDF`)

        // Register an method in window.captureAsPdf
        const dirPath = path.join(this.containerFolder, dir)
        const filePath = path.join(dirPath, filename + '.pdf')

        existOrCreateDir(dirPath)

        await page.waitForNetworkIdle();
        await page.setOfflineMode(true)
        await page.setRequestInterception(true);
        page.on('request', request => request.abort());

        await page.pdf({
            format: 'letter',
            path: filePath
        })

        return filePath
    }

    // TODO Create a function that will generate a sas link

    async scrape(done) {
        try {
            if (this.browser === undefined) throw Error('Browser not started.')
            const page = await this.browser.newPage()

            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:73.0) Gecko/20100101 Firefox/73.0')

            page.setDefaultTimeout(defaultTimeout)

            const frameEvents = ['frameattached', 'framenavigated', 'framedetached']
            frameEvents.map(event => page.on(event, frame => {
                console.log(`[EVENT][#${this.job.id}][${event}]: ${frame.url()}`)
            }))

            // Navigate to the login page
            await page.goto(myCureData.host, {
                timeout: defaultTimeout,
            })

            await this.login(page);

            this.job.progress(50)

            const typeUri = this.params.type === 'radiology' ? 'ris' : 'lis'
            const testUri = `${myCureData.host}cms/${typeUri}/test/${this.params.testPathId}`
            await page.goto(testUri, { timeout: 120000, waitUntil: 'networkidle0' })
            await page.waitForSelector('.mdi-printer', {
                timeout: 120000
            })

            this.job.progress(60)

            await page.waitForSelector('div.v-menu__content > div.v-list > div > a.v-list__tile > div')

            this.job.progress(70)

            const elements = await page.$$('#app > div.v-menu__content > div.v-list > div > a.v-list__tile > div')

            for (const element of elements) {
                const innerText = await element.evaluate(e => e.innerHTML)

                if (innerText === 'Print Report') {
                    await element.evaluate(e => e.parentElement.click())
                    break
                }
            }

            this.job.progress(85)
            
            // Save pdf
            const localFilePath = await this.savePdf(page, path.join(this.params.memberCode, this.params.testId), this.params.testPathId, testUri);

            this.job.progress(90)

            console.log(`\n[EVENT][#${this.job.id}]: Scraping Completed.. PDF Saved.`)

            // Close the browser
            await this.browser.close();

            this.job.progress(100)

            done(null, {
                requestBlobName: `${this.params.memberCode}_${this.params.testId}_${this.params.testPathId}.pdf`,
                file: localFilePath
            })
        } catch (e) {
            this.job.log(e.message)
            this.job.progress(100)
            done(e, null)
        }
    }
}