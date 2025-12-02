import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BeritaDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [berita, setBerita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fungsi untuk optimasi URL Cloudinary
  const getOptimizedImageUrl = (url, width = 800, height = 400) => {
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

  // Fetch detail berita menggunakan endpoint yang benar
  const fetchBeritaDetail = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Gunakan endpoint yang sesuai: /api/berita/:slug
      const response = await fetch(`${API_URL}/api/berita/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Berita tidak ditemukan');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Data berita detail:', data); // Debug log
      
      if (data.data) {
        setBerita(data.data);
      } else {
        throw new Error('Data berita tidak valid');
      }

    } catch (err) {
      console.error('Error fetching berita detail:', err);
      setError(err.message);
      setBerita(null);
    } finally {
      setLoading(false);
    }
  };

  // Fallback function jika endpoint /berita/:slug tidak berhasil
  const fetchBeritaFallback = async () => {
    try {
      console.log('Mencoba fallback: fetch semua berita');
      
      const response = await fetch(`${API_URL}/api/berita?limit=100`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        // Cari berita berdasarkan slug
        const foundBerita = data.data.find(item => {
          // Exact match
          if (item.slug === slug) return true;
          // Case insensitive
          if (item.slug && item.slug.toLowerCase() === slug.toLowerCase()) return true;
          // ID match
          if (item.id_berita === slug) return true;
          return false;
        });
        
        if (foundBerita) {
          setBerita(foundBerita);
        } else {
          throw new Error('Berita tidak ditemukan');
        }
      } else {
        throw new Error('Format data tidak valid');
      }

    } catch (err) {
      console.error('Error fetching berita fallback:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (slug) {
      const loadBerita = async () => {
        try {
          // Pertama coba endpoint khusus
          await fetchBeritaDetail();
        } catch (error) {
          console.log('Endpoint khusus gagal, mencoba fallback...');
          try {
            await fetchBeritaFallback();
          } catch (fallbackError) {
            setError(fallbackError.message);
            setBerita(null);
          }
        }
      };
      
      loadBerita();
    }
  }, [slug]);

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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

  // Handle image error
  const handleImageError = (e) => {
    console.error('Gagal memuat gambar berita');
    e.target.src = 'https://via.placeholder.com/800x400?text=Gambar+Tidak+Tersedia';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Header />
        <div className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto animate-pulse space-y-8">
              {/* Breadcrumb Skeleton */}
              <div className="h-4 bg-gray-200 rounded w-64"></div>
              
              {/* Header Skeleton */}
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
              
              {/* Image Skeleton */}
              <div className="h-96 bg-gray-200 rounded"></div>
              
              {/* Content Skeleton */}
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !berita) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Header />
        <div className="pt-32 pb-20">
          <div className="container mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-red-800 mb-2">Berita Tidak Ditemukan</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-300 font-medium"
              >
                Kembali
              </button>
              <Link 
                to="/#berita"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 font-medium"
              >
                Ke Daftar Berita
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const imageUrl = getOptimizedImageUrl(berita.gambar_cover, 1200, 600);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Breadcrumb */}
      <section className="pt-8 pb-8 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-300">
            <Link to="/" className="hover:text-green-600 transition-colors">Beranda</Link>
            <span>/</span>
            <Link to="/#berita" className="hover:text-green-600 transition-colors">Berita</Link>
            <span>/</span>
            <span className="text-white truncate max-w-xs md:max-w-md">{berita.judul}</span>
          </nav>
        </div>
      </section>

      {/* Berita Detail Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <article className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="p-8 border-b border-gray-200">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getKategoriColor(berita.kategori)}`}>
                    {formatKategori(berita.kategori)}
                  </span>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(berita.tanggal_publikasi)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Oleh: {berita.penulis?.nama_lengkap || 'Admin TPQ'}</span>
                  </div>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 leading-tight">
                  {berita.judul}
                </h1>
              </div>

              {/* Featured Image */}
              {imageUrl && (
                <div className="relative">
                  <img 
                    src={imageUrl}
                    alt={berita.judul}
                    className="w-full h-96 object-cover"
                    onError={handleImageError}
                    loading="lazy"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-8">
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                  {berita.konten?.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Article Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Dipublikasikan: {formatDate(berita.tanggal_publikasi)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Terakhir update: {formatDate(berita.diperbarui_pada)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Kembali</span>
              </button>
              
              <Link 
                to="/berita"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v3m0-3a2 2 0 012-2h2a2 2 0 012 2m-6 5v6m4-3H9" />
                </svg>
                <span>Lihat Semua Berita</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BeritaDetail;