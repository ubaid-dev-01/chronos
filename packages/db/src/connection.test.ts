import { describe, it, expect } from 'vitest';
import { buildStandardMongoUri } from './connection';

describe('buildStandardMongoUri', () => {
  it('converts mongodb+srv seed hosts and Atlas TXT options', () => {
    const uri = buildStandardMongoUri(
      'mongodb+srv://user:p%40ss@cluster0.example.net/chronos?retryWrites=true&w=majority',
      [
        { name: 'ac-b.example.net.', port: 27017, priority: 0, weight: 0 },
        { name: 'ac-a.example.net.', port: 27017, priority: 0, weight: 0 },
      ],
      ['authSource=admin&replicaSet=atlas-abc']
    );

    expect(uri.startsWith('mongodb://user:p%40ss@')).toBe(true);
    expect(uri).toContain('ac-b.example.net:27017');
    expect(uri).toContain('ac-a.example.net:27017');
    expect(uri).toContain('/chronos?');
    expect(uri).toContain('tls=true');
    expect(uri).toContain('authSource=admin');
    expect(uri).toContain('replicaSet=atlas-abc');
    expect(uri).toContain('retryWrites=true');
  });

  it('does not use mongodb+srv so Node will not call querySrv', () => {
    const uri = buildStandardMongoUri(
      'mongodb+srv://u:p@cluster0.example.net/db',
      [{ name: 'shard.example.net', port: 27017, priority: 0, weight: 0 }],
      []
    );
    expect(uri.startsWith('mongodb://')).toBe(true);
    expect(uri.includes('mongodb+srv')).toBe(false);
  });
});
