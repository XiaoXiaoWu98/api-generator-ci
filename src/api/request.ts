import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import qs from 'qs'

const instance = axios.create({
    baseURL: 'http://127.0.0.1',
    timeout: 20000,
    responseType: 'json',
    paramsSerializer: function (params) {
        return qs.stringify(params, { arrayFormat: 'comma' })
    }
})

// 添加请求拦截器
instance.interceptors.request.use(
    async (config) => {

        if (config.method === 'post') {
            config.data = {
                ...config.data,

            }
        } else {
            config.params = {
                ...config.params,
            }
        }

        return config
    },
    (err) => {
        return Promise.reject(err)
    }
)

// 添加响应拦截器
instance.interceptors.response.use(
    (res) => {
        return res
    },
    (err) => {
        return Promise.reject(err)
    }
)

// 错误处理
const handleApiError = async (error: AxiosError) => {
    let code = 500
    let data = null
    if (error.response) {
        data = error.response.data
        code = error.response.status
    }

    if ([401].includes(code)) {

        return Promise.reject(error)
    } else {
        let msg = '未知错误'
        const errorMsg = error.message || ''

        if (errorMsg.includes('Network Error')) {
            msg =
                '请检查网络' +
                (error.config && error.config.url
                    ? error.config.url
                    : JSON.stringify(error.request))
        } else if (errorMsg.includes('timeout') && errorMsg.includes('exceeded')) {
            msg = '请求超时'
        }

        if (data) {
            // @ts-ignore
            msg = data.msg
        }

        // @ts-ignore
        if (!error.config || !error.config.hideToast) {
            console.log(msg || '系统错误，请稍后重试')
        }

        return Promise.reject(error)
    }
}

export default async function request<T>(url: string, options: AxiosRequestConfig, _ns?: string) {
    return instance
        .request<T>({
            url,
            ...options,
            responseType: options.responseType || 'json'
        })
        .then((res) => {
            // @ts-ignore
            return res.data?.response as T
        })
        .catch((err) => {
            // ui.notify('系统错误，请稍后重试')
            handleApiError(err)
            throw err
        })
}
