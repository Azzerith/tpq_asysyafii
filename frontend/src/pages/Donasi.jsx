import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const DonasiPage = () => {
  const [donasi, setDonasi] = useState([])
  const [pengeluaran, setPengeluaran] = useState([])
  const [rekapData, setRekapData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalDonasi, setTotalDonasi] = useState(0)
  const [totalPengeluaran, setTotalPengeluaran] = useState(0)
  const [saldoAkhir, setSaldoAkhir] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeTab, setActiveTab] = useState('donasi')

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  // Fungsi untuk mendapatkan tanggal awal dan akhir bulan ini
  const getCurrentMonthDates = () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    // Format ke YYYY-MM-DD untuk input date
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    return {
      start: formatDate(startOfMonth),
      end: formatDate(endOfMonth)
    }
  }

  // Set default filter ke bulan ini saat pertama kali load
  useEffect(() => {
    const currentMonth = getCurrentMonthDates()
    setStartDate(currentMonth.start)
    setEndDate(currentMonth.end)
  }, [])

  // PERBAIKAN: Ambil data rekap saldo untuk mendapatkan saldo donasi terbaru
  const fetchRekapData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rekap-public?limit=1&sort_by=periode&sort_order=desc`)
      if (!response.ok) throw new Error('Gagal memuat data rekap')
      
      const result = await response.json()
      setRekapData(result.data || [])
      
      // Ambil saldo donasi terbaru dari rekap
      if (result.data && result.data.length > 0) {
        const latestRekap = result.data[0]
        setSaldoAkhir(latestRekap.saldo_akhir_donasi || 0)
      }
    } catch (err) {
      console.error('Error fetching rekap data:', err)
      // Fallback: tetap gunakan perhitungan manual jika gagal
    }
  }

  // Fetch data donasi dan pengeluaran dari API public
  useEffect(() => {
    const fetchData = async () => {
      if (!startDate || !endDate) {
        return
      }

      try {
        setLoading(true)
        setError('')
        
        // Build URL dengan filter
        let donasiUrl = `${API_URL}/api/donasi-public?page=${currentPage}&limit=10`
        let pengeluaranUrl = `${API_URL}/api/pengeluaran-public?page=${currentPage}&limit=10`
        let donasiSummaryUrl = `${API_URL}/api/donasi-public/summary`
        let pengeluaranSummaryUrl = `${API_URL}/api/pengeluaran-public/summary`
        
        if (startDate) {
          donasiUrl += `&start_date=${startDate}`
          pengeluaranUrl += `&start_date=${startDate}`
          donasiSummaryUrl += `?start_date=${startDate}`
          pengeluaranSummaryUrl += `?start_date=${startDate}`
        }
        if (endDate) {
          donasiUrl += `&end_date=${endDate}`
          pengeluaranUrl += `&end_date=${endDate}`
          donasiSummaryUrl += startDate ? `&end_date=${endDate}` : `?end_date=${endDate}`
          pengeluaranSummaryUrl += startDate ? `&end_date=${endDate}` : `?end_date=${endDate}`
        }
        
        // Fetch data secara parallel
        const [donasiResponse, pengeluaranResponse, donasiSummaryResponse, pengeluaranSummaryResponse] = await Promise.all([
          fetch(donasiUrl),
          fetch(pengeluaranUrl),
          fetch(donasiSummaryUrl),
          fetch(pengeluaranSummaryUrl)
        ])
        
        // Handle responses
        if (!donasiResponse.ok) throw new Error(`HTTP error! status: ${donasiResponse.status}`)
        if (!pengeluaranResponse.ok) throw new Error(`HTTP error! status: ${pengeluaranResponse.status}`)
        if (!donasiSummaryResponse.ok) throw new Error(`HTTP error! status: ${donasiSummaryResponse.status}`)
        if (!pengeluaranSummaryResponse.ok) throw new Error(`HTTP error! status: ${pengeluaranSummaryResponse.status}`)

        const donasiData = await donasiResponse.json()
        const pengeluaranData = await pengeluaranResponse.json()
        const donasiSummaryData = await donasiSummaryResponse.json()
        const pengeluaranSummaryData = await pengeluaranSummaryResponse.json()

        // Set data dari response
        setDonasi(donasiData.data || [])
        
        // Filter pengeluaran - hanya tampilkan yang ada nominal_donasi > 0
        const filteredPengeluaran = (pengeluaranData.data || []).filter(item => 
          item.nominal_donasi > 0
        )
        setPengeluaran(filteredPengeluaran)
        
        setTotalPages(donasiData.meta?.total_page || 1)
        
        // Hitung total donasi dan pengeluaran untuk periode yang dipilih
        const totalDonasi = donasiSummaryData.data?.total_nominal || donasiSummaryData.total_nominal || 0
        
        // Untuk pengeluaran, gunakan total_donasi dari summary jika ada, jika tidak hitung manual
        let totalPengeluaranDonasi = 0;
        if (pengeluaranSummaryData.data?.total_donasi !== undefined) {
          totalPengeluaranDonasi = pengeluaranSummaryData.data.total_donasi
        } else {
          // Hitung manual dari data yang sudah difilter
          totalPengeluaranDonasi = filteredPengeluaran.reduce((sum, item) => sum + (item.nominal_donasi || 0), 0)
        }

        setTotalDonasi(totalDonasi)
        setTotalPengeluaran(totalPengeluaranDonasi)

        // PERBAIKAN: Ambil data rekap untuk saldo donasi terbaru
        await fetchRekapData()

      } catch (err) {
        setError(`Gagal memuat data: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentPage, startDate, endDate, API_URL])

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

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

  // Format date untuk tabel
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (e) {
      return 'Invalid Date'
    }
  }

  // Format waktu untuk tabel
  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch (e) {
      return 'Invalid Time'
    }
  }

  // Format datetime lengkap
  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return dateString
    }
  }

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Set filter ke bulan ini
  const handleSetCurrentMonth = () => {
    const currentMonth = getCurrentMonthDates()
    setStartDate(currentMonth.start)
    setEndDate(currentMonth.end)
    setCurrentPage(1)
  }

  // Set filter ke semua periode (kosongkan filter tanggal)
  const handleShowAllPeriod = () => {
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  // Render content berdasarkan active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'donasi':
        return (
          <>
            {donasi.length === 0 ? (
              <div className="text-center py-8 sm:py-16">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Tidak Ada Data Donasi Bulan ini</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto text-xs sm:text-sm">
                  {startDate || endDate 
                    ? 'Tidak ada data donasi dalam periode yang dipilih. Coba ubah filter tanggal atau reset filter untuk melihat semua data.'
                    : 'Belum ada data donasi yang tercatat. Donasi pertama akan muncul di sini.'
                  }
                </p>

              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block sm:hidden">
                  <div className="p-4 space-y-4">
                    {donasi.map((item, index) => (
                      <div 
                        key={item.id_donasi || index}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {item.nama_donatur ? item.nama_donatur.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {item.nama_donatur || 'Anonim'}
                              </div>
                              {(!item.nama_donatur || item.nama_donatur === 'Hamba Allah') && (
                                <span className="inline-block bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium mt-1">
                                  Anonim
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">
                              {formatCurrency(item.nominal)}
                            </div>
                            {item.nominal >= 1000000 && (
                              <div className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full inline-block mt-1">
                                💫 Donasi Besar
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(item.waktu_catat)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatTime(item.waktu_catat)} WIB</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Donatur</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Nominal</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal & Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {donasi.map((item, index) => (
                        <tr 
                          key={item.id_donasi || index}
                          className="hover:bg-gray-50 transition-all duration-200 group"
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                              {(currentPage - 1) * 10 + index + 1}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {item.nama_donatur ? item.nama_donatur.charAt(0).toUpperCase() : 'A'}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {item.nama_donatur || 'Anonim'}
                                </div>
                                {(!item.nama_donatur || item.nama_donatur === 'Hamba Allah') && (
                                  <span className="inline-block bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                                    Anonim
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="text-right">
                              <div className="text-base sm:text-lg font-bold text-gray-900">
                                {formatCurrency(item.nominal)}
                              </div>
                              {item.nominal >= 1000000 && (
                                <div className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full inline-block mt-1">
                                  💫 Donasi Besar
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{formatDate(item.waktu_catat)}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs">{formatTime(item.waktu_catat)} WIB</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )

      case 'pengeluaran':
        return (
          <>
            {pengeluaran.length === 0 ? (
              <div className="text-center py-8 sm:py-16">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Tidak Ada Data Pengeluaran Bulan ini</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto text-xs sm:text-sm">
                  {startDate || endDate 
                    ? 'Tidak ada data pengeluaran dari dana donasi dalam periode yang dipilih. Coba ubah filter tanggal atau reset filter untuk melihat semua data.'
                    : 'Belum ada data pengeluaran dari dana donasi yang tercatat.'
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View untuk Pengeluaran */}
                <div className="block sm:hidden">
                  <div className="p-4 space-y-4">
                    {pengeluaran.map((item, index) => (
                      <div 
                        key={item.id_pemakaian || index}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 mb-1">
                              {item.judul_pemakaian}
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              {item.deskripsi}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                                item.tipe_pemakaian === 'operasional' ? 'bg-blue-100 text-blue-800' :
                                item.tipe_pemakaian === 'investasi' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.tipe_pemakaian}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-bold text-red-600">
                            {formatCurrency(item.nominal_donasi)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Total: {formatCurrency(item.nominal_total)}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3 mt-3">
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(item.tanggal_pemakaian || item.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Table View untuk Pengeluaran */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Keterangan</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipe</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Nominal (Dari Dana Donasi)</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pengeluaran.map((item, index) => (
                        <tr 
                          key={item.id_pemakaian || index}
                          className="hover:bg-gray-50 transition-all duration-200 group"
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
                              {(currentPage - 1) * 10 + index + 1}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {item.judul_pemakaian}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {item.deskripsi}
                              </div>
                              {item.keterangan && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Catatan: {item.keterangan}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                              item.tipe_pemakaian === 'operasional' ? 'bg-blue-100 text-blue-800' :
                              item.tipe_pemakaian === 'investasi' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.tipe_pemakaian}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="text-right">
                              <div className="text-base sm:text-lg font-bold text-red-600">
                                {formatCurrency(item.nominal_donasi)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Total Pengeluaran: {formatCurrency(item.nominal_total)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{formatDate(item.tanggal_pemakaian || item.created_at)}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )

      default:
        return null
    }
  }

  // Skeleton loader
  const SkeletonLoader = () => (
    <div>{/* Header*/}
    <div className="bg-gradient-to-r from-emerald-700 to-green-600 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link 
              to="/"
              className="inline-flex items-center space-x-2 text-white hover:text-green-100 transition-all duration-300  px-3 py-2 rounded-lg font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden xs:inline">Kembali</span>
            </Link>
            <div className="hidden lg:block w-px h-6 bg-green-500"></div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Laporan Keuangan</h1>
              <p className="text-green-100 text-sm">Transparansi penuh setiap kebaikan yang diberikan dan digunakan</p>
            </div>
          </div>
          
          {/* Total Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto mt-4 lg:mt-0">
            {/* Total Donasi Card */}
            <div className="bg-gradient-to-r from-green-700 to-green-700 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-medium mb-1">Total Donasi Masuk</p>
                  <p className="text-lg font-bold text-white">{formatCurrencyShort(totalDonasi)}</p>
                  <p className="text-emerald-200 text-xs mt-1">Periode Terfilter</p>
                </div>
                <div className="text-emerald-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Pengeluaran Card */}
            <div className="bg-gradient-to-r from-red-700 to-red-700 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-medium mb-1">Total Pengeluaran</p>
                  <p className="text-lg font-bold text-white">{formatCurrencyShort(totalPengeluaran)}</p>
                  <p className="text-white text-xs mt-1">Dari Dana Donasi</p>
                </div>
                <div className="text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* PERBAIKAN: Saldo Akhir Card - Mengambil dari saldo donasi terbaru */}
            <div className="bg-gradient-to-r from-green-700 to-green-700 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-medium mb-1">Saldo Akhir</p>
                  <p className="text-lg font-bold text-white">{formatCurrencyShort(saldoAkhir)}</p>
                  <p className="text-cyan-200 text-xs mt-1">Saldo Donasi Saat Ini</p>
                </div>
                <div className="text-cyan-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="min-h-screen bg-white pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-32 sm:w-48"></div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-28"></div>
              </div>
            </div>
          </div>

          {/* Filter Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )

  if (loading) {
    return <SkeletonLoader />
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header*/}
      <div className="bg-gradient-to-r from-emerald-700 to-green-600 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Link 
                to="/"
                className="inline-flex items-center space-x-2 text-white hover:text-green-100 transition-all duration-300  px-3 py-2 rounded-lg font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden xs:inline">Kembali</span>
              </Link>
              <div className="hidden lg:block w-px h-6 bg-green-500"></div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Laporan Keuangan</h1>
                <p className="text-green-100 text-sm">Transparansi penuh setiap kebaikan yang diberikan dan digunakan</p>
              </div>
            </div>
            
            {/* Total Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto mt-4 lg:mt-0">
              {/* Total Donasi Card */}
              <div className="bg-gradient-to-r from-green-700 to-green-700 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs font-medium mb-1">Total Donasi Masuk</p>
                    <p className="text-lg font-bold text-white">{formatCurrencyShort(totalDonasi)}</p>
                    <p className="text-emerald-200 text-xs mt-1">Periode Terfilter</p>
                  </div>
                  <div className="text-emerald-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Pengeluaran Card */}
              <div className="bg-gradient-to-r from-red-700 to-red-700 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs font-medium mb-1">Total Pengeluaran</p>
                    <p className="text-lg font-bold text-white">{formatCurrencyShort(totalPengeluaran)}</p>
                    <p className="text-white text-xs mt-1">Dari Dana Donasi</p>
                  </div>
                  <div className="text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Saldo Akhir Card - Mengambil dari saldo donasi terbaru */}
              <div className="bg-gradient-to-r from-green-700 to-green-700 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs font-medium mb-1">Saldo Akhir</p>
                    <p className="text-lg font-bold text-white">{formatCurrencyShort(saldoAkhir)}</p>
                    <p className="text-cyan-200 text-xs mt-1">Saldo Donasi Saat Ini</p>
                  </div>
                  <div className="text-cyan-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Background Putih */}
      <div className="container mx-auto px-3 sm:px-4 py-6">
        {error ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-red-100 p-6 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
              <p className="text-red-600 mb-6 text-sm sm:text-base">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-red-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-medium shadow-sm text-sm sm:text-base"
                >
                  Coba Lagi
                </button>
                <Link 
                  to="/"
                  className="bg-gray-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-gray-700 transition-all duration-300 font-medium shadow-sm text-sm sm:text-base"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Enhanced Filter Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mb-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Filter Data</h2>
                <div className="flex gap-2"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div className="sm:col-span-1 lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center space-x-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs sm:text-sm">Tanggal Mulai</span>
                    </span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                  />
                </div>
                
                <div className="sm:col-span-1 lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center space-x-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs sm:text-sm">Tanggal Selesai</span>
                    </span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                  />
                </div>
                
                <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
                  <button
                    onClick={handleSetCurrentMonth}
                    className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 font-medium shadow-sm flex items-center justify-center space-x-1 sm:space-x-2"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Bulan Ini</span>
                  </button>

                </div>
              </div>
              
              {(startDate || endDate) && (
                <div className="mt-3 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-blue-700">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Filter aktif: {startDate && `Dari ${formatDate(startDate)}`} {endDate && `Sampai ${formatDate(endDate)}`}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Data Table dengan Tabs */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      {activeTab === 'donasi' ? 'Daftar Donasi' : 'Daftar Pengeluaran (Dana Donasi)'}
                    </h2>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">
                      {activeTab === 'donasi' 
                        ? 'Riwayat lengkap semua donasi yang diterima' 
                        : 'Riwayat lengkap pengeluaran yang menggunakan dana donasi'
                      }
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <div className="bg-green-50 text-green-700 px-2 py-1 sm:px-3 sm:py-2 rounded text-xs sm:text-sm font-medium">
                      {activeTab === 'donasi' ? donasi.length : pengeluaran.length} Data {totalPages > 1 && `• Halaman ${currentPage}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="border-b border-gray-100">
                <nav className="flex -mb-px">
                  {['donasi', 'pengeluaran'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab)
                        setCurrentPage(1)
                      }}
                      className={`py-3 px-4 sm:px-6 text-sm font-medium border-b-2 transition-all duration-300 ${
                        activeTab === tab
                          ? 'border-green-500 text-green-600 font-semibold'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab === 'donasi' && (
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>Donasi Masuk</span>
                        </span>
                      )}
                      {tab === 'pengeluaran' && (
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Pengeluaran (Dana Donasi)</span>
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-4 sm:p-6">
                {renderContent()}
              </div>

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="px-4 sm:px-6 py-4 sm:py-6 border-t border-gray-100 bg-gray-50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs sm:text-sm text-gray-600">
                      Menampilkan halaman {currentPage} dari {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-sm flex items-center space-x-1 sm:space-x-2"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Sebelumnya</span>
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {[...Array(totalPages)].map((_, index) => {
                          const page = index + 1
                          // Show first page, last page, current page and pages around current page
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-2 text-xs sm:text-sm rounded-lg transition-all duration-300 font-medium ${
                                  currentPage === page
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <span key={page} className="px-1 sm:px-2 text-gray-400 text-xs">...</span>
                          }
                          return null
                        })}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-sm flex items-center space-x-1 sm:space-x-2"
                      >
                        <span>Selanjutnya</span>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DonasiPage