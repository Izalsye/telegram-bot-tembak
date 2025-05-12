const { Op } = require("sequelize"); // Pastikan Op sudah diimpor dari sequelize
const { Product, Category } = require("../models");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
class ProductFetcher {
  constructor() {
    this.db = {
      Product,
      Category,
    };
  }

  async getProductsByCategory(categoryName) {
    try {
      // Cari kategori berdasarkan nama kategori
      const category = await this.db.Category.findOne({
        where: { name: categoryName },
      });

      if (!category) {
        console.warn(
          `⚠️ Kategori "${categoryName}" tidak ditemukan di database.`
        );
        return [];
      }

      // Ambil produk yang sesuai dengan kategori
      const products = await this.db.Product.findAll({
        where: { category_id: category.id, is_active: true },
      });

      console.log(
        `✅ Produk untuk kategori "${categoryName}" berhasil ditemukan:`,
        products.length
      );

      return products; // Mengembalikan daftar produk yang ditemukan
    } catch (err) {
      console.error("❌ Gagal mengambil produk dari database:", err.message);
      return [];
    }
  }
}

module.exports = new ProductFetcher();
