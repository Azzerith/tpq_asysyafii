import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const DataDonasi = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('data');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [donasiData, setDonasiData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    total_nominal: 0,
    total_donatur: 0,
    rata_rata: 0
  });
  
  // State untuk pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_page: 0
  });
  
  // State untuk modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '', type: '' });
  const [selectedDonasi, setSelectedDonasi] = useState(null);
  
  // State untuk filter - default awal bulan sampai akhir bulan sekarang
  const getDefaultDateRange = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // +1 hari
  startDate.setDate(startDate.getDate() + 1);
  endDate.setDate(endDate.getDate() + 1);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const defaultDateRange = getDefaultDateRange();
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStartDate, setFilterStartDate] = useState(defaultDateRange.start);
  const [filterEndDate, setFilterEndDate] = useState(defaultDateRange.end);
  
  // State untuk form
  const [formData, setFormData] = useState({
    nama_donatur: '',
    no_telp: '',
    nominal: 0
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch semua data
  useEffect(() => {
    fetchDonasiData();
    fetchSummaryData();
  }, [API_URL, pagination.page, filterSearch, filterStartDate, filterEndDate]);

  // Fetch data donasi dengan pagination dan filter
  const fetchDonasiData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (filterSearch) params.append('search', filterSearch);
      
      // Gunakan endpoint by-date range untuk filter tanggal
      let fetchUrl = `${API_URL}/api/admin/donasi`;
      
      // Jika ada filter tanggal, gunakan endpoint by-date
      if (filterStartDate && filterEndDate) {
        fetchUrl = `${API_URL}/api/admin/donasi/by-date`;
        params.append('start_date', filterStartDate);
        params.append('end_date', filterEndDate);
      }
  
      const response = await fetch(`${fetchUrl}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      
      // Untuk endpoint by-date, hitung manual pagination
      if (filterStartDate && filterEndDate) {
        const allData = data.data || [];
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedData = allData.slice(startIndex, endIndex);
        
        setDonasiData(paginatedData);
        setPagination(prev => ({
          ...prev,
          total: allData.length,
          total_page: Math.ceil(allData.length / pagination.limit)
        }));
      } else {
        setDonasiData(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.meta?.total || 0,
          total_page: data.meta?.total_page || 0
        }));
      }
    } catch (err) {
      console.error('Error fetching donasi data:', err);
      setError(`Gagal memuat data: ${err.message}`);
      setDonasiData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary data
  const fetchSummaryData = async () => {
    try {
      const params = new URLSearchParams();
      
      if (filterStartDate) params.append('start_date', filterStartDate);
      if (filterEndDate) params.append('end_date', filterEndDate);
      
      const url = `${API_URL}/api/admin/donasi/summary?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSummaryData(data.data || {
          total_nominal: 0,
          total_donatur: 0,
          rata_rata: 0
        });
      }
    } catch (err) {
      console.error('Error fetching summary data:', err);
    }
  };

  // ========== EXPORT FUNCTIONS ==========
