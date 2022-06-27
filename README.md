## api-build

### 安装

```bash
    npm i api-generator-ci
```

```
api-build [options]
Options:
  -c --configpath        //文件路径
  -i                  //是否根据选择导出.是
```

### cli 使用

```bash
api-build -c ./apiBuildConfig.js -i


```

::: TIP
-c : 设定配置文件所在地址，不传则默认取终端当前目录下的 apiBuildConfig.js
:::

#### 参数详细说明

```ts
interface Options {
    /**
     * swagger / openapi json
     */
    api: string

    /**
     * 名字空间
     */
    namespace: string

    /**
     * 输出目录，绝对地址
     */
    sdkDir: string

    /**
     * 过滤数据
     */
    filter?: Array<(api: APIDataType, tag?: string) => boolean>

    /**
     * 完成后执行
     */
    done?: Function
}
```

### 文件配置

```ts
// config.js
const { defineConfigs } = require('api-generator-ci')
const path = require('path')

module.exports = defineConfigs([
    {
        api: 'http://127.0.0.1:4523/export/openapi/6',
        sdkDir: path.join(__dirname, './temp/i/api/strapi'),
        namespace: 'ApiStrapi',
        filter: [
            (api) => {
                const liteApis = ['/user/uerInfo/{id}']
                if (liteApis.includes(api.path)) return true
                return false
            },
        ],
    },
])

//输出列子

//intex.ts

/**
 * ------------------------------------
 * !!! 不要修改,这是生成的代码 !!!
 * ------------------------------------
 */
import * as test from './test'

export { test }

//test.ts 此文件为接口组名我自己定义的

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

//typings.d.ts

/**
 * ------------------------------------
 * !!! 不要修改,这是生成的代码 !!!
 * ------------------------------------
 */
// tslint:disable
declare namespace ApiStrapi {
    export interface ResUserUserInfoid {
        /**
         * 状态码
         */
        code: number
        /**
         * 提示信息
         */
        msg: string
        data: ResUserUserInfoidData
    }
    /**
     * 数据
     */
    export interface ResUserUserInfoidData {
        /**
         * 用户名
         */
        user_name: string
        /**
         * 唯一标识
         */
        id: string
        /**
         * 电话号码
         */
        phone: string
        info: ResUserUserInfoidDataInfo
    }
    /**
     * 具体信息
     */
    export interface ResUserUserInfoidDataInfo {
        /**
         * 地址
         */
        address: string
    }

    export interface ParamUserUserInfoid {
        id: string
    }

    export interface ReqUserUserInfoid {}
}
```
