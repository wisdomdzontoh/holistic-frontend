'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { assessmentService } from '@/lib/assessment-service';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface SavedItem {
  id: string;
  name: string;
  org_unit_id: string;
  org_unit_name: string;
  created_at: string;
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
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{open:boolean,id?:string}>({open:false});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      try {
        const res = await assessmentService.getSavedAssessments({ org_unit_id: orgUnitId });
        const list = res?.assessments || [];
        setItems(list);
      } catch (e) {
        console.error('Failed to load saved assessments', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, orgUnitId]);

  const filtered = items.filter(i => i.name.toLowerCase().includes(filter.toLowerCase()));
  useEffect(()=>{ setPage(1); }, [filter, items.length]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIdx = (page - 1) * pageSize;
  const view = filtered.slice(startIdx, startIdx + pageSize);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Open saved assessment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input placeholder="Filter by name" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="max-h-80 overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Org unit</th>
                  <th className="text-left px-3 py-2">Created</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-3 py-3" colSpan={4}>Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td className="px-3 py-3" colSpan={4}>No saved assessments</td></tr>
                ) : (
                  view.map(item => (
                    <tr key={item.id} className={`cursor-pointer hover:bg-gray-50 ${selectedId===item.id?'bg-blue-50':''}`} onClick={() => setSelectedId(item.id)}>
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">{item.org_unit_name}</td>
                      <td className="px-3 py-2">{new Date(item.created_at).toLocaleString()}</td>
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
              <span className="text-gray-500">{filtered.length} total</span>
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
              style={{ backgroundColor: '#265380' }}
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
            // refresh list
            try {
              const res = await assessmentService.getSavedAssessments({ org_unit_id: orgUnitId });
              setItems(res?.assessments || []);
            } catch {}
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
            <Button className="text-white" style={{backgroundColor:'#265380'}} onClick={()=>{ if(name.trim()){ onConfirm(name.trim()); onClose(); } }}>Save</Button>
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
            <Button className="text-white" style={{backgroundColor:'#265380'}} onClick={()=>{onConfirm(); onClose();}}>{confirmText}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


