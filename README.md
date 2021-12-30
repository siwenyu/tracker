# MTUTT Tracker

## 简介

用于从前端应用运行时中统计 UTT 需要的数据。目前包含 应用访问、使用时长、异常上报、Http 请求错误、页面初始化性能 等指标

## 接入方式

### 引入脚本


## 开发

### 项目信息
### 开始开发

开始前需要安装依赖

```
$ tnpm i
```

### 本地开发调试

修改 `webpack.config` （tracker-test01是测试工程）: 

```
  output: {
    // path: path.resolve(__dirname, './build'),
    path: path.resolve(__dirname, '../tracker-test01/'),
    filename: 'log.js'
  },
```

修改测试工程 `tracker-test01/src/index.html`：

```
<head>
<script>
    window.GlobalConfig = {
      ...
    }

    window.uttConfig = {
      ...
    };
  </script>
<head>
<body>
    ...
    <script src="../log.js"></script>
</body>
```

本地运行 `tracker-test01`。

Tracker测试log：url添加参数：clueTrackerDebug=true 开启log模式。


### 发布方式

使用 webpack 打包后发布。发布文件为单独 log 脚本文件。

- 构建命令

```
$ tnpm run build
```

- 发布
如上def地址；

### 项目结构

#### src 目录

- plugins: 来自于 clue tracker 的 plugin 功能，未修改
  - Interface: hack Http 请求方法以捕捉 http 请求的异常情况
  - Performance: 根据浏览器接口数据，统计页面加载性能
  - Script: 资源分析，内测中，暂未使用
- utils: 在监控埋点过程中依赖的一些工具方法，具体不做详细描述，可以每个单独看。推荐优先使用已有方法
- index.js: 脚本文件
- Tracker.js: clue 采集脚本，添加了外部上报的配置项，会按照 mtutt-appCode 的格式上报 clue，并调用外部上报的方法上报 utt 日志

#### utt 脚本简述

脚本在启动后自动开始监控，所有日志会上报到 `/cro-xt.utt-platform.log` 的黄金令箭空间下。仅非日常预发域名会做上报

在 Uniface 插拔式应用中，还会监听 hash 变更来判断是否发生子应用切换，来将访问与异常数据上报到不同子应用空间下。




