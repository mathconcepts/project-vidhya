import { describe, it, expect } from 'vitest';
import {
  DELIVERY_LENGTHS,
  MICRO_ATOM_TYPES,
  carriesInteractiveScene,
  selectAtomsForDeliveryLength,
  deliveryLengthFromSessionMode,
  isDeliveryLength,
} from '../delivery-length';
import type { AtomType, ContentAtom } from '../content-types';

function atom(id: string, atom_type: AtomType, content = `content-${id}`): ContentAtom {
  return {
    id,
    concept_id: 'c',
    atom_type,
    bloom_level: 2,
    difficulty: 0,
    exam_ids: ['*'],
    content,
  };
}

const allTypes: AtomType[] = [
  'hook', 'intuition', 'formal_definition', 'visual_analogy',
  'worked_example', 'micro_exercise', 'common_traps',
  'retrieval_prompt', 'interleaved_drill', 'mnemonic', 'exam_pattern',
];

function fullAtomSet(): ContentAtom[] {
  return allTypes.map((t) => atom(`a-${t}`, t));
}

describe('MICRO_ATOM_TYPES', () => {
  it('is exactly the 6 research-named micro anchors', () => {
    expect([...MICRO_ATOM_TYPES].sort()).toEqual(
      ['common_traps', 'exam_pattern', 'formal_definition', 'hook', 'retrieval_prompt', 'worked_example'].sort(),
    );
  });
});

describe('carriesInteractiveScene', () => {
  it('is false for plain prose', () => {
    expect(carriesInteractiveScene('Just some math prose, no fences here.')).toBe(false);
  });

  it('is true for a fenced interactive-spec block', () => {
    expect(carriesInteractiveScene('Some prose\n```interactive-spec\n{"v":1}\n```\nmore')).toBe(true);
  });

  it('is true for a fenced gif-scene block', () => {
    expect(carriesInteractiveScene('```gif-scene\n{"type":"parametric"}\n```')).toBe(true);
  });
});

describe('selectAtomsForDeliveryLength', () => {
  it('standard returns every atom, unchanged order', () => {
    const atoms = fullAtomSet();
    expect(selectAtomsForDeliveryLength(atoms, 'standard')).toEqual(atoms);
  });

  it('deep returns every atom, unchanged order (not yet distinct from standard)', () => {
    const atoms = fullAtomSet();
    expect(selectAtomsForDeliveryLength(atoms, 'deep')).toEqual(atoms);
  });

  it('micro keeps only the 6 micro atom types', () => {
    const atoms = fullAtomSet();
    const micro = selectAtomsForDeliveryLength(atoms, 'micro');
    expect(micro.map((a) => a.atom_type).sort()).toEqual(
      ['hook', 'formal_definition', 'worked_example', 'common_traps', 'retrieval_prompt', 'exam_pattern'].sort(),
    );
  });

  it('micro preserves input order among the kept atoms', () => {
    const atoms = fullAtomSet(); // allTypes order: hook, intuition, formal_definition, ...
    const micro = selectAtomsForDeliveryLength(atoms, 'micro');
    expect(micro.map((a) => a.atom_type)).toEqual([
      'hook', 'formal_definition', 'worked_example', 'common_traps', 'retrieval_prompt', 'exam_pattern',
    ]);
  });

  it('micro drops intuition, visual_analogy, micro_exercise, mnemonic, interleaved_drill', () => {
    const atoms = fullAtomSet();
    const micro = selectAtomsForDeliveryLength(atoms, 'micro');
    const droppedTypes: AtomType[] = ['intuition', 'visual_analogy', 'micro_exercise', 'mnemonic', 'interleaved_drill'];
    for (const t of droppedTypes) {
      expect(micro.some((a) => a.atom_type === t)).toBe(false);
    }
  });

  it('resonance safety: an intuition atom carrying a real interactive scene is kept in micro mode', () => {
    const atoms = [
      atom('hook', 'hook'),
      atom('intuition-with-scene', 'intuition', '```interactive-spec\n{"v":1,"kind":"simulation"}\n```'),
      atom('intuition-plain', 'intuition', 'just prose, no scene'),
      atom('example', 'worked_example'),
    ];
    const micro = selectAtomsForDeliveryLength(atoms, 'micro');
    expect(micro.map((a) => a.id)).toEqual(['hook', 'intuition-with-scene', 'example']);
  });

  it('resonance safety: a mnemonic atom carrying a gif-scene is kept even though mnemonic is not a micro type', () => {
    const atoms = [
      atom('hook', 'hook'),
      atom('mnemonic-with-scene', 'mnemonic', '```gif-scene\n{"type":"discrete-bars"}\n```'),
    ];
    const micro = selectAtomsForDeliveryLength(atoms, 'micro');
    expect(micro.map((a) => a.id)).toEqual(['hook', 'mnemonic-with-scene']);
  });

  it('returns an empty array for an empty input, for every length', () => {
    for (const length of DELIVERY_LENGTHS) {
      expect(selectAtomsForDeliveryLength([], length)).toEqual([]);
    }
  });
});

describe('deliveryLengthFromSessionMode', () => {
  it('maps micro_sprint to micro', () => {
    expect(deliveryLengthFromSessionMode('micro_sprint')).toBe('micro');
  });

  it('maps every other session mode (and undefined) to standard', () => {
    expect(deliveryLengthFromSessionMode('knowledge')).toBe('standard');
    expect(deliveryLengthFromSessionMode('exam-prep')).toBe('standard');
    expect(deliveryLengthFromSessionMode('revision')).toBe('standard');
    expect(deliveryLengthFromSessionMode(undefined)).toBe('standard');
    expect(deliveryLengthFromSessionMode('garbage')).toBe('standard');
  });
});

describe('isDeliveryLength', () => {
  it('accepts the three real values', () => {
    expect(isDeliveryLength('micro')).toBe(true);
    expect(isDeliveryLength('standard')).toBe(true);
    expect(isDeliveryLength('deep')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isDeliveryLength('MICRO')).toBe(false);
    expect(isDeliveryLength(undefined)).toBe(false);
    expect(isDeliveryLength(42)).toBe(false);
    expect(isDeliveryLength(null)).toBe(false);
  });
});
