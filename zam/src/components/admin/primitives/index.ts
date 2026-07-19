export type { FormRule, FormRule as Rule, FormInstance } from './form-store';
export { FormValidationError, isFormValidationError } from './form-store';
export type { ColumnsType } from './table';
export type UploadFile = {
  uid: string;
  name: string;
  status?: 'done' | 'uploading' | 'error' | 'removed';
  url?: string;
  originFileObj?: File;
};
export { Table } from './table';
export { Button } from './button';
export { Input, InputNumber, MoneyInput } from './input';
export { Select } from './select';
export { Switch } from './switch';
export { Form } from './form';
export { Drawer } from './drawer';
export { Modal, ConfirmHost } from './modal';
export { DatePicker } from './date-picker';
export { Upload } from './upload';
export { Popconfirm } from './popconfirm';
export { Layout } from './layout';
export { Menu } from './menu';
export type { MenuProps } from './menu';
export { Dropdown } from './dropdown';
export { Avatar } from './avatar';
export { Tooltip } from './tooltip';
export {
  Space,
  Row,
  Col,
  Tag,
  Card,
  Typography,
  Spin,
  Divider,
  Statistic,
  Image,
} from './misc';
export { message } from './message';
export { notification } from './notification';
export {
  Tabs,
  Descriptions,
  Collapse,
  Progress,
  Slider,
  Alert,
  Breadcrumb,
  Empty,
  List,
} from './extra';
export { Rate } from './rate';

// Legacy destructuring support
import { Layout as LayoutRoot } from './layout';
export const { Header, Content, Sider } = LayoutRoot;

import { Typography as TypographyRoot } from './misc';
export const { Title, Text, Paragraph } = TypographyRoot;

import { DatePicker as DatePickerRoot } from './date-picker';
export const RangePicker = DatePickerRoot.RangePicker;

import { Input as InputRoot } from './input';
export const { Password, TextArea } = InputRoot;

import { Select as SelectRoot } from './select';
export const Option = SelectRoot.Option;

import { Menu as MenuRoot } from './menu';
export const MenuItem = MenuRoot.Item;
export const MenuDivider = MenuRoot.Divider;
