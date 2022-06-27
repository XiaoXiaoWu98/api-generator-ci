// @ts-nocheck

/**
 * ------------------------------------
 * !!! 不要修改,这是生成的代码 !!!
 * ------------------------------------
 */
import request from '../request'

type Options = Parameters<typeof request>['1']

/**
 * first_test * */
export function userInfoId(
    paths: ApiStrapi.ParamUserUserInfoid,
    data: ApiStrapi.ReqUserUserInfoid,
    options: Options = {}
) {
    const headers = { 'content-type': 'application/json' }

    const url = '/user/userInfo/{id}'.replace('{id}', String(paths['id']))
    return request<ApiStrapi.ResUserUserInfoid>(
        url,
        {
            method: 'GET',
            data,
            apiPath: '/user/userInfo/{id}',
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {}),
            },
        },
        'ApiStrapi'
    )
}
