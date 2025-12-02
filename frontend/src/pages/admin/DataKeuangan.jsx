import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const DataKeuangan = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('rekap');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rekapData, setRekapData] = useState([]);
  const [pemakaianData, setPemakaianData] = useState([]);
  const [donasiData, setDonasiData] = useState([]);
  const [syahriahData, setSyahriahData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('semua');
  const [availablePeriods, setAvailablePeriods] = useState([]);

  // State untuk modal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '', type: '' });
  
  // State untuk modal CRUD pemakaian
  const [showPemakaianModal, setShowPemakaianModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedPemakaian, setSelectedPemakaian] = useState(null);
  const [formData, setFormData] = useState({
    judul_pemakaian: '',
    deskripsi: '',
    nominal_syahriah: '',
    nominal_donasi: '',
    nominal_total: '',
    tipe_pemakaian: 'operasional',
    tanggal_pemakaian: new Date().toISOString().split('T')[0],
    keterangan: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  // State untuk export
  const [exportLoading, setExportLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch semua data
  useEffect(() => {
    fetchAllData();
  }, [API_URL]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      
      // Load data secara parallel untuk admin
      const [rekapResponse, pemakaianResponse, donasiResponse, syahriahResponse, rekapAllResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/rekap?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/api/admin/pemakaian?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/api/admin/donasi?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/api/admin/syahriah?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/api/admin/rekap?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      // Check responses
      if (!rekapResponse.ok) throw new Error('Gagal memuat data rekap');
      if (!pemakaianResponse.ok) throw new Error('Gagal memuat data pemakaian');
      if (!donasiResponse.ok) throw new Error('Gagal memuat data donasi');
      if (!syahriahResponse.ok) throw new Error('Gagal memuat data syahriah');
      if (!rekapAllResponse.ok) throw new Error('Gagal memuat semua data rekap');

      const rekapResult = await rekapResponse.json();
      const pemakaianResult = await pemakaianResponse.json();
      const donasiResult = await donasiResponse.json();
      const syahriahResult = await syahriahResponse.json();
      const rekapAllResult = await rekapAllResponse.json();

      setRekapData(rekapResult.data || []);
      setPemakaianData(pemakaianResult.data || []);
      setDonasiData(donasiResult.data || []);
      setSyahriahData(syahriahResult.data || []);

      // Extract unique periods
      const periods = [...new Set(rekapAllResult.data.map(item => item.periode))].sort().reverse();
      setAvailablePeriods(periods);

      // Calculate summary data dari tabel rekap saja
      calculateSummaryFromRekap(rekapAllResult.data);

    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Gagal memuat data: ${err.message}`);
      showAlert('Error', `Gagal memuat data: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // PERBAIKAN: Hitung summary hanya dari data rekap saldo
  const calculateSummaryFromRekap = (rekapData) => {
    if (!rekapData || rekapData.length === 0) {
      setSummaryData({
        totalPemasukan: 0,
        totalPengeluaran: 0,
        saldoAkhir: 0,
        totalDonasi: 0,
        totalSyahriah: 0,
        saldoSyahriah: 0,
        saldoDonasi: 0
      });
      return;
    }

    // Filter data berdasarkan periode yang dipilih
    const filteredRekap = selectedPeriod === 'semua' 
      ? rekapData 
      : rekapData.filter(item => item.periode === selectedPeriod);

    if (filteredRekap.length === 0) {
      // Jika tidak ada data untuk periode tertentu, gunakan data terbaru
      const latestRekap = rekapData[0]; // Data sudah diurutkan descending
      setSummaryData({
        totalPemasukan: latestRekap.pemasukan_total || 0,
        totalPengeluaran: latestRekap.pengeluaran_total || 0,
        saldoAkhir: latestRekap.saldo_akhir_total || 0,
        totalDonasi: latestRekap.pemasukan_donasi || 0,
        totalSyahriah: latestRekap.pemasukan_syahriah || 0,
        saldoSyahriah: latestRekap.saldo_akhir_syahriah || 0,
        saldoDonasi: latestRekap.saldo_akhir_donasi || 0
      });
      return;
    }

    if (selectedPeriod === 'semua') {
      // Untuk semua periode, hitung kumulatif
      const totalPemasukan = filteredRekap.reduce((sum, item) => sum + (item.pemasukan_total || 0), 0);
      const totalPengeluaran = filteredRekap.reduce((sum, item) => sum + (item.pengeluaran_total || 0), 0);
      const totalDonasi = filteredRekap.reduce((sum, item) => sum + (item.pemasukan_donasi || 0), 0);
      const totalSyahriah = filteredRekap.reduce((sum, item) => sum + (item.pemasukan_syahriah || 0), 0);
      
      // Untuk saldo akhir, ambil dari data terbaru
      const latestRekap = filteredRekap[0]; // Data sudah diurutkan descending
      
      setSummaryData({
        totalPemasukan,
        totalPengeluaran,
        saldoAkhir: latestRekap.saldo_akhir_total || 0,
        totalDonasi,
        totalSyahriah,
        saldoSyahriah: latestRekap.saldo_akhir_syahriah || 0,
        saldoDonasi: latestRekap.saldo_akhir_donasi || 0
      });
    } else {
      // Untuk periode tertentu, ambil data dari rekap periode tersebut
      const currentRekap = filteredRekap[0]; // Hanya ada satu rekap per periode
      
      setSummaryData({
        totalPemasukan: currentRekap.pemasukan_total || 0,
        totalPengeluaran: currentRekap.pengeluaran_total || 0,
        saldoAkhir: currentRekap.saldo_akhir_total || 0,
        totalDonasi: currentRekap.pemasukan_donasi || 0,
        totalSyahriah: currentRekap.pemasukan_syahriah || 0,
        saldoSyahriah: currentRekap.saldo_akhir_syahriah || 0,
        saldoDonasi: currentRekap.saldo_akhir_donasi || 0
      });
    }
  };

  // Recalculate summary ketika periode berubah
  useEffect(() => {
    if (rekapData.length > 0) {
      calculateSummaryFromRekap(rekapData);
    }
  }, [selectedPeriod, rekapData]);

  // ========== FORMAT CURRENCY IMPROVED ==========
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format currency untuk summary card dengan singkatan
  const formatCurrencyShort = (amount, threshold = 1000000000) => {
    // Jika amount di bawah threshold, tampilkan format normal
    if (Math.abs(amount) < threshold) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }

    // Format singkatan hanya untuk angka di atas threshold (miliar)
    const units = [
      { value: 1e12, symbol: 'T' },
      { value: 1e9, symbol: 'M' },
      { value: 1e6, symbol: 'Jt' },
    ];

    const unit = units.find(unit => Math.abs(amount) >= unit.value) || { value: 1, symbol: '' };
    
    const formatted = (amount / unit.value).toFixed(1).replace(/\.0$/, '');
    
    return `Rp ${formatted}${unit.symbol}`;
  };

  // ========== EXPORT FUNCTIONS ==========
  const exportToXLSX = async () => {
    setExportLoading(true);
    try {
      // Ambil informasi TPQ terlebih dahulu
      const token = localStorage.getItem('token');
      const infoResponse = await fetch(`${API_URL}/api/informasi-tpq`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      let tpqInfo = null;
      if (infoResponse.ok) {
        const infoResult = await infoResponse.json();
        tpqInfo = infoResult.data;
      }
  
      const wb = XLSX.utils.book_new();
      let fileName = 'Laporan_Keuangan_Lengkap';
  
      // Sheet 1: Summary/Statistik dengan kop surat
      const summarySheetData = [
        // Kop Surat
        ['', '', '', '', '', ''],
        ['', '', '', '', '', ''],
        ['', 'LAPORAN KEUANGAN', '', '', '', ''],
        ['', `TPQ ${tpqInfo?.nama_tpq || 'ASY-SYAFI\''}`, '', '', '', ''],
        ['', `Periode: ${getCurrentPeriodText()}`, '', '', '', ''],
        ['', '', '', '', '', ''],
        ['', '', '', '', '', ''],
        // Informasi TPQ
        ['INFORMASI TPQ:', '', '', 'PERIODE LAPORAN:', '', ''],
        [`Nama: ${tpqInfo?.nama_tpq || 'TPQ Asy-Syafi\''}`, '', '', `Periode: ${getCurrentPeriodText()}`, '', ''],
        [`Alamat: ${tpqInfo?.alamat || '-'}`, '', '', `Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`, '', ''],
        [`Telp: ${tpqInfo?.no_telp || '-'}`, '', '', '', '', ''],
        [`Email: ${tpqInfo?.email || '-'}`, '', '', '', '', ''],
        ['', '', '', '', '', ''],
        // Summary Keuangan
        ['RINGKASAN KEUANGAN', '', '', '', '', ''],
        ['Kategori', 'Nominal', '', '', '', ''],
        ['Total Pemasukan', summaryData?.totalPemasukan || 0, '', '', '', ''],
        ['Total Pengeluaran', summaryData?.totalPengeluaran || 0, '', '', '', ''],
        ['Saldo Akhir', summaryData?.saldoAkhir || 0, '', '', '', ''],
        ['Saldo Donasi', summaryData?.saldoDonasi || 0, '', '', '', ''],
        ['Saldo Syahriah', summaryData?.saldoSyahriah || 0, '', '', '', ''],
        ['', '', '', '', '', ''],
        ['RINCIAN PER KATEGORI', '', '', '', '', '']
      ];
  
      const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');
  
      // Merge cells untuk kop surat
      if (!wsSummary['!merges']) wsSummary['!merges'] = [];
      wsSummary['!merges'].push(
        { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } }, // LAPORAN KEUANGAN
        { s: { r: 3, c: 1 }, e: { r: 3, c: 4 } }, // Nama TPQ
        { s: { r: 4, c: 1 }, e: { r: 4, c: 4 } }  // Periode
      );
  
      // Sheet 2: Rekap Keuangan dengan header
      if (getFilteredRekap().length > 0) {
        const rekapHeader = [
          ['REKAP KEUANGAN PER PERIODE'],
          ['TPQ ASY-SYAFI\'I'],
          [`Periode: ${getCurrentPeriodText()}`],
          []
        ];
  
        const rekapDataToExport = getFilteredRekap().map(item => ({
          'Periode': formatPeriod(item.periode),
          'Pemasukan Syahriah': item.pemasukan_syahriah,
          'Pengeluaran Syahriah': item.pengeluaran_syahriah,
          'Saldo Akhir Syahriah': item.saldo_akhir_syahriah,
          'Pemasukan Donasi': item.pemasukan_donasi,
          'Pengeluaran Donasi': item.pengeluaran_donasi,
          'Saldo Akhir Donasi': item.saldo_akhir_donasi,
          'Pemasukan Total': item.pemasukan_total,
          'Pengeluaran Total': item.pengeluaran_total,
          'Saldo Akhir Total': item.saldo_akhir_total,
          'Update Terakhir': formatDateTime(item.terakhir_update)
        }));
  
        const wsRekap = XLSX.utils.aoa_to_sheet(rekapHeader);
        XLSX.utils.sheet_add_json(wsRekap, rekapDataToExport, { origin: 'A5', skipHeader: false });
        XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekap Keuangan');
      }
  
      // Sheet 3: Pengeluaran dengan header
      if (getFilteredPemakaian().length > 0) {
        const pemakaianHeader = [
          ['DATA PENGELUARAN'],
          ['TPQ ASY-SYAFI\'I'],
          [`Periode: ${getCurrentPeriodText()}`],
          []
        ];
  
        const pemakaianDataToExport = getFilteredPemakaian().map(item => ({
          'Tanggal': item.tanggal_pemakaian ? formatDate(item.tanggal_pemakaian) : formatDate(item.created_at),
          'Judul Pengeluaran': item.judul_pemakaian,
          'Deskripsi': item.deskripsi,
          'Tipe Pengeluaran': item.tipe_pemakaian,
          'Nominal Syahriah': item.nominal_syahriah,
          'Nominal Donasi': item.nominal_donasi,
          'Nominal Total': item.nominal_total,
          'Keterangan': item.keterangan || '-',
          'Diajukan Oleh': item.pengaju?.nama_lengkap || 'Admin'
        }));
  
        const wsPemakaian = XLSX.utils.aoa_to_sheet(pemakaianHeader);
        XLSX.utils.sheet_add_json(wsPemakaian, pemakaianDataToExport, { origin: 'A5', skipHeader: false });
        XLSX.utils.book_append_sheet(wb, wsPemakaian, 'Pengeluaran');
      }
  
      // Sheet 4: Pemasukan Donasi dengan header
      if (getFilteredDonasi().length > 0) {
        const donasiHeader = [
          ['DATA PEMASUKAN DONASI'],
          ['TPQ ASY-SYAFI\'I'],
          [`Periode: ${getCurrentPeriodText()}`],
          []
        ];
  
        const donasiDataToExport = getFilteredDonasi().map(item => ({
          'Tanggal': formatDateTime(item.waktu_catat),
          'Nama Donatur': item.nama_donatur,
          'No. Telepon': item.no_telp || '-',
          'Nominal': item.nominal,
          'Dicatat Oleh': item.admin?.nama_lengkap || 'Admin'
        }));
  
        const wsDonasi = XLSX.utils.aoa_to_sheet(donasiHeader);
        XLSX.utils.sheet_add_json(wsDonasi, donasiDataToExport, { origin: 'A5', skipHeader: false });
        XLSX.utils.book_append_sheet(wb, wsDonasi, 'Pemasukan Donasi');
      }
  
      // Sheet 5: Pemasukan Syahriah dengan header
      if (getFilteredSyahriah().length > 0) {
        const syahriahHeader = [
          ['DATA PEMASUKAN SYAHRIYAH'],
          ['TPQ ASY-SYAFI\'I'],
          [`Periode: ${getCurrentPeriodText()}`],
          []
        ];
      
        const syahriahDataToExport = getFilteredSyahriah().map(item => ({
          'Nama Santri': item.santri?.nama_lengkap || 'N/A',
          'Wali': item.santri?.wali?.nama_lengkap || '-',
          'Email Wali': item.santri?.wali?.email || '-',
          'No. Telepon Wali': item.santri?.wali?.no_telp || '-',
          'Bulan': formatPeriod(item.bulan),
          'Nominal': item.nominal,
          'Status': item.status === 'lunas' ? 'Lunas' : 'Belum Bayar',
          'Tanggal Bayar': item.status === 'lunas' ? formatDateTime(item.waktu_catat) : '-',
          'Dicatat Oleh': item.admin?.nama_lengkap || 'Admin'
        }));
      
        const wsSyahriah = XLSX.utils.aoa_to_sheet(syahriahHeader);
        XLSX.utils.sheet_add_json(wsSyahriah, syahriahDataToExport, { origin: 'A5', skipHeader: false });
        XLSX.utils.book_append_sheet(wb, wsSyahriah, 'Pemasukan Syahriah');
      }

      XLSX.writeFile(wb, `${fileName}_${tpqInfo?.nama_tpq?.replace(/\s+/g, '_') || 'TPQ_Asy_Syafii'}_${selectedPeriod === 'semua' ? 'Semua_Periode' : selectedPeriod}_${new Date().toISOString().split('T')[0]}.xlsx`);
      showAlert('Berhasil', `Laporan keuangan lengkap berhasil diexport ke Excel`, 'success');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      showAlert('Gagal', `Gagal export data: ${err.message}`, 'error');
    } finally {
      setExportLoading(false);
    }
  };

const exportToCSV = async () => {
  setExportLoading(true);
  try {
    // Ambil informasi TPQ
    const token = localStorage.getItem('token');
    const infoResponse = await fetch(`${API_URL}/api/informasi-tpq`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    let tpqInfo = null;
    if (infoResponse.ok) {
      const infoResult = await infoResponse.json();
      tpqInfo = infoResult.data;
    }

    let allData = [];
    let fileName = 'Laporan_Keuangan_Lengkap';

    // Header untuk file CSV dengan informasi TPQ
    const header = [
      'LAPORAN KEUANGAN - TPQ ASY-SYAFI\'I',
      `Nama TPQ: ${tpqInfo?.nama_tpq || 'TPQ Asy-Syafi\'i'}`,
      `Alamat: ${tpqInfo?.alamat || '-'}`,
      `No. Telepon: ${tpqInfo?.no_telp || '-'}`,
      `Email: ${tpqInfo?.email || '-'}`,
      `Hari & Jam Belajar: ${tpqInfo?.hari_jam_belajar || '-'}`,
      '',
      `Periode: ${getCurrentPeriodText()}`,
      `Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`,
      ''
    ];

    // Section 1: Summary
    const summarySection = [
      'SUMMARY KEUANGAN',
      'Kategori,Nilai',
      `Total Pemasukan,${summaryData?.totalPemasukan || 0}`,
      `Total Pengeluaran,${summaryData?.totalPengeluaran || 0}`,
      `Saldo Akhir,${summaryData?.saldoAkhir || 0}`,
      `Saldo Donasi,${summaryData?.saldoDonasi || 0}`,
      `Saldo Syahriah,${summaryData?.saldoSyahriah || 0}`,
      ''
    ];

    allData = [...header, ...summarySection];
      // Section 2: Rekap Keuangan - PERBAIKAN: Sesuaikan dengan struktur baru
      const rekapData = getFilteredRekap();
      if (rekapData.length > 0) {
        allData.push('REKAP KEUANGAN');
        allData.push('Periode,Pemasukan Syahriah,Pengeluaran Syahriah,Saldo Akhir Syahriah,Pemasukan Donasi,Pengeluaran Donasi,Saldo Akhir Donasi,Pemasukan Total,Pengeluaran Total,Saldo Akhir Total,Update Terakhir');
        rekapData.forEach(item => {
          allData.push([
            formatPeriod(item.periode),
            item.pemasukan_syahriah,
            item.pengeluaran_syahriah,
            item.saldo_akhir_syahriah,
            item.pemasukan_donasi,
            item.pengeluaran_donasi,
            item.saldo_akhir_donasi,
            item.pemasukan_total,
            item.pengeluaran_total,
            item.saldo_akhir_total,
            formatDateTime(item.terakhir_update)
          ].join(','));
        });
        allData.push('');
      }

      // Section 3: Pengeluaran
      const pemakaianData = getFilteredPemakaian();
      if (pemakaianData.length > 0) {
        allData.push('DATA PENGELUARAN');
        allData.push('Tanggal,Judul Pengeluaran,Deskripsi,Tipe Pengeluaran,Nominal Syahriah,Nominal Donasi,Nominal Total,Keterangan,Diajukan Oleh');
        pemakaianData.forEach(item => {
          allData.push([
            item.tanggal_pemakaian ? formatDate(item.tanggal_pemakaian) : formatDate(item.created_at),
            `"${item.judul_pemakaian}"`,
            `"${item.deskripsi}"`,
            item.tipe_pemakaian,
            item.nominal_syahriah,
            item.nominal_donasi,
            item.nominal_total,
            `"${item.keterangan || '-'}"`,
            item.pengaju?.nama_lengkap || 'Admin'
          ].join(','));
        });
        allData.push('');
      }

      // Section 4: Pemasukan Donasi
      const donasiData = getFilteredDonasi();
      if (donasiData.length > 0) {
        allData.push('DATA PEMASUKAN DONASI');
        allData.push('Tanggal,Nama Donatur,No. Telepon,Nominal,Dicatat Oleh');
        donasiData.forEach(item => {
          allData.push([
            formatDateTime(item.waktu_catat),
            `"${item.nama_donatur}"`,
            item.no_telp || '-',
            item.nominal,
            item.admin?.nama_lengkap || 'Admin'
          ].join(','));
        });
        allData.push('');
      }

      // Section 5: Pemasukan Syahriah
      const syahriahData = getFilteredSyahriah();
if (syahriahData.length > 0) {
  allData.push('DATA PEMASUKAN SYAHRIYAH');
  allData.push('Nama Santri,Wali,Email Wali,No. Telepon Wali,Bulan,Nominal,Status,Tanggal Bayar,Dicatat Oleh');
  syahriahData.forEach(item => {
    allData.push([
      `"${item.santri?.nama_lengkap || 'N/A'}"`,
      `"${item.santri?.wali?.nama_lengkap || '-'}"`,
      item.santri?.wali?.email || '-',
      item.santri?.wali?.no_telp || '-',
      formatPeriod(item.bulan),
      item.nominal,
      item.status === 'lunas' ? 'Lunas' : 'Belum Bayar',
      item.status === 'lunas' ? formatDateTime(item.waktu_catat) : '-',
      item.admin?.nama_lengkap || 'Admin'
    ].join(','));
  });
}

      const csvContent = allData.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${fileName}_${selectedPeriod === 'semua' ? 'Semua_Periode' : selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
      showAlert('Berhasil', `Laporan keuangan lengkap berhasil diexport ke CSV`, 'success');
    } catch (err) {
      console.error('Error exporting to CSV:', err);
      showAlert('Gagal', `Gagal export data: ${err.message}`, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const exportToDOCX = async () => {
    setExportLoading(true);
    try {
      // Ambil informasi TPQ
      const token = localStorage.getItem('token');
      const infoResponse = await fetch(`${API_URL}/api/informasi-tpq`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      let tpqInfo = null;
      if (infoResponse.ok) {
        const infoResult = await infoResponse.json();
        tpqInfo = infoResult.data;
      }
  
      // Create comprehensive HTML content for DOCX dengan format surat resmi
      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>Laporan Keuangan - ${tpqInfo?.nama_tpq || 'TPQ Asy-Syafi\'i'}</title>
            <style>
              @page {
                margin: 2cm;
                size: A4;
              }
              body { 
                font-family: 'Times New Roman', Times, serif; 
                margin: 0;
                padding: 0;
                line-height: 1.6;
                font-size: 12pt;
                color: #000;
              }
              .kop-surat {
                border-bottom: 3px double #000;
                padding-bottom: 10px;
                margin-bottom: 20px;
                text-align: center;
              }
              .logo {
                float: left;
                width: 80px;
                height: 80px;
                margin-right: 15px;
              }
              .header-info {
                text-align: center;
              }
              .nama-tpq {
                font-size: 16pt;
                font-weight: bold;
                margin: 5px 0;
                text-transform: uppercase;
              }
              .alamat-tpq {
                font-size: 11pt;
                margin: 2px 0;
              }
              .kontak-tpq {
                font-size: 10pt;
                margin: 2px 0;
              }
              .judul-laporan {
                text-align: center;
                margin: 25px 0;
                font-size: 14pt;
                font-weight: bold;
                text-decoration: underline;
              }
              .periode-info {
                text-align: center;
                margin: 15px 0;
                font-size: 11pt;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 15px 0;
                font-size: 10pt;
              }
              th, td { 
                border: 1px solid #000; 
                padding: 8px; 
                text-align: left; 
                vertical-align: top;
              }
              th { 
                background-color: #f0f0f0; 
                font-weight: bold;
                text-align: center;
              }
              .summary-section { 
                background: #f9f9f9; 
                padding: 15px;
                border: 1px solid #000;
                margin: 20px 0;
              }
              .summary-grid {
                display: table;
                width: 100%;
                margin: 10px 0;
              }
              .summary-item {
                display: table-row;
              }
              .summary-label {
                display: table-cell;
                padding: 5px 10px;
                font-weight: bold;
                width: 40%;
              }
              .summary-value {
                display: table-cell;
                padding: 5px 10px;
              }
              .positive { color: #006400; }
              .negative { color: #8b0000; }
              .currency {
                font-family: 'Courier New', monospace;
                font-weight: bold;
              }
              .section-title {
                margin: 25px 0 10px 0;
                font-size: 12pt;
                font-weight: bold;
                border-bottom: 1px solid #000;
                padding-bottom: 5px;
              }
              .footer {
                margin-top: 40px;
                text-align: right;
                font-size: 10pt;
              }
              .ttd {
                margin-top: 60px;
                text-align: center;
              }
              .ttd-space {
                height: 60px;
              }
              .ttd-name {
                font-weight: bold;
                text-decoration: underline;
              }
              .ttd-position {
                font-size: 10pt;
              }
            </style>
          </head>
          <body>
            <!-- Kop Surat -->
            <div class="kop-surat">
              <div class="header-info">
                <div class="nama-tpq">${tpqInfo?.nama_tpq || 'TAMAN PENDIDIKAN QURAN ASY-SYAFI\'I'}</div>
                <div class="alamat-tpq">${tpqInfo?.alamat || 'Jl. Raya Sangkanayu - Pengalusan KM 1 Campakoah RT 03 RW 01 Kec. Mrebet - Purbalingga'}</div>
                <div class="kontak-tpq">
                  Telp: ${tpqInfo?.no_telp || '085643955667'} | Email: ${tpqInfo?.email || 'tpqasysyafiicampakoah@gmail.com'} 
                </div>
              </div>
            </div>
  
            <!-- Judul Laporan -->
            <div class="judul-laporan">LAPORAN KEUANGAN</div>
            
            <!-- Periode -->
            <div class="periode-info">
              Periode: <strong>${getCurrentPeriodText()}</strong><br>
              Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
  
            <!-- Ringkasan Keuangan -->
            <div class="section-title">RINGKASAN KEUANGAN</div>
            <div class="summary-section">
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-label">Total Pemasukan:</div>
                  <div class="summary-value currency positive">${formatCurrency(summaryData?.totalPemasukan || 0)}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Total Pengeluaran:</div>
                  <div class="summary-value currency negative">${formatCurrency(summaryData?.totalPengeluaran || 0)}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Saldo Akhir:</div>
                  <div class="summary-value currency">${formatCurrency(summaryData?.saldoAkhir || 0)}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Saldo Donasi:</div>
                  <div class="summary-value currency positive">${formatCurrency(summaryData?.saldoDonasi || 0)}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Saldo Syahriah:</div>
                  <div class="summary-value currency positive">${formatCurrency(summaryData?.saldoSyahriah || 0)}</div>
                </div>
              </div>
            </div>
  
            <!-- Rekap Keuangan -->
            ${getFilteredRekap().length > 0 ? `
              <div class="section-title">REKAP KEUANGAN PER PERIODE</div>
              <table>
                <thead>
                  <tr>
                    <th rowspan="2">Periode</th>
                    <th colspan="3">Syahriah</th>
                    <th colspan="3">Donasi</th>
                    <th colspan="3">Total</th>
                    <th rowspan="2">Update Terakhir</th>
                  </tr>
                  <tr>
                    <th>Pemasukan</th>
                    <th>Pengeluaran</th>
                    <th>Saldo</th>
                    <th>Pemasukan</th>
                    <th>Pengeluaran</th>
                    <th>Saldo</th>
                    <th>Pemasukan</th>
                    <th>Pengeluaran</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  ${getFilteredRekap().map(item => `
                    <tr>
                      <td>${formatPeriod(item.periode)}</td>
                      <td class="currency positive">${formatCurrency(item.pemasukan_syahriah)}</td>
                      <td class="currency negative">${formatCurrency(item.pengeluaran_syahriah)}</td>
                      <td class="currency">${formatCurrency(item.saldo_akhir_syahriah)}</td>
                      <td class="currency positive">${formatCurrency(item.pemasukan_donasi)}</td>
                      <td class="currency negative">${formatCurrency(item.pengeluaran_donasi)}</td>
                      <td class="currency">${formatCurrency(item.saldo_akhir_donasi)}</td>
                      <td class="currency positive">${formatCurrency(item.pemasukan_total)}</td>
                      <td class="currency negative">${formatCurrency(item.pengeluaran_total)}</td>
                      <td class="currency">${formatCurrency(item.saldo_akhir_total)}</td>
                      <td style="font-size: 9pt;">${formatDateTime(item.terakhir_update)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
  
            <!-- Pengeluaran -->
            ${getFilteredPemakaian().length > 0 ? `
              <div class="section-title">DATA PENGELUARAN</div>
              <table>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Keterangan</th>
                    <th>Tipe</th>
                    <th>Sumber Dana</th>
                    <th>Nominal</th>
                    <th>Diajukan Oleh</th>
                  </tr>
                </thead>
                <tbody>
                  ${getFilteredPemakaian().map(item => `
                    <tr>
                    <td>${item.tanggal_pemakaian ? formatDate(item.tanggal_pemakaian) : formatDate(item.created_at)}</td>
                    <td>
                      <strong>${item.judul_pemakaian}</strong><br>
                      <small>${item.deskripsi}</small>
                      ${item.keterangan ? `<br><small><em>Catatan: ${item.keterangan}</em></small>` : ''}
                    </td>
                    <td style="text-transform: capitalize;">${item.tipe_pemakaian}</td>
                    <td class="currency negative">${formatCurrency(item.nominal_syahriah)}</td>
                    <td class="currency negative">${formatCurrency(item.nominal_donasi)}</td>
                    <td class="currency negative">${formatCurrency(item.nominal_total)}</td>
                    <td>${item.pengaju?.nama_lengkap || 'Admin'}</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
  
            <!-- Pemasukan Donasi -->
            ${getFilteredDonasi().length > 0 ? `
              <div class="section-title">DATA PEMASUKAN DONASI</div>
              <table>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Nama Donatur</th>
                    <th>Kontak</th>
                    <th>Nominal</th>
                    <th>Dicatat Oleh</th>
                  </tr>
                </thead>
                <tbody>
                  ${getFilteredDonasi().map(item => `
                    <tr>
                      <td>${formatDateTime(item.waktu_catat)}</td>
                      <td>${item.nama_donatur}</td>
                      <td>${item.no_telp || '-'}</td>
                      <td class="currency positive">${formatCurrency(item.nominal)}</td>
                      <td>${item.admin?.nama_lengkap || 'Admin'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
  
            <!-- Pemasukan Syahriah -->
            ${getFilteredSyahriah().length > 0 ? `
              <div class="section-title">DATA PEMASUKAN SYAHRIYAH</div>
              <table>
                <thead>
                  <tr>
                    <th>Nama Santri</th>
                    <th>Wali</th>
                    <th>Bulan</th>
                    <th>Nominal</th>
                    <th>Status</th>
                    <th>Tanggal Bayar</th>
                    <th>Dicatat Oleh</th>
                  </tr>
                </thead>
                <tbody>
                  ${getFilteredSyahriah().map(item => `
                    <tr>
                      <td>${item.santri?.nama_lengkap || 'N/A'}</td>
                      <td>
                        ${item.santri?.wali?.nama_lengkap || '-'}
                        ${item.santri?.wali?.email ? `<br><small>${item.santri.wali.email}</small>` : ''}
                      </td>
                      <td>${formatPeriod(item.bulan)}</td>
                      <td class="currency positive">${formatCurrency(item.nominal)}</td>
                      <td style="text-transform: capitalize;">${item.status === 'lunas' ? 'Lunas' : 'Belum Bayar'}</td>
                      <td>${item.status === 'lunas' ? formatDateTime(item.waktu_catat) : '-'}</td>
                      <td>${item.admin?.nama_lengkap || 'Admin'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
  
            <!-- Footer dan TTD -->
            <div class="footer">
              <div class="ttd">
                <div>Purbalingga, ${new Date().toLocaleDateString('id-ID', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}</div>
                <div class="ttd-space"></div>
                <div class="ttd-name">Bendahara TPQ</div>
                <div class="ttd-position">${tpqInfo?.nama_tpq || 'TPQ Asy-Syafi\''}</div>
              </div>
            </div>
  
            <!-- Informasi Dokumen -->
            <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 9pt; color: #666; text-align: center;">
              <p>Dokumen ini dihasilkan secara otomatis oleh Sistem Keuangan ${tpqInfo?.nama_tpq || 'TPQ Asy-Syafi\''}</p>
              <p>Total Data: ${getFilteredRekap().length} rekap, ${getFilteredPemakaian().length} pengeluaran, 
              ${getFilteredDonasi().length} donasi, ${getFilteredSyahriah().length} syahriah</p>
            </div>
          </body>
        </html>
      `;
  
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      saveAs(blob, `Laporan_Keuangan_${tpqInfo?.nama_tpq?.replace(/\s+/g, '_') || 'TPQ_Asy_Syafii'}_${selectedPeriod === 'semua' ? 'Semua_Periode' : selectedPeriod}_${new Date().toISOString().split('T')[0]}.doc`);
      showAlert('Berhasil', `Laporan keuangan lengkap berhasil diexport ke Word`, 'success');
    } catch (err) {
      console.error('Error exporting to DOCX:', err);
      showAlert('Gagal', `Gagal export data: ${err.message}`, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // ========== CRUD FUNCTIONS FOR PEMAKAIAN ==========
  const handleCreatePemakaian = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
  
      // Validasi client-side
      const nominalTotal = parseFloat(formData.nominal_total);
      if (nominalTotal <= 0) {
        throw new Error('Total pengeluaran harus lebih dari 0');
      }
  
      const nominalSyahriah = parseFloat(formData.nominal_syahriah) || 0;
      const nominalDonasi = parseFloat(formData.nominal_donasi) || 0;
      
      // Validasi konsistensi data
      if (Math.abs((nominalSyahriah + nominalDonasi) - nominalTotal) > 0.01) {
        throw new Error('Total pengeluaran tidak sesuai dengan jumlah nominal syahriah dan donasi');
      }
  
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/pemakaian`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          judul_pemakaian: formData.judul_pemakaian,
          deskripsi: formData.deskripsi,
          nominal_syahriah: nominalSyahriah,
          nominal_donasi: nominalDonasi,
          nominal_total: nominalTotal,
          tipe_pemakaian: formData.tipe_pemakaian,
          tanggal_pemakaian: formData.tanggal_pemakaian,
          keterangan: formData.keterangan || null
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal membuat data pemakaian');
      }
  
      const result = await response.json();
      showAlert('Berhasil', 'Data pemakaian berhasil dibuat!', 'success');
      setShowPemakaianModal(false);
      resetForm();
      await fetchAllData(); // Refresh data
      
    } catch (err) {
      console.error('Error creating pemakaian:', err);
      showAlert('Gagal', `Gagal membuat data pemakaian: ${err.message}`, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdatePemakaian = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
  
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/pemakaian/${selectedPemakaian.id_pemakaian}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          judul_pemakaian: formData.judul_pemakaian,
          deskripsi: formData.deskripsi,
          nominal_syahriah: parseFloat(formData.nominal_syahriah) || 0,
          nominal_donasi: parseFloat(formData.nominal_donasi) || 0,
          nominal_total: parseFloat(formData.nominal_total),
          tipe_pemakaian: formData.tipe_pemakaian,
          tanggal_pemakaian: formData.tanggal_pemakaian,
          keterangan: formData.keterangan || null
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengupdate data pemakaian');
      }
  
      const result = await response.json();
      showAlert('Berhasil', 'Data pemakaian berhasil diupdate!', 'success');
      setShowPemakaianModal(false);
      resetForm();
      await fetchAllData(); // Refresh data
      
    } catch (err) {
      console.error('Error updating pemakaian:', err);
      showAlert('Gagal', `Gagal mengupdate data pemakaian: ${err.message}`, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePemakaian = async (pemakaianId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data pemakaian ini?')) {
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/pemakaian/${pemakaianId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus data pemakaian');
      }

      showAlert('Berhasil', 'Data pemakaian berhasil dihapus!', 'success');
      await fetchAllData(); // Refresh data
      
    } catch (err) {
      console.error('Error deleting pemakaian:', err);
      showAlert('Gagal', `Gagal menghapus data pemakaian: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ========== HELPER FUNCTIONS ==========
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedPemakaian(null);
    resetForm();
    setShowPemakaianModal(true);
  };

  const handleOpenEditModal = (pemakaian) => {
    setModalMode('edit');
    setSelectedPemakaian(pemakaian);
    setFormData({
      judul_pemakaian: pemakaian.judul_pemakaian,
      deskripsi: pemakaian.deskripsi,
      nominal_syahriah: pemakaian.nominal_syahriah.toString(),
      nominal_donasi: pemakaian.nominal_donasi.toString(),
      nominal_total: pemakaian.nominal_total.toString(), // Total sudah dihitung otomatis
      tipe_pemakaian: pemakaian.tipe_pemakaian,
      tanggal_pemakaian: pemakaian.tanggal_pemakaian 
        ? new Date(pemakaian.tanggal_pemakaian).toISOString().split('T')[0]
        : new Date(pemakaian.created_at).toISOString().split('T')[0],
      keterangan: pemakaian.keterangan || ''
    });
    setShowPemakaianModal(true);
  };

  const resetForm = () => {
    setFormData({
      judul_pemakaian: '',
      deskripsi: '',
      nominal_syahriah: '',
      nominal_donasi: '',
      nominal_total: '',
      tipe_pemakaian: 'operasional',
      tanggal_pemakaian: new Date().toISOString().split('T')[0],
      keterangan: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value
      };
      
      if (name === 'nominal_syahriah' || name === 'nominal_donasi') {
        const nominalSyahriah = parseFloat(newFormData.nominal_syahriah) || 0;
        const nominalDonasi = parseFloat(newFormData.nominal_donasi) || 0;
        const nominalTotal = nominalSyahriah + nominalDonasi;
        
        newFormData.nominal_total = nominalTotal > 0 ? nominalTotal.toString() : '';
      }
      
      return newFormData;
    });
  };

  const showAlert = (title, message, type = 'success') => {
    setAlertMessage({ title, message, type });
    setShowAlertModal(true);
  };

  const formatPeriod = (period) => {
    try {
      const [year, month] = period.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long'
      });
    } catch (e) {
      return period;
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // PERBAIKAN: Filter rekap tidak perlu berdasarkan tipe_saldo lagi
  const getFilteredRekap = () => {
    if (selectedPeriod === 'semua') {
      return rekapData;
    }
    return rekapData.filter(item => item.periode === selectedPeriod);
  };

  const getFilteredPemakaian = () => {
    if (selectedPeriod === 'semua') {
      return pemakaianData;
    }
    return pemakaianData.filter(item => {
      const itemPeriod = item.tanggal_pemakaian 
        ? new Date(item.tanggal_pemakaian).toISOString().slice(0, 7)
        : new Date(item.created_at).toISOString().slice(0, 7);
      return itemPeriod === selectedPeriod;
    });
  };

  const getFilteredDonasi = () => {
    if (selectedPeriod === 'semua') {
      return donasiData;
    }
    return donasiData.filter(item => {
      const itemPeriod = new Date(item.waktu_catat).toISOString().slice(0, 7);
      return itemPeriod === selectedPeriod;
    });
  };

  const getFilteredSyahriah = () => {
    if (selectedPeriod === 'semua') {
      return syahriahData;
    }
    return syahriahData.filter(item => {
      return item.bulan === selectedPeriod;
    });
  };

  const getCurrentPeriodText = () => {
    if (selectedPeriod === 'semua') {
      return 'Semua Periode';
    }
    return formatPeriod(selectedPeriod);
  };

  const handleGenerateRekap = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/rekap/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal generate rekap');
      }
  
      const result = await response.json();
      showAlert('Berhasil', 'Rekap keuangan berhasil digenerate!', 'success');
      await fetchAllData(); // Refresh data
      
    } catch (err) {
      console.error('Error generating rekap:', err);
      showAlert('Gagal', `Gagal generate rekap: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Ikon SVG
  const icons = {
    money: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    chart: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    plus: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    refresh: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    edit: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    delete: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    export: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    )
  };

  // Loading component
  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-6">
      {/* Statistics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-20 mt-1"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );

  // Error component
  const ErrorMessage = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
      <p className="text-red-600 mb-6">{error}</p>
      <button 
        onClick={fetchAllData}
        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-medium"
      >
        Coba Lagi
      </button>
    </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    if (loading && rekapData.length === 0 && pemakaianData.length === 0 && donasiData.length === 0 && syahriahData.length === 0) {
      return <LoadingSkeleton />;
    }

    if (error && rekapData.length === 0 && pemakaianData.length === 0 && donasiData.length === 0 && syahriahData.length === 0) {
      return <ErrorMessage />;
    }

    const filteredRekap = getFilteredRekap();
    const filteredPemakaian = getFilteredPemakaian();
    const filteredDonasi = getFilteredDonasi();
    const filteredSyahriah = getFilteredSyahriah();

    switch (activeTab) {
      case 'rekap':
        return (
          <div className="overflow-x-auto">
            {filteredRekap.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Belum Ada Data Rekap</h3>
                <p className="text-green-600 mb-4">Data rekap keuangan akan muncul setelah ada transaksi</p>
                <button
                  onClick={handleGenerateRekap}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate Rekap Otomatis'}
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pemasukan Syahriah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pengeluaran Syahriah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo Syahriah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pemasukan Donasi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pengeluaran Donasi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo Donasi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pemasukan Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pengeluaran Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo Akhir</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Update Terakhir</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRekap.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPeriod(item.periode)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(item.pemasukan_syahriah)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {formatCurrency(item.pengeluaran_syahriah)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {formatCurrency(item.saldo_akhir_syahriah)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(item.pemasukan_donasi)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {formatCurrency(item.pengeluaran_donasi)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {formatCurrency(item.saldo_akhir_donasi)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(item.pemasukan_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {formatCurrency(item.pengeluaran_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {formatCurrency(item.saldo_akhir_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(item.terakhir_update)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      
        case 'pengeluaran':
          return (
            <div className="overflow-x-auto">
              {filteredPemakaian.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Belum Ada Pengeluaran</h3>
                  <p className="text-green-600 mb-4">Data pengeluaran akan muncul setelah ada pemakaian saldo</p>
                  <button
                    onClick={handleOpenCreateModal}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    {icons.plus}
                    <span className="ml-2">Tambah Pengeluaran</span>
                  </button>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dana Syahriah</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dana Donasi</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diajukan Oleh</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPemakaian.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.tanggal_pemakaian ? formatDate(item.tanggal_pemakaian) : formatDate(item.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{item.judul_pemakaian}</div>
                            <div className="text-gray-500 text-xs mt-1">{item.deskripsi}</div>
                            {item.keterangan && (
                              <div className="text-gray-400 text-xs mt-1">Catatan: {item.keterangan}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                            item.tipe_pemakaian === 'operasional' ? 'bg-blue-100 text-blue-800' :
                            item.tipe_pemakaian === 'investasi' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.tipe_pemakaian}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                          {formatCurrency(item.nominal_syahriah)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                          {formatCurrency(item.nominal_donasi)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                          {formatCurrency(item.nominal_total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.pengaju?.nama_lengkap || 'Admin'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Edit"
                            >
                              {icons.edit}
                            </button>
                            <button
                              onClick={() => handleDeletePemakaian(item.id_pemakaian)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Hapus"
                            >
                              {icons.delete}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );

      case 'pemasukan':
        return (
          <div className="overflow-x-auto">
            {filteredDonasi.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Belum Ada Pemasukan Donasi</h3>
                <p className="text-green-600">Data pemasukan donasi akan muncul setelah ada donasi</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donatur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Telp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dicatat Oleh</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDonasi.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(item.waktu_catat)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.nama_donatur}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.no_telp || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(item.nominal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.admin?.nama_lengkap || 'Admin'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );

        case 'syahriah':
          return (
            <div className="overflow-x-auto">
              {filteredSyahriah.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Belum Ada Pemasukan Syahriah</h3>
                  <p className="text-green-600">Data pemasukan syahriah akan muncul setelah ada pembayaran syahriah</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Santri</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wali</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Bayar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dicatat Oleh</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSyahriah.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.santri?.nama_lengkap || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.santri?.wali?.nama_lengkap || '-'}
                          {item.santri?.wali?.email && (
                            <div className="text-xs text-gray-400 mt-1">
                              {item.santri.wali.email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPeriod(item.bulan)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(item.nominal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.status === 'lunas' ? formatDateTime(item.waktu_catat) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'lunas' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status === 'lunas' ? 'Lunas' : 'Belum Bayar'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.admin?.nama_lengkap || 'Admin'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );   
              default:
                return null;
            }
          };

  return (
    <AuthDashboardLayout title="Data Keuangan - Admin">
      {/* Statistics dengan data dari rekap saldo */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {/* Saldo Syahriah */}
        <div className="bg-white border border-orange-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-orange-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.money}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Saldo Syahriah</p>
              <p className="text-2xl font-bold text-orange-900">
                {formatCurrencyShort(summaryData?.saldoSyahriah || 0, 1000000000)}
              </p>
              <p className="text-xs text-orange-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>

        {/* Saldo Donasi */}
        <div className="bg-white border border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-purple-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.money}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Saldo Donasi</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrencyShort(summaryData?.saldoDonasi || 0, 1000000000)}
              </p>
              <p className="text-xs text-purple-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>

        {/* Total Pemasukan */}
        <div className="bg-white border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.money}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Pemasukan</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrencyShort(summaryData?.totalPemasukan || 0, 1000000000)}
              </p>
              <p className="text-xs text-green-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-red-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.chart}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-900">
                {formatCurrencyShort(summaryData?.totalPengeluaran || 0, 1000000000)}
              </p>
              <p className="text-xs text-red-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>

        {/* Saldo Akhir */}
        <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.money}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Saldo Akhir</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrencyShort(summaryData?.saldoAkhir || 0, 1000000000)}
              </p>
              <p className="text-xs text-blue-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content dengan tombol export */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 lg:mb-0">Manajemen Keuangan</h2>
          
          <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-3">
            {/* Period Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Periode:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="semua">Semua Periode</option>
                {availablePeriods.map(period => (
                  <option key={period} value={period}>
                    {formatPeriod(period)}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Buttons */}
<div className="flex space-x-2">
  <button
    onClick={exportToXLSX}
    disabled={loading}
    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50"
  >
    {loading ? (
      <>
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Exporting...
      </>
    ) : (
      <>
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Excel
      </>
    )}
  </button>
  
  <button
    onClick={exportToCSV}
    disabled={loading}
    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50"
  >
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    CSV
  </button>
  
  <button
    onClick={exportToDOCX}
    disabled={loading}
    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50"
  >
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    Word
  </button>
</div>

            {/* Action Buttons lainnya */}
            <div className="flex space-x-3">
              <button
                onClick={handleOpenCreateModal}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center"
              >
                {icons.plus}
                <span className="ml-2">Pengeluaran</span>
              </button>
              <Link 
                to="/admin/donasi"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center"
              >
                {icons.plus}
                <span className="ml-2">Donasi</span>
              </Link>
              <Link 
                to="/admin/syahriah"
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm flex items-center"
              >
                {icons.plus}
                <span className="ml-2">Syahriah</span>
              </Link>
              
            </div>
          </div>
        </div>

        {/* Tabs untuk Admin */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            {['rekap', 'pengeluaran', 'pemasukan', 'syahriah'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'rekap' && 'Rekap Keuangan'}
                {tab === 'pengeluaran' && 'Pengeluaran'}
                {tab === 'pemasukan' && 'Pemasukan (Donasi)'}
                {tab === 'syahriah' && 'Pemasukan (Syahriah)'}
              </button>
            ))}
          </nav>
        </div>
      
        {/* Table Content */}
        <div>
          {renderContent()}
        </div>
      </div>

      {/* Modal untuk Create/Edit Pemakaian */}
      {showPemakaianModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {modalMode === 'create' ? 'Tambah Pengeluaran Baru' : 'Edit Pengeluaran'}
            </h3>
            
            <form onSubmit={modalMode === 'create' ? handleCreatePemakaian : handleUpdatePemakaian}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Judul Pemakaian */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul Pengeluaran *
                  </label>
                  <input
                    type="text"
                    name="judul_pemakaian"
                    value={formData.judul_pemakaian}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Masukkan judul pengeluaran"
                  />
                </div>

                {/* Deskripsi */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi *
                  </label>
                  <textarea
                    name="deskripsi"
                    value={formData.deskripsi}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Masukkan deskripsi pengeluaran"
                  />
                </div>

                {/* Nominal Syahriah */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nominal dari Syahriah
                  </label>
                  <input
                    type="number"
                    name="nominal_syahriah"
                    value={formData.nominal_syahriah}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                {/* Nominal Donasi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nominal dari Donasi
                  </label>
                  <input
                    type="number"
                    name="nominal_donasi"
                    value={formData.nominal_donasi}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                {/* Nominal Total - READ ONLY */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nominal Total *
                  </label>
                  <input
                    type="number"
                    name="nominal_total"
                    value={formData.nominal_total}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                    placeholder="0"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>
                      Total: {formatCurrency(parseFloat(formData.nominal_total) || 0)}
                    </span>
                    <span>
                      Syahriah: {formatCurrency(parseFloat(formData.nominal_syahriah) || 0)} + 
                      Donasi: {formatCurrency(parseFloat(formData.nominal_donasi) || 0)}
                    </span>
                  </div>
                </div>

                {/* Tanggal Pemakaian */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Pengeluaran *
                  </label>
                  <input
                    type="date"
                    name="tanggal_pemakaian"
                    value={formData.tanggal_pemakaian}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Tipe Pemakaian */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipe Pengeluaran *
                  </label>
                  <select
                    name="tipe_pemakaian"
                    value={formData.tipe_pemakaian}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="operasional">Operasional</option>
                    <option value="investasi">Investasi</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Keterangan */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keterangan Tambahan
                  </label>
                  <textarea
                    name="keterangan"
                    value={formData.keterangan}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Masukkan keterangan tambahan (opsional)"
                  />
                </div>
              </div>

              {/* Validation Summary */}
              {parseFloat(formData.nominal_total) <= 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-yellow-700 text-sm">
                      Total pengeluaran harus lebih dari 0. Masukkan nominal pada salah satu atau kedua sumber dana.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPemakaianModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading || parseFloat(formData.nominal_total) <= 0}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {formLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    modalMode === 'create' ? 'Tambah Pengeluaran' : 'Update Pengeluaran'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              alertMessage.type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {alertMessage.type === 'success' ? (
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h3 className={`text-xl font-bold text-center mb-2 ${
              alertMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {alertMessage.title}
            </h3>
            <p className={`text-center mb-6 ${
              alertMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {alertMessage.message}
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowAlertModal(false)}
                className={`px-6 py-2 rounded-lg text-white ${
                  alertMessage.type === 'success' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } transition-colors`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthDashboardLayout>
  );
};

export default DataKeuangan;