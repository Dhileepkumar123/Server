'use strict'

const express = require('express'),
  admins = express.Router(),
  schema = require('../schema/schema'),
  pool = require('../connection/connection'),
  poolPromise = require('../connection/connection').poolpromise;

async function adddistricts(req) {
  return new Promise(async (resolve, reject) => {
    let data = req.body,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `SELECT * FROM city_mas WHERE city_name='${data.district_name}' And state_mas_id = '${data.state_id}' limit 1`;
        // console.log('Districts query', sqlquery);
        let [[resp]] = await conn.query(sqlquery)
        console.log('result', resp);
        if (resp) {
          console.log('Districts exists');
          errorvalue.push({ msg: "Districts already exists", err_code: 46 })
          await conn.rollback();
        } else {
          let sqlinsert = `insert into  city_mas set state_mas_id ='${data.state_id}', city_name ='${data.district_name}'`;
          console.log('insert query', sqlinsert);
          let result = await conn.query(sqlinsert)
          console.log('result', result);
          if (result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0) {
            errorvalue.push({ msg: "Districts Added Successfully", err_code: 0 })
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
    console.log('Adddistricts Connection Closed', errorvalue);    //conn.release(); moved over here to the else part
    return resolve(errorvalue);
  });
}

admins.post("/adddistricts", schema.districtsschema, schema.validate, async (req, res) => {
  console.log(req.body)
  req.setTimeout(864000000);
  console.log('dhcbg---------', req.body);
  let result = await adddistricts(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

admins.post("/listadmins", (req, res) => {
  let data = req.body, where = [], value = [], sql;
  console.log("Data--", data);
  sqlbus = `SELECT s.name state_name,d.name dist_name FROM districts d 
  INNER JOIN states s ON d.state_id = s.id`,
  sqlqueryc = `Select count(*) count FROM districts d 
  INNER JOIN states s ON d.state_id = s.id`;
  
  if (data.like) where.push(` s.name LIKE '%${data.like}%'`)

  if (data.hasOwnProperty('city_name') && data.city_name) {
    where.push(" dis.city_name LIKE '%" + data.city_name + "%'");
  }
  if (data.state_id_fk != null && data.state_id_fk != "" && data.state_id_fk != undefined) {
    where.push(" sta.state_mas_id= " + data.state_id_fk);
  }
  if (where.length > 0) {
    sqlbus += " where" + where.join(' AND ')
    sqlqueryc += " where" + where.join(' AND ')
  }
  if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
    sqlbus += ' ORDER BY sta.state_mas_id DESC LIMIT ' + data.index + ', ' + data.limit;
  }
  console.log('Get Count Query :', sqlbus);
  pool.getConnection( (err, conn) => {
    if (err) {
      console.log('List  Failed....');
      res.send(JSON.stringify('failed'));
    } else {
      sql = conn.query(sqlbus, function (err, result) {
        value.push(result)
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log('listadmins connection Closed.');
            if (!err) {
              value.push(result[0]);
              // console.log("List Deposit Result", value);
              res.send(JSON.stringify(value));
            } else {
              console.log('Query Failed')
              res.send(JSON.stringify(result));
            }
          })
        } else {
          console.log('error', err);
        }
        conn.release();
        console.log('listadmins connection Closed.');
        res.send(JSON.stringify(result));
      });
    }
  });
});

admins.post("/getdistricts", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, cnon) => {
    let sqlbuss = `select city_mas_id,state_mas_id,city_name from veremaxpo.city_mas where city_mas_id =${data.state}`;
    // console.log("Query---", sqlbuss);
    // return{};
    let sqlg = con.query(sqlbuss, data.id, (err, result) => {
      conn.release();
      console.log('getdistricts connection closed.');
      if (err) {
        console.log(err);
      } else {
        // console.log(result)
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updatedistricts(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `SELECT * FROM city_mas WHERE city_name='${data.district_name}' And state_mas_id = '${data.state_id}' limit 1`;
        console.log("id", data.id);
        console.log("district query", sqlq);
        let [[resp]] = await conn.query(sqlq)
        console.log('result', resp);
        if (resp) {
          console.log('districts exists');
          errorvalue.push({ msg: "districts already exists", err_code: 46 })
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.city_mas set state_mas_id = '${data.state_id}', city_name ='${data.district_name}'`;
          sqlupdate += `where city_mas_id= ${data.state}`;
          console.log('insert query', sqlupdate);
          let result = await conn.query(sqlupdate)
          console.log('result', result);
          if (result[0]['affectedRows'] > 0) {
            errorvalue.push({ msg: "Districts Updated Successfully", err_code: 0 })
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
    console.log('Connection Closed', errorvalue)
    return resolve(errorvalue);
  });
}

admins.post("/updatedistricts", schema.districtsschema, schema.validate, async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await updatedistricts(req);
  res.end(JSON.stringify(result));
});

admins.post("/showdistricts", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlshow = "select id,State_id,name from veremaxpo.city_mas";
    let sqls = con.query(sqlshow, (err, result) => {
      conn.release();
      console.log('showdistricts connection closed.');
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

module.exports = admins;