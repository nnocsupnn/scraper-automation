# **Scraper**

> MedGO Results is a project to integrate CMS Results from a third party application to our own inhouse mobile application Medicard GO

<br/>

## **Normal Installation - Single Node**
### Install
- Install chrome headless
- Install below dependencies (Installation requirements)
- then run, npm install
- Then run both `node app.js` and `node app-queue.js`, For the dashboard run node `node bull-monitor.js`

### Installation [Requirements](https://gist.github.com/winuxue/cfef08e2f5fe9dfc16a1d67a4ad38a01) for Puppeteer 
```bash
sudo apt-get install gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libatk-bridge2.0-0 libgbm-dev
```
<br/>

## **Microservice Installation**
### Deploying in Docker and Kubernetes
> Before running `npm run deploy` please make sure to deploy in the cluster the docker secrets.<br/>This commands also can be use in CI/CD Integrations.
- See `devtools/*.yaml` files for the README.md and scripts.
- Deployment for linux machine with Docker and K8
```bash
npm run build --env=prod
npm run push --env=prod
npm run deploy --env=prod
```
- Deploying in windows/local machine with Docker and K8
```bash
npm run build-local --env=prod
npm run push-local --env=prod
npm run deploy-local --env=prod
```

> Profile argument `(--env)` is required argument for build in prod, by default value is 'staging'.



---
<br/>

## **Updates**


| **Tools/Module**  | **Added Date**  | **Description**  |
|---|---|---|
|JWT Authentitcation|December 15, 2022|For authentication and security|
|Azure Blob Storage| December 18, 2022| For saving pdf files and generating public access link|
|BullMonitor|January 3, 2023| For Monitoring UI of all queues|
|  Snyk | January 6, 2023  | Vulnerability tests   |
|  Mocha | January 6, 2023  | Testing   |
|  helmet  | January 6, 2023   | Security Headers   |
| Docker and Kubernetes | February 10, 2023 | For microservices implementation
| Azure Pipelines | February 20, 2023 | For CI/CD Integrations
| Swagger Docs | March 01, 2023 | For documentation

<br/>

## This Project follows the semantic versioning for reference please see the below.
| **Code status**  | **Stage**  | **Rule**  | **Example version output**
|---|---|---|---|
| First Release | New Product | Start with 1.0.0 | 1.0.0
| Backward compatible bug fixes | Patch Release | Increment the third digit | 1.0.1
| Backward compatible new features | Minor Release | Increment the middle digit and reset last digit to zero | 1.1.0
| Changes that break backward compatibility | Major Release | Increment the first digit and reset middle and last digits to zero | 2.0.0

> To update the version please see below command
```bash
onin$ npm version patch
```
> This will update the version of the package to 1.0.1

<br/>
<br/>
<footer>
<i>Project started -  December 19, 2022</i>
</footer>