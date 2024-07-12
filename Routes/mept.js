'use strict'
const express = require('express'),
  mept = express.Router(),
  schema = require('../schema/schema'),
  pool = require('../connection/connection'),
  poolPromise = require('../connection/connection').poolpromise;

async function addmept(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body, status = data.status == 1 ? 0 : 1, errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `select exists(select * from maintenace_point where mept_name ='${data.meptname}') count`;
        console.log('client query', sqlquery);
        let resp = await conn.query(sqlquery)
        console.log('result', resp);
        if (resp[0][0].count != 0) {
          console.log('Mept Exists');
          errorvalue.push({ msg: "Mept Already Exists", err_code: 22 })
          await conn.rollback();
        } else {
          let sqlinsert = `insert into maintenace_point set mept_name='${data.meptname}',state_id_fk=${data.state_name},status=${status}`;
          console.log('insert query', sqlinsert);
          let result = await conn.query(sqlinsert)
          console.log('result', result);
          if (result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0) {
            errorvalue.push({ msg: "Mept Added Successfully", err_code: 0 })
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 33 })
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
    console.log('Addmept Connection Closed', errorvalue)
    return resolve(errorvalue);
  });
}

mept.post("/addmept", schema.meptschema, schema.validate, async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  console.log('dhcbg---------', req.body);
  let result = await addmept(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

mept.post("/listmept", (req, res) => {
  let data = req.body, sql, and = [], value = [];
  console.log("Data--", data);
  let sqlbus = `select * from maintenace_point as mept 
    left join states as sta on sta.id=mept.state_id_fk where status=1`,
    sqlqueryc = `select count(*) count from maintenace_point as mept 
    left join states as sta on sta.id=mept.state_id_fk where status=1`;
  if (data.like) and.push(` mept_name like '%${data.like}%'`)
  if (data.hasOwnProperty('state_id_fk') && data.state_id_fk) {
    and.push(" mept.state_id_fk  ='" + data.state_id_fk + "'");
  }
  if (data.hasOwnProperty('mept_id') && data.mept_id) {
    and.push(" mept.maintenace_point_id  ='" + data.mept_id + "'");
  }
  if (and.length > 0) {
    sqlbus += " and" + and.join(' AND ')
  }
  if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
    sqlbus += ' ORDER BY mept.maintenace_point_id DESC LIMIT ' + data.index + ', ' + data.limit;
  }
  console.log('Get Count Query :',);
  pool.getConnection((err, conn) => {
    if (err) {
      console.log('List  Failed....')
      res.send(JSON.stringify('failed'));
    } else {
      sql = conn.query(sqlbus, function (err, result) {
        value.push(result)
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            if (!err) {
              console.log('Listmept Connection Closed.');
              value.push(result[0]);
              // console.log("List Deposit Result", value)
              res.send(JSON.stringify(value));
            } else {
              console.log('Query Failed')
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

mept.post("/getmept", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlbuss = `select mept_name,state_id_fk from veremaxpo.maintenace_point where maintenace_point_id=${data.mept_id}`;
    console.log("Query---", sqlbuss);
    let sqlg = con.query(sqlbuss, data.expensetype_id, (err, result) => {
      con.release();
      if (err) {
        console.log(err);
      } else {
        // console.log(result)
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updatemept(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body,
      status = data.status == 1 ? 0 : 1
    errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from maintenace_point where mept_name ='${data.meptname}') count`;
        console.log("mept query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          errorvalue.push({ msg: "Mept Already Exists", err_code: 142 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.maintenace_point set mept_name='${data.meptname}',state_id_fk=${data.state_name},status=${status}`;
          sqlupdate += ` where maintenace_point_id= ${data.mept_id}`;
          console.log("Update Query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            errorvalue.push({ msg: "Mept Updated Successfully", err_code: 0 });
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 154 });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("catch error", err);
      }
    } else {                                  
      console.log("Connection Error....."); //Log the Connection Error entered into the else part
    }
    conn.release();
    console.log("Updatemept Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

mept.post("/updatemept", schema.meptschema, schema.validate, async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await updatemept(req);
  res.end(JSON.stringify(result));
});

module.exports = mept;