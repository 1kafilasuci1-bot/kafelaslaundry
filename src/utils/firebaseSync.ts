import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  User,
  Laundry,
  Transaksi,
  Pelanggan,
  Layanan,
  Pengeluaran,
  SettingsData,
} from '../types';
import { defaultLayananList, defaultSettings, StorageService } from './storage';

export class FirebaseSyncService {
  // 1. Get or create user profile
  static async getOrCreateUserProfile(firebaseUser: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    phoneNumber?: string | null;
  }): Promise<User> {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        return snap.data() as User;
      }

      const defaultLaundryId = `lnd-${firebaseUser.uid}`;
      const newUser: User = {
        uid: firebaseUser.uid,
        emailOrPhone: firebaseUser.email || firebaseUser.phoneNumber || '',
        username: firebaseUser.displayName || 'Owner',
        displayName: firebaseUser.displayName || "Kafela's Owner",
        nomorTelepon: firebaseUser.phoneNumber || '',
        role: 'owner',
        laundryId: defaultLaundryId,
        laundries: { [defaultLaundryId]: "Kafela's Laundry" },
        walletBalance: 0,
        createdAt: Date.now(),
        subscriptionType: 'premium',
        subscriptionEndDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };

      await setDoc(userDocRef, newUser);

      // Create initial branch
      const branchRef = doc(db, 'laundries', defaultLaundryId);
      const initialBranch: Laundry = {
        id: defaultLaundryId,
        ownerId: firebaseUser.uid,
        namaLaundry: "Kafela's Laundry",
        alamat: 'Bandung',
        nomorTelepon: firebaseUser.phoneNumber || '',
      };
      await setDoc(branchRef, initialBranch);

      // Create initial services
      for (const lay of defaultLayananList) {
        const layDoc = doc(db, 'laundries', defaultLaundryId, 'layanan', lay.id);
        await setDoc(layDoc, { ...lay, laundryId: defaultLaundryId });
      }

      return newUser;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${firebaseUser.uid}`);
    }
  }

  // 2. Fetch Laundries for User
  static async fetchLaundries(ownerId: string, cached: Laundry[] = []): Promise<Laundry[]> {
    if (cached && cached.length > 0) {
      return cached;
    }
    const laundriesRef = collection(db, 'laundries');
    try {
      const q = query(laundriesRef, where('ownerId', '==', ownerId), limit(10));
      const snap = await getDocs(q);
      const list: Laundry[] = [];
      snap.forEach((d) => list.push(d.data() as Laundry));
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'laundries');
    }
  }

  // 3. Fetch Transaksi dengan SMART DELTA SYNC (HEMAT 99.9% KUOTA READ)
  static async fetchTransaksi(
    laundryId: string,
    existingList: Transaksi[] = [],
    forceFullSync = false
  ): Promise<Transaksi[]> {
    const path = `laundries/${laundryId}/transaksi`;
    const syncKey = `last_sync_trx_${laundryId}`;
    const lastSync = StorageService.get<number>(syncKey, 0);

    try {
      // STRATEGI 1: DELTA SYNC
      // Jika data lokal sudah ada dan baru saja tersimpan, cukup cari data yang berubah
      // sejak sync terakhir (dengan buffer mundur 2 menit untuk toleransi waktu).
      if (existingList.length > 0 && lastSync > 0 && !forceFullSync) {
        const cutoffTime = Math.max(0, lastSync - 120000);
        const deltaQuery = query(
          collection(db, path),
          where('terakhirDieditPada', '>=', cutoffTime)
        );

        const snap = await getDocs(deltaQuery);
        // Jika tidak ada transaksi yang berubah: 0 DOKUMEN READS!
        if (snap.empty) {
          StorageService.set(syncKey, Date.now());
          return existingList;
        }

        const map = new Map<string, Transaksi>();
        existingList.forEach((t) => map.set(t.id, t));

        snap.forEach((d) => {
          const data = d.data() as Partial<Transaksi>;
          map.set(data.id || d.id, {
            id: data.id || d.id,
            laundryId: data.laundryId || laundryId,
            namaPelanggan: data.namaPelanggan || 'Pelanggan',
            totalHarga: typeof data.totalHarga === 'number' ? data.totalHarga : 0,
            jumlahDp: typeof data.jumlahDp === 'number' ? data.jumlahDp : 0,
            tanggalMasuk: typeof data.tanggalMasuk === 'number' ? data.tanggalMasuk : Date.now(),
            tanggalSelesai: data.tanggalSelesai || null,
            status: (data.status as any) || 'Diterima',
            statusPembayaran: (data.statusPembayaran as any) || 'Belum Lunas',
            items: Array.isArray(data.items) ? data.items : [],
            nomorTransaksi: data.nomorTransaksi || null,
            nomorTelepon: data.nomorTelepon || null,
            alamat: data.alamat || null,
            catatan: data.catatan || null,
            metodePembayaran: data.metodePembayaran || null,
            metodePembayaranDetail: data.metodePembayaranDetail || null,
            dikerjakanOleh: data.dikerjakanOleh || null,
            tanggalStatusSelesai: data.tanggalStatusSelesai || null,
            tanggalPengambilan: data.tanggalPengambilan || null,
            terakhirDieditPada: data.terakhirDieditPada || Date.now(),
          } as Transaksi);
        });

        const updated = Array.from(map.values()).sort((a, b) => b.tanggalMasuk - a.tanggalMasuk);
        StorageService.set(syncKey, Date.now());
        return updated;
      }

      // STRATEGI 2: FIRST LOAD DIBATASI (MAX 150 TRANSAKSI TERAKHIR)
      // Mencegah download 1.500 transaksi sekaligus yang memboroskan kuota.
      const q = query(
        collection(db, path),
        orderBy('tanggalMasuk', 'desc'),
        limit(150)
      );
      const snap = await getDocs(q);
      const list: Transaksi[] = [];
      snap.forEach((d) => {
        const data = d.data() as Partial<Transaksi>;
        list.push({
          id: data.id || d.id,
          laundryId: data.laundryId || laundryId,
          namaPelanggan: data.namaPelanggan || 'Pelanggan',
          totalHarga: typeof data.totalHarga === 'number' ? data.totalHarga : 0,
          jumlahDp: typeof data.jumlahDp === 'number' ? data.jumlahDp : 0,
          tanggalMasuk: typeof data.tanggalMasuk === 'number' ? data.tanggalMasuk : Date.now(),
          tanggalSelesai: data.tanggalSelesai || null,
          status: (data.status as any) || 'Diterima',
          statusPembayaran: (data.statusPembayaran as any) || 'Belum Lunas',
          items: Array.isArray(data.items) ? data.items : [],
          nomorTransaksi: data.nomorTransaksi || null,
          nomorTelepon: data.nomorTelepon || null,
          alamat: data.alamat || null,
          catatan: data.catatan || null,
          metodePembayaran: data.metodePembayaran || null,
          metodePembayaranDetail: data.metodePembayaranDetail || null,
          dikerjakanOleh: data.dikerjakanOleh || null,
          tanggalStatusSelesai: data.tanggalStatusSelesai || null,
          tanggalPengambilan: data.tanggalPengambilan || null,
          terakhirDieditPada: data.terakhirDieditPada || Date.now(),
        } as Transaksi);
      });

      const map = new Map<string, Transaksi>();
      existingList.forEach((t) => map.set(t.id, t));
      list.forEach((t) => map.set(t.id, t));
      const result = Array.from(map.values()).sort((a, b) => b.tanggalMasuk - a.tanggalMasuk);

      StorageService.set(syncKey, Date.now());
      return result;
    } catch (e) {
      console.warn('Gagal sync transaksi dari cloud, menggunakan data lokal:', e);
      return existingList.length > 0 ? existingList : [];
    }
  }

  // Save Transaksi - selalu sertakan terakhirDieditPada agar Delta Sync bekerja
  static async saveTransaksi(trx: Transaksi): Promise<void> {
    const path = `laundries/${trx.laundryId}/transaksi/${trx.id}`;
    const payload: Transaksi = {
      ...trx,
      terakhirDieditPada: Date.now(),
    };
    try {
      await setDoc(doc(db, 'laundries', trx.laundryId, 'transaksi', trx.id), payload);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  // Delete Transaksi
  static async deleteTransaksi(laundryId: string, trxId: string): Promise<void> {
    const path = `laundries/${laundryId}/transaksi/${trxId}`;
    try {
      await deleteDoc(doc(db, 'laundries', laundryId, 'transaksi', trxId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  // 4. Fetch Pelanggan dengan Caching (Mencegah Re-fetch Berulang Ratusan Pelanggan)
  static async fetchPelanggan(laundryId: string, cached: Pelanggan[] = []): Promise<Pelanggan[]> {
    if (cached && cached.length > 0) {
      return cached;
    }
    const path = `laundries/${laundryId}/pelanggan`;
    try {
      const q = query(collection(db, path), limit(150));
      const snap = await getDocs(q);
      const list: Pelanggan[] = [];
      snap.forEach((d) => list.push(d.data() as Pelanggan));
      return list;
    } catch (e) {
      console.warn('Gagal fetch pelanggan:', e);
      return cached;
    }
  }

  // Save Pelanggan
  static async savePelanggan(pel: Pelanggan): Promise<void> {
    const path = `laundries/${pel.laundryId}/pelanggan/${pel.id}`;
    try {
      await setDoc(doc(db, 'laundries', pel.laundryId, 'pelanggan', pel.id), pel);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  // 5. Fetch Layanan dengan Caching
  static async fetchLayanan(laundryId: string, cached: Layanan[] = []): Promise<Layanan[]> {
    if (cached && cached.length > 0) {
      return cached;
    }
    const path = `laundries/${laundryId}/layanan`;
    try {
      const snap = await getDocs(collection(db, path));
      const list: Layanan[] = [];
      snap.forEach((d) => list.push(d.data() as Layanan));
      return list.sort((a, b) => a.urutan - b.urutan);
    } catch (e) {
      console.warn('Gagal fetch layanan:', e);
      return cached;
    }
  }

  // Save Layanan
  static async saveLayanan(lay: Layanan): Promise<void> {
    const path = `laundries/${lay.laundryId}/layanan/${lay.id}`;
    try {
      await setDoc(doc(db, 'laundries', lay.laundryId, 'layanan', lay.id), lay);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  // Delete Layanan
  static async deleteLayanan(laundryId: string, layId: string): Promise<void> {
    const path = `laundries/${laundryId}/layanan/${layId}`;
    try {
      await deleteDoc(doc(db, 'laundries', laundryId, 'layanan', layId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  // 6. Fetch Pengeluaran dengan Limit Waktu (Hanya Ambil Pengeluaran Terbaru)
  static async fetchPengeluaran(laundryId: string, cached: Pengeluaran[] = []): Promise<Pengeluaran[]> {
    const lastSync = StorageService.get<number>(`last_sync_peng_${laundryId}`, 0);
    if (cached && cached.length > 0 && Date.now() - lastSync < 15 * 60 * 1000) {
      return cached;
    }
    const path = `laundries/${laundryId}/pengeluaran`;
    try {
      const q = query(collection(db, path), orderBy('tanggal', 'desc'), limit(100));
      const snap = await getDocs(q);
      const list: Pengeluaran[] = [];
      snap.forEach((d) => list.push(d.data() as Pengeluaran));
      StorageService.set(`last_sync_peng_${laundryId}`, Date.now());
      return list.sort((a, b) => b.tanggal - a.tanggal);
    } catch (e) {
      console.warn('Gagal fetch pengeluaran:', e);
      return cached;
    }
  }

  // Save Pengeluaran
  static async savePengeluaran(peng: Pengeluaran): Promise<void> {
    const path = `laundries/${peng.laundryId}/pengeluaran/${peng.id}`;
    try {
      await setDoc(doc(db, 'laundries', peng.laundryId, 'pengeluaran', peng.id), peng);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  // 7. Fetch Settings dengan Caching
  static async fetchSettings(laundryId: string, cached: SettingsData | null = null): Promise<SettingsData | null> {
    const lastSync = StorageService.get<number>(`last_sync_settings_${laundryId}`, 0);
    if (cached && Date.now() - lastSync < 30 * 60 * 1000) {
      return cached;
    }
    const path = `laundries/${laundryId}/settings/main`;
    try {
      const snap = await getDoc(doc(db, 'laundries', laundryId, 'settings', 'main'));
      if (snap.exists()) {
        StorageService.set(`last_sync_settings_${laundryId}`, Date.now());
        return snap.data() as SettingsData;
      }
      return cached;
    } catch (e) {
      console.warn('Gagal fetch settings:', e);
      return cached;
    }
  }

  // Save Settings
  static async saveSettings(laundryId: string, settings: SettingsData): Promise<void> {
    const path = `laundries/${laundryId}/settings/main`;
    try {
      await setDoc(doc(db, 'laundries', laundryId, 'settings', 'main'), settings);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }
}
