/**
 * "R" UI kit — branded building blocks (ported from zam admin).
 *
 *   import { RButton, RInput, RTable, RDrawer } from '@/components/r';
 */
export { RText, textVariants } from './RText';
export { RButton } from './RButton';
export type { RButtonProps, RButtonVariant, RButtonSize } from './RButton';
export { RActionButton } from './RActionButton';
export type { RActionButtonProps, RActionPreset } from './RActionButton';
export { RField } from './RField';
export type { RFieldProps } from './RField';
export { RInput, RTextarea } from './RInput';
export type { RInputProps, RTextareaProps } from './RInput';
export { RSelect } from './RSelect';
export type { RSelectProps, ROption } from './RSelect';
export { RCard } from './RCard';
export type { RCardProps } from './RCard';
export { RDrawer } from './RDrawer';
export type { RDrawerProps, RDrawerSide } from './RDrawer';
export { RModal } from './RModal';
export type { RModalProps } from './RModal';
export { RBadge, rBadgeVariants } from './RBadge';
export type { RBadgeProps } from './RBadge';
export { RTable, RTableActions } from './RTable';
export type { RTableProps, RTableColumn, RTableAlign } from './RTable';
export { RSearch } from './RSearch';
export type { RSearchProps } from './RSearch';
export { RPageToolbar } from './RPageToolbar';
export { REmpty } from './REmpty';
export type { REmptyProps } from './REmpty';
export { RSpinner } from './RSpinner';
export type { RSpinnerProps } from './RSpinner';

export { AdminListToolbar } from '@/components/admin/AdminListToolbar';
export { AdminCrudActions } from '@/components/admin/AdminCrudActions';
