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

启动 v1 版本：

```shell
yarn workspace app run dev
```

启动 v2 版本：

```shell
yarn workspace emopop run dev
```

## TODO

- [x] 相同颜色球的合并
- [x] 长时间未参与合并的球消逝
- [x] 球大小的初始化
- [x] 边合成边上升
- [x] 球消失特效
- [ ] 相同颜色球之间存在引力
- [ ] 球融合的特效
- [ ] 性能优化
