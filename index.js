const { sequelize } = require('./models');

async function syncDB() {
  try {
    // await sequelize.sync({ alter: true }); // alter = update struktur tanpa drop
    await sequelize.sync({ force: true }); // force = delete semua data dan buat baru (migrate fresh)
    console.log('✅ Semua table berhasil disinkronkan dengan database!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal sinkronisasi:', err);
    process.exit(1);
  }
}

syncDB();
