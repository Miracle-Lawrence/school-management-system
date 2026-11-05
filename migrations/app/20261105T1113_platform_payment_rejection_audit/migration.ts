#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/e1c6ae023ccfe582c7b8a58e98623014782dce21563d5e11d5fece9e6a6d0b5c/contract';
import endContract from '../../snapshots/e1c6ae023ccfe582c7b8a58e98623014782dce21563d5e11d5fece9e6a6d0b5c/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f8eaef4c722a27a0d058043e025adbb627ff69e688de832031cd30ab6d70b4de/contract';
import startContract from '../../snapshots/f8eaef4c722a27a0d058043e025adbb627ff69e688de832031cd30ab6d70b4de/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'PlatformSubscriptionPayment',
        column: col('rejectedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'PlatformSubscriptionPayment',
        column: col('rejectedById', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'PlatformSubscriptionPayment',
        index: 'PlatformSubscriptionPayment_rejectedById_idx_a6ee2717',
        columns: ['rejectedById'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PlatformSubscriptionPayment',
        foreignKey: {
          name: 'PlatformSubscriptionPayment_rejectedById_fkey',
          columns: ['rejectedById'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
