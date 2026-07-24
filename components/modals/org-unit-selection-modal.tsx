'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  X,
  ChevronRight,
  ChevronDown,
  Building2,
  Folder,
  Circle,
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

  const renderOrgUnitNode = (node: OrgUnitNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isLeaf = !hasChildren && !node.hasLoadedChildren;
    const indentStyle = { marginLeft: `${depth * 24}px` };

    return (
      <div key={node.id} className="org-unit-node">
        <div 
          className={`flex items-center py-2 px-3 rounded-md transition-colors ${
            node.isSelected 
                              ? 'bg-brand-green/10 border border-brand-green/20' 
              : 'hover:bg-gray-50 border border-transparent'
          }`}
          style={indentStyle}
        >
          {/* Expand/Collapse button */}
          {!isLeaf && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleOrgUnitExpansion(node.id);
              }}
              className="p-1 hover:bg-gray-100 rounded mr-2 transition-colors"
              disabled={node.isLoading}
            >
              {node.isLoading ? (
                <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />
              ) : node.isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}
          {isLeaf && <div className="w-8" />}
          
          {/* Checkbox */}
          <Checkbox
            checked={node.isSelected || false}
            onCheckedChange={() => toggleOrgUnitSelection(node.id)}
            className="h-4 w-4 mr-3"
          />
          
          {/* Icon */}
          {isLeaf ? (
                            <Building2 className="h-4 w-4 text-brand-green mr-3" />
          ) : (
            <Folder className="h-4 w-4 text-gray-500 mr-3" />
          )}
          
          {/* Name */}
          <span className={`text-sm flex-1 font-medium ${
                            node.isSelected ? 'text-brand-green' : 'text-gray-800'
          }`}>
            {node.displayName}
          </span>
        </div>
        
        {/* Children */}
        {hasChildren && node.isExpanded && (
          <div className="children-container mt-1">
            {node.children!.map(child => renderOrgUnitNode(child, depth + 1))}
          </div>
        )}
      </div>
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-gray-800">Organisation unit</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Org Unit Tree */}
          <div className="flex-1 border border-gray-200 rounded-md p-3 overflow-y-auto min-h-0 bg-white">
            {orgUnitTree.length > 0 ? (
              <div className="space-y-1">
                {orgUnitTree.map(node => renderOrgUnitNode(node))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No organization units available</p>
              </div>
            )}
          </div>

          {/* Selected Units Display */}
          {selectedUnits.length > 0 && (
            <div className="flex-shrink-0 border-t pt-4">
              <h3 className="font-medium mb-3 text-gray-800 flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-brand-green" />
                Selected Units ({selectedUnits.length})
              </h3>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-gray-50 rounded-md">
                {getSelectedOrgUnitNames().map((name, index) => (
                  <Badge 
                    key={selectedUnits[index]} 
                    variant="secondary" 
                    className="bg-brand-green/20 text-brand-green border border-brand-green/30 hover:bg-brand-green/30 transition-colors"
                  >
                    <span className="font-medium">{name}</span>
                    <button
                      onClick={() => toggleOrgUnitSelection(selectedUnits[index])}
                      className="ml-2 hover:text-brand-green font-bold text-lg leading-none"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 flex justify-end space-x-2 pt-4 border-t bg-gray-50 px-4 py-3 -mx-6 -mb-6 sticky bottom-0">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Hide
          </Button>
          <Button 
            onClick={handleUpdate}
            className="text-white hover:opacity-90" 
            style={{ backgroundColor: 'var(--brand-navy)' }}
          >
            Update
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 