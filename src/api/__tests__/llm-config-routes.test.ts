import { describe, it, expect } from 'vitest';
import { __testing } from '../llm-config-routes';

const { isLocalEndpoint, isLocalServer } = __testing;

describe('isLocalEndpoint', () => {
  it.each([
    ['http://localhost:11434/v1', true],
    ['http://localhost/api', true],
    ['http://127.0.0.1:11434', true],
    ['http://0.0.0.0:8080', true],
    ['http://[::1]:11434', true],
    ['https://api.openai.com/v1', false],
    ['https://api.groq.com/openai/v1', false],
    ['https://api.anthropic.com', false],
    [undefined, false],
    ['not-a-url', false],
    ['', false],
  ])('endpoint %s → %s', (endpoint, expected) => {
    expect(isLocalEndpoint(endpoint as any)).toBe(expected);
  });
});

describe('isLocalServer', () => {
  it.each([
    ['localhost:3000', true],
    ['127.0.0.1:8080', true],
    ['localhost', true],
    ['vidhya-demo.onrender.com', false],
    ['example.com', false],
    [undefined, false],
    ['', false],
    [['localhost:3000'], true],
    [['vidhya-demo.onrender.com'], false],
  ])('host %j → %s', (host, expected) => {
    expect(isLocalServer(host as any)).toBe(expected);
  });
});
