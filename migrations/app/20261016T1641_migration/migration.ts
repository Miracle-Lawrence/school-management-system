#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/af1a15139dcc3deddfaa657697e2eeb8ee7f6b292ec3fb191f7a01b943104bb3/contract';
import endContract from '../../snapshots/af1a15139dcc3deddfaa657697e2eeb8ee7f6b292ec3fb191f7a01b943104bb3/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b0ae16366ddd635b037e77594ad3e443ba456292ea11300858d6f08e8a7f0d28/contract';
import startContract from '../../snapshots/b0ae16366ddd635b037e77594ad3e443ba456292ea11300858d6f08e8a7f0d28/contract.json' with { type: 'json' };
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
      this.dropConstraint({
        schema: 'public',
        table: 'GradeScale',
        constraint: 'GradeScale_schoolId_code_key',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'StudentTermResult',
        constraint: 'StudentTermResult_studentId_termId_reportType_key',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'SubjectResult',
        constraint: 'SubjectResult_studentId_subjectId_termId_reportType_key',
      }),
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
      this.createTable({
        schema: 'public',
        table: 'FeeCategory',
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
        table: 'FeePayment',
        columns: [
          col('amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('invoiceId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('method', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('paidAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('providerReference', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('recordedByUserId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('reference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
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
            'FeePayment_method_check_0f145c4e',
            "\"method\" IN ('CASH', 'BANK_TRANSFER', 'PAYSTACK', 'OTHER')",
          ),
          checkExpression(
            'FeePayment_status_check_147e2653',
            "\"status\" IN ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'FeeStructure',
        columns: [
          col('amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('categoryId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('classId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
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
          col('isMandatory', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('sessionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
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
      this.createTable({
        schema: 'public',
        table: 'InvoiceItem',
        columns: [
          col('amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('categoryId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('invoiceId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('quantity', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'PlatformSetting',
        columns: [
          col('defaultCurrency', 'text', {
            notNull: true,
            default: lit('NGN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('defaultTimezone', 'text', {
            notNull: true,
            default: lit('Africa/Lagos'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('maintenanceMessage', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('maintenanceMode', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('platformName', 'text', {
            notNull: true,
            default: lit('SchoolMS'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('registrationEnabled', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('supportEmail', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('supportPhone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
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
      this.createTable({
        schema: 'public',
        table: 'SchoolSubscription',
        columns: [
          col('cancelledAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('currentPeriodEnd', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('currentPeriodStart', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('planId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('startsAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('TRIALING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('trialEndsAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'SchoolSubscription_status_check_674e81b6',
            "\"status\" IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'StudentInvoice',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dueDate', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('invoiceNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('issuedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('sessionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('studentId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('termId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('termInvoiceKey', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('totalAmount', 'numeric', {
            notNull: true,
            default: lit('0'),
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'StudentInvoice_status_check_c484ea39',
            "\"status\" IN ('DRAFT', 'ISSUED', 'CANCELLED')",
          ),
          checkExpression('StudentInvoice_type_check_f256648a', "\"type\" IN ('TERM', 'ONE_OFF')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'SubscriptionPayment',
        columns: [
          col('amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('currency', 'text', {
            notNull: true,
            default: lit('NGN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('paidAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('provider', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('subscriptionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'SubscriptionPayment_status_check_d65fcf38',
            "\"status\" IN ('PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'SubscriptionPlan',
        columns: [
          col('billingInterval', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('currency', 'text', {
            notNull: true,
            default: lit('NGN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('features', 'text[]', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('maxStorageMb', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('maxStudents', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('maxTeachers', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('price', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'SubscriptionPlan_billingInterval_check_0bedc4d3',
            "\"billingInterval\" IN ('MONTHLY', 'QUARTERLY', 'YEARLY')",
          ),
          checkExpression(
            'SubscriptionPlan_features_elem_not_null_1a661718',
            'array_position("features", NULL) IS NULL',
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
        table: 'GradeScale',
        column: col('gradeScaleSetId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ReportComponent',
        column: col('assessmentCategoryId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ReportConfiguration',
        column: col('gradeScaleSetId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ReportConfiguration',
        column: col('showAttendance', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ReportConfiguration',
        column: col('showClassPosition', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ReportConfiguration',
        column: col('showClassTeacherName', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ReportConfiguration',
        column: col('showPrincipalSignature', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ReportConfiguration',
        column: col('showSchoolStamp', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'School',
        column: col('loginImageUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'School',
        column: col('principalSignatureUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'SchoolClass',
        column: col('classTeacherId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Student',
        column: col('isActive', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'StudentTermResult',
        column: col('classTeacherId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('mustChangePassword', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('sessionVersion', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'AssessmentCategory',
        constraint: 'AssessmentCategory_schoolId_name_key',
        columns: ['schoolId', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'FeeCategory',
        constraint: 'FeeCategory_schoolId_name_key',
        columns: ['schoolId', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'FeePayment',
        constraint: 'FeePayment_reference_key',
        columns: ['reference'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'FeeStructure',
        constraint: 'FeeStructure_categoryId_classId_termId_key',
        columns: ['categoryId', 'classId', 'termId'],
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
      this.addUnique({
        schema: 'public',
        table: 'ReportComment',
        constraint: 'ReportComment_studentId_termId_reportType_key',
        columns: ['studentId', 'termId', 'reportType'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'StudentInvoice',
        constraint: 'StudentInvoice_termInvoiceKey_key',
        columns: ['termInvoiceKey'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'StudentInvoice',
        constraint: 'StudentInvoice_schoolId_invoiceNumber_key',
        columns: ['schoolId', 'invoiceNumber'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'StudentTermResult',
        constraint: 'StudentTermResult_studentId_classId_termId_reportType_key',
        columns: ['studentId', 'classId', 'termId', 'reportType'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'SubjectResult',
        constraint: 'SubjectResult_studentId_classId_subjectId_termId_reportType_key',
        columns: ['studentId', 'classId', 'subjectId', 'termId', 'reportType'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'SubscriptionPayment',
        constraint: 'SubscriptionPayment_reference_key',
        columns: ['reference'],
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
        table: 'FeeCategory',
        index: 'FeeCategory_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'FeeCategory',
        index: 'FeeCategory_schoolId_isActive_idx_567af6bb',
        columns: ['schoolId', 'isActive'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'FeePayment',
        index: 'FeePayment_createdAt_idx_9575dbd7',
        columns: ['createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'FeePayment',
        index: 'FeePayment_invoiceId_idx_d5c4f70e',
        columns: ['invoiceId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'FeePayment',
        index: 'FeePayment_invoiceId_status_idx_7d5bfaf7',
        columns: ['invoiceId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'FeePayment',
        index: 'FeePayment_recordedByUserId_idx_29221a0d',
        columns: ['recordedByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'FeeStructure',
        index: 'FeeStructure_categoryId_idx_15c304f2',
        columns: ['categoryId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'FeeStructure',
        index: 'FeeStructure_classId_idx_0089e5e7',
        columns: ['classId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'FeeStructure',
        index: 'FeeStructure_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'FeeStructure',
        index: 'FeeStructure_schoolId_sessionId_termId_classId_idx_5b960f1b',
        columns: ['schoolId', 'sessionId', 'termId', 'classId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'FeeStructure',
        index: 'FeeStructure_sessionId_idx_29f415d4',
        columns: ['sessionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'FeeStructure',
        index: 'FeeStructure_termId_idx_1b74c9af',
        columns: ['termId'],
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
        table: 'InvoiceItem',
        index: 'InvoiceItem_categoryId_idx_15c304f2',
        columns: ['categoryId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'InvoiceItem',
        index: 'InvoiceItem_invoiceId_idx_d5c4f70e',
        columns: ['invoiceId'],
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
      this.createIndex({
        schema: 'public',
        table: 'ReportComponent',
        index: 'ReportComponent_assessmentCategoryId_idx_24e62543',
        columns: ['assessmentCategoryId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReportConfiguration',
        index: 'ReportConfiguration_gradeScaleSetId_idx_40aa63f0',
        columns: ['gradeScaleSetId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SchoolClass',
        index: 'SchoolClass_classTeacherId_idx_a6853519',
        columns: ['classTeacherId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SchoolSubscription',
        index: 'SchoolSubscription_currentPeriodEnd_idx_810e4bc6',
        columns: ['currentPeriodEnd'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SchoolSubscription',
        index: 'SchoolSubscription_planId_idx_5b32079a',
        columns: ['planId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SchoolSubscription',
        index: 'SchoolSubscription_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SchoolSubscription',
        index: 'SchoolSubscription_schoolId_status_idx_7110c695',
        columns: ['schoolId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentInvoice',
        index: 'StudentInvoice_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentInvoice',
        index: 'StudentInvoice_schoolId_studentId_termId_status_idx_6ec17c4b',
        columns: ['schoolId', 'studentId', 'termId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentInvoice',
        index: 'StudentInvoice_sessionId_idx_29f415d4',
        columns: ['sessionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentInvoice',
        index: 'StudentInvoice_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentInvoice',
        index: 'StudentInvoice_termId_idx_1b74c9af',
        columns: ['termId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StudentTermResult',
        index: 'StudentTermResult_classTeacherId_idx_a6853519',
        columns: ['classTeacherId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SubscriptionPayment',
        index: 'SubscriptionPayment_createdAt_idx_9575dbd7',
        columns: ['createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SubscriptionPayment',
        index: 'SubscriptionPayment_subscriptionId_idx_edbe96bf',
        columns: ['subscriptionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SubscriptionPayment',
        index: 'SubscriptionPayment_subscriptionId_status_idx_cf4c0158',
        columns: ['subscriptionId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SubscriptionPlan',
        index: 'SubscriptionPlan_isActive_idx_77fe3ba1',
        columns: ['isActive'],
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
        table: 'FeeCategory',
        foreignKey: {
          name: 'FeeCategory_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'FeePayment',
        foreignKey: {
          name: 'FeePayment_invoiceId_fkey',
          columns: ['invoiceId'],
          references: { schema: 'public', table: 'StudentInvoice', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'FeePayment',
        foreignKey: {
          name: 'FeePayment_recordedByUserId_fkey',
          columns: ['recordedByUserId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'FeeStructure',
        foreignKey: {
          name: 'FeeStructure_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'FeeStructure',
        foreignKey: {
          name: 'FeeStructure_categoryId_fkey',
          columns: ['categoryId'],
          references: { schema: 'public', table: 'FeeCategory', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'FeeStructure',
        foreignKey: {
          name: 'FeeStructure_classId_fkey',
          columns: ['classId'],
          references: { schema: 'public', table: 'SchoolClass', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'FeeStructure',
        foreignKey: {
          name: 'FeeStructure_sessionId_fkey',
          columns: ['sessionId'],
          references: { schema: 'public', table: 'AcademicSession', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'FeeStructure',
        foreignKey: {
          name: 'FeeStructure_termId_fkey',
          columns: ['termId'],
          references: { schema: 'public', table: 'Term', columns: ['id'] },
        },
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
        table: 'InvoiceItem',
        foreignKey: {
          name: 'InvoiceItem_invoiceId_fkey',
          columns: ['invoiceId'],
          references: { schema: 'public', table: 'StudentInvoice', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'InvoiceItem',
        foreignKey: {
          name: 'InvoiceItem_categoryId_fkey',
          columns: ['categoryId'],
          references: { schema: 'public', table: 'FeeCategory', columns: ['id'] },
        },
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
      this.addForeignKey({
        schema: 'public',
        table: 'ReportComponent',
        foreignKey: {
          name: 'ReportComponent_assessmentCategoryId_fkey',
          columns: ['assessmentCategoryId'],
          references: { schema: 'public', table: 'AssessmentCategory', columns: ['id'] },
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
      this.addForeignKey({
        schema: 'public',
        table: 'SchoolClass',
        foreignKey: {
          name: 'SchoolClass_classTeacherId_fkey',
          columns: ['classTeacherId'],
          references: { schema: 'public', table: 'Teacher', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SchoolSubscription',
        foreignKey: {
          name: 'SchoolSubscription_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SchoolSubscription',
        foreignKey: {
          name: 'SchoolSubscription_planId_fkey',
          columns: ['planId'],
          references: { schema: 'public', table: 'SubscriptionPlan', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentInvoice',
        foreignKey: {
          name: 'StudentInvoice_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentInvoice',
        foreignKey: {
          name: 'StudentInvoice_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'Student', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentInvoice',
        foreignKey: {
          name: 'StudentInvoice_sessionId_fkey',
          columns: ['sessionId'],
          references: { schema: 'public', table: 'AcademicSession', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentInvoice',
        foreignKey: {
          name: 'StudentInvoice_termId_fkey',
          columns: ['termId'],
          references: { schema: 'public', table: 'Term', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StudentTermResult',
        foreignKey: {
          name: 'StudentTermResult_classTeacherId_fkey',
          columns: ['classTeacherId'],
          references: { schema: 'public', table: 'Teacher', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SubscriptionPayment',
        foreignKey: {
          name: 'SubscriptionPayment_subscriptionId_fkey',
          columns: ['subscriptionId'],
          references: { schema: 'public', table: 'SchoolSubscription', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
