const chalk = require("chalk");
const config = require("../config");
const Utils = require("../services/utils");
const { User, OtpSession } = require("../models");
const axios = require("axios");
const crypto = require("crypto");

const baseURL = config.API_CEK_DOMPUL;
const logTime = () => chalk.gray(`[${new Date().toLocaleTimeString("id-ID")}]`);

async function handleCommand(ctx, msgService, userState) {
  // Cara pakai
  const mainButtons = await Utils.getMainButtons(ctx);
  const userId = ctx.from.id;
  const txt = ctx.message.text.trim();

  if (userState.get(userId)?.step === "menunggu_nomor") {
    const isValid = /^(08|628)\d{8,12}$/.test(txt);
    if (isValid) {
      userState.delete(userId);
      await msgService.sendText(ctx, "_Tunggu, sedang dalam pengecekan..._");
      const nomor = txt.startsWith("628") ? txt.replace(/^628/, "08") : txt;
      console.log(
        `${logTime()} ${chalk.blue("[NOMOR TELEPON]")} -> ${chalk.yellow(
          ctx.from?.username || ctx.from.id
        )}: ${chalk.gray(nomor)}`
      );
      await msgService.SendCallBackCheckNumber(ctx, baseURL, nomor);
    } else {
      msgService.sendButtons(
        ctx,
        "❌ Nomor tidak valid. Masukkan format 08xxx atau 628xxx.",
        [{ text: "Kembali ke Menu Utama", callback_data: "menu" }]
      );
    }
    return;
  } else if (userState.get(userId)?.step === "menunggu_nomor_otp") {
    const isValid = /^(08|628)\d{8,12}$/.test(txt);
    if (isValid) {
      const nomor = txt.startsWith("628") ? txt.replace(/^628/, "08") : txt;
      await msgService.sendText(ctx, "_Tunggu, sedang dalam pengecekan..._");

      const datareq = await reqOtp(nomor);

      if (datareq.success) {
        // Simpan auth_id dan state untuk user
        userState.set(userId, {
          step: "menunggu_kode_otp",
          nomor,
          auth_id: datareq.data.auth_id, // pastikan auth_id dari API masuk ke response reqOtp
        });

        await msgService.sendButtons(
          ctx,
          "📥 Kode OTP berhasil dikirim ke nomor kamu. Silakan ketik kodenya sekarang.",
          [{ text: "🔙 Kembali ke Menu", callback_data: "menu" }]
        );
      } else {
        userState.delete(userId);
        await msgService.sendButtons(ctx, datareq.message, [
          { text: "🔙 Kembali ke Menu", callback_data: "menu" },
        ]);
      }
    } else {
      msgService.sendButtons(
        ctx,
        "❌ Nomor tidak valid. Masukkan format 08xxx atau 628xxx.",
        [{ text: "Kembali ke Menu Utama", callback_data: "menu" }]
      );
    }
    return;
  } else if (userState.get(userId)?.step === "menunggu_kode_otp") {
    const { nomor, auth_id } = userState.get(userId);

    if (!/^\d{6}$/.test(txt)) {
      await msgService.sendText(
        ctx,
        "❌ Format OTP salah. Masukkan 6 digit angka."
      );
      return;
    }

    await msgService.sendText(ctx, "_Sedang memverifikasi OTP..._");
    const telegram_id = userId;
    const user = await User.findOne({ where: { telegram_id } });
    const loginResult = await loginWithOtp(nomor, auth_id, txt);

    if (loginResult.success) {
      userState.delete(userId);
      // lanjut ke menu utama atau simpan session, token, dsb
      const existingSession = await OtpSession.findOne({
        where: { phone: nomor },
      });

      if (existingSession) {
        await existingSession.update({
          auth_id: auth_id,
          access_token: loginResult.token || null,
          user_id: user?.id || null,
        });
      } else {
        await OtpSession.create({
          user_id: user?.id || null,
          phone: nomor,
          auth_id: auth_id,
          access_token: loginResult.token || null,
        });
      }
      await msgService.sendButtons(ctx, loginResult.message, [
        { text: "🔁 Login Ke nomor Lain", callback_data: "otp" },
        { text: "🔙 Kembali ke Menu", callback_data: "menu" },
      ]);
    } else {
      await msgService.sendButtons(ctx, loginResult.message, [
        { text: "🔁 Coba Lagi", callback_data: "login" },
        { text: "🔙 Kembali ke Menu", callback_data: "menu" },
      ]);
    }
  } else if (txt && userState.get(userId)?.step === "input_nomor") {
    const nomor = txt.trim();
    const { product } = userState.get(userId);
    console.log("NO_REQUIRED_OTP ?", product.otp);
    // Validasi nomor
    if (!/^08\d{8,13}$/.test(nomor) && !/^628\d{7,13}$/.test(nomor)) {
      return msgService.sendButtons(
        ctx,
        "❌ Nomor tidak valid. Masukkan format 08xxx atau 628xxx.",
        [{ text: "Kembali ke Menu Utama", callback_data: "menu" }]
      );
    }

    // Cek saldo user
    const balance = await getUserBalance(userId);
    if (balance === null) {
      return msgService.sendButtons(ctx, "❌ User belum terdaftar.", [
        { text: "Kembali ke Menu Utama", callback_data: "menu" },
      ]);
    }
    console.log(product);
    if (balance < product.price) {
      return msgService.sendButtons(ctx, "❌ Saldo tidak cukup.", [
        { text: "Kembali ke Menu Utama", callback_data: "menu" },
      ]);
    }

    await msgService.sendText(ctx, "_Tunggu, trx sedang diproses..._");
    // Proses pembayaran
    let result = [];

    if (product.otp === true) {
      // Jika tidak butuh OTP
      if (product.categoryID === 2) {
        const formattedPrice = extractAndFormatPrice(product.deskripsi);
        console.log("price", product.price);
        const metodeArray = product.metode
          .split(", ")
          .map((method) => method.trim());
        if (formattedPrice) {
          const data = {
            nomor,
            code: product.code,
            price: product.price,
          };
          userState.set(userId, data);
          const buttons = metodeArray.map((method) => ({
            text: method, // Nama metode pembayaran sebagai teks tombol
            callback_data: `pay_${method}_${nomor}_${product.code}`, // Callback data untuk mengidentifikasi tombol yang dipilih
          }));
          // Menambahkan tombol "Back" di akhir tombol metode pembayaran
          buttons.push({
            text: "Back", // Tombol untuk kembali ke menu utama
            callback_data: "tembakv2", // Callback data untuk tombol back
          });
          return msgService.sendButtons(
            ctx,
            `Pilih Metode Pembayaran dibawah ini\nSaldo bot mu akan berkurang : ${parseInt(
              product.price
            ).toLocaleString(
              "id-ID"
            )}\nYang harus kamu bayar menggunakan Pulsa/Ewalet sebesar ${formattedPrice}`,
            buttons
          );
        } else {
          return msgService.sendButtons(
            ctx,
            `Pilih Metode Pembayaran\nSaldo bot mu akan berkurang : ${parseInt(
              product.price
            ).toLocaleString(
              "id-ID"
            )}\nYang harus kamu bayar menggunakan Pulsa/Ewalet sebesar Rp 0`,
            [{ text: "Kembali ke Menu Utama", callback_data: "menu" }]
          );
        }
      }
      result = await bayarPaketNoOtp(
        userId,
        product.code,
        product.price,
        nomor
      );
    } else {
      const otpSession = await OtpSession.findOne({ where: { phone: nomor } });

      if (!otpSession || !otpSession.access_token) {
        return msgService.sendButtons(
          ctx,
          "❌ Access token tidak ditemukan. Silakan login ulang.",
          [{ text: "LOGIN OTP", callback_data: "otp" }]
        );
      }

      const access_token = otpSession.access_token;
      // Jika butuh OTP
      result = await bayarPaket(
        userId,
        product.code,
        product.price,
        access_token
      );
    }

    console.log("RESULTNYA", result);
    if (result.success === true) {
      const berhasilKurangSaldo = await kurangiSaldo(userId, product.price);
      console.log("Kurangi saldo berhasil?", berhasilKurangSaldo);
      if (!berhasilKurangSaldo) {
        msgService.sendButtonsv2(
          ctx,
          `❌ User belum terdaftar saat melakukan pembelian`,
          [{ text: "Kembali Ke Menu!", callback_data: "menu" }]
        );
      }
      if (result.deeplink_url) {
        msgService.sendButtonsv2(
          ctx,
          `✅ ${escapeMarkdownV2(
            `Paket berhasil dibuat untuk ${nomor}\n\nKlik tombol *BAYAR* di bawah untuk melanjutkan pembayaran via e-wallet.\n\n` +
              `💡 *Catatan:* Jika pembayaran berhasil lewat *Dana*, maka pembelian akan otomatis berhasil.`
          )}`,
          [
            { text: "🔗 BAYAR", url: result.deeplink_url },
            { text: "Kembali ke Menu!", callback_data: "menu" },
          ]
        );
      } else {
        msgService.sendButtonsv2(ctx, `✅ Pembayaran berhasil untuk ${nomor}`, [
          { text: "Kembali Ke Menu!", callback_data: "menu" },
        ]);
      }
    } else {
      msgService.sendButtonsv2(
        ctx,
        `❌ Gagal melakukan pembayaran, ${escapeMarkdownV2(
          result.message || "Lagi Maintenance"
        )}`,
        [{ text: "Kembali Ke Menu!", callback_data: "menu" }]
      );
    }
    userState.delete(userId);
  } else if (userState.get(userId)?.step === "input_add_user") {
    const input = ctx.message.text.trim();

    // Validasi input: hanya menerima angka (telegram ID)
    if (!/^\d{5,20}$/.test(input)) {
      return msgService.sendButtons(
        ctx,
        "❌ Format tidak valid. Masukkan hanya ID Telegram (angka saja).",
        [{ text: "Balik Ya", callback_data: "menu" }]
      );
    }

    // Lanjut ke logika menambahkan user...
    await addUserByInput(input);
    // (nanti di sini akan dicek apakah user sudah ada, lalu simpan ke database)

    userState.delete(userId); // Reset state setelah input

    return msgService.sendButtons(
      ctx,
      `✅ User dengan identitas ${input} sudah berhasil ditambahkan.`,
      [
        { text: "🔍 Info User", callback_data: `user_info` },
        { text: "⬅️ Balik Ya", callback_data: "menu" },
      ]
    );
  } else if (userState.get(userId)?.step === "input_saldo_user") {
    console.log("[STEP] input_saldo_user dipicu oleh:", userId);
    const parts = txt.split(" ");
    console.log("[INPUT TEXT]", parts);

    if (parts.length !== 2) {
      return msgService.sendButtonsv2(
        ctx,
        "❌ Format salah Gunakan format: `telegram_id saldo`, contoh:\n`60235647 40000`",
        [{ text: "Kembali Ke Menu!", callback_data: "menu" }]
      );
    }

    const [targetId, saldoStr] = parts;
    const saldo = parseInt(saldoStr);
    console.log("[Parsed ID & Saldo]", targetId, saldo);

    if (isNaN(saldo)) {
      return msgService.sendButtonsv2(
        ctx,
        "❌ Nominal saldo harus berupa angka.",
        [
          { text: "Kembali add saldo!", callback_data: "add_saldo" },
          { text: "Kembali Ke Menu!", callback_data: "menu" },
        ]
      );
    }

    const user = await User.findOne({ where: { telegram_id: targetId } });
    console.log("[User Ditemukan]", user?.name, user?.balance);

    if (!user) {
      return msgService.sendButtonsv2(
        ctx,
        "❌ User tidak ditemukan dengan ID tersebut.",
        [
          { text: "Kembali add saldo!", callback_data: "add_saldo" },
          { text: "Kembali Ke Menu!", callback_data: "menu" },
        ]
      );
    }

    // Pastikan balance-nya angka
    const currentBalance = Number(user.balance || 0);
    user.balance = currentBalance + Number(saldo);
    console.log("[Saldo Baru]", user.balance);

    await user.save();
    console.log("[SAVED] Balance updated");

    // Reset step
    userState.set(userId, { step: null });

    return msgService.sendButtonsv2(
      ctx,
      `────── ୨୧ ──────\n` +
        `✅ Berhasil menambahkan *Rp ${saldo.toLocaleString()}*\n` +
        `────── ୨୧ ──────\n` +
        `🆔 User : *${user.name || "null"}*\n` +
        `💰 Saldo akhir : *Rp ${user.balance.toLocaleString()}*`,
      [
        { text: "Kembali add saldo!", callback_data: "add_saldo" },
        { text: "Kembali Ke Menu!", callback_data: "menu" },
      ]
    );
  } else if (userState.get(userId)?.step === "input_nominal_topup") {
    const nominal = parseInt(ctx.message.text);
    if (isNaN(nominal) || nominal < config.TRIPAY_MINIMAL_TOPUP) {
      return msgService.sendButtons(
        ctx,
        "❌ Minimal Top up 5.000. Contoh: 10000",
        [{ text: "⬅️ Menu", callback_data: "menu" }]
      );
    }

    userState.set(userId, { step: null });

    // Lanjut proses ke Tripay, misalnya:
    await msgService.sendText(ctx, "_Tunggu, Topup sedang diproses..._");

    const tripayRes = await createTripayTransaction(userId, nominal);
    if (!tripayRes)
      return msgService.sendButtons(
        ctx,
        "❌ Gagal membuat transaksi topup. Coba lagi.",
        [{ text: "⬅️ Menu", callback_data: "menu" }]
      );

    const expiredText = new Date(tripayRes.expired_time * 1000).toLocaleString(
      "id-ID",
      {
        timeZone: "Asia/Jakarta",
      }
    );

    const msg =
      `✅ Topup sebesar *Rp ${nominal.toLocaleString(
        "id-ID"
      )}* berhasil dibuat!\n\n` +
      `💳 Metode: *${tripayRes.payment_name}*\n` +
      `🧾 Kode Bayar: \`${tripayRes.pay_code || "Lihat QR"}\`\n` +
      (tripayRes.qr_url ? `📷 QR: [Klik di sini](${tripayRes.qr_url})\n` : "") +
      `📅 Exp: ${expiredText}\n\n` +
      `🔁 Segera lakukan pembayaran sebelum waktu expired.\n\n` +
      `👉 Setelah melakukan pembayaran, klik *Konfirmasi* di bawah untuk memverifikasi status transaksi Anda.`;

    return msgService.sendPhotoWithButtons(ctx, tripayRes.qr_url, msg, [
      { text: "Bayar Sekarang", url: tripayRes.checkout_url },
      {
        text: "✅ Konfirmasi",
        callback_data: `cekBayar:${tripayRes.reference}`,
      },
      { text: "⬅️ Menu", callback_data: "menu" },
    ]);
  } else if ("/menu") {
    msgService.sendPhotolocalWithButtons(
      ctx,
      config.BG_BANNER,
      config.MENUTEXT,
      mainButtons
    );
    // msgService.sendButtons(ctx, config.MENUTEXT, mainButtons);
  } else {
    msgService.sendButtons(ctx, "❌ Maaf Perintah Tidak Dikenali.", [
      { text: "Kembali ke Menu Utama", callback_data: "menu" },
    ]);
  }
}
function escapeMarkdownV2(text) {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

const reqOtp = async (phoneNumber) => {
  const url = `${config.URL_REST_API_KMSP}${config.REQUEST_OTP}${config.API_KEY_KMSP}&phone=${phoneNumber}&method=OTP`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
        Host: "my.kmsp-store.com",
        Connection: "Keep-Alive",
      },
    });

    // Menampilkan response dari API
    console.log(response.data);

    // Memeriksa status response
    if (response.data.status === false) {
      // Jika status false, layanan sedang dalam pemeliharaan atau error
      return {
        success: false,
        message: "Layanan sedang dalam pemeliharaan. Coba lagi nanti.",
      };
    }

    // Jika status true, OTP berhasil diminta
    if (response.data.status === true) {
      return {
        success: true,
        message: response.data.message,
        data: response.data.data, // <== penting: kirim seluruh objek data!
      };
    }
  } catch (error) {
    console.error("Error requesting OTP:", error.message);
    return {
      success: false,
      message: "Terjadi kesalahan saat meminta OTP. Coba lagi nanti.",
    };
  }
};

