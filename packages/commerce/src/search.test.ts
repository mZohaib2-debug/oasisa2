import { describe, expect, it } from 'vitest';
import { expandQuery } from './search';

describe('search query expansion', () => {
  it('expands South Asian grocery terms', () => {
    expect(expandQuery('atta')).toEqual(expect.arrayContaining(['atta', 'flour', 'chakki']));
    expect(expandQuery('chana')).toEqual(expect.arrayContaining(['chickpea', 'garbanzo']));
    expect(expandQuery('keema')).toEqual(expect.arrayContaining(['ground meat', 'mince']));
  });

  it('expands multi-word queries token by token', () => {
    const terms = expandQuery('lal mirch');
    expect(terms).toEqual(expect.arrayContaining(['red', 'chili', 'chilli']));
  });

  it('returns nothing for an empty query', () => {
    expect(expandQuery('   ')).toEqual([]);
  });
});
