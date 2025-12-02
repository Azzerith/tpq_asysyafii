import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const BeritaPage = () => {
  const [berita, setBerita] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('all');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fungsi untuk optimasi URL Cloudinary
  const getOptimizedImageUrl = (url, width = 400, height = 200) => {
    if (!url) return null;
    
    // Jika URL sudah dari Cloudinary, optimalkan
    if (url.includes('cloudinary.com') && url.includes('upload')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/w_${width},h_${height},c_fill,g_auto,q_auto,f_auto/${parts[1]}`;
      }
    }
    
    // Jika URL dari local server (old format)
    if (url && !url.startsWith('http') && !url.includes('cloudinary.com')) {
      return `${API_URL}/image/berita/${url}`;
    }
    
    return url;
  };

  // Fetch semua berita tanpa limit
  const fetchBerita = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch dengan limit besar untuk mendapatkan semua data
      const response = await fetch(`${API_URL}/api/berita?limit=100`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('Semua data berita:', data); // Debug log
      
      setBerita(data.data || []);

    } catch (err) {
      console.error('Error fetching berita:', err);
      setError('Gagal memuat data berita. Silakan refresh halaman.');
      setBerita([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBerita();
  }, []);

  // Handle image error
  const handleImageError = (e) => {
    console.error('Gagal memuat gambar berita');
    e.target.src = 'https://via.placeholder.com/400x200?text=Gambar+Tidak+Tersedia';
  };

  // Filter berita berdasarkan search dan kategori
  const filteredBerita = berita.filter(item => {
    const matchesSearch = item.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.konten.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKategori = kategoriFilter === 'all' || item.kategori === kategoriFilter;
    
    return matchesSearch && matchesKategori;
  });

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format kategori
  const formatKategori = (kategori) => {
    const kategoriMap = {
      'umum': 'Umum',
      'pengumuman': 'Pengumuman',
      'acara': 'Acara'
    };
    return kategoriMap[kategori] || kategori;
  };

  // Get kategori badge color
  const getKategoriColor = (kategori) => {
    const colorMap = {
      'umum': 'bg-blue-100 text-blue-800 border border-blue-200',
      'pengumuman': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'acara': 'bg-green-100 text-green-800 border border-green-200'
    };
    return colorMap[kategori] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setKategoriFilter('all');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            <div className="animate-pulse space-y-8">
              {/* Hero Skeleton */}
              <div className="text-center space-y-4">
                <div className="h-8 bg-gray-200 rounded w-64 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
              </div>
              
              {/* Filter Skeleton */}
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="h-12 bg-gray-200 rounded col-span-2"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>

              {/* Cards Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        {/* Hero Section */}
      <section className="pt-8 pb-8 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Semua Berita & Informasi</h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto">
            Informasi lengkap seputar kegiatan, pengumuman, dan acara di TPQ Asy-Syafi'i Campakoah
          </p>
        </div>
      </section>
      {/* Filter Section */}
      <section className="pt-8 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Cari berita..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={kategoriFilter}
                onChange={(e) => setKategoriFilter(e.target.value)}
              >
                <option value="all">Semua Kategori</option>
                <option value="umum">Umum</option>
                <option value="pengumuman">Pengumuman</option>
                <option value="acara">Acara</option>
              </select>
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold whitespace-nowrap"
              >
                Cari
              </button>
              {(searchTerm || kategoriFilter !== 'all') && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Berita List Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <button 
                onClick={fetchBerita}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-medium"
              >
                Coba Lagi
              </button>
            </div>
          ) : filteredBerita.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v3m0-3a2 2 0 012-2h2a2 2 0 012 2m-6 5v6m4-3H9" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Tidak ada berita</h3>
              <p className="text-gray-500">
                {searchTerm || kategoriFilter !== 'all' 
                  ? 'Tidak ada berita yang sesuai dengan filter pencarian.' 
                  : 'Belum ada berita yang dipublikasikan.'}
              </p>
              {(searchTerm || kategoriFilter !== 'all') && (
                <button 
                  onClick={resetFilters}
                  className="mt-4 text-green-600 hover:text-green-800 font-medium"
                >
                  Tampilkan semua berita
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Info jumlah berita */}
              <div className="mb-6 text-center">
                <p className="text-green-600 font-semibold">
                  Menampilkan {filteredBerita.length} berita
                  {searchTerm && ` untuk pencarian "${searchTerm}"`}
                  {kategoriFilter !== 'all' && ` dalam kategori ${formatKategori(kategoriFilter)}`}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBerita.map((item) => {
                  const imageUrl = getOptimizedImageUrl(item.gambar_cover);
                  
                  return (
                    <article 
                      key={item.id_berita} 
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300 hover-lift"
                    >
                      <div className="relative overflow-hidden h-48">
                        {imageUrl ? (
                          <img 
                            src={imageUrl}
                            alt={item.judul}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={handleImageError}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                            <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v3m0-3a2 2 0 012-2h2a2 2 0 012 2m-6 5v6m4-3H9" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6">
                        <div className={`text-sm font-medium px-3 py-1 rounded-full inline-block mb-4 ${getKategoriColor(item.kategori)}`}>
                          {formatKategori(item.kategori)}
                        </div>
                        
                        <h3 className="text-xl font-bold text-green-800 mb-3 line-clamp-2 hover:text-green-600 transition-colors">
                          <Link to={`/berita/${item.slug}`}>
                            {item.judul}
                          </Link>
                        </h3>
                        
                        <p className="text-green-600 mb-4 line-clamp-3">
                          {item.konten?.substring(0, 120)}...
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-green-700 mb-4">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{item.penulis?.nama_lengkap || 'Admin TPQ'}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(item.tanggal_publikasi)}</span>
                          </div>
                        </div>

                        <div className="text-center">
                          <Link 
                            to={`/berita/${item.slug}`}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300 w-full inline-block"
                          >
                            Baca Selengkapnya
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Back to Home */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4 text-center">
          <Link 
            to="/"
            className="text-green-600 hover:text-green-800 font-semibold inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Beranda
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BeritaPage;