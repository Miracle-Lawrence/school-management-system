#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/479843e3557a0962a649a77e63bd109f047e093a600cc548f502cbe4dc57c8b1/contract';
import endContract from '../../snapshots/479843e3557a0962a649a77e63bd109f047e093a600cc548f502cbe4dc57c8b1/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b72470b16c3fede5521170532e1bea96a8fc9dfa9accc2960a6c8a5e561297f3/contract';
import startContract from '../../snapshots/b72470b16c3fede5521170532e1bea96a8fc9dfa9accc2960a6c8a5e561297f3/contract.json' with { type: 'json' };
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
        table: 'CBTActivityType',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
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
        table: 'CBTExamAttempt',
        columns: [
          col('assessmentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('attemptNumber', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('autoSubmitted', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('deadlineAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('maxScore', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('score', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('startedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('IN_PROGRESS'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('studentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('submittedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'CBTExamAttempt_status_check_e644e144',
            "\"status\" IN ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'MARKING', 'GRADED', 'VOIDED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'CBTExamOption',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('displayOrder', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('examQuestionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isCorrect', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('sourceOptionId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('text', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'CBTExamOptionImage',
        columns: [
          col('altText', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('caption', 'text', { codecRef: { codecId: 'pg/text@1' } }),
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
          col('examOptionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('storageReference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'CBTExamQuestion',
        columns: [
          col('allowMultipleAnswers', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('assessmentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('displayOrder', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('explanation', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('marks', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('prompt', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sourceQuestionId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'CBTExamQuestion_type_check_e6584e0b',
            "\"type\" IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'THEORY')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'CBTExamQuestionImage',
        columns: [
          col('altText', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('caption', 'text', { codecRef: { codecId: 'pg/text@1' } }),
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
          col('examQuestionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('storageReference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'CBTExamResponse',
        columns: [
          col('answerText', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('attemptId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('awardedMarks', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('examQuestionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('feedback', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isCorrect', 'bool', { codecRef: { codecId: 'pg/bool@1' } }),
          col('markedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('markedByUserId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('markingStatus', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'CBTExamResponse_markingStatus_check_b60cce81',
            "\"markingStatus\" IN ('PENDING', 'AUTO_MARKED', 'MANUALLY_MARKED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'CBTExamResponseOption',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('examOptionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('responseId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'CBTExamSettings',
        columns: [
          col('activityTypeId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('allowBackNavigation', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('assessmentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('closesAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('durationMinutes', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('instructions', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('maxAttempts', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('opensAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('reportMode', 'text', {
            notNull: true,
            default: lit('EXCLUDED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('resultsReleasedAt', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('shuffleOptions', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('shuffleQuestions', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'CBTExamSettings_reportMode_check_3cd9e095',
            "\"reportMode\" IN ('AUTOMATIC', 'MANUAL', 'EXCLUDED')",
          ),
          checkExpression(
            'CBTExamSettings_status_check_9c46e2c1',
            "\"status\" IN ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'CLOSED', 'ARCHIVED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'CBTOption',
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
          col('isCorrect', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('questionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('text', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'CBTOptionImage',
        columns: [
          col('altText', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('caption', 'text', { codecRef: { codecId: 'pg/text@1' } }),
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
          col('optionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('storageReference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'CBTQuestion',
        columns: [
          col('allowMultipleAnswers', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('bankId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('difficulty', 'text', {
            notNull: true,
            default: lit('MEDIUM'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('explanation', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('marks', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('prompt', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'CBTQuestion_difficulty_check_244bf003',
            "\"difficulty\" IN ('EASY', 'MEDIUM', 'HARD')",
          ),
          checkExpression(
            'CBTQuestion_type_check_e6584e0b',
            "\"type\" IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'THEORY')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'CBTQuestionBank',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('createdById', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('subjectId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
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
        table: 'CBTQuestionImage',
        columns: [
          col('altText', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('caption', 'text', { codecRef: { codecId: 'pg/text@1' } }),
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
          col('questionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('storageReference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'CBTActivityType',
        constraint: 'CBTActivityType_schoolId_name_key',
        columns: ['schoolId', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'CBTExamAttempt',
        constraint: 'CBTExamAttempt_assessmentId_studentId_attemptNumber_key',
        columns: ['assessmentId', 'studentId', 'attemptNumber'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'CBTExamOption',
        constraint: 'CBTExamOption_examQuestionId_displayOrder_key',
        columns: ['examQuestionId', 'displayOrder'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'CBTExamQuestion',
        constraint: 'CBTExamQuestion_assessmentId_displayOrder_key',
        columns: ['assessmentId', 'displayOrder'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'CBTExamResponse',
        constraint: 'CBTExamResponse_attemptId_examQuestionId_key',
        columns: ['attemptId', 'examQuestionId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'CBTExamResponseOption',
        constraint: 'CBTExamResponseOption_responseId_examOptionId_key',
        columns: ['responseId', 'examOptionId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'CBTExamSettings',
        constraint: 'CBTExamSettings_assessmentId_key',
        columns: ['assessmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTActivityType',
        index: 'CBTActivityType_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTActivityType',
        index: 'CBTActivityType_schoolId_isActive_idx_567af6bb',
        columns: ['schoolId', 'isActive'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamAttempt',
        index: 'CBTExamAttempt_assessmentId_idx_1fe05216',
        columns: ['assessmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamAttempt',
        index: 'CBTExamAttempt_assessmentId_studentId_status_idx_7d2c0056',
        columns: ['assessmentId', 'studentId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamAttempt',
        index: 'CBTExamAttempt_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamAttempt',
        index: 'CBTExamAttempt_studentId_submittedAt_idx_39a4bfc4',
        columns: ['studentId', 'submittedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamOption',
        index: 'CBTExamOption_examQuestionId_idx_bed55f9b',
        columns: ['examQuestionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamOption',
        index: 'CBTExamOption_sourceOptionId_idx_8e5a7335',
        columns: ['sourceOptionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamOptionImage',
        index: 'CBTExamOptionImage_examOptionId_idx_9d3b9c8b',
        columns: ['examOptionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamQuestion',
        index: 'CBTExamQuestion_assessmentId_idx_1fe05216',
        columns: ['assessmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamQuestion',
        index: 'CBTExamQuestion_sourceQuestionId_idx_cdb26c3f',
        columns: ['sourceQuestionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamQuestionImage',
        index: 'CBTExamQuestionImage_examQuestionId_idx_bed55f9b',
        columns: ['examQuestionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamResponse',
        index: 'CBTExamResponse_attemptId_idx_94f50eb9',
        columns: ['attemptId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamResponse',
        index: 'CBTExamResponse_examQuestionId_idx_bed55f9b',
        columns: ['examQuestionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamResponse',
        index: 'CBTExamResponse_markedByUserId_idx_dde7e2cd',
        columns: ['markedByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamResponse',
        index: 'CBTExamResponse_markingStatus_idx_c46904b7',
        columns: ['markingStatus'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamResponseOption',
        index: 'CBTExamResponseOption_examOptionId_idx_9d3b9c8b',
        columns: ['examOptionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamResponseOption',
        index: 'CBTExamResponseOption_responseId_idx_a001d7b5',
        columns: ['responseId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamSettings',
        index: 'CBTExamSettings_activityTypeId_idx_04380ebf',
        columns: ['activityTypeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTExamSettings',
        index: 'CBTExamSettings_status_opensAt_closesAt_idx_b83873f9',
        columns: ['status', 'opensAt', 'closesAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTOption',
        index: 'CBTOption_questionId_idx_fdb42076',
        columns: ['questionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTOptionImage',
        index: 'CBTOptionImage_optionId_idx_b1d5fce5',
        columns: ['optionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTQuestion',
        index: 'CBTQuestion_bankId_idx_7f042723',
        columns: ['bankId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTQuestion',
        index: 'CBTQuestion_difficulty_idx_ab7b4a75',
        columns: ['difficulty'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTQuestion',
        index: 'CBTQuestion_type_idx_b6b604ea',
        columns: ['type'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTQuestionBank',
        index: 'CBTQuestionBank_createdById_idx_8bf640ed',
        columns: ['createdById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTQuestionBank',
        index: 'CBTQuestionBank_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTQuestionBank',
        index: 'CBTQuestionBank_subjectId_idx_84df2a1d',
        columns: ['subjectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CBTQuestionImage',
        index: 'CBTQuestionImage_questionId_idx_fdb42076',
        columns: ['questionId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTActivityType',
        foreignKey: {
          name: 'CBTActivityType_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTExamAttempt',
        foreignKey: {
          name: 'CBTExamAttempt_assessmentId_fkey',
          columns: ['assessmentId'],
          references: { schema: 'public', table: 'Assessment', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTExamAttempt',
        foreignKey: {
          name: 'CBTExamAttempt_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'Student', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTExamOption',
        foreignKey: {
          name: 'CBTExamOption_examQuestionId_fkey',
          columns: ['examQuestionId'],
          references: { schema: 'public', table: 'CBTExamQuestion', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTExamOption',
        foreignKey: {
          name: 'CBTExamOption_sourceOptionId_fkey',
          columns: ['sourceOptionId'],
          references: { schema: 'public', table: 'CBTOption', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTExamOptionImage',
        foreignKey: {
          name: 'CBTExamOptionImage_examOptionId_fkey',
          columns: ['examOptionId'],
          references: { schema: 'public', table: 'CBTExamOption', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTExamQuestion',
        foreignKey: {
          name: 'CBTExamQuestion_assessmentId_fkey',
          columns: ['assessmentId'],
          references: { schema: 'public', table: 'Assessment', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTExamQuestion',
        foreignKey: {
          name: 'CBTExamQuestion_sourceQuestionId_fkey',
          columns: ['sourceQuestionId'],
          references: { schema: 'public', table: 'CBTQuestion', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTExamQuestionImage',
        foreignKey: {
          name: 'CBTExamQuestionImage_examQuestionId_fkey',
          columns: ['examQuestionId'],
          references: { schema: 'public', table: 'CBTExamQuestion', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTExamResponse',
        foreignKey: {
          name: 'CBTExamResponse_attemptId_fkey',
          columns: ['attemptId'],
          references: { schema: 'public', table: 'CBTExamAttempt', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTExamResponse',
        foreignKey: {
          name: 'CBTExamResponse_examQuestionId_fkey',
          columns: ['examQuestionId'],
          references: { schema: 'public', table: 'CBTExamQuestion', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTExamResponse',
        foreignKey: {
          name: 'CBTExamResponse_markedByUserId_fkey',
          columns: ['markedByUserId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTExamResponseOption',
        foreignKey: {
          name: 'CBTExamResponseOption_responseId_fkey',
          columns: ['responseId'],
          references: { schema: 'public', table: 'CBTExamResponse', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTExamResponseOption',
        foreignKey: {
          name: 'CBTExamResponseOption_examOptionId_fkey',
          columns: ['examOptionId'],
          references: { schema: 'public', table: 'CBTExamOption', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTExamSettings',
        foreignKey: {
          name: 'CBTExamSettings_activityTypeId_fkey',
          columns: ['activityTypeId'],
          references: { schema: 'public', table: 'CBTActivityType', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTExamSettings',
        foreignKey: {
          name: 'CBTExamSettings_assessmentId_fkey',
          columns: ['assessmentId'],
          references: { schema: 'public', table: 'Assessment', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTOption',
        foreignKey: {
          name: 'CBTOption_questionId_fkey',
          columns: ['questionId'],
          references: { schema: 'public', table: 'CBTQuestion', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTOptionImage',
        foreignKey: {
          name: 'CBTOptionImage_optionId_fkey',
          columns: ['optionId'],
          references: { schema: 'public', table: 'CBTOption', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTQuestion',
        foreignKey: {
          name: 'CBTQuestion_bankId_fkey',
          columns: ['bankId'],
          references: { schema: 'public', table: 'CBTQuestionBank', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTQuestionBank',
        foreignKey: {
          name: 'CBTQuestionBank_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTQuestionBank',
        foreignKey: {
          name: 'CBTQuestionBank_subjectId_fkey',
          columns: ['subjectId'],
          references: { schema: 'public', table: 'Subject', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTQuestionBank',
        foreignKey: {
          name: 'CBTQuestionBank_createdById_fkey',
          columns: ['createdById'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CBTQuestionImage',
        foreignKey: {
          name: 'CBTQuestionImage_questionId_fkey',
          columns: ['questionId'],
          references: { schema: 'public', table: 'CBTQuestion', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
