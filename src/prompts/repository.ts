import type { PromptCompileOptions } from './types';

interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  systemPrompt?: string;
}

const TEMPLATES: PromptTemplate[] = [
  { id: 'blog_post-template', name: 'blog_post', template: 'Write a blog post about {{topic}} for {{exam}} exam students.' },
  { id: 'vlog_script-template', name: 'vlog_script', template: 'Create a video script about {{topic}}.' },
];

export const promptRepository = {
  async getTemplateByName(name: string): Promise<PromptTemplate | null> {
    return TEMPLATES.find(t => t.name === name) ?? null;
  },

  async getTemplate(id: string): Promise<PromptTemplate | null> {
    return TEMPLATES.find(t => t.id === id) ?? null;
  },

  async compile(templateId: string, options: PromptCompileOptions): Promise<{ userPrompt: string; systemPrompt?: string }> {
    const template = await this.getTemplate(templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);
    const vars = options.variables ?? {};
    const userPrompt = template.template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''));
    return { userPrompt, systemPrompt: template.systemPrompt };
  },
};
