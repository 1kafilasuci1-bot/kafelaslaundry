import React, { useState } from 'react';
import {
  ArrowLeft,
  Wallet,
  Plus,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  HelpCircle,
  Video,
  ChevronDown,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { User, Laundry, SubscriptionHistory } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface KelolaOwnerViewProps {
  onBack: () => void;
  currentUser: User;
  laundries: Laundry[];
  activeLaundryId: string;
  subscriptionHistory: SubscriptionHistory[];
  onSelectLaundry: (laundryId: string) => void;
  onAddLaundry: (nama: string, alamat?: string, telepon?: string, copyFromId?: string) => void;
  onUpdateLaundry: (laundry: Laundry) => void;
  onDeleteLaundry: (laundryId: string) => void;
  onTopUpWallet: (nominal: number) => void;
  onExtendSubscription: (packageName: string, cost: number, days: number) => void;
}

export const KelolaOwnerView: React.FC<KelolaOwnerViewProps> = ({
  onBack,
  currentUser,
  laundries,
  activeLaundryId,
  subscriptionHistory,
  onSelectLaundry,
  onAddLaundry,
  onUpdateLaundry,
  onDeleteLaundry,
  onTopUpWallet,
  onExtendSubscription,
}) => {
  const [showBranches, setShowBranches] = useState(true);
  const [harianDays, setHarianDays] = useState('7');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Add branch form
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [copyLayananFrom, setCopyLayananFrom] = useState<string>('');

  // Editing branch
  const [editingLaundry, setEditingLaundry] = useState<Laundry | null>(null);

  const jumlahCabang = laundries.length;
  const cabangTambahan = Math.max(0, jumlahCabang - 1);

  // Pricing formula matching KelolaOwnerActivity.kt
  const HARGA_DASAR_BULANAN = 27000;
  const HARGA_CABANG_BULANAN = 20000;
  const totalBiayaBulanan = HARGA_DASAR_BULANAN + cabangTambahan * HARGA_CABANG_BULANAN;

  const HARGA_DASAR_HARIAN = 1000;
  const HARGA_CABANG_HARIAN = 500;
  const hargaHarianPerHari = HARGA_DASAR_HARIAN + cabangTambahan * HARGA_CABANG_HARIAN;

  const sisaHari = Math.max(
    0,
    Math.ceil(((currentUser.subscriptionEndDate || Date.now()) - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const handlePayBulanan = () => {
    if (currentUser.walletBalance < totalBiayaBulanan) {
      alert(`Saldo dompet tidak mencukupi (${formatRupiah(totalBiayaBulanan)}). Silakan isi saldo terlebih dahulu.`);
      setShowTopUpModal(true);
      return;
    }
    if (confirm(`Beli Paket Bulanan 30 Hari seharga ${formatRupiah(totalBiayaBulanan)}? Saldo dompet akan dipotong.`)) {
      onExtendSubscription(`Paket Bulanan (${jumlahCabang} Cabang)`, totalBiayaBulanan, 30);
      alert('Perpanjangan langganan 30 hari berhasil!');
    }
  };

  const handlePayHarian = () => {
    const days = parseInt(harianDays, 10);
    if (isNaN(days) || days <= 0) {
      alert('Masukkan jumlah hari yang valid.');
      return;
    }
    const cost = hargaHarianPerHari * days;
    if (currentUser.walletBalance < cost) {
      alert(`Saldo dompet tidak mencukupi (${formatRupiah(cost)}). Silakan isi saldo terlebih dahulu.`);
      setShowTopUpModal(true);
      return;
    }
    if (confirm(`Beli Paket Harian ${days} Hari seharga ${formatRupiah(cost)}? Saldo dompet akan dipotong.`)) {
      onExtendSubscription(`Paket Harian ${days} Hari (${jumlahCabang} Cabang)`, cost, days);
      alert(`Perpanjangan langganan ${days} hari berhasil!`);
    }
  };

  const handleAddBranchSubmit = () => {
    if (!newBranchName.trim()) {
      alert('Nama cabang laundry wajib diisi.');
      return;
    }
    if (laundries.length >= 3) {
      alert('Maksimal batas cabang untuk akun ini adalah 3 cabang.');
      return;
    }

    onAddLaundry(newBranchName.trim(), newBranchAddress.trim() || undefined, newBranchPhone.trim() || undefined, copyLayananFrom || undefined);
    setShowAddBranchModal(false);
    setNewBranchName('');
    setNewBranchAddress('');
    setNewBranchPhone('');
    alert(`Cabang '${newBranchName}' berhasil ditambahkan!`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-slate-800 pb-16">
      {/* Top Header */}
      <header className="bg-[#800000] text-white shadow-md sticky top-0 z-30 flex items-center px-4 h-14">
        <button onClick={onBack} className="p-1 -ml-1 rounded-full hover:bg-white/10 transition mr-3">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="font-bold text-base tracking-wide">Owner & Kelola Cabang</h1>
      </header>

      <main className="flex-1 p-3 md:p-6 space-y-3 md:space-y-4 overflow-y-auto max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto w-full">
        {/* Owner Display Banner */}
        <div className="text-center py-1">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Akun Pemilik</div>
          <h2 className="text-lg font-black text-slate-900 mt-0.5">
            - {currentUser.displayName || currentUser.username} -
          </h2>
        </div>

        {/* 1. WALLET & SUBSCRIPTION CARD (Matches wallet card in activity_kelola_owner.xml) */}
        <div className="bg-[#1e293b] text-white rounded-2xl shadow-md overflow-hidden border border-slate-700">
          {/* Header Masa Aktif */}
          <div className="bg-[#800000] px-4 py-2.5 text-center text-xs font-bold flex items-center justify-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Masa Aktif Akun: {sisaHari > 0 ? `Aktif (${sisaHari} Hari Tersisa)` : 'Kedaluwarsa'}</span>
          </div>

          {/* Saldo Akun & Isi Saldo */}
          <div className="p-4 flex items-center justify-between border-b border-slate-700">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Saldo Dompet Akun</span>
              <span className="text-xl font-black text-white">{formatRupiah(currentUser.walletBalance)}</span>
            </div>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Isi Saldo</span>
            </button>
          </div>

          {/* Perpanjangan Options */}
          <div className="p-4 space-y-3">
            <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Pilihan Perpanjangan Langganan:
            </div>

            {/* Bulanan */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <div>
                <div className="font-bold text-xs text-white">Bulanan (30 Hari)</div>
                <div className="text-[11px] text-slate-400">
                  {formatRupiah(totalBiayaBulanan)} ({jumlahCabang} Cabang)
                </div>
              </div>
              <button
                onClick={handlePayBulanan}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
              >
                Bayar
              </button>
            </div>

            {/* Harian */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700 gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-white">
                  Harian ({formatRupiah(hargaHarianPerHari)}/hari)
                </div>
                <div className="text-[11px] text-slate-400">Pilih durasi fleksibel</div>
              </div>
              <input
                type="number"
                min="1"
                value={harianDays}
                onChange={(e) => setHarianDays(e.target.value)}
                className="w-14 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-xs text-center font-bold text-white"
              />
              <button
                onClick={handlePayHarian}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95 shrink-0"
              >
                Bayar
              </button>
            </div>
          </div>
        </div>

        {/* 2. DAFTAR CABANG LAUNDRY (Matches MaterialCardView in activity_kelola_owner.xml) */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="bg-[#800000] text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-white" />
              <span className="font-bold text-xs">Daftar Cabang Laundry ({laundries.length}/3)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddBranchModal(true)}
                className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition"
              >
                + Cabang
              </button>
              <button
                onClick={() => setShowBranches(!showBranches)}
                className="p-1 rounded-full hover:bg-white/20 transition"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showBranches ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {showBranches && (
            <div className="divide-y divide-slate-100 p-2">
              {laundries.map((lnd) => {
                const isActive = lnd.id === activeLaundryId;
                return (
                  <div
                    key={lnd.id}
                    className={`p-3 rounded-xl flex items-center justify-between gap-3 transition ${
                      isActive ? 'bg-rose-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div
                      onClick={() => onSelectLaundry(lnd.id)}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        )}
                        <span className="font-bold text-xs text-slate-900">{lnd.namaLaundry}</span>
                        {isActive && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            Aktif
                          </span>
                        )}
                      </div>
                      {lnd.alamat && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{lnd.alamat}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingLaundry(lnd)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#800000] hover:bg-rose-50"
                        title="Edit Cabang"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {laundries.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Hapus cabang '${lnd.namaLaundry}'?`)) {
                              onDeleteLaundry(lnd.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Hapus Cabang"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. FOOTER NAVIGATION (Riwayat, Bantuan CS, Tutorial) */}
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              📜 Riwayat Langganan
            </button>
            <button
              onClick={() => {
                window.open(
                  `https://api.whatsapp.com/send?phone=6285659781477&text=${encodeURIComponent(
                    'Halo CS Laundry Suci, saya ingin konsultasi seputar akun owner.'
                  )}`,
                  '_blank'
                );
              }}
              className="py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              💬 Bantuan CS
            </button>
          </div>

          <button
            onClick={() => {
              window.open('https://www.youtube.com/watch?v=Dx0IYn8e7bw', '_blank');
            }}
            className="w-full py-2.5 rounded-xl bg-[#800000] hover:bg-[#660000] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
          >
            <Video className="w-4 h-4" />
            <span>▶ Panduan Video Tutorial Kasir</span>
          </button>
        </div>
      </main>

      {/* Top Up Wallet Modal (Matches Play Billing simulation in KelolaOwnerActivity.kt) */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Pilih Nominal Top Up Saldo</h3>
              <button onClick={() => setShowTopUpModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Saldo digunakan untuk perpanjangan langganan bulanan / harian semua cabang.
            </p>

            <div className="space-y-2">
              {[50000, 100000, 200000].map((nom) => (
                <button
                  key={nom}
                  onClick={() => {
                    onTopUpWallet(nom);
                    setShowTopUpModal(false);
                    alert(`Top up ${formatRupiah(nom)} berhasil ditambahkan ke saldo dompet!`);
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#800000] hover:bg-rose-50 text-left font-bold text-xs flex justify-between items-center transition"
                >
                  <span>Top Up Saldo</span>
                  <span className="text-[#800000] text-sm">{formatRupiah(nom)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Tambah Cabang Laundry Baru</h3>
              <button onClick={() => setShowAddBranchModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Nama Cabang *
                </label>
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="Contoh: Cabang 3 Buahbatu"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#800000] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Alamat Cabang
                </label>
                <input
                  type="text"
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  placeholder="Jl. Raya..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#800000] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Nomor WhatsApp Cabang
                </label>
                <input
                  type="text"
                  value={newBranchPhone}
                  onChange={(e) => setNewBranchPhone(e.target.value)}
                  placeholder="0812..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#800000] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Salin Daftar Layanan & Harga dari Cabang:
                </label>
                <select
                  value={copyLayananFrom}
                  onChange={(e) => setCopyLayananFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-[#800000] focus:outline-none"
                >
                  <option value="">Gunakan Layanan Default Baru</option>
                  {laundries.map((l) => (
                    <option key={l.id} value={l.id}>
                      Salin dari {l.namaLaundry}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddBranchSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-[#800000] hover:bg-[#660000] text-white text-xs font-bold shadow-xs"
                >
                  Buat Cabang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {editingLaundry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Edit Data Cabang</h3>
              <button onClick={() => setEditingLaundry(null)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Nama Laundry
                </label>
                <input
                  type="text"
                  value={editingLaundry.namaLaundry}
                  onChange={(e) =>
                    setEditingLaundry({ ...editingLaundry, namaLaundry: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Alamat Lengkap
                </label>
                <input
                  type="text"
                  value={editingLaundry.alamat || ''}
                  onChange={(e) =>
                    setEditingLaundry({ ...editingLaundry, alamat: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  value={editingLaundry.nomorTelepon || ''}
                  onChange={(e) =>
                    setEditingLaundry({ ...editingLaundry, nomorTelepon: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditingLaundry(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    onUpdateLaundry(editingLaundry);
                    setEditingLaundry(null);
                    alert('Data cabang berhasil disimpan!');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#800000] hover:bg-[#660000] text-white text-xs font-bold shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-[#800000] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">Riwayat Langganan & Top Up</h3>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 rounded-full hover:bg-white/20">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto divide-y divide-slate-100 text-xs">
              {subscriptionHistory.length === 0 ? (
                <p className="text-slate-400 italic text-center py-6">Belum ada riwayat transaksi langganan.</p>
              ) : (
                subscriptionHistory.map((h) => (
                  <div key={h.id} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{h.packageName}</div>
                      <div className="text-[10px] text-slate-400">{formatDateIndo(h.purchaseDate, true)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">{formatRupiah(h.cost)}</div>
                      {h.newExpiryDate > 0 && (
                        <div className="text-[10px] text-slate-500">
                          Aktif s/d: {formatDateIndo(h.newExpiryDate)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
