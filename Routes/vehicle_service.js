"use strict";
const express = require("express"),
  vs = express.Router(),
  pool = require("../connection/connection"),
  poolPromise = require("../connection/connection").poolpromise;
const multer = require("multer");
const path = require("path");
var fs = require("fs");
const { log } = require("console");
const joiValidate = require("../schema/vehicle_service");

////****Vehicle Service****/
async function addvs(req) {
  return new Promise(async (resolve, reject) => {
    let data = req.body == null ? req : req.body,jwt_data = req.jwt_data,errorvalue = [],conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `SELECT EXISTS ( SELECT vechicleid,vsdate,invdate,invno,invamt,districtid,servietype,
            km,paymentdate,paymentamt,utr,paytoid,payto,paytoempid,billstatus,billreciveddate,billtype,quort,
            estimate,proinv,orginv,claimreceiveddate,vsnote,claimamt,stateid,service_item
            FROM vehicle_service where vechicleid='${data.vehicleno}' && invno='${data.invoiceno}' ) count`;
        console.log("Service Query", sqlquery);
        let resp = await conn.query(sqlquery),service_item = "";
        console.log("result", resp[0][0].count);
        if (resp[0][0].count == 1) {
          console.log("Vehicleid Exists");
          errorvalue.push({ msg: "Vehicle Service Exists", err_code: 1 });
          await conn.rollback();
        } else {
          console.log(data.serviceitem.length);
          if (data.serviceitem.length) {
            service_item = data.serviceitem.toString().replace("[", "").replace("]", "");
            console.log("service_item :", service_item);
          }
          let sqlinsert = `insert into veremaxpo.vehicle_service set vechicleid=${data.vehicleno},
            vsdate='${data.vsdate}', invdate='${data.invdate}',invno='${data.invoiceno}',
            invamt='${data.invoamt}',districtid=${data.cluster},stateid=${data.circle_name},
            km=${data.drivenkms},service_item='${service_item}',paymentdate='${data.paymdate}',
            paymentamt=${data.paymamt},utr='${data.utrno}',payto='${data.paymto}',billstatus=${data.billstatus},
            cby=${jwt_data.user_id},cdate=NOW()`;

          if (data.billrecdate) sqlinsert += ` ,billreciveddate='${data.billrecdate}'`;
          if (data.servtype) sqlinsert += ` ,servietype = ${data.servtype}`;
          if (data.acc_no) sqlinsert += ` ,bank_act_no='${data.acc_no}'`;
          if (data.ifsc_code) sqlinsert += ` ,ifsc_code='${data.ifsc_code}'`;
          if (data.servremark) sqlinsert += ` ,vsnote='${data.servremark}'`;
          if (data.srvc) sqlinsert += ` ,servicecentre='${data.srvc}'`;
          if (data.empid) sqlinsert += ` ,paytoempid=${data.empid}`;

          console.log("insert query", sqlinsert);
          let result = await conn.query(sqlinsert);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='VEHICLE SERVICE INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres["affectedRows"] > 0 && logres["insertId"] > 0)
              console.log("Log Added Successfully");
              errorvalue.push({ msg: "Vehicle Service Added Successfully", err_code: 0, id: result[0]["insertId"] });
              await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 1 });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("Catch Error", err);
        console.log({ msg: "Please Enter Required Fields", err_code: 42 });
        await conn.rollback();
      }
    } else {
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("Add Vehicle Service Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

vs.post("/addvs", async (req, res) => {
  req.setTimeout(864000000);
  console.log("Add Vehicle Service-----",req.body);
  const validation = joiValidate.vehicleserviceDataSchema.validate(req.body);
  if (validation.error) {
      console.log(validation.error.details);
      return res.json([{ msg: validation.error.details[0].message, err_code: '91' }]);
  }
  let result = await addvs(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

vs.post("/listsrvehicle", function (req, res) {
  let data = req.body,where = [],finalresult = [];
  let sqlbus = ` SELECT vs.vsid,vs.vechicleid,v.regno,DATE_FORMAT(vs.vsdate, '%Y-%m-%d') vsdate,
  vs.km,vs.servicecentre,DATE_FORMAT(vs.invdate,'%Y-%m-%d') invdate,vs.invno,vs.invamt,
  d.name district_name,vst.servicetypename,DATE_FORMAT(vs.paymentdate, '%Y-%m-%d') paymentdate,
  vs.paymentamt,vs.utr,vs.paytoid,vs.payto,e.full_name,e.emp_id employeeid,vs.billstatus,
  DATE_FORMAT(vs.billreciveddate, '%Y-%m-%d') billreciveddate,vs.billtype,vs.quort,vs.estimate,
  vs.service_item,vs.paytoempid,vs.claimreceiveddate,vs.vsnote,vs.bank_act_no,vs.ifsc_code,s.name,
  GROUP_CONCAT(vsi.servicetypename) servicetypename
  FROM vehicle_service vs
  LEFT JOIN vechicle v ON v.id =vs.vechicleid
  LEFT JOIN districts d  ON d.id= vs.districtid
  LEFT JOIN vehicle_service_type vst ON vst.vstid= vs.servietype
  LEFT JOIN employee e ON e.emp_id_pk= vs.paytoempid
  LEFT JOIN states s ON s.id=vs.stateid
  LEFT JOIN vehicle_service_item vsi ON FIND_IN_SET(vsi.vsitid,vs.service_item) `,
    sqlqueryc = ` SELECT count(*) total FROM vehicle_service vs
  LEFT JOIN vechicle v ON v.id =vs.vechicleid
  LEFT JOIN districts d  ON d.id= vs.districtid
  LEFT JOIN vehicle_service_type vst ON vst.vstid= vs.servietype
  LEFT JOIN employee e ON e.emp_id_pk= vs.paytoempid
  LEFT JOIN states s ON s.id=vs.stateid
  LEFT JOIN vehicle_service_item vsi ON FIND_IN_SET(vsi.vsitid,vs.service_item) `;

  if (data.hasOwnProperty("like") && data.like)
    where.push(' v.regno LIKE "%' + data.like + '%"');
  if (data.hasOwnProperty("vechicleid") && data.vechicleid)
    where.push(" vs.vechicleid= " + data.vechicleid);
  if (data.hasOwnProperty("state_id") && data.state_id)
    where.push(" s.id= " + data.state_id);
  if (data.hasOwnProperty("cluster") && data.cluster)
    where.push("vs.districtid= " + data.cluster);
  if (data.hasOwnProperty("invno") && data.invno)
    where.push(" vs.vsid= " + data.invno);

  if (where.length > 0) {
    sqlbus += " where" + where.join(" AND ");
    sqlqueryc += " where " + where.join(" AND ");
  }

  if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
    sqlbus += " Group BY vs.vsid LIMIT " + data.index + ", " + data.limit;
  } else {
    sqlbus += " Group BY vs.vsid ";
  }
  console.log("Get Count Query :", sqlbus);
  console.log("Data: ", data);
  pool.getConnection((err, conn) => {
    if (!err) {
      let sql = conn.query(
        sqlbus,
        [data.index, data.limit],
        function (err, result) {
          console.log("List_vehicle_service query----", sqlbus);
          conn.release();
          console.log("Listsrvehicle Connection Closed.");
          if (!err) {
            finalresult.push(result);
            sql = conn.query(sqlqueryc, function (err, result) {
              if (!err) {
                finalresult.push(result[0]);
                res.end(JSON.stringify(finalresult));
              }
            });
          } else {
            conn.release();
            console.log("Listsrvehicle Connection Closed.");
          }
        }
      );
    }
  });
});

vs.post("/getvs", (req, res) => {
  let data = req.body,sqlg;
  console.log("Data--", data);
  let sqlbuss = ` SELECT vs.vsid,vs.vechicleid,vs.vsdate,vs.invdate,vs.invno,vs.invamt,vs.districtid,vs.claimamt,
    vs.stateid,vs.servietype,vs.km,vs.paymentdate,vs.paymentamt,vs.utr,vs.paytoid,vs.payto,vs.paytoempid,
    mp.id,mp.name,vs.billstatus,vs.billreciveddate,vs.billtype,vs.quort,vs.estimate,vs.servicecentre,
    vs.claimreceiveddate,vs.vsnote,vs.bank_act_no,vs.ifsc_code,vs.service_item
   ,GROUP_CONCAT(vsi.servicetypename) servicetypename
   FROM vehicle_service  vs
   INNER  JOIN districts mp ON mp.id=vs.districtid
   LEFT JOIN vehicle_pro_map vpm ON vpm.state_id = vs.stateid
   LEFT JOIN vehicle_service_item vsi ON FIND_IN_SET(vsi.vsitid,vs.service_item) WHERE vs.vsid=${data.id} `;
  pool.getConnection((err, conn) => {
    console.log("Query---", sqlbuss);
    sqlg = conn.query(sqlbuss, data.id, (err, result) => {
      conn.release();
      console.log("GetVs Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function vsupdate(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,
      errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("Update Data", data);
        let sqlq = `SELECT EXISTS(select * from vehicle_service where vsid='${data.vsid}') count`;
        console.log("Expensetype Query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count == 0) {
          errorvalue.push({ msg: "vehicle service info error", err_code: 126 }); //-----------
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.vehicle_service set vechicleid=${data.vehicleno},vsdate='${data.vsdate}'
          ,invdate='${data.invdate}',invno='${data.invoiceno}',invamt='${data.invoamt}',districtid='${data.cluster}'
          ,stateid=${data.circle_name},km=${data.drivenkms},service_item='${data.serviceitem}',paymentdate='${data.paymdate}'
          ,paymentamt=${data.paymamt},utr='${data.utrno}',payto='${data.paymto}',billstatus='${data.billstatus}'
          ,billreciveddate='${data.billrecdate}',mby=${jwt_data.user_id},mdate=NOW()`;

          if (data.acc_no) sqlupdate += ` ,bank_act_no=${data.acc_no}`;
          if (data.ifsc_code) sqlupdate += ` ,ifsc_code='${data.ifsc_code}'`;
          if (data.servremark) sqlupdate += ` ,vsnote='${data.servremark}'`;
          if (data.srvc) sqlupdate += ` ,servicecentre='${data.srvc}'`;
          if (data.empid) sqlupdate += ` ,paytoempid=${data.empid}`;

          sqlupdate += ` where vsid=${data.vsid}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='VEHICLE SERVICE INFO  UPDATED ID:${data.vsid}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres["affectedRows"] > 0 && logres["insertId"] > 0)
              console.log("Log Added Successfully");
            errorvalue.push({
              msg: "Vehicle Service Updated Successfully",
              err_code: 0,
              ID: +data.vsid,
            });
            await conn.commit();
          } else {
            errorvalue.push({
              msg: "Please Try After Sometimes",
              err_code: 142,
            });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("Catch Error", err);
      }
    } else {
      //Log the Connection Error entered into the else part
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("Update Vehicle_Service Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

vs.post("/updatevs", async (req, res) => {
  req.setTimeout(864000000);
  console.log("Update Vehicle Service----",req.body);
  const validation = joiValidate.editvehicleserviceDataSchema.validate(req.body);
  if (validation.error) {
    console.log(validation.error.details);
    // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    return res.json([
      { msg: validation.error.details[0].message, err_code: "422" },
    ]);
  }
  let result = await vsupdate(req);
  res.end(JSON.stringify(result));
});

//app service upload
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    console.log("files---", file);
    let namefile = file.originalname.split("-")[0],
      folder_status = false;
    const fs = require("fs");
    const filename = namefile;
    const imagePath = `${__dirname}/../Documents/vendorsrv/${filename}`;
    fs.exists(imagePath, (exists) => {
      if (exists) {
        folder_status = true;
        console.log(" Directory Already Created. ");
      } else {
        folder_status = true;
        fs.mkdir(imagePath, { recursive: true }, function (err) {
          if (err) {
            console.log(err);
          } else {
            folder_status = true;
            console.log(" New Directory Successfully Created. ");
            callback(null, imagePath);
          }
        });
      }
      if (folder_status) {
        callback(null, imagePath);
      }
    });
  },
  filename: function (req, file, callback) {
    console.log(file);
    let nowdate = new Date();
    let filename = file.originalname.split("-")[1];
    let type = file.mimetype == "application/pdf" ? "pdf" : "png";
    // let type = file.mimetype == 'application/pdf' || 'png';
    callback(
      null,
      filename + "-" + nowdate.toISOString().slice(0, 10) + "." + type
    );
  },
});

const upload = multer({ storage }).array("file", 3);

vs.post("/uploadServiceApp", function (req, res) {
  console.log("Upload Document");
  let errorarray = [],data,sqlquery,file,srvimg1,sql; //srvimg2
  upload(req, res, function (err) {
    if (err) {
      console.log("Error Uploading File.", err);
      errorarray.push({ msg: "Upload Failed", error_code: "FAIL" });
      res.end(JSON.stringify(errorarray));
    } else {
      console.log(".......................", "files", req.files);
      (data = req.body), (file = req.files);
      srvimg1 = `${file[0].filename}`;
      // srvimg2 = `${file[1].filename}`;
      sqlquery = " UPDATE veremaxpo.vehicle_service SET srvimg1='" + srvimg1 + "' WHERE vsid =" + data.id;
      console.log("Update Payment Proof Query.", sqlquery);
      pool.getConnection((err, conn) => {
        if (err) {
          console.log("Vehicle Service Upload Failed");
        } else {
          sql = conn.query(sqlquery, function (err, result) {
            if (!err) {
              conn.release();
              console.log("UploadServiceApp Connection Closed.");
              if (!err) {
                if (result.affectedRows > 0) {
                  errorarray.push({ status: 1, msg: "File Added Succesfully", error_msg: 0 });
                  console.log("Vehicle Service File is Uploaded.");
                  res.end(JSON.stringify(errorarray));
                }
              } else {
                console.log("File Not uploaded.", err);
                errorarray.push({ msg: "Please try after sometimes", error_msg: "FAIL" });
                res.end(JSON.stringify(errorarray));
              }
            } else {
              console.log("File Not uploaded.", err);
              errorarray.push({ msg: "Please try after sometimes", error_msg: "FAIL" });
              conn.release();
              console.log("UploadServiceApp Connection Closed.");
              res.end(JSON.stringify(errorarray));
            }
          });
        }
      });
    }
  });
});

async function bulkvehicleservice(req) {
  return new Promise(async (resolve, reject) => {
    var data = req.body,vecserid,errorarray = [];
    let conn = await poolPromise.getConnection();
    const jwt_data = req.jwt_data;
    if (conn) {
      console.log("Add file", data.bulk.length);
      for (var i = 0; i < data.bulk.length; i++) {
        await conn.beginTransaction();
        try {
          let d = data.bulk[i],bvsid = {};
          console.log("Bulk Vehicle Service Data", d);
          let seritemid = "",distid = "",vgid = "",vsempid = "",
          stateid = `SELECT id from states WHERE name='${d.circle_name}'`;
          stateid = await conn.query(stateid);
          if (stateid[0].length == 1) {
            stateid = stateid[0][0].id;
            console.log("State", stateid);
            distid = `SELECT id from districts WHERE name='${d.cluster}' AND state_id=${stateid}`;
            distid = await conn.query(distid);
            if (distid[0].length == 1) {
              distid = distid[0][0].id;
              console.log("District", distid);
              vgid = `SELECT id FROM vechicle WHERE regno='${d.vehicleno}'`;
              vgid = await conn.query(vgid);
              if (vgid[0].length == 1) {
                vgid = vgid[0][0].id;
                console.log("Vehicle ID", vgid);
                vsempid = `SELECT emp_id_pk FROM employee WHERE emp_id='${d.empid}'`;
                vsempid = await conn.query(vsempid);
                if (vsempid[0].length == 1) {
                  vsempid = vsempid[0][0].emp_id_pk;
                  console.log("Employee ID", vsempid);
                }
                  if (d.serviceitem) {
                    let servid = d.serviceitem.split(",");
                    let result = servid.map(service => `"${service}"`).join(', ');
                    // let result = d.servid.replace(',',"','");
                    // console.log("@$#%^&*()*(&^%",result);
                    seritemid = `SELECT GROUP_CONCAT(vsitid) vsitid FROM vehicle_service_item WHERE servicetypename IN (${result})`;                                  
                    console.log("...............",seritemid);
                    seritemid = await conn.query(seritemid);
                    vecserid = seritemid[0][0].vsitid;
                    console.log("Vehicle Service Item ID", vecserid);
                    if (seritemid[0].length == 0) {
                      errorarray.push({ msg: "Vehicle Service Item Not Found.", error_msg: 287 });
                      await conn.rollback();
                      continue;
                    }
                  } else {
                    console.log("Vehicle Service Item");
                  }
                  bvsid["vehicleno"] = vgid;
                  bvsid["invoiceno"] = d.invoiceno;
                  bvsid["invdate"] = d.invdate;
                  bvsid["invoamt"] = d.invoamt;
                  bvsid["drivenkms"] = d.drivenkms;
                  bvsid["vsdate"] = d.vsdate;
                  bvsid["paymdate"] = d.paymdate;
                  bvsid["paymamt"] = d.paymamt;
                  bvsid["utrno"] = d.utrno;
                  bvsid["paymto"] = d["paymto"] == "To Showroom" ? 0 : 1;
                  bvsid["empid"] = vsempid;
                  bvsid["srvc"] = d.srvc;
                  bvsid["acc_no"] = d.acc_no;
                  bvsid["ifsc_code"] = d.ifsc_code;
                  bvsid["billstatus"] = d["billstatus"] == "Bill not received" ? 0 : 1;
                  bvsid["circle_name"] = stateid;
                  bvsid["cluster"] = distid;
                  bvsid["serviceitem"] = vecserid;
                  // bvsid["service_item"] = seritemid[0][0]["service_item"];
                  // bvsid["service_item"] = seritemid;
                  bvsid["jwt_data"] = jwt_data;
                  console.log("bulkvehicleservice", bvsid);
                  let res = await addvs(bvsid);
                  console.log("res", res);
                  errorarray.push(res[0]);
              } else {
                errorarray.push({
                  msg: "Vehicle Number does not matched",
                  error_msg: 422,
                });
                await conn.rollback();
                continue;
              }
            } else {
              errorarray.push({
                msg: "District Name does not matched",
                error_msg: 2471,
              });
              await conn.rollback();
              continue;
            }
          } else {
            errorarray.push({
              msg: "State name does not matched",
              error_msg: 2476,
            });
            await conn.rollback();
            continue;
          }
        } catch (e) {
          console.log("Inside Catch Error", e);
          await conn.rollback();
        }
      }
      console.log("Success-1", errorarray);
      conn.release();
      console.log("Bulkvehicleservice Connection Closed.");
    } else {
      return resolve({ msg: "Please Try After Sometimes", error_msg: "CONN" });
    }
    return resolve(errorarray);
  });
}

vs.post("/bulkvehicleservice", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  // console.log('dhcbg---------', req.body);
  let result = await bulkvehicleservice(req);
  console.log(result);
  res.end(JSON.stringify(result));
});
///////////////****************************************************************////////////////////

async function addAppvs(req) {
  return new Promise(async (resolve, reject) => {
    let data = req.body,jwt_data = req.jwt_data,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = ` SELECT EXISTS (SELECT vechicleid,vsdate,invdate,invno,invamt,districtid,servietype,
          km,paymentdate,paymentamt,utr,paytoid,payto,paytoempid,billstatus,billreciveddate,billtype,quort,estimate,
          proinv,orginv,claimreceiveddate,vsnote,claimamt,stateid
          FROM vehicle_service where vechicleid='${data.vehicleno}' && invno='${data.invoiceno}' ) count `;
        console.log("service query", sqlquery);
        let resp = await conn.query(sqlquery);
        console.log("result", resp);
        if (resp[0][0].count == 1) {
          console.log("Vehicleid  Exists");
          errorvalue.push({ msg: "Vehicle Service Exists", err_code: 1 });
          await conn.rollback();
        } else {
          let sqlinsert = `insert into veremaxpo.vehicle_service set vechicleid='${data.vehicleno}',vsdate='${data.vsdate}',invno='${data.invoiceno}'
          ,invamt='${data.invoamt}',districtid='${data.cluster}',stateid='${data.circle_name}',servietype='${data.servtype}',km=${data.drivenkms}
          ,paymentamt=${data.paymamt},cby=${jwt_data.user_id}`;

          if (data.servremark) sqlinsert += ` ,vsnote='${data.servremark}'`;
          if (data.srvc) sqlinsert += ` ,servicecentre='${data.srvc}'`;

          console.log("insert query", sqlinsert);
          let result = await conn.query(sqlinsert);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='APP VEHICLE SERVICE INFO  ADDED ID:${
              result[0]["insertId"]
            }',\`longtext\`='DONE BY',cby=${
              jwt_data.user_id
            },data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres["affectedRows"] > 0 && logres["insertId"] > 0)
              console.log("Log Added Successfully");
            errorvalue.push({
              msg: "Vehicle Service Added Successfully",
              err_code: 0,
            });
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 1 });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("Catch Error", err);
        await conn.rollback();
      }
    } else {
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("AddAppvs Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

vs.post("/addAppvs", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await addAppvs(req);
  res.end(JSON.stringify(result));
});

vs.post("/listservicetype", function (req, res) {
  var sql,
    sqlquery = "SELECT vstid,servicetypename FROM veremaxpo.vehicle_service_type";
    pool.getConnection((err, conn) => {
    if (err) {
      console.log("Failed");
    } else {
      sql = conn.query(sqlquery, function (err, result) {
        // console.log(sql.sql);
        conn.release();
        console.log("Listservicetype Connection Closed.");
        res.send(JSON.stringify(result));
      });
    }
  });
});

module.exports = vs;

  // servid = seritemid[0][0].toString().replace("", "'',''");
  // console.log("/////-----------/////",servid);