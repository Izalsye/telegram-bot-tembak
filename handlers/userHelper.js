const { User } = require("../models"); // Sesuaikan dengan path model User kamu
const config = require("../config"); // Memanggil file config untuk OWNER_TELEGRAM
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
// Fungsi untuk memeriksa apakah user sudah terdaftar di database
const checkIfUserExists = async (telegramId) => {
  // Cek jika yang mengirim adalah pemilik bot
  if (telegramId.toString() === config.OWNER_TELEGRAM) {
    return { isAdmin: true }; // Pemilik bot langsung dianggap sebagai admin
  }

  try {
    const user = await User.findOne({ where: { telegram_id: telegramId } });

    if (!user) {
      // Jika pengguna tidak ditemukan, kembalikan null atau false
      return null;
    }

    // Jika pengguna ditemukan, kembalikan user tersebut
    return user;
  } catch (error) {
    console.error("Error checking user:", error);
    throw new Error("Database error while checking user.");
  }
};

module.exports = {
  checkIfUserExists,
};
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
