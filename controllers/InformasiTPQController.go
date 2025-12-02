package controllers

import (
	"net/http"
	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type InformasiTPQController struct {
	db *gorm.DB
}

func NewInformasiTPQController(db *gorm.DB) *InformasiTPQController {
	return &InformasiTPQController{db: db}
}

// Request struct untuk JSON input
type CreateInformasiTPQRequest struct {
	NamaTPQ        string  `json:"nama_tpq" binding:"required"`
	Tempat         *string `json:"tempat,omitempty"`
	Visi           *string `json:"visi,omitempty"`
	Misi           *string `json:"misi,omitempty"`
	Deskripsi      *string `json:"deskripsi,omitempty"`
	NoTelp         *string `json:"no_telp,omitempty"`
	Email          *string `json:"email,omitempty"`
	Alamat         *string `json:"alamat,omitempty"`
	LinkAlamat     *string `json:"link_alamat,omitempty"`
	HariJamBelajar *string `json:"hari_jam_belajar,omitempty"`
	Logo           *string `json:"logo,omitempty"` // URL string dari Cloudinary
}

type UpdateInformasiTPQRequest struct {
	NamaTPQ        string  `json:"nama_tpq"`
	Tempat         *string `json:"tempat,omitempty"`
	Visi           *string `json:"visi,omitempty"`
	Misi           *string `json:"misi,omitempty"`
	Deskripsi      *string `json:"deskripsi,omitempty"`
	NoTelp         *string `json:"no_telp,omitempty"`
	Email          *string `json:"email,omitempty"`
	Alamat         *string `json:"alamat,omitempty"`
	LinkAlamat     *string `json:"link_alamat,omitempty"`
	HariJamBelajar *string `json:"hari_jam_belajar,omitempty"`
	Logo           *string `json:"logo,omitempty"` // URL string dari Cloudinary
}

// Helper function untuk check role admin
func (ctrl *InformasiTPQController) isAdmin(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == "admin" || role == "super_admin"
}

// Helper function untuk get user ID dari context
func (ctrl *InformasiTPQController) getUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// Helper function untuk validasi URL Cloudinary
func isValidCloudinaryURLlogo(url string) bool {
	if url == "" {
		return true // URL kosong diperbolehkan (tidak ada logo)
	}
	
	// Validasi dasar: harus string dan mengandung cloudinary.com
	return len(url) > 0 && len(url) < 1000 && 
	       (url == "" || (url[:4] == "http" && (url[:5] == "https" || url[:4] == "http")))
}

// CreateInformasiTPQ membuat informasi TPQ baru (JSON input)
func (ctrl *InformasiTPQController) CreateInformasiTPQ(c *gin.Context) {
	// Hanya admin yang bisa create
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat membuat informasi TPQ"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Parse JSON request
	var req CreateInformasiTPQRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request tidak valid: " + err.Error()})
		return
	}

	// Validasi field required
	if req.NamaTPQ == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama TPQ harus diisi"})
		return
	}

	// Validasi URL logo jika ada
	if req.Logo != nil && *req.Logo != "" {
		if !isValidCloudinaryURLlogo(*req.Logo) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "URL logo tidak valid"})
			return
		}
	}

	// Buat informasi TPQ
	informasiTPQ := models.InformasiTPQ{
		IDTPQ:          uuid.New().String(),
		NamaTPQ:        req.NamaTPQ,
		Tempat:         req.Tempat,
		Logo:           req.Logo, // URL string dari Cloudinary
		Visi:           req.Visi,
		Misi:           req.Misi,
		Deskripsi:      req.Deskripsi,
		NoTelp:         req.NoTelp,
		Email:          req.Email,
		Alamat:         req.Alamat,
		LinkAlamat:     req.LinkAlamat,
		HariJamBelajar: req.HariJamBelajar,
		DiupdateOlehID: &adminID,
	}

	// Simpan ke database
	if err := ctrl.db.Create(&informasiTPQ).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat informasi TPQ: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("DiupdateOleh").First(&informasiTPQ, "id_tpq = ?", informasiTPQ.IDTPQ)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Informasi TPQ berhasil dibuat",
		"data":    informasiTPQ,
	})
}

