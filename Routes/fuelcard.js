'use strict'
const express = require('express'),
  fuelcard = express.Router(),
  schema = require('../schema/schema'),
  pool = require('../connection/connection'),
  poolPromise = require('../connection/connection').poolpromise;
const multer = require('multer');

fuelcard.post("/listFuelcard", (req, res) => {
  let data = req.body, and = [], value = [], sql;
  console.log("Data--", data);
  let sqlbus = `SELECT id,cardno,cby FROM vehicle_fuelcard`,
    sqlqueryc = `select count(*) total from vehicle_fuelcard`;
  if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
    sqlbus += ' ORDER BY id DESC LIMIT ' + data.index + ', ' + data.limit;
  }
  console.log('list Query :', sqlbus);
  pool.getConnection((err, conn) => {
    if (err) {
      console.log('List  Failed....');
      res.send(JSON.stringify('failed'));
    } else {
      sql = conn.query(sqlbus, function (err, result) {
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

async function addfuelcard(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body, errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `Select exists(select * from vehicle_fuelcard where cardno ='${data.cardno}') count`
        console.log('expensetype query', sqlquery);
        let resp = await conn.query(sqlquery)
        console.log('result', resp);
        if (resp[0][0].count != 0) {
          console.log('card exists');
          errorvalue.push({ msg: "Fuel Card Exists", err_code: 46 })
          await conn.rollback();
        } else {
          let sqlinsert = `insert into vehicle_fuelcard set  cardno ='${data.cardno}',cdate=CURRENT_TIMESTAMP,cby=${jwt_data.user_id}`
          console.log('insert query', sqlinsert);
          let result = await conn.query(sqlinsert)
          console.log('result', result);
          if (result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='FUELCARD Added ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0 && logres[0]["insertId"] > 0)
              errorvalue.push({ msg: "Fuel card Added Successfully", err_code: 0 })
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 56 })
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
    console.log('Connection closed', errorvalue);
    return resolve(errorvalue);
  });
}

fuelcard.post("/addFuelcard", async (req, res) => {
  console.log(req.body)
  req.setTimeout(864000000);
  console.log('---------', req.body);
  let result = await addfuelcard(req);
  console.log(result);
  res.end(JSON.stringify(result));
});


fuelcard.post("/getFuelcard", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlbuss = `select  id,cardno,cby from veremaxpo.vehicle_fuelcard where id ='${data.id}'`;
    console.log("Query---", sqlbuss);
    let sqlg = con.query(sqlbuss, data.id, (err, result) => {
      con.release();
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updatefcard(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body, errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from veremaxpo.vehicle_fuelcard where cardno ='${data.cardno}') count`;
        console.log("fuelcard query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          errorvalue.push({ msg: "Fuelcard Update Aready Exists", err_code: 126 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.vehicle_fuelcard set cardno = '${data.cardno}'`;
          sqlupdate += ` where id= ${data.id}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='FUELCARD UPDATED ID:${data.id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0)
              errorvalue.push({ msg: "fuelcard updated Successfully", err_code: 0 });
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 151 });
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

fuelcard.post("/updateFuelcard", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await updatefcard(req);
  res.end(JSON.stringify(result));
});

fuelcard.post("/showFuelcard", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlshow = "select id,cardno from vehicle_fuelcard";
    let sqls = con.query(sqlshow, (err, result) => {
      con.release();
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});


//fuelcard bulk
// async function bulkFuelcard(req) {
//   return new Promise(async (resolve, reject) => {
//     const jwt_data = req.jwt_data;
//     var data = req.body, errorarray = [];
//     let conn = await poolPromise.getConnection();
//     if (conn) {
//       console.log('Add file', data.bulk.length);
//       for (var i = 0; i < data.bulk.length; i++) {
//         await conn.beginTransaction();
//         try {
//           let bulkup = data.bulk[i];
//           console.log('card data', bulkup);
//           let sqlexists = `select exists(select * from vehicle_fuelcard where cardno ='${data.cardno}') count`;
//           sqlexists = await conn.query(sqlexists);
//           if (sqlexists[0][0]['count'] != 0) {
//             console.log('Fuel card already exists');
//             errorarray.push({ msg: 'Fuel card Already Exists', error_msg: '1' });
//             await conn.rollback();
//             continue;
//           } else {
//             let sqlquery = ` insert into vehicle_fuelcard set  cardno ='${data.cardno}',cdate=CURRENT_TIMESTAMP,cby=${jwt_data.user_id}`;
//             console.log('Add Fuel query----', sqlquery);
//             let result = await conn.query(sqlquery);
//             if (result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0) {
//               let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='FUELCARD BULK INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
//               console.log(logQuery);
//               let logres = await conn.query(logQuery);
//               if (logres[0]["affectedRows"] > 0 && logres[0]["insertId"] > 0)
//                 errorarray.push({ msg: 'Bulk Fuelcard Successfully Added', error_msg: 0 })
//               await conn.commit();
//             }
//             else {
//               console.log('Add bulkfuelcard Query Failed');
//               errorarray.push({ msg: 'Please Try After Sometimes', error_msg: '698' });
//               await conn.rollback();
//               continue;
//             }
//           }
//         } catch (e) {
//           console.log('Inside Catch Error', e);
//           await conn.rollback();
//         }
//         console.log('Success-1', errorarray);
//         console.log('Connection Closed');
//       }
//     } else {
//       conn.release();
//       errorarray.push({ msg: 'Please Try After Sometimes', error_msg: 'CONN' });
//       return resolve(errorarray);                 //The return statement entered into the else part
//     }
//   });
// }

// fuelcard.post("/bulkFuelcard", /*schema.vehicleschema, schema.validate,*/ async (req, res) => {
//   console.log(req.body)
//   req.setTimeout(864000000);
//   console.log('---------', req.body);
//   let result = await bulkFuelcard(req);
//   console.log(result);
//   res.end(JSON.stringify(result));
// });


////////////////////////////////////////////////////////////////////////////
async function bulkFuelCard(req) {
  return new Promise(async (resolve, reject) => {
      var data = req.body, errorarray = [];
      let conn = await poolPromise.getConnection();
      const jwt_data = req.jwt_data;
      if (conn) {
          console.log('Add file', data.bulk.length);
          for (var i = 0; i < data.bulk.length; i++) {
              await conn.beginTransaction();
              try {
                  let f = data.bulk[i], fcid = {};
                  console.log('FuelCard Data', f);
                  //////
                  let fuelcardid = `SELECT id from vehicle_fuelcard WHERE cardno='${f.cardno}'`;
                  fuelcardid = await conn.query(fuelcardid);
                  if(fuelcardid[0].length == 1) {
                    fuelcardid = fuelcardid[0][0].id;
                    console.log("Fuel Card", fuelcardid);

                    fcid['cardno'] = f.cardno;
                    fcid['jwt_data'] = jwt_data;

                          console.log("Bulkfrtrroom", fcid);
                          let res = await addfuelcard(fcid);
                          console.log('res', res);
                          errorarray.push(res[0]);
                  } else {
                    errorarray.push({ msg: "Fuel Card No Does Not Matched", errorarray: 544 });
                    await conn.rollback();
                    continue;
                  }
              } catch (e) {
                  console.log('Inside Catch Error', e);
                  await conn.rollback();
              }
          }
          console.log('Success-1', errorarray);
          conn.release();
          console.log('BulkFuelCard Connection Closed.');
      } else {
          return resolve({ msg: 'Please Try After Sometimes', error_msg: 'CONN' });
      }
      return resolve(errorarray);
  });
}

fuelcard.post("/bulkFuelCard", /*schema.vehicleschema, schema.validate,*/ async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  // console.log('dhcbg---------', req.body);
  let result = await bulkFuelCard(req);
  console.log(result);
  res.end(JSON.stringify(result));
});


const storage1 = multer.diskStorage({
  destination: function (req, file, callback) {
    console.log('request files---', file);
    let namefile = file.originalname.split('-')[0], folder_status = false;
    const fs = require("fs")
    const filename = namefile
    const imagePath = `${__dirname}/../Documents/VehicleKm/${filename}`;
    fs.exists(imagePath, exists => {
      if (exists) {
        folder_status = true
        console.log(" Directory Already created.");
      } else {
        // folder_status = true
        fs.mkdir(imagePath, { recursive: true }, function (err) {
          if (err) {
            console.log(err);
          } else {
            folder_status = true
            console.log("New directory successfully created.");
            callback(null, imagePath)
          }
        })
      }
      if (folder_status) { callback(null, imagePath); }
    });
  },
  filename: function (req, file, callback) {
    console.log('File Uploadddd');
    let nowdate = new Date();
    let file_name = file.originalname.split('-')[1]
    let type = file.mimetype == 'application/pdf' ? 'pdf' : 'png';
    callback(null, file_name + '-' + nowdate.toISOString().slice(0, 10) + '.' + type)
  }
})


const upload1 = multer({ storage: storage1 }).array('file', 2)


fuelcard.post('/uploadVehicleKm', (req, res) => {
  let errorarray = [], updateQuery = '', data, file, sqlquery;
  upload1(req, res, function (err) {
    if (err) {
      errorarray.push({ msg: "Upload Failed", error_code: 782 });
      res.json(errorarray);
    } else {
      data = req.body, file = req.files;
      console.log('file length', file.length)
      console.log(data, file)
      switch (file.flag) {
        case 1: {
          updateQuery += ` vfile1 = '${file[0].filename}'`
          break;
        }
        case 2: {
          updateQuery += ` vfile2 = '${file[0].filename}'`
          break;
        }
      }
      sqlquery = ` UPDATE veremaxpo.vehicle_km SET ${updateQuery} WHERE vehicle_km_id = ${data.vehicle_km_id}  and cdate=CUURDATE()`
      console.log("Update Vehicle Km file Query.", sqlquery);
      pool.getConnection((err, conn) => {
        if (err) {
          console.log("Failed")
        }
        else {
          sql = conn.query(sqlquery, function (err, result) {
            conn.release();
            if (!err) {
              if (result.affectedRows > 0) {
                let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='VEHICLE KM  INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
                console.log(logQuery);
                let logres = conn.query(logQuery);
                if (logres[0]["affectedRows"] > 0)
                  errorarray.push({ status: 1, msg: 'Vehicle Km Added Succesfully', err_code: 0 });
                res.json(errorarray)
              }
            } else {
              errorarray.push({ msg: "Please try after sometimes", error_msg: '714' });
              res.json(errorarray)
            }
          });
        }
      });
    }
  });
});

module.exports = fuelcard;

