#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2cdf3cf64d2b23cbac2fb0cb5bab74061dc6100a932b17c1cf2adb75169fd05b/contract';
import startContract from '../../snapshots/2cdf3cf64d2b23cbac2fb0cb5bab74061dc6100a932b17c1cf2adb75169fd05b/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f8eaef4c722a27a0d058043e025adbb627ff69e688de832031cd30ab6d70b4de/contract';
import endContract from '../../snapshots/f8eaef4c722a27a0d058043e025adbb627ff69e688de832031cd30ab6d70b4de/contract.json' with { type: 'json' };
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
        table: 'PlatformSubscriptionInvoice',
        columns: [
          col('academicSessionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('createdById', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('currency', 'text', {
            notNull: true,
            default: lit('NGN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('dueDate', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('invoiceNumber', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('platformBrandSnapshot', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('ratePerStudent', 'numeric', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('schoolBrandSnapshot', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ISSUED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('studentCount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('termId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('totalAmount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'PlatformSubscriptionInvoice_status_check_234d9b32',
            "\"status\" IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'PlatformSubscriptionPayment',
        columns: [
          col('amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('confirmedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('confirmedById', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
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
          col('paymentReference', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('platformBrandSnapshot', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('receiptNumber', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('recordedById', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('schoolBrandSnapshot', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
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
            'PlatformSubscriptionPayment_method_check_58b9b9ac',
            "\"method\" IN ('BANK_TRANSFER', 'CASH')",
          ),
          checkExpression(
            'PlatformSubscriptionPayment_status_check_af8a6ba5',
            "\"status\" IN ('PENDING', 'CONFIRMED', 'REJECTED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'SchoolBillingRate',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('createdById', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('currency', 'text', {
            notNull: true,
            default: lit('NGN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ratePerStudent', 'numeric', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1' },
          }),
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
        table: 'PlatformSetting',
        column: col('accentColor', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'PlatformSetting',
        column: col('businessAddress', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'PlatformSetting',
        column: col('invoiceFooterText', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'PlatformSetting',
        column: col('logoUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'PlatformSetting',
        column: col('primaryColor', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'PlatformSetting',
        column: col('secondaryColor', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'PlatformSetting',
        column: col('website', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'PlatformSubscriptionInvoice',
        constraint: 'PlatformSubscriptionInvoice_invoiceNumber_key',
        columns: ['invoiceNumber'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'PlatformSubscriptionInvoice',
        constraint: 'PlatformSubscriptionInvoice_schoolId_academicSessionId_termId_key',
        columns: ['schoolId', 'academicSessionId', 'termId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'PlatformSubscriptionPayment',
        constraint: 'PlatformSubscriptionPayment_receiptNumber_key',
        columns: ['receiptNumber'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'PlatformSubscriptionPayment',
        constraint: 'PlatformSubscriptionPayment_paymentReference_key',
        columns: ['paymentReference'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'SchoolBillingRate',
        constraint: 'SchoolBillingRate_schoolId_key',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PlatformSubscriptionInvoice',
        index: 'PlatformSubscriptionInvoice_academicSessionId_idx_54f76507',
        columns: ['academicSessionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PlatformSubscriptionInvoice',
        index: 'PlatformSubscriptionInvoice_createdById_idx_8bf640ed',
        columns: ['createdById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PlatformSubscriptionInvoice',
        index: 'PlatformSubscriptionInvoice_dueDate_idx_fb527616',
        columns: ['dueDate'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PlatformSubscriptionInvoice',
        index: 'PlatformSubscriptionInvoice_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PlatformSubscriptionInvoice',
        index: 'PlatformSubscriptionInvoice_schoolId_status_idx_7110c695',
        columns: ['schoolId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PlatformSubscriptionInvoice',
        index: 'PlatformSubscriptionInvoice_termId_idx_1b74c9af',
        columns: ['termId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PlatformSubscriptionInvoice',
        index: 'platform_invoice_session_term_idx',
        columns: ['academicSessionId', 'termId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PlatformSubscriptionPayment',
        index: 'PlatformSubscriptionPayment_confirmedById_idx_bf02ea5f',
        columns: ['confirmedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PlatformSubscriptionPayment',
        index: 'PlatformSubscriptionPayment_invoiceId_idx_d5c4f70e',
        columns: ['invoiceId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PlatformSubscriptionPayment',
        index: 'PlatformSubscriptionPayment_invoiceId_status_idx_7d5bfaf7',
        columns: ['invoiceId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PlatformSubscriptionPayment',
        index: 'PlatformSubscriptionPayment_paidAt_idx_dbfd0b83',
        columns: ['paidAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PlatformSubscriptionPayment',
        index: 'PlatformSubscriptionPayment_recordedById_idx_6595df66',
        columns: ['recordedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SchoolBillingRate',
        index: 'SchoolBillingRate_createdById_idx_8bf640ed',
        columns: ['createdById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SchoolBillingRate',
        index: 'SchoolBillingRate_isActive_idx_77fe3ba1',
        columns: ['isActive'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PlatformSubscriptionInvoice',
        foreignKey: {
          name: 'PlatformSubscriptionInvoice_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PlatformSubscriptionInvoice',
        foreignKey: {
          name: 'PlatformSubscriptionInvoice_academicSessionId_fkey',
          columns: ['academicSessionId'],
          references: { schema: 'public', table: 'AcademicSession', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PlatformSubscriptionInvoice',
        foreignKey: {
          name: 'PlatformSubscriptionInvoice_termId_fkey',
          columns: ['termId'],
          references: { schema: 'public', table: 'Term', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PlatformSubscriptionInvoice',
        foreignKey: {
          name: 'PlatformSubscriptionInvoice_createdById_fkey',
          columns: ['createdById'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PlatformSubscriptionPayment',
        foreignKey: {
          name: 'PlatformSubscriptionPayment_invoiceId_fkey',
          columns: ['invoiceId'],
          references: { schema: 'public', table: 'PlatformSubscriptionInvoice', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PlatformSubscriptionPayment',
        foreignKey: {
          name: 'PlatformSubscriptionPayment_recordedById_fkey',
          columns: ['recordedById'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PlatformSubscriptionPayment',
        foreignKey: {
          name: 'PlatformSubscriptionPayment_confirmedById_fkey',
          columns: ['confirmedById'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SchoolBillingRate',
        foreignKey: {
          name: 'SchoolBillingRate_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SchoolBillingRate',
        foreignKey: {
          name: 'SchoolBillingRate_createdById_fkey',
          columns: ['createdById'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
