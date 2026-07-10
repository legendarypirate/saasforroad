import React from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AppWindow,
  ArrowLeft,
  ArrowRight,
  Award,
  Banknote,
  Bold,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock3,
  Cloud,
  Code2,
  Cog,
  Copy,
  Download,
  Edit,
  Ellipsis,
  Eye,
  File,
  FileText,
  FlaskConical,
  FolderOpen,
  Globe,
  HardHat,
  Heart,
  History,
  Home,
  Inbox,
  Info,
  Italic,
  Key,
  Layers,
  Link,
  Link2Off,
  List,
  ListOrdered,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MoreHorizontal,
  Phone,
  PictureInPicture,
  Plus,
  Printer,
  Projector,
  Radar,
  Redo2,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  Strikethrough,
  StopCircle,
  Table2,
  Trash2,
  Trophy,
  Underline,
  Undo2,
  Upload,
  User,
  UserPlus,
  Users,
  Wrench,
  X,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from 'lucide-react';

type IconProps = {
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<SVGSVGElement>;
};

function make(Icon: LucideIcon) {
  return function AntIcon({ className, style, onClick }: IconProps) {
    return <Icon className={className} style={style} onClick={onClick} />;
  };
}

export const PlusOutlined = make(Plus);
export const EditOutlined = make(Edit);
export const DeleteOutlined = make(Trash2);
export const UploadOutlined = make(Upload);
export const UserOutlined = make(User);
export const LogoutOutlined = make(LogOut);
export const HomeOutlined = make(Home);
export const AppstoreOutlined = make(AppWindow);
export const ProjectOutlined = make(Projector);
export const DropboxOutlined = make(Layers);
export const IdcardOutlined = make(Briefcase);
export const FileDoneOutlined = make(ClipboardList);
export const FileTextOutlined = make(FileText);
export const FolderOpenOutlined = make(FolderOpen);
export const AccountBookOutlined = make(Banknote);
export const EnvironmentOutlined = make(MapPin);
export const RobotOutlined = make(Sparkles);
export const SkinOutlined = make(Shirt);
export const ToolOutlined = make(Wrench);
export const TeamOutlined = make(Users);
export const ExperimentOutlined = make(FlaskConical);
export const SolutionOutlined = make(BookOpen);
export const BuildOutlined = make(HardHat);
export const ArrowLeftOutlined = make(ArrowLeft);
export const ArrowRightOutlined = make(ArrowRight);
export const LockOutlined = make(ShieldCheck);
export const MailOutlined = make(Mail);
export const PhoneOutlined = make(Phone);
export const SafetyCertificateOutlined = make(ShieldCheck);
export const CalendarOutlined = make(Calendar);
export const MoreOutlined = make(MoreHorizontal);
export const CloseOutlined = make(X);
export const CheckOutlined = make(Check);
export const ReloadOutlined = make(RefreshCw);
export const StopOutlined = make(StopCircle);
export const EyeOutlined = make(Eye);
export const KeyOutlined = make(Key);
export const CameraOutlined = make(Camera);
export const SaveOutlined = make(Save);
export const SearchOutlined = make(Search);
export const WarningOutlined = make(Circle);
export const MenuOutlined = make(Menu);
export const TrophyOutlined = make(Trophy);
export const DownloadOutlined = make(Download);
export const SettingOutlined = make(Cog);
export const CloudOutlined = make(Cloud);
export const ClockCircleOutlined = make(Clock3);
export const RightOutlined = make(ChevronRight);
export const BankOutlined = make(Building2);
export const CarOutlined = make(Car);
export const DollarOutlined = make(Banknote);
export const FileOutlined = make(File);
export const FormOutlined = make(Edit);
export const GlobalOutlined = make(Globe);
export const HistoryOutlined = make(History);
export const InfoCircleOutlined = make(Info);
export const LinkOutlined = make(Link);
export const PictureOutlined = make(Camera);
export const PrinterOutlined = make(Printer);
export const QuestionCircleOutlined = make(Circle);
export const StarOutlined = make(Star);
export const AimOutlined = make(Circle);
export const HeartOutlined = make(Heart);
export const BookOutlined = make(BookOpen);
export const CheckCircleOutlined = make(CheckCircle2);
export const RiseOutlined = make(ChevronRight);
export const ApartmentOutlined = make(Building2);
export const CompressOutlined = make(ZoomOut);
export const ZoomInOutlined = make(ZoomIn);
export const ZoomOutOutlined = make(ZoomOut);
export const BoldOutlined = make(Bold);
export const ItalicOutlined = make(Italic);
export const UnderlineOutlined = make(Underline);
export const StrikethroughOutlined = make(Strikethrough);
export const CodeOutlined = make(Code2);
export const AlignLeftOutlined = make(AlignLeft);
export const AlignCenterOutlined = make(AlignCenter);
export const AlignRightOutlined = make(AlignRight);
export const UnorderedListOutlined = make(List);
export const OrderedListOutlined = make(ListOrdered);
export const TableOutlined = make(Table2);
export const UndoOutlined = make(Undo2);
export const RedoOutlined = make(Redo2);
export const DisconnectOutlined = make(Link2Off);
export const UserAddOutlined = make(UserPlus);
export const ApiOutlined = make(Circle);
export const CopyOutlined = make(Copy);
export const EllipsisOutlined = make(Ellipsis);
export const InboxOutlined = make(Inbox);
export const RadarChartOutlined = make(Radar);
export const ThunderboltOutlined = make(Sparkles);
