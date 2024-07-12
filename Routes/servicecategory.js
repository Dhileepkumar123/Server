"use strict"

const express = require('express'),
  servicecategory = express.Router(),
  schema = require('../schema/schema'),
  pool = require('../connection/connection'),
  poolPromise = require('../connection/connection').poolpromise;


servicecategory.post("/listservicecategory", (req, res) => {
  let data = req.body, and = [], value = [];
  console.log("Data--", data);
  let sqlbus = `SELECT sct.*, sct.servicecat_id,sct.service_category_name,sct.status FROM service_category as sct where status=1`,
    sqlqueryc = `select count(*) count from service_category  `;
  if (data.like) and.push(` service_category_name like '%${data.like}%'`)
  if (data.hasOwnProperty('servicecat_id') && data.servicecat_id)  {
    and.push(' sct.servicecat_id = ' + data.servicecat_id);
  }
  if (data.hasOwnProperty('service_category_name') && data.servicecatname) {
    and.push(" sct.service_category_name LIKE '%" + data.servicecatname + "%'");
  }
  if (and.length > 0) {
    sqlbus += " and" + and.join(' AND ')
  }
  if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
    sqlbus += ' ORDER BY sct.servicecat_id DESC LIMIT ' + data.index + ', ' + data.limit;
  }
  console.log('Get Count Query :',);
  pool.getConnection( (err, conn) => {
    if (err) {
      console.log('List  Failed....')
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

async function addservscat(req, res) {
  const jwt_data = req.jwt_data;
  return new Promise(async (resolve, reject) => {
    let data = req.body, errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `select exists(select * from service_category where service_category_name ='${data.servcatname}') count`;
        console.log('client query', sqlquery);
        let resp = await conn.query(sqlquery);
        console.log('result', resp);
        if (resp[0][0].count != 0) {
          console.log('servicecategory exists');
          errorvalue.push({ msg: "servicecategory name already exists", err_code: 46 })
          await conn.rollback();
        } else {
          let sqlinsert = `insert into service_category set service_category_name='${data.servcatname}',
          created_by=${jwt_data.user_id},ctime=NOW()`;
          console.log('insert query', sqlinsert);
          let result = await conn.query(sqlinsert)
          console.log('result', result);
          if (result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='SERVICECATEGORY INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if(logres[0]["affectedRows"]>0 && logres[0]["insertId"]>0)
            errorvalue.push({ msg: "Servicecategory Added Successfully", err_code: 0 })
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

servicecategory.post("/addservscat", async (req, res) => {
  console.log(req.body)
  req.setTimeout(864000000);
  console.log('dhcbg---------', req.body);
  let result = await addservscat(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

servicecategory.post("/getservcat", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection( (err, con) => {
    let sqlbuss = `select service_category_name from veremaxpo.service_category where servicecat_id=${data.servcat_id}`;
    console.log("Query---", sqlbuss);
    let sqlg = con.query(sqlbuss, data.servcat_id, (err, result) => {
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

async function updateservcat(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data=req.jwt_data;
    let data = req.body,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from veremaxpo.service_category where 
            service_category_name='${data.servcatname}') count`;
        console.log("service_category_name query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          errorvalue.push({ msg: "servicecat already exists", err_code: 126 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.service_category set service_category_name='${data.servcatname}',
          updated_by=${jwt_data.user_id},mtime=NOW()`;
          sqlupdate += ` where servicecat_id= ${data.servcat_id}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='SERVICECATEGORY INFO  UPDATED ID:${data.servcat_id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if(logres[0]["affectedRows"]>0)
            errorvalue.push({
              msg: "service category updated Successfully",
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

servicecategory.post("/updateservcat", /*schema.expensetypeschema,schema.validate*/ async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await updateservcat(req);
  res.end(JSON.stringify(result));
});

module.exports = servicecategory;