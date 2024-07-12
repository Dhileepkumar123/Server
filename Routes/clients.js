"use strict"
const express = require('express'),
  compress = require("compression"),
  clients = express.Router(),
  schema = require('../schema/schema'),
  pool = require('../connection/connection'),
  poolPromise = require('../connection/connection').poolpromise;
clients.use(compress());

clients.post("/listclients", (req, res) => {
  let data = req.body, and = [], sql, value = [];
  console.log("Data--", data);
  let sqlbus = `SELECT client_id,client_name,client_short_form,client_type,vmx_vendor_code FROM p_client where status in (0,1)`,
    sqlqueryc = `select count(*) count from p_client where status in (0,1)`;
  if (data.like) and.push(` client_name like '%${data.like}%'`)
  if (data.hasOwnProperty('client_id') && data.client_id) {
    and.push(' client_id = ' + data.client_id);
  }
  if (data.hasOwnProperty('client_name') && data.client_name) {
    and.push(" client_name LIKE '%" + data.client_name + "%'");
  }
  if (data.hasOwnProperty('client_short_form') && data.client_short_form) {
    and.push(' client_id = ' + data.client_short_form);
  }
  if (data.hasOwnProperty('vmx_vendor_code') && data.vmx_vendor_code) {
    and.push(" vmx_vendor_code LIKE '%" + data.vmx_vendor_code + "%'");
  }
  if (and.length > 0) {
    sqlbus += " and" + and.join(' AND ')
  }
  if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
    sqlbus += ' ORDER BY client_id DESC LIMIT ' + data.index + ', ' + data.limit;
  }
  console.log('Get Count Query :', sqlbus);
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
            console.log('listclients connection closed.');
            if (!err) {
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
          console.log('listclients connection closed.');
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

async function addclient(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body, errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `select exists(select * from p_client where 
            client_name ='${data.client_name}') count`;
        console.log('p_client query', sqlquery);
        let resp = await conn.query(sqlquery)
        console.log('result', resp);
        if (resp[0][0].count != 0) {
          console.log('p_client exists')
          errorvalue.push({ msg: "p_client name already exists", err_code: 46 })
          await conn.rollback();
        } else {
          let sqlinsert = `insert into p_client set client_name='${data.client_name}',client_short_form='${data.client_code}',
          vmx_vendor_code='${data.vmx_ven_code}',ctime=NOW(),cby=${jwt_data.user_id}`;
          console.log('insert query', sqlinsert);
          let result = await conn.query(sqlinsert)
          console.log('result', result);
          if (result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='CLIENT INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0 && logres[0]["insertId"] > 0)
              errorvalue.push({ msg: "Client Added Successfully", err_code: 0 })
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
    console.log('connection closed', errorvalue)
    return resolve(errorvalue);
  });
}

clients.post("/addclient", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  const validation = schema.clientsschema.validate(req.body);
  if (validation.error) {
    console.log(validation.error.details);
    return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
  }
  let result = await addclient(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

clients.post("/getclient", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbuss = `select client_name,client_short_form,vmx_vendor_code from veremaxpo.p_client where client_id=${data.client_id}`;
    console.log("Query---", sqlbuss);
    let sqlg = conn.query(sqlbuss, data.client_id, (err, result) => {
      conn.release();
      console.log('getclient connection closed.');
      if (err) {
        console.log(err);
      } else {
        // console.log(result)
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updateclient(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from p_client where 
            client_name ='${data.client_name}') count`;
        console.log("expensetype query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          errorvalue.push({ msg: "p_client already exists", err_code: 126 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.p_client set client_name='${data.client_name}',
          client_short_form='${data.client_code}',vmx_vendor_code='${data.vmx_ven_code}',mby=${jwt_data.user_id},mtime=NOW()`;
          sqlupdate += ` where client_id= ${data.client_id}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='CLIENT INFO  UPDATED ID:${data.client_id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0 && logres[0]["insertId"] > 0)
              errorvalue.push({
                msg: "p_client updated Successfully",
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
    } else {                                  //Log the Connection Error entered into the else part
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("connection closed", errorvalue);
    return resolve(errorvalue);
  });
}

clients.post("/updateclient", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  const validation = schema.clientsschema.validate(req.body);
  if (validation.error) {
    console.log(validation.error.details);
    return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
  }
  let result = await updateclient(req);
  res.end(JSON.stringify(result));
});

module.exports = clients;