import { CanDeactivate } from '@angular/router';
import { Injectable } from '@angular/core';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

@Injectable({ providedIn: 'root' })
export class UnsavedChangesGuard implements CanDeactivate<HasUnsavedChanges> {
  canDeactivate(component: HasUnsavedChanges): boolean {
    if (component && component.hasUnsavedChanges && component.hasUnsavedChanges()) {
      return confirm('You have unsaved changes. Are you sure you want to leave?');
    }
    return true;
  }
}
