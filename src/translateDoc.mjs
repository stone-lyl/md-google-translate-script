/**
 * 中翻英，全文整体翻译脚本
 * 对文章进行全文翻译，类似打开页面，直接使用 google 进行全文翻译。
 * 优点：1. 使用高级翻译API，词库更全。 2. 全文翻译，有上下文，翻译更准确。
 * code (```ts) 和 inlineCode (`inline`) 无法进行翻译。
 * 可以修改 mdFile 文件夹名称，对指定的文件夹或者文件进行翻译。
 * 只要本地环境配置了 google translate API key，运行：node ./script/translationHtml.mjs  可以使用。
 */
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype, { defaultHandlers as mdDefaultHandlers } from 'remark-rehype'
import rehypeDocument from 'rehype-document'
import rehypeFormat from 'rehype-format';
import remarkGfm from 'remark-gfm';
import rehypeStringify from 'rehype-stringify'
import remarkStringify from 'remark-stringify';
import rehypeParse from 'rehype-parse'
import rehypeRemark, { defaultHandlers } from 'rehype-remark'
import fs from "fs";
import path, { dirname } from 'path';
import { fileURLToPath } from "url";
import { default as glob } from 'glob';
import { toHtml } from 'hast-util-to-html'
import { TranslationServiceClient } from "@google-cloud/translate";
import * as dotenv from "dotenv";

dotenv.config();

console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'process.env.GOOGLE_APPLICATION_CREDENTIALS');
console.log(process.env.projectId)

/**
 * todo: keep your html
 * <tag foo="bar"> -> <tag data-mdast="html" foo="bar">
 * @param {string} value
 */
function addAttrIntoHtml(value) {
  return value.replace(/^<(\w+)/, '<$1 data-mdast="html"');
}

/**
 * 去掉文件头部的 yaml,
 * e.g.
 * ---
 * title: <title>
 * order: <order>
 * ---
 * @type {RegExp}
 */
const yamlHeaderRegx = /---[\s\S]*?---/;

/**
 * @param content
 * @return {*}
 */
function removeFileHead(content) {
  return content.replace(yamlHeaderRegx, '');
}

const mdToHtml = async (filePath, isKeepHtml) => {
  const getCode = (h, node) => {
    // google translate sb, 会吞掉 code 中的空格，所以，将空格替换成 &nbsp;
    node.value = node.value.replace(/ /g, '&nbsp;');
    return mdDefaultHandlers.code(h, node);
  };

  const remarkRehypeSettings = isKeepHtml ? {
    allowDangerousHtml: true,
    handlers: {
      code: getCode,
      html: (h, node) => {
        node.value = addAttrIntoHtml(node.value);
        return mdDefaultHandlers.html(h, node);
      }
    }
  } : {
    handlers: {
      code: getCode
    }
  }
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(rehypeDocument)
    .use(rehypeFormat)
    .use(remarkRehype, remarkRehypeSettings)
    .use(rehypeStringify, { allowDangerousHtml: true });

  // todo: maybe need one hook
  const content = removeFileHead(fs.readFileSync(filePath, 'utf8'));
  const file = await processor
    .process(content);

  return String(file);
}

/**
 * 将中文的HTML 翻译成 英文的HTML
 * @return {Promise<html[]>}
 * @param originalHtml
 * @param mimeType
 */
export const getTranslatedText = async (originalHtml, mimeType = 'text/html') => {
  // 项目统一信息
  const projectId = process.env.projectId ?? 'crested-sunup-368006'; // 'write your projectId';
  const location = 'global';
  const targetLanguageCode = 'en';
  const translationClient = new TranslationServiceClient();
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    // 因为 google translate 会忽略 \n ，所以这里需要把 \n 替换成 'ų'
    contents: originalHtml.map(it => it.replace(/\n/g, 'ų')),
    mimeType, // mime types: text/plain, text/html
    sourceLanguageCode: 'zh',
    targetLanguageCode,
  };
  let result = [];
  try {
    // Run request
    const [ response ] = await translationClient.translateText(request);
    // console.log(response, 'response');
    for (const translation of response.translations) {
      result.push(translation.translatedText.replace(/ų/g, '\n'));
    }
  } catch (error) {
    console.log(error, 'request error');
    console.log('error path', currentPathName);
  }
  return result;
}

/**
 * todo: hook ?
 * 为了保留以前的英语文档头部的 yaml，因为在目录中有使用到
 * @param writePath
 * @param file
 * @return {string}
 */
