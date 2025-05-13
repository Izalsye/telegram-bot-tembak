const productFetcher = require("../services/ProductFetcher");
const config = require("../config");
const Utils = require("../services/utils");
const axios = require("axios");
const chalk = require("chalk");
const dayjs = require("dayjs");
const time = () => chalk.gray(`[${dayjs().format("HH:mm:ss")}]`);
const { Product, Category, User } = require("../models");
const saldoInputState = {};
const fs = require("fs");
const path = require("path");
const { checkIfUserExists } = require("./userHelper");

async function handleCallback(ctx, msgService, userState) {
  // Cara pakai
  const mainButtons = await Utils.getMainButtons(ctx);
  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id;

  // Cek apakah pengguna sudah terdaftar
  const user = await checkIfUserExists(userId);

  if (!user) {
    // Jika pengguna belum terdaftar, beri tahu dan stop proses lebih lanjut
    await ctx.answerCbQuery(); // Menyelesaikan callback query
    msgService.sendButtons(
      ctx,
      `❌ Kamu belum terdaftar! Silakan daftar terlebih dahulu/ hubungi admin`,
      [{ text: "⬅️ Hubungi", url: `https://t.me/${config.OWNER_TELEGRAM}` }],
      "Markdown"
    );
  }

  if (data === "tembak") {
    // Menangani tombol Tembak
    await ctx.answerCbQuery("Loading..."); // Menyelesaikan callback query
    // Bisa ditambahkan logika untuk menampilkan pilihan paket Tembak di sini
    userState.delete(userId);
    await handleCategoryFlow(
      ctx,
      userId,
      userState,
      "V1",
      `📌 *Pilih Kategori Tembak Berdasarkan Metode atau Jenis Paket*\n\n` +
        `1️⃣ *Pulsa* — Bayar menggunakan *saldo pulsa*\n` +
        `2️⃣ *E-Wallet* — Bayar menggunakan *eWallet* seperti *DANA*\n` +
        `3️⃣ *Akrab* — Paket Akrab Anggota & Pengelola\n` +
        `4️⃣ *Bebas Puas* — Paket Bebas Puas (Unlimited atau Harian)\n` +
        `5️⃣ *Masa Aktif* — Paket khusus perpanjang masa aktif kartu`,
      msgService
    );
  } else if (data === "tembakv2") {
    // Menangani tombol Tembak
    await ctx.answerCbQuery("Loading..."); // Menyelesaikan callback query
    // Bisa ditambahkan logika untuk menampilkan pilihan paket Tembak di sini
    userState.delete(userId);
    await handleCategoryFlow(
      ctx,
      userId,
      userState,
      "V2",
      `📌 *Pilih Kategori Tembak Berdasarkan Metode atau Jenis Paket*\n\n` +
        `1️⃣ *Pulsa* — Bayar menggunakan *saldo pulsa*\n` +
        `2️⃣ *E-Wallet* — Bayar menggunakan *eWallet* seperti *DANA*\n` +
        `3️⃣ *Akrab* — Paket Akrab Anggota & Pengelola\n` +
        `4️⃣ *Bebas Puas* — Paket Bebas Puas (Unlimited atau Harian)\n` +
        `5️⃣ *Masa Aktif* — Paket khusus perpanjang masa aktif kartu`,
      msgService
    );
  } else if (data === "akrab") {
  } else if (data === "cek_kuota") {
    // Menangani tombol Cek Kuota
    await ctx.answerCbQuery("Loading..."); // Menyelesaikan callback query
    userState.set(userId, { step: "menunggu_nomor" });
    msgService.sendButtons(
      ctx,
      "Silakan masukkan nomor dengan format 08xxx atau 628xxx:",
      [{ text: "Kembali ke Menu Utama", callback_data: "menu" }]
    );
    // Bisa ditambahkan logika untuk meminta nomor XL dan mengecek kuota
  } else if (data === "menu") {
    await ctx.answerCbQuery("Loading...");
    userState.delete(userId);
    msgService.sendPhotolocalWithButtons(
      ctx,
      config.BG_BANNER,
      config.MENUTEXT,
      mainButtons
    );
    // msgService.sendButtons(ctx, config.MENUTEXT, mainButtons);
  } else if (data === "otp") {
    // Menangani tombol Cek Kuota
    await ctx.answerCbQuery("Loading..."); // Menyelesaikan callback query
    userState.set(userId, { step: "menunggu_nomor_otp" });
    msgService.sendButtons(
      ctx,
      "Silakan masukkan nomor dengan format 08xxx atau 628xxx:",
      [{ text: "Kembali ke Menu Utama", callback_data: "menu" }]
    );
    // Bisa ditambahkan logika untuk meminta nomor XL dan mengecek kuota
  } else if (data === "owner_getproduct") {
    await ctx.answerCbQuery("Loading..."); // Menyelesaikan callback query
    // Bisa ditambahkan logika untuk menampilkan pilihan paket Tembak di sini
    userState.delete(userId);
    // Memanggil fungsi updatepaketv1 dan updatepaketv2 secara berurutan
    const resultV1 = await updatepaketv1(chalk, time);
    const resultV2 = await updatepaketv2(chalk, time);

    // Mengecek status dan memberikan respons sesuai hasil eksekusi
    if (resultV1.status && resultV2.status) {
      msgService.sendButtons(
        ctx,
        "✅ Pembaruan produk berhasil untuk Paket Data (V1 dan V2).",
        [{ text: "⬅️ Kembali", callback_data: "menu" }],
        "Markdown"
      );
    } else {
      // Menangani kesalahan dari V1
      if (!resultV1.status) {
        msgService.sendButtons(
          ctx,
          `❌ Terjadi kesalahan dalam memperbarui produk Paket Data V1. Message: ${resultV1.message}`,
          [{ text: "⬅️ Kembali", callback_data: "menu" }],
          "Markdown"
        );
      }

      // Menangani kesalahan dari V2
      if (!resultV2.status) {
        msgService.sendButtons(
          ctx,
          `❌ Terjadi kesalahan dalam memperbarui produk Paket Data V2. Message: ${resultV2.message}`,
          [{ text: "⬅️ Kembali", callback_data: "menu" }],
          "Markdown"
        );
      }
    }
  } else if (data.startsWith("brand_")) {
    await ctx.answerCbQuery("Loading..."); // Menyelesaikan callback query
    const brandKey = data.replace("brand_", "").toLowerCase();
    const state = userState.get(userId);
    if (!state || !state.data) return;

    const brandEntry = Object.entries(state.data).find(
      ([brand]) => brand.toLowerCase() === brandKey
    );
    if (!brandEntry) return;

    const [brandName, brandProducts] = brandEntry;

    // Cek apakah hanya ada satu produk yang berbeda
    if (brandProducts.length === 1) {
      const product = brandProducts[0];
      userState.set(userId, {
        step: "lihat_produk",
        brand: brandName,
        products: brandProducts,
        page: 0,
      });
      const categoryID = brandProducts[0].categoryID;
      let categoryName;

      if (categoryID === 1) {
        categoryName = "tembak";
      } else if (categoryID === 2) {
        categoryName = "tembakv2";
      } else {
        categoryName = "unknown"; // default jika categoryID tidak 1 atau 2
      }

      console.log("Category name:", categoryName);

      msgService.sendButtonsv2(
        ctx,
        `*\n━━━━━━━━━━━━━━━━━━━━━\n🚀 *DETAIL LIST PRODUK ${brandName} 🚀*\n━━━━━━━━━━━━━━━━━━━━━\n*\n${formatterMultiQuoteV2(
          [`1. ${product.name} : ${formatRupiah(product.price)}`]
        )}`,
        [
          [{ text: "1", callback_data: `choose_1` }],
          [{ text: "KEMBALI", callback_data: "categoryName" }],
        ]
      );
      return; // Jika hanya satu produk, langsung keluar
    }

    // Kalau produk lebih dari 1, lanjutkan pagination
    const { sliced, page, totalPages } = paginateProducts(brandProducts, 0);

    userState.set(userId, {
      step: "lihat_produk",
      brand: brandName,
      products: brandProducts,
      page: 0,
    });

    const productText = formatWrappedProductText(sliced);
    const formattedText = formatterMultiQuoteV2(productText); // Format dengan quote

    const buttons = generateProductButtons(sliced, page, totalPages);
    msgService.sendButtonsv2(
      ctx,
      `*\n━━━━━━━━━━━━━━━━━━━━━\n🚀 *DETAIL LIST PRODUK ${escapeMarkdown(
        brandName
      )} 🚀*\n━━━━━━━━━━━━━━━━━━━━━\n*\n${formattedText}`,
      buttons
    );
  } else if (data === "next_page" || data === "prev_page") {
    await ctx.answerCbQuery();
    const navState = userState.get(userId);
    if (!navState || navState.step !== "lihat_produk") return;

    const delta = data === "next_page" ? 1 : -1;
    let newPage = navState.page + delta;
    const maxPage = Math.ceil(navState.products.length / 8) - 1;
    newPage = Math.max(0, Math.min(newPage, maxPage));

    const paged = paginateProducts(navState.products, newPage);
    userState.set(userId, { ...navState, page: newPage });
    const productText = formatWrappedProductText(
      paged.sliced,
      paged.page,
      8,
      40
    );
    const formattedText = formatterMultiQuoteV2(productText); // Format dengan quote
    const newButtons = generateProductButtons(
      paged.sliced,
      paged.page,
      paged.totalPages
    );
    msgService.sendButtonsv2(
      ctx,
      `*\n━━━━━━━━━━━━━━━━━━━━━\n🚀 *DETAIL LIST PRODUK ${escapeMarkdown(
        navState.brand
      )} 🚀*\n━━━━━━━━━━━━━━━━━━━━━\n*\n${formattedText}`,
      newButtons
    );
  } else if (data.startsWith("choose_")) {
    await ctx.answerCbQuery();
    const chooseState = userState.get(userId);
    if (!chooseState || chooseState.step !== "lihat_produk") return;

    const actualIndex = parseInt(data.replace("choose_", "")) - 1;
    const selectedProduct = chooseState.products[actualIndex];

    if (selectedProduct) {
      const name = escapeMarkdown(selectedProduct.name);
      const price = escapeMarkdown(formatRupiah(selectedProduct.price));
      const otp = selectedProduct.otp;
      const des = escapeMarkdown(selectedProduct.details);
      const cat = selectedProduct.categoryID;
      const brand = selectedProduct.brand;
      const version = cat === 2 ? "tembakv2" : "tembak";

      // Simpan data produk ke state untuk pembayaran nanti
      userState.set(userId, {
        step: "konfirmasi_pembayaran",
        product: selectedProduct,
      });

      msgService.sendButtonsv2(
        ctx,
        `*\n━━━━━━━━━━━━━━━━━━━━━\n*✅ Paket:\n${name}\n*Harga: ${price}*\n━━━━━━━━━━━━━━━━━━━━━\n*Detail*\n━━━━━━━━━━━━━━━━━━━━━\n${formatDeskripsiMarkdownV2(
          des
        )}`,
        [
          [{ text: "Bayar Sekarang", callback_data: "bayar_now" }],
          [{ text: "Kembali!", callback_data: version }],
        ]
      );
    } else {
      msgService.sendText(ctx, "Produk tidak ditemukan.");
    }
  } else if (data === "bayar_now") {
    await ctx.answerCbQuery();
    const bayarState = userState.get(userId);
    if (!bayarState || bayarState.step !== "konfirmasi_pembayaran") return;

    // Update state agar siap menerima nomor telepon
    userState.set(userId, {
      step: "input_nomor",
      product: bayarState.product,
    });
    msgService.sendButtons(
      ctx,
      "📱 Silakan masukkan nomor dengan format 08xxx atau 628xxx:",
      [{ text: "Balik lah!", callback_data: "menu" }]
    );
  } else if (data.startsWith("pay_")) {
    await ctx.answerCbQuery();
    // Memecah data untuk mendapatkan metode, nomor, dan kode produk
    const [action, method, nomor, code] = data.split("_");
    const userData = userState.get(userId); // Ambil data pengguna dari userState
    // Format nomor (misalnya ganti 628 menjadi 08)
    const formattedNomor = formatNomor(nomor);
    console.log(userData.price);
    console.log(`Metode pembayaran: ${method}`);
    console.log(`Nomor yang diformat: ${formattedNomor}`);
    console.log(`Kode Produk: ${code}`);
    console.log(`harga Produk: ${userData.price}`);

    // Lakukan sesuatu dengan reference (misalnya, proses pembayaran)
    console.log(`Metode pembayaran yang dipilih: ${method}`);

    const user = await User.findOne({ where: { telegram_id: userId } });
    if (!user) {
      return { success: false, message: "User belum terdaftar" };
    }

    const balance = Number(user.balance);
    if (balance < Number(userData.price)) {
      return { success: false, message: "Saldo tidak cukup" };
    }
    // Memanggil fungsi beliviptunnel dan menunggu hasilnya
    const result = await beliviptunnel(code, formattedNomor, method);

    if (result.success) {
      console.log("Pembelian berhasil:", result.data);
      // Lakukan aksi setelah pembelian berhasil (misalnya, kirim pesan konfirmasi)
      const berhasilKurangSaldo = await kurangiSaldo(userId, userData.price);
      console.log("Kurangi saldo berhasil?", berhasilKurangSaldo);
      return msgService.sendButtons(ctx, "✅ Pembayaran berhasil.", [
        { text: "⬅️ BALIK AH!", callback_data: "menu" },
      ]);
    } else {
      console.log("Terjadi kesalahan:", result.message);
      // Lakukan aksi setelah pembelian gagal (misalnya, kirim pesan kesalahan)
      return msgService.sendButtons(
        ctx,
        `❌ Pembayaran gagal, Pesan : Metode Pembayaran Yang digunakan ditolak oleh sistem atau jika belum login silakan login otp dulu`,
        [
          { text: "⬅️ LOGIN OTP!", url: "https://t.me/Otp_onlyv2bot" },
          { text: "⬅️ BALIK AH!", callback_data: "menu" },
        ]
      );
    }
  } else if (data === "topup") {
    await ctx.answerCbQuery();
    const topupState = userState.get(userId);
    // Kamu bisa cek state sebelumnya jika mau, atau langsung set state topup
    userState.set(userId, { step: "input_nominal_topup" });

    msgService.sendButtons(
      ctx,
      "💰 *Silakan masukkan nominal topup Anda*\nMinimal *5.000*\nContoh: 10000",
      [{ text: "⬅️ Kembali", callback_data: "menu" }],
      "Markdown"
    );
  } else if (data.startsWith("cekBayar:")) {
    await ctx.answerCbQuery();
    const reference = data.split(":")[1];

    try {
      const res = await axios.get(
        `https://tripay.co.id/api/transaction/detail?reference=${reference}`,
        {
          headers: {
            Authorization: `Bearer ${config.TRIPAY_API_KEY}`,
          },
        }
      );

      const { amount_received, status } = res.data.data;

      if (status === "PAID") {
        const user = await User.findOne({ where: { telegram_id: userId } });
        if (user) {
          // Tambahkan amount_received
          const currentBalance = Number(user.balance || 0);
          user.balance = currentBalance + Number(amount_received);
          console.log("[Saldo Baru]", user.balance);

          await user.save();

          await ctx.answerCbQuery("Status Pembayaran Sukses");
          return msgService.sendButtons(
            ctx,
            "✅ Pembayaran berhasil, saldo sudah ditambahkan ke akunmu.",
            [{ text: "⬅️ BALIK AH!", callback_data: "menu" }]
          );
        } else {
          return ctx.reply("❌ User tidak ditemukan.");
        }
      } else if (status === "UNPAID") {
        await ctx.answerCbQuery("Status Pembayaran Pending");
        return msgService.sendButtons(
          ctx,
          "❗ Pembayaran belum diterima. Silakan click Konfirmasi Pembayaran.",
          [
            {
              text: "✅ Konfirmasi Pembayaran",
              callback_data: `cekBayar:${reference}`,
            },
            { text: "BALIK AH!", callback_data: "menu" },
          ]
        );
      } else {
        await ctx.answerCbQuery(`Status Pembayaran ${status}`);
        return msgService.sendButtons(ctx, `⚠️ Status saat ini: ${status}`, [
          {
            text: "✅ Konfirmasi Pembayaran",
            callback_data: `cekBayar:${reference}`,
          },
          { text: "BALIK AH!", callback_data: "menu" },
        ]);
      }
    } catch (err) {
      console.error(err);
      await ctx.reply("❌ Gagal memeriksa status pembayaran. Coba lagi nanti.");
      return msgService.sendButtons(
        ctx,
        "❌ Gagal memeriksa status pembayaran. Coba lagi nanti.",
        [
          {
            text: "✅ Konfirmasi Pembayaran",
            callback_data: `cekBayar:${reference}`,
          },
          { text: "BALIK AH!", callback_data: "menu" },
        ]
      );
    }
  } else if (data === "owner_add_user") {
    await ctx.answerCbQuery();
    const user = await checkIfUserExists(userId);

    if (!user || !user.isAdmin) {
      ctx.answerCbQuery("Akses ditolak!", { show_alert: true });

      return msgService.sendButtons(
        ctx,
        "Macem Macem Kamu ya, Akses ditolak!",
        [{ text: "BALIK NJIR!", callback_data: "menu" }]
      );
    }

    // Set state untuk input ID/username user baru
    userState.set(userId, { step: "input_add_user" });

    return msgService.sendButtons(
      ctx,
      `👤 Silakan masukkan ID Telegram dari user yang ingin ditambahkan.\nContoh: \`6273827811\``,
      [{ text: "BALIK AH!", callback_data: "menu" }]
    );
  } else if (data === "user_info") {
    await ctx.answerCbQuery();
    const telegram_id = userId;

    try {
      const user = await User.findOne({ where: { telegram_id } });

      if (!user) {
        return msgService.sendButtons(ctx, "❌ User tidak ditemukan.", [
          { text: "⬅️ Balik", callback_data: "menu" },
        ]);
      }

      // Pengecekan apakah user adalah admin
      const userData = await checkIfUserExists(telegram_id);
      let isAdmin = false;

      if (userData && userData.isAdmin) {
        isAdmin = true; // Set admin ke true jika user adalah admin
      }
      // Ambil informasi nama dan username dari Telegram
      const userInfo = await ctx.telegram.getChat(telegram_id);
      const name = userInfo.first_name;
      const username = userInfo.username || ""; // Jika user tidak punya username, kosongkan

      // Update data user
      user.name = name;
      user.username = username;
      user.is_admin = isAdmin; // Menetapkan status admin
      await user.save();
      // Ambil semua nomor dari OtpSession yang dimiliki user ini
      const otpSessions = await user.getOtp_sessions({
        attributes: ["phone"],
        group: ["phone"],
      });

      let nomorLogin = "\n_Belum ada nomor yang login._";

      if (otpSessions.length > 0) {
        nomorLogin =
          "━━━━━━━━━\n" +
          otpSessions.map((s) => `🏷️ ${s.phone}`).join("\n") +
          "\n━━━━━━━━━";
      }

      const info = `
      ────── ୨୧ ──────
          ℹ *Info User*
────── ୨୧ ──────
    🆔 ID Telegram: ${user.telegram_id}
    💰 Saldo: Rp ${Number(user.balance).toLocaleString("id-ID", {
      minimumFractionDigits: 2,
    })}
    🔐 Admin: ${user.is_admin ? "✅ Ya" : "❌ Tidak"}
    📛 Nama: ${user.name}
    💬 Username: ${user.username ? `@${user.username}` : "Tidak ada username"}
      
  Info Nomer Login
${nomorLogin}
      `;

      return msgService.sendButtons(ctx, info, [
        { text: "⬅️ Balik", callback_data: "menu" },
        { text: "💰 Topup", callback_data: "topup" },
      ]);
    } catch (error) {
      console.error("Gagal mengambil data user:", error);
      return msgService.sendButtons(
        ctx,
        "⚠️ Terjadi kesalahan saat mengambil info user.",
        [{ text: "⬅️ Balik", callback_data: "menu" }]
      );
    }
  } else if (data === "add_saldo") {
    await ctx.answerCbQuery();
    const userrole = await checkIfUserExists(userId);

    if (!userrole || !userrole.isAdmin) {
      ctx.answerCbQuery("Akses ditolak!", { show_alert: true });
      return msgService.sendButtons(
        ctx,
        "Macem Macem Kamu ya, Akses ditolak!",
        [{ text: "BALIK NJIR!", callback_data: "menu" }]
      );
    }

    const users = await User.findAll({
      attributes: ["telegram_id", "name"],
      order: [["createdAt", "DESC"]],
    });

    if (!users.length) {
      return msgService.sendButtons(ctx, "Masih belum ada yang daftar cui!", [
        { text: "BALIK NJIR!", callback_data: "menu" },
      ]);
    }

    let listnya = "*Add Saldo ke User:*\n\n";
    users.forEach((user, index) => {
      listnya += `${index + 1}. \`${user.telegram_id}\` - ${
        user.name || "-"
      }\n`;
    });

    listnya += `\n*Masukkan ID Telegram dan saldo seperti contoh:* \`60235647 40000\``;

    // Simpan step
    userState.set(userId, { step: "input_saldo_user" });

    return msgService.sendButtons(ctx, listnya, [
      { text: "⬅️ Balik", callback_data: "menu" },
    ]);
  } else if (data === "cek_stock") {
    await ctx.answerCbQuery();
    const result = await checkStock();
    console.log("datanya", result);
    if (result.status === true) {
      // Buat daftar stok paket yang tersedia (> 0)
      const tersedia = result.data.filter((pkg) => pkg.stok > 0);

      let datanya = "📦 *Stok Paket Tersedia:*\n\n";
      tersedia.forEach((pkg) => {
        datanya += `• ${pkg.name} [${pkg.stok}]\n`;
      });

      return msgService.sendButtons(ctx, datanya, [
        { text: "⬅️ Balik", callback_data: "menu" },
      ]);
    } else {
      return msgService.sendButtons(
        ctx,
        "❌ Gagal mengambil data stok:\n" + result.message,
        [{ text: "⬅️ Balik", callback_data: "menu" }]
      );
    }
  } else if (data === "set") {
    await ctx.answerCbQuery();
    userState.set(userId, { step: "input_range" });

    msgService.sendButtons(
      ctx,
      "💰 *Silakan masukkan nominal range up harga paket v1*",
      [{ text: "⬅️ Kembali", callback_data: "menu" }],
      "Markdown"
    );
  } else if (data === "setdua") {
    await ctx.answerCbQuery();
    userState.set(userId, { step: "input_ranged" });

    msgService.sendButtons(
      ctx,
      "💰 *Silakan masukkan nominal range up harga paket v2*",
      [{ text: "⬅️ Kembali", callback_data: "menu" }],
      "Markdown"
    );
  }
}

