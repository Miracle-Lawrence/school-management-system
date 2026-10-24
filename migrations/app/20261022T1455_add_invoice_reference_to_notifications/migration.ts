#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/05a78c95fab60bb5bc655d8dc6a9b7cadb58a900b47203f157fe1508d6043545/contract';
import endContract from '../../snapshots/05a78c95fab60bb5bc655d8dc6a9b7cadb58a900b47203f157fe1508d6043545/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/9bdf1e33ff6afb1464692a03dcbc1cb825b7883ae92d2b8b453568bc7c96aba0/contract';
import startContract from '../../snapshots/9bdf1e33ff6afb1464692a03dcbc1cb825b7883ae92d2b8b453568bc7c96aba0/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Notification',
        column: col('invoiceId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'Notification',
        index: 'Notification_invoiceId_idx_d5c4f70e',
        columns: ['invoiceId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Notification',
        foreignKey: {
          name: 'Notification_invoiceId_fkey',
          columns: ['invoiceId'],
          references: { schema: 'public', table: 'StudentInvoice', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
