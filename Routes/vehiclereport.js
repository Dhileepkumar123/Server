`use strict`

const express = require('express'),
  compress = require('compression'),
  report = express.Router(),
  schema = require('../schema/schema'),
  pool = require('../connection/connection'),
  poolPromise = require('../connection/connection').poolpromise;
report.use(compress());



report.post("/listVehiclereport", (req, res) => {
  let data = req.body, where = [], value = [];
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlbus = `SELECT vr.vrid,vr.vehicle_id,vr.fuelcardno,vr.vehicle_type,vr.state_id,vr.district_id,vr.fuel_litres,vr.ammount,vr.driven_kms,
        vr.mileage,vr.tollcharge,vr.policefine,vr.serviceexpamt FROM vehicle_report vr
        INNER JOIN vehicle_fuelcard vfc ON vfc.id = vr.fuelcardno
        INNER JOIN vehicle_type vt ON vt.vehicle_id = vr.vehicle_type
        INNER JOIN vechicle v ON v.id = vr.vehicle_id`,
      sqlqueryc = `SELECT COUNT(*) AS count FROM vehicle_report vr
        INNER JOIN vehicle_fuelcard vfc ON vfc.id = vr.fuelcardno
        INNER JOIN vehicle_type vt ON vt.vehicle_id = vr.vehicle_type
        INNER JOIN vechicle v ON v.id = vr.vehicle_id`;
    if (where.length > 0) {
      sqlbus += " where " + where.join(' AND ')
      sqlqueryc += " where " + where.join(' AND ')
    }
    if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
      sqlbus += ' ORDER BY vr.vrid LIMIT ' + data.index + ', ' + data.limit;
    }
    console.log('Get Count Query :', sqlbus);
    pool.getConnection((err, conn) => {
      if (err) {
        console.log('List Vehicle Report Failed....');
        res.send(JSON.stringify('failed'));
      } else {
        let sql = conn.query(sqlbus, function (err, result) {
          value.push(result)
          if (!err) {
            sql = conn.query(sqlqueryc, function (err, result) {
              conn.release();
              if (!err) {
                console.log('connection Closed.');
                value.push(result[0]);
                res.send(JSON.stringify(value));
              } else {
                console.log('Query Failed');
                res.send(JSON.stringify(result));
              }
            })
          } else {
            console.log('error', err);
            conn.release();
            res.send(JSON.stringify(result));
          }
        });
      }
    });
  });
});

async function addVehiclereport(req) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body, errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlinsert = `insert into veremaxpo.vehicle_report set vehicle_id=${data.vehicleno},fuelcardno=${data.cardno},vehicle_type=${data.vehicletype},
          state_id=${data.circle_name},district_id=${data.cluster},fuel_litres=${data.fuel_litres},ammount=${data.amount},
          driven_kms=${data.driven_kms},mileage=(${data.driven_kms}/${data.fuel_litres}),tollcharge=${data.toll_charge},
          policefine=${data.police_fine},serviceexpamt=${data.service_exp},date=${data.date},ctime=NOW(),cby=${jwt_data.user_id} `
        console.log("insert query", sqlinsert);
        let result = await conn.query(sqlinsert);
        console.log("result", result);
        if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
          let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id=' VEHICLE REPORT INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
          console.log(logQuery);
          let logres = await conn.query(logQuery);
          if (logres["affectedRows"] > 0 && logres["insertId"] > 0)
          console.log("Vehicle report Added Successfully");
          errorvalue.push({ msg: "Vehicle report Added Successfully", err_code: 0 });
          await conn.commit();
        } else {
          errorvalue.push({ msg: "Please Try After Sometimes", err_code: 1 });
          await conn.rollback();
        }
      } catch (err) {
        console.log("catch error", err);
        await conn.rollback();
      }
    } else {
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("connection closed", errorvalue);
    return resolve(errorvalue);
  });
}

report.post("/addVehiclereport", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await addVehiclereport(req);
  res.end(JSON.stringify(result));
});

async function updateVehiclereport(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body, errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from vehicle_report where vrid='${data.vrid}') count`;
        console.log("expensetype query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count == 0) {
          errorvalue.push({ msg: "vehicle service info error", err_code: 126 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.vehicle_service set set vehicle_id=${data.vehicleno},fuelcardno=${data.cardno},vehicle_type=${data.vehicletype},
          state_id=${data.circle_name},district_id=${data.cluster},fuel_litres=${data.fuel_litres},ammount=${data.amount},
          driven_kms=${data.driven_kms},mileage=${data.mileage},tollcharge=${data.toll_charge},
          policefine=${data.police_fine},serviceexpamt=${data.service_exp},date=${data.date},mby=${jwt_data.user_id},mtime=NOW()`;
          sqlupdate += ` where vsid=${data.vsid}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='VEHICLE REPORT INFO  UPDATED ID:${data.vsid}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres["affectedRows"] > 0 && logres["insertId"] > 0)
            console.log("log added successfully");
            errorvalue.push({ msg: "Vehicle Report updated Successfully", err_code: 0 });
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes",err_code: 142 });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("catch error", err);
      }
    } else {                                  //Log the Connection Error entered into the else part
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("connection closed", errorvalue);
    return resolve(errorvalue);
  });
}

report.post("/updateVehiclereport", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await updateVehiclereport(req);
  res.end(JSON.stringify(result));
});

report.post("/getVehiclereport", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlbuss = `SELECT vr.vrid,vr.vehicle_id,vr.fuelcardno,vr.vehicle_type,vr.state_id,vr.district_id,vr.fuel_litres,vr.ammount,vr.driven_kms,
        vr.mileage,vr.tollcharge,vr.policefine,vr.serviceexpamt FROM vehicle_report vr WHERE vr.vrid=${data.vrid}`;
    console.log("Query---", sqlbuss);
    let sqlg = con.query(sqlbuss, data.vrid, (err, result) => {
      con.release();
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

module.exports = report;

// cardno:
// vehicleno
// fueltype
// vehicletype
// circle_name
// cluster
// fuel_litres
// amount
// driven_kms
// mileage
// toll_charge
// police_fine
// service_exp