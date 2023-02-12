# google-translate-script

## 介绍

使用 google-translate-api 将整篇 A 语言 Markdown 文件翻译成 B 语言的 Markdown。 A、B 语言为 google-translate-api 支持的翻译语言。
This script will help you translate your entire project using the Google Translate API ！

## 安装

```shell
$ npm install @stone-lyl/google-translate-script -D
$ yarn add @stone-lyl/google-translate-script -D
```

## 使用

> 本脚本前提，需在本地配置好 google-translate-api
> 的使用环境，具体可参考 [google-translate-api](https://cloud.google.com/docs/authentication/application-default-credentials)

```js
import translateDoc from "@stone-lyl/google-translate-script";
import { fileURLToPath } from "url";
import { toHtml } from 'hast-util-to-html'

translateDoc({
  fileName: fileName, // 绝对路径
  dirname: fileURLToPath(import.meta.url),
  sourceSuffix: '.zh.md', // 源文件后缀
  targetSuffix: '.en.md', // 目标文件后缀
  projectInfo: {
    projectId: '<your project id>', // 替换成你的 Google-translate-API 的 projectId，也可将 projectId 存入本地环境变量中，脚本会去读取。
  },
  isKeepHtml: true, // 是否保留 html 标签
  /**
   * 对部分 HTML 标签进行特殊处理
   * <embed src="docs/test.zh.md"/> 翻译后 <embed src="docs/test.en.md"/>
   */
  customHtmlCallBack: (type, h, node) => {
    if (type !== 'embed') {
      return;
    }
    // embed 时，没有后闭合标签，所以需要手动添加
    if (node.properties && node.properties.dataMdast === 'html') {
      node.properties.dataMdast = undefined;
      let value = toHtml(node, { space: type });
      if (type === 'embed') {
        value = value.replace(/zh.md/g, 'en.md') + '</embed>';
      }
      return h(node, 'html', value);
    }
  }
});
```

## API 说明

### fileName
被翻译文件的文件名

### dirname
被翻译文件的文件夹路径

### sourceSuffix
被翻译文件的后缀名

### targetSuffix
翻译后文件的后缀名

### projectInfo
google-translate-api 的配置信息，具体可参考 [google-translate-api](https://cloud.google.com/docs/authentication/application-default-credentials)

### isKeepHtml
是否保留 Markdown 中原有的 html 标签
e.g.:
```md
## 介绍

<img src="https://im000.png" width="100" height="100" />
```
翻译后：
```md
## Introduction
<img src="https://im000.png" width="100" height="100" />
```

### customHtmlCallBack
对部分 HTML 标签进行特殊处理
**options**
- type 标签类型
- h 处理特定元素的方法
- node 需要转换的元素信息，[详情可查看](https://github.com/syntax-tree/hast#element)

e.g.:
```js
customHtmlCallBack: (type, h, node) => {
  if (type !== 'embed') {
    return;
  }
  // embed 时，没有后闭合标签，所以需要手动添加
  if (node.properties && node.properties.dataMdast === 'html') {
    node.properties.dataMdast = undefined;
    let value = toHtml(node, { space: type });
    if (type === 'embed') {
      value = value.replace(/zh.md/g, 'en.md') + '</embed>';
    }
    return h(node, 'html', value);
  }
}
```
翻译前：
```md
## 介绍
<embed src="docs/test.zh.md"/>
```
翻译后：
```md
## Introduction
<embed src="docs/test.en.md"/>
```

## TODO
1. todo: 翻译部分内容忽略，可不做翻译，使用正则进行匹配

```js
const ignoreReg = [ /<code>[\s\S]*?<\/code>/g ]; // 忽略 code 标签内的内容
// true: 删除部分内容， false： 不翻译此内容
ignoreConfig(ignoreReg, true);
```
