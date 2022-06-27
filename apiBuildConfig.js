/**
 * yapi 生成配置
 */
const path = require('path')
const fs = require('fs-extra')

module.exports = [

    {
        api: 'http://127.0.0.1:4523/export/openapi/6',
        sdkDir: path.join(__dirname, './src/api/strapi'),
        namespace: 'ApiStrapi',
        filter: [
            (api) => {
                if (api.path === '/user/userInfo/{id}') return true
                return false
            },
        ],

        // formatApiData: formatOldApi
    },
]
