#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2cdf3cf64d2b23cbac2fb0cb5bab74061dc6100a932b17c1cf2adb75169fd05b/contract';
import endContract from '../../snapshots/2cdf3cf64d2b23cbac2fb0cb5bab74061dc6100a932b17c1cf2adb75169fd05b/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/2f0973bbf02b9e9e0ec82c155fcfa6ac30724319229330e6448aa33e1cdd5e10/contract';
import startContract from '../../snapshots/2f0973bbf02b9e9e0ec82c155fcfa6ac30724319229330e6448aa33e1cdd5e10/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'SchoolPaymentConfig',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('encryptedSecretKey', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isEnabled', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('lastValidatedAt', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('provider', 'text', {
            notNull: true,
            default: lit('PAYSTACK'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('publicKey', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'SchoolPaymentConfig',
        constraint: 'SchoolPaymentConfig_schoolId_key',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SchoolPaymentConfig',
        index: 'SchoolPaymentConfig_provider_isEnabled_idx_02148751',
        columns: ['provider', 'isEnabled'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SchoolPaymentConfig',
        foreignKey: {
          name: 'SchoolPaymentConfig_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
