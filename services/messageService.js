const { Markup } = require("telegraf");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const dayjs = require("dayjs");
const axios = require("axios");

const time = () => chalk.gray(`[${dayjs().format("HH:mm:ss")}]`);

class MessageService {
  constructor(bot, userLastMessageMap) {
    this.bot = bot;
    this.userLastMessageMap = userLastMessageMap;
  }

  // Kirim pesan teks biasa
  // Contoh memperbaiki sendText
  async sendText(ctx, text) {
    await this.deletePreviousMessage(ctx);
    console.log(
      `${time()} ${chalk.blue("[KIRIM TEKS]")} -> ${chalk.yellow(
        ctx.from?.username || ctx.from.id
      )}: ${chalk.gray(text)}`
    );
    const sentMsg = await ctx.reply(text, {
      parse_mode: "Markdown", // Menggunakan markdown untuk format teks
    });

    console.log(`${chalk.yellow("pesanID" || ctx.from.id)}`);

    return this.userLastMessageMap.set(ctx.from.id, sentMsg.message_id);
  }

  async deletePreviousMessage(ctx) {
    const userId = ctx.from.id;
    const lastMessageId = this.userLastMessageMap.get(userId);
    if (lastMessageId) {
      try {
        await ctx.telegram.deleteMessage(userId, lastMessageId);
      } catch (err) {
        console.warn("Gagal menghapus pesan sebelumnya:", err.message);
      }
    }
  }

  // Kirim pesan dengan tombol inline
  async sendButtons(ctx, text, buttons = []) {
    await this.deletePreviousMessage(ctx);
    console.log(
      `${time()} ${chalk.blue("[KIRIM TOMBOL]")} -> ${chalk.yellow(
        ctx.from?.username || ctx.from.id
      )}: ${chalk.gray(text)}`
    );

    let keyboard = [];

    if (Array.isArray(buttons[0])) {
      // Sudah dalam bentuk baris-baris tombol
      keyboard = buttons;
    } else {
      // Flat array, ubah ke baris per 2 tombol
      for (let i = 0; i < buttons.length; i += 2) {
        keyboard.push(buttons.slice(i, i + 2));
      }
    }

    const sentMsg = await ctx.reply(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(keyboard),
    });

