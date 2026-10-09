#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/476d0d94acdf9a9531077c982313524ac2d3a26e459ae39b8c94fff6c3deb523/contract';
import endContract from '../../snapshots/476d0d94acdf9a9531077c982313524ac2d3a26e459ae39b8c94fff6c3deb523/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e8efc318395b2cfd350d73b717c33fe9e663056776056e01445930ee0652c6dd/contract';
import startContract from '../../snapshots/e8efc318395b2cfd350d73b717c33fe9e663056776056e01445930ee0652c6dd/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'School',
        column: col('loginImageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
