## swagger-build



### 安装

```bash

```

### 发布到私有库

```bash
yarn pre-build
```

### cli 使用

```bash
swagger-build -c ./genapiconfig.js

# 交互式，可以选择 build 哪些 api
swagger-build -c ./genapiconfig.js -i

```

::: TIP
-c : 设定配置文件所在地址，不传则默认取终端当前目录下的 genapiconfig.js
:::

### 配置

```ts
// config.js
const { defineConfigs } = require('swagger-build')
const path = require('path')

module.exports = defineConfigs([
    {
        api: 'https://fe.yzone.co/yapi/292/json',
        sdkDir: path.join(__dirname, './src/api/gw'),
        namespace: 'ApiGW',
    },
])
```

#### 详细说明

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
     * 格式化 api data
     * 注：程序先执行过滤，再调用格式化
     */
    formatApiData?: (apiData: TagAPIDataType) => TagAPIDataType

    /**
     * 格式化 query 类型
     * 如， id 要返回 'number | strng'
     */
    formatQueryType?: (
        name: string,
        api: APIDataType
    ) => string | string[] | null

    /**
     * 完成后执行
     */
    done?: Function
}
```

### API 请求参数和返回值修改

思路是使用 api 的接口地址和请求方法作为 key, 配置该接口的请求参数和返回值的修改方法，然后在 axios 拦截器中根据请求的信息获取到接口的修改配置，并根据配置修改对应的请求参数或返回值。

> 每个配置生成的接口，默认会生成一个 $transformApi 的对象，可以方便的配置需要修改内容。

#### 类型定义

```ts
// $transformApi
// 每个配置会有不同的类型定义
type ConfigMap = Record<
    string,
    {
        // 修改 get 请求参数的方法 (url 参数)
        params?: (
            params: ApiGW.QueryGroupbuyBoardDataOrder
        ) => ApiGW.QueryGroupbuyBoardDataOrder
        /** 修改 post, delete, put 等参数请求的方法 */
        body?: (
            params: ApiGW.QueryGroupbuyBoardDataOrderBody
        ) => ApiGW.QueryGroupbuyBoardDataOrderBody
        // 修改返回值的方法
        response?: (
            res: ApiGW.ResGroupbuyBoardDataOrder
        ) => ApiGW.ResGroupbuyBoardDataOrder
    }
>

/**
 * 配置需要转换的 api
 */
function config(cfg: ConfigMap): void

/**
 * 获取 api 转换配置
 */
function getConfig(): ConfigMap
```

#### 转换例子

-   第一步，设置修改的内容
-   第二步，在拦截器应用这些修改配置

##### 第一步，使用 $transformApi 修改接口

```ts
// 修改 api
import { $transformApi } from '@/api/gw' // 假设生成了一个 gw 的模块

$transformApi.config({
    'get_/groupbuy-board/data/order': {
        params: (params) => {
            params.id = 111
            return {
                ...params,
                version: '可以新增字段',
            }
        },
        response: (res) => {
            res.order_amount = toYuan(res.order_amount)
            return res
        },
    },
})
```

(建议) 将所有配置合并在一起

```ts
// config.ts
import { $transformApi as $GwTransformApi } from '@/api/gw'
import { $transformApi as $OtherTransformApi } from '@/api/other'

export default {
    ...$GwTransformApi.getConfig(),
    ...$OtherTransformApi.getConfig(),
}
```

##### 第二步， 使用 axios 拦截器修改请求

```ts
import configs from 'config.js'
// ax 是 axios 的实例
import ax from './request'

// 请求拦截器
ax.interceptors.request.use((options: AxiosRequestConfig) => {
    const key = `${options.method}_${options.url}`
    const config = configs[key]
    if (config?.params) {
        options.params = config.params(options.params)
    }

    if (config?.body) {
        options.data = config.body(options.data)
    }
    return options
})

// 响应拦截器
ax.interceptors.response.use((res: AxiosResponse) => {
    const options = res.config
    const key = `${options.method}_${options.url}`
    const config = configs[key]

    if (config?.response && res.data?.response) {
        res.data.response = config.response(res.data.response)
    }
    return res
})
```
