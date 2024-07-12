const express = require("express");
app = express();
const cors = require("cors");

const Vendor = require("./Routes/Vendor");
const select = require("./Routes/select");
const admins = require("./Routes/admins");
const customerpo = require("./routes/customerpo");
const vendorpo = require("./Routes/vendorpo");
const expensetype = require("./Routes/expensetype");
const clients = require("./Routes/clients");
const servicecategory = require("./Routes/servicecategory");
const paymentterms = require("./Routes/paymentterms");
const employeeclaim = require("./Routes/employeeclaim");
const employee = require("./Routes/employee");
const mept = require("./Routes/mept");
const claim_type = require("./Routes/claim_type");
const purchaseorder = require("./Routes/purchaseorder");
const frt_room = require("./Routes/frt_room");
const usrmas = require("./Routes/usermaster");
const role = require("./Routes/role");
const project = require("./Routes/p_project");
const level = require("./Routes/level");
const empproject = require("./Routes/empproject");
const p_exp = require("./Routes/p_expensetype");
const att = require("./Routes/attendance");
const appclaim = require("./Routes/appclaim");
const vs = require("./Routes/vehicle_service");
const pclaim = require("./Routes/p_claim");
const prehandler = require("./Routes/prehandler");
const vreport = require("./Routes/vehiclereport");
const empclmnorm = require("./Routes/employeenormal");

const swaggerUi = require("swagger-ui-express");

var options = {
  swaggerOptions: { url: "http://petstore.swagger.io/v2/swagger.json" },
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(null, options));

var compress = require("compression");
var helmet = require("helmet");
const bodyParser = require("body-parser");

const IP = "192.168.4.216", port = 9090; //Develop

app.use(cors());
app.use(compress());
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));

app.use(function (req, res, next) {
  console.log(
    // 'req.headers : ', req.headers,
    "System IP :",
    req.ip,
    "\n\rLocal IP :",
    req.connection.remoteAddress,
    "\n\rreq Origin :",
    req.url,
    "\n\rreq Origin Ip :",
    req.headers.origin
  );
  next();
});

app.use(
  helmet({
    frameguard: { action: "deny" },
  })
);

app.use("/login", require("./Routes/login"));
app.use("/*", prehandler);
app.use("/api/Vendor", Vendor);
app.use("/api/select", select);
app.use("/api/admins", admins);
app.use("/api/customerpo", customerpo);
app.use("/api/vendorpo", vendorpo);
app.use("/api/expensetype", expensetype);
app.use("/api/clients", clients);
app.use("/api/servicecategory", servicecategory);
app.use("/api/BuyerDetails", require("./Routes/BuyerDetails"));
app.use("/api/paymentterms", paymentterms);
app.use("/api/employeeclaim", employeeclaim);
app.use("/api/employee", employee);
app.use("/api/mept", mept);
app.use("/api/claim_type", claim_type);
app.use("/api/vehicle", require("./Routes/vehicle"));
app.use("/api/purchaseorder", purchaseorder);
app.use("/api/frt_room", frt_room);
app.use("/usrmas", usrmas);
app.use("/role", role);
app.use("/project", project);
app.use("/level", level);
app.use("/eproj", empproject);
app.use("/pexp", p_exp);
app.use("/att", att);
app.use("/app", appclaim);
app.use("/vs", vs);
app.use("/pclaim", pclaim);
app.use("/vehiclereport", vreport);
app.use("/api/empclmnorm", empclmnorm);
app.use("/fuelcard", require("./Routes/fuelcard"));
app.use("/prtype", require("./Routes/p_prtype"));
app.use("/fuelcard", require("./Routes/fuelcard"));

app.listen(port, IP, () => {
  console.log("Backend running on:" + IP + ":" + port);
});