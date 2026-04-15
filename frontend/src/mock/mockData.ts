import type { PdfInfo } from '../types/omnidoc';

const uuid = () => Math.random().toString(36).slice(2, 10);

export function loadMockData(): PdfInfo[] {
  const page1Elements = [
    {
      category_type: 'title' as const,
      poly: [50, 30, 800, 30, 800, 80, 50, 80],
      order: 0,
      latex: '',
      html: '',
      markdown: '# OmniDocBench 1.0: 文档解析基准数据集',
      image_path: '',
    },
    {
      category_type: 'text' as const,
      poly: [50, 100, 800, 100, 800, 200, 50, 200],
      order: 1,
      latex: '',
      html: '',
      markdown: '本文档介绍了 OmniDocBench 1.0 数据集的构建方法，包括数据收集、标注流程、质量评估等方面。数据集包含多种文档类型，涵盖学术论文、财报、合同等。',
      image_path: '',
    },
    {
      category_type: 'figure' as const,
      poly: [50, 220, 380, 220, 380, 500, 50, 500],
      order: 2,
      latex: '',
      html: '',
      markdown: '',
      image_path: 'figure_1.png',
    },
    {
      category_type: 'figure_caption' as const,
      poly: [50, 510, 380, 510, 380, 550, 50, 550],
      order: 3,
      latex: '',
      html: '',
      markdown: '图 1：数据收集流程图',
      image_path: '',
    },
    {
      category_type: 'table' as const,
      poly: [400, 220, 800, 220, 800, 450, 400, 450],
      order: 4,
      latex: '',
      html: '<table>\n  <thead><tr><th>类型</th><th>数量</th><th>页数</th></tr></thead>\n  <tbody>\n    <tr><td>学术论文</td><td>2000万</td><td>5000万</td></tr>\n    <tr><td>金融文档</td><td>500万</td><td>500万</td></tr>\n    <tr><td>法律文档</td><td>300万</td><td>300万</td></tr>\n    <tr><td>政府报告</td><td>200万</td><td>100万</td></tr>\n    <tr><td>教材图书</td><td>500万</td><td>500万</td></tr>\n  </tbody>\n</table>',
      markdown: '',
      image_path: '',
    },
    {
      category_type: 'equation' as const,
      poly: [200, 580, 650, 580, 650, 650, 200, 650],
      order: 5,
      latex: '$$F_{1} = \\frac{{TP}}{{TP + FP}}, \\quad F_{0.5} = (1 + 0.5^2) \\cdot \\frac{{Precision \\cdot Recall}}{{0.5^2 \\cdot Precision + Recall}}$$',
      html: '',
      markdown: '',
      image_path: '',
    },
    {
      category_type: 'text' as const,
      poly: [50, 680, 800, 680, 800, 900, 50, 900],
      order: 6,
      latex: '',
      html: '',
      markdown: '## 数据质量评估\n\n我们采用多维度的质量评估体系来确保数据质量。主要评估维度包括：\n\n- **标注准确性**：通过交叉验证和人工抽查确保标注的准确性\n- **数据多样性**：使用聚类分析确保特征空间的充分覆盖\n- **难度分布**：依据 PP-OCRv5 甜区理论，优化训练数据的难度分布',
      image_path: '',
    },
    {
      category_type: 'header' as const,
      poly: [50, 10, 800, 10, 800, 25, 50, 25],
      order: 7,
      latex: '',
      html: '',
      markdown: 'OmniDocBench 1.0 数据集文档',
      image_path: '',
    },
    {
      category_type: 'footer' as const,
      poly: [50, 1170, 800, 1170, 800, 1190, 50, 1190],
      order: 8,
      latex: '',
      html: '',
      markdown: '第 1 页 / 共 3 页',
      image_path: '',
    },
  ];

  const page2Elements = [
    {
      category_type: 'text' as const,
      poly: [50, 30, 800, 30, 800, 150, 50, 150],
      order: 0,
      latex: '',
      html: '',
      markdown: '## 数据标注流程\n\n数据标注采用自动化加人工校验的方式。首先使用多个异构模型对数据进行自动标注，然后通过跨模型一致性验证（CMCV）进行难度分层。',
      image_path: '',
    },
    {
      category_type: 'equation' as const,
      poly: [150, 180, 700, 180, 700, 250, 150, 250],
      order: 1,
      latex: '$$D = \\sum_{{i=1}}^{{n}} {{w_i}} \\cdot d_i(x, y)$$',
      html: '',
      markdown: '',
      image_path: '',
    },
    {
      category_type: 'table' as const,
      poly: [50, 280, 800, 280, 800, 500, 50, 500],
      order: 2,
      latex: '',
      html: '<table>\n  <thead><tr><th>难度等级</th><th>置信度区间</th><th>处理方式</th></tr></thead>\n  <tbody>\n    <tr><td>简单</td><td>c > 0.97</td><td>无信息量，可降采样</td></tr>\n    <tr><td>中等（甜区）</td><td>0.95-0.97</td><td>最优训练样本，优先保留</td></tr>\n    <tr><td>偏难</td><td>0.90-0.95</td><td>保留，需验证标注</td></tr>\n    <tr><td>困难</td><td>c < 0.90</td><td>需人工介入或精炼</td></tr>\n  </tbody>\n</table>',
      markdown: '',
      image_path: '',
    },
    {
      category_type: 'text' as const,
      poly: [50, 530, 800, 530, 800, 750, 50, 750],
      order: 3,
      latex: '',
      html: '',
      markdown: '对于困难样本，采用 Judge-and-Refine 流水线进行标注增强：\n\n1. 将模型输出的 LaTeX 公式或 HTML 表格重新编译渲染为图像\n2. 渲染过程将细微结构错误放大为视觉显著异常\n3. 法官模型（Qwen3-VL-235B 级别）比对原文档和渲染图\n4. 定位并修正错误，重新渲染，迭代直至一致',
      image_path: '',
    },
    {
      category_type: 'figure' as const,
      poly: [50, 780, 800, 780, 800, 1100, 50, 1100],
      order: 4,
      latex: '',
      html: '',
      markdown: '',
      image_path: 'pipeline_diagram.png',
    },
  ];

  const page3Elements = [
    {
      category_type: 'text' as const,
      poly: [50, 30, 800, 30, 800, 250, 50, 250],
      order: 0,
      latex: '',
      html: '',
      markdown: '## 训练策略\n\n数据引擎产出的训练数据分为三个阶段用于模型训练：\n\n| 阶段 | 数据 | 目标 | 预期增益 |\n|------|------|------|----------|\n| 大规模预训练 | 6500万自动标注样本 | 建立全面基础能力 | +1.31 分 |\n| 硬样本微调 | 19万专家标注 + 回放数据 | 强化硬场景，防止遗忘 | 表格 +2.50 分 |\n| GRPO 对齐 | 阶段2模型采样生成 | 直接优化评测指标 | 公式 +0.81 分 |',
      image_path: '',
    },
    {
      category_type: 'table' as const,
      poly: [50, 280, 800, 280, 800, 500, 50, 500],
      order: 1,
      latex: '',
      html: '<table>\n  <thead><tr><th>元素类型</th><th>基础场景</th><th>长尾场景</th></tr></thead>\n  <tbody>\n    <tr><td>文本</td><td>单栏、多栏</td><td>竖排、艺术字、古籍</td></tr>\n    <tr><td>公式</td><td>行内公式</td><td>多行对齐、大括号、矩阵</td></tr>\n    <tr><td>表格</td><td>简单表格</td><td>嵌套表格、跨行跨列</td></tr>\n    <tr><td>图表</td><td>柱状图、饼图</td><td>流程图、架构图</td></tr>\n  </tbody>\n</table>',
      markdown: '',
      image_path: '',
    },
    {
      category_type: 'text' as const,
      poly: [50, 530, 800, 530, 800, 700, 50, 700],
      order: 2,
      latex: '',
      html: '',
      markdown: '## 总结\n\n本文档详细说明了 OmniDocBench 数据集的构建方法、标注流程和训练策略。通过数据引擎的持续运行，我们能够不断提高训练数据的质量和多样性，从而提升文档解析模型的性能。',
      image_path: '',
    },
    {
      category_type: 'footer' as const,
      poly: [50, 1170, 800, 1170, 800, 1190, 50, 1190],
      order: 3,
      latex: '',
      html: '',
      markdown: '第 3 页 / 共 3 页',
      image_path: '',
    },
  ];

  const addIds = (elements: PdfInfo['pdf_info']): PdfInfo => ({
    pdf_info: elements.map((e) => ({ ...e, id: uuid() })),
    page_info: { height: 1200, width: 850 },
  });

  return [addIds(page1Elements), addIds(page2Elements), addIds(page3Elements)];
}
