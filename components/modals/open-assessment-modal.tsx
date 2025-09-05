'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { assessmentService } from '@/lib/assessment-service';
import { 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  Search,
  FileText,
  Building2,
  Calendar,
  Clock,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface SavedItem {
  id: string;
  name: string;
  org_unit_id: string;
  org_unit_name: string;
  created_at: string;
  updated_at?: string;
}

interface DHIS2OrgUnit {
  id: string;
  name: string;
  displayName: string;
  level: number;
  children?: DHIS2OrgUnit[];
}

export function OpenAssessmentModal({
  isOpen,
  onClose,
  onOpenAssessment,
  orgUnitId,
  dhis2OrgUnitsFlat = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenAssessment: (assessmentId: string) => void;
  orgUnitId?: string;
  dhis2OrgUnitsFlat?: DHIS2OrgUnit[];
}) {
  const [items, setItems] = useState<SavedItem[]>([]);
  // Debounced search
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{open:boolean,id?:string}>({open:false});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [count, setCount] = useState(0);
  const [ordering, setOrdering] = useState<'name'|'-name'|'created_at'|'-created_at'>('-created_at');
  const [owner, setOwner] = useState<'mine'>('mine'); // Users can only see their own assessments
  const abortRef = useRef<AbortController | null>(null);

  // Function to get organization unit display name
  const getOrgUnitDisplayName = (orgUnitId: string): string => {
    // Recursive function to search for org unit in nested structure
    const findOrgUnitRecursively = (units: DHIS2OrgUnit[], targetId: string): DHIS2OrgUnit | undefined => {
      for (const unit of units) {
        if (unit.id === targetId) {
          return unit;
        }
        if (unit.children && unit.children.length > 0) {
          const found = findOrgUnitRecursively(unit.children, targetId);
          if (found) return found;
        }
      }
      return undefined;
    };

    const orgUnit = findOrgUnitRecursively(dhis2OrgUnitsFlat, orgUnitId);
    return orgUnit ? (orgUnit.displayName || orgUnit.name) : orgUnitId;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Cancel in-flight request for snappy refresh
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const res = await assessmentService.getSavedAssessments({ org_unit_id: orgUnitId, page, size: pageSize, search: filter, ordering, owner }, abortRef.current.signal);
      setItems(res.results || []);
      setCount(res.count || 0);
      // If current page is now out of range after a change (e.g. deletion/filter), snap to last page
      const totalPagesNow = Math.max(1, Math.ceil((res.count || 0) / pageSize));
      if (page > totalPagesNow) {
        setPage(totalPagesNow);
      }
    } catch (e) {
      if ((e as any)?.name !== 'AbortError') {
        console.error('Failed to load saved assessments', e);
        toast.error('Failed to load saved assessments');
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search input -> updates filter
  useEffect(() => {
    const t = setTimeout(() => setFilter(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset defaults on open
  useEffect(() => {
    if (isOpen) {
      setSelectedId(null);
      // Always fetch fresh when opening
      fetchData();
    } else {
      // optional: keep filters across opens; comment out to reset
      // setSearchTerm(''); setFilter(''); setPage(1); setOrdering('-created_at'); setOwner('mine');
    }
  }, [isOpen]);

  // Fetch on parameter changes while open
  useEffect(() => {
    if (isOpen) fetchData();
  }, [orgUnitId, page, pageSize, filter, ordering, owner]);

  useEffect(()=>{ setPage(1); }, [filter, pageSize, ordering]); // owner is always 'mine'
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));
  const view = items;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 flex-shrink-0">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-slate-800">Open Saved Assessment</DialogTitle>
            </div>
            <p className="text-slate-600">Browse and open your previously saved assessments</p>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4 min-h-0">
          {/* Search and Controls */}
          <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search assessments by name or organization unit..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <select 
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
              value={ordering} 
              onChange={(e)=>setOrdering(e.target.value as any)}
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="-name">Name (Z-A)</option>
            </select>
            <Button 
              variant="outline" 
              onClick={()=>fetchData()}
              className="border-slate-300 hover:bg-slate-50 hover:border-slate-400"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Assessment Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-slate-50 to-gray-50 sticky top-0">
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Assessment Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Organization Unit</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Created</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Last Modified</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-4 py-8 text-center" colSpan={5}>
                        <div className="flex items-center justify-center gap-2 text-slate-500">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Loading assessments...
                        </div>
                      </td>
                    </tr>
                  ) : view.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center" colSpan={5}>
                        <div className="text-center text-slate-500">
                          <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                          <p className="text-lg font-medium">No saved assessments found</p>
                          <p className="text-sm">Try adjusting your search or create a new assessment</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    view.map(item => (
                      <tr 
                        key={item.id} 
                        className={`cursor-pointer transition-colors duration-200 ${
                          selectedId === item.id 
                            ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                            : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                        }`} 
                        onClick={() => setSelectedId(item.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-slate-800">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-green-600" />
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {getOrgUnitDisplayName(item.org_unit_id)}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="h-4 w-4" />
                            <span>{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Never'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            title="Delete Assessment"
                            className="ml-auto p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            onClick={(e)=>{ e.stopPropagation(); setConfirmDelete({open:true,id:item.id}); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Rows per page:</span>
              <select
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                value={pageSize}
                onChange={(e)=>{ setPageSize(parseInt(e.target.value,10)); setPage(1); }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-slate-500 font-medium">{count} total assessments</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors duration-200"
                onClick={()=>setPage(p=>Math.max(1,p-1))}
                disabled={page<=1}
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-2 text-sm font-medium text-slate-700">
                Page {page} of {totalPages}
              </span>
              <button
                className="p-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors duration-200"
                onClick={()=>setPage(p=>Math.min(totalPages,p+1))}
                disabled={page>=totalPages}
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex justify-end gap-3 pt-4 px-6 pb-4 border-t bg-background flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!selectedId) return;
              onOpenAssessment(selectedId);
              onClose();
            }}
            disabled={!selectedId}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2"
          >
            <FileText className="h-4 w-4 mr-2" />
            Open Assessment
          </Button>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmDelete.open}
          onClose={()=>setConfirmDelete({open:false})}
          title="Delete Assessment"
          message="Are you sure you want to delete this saved assessment? This action cannot be undone and all associated data will be permanently removed."
          confirmText="Delete Assessment"
          onConfirm={async ()=>{
            if (!confirmDelete.id) return;
            await assessmentService.deleteAssessment({ assessment_id: confirmDelete.id });
            await fetchData();
            toast.success('Assessment deleted successfully');
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export function NameAssessmentModal({
  isOpen,
  onClose,
  defaultName,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultName?: string;
  onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName || '');
  useEffect(() => setName(defaultName || ''), [defaultName, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Name this assessment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Enter a descriptive name" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="text-white" style={{backgroundColor:'#154360'}} onClick={()=>{ if(name.trim()){ onConfirm(name.trim()); onClose(); } }}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  confirmText = 'Confirm',
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
}){
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>{message}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="text-white" style={{backgroundColor:'#154360'}} onClick={()=>{onConfirm(); onClose();}}>{confirmText}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