function formatNomor(nomor) {
  if (nomor.startsWith("62")) {
    // Jika nomor dimulai dengan "62", ganti menjadi "0"
    return "0" + nomor.slice(2);
  } else if (nomor.startsWith("08")) {
    // Jika nomor dimulai dengan "08", biarkan seperti apa adanya
    return nomor;
  }
  return nomor; // Kembalikan nomor tanpa perubahan jika tidak sesuai aturan
}
async function kurangiSaldo(userId, jumlah) {
  const user = await User.findOne({ where: { telegram_id: userId } });
  if (!user) return false;

  const pengurangan = Number(jumlah);
  if (isNaN(pengurangan)) return false;
  console.log("BALANCE TIPE DAN NILAI:", typeof user.balance, user.balance);

  user.balance = Number(user.balance) - pengurangan;

  await user.save();
  console.log("Saldo setelah dikurangi:", user.balance);
  return true;
}
async function checkStock() {
  try {
    const url = `${config.URL_REST_API_KMSP}${config.CHECK_STOCK_AKRAB_GLOBAL}${config.API_KEY_KMSP}`;
    const response = await axios.get(url);

    return response.data;
  } catch (error) {
    // Penanganan error jaringan atau server
    console.error("Gagal mengambil data stok:", error.message);
    return {
      statusCode: 500,
      status: false,
      message: "Terjadi kesalahan saat mengambil data stok.",
      data: [],
    };
  }
}

