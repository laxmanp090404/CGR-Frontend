import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const deactivateGuard: CanDeactivateFn<HasUnsavedChanges> = (
  component: HasUnsavedChanges
) => {
  if (component && typeof component.hasUnsavedChanges === 'function' && component.hasUnsavedChanges()) {
    return confirm('You have unsaved changes. Are you sure you want to leave?');
  }
  return true;
};
