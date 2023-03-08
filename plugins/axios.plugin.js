
const https = require("https")
const axios = require("axios")

const apiHost = process.env.SOURCEAPI_HOST
const apiUser = process.env.SOURCEAPI_USERNAME
const apiPassword = process.env.SOURCEAPI_PASSWORD
let counter = 0
/**
 * Authentication AXIOS
 * @returns 
 */
 const axiosMiddleWare = async () => {
    // Disable validation of SSL | Note: Remove if using a public api
    const axiosConfig = {
        httpsAgent: new https.Agent({  
            rejectUnauthorized: false
        }),
        headers: {
            'content-type': 'application/json'
        },
        baseURL: apiHost
    }

    const axiosInstance = axios.create(axiosConfig)

    // Automatic refresh token
    axiosInstance.interceptors.response.use(response => {
        return response
    }, async error => {
        const originalRequest = error.config
        if (error.response != undefined && error.response.status === 502 && counter < 5 ) {
            counter++
            await (async (ms) => new Promise((res) => setTimeout(res, ms)))(5000);
            originalRequest._retry = true;
            return axiosInstance(originalRequest);
        } else counter = 0
        if (error.response != undefined 
            && (error.response.status == 401 && !originalRequest._retry)) 
        {
            originalRequest._retry = true;
            const accessToken = await getApiAuthenticationToken(axiosInstance) || ''          
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
            return axiosInstance(originalRequest);
        }
        return Promise.reject(error)
    })

    // Get auth token
    const accessToken = await getApiAuthenticationToken(axiosInstance) || ''

    // Set the auth to all request
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    
    return axiosInstance
}


/**
 * Get authentication token
 * @param {*} axiosInstance 
 * @returns 
 */
const getApiAuthenticationToken = async (axiosInstance) => {
    const auth = await axiosInstance.post(`${apiHost}/authentication`, {
        email: apiUser,
        password: apiPassword
    })
    .then(res => {
        return res.data?.accessToken
    })
    .catch(e => e)

    if (typeof auth == 'object') throw auth

    return auth
}


const instance = () => axios.create()

module.exports = {
    axiosMiddleWare
}