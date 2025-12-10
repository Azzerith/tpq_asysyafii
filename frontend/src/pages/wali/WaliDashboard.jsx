import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DashboardWali = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syahriahList, setSyahriahList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [selectedSantri, setSelectedSantri] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch data syahriah dan santri untuk wali
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch data santri milik wali
        const santriResponse = await fetch(`${API_URL}/api/wali/santri`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        let santriData = [];
        if (santriResponse.ok) {
          const result = await santriResponse.json();
          santriData = result.data || [];
        }
        setSantriList(santriData);

        // Set selected santri pertama kali jika ada data santri
        if (santriData.length > 0) {
          setSelectedSantri(santriData[0].id_santri);
        }

        // Fetch data syahriah untuk wali
        const syahriahResponse = await fetch(`${API_URL}/api/syahriah?limit=50`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!syahriahResponse.ok) {
          throw new Error('Tidak bisa mengakses data syahriah');
        }

        const syahriahResult = await syahriahResponse.json();
        const allSyahriah = syahriahResult.data || [];

        // Urutkan: belum lunas di atas, lalu lunas, dan urut berdasarkan bulan terbaru
        const sortedSyahriah = allSyahriah.sort((a, b) => {
          if (a.status === 'belum' && b.status === 'lunas') return -1;
          if (a.status === 'lunas' && b.status === 'belum') return 1;
          return new Date(b.bulan) - new Date(a.bulan);
        });

        setSyahriahList(sortedSyahriah);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Gagal memuat data: ${err.message}`);
        
        setSyahriahList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_URL]);

  const handleBayar = async (idSyahriah) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/syahriah/${idSyahriah}/bayar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'lunas' })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh data setelah pembayaran berhasil
      window.location.reload();
      
      alert('Pembayaran berhasil!');
    } catch (err) {
      console.error('Error melakukan pembayaran:', err);
      alert('Gagal melakukan pembayaran. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

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

  const getStatusBadge = (status) => {
    const statusConfig = {
      lunas: { color: 'bg-green-100 text-green-800 border border-green-200', text: 'Lunas' },
      belum: { color: 'bg-red-100 text-red-800 border border-red-200', text: 'Belum dibayar' }
    };
    
    const config = statusConfig[status] || statusConfig.belum;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Kelompokkan syahriah berdasarkan santri
  const syahriahBySantri = syahriahList.reduce((acc, item) => {
    const key = item.id_santri;
    if (!acc[key]) {
      acc[key] = {
        santri: santriList.find(s => s.id_santri === key) || { 
          nama_lengkap: item.santri?.nama_lengkap || 'Santri',
          id_santri: item.id_santri
        },
        syahriah: []
      };
    }
    acc[key].syahriah.push(item);
    return acc;
  }, {});

  // Dapatkan santri yang dipilih
  const selectedSantriData = selectedSantri ? syahriahBySantri[selectedSantri] : null;
  const syahriahToShow = selectedSantriData ? selectedSantriData.syahriah.slice(0, 2) : [];

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="animate-pulse">
      {/* Welcome Section Skeleton */}
      <div className="mb-8 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
          <div className="space-y-3">
            <div className="h-8 bg-green-400 rounded w-64"></div>
            <div className="h-4 bg-green-400 rounded w-96"></div>
          </div>
          <div className="flex space-x-2 mt-4 lg:mt-0">
            <div className="h-6 bg-green-400 rounded w-24"></div>
          </div>
        </div>
      </div>

      {/* Santri Selection Skeleton */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-green-200 p-4">
        <div className="h-6 bg-green-200 rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-green-200 rounded-lg"></div>
          ))}
        </div>
      </div>

      {/* Syahriah Section Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200">
        <div className="px-6 py-4 border-b border-green-200">
          <div className="h-6 bg-green-200 rounded w-48"></div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(2)].map((_, j) => (
            <div key={j} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-200 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-green-200 rounded w-32"></div>
                  <div className="h-3 bg-green-200 rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-6 bg-green-200 rounded w-24"></div>
                <div className="h-8 bg-green-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-medium shadow-sm"
            >
              Coba Lagi
            </button>
            <Link 
              to="/"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 font-medium shadow-sm"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Selamat datang, {user?.nama_lengkap}!
            </h1>
            <p className="text-green-100 text-lg">
              Portal informasi dan syahriah TPQ untuk santri Anda
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-2">
            <span className="bg-green-500 bg-opacity-20 px-3 py-1 rounded-full text-sm">
              👨‍👩‍👧‍👦 Wali Santri
            </span>
            <span className="bg-green-500 bg-opacity-20 px-3 py-1 rounded-full text-sm">
              {santriList.length} Santri
            </span>
          </div>
        </div>
      </div>

      {/* Santri Selection Section */}
      {santriList.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-green-900">
              Santri
            </h2>
            <span className="text-sm text-green-600">
              {santriList.length} santri terdaftar
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {santriList.map((santri) => {
              const santriSyahriah = syahriahBySantri[santri.id_santri]?.syahriah || [];
              const hasUnpaid = santriSyahriah.some(s => s.status === 'belum');
              
              return (
                <div
                  key={santri.id_santri}
                  onClick={() => setSelectedSantri(santri.id_santri)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    selectedSantri === santri.id_santri
                      ? 'bg-green-500 border-green-600 transform scale-105 shadow-lg'
                      : 'bg-green-100 border-green-200 hover:bg-green-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedSantri === santri.id_santri
                        ? 'bg-green-400 text-white'
                        : 'bg-green-200 text-green-600'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${
                        selectedSantri === santri.id_santri ? 'text-white' : 'text-green-900'
                      }`}>
                        {santri.nama_lengkap}
                      </h3>
                      <p className={`text-sm ${
                        selectedSantri === santri.id_santri ? 'text-green-100' : 'text-green-600'
                      }`}>
                        {santriSyahriah.length} bulan syahriah
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      hasUnpaid
                        ? selectedSantri === santri.id_santri
                          ? 'bg-red-400 text-white'
                          : 'bg-red-100 text-red-800'
                        : selectedSantri === santri.id_santri
                          ? 'bg-green-400 text-white'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {hasUnpaid ? 'Belum dibayar' : 'Semua lunas'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Syahriah Section */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200">
        <div className="px-6 py-4 border-b border-green-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-900">
              {selectedSantriData ? `${selectedSantriData.santri.nama_lengkap}` : 'Syahriah Santri'}
            </h2>
            
          </div>
        </div>
        
        <div className="p-6">
          {!selectedSantriData ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Santri
              </h3>
              <p className="text-green-600">
                Daftar syahriah santri
              </p>
            </div>
          ) : syahriahToShow.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Tidak Ada Syahriah
              </h3>
              <p className="text-green-600">
                Semua syahriah sudah lunas atau belum ada syahriah untuk santri ini
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {syahriahToShow.map((syahriah) => (
                <div 
                  key={syahriah.id_syahriah}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    syahriah.status === 'belum' 
                      ? 'bg-red-50 border-red-200 shadow-sm' 
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        syahriah.status === 'belum' ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        {syahriah.status === 'belum' ? (
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {formatBulan(syahriah.bulan)}
                        </div>
                        {syahriah.status === 'belum' && (
                          <div className="text-sm text-red-600 mt-1">
                            Jatuh tempo: {formatDate(syahriah.waktu_catat)}
                          </div>
                        )}
                        {syahriah.status === 'lunas' && (
                          <div className="text-sm text-green-600 mt-1">
                            Dibayar: {formatDate(syahriah.waktu_catat)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2">
                    <div className={`font-bold text-lg ${
                      syahriah.status === 'belum' ? 'text-red-800' : 'text-green-800'
                    }`}>
                      {formatCurrency(syahriah.nominal)}
                    </div>
                    <div>
                      {getStatusBadge(syahriah.status)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Info bahwa hanya menampilkan 2 item terbaru */}
              {selectedSantriData.syahriah.length > 2 && (
                <div className="text-center pt-4 border-t border-green-200">
                  <p className="text-sm text-green-600">
                    Menampilkan 2 dari {selectedSantriData.syahriah.length} syahriah. 
                    <Link to="/wali/detail" className="text-green-700 font-medium hover:text-green-800 ml-1">
                      Lihat semua →
                    </Link>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Link 
              to="/wali/detail"
              className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>Lihat detail semua Syahriah</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
    </div>
  );
};

export default DashboardWali;