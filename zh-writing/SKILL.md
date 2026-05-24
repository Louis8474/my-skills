---
name: zh-writing
description: |
  中文写作、去 AI 味、润色、改写、翻译、审阅和作者风格复现的统一入口。
  当用户要求中文文本更自然、更像人写、保留原意改写、结构保真翻译、检查 AI 痕迹、
  或要求观点文/作者风格/good-writing 时使用。本技能会按任务路由到 de-ai-polish、
  author-style、neutral-cleanup 或 review-only 模式，避免多个写作 skill 抢触发。
allowed-tools:
  - Read
  - Write
  - Edit
  - AskUserQuestion
metadata:
  trigger: 中文写作、去 AI 味、润色、改写、翻译、审阅、作者风格复现
  sources: Humanizer-zh; OUBIGFA De-AI Prompt Enhancer Writer Booster
---

# zh-writing

这是中文写作处理的单入口技能。先判断任务模式，再只读取必要参考文件；不要把全部参考资料一次性塞进上下文。

## 路由优先级

1. 用户显式指定模式或关键词。
2. 根据文本体裁、用途和交付要求判断。
3. 默认走 `de-ai-polish`。

## 模式选择

- `de-ai-polish`：默认模式。用于中文润色、保留原意改写、非第一人称稿件、结构保真翻译、普通去 AI 味。读取 `references/de-ai-writing/SKILL.md`；翻译任务再读 `references/de-ai-writing/references/translation-guardrails.md`。
- `author-style`：用户明确要求“作者风格”“观点文”“更有笔力”“good-writing”“像某个作者”或强表达时使用。读取 `references/good-writing/SKILL.md`，并按其中说明读取 `style-dna.md` 和 `writing-samples.md`。
- `neutral-cleanup`：用于百科、说明书、产品文档、技术文档、学术摘要、正式材料。读取 `references/neutral-humanizer.md`；只删 AI 腔和空话，不注入强观点、第一人称或文学化表达。
- `review-only`：用户明确要求检查、评分、找 AI 痕迹、审稿、列问题时使用。读取 `references/de-ai-writing/references/ai-trace-detector.md` 或 `references/neutral-humanizer.md`，只输出审阅结论，不擅自全文改写。

如果同一请求同时包含改写和审阅，按用户最后的交付要求决定；不确定时先给成稿，少量说明只在用户要求时附上。

## 默认交付

- 改写、润色、翻译：只输出最终正文，不输出流程、清单、自检记录或内部路由解释。
- 审阅、评分：输出 Top 5-10 个最影响读感的问题，每条包含命中片段和一句修法。
- 不输出完整黑名单、逐项自检或来源规则摘抄，除非用户明确要求。
- 代码、路径、URL、命令、参数、版本号、引用文本和 Markdown 结构按原文保留，除非用户要求重排。

## 保真边界

- 默认不新增事实、数据、案例、引用、来源和结论。
- 默认不删除原文核心论证链，不把强观点磨成中性说明，也不把正式文本改成散文。
- 只有用户明确允许“自由改写”“重组”“扩写”“可以增删”时，才重排结构、补观点或增强表达。
- 发现原文存在事实缺口时，用限定表达降级，不编造权威来源。

## 模式细则

### de-ai-polish

目标是保留原意、保留信息厚度、保留作者判断，只修掉让读者意识到“这是模型在组织答案”的结构痕迹。优先处理路标词、二分对照壳、冒号提纲、讲义腔、伪口语化动作、AI 隐喻和模板收尾。不要为了清零词表把文章改薄。

### author-style

目标是复现特定作者的中文写作风格。作者风格与“更干净”冲突时，作者风格优先；宁可保留一点锋利判断，不要改成四平八稳的说明书。必须按 `references/good-writing/SKILL.md` 的流程读取风格资料。

### neutral-cleanup

目标是中性、清楚、具体。删除夸大意义、宣传腔、泛泛归因、AI 高频词、三段式列举、否定式排比、过度粗体、表情符号、协作残留和知识截止免责声明。输出应像可靠编辑整理过的文本，而不是观点文。

### review-only

目标是指出最值得修的地方，不做全量词表审判。按影响排序，最多 10 条；优先抓会损害成稿的结构和语气问题。除非用户要求，审阅报告后不要顺手给全文改写版。

## 参考文件

- `references/de-ai-writing/SKILL.md`：默认去 AI 味、润色、翻译和审阅流程。
- `references/good-writing/SKILL.md`：作者风格复现和强观点写作流程。
- `references/neutral-humanizer.md`：中性去 AI 写作检测体系，适合正式、技术、百科和产品文本。
- `references/de-ai-writing/references/translation-guardrails.md`：结构保真翻译护栏。
- `references/de-ai-writing/references/ai-trace-detector.md`：AI 痕迹检测与修法。
