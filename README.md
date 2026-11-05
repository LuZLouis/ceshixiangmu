# 万象仙途

从日常选择出发，穿越六界，走出自己的修行之道。中文幻想互动故事，结果用于娱乐与自我探索。

## 已有内容

- 人、妖、鬼、魔、仙、神六方界域，16 条修途，8 种行事风格。
- 120 个原创场景、480 个选项与后果；每局 6 道日常题、14 道剧情题，七章内按顺序呈现。
- 行囊、灵石分配、道誓三场互动。
- 16 位完整卡通人物、PNG 名帖、自动存档与最近 12 次道途。

## 运行

项目为纯静态 HTML、CSS、JavaScript ES modules，不需要构建或安装运行依赖。

```bash
python3 -m http.server 5173 --directory dist
```

打开 `http://localhost:5173`。也可使用已有 IDE 的静态预览功能。Windows 可将 `python3` 换成 `py`。

检查题库、评分、存档及职业可达性，需要 Node.js（首版以 Node 24 验证）：

```bash
npm test
```

## GitHub Pages

本仓库提供 `.github/workflows/pages.yml`。在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。然后在 Actions 中运行 **Deploy Wanxiang Xiantu**。后续推送到 `main` 会检查并发布 `dist/`。

工作流成功后的访问地址以 Actions 的 `github-pages` 部署结果为准。GitHub Pages 是备用托管，不保证中国大陆各地区、运营商的可达性或速度。

## 国内部署

只需把 `dist/` 内的文件及 `assets/` 上传到静态网站托管或 Web 服务器，首页设置为 `index.html`，开启 HTTPS。题库、图片、样式和评分均在本地文件中，没有外部字体、CDN 脚本或 AI API 运行依赖。

面向中国大陆长期服务，可考虑国内云的静态托管与自有域名。中国内地资源的备案要求应按服务商现行规则办理；香港等境外托管的大陆访问体验需要实际测试。对象存储的默认域名可能只触发 HTML 下载，通常需要绑定自定义域名。

- [腾讯云 COS 静态网站](https://cloud.tencent.com/document/product/436/32670)
- [阿里云 OSS 静态网站](https://www.alibabacloud.com/help/zh/oss/user-guide/hosting-static-websites)

## 与 Claude / Codex 协作

让工具读取 `CLAUDE.md` 与 `README-world.md`，在独立分支修改并提交 Pull Request。合并到 `main` 后由 Pages 工作流发布。修改题库或评分时保留有效的检查；改变存档结构时处理旧数据兼容。

原 ChatGPT Site 仍独立运行：https://wanxiang-xiantu.big-potato-bro.chatgpt.site 。本仓库的修改不会自动发布到那个地址。

## 主要文件

| 文件 | 内容 |
| --- | --- |
| `dist/app.js` | 页面、交互、导出和道途册 |
| `dist/style.css` | 桌面与手机样式 |
| `dist/catalog.js` | 类别、人物与互动定义 |
| `dist/questions.js` | 题库与章节导语 |
| `dist/engine.js` | 抽题、评分、存档校验 |
| `dist/assets/` | 人物图集 |
| `tests/engine.test.mjs` | 功能检查 |

详细设定见 `README-world.md`。`QA.md` 为初版历史验收记录。进度仅存在当前浏览器，清除浏览器数据或更换域名不会自动迁移。
