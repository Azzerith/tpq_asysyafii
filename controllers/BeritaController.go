package controllers

import (
	"net/http"
	"strconv"
	"strings"
	"time"
	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BeritaController struct {
	db *gorm.DB
}

func NewBeritaController(db *gorm.DB) *BeritaController {
	return &BeritaController{db: db}
}

// CreateBeritaRequest struct untuk JSON (bukan form-data)
type CreateBeritaRequest struct {
	Judul       string  `json:"judul" binding:"required"`
	Konten      string  `json:"konten" binding:"required"`
	Kategori    string  `json:"kategori" binding:"required"`
	Status      string  `json:"status"`
	GambarCover *string `json:"gambar_cover,omitempty"` // URL string dari Cloudinary
}

// UpdateBeritaRequest struct untuk JSON
type UpdateBeritaRequest struct {
	Judul       string  `json:"judul"`
	Konten      string  `json:"konten"`
	Kategori    string  `json:"kategori"`
	Status      string  `json:"status"`
	GambarCover *string `json:"gambar_cover,omitempty"` // URL string dari Cloudinary
}

// Helper function untuk check role admin
func (ctrl *BeritaController) isAdmin(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == "admin" || role == "super_admin"
}

// Helper function untuk get user ID dari context
func (ctrl *BeritaController) getUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// Helper function untuk generate slug dari judul
func generateSlug(judul string) string {
	// Convert to lowercase
	slug := strings.ToLower(judul)
	// Replace spaces with hyphens
	slug = strings.ReplaceAll(slug, " ", "-")
	// Remove special characters (hanya allow alphanumeric dan hyphen)
	var result strings.Builder
	for _, char := range slug {
		if (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '-' {
			result.WriteRune(char)
		}
	}
	return result.String()
}

// Helper function untuk validasi URL Cloudinary
func isValidCloudinaryURL(url string) bool {
	if url == "" {
		return true // URL kosong diperbolehkan (tidak ada gambar)
	}
	
	// Validasi dasar: harus string dan mengandung cloudinary.com
	return strings.Contains(url, "cloudinary.com") && strings.Contains(url, "upload")
}

// CreateBerita membuat berita baru (JSON input)
func (ctrl *BeritaController) CreateBerita(c *gin.Context) {
	// Hanya admin yang bisa create berita
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat membuat berita"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Parse JSON request
	var req CreateBeritaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request tidak valid: " + err.Error()})
		return
	}

	// Validasi field required
	if req.Judul == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Judul harus diisi"})
		return
	}
	if req.Konten == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Konten harus diisi"})
		return
	}
	if req.Kategori == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kategori harus diisi"})
		return
	}

	// Validasi URL gambar jika ada
	if req.GambarCover != nil && *req.GambarCover != "" {
		if !isValidCloudinaryURL(*req.GambarCover) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "URL gambar tidak valid. Harus dari Cloudinary"})
			return
		}
	}

	// Generate slug dari judul
	slug := generateSlug(req.Judul)

	// Convert string ke custom type dan validasi kategori
	var kategoriEnum models.KategoriBerita
	switch req.Kategori {
	case "umum":
		kategoriEnum = models.KategoriUmum
	case "pengumuman":
		kategoriEnum = models.KategoriPengumuman
	case "acara":
		kategoriEnum = models.KategoriAcara
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kategori tidak valid. Gunakan 'umum', 'pengumuman', atau 'acara'"})
		return
	}

	// Convert string ke custom type dan validasi status
	var statusEnum models.StatusBerita
	if req.Status != "" {
		switch req.Status {
		case "draft":
			statusEnum = models.StatusDraft
		case "published":
			statusEnum = models.StatusPublished
		case "arsip":
			statusEnum = models.StatusArsip
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'draft', 'published', atau 'arsip'"})
			return
		}
	} else {
		statusEnum = models.StatusDraft // default
	}

	// Set tanggal publikasi jika status published
	var tanggalPublikasi *time.Time
	if statusEnum == models.StatusPublished {
		now := time.Now()
		tanggalPublikasi = &now
	}

	// Buat berita
	berita := models.Berita{
		IDBerita:        uuid.New().String(),
		Judul:           req.Judul,
		Slug:            slug,
		Konten:          req.Konten,
		Kategori:        kategoriEnum,
		Status:          statusEnum,
		GambarCover:     req.GambarCover, // URL string dari Cloudinary
		PenulisID:       adminID,
		TanggalPublikasi: tanggalPublikasi,
	}

	// Simpan ke database
	if err := ctrl.db.Create(&berita).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat berita: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Penulis").First(&berita, "id_berita = ?", berita.IDBerita)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Berita berhasil dibuat",
		"data":    berita,
	})
}

