#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/7cc47ac321a887374dcc021188ad788dcd084f7a01dc2a1d4edd64e9358ed0b3/contract';
import endContract from '../../snapshots/7cc47ac321a887374dcc021188ad788dcd084f7a01dc2a1d4edd64e9358ed0b3/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/af1a15139dcc3deddfaa657697e2eeb8ee7f6b292ec3fb191f7a01b943104bb3/contract';
import startContract from '../../snapshots/af1a15139dcc3deddfaa657697e2eeb8ee7f6b292ec3fb191f7a01b943104bb3/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'ReportPublication',
        columns: [
          col('classId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isPublished', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('publishedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('publishedByUserId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('reportType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('termId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('unpublishedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('unpublishedByUserId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'ReportPublication_reportType_check_6c6f706e',
            "\"reportType\" IN ('MID_TERM', 'TERMINAL')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'ReportPublication',
        constraint: 'ReportPublication_schoolId_classId_termId_reportType_key',
        columns: ['schoolId', 'classId', 'termId', 'reportType'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportPublication',
        index: 'ReportPublication_classId_idx_0089e5e7',
        columns: ['classId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportPublication',
        index: 'ReportPublication_isPublished_idx_d7ee5985',
        columns: ['isPublished'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportPublication',
        index: 'ReportPublication_publishedByUserId_idx_53844f7c',
        columns: ['publishedByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportPublication',
        index: 'ReportPublication_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportPublication',
        index: 'ReportPublication_termId_idx_1b74c9af',
        columns: ['termId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportPublication',
        index: 'ReportPublication_unpublishedByUserId_idx_21be54e2',
        columns: ['unpublishedByUserId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ReportPublication',
        foreignKey: {
          name: 'ReportPublication_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ReportPublication',
        foreignKey: {
          name: 'ReportPublication_classId_fkey',
          columns: ['classId'],
          references: { schema: 'public', table: 'SchoolClass', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ReportPublication',
        foreignKey: {
          name: 'ReportPublication_termId_fkey',
          columns: ['termId'],
          references: { schema: 'public', table: 'Term', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ReportPublication',
        foreignKey: {
          name: 'ReportPublication_publishedByUserId_fkey',
          columns: ['publishedByUserId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ReportPublication',
        foreignKey: {
          name: 'ReportPublication_unpublishedByUserId_fkey',
          columns: ['unpublishedByUserId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