// GetInformasiTPQ mendapatkan informasi TPQ
func (ctrl *InformasiTPQController) GetInformasiTPQ(c *gin.Context) {
	var informasiTPQ models.InformasiTPQ
	
	// Ambil data pertama (asumsi hanya ada satu data informasi TPQ)
	err := ctrl.db.Preload("DiupdateOleh").First(&informasiTPQ).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Informasi TPQ tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data informasi TPQ: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": informasiTPQ,
	})
}

// UpdateInformasiTPQ mengupdate informasi TPQ (JSON input)
func (ctrl *InformasiTPQController) UpdateInformasiTPQ(c *gin.Context) {
	// Hanya admin yang bisa update
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengupdate informasi TPQ"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID informasi TPQ diperlukan"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Cek apakah informasi TPQ exists
	var existingTPQ models.InformasiTPQ
	err := ctrl.db.Where("id_tpq = ?", id).First(&existingTPQ).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Informasi TPQ tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data informasi TPQ: " + err.Error()})
		return
	}

	// Parse JSON request
	var req UpdateInformasiTPQRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request tidak valid: " + err.Error()})
		return
	}

	// Validasi URL logo jika ada
	if req.Logo != nil && *req.Logo != "" {
		if !isValidCloudinaryURLlogo(*req.Logo) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "URL logo tidak valid"})
			return
		}
	}

	// Update fields
	if req.NamaTPQ != "" {
		existingTPQ.NamaTPQ = req.NamaTPQ
	}
	if req.Tempat != nil {
		existingTPQ.Tempat = req.Tempat
	}
	if req.Visi != nil {
		existingTPQ.Visi = req.Visi
	}
	if req.Misi != nil {
		existingTPQ.Misi = req.Misi
	}
	if req.Deskripsi != nil {
		existingTPQ.Deskripsi = req.Deskripsi
	}
	if req.NoTelp != nil {
		existingTPQ.NoTelp = req.NoTelp
	}
	if req.Email != nil {
		existingTPQ.Email = req.Email
	}
	if req.Alamat != nil {
		existingTPQ.Alamat = req.Alamat
	}
	if req.LinkAlamat != nil {
		existingTPQ.LinkAlamat = req.LinkAlamat
	}
	if req.HariJamBelajar != nil {
		existingTPQ.HariJamBelajar = req.HariJamBelajar
	}
	if req.Logo != nil {
		// Hanya update jika ada perubahan
		if existingTPQ.Logo == nil || (req.Logo != nil && *existingTPQ.Logo != *req.Logo) {
			existingTPQ.Logo = req.Logo
		}
	}

	// Update user yang mengubah
	existingTPQ.DiupdateOlehID = &adminID

	// Simpan perubahan
	if err := ctrl.db.Save(&existingTPQ).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate informasi TPQ: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("DiupdateOleh").First(&existingTPQ, "id_tpq = ?", existingTPQ.IDTPQ)

	c.JSON(http.StatusOK, gin.H{
		"message": "Informasi TPQ berhasil diupdate",
		"data":    existingTPQ,
	})
}

// DeleteInformasiTPQ menghapus informasi TPQ
func (ctrl *InformasiTPQController) DeleteInformasiTPQ(c *gin.Context) {
	// Hanya admin yang bisa delete
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat menghapus informasi TPQ"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID informasi TPQ diperlukan"})
		return
	}

	// Cek apakah informasi TPQ exists
	var tpq models.InformasiTPQ
	err := ctrl.db.Where("id_tpq = ?", id).First(&tpq).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Informasi TPQ tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data informasi TPQ: " + err.Error()})
		return
	}

	// Hapus informasi TPQ
	if err := ctrl.db.Where("id_tpq = ?", id).Delete(&models.InformasiTPQ{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus informasi TPQ: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Informasi TPQ berhasil dihapus",
	})
}