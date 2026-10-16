#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/8f3789b80da9240f5246e6ec9ee8aabc8628c4737641d16e451a11fb0af4d76d/contract';
import startContract from '../../snapshots/8f3789b80da9240f5246e6ec9ee8aabc8628c4737641d16e451a11fb0af4d76d/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/adb55de101e190917148e2716f7c64bd0e77b9dc2d40d2586a601baae7529e3a/contract';
import endContract from '../../snapshots/adb55de101e190917148e2716f7c64bd0e77b9dc2d40d2586a601baae7529e3a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('mustChangePassword', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
