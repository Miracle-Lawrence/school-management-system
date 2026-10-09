#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1aea19b47f62b4a186c066b824d232f05facbf603dc01413f377475710194c55/contract';
import endContract from '../../snapshots/1aea19b47f62b4a186c066b824d232f05facbf603dc01413f377475710194c55/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c2ea0b70ca5d5ecf0e3945618680e99782e1a70cac3ac82687b8019af99e563e/contract';
import startContract from '../../snapshots/c2ea0b70ca5d5ecf0e3945618680e99782e1a70cac3ac82687b8019af99e563e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'StudentTermResult',
        column: col('classTeacherId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentTermResult',
        index: 'StudentTermResult_classTeacherId_idx_a6853519',
        columns: ['classTeacherId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentTermResult',
        foreignKey: {
          name: 'StudentTermResult_classTeacherId_fkey',
          columns: ['classTeacherId'],
          references: { schema: 'public', table: 'Teacher', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
