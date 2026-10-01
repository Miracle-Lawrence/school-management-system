#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2dedc90337bbc3813bedba293a7604ed2c4938ca298e43c5b7270cccd3c45ee0/contract';
import endContract from '../../snapshots/2dedc90337bbc3813bedba293a7604ed2c4938ca298e43c5b7270cccd3c45ee0/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/335015b4b223abb4b7862dbde7dde99fc44ee85a33bac9ffbbc77568c7b070b4/contract';
import startContract from '../../snapshots/335015b4b223abb4b7862dbde7dde99fc44ee85a33bac9ffbbc77568c7b070b4/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  placeholder,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'User', column: 'password' }),
      this.createTable({
        schema: 'public',
        table: 'Assessment',
        columns: [
          col('classId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('createdById', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('date', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('maxScore', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('subjectId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('termId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('weight', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Assessment_type_check_5f5595b1',
            "\"type\" IN ('ASSIGNMENT', 'TEST', 'CA', 'EXAM', 'PROJECT', 'PRACTICAL', 'OTHER')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'AssessmentScore',
        columns: [
          col('assessmentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('remarks', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('score', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('studentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Attendance',
        columns: [
          col('classId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('date', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('recordedById', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('studentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('termId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Attendance_status_check_fd2191e7',
            "\"status\" IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'ClassSubject',
        columns: [
          col('classId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('subjectId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'TeacherAssignment',
        columns: [
          col('classId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('subjectId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('teacherId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('emailVerifiedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('isActive', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('lastLoginAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('passwordHash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-User-passwordHash', {
        check: () => placeholder('backfill-User-passwordHash:check'),
        run: () => placeholder('backfill-User-passwordHash:run'),
      }),
      this.setNotNull({ schema: 'public', table: 'User', column: 'passwordHash' }),
      this.addUnique({
        schema: 'public',
        table: 'AssessmentScore',
        constraint: 'AssessmentScore_assessmentId_studentId_key',
        columns: ['assessmentId', 'studentId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Attendance',
        constraint: 'Attendance_studentId_date_classId_key',
        columns: ['studentId', 'date', 'classId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'ClassSubject',
        constraint: 'ClassSubject_classId_subjectId_key',
        columns: ['classId', 'subjectId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'TeacherAssignment',
        constraint: 'TeacherAssignment_teacherId_classId_subjectId_key',
        columns: ['teacherId', 'classId', 'subjectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Assessment',
        index: 'Assessment_classId_idx_0089e5e7',
        columns: ['classId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Assessment',
        index: 'Assessment_createdById_idx_8bf640ed',
        columns: ['createdById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Assessment',
        index: 'Assessment_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Assessment',
        index: 'Assessment_subjectId_idx_84df2a1d',
        columns: ['subjectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Assessment',
        index: 'Assessment_termId_idx_1b74c9af',
        columns: ['termId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AssessmentScore',
        index: 'AssessmentScore_assessmentId_idx_1fe05216',
        columns: ['assessmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AssessmentScore',
        index: 'AssessmentScore_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Attendance',
        index: 'Attendance_classId_idx_0089e5e7',
        columns: ['classId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Attendance',
        index: 'Attendance_date_idx_b4ca319c',
        columns: ['date'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Attendance',
        index: 'Attendance_recordedById_idx_6595df66',
        columns: ['recordedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Attendance',
        index: 'Attendance_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Attendance',
        index: 'Attendance_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Attendance',
        index: 'Attendance_termId_idx_1b74c9af',
        columns: ['termId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ClassSubject',
        index: 'ClassSubject_classId_idx_0089e5e7',
        columns: ['classId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ClassSubject',
        index: 'ClassSubject_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ClassSubject',
        index: 'ClassSubject_subjectId_idx_84df2a1d',
        columns: ['subjectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'TeacherAssignment',
        index: 'TeacherAssignment_classId_idx_0089e5e7',
        columns: ['classId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'TeacherAssignment',
        index: 'TeacherAssignment_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'TeacherAssignment',
        index: 'TeacherAssignment_subjectId_idx_84df2a1d',
        columns: ['subjectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'TeacherAssignment',
        index: 'TeacherAssignment_teacherId_idx_bc266660',
        columns: ['teacherId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Assessment',
        foreignKey: {
          name: 'Assessment_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Assessment',
        foreignKey: {
          name: 'Assessment_classId_fkey',
          columns: ['classId'],
          references: { schema: 'public', table: 'SchoolClass', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Assessment',
        foreignKey: {
          name: 'Assessment_subjectId_fkey',
          columns: ['subjectId'],
          references: { schema: 'public', table: 'Subject', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Assessment',
        foreignKey: {
          name: 'Assessment_termId_fkey',
          columns: ['termId'],
          references: { schema: 'public', table: 'Term', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Assessment',
        foreignKey: {
          name: 'Assessment_createdById_fkey',
          columns: ['createdById'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AssessmentScore',
        foreignKey: {
          name: 'AssessmentScore_assessmentId_fkey',
          columns: ['assessmentId'],
          references: { schema: 'public', table: 'Assessment', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AssessmentScore',
        foreignKey: {
          name: 'AssessmentScore_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'Student', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Attendance',
        foreignKey: {
          name: 'Attendance_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Attendance',
        foreignKey: {
          name: 'Attendance_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'Student', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Attendance',
        foreignKey: {
          name: 'Attendance_classId_fkey',
          columns: ['classId'],
          references: { schema: 'public', table: 'SchoolClass', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Attendance',
        foreignKey: {
          name: 'Attendance_termId_fkey',
          columns: ['termId'],
          references: { schema: 'public', table: 'Term', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Attendance',
        foreignKey: {
          name: 'Attendance_recordedById_fkey',
          columns: ['recordedById'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ClassSubject',
        foreignKey: {
          name: 'ClassSubject_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ClassSubject',
        foreignKey: {
          name: 'ClassSubject_classId_fkey',
          columns: ['classId'],
          references: { schema: 'public', table: 'SchoolClass', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ClassSubject',
        foreignKey: {
          name: 'ClassSubject_subjectId_fkey',
          columns: ['subjectId'],
          references: { schema: 'public', table: 'Subject', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'TeacherAssignment',
        foreignKey: {
          name: 'TeacherAssignment_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'TeacherAssignment',
        foreignKey: {
          name: 'TeacherAssignment_teacherId_fkey',
          columns: ['teacherId'],
          references: { schema: 'public', table: 'Teacher', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'TeacherAssignment',
        foreignKey: {
          name: 'TeacherAssignment_classId_fkey',
          columns: ['classId'],
          references: { schema: 'public', table: 'SchoolClass', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'TeacherAssignment',
        foreignKey: {
          name: 'TeacherAssignment_subjectId_fkey',
          columns: ['subjectId'],
          references: { schema: 'public', table: 'Subject', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
