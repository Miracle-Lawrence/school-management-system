#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/9287ea9c50865035a373c4354c0c3fc6d8ff559b518474a3843c5d57fb50d4ab/contract';
import endContract from '../../snapshots/9287ea9c50865035a373c4354c0c3fc6d8ff559b518474a3843c5d57fb50d4ab/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f410efa5f383d2f016680e60a03f68f441c632714d850626a6b8802002486455/contract';
import startContract from '../../snapshots/f410efa5f383d2f016680e60a03f68f441c632714d850626a6b8802002486455/contract.json' with { type: 'json' };
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
      this.addUnique({
        schema: 'public',
        table: 'SubscriptionPayment',
        constraint: 'SubscriptionPayment_reference_key',
        columns: ['reference'],
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
