#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/476d0d94acdf9a9531077c982313524ac2d3a26e459ae39b8c94fff6c3deb523/contract';
import startContract from '../../snapshots/476d0d94acdf9a9531077c982313524ac2d3a26e459ae39b8c94fff6c3deb523/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f410efa5f383d2f016680e60a03f68f441c632714d850626a6b8802002486455/contract';
import endContract from '../../snapshots/f410efa5f383d2f016680e60a03f68f441c632714d850626a6b8802002486455/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('sessionVersion', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
