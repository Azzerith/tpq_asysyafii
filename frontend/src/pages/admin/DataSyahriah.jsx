import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const DataSyahriah = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pembayaran');
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState('');
  const [pembayaranData, setPembayaranData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    total_nominal: 0,
    lunas: 0,
    belum_lunas: 0
  });
  const [filteredSummaryData, setFilteredSummaryData] = useState({
    total_nominal: 0,
    lunas: 0,
    belum_lunas: 0
  });
  const [santriData, setSantriData] = useState([]);
  const [loadingPagination, setLoadingPagination] = useState(false);
  
  // State untuk modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '', type: '' });
  const [selectedSyahriah, setSelectedSyahriah] = useState(null);
  
  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  
  // State untuk filter
  const [filterNama, setFilterNama] = useState('');
  const [filterBulanTahun, setFilterBulanTahun] = useState(getCurrentMonth());
  
  // State untuk form
  const [formData, setFormData] = useState({
    id_santri: '',
    bulan: getCurrentMonth(),
    nominal: 10000,
    status: 'belum'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch semua data
  useEffect(() => {
    fetchAllData();
    fetchSantriData();
  }, [API_URL]);

  // Calculate summary when data or filters change
  useEffect(() => {
    calculateFilteredSummary();
  }, [pembayaranData, filterNama, filterBulanTahun]);

  const fetchAllData = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError('');
      
      // Tambahkan query parameters untuk pagination
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
  
      // Fetch data syahriah dengan pagination
      const syahriahResponse = await fetch(
        `${API_URL}/api/admin/syahriah?${queryParams.toString()}`, 
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (!syahriahResponse.ok) {
        throw new Error(`HTTP error! status: ${syahriahResponse.status}`);
      }
  
      const responseData = await syahriahResponse.json();
      
      // Update state data syahriah
      const syahriahData = responseData.data || [];
      
      // Urutkan data: belum lunas di atas, lalu lunas, dan urut berdasarkan bulan terbaru
      const sortedData = syahriahData.sort((a, b) => {
        // Prioritas status belum lunas
        if (a.status === 'belum' && b.status === 'lunas') return -1;
        if (a.status === 'lunas' && b.status === 'belum') return 1;
        
        // Urutkan berdasarkan bulan (terbaru di atas)
        return new Date(b.bulan) - new Date(a.bulan);
      });
      
      setPembayaranData(sortedData);
      
      // Update pagination info dari response
      if (responseData.meta) {
        setPagination({
          page: responseData.meta.page,
          limit: responseData.meta.limit,
          total: responseData.meta.total,
          total_pages: responseData.meta.total_page
        });
      }
      
      calculateSummary(sortedData);
  
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Gagal memuat data: ${err.message}`);
      setPembayaranData([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary data from pembayaranData
  const calculateSummary = (data) => {
    if (!data || data.length === 0) {
      setSummaryData({
        total_nominal: 0,
        lunas: 0,
        belum_lunas: 0
      });
      return;
    }

    const totalNominal = data
      .filter(item => item.status === 'lunas')
      .reduce((sum, item) => sum + (parseFloat(item.nominal) || 0), 0);

    const lunasCount = data.filter(item => item.status === 'lunas').length;
    const belumLunasCount = data.filter(item => item.status === 'belum').length;

    setSummaryData({
      total_nominal: totalNominal,
      lunas: lunasCount,
      belum_lunas: belumLunasCount
    });
  };

  // Calculate filtered summary based on current filters
  const calculateFilteredSummary = () => {
    const filteredData = pembayaranData.filter(item => {
      const matchesNama = filterNama === '' || 
        (item.santri?.nama_lengkap && item.santri.nama_lengkap.toLowerCase().includes(filterNama.toLowerCase()));
      
      const matchesBulanTahun = filterBulanTahun === '' || item.bulan.includes(filterBulanTahun);
      
      return matchesNama && matchesBulanTahun;
    });

    if (!filteredData || filteredData.length === 0) {
      setFilteredSummaryData({
        total_nominal: 0,
        lunas: 0,
        belum_lunas: 0
      });
      return;
    }

    const totalNominal = filteredData
      .filter(item => item.status === 'lunas')
      .reduce((sum, item) => sum + (parseFloat(item.nominal) || 0), 0);

    const lunasCount = filteredData.filter(item => item.status === 'lunas').length;
    const belumLunasCount = filteredData.filter(item => item.status === 'belum').length;

    setFilteredSummaryData({
      total_nominal: totalNominal,
      lunas: lunasCount,
      belum_lunas: belumLunasCount
    });
  };

  // Fetch data santri
  const fetchSantriData = async () => {
    try {
      console.log('🔍 Fetching santri data from:', `${API_URL}/api/admin/santri`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setError('Token tidak ditemukan');
        return;
      }
  
      // Tambahkan parameter limit besar untuk mendapatkan semua data
      const response = await fetch(
        `${API_URL}/api/admin/santri?limit=1000`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Santri data received:', data);
      
      // Handle response dengan pagination atau tanpa pagination
      if (Array.isArray(data)) {
        setSantriData(data);
        console.log(`Loaded ${data.length} santri records`);
      } else if (data.data && Array.isArray(data.data)) {
        setSantriData(data.data);
        console.log(`Loaded ${data.data.length} santri records`);
      } else if (data.data && Array.isArray(data.data.data)) {
        // Jika ada nested pagination structure
        setSantriData(data.data.data);
        console.log(`Loaded ${data.data.data.length} santri records`);
      } else {
        console.error('Unexpected data structure:', typeof data, data);
        setSantriData([]);
      }
  
    } catch (err) {
      console.error('Error fetching santri data:', err);
      setError('Gagal memuat data santri: ' + err.message);
      setSantriData([]);
    }
  };

  // Filter data berdasarkan nama santri dan bulan
  const filteredData = pembayaranData.filter(item => {
    const matchesNama = filterNama === '' || 
      (item.santri?.nama_lengkap && item.santri.nama_lengkap.toLowerCase().includes(filterNama.toLowerCase()));
    
    const matchesBulanTahun = filterBulanTahun === '' || item.bulan.includes(filterBulanTahun);
    
    return matchesNama && matchesBulanTahun;
  });

  // Filter data untuk tab tunggakan
  const tunggakanData = filteredData.filter(item => item.status === 'belum');

  // Show alert modal
  const showAlert = (title, message, type = 'success', onConfirm = null, onCancel = null) => {
    setAlertMessage({ 
      title, 
      message, 
      type,
      onConfirm,
      onCancel
    });
    setShowAlertModal(true);
  };

  const handlePageChange = async (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages && !loadingPagination) {
      setLoadingPagination(true);
      await fetchAllData(newPage, pagination.limit);
      setLoadingPagination(false);
    }
  };

  const handleLimitChange = (newLimit) => {
    fetchAllData(1, newLimit);
  };

  // Handle pembayaran
  const handleBayarSyahriah = async (idSyahriah, syahriahData) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/admin/syahriah/${idSyahriah}/bayar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'lunas' })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      await fetchAllData(pagination.page, pagination.limit);
      showAlert('Berhasil', `Pembayaran syahriah untuk ${syahriahData.santri?.nama_lengkap || 'santri'} berhasil`, 'success');
    } catch (err) {
      console.error('Error paying syahriah:', err);
      showAlert('Gagal', err.message || 'Gagal melakukan pembayaran', 'error');
    } finally {
      setLoading(false);
    }
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
      let fileName = 'Laporan_Syahriah';

      // Sheet 1: Summary/Statistik dengan kop surat
      const summarySheetData = [
        // Kop Surat
        ['', '', '', '', '', ''],
        ['', '', '', '', '', ''],
        ['', 'LAPORAN SYAHRIYAH', '', '', '', ''],
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
        // Summary Syahriah
        ['RINGKASAN SYAHRIYAH', '', '', '', '', ''],
        ['Kategori', 'Jumlah', '', '', '', ''],
        ['Total Pembayaran', summaryData?.total_nominal || 0, '', '', '', ''],
        ['Santri Lunas', summaryData?.lunas || 0, '', '', '', ''],
        ['Santri Menunggak', summaryData?.belum_lunas || 0, '', '', '', ''],
        ['', '', '', '', '', ''],
        ['DATA SYAHRIYAH', '', '', '', '', '']
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

      // Merge cells untuk kop surat
      if (!wsSummary['!merges']) wsSummary['!merges'] = [];
      wsSummary['!merges'].push(
        { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } }, // LAPORAN SYAHRIYAH
        { s: { r: 3, c: 1 }, e: { r: 3, c: 4 } }, // Nama TPQ
        { s: { r: 4, c: 1 }, e: { r: 4, c: 4 } }  // Periode
      );

      // Sheet 2: Data Syahriah dengan header
      if (filteredData.length > 0) {
        const syahriahHeader = [
          ['DATA SYAHRIYAH'],
          ['TPQ ASY-SYAFI\'I'],
          [`Periode: ${getCurrentPeriodText()}`],
          []
        ];

        const syahriahDataToExport = filteredData.map(item => ({
          'Nama Santri': item.santri?.nama_lengkap || 'N/A',
          'Wali': item.santri?.wali?.nama_lengkap || '-',
          'Email Wali': item.santri?.wali?.email || '-',
          'No. Telepon Wali': item.santri?.wali?.no_telp || '-',
          'Bulan': formatBulan(item.bulan),
          'Nominal': item.nominal,
          'Status': item.status === 'lunas' ? 'Lunas' : 'Belum Bayar',
          'Tanggal Bayar': item.status === 'lunas' ? formatDateTime(item.waktu_catat) : '-',
          'Dicatat Oleh': item.admin?.nama_lengkap || 'Admin'
        }));

        const wsSyahriah = XLSX.utils.aoa_to_sheet(syahriahHeader);
        XLSX.utils.sheet_add_json(wsSyahriah, syahriahDataToExport, { origin: 'A5', skipHeader: false });
        XLSX.utils.book_append_sheet(wb, wsSyahriah, 'Data Syahriah');
      }

      XLSX.writeFile(wb, `${fileName}_${tpqInfo?.nama_tpq?.replace(/\s+/g, '_') || 'TPQ_Asy_Syafii'}_${getCurrentPeriodText().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
      showAlert('Berhasil', `Laporan syahriah berhasil diexport ke Excel`, 'success');
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
      let fileName = 'Laporan_Syahriah';

      // Header untuk file CSV dengan informasi TPQ
      const header = [
        'LAPORAN SYAHRIYAH - TPQ ASY-SYAFI\'I',
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
        'SUMMARY SYAHRIYAH',
        'Kategori,Jumlah',
        `Total Pembayaran,${summaryData?.total_nominal || 0}`,
        `Santri Lunas,${summaryData?.lunas || 0}`,
        `Santri Menunggak,${summaryData?.belum_lunas || 0}`,
        ''
      ];

      allData = [...header, ...summarySection];

      // Section 2: Data Syahriah
      if (filteredData.length > 0) {
        allData.push('DATA SYAHRIYAH');
        allData.push('No,Nama Santri,Wali,Email Wali,No. Telepon Wali,Bulan,Nominal,Status,Tanggal Bayar,Dicatat Oleh');
        filteredData.forEach((item, index) => {
          allData.push([
            index + 1,
            `"${item.santri?.nama_lengkap || 'N/A'}"`,
            `"${item.santri?.wali?.nama_lengkap || '-'}"`,
            item.santri?.wali?.email || '-',
            item.santri?.wali?.no_telp || '-',
            formatBulan(item.bulan),
            item.nominal,
            item.status === 'lunas' ? 'Lunas' : 'Belum Bayar',
            item.status === 'lunas' ? formatDateTime(item.waktu_catat) : '-',
            item.admin?.nama_lengkap || 'Admin'
          ].join(','));
        });
      }

      const csvContent = allData.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${fileName}_${getCurrentPeriodText().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      showAlert('Berhasil', `Laporan syahriah berhasil diexport ke CSV`, 'success');
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

      // Create comprehensive HTML content untuk DOCX
      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>Laporan Syahriah - ${tpqInfo?.nama_tpq || 'TPQ Asy-Syafi\'i'}</title>
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
            <div class="judul-laporan">LAPORAN SYAHRIYAH</div>
            
            <!-- Periode -->
            <div class="periode-info">
              Periode: <strong>${getCurrentPeriodText()}</strong><br>
              Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>

            <!-- Ringkasan Syahriah -->
            <div class="section-title">RINGKASAN SYAHRIYAH</div>
            <div class="summary-section">
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-label">Total Pembayaran:</div>
                  <div class="summary-value currency">${formatCurrency(summaryData?.total_nominal || 0)}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Santri Lunas:</div>
                  <div class="summary-value">${summaryData?.lunas || 0}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Santri Menunggak:</div>
                  <div class="summary-value">${summaryData?.belum_lunas || 0}</div>
                </div>
              </div>
            </div>

            <!-- Data Syahriah -->
            ${filteredData.length > 0 ? `
              <div class="section-title">DATA SYAHRIYAH</div>
              <table>
                <thead>
                  <tr>
                    <th>No</th>
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
                  ${filteredData.map((item, index) => `
                    <tr>
                      <td style="text-align: center;">${index + 1}</td>
                      <td>${item.santri?.nama_lengkap || 'N/A'}</td>
                      <td>${item.santri?.wali?.nama_lengkap || '-'}</td>
                      <td>${formatBulan(item.bulan)}</td>
                      <td class="currency">${formatCurrency(item.nominal)}</td>
                      <td style="text-transform: capitalize;">${item.status === 'lunas' ? 'Lunas' : 'Belum Bayar'}</td>
                      <td>${item.status === 'lunas' ? formatDateTime(item.waktu_catat) : '-'}</td>
                      <td>${item.admin?.nama_lengkap || 'Admin'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="text-align: center; font-style: italic;">Tidak ada data syahriah</p>'}

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
              <p>Total Data: ${filteredData.length} syahriah</p>
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'application/msword' });
      saveAs(blob, `Laporan_Syahriah_${tpqInfo?.nama_tpq?.replace(/\s+/g, '_') || 'TPQ_Asy_Syafii'}_${getCurrentPeriodText().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`);
      showAlert('Berhasil', `Laporan syahriah berhasil diexport ke Word dengan format surat resmi`, 'success');
    } catch (err) {
      console.error('Error exporting to DOCX:', err);
      showAlert('Gagal', `Gagal export data: ${err.message}`, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // Helper functions untuk export
  const getCurrentPeriodText = () => {
    if (filterBulanTahun) {
      return formatBulan(filterBulanTahun);
    }
    return 'Semua Periode';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
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

  const handleInputAllSantri = async () => {
    try {
      setLoading(true);
      
      // Konfirmasi menggunakan modal custom
      setAlertMessage({
        title: 'Konfirmasi Input Batch',
        message: `Apakah Anda yakin ingin membuat data syahriah untuk semua santri (${santriData.length} santri) bulan ${formatBulan(getCurrentMonth())}?`,
        type: 'confirm',
        onConfirm: async () => {
          try {
            const response = await fetch(`${API_URL}/api/admin/syahriah/batch`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                bulan: getCurrentMonth(),
                nominal: 10000,
                status: 'belum'
              })
            });

            if (!response.ok) {
              let errorMessage = `HTTP error! status: ${response.status}`;
              try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
              } catch {
                // Jika response bukan JSON, gunakan text biasa
                const errorText = await response.text();
                errorMessage = errorText || errorMessage;
              }
              throw new Error(errorMessage);
            }

            const result = await response.json();
            await fetchAllData(pagination.page, pagination.limit);
            showAlert('Berhasil', result.message || `Berhasil membuat data syahriah untuk ${result.data?.created || santriData.length} santri`, 'success');
          } catch (err) {
            console.error('Error creating batch syahriah:', err);
            showAlert('Gagal', err.message || 'Gagal membuat data syahriah untuk semua santri', 'error');
          } finally {
            setLoading(false);
          }
        },
        onCancel: () => {
          setLoading(false);
          setShowAlertModal(false);
        }
      });
      setShowAlertModal(true);

    } catch (err) {
      console.error('Error in confirmation:', err);
      setLoading(false);
    }
  };

  // Handle create syahriah
  const handleCreateSyahriah = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/admin/syahriah`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      await fetchAllData(pagination.page, pagination.limit);
      setShowCreateModal(false);
      resetForm();
      showAlert('Berhasil', 'Data syahriah berhasil dibuat', 'success');
    } catch (err) {
      console.error('Error creating syahriah:', err);
      showAlert('Gagal', err.message || 'Gagal membuat data syahriah', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle update syahriah
  const handleUpdateSyahriah = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/admin/syahriah/${selectedSyahriah.id_syahriah}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nominal: parseFloat(formData.nominal),
          status: formData.status
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      await fetchAllData(pagination.page, pagination.limit);
      setShowEditModal(false);
      resetForm();
      setSelectedSyahriah(null);
      showAlert('Berhasil', 'Data syahriah berhasil diupdate', 'success');
    } catch (err) {
      console.error('Error updating syahriah:', err);
      showAlert('Gagal', err.message || 'Gagal mengupdate data syahriah', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete syahriah
  const handleDeleteSyahriah = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/admin/syahriah/${selectedSyahriah.id_syahriah}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      await fetchAllData(pagination.page, pagination.limit);
      setShowDeleteModal(false);
      setSelectedSyahriah(null);
      showAlert('Berhasil', 'Data syahriah berhasil dihapus', 'success');
    } catch (err) {
      console.error('Error deleting syahriah:', err);
      showAlert('Gagal', err.message || 'Gagal menghapus data syahriah', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      id_santri: '',
      bulan: getCurrentMonth(),
      nominal: 10000,
      status: 'belum'
    });
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Open edit modal
  const openEditModal = (syahriah) => {
    setSelectedSyahriah(syahriah);
    setFormData({
      id_santri: syahriah.id_santri,
      bulan: syahriah.bulan,
      nominal: syahriah.nominal,
      status: syahriah.status
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (syahriah) => {
    setSelectedSyahriah(syahriah);
    setShowDeleteModal(true);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Format bulan (YYYY-MM to Month Year)
  const formatBulan = (bulanString) => {
    try {
      const [year, month] = bulanString.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long'
      });
    } catch (e) {
      return bulanString;
    }
  };

  // Get unique bulan-tahun from data for filter
  const getUniqueBulanTahun = () => {
    const bulanTahunList = pembayaranData.map(item => item.bulan);
    const uniqueBulanTahun = [...new Set(bulanTahunList)].sort((a, b) => {
      // Sort descending (newest first)
      return new Date(b) - new Date(a);
    });
    
    return uniqueBulanTahun;
  };

  // Check if filters are active
  const isFilterActive = () => {
    return filterNama !== '' || filterBulanTahun !== '';
  };

  // Get current summary data (filtered or total)
  const getCurrentSummaryData = () => {
    return isFilterActive() ? filteredSummaryData : summaryData;
  };

  // Ikon SVG
  const icons = {
    money: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    check: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    clock: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    plus: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    chart: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    email: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    home: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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
    filter: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
      </svg>
    ),
    export: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    excel: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    word: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    users: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    confirm: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const renderContent = () => {
    if (loading && pembayaranData.length === 0) {
      return (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      );
    }

    if (error && pembayaranData.length === 0) {
      return (
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
    }

    const dataToShow = activeTab === 'tunggakan' ? tunggakanData : filteredData;
    const currentSummaryData = getCurrentSummaryData();

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Santri</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wali</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Bayar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dataToShow.map((item) => (
              <tr key={item.id_syahriah} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.santri?.nama_lengkap || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.santri?.wali?.nama_lengkap || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatBulan(item.bulan)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(item.nominal)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.status === 'lunas' ? formatDate(item.waktu_catat) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    item.status === 'lunas' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status === 'lunas' ? 'Lunas' : 'Belum Bayar'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                {item.status === 'belum' ? (
                  <button 
                    onClick={() => {
                      showAlert(
                        'Konfirmasi Pembayaran',
                        `Apakah Anda yakin ingin menandai pembayaran syahriah untuk ${item.santri?.nama_lengkap || 'santri'} bulan ${formatBulan(item.bulan)} sebagai lunas?`,
                        'confirm',
                        () => handleBayarSyahriah(item.id_syahriah, item),
                        () => setShowAlertModal(false)
                      );
                    }}
                    className="text-green-600 hover:text-green-900"
                    disabled={loading}
                  >
                    Bayar
                  </button>
                ) : ("")}
                  <button 
                    onClick={() => openEditModal(item)}
                    className="text-yellow-600 hover:text-yellow-900 ml-2"
                  >
                    {icons.edit}
                  </button>
                  <button 
                    onClick={() => openDeleteModal(item)}
                    className="text-red-600 hover:text-red-900 ml-2"
                  >
                    {icons.delete}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {dataToShow.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Tidak ada data {activeTab === 'tunggakan' ? 'tunggakan' : 'pembayaran'}
          </div>
        )}
        {
  dataToShow.length > 0 && (
    <div className="flex justify-between items-center mt-6">
      <div className="text-sm text-gray-600">
        Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - 
        {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Limit selector */}
        <select
          value={pagination.limit}
          onChange={(e) => handleLimitChange(parseInt(e.target.value))}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
        >
          <option value="10">10 per halaman</option>
          <option value="25">25 per halaman</option>
          <option value="50">50 per halaman</option>
          <option value="100">100 per halaman</option>
        </select>
        
        {/* Pagination buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={pagination.page === 1}
            className={`px-3 py-1 rounded-lg ${pagination.page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            &laquo;
          </button>
          
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={`px-3 py-1 rounded-lg ${pagination.page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            &lsaquo;
          </button>
          
          <span className="px-3 py-1 text-gray-700">
            Halaman {pagination.page} dari {pagination.total_pages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.total_pages}
            className={`px-3 py-1 rounded-lg ${pagination.page === pagination.total_pages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            &rsaquo;
          </button>
          
          <button
            onClick={() => handlePageChange(pagination.total_pages)}
            disabled={pagination.page === pagination.total_pages}
            className={`px-3 py-1 rounded-lg ${pagination.page === pagination.total_pages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            &raquo;
          </button>
        </div>
      </div>
    </div>
  )
}
      </div>
    );
  };

  // Get current summary data for display
  const currentSummaryData = getCurrentSummaryData();

  return (
    <AuthDashboardLayout title="Data Syahriah">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.money}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Pembayaran {isFilterActive() && <span className="text-green-600 text-xs">(1 Bulan)</span>}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {currentSummaryData ? formatCurrency(currentSummaryData.total_nominal) : 'Rp 0'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.check}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Santri Lunas {isFilterActive() && <span className="text-blue-600 text-xs">(1 Bulan)</span>}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {currentSummaryData ? currentSummaryData.lunas : 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-red-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.clock}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Santri Menunggak {isFilterActive() && <span className="text-red-600 text-xs">(1 Bulan)</span>}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {currentSummaryData ? currentSummaryData.belum_lunas : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Data Pembayaran Syahriah</h2>
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
          
          {/* Tombol Input untuk Semua Santri */}
          <button 
            onClick={handleInputAllSantri}
            disabled={loading || santriData.length === 0}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center disabled:opacity-50"
          >
            {icons.users}
            <span className="ml-2">Input Semua Santri</span>
          </button>
          <button 
            onClick={openCreateModal}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            {icons.plus}
            <span className="ml-2">Input Pembayaran</span>
          </button>
        </div>

        {/* Filter Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cari Nama Santri
            </label>
            <input
              type="text"
              value={filterNama}
              onChange={(e) => setFilterNama(e.target.value)}
              placeholder="Masukkan nama santri..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Bulan/Tahun
            </label>
            <input
              type="month"
              value={filterBulanTahun}
              onChange={(e) => setFilterBulanTahun(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterNama('');
                setFilterBulanTahun('');
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              {icons.filter}
              <span className="ml-2">Tampilkan Semua</span>
            </button>
          </div>
          <div className="flex items-end">
            {isFilterActive() && (
              <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 text-center">
                  Menampilkan data bulan yang dipilih
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            {['pembayaran', 'tunggakan'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'pembayaran' && 'Data Pembayaran'}
                {tab === 'tunggakan' && 'Tunggakan'}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Table Content */}
        <div>
          {renderContent()}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Tambah Data Syahriah</h3>
            <form onSubmit={handleCreateSyahriah}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Santri
                  </label>
                  <select
                    required
                    value={formData.id_santri}
                    onChange={(e) => setFormData({...formData, id_santri: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Pilih Santri</option>
                    {santriData && santriData.length > 0 ? (
                      santriData.map((santri) => (
                        <option 
                          key={santri.id_santri} 
                          value={santri.id_santri}
                        >
                          {santri.nama_lengkap} {santri.wali?.nama_lengkap ? `- Wali: ${santri.wali.nama_lengkap}` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {loading ? 'Memuat data santri...' : 'Tidak ada data santri tersedia'}
                      </option>
                    )}
                  </select>
                  {!loading && santriData.length === 0 && (
                    <p className="text-red-500 text-sm mt-1">
                      Tidak ada data santri. Pastikan backend berjalan dan ada data santri.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bulan
                  </label>
                  <input
                    type="month"
                    required
                    value={formData.bulan}
                    onChange={(e) => setFormData({...formData, bulan: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nominal
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.nominal}
                    onChange={(e) => setFormData({...formData, nominal: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Masukkan nominal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="belum">Belum Bayar</option>
                    <option value="lunas">Lunas</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || santriData.length === 0}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSyahriah && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Data Syahriah</h3>
            <form onSubmit={handleUpdateSyahriah}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Santri
                  </label>
                  <input
                    type="text"
                    value={selectedSyahriah.santri?.nama_lengkap || 'N/A'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bulan
                  </label>
                  <input
                    type="text"
                    value={formatBulan(selectedSyahriah.bulan)}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nominal
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.nominal}
                    onChange={(e) => setFormData({...formData, nominal: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="belum">Belum Bayar</option>
                    <option value="lunas">Lunas</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedSyahriah && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Hapus Data Syahriah</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus data syahriah untuk{' '}
              <strong>{selectedSyahriah.santri?.nama_lengkap || 'N/A'}</strong> bulan{' '}
              <strong>{formatBulan(selectedSyahriah.bulan)}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteSyahriah}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              alertMessage.type === 'success' ? 'bg-green-100' : 
              alertMessage.type === 'error' ? 'bg-red-100' :
              alertMessage.type === 'confirm' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {alertMessage.type === 'success' ? (
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : alertMessage.type === 'error' ? (
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : alertMessage.type === 'confirm' ? (
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h3 className={`text-xl font-bold text-center mb-2 ${
              alertMessage.type === 'success' ? 'text-green-800' : 
              alertMessage.type === 'error' ? 'text-red-800' :
              alertMessage.type === 'confirm' ? 'text-blue-800' : 'text-gray-800'
            }`}>
              {alertMessage.title}
            </h3>
            <p className={`text-center mb-6 ${
              alertMessage.type === 'success' ? 'text-green-600' : 
              alertMessage.type === 'error' ? 'text-red-600' :
              alertMessage.type === 'confirm' ? 'text-blue-600' : 'text-gray-600'
            }`}>
              {alertMessage.message}
            </p>
            <div className={`flex ${alertMessage.type === 'confirm' ? 'justify-between' : 'justify-center'} space-x-3`}>
              {alertMessage.type === 'confirm' && (
                <button
                  onClick={() => {
                    if (alertMessage.onCancel) {
                      alertMessage.onCancel();
                    } else {
                      setShowAlertModal(false);
                    }
                  }}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Batal
                </button>
              )}
              <button
                onClick={() => {
                  if (alertMessage.type === 'confirm' && alertMessage.onConfirm) {
                    alertMessage.onConfirm();
                  } else {
                    setShowAlertModal(false);
                  }
                }}
                className={`px-6 py-2 rounded-lg text-white ${
                  alertMessage.type === 'success' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : alertMessage.type === 'error'
                    ? 'bg-red-600 hover:bg-red-700'
                    : alertMessage.type === 'confirm'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                } transition-colors`}
              >
                {alertMessage.type === 'confirm' ? 'Ya, Lanjutkan' : 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthDashboardLayout>
  );
};

export default DataSyahriah;