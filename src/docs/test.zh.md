---
title: 绘图属性
order: 3
redirect_from:

- /en/docs/api

---

S2 使用 [AntV/G](https://g.antv.vision/zh/docs/guide/introduce) 作为绘图引擎。一些图形的样式配置，如单元格的 `fill` 属性，`stroke`
属性，以及绘制字体的 `fontFamily` 和 `fontSize` 等，都是直接透传 [AntV/G 的绘图属性](https://g.antv.vision/zh/docs/api/shape/attrs)。

这里对 S2 常用的绘图属性进行简单介绍：

示例：

```ts
// 使用渐变色填充，渐变角度为 0，渐变的起始点颜色 #95F0FF，结束的渐变色为 #3A9DBF
fill: `l(0) 0:#95F0FF 1:#3A9DBF`
```

## html 标签效果：

<embed type="video/quicktime" width="640" height="480">

<embed src="@/docs/common/header.zh.md"></embed>

<br>

<br/>

<Playground path='react-component/header/demo/default.tsx' rid='container' height='400'></Playground>

<playground path='react-component/header/demo/default.tsx' rid='container' height='400'></playground>

<img alt="preview" src="https://gw.alipayobjects.com/zos/antfincdn/gCsPi6N0x/c31897c4-80f4-4ae6-b562-0c19fedcd34e.png" width="400">

## 配置纹理

用特定的纹理填充图形。纹理内容可以直接是图片或者 Data URLs。

<img alt="radial" src="https://gw.alipayobjects.com/zos/rmsportal/NjtjUimlJtmvXljsETAJ.png" width="600">

* `p`表示使用纹理，即 *pattern*，绿色的字体为变量，可自定义
* 重复方式有以下 4 种：
    * `a`: 该模式在水平和垂直方向重复
    * `x`: 该模式只在水平方向重复
    * `y`: 该模式只在垂直方向重复
    * `n`: 该模式只显示一次（不重复）

示例：

```ts
fill: 'p(a)https://gw.alipayobjects.com/mdn/rms_d314dd/afts/img/A*58XjQY1tO7gAAAAAAAAAAABkARQnAQ';
```

## 配置线段样式

| 属性名        | 类型              | 功能描述                                                                                                   |
| ------------- | ----------------- | ------------------------------------------------------------------------------------------------------ |
| stroke        | `string`          | 线段颜色，支持 [渐变色配置](#配置渐变色） ，[纹理配置](#配置纹理)                                                |
| lineWidth     | `number`          | 线段宽度                                                                                                   |
| lineDash      | `[number,number]` | 线段虚线配置，第一个值为虚线每个分段的长度，第二个值为分段间隔的距离|
| opacity       | `number`          | 线段透明度                                                                                                 |
| shadowColor   | `string`          | 线段阴影颜色                                                                                               |
