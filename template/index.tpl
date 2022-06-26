/**
 * ------------------------------------
 * !!! 不要修改,这是生成的代码 !!!
 * ------------------------------------
 */
{{@each(it.fileList) => val}}
import * as {{val}} from './{{val}}'
{{/each}}

export {
    {{@each(it.fileList) => val}}
    {{val}},
    {{/each}}
}