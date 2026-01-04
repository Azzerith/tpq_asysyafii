import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSantri: 0,
    santriAktif: 0,
    santriNonaktif: 0,
    totalDonasi: 0,
    totalSyahriah: 0,
    totalPemasukan: 0,
    totalPengeluaran: 0,
    saldoAkhir: 0,
    totalWali: 0,
    totalAdmins: 0
  });
  const [chartData, setChartData] = useState({
    santriByStatus: null,
    pemasukanByMonth: null,
    pengeluaranByMonth: null,
    keuanganComparison: null,
    revenueSources: null
  });

  // State untuk filter
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('semua');
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);

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

  // SVG Icons
  const Icons = {
    Money: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    Users: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    Chart: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    Santri: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    Donasi: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    Finance: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    Cash: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    Expense: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
  };

  // Fetch data dengan filter yang benar
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters untuk filter
      const params = new URLSearchParams();
      if (selectedYear !== 'semua') {
        params.append('tahun', selectedYear);
      }
      if (selectedMonth !== 'semua') {
        params.append('bulan', selectedMonth);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';

      // Fetch semua data secara parallel
      const [
        santriResponse,
        donasiResponse,
        syahriahResponse,
        rekapResponse,
        usersResponse,
        pemakaianResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/super-admin/santri`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/donasi?limit=100${queryString}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/syahriah?limit=100${queryString}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/rekap?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/super-admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/pemakaian?limit=100${queryString}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      const santriData = await santriResponse.json();
      const donasiData = await donasiResponse.json();
      const syahriahData = await syahriahResponse.json();
      const rekapData = await rekapResponse.json();
      const usersData = await usersResponse.json();
      const pemakaianData = await pemakaianResponse.json();

      // Proses data santri
      const santriList = Array.isArray(santriData) ? santriData : santriData.data || [];
      const santriAktif = santriList.filter(s => s.status === 'aktif').length;
      const santriNonaktif = santriList.filter(s => s.status === 'nonaktif').length;

      // Proses data users untuk wali dan admin
      const usersList = Array.isArray(usersData) ? usersData : usersData.data || [];
      const totalWali = usersList.filter(u => 
        u.role === 'wali' && u.status_aktif === true
      ).length;
      const totalAdmins = usersList.filter(u => 
        (u.role === 'admin' || u.role === 'super_admin') && u.status_aktif === true
      ).length;

      // Filter data berdasarkan periode yang dipilih
      const filteredDonasi = filterDataByPeriod(donasiData.data || [], 'waktu_catat');
      const filteredSyahriah = filterDataByPeriod(syahriahData.data || [], 'bulan');
      const filteredPemakaian = filterDataByPeriod(pemakaianData.data || [], 'tanggal_pemakaian');
      const filteredRekap = filterRekapData(rekapData.data || []);

      // Hitung total dari data yang sudah difilter
      const totalDonasi = filteredDonasi.reduce((sum, item) => sum + (item.nominal || 0), 0);
      const totalSyahriah = filteredSyahriah
        .filter(item => item.status === 'lunas')
        .reduce((sum, item) => sum + (item.nominal || 0), 0);
      const totalPengeluaran = filteredPemakaian.reduce((sum, item) => sum + (item.nominal_total || 0), 0);

      // Hitung total pemasukan dan saldo akhir berdasarkan data rekap
      let totalPemasukan = 0;
      let saldoAkhir = 0;

      if (filteredRekap.length > 0) {
        if (selectedMonth === 'semua' && selectedYear === 'semua') {
          // Untuk "semua periode", jumlahkan semua data
          totalPemasukan = filteredRekap.reduce((sum, item) => sum + (item.pemasukan_total || 0), 0);
          // Ambil saldo terakhir
          const latestRekap = rekapData.data?.[0] || filteredRekap[0];
          saldoAkhir = latestRekap?.saldo_akhir_total || 0;
        } else if (selectedMonth === 'semua' && selectedYear !== 'semua') {
          // Untuk tahun tertentu (semua bulan)
          totalPemasukan = filteredRekap.reduce((sum, item) => sum + (item.pemasukan_total || 0), 0);
          // Ambil saldo terakhir dari tahun tersebut
          const latestRekapForYear = filteredRekap[0];
          saldoAkhir = latestRekapForYear?.saldo_akhir_total || 0;
        } else if (selectedMonth !== 'semua') {
          // Untuk bulan tertentu
          totalPemasukan = filteredRekap.reduce((sum, item) => sum + (item.pemasukan_total || 0), 0);
          if (filteredRekap.length > 0) {
            saldoAkhir = filteredRekap[0]?.saldo_akhir_total || 0;
          }
        }
      } else {
        // Fallback jika tidak ada data rekap
        totalPemasukan = totalDonasi + totalSyahriah;
        saldoAkhir = totalPemasukan - totalPengeluaran;
      }

      const newStats = {
        totalSantri: santriList.length,
        santriAktif,
        santriNonaktif,
        totalDonasi,
        totalSyahriah,
        totalPemasukan,
        totalPengeluaran,
        saldoAkhir,
        totalWali,
        totalAdmins
      };

      setStats(newStats);

      // Generate chart data dengan filter
      generateChartData(
        santriList,
        newStats,
        filteredRekap,
        filteredDonasi,
        filteredSyahriah,
        filteredPemakaian
      );

      // Extract available years dan months dari data rekap
      if (rekapData.data && rekapData.data.length > 0) {
        const periods = rekapData.data.map(item => item.periode).filter(Boolean);
        const years = [...new Set(periods.map(p => p.split('-')[0]))].sort((a, b) => b - a);
        setAvailableYears(years);
        
        // Update available months berdasarkan tahun yang dipilih
        updateAvailableMonths(periods);
      } else {
        // Default years
        const currentYear = new Date().getFullYear();
        setAvailableYears([currentYear.toString()]);
        setAvailableMonths([]);
      }

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data berdasarkan periode yang dipilih
  const filterDataByPeriod = (data, dateField) => {
    if (selectedYear === 'semua' && selectedMonth === 'semua') {
      return data;
    }
    
    return data.filter(item => {
      let itemDate;
      
      if (dateField === 'bulan') {
        // Handle syahriah data yang memiliki field 'bulan'
        itemDate = item[dateField];
        const [itemYear, itemMonth] = itemDate ? itemDate.split('-') : ['', ''];
        
        if (selectedMonth === 'semua' && selectedYear !== 'semua') {
          return itemYear === selectedYear;
        }
        
        if (selectedYear === 'semua' && selectedMonth !== 'semua') {
          return itemMonth === selectedMonth;
        }
        
        return itemYear === selectedYear && itemMonth === selectedMonth;
      } else {
        // Handle other data with date fields
        itemDate = item[dateField] || item.created_at;
        const dateObj = new Date(itemDate);
        const itemYear = dateObj.getFullYear().toString();
        const itemMonth = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        
        if (selectedMonth === 'semua' && selectedYear !== 'semua') {
          return itemYear === selectedYear;
        }
        
        if (selectedYear === 'semua' && selectedMonth !== 'semua') {
          return itemMonth === selectedMonth;
        }
        
        return itemYear === selectedYear && itemMonth === selectedMonth;
      }
    });
  };

  // Filter data rekap berdasarkan periode
  const filterRekapData = (rekapData) => {
    if (selectedYear === 'semua' && selectedMonth === 'semua') {
      return rekapData;
    }
    
    if (selectedMonth === 'semua' && selectedYear !== 'semua') {
      // Filter hanya berdasarkan tahun
      return rekapData.filter(item => item.periode?.startsWith(selectedYear));
    }
    
    if (selectedYear === 'semua' && selectedMonth !== 'semua') {
      // Filter hanya berdasarkan bulan (semua tahun)
      return rekapData.filter(item => item.periode?.endsWith(`-${selectedMonth}`));
    }
    
    // Filter berdasarkan tahun dan bulan
    return rekapData.filter(item => item.periode === `${selectedYear}-${selectedMonth}`);
  };

  // Update available months ketika tahun berubah
  const updateAvailableMonths = (periods) => {
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
  };

  // Generate chart data dengan filter yang benar
  const generateChartData = (
    santriList,
    statsData,
    filteredRekap = [],
    filteredDonasi = [],
    filteredSyahriah = [],
    filteredPemakaian = []
  ) => {
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // PERBAIKAN: Santri by status chart
    const santriByStatus = {
      labels: ['Aktif', 'Nonaktif'],
      datasets: [
        {
          data: [
            statsData.santriAktif,
            statsData.santriNonaktif
          ],
          backgroundColor: ['#10B981', '#EF4444'],
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    };

    // Process monthly data dari filtered rekap
    const processMonthlyData = () => {
      const monthlyPemasukan = new Array(12).fill(0);
      const monthlyPengeluaran = new Array(12).fill(0);
      
      // Group data by month from filtered rekap
      filteredRekap.forEach(rekap => {
        if (rekap.periode) {
          const [year, month] = rekap.periode.split('-');
          const monthIndex = parseInt(month) - 1;
          if (monthIndex >= 0 && monthIndex < 12) {
            monthlyPemasukan[monthIndex] = rekap.pemasukan_total || 0;
            monthlyPengeluaran[monthIndex] = rekap.pengeluaran_total || 0;
          }
        }
      });
      
      return { monthlyPemasukan, monthlyPengeluaran };
    };

    const { monthlyPemasukan, monthlyPengeluaran } = processMonthlyData();

    // Tentukan bulan yang akan ditampilkan berdasarkan filter
    let displayedMonths = monthLabels;
    if (selectedYear !== 'semua' && selectedMonth === 'semua') {
      // Tampilkan semua bulan untuk tahun tertentu
      displayedMonths = monthLabels;
    } else if (selectedMonth !== 'semua') {
      // Tampilkan bulan tertentu saja
      const monthIndex = parseInt(selectedMonth) - 1;
      displayedMonths = [monthLabels[monthIndex]];
    }

    // Filter data untuk ditampilkan
    let displayedPemasukan = monthlyPemasukan;
    let displayedPengeluaran = monthlyPengeluaran;
    
    if (selectedMonth !== 'semua') {
      const monthIndex = parseInt(selectedMonth) - 1;
      displayedPemasukan = [monthlyPemasukan[monthIndex]];
      displayedPengeluaran = [monthlyPengeluaran[monthIndex]];
    }

    const pemasukanByMonth = {
      labels: displayedMonths,
      datasets: [
        {
          label: 'Pemasukan',
          data: displayedPemasukan,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    const pengeluaranByMonth = {
      labels: displayedMonths,
      datasets: [
        {
          label: 'Pengeluaran',
          data: displayedPengeluaran,
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    // Financial comparison chart
    const keuanganComparison = {
      labels: ['Pemasukan', 'Pengeluaran'],
      datasets: [
        {
          data: [statsData.totalPemasukan, statsData.totalPengeluaran],
          backgroundColor: ['#10B981', '#EF4444'],
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    };

    // Revenue sources chart
    const revenueSources = {
      labels: ['Donasi', 'Syahriah'],
      datasets: [
        {
          data: [
            statsData.totalDonasi || 0, 
            statsData.totalSyahriah || 0
          ],
          backgroundColor: ['#8B5CF6', '#3B82F6'],
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    };

    setChartData({
      santriByStatus,
      pemasukanByMonth,
      pengeluaranByMonth,
      keuanganComparison,
      revenueSources
    });
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (selectedYear !== 'semua') {
      // Update available months when year changes
      fetchAllData();
    }
  }, [selectedYear]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // Enhanced DonutChart dengan handling untuk data tidak seimbang
const DonutChart = ({ data, size = 200, centerText = null }) => {
  if (!data || !data.datasets || !data.datasets[0]) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-gray-400 text-sm mb-2">No data available</div>
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const dataset = data.datasets[0];
  const labels = data.labels || [];
  const total = dataset.data.reduce((sum, value) => sum + value, 0);
  
  // PERBAIKAN: Cek jika salah satu data adalah 0, bukan total 0
  const hasData = dataset.data.some(value => value > 0);
  
  if (!hasData) {
    // Jika semua data adalah 0
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="text-gray-500 text-sm">Belum ada data</div>
          </div>
        </div>
        
        {/* Legend placeholder */}
        <div className="mt-4 space-y-2 w-full">
          {labels.map((label, index) => (
            <div key={index} className="flex items-center justify-between text-sm opacity-50">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: dataset.backgroundColor[index] }}
                ></div>
                <span className="text-gray-400">{label}</span>
              </div>
              <span className="font-medium text-gray-400">
                {formatCurrency(0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const radius = size / 2 - 10;
  let currentAngle = 0;

  // Hitung center text
  let centerDisplayText = '';
  if (centerText !== null) {
    centerDisplayText = centerText;
  } else if (labels.length === 2 && 
             labels.includes('Pemasukan') && labels.includes('Pengeluaran')) {
    const pemasukan = dataset.data[0] || 0;
    const pengeluaran = dataset.data[1] || 0;
    const selisih = pemasukan - pengeluaran;
    centerDisplayText = formatCurrency(selisih);
  } else if (labels.length === 2 && 
             labels.includes('Aktif') && labels.includes('Nonaktif')) {
    // Untuk chart santri by status
    const aktif = dataset.data[0] || 0;
    const nonaktif = dataset.data[1] || 0;
    const totalSantri = aktif + nonaktif;
    centerDisplayText = `${totalSantri}`;
  } else {
    centerDisplayText = total > 1000000 ? `${(total / 1000000).toFixed(1)}Juta` : 
                       total > 1000 ? `${(total / 1000).toFixed(0)}K` : 
                       formatNumber(total);
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="mx-auto">
        {/* PERBAIKAN: Handle kasus di mana salah satu data adalah 0 */}
        {dataset.data.map((value, index) => {
          // Jika value 0, kita tetap render tapi dengan logika khusus
          if (value === 0 && total === 0) {
            // Jika total 0, tidak render apapun
            return null;
          }
          
          const percentage = value / Math.max(total, 1); // Pastikan tidak dibagi 0
          const angle = percentage * 360;
          
          // Jika angle 0 (data 0), skip rendering
          if (angle === 0) return null;
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const x1 = radius + radius * Math.cos(startAngle * Math.PI / 180);
          const y1 = radius + radius * Math.sin(startAngle * Math.PI / 180);
          
          const x2 = radius + radius * Math.cos(endAngle * Math.PI / 180);
          const y2 = radius + radius * Math.sin(endAngle * Math.PI / 180);

          currentAngle = endAngle;

          return (
            <path
              key={index}
              d={`M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
              fill={dataset.backgroundColor[index]}
              stroke={dataset.borderColor}
              strokeWidth={dataset.borderWidth}
            />
          );
        })}
        
        {/* PERBAIKAN: Jika hanya ada satu data non-zero, render lingkaran penuh */}
        {dataset.data.filter(value => value > 0).length === 1 && 
         dataset.data.findIndex(value => value > 0) >= 0 && (
          <circle
            cx={radius}
            cy={radius}
            r={radius}
            fill={dataset.backgroundColor[dataset.data.findIndex(value => value > 0)]}
            stroke={dataset.borderColor}
            strokeWidth={dataset.borderWidth}
          />
        )}
        
        <circle cx={radius} cy={radius} r={radius * 0.6} fill="white" />
        <text
          x={radius}
          y={radius}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-lg font-bold fill-gray-700"
        >
          {centerDisplayText}
        </text>
      </svg>
      
      {/* Legend */}
      <div className="mt-4 space-y-2 w-full">
        {labels.map((label, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: dataset.backgroundColor[index] }}
              ></div>
              <span className="text-gray-600">{label}</span>
            </div>
            <span className="font-medium text-gray-800">
              {formatCurrency(dataset.data[index])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

  // Enhanced LineChart
  const LineChart = ({ data, size = 300, title = '' }) => {
    if (!data || !data.datasets || !data.datasets[0]) {
      return (
        <div className="flex flex-col items-center justify-center" style={{ width: '100%', height: size }}>
          <div className="text-gray-400 text-sm mb-4">No data available</div>
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      );
    }

    const dataset = data.datasets[0];
    const maxValue = Math.max(...dataset.data, 1);
    const padding = 40;

    const allZero = dataset.data.every(value => value === 0);
    
    if (allZero) {
      return (
        <div className="w-full">
          <div className="relative" style={{ height: size }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
              <line
                key={index}
                x1={padding}
                y1={padding + ratio * (size - 2 * padding)}
                x2={`calc(100% - ${padding}px)`}
                y2={padding + ratio * (size - 2 * padding)}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            ))}
            
            {/* Placeholder text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-gray-500 text-sm">Belum ada data</div>
              </div>
            </div>

            {/* X-axis labels */}
            {data.labels && data.labels.map((label, index) => {
              const x = padding + (index / (data.labels.length - 1 || 1)) * (100 - 2 * padding) + '%';
              return (
                <text
                  key={index}
                  x={x}
                  y={size - padding / 2}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {label}
                </text>
              );
            })}
          </div>
          
          <div className="mt-2 text-center">
            <div className="text-sm text-gray-600">
              {title && <div className="font-medium mb-1">{title}</div>}
              Total: {formatCurrency(0)}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <svg width="100%" height={size} className="mx-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1={padding}
              y1={padding + ratio * (size - 2 * padding)}
              x2={`calc(100% - ${padding}px)`}
              y2={padding + ratio * (size - 2 * padding)}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          ))}

          {/* Area */}
          <polygon
            points={`
              ${padding},${size - padding} 
              ${dataset.data.map((value, index) => {
                const x = padding + (index / (dataset.data.length - 1 || 1)) * (100 - 2 * padding) + '%';
                const y = padding + (1 - (value / maxValue)) * (size - 2 * padding);
                return `${x} ${y}`;
              }).join(' ')} 
              calc(100% - ${padding}px),${size - padding}
            `}
            fill={dataset.backgroundColor}
          />

          {/* Line */}
          <polyline
            points={dataset.data.map((value, index) => {
              const x = padding + (index / (dataset.data.length - 1 || 1)) * (100 - 2 * padding) + '%';
              const y = padding + (1 - (value / maxValue)) * (size - 2 * padding);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke={dataset.borderColor}
            strokeWidth="3"
          />

          {/* Data points */}
          {dataset.data.map((value, index) => {
            const x = padding + (index / (dataset.data.length - 1 || 1)) * (100 - 2 * padding) + '%';
            const y = padding + (1 - (value / maxValue)) * (size - 2 * padding);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={dataset.borderColor}
                stroke="#fff"
                strokeWidth="2"
              />
            );
          })}

          {/* X-axis labels */}
          {data.labels && data.labels.map((label, index) => {
            const x = padding + (index / (data.labels.length - 1 || 1)) * (100 - 2 * padding) + '%';
            return (
              <text
                key={index}
                x={x}
                y={size - padding / 2}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {label}
              </text>
            );
          })}
        </svg>
        
        {/* Chart title and summary */}
        <div className="mt-2 text-center">
          <div className="text-sm text-gray-600">
            {title && <div className="font-medium mb-1">{title}</div>}
            Total: {formatCurrency(dataset.data.reduce((sum, value) => sum + value, 0))}
          </div>
        </div>
      </div>
    );
  };

  // Get current period text untuk filter
  const getCurrentPeriodText = () => {
    if (selectedYear === 'semua' && selectedMonth === 'semua') return 'Semua Periode';
    if (selectedMonth === 'semua') return `Tahun ${selectedYear}`;
    if (selectedYear === 'semua') {
      const monthObj = months.find(m => m.value === selectedMonth);
      return `Bulan ${monthObj?.label || selectedMonth} (Semua Tahun)`;
    }
    const monthObj = months.find(m => m.value === selectedMonth);
    return `${monthObj?.label || selectedMonth} ${selectedYear}`;
  };

  if (loading) {
    return (
      <AuthDashboardLayout title="Dashboard Super Admin">
        <div className="animate-pulse space-y-6">
          {/* Filter Section Skeleton */}
          <div className="bg-gray-200 rounded-xl p-4 h-16"></div>
          
          {/* Welcome Section Skeleton */}
          <div className="bg-gray-200 rounded-xl p-6 h-32"></div>
          
          {/* Charts Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl p-6 h-96"></div>
            ))}
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl p-6 h-64"></div>
            ))}
          </div>
        </div>
      </AuthDashboardLayout>
    );
  }

  return (
    <AuthDashboardLayout title="Dashboard Super Admin">
{/* Filter Section */}
<div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Dashboard Super Admin</h2>
            <p className="text-sm text-gray-600">Monitor seluruh sistem TPQ</p>
            <div className="text-xs text-gray-500 mt-1">
              Periode: <span className="font-medium">{getCurrentPeriodText()}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {/* Filter Tahun */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Tahun:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="text-sm font-medium text-gray-700">Bulan:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={selectedYear === 'semua' && availableMonths.length === 0}
              >
                <option value="semua">Semua Bulan</option>
                {selectedYear !== 'semua' && availableMonths.map(month => {
                  const monthObj = months.find(m => m.value === month);
                  return (
                    <option key={month} value={month}>
                      {monthObj ? monthObj.label : month}
                    </option>
                  );
                })}
                {selectedYear === 'semua' && availableMonths.length > 0 && (
                  <>
                    {availableMonths.map(month => {
                      const monthObj = months.find(m => m.value === month);
                      return (
                        <option key={month} value={month}>
                          {monthObj ? monthObj.label : month}
                        </option>
                      );
                    })}
                  </>
                )}
                {selectedYear === 'semua' && availableMonths.length === 0 && (
                  <option value="">Pilih tahun terlebih dahulu</option>
                )}
              </select>
            </div>

            {/* Reset Filter */}
            <button
              onClick={() => {
                setSelectedYear(new Date().getFullYear().toString());
                setSelectedMonth('semua');
              }}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      {/* Financial Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Financial Comparison */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-800">Pemasukan vs Pengeluaran</h4>
            <Icons.Finance />
          </div>
          <DonutChart 
            data={chartData.keuanganComparison} 
            size={250}
            centerText={formatCurrency(stats.totalPemasukan - stats.totalPengeluaran)}
          />
        </div>

        {/* Revenue Sources */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-800">Sumber Pemasukan</h4>
            <Icons.Donasi />
          </div>
          <DonutChart data={chartData.revenueSources} size={250} />
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Sources Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-800">Detail Sumber Pemasukan</h4>
            <Icons.Cash />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <div className="text-green-600 mr-3">
                  <Icons.Donasi className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Donasi</div>
                  <div className="text-sm text-gray-600">Sumbangan dari donatur</div>
                </div>
              </div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(stats.totalDonasi)}
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="text-blue-600 mr-3">
                  <Icons.Money className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Syahriah</div>
                  <div className="text-sm text-gray-600">Pembayaran bulanan santri</div>
                </div>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(stats.totalSyahriah)}
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <div className="font-medium text-gray-900 text-lg">Total Pemasukan</div>
              <div className="text-xl font-bold text-purple-600">
                {formatCurrency(stats.totalPemasukan)}
              </div>
            </div>
          </div>
        </div>

        {/* System Summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-800">Ringkasan Sistem</h4>
            <Icons.Users />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Total Wali Aktif */}
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-gray-600 mx-auto mb-2">
                  <Icons.Users className="w-8 h-8 mx-auto" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{stats.totalWali}</div>
                <div className="text-sm text-gray-600">Wali Aktif</div>
              </div>
              {/* Total Santri Aktif */}
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-gray-600 mx-auto mb-2">
                  <Icons.Santri className="w-8 h-8 mx-auto" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{stats.santriAktif}</div>
                <div className="text-sm text-gray-600">Santri Aktif</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-orange-600 mx-auto mb-2">
                  <Icons.Santri className="w-8 h-8 mx-auto" />
                </div>
                <div className="text-2xl font-bold text-orange-800">{stats.totalAdmins}</div>
                <div className="text-sm text-gray-600">Admin TPQ</div>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Saldo Akhir</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats.saldoAkhir)}
                  </div>
                </div>
                <div className="opacity-80">
                  <Icons.Chart className="w-8 h-8" />
                </div>
              </div>
              <div className="text-xs opacity-80 mt-2">
                Rasio kesehatan: {stats.totalPemasukan > 0 ? Math.round((stats.saldoAkhir / stats.totalPemasukan) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthDashboardLayout>
  );
};

export default SuperAdminDashboard;