function formatDeskripsiMarkdownV2(text) {
  // Ganti <b>...</b> jadi bold *...*
  text = text.replace(/<b>(.*?)<\/b>/g, (_, inner) => `*${inner}*`);

  // Escape karakter MarkdownV2, KECUALI - yang digunakan di awal baris dan * untuk bold
  const escapeChars = ["`", "~", "|", "!"];
  const escapeRegex = new RegExp(
    "([" + escapeChars.map((c) => "\\" + c).join("") + "])",
    "g"
  );

  text = text.replace(escapeRegex, "\\$1");

  // Khusus karakter # di *808# juga harus di-escape
  text = text.replace(/\*(.*?)#(.*?)\*/g, (_, a, b) => `*${a}\\#${b}*`);

  // Biarkan tanda - di awal list tetap natural
  return text
    .split("\n")
    .map((line) => (line.trim() ? `• ${line}` : ""))
    .join("\n");
}

function escapeMarkdown(text) {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}
function formatterCode(text) {
  return `\`${text}\``; // Membungkus dengan satu backtick untuk inline code
}

function formatWrappedProductText(
  products,
  page = 0,
  perPage = 8,
  maxLineLength = 40
) {
  return products
    .map((product, i) => {
      const globalIndex = page * perPage + i + 1; // <- Penomoran sesuai halaman
      const numberPrefix = `${globalIndex}. `;
      const indent = " ".repeat(numberPrefix.length + 1);
      // Mengambil kategori berdasarkan id produk
      // Menyusun teks untuk produk
      let text = `${
        product.name
      }\n━━━━━━━━━━━━━━━━━━━\n*harga : *${formatRupiah(product.price)}`;
      if (product.categoryID === 2) {
        text += `\n\n${product.details}`;
      }
      text += "\n━━━━━━━━━━━━━━━━━━━";

      const wrapped = text
        .split("\n")
        .map((line, idx) => {
          const prefix = idx === 0 ? numberPrefix : indent;
          return wrapText(line, maxLineLength - prefix.length)
            .map((l, j) => (j === 0 ? prefix + l : indent + l))
            .join("\n");
        })
        .join("\n");

      return wrapped;
    })
    .join("\n\n");
}

function formatDescription(description, maxLineLength) {
  const lines = description.split("\n"); // Memecah berdasarkan baris baru
  const formatted = lines.map((line) => {
    return formatLine(line, maxLineLength);
  });

  return formatted.join("\n");
}

function formatLine(line, maxLineLength) {
  let formattedLine = "";
  while (line.length > maxLineLength) {
    let cut = line.lastIndexOf(" ", maxLineLength); // Cari spasi terakhir sebelum maxLength
    if (cut === -1) cut = maxLineLength; // Jika tidak ada spasi, potong di maxLineLength
    formattedLine += line.slice(0, cut) + "\n"; // Menambahkan baris baru
    line = line.slice(cut).trim(); // Sisakan bagian yang belum dipotong
  }

  formattedLine += line; // Menambahkan sisa bagian yang lebih pendek
  return formattedLine;
}

// Fungsi bantu: membungkus teks ke panjang tertentu
function wrapText(text, maxLength) {
  const words = text.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    if ((current + word).length <= maxLength) {
      current += word + " ";
    } else {
      lines.push(current.trim());
      current = word + " ";
    }
  }
  if (current.trim()) lines.push(current.trim());

  return lines;
}

