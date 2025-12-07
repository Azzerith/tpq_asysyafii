package controllers

import (
	"net/http"
	"strconv"
	"time"
	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SantriController struct {
	db *gorm.DB
}

func NewSantriController(db *gorm.DB) *SantriController {
	return &SantriController{db: db}
}

// Request structs
type CreateSantriRequest struct {
	IDWali       string        `json:"id_wali"` // Opsional, akan diisi otomatis dari token
	NamaLengkap  string        `json:"nama_lengkap" binding:"required"`
	JenisKelamin models.JenisKelamin `json:"jenis_kelamin" binding:"required"`
	TempatLahir  string        `json:"tempat_lahir"`
	TanggalLahir string        `json:"tanggal_lahir"` // Format: YYYY-MM-DD
	Alamat       string        `json:"alamat"`
	Foto         string        `json:"foto"`
	Status       models.StatusSantri `json:"status"`
	TanggalMasuk string        `json:"tanggal_masuk"` // Format: YYYY-MM-DD
}

type UpdateSantriRequest struct {
	NamaLengkap  string        `json:"nama_lengkap"`
	JenisKelamin models.JenisKelamin `json:"jenis_kelamin"`
	TempatLahir  string        `json:"tempat_lahir"`
	TanggalLahir string        `json:"tanggal_lahir"` // Format: YYYY-MM-DD
	Alamat       string        `json:"alamat"`
	Foto         string        `json:"foto"`
	Status       models.StatusSantri `json:"status"`
	TanggalMasuk string        `json:"tanggal_masuk"` // Format: YYYY-MM-DD
	TanggalKeluar *string      `json:"tanggal_keluar"` // Format: YYYY-MM-DD, bisa null
}

// Helper function untuk get user ID dari context
func (ctrl *SantriController) getUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// Helper function untuk parse tanggal
func parseDate(dateStr string) (time.Time, error) {
	return time.Parse("2006-01-02", dateStr)
}

// CreateSantri membuat data santri baru
func (ctrl *SantriController) CreateSantri(c *gin.Context) {
	// Get user ID dari token
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var req CreateSantriRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Jika IDWali kosong, gunakan user ID dari token
	if req.IDWali == "" {
		req.IDWali = userID
	}

	// Cek apakah wali exists
	var wali models.User
	if err := ctrl.db.Where("id_user = ?", req.IDWali).First(&wali).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Wali tidak ditemukan"})
		return
	}

	// Parse tanggal
	var tanggalLahir, tanggalMasuk time.Time
	var err error

	if req.TanggalLahir != "" {
		tanggalLahir, err = parseDate(req.TanggalLahir)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal_lahir tidak valid, gunakan format YYYY-MM-DD"})
			return
		}
	}

	if req.TanggalMasuk != "" {
		tanggalMasuk, err = parseDate(req.TanggalMasuk)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal_masuk tidak valid, gunakan format YYYY-MM-DD"})
			return
		}
	} else {
		tanggalMasuk = time.Now() // Default ke tanggal sekarang
	}

	// Buat data santri
	santri := models.Santri{
		IDSantri:     uuid.New().String(),
		IDWali:       req.IDWali,
		NamaLengkap:  req.NamaLengkap,
		JenisKelamin: req.JenisKelamin,
		TempatLahir:  req.TempatLahir,
		TanggalLahir: tanggalLahir,
		Alamat:       req.Alamat,
		Foto:         req.Foto,
		Status:       req.Status,
		TanggalMasuk: tanggalMasuk,
	}

	// Jika status tidak aktif, set default ke aktif
	if santri.Status == "" {
		santri.Status = models.StatusAktifSantri
	}

	// Simpan ke database
	if err := ctrl.db.Create(&santri).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat data santri: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Wali").First(&santri, "id_santri = ?", santri.IDSantri)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Data santri berhasil dibuat",
		"data":    santri,
	})
}

// GetSantriByID mendapatkan santri berdasarkan ID
func (ctrl *SantriController) GetSantriByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID santri diperlukan"})
		return
	}

	var santri models.Santri
	err := ctrl.db.Preload("Wali").Where("id_santri = ?", id).First(&santri).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data santri tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data santri: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": santri,
	})
}

