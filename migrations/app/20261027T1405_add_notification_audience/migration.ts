#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/b45a4bab0f46e7d956ee2f1d0f568d5aae7823b4782532be5e1473a0001f90ec/contract';
import endContract from '../../snapshots/b45a4bab0f46e7d956ee2f1d0f568d5aae7823b4782532be5e1473a0001f90ec/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ba3c259d546f2efac2c32dcc53d928db279f1cc3857e01f52eaa49194e308659/contract';
import startContract from '../../snapshots/ba3c259d546f2efac2c32dcc53d928db279f1cc3857e01f52eaa49194e308659/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Notification',
        column: col('audience', 'text', {
          notNull: true,
          default: lit('PARENTS'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Notification',
        constraint: 'Notification_audience_check_c5ab304b',
        expression: "\"audience\" IN ('PARENTS', 'STUDENTS', 'TEACHERS', 'EVERYONE')",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
