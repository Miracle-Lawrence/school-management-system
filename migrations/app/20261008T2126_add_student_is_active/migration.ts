#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/1aea19b47f62b4a186c066b824d232f05facbf603dc01413f377475710194c55/contract';
import startContract from '../../snapshots/1aea19b47f62b4a186c066b824d232f05facbf603dc01413f377475710194c55/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/67a62c9c8dd259f33afc6fd18c4507b2224c8126974a1546c4bebff50a4d4721/contract';
import endContract from '../../snapshots/67a62c9c8dd259f33afc6fd18c4507b2224c8126974a1546c4bebff50a4d4721/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Student',
        column: col('isActive', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
