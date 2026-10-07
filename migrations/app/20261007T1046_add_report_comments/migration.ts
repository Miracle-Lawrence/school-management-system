#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/335015b4b223abb4b7862dbde7dde99fc44ee85a33bac9ffbbc77568c7b070b4/contract';
import startContract from '../../snapshots/335015b4b223abb4b7862dbde7dde99fc44ee85a33bac9ffbbc77568c7b070b4/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b0ae16366ddd635b037e77594ad3e443ba456292ea11300858d6f08e8a7f0d28/contract';
import endContract from '../../snapshots/b0ae16366ddd635b037e77594ad3e443ba456292ea11300858d6f08e8a7f0d28/contract.json' with { type: 'json' };
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
        table: 'GradeScale',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('displayOrder', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('maxScore', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('minScore', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('remark', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'PsychomotorField',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('displayOrder', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
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
      this.createTable({
        schema: 'public',
        table: 'PsychomotorRatingOption',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('displayOrder', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('label', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('value', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'ReportComponent',
        columns: [
          col('aggregationType', 'text', {
            notNull: true,
            default: lit('SUM'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('assessmentType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('configurationId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('countsTowardTotal', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('displayOrder', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isRequired', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('isVisible', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('maxScore', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('weight', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'ReportComponent_aggregationType_check_a8fad6eb',
            "\"aggregationType\" IN ('SUM', 'AVERAGE')",
          ),
          checkExpression(
            'ReportComponent_assessmentType_check_0838403d',
            "\"assessmentType\" IN ('ASSIGNMENT', 'TEST', 'CA', 'EXAM', 'PROJECT', 'PRACTICAL', 'OTHER')",
          ),
          checkExpression(
            'ReportComponent_type_check_441f2946',
            "\"type\" IN ('ASSESSMENT', 'CALCULATED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'ReportComponentRule',
        columns: [
          col('componentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('sourceComponentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('weight', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'ReportConfiguration',
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
          col('reportType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'ReportConfiguration_reportType_check_6c6f706e',
            "\"reportType\" IN ('MID_TERM', 'TERMINAL')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'ResultComponentScore',
        columns: [
          col('componentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('maxScore', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('score', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('subjectResultId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'StudentPsychomotorRating',
        columns: [
          col('comment', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('fieldId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('ratingId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('studentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('termId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'StudentTermResult',
        columns: [
          col('averageScore', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('classId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('grade', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('position', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('remark', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reportType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('studentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('termId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('totalScore', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'StudentTermResult_reportType_check_6c6f706e',
            "\"reportType\" IN ('MID_TERM', 'TERMINAL')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'SubjectResult',
        columns: [
          col('classId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('grade', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('percentageScore', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('remark', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reportType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('studentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('subjectId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('termId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('totalScore', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'SubjectResult_reportType_check_6c6f706e',
            "\"reportType\" IN ('MID_TERM', 'TERMINAL')",
          ),
        ],
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
        table: 'School',
        column: col('accentColor', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'School',
        column: col('faviconUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'School',
        column: col('logoUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'School',
        column: col('motto', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'School',
        column: col('primaryColor', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'School',
        column: col('principalName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'School',
        column: col('principalTitle', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'School',
        column: col('secondaryColor', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'School',
        column: col('stampUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'School',
        column: col('website', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Student',
        column: col('photoUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
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
        table: 'GradeScale',
        constraint: 'GradeScale_schoolId_code_key',
        columns: ['schoolId', 'code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'PsychomotorField',
        constraint: 'PsychomotorField_schoolId_name_key',
        columns: ['schoolId', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'PsychomotorRatingOption',
        constraint: 'PsychomotorRatingOption_schoolId_value_key',
        columns: ['schoolId', 'value'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'ReportComponent',
        constraint: 'ReportComponent_configurationId_name_key',
        columns: ['configurationId', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'ReportComponentRule',
        constraint: 'ReportComponentRule_componentId_sourceComponentId_key',
        columns: ['componentId', 'sourceComponentId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'ReportConfiguration',
        constraint: 'ReportConfiguration_schoolId_reportType_key',
        columns: ['schoolId', 'reportType'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'ResultComponentScore',
        constraint: 'ResultComponentScore_subjectResultId_componentId_key',
        columns: ['subjectResultId', 'componentId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'StudentPsychomotorRating',
        constraint: 'StudentPsychomotorRating_studentId_termId_fieldId_key',
        columns: ['studentId', 'termId', 'fieldId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'StudentTermResult',
        constraint: 'StudentTermResult_studentId_termId_reportType_key',
        columns: ['studentId', 'termId', 'reportType'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'SubjectResult',
        constraint: 'SubjectResult_studentId_subjectId_termId_reportType_key',
        columns: ['studentId', 'subjectId', 'termId', 'reportType'],
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
        table: 'GradeScale',
        index: 'GradeScale_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PsychomotorField',
        index: 'PsychomotorField_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PsychomotorRatingOption',
        index: 'PsychomotorRatingOption_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportComponent',
        index: 'ReportComponent_configurationId_idx_9f879af3',
        columns: ['configurationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportComponentRule',
        index: 'ReportComponentRule_componentId_idx_34539a70',
        columns: ['componentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportComponentRule',
        index: 'ReportComponentRule_sourceComponentId_idx_11805e31',
        columns: ['sourceComponentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportConfiguration',
        index: 'ReportConfiguration_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ResultComponentScore',
        index: 'ResultComponentScore_componentId_idx_34539a70',
        columns: ['componentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ResultComponentScore',
        index: 'ResultComponentScore_subjectResultId_idx_9e6706b5',
        columns: ['subjectResultId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentPsychomotorRating',
        index: 'StudentPsychomotorRating_fieldId_idx_44d815d7',
        columns: ['fieldId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentPsychomotorRating',
        index: 'StudentPsychomotorRating_ratingId_idx_5fb55689',
        columns: ['ratingId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentPsychomotorRating',
        index: 'StudentPsychomotorRating_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentPsychomotorRating',
        index: 'StudentPsychomotorRating_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentPsychomotorRating',
        index: 'StudentPsychomotorRating_termId_idx_1b74c9af',
        columns: ['termId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentTermResult',
        index: 'StudentTermResult_classId_idx_0089e5e7',
        columns: ['classId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentTermResult',
        index: 'StudentTermResult_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentTermResult',
        index: 'StudentTermResult_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentTermResult',
        index: 'StudentTermResult_termId_idx_1b74c9af',
        columns: ['termId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SubjectResult',
        index: 'SubjectResult_classId_idx_0089e5e7',
        columns: ['classId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SubjectResult',
        index: 'SubjectResult_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SubjectResult',
        index: 'SubjectResult_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SubjectResult',
        index: 'SubjectResult_subjectId_idx_84df2a1d',
        columns: ['subjectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SubjectResult',
        index: 'SubjectResult_termId_idx_1b74c9af',
        columns: ['termId'],
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
        table: 'GradeScale',
        foreignKey: {
          name: 'GradeScale_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PsychomotorField',
        foreignKey: {
          name: 'PsychomotorField_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PsychomotorRatingOption',
        foreignKey: {
          name: 'PsychomotorRatingOption_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ReportComponent',
        foreignKey: {
          name: 'ReportComponent_configurationId_fkey',
          columns: ['configurationId'],
          references: { schema: 'public', table: 'ReportConfiguration', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ReportComponentRule',
        foreignKey: {
          name: 'ReportComponentRule_componentId_fkey',
          columns: ['componentId'],
          references: { schema: 'public', table: 'ReportComponent', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ReportComponentRule',
        foreignKey: {
          name: 'ReportComponentRule_sourceComponentId_fkey',
          columns: ['sourceComponentId'],
          references: { schema: 'public', table: 'ReportComponent', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ReportConfiguration',
        foreignKey: {
          name: 'ReportConfiguration_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ResultComponentScore',
        foreignKey: {
          name: 'ResultComponentScore_subjectResultId_fkey',
          columns: ['subjectResultId'],
          references: { schema: 'public', table: 'SubjectResult', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ResultComponentScore',
        foreignKey: {
          name: 'ResultComponentScore_componentId_fkey',
          columns: ['componentId'],
          references: { schema: 'public', table: 'ReportComponent', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentPsychomotorRating',
        foreignKey: {
          name: 'StudentPsychomotorRating_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentPsychomotorRating',
        foreignKey: {
          name: 'StudentPsychomotorRating_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'Student', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentPsychomotorRating',
        foreignKey: {
          name: 'StudentPsychomotorRating_termId_fkey',
          columns: ['termId'],
          references: { schema: 'public', table: 'Term', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentPsychomotorRating',
        foreignKey: {
          name: 'StudentPsychomotorRating_fieldId_fkey',
          columns: ['fieldId'],
          references: { schema: 'public', table: 'PsychomotorField', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentPsychomotorRating',
        foreignKey: {
          name: 'StudentPsychomotorRating_ratingId_fkey',
          columns: ['ratingId'],
          references: { schema: 'public', table: 'PsychomotorRatingOption', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentTermResult',
        foreignKey: {
          name: 'StudentTermResult_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentTermResult',
        foreignKey: {
          name: 'StudentTermResult_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'Student', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentTermResult',
        foreignKey: {
          name: 'StudentTermResult_classId_fkey',
          columns: ['classId'],
          references: { schema: 'public', table: 'SchoolClass', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentTermResult',
        foreignKey: {
          name: 'StudentTermResult_termId_fkey',
          columns: ['termId'],
          references: { schema: 'public', table: 'Term', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SubjectResult',
        foreignKey: {
          name: 'SubjectResult_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SubjectResult',
        foreignKey: {
          name: 'SubjectResult_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'Student', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SubjectResult',
        foreignKey: {
          name: 'SubjectResult_classId_fkey',
          columns: ['classId'],
          references: { schema: 'public', table: 'SchoolClass', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SubjectResult',
        foreignKey: {
          name: 'SubjectResult_subjectId_fkey',
          columns: ['subjectId'],
          references: { schema: 'public', table: 'Subject', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SubjectResult',
        foreignKey: {
          name: 'SubjectResult_termId_fkey',
          columns: ['termId'],
          references: { schema: 'public', table: 'Term', columns: ['id'] },
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
