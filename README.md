# google-translate-script
This script will help you translate your entire project using the Google Translate API ！

// 使用依赖包的方法进行使用
input: 
1. 给我需要翻译的文件路径。
2. todo: 如果给我相对路径，我需要自行转换为绝对路径。 get 
   1. eg: 
```js
const mdFile = path.join(__dirname, 'docs');
const allZhFilesName = glob.sync("*.zh.md", { cwd: mdFile, realpath: true });

```

output :
1. 输出的文件目录和 + 翻译后的后缀名
2. todo: 如果在指定的文件目录没有看到对应的文件，我需要自行创建文件。
eg:
```js
const outputDir = path.join(__dirname, 'docs');
const outputFileName = '*.en.md';
```

config:
1. 配置翻译的语言
2. 默认为 zh -> en
```js
const source = 'zh';
const target = 'en';
```

2. 原本的 html  是否保留
3. 默认为 true
```js
const isKeepHtml = true;
```

3. todo: 翻译部分内容忽略，可不做翻译，使用正则进行匹配
```js
const ignoreReg = [/<code>[\s\S]*?<\/code>/g]; // 忽略 code 标签内的内容
// true: 删除部分内容， false： 不翻译此内容
ignoreConfig(ignoreReg, true);
```

4. todo: 特殊情况处理，我们公司的情况 
```js
<embed src="docs/test.zh.md" />
// 翻译后
<embed src="docs/test.en.md" />
```
