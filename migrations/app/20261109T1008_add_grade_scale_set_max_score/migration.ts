#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/9d1e5940b99e6c366cff9e1a56f368239b59f3f714599eafd31c6b4e4d0f090c/contract';
import endContract from '../../snapshots/9d1e5940b99e6c366cff9e1a56f368239b59f3f714599eafd31c6b4e4d0f090c/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b72470b16c3fede5521170532e1bea96a8fc9dfa9accc2960a6c8a5e561297f3/contract';
import startContract from '../../snapshots/b72470b16c3fede5521170532e1bea96a8fc9dfa9accc2960a6c8a5e561297f3/contract.json' with { type: 'json' };
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
