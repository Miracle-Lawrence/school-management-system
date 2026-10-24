#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/05a78c95fab60bb5bc655d8dc6a9b7cadb58a900b47203f157fe1508d6043545/contract';
import startContract from '../../snapshots/05a78c95fab60bb5bc655d8dc6a9b7cadb58a900b47203f157fe1508d6043545/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/6527becba76c878212d9175d9eedcd1f383c3212ced75cb39a4c017738ac2820/contract';
import endContract from '../../snapshots/6527becba76c878212d9175d9eedcd1f383c3212ced75cb39a4c017738ac2820/contract.json' with { type: 'json' };
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
        table: 'EmailDelivery',
        columns: [
          col('attemptCount', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('deliveredAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('lastError', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('nextRetryAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('notificationId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('providerMessageId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('recipientEmail', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('sentAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('subject', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'EmailDelivery_status_check_3c607dd6',
            "\"status\" IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED')",
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'EmailDelivery',
        index: 'EmailDelivery_notificationId_idx_adfe2654',
        columns: ['notificationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'EmailDelivery',
        index: 'EmailDelivery_providerMessageId_idx_6aba4afa',
        columns: ['providerMessageId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'EmailDelivery',
        index: 'EmailDelivery_schoolId_createdAt_idx_1d6ae506',
        columns: ['schoolId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'EmailDelivery',
        index: 'EmailDelivery_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'EmailDelivery',
        index: 'EmailDelivery_status_nextRetryAt_idx_58d36316',
        columns: ['status', 'nextRetryAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'EmailDelivery',
        index: 'EmailDelivery_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'EmailDelivery',
        foreignKey: {
          name: 'EmailDelivery_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'EmailDelivery',
        foreignKey: {
          name: 'EmailDelivery_notificationId_fkey',
          columns: ['notificationId'],
          references: { schema: 'public', table: 'Notification', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'EmailDelivery',
        foreignKey: {
          name: 'EmailDelivery_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
