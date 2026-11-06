# 万象仙途 v6.0.1

中文修仙互动小游戏，使用用户提供的 `wanxiang-github-pages.zip` 发布。与 `Wanxiang_Xiantu_v6.0.1.zip` 中 `dist/` 的全部 16 个文件逐一校验一致。

## 在线游玩

[打开万象仙途](https://luzlouis.github.io/ceshixiangmu/)

网页可以独立运行，不依赖 Claude.ai、ChatGPT 登录、AI API 或外部 CDN。字体、题库和脚本都在本仓库中。结果仅供娱乐。

## 部署与更新

GitHub Pages 使用 `main` 分支的 `/(root)` 目录发布，`.nojekyll` 用于直接发布静态文件。

更新时将新版本静态网页文件放在仓库根目录，保留 `index.html`、各 JS/CSS 文件和 `fonts/` 的相对位置，再提交到 `main`。不要把 ZIP 压缩包本身作为网页上传。

## 本地预览

无需安装依赖或构建，在仓库根目录运行：

```sh
python -m http.server 5173
```

然后打开 http://localhost:5173/ 。ES modules 需要通过 HTTP 访问。

## 访问说明

GitHub Pages 提供免费 HTTPS 网址，但中国大陆不同地区和运营商的实际访问速度与可达性需要测试，不保证稳定。长期面向大陆访问可将这些静态文件迁移到适合的托管平台，并按平台要求配置域名与备案。

存档保存在当前浏览器中，更换设备、浏览器或域名不会自动迁移进度。

## 验证

部署前，原始源码包附带的 14 项 Node.js 测试全部通过，覆盖题库、评分、存档、分享、合道与历练等逻辑。
