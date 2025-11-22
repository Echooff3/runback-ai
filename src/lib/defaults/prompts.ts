import type { SystemPrompt, SlashPrompt } from '../../types';

export const DEFAULT_SYSTEM_PROMPTS: Omit<SystemPrompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [
  {
    name: 'Default',
    content: '',
    description: 'No system prompt - neutral AI behavior',
    tags: ['default'],
    isDefault: true,
  },
  {
    name: 'Helpful Assistant',
    content: 'You are a helpful AI assistant. You provide clear, accurate, and concise answers to user questions. You are friendly, professional, and always aim to be useful.',
    description: 'A friendly and helpful AI assistant',
    tags: ['general', 'assistant'],
    isDefault: true,
  },
  {
    name: 'Code Expert',
    content: 'You are an expert programmer with deep knowledge of multiple programming languages, software architecture, and best practices. You provide well-commented, efficient, and maintainable code. You explain your solutions clearly and suggest improvements when appropriate.',
    description: 'Expert programmer for coding tasks',
    tags: ['coding', 'technical'],
    isDefault: true,
  },
  {
    name: 'Creative Writer',
    content: 'You are a creative writing assistant with expertise in storytelling, poetry, and various literary forms. You help users craft engaging narratives, develop characters, and refine their writing style. You are imaginative, supportive, and provide constructive feedback.',
    description: 'Creative writing and storytelling assistant',
    tags: ['creative', 'writing'],
    isDefault: true,
  },
];

export const DEFAULT_SLASH_PROMPTS: Omit<SlashPrompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [
  {
    command: '/summarize',
    description: 'Summarize the provided text',
    template: 'Summarize the following text:\n\n{text}',
    variables: [
      {
        name: 'text',
        description: 'The text to summarize',
      },
    ],
    isDefault: true,
  },
  {
    command: '/translate',
    description: 'Translate text to another language',
    template: 'Translate the following text to {language}:\n\n{text}',
    variables: [
      {
        name: 'language',
        description: 'Target language',
        defaultValue: 'Spanish',
      },
      {
        name: 'text',
        description: 'The text to translate',
      },
    ],
    isDefault: true,
  },
  {
    command: '/explain',
    description: 'Explain something in simple terms',
    template: 'Explain the following in simple terms:\n\n{topic}',
    variables: [
      {
        name: 'topic',
        description: 'The topic to explain',
      },
    ],
    isDefault: true,
  },
  {
    command: '/code',
    description: 'Generate code for a specific task',
    template: 'Generate {language} code for the following task:\n\n{task}',
    variables: [
      {
        name: 'language',
        description: 'Programming language',
        defaultValue: 'Python',
      },
      {
        name: 'task',
        description: 'The task description',
      },
    ],
    isDefault: true,
  },
  {
    command: '/debug',
    description: 'Debug code and identify issues',
    template: 'Debug the following code and explain the issues:\n\n```{language}\n{code}\n```',
    variables: [
      {
        name: 'language',
        description: 'Programming language',
        defaultValue: 'python',
      },
      {
        name: 'code',
        description: 'The code to debug',
      },
    ],
    isDefault: true,
  },
];
