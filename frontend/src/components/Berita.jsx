import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BeritaList = () => {
  const [berita, setBerita] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fetch berita dari API
  const fetchBerita = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/api/berita?limit=3`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('Data dari API:', data); // Debug log
      
      setBerita(data.data || []);

    } catch (err) {
      console.error('Error fetching berita:', err);
      setError('Gagal memuat data berita.');
      setBerita([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBerita();
  }, []);

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
      'umum': 'bg-blue-100 text-blue-800',
      'pengumuman': 'bg-yellow-100 text-yellow-800',
      'acara': 'bg-green-100 text-green-800'
    };
    return colorMap[kategori] || 'bg-gray-100 text-gray-800';
  };
  const handleImageError = (e) => {
    console.error('Gagal memuat gambar berita');
    e.target.src = 'https://via.placeholder.com/400x200?text=Gambar+Tidak+Tersedia';
  };

  if (loading) {
    return (
      <section id="berita" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
              Berita Terbaru
            </h2>
            <p className="text-lg text-green-600 max-w-2xl mx-auto">
              Informasi terbaru seputar kegiatan dan pengumuman TPQ Asy-Syafi'i
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="berita" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
              Berita Terbaru
            </h2>
            <p className="text-lg text-green-600 max-w-2xl mx-auto">
              Informasi terbaru seputar kegiatan dan pengumuman TPQ Asy-Syafi'i
            </p>
          </div>
          
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-green-800 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v3m0-3a2 2 0 012-2h2a2 2 0 012 2m-6 5v6m4-3H9" />
            </svg>
            <h3 className="text-xl font-semibold text-green-800 mb-2">Belum ada berita</h3>
            <p className="text-green-500">Tidak ada berita yang dipublikasikan saat ini.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="berita" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
            Berita Terbaru
          </h2>
          <p className="text-lg text-green-600 max-w-2xl mx-auto">
            Informasi terbaru seputar kegiatan dan pengumuman TPQ Asy-Syafi'i
          </p>
        </div>

        {berita.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-green-800 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v3m0-3a2 2 0 012-2h2a2 2 0 012 2m-6 5v6m4-3H9" />
            </svg>
            <h3 className="text-xl font-semibold text-green-800 mb-2">Belum ada berita</h3>
            <p className="text-green-500">Tidak ada berita yang dipublikasikan saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {berita.map((item) => {
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
                    
                    <h3 className="text-2xl font-bold text-green-800 mb-3 line-clamp-2">
                      {item.judul}
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
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link 
            to="/berita"
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition duration-300 font-semibold inline-flex items-center"
          >
            <span>Lihat Semua Berita</span>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BeritaList;