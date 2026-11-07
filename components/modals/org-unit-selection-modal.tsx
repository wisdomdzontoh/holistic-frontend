'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormDialog } from '@/components/common/form-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { cn } from '@/lib/utils';
import {
  X,
  ChevronRight,
  ChevronDown,
  Building2,
  Folder,
  Loader2
} from 'lucide-react';

import { DHIS2OrgUnit, assessmentService } from '@/lib/assessment-service';

interface OrgUnitSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (orgUnits: string[]) => void;
  selectedOrgUnits: string[];
  dhis2OrgUnits?: DHIS2OrgUnit[];
}

interface OrgUnitNode {
  id: string;
  name: string;
  displayName: string;
  level: number;
  children?: OrgUnitNode[];
  isExpanded?: boolean;
  isSelected?: boolean;
  isLoading?: boolean;
  hasLoadedChildren?: boolean;
}

export function OrgUnitSelectionModal({ 
  isOpen, 
  onClose, 
  onUpdate, 
  selectedOrgUnits,
  dhis2OrgUnits = []
}: OrgUnitSelectionModalProps) {
  const [selectedUnits, setSelectedUnits] = useState<string[]>(selectedOrgUnits);
  const [orgUnitTree, setOrgUnitTree] = useState<OrgUnitNode[]>([]);



  // Convert flat org units to tree structure
  useEffect(() => {
    if (dhis2OrgUnits.length > 0) {
      const tree = buildOrgUnitTree(dhis2OrgUnits);
      setOrgUnitTree(tree);
    }
  }, [dhis2OrgUnits]);

  // Initialize selected units
  useEffect(() => {
    setSelectedUnits(selectedOrgUnits);
  }, [selectedOrgUnits]);

  const buildOrgUnitTree = (orgUnits: DHIS2OrgUnit[]): OrgUnitNode[] => {
    // Convert DHIS2OrgUnit to OrgUnitNode recursively
    const convertToNode = (unit: DHIS2OrgUnit): OrgUnitNode => {
      return {
        id: unit.id,
        name: unit.name,
        displayName: unit.displayName,
        level: unit.level,
        children: unit.children ? unit.children.map(convertToNode) : [],
        isExpanded: false,
        isSelected: selectedUnits.includes(unit.id),
        isLoading: false,
        hasLoadedChildren: unit.children ? unit.children.length > 0 : false
      };
    };

    // Convert all root units
    return orgUnits.map(convertToNode);
  };

  const loadChildrenForNode = async (nodeId: string) => {
    // Find the node and mark it as loading
    setOrgUnitTree(prev => updateNodeLoading(prev, nodeId, true));

    try {
      // Fetch children from the API
      const children = await assessmentService.getDHIS2OrgUnitChildren(nodeId);
      
      // Convert children to OrgUnitNode format
      const childNodes: OrgUnitNode[] = children.map(child => ({
        id: child.id,
        name: child.name,
        displayName: child.displayName,
        level: child.level,
        children: [],
        isExpanded: false,
        isSelected: selectedUnits.includes(child.id),
        isLoading: false,
        hasLoadedChildren: false
      }));

      // Update the tree with the new children
      setOrgUnitTree(prev => updateNodeChildren(prev, nodeId, childNodes));
    } catch (error) {
      console.error('Error loading children for node:', nodeId, error);
    } finally {
      // Mark the node as no longer loading
      setOrgUnitTree(prev => updateNodeLoading(prev, nodeId, false));
    }
  };

  const updateNodeLoading = (nodes: OrgUnitNode[], nodeId: string, isLoading: boolean): OrgUnitNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, isLoading };
      }
      if (node.children) {
        return { ...node, children: updateNodeLoading(node.children, nodeId, isLoading) };
      }
      return node;
    });
  };

  const updateNodeChildren = (nodes: OrgUnitNode[], nodeId: string, children: OrgUnitNode[]): OrgUnitNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, children, hasLoadedChildren: true };
      }
      if (node.children) {
        return { ...node, children: updateNodeChildren(node.children, nodeId, children) };
      }
      return node;
    });
  };

  const toggleOrgUnitExpansion = async (nodeId: string) => {
    // Find the node
    const findNode = (nodes: OrgUnitNode[]): OrgUnitNode | null => {
      for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const node = findNode(orgUnitTree);
    if (!node) return;

    // If expanding and children haven't been loaded yet, load them
    if (!node.isExpanded && !node.hasLoadedChildren && !node.isLoading) {
      await loadChildrenForNode(nodeId);
    }

    // Toggle expansion
    setOrgUnitTree(prev => toggleNodeExpansion(prev, nodeId));
  };

  const toggleNodeExpansion = (nodes: OrgUnitNode[], nodeId: string): OrgUnitNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, isExpanded: !node.isExpanded };
      }
      if (node.children) {
        return { ...node, children: toggleNodeExpansion(node.children, nodeId) };
      }
      return node;
    });
  };

  const toggleOrgUnitSelection = (nodeId: string) => {
    setSelectedUnits(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
    
    // Update tree selection state
    setOrgUnitTree(prev => updateNodeSelection(prev, nodeId));
  };

  const updateNodeSelection = (nodes: OrgUnitNode[], nodeId: string): OrgUnitNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        const isSelected = !node.isSelected;
        return { ...node, isSelected };
      }
      if (node.children) {
        return { ...node, children: updateNodeSelection(node.children, nodeId) };
      }
      return node;
    });
  };

  const renderOrgUnitNode = (node: OrgUnitNode, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isLeaf = !hasChildren && !node.hasLoadedChildren;
    const checkboxId = `ou-${node.id}`;

    return (
      <li key={node.id} role="treeitem" aria-expanded={isLeaf ? undefined : !!node.isExpanded} aria-selected={!!node.isSelected}>
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border py-1.5 pr-3 transition-colors',
            node.isSelected ? 'border-primary-border bg-primary-soft' : 'border-transparent hover:bg-surface-muted/60'
          )}
          // Dynamic: indentation follows the tree depth.
          style={{ paddingLeft: `${8 + depth * 22}px` }}
        >
          {isLeaf ? (
            <span className="w-7 shrink-0" />
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleOrgUnitExpansion(node.id);
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              disabled={node.isLoading}
              aria-label={node.isExpanded ? `Collapse ${node.displayName}` : `Expand ${node.displayName}`}
            >
              {node.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : node.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}

          <Checkbox
            id={checkboxId}
            checked={node.isSelected || false}
            onCheckedChange={() => toggleOrgUnitSelection(node.id)}
          />

          <label htmlFor={checkboxId} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
            {isLeaf ? (
              <Building2 className="h-4 w-4 shrink-0 text-tint-teal" aria-hidden="true" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <span className={cn('truncate text-sm', node.isSelected ? 'font-semibold text-primary' : 'text-foreground')}>
              {node.displayName}
            </span>
          </label>
        </div>

        {hasChildren && node.isExpanded && (
          <ul role="group" className="mt-0.5 space-y-0.5">
            {node.children!.map(child => renderOrgUnitNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const handleUpdate = () => {
    onUpdate(selectedUnits);
    onClose();
  };

  const getSelectedOrgUnitNames = () => {
    return selectedUnits.map(unitId => {
      // First try to find in the orgUnitTree (current state)
      const findInTree = (nodes: OrgUnitNode[]): OrgUnitNode | undefined => {
        for (const node of nodes) {
          if (node.id === unitId) return node;
          if (node.children) {
            const found = findInTree(node.children);
            if (found) return found;
          }
        }
        return undefined;
      };
      
      const treeNode = findInTree(orgUnitTree);
      if (treeNode) {
        return treeNode.displayName || treeNode.name;
      }
      
      // Fallback to searching in dhis2OrgUnits
      const findUnit = (units: DHIS2OrgUnit[]): DHIS2OrgUnit | undefined => {
        for (const unit of units) {
          if (unit.id === unitId) return unit;
          if (unit.children) {
            const found = findUnit(unit.children);
            if (found) return found;
          }
        }
        return undefined;
      };
      
      const unit = findUnit(dhis2OrgUnits);
      return unit ? unit.displayName : unitId;
    });
  };

  const selectedNames = getSelectedOrgUnitNames();

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Choose facilities"
      description="Expand a region or district to find facilities. Tick every unit you want in this assessment."
      size="xl"
      fill
      footerStart={
        <span>
          <span className="font-clinical font-medium text-foreground">{selectedUnits.length}</span> chosen
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpdate}>Use these facilities</Button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card p-2">
          {orgUnitTree.length > 0 ? (
            <ul role="tree" aria-label="Organisation units" aria-multiselectable="true" className="space-y-0.5">
              {orgUnitTree.map(node => renderOrgUnitNode(node))}
            </ul>
          ) : (
            <EmptyState
              illustration="empty-list"
              title="No facilities available"
              description="Your DHIMS2 account doesn't have any organisation units assigned. Ask your DHIMS2 administrator to give you access."
            />
          )}
        </div>

        {selectedUnits.length > 0 && (
          <div className="shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Chosen</h3>
              <Button variant="link" size="xs" className="h-auto px-0" onClick={() => {
                setOrgUnitTree(prev => clearTreeSelection(prev));
                setSelectedUnits([]);
              }}>
                Clear all
              </Button>
            </div>
            <ul className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
              {selectedNames.map((name, index) => (
                <li key={selectedUnits[index]}>
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary-border bg-primary-soft py-0.5 pr-1 pl-2.5 text-xs font-medium text-primary">
                    {name}
                    <button
                      type="button"
                      onClick={() => toggleOrgUnitSelection(selectedUnits[index])}
                      className="rounded-full p-0.5 transition-colors hover:bg-primary/10"
                      aria-label={`Remove ${name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </FormDialog>
  );
}

function clearTreeSelection(nodes: OrgUnitNode[]): OrgUnitNode[] {
  return nodes.map(node => ({
    ...node,
    isSelected: false,
    children: node.children ? clearTreeSelection(node.children) : node.children,
  }));
}
