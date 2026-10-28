#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2f0973bbf02b9e9e0ec82c155fcfa6ac30724319229330e6448aa33e1cdd5e10/contract';
import endContract from '../../snapshots/2f0973bbf02b9e9e0ec82c155fcfa6ac30724319229330e6448aa33e1cdd5e10/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b45a4bab0f46e7d956ee2f1d0f568d5aae7823b4782532be5e1473a0001f90ec/contract';
import startContract from '../../snapshots/b45a4bab0f46e7d956ee2f1d0f568d5aae7823b4782532be5e1473a0001f90ec/contract.json' with { type: 'json' };
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
        table: 'StudentContentRead',
        columns: [
          col('contentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('contentType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('studentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('viewedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('viewedVersion', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'StudentContentRead_contentType_check_09973a7c',
            "\"contentType\" IN ('CLASS_NOTE', 'ASSIGNMENT', 'GRADE', 'RESULT')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'StudentContentRead',
        constraint: 'StudentContentRead_studentId_contentType_contentId_key',
        columns: ['studentId', 'contentType', 'contentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentContentRead',
        index: 'StudentContentRead_studentId_contentType_idx_2c410c37',
        columns: ['studentId', 'contentType'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentContentRead',
        index: 'StudentContentRead_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentContentRead',
        foreignKey: {
          name: 'StudentContentRead_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'Student', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