async function handleCategoryFlow(
  ctx,
  userId,
  userState,
  categoryCode,
  title,
  msgService
) {
  const products = await productFetcher.getProductsByCategory(categoryCode);
  if (products.length === 0) {
    await msgService.sendText(
      ctx,
      `❌ Tidak ada produk untuk kategori ${categoryCode}.`
    );
    return;
  }

  const classified = classifyProducts(products);
  userState.set(userId, { step: "pilih_brand", data: classified });

  const brandButtons = Object.keys(classified).map((brand) => ({
    text: brand,
    callback_data: `brand_${brand.toLowerCase()}`,
  }));

  await msgService.sendButtons(ctx, title, [
    ...brandButtons,
    { text: "GA JADI AH!", callback_data: "menu" },
  ]);
}

function formatterMultiQuoteV2(text) {
  const escape = (str) =>
    str
      .replace(/-/g, "") // ganti semua tanda minus dengan spasi
      .replace(/[_\[\]()~`>#+=|{}.!]/g, "\\$&"); // escape karakter markdown lain

  // Fungsi untuk menghapus * yang tidak memiliki penutup
  const handleUnclosedAsterisk = (str) => {
    let result = "";
    let isInAsterisk = false;

    // Loop melalui setiap karakter untuk memeriksa pasangan asterisk
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "*" && !isInAsterisk) {
        isInAsterisk = true; // Memulai bold
      } else if (str[i] === "*" && isInAsterisk) {
        isInAsterisk = false; // Menutup bold
      } else {
        result += str[i]; // Menambahkan karakter selain *
      }
    }

    // Jika masih ada * yang tidak terpasang, hapus * yang tidak terpakai
    if (isInAsterisk) {
      result = result.replace(/\*/g, ""); // Menghapus * yang tidak terpakai
    }

    return result;
  };

  return text
    .split("\n")
    .map((line) => `> ${escape(handleUnclosedAsterisk(line))}`) // Memeriksa dan menghapus * yang tidak terpasang
    .join("\n");
}

function classifyProducts(products) {
  const classified = products.reduce((acc, product) => {
    const brand = product.brand || "Unknown Brand";
    const productCode = product.code || "Unknown Code";
    const deskripsi = product.deskripsi || "Unknown Code";
    const category = product.category_id || "Unknown Code";

    const key = `${product.name}_${productCode}`;
    if (!acc[brand]) acc[brand] = [];
    if (!acc[brand].some((p) => p.code === productCode)) {
      acc[brand].push({
        name: product.name,
        price: product.price,
        code: product.code,
        otp: product.otp,
        deskripsi: product.alias,
        details: deskripsi,
        categoryID: category,
        brand: brand,
        metode: product.metode,
      });
    }
    return acc;
  }, {});

  // Sortir tiap brand berdasarkan harga
  for (const brand in classified) {
    classified[brand].sort((a, b) => a.price - b.price);
  }

  return classified;
}

function paginateProducts(products, page = 0, perPage = 8) {
  const totalPages = Math.ceil(products.length / perPage);
  const sliced = products.slice(page * perPage, (page + 1) * perPage);
  return {
    sliced,
    page,
    totalPages,
  };
}

function renderProductText(products, page, perPage = 8) {
  return products
    .map(
      (p, i) =>
        `${page * perPage + i + 1}. ${p.name} : ${formatRupiah(p.price)}`
    )
    .join("\n");
}

function formatRupiah(price) {
  return `Rp ${Number(price).toLocaleString("id-ID", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}`;
}

function generateProductButtons(products, page, totalPages, perPage = 8) {
  const globalIndexOffset = page * perPage;

  const row1 = products.slice(0, 4).map((_, i) => ({
    text: `${globalIndexOffset + i + 1}`,
    callback_data: `choose_${globalIndexOffset + i + 1}`,
  }));

  const row2 = products.slice(4, 8).map((_, i) => ({
    text: `${globalIndexOffset + i + 5}`,
    callback_data: `choose_${globalIndexOffset + i + 5}`,
  }));

  const nav = [];
  if (page > 0) nav.push({ text: "⏮ Prev", callback_data: "prev_page" });
  if (page < totalPages - 1)
    nav.push({ text: "⏭ Next", callback_data: "next_page" });
  const categoryID = products[0].categoryID;
  let categoryName;

  if (categoryID === 1) {
    categoryName = "tembak";
  } else if (categoryID === 2) {
    categoryName = "tembakv2";
  } else {
    categoryName = "unknown"; // default jika categoryID tidak 1 atau 2
  }

  console.log("Category name:", categoryName);
  return [
    row1,
    ...(row2.length ? [row2] : []),
    nav,
    [{ text: "KEMBALI", callback_data: categoryName }],
  ];
}

async function updatepaketv1(chalk, time) {
  const url = `${config.URL_REST_API_KMSP}${config.GET_LIST_PRODUCT}${config.API_KEY_KMSP}`;

  try {
    // Mendapatkan data produk dari API
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
        Host: "my.kmsp-store.com",
        Connection: "Keep-Alive",
      },
    });

    // Cek status response dari API
    if (response.data.status === false) {
      console.log("Layanan sedang dalam pemeliharaan.");
      return {
        status: false,
        message: "Layanan sedang dalam pemeliharaan. Coba lagi nanti!",
      }; // Kembalikan status false dengan pesan
    }

    const products = response.data.data;
    console.log(
      `${time()}\n${chalk.blue("[PRODUCT DATA]\n")}` +
        `${chalk.gray(JSON.stringify(response.data.data, null, 2))}`
    );

    // Hapus produk sebelumnya berdasarkan kategori
    await deleteProductsByCategoryName("V1");

    // Simpan produk ke dalam database
    for (const product of products) {
      let category = await Category.findOne({
        where: { code: "v1" },
      });

      let brand = null;
      const name = product.package_name_alias_short?.toLowerCase() || "";

      // Deteksi brand khusus
      if (product.no_need_login === false) {
        brand = "PAKET OTP";
      } else if (name.includes("akrab")) {
        brand = "AKRAB";
      } else if (name.includes("bebas puas")) {
        brand = "BEBAS PUAS";
      }

      // Jika kategori tidak ditemukan, buat kategori baru
      if (!category) {
        category = await Category.create({
          name: "V1", // Nama kategori, sesuaikan dengan data Anda
          code: "v1", // Kode kategori
          icon: "📶", // Sesuaikan dengan kebutuhan Anda
        });
        console.log(`Kategori ${category.name} berhasil ditambahkan.`);
      }

      if (!brand) {
        console.log(
          `Produk ${product.package_name_alias_short} dilewati karena tidak cocok brand.`
        );
        continue; // Lewati produk yang tidak cocok
      }
      const paymentMethods = product.available_payment_methods
        .map((item) => item.payment_method) // Ambil setiap payment_method
        .join(", "); // Gabungkan menjadi string dengan koma
      // Upsert produk ke dalam database, dengan relasi category_id
      await Product.upsert(
        {
          name: product.package_name_alias_short, // Nama produk
          alias: product.package_name, // Alias produk
          code: product.package_code, // Kode produk
          price: product.package_harga_int + config.RANGE_UP, // Harga produk
          base_price: product.package_harga_int, // Harga dasar produk
          provider: "manual", // Sumber produk
          brand: brand, // Merek produk
          deskripsi: product.package_description || "No description", // Deskripsi produk
          is_active: true, // Status aktif produk
          otp: product.no_need_login, // OTP perlu aktif
          category_id: category.id, // Mengaitkan produk dengan kategori
          metode: paymentMethods,
        },
        {
          where: {
            code: product.package_code, // Mencocokkan berdasarkan kode produk
          },
        }
      );
      console.log(
        `Produk ${product.package_name_alias_short} berhasil disimpan ke database.`
      );
    }

    return {
      status: true,
      message: "Produk berhasil diambil dan disimpan di database.",
    };
  } catch (error) {
    console.error("Error fetching package list:", error.message);
    return {
      status: false,
      message:
        "Terjadi kesalahan dalam mengambil daftar produk. Coba lagi nanti!",
    };
  }
}

async function updatepaketv2(chalk, time) {
  try {
    const response = await axios.get(config.END_POINT_VIP_TUNNEL, {
      headers: {
        Authorization: `Bearer ${config.API_KEY_VIP_TUNNEL}`,
        "api-key": "public-darktunneling",
      },
    });

    console.log(
      `${time()}\n` +
        `${chalk.blue("[PRODUCT DATA V2]\n")}` +
        `${chalk.gray(JSON.stringify(response.data, null, 2))}`
    );

    if (response.status === false) {
      console.log("⚠️ Layanan sedang dalam pemeliharaan. Coba lagi nanti!");
      return {
        status: false,
        message: "Layanan sedang dalam pemeliharaan. Coba lagi nanti!",
      };
    }

    const products = response.data.data;

    // Pastikan produk adalah array
    if (!Array.isArray(products)) {
      console.log("Data produk tidak ditemukan atau bukan array:", products);
      return {
        status: false,
        message: "Data produk tidak valid atau kosong.",
      };
    }

    // Hapus semua produk kategori V2
    await deleteProductsByCategoryName("V2");

    for (const product of products) {
      let category = await Category.findOne({
        where: { code: "v2" },
      });

      if (!category) {
        category = await Category.create({
          name: "V2",
          code: "v2",
          icon: "📶",
        });
        console.log(`Kategori ${category.name} berhasil ditambahkan.`);
      }

      let brand = null;
      const name = product.name?.toLowerCase() || "";

      if (name.includes("addons")) {
        brand = "ADDONS";
      } else if (name.includes("masa aktif")) {
        brand = "MASA AKTIF";
      } else if (name.includes("xtra combo")) {
        brand = "XTRA COMBO";
      } else if (name.includes("unlimited")) {
        brand = "UNLIMITED";
      } else {
        // Jika produk tidak cocok dengan kategori yang sudah ada, masukkan dalam kategori "LAINNYA"
        brand = "LAINNYA";
      }

      if (!brand) {
        console.log(
          `Produk ${product.name} dilewati karena tidak cocok brand.`
        );
        continue;
      }

      const metodebyr = Array.isArray(product.payment_method)
        ? product.payment_method.join(", ") // Gabungkan jika array
        : "BALANCE"; // Default jika bukan array
      console.log("jumlah range up = ", product.prices + config.RANGE_UP_V2);
      await Product.upsert(
        {
          name: product.name,
          alias: `${
            product.keterangan && product.keterangan !== "-"
              ? product.keterangan
              : ""
          } Harga bayar pakai pulsa/ewalet : ${product.total_price}`,
          code: product.uuid,
          price: product.prices + config.RANGE_UP_V2,
          base_price: product.total_price,
          provider: "manual",
          brand: brand,
          deskripsi: `${
            product.keterangan && product.keterangan !== "-"
              ? product.keterangan
              : ""
          } Harga bayar pakai pulsa/ewalet : ${product.total_price}`,
          is_active: product.status === "active",
          otp: true,
          metode: metodebyr,
          category_id: category.id,
        },
        {
          where: {
            code: product.uuid,
          },
        }
      );

      console.log(`Produk ${product.name} berhasil disimpan ke database.`);
    }

    return {
      status: true,
      message: "Produk berhasil diambil dan disimpan di database.",
    };
  } catch (error) {
    console.error("Error fetching product list:", error.message);
    return {
      status: false,
      message:
        "Terjadi kesalahan dalam mengambil daftar produk. Coba lagi nanti!",
    };
  }
}

async function deleteProductsByCategoryName(categoryName) {
  try {
    // Temukan category_id berdasarkan nama kategori "v1"
    const category = await Category.findOne({
      where: { name: categoryName },
    });

    if (!category) {
      console.log("Kategori tidak ditemukan");
      return;
    }

    const categoryId = category.id;

    // Hapus produk yang terkait dengan category_id
    const deletedCount = await Product.destroy({
      where: { category_id: categoryId },
    });

    if (deletedCount > 0) {
      console.log(`${deletedCount} produk berhasil dihapus.`);
    } else {
      console.log("Tidak ada produk yang ditemukan untuk dihapus.");
    }
  } catch (error) {
    console.error("Error menghapus produk:", error);
  }
}

async function beliviptunnel(uuid, msisdn, method) {
  const payload = {
    uuid: uuid,
    msisdn: msisdn,
    method: method,
  };

  const headers = {
    Authorization: `Bearer ${config.API_KEY_VIP_TUNNEL}`,
    "api-key": "public-darktunneling",
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(
      config.END_POINT_VIP_TUNNEL_BELI,
      payload,
      { headers }
    );

    console.log("Response:", response.data);

    // Mengembalikan response dengan format success, message, dan data
    return {
      success: true,
      message: "Pembelian berhasil",
      data: response.data, // data dari API
    };
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );

    // Mengembalikan error dengan format success, message, dan data error
    return {
      success: false,
      message: error.response ? error.response.data : error.message,
      data: null, // tidak ada data karena gagal
    };
  }
}

module.exports = handleCallback;
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
