// pages/wali/Profil.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Profil = () => {
  const { user, updateUser } = useAuth(); // Hapus setUser dari sini
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({
    type: 'success',
    title: '',
    message: '',
    onConfirm: null
  });
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    email: '',
    no_telp: '',
    password: '',
    confirm_password: ''
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

  // Load user data saat komponen dimount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id_user) return;
      
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`${API_URL}/api/users/${user.id_user}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Update form data dengan data user
        setFormData({
          nama_lengkap: data.nama_lengkap || '',
          email: data.email || '',
          no_telp: data.no_telp || '',
          password: '',
          confirm_password: ''
        });

      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Gagal memuat data profil');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id_user, API_URL]);

  // Handle buka modal edit
  const handleEditProfil = () => {
    setFormData({
      nama_lengkap: user?.nama_lengkap || '',
      email: user?.email || '',
      no_telp: user?.no_telp || '',
      password: '',
      confirm_password: ''
    });
    setShowEditModal(true);
    setError('');
  };

  // Handle update profil - PERBAIKAN DI SINI
  const handleUpdateProfil = async (e) => {
    e.preventDefault();
    
    // Validasi form
    if (!formData.nama_lengkap.trim()) {
      setError('Nama lengkap wajib diisi');
      return;
    }

    if (formData.password && formData.password !== formData.confirm_password) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      // Siapkan data untuk dikirim
      const updateData = {
        nama_lengkap: formData.nama_lengkap,
        email: formData.email || null,
        no_telp: formData.no_telp
      };

      // Tambahkan password hanya jika diisi
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`${API_URL}/api/users/${user.id_user}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update user di context menggunakan updateUser
      if (updateUser && typeof updateUser === 'function') {
        updateUser(data.user);
      } else {
        // Fallback: update localStorage dan refresh page
        const currentUser = localStorage.getItem('user');
        if (currentUser) {
          const userObj = JSON.parse(currentUser);
          const updatedUser = { ...userObj, ...data.user };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        // Refresh halaman untuk memastikan data ter-update
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
      
      // Tutup modal dan tampilkan notifikasi
      setShowEditModal(false);
      showNotification('success', 'Berhasil!', 'Profil berhasil diperbarui!');

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Gagal memperbarui profil');
    } finally {
      setActionLoading(false);
    }
  };

  // Format tanggal bergabung
  const formatJoinDate = () => {
    if (!user?.dibuat_pada) return 'Agustus 2023';
    
    try {
      const date = new Date(user.dibuat_pada);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long'
      });
    } catch (error) {
      return 'Agustus 2023';
    }
  };

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-96"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="h-12 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profil Saya</h1>
        <p className="text-gray-600">Kelola informasi profil dan akun Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informasi Pribadi */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Informasi Pribadi</h2>
            </div>
            <div className="p-6">
              {error && !showEditModal && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{user?.nama_lengkap || 'Wali Santri'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{user?.email || 'Belum diatur'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{user?.no_telp || 'Belum diatur'}</p>
                    </div>
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID User</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-mono">{user?.id_user || '-'}</p>
                    </div>
                  </div> */}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Peran</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900 capitalize">{user?.role?.replace('_', ' ') || 'Wali Santri'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <button 
                  onClick={handleEditProfil}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 font-medium shadow-sm flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Profil</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Foto Profil */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl mx-auto mb-4">
                {user?.nama_lengkap?.charAt(0) || 'W'}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{user?.nama_lengkap || 'Wali Santri'}</h3>
              <p className="text-gray-600 mb-4 capitalize">{user?.role?.replace('_', ' ') || 'Wali Santri'}</p>
            </div>
          </div>

          {/* Statistik */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Santri Terdaftar</span>
                <span className="font-semibold text-gray-900">2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bergabung Sejak</span>
                <span className="font-semibold text-gray-900">{formatJoinDate()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {user?.status_aktif ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Edit Profil */}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profil</h3>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleUpdateProfil} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Masukkan email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                  <input
                    type="tel"
                    value={formData.no_telp}
                    onChange={(e) => setFormData({...formData, no_telp: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Masukkan nomor telepon"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Ubah Password</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Masukkan password baru"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                      <input
                        type="password"
                        value={formData.confirm_password}
                        onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Konfirmasi password baru"
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Kosongkan password jika tidak ingin mengubahnya
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {actionLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Perubahan</span>
                    )}
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

export default Profil;