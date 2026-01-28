/**
 * LLM 模型配置
 * 支持多厂商模型选择
 */

export interface ModelInfo {
  id: string
  name: string
  displayName: string
  description: string
  contextWindow: number
  releaseDate?: string // 发布时间，格式：YYYY-MM-DD
  pricing?: {
    input: string
    output: string
  }
  recommended?: boolean
}

export interface ModelProvider {
  id: string
  name: string
  logo: string
  description: string
  website: string
  models: ModelInfo[]
}

export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    id: 'qwen',
    name: '通义千问 (Qwen)',
    logo: 'https://sf-maas-uat-prod.oss-cn-shanghai.aliyuncs.com/Model_LOGO/Tongyi.svg',
    description: '阿里云通义大模型体系，全尺寸、全模态、多场景',
    website: 'https://qwenlm.com',
    models: [
      {
        id: 'Qwen/Qwen2.5-7B-Instruct',
        name: 'Qwen2.5-7B-Instruct',
        displayName: 'Qwen 2.5 (7B) - 推荐',
        description: '通义千问 2.5，7B 参数，平衡性能与成本的最佳选择，支持 32K 上下文',
        contextWindow: 32768,
        releaseDate: '2024-09-01',
        pricing: {
          input: '¥0.35/百万tokens',
          output: '¥0.35/百万tokens',
        },
        recommended: true,
      },
      {
        id: 'Qwen/Qwen2.5-14B-Instruct',
        name: 'Qwen2.5-14B-Instruct',
        displayName: 'Qwen 2.5 (14B)',
        description: '通义千问 2.5，14B 参数，更强的理解和生成能力，适合中等复杂度任务',
        contextWindow: 32768,
        releaseDate: '2024-09-01',
        pricing: {
          input: '¥0.70/百万tokens',
          output: '¥0.70/百万tokens',
        },
      },
      {
        id: 'Qwen/Qwen2.5-32B-Instruct',
        name: 'Qwen2.5-32B-Instruct',
        displayName: 'Qwen 2.5 (32B)',
        description: '通义千问 2.5，32B 参数，专业级推理能力，在编码和数学任务上表现优异',
        contextWindow: 32768,
        releaseDate: '2024-09-01',
        pricing: {
          input: '¥1.26/百万tokens',
          output: '¥1.26/百万tokens',
        },
      },
      {
        id: 'Qwen/Qwen2.5-72B-Instruct',
        name: 'Qwen2.5-72B-Instruct',
        displayName: 'Qwen 2.5 (72B) - 旗舰',
        description: '通义千问 2.5，72B 参数，旗舰级性能，适合复杂推理和专业任务',
        contextWindow: 32768,
        releaseDate: '2024-09-01',
        pricing: {
          input: '¥4.13/百万tokens',
          output: '¥4.13/百万tokens',
        },
      },
      {
        id: 'Qwen/Qwen3-VL-32B-Instruct',
        name: 'Qwen3-VL-32B-Instruct',
        displayName: 'Qwen3-VL (32B) - 多模态旗舰',
        description: 'Qwen3 视觉语言模型旗舰版，支持百万像素级高分辨率图像，多模态理解能力领先',
        contextWindow: 262144,
        releaseDate: '2025-10-21',
        pricing: {
          input: '¥1.00/百万tokens',
          output: '¥4.00/百万tokens',
        },
      },
      {
        id: 'Qwen/Qwen3-VL-8B-Instruct',
        name: 'Qwen3-VL-8B-Instruct',
        displayName: 'Qwen3-VL (8B) - 多模态',
        description: 'Qwen3 视觉语言模型，支持高清图像理解、多语言 OCR 和视觉对话',
        contextWindow: 262144,
        releaseDate: '2025-10-15',
        pricing: {
          input: '¥0.50/百万tokens',
          output: '¥2.00/百万tokens',
        },
      },
    ],
  },
  {
    id: 'glm',
    name: '智谱 GLM',
    logo: 'https://sf-maas-uat-prod.oss-cn-shanghai.aliyuncs.com/Model_LOGO/zhipu.svg',
    description: '智谱 AI 通用大模型系列，中文理解与生成能力突出',
    website: 'https://www.zhipuai.cn',
    models: [
      {
        id: 'zai-org/GLM-4.7',
        name: 'GLM-4.7',
        displayName: 'GLM-4.7 - 最新旗舰',
        description: '智谱新一代旗舰模型，355B 总参数，32B 激活参数，在通用对话、推理和智能体能力方面全面升级',
        contextWindow: 198000,
        releaseDate: '2025-12-22',
        pricing: {
          input: '¥4.00/百万tokens',
          output: '¥16.00/百万tokens',
        },
        recommended: true,
      },
      {
        id: 'zai-org/GLM-4.6V',
        name: 'GLM-4.6V',
        displayName: 'GLM-4.6V - 多模态',
        description: 'GLM-4.6 视觉版本，视觉理解精度达到同参数规模 SOTA，支持 128K 视觉上下文',
        contextWindow: 131072,
        releaseDate: '2025-12-08',
        pricing: {
          input: '¥1.00/百万tokens',
          output: '¥3.00/百万tokens',
        },
      },
      {
        id: 'zai-org/GLM-4.6',
        name: 'GLM-4.6',
        displayName: 'GLM-4.6',
        description: '智谱 GLM-4.6，200K 上下文窗口，在代码基准测试和智能体任务中表现优异',
        contextWindow: 198000,
        releaseDate: '2025-09-30',
        pricing: {
          input: '¥3.50/百万tokens',
          output: '¥14.00/百万tokens',
        },
      },
      {
        id: 'zai-org/GLM-4-9B-Chat',
        name: 'GLM-4-9B-Chat',
        displayName: 'GLM-4 (9B)',
        description: '智谱 GLM-4 开源版本，90 亿参数，中英文综合性能相比前代提升 40%',
        contextWindow: 131072,
        releaseDate: '2024-06-06',
        pricing: {
          input: '¥0.50/百万tokens',
          output: '¥2.00/百万tokens',
        },
      },
    ],
  },
  {
    id: 'kimi',
    name: 'Kimi (Moonshot AI)',
    logo: 'https://sf-maas-uat-prod.oss-cn-shanghai.aliyuncs.com/Model_LOGO/moonshotai_new.png',
    description: 'Moonshot AI 打造的通用大模型，聚焦长上下文理解与高质量推理',
    website: 'https://www.moonshot.cn',
    models: [
      {
        id: 'moonshotai/Kimi-K2-Thinking',
        name: 'Kimi-K2-Thinking',
        displayName: 'Kimi K2 Thinking - 思考模型',
        description: '最新强大的开源思考模型，支持 256K 上下文，在复杂推理和多步工具调用中表现卓越',
        contextWindow: 262144,
        releaseDate: '2025-11-07',
        pricing: {
          input: '¥4.00/百万tokens',
          output: '¥16.00/百万tokens',
        },
        recommended: true,
      },
      {
        id: 'moonshotai/Kimi-K2-Instruct-0905',
        name: 'Kimi-K2-Instruct',
        displayName: 'Kimi K2 Instruct',
        description: 'Kimi K2 指令版本，长上下文处理能力强，适合知识检索和复杂问答场景',
        contextWindow: 262144,
        releaseDate: '2025-09-05',
        pricing: {
          input: '¥3.50/百万tokens',
          output: '¥14.00/百万tokens',
        },
      },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    logo: 'https://sf-maas-uat-prod.oss-cn-shanghai.aliyuncs.com/Model_LOGO/DeepSeek.svg',
    description: '深度求索团队打造，面向高强度推理与复杂应用的通用大模型',
    website: 'https://www.deepseek.com',
    models: [
      {
        id: 'deepseek-ai/DeepSeek-V3.2',
        name: 'DeepSeek-V3.2',
        displayName: 'DeepSeek V3.2 - 最新',
        description: 'DeepSeek 最新版本，671B 参数，高计算效率与卓越推理能力，在 IMO 和 IOI 中取得金牌表现',
        contextWindow: 163840,
        releaseDate: '2025-12-01',
        pricing: {
          input: '¥2.00/百万tokens',
          output: '¥3.00/百万tokens',
        },
        recommended: true,
      },
      {
        id: 'deepseek-ai/DeepSeek-V3',
        name: 'DeepSeek-V3',
        displayName: 'DeepSeek V3',
        description: 'DeepSeek V3，671B 参数，在数学、代码类评测中超过 GPT-4.5',
        contextWindow: 163840,
        releaseDate: '2025-03-24',
        pricing: {
          input: '¥2.00/百万tokens',
          output: '¥8.00/百万tokens',
        },
      },
      {
        id: 'deepseek-ai/DeepSeek-R1',
        name: 'DeepSeek-R1',
        displayName: 'DeepSeek R1 - 推理模型',
        description: '强化学习驱动的推理模型，在数学、代码和推理任务中与 OpenAI-o1 表现相当',
        contextWindow: 163840,
        releaseDate: '2025-05-28',
        pricing: {
          input: '¥4.00/百万tokens',
          output: '¥16.00/百万tokens',
        },
      },
    ],
  },
]

