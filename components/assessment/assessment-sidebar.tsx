'use client';

import React from 'react';
import {
  Building2,
  Calendar,
  ChevronRight,
  FileDown,
  FolderOpen,
  Layers,
  ListChecks,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Printer,
  Save,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InlineNotice } from '@/components/common/inline-notice';
import { cn } from '@/lib/utils';

type SourceFilter = 'all' | 'dhis2' | 'manual';

const SOURCE_OPTIONS: Array<{ value: SourceFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'dhis2', label: 'DHIMS2' },
  { value: 'manual', label: 'By hand' },
];

interface AssessmentSidebarProps {
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  selectedOrgUnits: string[];
  selectedPeriods: any[];
  dhis2OrgUnitsFlat: any[];
  isLoadingOrgUnits: boolean;
  isGenerating: boolean;
  isDataLoaded: boolean;
  isExporting: boolean;
  exportProgress: string;
  indicatorSourceFilter: SourceFilter;
  onIndicatorSourceFilterChange: (filter: SourceFilter) => void;
  onOrgUnitModalOpen: () => void;
  onPeriodModalOpen: () => void;
  onSaveModalOpen: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onOpenAssessmentModal: () => void;
  onBulkGenerateModalOpen: () => void;
  activeBulkJobId: number | null;
  onReopenBulkProgress: () => void;
  onGenerateReport: () => void;
  getOrgUnitDisplayNames: () => string[];
  getPeriodDisplayNames: () => string[];
}

