import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const KeuanganTPQ = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rekapData, setRekapData] = useState([]);
  const [pemakaianData, setPemakaianData] = useState([]);
  const [donasiData, setDonasiData] = useState([]);
  const [syahriahData, setSyahriahData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('semua');
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [activeTab, setActiveTab] = useState('rekap');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const months = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  // Fetch all data seperti di admin - DIPERBAIKI
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      
      // Load data secara parallel untuk wali
      const [rekapResponse, pemakaianResponse, donasiResponse, syahriahResponse] = await Promise.all([
        fetch(`${API_URL}/api/rekap?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/api/pemakaian?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/api/donasi?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/api/syahriah?limit=100`, {
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

      const rekapResult = await rekapResponse.json();
      const pemakaianResult = await pemakaianResponse.json();
      const donasiResult = await donasiResponse.json();
      const syahriahResult = await syahriahResponse.json();

      setRekapData(rekapResult.data || []);
      setPemakaianData(pemakaianResult.data || []);
      setDonasiData(donasiResult.data || []);
      setSyahriahData(syahriahResult.data || []);

      // Extract unique years dari data rekap
      const periods = rekapResult.data.map(item => item.periode);
      const years = [...new Set(periods.map(p => p.split('-')[0]))].sort((a, b) => b - a);
      setAvailableYears(years);

      // Get months for current year
      if (years.length > 0) {
        const currentYear = selectedYear || years[0];
        const monthsForYear = [...new Set(
          periods
            .filter(p => p.startsWith(currentYear))
            .map(p => p.split('-')[1])
        )].sort();
        setAvailableMonths(monthsForYear);
      }

    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Gagal memuat data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Update available months when year changes
  useEffect(() => {
    if (rekapData.length > 0) {
      const periods = rekapData.map(item => item.periode);
      
      if (selectedYear === 'semua') {
        // Jika semua tahun, tampilkan semua bulan yang ada
        const allMonths = [...new Set(
          periods.map(p => p.split('-')[1])
        )].sort();
        setAvailableMonths(allMonths);
      } else {
        // Jika tahun spesifik, tampilkan bulan untuk tahun tersebut
        const monthsForYear = [...new Set(
          periods
            .filter(p => p.startsWith(selectedYear))
            .map(p => p.split('-')[1])
        )].sort();
        setAvailableMonths(monthsForYear);
      }
      
      // Reset month to "semua" if selected month is not available for the new year
      if (selectedMonth !== 'semua' && !availableMonths.includes(selectedMonth)) {
        setSelectedMonth('semua');
      }
    }
  }, [selectedYear, rekapData]);

  // Summary dihitung berdasarkan filter periode yang dipilih
  const calculateSummary = () => {
    if (rekapData.length === 0) {
      setSummaryData(null);
      return;
    }

    let filteredRekap = rekapData;
    
    // Filter data berdasarkan tahun dan bulan yang dipilih
    if (selectedYear !== 'semua' || selectedMonth !== 'semua') {
      filteredRekap = rekapData.filter(item => {
        const [year, month] = item.periode.split('-');
        
        // Filter by year
        if (selectedYear !== 'semua' && year !== selectedYear) return false;
        
        // Filter by month if selected
        if (selectedMonth !== 'semua' && month !== selectedMonth) return false;
        
        return true;
      });
    }

    // PERBAIKAN: Hitung summary dari data rekap yang sudah difilter
    let totalPemasukanSyahriah = 0;
    let totalPemasukanDonasi = 0;
    let totalPengeluaranSyahriah = 0;
    let totalPengeluaranDonasi = 0;
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let saldoAkhir = 0;

    if (filteredRekap.length > 0) {
      if (selectedMonth === 'semua' && selectedYear === 'semua') {
        // Untuk "semua periode", jumlahkan semua data
        totalPemasukanSyahriah = filteredRekap.reduce((sum, item) => sum + (item.pemasukan_syahriah || 0), 0);
        totalPemasukanDonasi = filteredRekap.reduce((sum, item) => sum + (item.pemasukan_donasi || 0), 0);
        totalPengeluaranSyahriah = filteredRekap.reduce((sum, item) => sum + (item.pengeluaran_syahriah || 0), 0);
        totalPengeluaranDonasi = filteredRekap.reduce((sum, item) => sum + (item.pengeluaran_donasi || 0), 0);
        totalPemasukan = filteredRekap.reduce((sum, item) => sum + (item.pemasukan_total || 0), 0);
        totalPengeluaran = filteredRekap.reduce((sum, item) => sum + (item.pengeluaran_total || 0), 0);
        
        // Untuk saldo akhir di semua periode, ambil saldo terakhir
        const latestPeriod = rekapData.length > 0 ? rekapData[0].periode : null;
        const latestRekap = rekapData.find(item => item.periode === latestPeriod);
        saldoAkhir = latestRekap?.saldo_akhir_total || 0;
      } else if (selectedMonth === 'semua' && selectedYear !== 'semua') {
        // Untuk tahun tertentu (semua bulan)
        totalPemasukanSyahriah = filteredRekap.reduce((sum, item) => sum + (item.pemasukan_syahriah || 0), 0);
        totalPemasukanDonasi = filteredRekap.reduce((sum, item) => sum + (item.pemasukan_donasi || 0), 0);
        totalPengeluaranSyahriah = filteredRekap.reduce((sum, item) => sum + (item.pengeluaran_syahriah || 0), 0);
        totalPengeluaranDonasi = filteredRekap.reduce((sum, item) => sum + (item.pengeluaran_donasi || 0), 0);
        totalPemasukan = filteredRekap.reduce((sum, item) => sum + (item.pemasukan_total || 0), 0);
        totalPengeluaran = filteredRekap.reduce((sum, item) => sum + (item.pengeluaran_total || 0), 0);
        
        // Untuk saldo akhir di tahun tertentu, ambil saldo terakhir dari tahun tersebut
        const latestRekapForYear = filteredRekap[0]; // Data sudah diurutkan descending
        saldoAkhir = latestRekapForYear?.saldo_akhir_total || 0;
      } else if (selectedMonth !== 'semua') {
        // Untuk bulan tertentu (dengan atau tanpa tahun spesifik)
        totalPemasukanSyahriah = filteredRekap.reduce((sum, item) => sum + (item.pemasukan_syahriah || 0), 0);
        totalPemasukanDonasi = filteredRekap.reduce((sum, item) => sum + (item.pemasukan_donasi || 0), 0);
        totalPengeluaranSyahriah = filteredRekap.reduce((sum, item) => sum + (item.pengeluaran_syahriah || 0), 0);
        totalPengeluaranDonasi = filteredRekap.reduce((sum, item) => sum + (item.pengeluaran_donasi || 0), 0);
        totalPemasukan = filteredRekap.reduce((sum, item) => sum + (item.pemasukan_total || 0), 0);
        totalPengeluaran = filteredRekap.reduce((sum, item) => sum + (item.pengeluaran_total || 0), 0);
        
        // Untuk saldo akhir bulan tertentu, ambil saldo terakhir dari bulan tersebut
        if (filteredRekap.length > 0) {
          saldoAkhir = filteredRekap[0]?.saldo_akhir_total || 0;
        }
      }
    }

    // PERBAIKAN: Hitung total syahriah wali sendiri dari data syahriah dengan filter yang sama
    const filteredSyahriah = getFilteredSyahriah();
    const totalSyahriahOwn = filteredSyahriah
      .filter(item => item.status === 'lunas')
      .reduce((sum, item) => sum + (item.nominal || 0), 0);

    setSummaryData({
      totalPemasukan,
      totalPengeluaran,
      saldoAkhir,
      totalDonasi: totalPemasukanDonasi,
      totalSyahriah: totalPemasukanSyahriah,
      totalSyahriahOwn,
      totalPemasukanSyahriah,
      totalPemasukanDonasi,
      totalPengeluaranSyahriah,
      totalPengeluaranDonasi
    });
  };

  // Recalculate summary ketika periode berubah atau data berubah
  useEffect(() => {
    calculateSummary();
  }, [selectedYear, selectedMonth, rekapData, pemakaianData, donasiData, syahriahData]);

  // Load data
  useEffect(() => {
    fetchAllData();
  }, [API_URL]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format currency untuk summary card dengan singkatan - DIPERBAIKI
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

  // Format period (YYYY-MM to Month Year)
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

  // Format date
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

  // Format datetime
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

  // Helper untuk mendapatkan periode yang dipilih
  const getSelectedPeriod = () => {
    if (selectedYear === 'semua' && selectedMonth === 'semua') return 'semua';
    if (selectedMonth === 'semua') return selectedYear;
    if (selectedYear === 'semua') return `semua-${selectedMonth}`;
    return `${selectedYear}-${selectedMonth}`;
  };

  // Filter data berdasarkan periode yang dipilih
  const getFilteredRekap = () => {
    if (selectedYear === 'semua' && selectedMonth === 'semua') {
      return rekapData;
    }
    
    if (selectedMonth === 'semua' && selectedYear !== 'semua') {
      // Filter hanya berdasarkan tahun
      return rekapData.filter(item => item.periode.startsWith(selectedYear));
    }
    
    if (selectedYear === 'semua' && selectedMonth !== 'semua') {
      // Filter hanya berdasarkan bulan (semua tahun)
      return rekapData.filter(item => item.periode.endsWith(`-${selectedMonth}`));
    }
    
    // Filter berdasarkan tahun dan bulan
    return rekapData.filter(item => item.periode === `${selectedYear}-${selectedMonth}`);
  };

  const getFilteredPemakaian = () => {
    if (selectedYear === 'semua' && selectedMonth === 'semua') {
      return pemakaianData;
    }
    
    return pemakaianData.filter(item => {
      const itemDate = item.tanggal_pemakaian || item.created_at;
      const itemYear = new Date(itemDate).getFullYear().toString();
      const itemMonth = (new Date(itemDate).getMonth() + 1).toString().padStart(2, '0');
      
      if (selectedMonth === 'semua' && selectedYear !== 'semua') {
        return itemYear === selectedYear;
      }
      
      if (selectedYear === 'semua' && selectedMonth !== 'semua') {
        return itemMonth === selectedMonth;
      }
      
      return itemYear === selectedYear && itemMonth === selectedMonth;
    });
  };

  const getFilteredDonasi = () => {
    if (selectedYear === 'semua' && selectedMonth === 'semua') {
      return donasiData;
    }
    
    return donasiData.filter(item => {
      const itemYear = new Date(item.waktu_catat).getFullYear().toString();
      const itemMonth = (new Date(item.waktu_catat).getMonth() + 1).toString().padStart(2, '0');
      
      if (selectedMonth === 'semua' && selectedYear !== 'semua') {
        return itemYear === selectedYear;
      }
      
      if (selectedYear === 'semua' && selectedMonth !== 'semua') {
        return itemMonth === selectedMonth;
      }
      
      return itemYear === selectedYear && itemMonth === selectedMonth;
    });
  };

  const getFilteredSyahriah = () => {
    if (selectedYear === 'semua' && selectedMonth === 'semua') {
      // Hanya tampilkan data milik wali sendiri
      return syahriahData.filter(item => item.wali?.id === user?.id);
    }
    
    if (selectedMonth === 'semua' && selectedYear !== 'semua') {
      // Filter berdasarkan tahun dan hanya data wali sendiri
      return syahriahData.filter(item => {
        const itemYear = item.bulan.split('-')[0];
        return itemYear === selectedYear && item.wali?.id === user?.id;
      });
    }
    
    if (selectedYear === 'semua' && selectedMonth !== 'semua') {
      // Filter berdasarkan bulan (semua tahun) dan hanya data wali sendiri
      return syahriahData.filter(item => {
        const itemMonth = item.bulan.split('-')[1];
        return itemMonth === selectedMonth && item.wali?.id === user?.id;
      });
    }
    
    // Filter berdasarkan bulan dan tahun spesifik, hanya data wali sendiri
    return syahriahData.filter(item => {
      return item.bulan === `${selectedYear}-${selectedMonth}` && item.wali?.id === user?.id;
    });
  };

  const getCurrentPeriodText = () => {
    if (selectedYear === 'semua' && selectedMonth === 'semua') return 'Semua Periode';
    if (selectedMonth === 'semua') return `Tahun ${selectedYear}`;
    if (selectedYear === 'semua') {
      const monthObj = months.find(m => m.value === selectedMonth);
      return `Bulan ${monthObj?.label || selectedMonth} (Semua Tahun)`;
    }
    return formatPeriod(`${selectedYear}-${selectedMonth}`);
  };

  // Render content berdasarkan active tab - DENGAN SEPARATOR VERTICAL
const renderContent = () => {
  const filteredRekap = getFilteredRekap();
  const filteredPemakaian = getFilteredPemakaian();
  const filteredDonasi = getFilteredDonasi();
  const filteredSyahriah = getFilteredSyahriah();

  switch (activeTab) {
    case 'rekap':
      return (
        <>
          {/* Desktop View - Full Table */}
          <div className="hidden md:block overflow-x-auto">
            {filteredRekap.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Belum Ada Data Rekap</h3>
                <p className="text-green-600">Data rekap keuangan akan muncul setelah ada transaksi</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-900 bg-green-50 uppercase">Periode</th>
                    
                    {/* Header Syahriah */}
                    <th colSpan="3" className="px-6 py-3 text-center text-xs font-medium bg-orange-600 uppercase text-orange-50 border-x border-orange-200">
                      <div className="flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        </svg>
                        Dana Syahriah
                      </div>
                    </th>
                    
                    {/* Header Donasi */}
                    <th colSpan="3" className="px-6 py-3 text-center text-xs font-medium bg-purple-600 uppercase text-purple-50 border-x border-purple-200">
                      <div className="flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Dana Donasi
                      </div>
                    </th>
                    
                    <th colSpan="3" className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Ringkasan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Update Terakhir</th>
                  </tr>
                  
                  {/* Sub-header */}
                  <tr>
                    <th className="px-6 py-2 text-left text-xs font-medium text-green-900 uppercase bg-green-50"></th>
                    
                    {/* Syahriah Sub-headers */}
                    <th className="px-6 py-2 text-left text-xs font-medium text-orange-600 uppercase bg-orange-50 border-x border-orange-100">Pemasukan</th>
                    <th className="px-6 py-2 text-left text-xs font-medium text-orange-600 uppercase bg-orange-50">Pengeluaran</th>
                    <th className="px-6 py-2 text-left text-xs font-medium text-orange-600 uppercase bg-orange-50 border-x border-orange-100">Saldo</th>
                    
                    {/* Donasi Sub-headers */}
                    <th className="px-6 py-2 text-left text-xs font-medium text-purple-600 uppercase bg-purple-50">Pemasukan</th>
                    <th className="px-6 py-2 text-left text-xs font-medium text-purple-600 uppercase bg-purple-50">Pengeluaran</th>
                    <th className="px-6 py-2 text-left text-xs font-medium text-purple-600 uppercase bg-purple-50 border-x border-purple-100">Saldo</th>
                    
                    {/* Ringkasan Sub-headers */}
                    <th className="px-6 py-2 text-left text-xs font-medium text-green-600 uppercase bg-green-50">Pemasukan</th>
                    <th className="px-6 py-2 text-left text-xs font-medium text-green-600 uppercase bg-green-50">Pengeluaran</th>
                    <th className="px-6 py-2 text-left text-xs font-medium text-green-600 uppercase bg-green-50">Saldo Akhir</th>
                    
                    <th className="px-6 py-2 text-left text-xs font-medium text-green-600 uppercase bg-green-50"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-green-100">
                  {filteredRekap.map((item, index) => (
                    <tr key={index} className="hover:bg-green-50 transition-colors">
                      {/* Periode */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPeriod(item.periode)}
                      </td>
                      
                      {/* Syahriah Columns */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium bg-orange-50/30 border-x border-orange-100">
                        {formatCurrency(item.pemasukan_syahriah)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium bg-orange-50/30">
                        {formatCurrency(item.pengeluaran_syahriah)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium bg-orange-50/30 border-x border-orange-100">
                        {formatCurrency(item.saldo_akhir_syahriah)}
                      </td>
                      
                      {/* Donasi Columns */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium bg-purple-50/30">
                        {formatCurrency(item.pemasukan_donasi)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium bg-purple-50/30">
                        {formatCurrency(item.pengeluaran_donasi)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium bg-purple-50/30 border-x border-purple-100">
                        {formatCurrency(item.saldo_akhir_donasi)}
                      </td>
                      
                      {/* Ringkasan Columns */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium bg-green-50/30">
                        {formatCurrency(item.pemasukan_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium bg-green-50/30">
                        {formatCurrency(item.pengeluaran_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold bg-green-50/30">
                        <span className={item.saldo_akhir_total >= 0 ? 'text-green-800' : 'text-red-800'}>
                          {formatCurrency(item.saldo_akhir_total)}
                        </span>
                      </td>
                      
                      {/* Update Terakhir */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(item.terakhir_update)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile View - Separate Tables */}
          <div className="md:hidden space-y-6">
            {filteredRekap.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Belum Ada Data Rekap</h3>
                <p className="text-green-600">Data rekap keuangan akan muncul setelah ada transaksi</p>
              </div>
            ) : (
              filteredRekap.map((item, index) => (
                <div key={index} className="space-y-4">
                  {/* Header Periode */}
                  <div className="bg-green-600 px-4 py-3 rounded-t-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-white">{formatPeriod(item.periode)}</h3>
                      <span className="text-xs text-green-600">
                        Update: {formatDateTime(item.terakhir_update)}
                      </span>
                    </div>
                  </div>

                  {/* Table 1: Dana Syahriah */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-orange-100 border border-orange-200 rounded-lg">
                      <thead>
                        <tr className="bg-orange-50">
                          <th colSpan="3" className="px-4 py-3 text-center text-xs font-medium bg-orange-600 text-white uppercase">
                            <div className="flex items-center justify-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                              </svg>
                              Dana Syahriah
                            </div>
                          </th>
                        </tr>
                        <tr className="bg-orange-100">
                          <th className="px-4 py-2 text-left text-xs font-medium text-orange-800 uppercase w-1/3">Pemasukan</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-orange-800 uppercase w-1/3">Pengeluaran</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-orange-800 uppercase w-1/3">Saldo Bulan ini</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-orange-100">
                        <tr>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(item.pemasukan_syahriah)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-600">
                            {formatCurrency(item.pengeluaran_syahriah)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                            {formatCurrency(item.saldo_akhir_syahriah)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Table 2: Dana Donasi */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-purple-100 border border-purple-200 rounded-lg">
                      <thead>
                        <tr className="bg-purple-50">
                          <th colSpan="3" className="px-4 py-3 text-center text-xs font-medium bg-purple-600 text-white uppercase">
                            <div className="flex items-center justify-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              Dana Donasi
                            </div>
                          </th>
                        </tr>
                        <tr className="bg-purple-100">
                          <th className="px-4 py-2 text-left text-xs font-medium text-purple-800 uppercase w-1/3">Pemasukan</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-purple-800 uppercase w-1/3">Pengeluaran</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-purple-800 uppercase w-1/3">Saldo Bulan ini</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-purple-100">
                        <tr>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(item.pemasukan_donasi)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-600">
                            {formatCurrency(item.pengeluaran_donasi)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                            {formatCurrency(item.saldo_akhir_donasi)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Table 3: Ringkasan Total */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-green-100 border border-green-200 rounded-lg">
                      <thead>
                        <tr className="bg-green-50">
                          <th colSpan="3" className="px-4 py-3 text-center text-xs font-medium text-green-800 uppercase">
                            <div className="flex items-center justify-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              Ringkasan Total
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-green-100">
                        <tr>
                          <td className="px-4 py-3 border-b border-green-100">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-600">Total Pemasukan</span>
                              <span className="font-semibold text-green-700">
                                {formatCurrency(item.pemasukan_total)}
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 border-b border-green-100">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-red-600">Total Pengeluaran</span>
                              <span className="font-semibold text-red-700">
                                {formatCurrency(item.pengeluaran_total)}
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-blue-600">Saldo Akhir {formatPeriod(item.periode)}</span>
                              <span className={`text-lg font-bold ${item.saldo_akhir_total >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                                {formatCurrency(item.saldo_akhir_total)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
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
              <p className="text-green-600">Data pengeluaran akan muncul setelah ada pemakaian saldo</p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-green-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Keterangan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Tipe</th>
                      
                      {/* Header Dana dengan Separator */}
                      <th colSpan="3" className="px-6 py-3 text-center text-xs font-medium text-white uppercase border-x border-green-200">
                        Sumber Dana
                      </th>
                      
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Diajukan Oleh</th>
                    </tr>
                    
                    {/* Sub-header untuk Sumber Dana */}
                    <tr>
                      <th className="px-6 py-2 text-left text-xs font-medium text-green-600 uppercase bg-green-600"></th>
                      <th className="px-6 py-2 text-left text-xs font-medium text-green-600 uppercase bg-green-600"></th>
                      <th className="px-6 py-2 text-left text-xs font-medium text-green-600 uppercase bg-green-600"></th>
                      
                      {/* Dana Syahriah */}
                      <th className="px-6 py-2 text-left text-xs font-medium text-white uppercase bg-orange-600 border-x border-orange-100">
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          </svg>
                          Syahriah
                        </div>
                      </th>
                      
                      {/* Dana Donasi */}
                      <th className="px-6 py-2 text-left text-xs font-medium text-white uppercase bg-purple-600">
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Donasi
                        </div>
                      </th>
                      
                      {/* Total */}
                      <th className="px-6 py-2 text-left text-xs font-medium text-white uppercase bg-red-600 border-x border-red-100">
                        Total
                      </th>
                      
                      <th className="px-6 py-2 text-left text-xs font-medium text-green-600 uppercase bg-green-600"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-green-100">
                    {filteredPemakaian.map((item, index) => (
                      <tr key={index} className="hover:bg-green-50 transition-colors">
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
                        
                        {/* Dana Syahriah */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600 bg-orange-50/30 border-x border-orange-100">
                          {formatCurrency(item.nominal_syahriah)}
                        </td>
                        
                        {/* Dana Donasi */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600 bg-purple-50/30">
                          {formatCurrency(item.nominal_donasi)}
                        </td>
                        
                        {/* Total */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 bg-red-50/30 border-x border-red-100">
                          {formatCurrency(item.nominal_total)}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.pengaju?.nama_lengkap || 'Admin'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead>
                    <tr className="bg-green-600">
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Pengeluaran</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPemakaian.map((item, index) => (
                      <>
                        <tr key={`${index}-main`} className="border-b border-gray-100">
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">{item.judul_pemakaian}</div>
                              <div className="text-xs text-gray-500">
                                {item.tanggal_pemakaian ? formatDate(item.tanggal_pemakaian) : formatDate(item.created_at)}
                              </div>
                              <div>
                                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                                  item.tipe_pemakaian === 'operasional' ? 'bg-blue-100 text-blue-800' :
                                  item.tipe_pemakaian === 'investasi' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.tipe_pemakaian}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-left">
                            <span className="text-lg font-bold text-red-700">
                              {formatCurrency(item.nominal_total)}
                            </span>
                          </td>
                        </tr>
                        
                        {/* Detail Row */}
                        <tr key={`${index}-detail`} className="bg-gray-50">
                          <td colSpan="2" className="px-4 py-3">
                            <div className="space-y-2">
                              {item.deskripsi && (
                                <div className="text-sm text-gray-600">{item.deskripsi}</div>
                              )}
                              
                              {item.keterangan && (
                                <div className="text-xs text-gray-500">
                                  <span className="font-medium">Catatan:</span> {item.keterangan}
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                                <div>
                                  <div className="text-xs text-orange-600 mb-1 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                    </svg>
                                    Dana Syahriah
                                  </div>
                                  <div className="text-sm font-medium text-orange-700">
                                    {formatCurrency(item.nominal_syahriah)}
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="text-xs text-purple-600 mb-1 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    Dana Donasi
                                  </div>
                                  <div className="text-sm font-medium text-purple-700">
                                    {formatCurrency(item.nominal_donasi)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                                Diajukan oleh: {item.pengaju?.nama_lengkap || 'Admin'}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-green-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Donatur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">No. Telp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Jumlah</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Dicatat Oleh</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-green-100">
                    {filteredDonasi.map((item, index) => (
                      <tr key={index} className="hover:bg-green-50 transition-colors">
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
              </div>

              {/* Mobile View */}
              <div className="md:hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead>
                    <tr className="bg-green-600">
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Donasi</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDonasi.map((item, index) => (
                      <>
                        <tr key={`${index}-main`} className="border-b border-gray-100">
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">{item.nama_donatur}</div>
                              <div className="text-xs text-gray-500">
                                {formatDateTime(item.waktu_catat)}
                              </div>
                              {item.no_telp && (
                                <div className="text-xs text-gray-500">
                                  Telp: {item.no_telp}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-left">
                            <span className="text-lg font-bold text-green-700">
                              {formatCurrency(item.nominal)}
                            </span>
                          </td>
                        </tr>
                        <tr key={`${index}-detail`} className="bg-gray-50">
                          <td colSpan="2" className="px-4 py-3 text-xs text-gray-500">
                            Dicatat oleh: {item.admin?.nama_lengkap || 'Admin'}
                          </td>
                        </tr>
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-green-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Santri</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Wali</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Bulan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Jumlah</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Tanggal Bayar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Dicatat Oleh</th>
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
              </div>

              {/* Mobile View */}
              <div className="md:hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead>
                    <tr className="bg-green-600">
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Syahriah</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSyahriah.map((item, index) => (
                      <>
                        <tr key={`${index}-main`} className="border-b border-gray-100">
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">{item.santri?.nama_lengkap || 'N/A'}</div>
                              <div className="text-xs text-gray-500">
                                {formatPeriod(item.bulan)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.santri?.wali?.nama_lengkap || 'Wali tidak terdaftar'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                item.status === 'lunas' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.status === 'lunas' ? 'Lunas' : 'Belum Bayar'}
                              </span>
                              <span className="text-lg font-bold text-green-700">
                                {formatCurrency(item.nominal)}
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr key={`${index}-detail`} className="bg-gray-50">
                          <td colSpan="2" className="px-4 py-3">
                            <div className="space-y-1 text-xs text-gray-500">
                              {item.status === 'lunas' && (
                                <div>
                                  Tanggal Bayar: {formatDateTime(item.waktu_catat)}
                                </div>
                              )}
                              <div>
                                Dicatat oleh: {item.admin?.nama_lengkap || 'Admin'}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      );   
    
    default:
      return null;
  }
};

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="h-8 bg-green-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-green-200 rounded w-96 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-200 rounded-xl"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-green-200 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-green-200 rounded w-32"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-6 bg-green-200 rounded w-48"></div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-green-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
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
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {/* Pemasukan Syahriah */}
        <div className="bg-white border border-orange-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="text-orange-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Pemasukan Syahriah</p>
              <p className="text-xl font-bold text-orange-900">
                {formatCurrencyShort(summaryData?.totalSyahriah || 0)}
              </p>
              <p className="text-xs text-orange-500 mt-1">{getCurrentPeriodText()}</p>
              {/* Informasi tambahan untuk syahriah wali sendiri */}
              <p className="text-xs text-orange-400 mt-1">
                Kontribusi Anda: {formatCurrencyShort(summaryData?.totalSyahriahOwn || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Pemasukan Donasi */}
        <div className="bg-white border border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="text-purple-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Pemasukan Donasi</p>
              <p className="text-xl font-bold text-purple-900">
                {formatCurrencyShort(summaryData?.totalDonasi || 0)}
              </p>
              <p className="text-xs text-purple-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>

        {/* Total Pemasukan */}
        <div className="bg-white border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="text-green-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Pemasukan</p>
              <p className="text-xl font-bold text-green-900">
                {formatCurrencyShort(summaryData?.totalPemasukan || 0)}
              </p>
              <p className="text-xs text-green-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>
        
        {/* Total Pengeluaran */}
        <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="text-red-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Total Pengeluaran</p>
              <p className="text-xl font-bold text-red-900">
                {formatCurrencyShort(summaryData?.totalPengeluaran || 0)}
              </p>
              <p className="text-xs text-red-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>
        
        {/* Saldo Akhir */}
        <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="text-blue-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Saldo TPQ saat ini</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrencyShort(summaryData?.saldoAkhir || 0)}
              </p>
              <p className="text-xs text-blue-500 mt-1">{getCurrentPeriodText()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Laporan Keuangan - TABEL LENGKAP DENGAN TABS */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200">
        <div className="px-6 py-4 border-b border-green-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-semibold text-green-900">
              Laporan Keuangan {getCurrentPeriodText() !== 'Semua Periode' ? `- ${getCurrentPeriodText()}` : ''}
            </h2>
            <div className="flex items-center space-x-4 mt-2 lg:mt-0">
              {/* Filter Tahun */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-green-700">Tahun:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="semua">Semua Tahun</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Bulan */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-green-700">Bulan:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="semua">Semua Bulan</option>
                  {availableMonths.map(month => {
                    const monthObj = months.find(m => m.value === month);
                    return (
                      <option key={month} value={month}>
                        {monthObj ? monthObj.label : month}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-green-200">
          <nav className="flex -mb-px overflow-x-auto">
            {['rekap', 'pengeluaran', 'pemasukan', 'syahriah'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-4 lg:px-6 text-sm font-medium border-b-2 whitespace-nowrap ${
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
        
        <div className="p-4 lg:p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default KeuanganTPQ;