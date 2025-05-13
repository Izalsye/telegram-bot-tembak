const { Telegraf } = require("telegraf");
const chalk = require("chalk");
const ora = require("ora");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
const { User, OtpSession } = require("./models");
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
    msgService.sendPhotolocalWithButtons(
      ctx,
      config.BG_BANNER,
      config.MENUTEXT,
      mainButtons
    );
    // msgService.sendButtons(ctx, config.MENUTEXT, mainButtons); // Pesan selamat datang khusus untuk pemilik bot
  } else if (!user) {
    console.log(`${logTime()} Pengguna baru, ID Telegram: ${telegramId}`);
    await addUserByInput(telegramId, name);
    // Kamu bisa melanjutkan proses registrasi di sini
    msgService.sendPhotolocalWithButtons(
      ctx,
      config.BG_BANNER,
      config.MENUTEXT,
      mainButtons
    );
  } else {
    console.log(
      `${logTime()} Pengguna terdaftar: ${ctx.from.username} (${telegramId})`
    );
    msgService.sendPhotolocalWithButtons(
      ctx,
      config.BG_BANNER,
      config.MENUTEXT,
      mainButtons
    ); // Pesan selamat datang yang kamu atur
  }
});

// Callback handler (tombol)
bot.on("callback_query", (ctx) => handleCallback(ctx, msgService, userState));

// Text command handler
bot.on(message("text"), (ctx) => handleCommand(ctx, msgService, userState));

// Jalankan bot
bot.launch();
async function addUserByInput(input, nama) {
  // Tambahkan user baru
  const newUser = await User.create({
    telegram_id: input,
    balance: 0, // default balance
    isAdmin: false, // default bukan admin
    name: nama,
  });

  return { success: true, user: newUser };
}
// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
