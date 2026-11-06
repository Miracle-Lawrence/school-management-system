#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/b72470b16c3fede5521170532e1bea96a8fc9dfa9accc2960a6c8a5e561297f3/contract';
import endContract from '../../snapshots/b72470b16c3fede5521170532e1bea96a8fc9dfa9accc2960a6c8a5e561297f3/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e1c6ae023ccfe582c7b8a58e98623014782dce21563d5e11d5fece9e6a6d0b5c/contract';
import startContract from '../../snapshots/e1c6ae023ccfe582c7b8a58e98623014782dce21563d5e11d5fece9e6a6d0b5c/contract.json' with { type: 'json' };
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
        table: 'ContactEnquiry',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('message', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('service', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('NEW'),
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
            'ContactEnquiry_status_check_4518e741',
            "\"status\" IN ('NEW', 'READ', 'REPLIED', 'ARCHIVED')",
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ContactEnquiry',
        index: 'ContactEnquiry_createdAt_idx_9575dbd7',
        columns: ['createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ContactEnquiry',
        index: 'ContactEnquiry_status_createdAt_idx_58610442',
        columns: ['status', 'createdAt'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
