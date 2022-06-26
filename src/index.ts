import axios from 'axios'
import chalk from 'chalk'
import { Options } from './type'
import fs from 'fs-extra'
import { compile, JSONSchema } from 'json-schema-to-typescript'

export default async function apiBuildCi(options: Options) {
    const apiUrl = options.api
    const { namespace, sdkDir } = options

    console.log(chalk.green(`拉取 ${namespace} 的 swagger json`))
    let json: string = ''
    if (apiUrl.indexOf('http://')) {
        json = await axios
            .request<string>({
                url: apiUrl,
                method: 'get',
                timeout: options.timeout || 30000,
                transformResponse(res) {
                    return res
                },
            })
            .then((res) => {
                return res.data
            })
    } else {
        json = fs.readJSONSync(sdkDir)
    }
}
const json = fs.readJSONSync('./test.json')
async function b() {
    const a = await compile(
        {
            type: 'object',
            properties: {
                code: {
                    type: 'integer',
                    title: '',
                    nullable: true,
                    description: '状态码',
                },
                msg: {
                    type: 'string',
                    nullable: true,
                    title: '',
                    description: '提示信息',
                },
                data: {
                    type: 'object',
                    properties: {
                        user_name: {
                            type: 'string',
                            title: '',
                            description: '用户名',
                        },
                        id: {
                            type: 'string',
                            title: '',
                            description: '唯一标识',
                        },
                        phone: {
                            type: 'string',
                            title: '',
                            description: '电话号码',
                        },
                        info: {
                            type: 'object',
                            properties: {
                                address: {
                                    type: 'string',
                                    title: '',
                                    description: '地址',
                                },
                            },
                            title: '',
                            'x-apifox-orders': ['address'],
                            required: ['address'],
                            description: '具体信息',
                            'x-apifox-ignore-properties': [],
                        },
                    },
                    'x-apifox-orders': ['user_name', 'id', 'phone', 'info'],
                    required: ['user_name', 'id', 'phone', 'info'],
                    nullable: true,
                    title: '',
                    description: '数据',
                    'x-apifox-ignore-properties': [],
                },
            },
            'x-apifox-orders': ['code', 'msg', 'data'],
            required: ['code', 'msg', 'data'],
            'x-apifox-ignore-properties': [],
        },
        'ExampleSchema',
        {
            bannerComment: '',
            style: {
                singleQuote: true,
                semi: false,
                tabWidth: 4,
            },
        }
    )
    console.log('a:', a.replace(/\[k\: string\]\: unknown/g, ''))
}
b()