const exportToXLSX = async () => {
  setLoading(true);
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

    // Fetch semua data untuk export
    let exportUrl = `${API_URL}/api/admin/donasi`;
    const params = new URLSearchParams();
    
    if (filterSearch) params.append('search', filterSearch);
    if (filterStartDate && filterEndDate) {
      exportUrl = `${API_URL}/api/admin/donasi/by-date`;
      params.append('start_date', filterStartDate);
      params.append('end_date', filterEndDate);
    }
    
    const response = await fetch(`${exportUrl}?${params.toString()}&limit=1000`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const donasiForExport = data.data || [];

    const wb = XLSX.utils.book_new();
    let fileName = 'Laporan_Donasi';

    // Sheet 1: Summary/Statistik dengan kop surat
    const summarySheetData = [
      // Kop Surat
      ['', '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['', 'LAPORAN DONASI', '', '', '', ''],
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
      // Summary Donasi
      ['RINGKASAN DONASI', '', '', '', '', ''],
      ['Kategori', 'Nominal', '', '', '', ''],
      ['Total Donasi', summaryData?.total_nominal || 0, '', '', '', ''],
      ['Total Donatur', summaryData?.total_donatur || 0, '', '', '', ''],
      ['Rata-rata Donasi', summaryData?.rata_rata || 0, '', '', '', ''],
      ['', '', '', '', '', ''],
      ['DATA DONASI', '', '', '', '', '']
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    // Merge cells untuk kop surat
    if (!wsSummary['!merges']) wsSummary['!merges'] = [];
    wsSummary['!merges'].push(
      { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } }, // LAPORAN DONASI
      { s: { r: 3, c: 1 }, e: { r: 3, c: 4 } }, // Nama TPQ
      { s: { r: 4, c: 1 }, e: { r: 4, c: 4 } }  // Periode
    );

    // Sheet 2: Data Donasi dengan header
    if (donasiForExport.length > 0) {
      const donasiHeader = [
        ['DATA DONASI'],
        ['TPQ ASY-SYAFI\'I'],
        [`Periode: ${getCurrentPeriodText()}`],
        []
      ];

      const donasiDataToExport = donasiForExport.map(item => ({
        'Tanggal': formatDateTime(item.waktu_catat),
        'Nama Donatur': item.nama_donatur || 'Hamba Allah',
        'No. Telepon': item.no_telp || '-',
        'Nominal': item.nominal,
        'Dicatat Oleh': item.admin?.nama_lengkap || 'Admin'
      }));

      const wsDonasi = XLSX.utils.aoa_to_sheet(donasiHeader);
      XLSX.utils.sheet_add_json(wsDonasi, donasiDataToExport, { origin: 'A5', skipHeader: false });
      XLSX.utils.book_append_sheet(wb, wsDonasi, 'Data Donasi');
    }

    XLSX.writeFile(wb, `${fileName}_${tpqInfo?.nama_tpq?.replace(/\s+/g, '_') || 'TPQ_Asy_Syafii'}_${getCurrentPeriodText().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showAlert('Berhasil', `Laporan donasi berhasil diexport ke Excel`, 'success');
  } catch (err) {
    console.error('Error exporting to Excel:', err);
    showAlert('Gagal', `Gagal export data: ${err.message}`, 'error');
  } finally {
    setLoading(false);
  }
};

const exportToCSV = async () => {
  setLoading(true);
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

    // Fetch semua data untuk export
    let exportUrl = `${API_URL}/api/admin/donasi`;
    const params = new URLSearchParams();
    
    if (filterSearch) params.append('search', filterSearch);
    if (filterStartDate && filterEndDate) {
      exportUrl = `${API_URL}/api/admin/donasi/by-date`;
      params.append('start_date', filterStartDate);
      params.append('end_date', filterEndDate);
    }
    
    const response = await fetch(`${exportUrl}?${params.toString()}&limit=1000`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const donasiForExport = data.data || [];

    let allData = [];
    let fileName = 'Laporan_Donasi';

    // Header untuk file CSV dengan informasi TPQ
    const header = [
      'LAPORAN DONASI - TPQ ASY-SYAFI\'I',
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
      'SUMMARY DONASI',
      'Kategori,Nilai',
      `Total Donasi,${summaryData?.total_nominal || 0}`,
      `Total Donatur,${summaryData?.total_donatur || 0}`,
      `Rata-rata Donasi,${summaryData?.rata_rata || 0}`,
      ''
    ];

    allData = [...header, ...summarySection];

    // Section 2: Data Donasi
    if (donasiForExport.length > 0) {
      allData.push('DATA DONASI');
      allData.push('No,Tanggal,Nama Donatur,No. Telepon,Nominal,Dicatat Oleh');
      donasiForExport.forEach((item, index) => {
        allData.push([
          index + 1,
          formatDateTime(item.waktu_catat),
          `"${item.nama_donatur || 'Hamba Allah'}"`,
          item.no_telp || '-',
          item.nominal,
          item.admin?.nama_lengkap || 'Admin'
        ].join(','));
      });
    }

    const csvContent = allData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}_${getCurrentPeriodText().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    showAlert('Berhasil', `Laporan donasi berhasil diexport ke CSV`, 'success');
  } catch (err) {
    console.error('Error exporting to CSV:', err);
    showAlert('Gagal', `Gagal export data: ${err.message}`, 'error');
  } finally {
    setLoading(false);
  }
};

const exportToDOCX = async () => {
  setLoading(true);
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

    // Fetch semua data untuk export
    let exportUrl = `${API_URL}/api/admin/donasi`;
    const params = new URLSearchParams();
    
    if (filterSearch) params.append('search', filterSearch);
    if (filterStartDate && filterEndDate) {
      exportUrl = `${API_URL}/api/admin/donasi/by-date`;
      params.append('start_date', filterStartDate);
      params.append('end_date', filterEndDate);
    }
    
    const response = await fetch(`${exportUrl}?${params.toString()}&limit=1000`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const donasiForExport = data.data || [];

    // Create comprehensive HTML content for DOCX dengan format surat resmi
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Laporan Donasi - ${tpqInfo?.nama_tpq || 'TPQ Asy-Syafi\'i'}</title>
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
          <div class="judul-laporan">LAPORAN DONASI</div>
          
          <!-- Periode -->
          <div class="periode-info">
            Periode: <strong>${getCurrentPeriodText()}</strong><br>
            Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </div>

          <!-- Ringkasan Donasi -->
          <div class="section-title">RINGKASAN DONASI</div>
          <div class="summary-section">
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">Total Donasi:</div>
                <div class="summary-value currency">${formatCurrency(summaryData?.total_nominal || 0)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Donatur:</div>
                <div class="summary-value">${summaryData?.total_donatur || 0}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Rata-rata Donasi:</div>
                <div class="summary-value currency">${formatCurrency(summaryData?.rata_rata || 0)}</div>
              </div>
            </div>
          </div>

          <!-- Data Donasi -->
          ${donasiForExport.length > 0 ? `
            <div class="section-title">DATA DONASI</div>
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>Nama Donatur</th>
                  <th>No. Telepon</th>
                  <th>Nominal</th>
                  <th>Dicatat Oleh</th>
                </tr>
              </thead>
              <tbody>
                ${donasiForExport.map((item, index) => `
                  <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td>${formatDateTime(item.waktu_catat)}</td>
                    <td>${item.nama_donatur || 'Hamba Allah'}</td>
                    <td>${item.no_telp || '-'}</td>
                    <td class="currency">${formatCurrency(item.nominal)}</td>
                    <td>${item.admin?.nama_lengkap || 'Admin'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="text-align: center; font-style: italic;">Tidak ada data donasi</p>'}

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
            <p>Total Data: ${donasiForExport.length} donasi</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    saveAs(blob, `Laporan_Donasi_${tpqInfo?.nama_tpq?.replace(/\s+/g, '_') || 'TPQ_Asy_Syafii'}_${getCurrentPeriodText().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`);
    showAlert('Berhasil', `Laporan donasi berhasil diexport ke Word`, 'success');
  } catch (err) {
    console.error('Error exporting to DOCX:', err);
    showAlert('Gagal', `Gagal export data: ${err.message}`, 'error');
  } finally {
    setLoading(false);
  }
};


  // Format currency for export
  const formatCurrencyForExport = (amount) => {
    return `Rp ${(amount || 0).toLocaleString('id-ID')}`;
  };

  // Helper functions untuk export
const getCurrentPeriodText = () => {
  if (filterStartDate && filterEndDate) {
    return `${formatDateForExport(filterStartDate)} - ${formatDateForExport(filterEndDate)}`;
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

const formatDateForExport = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

  // Show alert modal
  const showAlert = (title, message, type = 'success') => {
    setAlertMessage({ title, message, type });
    setShowAlertModal(true);
  };

  // Handle create donasi
  const handleCreateDonasi = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/admin/donasi`, {
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

      await fetchDonasiData();
      await fetchSummaryData();
      setShowCreateModal(false);
      resetForm();
      showAlert('Berhasil', 'Data donasi berhasil dibuat', 'success');
    } catch (err) {
      console.error('Error creating donasi:', err);
      showAlert('Gagal', err.message || 'Gagal membuat data donasi', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle update donasi
  const handleUpdateDonasi = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/admin/donasi/${selectedDonasi.id_donasi}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nama_donatur: formData.nama_donatur,
          no_telp: formData.no_telp,
          nominal: parseFloat(formData.nominal)
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

      await fetchDonasiData();
      await fetchSummaryData();
      setShowEditModal(false);
      resetForm();
      setSelectedDonasi(null);
      showAlert('Berhasil', 'Data donasi berhasil diupdate', 'success');
    } catch (err) {
      console.error('Error updating donasi:', err);
      showAlert('Gagal', err.message || 'Gagal mengupdate data donasi', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete donasi
  const handleDeleteDonasi = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/admin/donasi/${selectedDonasi.id_donasi}`, {
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

      await fetchDonasiData();
      await fetchSummaryData();
      setShowDeleteModal(false);
      setSelectedDonasi(null);
      showAlert('Berhasil', 'Data donasi berhasil dihapus', 'success');
    } catch (err) {
      console.error('Error deleting donasi:', err);
      showAlert('Gagal', err.message || 'Gagal menghapus data donasi', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nama_donatur: '',
      no_telp: '',
      nominal: 0
    });
  };

  // Reset filters to default (current month)
  const resetFiltersToDefault = () => {
    setFilterSearch('');
    setFilterStartDate(defaultDateRange.start);
    setFilterEndDate(defaultDateRange.end);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Open edit modal
  const openEditModal = (donasi) => {
    setSelectedDonasi(donasi);
    setFormData({
      nama_donatur: donasi.nama_donatur,
      no_telp: donasi.no_telp || '',
      nominal: donasi.nominal
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (donasi) => {
    setSelectedDonasi(donasi);
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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Check if filters are active
  const isFilterActive = () => {
    return filterSearch !== '' || 
           filterStartDate !== defaultDateRange.start || 
           filterEndDate !== defaultDateRange.end;
  };

  // Ikon SVG
  const icons = {
    download: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),  
    money: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    users: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    average: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    calendar: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    plus: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
    edit: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    delete: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    )
  };

  const renderContent = () => {
    if (loading && donasiData.length === 0) {
      return (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      );
    }

    if (error && donasiData.length === 0) {
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
            onClick={fetchDonasiData}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-medium"
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'data':
        return (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donatur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Telepon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dicatat Oleh</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {donasiData.map((item) => (
                    <tr key={item.id_donasi} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.nama_donatur || 'Hamba Allah'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.no_telp || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.nominal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.waktu_catat)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.admin?.nama_lengkap || 'System'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          {icons.edit}
                        </button>
                        <button 
                          onClick={() => openDeleteModal(item)}
                          className="text-red-600 hover:text-red-900"
                          title="Hapus"
                        >
                          {icons.delete}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {donasiData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada data donasi
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.total_page > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.total_page}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Menampilkan <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> -{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      dari <span className="font-medium">{pagination.total}</span> hasil
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {Array.from({ length: pagination.total_page }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === pagination.total_page || 
                          Math.abs(page - pagination.page) <= 1
                        )
                        .map((page, index, array) => {
                          // Add ellipsis for gaps
                          const showEllipsis = index > 0 && page - array[index - 1] > 1;
                          return (
                            <React.Fragment key={page}>
                              {showEllipsis && (
                                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                  ...
                                </span>
                              )}
                              <button
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                  pagination.page === page
                                    ? 'bg-green-600 text-white focus:z-20 focus-visible:outline  focus-visible:outline-offset-2 focus-visible:outline-green-600'
                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.total_page}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l4.5-4.25a.75.75 0 111.04 1.08L11.168 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 01.02-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'laporan':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Ringkasan Donasi</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Donasi:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(summaryData.total_nominal)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Jumlah Donatur:</span>
                    <span className="font-semibold text-gray-900">
                      {summaryData.total_donatur}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Rata-rata Donasi:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(summaryData.rata_rata)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Periode:</span>
                    <span className="font-semibold text-gray-900">
                      {formatDateForExport(filterStartDate)} - {formatDateForExport(filterEndDate)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Download Laporan</h3>
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
              </div>
            </div>

            {/* Data Donasi untuk Laporan */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Data Donasi Terbaru</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donatur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {donasiData.slice(0, 10).map((item) => (
                      <tr key={item.id_donasi} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.nama_donatur || 'Hamba Allah'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(item.nominal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.waktu_catat)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <AuthDashboardLayout title="Data Donasi">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.money}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Donasi</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryData.total_nominal)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-blue-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.users}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Donatur</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryData.total_donatur}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="bg-purple-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white">{icons.average}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rata-rata Donasi</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summaryData.rata_rata)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Manajemen Donasi</h2>
          <div className="flex space-x-2">
            <div className="dropdown relative">
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
            </div>
            <button 
              onClick={openCreateModal}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              {icons.plus}
              <span className="ml-2">Input Donasi</span>
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cari Donatur/No. Telepon
            </label>
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => {
                setFilterSearch(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              placeholder="Masukkan nama atau nomor telepon..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={resetFiltersToDefault}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              {icons.filter}
              <span className="ml-2">Reset Filter</span>
            </button>
          </div>
        </div>

        {/* Info Filter */}
        {isFilterActive() && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Filter Aktif:</strong> 
              {filterSearch && ` Pencarian: "${filterSearch}"`}
              {filterStartDate && ` Periode: ${formatDateForExport(filterStartDate)} - ${formatDateForExport(filterEndDate)}`}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            {['data', 'laporan'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'data' && 'Data Donasi'}
                {tab === 'laporan' && 'Laporan Donasi'}
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
            <h3 className="text-xl font-bold text-gray-800 mb-4">Tambah Data Donasi</h3>
            <form onSubmit={handleCreateDonasi}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Donatur
                  </label>
                  <input
                    type="text"
                    value={formData.nama_donatur}
                    onChange={(e) => setFormData({...formData, nama_donatur: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Kosongkan untuk 'Hamba Allah'"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. Telepon
                  </label>
                  <input
                    type="tel"
                    value={formData.no_telp}
                    onChange={(e) => setFormData({...formData, no_telp: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Opsional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nominal
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.nominal}
                    onChange={(e) => setFormData({...formData, nominal: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Masukkan nominal"
                  />
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

      {/* Edit Modal */}
      {showEditModal && selectedDonasi && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Data Donasi</h3>
            <form onSubmit={handleUpdateDonasi}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Donatur
                  </label>
                  <input
                    type="text"
                    value={formData.nama_donatur}
                    onChange={(e) => setFormData({...formData, nama_donatur: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Kosongkan untuk 'Hamba Allah'"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. Telepon
                  </label>
                  <input
                    type="tel"
                    value={formData.no_telp}
                    onChange={(e) => setFormData({...formData, no_telp: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Opsional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nominal
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.nominal}
                    onChange={(e) => setFormData({...formData, nominal: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
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
      {showDeleteModal && selectedDonasi && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Hapus Data Donasi</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus data donasi dari{' '}
              <strong>{selectedDonasi.nama_donatur || 'Hamba Allah'}</strong> sebesar{' '}
              <strong>{formatCurrency(selectedDonasi.nominal)}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteDonasi}
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
              alertMessage.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {alertMessage.type === 'success' ? (
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : alertMessage.type === 'error' ? (
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h3 className={`text-xl font-bold text-center mb-2 ${
              alertMessage.type === 'success' ? 'text-green-800' : 
              alertMessage.type === 'error' ? 'text-red-800' : 'text-blue-800'
            }`}>
              {alertMessage.title}
            </h3>
            <p className={`text-center mb-6 ${
              alertMessage.type === 'success' ? 'text-green-600' : 
              alertMessage.type === 'error' ? 'text-red-600' : 'text-blue-600'
            }`}>
              {alertMessage.message}
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowAlertModal(false)}
                className={`px-6 py-2 rounded-lg text-white ${
                  alertMessage.type === 'success' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : alertMessage.type === 'error'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown JavaScript */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('click', function(e) {
            if (!e.target.closest('.dropdown')) {
              document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.add('hidden');
              });
            }
          });
          
          document.querySelectorAll('.dropdown > button').forEach(button => {
            button.addEventListener('click', function() {
              const menu = this.nextElementSibling;
              menu.classList.toggle('hidden');
            });
          });
        `
      }} />
    </AuthDashboardLayout>
  );
};

export default DataDonasi;