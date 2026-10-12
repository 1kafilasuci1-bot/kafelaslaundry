import React, { useState } from 'react';
import { X, UserCheck } from 'lucide-react';
import { User, Transaksi } from '../types';

interface AssignStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: User[];
  transaksi: Transaksi | null;
  onAssign: (staffName: string) => void;
}

export const AssignStaffModal: React.FC<AssignStaffModalProps> = ({
  isOpen,
  onClose,
  staffList,
  transaksi,
  onAssign,
}) => {
  const [selectedStaff, setSelectedStaff] = useState<string>('');

  if (!isOpen || !transaksi) return null;

  const handleSave = () => {
    if (!selectedStaff) {
      alert('Pilih salah satu staf terlebih dahulu.');
      return;
    }
    onAssign(selectedStaff);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#800000] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-white" />
            <h3 className="font-bold text-sm">Tugaskan ke Siapa?</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500">
            Pilih staf yang akan mengerjakan pesanan <strong>{transaksi.nomorTransaksi}</strong> ({transaksi.namaPelanggan}):
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {staffList.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Belum ada staf terdaftar.</p>
            ) : (
              staffList.map((staf) => (
                <label
                  key={staf.uid}
                  onClick={() => setSelectedStaff(staf.displayName)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                    selectedStaff === staf.displayName
                      ? 'border-[#800000] bg-rose-50 text-[#800000] shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{staf.displayName}</span>
                  <input
                    type="radio"
                    name="staff_selection"
                    checked={selectedStaff === staf.displayName}
                    onChange={() => setSelectedStaff(staf.displayName)}
                    className="accent-[#800000]"
                  />
                </label>
              ))
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-[#800000] hover:bg-[#660000] text-xs font-bold text-white shadow-xs transition"
            >
              Simpan Tugas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
