#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/9287ea9c50865035a373c4354c0c3fc6d8ff559b518474a3843c5d57fb50d4ab/contract';
import startContract from '../../snapshots/9287ea9c50865035a373c4354c0c3fc6d8ff559b518474a3843c5d57fb50d4ab/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ed0565f3c0f51631a9a4f98adadc9fb7d39185ef2e54df1cb8dcd8ab10209c7e/contract';
import endContract from '../../snapshots/ed0565f3c0f51631a9a4f98adadc9fb7d39185ef2e54df1cb8dcd8ab10209c7e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
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
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
