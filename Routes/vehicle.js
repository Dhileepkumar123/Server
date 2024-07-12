"use strict";
const express = require("express"),
  compress = require("compression"),
  vehicle = express.Router(),
  // schema = require("../schema/schema"),
  // vehicletrack = require('../schema/vehicletrack'),
  pool = require("../connection/connection"),
  poolPromise = require("../connection/connection").poolpromise;
const { log } = require("console");
const multer = require("multer");
// const { validationResult } = require('express-validator/');
const joiV = require("../schema/vehicle");
// vehicle.use(compress());

////****Vehicle Registration****/
async function addvehicle(req) {
  return new Promise(async (resolve, reject) => {
    let data = req.body == null ? req : req.body,conn = "",vstatus = false,errorvalue = [];
    const jwt_data = req.jwt_data;
    try {
      conn = await poolPromise.getConnection();
      await conn.beginTransaction();
      console.log("Add vehicle---", data);
      let rcexists = `SELECT EXISTS(SELECT * FROM veremaxpo.vechicle WHERE regno = UPPER('${data.regNo}')) count`,
        enexists = `SELECT EXISTS(SELECT * FROM veremaxpo.vechicle WHERE engine_Number = UPPER('${data.engNo}')) count`,
        cnexists = `SELECT EXISTS(SELECT * FROM veremaxpo.vechicle WHERE chasis_number = UPPER('${data.chasNo}')) count`;
      rcexists = await conn.query(rcexists);
      enexists = await conn.query(enexists);
      cnexists = await conn.query(cnexists);
      if (
        rcexists[0][0]["count"] != 0 ||
        enexists[0][0]["count"] != 0 ||
        cnexists[0][0]["count"] != 0
      ) {
        console.log("Vehicle Already Exists");
        let verror_name =
          rcexists[0][0]["count"] == 1
            ? "Vehicle Number"
            : enexists[0][0]["count"] == 1
            ? "Engine Number"
            : cnexists[0][0]["count"] == 1
            ? "Chasis Number"
            : "Check Vehicle Number ,Engine Number ,Chasis Number ";
        errorvalue.push({ msg: verror_name + "Already Exists", err_code: "1" });
        await conn.rollback();
      } else {
        let sqlinsert = `insert into veremaxpo.vechicle set regno = UPPER('${data.regNo}'),vehicletype = ${data.vehicletype},
        engine_Number = UPPER('${data.engNo}'),chasis_number = UPPER('${data.chasNo}'),makers_name = '${data.model}',
        vehicle_type = '${data.dept}',circle_id = ${data.circle_name},cluster_id = ${data.cluster},created_by = ${jwt_data.user_id}`;
        console.log("Undefined Data Occured......");

        if (data.regdate) sqlinsert += ` ,regdate = '${data.regdate}'`;
        if (data.regdate) sqlinsert += ` ,regexpdate = '${data.regdate}' + INTERVAL 1826 DAY`;
        if (data.remark) sqlinsert += ` ,remarks='${data.remark}'`;
        if (data.companyname) sqlinsert += ` ,company_name=${data.companyname}`;
        if (data.vendor_name) sqlinsert += ` ,vendor_name='${data.vendor_name}'`;
        if (data.fuelcardid) sqlinsert += ` ,fuelcardid=${data.fuelcardid}`;

        console.log("Insert Query", sqlinsert);
        let result = await conn.query(sqlinsert);
        console.log("result", result);
        if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
          let insin = result[0]["insertId"],
            inc_insid = "",
            fc_insid = "",
            pol_insid = "",
            per_insid = "";
          if (
            data.insurance_exp_date != "" ||
            data.insurance_exp_date != null
          ) {
            let vi = `insert into veremaxpo.vechicle_insurance set vechicleid='${insin}',insurance_company=UPPER('${data.inscomp}'),viexpdate='${data.insurance_exp_date}',cby=${jwt_data.user_id}`;
            console.log("insert query", vi);
            let vie = await conn.query(vi);
            console.log("result", vie);
            if (vie[0]["affectedRows"] > 0) {
              inc_insid = vie[0]["insertId"];
            } else {
              errorvalue.push({
                msg: "Vehicle insurance info error",
                err_code: 375,
              });
              await conn.rollback();
            }
          }
          if (data.fc_exp_date != "" || data.fc_exp_date != null) {
            let fc = `insert into veremaxpo.vehicle_fc set vechicleid='${insin}',fcexpdate='${data.fc_exp_date}',cby=${jwt_data.user_id}`;
            console.log("insert query", fc);
            let fcv = await conn.query(fc);
            console.log("result", fcv);
            if (fcv[0]["affectedRows"] > 0) {
              fc_insid = fcv[0]["insertId"];
            } else {
              errorvalue.push({ msg: "Vehicle Fc info error", err_code: 387 });
              await conn.rollback();
            }
          }
          if (data.pollution_exp_date != "" || data.pollution_exp_date != null) {
            let p = `insert into veremaxpo.vechicle_pollution set vechicleid='${insin}',vpcdate='${data.pollution_exp_date}',cby=${jwt_data.user_id}`;
            console.log("insert query", p);
            let vp = await conn.query(p);
            console.log("result", vp);
            if (vp[0]["affectedRows"] > 0) {
              pol_insid = vp[0]["insertId"];
            } else {
              errorvalue.push({ msg: "Vehicle Pollution info error", err_code: 399 });
              await conn.rollback();
            }
          }
          if (data.permitexpiry != "" || data.permitexpiry != null) {
            let a = `insert into veremaxpo.vechicle_permit set vehicleid= '${insin}',permitexpiry='${data.permitexpiry}',cby=${jwt_data.user_id}`;
            console.log("insert query", a);
            let finalres = await conn.query(a);
            console.log("Permit expiryyyyyyyyyyyyyyyyyyyyy", finalres);
            if (finalres[0]["affectedRows"] > 0) {
              per_insid = finalres[0]["insertId"];
            } else {
              errorvalue.push({
                msg: "Vehicle Permit info error",
                err_code: 411,
              });
              await conn.rollback();
            }
          }
          if (
            per_insid != "" ||
            pol_insid != "" ||
            fc_insid != "" ||
            inc_insid != ""
          ) {
            let aa = `UPDATE veremaxpo.vechicle set `,
              aa1 = [];
            if (per_insid != "")
              aa1.push(per_insid != "" ? ` permitid=${per_insid}` : "");
            if (pol_insid != "")
              aa1.push(pol_insid != "" ? ` pollutionid=${pol_insid}` : "");
            if (fc_insid != "")
              aa1.push(fc_insid != "" ? ` fcid=${fc_insid}` : "");
            if (inc_insid != "")
              aa1.push(inc_insid != "" ? ` insuranceid=${inc_insid}` : "");
            if (aa1.length > 0) {
              aa += aa1.join(",");
            } else {
              console.log("Update Err");
              errorvalue.push({ msg: "Update id error", err_code: 425 });
              await conn.rollback();
            }
            aa += ` where id= ${insin} `;
            console.log("insert query", aa);
            let finalres = await conn.query(aa);
            console.log("result", finalres);
            if (finalres[0]["affectedRows"] > 0) {
              vstatus = true;
            } else {
              console.log("Final Error 226");
              errorvalue.push({ msg: "Error", err_code: 436 });
              await conn.rollback();
            }
          } else {
            vstatus = true;
          }
          if (vstatus) {
            let logQuery = `INSERT INTO veremaxpo.activity_log SET table_id='VEHICLE ADDED ID:${insin}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}'`;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres["affectedRows"] > 0 && logres["insertId"] > 0)
              console.log("Vehicle Added successfully");
            errorvalue.push({ msg: `Vehicle Added Successfully`, vehicleid: insin, err_code: 0 });
            if (per_insid != "") errorvalue[0]["per_insid"] = per_insid;
            if (pol_insid != "") errorvalue[0]["pol_insid"] = pol_insid;
            if (fc_insid != "") errorvalue[0]["fc_insid"] = fc_insid;
            if (inc_insid != "") errorvalue[0]["inc_insid"] = inc_insid;
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Vehicle Permit info error" });
            await conn.rollback();
          }
        }
      }
    } catch (e) {
      console.log("Catch Block Error", e);
      errorvalue.push({ msg: "Please Enter Required Fields", err_code: "457" });
      await conn.rollback();
    }
    conn.release();
    console.log("Addvehicle Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

vehicle.post("/addvehicle", async (req, res) => {
  req.setTimeout(864000000);
  console.log("dhcbg---------", req.body);
  const validation = joiV.vehicleDataSchema.validate(req.body);
  if (validation.error) {
    console.log(validation.error.details);
    return res.json([
      { msg: validation.error.details[0].message, err_code: "171" },
    ]);
  }
  let result = await addvehicle(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

vehicle.post("/listvehicle", (req, res) => {
  let data = req.body,where = [],value = [];
  console.log("Data--", data);
  let sqlbus = ` SELECT v.id,v.regno,c.cardno,cv.company_name,DATE_FORMAT(vp.vpcdate ,'%Y-%m-%d') vpcdate,DATE_FORMAT(p.permitexpiry ,'%Y-%m-%d') permitexpiry,
        DATE_FORMAT(vi.viexpdate,'%Y-%m-%d') viexpdate,DATE_FORMAT(vfc.fcexpdate,'%Y-%m-%d') fcexpdate,DATE_FORMAT(v.regdate,'%Y-%m-%d') regdate,
        DATE_FORMAT(v.regexpdate,'%Y-%m-%d') regexpdate,v.makers_name,s.name statename,v.circle_id,v.cluster_id,mp.name distname,v.chasis_number,
        v.engine_Number,v.remarks,v.udate,v.updated_by,v.cdate,v.created_by,um.firstname,vt.vehicle_type,v.status 
        ,IF(vp.vpcdate<CURDATE(),"Expired","Active" ) vp_status
        ,IF(p.permitexpiry>CURDATE(),"Active","Expired" ) permit_status
        ,IF(vi.viexpdate>CURDATE(),"Active","Expired" ) insurance_status
        ,IF(vfc.fcexpdate>CURDATE(),"Active","Expired" ) fc_status
        ,TIMESTAMPDIFF(MONTH, v.regdate, CURDATE()) vechicle_Age
        FROM veremaxpo.vechicle v
        INNER JOIN states s ON v.circle_id=s.id
        INNER JOIN districts mp ON mp.id=v.cluster_id
        INNER JOIN company_v cv ON cv.company_id = v.company_name
        INNER JOIN vehicle_type vt ON vt.vehicle_id = v.vehicle_type
        LEFT JOIN vehicle_fuelcard c ON v.fuelcardid=c.id
        LEFT JOIN employee_mas um ON um.user_id=v.created_by
        LEFT JOIN vechicle_pollution vp ON v.pollutionid=vp.vpc
        LEFT JOIN vechicle_permit p ON v.permitid =p.id
        LEFT JOIN vechicle_insurance vi ON v.insuranceid = vi.vinid
        LEFT JOIN vehicle_fc vfc ON vfc.vfcid = v.fcid `,
    sqlqueryc = ` SELECT COUNT(*) total FROM vechicle v
        INNER  JOIN states s ON v.circle_id=s.id
        INNER  JOIN districts mp ON mp.id=v.cluster_id
        INNER  JOIN company_v cv ON cv.company_id = v.company_name
        INNER JOIN vehicle_type vt ON vt.vehicle_id = v.vehicle_type
        LEFT  JOIN vehicle_fuelcard c ON v.fuelcardid=c.id
        LEFT JOIN employee_mas um ON um.user_id=v.created_by
        LEFT JOIN vechicle_pollution vp ON v.pollutionid=vp.vpc
        LEFT JOIN vechicle_permit p ON v.permitid =p.id
        LEFT JOIN vechicle_insurance vi ON v.insuranceid = vi.vinid
        LEFT JOIN vehicle_fc vfc ON vfc.vfcid = v.fcid `;
  console.log("Get Count Query :", sqlbus);

  if (data.hasOwnProperty("like") && data.like)
    where.push(' v.regno LIKE "%' + data.like + '%"');
  if (data.hasOwnProperty("state_id") && data.state_id)
    where.push(" v.circle_id= " + data.state_id);
  if (data.hasOwnProperty("cluster") && data.cluster)
    where.push(" v.cluster_id= " + data.cluster);
  if (data.hasOwnProperty("regNo") && data.regNo)
    where.push(" v.id= " + data.regNo);
  if (data.hasOwnProperty("dept") && data.dept)
    where.push(" v.vehicle_type= " + data.dept);

  if (where.length > 0) {
    sqlbus += " where" + where.join(" AND ");
    sqlqueryc += " where " + where.join(" AND ");
  }
  if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
    sqlbus += " ORDER BY v.id DESC LIMIT " + data.index + ", " + data.limit;
  }
  pool.getConnection((err, conn) => {
    if (err) {
      console.log("List Vehicle Failed....");
      res.send(JSON.stringify("Failed"));
    } else {
      let sql = conn.query(sqlbus, function (err, result) {
        value.push(result);
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log("Listvehicle Connection Closed.");
            if (!err) {
              value.push(result[0]);
              res.send(JSON.stringify(value));
            } else {
              console.log("Query Failed");
              res.send(JSON.stringify(result));
            }
          });
        } else {
          console.log("error", err);
          conn.release();
          console.log("Listvehicle Connection Closed.");
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

vehicle.post("/getvehicle", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbus = `SELECT v.id,v.regno,v.vehicletype,v.vendor_name,v.fuelcardid,v.regdate,v.regexpdate,v.makers_name,v.circle_id,v.cluster_id,
        v.chasis_number,v.engine_Number,vi.insurance_company,v.regdate,v.regexpdate,v.fuelcardid,
        v.remarks,vfc.fcexpdate,vp.vpcdate,vi.viexpdate,v.vehicle_type,v.company_name,v.status
        FROM veremaxpo.vechicle v
        LEFT JOIN vehicle_type vt ON vt.vehicle_id = v.vehicle_type
        LEFT JOIN vehicle_fc vfc ON vfc.vechicleid= v.id
        LEFT JOIN vechicle_insurance vi ON  vi.vechicleid= v.id
        LEFT JOIN vechicle_pollution vp ON vp.vechicleid= v.id WHERE v.id=${data.id}`;
    console.log("Query---", sqlbus);
    let sql = conn.query(sqlbus, (err, result) => {
      conn.release();
      console.log("Getvehicle Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updatevehicle(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body,errorvalue = [];
    const jwt_data = req.jwt_data;
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `Select exists(select * from veremaxpo.vechicle where id =${data.id}) count`;
        console.log("vehicle", data.regNo);
        console.log("vehicle query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count == 0) {
          errorvalue.push({ msg: "vehicle data not found", err_code: 337 });
          await conn.rollback();
        } else {
          let sqlinsert = `UPDATE  veremaxpo.vechicle set regno=UPPER('${data.regNo}'),vehicletype=${data.vehicletype},engine_Number='${data.engNo}',chasis_number='${data.chasNo}',
                        makers_name='${data.model}',regdate='${data.regdate}',regexpdate='${data.regdate}' + INTERVAL 5 YEAR,vehicle_type=${data.dept},
                       circle_id=${data.circle_name},cluster_id=${data.cluster},fuelcardid=${data.fuelcardid},
                       remarks='${data.remark}',company_name=${data.companyname},updated_by=${jwt_data.user_id}`;
          if (data.vendor_name)
            sqlinsert += ` ,vendor_name='${data.vendor_name}'`;
          sqlinsert += ` where id= ${data.id} `;
          console.log("insert query", sqlinsert);
          let result = await conn.query(sqlinsert);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let vi = `UPDATE veremaxpo.vechicle_insurance set insurance_company='${data.inscomp}',viexpdate='${data.insurance_exp_date}',mby=${jwt_data.user_id}`;
            vi += ` where vechicleid= ${data.id} `;
            console.log("insert query", vi);
            let vie = await conn.query(vi);
            console.log("result", vie);
            if (vie[0]["affectedRows"] > 0) {
              let fc = `UPDATE  veremaxpo.vehicle_fc set fcexpdate='${data.fc_exp_date}',mby=${jwt_data.user_id}`;
              fc += ` where vechicleid= ${data.id} `;
              console.log("insert query", fc);
              let fcv = await conn.query(fc);
              console.log("result", fcv);
              if (fcv[0]["affectedRows"] > 0) {
                let p = `UPDATE  veremaxpo.vechicle_pollution set vpcdate='${data.pollution_exp_date}',mby=${jwt_data.user_id}`;
                p += ` where vechicleid= ${data.id} `;
                console.log("insert query", p);
                let vp = await conn.query(p);
                console.log("result", vp);
                if (vp[0]["affectedRows"] > 0) {
                  let logQuery = ` INSERT into  veremaxpo.activity_log SET table_id='VEHICLE INFO UPDATED ID:${data.id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
                  console.log(logQuery);
                  let logres = await conn.query(logQuery);
                  if (logres["affectedRows"] > 0)
                    console.log("Updated successfully");
                  errorvalue.push({
                    msg: "Vechicle Updated Successfully",
                    err_code: 0,
                  });
                  await conn.commit();
                } else {
                  await conn.rollback();
                }
              } else {
                console.log({ msg: "insurance info error", errcode: 380 });
                await conn.rollback();
              }
            } else {
              errorvalue.push({ msg: "insurance info error", err_code: 384 });
              await conn.rollback();
            }
          } else {
            errorvalue.push({ msg: "vehicle info error", errcode: 389 });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("Catch error", err);
      }
    } else {
      //Log the Connection Error entered into the else part
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("Updatevehicle Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

vehicle.post("/updatevehicle", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  const validation = joiV.editvehicleDataSchema.validate(req.body);
  if (validation.error) {
    console.log(validation.error.details);
    return res.json([
      { msg: validation.error.details[0].message, err_code: "413" },
    ]);
  }
  let result = await updatevehicle(req);
  res.end(JSON.stringify(result));
});

async function bulkvehicle(req) {
  return new Promise(async (resolve, reject) => {
    var data = req.body,errorarray = [];
    let conn = await poolPromise.getConnection();
    const jwt_data = req.jwt_data;
    if (conn) {
      console.log("Add file", data.bulk.length);
      for (var i = 0; i < data.bulk.length; i++) {
        await conn.beginTransaction();
        try {
          let b = data.bulk[i];
          console.log("Vehicle data", b);
          let compid = "",cardid = "",typeid = "",distid = "",
            stateid = `SELECT id from states WHERE name='${b.circle_name}'`;
          console.log("stateid", stateid);
          stateid = await conn.query(stateid);
          if (stateid[0].length == 1) {
            stateid = stateid[0][0].id;
            console.log("State Query", stateid);
            distid = `SELECT id from districts WHERE name='${b.cluster}' AND state_id=${stateid}`;
            console.log("distid", distid);
            distid = await conn.query(distid);
            if (distid[0].length == 1) {
              distid = distid[0][0].id;
              typeid = `SELECT vehicle_id from vehicle_type WHERE vehicle_type='${b.dept}'`;
              console.log("typeid", typeid);
              typeid = await conn.query(typeid);
              if (typeid[0].length == 1) {
                typeid = typeid[0][0].vehicle_id;
                compid = `SELECT company_id from company_v WHERE company_name='${b.companyname}'`;
                console.log("compid", compid);
                compid = await conn.query(compid);
                compid = compid[0][0].company_id;
                if (b.fuelcardid) {
                  cardid = `SELECT id  from vehicle_fuelcard WHERE cardno='${b.fuelcardid}'`;
                  console.log("cardid", cardid);
                  cardid = await conn.query(cardid);
                  // console.log(cardid[0])
                  if (cardid[0].length == 0) {
                    errorarray.push({
                      msg: "Fuel Card No Not Found.",
                      error_msg: 363,
                    });
                    await conn.rollback();
                    continue;
                  } else {
                    cardid = cardid[0][0]["id"];
                  }
                } else {
                  console.log("fuelcard");
                }
                b["circle_name"] = stateid;
                b["cluster"] = distid;
                b["jwt_data"] = jwt_data;
                b["dept"] = typeid;
                b["fuelcardid"] = cardid;
                b["companyname"] = compid;
                console.log(b, "----------");
                let res = await addvehicle(b);
                res[0]["regNo"] = b["regNo"];
                console.log("#%^&*&$#@#$#%^$&",res[0], "===--res");
                errorarray.push(res[0]);
              } else {
                errorarray.push({
                  msg: "Department does not matched",
                  error_msg: 385,
                });
                await conn.rollback();
                continue;
              }
            } else {
              errorarray.push({
                msg: "District name does not matched",
                error_msg: 390,
              });
              await conn.rollback();
              continue;
            }
          } else {
            errorarray.push({
              msg: "State name does not matched",
              error_msg: 394,
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
      console.log("Bulkvehicle Connection Closed");
    } else {
      return resolve({ msg: "Please Try After Sometimes", error_msg: "CONN" });
    }
    return resolve(errorarray);
  });
}

vehicle.post("/bulkvehicle", async (req, res) => {
    console.log(req.body);
    req.setTimeout(864000000);    
    let result = await bulkvehicle(req);
    console.log(result);
    res.end(JSON.stringify(result));
  }
);

const storage3 = multer.diskStorage({
  destination: function (req, file, callback) {
    console.log("request files---", file);
    let namefile = file.originalname.split("-")[0],
      folder_status = false;
    const fs = require("fs");
    const filename = namefile;
    const imagePath = `${__dirname}/../Documents/VehicleDetails/${filename}`;
    fs.exists(imagePath, (exists) => {
      if (exists) {
        folder_status = true;
        console.log("Directory Already Created.");
      } else {
        folder_status = true;
        fs.mkdir(imagePath, { recursive: true }, function (err) {
          if (err) {
            console.log(err);
          } else {
            folder_status = true;
            console.log("New Directory Successfully Created.");
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
    let file_name = file.originalname.split("-")[1];
    let type = file.mimetype == "application/pdf" ? "pdf" : "png";
    callback(
      null,
      file_name + "-" + nowdate.toISOString().slice(0, 10) + "." + type
    );
  },
});

const upload3 = multer({ storage: storage3 }).array("file", 5);

vehicle.post("/uploadDoc", function (req, res) {
  console.log("Upload Document");
  let errorarray = [],data,sql,file,ins,pol,per,fc,jwt_data = req.jwt_data;
  const filename = [
    {
      id: 1,
      label: "FC",
    },
    {
      id: 2,
      label: "Insurance",
    },
    {
      id: 3,
      label: "Pollution",
    },
    {
      id: 4,
      label: "Permit",
    },
  ];
  upload3(req, res, function (err) {
    if (err) {
      console.log("Error Uploading file.", err);
      errorarray.push({ msg: "Upload Failed", err_code: "FAIL" });
      res.end(JSON.stringify(errorarray));
    } else {
      (data = req.body), (file = req.files);
      console.log("---data---", data, ".......................", "files", file);
      fc = `${file[0].filename}`;
      ins = `${file[1].filename}`;
      pol = `${file[2].filename}`;
      per = `${file[3].filename}`;
      let updateQuery = " UPDATE ";
      // console.log('filename length :', typeof (data.filename));
      let updatetable = [],
        dataupdate = [],
        updateid = [];
      if (typeof data.filename == "object") {
        if (data.filename.includes("FC")) {
          updatetable.push(`veremaxpo.vehicle_fc fc`);
          let fc_file = req.files.find((x) => x.filename.includes("fc"));
          // console.log('fc_file', fc_file);
          dataupdate.push(`fc.fc_doc= '${fc_file.filename}'`);
          updateid.push(`fc.vfcid=${data.fc_insid}`);
        }
        if (data.filename.includes("Insurance")) {
          updatetable.push(`veremaxpo.vechicle_insurance ins`);
          let ins_file = req.files.find((x) => x.filename.includes("ins"));
          dataupdate.push(`ins.ins_doc= '${ins_file.filename}'`);
          updateid.push(`ins.vinid=${data.inc_insid}`);
        }
        if (data.filename.includes("Pollution")) {
          updatetable.push(`veremaxpo.vechicle_pollution pol`);
          let pol_file = req.files.find((x) => x.filename.includes("pol"));
          dataupdate.push(`pol.pol_doc= '${pol_file.filename}'`);
          updateid.push(`pol.vpc=${data.pol_insid}`);
        }
        if (data.filename.includes("Permit")) {
          updatetable.push(`veremaxpo.vechicle_permit per`);
          let per_file = req.files.find((x) => x.filename.includes("per") || '');
          dataupdate.push(`per.permitdoc= '${per_file.filename}'`);
          updateid.push(`per.id=${data.per_insid}`);
        }
        updatetable = updatetable.join(",");
        dataupdate = dataupdate.join(",");
        updateid = updateid.join(" AND ");
        updateQuery += `${updatetable} SET ${dataupdate} WHERE ${updateid}`;
      } else {
        let tablename = "",
          updateField = "",
          updateId = "";
        if (data.filename == "FC") {
          tablename += `veremaxpo.vehicle_fc fc`;
          updateId += `fc.vfcid=${data.fc_insid}`;
          updateField += `fc.fc_doc= '${req.files[0].filename}'`;
        }
        if (data.filename == "Insurance") {
          tablename += `veremaxpo.vechicle_insurance ins`;
          updateId += `ins.vinid=${data.inc_insid}`;
          updateField += `ins.ins_doc= '${req.files[0].filename}'`;
        }
        if (data.filename == "Pollution") {
          tablename += `veremaxpo.vechicle_pollution poll`;
          updateId += `poll.vpc=${data.pol_insid}`;
          updateField += `poll.pol_doc= '${req.files[0].filename}'`;
        }
        if (data.filename == "Permit") {
          tablename += `veremaxpo.vechicle_permit per`;
          updateId += `per.id=${data.per_insid}`;
          updateField += `per.permitdoc= '${req.files[0].filename}'`;
        }
        updateQuery += ` ${tablename} SET ${updateField}  WHERE ${updateId} `; //////////
      }
      console.log("Update Queryy", updateQuery);
      pool.getConnection((err, conn) => {
        if (err) {
          console.log("Connection Failed");
        } else {
          sql = conn.query(updateQuery, function (err, result) {
            if (!err) {
              if (result.affectedRows > 0) {
                let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='VEHICLE DOC  ADDED ID:${data.vehicle_id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
                console.log(logQuery);
                let logres = conn.query(logQuery);
                conn.release();
                console.log("UploadDoc Connection Closed.");
                if (logres["affectedRows"] > 0) {
                  errorarray.push({
                    status: 1,
                    msg: "Added Succesfully",
                    error_msg: 0,
                  });
                  console.log("File is Uploaded.");
                  res.end(JSON.stringify(errorarray));
                }
              }
            } else {
              console.log("File Not Uploaded.", err);
              errorarray.push({
                msg: "Please try After Sometimes",
                error_msg: "FAIL",
              });
              conn.release();
              console.log("UploadDoc Connection Closed.");
              res.end(JSON.stringify(errorarray));
            }
          });
        }
      });
    }
  });
});

////----Vehicle Project Assigning----/////
async function addVproj(req) {
  return new Promise(async (resolve, reject) => {
    let data,jwt_data,errorvalue = [],conn,conn_status = 0;
    //   let conn = await poolPromise.getConnection();
    if (req.conn) {
      // old connection
      console.log("Old Connection");
      data = req;
      jwt_data = req.jwt_data;
      conn_status = 1;
      conn = req.conn;
      delete data.jwt_data;
      delete data.conn;
    } else {
      //new connection
      console.log("New Connection");
      conn = await poolPromise.getConnection();
      data = req.body;
      jwt_data = req.jwt_data;
    }
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `SELECT EXISTS (SELECT id FROM vechicle WHERE id=${data.vehicle_id} AND vehicle_map_id IS NULL) count`;
        console.log("Service Query", sqlquery);
        let resp = await conn.query(sqlquery);
        console.log("resp Count :", resp[0][0].count);
        if (resp[0][0].count == 0) {
          console.log("Vehicle  Exists");
          errorvalue.push({ msg: "Vehicle Already Mapped ", err_code: 1622 });
          await conn.rollback();
        } else {
          let sqlinsert = `insert into veremaxpo.vehicle_pro_map set project_id=${data.project_id},
                    vehicle_id=${data.vehicle_id},state_id=${data.state_id},district_id=${data.district_id},
                    cby=${jwt_data.user_id},cdate=NOW()`;
          if (data.start_date == null || data.start_date == "") {
            errorvalue.push({
              msg: "Start Date is Not Allowed to be Empty",
              err_code: 1629,
            });
            await conn.rollback();
          } else {
            sqlinsert += `,start_date=DATE_FORMAT('${data.start_date}','%Y-%m-%d')`;
          }
          console.log("insert query", sqlinsert);
          let result = await conn.query(sqlinsert);
          console.log("result", result[0]);
          if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
            let insid = result[0]["insertId"];
            let idins = `UPDATE veremaxpo.vechicle SET vehicle_map_id=${insid}`;
            if (data.project_id != null && data.project_id != "")
              idins += ` ,project_id=${data.project_id} `;
            idins += `  WHERE id=${data.vehicle_id} `;
            console.log("idins", idins);
            let c = await conn.query(idins);
            console.log("result", c);
            if (c[0]["affectedRows"] > 0) {
              let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='VEHICLE PROJECT MAPPED INFO  ADDED ID:${
                result[0]["insertId"]
              }',\`longtext\`='DONE BY',cby=${
                jwt_data.user_id
              },data='${JSON.stringify(data)}' `;
              console.log(logQuery);
              let [logres] = await conn.query(logQuery);
              if (logres["affectedRows"] > 0 && logres["insertId"] > 0) {
                console.log("Log Added Successfully");
                errorvalue.push({
                  msg: "Vehicle Mapped To Project Successfully",
                  err_code: 0,
                  vehicle_id: data.vehicle_id,
                });
                await conn.commit();
              }
            } else {
              errorvalue.push({
                msg: "Please Try After Sometimes",
                err_code: 1654,
              });
              await conn.rollback();
            }
          } else {
            errorvalue.push({
              msg: "Please Try After Sometimes",
              err_code: 1658,
            });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("catch Block error", err);
        errorvalue.push({
          msg: "Please Enter Required Fields",
          err_code: "1664",
        });
        await conn.rollback();
      }
    } else {
      console.log("Connection Error.....");
    }
    if (conn_status == 0) conn.release();
    console.log("AddVproj Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

vehicle.post("/addVproj", async (req, res) => {
  req.setTimeout(864000000);
  console.log(req.body);
  const validation = joiV.vehicleprojectDataSchema.validate(req.body);
  if (validation.error) {
    console.log(validation.error.details);
    return res.json([
      { msg: validation.error.details[0].message, err_code: "522" },
    ]);
  }
  let result = await addVproj(req);
  res.end(JSON.stringify(result));
});

vehicle.post("/listVprojectmap", (req, res) => {
  let data = req.body,where = [],value = [];
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlbus = ` SELECT vpm.id,v.id vid,pm.project_title,vpm.project_id,v.regno,s.name statename,d.name distname,DATE_FORMAT(vpm.start_date,'%Y-%m-%d') start_date,
        DATE_FORMAT(vpm.end_date,'%Y-%m-%d') end_date,us.firstname cby,u.firstname mby 
        FROM  vechicle v
        INNER JOIN vehicle_pro_map vpm ON v.vehicle_map_id = vpm.id
        INNER JOIN p_project_mas pm ON pm.project_id = vpm.project_id
        LEFT JOIN states s ON s.id = vpm.state_id
        LEFT JOIN districts d ON d.id = vpm.district_id
        LEFT JOIN employee_mas us ON us.user_id=vpm.cby
        LEFT JOIN employee_mas u ON u.user_id=vpm.mby
        WHERE v.vehicle_map_id IS NOT NULL `,
      sqlqueryc = ` SELECT COUNT(*) AS total FROM  vechicle v
        INNER JOIN vehicle_pro_map vpm ON v.vehicle_map_id = vpm.id
        INNER JOIN p_project_mas pm ON pm.project_id = vpm.project_id
        LEFT JOIN states s ON s.id = vpm.state_id
        LEFT JOIN districts d ON d.id = vpm.district_id
        LEFT JOIN employee_mas us ON us.user_id=vpm.cby
        LEFT JOIN employee_mas u ON u.user_id=vpm.mby
        WHERE v.vehicle_map_id IS NOT NULL `;
    console.log("Get Count Query :", sqlbus);

    if (data.hasOwnProperty("like") && data.like)
      where.push(' v.regno LIKE "%' + data.like + '%"');
    if (data.hasOwnProperty("project_id") && data.project_id)
      where.push(" v.project_id= " + data.project_id);
    if (data.hasOwnProperty("state_id") && data.state_id)
      where.push(" vpm.state_id= " + data.state_id);
    if (data.hasOwnProperty("cluster") && data.cluster)
      where.push(" vpm.district_id = " + data.cluster);
    if (data.hasOwnProperty("regNo") && data.regNo)
      where.push(" v.id= " + data.regNo);

    if (where.length > 0) {
      sqlbus += " and " + where.join(" AND ");
      sqlqueryc += " and " + where.join(" AND ");
    }
    if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
      sqlbus += " ORDER BY vpm.id DESC LIMIT " + data.index + ", " + data.limit;
      console.log(data.index, data.limit, "sqll");
    }
    console.log("sqlbus", sqlbus);
    console.log("sqlqueryc", sqlqueryc);
    pool.getConnection((err, conn) => {
      if (err) {
        console.log("List Vehicle Project map Failed....");
        res.send(JSON.stringify("failed"));
      } else {
        let sql = conn.query(sqlbus, function (err, result) {
          value.push(result);
          if (!err) {
            sql = conn.query(sqlqueryc, function (err, result) {
              conn.release();
              console.log("listVprojectmap Connection Closed.");
              if (!err) {
                console.log("Connection Closed.");
                value.push(result[0]);
                res.send(JSON.stringify(value));
              } else {
                console.log("Query Failed");
                res.send(JSON.stringify(result));
              }
            });
          } else {
            console.log("error", err);
            conn.release();
            console.log("ListVprojectmap Connection Closed.");
            res.send(JSON.stringify(result));
          }
        });
      }
    });
  });
});

vehicle.post("/getVmap", (req, res) => {
  let data = req.body,sqlg;
  console.log("Data--", data);
  let sqlbuss = ` SELECT p.id,v.regno,p.project_id,p.vehicle_id,p.state_id,p.district_id,p.start_date,p.end_date 
    FROM vehicle_pro_map p
    LEFT JOIN vechicle v ON p.vehicle_id=v.id
    WHERE p.id='${data.id}' `;
  pool.getConnection((err, conn) => {
    console.log("Query---", sqlbuss);
    sqlg = conn.query(sqlbuss, data.id, (err, result) => {
      conn.release();
      console.log("Get Vehicle Project Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updateVmap(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(SELECT p.id,p.project_id,p.vehicle_id,p.state_id,p.district_id,p.start_date,
                p.end_date,p.cby,p.mby FROM vehicle_pro_map p 
                where p.id='${data.id}') count`;
        console.log("expensetype query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count == 0) {
          errorvalue.push({
            msg: "Vehicle Project Map Info Error",
            err_code: 1789,
          });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.vehicle_pro_map set project_id=${data.project_id},
                    vehicle_id=${data.vehicle_id}, state_id=${data.state_id},district_id=${data.district_id},
                    start_date='${data.start_date}',mby=${jwt_data.user_id},mdate=NOW()`;
          if (data.end_date) sqlupdate += ` ,end_date='${data.end_date}' `;
          sqlupdate += ` where id=${data.id}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let unmapv = ` update vechicle set vehicle_map_id=null `,
              logstatus = false;
            if (data.project_id != null && data.project_id != "")
            unmapv += ` ,project_id=${data.project_id}`;
            unmapv += ` WHERE id=${data.vehicle_id}`;
            if (data.end_date) {
              console.log("unmapv :", unmapv);
              unmapv = await conn.query(unmapv);
              if (unmapv[0]["affectedRows"] > 0) {
                logstatus = true;
              }
            } else {
              logstatus = true;
            }
            if (logstatus) {
              let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='VEHICLE PROJECT MAP INFO  UPDATED ID:${data.vsid}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
              console.log(logQuery);
              let logres = await conn.query(logQuery);
              if (logres["affectedRows"] > 0 && logres["insertId"] > 0)
                console.log("log added successfully");
              errorvalue.push({
                msg: "Vehicle Project updated Successfully",
                err_code: 0,
              });
              await conn.commit();
            }
          } else {
            errorvalue.push({
              msg: "Please Try After Sometimes",
              err_code: 1823,
            });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("catch error", err);
      }
    } else {
      //Log the Connection Error entered into the else part
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("UpdateVmap Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

vehicle.post("/updateVmap", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await updateVmap(req);
  res.end(JSON.stringify(result));
});

////----Bulk Project Assigning----/////
async function bulkVproject(req) {
  return new Promise(async (resolve, reject) => {
    var data = req.body,
      errorarray = [];
    let conn = await poolPromise.getConnection();
    const jwt_data = req.jwt_data;
    if (conn) {
      console.log("Add file", data.bulk.length);
      for (var i = 0; i < data.bulk.length; i++) {
        await conn.beginTransaction();
        try {
          let b = data.bulk[i];
          console.log("Vehicle Project assign data", b);
          let projid = "",
            vid = "",
            distid = "",
            stateid = `SELECT id from states WHERE name='${b.state_id}'`;
          console.log("States Query :", stateid);
          stateid = await conn.query(stateid);
          if (stateid[0].length == 1) {
            stateid = stateid[0][0].id;
            distid = `SELECT id from districts WHERE name='${b.district_id}' AND state_id=${stateid}`;
            distid = await conn.query(distid);
            console.log(distid, "Distid");
            if (distid[0].length == 1) {
              distid = distid[0][0].id;
              vid = `SELECT id from vechicle WHERE regno='${b.vehicle_id}' `;
              vid = await conn.query(vid);
              if (vid[0].length == 1) {
                vid = vid[0][0].id;
                console.log(vid, "vieeee--------------------");
                projid = `SELECT project_id from p_project_mas WHERE project_title='${b.project_id}'`;
                console.log("projid : ", projid);
                projid = await conn.query(projid);
                projid = projid[0][0].project_id;
                b["state_id"] = stateid;
                b["district_id"] = distid;
                b["jwt_data"] = jwt_data;
                b["vehicle_id"] = vid;
                b["project_id"] = projid;
                b["conn"] = conn;
                console.log("addVproj :", b);
                let res = await addVproj(b);
                console.log("res :", res);
                // res[0]['vehicle_id'] = b['vehicle_id'];
                console.log(res[0], "===res");
                errorarray.push(res[0]);
              } else {
                errorarray.push({
                  msg: "Project name does not matched",
                  error_msg: 1664,
                });
                await conn.rollback();
                continue;
              }
            } else {
              errorarray.push({
                msg: "District & State name does not matched",
                error_msg: 1669,
              });
              await conn.rollback();
              continue;
            }
          } else {
            errorarray.push({
              msg: "State Name Does Not Matched.",
              error_msg: 1674,
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
      console.log("BulkVproject Connection Closed");
      conn.release();
    } else {
      return resolve({ msg: "Please Try After Sometimes", error_msg: "CONN" });
    }
    return resolve(errorarray);
  });
}

vehicle.post("/bulkVproject",/*schema.vehicleschema, schema.validate,*/ async (req, res) => {
    console.log("Bulk Vehicle Project Assign----",req.body);
    req.setTimeout(864000000);  
    let result = await bulkVproject(req);
    console.log(result);
    res.end(JSON.stringify(result));
  }
);

/////---Vehicle Track---/////
async function addVehicletrack(req) {
  return new Promise(async (resolve, reject) => {
    let data = req.body == null ? req : req.body,jwt_data = req.jwt_data,errorvalue = [];
    let conn = await poolPromise.getConnection(),stop_status = false,close_status = false;
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `SELECT EXISTS (SELECT vehicle_km_id,vehicle_id,opening_km,closing_km,mobile_no,jcname
                FROM vehicle_track WHERE vehicle_id=${data.regNo} and date='${data.date}' and vkm_status != 99) count`;
        console.log("Track query", sqlquery);
        let resp = await conn.query(sqlquery);
        console.log("result", resp);
        if (resp[0][0].count == 1) {
          console.log("Vehicle Km Already Added On That Date");
          errorvalue.push({ msg: "Vehicle Km Already Added On That Date.", err_code: 2239 });
          await conn.rollback();
        } else {
          if (data.bulkstatus == 0) close_status = true;
          if (data.bulkstatus == 1) {
            if (
              data.closing_km == null ||
              data.closing_km == "" ||
              data.closing_km == 0
            ) {
              errorvalue.push({
                msg: "Vehicle Closing Km Missing.",
                err_code: 2239,
              });
              await conn.rollback();
            } else {
              close_status = true;
            }
          }
          if (close_status) {
            let sqlinsert = `insert into veremaxpo.vehicle_track set vehicle_id='${data.regNo}',date='${data.date}',opening_km=${data.opening_km},project_id=${data.project},
                    vehicle_type=${data.vehicletype},state_id=${data.circle_name},district_id=${data.cluster},activity='${data.activity}',created_by=${jwt_data.user_id},cdate=NOW()`;

            if (data.mobile_no) sqlinsert += ` ,mobile_no=${data.mobile_no}`;
            if (data.closing_km) sqlinsert += ` ,closing_km=${data.closing_km}`;
            if (data.act_driver) sqlinsert += ` ,acting_driver='${data.act_driver}'`;
            if (data.companyname) sqlinsert += ` ,company_id=${data.companyname}`;
            if (data.vendorname) sqlinsert += ` ,vendor_name='${data.vendorname}'`;
            if (data.drivername) sqlinsert += ` ,emp_id='${data.drivername}'`;
            if (data.driver) sqlinsert += ` ,driver=${data.driver}`;
            if (data.jcname) sqlinsert += ` ,jcname='${data.jcname}'`;

            console.log("insert query", sqlinsert);
            let result = await conn.query(sqlinsert);
            console.log("result", result[0]);
            if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
              let updatetrack = "";
              if (data.bulkstatus == 0)
                updatetrack = `UPDATE vechicle SET vehicle_track_id=${result[0]["insertId"]} WHERE id= ${data.regNo}`;
              if (data.bulkstatus == 1)
                updatetrack = `UPDATE vechicle SET vehicle_track_id=0 WHERE id= ${data.regNo}`;
              console.log("Updatetrack : ", updatetrack);
              updatetrack = await conn.query(updatetrack);
              if (updatetrack[0]["affectedRows"] > 0) {
                stop_status = true;
              } else {
                errorvalue.push({ msg: "Failed to Update", err_code: 2278 });
                await conn.rollback();
              }
              if (stop_status) {
                let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='VEHICLE TRACK INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}'`;
                console.log(logQuery);
                let logres = await conn.query(logQuery);
                console.log("logres : ",logres[0]["affectedRows"],logres[0]["insertId"]);
                if (logres[0]["affectedRows"] > 0 &&logres[0]["insertId"] > 0) {
                  console.log("Vehicle Start Km Added Successfully");
                  errorvalue.push({msg: "Vehicle Start Km Added Successfully",err_code: 0});
                  await conn.commit();
                } else {
                  errorvalue.push({ msg: "Update Failed.", err_code: 2335 });
                  await conn.rollback();
                }
              } else {
                errorvalue.push({
                  msg: "Please Try After Sometimes",
                  err_code: 2278,
                });
                await conn.rollback();
              }
            } else {
              errorvalue.push({
                msg: "Please Try After Sometimes",
                err_code: 2282,
              });
              await conn.rollback();
            }
          }
        }
      } catch (err) {
        console.log("Catch Block Error", err);
        errorvalue.push({
          msg: "Please Enter Required Fields",
          err_code: "2288",
        });
        await conn.rollback();
      }
    } else {
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("AddVehicletrack Connection Closed.", errorvalue);
    return resolve(errorvalue);
  });
}

vehicle.post("/addVehicletrack", async (req, res) => {
  req.setTimeout(864000000);
  console.log(req.body);
  const validation = joiV.vehicletrackDataSchema.validate(req.body);
  if (validation.error) {
    console.log(validation.error.details);
    return res.json([
      { msg: validation.error.details[0].message, err_code: "522" },
    ]);
  }
  let result = await addVehicletrack(req);
  res.end(JSON.stringify(result));
});

vehicle.post("/listVehicletracking", (req, res) => {
  let data = req.body,jwtdata = req.jwt_data,where = [],value = [];
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbus = ` SELECT vtk.vehicle_km_id,vtk.vehicle_id,v.regno,vtk.project_id,p.project_title,vtk.jcname,vtk.opening_km,vtk.closing_km,(if(vtk.closing_km=0,0,vtk.closing_km - vtk.opening_km)) AS run_km,
            vtk.created_by,um.username createdname,DATE_FORMAT(vtk.date,'%Y-%m-%d') trackdate,cv.company_name,vtk.company_id,vtk.acting_driver,vtk.emp_id,e.full_name,vtk.vehicle_type,vt.vehicle_type,vtk.vendor_name,
            vtk.state_id,s.name statename,vtk.district_id,mp.name ,vtk.activity,vtk.mobile_no,vtk.jcname
            FROM vehicle_track vtk
            INNER JOIN vechicle v ON v.id = vtk.vehicle_id
            INNER JOIN p_project_mas p ON p.project_id=vtk.project_id
            INNER JOIN employee_mas um ON um.user_id=vtk.created_by
            INNER JOIN vehicle_type vt ON vt.vehicle_id = vtk.vehicle_type
            INNER JOIN company_v cv ON cv.company_id = vtk.company_id
            LEFT JOIN employee e ON e.emp_id_pk=vtk.emp_id
            LEFT JOIN states s ON s.id=vtk.state_id
            LEFT JOIN districts mp ON mp.id=vtk.district_id `,
      sqlqueryc = ` SELECT COUNT(*) total   FROM vehicle_track vtk
            INNER JOIN vechicle v ON v.id = vtk.vehicle_id
            INNER JOIN p_project_mas p ON p.project_id=vtk.project_id
            INNER JOIN employee_mas um ON um.user_id=vtk.created_by
            INNER JOIN vehicle_type vt ON vt.vehicle_id = vtk.vehicle_type
            INNER JOIN company_v cv ON cv.company_id = vtk.company_id
            LEFT JOIN employee e ON e.emp_id_pk=vtk.emp_id
            LEFT JOIN states s ON s.id=vtk.state_id
            LEFT JOIN districts mp ON mp.id=vtk.district_id `;
    console.log("Get Count Query :");

    if (data.hasOwnProperty("like") && data.like) where.push(' v.regno LIKE "%' + data.like + '%"');
    if (data.hasOwnProperty("project_id") && data.project_id) where.push(" vtk.project_id= " + data.project_id);
    if (data.hasOwnProperty("cluster") && data.cluster) where.push(" vtk.district_id= " + data.cluster);
    if (data.hasOwnProperty("state_id") && data.state_id) where.push(" vtk.state_id= " + data.state_id);
    if (data.hasOwnProperty("regNo") && data.regNo) where.push(" v.id= " + data.regNo);

    // if (jwtdata.logintype == 4){
    //   where.push( `  vtk.state_id= ${jwtdata.stateid} and vtk.district_id= ${jwtdata.districtid} ` );
    // }

    if (where.length > 0) {
      sqlbus += " where " + where.join(" AND ");
      sqlqueryc += " where " + where.join(" AND ");
    }
    if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
      sqlbus += " ORDER BY vtk.vehicle_km_id DESC LIMIT " + data.index + ", " + data.limit;
      console.log(data.index, data.limit, "sql");
    }
    console.log("sqlbus", sqlbus);
    console.log("sqlqueryc", sqlqueryc);
    pool.getConnection((err, conn) => {
      if (err) {
        console.log("List Vehicle Failed....");
        res.send(JSON.stringify("Failed"));
      } else {
        let sql = conn.query(sqlbus, function (err, result) {
          value.push(result);
          if (!err) {
            sql = conn.query(sqlqueryc, function (err, result) {
              conn.release();
              console.log("ListVehicletracking Connection Closed.");
              if (!err) {
                value.push(result[0]);
                res.send(JSON.stringify(value));
              } else {
                console.log("Query Failed");
                res.send(JSON.stringify(result));
              }
            });
          } else {
            console.log("error", err);
            conn.release();
            console.log("ListVehicletracking Connection Closed.");
            res.send(JSON.stringify(result));
          }
        });
      }
    });
  });
});

vehicle.post("/getVehicletrack", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbus = ` SELECT   vm.id,vt.vehicle_km_id,vt.vehicle_id,vt.DATE,vt.opening_km,vt.closing_km,vt.company_id,vt.project_id,
        vt.vendor_name,vt.emp_id,vt.acting_driver,vt.vehicle_type,vt.state_id,
        vt.district_id,vt.activity,vt.vkm_status,vt.created_by,vt.cdate,vt.updated_by,vt.udate,vt.driver,vt.mobile_no,vt.jcname
        FROM vehicle_track vt
        LEFT JOIN vehicle_pro_map vm ON  vt.vehicle_id=vm.vehicle_id
        WHERE vt.vehicle_km_id=${data.vehicle_km_id} `;
    console.log("Query---", sqlbus);
    let sql = conn.query(sqlbus, (err, result) => {
      conn.release();
      console.log("GetVehicletrack Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updateVehicletrack(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,
      errorvalue = [],
      closing_status = false,
      updatevckm = "";
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = ` SELECT vehicle_km_id,vehicle_id,opening_km,closing_km,mobile_no,jcname FROM vehicle_track WHERE vehicle_km_id=${data.vehicle_km_id} `;
        console.log("Expensetype Query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp[0]);
        if (resp[0].length == 0) {
          errorvalue.push({
            msg: "Vehicle Stop Km Info Error",
            err_code: 2224,
          });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.vehicle_track set vehicle_id=${data.regNo},
                    date='${data.date}',opening_km=${data.opening_km},project_id=${data.project},
                    vehicle_type=${data.vehicletype},state_id=${data.circle_name},
                    district_id=${data.cluster},activity='${data.activity}',
                    created_by=${jwt_data.user_id},cdate=NOW()`;

          if (data.mobile_no) sqlupdate += ` ,mobile_no=${data.mobile_no}`;

          if (data.closing_km) {
            sqlupdate += ` ,closing_km=${data.closing_km}`;
            updatevckm = `update veremaxpo.vechicle v set v.closing_kms = ${data.closing_km},vehicle_track_id = 0 where v.id=${data.regNo}`;
          }

          if (data.act_driver)
            sqlupdate += ` ,acting_driver='${data.act_driver}'`;
          if (data.companyname) sqlupdate += ` ,company_id=${data.companyname}`;
          if (data.vendorname)
            sqlupdate += ` ,vendor_name='${data.vendorname}'`;
          if (data.drivername) sqlupdate += ` ,emp_id='${data.drivername}' `;
          if (data.jcname) sqlupdate += ` ,jcname='${data.jcname}'`;

          sqlupdate += ` where vehicle_km_id= ${data.vehicle_km_id} `;
          console.log("Update Query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (updatevckm != "") {
            updatevckm = await conn.query(updatevckm);
            if (updatevckm[0]["affectedRows"] > 0) {
              closing_status = true;
            } else {
              closing_status = false;
            }
          } else {
            closing_status = true;
          }
          if (closing_status && result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='VEHICLE SERVICE INFO  UPDATED ID:${
              data.vsid
            }',\`longtext\`='DONE BY',cby=${
              jwt_data.user_id
            },data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres["affectedRows"] > 0 && logres["insertId"] > 0)
              console.log("Vehicle Stop Km updated Successfully");
            errorvalue.push({
              msg: "Vehicle Stop Km updated Successfully",
              err_code: 0,
            });
            await conn.commit();
          } else {
            errorvalue.push({
              msg: "Please Try After Sometimes",
              err_code: 2374,
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
    console.log("UpdateVehicletrack Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

vehicle.post("/updateVehicletrack", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await updateVehicletrack(req);
  res.end(JSON.stringify(result));
});

async function bulkvehicletrack(req) {
  return new Promise(async (resolve, reject) => {
    var data = req.body,errorarray = [];
    let conn = await poolPromise.getConnection();
    const jwt_data = req.jwt_data;
    if (conn) {
      console.log("Add file", data.bulk.length);
      for (var i = 0; i < data.bulk.length; i++) {
        await conn.beginTransaction();
        try {
          let d = data.bulk[i],vid = {};
          console.log("Vehicletrack Data", d);
          let compid = "",projectid = "",typeid = "",distid = "",vehid = "",
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
              typeid = `SELECT * from vechicle WHERE regno='${d.regNo}'`;
              typeid = await conn.query(typeid);
              if (typeid[0].length == 0) {
                errorarray.push({
                  msg: "Department does not matched",
                  error_msg: 2326,
                });
                await conn.rollback();
                continue;
              }
              compid = `SELECT company_id from company_v WHERE company_name='${d.companyname}'`;
              compid = await conn.query(compid);
              if (compid[0].length == 0) {
                errorarray.push({
                  msg: "Company Name does not matched",
                  error_msg: 2461,
                });
                await conn.rollback();
                continue;
              }
              vehid = `SELECT id from vechicle WHERE regno='${d.regNo}'`;
              vehid = await conn.query(vehid);
              vehid = vehid[0][0].id;
              if (d.project) {
                projectid = `SELECT project_id  from p_project_mas WHERE project_title='${d.project}'`;
                projectid = await conn.query(projectid);
                // console.log(projectid[0]);
                if (projectid[0].length == 0) {
                  errorarray.push({
                    msg: "Project Title Not Found.",
                    error_msg: 2438,
                  });
                  await conn.rollback();
                  continue;
                }
              } else {
                console.log("Project Title");
              }
              vid["date"] = d.date.slice(0, 10);
              vid["drivername"] = d.drivername;
              vid["driver"] = d.driver;
              vid["act_driver"] = d.act_driver;
              vid["mobile_no"] = d.mobile_no;
              vid["jcname"] = d.jcname;
              vid["project"] = projectid[0][0]["project_id"];
              vid["regNo"] = typeid[0][0].id;
              vid["opening_km"] = d.opening_km;
              vid["closing_km"] = d.closing_km;
              vid["circle_name"] = stateid;
              vid["cluster"] = distid;
              vid["companyname"] = compid[0][0].company_id;
              vid["vehicletype"] = typeid[0][0].vehicle_type;
              vid["activity"] = d.activity;
              vid["jwt_data"] = jwt_data;
              vid["bulkstatus"] = 1;

              console.log("bulkvtrack", vid);
              let res = await addVehicletrack(vid);
              console.log("res", res);
              errorarray.push(res[0]);
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
      console.log("Bulkvehicletrack Connection Closed");
    } else {
      return resolve({ msg: "Please Try After Sometimes", error_msg: "CONN" });
    }
    return resolve(errorarray);
  });
}

vehicle.post("/bulkvehicletrack",/*schema.vehicleschema, schema.validate,*/ async (req, res) => {
    console.log("Bulk Vehicle Track-----",req.body);
    req.setTimeout(864000000);
    let result = await bulkvehicletrack(req);
    console.log(result);
    res.end(JSON.stringify(result));
  }
);

/////---Company Name API LIST---/////
vehicle.post("/listcompany", (req, res) => {
  let data = req.body,sqlc;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    sqlc = `SELECT company_id,company_name from company_v`;
    console.log("Query---", sqlc);
    let sql = conn.query(sqlc, (err, result) => {
      conn.release();
      console.log("Listcompany Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

////----Vehicle Track Report----/////
vehicle.post("/listvehicleactivedate", (req, res) => {
  let data = req.body,where = [],value = [];
  console.log("Data--", data);
  let sqlbus = ` SELECT v.id,v.regno,vt.vehicle_type,c.company_name,s.name statename,d.name distname,p.project_title,vtr.jcname,vtr.date,vtr.emp_id,vtr.acting_driver,vtr.mobile_no,YEAR(vtr.date) year,MONTH(vtr.date) mm
    ,SUM(CASE WHEN DAY(vtr.date) = 1  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'one_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 1  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'one_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 1  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'one_km'
    ,SUM(CASE WHEN DAY(vtr.date) = 2  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'two_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 2  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'two_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 2  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'two_km'
    ,SUM(CASE WHEN DAY(vtr.date) = 3  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'three_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 3  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'three_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 3  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'three_km'     
    ,SUM(CASE WHEN DAY(vtr.date) = 4  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'four_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 4  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'four_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 4  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'four_km'
    ,SUM(CASE WHEN DAY(vtr.date) = 5  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'five_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 5  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'five_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 5  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'five_km'  
    ,SUM(CASE WHEN DAY(vtr.date) = 6  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'six_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 6  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'six_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 6  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'six_km'       
    ,SUM(CASE WHEN DAY(vtr.date) = 7  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'seven_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 7  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'seven_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 7  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'seven_km'     
    ,SUM(CASE WHEN DAY(vtr.date) = 8  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'eight_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 8  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'eight_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 8  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'eight_km'     
    ,SUM(CASE WHEN DAY(vtr.date) = 9  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'nine_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 9  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'nine_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 9  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'nine_km'      
    ,SUM(CASE WHEN DAY(vtr.date) = 10 THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'ten_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 10 THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'ten_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 10  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'ten_km'      
    ,SUM(CASE WHEN DAY(vtr.date) = 11  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'eleven_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 11  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'eleven_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 11  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'eleven_km'   
    ,SUM(CASE WHEN DAY(vtr.date) = 12  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'twelve_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 12  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'twelve_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 12  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'twelve_km'   
    ,SUM(CASE WHEN DAY(vtr.date) = 13  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'thirteen_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 13  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'thirteen_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 13  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'thirteen_km' 
    ,SUM(CASE WHEN DAY(vtr.date) = 14  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'fourteen_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 14  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'fourteen_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 14  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'fourteen_km' 
    ,SUM(CASE WHEN DAY(vtr.date) = 15  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'fifteen_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 15  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'fifteen_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 15  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'fifteen_km'  
    ,SUM(CASE WHEN DAY(vtr.date) = 16  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'sixteen_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 16  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'sixteen_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 16  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'sixteen_km'  
    ,SUM(CASE WHEN DAY(vtr.date) = 17  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'seventeen_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 17  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'seventeen_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 17  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'seventeen_km'
    ,SUM(CASE WHEN DAY(vtr.date) = 18  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'eighteen_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 18  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'eighteen_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 18  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'eighteen_km' 
    ,SUM(CASE WHEN DAY(vtr.date) = 19  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'nineteen_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 19  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'nineteen_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 19  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'nineteen_km' 
    ,SUM(CASE WHEN DAY(vtr.date) = 20  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'twenty_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 20  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'twenty_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 20  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'twenty_km'   
    ,SUM(CASE WHEN DAY(vtr.date) = 21  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'twentyone_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 21  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'twentyone_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 21  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'twentyone_km'    
    ,SUM(CASE WHEN DAY(vtr.date) = 22  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'twentytwo_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 22  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'twentytwo_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 22  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'twentytwo_km'
    ,SUM(CASE WHEN DAY(vtr.date) = 23  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'twentythree_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 23  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'twentythree_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 23  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'twentythree_km'
    ,SUM(CASE WHEN DAY(vtr.date) = 24  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'twentyfour_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 24  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'twentyfour_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 24  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'twentyfour_km' 
    ,SUM(CASE WHEN DAY(vtr.date) = 25  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'twentyfive_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 25  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'twentyfive_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 25  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'twentyfive_km' 
    ,SUM(CASE WHEN DAY(vtr.date) = 26  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'twentysix_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 26  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'twentysix_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 26  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'twentysix_km'    
    ,SUM(CASE WHEN DAY(vtr.date) = 27  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'twentyseven_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 27  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'twentyseven_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 27  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'twentyseven_km'
    ,SUM(CASE WHEN DAY(vtr.date) = 28  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'twentyeight_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 28  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'twentyeight_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 28  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'twentyeight_km'
    ,SUM(CASE WHEN DAY(vtr.date) = 29  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'twentynine_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 29  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'twentynine_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 29  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'twentynine_km' 
    ,SUM(CASE WHEN DAY(vtr.date) = 30  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'thirty_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 30  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'thirty_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 30  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'thirty_km'   
    ,SUM(CASE WHEN DAY(vtr.date) = 31  THEN IFNULL(vtr.opening_km,0) ELSE 0 END) 'thirtyone_open'
    ,SUM(CASE WHEN DAY(vtr.date) = 31  THEN IFNULL(vtr.closing_km,0) ELSE 0 END) 'thirtyone_close'
    ,SUM(CASE WHEN DAY(vtr.date) = 31  THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'thirtyone_km'
    ,SUM(CASE WHEN DAY(vtr.date) > 0   THEN (IFNULL(vtr.closing_km,0)-IFNULL(vtr.opening_km,0)) ELSE 0 END) 'totrunkm'   
    FROM veremaxpo.vehicle_track vtr
    INNER JOIN p_project_mas p ON p.project_id=vtr.project_id
    INNER JOIN vehicle_type vt ON vtr.vehicle_type=vt.vehicle_id
    INNER JOIN company_v c ON vtr.company_id=c.company_id
    INNER JOIN vechicle v ON v.id=vtr.vehicle_id
    LEFT JOIN states s ON vtr.state_id=s.id
    LEFT JOIN districts d ON vtr.district_id=d.id `,
    sqlqueryc = ` SELECT COUNT(*) total FROM vehicle_track vtr
    INNER JOIN p_project_mas p ON p.project_id=vtr.project_id
    INNER JOIN vehicle_type vt ON vtr.vehicle_type=vt.vehicle_id
    INNER JOIN company_v c ON vtr.company_id=c.company_id
    INNER JOIN vechicle v ON v.id=vtr.vehicle_id
    LEFT JOIN states s ON vtr.state_id=s.id
    LEFT JOIN districts d ON vtr.district_id=d.id `;
  console.log("Get Count Query :", sqlqueryc); //GROUP BY v.id,year(vtr.date),MONTH(vtr.date)

  if (data.hasOwnProperty("like") && data.like)
    where.push(' v.regno LIKE "%' + data.like + '%"');
  if (data.hasOwnProperty("project_id") && data.project_id)
    where.push(" vtr.project_id= " + data.project_id);
  if (data.hasOwnProperty("state_id") && data.state_id)
    where.push(" vtr.state_id= " + data.state_id);
  if (data.hasOwnProperty("cluster") && data.cluster)
    where.push(" vtr.district_id= " + data.cluster);
  if (data.hasOwnProperty("regNo") && data.regNo)
    where.push(" v.id= " + data.regNo);
  if (data.hasOwnProperty("year") && data.year)
    where.push(' YEAR(vtr.date)= "' + data.year + '"');
  if (data.hasOwnProperty("mm") && data.mm)
    where.push(' MONTH(vtr.date)= "' + data.mm + '"');

  if (where.length > 0) {
    sqlbus += " where" + where.join(" AND ");
    sqlqueryc += " where " + where.join(" AND ");
  }
  // if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
  //     sqlbus += ' ORDER BY v.id DESC LIMIT ' + data.index + ', ' + data.limit;
  // }
  sqlbus += " GROUP BY v.id,MONTH(vtr.date),DAY(vtr.date) ";
  if (data.index != null && data.limit != null) {
    sqlbus += " LIMIT " + data.index + "," + data.limit;
  }
  console.log("sqlbus", sqlbus);
  console.log("sqlqueryc", sqlqueryc);
  pool.getConnection((err, conn) => {
    if (err) {
      console.log("List Vehicle Activedate Failed....");
      res.send(JSON.stringify("Failed"));
    } else {
      let sql = conn.query(sqlbus, function (err, result) {
        value.push(result);
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log("Listvehicleactivedate Connection Closed.");
            if (!err) {
              value.push(result[0]);
              res.send(JSON.stringify(value));
            } else {
              console.log("Query Failed");
              res.send(JSON.stringify(result));
            }
          });
        } else {
          console.log("error", err);
          conn.release();
          console.log("Listvehicleactivedate Connection Closed.");
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

vehicle.post("/listvehicle_type", (req, res) => {
  let data = req.body,where = [],value = [];
  console.log("Data--", data);
  let sqlbus = `SELECT vt.vehicle_id,vt.vehicle_type FROM vehicle_type vt`,
    sqlqueryc = `SELECT count(*) total from vehicle_type`;

  if (data.like) where.push(` vehicle_type like '%${data.like}%'`);
  if (data.hasOwnProperty("vehicle_id") && data.vehicle_id)
    where.push(" vt.vehicle_id = " + data.vehicle_id);

  if (where.length > 0) sqlbus += " where " + where.join(" AND ");

  console.log("Get Count Query :", sqlbus);
  pool.getConnection((err, conn) => {
    if (err) {
      console.log("List  Failed....");
      res.send(JSON.stringify("Failed"));
    } else {
      let sql = conn.query(sqlbus, function (err, result) {
        value.push(result);
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log("Listvehicle_type Connection Closed.");
            if (!err) {
              value.push(result[0]);
              res.send(JSON.stringify(value));
            } else {
              console.log("Query Failed");
              res.send(JSON.stringify(result));
            }
          });
        } else {
          console.log("error", err);
          conn.release();
          console.log("Listvehicle_type Connection Closed.");
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

/////----Vehicle Type----/////
async function addvehtyp(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("Add Data", data);
        let sqlquery = `SELECT exists(select * from vehicle_type WHERE vehicle_type ='${data.vehicletype}') count`;
        console.log("client query", sqlquery);
        let resp = await conn.query(sqlquery);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          console.log("vehicle_type exists");
          errorvalue.push({ msg: "vehicle_type already exists", err_code: 46 });
          await conn.rollback();
        } else {
          let sqlinsert = `insert into vehicle_type set vehicle_type='${data.vehicletype}'`;
          console.log("insert query", sqlinsert);
          let result = await conn.query(sqlinsert);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='VEHICLETYPE INFO  ADDED ID:${
              result[0]["insertId"]
            }',\`longtext\`='DONE BY',cby=${
              jwt_data.user_id
            },data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0)
              errorvalue.push({
                msg: "Vehicletype Added Successfully",
                err_code: 0,
              });
            await conn.commit();
          } else {
            errorvalue.push({
              msg: "Please Try After Sometimes",
              err_code: 56,
            });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("catch error", err);
      }
    } else {
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("addvehtyp connection closed", errorvalue);
    return resolve(errorvalue);
  });
}

vehicle.post("/addvehtyp", async (req, res) => {
  req.setTimeout(864000000);
  console.log("dhcbg---------", req.body);
  const validation = joiValidate.vehicleeditDataSchema.validate(req.body);
  if (validation.error)
    return res.json([
      { msg: validation.error.details[0].message, err_code: "422" },
    ]);
  let result = await addvehtyp(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

vehicle.post("/listvehicletype", (req, res) => {
  let data = req.body,sql,value = [];
  console.log("Data--", data);
  // return;
  let sqlbuss = `SELECT vehicle_id,vehicle_type FROM vehicle_type`,
    sqlqueryc = `SELECT count(*) total from vehicle_type `;

  if ( data.hasOwnProperty("vehicle_type") && data.vehicle_type != "" && data.vehicle_type != null) {
    sqlbuss += " AND vehicle_type = " + data.vehicle_type;
  }
  // if (data.hasOwnProperty("like") && data.like != "") {
  //   // sqlquery += ' LIMIT 10 ';
  // }
  console.log("Get Count Query :");
  pool.getConnection((err, conn) => {
    if (err) {
      console.log("List  Failed....");
      res.send(JSON.stringify("Failed"));
    } else {
      sql = conn.query(sqlbuss, function (err, result) {
        value.push(result);
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log("Listvehicletype Connection Closed");
            if (!err) {
              value.push(result[0]);
              res.send(JSON.stringify(value));
            } else {
              console.log("Query Failed");
              res.send(JSON.stringify(result));
            }
          });
        } else {
          console.log("error", err);
          conn.release();
          console.log("Listvehicletype Connection Closed.");
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

vehicle.post("/getvehicletype", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbuss = `Select vehicle_id,vehicle_type from veremaxpo.vehicle_type where vehicle_id=${data.vid}`;
    console.log("Query---", sqlbuss);
    let sqlg = conn.query(sqlbuss, data.vid, (err, result) => {
      conn.release();
      console.log("Getvehicletype Connection Closed. ");
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updatevehtype(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from vehicle_type where vehicle_type ='${data.vehicletype}') count`;
        console.log("vehicletype query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          errorvalue.push({ msg: "Vehicletype Already Exists", err_code: 126 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.vehicle_type set vehicle_type='${data.vehicletype}'`;
          sqlupdate += ` where vehicle_id= ${data.vid}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='VEHICLETYPE INFO  UPDATED ID:${
              data.vid
            }',\`longtext\`='DONE BY',cby=${
              jwt_data.user_id
            },data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0)
              errorvalue.push({
                msg: "Vehicletype Updated Successfully",
                err_code: 0,
              });
            await conn.commit();
          } else {
            errorvalue.push({
              msg: "Please Try After Sometimes",
              err_code: 151,
            });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("catch error", err);
      }
    } else {
      //Log the Connection Error entered into the else part
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("Updatevehtype Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

vehicle.post("/updatevehtype", async (req, res) => {
  console.log("Update Vehicle Type----",req.body);
  req.setTimeout(864000000);
  let result = await updatevehtype(req);
  res.end(JSON.stringify(result));
});

// const storage = multer.diskStorage({
//   destination: function (req, file, callback) {
//     console.log(file.originalname, "file", file);
//     let namefile = file.originalname.split("-")[0],folder_status = false;
//     const fs = require("fs");
//     const filename = namefile;
//     const imagePath = `${__dirname}/../Documents/ResellerLogo/${filename}`;
//     fs.exists(imagePath, (exists) => {
//       if (exists) {
//         folder_status = true;
//         console.log(" Directory Already created.");
//       } else {
//         folder_status = true;
//         fs.mkdir(imagePath, { recursive: true }, function (err) {
//           if (err) {
//             console.log(err);
//           } else {
//             console.log("New directory successfully created.");
//           }
//         });
//       }
//       if (folder_status) {
//         callback(null, imagePath);
//       }
//     });
//   },
//   filename: function (req, file, callback) {
//     console.log("Filename", file.originalname);
//     let nowdate = new Date();
//     let edate = nowdate.toISOString().replace(/T/, "-").replace(/\..+/, "").slice(0, 16);
//     let file_name = file.originalname.split("-")[1];
//     // callback(null, file_name + '-' + nowdate.toISOString().slice(0, 10) + '.' + file.mimetype.split('/')[1])
//     callback(
//       null,
//       file_name + "-" + nowdate.toISOString().slice(0, 10) + "." + "png"
//     );
//   },
// });

vehicle.post("/getvehicleservicetype", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbuss = `select vstid,servicetypename from veremaxpo.vehicle_service_type `;
    console.log("Getvehicleservicetype Query---", sqlbuss);
    if (data.vstid) sqlbuss += ` where vstid = ${data.vstid}`;
    let sqlg = conn.query(sqlbuss, (err, result) => {
      conn.release();
      console.log("Getvehicleservicetype Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        // console.log(result)
        res.send(JSON.stringify(result));
      }
    });
  });
});

/** Vehicle Daily KM API */
const addVehicleDailyKM = async (req) => {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,
      errorarray = [],
      check,
      log_status = false,
      id,
      conn = await poolPromise.getConnection();
    console.log("Add Vehicle DailyKM Data--", data);
    if (conn) {
      await conn.beginTransaction();
      try {
        delete data.vfile1;
        delete data.vfile2;
        // data = {...data,created_by:jwt_data.user_id,cdate:new Date()}
        if (data.flag == 1)
          check = `SELECT vehicle_km_id,vehicle_id,opening_km,closing_km FROM vehicle_km WHERE vehicle_id=${data.vehicle_id} and DATE_FORMAT(cdate,'%Y-%m-%d')= CURRENT_DATE() and vkm_status != 99 `;
        if (data.flag == 2)
          check = `SELECT vehicle_km_id,vehicle_id,opening_km,closing_km FROM vehicle_km WHERE vehicle_id=${data.vehicle_id} and DATE_FORMAT(cdate,'%Y-%m-%d')= CURRENT_DATE() and vkm_status != 99 and (closing_km IS NULL or closing_km = 0)`;
        console.log("Get data query", check);
        let [[res1]] = await conn.query(check);
        console.log("response 1", res1);
        if (!res1 && data.flag == 1) {
          // Start
          const dailyKmQuery = ` INSERT INTO veremaxpo.vehicle_km SET vehicle_id='${data.vehicle_id}',opening_km='${data.opening_km}',created_by=${jwt_data.user_id}`;
          const [dailyKmResp] = await conn.query(dailyKmQuery, data);
          id = dailyKmResp.insertId;
          if (dailyKmResp["affectedRows"] > 0 && dailyKmResp.insertId > 0) {
            log_status = true;
          }
        } else if (data.flag == 1 && res1) {
          errorarray.push({
            msg: "Vehicle Already Updated With Opening Km",
            err_code: 992,
          });
        }
        if (data.flag == 2 && res1) {
          // Update
          let upkm = `update veremaxpo.vehicle_km SET closing_km='${data.closing_km}',updated_by=${jwt_data.user_id} where vehicle_id='${data.vehicle_id}' and  DATE_FORMAT(cdate,'%Y-%m-%d')=CURDATE()`;
          console.log(upkm, "------------updatekm");
          let [res3] = await conn.query(upkm);
          if (res3["affectedRows"] > 0) {
            log_status = true;
          }
        } else if (data.flag == 2 && !res1) {
          errorarray.push({ msg: "No Data found", err_code: 1002 });
        }
        if (log_status) {
          let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='ADD VEHICLE DAILY KM',\`longtext\`='DONE BY',cby=${
            jwt_data.user_id
          },data='${JSON.stringify(data)}'`;
          let [logResp] = await conn.query(logQuery);
          if (logResp["affectedRows"] > 0 && logResp["insertId"] > 0) {
            await conn.commit();
            errorarray.push({
              msg: "Vehicle DailyKM Status Added Successfully",
              err_code: 0,
              vehicle_km_id: id || data.vehicle_id,
            });
          } else {
            await conn.rollback();
            errorarray.push({
              msg: "Please try after sometimes",
              err_code: 645,
            });
          }
        }
      } catch (e) {
        console.log("Catch Block Error", e);
        errorarray.push({
          msg: "Please try after sometimes",
          err_code: "1017",
        });
        await conn.rollback();
      }
    } else {
      errorarray.push({ msg: "Please try after sometimes", err_code: "CONN" });
    }
    conn.release();
    console.log("AddVehicleDailyKM Connection Closed", errorarray);
    return resolve(errorarray);
  });
};

vehicle.post("/addVehicleDailyKM", async (req, res) => {
  req.setTimeout(864000000);
  const result = await addVehicleDailyKM(req);
  res.json(result);
});

vehicle.post("/listvehiclekm", (req, res) => {
  let data = req.body,
    value = [],
    where = [];
  console.log("Data--", data);
  let sqlbuss = `SELECT vkm.vehicle_km_id,vkm.vehicle_id,v.regno,vkm.opening_km,vkm.closing_km,vkm.vfile1,vkm.vfile2 FROM vehicle_km vkm
    INNER JOIN vechicle v ON v.id =vkm.vehicle_id`,
    sqlqueryc = `Select count(*) total FROM vehicle_km vkm
    INNER JOIN vechicle v ON v.id =vkm.vehicle_id`;
  sqlbuss += where.length ? ` WHERE ${where.join(" AND ")} ` : "";
  sqlqueryc += where.length ? ` WHERE ${where.join(" AND ")} ` : "";
  if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
    sqlbuss +=
      "  ORDER BY vkm.vehicle_km_id DESC LIMIT " +
      data.index +
      ", " +
      data.limit;
  }
  if (
    data.hasOwnProperty("regno") &&
    data.vehicle_id != "" &&
    data.vehicle_id != null
  ) {
    sqlbuss += " AND regno = " + data.vehicle_id;
  }
  console.log("Get Count Query :");
  pool.getConnection((err, conn) => {
    if (err) {
      console.log("List  Failed....");
      res.send(JSON.stringify("Failed"));
    } else {
      sql = conn.query(sqlbuss, function (err, result) {
        value.push(result);
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log("Listvehiclekm Connection Closed.");
            if (!err) {
              value.push(result[0]);
              res.send(JSON.stringify(value));
            } else {
              console.log("Query Failed");
              res.send(JSON.stringify(result));
            }
          });
        } else {
          console.log("error", err);
          conn.release();
          console.log("Listvehiclekm Connection Closed.");
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

//get vehicle kms add
vehicle.post("/getvehiclekm", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbus = `SELECT vehicle_km_id,vehicle_id,opening_km,closing_km FROM vehicle_km WHERE vehicle_id=${data.id}`;
    console.log("Query---", sqlbus);
    let sql = conn.query(sqlbus, (err, result) => {
      conn.release();
      console.log("Getvehiclekm Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        // console.log(result)
        res.send(JSON.stringify(result));
      }
    });
  });
});

const updateVehicleDailyKM = async (req) => {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,
      errorarray = [],
      conn = await poolPromise.getConnection();
    console.log("Update Vehicle DailyKM Data--", data);
    if (conn) {
      await conn.beginTransaction();
      try {
        const vehicleExistQuery = ` SELECT * FROM veremaxpo.vehicle_km WHERE vehicle_km_id = ? `;
        const [[vehicleExistResp]] = await conn.query(
          vehicleExistQuery,
          data.vehicle_km_id
        );
        if (vehicleExistResp.length) {
          data = { ...data, updated_by: jwt_data.user_id, udate: new Date() };
          const dailyKmQuery = ` UPDATE veremaxpo.vehicle_km SET ? `;
          const [[dailyKmResp]] = await conn.query(dailyKmQuery, data);
          if (dailyKmResp.affectedRows > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='UPDATE VEHICLE DAILY KM ID:${
              data.vehicle_km_id
            }',\`longtext\`='DONE BY',cby=${
              jwt_data.user_id
            },data='${JSON.stringify(data)}'`;
            let [logResp] = await conn.query(logQuery);
            if (logResp.affectedRows > 0 && logResp.insertId > 0) {
              await conn.commit();
              errorarray.push({
                msg: "Vehicle DailyKM Status Updated Successfully",
                err_code: 0,
              });
            } else {
              await conn.rollback();
              errorarray.push({
                msg: "Please try after sometimes",
                err_code: 690,
              });
            }
          }
        } else {
          errorarray.push({ msg: "No Data Found", err_code: 695 });
        }
      } catch (e) {
        console.log("catch block error", e);
        errorarray.push({
          msg: "Please try after sometimes",
          err_code: "1186",
        });
        await conn.rollback();
      }
    } else {
      errorarray.push({ msg: "Please try after sometimes", err_code: "CONN" });
    }
    conn.release();
    console.log("Add Daily KM result", errorarray);
    return resolve(errorarray);
  });
};

vehicle.post("/updateVehicleDailyKM", async (req, res) => {
  req.setTimeout(864000000);
  const result = await updateVehicleDailyKM(req);
  res.json(result);
});

/////---KM UPDATE MULTER---/////
const storage1 = multer.diskStorage({
  destination: function (req, file, callback) {
    console.log("request files---", file);
    let namefile = file.originalname.split("-")[0],
      folder_status = false;
    const fs = require("fs");
    const filename = namefile;
    const imagePath = `${__dirname}/../Documents/VehicleKm/${filename}`;
    fs.exists(imagePath, (exists) => {
      if (exists) {
        folder_status = true;
        console.log(" Directory Already created.");
      } else {
        // folder_status = true
        fs.mkdir(imagePath, { recursive: true }, function (err) {
          if (err) {
            console.log(err);
          } else {
            folder_status = true;
            console.log("New directory Successfully Created.");
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
    console.log("File Uploadddd");
    let nowdate = new Date();
    let file_name = file.originalname.split("-")[1];
    let type = file.mimetype == "application/pdf" ? "pdf" : "png";
    callback(
      null,
      file_name + "-" + nowdate.toISOString().slice(0, 10) + "." + type
    );
  },
});

const upload1 = multer({ storage: storage1 }).array("file", 2);

vehicle.post("/uploadVehicleKm", function (req, res) {
  let errorarray = [],
    updateQuery = "",
    data,
    file,
    sqlquery;
  upload1(req, res, function (err) {
    if (err) {
      errorarray.push({ msg: "Upload Failed", err_code: 782 });
      res.json(errorarray);
    } else {
      (data = req.body), (file = req.files);
      console.log("file length", file.length);
      console.log(data, file, "flag----", data.flag);
      if (data.flag == 1) {
        updateQuery += ` vfile1 = '${file[0].filename}'`;
      }
      if (data.flag == 2) {
        updateQuery += ` vfile2 = '${file[0].filename}'`;
      }
      sqlquery = `UPDATE veremaxpo.vehicle_km SET ${updateQuery} WHERE vehicle_id = ${data.vehicle_id}  and date_format(cdate,'%Y-%m-%d')=CURDATE()`;
      console.log("Update Vehicle Km file Query.", sqlquery);
      pool.getConnection((err, conn) => {
        if (err) {
          console.log("Failed");
        } else {
          sql = conn.query(sqlquery, function (err, result) {
            if (!err) {
              conn.release();
              console.log("UploadVehicleKm Connection Closed.");
              if (result.affectedRows > 0) {
                errorarray.push({
                  status: 1,
                  msg: "Vehicle Km Added Succesfully",
                  err_code: 0,
                });
                res.json(errorarray);
              }
            } else {
              errorarray.push({
                msg: "Please try after sometimes",
                error_msg: "714",
              });
              conn.release();
              console.log("UploadVehicleKm Connection Closed.");
              res.json(errorarray);
            }
          });
        }
      });
    }
  });
});

/////---APP GET VEHICLE KMS---/////
vehicle.post("/getuservehiclekm", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let jwt_data = req.jwt_data;
    let sqlbus = `SELECT vehicle_km_id,vehicle_id,opening_km FROM vehicle_km WHERE cby=${jwt_data.user_id}`;
    console.log("Query---", sqlbus);
    let sql = conn.query(sqlbus, (err, result) => {
      conn.release();
      console.log("getuservehiclekm connection closed.");
      if (err) {
        console.log(err);
      } else {
        // console.log(result)
        res.send(JSON.stringify(result));
      }
    });
  });
});

/////---Vehicle Fuel Topup---/////
const addFuelTopup = async (req) => {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,errorarray = [],conn = await poolPromise.getConnection();
    console.log("Add Fuel Topup Data--", data);
    await conn.beginTransaction();
    if (conn) {
      try {
        let check = `SELECT vechicleid,pay_mode,fuel_cardno,fuel_litre,cur_km,vftup_amt FROM vehicle_fuel_topup
                WHERE vechicleid = ${data.vehicle_id} AND date_format(cdate,'%Y-%m-%d')=CURDATE()`;
        let fuelcheck = await conn.query(check);
        if (fuelcheck.length > 0) {
          if (data.pay_mode == 5 && !data.fuel_cardno) {
            errorarray.push({
              msg: "Please Select Fuel Card Number",
              err_code: 730,
            });
          } else {
            delete data.vftup_file1;
            delete data.vftup_file2;
            // data = { ...data, cby: jwt_data.user_id, cdate: new Date() }
            let fuelTopupQuery = ` INSERT INTO veremaxpo.vehicle_fuel_topup SET vechicleid=${data.vehicle_id},
                    pay_mode='${data.pay_mode}',fuel_litre='${data.fuel_litre}',
                    cur_km='${data.cur_km}',vftup_amt='${data.vftup_amt}'`;
            if (data.fuel_cardno != "" && data.fuel_cardno != null)
              fuelTopupQuery += ` ,fuel_cardno='${data.fuel_cardno}'`;
            const fuelTopupResp = await conn.query(fuelTopupQuery, data);
            if (fuelTopupResp[0]["affectedRows"] > 0) {
              let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='ADD FUEL TOPUP',\`longtext\`='DONE BY',cby=${
                jwt_data.user_id
              },data='${JSON.stringify(data)}'`;
              let [logResp] = await conn.query(logQuery);
              if (logResp.affectedRows > 0 && logResp.insertId > 0) {
                await conn.commit();
                errorarray.push({
                  msg: "Fuel Topup Entry Added Successfully",
                  err_code: 0,
                });
              } else {
                await conn.rollback();
                errorarray.push({
                  msg: "Please try after sometimes",
                  err_code: 992,
                });
              }
            } else {
              await conn.rollback();
              errorarray.push({
                msg: "Fuel Topup already exists",
                err_code: 978,
              });
            }
          }
        }
      } catch (e) {
        console.log("catch block error", e);
        errorarray.push({
          msg: "Please try after sometimes",
          err_code: "1298",
        });
        await conn.rollback();
      }
    } else {
      errorarray.push({ msg: "Please try after sometimes", err_code: "CONN" });
    }
    conn.release();
    console.log("Add Daily KM result", errorarray);
    return resolve(errorarray);
  });
};

vehicle.post("/addFuelTopup", async (req, res) => {
  req.setTimeout(864000000);
  const result = await addFuelTopup(req);
  res.json(result);
});

vehicle.post("/listvfueltp", (req, res) => {
  let data = req.body,value = [],where = [];
  console.log("Data--", data);
  let sqlbuss = `SELECT vftp.vftupid,vftp.vechicleid,v.regno,vftp.pay_mode,vftp.fuel_cardno,fc.cardno,vftp.fuel_litre,vftp.cur_km,vftp.vftup_amt,vftp.vftup_file1,
    vftp.vftup_file2,vftp.vftup_status FROM vehicle_fuel_topup vftp
    INNER JOIN vechicle v ON v.id =vftp.vechicleid
    LEFT JOIN vehicle_fuelcard fc ON fc.id= vftp.fuel_cardno`,
    sqlqueryc = `Select count(*) total FROM vehicle_fuel_topup vftp
    INNER JOIN vechicle v ON v.id =vftp.vechicleid
    LEFT JOIN vehicle_fuelcard fc ON fc.id= vftp.fuel_cardno`;
  console.log("query===", sqlbuss);

  if (data.hasOwnProperty("like") && data.like)
    where.push(' v.id LIKE "%' + data.like + '%"');
  if (data.hasOwnProperty("vechicleid") && data.vechicleid)
    where.push(" v.regno = " + data.vechicleid);

  if (where.length > 0) {
    sqlbuss += " where" + where.join(" AND ");
    sqlqueryc += " where " + where.join(" AND ");
  }
  if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
    sqlbuss +=
      "  ORDER BY vftp.vftupid DESC LIMIT " + data.index + ", " + data.limit;
  }
  pool.getConnection((err, conn) => {
    if (err) {
      console.log("List  Failed....");
      res.send(JSON.stringify("Failed"));
    } else {
      let sql = conn.query(sqlbuss, function (err, result) {
        value.push(result);
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log("Listvfueltp Connection Closed.");
            if (!err) {
              value.push(result[0]);
              res.send(JSON.stringify(value));
            } else {
              console.log("Query Failed");
              res.send(JSON.stringify(result));
            }
          });
        } else {
          console.log("error", err);
          conn.release();
          console.log("Listvfueltp Connection Closed.");
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

vehicle.post("/getfueltopup", (req, res) => {
  let sql,data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbus = ` SELECT vechicleid,pay_mode,fuel_cardno,fuel_litre,cur_km,vftup_amt FROM vehicle_fuel_topup WHERE vftupid='${data.vftupid}' `;
    console.log("Query---", sqlbus);
    sql = conn.query(sqlbus, (err, result) => {
      conn.release();
      console.log("Getfueltopup Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        // console.log(result)
        res.send(JSON.stringify(result));
      }
    });
  });
});

const updateFuelTopup = async (req) => {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,errorarray = [],conn = await poolPromise.getConnection();
    console.log("Update Fuel Topup Data--", data);
    if (conn) {
      await conn.beginTransaction();
      try {
        const fuelExistQuery = ` SELECT * FROM veremaxpo.vehicle_fuel_topup WHERE vftupid = ? `;
        const [[fuelExistResp]] = await conn.query(
          fuelExistQuery,
          data.vftupid
        );
        if (fuelExistResp.length) {
          // data = { ...data, mby: jwt_data.user_id, mdate: new Date() }
          const updateFuelTopup = ` UPDATE veremaxpo.vehicle_fuel_topup SET vechicleid=${data.vehicle_id},
                    pay_mode='${data.pay_mode}',fuel_litre='${data.fuel_litre}',
                    cur_km='${data.cur_km}',vftup_amt='${data.vftup_amt}' `;
          if (data.fuel_cardno) {
            fuelTopupQuery += ` ,fuel_cardno='${data.fuel_cardno}'`;
          }
          updateFuelTopup += `WHERE vftupid =${data.vftupid}`;
          const [[updateFuelResp]] = await conn.query(updateFuelTopup, data);
          if (updateFuelResp.affectedRows > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='UPDATE FUEL TOPUP ID:${data.vftupid}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}'`;
            let logResp = await conn.query(logQuery);
            if ([logResp]["affectedRows"] > 0 && [logResp]["insertId"] > 0) {
              await conn.commit();
              errorarray.push({
                msg: "Fuel Topup Entry Updated Successfully",
                err_code: 0,
              });
            } else {
              await conn.rollback();
              errorarray.push({
                msg: "Please try after sometimes",
                err_code: 791,
              });
            }
          }
        } else {
          errorarray.push({ msg: "No Data Found", err_code: 1000 });
        }
      } catch (e) {
        console.log("catch block error", e);
        errorarray.push({
          msg: "Please try after sometimes",
          err_code: "1442",
        });
        await conn.rollback();
      }
    } else {
      errorarray.push({ msg: "Please try after sometimes", err_code: "CONN" });
    }
    conn.release();
    console.log("Add Daily KM result", errorarray);
    return resolve(errorarray);
  });
};

vehicle.post("/updateFuelTopup", async (req, res) => {
  req.setTimeout(864000000);
  const result = await updateFuelTopup(req);
  res.json(result);
});

const storage2 = multer.diskStorage({
  destination: function (req, file, callback) {
    console.log("request files---", file);
    let namefile = file.originalname.split("-")[0],
      folder_status = false;
    const fs = require("fs");
    const filename = namefile;
    const imagePath = `${__dirname}/../Documents/VehicleFuel/${filename}`;
    fs.exists(imagePath, (exists) => {
      if (exists) {
        folder_status = true;
        console.log("Directory Already Created");
      } else {
        // folder_status = true
        fs.mkdir(imagePath, { recursive: true }, function (err) {
          if (err) {
            console.log(err);
          } else {
            folder_status = true;
            console.log("New Directory Successfully Created");
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
    console.log("File Uploadddd");
    let nowdate = new Date();
    let file_name = file.originalname.split("-")[1];
    let type = file.mimetype == "application/pdf" ? "pdf" : "png";
    callback(
      null,
      file_name + "-" + nowdate.toISOString().slice(0, 10) + "." + type
    );
  },
});

const upload2 = multer({ storage: storage2 }).array("file", 3);

vehicle.post("/uploadFuelTopup", function (req, res) {
  let errorarray = [],sql,updateQuery = "",data,file,sqlquery;
  const jwt_data = req.jwt_data;
  upload2(req, res, function (err) {
    if (err) {
      errorarray.push({ msg: "Upload Failed", error_code: 1225 });
      res.json(errorarray);
    } else {
      (data = req.body), (file = req.files);
      console.log("file length", file.length);
      console.log(data, file, "1212121212121212--upload fuel");
      switch (file.length) {
        case 1: {
          updateQuery += ` vftup_file1 = '${file[0].filename}'`;
          break;
        }
        case 2: {
          updateQuery += ` vftup_file1 = '${file[0].filename}',vftup_file2 = '${file[1].filename}'`;
          break;
        }
      }
      sqlquery = ` UPDATE veremaxpo.vehicle_fuel_topup SET ${updateQuery},cby=${jwt_data.user_id} WHERE vechicleid = ${data.vehicle_id}`;
      console.log("Update Fuel Topup file Query.", sqlquery);
      pool.getConnection((err, conn) => {
        if (err) {
          console.log("Failed");
        } else {
          sql = conn.query(sqlquery, function (err, result) {
            if (!err) {
              conn.release();
              console.log("uploadFuelTopup connection closed.");
              if (result.affectedRows > 0) {
                errorarray.push({
                  status: 1,
                  msg: "Fuel Topup Entry Added Succesfully",
                  err_code: 0,
                });
                res.json(errorarray);
              }
            } else {
              console.error(err);
              errorarray.push({
                msg: "Please try after sometimes",
                error_msg: "813",
              });
              conn.release();
              console.log("uploadFuelTopup connection closed.");
              res.json(errorarray);
            }
          });
        }
      });
    }
  });
});

//UN MAPPED VEHICLES IN PROJECT
vehicle.post("/listUnmapedVehicle", (req, res) => {
  let data = req.body,where = [],value = [];
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    // WHERE end_date IS NULL)
    let sqlbus = `SELECT  v.id,v.regno FROM vechicle v WHERE vehicle_map_id IS  NULL `,
      sqlqueryc = `SELECT COUNT(*) total  FROM vechicle v WHERE vehicle_map_id IS  NULL `;
    // if (data.hasOwnProperty('like') && data.like) {
    //     where.push(' v.regno LIKE "%' + data.like + '%"');
    // }
    // if (data.hasOwnProperty('like') && data.like) {
    //     where.push(' pm.project_title LIKE "%' + data.like + '%"');
    // }
    // if (data.hasOwnProperty('district_id') && data.district_id) {
    //     where.push(' p.district_id= ' + data.district_id);
    // }
    // if (data.hasOwnProperty('state_id') && data.state_id) {
    //     where.push(' p.state_id= ' + data.state_id);
    // }
    if (data.hasOwnProperty("like") && data.like) {
      where.push(' and v.regno LIKE "%' + data.like + '%" ');
    }
    if (where.length > 0) {
      sqlbus += " " + where.join(" AND ");
      sqlqueryc += " " + where.join(" AND ");
    }
    if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
      sqlbus += " ORDER BY v.id DESC LIMIT " + data.index + ", " + data.limit;
      console.log(data.index, data.limit, "sqll");
    }
    console.log("Get Count Query :", sqlbus);
    pool.getConnection((err, conn) => {
      if (err) {
        console.log("List Vehicle Project  Failed....");
        res.send(JSON.stringify("failed"));
      } else {
        let sql = conn.query(sqlbus, function (err, result) {
          value.push(result);
          if (!err) {
            sql = conn.query(sqlqueryc, function (err, result) {
              conn.release();
              console.log("ListUnmapedVehicle Connection Closed.");
              if (!err) {
                value.push(result[0]);
                res.send(JSON.stringify(value));
              } else {
                console.log("Query Failed");
                res.send(JSON.stringify(result));
              }
            });
          } else {
            console.log("error", err);
            conn.release();
            console.log("ListUnmapedVehicle Connection Closed.");
            res.send(JSON.stringify(result));
          }
        });
      }
    });
  });
});

//LIST VEHICLE PROJECT WITH REG NO
vehicle.post("/listVproject", (req, res) => {
  let data = req.body,where = [],value = [];
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbus = ` SELECT p.vehicle_id,v.regno FROM vehicle_pro_map p 
        LEFT JOIN vechicle v ON v.id = p.vehicle_id `,
      sqlqueryc = ` SELECT COUNT(*) total FROM vehicle_pro_map p
        LEFT JOIN vechicle v ON v.id = p.vehicle_id
        WHERE end_date IS NULL `;
    if (data.hasOwnProperty("like") && data.like) {
      where.push(' v.regno LIKE "%' + data.like + '%"');
    }
    if (data.hasOwnProperty("vehicle_id") && data.vehicle_id) {
      where.push(" p.vehicle_id= " + data.vehicle_id);
    }
    if (data.hasOwnProperty("state_id") && data.state_id) {
      where.push(" p.state_id= " + data.state_id);
    }
    // if (data.hasOwnProperty('regNo') && data.regNo) {
    //     where.push(' v.id= ' + data.regNo);
    // }
    if (where.length > 0) {
      sqlbus += " where" + where.join(" AND ");
      sqlqueryc += " where " + where.join(" AND ");
    }
    if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
      sqlbus +=
        " ORDER BY vehicle_id DESC LIMIT " + data.index + ", " + data.limit;
      console.log(data.index, data.limit, "sqll");
    }
    console.log("Get Count Query :", sqlbus);
    pool.getConnection((err, conn) => {
      if (err) {
        console.log("List Vehicle Project  Failed....");
        res.send(JSON.stringify("failed"));
      } else {
        let sql = conn.query(sqlbus, function (err, result) {
          value.push(result);
          if (!err) {
            sql = conn.query(sqlqueryc, function (err, result) {
              conn.release();
              console.log("ListVproject Connection Closed.");
              if (!err) {
                value.push(result[0]);
                res.send(JSON.stringify(value));
              } else {
                console.log("Query Failed");
                res.send(JSON.stringify(result));
              }
            });
          } else {
            console.log("error", err);
            conn.release();
            console.log("ListVproject Connection Closed.");
            res.send(JSON.stringify(result));
          }
        });
      }
    });
  });
});

// vehicle that are assigned to projects
vehicle.post("/listProjVehicle", (req, res) => {
  let data = req.body,where = [],value = [];
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlbus = `SELECT  * FROM vechicle WHERE id NOT IN(SELECT vehicle_id FROM vehicle_pro_map WHERE end_date IS NULL)`,
      sqlqueryc = `SELECT COUNT(*) total FROM vechicle WHERE id NOT IN(SELECT vehicle_id FROM vehicle_pro_map WHERE end_date IS NULL)`;
    // if (data.hasOwnProperty('like') && data.like) {
    //     where.push(' v.regno LIKE "%' + data.like + '%"');
    // }
    // if (data.hasOwnProperty('like') && data.like) {
    //     where.push(' pm.project_title LIKE "%' + data.like + '%"');
    // }
    // if (data.hasOwnProperty('district_id') && data.district_id) {
    //     where.push(' p.district_id= ' + data.district_id);
    // }
    // if (data.hasOwnProperty('state_id') && data.state_id) {
    //     where.push(' p.state_id= ' + data.state_id);
    // }
    // if (data.hasOwnProperty('regNo') && data.regNo) {
    //     where.push(' v.id= ' + data.regNo);
    // }
    if (where.length > 0) {
      sqlbus += " where" + where.join(" AND ");
      sqlqueryc += " where " + where.join(" AND ");
    }
    if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
      sqlbus +=
        " ORDER BY vehicle_id DESC LIMIT " + data.index + ", " + data.limit;
      console.log(data.index, data.limit, "sqll");
    }
    console.log("Get Count Query :", sqlbus);
    pool.getConnection((err, conn) => {
      if (err) {
        console.log("List Vehicle Project  Failed....");
        res.send(JSON.stringify("failed"));
      } else {
        let sql = conn.query(sqlbus, function (err, result) {
          value.push(result);
          if (!err) {
            sql = conn.query(sqlqueryc, function (err, result) {
              conn.release();
              console.log("listProjVehicle connection Closed.");
              if (!err) {
                value.push(result[0]);
                res.send(JSON.stringify(value));
              } else {
                console.log("Query Failed");
                res.send(JSON.stringify(result));
              }
            });
          } else {
            console.log("error", err);
            conn.release();
            console.log("listProjVehicle connection Closed.");
            res.send(JSON.stringify(result));
          }
        });
      }
    });
  });
});

//vehicle track drop down
vehicle.post("/listVtprojectmap", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbus = `SELECT pm.project_id,pm.vehicle_id,v.regno,pm.state_id,s.name statename,district_id,mp.name distname FROM vehicle_pro_map pm
        LEFT JOIN vechicle v ON v.id =pm.vehicle_id
        LEFT JOIN states s ON s.id=pm.state_id
        LEFT JOIN districts mp ON mp.id=pm.district_id
        WHERE pm.end_date!=NULL OR pm.end_date!=0 AND pm.project_id=${data.project_id}`;
    console.log("Query---", sqlbus);
    let sql = conn.query(sqlbus, (err, result) => {
      conn.release();
      console.log("ListVtprojectmap Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

vehicle.post("/listVehicleregno", (req, res) => {
  let sqls,jwtdata = req.jwt_data,sqlshow = "",where = [],data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    if (data.addtracker != 1) {
      sqlshow = ` SELECT vpm.project_id,v.regno,vpm.vehicle_id,v.closing_kms FROM vehicle_pro_map vpm
        INNER JOIN vechicle v ON v.id = vpm.vehicle_id 
        WHERE vpm.end_date IS NULL and  vpm.project_id  = ${data.id} `;
    }
    if (data.addtracker == 1) {
      sqlshow = ` SELECT v.regno,v.id vehicle_id,v.closing_kms,v.circle_id,v.cluster_id FROM vechicle v 
            INNER JOIN vehicle_pro_map vpm on  v.vehicle_map_id = vpm.id
            WHERE v.vehicle_map_id IS NOT NULL AND vehicle_track_id=0  AND vpm.project_id = ${data.id} `;
    }

    if (data.hasOwnProperty("like") && data.like)
      sqlshow += ' and v.regno like "%' + data.like + '%"';
    if (data.state_id != "" && data.state_id != null)
      sqlshow += ` and vpm.state_id= ${data.state_id} `;
    if (jwtdata.logintype == 4)
      sqlshow += ` and vpm.state_id= ${jwtdata.stateid} and vpm.district_id= ${jwtdata.districtid} `;

    console.log("select", sqlshow);
    sqls = conn.query(sqlshow, (err, result) => {
      conn.release();
      console.log("ListVehicleregno Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

vehicle.post("/listdropdown", (req, res) => {
  let data = req.body,where = [],value = [];
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbus = `SELECT p.id,v.id vid,pm.project_title,v.regno,s.name statename,d.name distname,DATE_FORMAT(p.start_date,'%Y-%m-%d') start_date,
        DATE_FORMAT(p.end_date,'%Y-%m-%d') end_date,us.firstname cby,u.firstname mby FROM vehicle_pro_map p
        LEFT JOIN states s ON s.id=p.district_id
        LEFT JOIN districts d ON d.id=p.district_id
        LEFT JOIN p_project_mas pm ON pm.project_id=p.project_id
        LEFT JOIN vechicle v ON v.id=p.vehicle_id
        LEFT JOIN employee_mas us ON us.user_id=p.cby
        LEFT JOIN employee_mas u ON u.user_id=p.mby`,
      sqlqueryc = `SELECT COUNT(*) total FROM vehicle_pro_map p
        LEFT JOIN states s ON s.id=p.district_id
        LEFT JOIN districts d ON d.id=p.district_id
        LEFT JOIN p_project_mas pm ON pm.project_id=p.project_id
        LEFT JOIN vechicle v ON v.id=p.vehicle_id
        LEFT JOIN employee_mas us ON us.user_id=p.cby
        LEFT JOIN employee_mas u ON u.user_id=p.mby`;
    // if(data.project_title!=null && data.project_title!=''){
    //  sqlbus += `WHERE `
    // }
    console.log("Get Count Query :", sqlbus);
    if (data.hasOwnProperty("like") && data.like)
      where.push(' v.regno LIKE "%' + data.like + '%"');

    if (data.hasOwnProperty("like") && data.like)
      where.push(' pm.project_title LIKE "%' + data.like + '%"');

    if (data.hasOwnProperty("district_id") && data.district_id)
      where.push(" p.district_id= " + data.district_id);

    if (data.hasOwnProperty("state_id") && data.state_id)
      where.push(" p.state_id= " + data.state_id);

    if (data.hasOwnProperty("regNo") && data.regNo)
      where.push(" v.id= " + data.regNo);

    if (where.length > 0) {
      sqlbus += " where" + where.join(" AND ");
      sqlqueryc += " where " + where.join(" AND ");
    }
    if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
      sqlbus += " ORDER BY p.id DESC LIMIT " + data.index + ", " + data.limit;
      console.log(data.index, data.limit, "sqll");
    }
    pool.getConnection((err, conn) => {
      if (err) {
        console.log("List Vehicle Project map Failed....");
        res.send(JSON.stringify("failed"));
      } else {
        let sql = conn.query(sqlbus, function (err, result) {
          value.push(result);
          if (!err) {
            sql = conn.query(sqlqueryc, function (err, result) {
              conn.release();
              console.log("Listdropdown Connection Closed.");
              if (!err) {
                value.push(result[0]);
                res.send(JSON.stringify(value));
              } else {
                console.log("Query Failed");
                res.send(JSON.stringify(result));
              }
            });
          } else {
            console.log("error", err);
            conn.release();
            console.log("listdropdown connection Closed.");
            res.send(JSON.stringify(result));
          }
        });
      }
    });
  });
});

vehicle.post("/listprojectvehicleno", (req, res) => {
  let data = req.body,where = [],value = [];
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbus = ` SELECT vpm.project_id,vpm.vehicle_id,v.regno,pm.project_title 
        FROM vehicle_pro_map vpm
        LEFT JOIN vechicle v ON v.id= vpm.vehicle_id
	      LEFT JOIN p_project_mas pm ON pm.project_id = vpm.project_id WHERE vpm.id = ${data.id} `,
      sqlqueryc = ` SELECT COUNT(*) AS count FROM vehicle_pro_map vpm
        LEFT JOIN vechicle v ON v.id= vpm.vehicle_id
        LEFT JOIN p_project_mas pm ON pm.project_id = vpm.project_id `;
    // if(data.project_title!=null && data.project_title!=''){
    //  sqlbus += `WHERE `
    // }
    console.log("Get Count Query :", sqlbus, sqlqueryc);
    if (where.length > 0) {
      sqlbus += " where" + where.join(" AND ");
      sqlqueryc += " where " + where.join(" AND ");
    }
    pool.getConnection((err, conn) => {
      if (err) {
        console.log("List Vehicle Project map Failed....");
        res.send(JSON.stringify("failed"));
      } else {
        let sql = conn.query(sqlbus, function (err, result) {
          value.push(result);
          if (!err) {
            sql = conn.query(sqlqueryc, function (err, result) {
              conn.release();
              console.log("Listprojectvehicleno Connection Closed.");
              if (!err) {
                value.push(result[0]);
                res.send(JSON.stringify(value));
              } else {
                console.log("Query Failed");
                res.send(JSON.stringify(result));
              }
            });
          } else {
            console.log("error", err);
            conn.release();
            console.log("Listprojectvehicleno Connection Closed.");
            res.send(JSON.stringify(result));
          }
        });
      }
    });
  });
});

/////---Vehicle Service Item---/////
async function addserviceitem(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,
      errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `select exists(select * from vehicle_service_item where servicetypename ='${data.serviceitem}') count`;
        console.log("client query", sqlquery);
        let resp = await conn.query(sqlquery);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          console.log("Vehicle_service_item exists");
          errorvalue.push({
            msg: "vehicle_service_item already exists",
            err_code: 46,
          });
          await conn.rollback();
        } else {
          let sqlinsert = `insert into vehicle_service_item set servicetypename='${data.serviceitem}'`;
          console.log("insert query", sqlinsert);
          let result = await conn.query(sqlinsert);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='VEHICLE SERVICE ITEM INFO  ADDED ID:${
              result[0]["insertId"]
            }',\`longtext\`='DONE BY',cby=${
              jwt_data.user_id
            },data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0 && logres[0]["insertId"] > 0)
              errorvalue.push({
                msg: "Vehicle Service Item Added Successfully",
                err_code: 0,
              });
            await conn.commit();
          } else {
            errorvalue.push({
              msg: "Please Try After Sometimes",
              err_code: 56,
            });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("catch error", err);
      }
    } else {
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

vehicle.post("/addserviceitem", async (req, res) => {
  //schema.addserviceitem, schema.validate vehicleschema.addserviceitem, vehicleschema.validate,
  console.log(req.body);
  req.setTimeout(864000000);
  console.log("dhcbg---------", req.body);
  let result = await addserviceitem(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

vehicle.post("/listserviceitem", (req, res) => {
  let data = req.body,
    where = [],
    value = [];
  console.log("Data--", data);
  let sqlbus = `SELECT vsitid,servicetypename,sistatus FROM vehicle_service_item`,
    sqlqueryc = `SELECT count(*) total from vehicle_service_item`;
  if (data.like) where.push(` servicetypename like '%${data.like}%'`);
  if (data.hasOwnProperty("vsitid") && data.vsitid) {
    where.push(" vsitid= " + data.vsitid);
  }
  if (where.length > 0) {
    sqlbus += " where " + where.join(" AND ");
  }
  console.log("Get Count Query :");
  pool.getConnection((err, conn) => {
    if (err) {
      console.log("List  Failed....");
      res.send(JSON.stringify("Failed"));
    } else {
      let sql = conn.query(sqlbus, function (err, result) {
        value.push(result);
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log("Listserviceitem Connection Closed.");
            if (!err) {
              value.push(result[0]);
              res.send(JSON.stringify(value));
            } else {
              console.log("Query Failed");
              res.send(JSON.stringify(result));
            }
          });
        } else {
          console.log("error", err);
          conn.release();
          console.log("Listserviceitem Connection Closed.");
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

module.exports = vehicle;