// GetBeritaByID mendapatkan berita berdasarkan ID (public access)
func (ctrl *BeritaController) GetBeritaByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID berita diperlukan"})
		return
	}

	var berita models.Berita
	err := ctrl.db.Preload("Penulis").Where("id_berita = ?", id).First(&berita).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Berita tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data berita: " + err.Error()})
		return
	}

	// Untuk public access, hanya tampilkan yang published
	if berita.Status != models.StatusPublished {
		c.JSON(http.StatusNotFound, gin.H{"error": "Berita tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": berita,
	})
}

// GetBeritaBySlug mendapatkan berita berdasarkan slug (untuk public access)
func (ctrl *BeritaController) GetBeritaBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Slug berita diperlukan"})
		return
	}

	var berita models.Berita
	err := ctrl.db.Preload("Penulis").Where("slug = ?", slug).First(&berita).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Berita tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data berita: " + err.Error()})
		return
	}

	// Untuk user non-admin, hanya bisa lihat yang published
	if !ctrl.isAdmin(c) && berita.Status != models.StatusPublished {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses ke berita ini"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": berita,
	})
}

// UpdateBerita mengupdate berita (hanya admin) - JSON input
func (ctrl *BeritaController) UpdateBerita(c *gin.Context) {
	// Hanya admin yang bisa update
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengupdate berita"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID berita diperlukan"})
		return
	}

	// Cek apakah berita exists
	var existingBerita models.Berita
	err := ctrl.db.Where("id_berita = ?", id).First(&existingBerita).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Berita tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data berita: " + err.Error()})
		return
	}

	// Parse JSON request
	var req UpdateBeritaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request tidak valid: " + err.Error()})
		return
	}

	// Validasi URL gambar jika ada
	if req.GambarCover != nil && *req.GambarCover != "" {
		if !isValidCloudinaryURL(*req.GambarCover) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "URL gambar tidak valid. Harus dari Cloudinary"})
			return
		}
	}

	// Update fields
	if req.Judul != "" {
		existingBerita.Judul = req.Judul
		// Generate slug baru jika judul berubah
		existingBerita.Slug = generateSlug(req.Judul)
	}
	if req.Konten != "" {
		existingBerita.Konten = req.Konten
	}
	if req.Kategori != "" {
		// Convert dan validasi kategori
		switch req.Kategori {
		case "umum":
			existingBerita.Kategori = models.KategoriUmum
		case "pengumuman":
			existingBerita.Kategori = models.KategoriPengumuman
		case "acara":
			existingBerita.Kategori = models.KategoriAcara
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kategori tidak valid. Gunakan 'umum', 'pengumuman', atau 'acara'"})
			return
		}
	}
	if req.Status != "" {
		// Convert dan validasi status
		switch req.Status {
		case "draft":
			existingBerita.Status = models.StatusDraft
			// Reset tanggal publikasi jika kembali ke draft
			existingBerita.TanggalPublikasi = nil
		case "published":
			existingBerita.Status = models.StatusPublished
			// Set tanggal publikasi jika status berubah menjadi published
			if existingBerita.TanggalPublikasi == nil {
				now := time.Now()
				existingBerita.TanggalPublikasi = &now
			}
		case "arsip":
			existingBerita.Status = models.StatusArsip
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'draft', 'published', atau 'arsip'"})
			return
		}
	}
	if req.GambarCover != nil {
		// Hanya update jika ada perubahan
		if existingBerita.GambarCover == nil || *existingBerita.GambarCover != *req.GambarCover {
			existingBerita.GambarCover = req.GambarCover
		}
	}

	// Simpan perubahan
	if err := ctrl.db.Save(&existingBerita).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate berita: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Penulis").First(&existingBerita, "id_berita = ?", existingBerita.IDBerita)

	c.JSON(http.StatusOK, gin.H{
		"message": "Berita berhasil diupdate",
		"data":    existingBerita,
	})
}

