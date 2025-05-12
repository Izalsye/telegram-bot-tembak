const { Telegraf } = require("telegraf");
const chalk = require("chalk");
const ora = require("ora");
const dayjs = require("dayjs");

const config = require("./config");
const syncProducts = require("./services/syncProductsFromDigiflazz");
const userLastMessageMap = new Map();
const MessageService = require("./services/messageService");
const handleCommand = require("./handlers/commandHandler");
const handleCallback = require("./handlers/callbackHandler");
const { checkIfUserExists } = require("./handlers/userHelper");
const { message } = require("telegraf/filters");
const Utils = require("./services/utils");
const bot = new Telegraf(config.TOKEN_BOT);
const msgService = new MessageService(bot, userLastMessageMap);
const userState = new Map(); // Track state input user
const spinner = ora({
  text: chalk.green("Bot izalsye sedang berjalan..."),
  spinner: "dots",
}).start();

// Jalankan sinkronisasi produk saat bot mulai
// syncProducts.fetchAndSyncProducts()
//   .then(() => spinner.succeed("✅ Produk Digiflazz berhasil disinkronkan!"))
//   .catch(err => spinner.fail("❌ Gagal sync produk Digiflazz: " + err.message));

// Logger waktu
const logTime = () => chalk.gray(`[${dayjs().format("HH:mm:ss")}]`);

// Start bot handler
bot.start(async (ctx) => {
  spinner.succeed("✅ Produk Digiflazz berhasil disinkronkan!");
  const mainButtons = await Utils.getMainButtons(ctx);
  const telegramId = ctx.from.id;
  const user = await checkIfUserExists(telegramId);
  const name = ctx.from?.username || ctx.from?.first_name;
  if (user && user.isAdmin) {
    console.log(`${logTime()} Pemilik bot, ID Telegram: ${telegramId}`);
    msgService.sendPhotolocalWithButtons(ctx, config.BG_BANNER, config.MENUTEXT, mainButtons);
    // msgService.sendButtons(ctx, config.MENUTEXT, mainButtons); // Pesan selamat datang khusus untuk pemilik bot
  } else if (!user) {
    console.log(`${logTime()} Pengguna baru, ID Telegram: ${telegramId}`);
    msgService.sendButtons(
      ctx,
      "Selamat datang! Kamu belum terdaftar, harap lakukan registrasi...",
      [
        {
          text: "HUBUNGI",
          url: `tg://user?id=${config.OWNER_TELEGRAM}`, // Ganti dengan ID Telegram pemilik
        },
      ]
    );

    // Kamu bisa melanjutkan proses registrasi di sini
  } else {
    console.log(
      `${logTime()} Pengguna terdaftar: ${ctx.from.username} (${telegramId})`
    );
    msgService.sendButtons(ctx, config.MENUTEXT, mainButtons); // Pesan selamat datang yang kamu atur
  }
});

// Callback handler (tombol)
bot.on("callback_query", (ctx) => handleCallback(ctx, msgService, userState));

// Text command handler
bot.on(message("text"), (ctx) => handleCommand(ctx, msgService, userState));

// Jalankan bot
bot.launch();

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
