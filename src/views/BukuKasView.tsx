import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, DollarSign, Activity } from 'lucide-react';
import { Transaksi, Pengeluaran, ArusKas } from '../types';
import { formatRupiah, formatShortTime, formatDateIndo } from '../utils/formatters';
import { FirebaseSyncService } from '../utils/firebaseSync';

interface BukuKasViewProps {
  onBack: () => void;
  transaksiList: Transaksi[];
  pengeluaranList: Pengeluaran[];
  manualCashLogs: ArusKas[];
  activeLaundryId: string;
  onOpenDetailTransaksi: (transaksiId: string) => void;
}

export const BukuKasView: React.FC<BukuKasViewProps> = ({
  onBack,
  transaksiList,
  pengeluaranList,
  manualCashLogs,
  activeLaundryId,
  onOpenDetailTransaksi,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<'arus_kas' | 'aktivitas'>('arus_kas');
  const [monthArchive, setMonthArchive] = useState<Transaksi[]>([]);

  useEffect(() => {
    let isMounted = true;
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    FirebaseSyncService.fetchArsipBulan(activeLaundryId, year, month)
      .then((list) => {
        if (isMounted) setMonthArchive(list);
      })
      .catch(console.warn);
    return () => {
      isMounted = false;
    };
  }, [activeLaundryId, selectedDate]);

  const startOfDay = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [selectedDate]);

  const endOfDay = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, [selectedDate]);

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  // Compile Cash Book entries for the selected day
  const { arusKasItems, totals } = useMemo(() => {
    const items: ArusKas[] = [];
    let totalMasuk = 0;
    let totalKeluar = 0;
    let totalPiutang = 0;
    let countMasuk = 0;
    let countDiambil = 0;
    let countKeluar = 0;

    const map = new Map<string, Transaksi>();
    transaksiList.forEach((t) => map.set(t.id, t));
    monthArchive.forEach((t) => map.set(t.id, t));
    const branchTrx = Array.from(map.values()).filter((t) => t.laundryId === activeLaundryId);

    // 1. Transactions entered on this day
    branchTrx.forEach((trx) => {
      if (trx.tanggalMasuk >= startOfDay && trx.tanggalMasuk <= endOfDay) {
        countMasuk++;
        const sisa = Math.max(0, trx.totalHarga - trx.jumlahDp);
        totalPiutang += sisa;

        // Cash/DP entered
        if (trx.jumlahDp > 0) {
          totalMasuk += trx.jumlahDp;
          items.push({
            timestamp: trx.tanggalMasuk,
            keterangan: `${trx.statusPembayaran === 'Lunas' ? 'Lunas' : 'DP'}: ${trx.namaPelanggan} (${trx.nomorTransaksi})`,
            jumlahMasuk: trx.jumlahDp,
            jumlahKeluar: 0,
            metodePembayaran: trx.metodePembayaran,
            transaksiId: trx.id,
            logType: 'MASUK',
            infoLog: trx.nomorTransaksi,
          });
        }
      }

      // 2. Transactions collected on this day (settlements)
      if (
        trx.tanggalPengambilan &&
        trx.tanggalPengambilan >= startOfDay &&
        trx.tanggalPengambilan <= endOfDay
      ) {
        countDiambil++;
        // If settlement was made upon collection (and not same timestamp as entering)
        if (trx.statusPembayaran === 'Lunas' && trx.totalHarga > trx.jumlahDp) {
          const pelunasan = trx.totalHarga - trx.jumlahDp;
          totalMasuk += pelunasan;
          items.push({
            timestamp: trx.tanggalPengambilan,
            keterangan: `Pelunasan: ${trx.namaPelanggan} (${trx.nomorTransaksi})`,
            jumlahMasuk: pelunasan,
            jumlahKeluar: 0,
            metodePembayaran: trx.metodePembayaran,
            transaksiId: trx.id,
            logType: 'DIAMBIL',
            infoLog: trx.nomorTransaksi,
          });
        }
      }
    });

    // 3. Operational expenses on this day
    pengeluaranList
      .filter((p) => p.laundryId === activeLaundryId && p.tanggal >= startOfDay && p.tanggal <= endOfDay)
      .forEach((p) => {
        countKeluar++;
        totalKeluar += p.jumlah;
        items.push({
          timestamp: p.tanggal,
          keterangan: p.keterangan,
          jumlahMasuk: 0,
          jumlahKeluar: p.jumlah,
          logType: null,
        });
      });

    // 4. Manual cash logs (from catat kas)
    manualCashLogs
      .filter((m) => m.timestamp >= startOfDay && m.timestamp <= endOfDay)
      .forEach((m) => {
        totalMasuk += m.jumlahMasuk;
        totalKeluar += m.jumlahKeluar;
        items.push(m);
      });

    // Sort by timestamp descending (newest on top)
    items.sort((a, b) => b.timestamp - a.timestamp);

    return {
      arusKasItems: items,
      totals: {
        totalMasuk,
        totalKeluar,
        labaBersih: totalMasuk - totalKeluar,
        totalPiutang,
        countMasuk,
        countDiambil,
        countKeluar,
      },
    };
  }, [transaksiList, pengeluaranList, manualCashLogs, activeLaundryId, startOfDay, endOfDay]);

  // Filter based on toggle button
  const displayedRows = useMemo(() => {
    if (filterType === 'aktivitas') {
      return arusKasItems.filter((i) => !!i.logType);
    }
    return arusKasItems.filter((i) => i.jumlahMasuk > 0 || i.jumlahKeluar > 0);
  }, [arusKasItems, filterType]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-slate-800 pb-16">
      {/* Top Header */}
      <header className="bg-[#800000] text-white shadow-md sticky top-0 z-30 flex items-center px-4 h-14">
        <button onClick={onBack} className="p-1 -ml-1 rounded-full hover:bg-white/10 transition mr-3">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="font-bold text-base tracking-wide">Buku Harian</h1>
      </header>

      {/* Date Navigation Bar (Matches date_selector_container) */}
      <div className="bg-[#800000] text-white px-4 pb-3 flex items-center justify-between">
        <button onClick={handlePrevDay} className="p-1.5 rounded-full hover:bg-white/15 transition">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-wide">
            {formatDateIndo(selectedDate.getTime())}
          </span>
        </div>
        <button onClick={handleNextDay} className="p-1.5 rounded-full hover:bg-white/15 transition">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <main className="flex-1 p-3 md:p-6 space-y-3 md:space-y-4 overflow-y-auto max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto w-full">
        {/* Financial Summary Card (Matches card_financial_summary) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-3">
          {/* Mini counts */}
          <div className="flex justify-around text-center text-xs text-slate-600 border-b border-slate-100 pb-2">
            <div>
              <span className="text-slate-400 block text-[10px]">📥 Masuk</span>
              <strong className="text-slate-800">{totals.countMasuk} Trx</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">📦 Diambil</span>
              <strong className="text-slate-800">{totals.countDiambil} Trx</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">💸 Biaya</span>
              <strong className="text-slate-800">{totals.countKeluar} Item</strong>
            </div>
          </div>

          {/* 4 Financial Metric Columns */}
          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
              <span className="block text-[10px] text-emerald-600 font-semibold">Masuk</span>
              <span className="text-xs font-black">{formatRupiah(totals.totalMasuk).replace('Rp ', '')}</span>
            </div>
            <div className="p-2 rounded-xl bg-red-50 text-red-800">
              <span className="block text-[10px] text-red-600 font-semibold">Keluar</span>
              <span className="text-xs font-black">{formatRupiah(totals.totalKeluar).replace('Rp ', '')}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-800">
              <span className="block text-[10px] text-slate-500 font-semibold">Laba</span>
              <span className={`text-xs font-black ${totals.labaBersih >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatRupiah(totals.labaBersih).replace('Rp ', '')}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
              <span className="block text-[10px] text-amber-600 font-semibold">Piutang</span>
              <span className="text-xs font-black">{formatRupiah(totals.totalPiutang).replace('Rp ', '')}</span>
            </div>
          </div>
        </div>

        {/* Tab Filter: Arus Kas vs Log Aktivitas */}
        <div className="flex bg-slate-200 rounded-xl p-1 text-xs font-bold">
          <button
            onClick={() => setFilterType('arus_kas')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              filterType === 'arus_kas' ? 'bg-white text-[#800000] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Arus Kas Keuangan
          </button>
          <button
            onClick={() => setFilterType('aktivitas')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              filterType === 'aktivitas' ? 'bg-white text-[#800000] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Log Aktivitas
          </button>
        </div>

        {/* Table of Entries */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          {/* Header Row */}
          <div className="bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-600 flex justify-between border-b border-slate-200">
            <span className="w-14">Jam</span>
            <span className="flex-1 px-2">Keterangan</span>
            <span className="w-20 text-right">Masuk</span>
            <span className="w-20 text-right">Keluar</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100 text-xs">
            {displayedRows.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic">
                Tidak ada data pada tanggal ini.
              </div>
            ) : (
              displayedRows.map((row, idx) => (
                <div
                  key={idx}
                  onClick={() => row.transaksiId && onOpenDetailTransaksi(row.transaksiId)}
                  className={`p-3 flex items-center justify-between hover:bg-slate-50 transition ${
                    row.transaksiId ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="w-14 font-mono text-[11px] text-slate-500">
                    {formatShortTime(row.timestamp)}
                  </div>
                  <div className="flex-1 px-2 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">
                      {row.keterangan}
                    </div>
                    {row.metodePembayaran === 'Non-Tunai' && (
                      <span className="text-[10px] text-blue-600 font-bold italic">
                        (transfer)
                      </span>
                    )}
                  </div>
                  <div className="w-20 text-right font-extrabold text-emerald-600">
                    {row.jumlahMasuk > 0 ? formatRupiah(row.jumlahMasuk).replace('Rp ', '') : '-'}
                  </div>
                  <div className="w-20 text-right font-extrabold text-red-600">
                    {row.jumlahKeluar > 0 ? formatRupiah(row.jumlahKeluar).replace('Rp ', '') : '-'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
