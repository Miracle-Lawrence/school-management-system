#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/db4412bc00a844e4bc53c5264f32699a09a852af3dafabb1b05570c848c3bce4/contract';
import endContract from '../../snapshots/db4412bc00a844e4bc53c5264f32699a09a852af3dafabb1b05570c848c3bce4/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e4e7af962c6c36b5abed9ec218d2f3652eb58568c54182e5fa0ca8c23334a027/contract';
import startContract from '../../snapshots/e4e7af962c6c36b5abed9ec218d2f3652eb58568c54182e5fa0ca8c23334a027/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'ReportConfiguration',
        column: col('showClassTeacherName', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ReportConfiguration',
        column: col('showPrincipalSignature', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ReportConfiguration',
        column: col('showSchoolStamp', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'School',
        column: col('principalSignatureUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
