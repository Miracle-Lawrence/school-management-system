#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/479843e3557a0962a649a77e63bd109f047e093a600cc548f502cbe4dc57c8b1/contract';
import startContract from '../../snapshots/479843e3557a0962a649a77e63bd109f047e093a600cc548f502cbe4dc57c8b1/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/6ec270b461e4fec571c0aa71a8bbabfee2d7132119e5c524f988af3588f33efc/contract';
import endContract from '../../snapshots/6ec270b461e4fec571c0aa71a8bbabfee2d7132119e5c524f988af3588f33efc/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'GradeScaleSet',
        column: col('maxScore', 'float8', {
          notNull: true,
          default: lit(100),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
