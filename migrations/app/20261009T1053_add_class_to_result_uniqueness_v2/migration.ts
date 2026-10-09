#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/67a62c9c8dd259f33afc6fd18c4507b2224c8126974a1546c4bebff50a4d4721/contract';
import startContract from '../../snapshots/67a62c9c8dd259f33afc6fd18c4507b2224c8126974a1546c4bebff50a4d4721/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/e8efc318395b2cfd350d73b717c33fe9e663056776056e01445930ee0652c6dd/contract';
import endContract from '../../snapshots/e8efc318395b2cfd350d73b717c33fe9e663056776056e01445930ee0652c6dd/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropConstraint({
        schema: 'public',
        table: 'StudentTermResult',
        constraint: 'StudentTermResult_studentId_termId_reportType_key',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'SubjectResult',
        constraint: 'SubjectResult_studentId_subjectId_termId_reportType_key',
      }),
      this.addUnique({
        schema: 'public',
        table: 'StudentTermResult',
        constraint: 'StudentTermResult_studentId_classId_termId_reportType_key',
        columns: ['studentId', 'classId', 'termId', 'reportType'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'SubjectResult',
        constraint: 'SubjectResult_studentId_classId_subjectId_termId_reportType_key',
        columns: ['studentId', 'classId', 'subjectId', 'termId', 'reportType'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