/** The assessment set-up panel: what to assess, the one primary "Generate report" action, then save/export. */
export default function AssessmentSidebar({
  sidebarExpanded,
  onToggleSidebar,
  selectedOrgUnits,
  selectedPeriods,
  isLoadingOrgUnits,
  isGenerating,
  isDataLoaded,
  isExporting,
  exportProgress,
  indicatorSourceFilter,
  onIndicatorSourceFilterChange,
  onOrgUnitModalOpen,
  onPeriodModalOpen,
  onSaveModalOpen,
  onExportExcel,
  onExportPDF,
  onOpenAssessmentModal,
  onBulkGenerateModalOpen,
  activeBulkJobId,
  onReopenBulkProgress,
  onGenerateReport,
  getOrgUnitDisplayNames,
  getPeriodDisplayNames,
}: AssessmentSidebarProps) {
  const canGenerate = !isGenerating && selectedPeriods.length > 0 && selectedOrgUnits.length > 0;
  const canUseResult = isDataLoaded && !isGenerating;

  if (!sidebarExpanded) {
    return (
      <aside
        className="no-print flex w-14 shrink-0 flex-col items-center gap-2 border-r border-border bg-card py-3"
        aria-label="Assessment set-up"
      >
        <RailButton icon={PanelLeftOpen} label="Show set-up panel" onClick={onToggleSidebar} />
        <div className="my-1 h-px w-8 bg-border" />
        <RailButton icon={Building2} label="Choose facilities" onClick={onOrgUnitModalOpen} disabled={isLoadingOrgUnits} />
        <RailButton icon={Calendar} label="Choose periods" onClick={onPeriodModalOpen} />
        <RailButton
          icon={isGenerating ? Loader2 : Play}
          label="Generate report"
          onClick={onGenerateReport}
          disabled={!canGenerate}
          primary
          spin={isGenerating}
        />
        <div className="my-1 h-px w-8 bg-border" />
        <RailButton icon={Save} label="Save assessment" onClick={onSaveModalOpen} disabled={!canUseResult} />
        <RailButton icon={FileDown} label="Download Excel" onClick={onExportExcel} disabled={!canUseResult || isExporting} />
        <RailButton icon={Printer} label="Print or save as PDF" onClick={onExportPDF} disabled={!canUseResult} />
        <RailButton icon={FolderOpen} label="Open a saved assessment" onClick={onOpenAssessmentModal} />
        <RailButton icon={Layers} label="Generate for a whole group" onClick={onBulkGenerateModalOpen} />
        {activeBulkJobId != null && <RailButton icon={ListChecks} label="See group progress" onClick={onReopenBulkProgress} />}
      </aside>
    );
  }

  const orgUnitNames = selectedOrgUnits.length > 0 ? getOrgUnitDisplayNames() : [];
  const periodNames = selectedPeriods.length > 0 ? getPeriodDisplayNames() : [];

  return (
    <aside
      className="no-print flex w-80 shrink-0 flex-col border-r border-border bg-card"
      aria-label="Assessment set-up"
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <h2 className="text-sm font-semibold text-foreground">Set up assessment</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onToggleSidebar} aria-label="Hide set-up panel">
              <PanelLeftClose />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Hide set-up panel</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {/* What to assess */}
        <section className="space-y-3">
          <SectionLabel>What to assess</SectionLabel>
          <PickerField
            icon={Building2}
            label="Facilities"
            placeholder={isLoadingOrgUnits ? 'Loading facilities…' : 'Choose facilities'}
            values={orgUnitNames}
            loading={isLoadingOrgUnits}
            onClick={onOrgUnitModalOpen}
          />
          <PickerField
            icon={Calendar}
            label="Periods"
            placeholder="Choose periods"
            values={periodNames}
            onClick={onPeriodModalOpen}
          />
        </section>

        {/* Indicator source filter */}
        <section className="space-y-2">
          <SectionLabel>Show indicators</SectionLabel>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Show indicators from">
            {SOURCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={indicatorSourceFilter === opt.value}
                onClick={() => onIndicatorSourceFilterChange(opt.value)}
                className="choice-option min-h-9 justify-center px-2 py-1.5 text-xs"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <Button size="lg" className="w-full" onClick={onGenerateReport} disabled={!canGenerate}>
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Generating…
            </>
          ) : (
            <>
              <Play aria-hidden="true" />
              Generate report
            </>
          )}
        </Button>
        {!canGenerate && !isGenerating && (
          <p className="-mt-4 text-xs text-muted-foreground">Choose at least one facility and one period first.</p>
        )}

        {/* Save and export */}
        <section className="space-y-2 border-t border-dashed border-border pt-5">
          <SectionLabel>Save and share</SectionLabel>
          <Button variant="outline" className="w-full justify-start" onClick={onSaveModalOpen} disabled={!canUseResult}>
            <Save aria-hidden="true" />
            Save assessment
          </Button>
          <Button variant="secondary" className="w-full justify-start" onClick={onExportExcel} disabled={!canUseResult || isExporting}>
            {isExporting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <FileDown aria-hidden="true" />}
            {isExporting ? 'Preparing Excel…' : 'Download Excel'}
          </Button>
          {isExporting && exportProgress && <InlineNotice tone="info">{exportProgress}</InlineNotice>}
          <Button variant="secondary" className="w-full justify-start" onClick={onExportPDF} disabled={!canUseResult}>
            <Printer aria-hidden="true" />
            Print or save as PDF
          </Button>
        </section>

        {/* Saved work */}
        <section className="space-y-2 border-t border-dashed border-border pt-5">
          <SectionLabel>Saved work</SectionLabel>
          <Button variant="secondary" className="w-full justify-start" onClick={onOpenAssessmentModal}>
            <FolderOpen aria-hidden="true" />
            Open a saved assessment
          </Button>
          <Button variant="secondary" className="w-full justify-start" onClick={onBulkGenerateModalOpen}>
            <Layers aria-hidden="true" />
            Generate for a whole group
          </Button>
          {activeBulkJobId != null && (
            <Button variant="secondary" className="w-full justify-start" onClick={onReopenBulkProgress}>
              <ListChecks aria-hidden="true" />
              See group progress
            </Button>
          )}
        </section>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{children}</h3>;
}

function PickerField({
  icon: Icon,
  label,
  placeholder,
  values,
  loading,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  placeholder: string;
  values: string[];
  loading?: boolean;
  onClick: () => void;
}) {
  const hasValues = values.length > 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {hasValues && <span className="font-clinical text-xs text-muted-foreground">{values.length} chosen</span>}
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={cn(
          'group flex w-full items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/45 hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-wait disabled:opacity-60',
          hasValues ? 'border-primary-border' : 'border-input'
        )}
      >
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
            hasValues ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
        </span>
        <span className="min-w-0 flex-1">
          {hasValues ? (
            <>
              <span className="block truncate text-sm font-medium text-foreground">{values.slice(0, 2).join(', ')}</span>
              {values.length > 2 && <span className="block text-xs text-muted-foreground">and {values.length - 2} more</span>}
            </>
          ) : (
            <span className="block text-sm text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
      </button>
    </div>
  );
}

function RailButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  primary,
  spin,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  spin?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* span keeps the tooltip working when the button is disabled */}
        <span>
          <Button
            variant={primary ? 'default' : 'ghost'}
            size="icon"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
          >
            <Icon className={cn(spin && 'animate-spin')} />
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
