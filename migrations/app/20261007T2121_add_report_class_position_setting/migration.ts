#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/46a50e4deeb69f5b93cc674e612efad69baf26ecb544dc03d0d97cb0306150e3/contract';
import startContract from '../../snapshots/46a50e4deeb69f5b93cc674e612efad69baf26ecb544dc03d0d97cb0306150e3/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/e4e7af962c6c36b5abed9ec218d2f3652eb58568c54182e5fa0ca8c23334a027/contract';
import endContract from '../../snapshots/e4e7af962c6c36b5abed9ec218d2f3652eb58568c54182e5fa0ca8c23334a027/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'ReportConfiguration',
        column: col('showClassPosition', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
