const { RANGE } = require("sequelize");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
// config.js
module.exports = {
  TOKEN_BOT: "7951443355:AAGDXeCIqOrkZKRYLoG6pCqvpv_OLlUOAp0", // Ganti dengan token bot Telegram
  OWNER_TELEGRAM: "6039327209", // Ganti dengan ID Telegram pemilik bot
  ADMIN_TELEGRAM: "Oryxnb", // Ganti dengan ID Telegram pemilik bot
  BG_BANNER: "./assets/bg.jpg",
  // GANTI ini sesuai akun Digiflazz kamu
  USERNAME_DIGI: "mikahog91xlg", //Ganti username DIGI
  API_KEY_DIGI: "4b2f4af8-2f23-5e60-b2ea-7b3cbc611a6a", //Ganti Key DIGI

  API_KEY_VIP_TUNNEL:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTksImVtYWlsIjoic2VydmVyYXNsYW1AZ21haWwuY29tIiwid2hhdHNhcHAiOiIwODk4ODcyMjQ2NSIsInJvbGUiOiJzZWxsZXIiLCJpYXQiOjE3NDA3NDg2NTN9.2CKMpKaqOpHSlI9IePVAcKJIy0Q0E6pfd6jZ8zBjW7w", //Ganti Key DIGI

  API_KEY_KMSP: "b66bb247-82ad-49dd-96e3-6f215f5296ae", //key_KMSP_KAMU
  URL_REST_API_KMSP: "https://my.kmsp-store.com/apigw/tembakxl/", //jangan diganti
  GET_LIST_PRODUCT: "v1/package_list?api_key=", //jangan diganti
  BELI_PRODUCT_NOOTP: "v2/package_purchase_otp?api_key=", //jangan diganti
  BELI_PRODUCT_OTP: "v2/package_purchase_otp?api_key=", //jangan diganti
  REQUEST_OTP: "v2/otp_request?api_key=", //jangan diganti
  LOGIN_OTP: "v2/otp_login?api_key=", //jangan diganti
  CHECK_STOCK_AKRAB_GLOBAL: "v1/check_package_stock_akrab_global?api_key=", //jangan diganti
  RANGE_UP: 8000, //Range Up Harga Jual
  API_CEK_DOMPUL: "https://apigw.kmsp-store.com/sidompul/v3/cek_kuota?msisdn=", //jangan diganti

  // api viptunnel
  END_POINT_VIP_TUNNEL: "https://seller.viptunnel.id/api/product",
  END_POINT_VIP_TUNNEL_BELI: "https://seller.viptunnel.id/api/myxl/purchase",
  RANGE_UP_V2: 8000, //Range Up Harga Jual

  TRIPAY_API_KEY: "GZRJ8SfEEtk2MDjUXpRAfckcmT5tdwl8sqjb0raZ", //api key tripay mu
  TRIPAY_MERCHANT_CODE: "T31346", //code merchantmu
  TRIPAY_PRIVATE_KEY: "sgN3S-4f73v-N3YZo-0tZtz-A8phx", //private key mu
  TRIPAY_END_POINT: "https://tripay.co.id/api/payment/instruction", //private key mu
  TRIPAY_METHODE_PEMBAYARAN: "QRIS2", //private key mu
  TRIPAY_MINIMAL_TOPUP: 5000, //private key mu

  MENUTEXT: `
  🤖 *BOT XL AKRAB & TEMBAK DATA* 🤖

Berikut fitur yang tersedia:

> *1 Tembak v1*\nPaket data tembak dengan harga Spesial\n
> *2 Check Kuota*\nCek sisa kuota dari nomor XL kamu\n
> *3 Login OTP*\nWajib login sebelum membeli paket tembak\n  
> *4 Info Ku*\nInfo saldo & nomor login oleh kamu\n
> 👇 Silakan pilih tombol di bawah ini untuk memulai:
  `,
  WELCOMETEXT: `
┏━━━━━━━━━┓
    Selamat Datang! 👋
┗━━━━━━━━━┛
┏━━━━━━━━━━━━━━━━━━━┓
    🤖 Bot XL Akrab & Tembak Data! 🤖
┗━━━━━━━━━━━━━━━━━━━┛
Bot ini siap bantu kamu beli paket data dengan harga bersahabat 💸
    
    📦 Layanan:
    • Paket Data XL Akrab 👨‍👩‍👧‍👦  
    • Paket Tembak Data ⚡  
    • Info Kuota & Bantuan 📱
    
Ketik /menu untuk mulai ya!
          `,
};
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