function getEnFileContent(writePath, file) {
  // 如果文件不存在，就直接返回
  if (!fs.existsSync(writePath)) {
    return String(file);
  }
  const readFileContent = fs.readFileSync(writePath, {
    encoding: 'utf8',
  });
  const yamlHeader = readFileContent.match(yamlHeaderRegx);
  if (yamlHeader?.[0]) {
    return yamlHeader?.[0] + '\n\n' + String(file);
  }
  return String(file);
}

const HtmlToMd = async (html, writePath) => {
  // 当一个 html 标签，带有 data-mdast="html" 属性时，不会被转换成 md
  const getCustomHandler = (type, h, node) => {
    if (node.properties && node.properties.dataMdast === 'html') {
      console.log(node.properties, 'node.properties');
      node.properties.dataMdast = undefined;
      let value = toHtml(node, { space: 'html' });
      if (type === 'embed') {
        // embed 时，没有后闭合标签，所以需要手动添加
        value = value.replace(/zh.md/g, 'en.md') + '</embed>';
      }
      return h(node, 'html', value);
    }
    return defaultHandlers[type](h, node);
  };

  const translateIgnore = [ 'img', 'playground', 'embed', 'table' ];
  const customHandlers = {};
  translateIgnore.forEach(it => {
    customHandlers[it] = (h, node) => getCustomHandler(it, h, node);
  });

  const file = await unified()
    .use(rehypeParse)
    .use(remarkGfm)
    .use(rehypeRemark, {
      handlers: {
        pre: (h, node) => {
          // 有点 hack 的方式，因为 translate API 会吞掉 code 中的空格。
          // 所以，在翻译前，将 code 中的空格替换成 &nbsp;，翻译后，再替换回来
          node.children[0].value = node.children[0].value === ' ' ? '' : node.children[0].value;
          if (node.children[1]) {
            node.children[1].children[0].value = node.children[1].children[0].value.replace(/&nbsp;/g, ' ');
          } else {
            debugger;
          }
          return defaultHandlers.pre(h, node);
        },
        ...customHandlers,
      }
    })
    .use(remarkStringify)
    .process(html)

  const content = getEnFileContent(writePath, file);
  console.log('content', content);

  fs.writeFileSync(
    writePath,
    content,
    'utf8',
  );
  console.log(`${writePath} written`);
}

// 总有一些文件风格迥异，报错了后需要单独处理一下
const errorFilePath = [];


/**
 *
 * @param {{ fileName: string, sourceSuffix: string }} params
 * @returns {*}
 */
function getAllFilesPath(params) {
  const { fileName, sourceSuffix = '.md' } = params;
  console.log(params, 'params');
  const __dirname = params.dirname ?? dirname(fileURLToPath(import.meta.url));
  const mdPath = path.resolve(__dirname, fileName);
  console.log(mdPath, 'mdPath');
  return glob.sync(`*${sourceSuffix}`, { cwd: mdPath, realpath: true });
}

/**
 * {{
 *  fileName: string;
 *  dirName: string; // 生成的文件夹名称
 *  targetSuffix: string; // 目标文件后缀 e.g. .en.md
 *  sourceSuffix: string; // 源文件后缀 e.g. .zh.md
 *  isKeepHtml: boolean; // 是否保留 html 标签
 *  projectInfo: {
 *    projectId: string;
 *    GOOGLE_APPLICATION_CREDENTIALS: string;
 *  }
 *  } } params
 * @returns {Promise<void>}
 * @param params
 */
// todo-zc: 我觉得需要一些全局的变量：
let currentPathName = '';
export const translateDoc = async (params) => {
  const allFilesPath = getAllFilesPath(params);

  const allAsyncTask = allFilesPath.map(async (pathName) => {
    try {
      currentPathName = pathName;
      const html = await mdToHtml(pathName, params.isKeepHtml);
      console.log(html, 'html');

      const htmlEn = await getTranslatedText([ html ]);
      console.log(htmlEn, 'htmlEn');

      const writePath = pathName.replace('.zh', '.en');
      await HtmlToMd(htmlEn[0], writePath);
    } catch (e) {
      console.error(pathName, 'error');
      errorFilePath.push(pathName);
      console.error(e)
    }
  });

  await Promise.all(allAsyncTask);
  console.log('error file path', errorFilePath);
  process.exit(0);

}

export default translateDoc;
