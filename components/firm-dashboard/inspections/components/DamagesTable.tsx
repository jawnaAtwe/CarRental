'use client';

import { Button, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { TableSkeleton } from '@/lib/Skeletons';
import type { Damage } from '../types';

interface DamagesTableProps {
  language: string;
  damages: Damage[];
  loading: boolean;
  onAddDamage: () => void;
  onEditDamage: (damage: Damage) => void;
  onDeleteDamage: (damageId: number) => void;
}

export default function DamagesTable({
  language,
  damages,
  loading,
  onAddDamage,
  onEditDamage,
  onDeleteDamage,
}: DamagesTableProps) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{language === 'ar' ? 'الأضرار' : 'Damages'}</h3>
        <Button size="sm" color="primary" onPress={onAddDamage}>
          {language === 'ar' ? 'إضافة ضرر' : 'Add Damage'}
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : damages.length === 0 ? (
        <p className="text-center mt-2">{language === 'ar' ? 'لا توجد أضرار' : 'No damages found'}</p>
      ) : (
        <div className="overflow-x-auto mt-2">
          <Table>
            <TableHeader>
              <TableColumn>{language === 'ar' ? 'نوع الضرر' : 'Damage Type'}</TableColumn>
              <TableColumn>{language === 'ar' ? 'شدة الضرر' : 'Severity'}</TableColumn>
              <TableColumn>{language === 'ar' ? 'المكان' : 'Location'}</TableColumn>
              <TableColumn>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
            </TableHeader>
            <TableBody>
              {damages.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.damage_type}</TableCell>
                  <TableCell>{d.damage_severity}</TableCell>
                  <TableCell>{d.damage_location || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onEditDamage(d)}>
                        {language === 'ar' ? 'تعديل' : 'Edit'}
                      </Button>
                      <Button size="sm" color="danger" onClick={() => onDeleteDamage(d.id)}>
                        {language === 'ar' ? 'حذف' : 'Delete'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}