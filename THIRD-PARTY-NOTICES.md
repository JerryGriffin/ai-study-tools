# Third-Party Notices · 第三方组件说明

本项目（AI Study Tools）本身采用专有许可证，详见 [LICENSE](LICENSE)。以下第三方组件仍适用其各自许可证；这些许可证仅适用于对应组件，不影响本项目其余部分的专有性质。

## KaTeX

- 用途：本地数学公式排版。
- 位置：`calculus-tutor/vendor/katex/`、`k12-verifier/vendor/katex/`。
- 许可证：MIT License。
- 许可证全文：`vendor/katex/LICENSE`。
- 项目主页：<https://katex.org/>

## Tesseract.js

- 用途：GitHub Pages 在线版在浏览器内做 OCR。
- 分发方式：运行时从 jsDelivr CDN 加载，不随本项目打包。
- 许可证：Apache License 2.0。
- 项目主页：<https://github.com/naptha/tesseract.js>

## Tesseract OCR 语言数据（chi_sim / eng）

- 用途：浏览器内中文、英文 OCR 语言模型。
- 位置：`ocr/chi_sim.traineddata.gz`、`ocr/eng.traineddata.gz`。
- 来源：`@tesseract.js-data/chi_sim`、`@tesseract.js-data/eng`，基于 `tesseract-ocr/tessdata_fast`。
- 许可证：Apache License 2.0。
- 许可证全文：`ocr/LICENSE`。
- 上游项目：<https://github.com/tesseract-ocr/tessdata_fast>

## edu-llm / 学序（教材辅导模块）

- 用途：教材章节浏览、知识点检索与辅导界面。
- 位置：`textbook-tutor/`。
- 来源：<https://github.com/Hex1um/edu-llm>
- 许可证：MIT License。
- 版权：Copyright (c) 2026 edu-llm contributors。
- 许可证全文与修改说明：`textbook-tutor/LICENSE`、`textbook-tutor/NOTICE.md`。
- 说明：该目录中源自 edu-llm 的代码与内容仍按 MIT 提供；AI Study Tools 的其他部分仍为专有许可。

## 第三方模型与服务

Kilo、Pollinations、OpenCode 以及任何用户自行配置的 OpenAI 兼容服务均为独立第三方服务，适用其各自的服务条款与隐私政策。本项目不重新分发这些服务的模型权重。

## 说明

如果你再分发本项目（在取得版权人书面许可后），必须保留上述第三方版权与许可证声明。
