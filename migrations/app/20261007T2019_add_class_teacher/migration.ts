#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/46a50e4deeb69f5b93cc674e612efad69baf26ecb544dc03d0d97cb0306150e3/contract';
import endContract from '../../snapshots/46a50e4deeb69f5b93cc674e612efad69baf26ecb544dc03d0d97cb0306150e3/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/7eb5bc1b9a30ab60200f30afb3eabfbc0116825d7576d559c36510708fa07f9c/contract';
import startContract from '../../snapshots/7eb5bc1b9a30ab60200f30afb3eabfbc0116825d7576d559c36510708fa07f9c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'SchoolClass',
        column: col('classTeacherId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'SchoolClass',
        index: 'SchoolClass_classTeacherId_idx_a6853519',
        columns: ['classTeacherId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SchoolClass',
        foreignKey: {
          name: 'SchoolClass_classTeacherId_fkey',
          columns: ['classTeacherId'],
          references: { schema: 'public', table: 'Teacher', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
