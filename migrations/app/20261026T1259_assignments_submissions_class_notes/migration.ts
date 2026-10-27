#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/387b2f6b1de820baecd33613ddceeb18fb5c3eeaa6f9f9089733c57790814cbe/contract';
import startContract from '../../snapshots/387b2f6b1de820baecd33613ddceeb18fb5c3eeaa6f9f9089733c57790814cbe/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ba3c259d546f2efac2c32dcc53d928db279f1cc3857e01f52eaa49194e308659/contract';
import endContract from '../../snapshots/ba3c259d546f2efac2c32dcc53d928db279f1cc3857e01f52eaa49194e308659/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'Assignment',
        columns: [
          col('classId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dueDate', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('instructions', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isPublished', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('maxScore', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('publishedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('subjectId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('teacherId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'AssignmentSubmission',
        columns: [
          col('answer', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('assignmentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('feedback', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('gradedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('gradedByUserId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('marks', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('studentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('submittedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'ClassNote',
        columns: [
          col('classId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('content', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
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
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('subjectId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('teacherId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'AssignmentSubmission',
        constraint: 'AssignmentSubmission_assignmentId_studentId_key',
        columns: ['assignmentId', 'studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Assignment',
        index: 'Assignment_classId_idx_0089e5e7',
        columns: ['classId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Assignment',
        index: 'Assignment_classId_subjectId_idx_a6ea4d18',
        columns: ['classId', 'subjectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Assignment',
        index: 'Assignment_dueDate_idx_fb527616',
        columns: ['dueDate'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Assignment',
        index: 'Assignment_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Assignment',
        index: 'Assignment_schoolId_isPublished_idx_31483fe4',
        columns: ['schoolId', 'isPublished'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Assignment',
        index: 'Assignment_subjectId_idx_84df2a1d',
        columns: ['subjectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Assignment',
        index: 'Assignment_teacherId_idx_bc266660',
        columns: ['teacherId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AssignmentSubmission',
        index: 'AssignmentSubmission_assignmentId_idx_8cfb4ac4',
        columns: ['assignmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AssignmentSubmission',
        index: 'AssignmentSubmission_assignmentId_submittedAt_idx_1fa2b6b9',
        columns: ['assignmentId', 'submittedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AssignmentSubmission',
        index: 'AssignmentSubmission_gradedByUserId_idx_25e61c77',
        columns: ['gradedByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AssignmentSubmission',
        index: 'AssignmentSubmission_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AssignmentSubmission',
        index: 'AssignmentSubmission_studentId_submittedAt_idx_39a4bfc4',
        columns: ['studentId', 'submittedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ClassNote',
        index: 'ClassNote_classId_idx_0089e5e7',
        columns: ['classId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ClassNote',
        index: 'ClassNote_classId_subjectId_idx_a6ea4d18',
        columns: ['classId', 'subjectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ClassNote',
        index: 'ClassNote_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ClassNote',
        index: 'ClassNote_schoolId_isPublished_idx_31483fe4',
        columns: ['schoolId', 'isPublished'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ClassNote',
        index: 'ClassNote_subjectId_idx_84df2a1d',
        columns: ['subjectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ClassNote',
        index: 'ClassNote_teacherId_idx_bc266660',
        columns: ['teacherId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Assignment',
        foreignKey: {
          name: 'Assignment_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Assignment',
        foreignKey: {
          name: 'Assignment_teacherId_fkey',
          columns: ['teacherId'],
          references: { schema: 'public', table: 'Teacher', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Assignment',
        foreignKey: {
          name: 'Assignment_classId_fkey',
          columns: ['classId'],
          references: { schema: 'public', table: 'SchoolClass', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Assignment',
        foreignKey: {
          name: 'Assignment_subjectId_fkey',
          columns: ['subjectId'],
          references: { schema: 'public', table: 'Subject', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AssignmentSubmission',
        foreignKey: {
          name: 'AssignmentSubmission_assignmentId_fkey',
          columns: ['assignmentId'],
          references: { schema: 'public', table: 'Assignment', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AssignmentSubmission',
        foreignKey: {
          name: 'AssignmentSubmission_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'Student', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AssignmentSubmission',
        foreignKey: {
          name: 'AssignmentSubmission_gradedByUserId_fkey',
          columns: ['gradedByUserId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ClassNote',
        foreignKey: {
          name: 'ClassNote_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ClassNote',
        foreignKey: {
          name: 'ClassNote_teacherId_fkey',
          columns: ['teacherId'],
          references: { schema: 'public', table: 'Teacher', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ClassNote',
        foreignKey: {
          name: 'ClassNote_classId_fkey',
          columns: ['classId'],
          references: { schema: 'public', table: 'SchoolClass', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ClassNote',
        foreignKey: {
          name: 'ClassNote_subjectId_fkey',
          columns: ['subjectId'],
          references: { schema: 'public', table: 'Subject', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
