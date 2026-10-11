#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/a50238f2dbc03699315447d078b5454f87807742920b5ece3bb88e919b938502/contract';
import endContract from '../../snapshots/a50238f2dbc03699315447d078b5454f87807742920b5ece3bb88e919b938502/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ed0565f3c0f51631a9a4f98adadc9fb7d39185ef2e54df1cb8dcd8ab10209c7e/contract';
import startContract from '../../snapshots/ed0565f3c0f51631a9a4f98adadc9fb7d39185ef2e54df1cb8dcd8ab10209c7e/contract.json' with { type: 'json' };
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
        table: 'AssessmentCategory',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('displayOrder', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'AssessmentCategory_type_check_5f5595b1',
            "\"type\" IN ('ASSIGNMENT', 'TEST', 'CA', 'EXAM', 'PROJECT', 'PRACTICAL', 'OTHER')",
          ),
        ],
      }),
      this.addColumn({
        schema: 'public',
        table: 'Assessment',
        column: col('assessmentCategoryId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ReportComponent',
        column: col('assessmentCategoryId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'AssessmentCategory',
        constraint: 'AssessmentCategory_schoolId_name_key',
        columns: ['schoolId', 'name'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Assessment',
        index: 'Assessment_assessmentCategoryId_idx_24e62543',
        columns: ['assessmentCategoryId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AssessmentCategory',
        index: 'AssessmentCategory_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AssessmentCategory',
        index: 'AssessmentCategory_schoolId_type_idx_a08c0ed3',
        columns: ['schoolId', 'type'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportComponent',
        index: 'ReportComponent_assessmentCategoryId_idx_24e62543',
        columns: ['assessmentCategoryId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AssessmentCategory',
        foreignKey: {
          name: 'AssessmentCategory_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Assessment',
        foreignKey: {
          name: 'Assessment_assessmentCategoryId_fkey',
          columns: ['assessmentCategoryId'],
          references: { schema: 'public', table: 'AssessmentCategory', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ReportComponent',
        foreignKey: {
          name: 'ReportComponent_assessmentCategoryId_fkey',
          columns: ['assessmentCategoryId'],
          references: { schema: 'public', table: 'AssessmentCategory', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