    return this.userLastMessageMap.set(ctx.from.id, sentMsg.message_id);
  }

  //send gambar, text, dan buttons
  async sendPhotoWithButtons(ctx, photoUrl, caption, buttons = []) {
    await this.deletePreviousMessage(ctx);
    console.log(
      `${time()} ${chalk.green("[KIRIM FOTO+TOMBOL]")} -> ${chalk.yellow(
        ctx.from?.username || ctx.from.id
      )}: ${chalk.gray(caption)}`
    );

    let keyboard = [];

    if (Array.isArray(buttons[0])) {
      keyboard = buttons;
    } else {
      for (let i = 0; i < buttons.length; i += 2) {
        keyboard.push(buttons.slice(i, i + 2));
      }
    }

    // Validasi URL gambar dan encode caption jika diperlukan
    if (!/^https?:\/\/[^\s]+$/i.test(photoUrl)) {
      return console.error("Invalid photo URL: ", photoUrl);
    }

    const sentMsg = // Kirim gambar terlebih dahulu
      await ctx.replyWithPhoto(
        { url: photoUrl },
        {
          caption: caption, // Caption yang sudah di-escape
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: keyboard },
        }
      );
    return this.userLastMessageMap.set(ctx.from.id, sentMsg.message_id);
  }

  // send gambar lokal, text dan button
  async sendPhotolocalWithButtons(ctx, photoPath, caption, buttons = []) {
    await this.deletePreviousMessage(ctx);
    console.log(
      `${time()} ${chalk.green("[KIRIM FOTO+TOMBOL]")} -> ${chalk.yellow(
        ctx.from?.username || ctx.from.id
      )}: ${chalk.gray(caption)}`
    );

    let keyboard = [];

    if (Array.isArray(buttons[0])) {
      keyboard = buttons;
    } else {
      for (let i = 0; i < buttons.length; i += 2) {
        keyboard.push(buttons.slice(i, i + 2));
      }
    }

    // Validasi apakah file gambar ada di path lokal
    const fs = require("fs");
    if (!fs.existsSync(photoPath)) {
      return console.error("File not found: ", photoPath);
    }

    const sentMsg = // Kirim gambar lokal
      await ctx.replyWithPhoto(
        { source: photoPath }, // Menggunakan source untuk file lokal
        {
          caption: caption, // Caption yang sudah di-escape
          parse_mode: "MarkdownV2",
          reply_markup: { inline_keyboard: keyboard },
        }
      );
    return this.userLastMessageMap.set(ctx.from.id, sentMsg.message_id);
  }

  async sendButtonsjson(ctx, text, buttons = []) {
    await this.deletePreviousMessage(ctx);
    console.log(
      `${time()} ${chalk.blue("[KIRIM TOMBOL]")} -> ${chalk.yellow(
        ctx.from?.username || ctx.from.id
      )}: ${chalk.gray(text)}`
    );

    let keyboard = [];

    if (Array.isArray(buttons[0])) {
      // Sudah dalam bentuk baris-baris tombol
      keyboard = buttons;
    } else {
      // Flat array, ubah ke baris per 2 tombol
      for (let i = 0; i < buttons.length; i += 2) {
        keyboard.push(buttons.slice(i, i + 2));
      }
    }

    // Menangani Markdown yang tidak ditutup
    let fixedText = text;

    // Tambahkan penutup jika ada tanda * yang tidak ditutup
    fixedText = fixedText.replace(/([_*])([^_*]+)$/g, "$1$2$1"); // Menutup * atau _ yang tidak ditutup

    // Bisa juga memeriksa untuk tanda-tanda lain seperti `~~` atau `[]()` jika diperlukan.
    fixedText = fixedText.replace(/([~`])([^~`]+)$/g, "$1$2$1"); // Untuk strikethrough atau inline code

    // Kirim pesan dengan Markdown yang sudah diperbaiki
    const sentMsg = await ctx.reply(fixedText, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(keyboard),
    });

    return this.userLastMessageMap.set(ctx.from.id, sentMsg.message_id);
  }

  async sendButtonsv2(ctx, text, buttons = []) {
    await this.deletePreviousMessage(ctx);
    console.log(
      `${time()} ${chalk.blue("[KIRIM TOMBOL]")} -> ${chalk.yellow(
        ctx.from?.username || ctx.from.id
      )}: ${chalk.gray(text)}`
    );

    let keyboard = [];

    if (Array.isArray(buttons[0])) {
      // Sudah dalam bentuk baris-baris tombol
      keyboard = buttons;
    } else {
      // Flat array, ubah ke baris per 2 tombol
      for (let i = 0; i < buttons.length; i += 2) {
        keyboard.push(buttons.slice(i, i + 2));
      }
    }
    const sentMsg = await ctx.reply(text, {
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard(keyboard),
    });

    return this.userLastMessageMap.set(ctx.from.id, sentMsg.message_id);
  }
  // Kirim pesan dengan tombol inline, dan text bisa dicopy
  async sendButtonsWithCopyText(ctx, text, buttons = []) {
    await this.deletePreviousMessage(ctx);
    console.log(
      `${time()} ${chalk.blue("[KIRIM TOMBOL]")} -> ${chalk.yellow(
        ctx.from?.username || ctx.from.id
      )}: ${chalk.gray(text)}`
    );

    // Membagi tombol menjadi baris sesuai kebutuhan
    const keyboard = [];

    // Membagi tombol dalam baris 2 tombol per baris
    for (let i = 0; i < buttons.length; i += 2) {
      keyboard.push(buttons.slice(i, i + 2)); // Ambil 2 tombol setiap iterasi
    }

    const sentMsg = await ctx.reply(text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(keyboard),
    });

    return this.userLastMessageMap.set(ctx.from.id, sentMsg.message_id);
  }

  // Kirim gambar
  sendPhoto(ctx, imagePath, caption = "") {
    console.log(
      `${time()} ${chalk.blue("[KIRIM GAMBAR]")} -> ${chalk.yellow(
        ctx.from?.username || ctx.from.id
      )}: ${chalk.gray(imagePath)}`
    );
    return ctx.replyWithPhoto(
      { source: fs.createReadStream(imagePath) },
      { caption }
    );
  }

  // Kirim file (dokumen)
  sendFile(ctx, filePath, caption = "") {
    console.log(
      `${time()} ${chalk.blue("[KIRIM FILE]")} -> ${chalk.yellow(
        ctx.from?.username || ctx.from.id
      )}: ${chalk.gray(filePath)}`
    );
    return ctx.replyWithDocument(
      { source: fs.createReadStream(filePath) },
      { caption }
    );
  }

  // Kirim video
  sendVideo(ctx, videoPath, caption = "") {
    console.log(
      `${time()} ${chalk.blue("[KIRIM VIDEO]")} -> ${chalk.yellow(
        ctx.from?.username || ctx.from.id
      )}: ${chalk.gray(videoPath)}`
    );
    return ctx.replyWithVideo(
      { source: fs.createReadStream(videoPath) },
      { caption }
    );
  }

  // Kirim audio
  sendAudio(ctx, audioPath, caption = "") {
    console.log(
      `${time()} ${chalk.blue("[KIRIM AUDIO]")} -> ${chalk.yellow(
        ctx.from?.username || ctx.from.id
      )}: ${chalk.gray(audioPath)}`
    );
    return ctx.replyWithAudio(
      { source: fs.createReadStream(audioPath) },
      { caption }
    );
  }

  // Kirim tautan
  sendLink(ctx, url, text = "") {
    const message = `${text}\n${url}`;
    console.log(
      `${time()} ${chalk.blue("[KIRIM LINK]")} -> ${chalk.yellow(
        ctx.from?.username || ctx.from.id
      )}: ${chalk.gray(url)}`
    );
    return ctx.reply(message);
  }

  chunkButtons(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  formatHasilHTMLtoPlain(html, originalInputNomor) {
    const cleaned = html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/===========================/g, "=======================")
      .trim();

    const lines = cleaned
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    let result = "✅┏━━━━━━━━━┓✅\n";
    result += "       🤖   Cek Kuota!   🤖\n"; // Menambahkan padding (spasi) agar teks di tengah
    result += "✅┗━━━━━━━━━┛✅";
    result += "```\n";
    result += "📋 Laporan Cek Kuota:\n\n\n\n\n";

    // ambil dari line kedua karena MSISDN udah kita override
    for (let i = 1; i < lines.length; i++) {
      result += lines[i] + "\n";
    }

    result += "```";

    return result;
  }

  async SendCallBackCheckNumber(ctx, baseURL, nomor) {
    try {
      const response = await axios.get(`${baseURL}${nomor}&isJSON=true`, {
        headers: {
          Authorization: "Basic c2lkb21wdWxhcGk6YXBpZ3drbXNw",
          "X-API-Key": "4352ff7d-f4e6-48c6-89dd-21c811621b1c",
          "X-App-Version": "3.0.0",
        },
      });
      if (response.data.message === "SUCCESS") {
        console.log(
          `${time()} ${chalk.blue("[RESPONSE]")} -> ${chalk.yellow(
            ctx.from?.username || ctx.from.id
          )}: ${chalk.gray(JSON.stringify(response.data, null, 2))}`
        );

        const htmlHasil = response.data?.data?.hasil || "Tidak ada hasil.";
        const hasil = this.formatHasilHTMLtoPlain(htmlHasil, nomor);
        console.log(
          `${time()} ${chalk.blue("[RESPONSE]")} -> ${chalk.yellow(
            ctx.from?.username || ctx.from.id
          )}: ${chalk.gray(JSON.stringify(response.data.data, null, 2))}`
        );
        await this.sendButtonsWithCopyText(ctx, hasil, [
          { text: "🔁 Cek Nomor Lagi", callback_data: "cek_kuota" },
          { text: "🔙 Kembali ke Menu", callback_data: "menu" },
        ]);
      }
    } catch (err) {
      console.error("Error cek kuota:", err.message);
      this.sendText(ctx, "❌ Gagal mengambil data. Silakan coba lagi nanti.");
    }
  }

  escapeMarkdownV2(text) {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
  }
}

module.exports = MessageService;
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
