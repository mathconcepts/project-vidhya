/**
 * template-loader.ts — YAML topic-family template loader (E6).
 *
 * Loads `modules/project-vidhya-content/templates/*.yaml` at boot, validates
 * each against the schema, and exposes a typed lookup API for the orchestrator.
 *
 * Boot-time fail-fast contract (eng review decision): if any template fails
 * schema validation, the loader THROWS so the server refuses to start. Better
 * a loud crash at boot than silent degradation in production.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { AtomType } from '../content-types';

// ─── Schema ──────────────────────────────────────────────────────────

export interface AtomTemplate {
  scaffold: string;
  guidance?: string;
  bloom_floor?: number;
  exam_pattern_required?: boolean;
}

export interface TopicFamilyTemplate {
  topic_family: string;
  /** Per-atom-type guidance. The 11 keys mirror AtomType. */
  hook?: AtomTemplate;
  intuition?: AtomTemplate;
  formal_definition?: AtomTemplate;
  visual_analogy?: AtomTemplate;
  worked_example?: AtomTemplate;
  micro_exercise?: AtomTemplate;
  common_traps?: AtomTemplate;
  retrieval_prompt?: AtomTemplate;
  interleaved_drill?: AtomTemplate;
  mnemonic?: AtomTemplate;
  exam_pattern?: AtomTemplate;
}

// ─── Loader ──────────────────────────────────────────────────────────

const TEMPLATES_DIR_DEFAULT = path.resolve(
  process.cwd(),
  'modules/project-vidhya-content/templates',
);

let _cache: Map<string, TopicFamilyTemplate> | null = null;

function validate(file: string, parsed: any): TopicFamilyTemplate {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`[template-loader] ${file}: not a YAML object`);
  }
  if (typeof parsed.topic_family !== 'string' || !parsed.topic_family) {
    throw new Error(`[template-loader] ${file}: missing required "topic_family"`);
  }
  // Validate every atom-type entry has at least scaffold:string.
  const atomKeys: AtomType[] = [
    'hook', 'intuition', 'formal_definition', 'visual_analogy',
    'worked_example', 'micro_exercise', 'common_traps',
    'retrieval_prompt', 'interleaved_drill', 'mnemonic', 'exam_pattern',
  ];
  for (const k of atomKeys) {
    const v = parsed[k];
    if (v == null) continue;
    if (typeof v !== 'object' || typeof v.scaffold !== 'string') {
      throw new Error(`[template-loader] ${file}: ${k} must have a string "scaffold" field`);
    }
    if (v.bloom_floor != null && (typeof v.bloom_floor !== 'number' || v.bloom_floor < 1 || v.bloom_floor > 6)) {
      throw new Error(`[template-loader] ${file}: ${k}.bloom_floor must be 1-6`);
    }
  }
  return parsed as TopicFamilyTemplate;
}

/**
 * Load all topic-family YAML files. Caches in-process. Throws on any
 * schema violation (boot-time fail-fast).
 */
export function loadTemplates(dir: string = TEMPLATES_DIR_DEFAULT): Map<string, TopicFamilyTemplate> {
  if (_cache) return _cache;
  if (!fs.existsSync(dir)) {
    // Empty dir is OK in tests + stub modes — return empty map.
    _cache = new Map();
    return _cache;
  }
  const out = new Map<string, TopicFamilyTemplate>();
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue;
    const full = path.join(dir, file);
    const raw = fs.readFileSync(full, 'utf8');
    let parsed: any;
    try {
      parsed = yaml.load(raw);
    } catch (err: any) {
      throw new Error(`[template-loader] ${file}: YAML parse error: ${err.message}`);
    }
    const validated = validate(file, parsed);
    if (out.has(validated.topic_family)) {
      throw new Error(`[template-loader] duplicate topic_family "${validated.topic_family}" in ${file}`);
    }
    out.set(validated.topic_family, validated);
  }
  _cache = out;
  return out;
}

/**
 * Get a template for a given topic family + atom type. Returns null when
 * either is missing — callers fall back to a generic prompt and log a
 * "no per-topic guidance" badge.
 */
export function getTemplate(
  topicFamily: string,
  atomType: AtomType,
): AtomTemplate | null {
  const tpls = loadTemplates();
  const family = tpls.get(topicFamily);
  if (!family) return null;
  return (family as any)[atomType] ?? null;
}

/** For tests — drop the cache. */
export function _resetTemplateCacheForTests(): void {
  _cache = null;
}
