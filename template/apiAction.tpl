// @ts-nocheck

/**
 * ------------------------------------
 * !!! 不要修改,这是生成的代码 !!!
 * ------------------------------------
 */
import request from '../request'

type Options = Parameters<typeof request>['1']

{{@each(it.actions) => api}}
/**
 * {{api.summary}}
 * {{api.description}}
*/
export function {{api.functionName}}(
    {{ @if (api.paths) }}paths: {{it.namespace}}.{{api.paths}},{{ /if}}
    {{ @if (api.params) }}params: {{it.namespace}}.{{api.params}},{{ /if}}
    {{ @if (api.body) }}data: {{it.namespace}}.{{api.body}},{{ /if}}
    options: Options = {}
) {
    const headers = {{api.headers | safe}};

    {{api.injectCode | safe}}

    return request<{{it.namespace}}.{{api.res}}>(
        url,
        {
            method: '{{api.method}}',
            {{ @if (api.params) }}params,{{ /if}}
            {{ @if (api.body) }}data,{{ /if}}
            {{ @if (api.paths) }}apiPath: '{{api.path}}',{{ /if}}
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {})
            },
        },
        '{{it.namespace}}'
    )
}
{{/each}}