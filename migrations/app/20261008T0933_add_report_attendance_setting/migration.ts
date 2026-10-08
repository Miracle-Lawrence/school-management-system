#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/c2ea0b70ca5d5ecf0e3945618680e99782e1a70cac3ac82687b8019af99e563e/contract';
import endContract from '../../snapshots/c2ea0b70ca5d5ecf0e3945618680e99782e1a70cac3ac82687b8019af99e563e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/db4412bc00a844e4bc53c5264f32699a09a852af3dafabb1b05570c848c3bce4/contract';
import startContract from '../../snapshots/db4412bc00a844e4bc53c5264f32699a09a852af3dafabb1b05570c848c3bce4/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'ReportConfiguration',
        column: col('showAttendance', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
