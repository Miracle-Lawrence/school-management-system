#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/adb55de101e190917148e2716f7c64bd0e77b9dc2d40d2586a601baae7529e3a/contract';
import startContract from '../../snapshots/adb55de101e190917148e2716f7c64bd0e77b9dc2d40d2586a601baae7529e3a/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/af1a15139dcc3deddfaa657697e2eeb8ee7f6b292ec3fb191f7a01b943104bb3/contract';
import endContract from '../../snapshots/af1a15139dcc3deddfaa657697e2eeb8ee7f6b292ec3fb191f7a01b943104bb3/contract.json' with { type: 'json' };
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
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
