#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/7cc47ac321a887374dcc021188ad788dcd084f7a01dc2a1d4edd64e9358ed0b3/contract';
import startContract from '../../snapshots/7cc47ac321a887374dcc021188ad788dcd084f7a01dc2a1d4edd64e9358ed0b3/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/9bdf1e33ff6afb1464692a03dcbc1cb825b7883ae92d2b8b453568bc7c96aba0/contract';
import endContract from '../../snapshots/9bdf1e33ff6afb1464692a03dcbc1cb825b7883ae92d2b8b453568bc7c96aba0/contract.json' with { type: 'json' };
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
        table: 'Notification',
        columns: [
          col('category', 'text', {
            notNull: true,
            default: lit('ANNOUNCEMENT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('createdByUserId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('message', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('scheduledAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('sentAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('DRAFT'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Notification_category_check_c954437d',
            "\"category\" IN ('FEE_REMINDER', 'REPORT_PUBLISHED', 'ACADEMIC', 'EVENT', 'ANNOUNCEMENT', 'URGENT')",
          ),
          checkExpression(
            'Notification_status_check_c5557860',
            "\"status\" IN ('DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'NotificationRecipient',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('notificationId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('readAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'NotificationRecipient',
        constraint: 'NotificationRecipient_notificationId_userId_key',
        columns: ['notificationId', 'userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Notification',
        index: 'Notification_createdByUserId_idx_93e8a540',
        columns: ['createdByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Notification',
        index: 'Notification_schoolId_category_idx_a39fc059',
        columns: ['schoolId', 'category'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Notification',
        index: 'Notification_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Notification',
        index: 'Notification_schoolId_scheduledAt_idx_910010d5',
        columns: ['schoolId', 'scheduledAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Notification',
        index: 'Notification_schoolId_status_idx_7110c695',
        columns: ['schoolId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'NotificationRecipient',
        index: 'NotificationRecipient_notificationId_idx_adfe2654',
        columns: ['notificationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'NotificationRecipient',
        index: 'NotificationRecipient_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'NotificationRecipient',
        index: 'NotificationRecipient_userId_readAt_idx_8bd92969',
        columns: ['userId', 'readAt'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Notification',
        foreignKey: {
          name: 'Notification_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Notification',
        foreignKey: {
          name: 'Notification_createdByUserId_fkey',
          columns: ['createdByUserId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'NotificationRecipient',
        foreignKey: {
          name: 'NotificationRecipient_notificationId_fkey',
          columns: ['notificationId'],
          references: { schema: 'public', table: 'Notification', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'NotificationRecipient',
        foreignKey: {
          name: 'NotificationRecipient_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
