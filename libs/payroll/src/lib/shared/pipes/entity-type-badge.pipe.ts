import { Pipe, PipeTransform } from '@angular/core';

const ENTITY_TYPE_CLASSES: Record<string, string> = {
  CLAIM: 'badge badge-info',
  WAGE: 'badge badge-warning',
  OVERTIME: 'badge badge-purple',
  LEAVE_REQUEST: 'badge badge-success',
  LEAVE_ADJUSTMENT: 'badge badge-teal',
  INSTALLMENT: 'badge badge-slate',
};

@Pipe({ name: 'entityTypeBadge', standalone: true, pure: true })
export class EntityTypeBadgePipe implements PipeTransform {
  transform(entityType: string | null | undefined): string {
    if (!entityType) return 'badge';
    return ENTITY_TYPE_CLASSES[entityType.toUpperCase()] ?? 'badge';
  }
}
