// pages/wali/Keluarga.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Keluarga = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [santriLoading, setSantriLoading] = useState(false);
  const [error, setError] = useState('');
  const [santriError, setSantriError] = useState('');
  const [keluargaData, setKeluargaData] = useState(null);
  const [santriData, setSantriData] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  
  // State untuk modal notifikasi
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({
    type: 'success', // 'success' | 'error'
    title: '',
    message: '',
    onConfirm: null
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fungsi untuk menampilkan modal notifikasi
  const showNotification = (type, title, message, onConfirm = null) => {
    setNotificationData({
      type,
      title,
      message,
      onConfirm
    });
    setShowNotificationModal(true);
  };

  // Fungsi untuk menutup modal notifikasi
  const closeNotification = () => {
    setShowNotificationModal(false);
    if (notificationData.onConfirm) {
      notificationData.onConfirm();
    }
  };

  // Fetch data keluarga
  const fetchKeluargaData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/api/keluarga/my`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setKeluargaData(null);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      setKeluargaData(data.data);

    } catch (err) {
      console.error('Error fetching keluarga data:', err);
      setError(err.message);
      setKeluargaData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data santri
  const fetchSantriData = async () => {
    try {
      setSantriLoading(true);
      setSantriError('');

      const response = await fetch(`${API_URL}/api/santri/my`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setSantriData([]);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      setSantriData(data.data || []);

    } catch (err) {
      console.error('Error fetching santri data:', err);
      setSantriError(err.message);
      setSantriData([]);
    } finally {
      setSantriLoading(false);
    }
  };

  useEffect(() => {
    fetchKeluargaData();
    fetchSantriData();
  }, [API_URL]);

  // Handle Tambah Keluarga
  const handleTambahKeluarga = () => {
    setFormData({
      alamat: '',
      rt_rw: '',
      kelurahan: '',
      kecamatan: '',
      kota: '',
      provinsi: '',
      kode_pos: ''
    });
    setShowAddModal(true);
  };

  const handleAddKeluarga = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);

      const response = await fetch(`${API_URL}/api/keluarga`, {
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

      const data = await response.json();
      setKeluargaData(data.data);
      setShowAddModal(false);
      showNotification('success', 'Berhasil!', 'Data keluarga berhasil ditambahkan!');

    } catch (err) {
      console.error('Error adding keluarga:', err);
      showNotification('error', 'Gagal!', `Gagal menambahkan data keluarga: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Keluarga
  const handleEditKeluarga = () => {
    setFormData({
      alamat: keluargaData?.alamat || '',
      rt_rw: keluargaData?.rt_rw || '',
      kelurahan: keluargaData?.kelurahan || '',
      kecamatan: keluargaData?.kecamatan || '',
      kota: keluargaData?.kota || '',
      provinsi: keluargaData?.provinsi || '',
      kode_pos: keluargaData?.kode_pos || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateKeluarga = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);

      const response = await fetch(`${API_URL}/api/keluarga/${keluargaData.id_keluarga}`, {
        method: 'PUT',
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

      const data = await response.json();
      setKeluargaData(data.data);
      setShowEditModal(false);
      showNotification('success', 'Berhasil!', 'Data keluarga berhasil diperbarui!');

    } catch (err) {
      console.error('Error updating keluarga:', err);
      showNotification('error', 'Gagal!', `Gagal memperbarui data keluarga: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format jenis kelamin
  const formatJenisKelamin = (jk) => {
    const jkMap = {
      'L': 'Laki-laki',
      'P': 'Perempuan'
    };
    return jkMap[jk] || jk;
  };

  // Format status santri
  const formatStatusSantri = (status) => {
    const statusMap = {
      'aktif': 'Aktif',
      'lulus': 'Lulus',
      'pindah': 'Pindah',
      'berhenti': 'Berhenti'
    };
    return statusMap[status] || status;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colorMap = {
      'aktif': 'bg-green-100 text-green-800',
      'lulus': 'bg-blue-100 text-blue-800',
      'pindah': 'bg-yellow-100 text-yellow-800',
      'berhenti': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-green-200 rounded w-64"></div>
        <div className="h-4 bg-green-200 rounded w-96"></div>
      </div>
      {/* Content Skeleton */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200">
        <div className="h-64 bg-green-200 rounded"></div>
      </div>
    </div>
  );

  // Skeleton Loader untuk Santri
  const SantriSkeletonLoader = () => (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="bg-white rounded-xl p-6 shadow-sm border border-green-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-green-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-green-200 rounded w-48"></div>
              <div className="h-3 bg-green-200 rounded w-32"></div>
              <div className="h-3 bg-green-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-900 mb-2">Data Keluarga</h1>
        <p className="text-green-600">Kelola informasi keluarga dan santri</p>
      </div>

      {/* Informasi Keluarga */}
      {keluargaData ? (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-900">Informasi Kartu Keluarga</h3>
                <button
                  onClick={handleEditKeluarga}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Data Keluarga</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="font-medium text-green-700">Alamat:</span>
                  <p className="text-green-900">{keluargaData.alamat}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-700">RT/RW:</span>
                  <p className="text-green-900">{keluargaData.rt_rw || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-700">Kelurahan:</span>
                  <p className="text-green-900">{keluargaData.kelurahan || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-700">Kecamatan:</span>
                  <p className="text-green-900">{keluargaData.kecamatan || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-700">Kota/Kabupaten:</span>
                  <p className="text-green-900">{keluargaData.kota || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-700">Provinsi:</span>
                  <p className="text-green-900">{keluargaData.provinsi || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-700">Kode Pos:</span>
                  <p className="text-green-900">{keluargaData.kode_pos || '-'}</p>
                </div>
              </div>
            </div>
            
            {/* Wali Information */}
            <div className="lg:ml-8 lg:border-l lg:border-green-200 lg:pl-8 mt-6 lg:mt-0">
              <div className="text-center lg:text-left">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl mx-auto lg:mx-0 mb-3">
                  {keluargaData.wali?.nama_lengkap?.charAt(0) || 'W'}
                </div>
                <p className="text-sm text-green-600 font-medium">Kepala Keluarga / Wali</p>
                <p className="font-semibold text-green-900 text-lg">{keluargaData.wali?.nama_lengkap}</p>
                <p className="text-sm text-green-600 mt-1">{keluargaData.wali?.no_telp}</p>
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Status Aktif
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Tampilan ketika tidak ada data keluarga
        <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200 mb-8">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">Data Keluarga Belum Tersedia</h3>
            <p className="text-green-600 mb-6 max-w-md mx-auto">
              {error || 'Silakan tambahkan data keluarga untuk mengakses fitur ini.'}
            </p>
            
            {/* Tabel Kosong */}
            <div className="bg-green-50 rounded-lg border border-green-200 mb-6 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-green-100 border-b border-green-200">
                    <th className="py-3 px-4 text-left text-green-700 font-semibold">Alamat</th>
                    <th className="py-3 px-4 text-left text-green-700 font-semibold">RT/RW</th>
                    <th className="py-3 px-4 text-left text-green-700 font-semibold">Kelurahan</th>
                    <th className="py-3 px-4 text-left text-green-700 font-semibold">Kecamatan</th>
                    <th className="py-3 px-4 text-left text-green-700 font-semibold">Kota</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-green-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
                        </svg>
                        <span>Belum ada data keluarga</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 justify-center">
              <button 
                onClick={handleTambahKeluarga}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 font-medium shadow-sm flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Tambah Data Keluarga</span>
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="bg-green-100 text-green-700 px-6 py-3 rounded-lg hover:bg-green-200 transition-all duration-300 font-medium border border-green-200"
              >
                Refresh Halaman
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Santri */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-green-900">Data Santri</h3>
            <p className="text-green-600 text-sm">Daftar santri dalam keluarga</p>
          </div>
          <div className="text-sm text-green-700">
            Total: {santriData.length} santri
          </div>
        </div>

        {santriLoading ? (
          <SantriSkeletonLoader />
        ) : santriError ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{santriError}</p>
            <button 
              onClick={fetchSantriData}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              Coba Lagi
            </button>
          </div>
        ) : santriData.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-green-800 mb-2">Belum Ada Data Santri</h4>
            <p className="text-green-600 mb-4">
              {keluargaData 
                ? "Data santri akan ditampilkan di sini setelah didaftarkan oleh admin."
                : "Silakan tambahkan data keluarga terlebih dahulu untuk melihat data santri."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {santriData.map((santri) => (
              <div key={santri.id_santri} className="bg-green-50 rounded-lg p-4 border border-green-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {santri.nama_lengkap?.charAt(0) || 'S'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-green-900 truncate">{santri.nama_lengkap}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(santri.status)}`}>
                        {formatStatusSantri(santri.status)}
                      </span>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                        {formatJenisKelamin(santri.jenis_kelamin)}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-green-700">
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Lahir: {formatDate(santri.tanggal_lahir)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Masuk: {formatDate(santri.tanggal_masuk)}</span>
                      </div>
                      {santri.tanggal_keluar && (
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Keluar: {formatDate(santri.tanggal_keluar)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tambah Keluarga */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Tambah Data Keluarga</h3>
              <form onSubmit={handleAddKeluarga} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Alamat *</label>
                  <textarea
                    value={formData.alamat}
                    onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    required
                    placeholder="Masukkan alamat lengkap"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">RT/RW</label>
                    <input
                      type="text"
                      value={formData.rt_rw}
                      onChange={(e) => setFormData({...formData, rt_rw: e.target.value})}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="001/002"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Kode Pos</label>
                    <input
                      type="text"
                      value={formData.kode_pos}
                      onChange={(e) => setFormData({...formData, kode_pos: e.target.value})}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="12345"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Kelurahan</label>
                  <input
                    type="text"
                    value={formData.kelurahan}
                    onChange={(e) => setFormData({...formData, kelurahan: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nama kelurahan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    value={formData.kecamatan}
                    onChange={(e) => setFormData({...formData, kecamatan: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nama kecamatan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Kota/Kabupaten</label>
                  <input
                    type="text"
                    value={formData.kota}
                    onChange={(e) => setFormData({...formData, kota: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nama kota atau kabupaten"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formData.provinsi}
                    onChange={(e) => setFormData({...formData, provinsi: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nama provinsi"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {actionLoading ? 'Menambahkan...' : 'Tambah Data'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Keluarga */}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Edit Data Keluarga</h3>
              <form onSubmit={handleUpdateKeluarga} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Alamat *</label>
                  <textarea
                    value={formData.alamat}
                    onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">RT/RW</label>
                    <input
                      type="text"
                      value={formData.rt_rw}
                      onChange={(e) => setFormData({...formData, rt_rw: e.target.value})}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Kode Pos</label>
                    <input
                      type="text"
                      value={formData.kode_pos}
                      onChange={(e) => setFormData({...formData, kode_pos: e.target.value})}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Kelurahan</label>
                  <input
                    type="text"
                    value={formData.kelurahan}
                    onChange={(e) => setFormData({...formData, kelurahan: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    value={formData.kecamatan}
                    onChange={(e) => setFormData({...formData, kecamatan: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Kota</label>
                  <input
                    type="text"
                    value={formData.kota}
                    onChange={(e) => setFormData({...formData, kota: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formData.provinsi}
                    onChange={(e) => setFormData({...formData, provinsi: e.target.value})}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Notifikasi */}
      {showNotificationModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                notificationData.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {notificationData.type === 'success' ? (
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${
                notificationData.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {notificationData.title}
              </h3>
              <p className="text-gray-600 mb-4">{notificationData.message}</p>
              <button
                onClick={closeNotification}
                className={`w-full py-2 rounded-lg font-medium ${
                  notificationData.type === 'success' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                } transition-colors duration-200`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Keluarga;