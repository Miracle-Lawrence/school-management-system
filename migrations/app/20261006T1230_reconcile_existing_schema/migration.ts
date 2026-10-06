#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2dedc90337bbc3813bedba293a7604ed2c4938ca298e43c5b7270cccd3c45ee0/contract';
import startContract from '../../snapshots/2dedc90337bbc3813bedba293a7604ed2c4938ca298e43c5b7270cccd3c45ee0/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/55f8c440fd962eec62ce387a0ee74855a3d06da7e0056afe531f67946ca94c70/contract';
import endContract from '../../snapshots/55f8c440fd962eec62ce387a0ee74855a3d06da7e0056afe531f67946ca94c70/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [];
  }
}

MigrationCLI.run(import.meta.url, M);
