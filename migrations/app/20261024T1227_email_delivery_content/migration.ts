#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/387b2f6b1de820baecd33613ddceeb18fb5c3eeaa6f9f9089733c57790814cbe/contract';
import endContract from '../../snapshots/387b2f6b1de820baecd33613ddceeb18fb5c3eeaa6f9f9089733c57790814cbe/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/6527becba76c878212d9175d9eedcd1f383c3212ced75cb39a4c017738ac2820/contract';
import startContract from '../../snapshots/6527becba76c878212d9175d9eedcd1f383c3212ced75cb39a4c017738ac2820/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'EmailDelivery',
        column: col('htmlBody', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'EmailDelivery',
        column: col('textBody', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
