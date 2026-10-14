// Gedeelde UI-kit. Importeer alles via "@/components/kit".

export { Button, IconButton, buttonClassName } from "./button";
export type { ButtonProps, ButtonVariant, ButtonSize, IconButtonProps } from "./button";
export { Spinner } from "./spinner";
export type { SpinnerProps } from "./spinner";

export { Field, useFieldProps } from "./field";
export type { FieldProps } from "./field";
export { TextInput, Textarea, Select } from "./inputs";
export type { TextInputProps, TextareaProps, SelectProps } from "./inputs";
export { Checkbox } from "./checkbox";
export type { CheckboxProps } from "./checkbox";
export { Switch } from "./switch";
export type { SwitchProps } from "./switch";
export { RadioGroup, RadioCard, Radio } from "./radio";
export type { RadioGroupProps, RadioCardProps, RadioProps } from "./radio";
export { SegmentedControl } from "./segmented-control";
export type { SegmentedControlProps, SegmentedOption } from "./segmented-control";

export { Dialog, Drawer, ConfirmDialog } from "./dialog";
export type { DialogProps, DrawerProps, ConfirmDialogProps } from "./dialog";
export { ToastProvider, useToast } from "./toast";
export type { ToastOptions, ToastVariant } from "./toast";
export { Tabs, TabList, Tab, TabPanel, TabLinks } from "./tabs";
export type { TabsProps, TabListProps, TabProps, TabPanelProps, TabLinksProps, TabLinkItem, TabsVariant } from "./tabs";
export { Table, THead, TBody, TFoot, Tr, Th, Td } from "./table";
export type { TableProps, TrProps, ThProps, TdProps, SortDirection } from "./table";
export {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuLabel,
  Popover,
  PopoverTrigger,
  PopoverContent,
  usePopover,
} from "./menu";
export type { MenuProps, MenuItemProps, PopoverProps, PopoverContentProps, TriggerProps } from "./menu";

export { Badge, StatusPill } from "./badge";
export type { BadgeProps, BadgeVariant, StatusPillProps } from "./badge";
export { Alert } from "./alert";
export type { AlertProps, AlertVariant } from "./alert";
export { EmptyState } from "./empty-state";
export type { EmptyStateProps } from "./empty-state";
export { Skeleton, SkeletonText } from "./skeleton";
export type { SkeletonProps, SkeletonTextProps } from "./skeleton";
export { Stat, StatGroup } from "./stat";
export type { StatProps, StatGroupProps, StatTrend } from "./stat";
export { PageHeader } from "./page-header";
export type { PageHeaderProps } from "./page-header";
export { Section } from "./section";
export type { SectionProps } from "./section";
export { Kbd } from "./kbd";
export { VisuallyHidden } from "./visually-hidden";

// Bestaande bouwstenen, zodat alles via één import kan.
export { Card, Eyebrow, Tags, Tag, ProgressBar, ArrowButton, Avatar, Breadcrumbs } from "@/components/ui";