// DeleteBerita menghapus berita (hanya admin)
func (ctrl *BeritaController) DeleteBerita(c *gin.Context) {
	// Hanya admin yang bisa delete
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat menghapus berita"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID berita diperlukan"})
		return
	}

	// Cek apakah berita exists
	var berita models.Berita
	err := ctrl.db.Where("id_berita = ?", id).First(&berita).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Berita tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data berita: " + err.Error()})
		return
	}

	// Hapus berita
	if err := ctrl.db.Where("id_berita = ?", id).Delete(&models.Berita{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus berita: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Berita berhasil dihapus",
	})
}

// PublishBerita mengubah status berita menjadi published (hanya admin)
func (ctrl *BeritaController) PublishBerita(c *gin.Context) {
	// Hanya admin yang bisa publish
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mempublish berita"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID berita diperlukan"})
		return
	}

	// Cek apakah berita exists
	var berita models.Berita
	err := ctrl.db.Where("id_berita = ?", id).First(&berita).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Berita tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data berita: " + err.Error()})
		return
	}

	// Update status menjadi published
	berita.Status = models.StatusPublished
	now := time.Now()
	berita.TanggalPublikasi = &now

	// Simpan perubahan
	if err := ctrl.db.Save(&berita).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mempublish berita: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Penulis").First(&berita, "id_berita = ?", berita.IDBerita)

	c.JSON(http.StatusOK, gin.H{
		"message": "Berita berhasil dipublish",
		"data":    berita,
	})
}

// GetAllBerita mendapatkan semua berita dengan filter (untuk super-admin)
func (ctrl *BeritaController) GetAllBerita(c *gin.Context) {
	// Hanya super-admin yang bisa akses
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengakses semua berita"})
		return
	}

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	kategori := c.Query("kategori")
	status := c.Query("status")
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	var berita []models.Berita
	var total int64

	// Build query
	query := ctrl.db.Preload("Penulis")

	// Apply filters
	if kategori != "" {
		query = query.Where("kategori = ?", kategori)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("judul LIKE ? OR konten LIKE ?", searchTerm, searchTerm)
	}

	// Hitung total records
	if err := query.Model(&models.Berita{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order("dibuat_pada DESC").
		Offset(offset).
		Limit(limit).
		Find(&berita).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data berita: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": berita,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// GetBeritaPublic mendapatkan berita untuk public (hanya yang published)
func (ctrl *BeritaController) GetBeritaPublic(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "6"))
	kategori := c.Query("kategori")
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 20 {
		limit = 6
	}

	var berita []models.Berita
	var total int64

	// Build query hanya untuk berita yang published
	query := ctrl.db.Preload("Penulis").Where("status = ?", models.StatusPublished)

	// Apply filters
	if kategori != "" {
		query = query.Where("kategori = ?", kategori)
	}
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("judul LIKE ? OR konten LIKE ?", searchTerm, searchTerm)
	}

	// Hitung total records
	if err := query.Model(&models.Berita{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order("tanggal_publikasi DESC, dibuat_pada DESC").
		Offset(offset).
		Limit(limit).
		Find(&berita).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data berita: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": berita,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}