const loginWithOtp = async (phoneNumber, authId, otpCode) => {
  const url = `${config.URL_REST_API_KMSP}${config.LOGIN_OTP}${config.API_KEY_KMSP}&phone=${phoneNumber}&method=OTP&auth_id=${authId}&otp=${otpCode}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
        Host: "my.kmsp-store.com",
        Connection: "Keep-Alive",
      },
    });

    console.log("LOGIN RESULT:", response.data);

    if (response.data.status === true) {
      return {
        success: true,
        message: response.data.message || null,
        token: response.data.data?.access_token || null, // simpan kalau perlu
      };
    } else {
      return {
        success: false,
        message: response.data.message || "OTP salah atau sudah kedaluwarsa.",
      };
    }
  } catch (error) {
    console.error("Error login OTP:", error.message);
    return {
      success: false,
      message: "Terjadi kesalahan saat login. Coba lagi nanti.",
    };
  }
};

async function getUserBalance(userId) {
  const user = await User.findOne({ where: { telegram_id: userId } });

  if (!user) {
    return null; // user tidak ditemukan
  }

  return parseFloat(user.balance);
}

function extractAndFormatPrice(deskripsi) {
  // Regex untuk mencari angka setelah kata "Harga bayar pakai pulsa/ewalet :"
  const regex = /Harga bayar pakai pulsa\/ewalet : (\d+)/;
  const match = deskripsi.match(regex);

  if (match && match[1]) {
    // Ambil angka yang ditemukan
    const price = match[1];

    // Format angka menjadi format dengan pemisah ribuan
    const formattedPrice = parseInt(price).toLocaleString("id-ID"); // Menggunakan format Indonesia (ribuan dengan titik)

    return formattedPrice;
  }

  return null; // Jika tidak ditemukan
}

async function addUserByInput(input) {
  // Validasi ID Telegram (harus angka)
  if (!/^\d{5,20}$/.test(input)) {
    return { success: false, message: "Format ID Telegram tidak valid." };
  }

  const telegram_id = input;

  // Cek apakah user sudah ada
  const existingUser = await User.findOne({ where: { telegram_id } });

  if (existingUser) {
    return { success: false, message: "User sudah terdaftar." };
  }
  // Tambahkan user baru
  const newUser = await User.create({
    telegram_id,
    balance: 0, // default balance
    isAdmin: false, // default bukan admin
  });

  return { success: true, user: newUser };
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

async function bayarPaket(userId, kodeProduk, hargaProduk, access_token) {
  try {
    const user = await User.findOne({ where: { telegram_id: userId } });
    if (!user) {
      return { success: false, message: "User belum terdaftar" };
    }

    const balance = Number(user.balance);
    if (balance < Number(hargaProduk)) {
      return { success: false, message: "Saldo tidak cukup" };
    }

    const apiUrl = `${config.URL_REST_API_KMSP}${config.BELI_PRODUCT_OTP}${config.API_KEY_KMSP}&access_token=${access_token}&package_code=${kodeProduk}`;

    const response = await axios.get(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Host: "my.kmsp-store.com",
        Connection: "Keep-Alive",
      },
      timeout: 30000,
    });

    const result = response.data;
    console.log("HASIL PANGGILAN API", result);
    if (result.statusCode === 200 && result.status === true) {
      const deeplink = result.data?.deeplink_data?.deeplink_url;
      return {
        success: true,
        message: result.message,
        deeplink_url: deeplink && deeplink !== "" ? deeplink : null,
      };
    } else {
      return { success: false, message: result.message || "Gagal dari API" };
    }
  } catch (error) {
    console.error("Error bayar paket:", error.message);
    return { success: false, message: "Terjadi kesalahan sistem" };
  }
}

async function bayarPaketNoOtp(userId, kodeProduk, hargaProduk, nomor) {
  try {
    const user = await User.findOne({ where: { telegram_id: userId } });
    if (!user) {
      return { success: false, message: "User belum terdaftar" };
    }

    const balance = Number(user.balance);
    if (balance < Number(hargaProduk)) {
      return { success: false, message: "Saldo tidak cukup" };
    }

    const apiUrl = `${config.URL_REST_API_KMSP}${config.BELI_PRODUCT_NOOTP}${config.API_KEY_KMSP}&access_token=${access_token}&package_code=${kodeProduk}&phone=${nomor}`;

    const response = await axios.get(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Host: "my.kmsp-store.com",
        Connection: "Keep-Alive",
      },
      timeout: 30000,
    });

    const result = response.data;
    console.log("HASIL PANGGILAN API", result);
    if (result.statusCode === 200 && result.status === true) {
      const deeplink = result.data?.deeplink_data?.deeplink_url;
      return {
        success: true,
        message: result.message,
        deeplink_url: deeplink && deeplink !== "" ? deeplink : null,
      };
    } else {
      return { success: false, message: result.message || "Gagal dari API" };
    }
  } catch (error) {
    console.error("Error bayar paket:", error.message);
    return { success: false, message: "Terjadi kesalahan sistem" };
  }
}

async function createTripayTransaction(userId, nominal) {
  const merchantRef = `TOPUP-${userId}-${Date.now()}`;

  const signature = crypto
    .createHmac("sha256", config.TRIPAY_PRIVATE_KEY)
    .update(`${config.TRIPAY_MERCHANT_CODE}${merchantRef}${nominal}`)
    .digest("hex");

  const expiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 jam dari sekarang

  const payload = {
    method: config.TRIPAY_METHODE_PEMBAYARAN, // bisa diganti ke metode lain
    merchant_ref: merchantRef,
    amount: nominal,
    customer_name: `User ${userId}`,
    customer_email: "default@email.com",
    customer_phone: userId,
    order_items: [
      {
        sku: "TOPUP",
        name: "Topup Saldo",
        price: nominal,
        quantity: 1,
        product_url: "https://yourdomain.com/topup",
        image_url: "https://yourdomain.com/logo.png",
      },
    ],
    callback_url: "https://yourdomain.com/callback",
    return_url: "https://yourdomain.com/thanks",
    expired_time: expiry,
    signature: signature,
  };

  try {
    const res = await axios.post(
      "https://tripay.co.id/api/transaction/create",
      payload,
      {
        headers: {
          Authorization: `Bearer ${config.TRIPAY_API_KEY}`,
        },
        validateStatus: function (status) {
          return status < 999; // biar tetap masuk catch kalau error dari API
        },
      }
    );

    if (res.data.success) {
      return res.data.data;
    } else {
      console.error("Tripay Response Error", res.data);
      return null;
    }
  } catch (err) {
    console.error("Tripay Request Error", err.response?.data || err.message);
    return null;
  }
}

module.exports = handleCommand;
