#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/7eb5bc1b9a30ab60200f30afb3eabfbc0116825d7576d559c36510708fa07f9c/contract';
import endContract from '../../snapshots/7eb5bc1b9a30ab60200f30afb3eabfbc0116825d7576d559c36510708fa07f9c/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b0ae16366ddd635b037e77594ad3e443ba456292ea11300858d6f08e8a7f0d28/contract';
import startContract from '../../snapshots/b0ae16366ddd635b037e77594ad3e443ba456292ea11300858d6f08e8a7f0d28/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'ReportComment',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('principalComment', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reportType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('studentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('teacherComment', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('termId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'ReportComment_reportType_check_6c6f706e',
            "\"reportType\" IN ('MID_TERM', 'TERMINAL')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'ReportComment',
        constraint: 'ReportComment_studentId_termId_reportType_key',
        columns: ['studentId', 'termId', 'reportType'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportComment',
        index: 'ReportComment_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportComment',
        index: 'ReportComment_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportComment',
        index: 'ReportComment_termId_idx_1b74c9af',
        columns: ['termId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ReportComment',
        foreignKey: {
          name: 'ReportComment_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ReportComment',
        foreignKey: {
          name: 'ReportComment_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'Student', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ReportComment',
        foreignKey: {
          name: 'ReportComment_termId_fkey',
          columns: ['termId'],
          references: { schema: 'public', table: 'Term', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