// GetSantriByWali mendapatkan santri berdasarkan wali yang login
func (ctrl *SantriController) GetSantriByWali(c *gin.Context) {
    // Get user ID dari token (wali ID)
    userID, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
        return
    }

    // Parse query parameters
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
    status := c.Query("status")

    if page < 1 {
        page = 1
    }
    if limit < 1 || limit > 100 {
        limit = 10
    }

    var santri []models.Santri
    var total int64

    // Build query untuk santri yang dimiliki wali
    query := ctrl.db.Preload("Wali").Where("id_wali = ?", userID)

    // Apply status filter jika ada
    if status != "" {
        query = query.Where("status = ?", status)
    }

    // Hitung total records
    if err := query.Model(&models.Santri{}).Count(&total).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
        return
    }

    // Apply pagination
    offset := (page - 1) * limit
    err := query.Order("dibuat_pada DESC").
        Offset(offset).
        Limit(limit).
        Find(&santri).Error

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data santri: " + err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "data": santri,
        "meta": gin.H{
            "page":      page,
            "limit":     limit,
            "total":     total,
            "total_page": (int(total) + limit - 1) / limit,
        },
    })
}

// GetSantriByWaliID mendapatkan santri berdasarkan ID wali tertentu (untuk super admin)
func (ctrl *SantriController) GetSantriByWaliID(c *gin.Context) {
    waliID := c.Param("id")
    if waliID == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "ID wali diperlukan"})
        return
    }

    // Cek apakah wali exists
    var wali models.User
    if err := ctrl.db.Where("id_user = ?", waliID).First(&wali).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Wali tidak ditemukan"})
        return
    }

    var santri []models.Santri
    err := ctrl.db.Preload("Wali").
        Where("id_wali = ?", waliID).
        Order("dibuat_pada DESC").
        Find(&santri).Error

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data santri: " + err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "data": santri,
    })
}

// GetMySantri mendapatkan data santri dari wali yang sedang login
func (ctrl *SantriController) GetMySantri(c *gin.Context) {
	// Get user ID dari token
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var santri []models.Santri
	err := ctrl.db.Preload("Wali").
		Where("id_wali = ?", userID).
		Find(&santri).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data santri: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": santri,
	})
}

// GetAllSantri mendapatkan semua data santri (untuk admin)
func (ctrl *SantriController) GetAllSantri(c *gin.Context) {
	var santri []models.Santri

	err := ctrl.db.Preload("Wali").
		Find(&santri).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data santri: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": santri,
	})
}

// UpdateSantri mengupdate data santri
func (ctrl *SantriController) UpdateSantri(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID santri diperlukan"})
		return
	}

	// Get user ID dari token untuk authorization check
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var req UpdateSantriRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cek apakah santri exists
	var existingSantri models.Santri
	err := ctrl.db.Where("id_santri = ?", id).First(&existingSantri).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data santri tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data santri: " + err.Error()})
		return
	}

	// Authorization check: hanya wali yang bersangkutan atau admin yang bisa update
	userRole, _ := c.Get("role")
	role := userRole.(string)
	
	if existingSantri.IDWali != userID && role != "admin" && role != "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses untuk mengupdate data santri ini"})
		return
	}

	// Update fields
	if req.NamaLengkap != "" {
		existingSantri.NamaLengkap = req.NamaLengkap
	}
	if req.JenisKelamin != "" {
		existingSantri.JenisKelamin = req.JenisKelamin
	}
	if req.TempatLahir != "" {
		existingSantri.TempatLahir = req.TempatLahir
	}
	if req.TanggalLahir != "" {
		tanggalLahir, err := parseDate(req.TanggalLahir)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal_lahir tidak valid, gunakan format YYYY-MM-DD"})
			return
		}
		existingSantri.TanggalLahir = tanggalLahir
	}
	if req.Alamat != "" {
		existingSantri.Alamat = req.Alamat
	}
	if req.Foto != "" {
		existingSantri.Foto = req.Foto
	}
	if req.Status != "" {
		existingSantri.Status = req.Status
	}
	if req.TanggalMasuk != "" {
		tanggalMasuk, err := parseDate(req.TanggalMasuk)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal_masuk tidak valid, gunakan format YYYY-MM-DD"})
			return
		}
		existingSantri.TanggalMasuk = tanggalMasuk
	}
	if req.TanggalKeluar != nil {
		if *req.TanggalKeluar == "" {
			existingSantri.TanggalKeluar = nil
		} else {
			tanggalKeluar, err := parseDate(*req.TanggalKeluar)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal_keluar tidak valid, gunakan format YYYY-MM-DD"})
				return
			}
			existingSantri.TanggalKeluar = &tanggalKeluar
		}
	}

	// Simpan perubahan
	if err := ctrl.db.Save(&existingSantri).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate data santri: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Wali").First(&existingSantri, "id_santri = ?", existingSantri.IDSantri)

	c.JSON(http.StatusOK, gin.H{
		"message": "Data santri berhasil diupdate",
		"data":    existingSantri,
	})
}