// 获取默认模型
export const DEFAULT_MODEL_ID = 'Qwen/Qwen2.5-7B-Instruct'

// 根据 ID 查找模型
export function findModelById(modelId: string): ModelInfo | null {
  for (const provider of MODEL_PROVIDERS) {
    const model = provider.models.find((m) => m.id === modelId)
    if (model) {
      return model
    }
  }
  return null
}

// 根据 ID 查找提供商
export function findProviderByModelId(modelId: string): ModelProvider | null {
  for (const provider of MODEL_PROVIDERS) {
    if (provider.models.some((m) => m.id === modelId)) {
      return provider
    }
  }
  return null
}

// 按发布时间排序模型（最新的在前）
export function sortModelsByReleaseDate(models: ModelInfo[]): ModelInfo[] {
  return [...models].sort((a, b) => {
    const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
    const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0
    return dateB - dateA // 降序排列，最新的在前
  })
}

// 搜索模型
export function searchModels(query: string): { provider: ModelProvider; models: ModelInfo[] }[] {
  const lowerQuery = query.toLowerCase().trim()
  if (!lowerQuery) {
    return MODEL_PROVIDERS.map(provider => ({
      provider,
      models: sortModelsByReleaseDate(provider.models),
    }))
  }

  return MODEL_PROVIDERS
    .map(provider => {
      const matchedModels = provider.models.filter(model => {
        const searchText = `${model.name} ${model.displayName} ${model.description}`.toLowerCase()
        return searchText.includes(lowerQuery)
      })
      return {
        provider,
        models: sortModelsByReleaseDate(matchedModels),
      }
    })
    .filter(result => result.models.length > 0)
}
