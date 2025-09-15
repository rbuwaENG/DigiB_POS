const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("@seald-io/nedb");
const path = require("path");
const validator = require("validator");
const appName = process.env.APPNAME;
const appData = process.env.APPDATA;

const dbPath = path.join(appData, appName, "server", "databases", "suppliers.db");

app.use(bodyParser.json());

module.exports = app;

let suppliersDB = new Datastore({ filename: dbPath, autoload: true });

suppliersDB.ensureIndex({ fieldName: "_id", unique: true });

app.get("/", function (req, res) {
  res.send("Suppliers API");
});

// List all suppliers
app.get("/all", function (req, res) {
  suppliersDB.find({}, function (err, docs) {
    if (err) return res.status(500).json({ error: "Internal Server Error", message: err.message });
    res.send(docs);
  });
});

// Get supplier by id
app.get("/supplier/:id", function (req, res) {
  if (!req.params.id) return res.status(400).send("ID field is required.");
  suppliersDB.findOne({ _id: req.params.id }, function (err, doc) {
    if (err) return res.status(500).json({ error: "Internal Server Error", message: err.message });
    res.send(doc);
  });
});

// Create supplier
app.post("/supplier", function (req, res) {
  const now = new Date().toISOString();
  const body = req.body || {};
  const supplier = {
    _id: (function(){
      if (typeof body.supplier_id === 'number') return body.supplier_id;
      if (typeof body.supplier_id === 'string' && /^\d+$/.test(body.supplier_id)) return parseInt(body.supplier_id,10);
      return Date.now();
    })(),
    name: validator.escape(String(body.name || "")),
    contact_info: validator.escape(String(body.contact_info || "")),
    payment_status: validator.escape(String(body.payment_status || "")),
    payment_date: validator.escape(String(body.payment_date || "")),
    amount_due: Number(body.amount_due || 0),
    amount_paid: Number(body.amount_paid || 0),
    created_at: body.created_at || now,
    updated_at: body.updated_at || now,
    history: Array.isArray(body.history) ? body.history : [],
  };

  suppliersDB.insert(supplier, function (err, doc) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error", message: "An unexpected error occurred." });
    }
    res.status(200).send(doc);
  });
});

// Update supplier
app.put("/supplier", function (req, res) {
  const body = req.body || {};
  let id = body.supplier_id ?? body._id;
  if (typeof id === 'string' && /^\d+$/.test(id)) id = parseInt(id,10);
  if (!id) return res.status(400).json({ error: "Bad Request", message: "supplier_id is required" });

  body.updated_at = new Date().toISOString();

  suppliersDB.update({ _id: id }, { $set: body }, {}, function (err, numReplaced) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error", message: "An unexpected error occurred." });
    }
    res.sendStatus(200);
  });
});

// Delete supplier
app.delete("/supplier/:id", function (req, res) {
  suppliersDB.remove({ _id: req.params.id }, {}, function (err, numRemoved) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error", message: "An unexpected error occurred." });
    }
    res.sendStatus(200);
  });
});

// Append payment history entry
app.post("/supplier/:id/history", function (req, res) {
  let id = req.params.id;
  if (typeof id === 'string' && /^\d+$/.test(id)) id = parseInt(id,10);
  const entry = req.body || {};
  entry.created_at = entry.created_at || new Date().toISOString();

  suppliersDB.findOne({ _id: id }, function (err, doc) {
    if (err) return res.status(500).json({ error: "Internal Server Error", message: err.message });
    const history = (doc && Array.isArray(doc.history)) ? doc.history.slice() : [];
    history.push({ amount: Number(entry.amount || 0), date: entry.date || new Date().toISOString(), note: entry.note || '' });

    suppliersDB.update({ _id: id }, { $set: { history: history, updated_at: new Date().toISOString() } }, {}, function (err2) {
      if (err2) return res.status(500).json({ error: "Internal Server Error", message: err2.message });
      res.sendStatus(200);
    });
  });
});


