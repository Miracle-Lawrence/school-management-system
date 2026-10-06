#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/45a80aca7e7a268d5500001e8d0a5c3d943a4629db0131b3373072014343f936/contract';
import endContract from '../../snapshots/45a80aca7e7a268d5500001e8d0a5c3d943a4629db0131b3373072014343f936/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/55f8c440fd962eec62ce387a0ee74855a3d06da7e0056afe531f67946ca94c70/contract';
import startContract from '../../snapshots/55f8c440fd962eec62ce387a0ee74855a3d06da7e0056afe531f67946ca94c70/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Student',
        column: col('photoUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
