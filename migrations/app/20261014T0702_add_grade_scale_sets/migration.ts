#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/8f3789b80da9240f5246e6ec9ee8aabc8628c4737641d16e451a11fb0af4d76d/contract';
import endContract from '../../snapshots/8f3789b80da9240f5246e6ec9ee8aabc8628c4737641d16e451a11fb0af4d76d/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/a50238f2dbc03699315447d078b5454f87807742920b5ece3bb88e919b938502/contract';
import startContract from '../../snapshots/a50238f2dbc03699315447d078b5454f87807742920b5ece3bb88e919b938502/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropConstraint({
        schema: 'public',
        table: 'GradeScale',
        constraint: 'GradeScale_schoolId_code_key',
      }),
      this.createTable({
        schema: 'public',
        table: 'GradeScaleSet',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'GradeScale',
        column: col('gradeScaleSetId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ReportConfiguration',
        column: col('gradeScaleSetId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'GradeScale',
        constraint: 'GradeScale_gradeScaleSetId_code_key',
        columns: ['gradeScaleSetId', 'code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'GradeScaleSet',
        constraint: 'GradeScaleSet_schoolId_name_key',
        columns: ['schoolId', 'name'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'GradeScale',
        index: 'GradeScale_gradeScaleSetId_idx_40aa63f0',
        columns: ['gradeScaleSetId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'GradeScaleSet',
        index: 'GradeScaleSet_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportConfiguration',
        index: 'ReportConfiguration_gradeScaleSetId_idx_40aa63f0',
        columns: ['gradeScaleSetId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'GradeScaleSet',
        foreignKey: {
          name: 'GradeScaleSet_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'GradeScale',
        foreignKey: {
          name: 'GradeScale_gradeScaleSetId_fkey',
          columns: ['gradeScaleSetId'],
          references: { schema: 'public', table: 'GradeScaleSet', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ReportConfiguration',
        foreignKey: {
          name: 'ReportConfiguration_gradeScaleSetId_fkey',
          columns: ['gradeScaleSetId'],
          references: { schema: 'public', table: 'GradeScaleSet', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
