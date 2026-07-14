const mongoose = require('mongoose');

const uri = "mongodb://jayedurnirob7_db_user:0L52dkyLXrqkxXiU@ac-axqmzrp-shard-00-00.aeqhou4.mongodb.net:27017,ac-axqmzrp-shard-00-01.aeqhou4.mongodb.net:27017,ac-axqmzrp-shard-00-02.aeqhou4.mongodb.net:27017/query_sheet_db?ssl=true&replicaSet=atlas-aw6fs3-shard-0&authSource=admin&retryWrites=true&w=majority&appName=QuerySheetData";

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("SUCCESS DIRECT WITH CORRECT REPLICA SET");
    process.exit(0);
  })
  .catch(err => {
    console.error("ERROR:", err.message);
    process.exit(1);
  });
