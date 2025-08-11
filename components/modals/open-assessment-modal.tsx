'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { assessmentService } from '@/lib/assessment-service';
import { Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

interface SavedItem {
  id: string;
  name: string;
  org_unit_id: string;
  org_unit_name: string;
  created_at: string;
  updated_at?: string;
}

export function OpenAssessmentModal({
  isOpen,
  onClose,
  onOpenAssessment,
  orgUnitId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenAssessment: (assessmentId: string) => void;
  orgUnitId?: string;
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
  const [owner, setOwner] = useState<'mine'|'all'>('mine');
  const abortRef = useRef<AbortController | null>(null);

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

  useEffect(()=>{ setPage(1); }, [filter, pageSize, ordering, owner]);
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));
  const view = items;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="px-6 pt-4">Open saved assessment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-6 pb-4">
          <div className="flex items-center gap-2">
            <Input placeholder="Search by name or org unit" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="border rounded px-2 py-1" value={ordering} onChange={(e)=>setOrdering(e.target.value as any)}>
              <option value="-created_at">Newest</option>
              <option value="created_at">Oldest</option>
              <option value="name">Name (A-Z)</option>
              <option value="-name">Name (Z-A)</option>
            </select>
            <select className="border rounded px-2 py-1" value={owner} onChange={(e)=>setOwner(e.target.value as any)}>
              <option value="mine">My assessments</option>
              <option value="all">All assessments</option>
            </select>
            <Button variant="outline" onClick={()=>fetchData()}>
              <ArrowUpDown className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
          <div className="max-h-[420px] overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Org unit</th>
                  <th className="text-left px-3 py-2">Created</th>
                  <th className="text-left px-3 py-2">Last edited</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-3 py-3" colSpan={5}>Loading...</td></tr>
                ) : view.length === 0 ? (
                  <tr><td className="px-3 py-3" colSpan={5}>No saved assessments</td></tr>
                ) : (
                  view.map(item => (
                    <tr key={item.id} className={`cursor-pointer hover:bg-gray-50 ${selectedId===item.id?'bg-blue-50':''}`} onClick={() => setSelectedId(item.id)}>
                      <td className="px-3 py-2 font-medium">{item.name}</td>
                      <td className="px-3 py-2">{item.org_unit_name}</td>
                      <td className="px-3 py-2">{new Date(item.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2">{item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'}</td>
                      <td className="px-3 py-2">
                        <button
                          title="Delete"
                          className="ml-auto text-red-600 hover:text-red-700"
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
          {/* Pagination controls */}
          <div className="flex items-center justify-between text-sm mt-2">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                className="border rounded px-2 py-1"
                value={pageSize}
                onChange={(e)=>{ setPageSize(parseInt(e.target.value,10)); setPage(1); }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-gray-500">{count} total</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="p-1 border rounded disabled:opacity-50"
                onClick={()=>setPage(p=>Math.max(1,p-1))}
                disabled={page<=1}
                title="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                className="p-1 border rounded disabled:opacity-50"
                onClick={()=>setPage(p=>Math.min(totalPages,p+1))}
                disabled={page>=totalPages}
                title="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => {
                if (!selectedId) return;
                onOpenAssessment(selectedId);
                onClose();
              }}
              disabled={!selectedId}
              style={{ backgroundColor: '#154360' }}
              className="text-white"
            >Open</Button>
          </div>
        </div>
        <ConfirmModal
          isOpen={confirmDelete.open}
          onClose={()=>setConfirmDelete({open:false})}
          title="Delete assessment"
          message="Are you sure you want to delete this saved assessment? This action cannot be undone."
          confirmText="Delete"
          onConfirm={async ()=>{
            if (!confirmDelete.id) return;
            await assessmentService.deleteAssessment({ assessment_id: confirmDelete.id });
            await fetchData();
            toast.success('Assessment deleted');
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