// DeleteSantri menghapus data santri
func (ctrl *SantriController) DeleteSantri(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID santri diperlukan"})
		return
	}

	// Get user ID dari token untuk authorization check
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Cek apakah santri exists
	var santri models.Santri
	err := ctrl.db.Where("id_santri = ?", id).First(&santri).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data santri tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data santri: " + err.Error()})
		return
	}

	// Authorization check: hanya wali yang bersangkutan atau admin yang bisa delete
	userRole, _ := c.Get("role")
	role := userRole.(string)
	
	if santri.IDWali != userID && role != "admin" && role != "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses untuk menghapus data santri ini"})
		return
	}

	// Hapus santri
	if err := ctrl.db.Where("id_santri = ?", id).Delete(&models.Santri{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data santri: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Data santri berhasil dihapus",
	})
}

// SearchSantri mencari santri berdasarkan filter
func (ctrl *SantriController) SearchSantri(c *gin.Context) {
	nama := c.Query("nama")
	status := c.Query("status")
	jenisKelamin := c.Query("jenis_kelamin")
	idWali := c.Query("id_wali")

	query := ctrl.db.Preload("Wali")

	if nama != "" {
		query = query.Where("nama_lengkap LIKE ?", "%"+nama+"%")
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if jenisKelamin != "" {
		query = query.Where("jenis_kelamin = ?", jenisKelamin)
	}
	if idWali != "" {
		query = query.Where("id_wali = ?", idWali)
	}

	var santri []models.Santri
	if err := query.Find(&santri).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mencari data santri: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": santri,
	})
}

// UpdateStatusSantri mengupdate status santri
func (ctrl *SantriController) UpdateStatusSantri(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID santri diperlukan"})
		return
	}

	var req struct {
		Status models.StatusSantri `json:"status" binding:"required"`
		TanggalKeluar *string `json:"tanggal_keluar"` // Opsional, untuk status non-aktif
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cek apakah santri exists
	var santri models.Santri
	err := ctrl.db.Where("id_santri = ?", id).First(&santri).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data santri tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data santri: " + err.Error()})
		return
	}

	// Update status
	santri.Status = req.Status

	// Jika status bukan aktif dan ada tanggal keluar, update tanggal keluar
	if req.Status != models.StatusAktifSantri && req.TanggalKeluar != nil {
		tanggalKeluar, err := parseDate(*req.TanggalKeluar)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal_keluar tidak valid, gunakan format YYYY-MM-DD"})
			return
		}
		santri.TanggalKeluar = &tanggalKeluar
	} else if req.Status == models.StatusAktifSantri {
		// Jika status kembali ke aktif, set tanggal keluar ke null
		santri.TanggalKeluar = nil
	}

	// Simpan perubahan
	if err := ctrl.db.Save(&santri).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate status santri: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Wali").First(&santri, "id_santri = ?", santri.IDSantri)

	c.JSON(http.StatusOK, gin.H{
		"message": "Status santri berhasil diupdate",
		"data":    santri,
	})
}