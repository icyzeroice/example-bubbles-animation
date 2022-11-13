# emopop

## 简介

使用 `yarn` 和 `yarn workspace` 工具链来管理依赖和本地拆包。

需要确保 `nodejs`, `npm`, `corepack` 等工具在系统环境中存在，才能完整开发此项目。

## 快速启动

安装依赖：

```shell
cd example-bubbles-animation

yarn install
```

开发模式（此模式下改代码立刻生效，自动运行）：

```shell
yarn workspace app run dev
```

部署模式（此模式下运行性能更高）：

```shell
# 编译项目代码
yarn workspace emopop run build

# 运行编译后的代码
yarn workspace emopop run serve
```


## 特性配置

一些主要的可配置项参数都在 `packages/emopop/src/context.ts` 文件中，可看注释释意按需更改。