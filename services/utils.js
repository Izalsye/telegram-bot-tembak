const { Product, Category } = require("../models"); // Pastikan ini path ke koneksi database kamu
const { checkIfUserExists } = require("../handlers/userHelper");
const config = require("../config");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
class Utils {
  static async getMainButtons(ctx) {
    const telegramId = ctx.from.id;

    // Mengecek apakah user ada di database dan mendapatkan data user
    const user = await checkIfUserExists(telegramId);

    // Default buttons untuk semua user
    const buttons = [
      { text: "Tembak V1", callback_data: "tembak" },
      { text: "Tembak V2", callback_data: "tembakv2" },
      // { text: "Akrab", callback_data: "akrab" },
      { text: "Check Stock Akrab", callback_data: "cek_stock" },
      { text: "Info Ku", callback_data: "user_info" },
      { text: "💰 Topup", callback_data: "topup" },
      { text: "Login OTP V1", callback_data: "otp" },
      { text: "Login OTP V2", url: "https://t.me/Otp_onlyv2bot" },
      { text: "Hubungi Admin", url: `https://t.me/${config.ADMIN_TELEGRAM}` },
      { text: "Check Kuota", callback_data: "cek_kuota" },
    ];

    // Menambahkan tombol khusus jika user adalah admin
    if (user && user.isAdmin) {
      buttons.push(
        { text: "Ubah Harga V1", callback_data: "set" },
        { text: "Ubah Harga V2", callback_data: "setdua" },
        { text: "Add Saldo User", callback_data: "add_saldo" }, // <- tombol baru
        { text: "Add User", callback_data: "owner_add_user" }, // <- tombol baru
        { text: "Synch Product", callback_data: "owner_getproduct" }
      );
    }

    return buttons;
  }
}

module.exports = Utils;
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
