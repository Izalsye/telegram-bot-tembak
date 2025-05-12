const axios = require("axios");
const crypto = require("crypto");
const config = require("../config");
const { Product, Category } = require("../models");
const { code } = require("telegraf/format");

const generateSignature = () => {
  return crypto
    .createHash("md5")
    .update(config.USERNAME_DIGI + config.API_KEY_DIGI + "pricelist")
    .digest("hex");
};

async function fetchAndSyncProducts() {
  try {
    console.log("🔄 Mengambil data produk dari Digiflazz...");

    const response = await axios.post(
      "https://api.digiflazz.com/v1/price-list",
      {
        cmd: "prepaid",
        username: config.USERNAME_DIGI,
        sign: generateSignature(),
      }
    );

    console.log(
      "✅ Data produk berhasil diterima:",
      response.data.data.length,
      "produk"
    );
    const products = response.data.data;

    if (products.length === 0) {
      console.warn("⚠️ Tidak ada produk yang tersedia dari Digiflazz");
    }

    for (const item of products) {
      console.log(
        `📦 Memproses produk: ${item.product_name} (${item.buyer_sku_code}) : (${item.buyer_product_status})`
      );

      if (item.buyer_product_status === true) {
        const categoryName = item.category || "Uncategorized";

        // Log kategori
        console.log(`🔍 Menyimpan kategori: ${categoryName} dengan code: ${categoryName.toLowerCase()}`);

        // Simpan / cari kategori
        let categoryIcon;

        // Tentukan icon berdasarkan nama kategori
        switch (categoryName.toLowerCase()) {
          case "pulsa":
            categoryIcon = "💰"; // Ganti dengan icon yang sesuai untuk Pulsa
            break;
          case "e-money":
            categoryIcon = "💳"; // Ganti dengan icon yang sesuai untuk E-money
            break;
          case "data":
            categoryIcon = "📶"; // Ganti dengan icon yang sesuai untuk Data
            break;
          case "masa aktif":
            categoryIcon = "⏳"; // Ganti dengan icon yang sesuai untuk Masa Aktif
            break;
          default:
            categoryIcon = "⚡️"; // Default icon untuk kategori lain
            break;
        }

        // Simpan / cari kategori dengan icon yang sesuai
        const categoryCode = categoryName.toLowerCase().replace(/\s+/g, '-');

        // Simpan / cari kategori dan perbarui icon jika diperlukan
        let [category, created] = await Category.findOrCreate({
            where: { name: categoryName },
            defaults: { icon: categoryIcon, code: categoryCode },
        });
        
        // Perbarui icon kategori jika sudah ada
        if (!created) {
            await category.update({ icon: categoryIcon, code: categoryCode });
        }

        console.log(
          `🗂️ Kategori ditemukan atau dibuat: ${categoryName} dengan Icon: ${categoryIcon}`
        );

        // Simpan / update produk
        await Product.upsert({
          code: item.buyer_sku_code,
          name: item.product_name,
          price: item.price,
          brand: item.brand,
          base_price: item.price, // default sama dulu
          category_id: category.id,
          provider: "digiflazz",
          is_active: true,
        });

        console.log(`✅ Produk berhasil disinkronkan: ${item.product_name}`);
      } else {
        console.log(
          `❌ Produk ${item.product_name} (SKU: ${item.buyer_sku_code}) tidak aktif dan dilewati.`
        );
      }
    }

    console.log("✅ Semua produk dari Digiflazz berhasil disinkronkan!");
  } catch (err) {
    console.error(
      "❌ Gagal mengambil atau menyinkronkan produk:",
      err.response?.data || err.message
    );
  }
}

module.exports = {
  fetchAndSyncProducts,
};
