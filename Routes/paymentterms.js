'use strict'
const express = require('express'),
  paymentterms = express.Router(),
  schema = require('../schema/schema'),
  pool = require('../connection/connection'),
  poolPromise = require('../connection/connection').poolpromise;


paymentterms.post("/listpaymentterms", (req, res) => {
  let data = req.body,  and = [], value = [];
  console.log("Data--", data);
  let sqlbus = `SELECT pat.*,payment_terms_id,payment_term,status FROM payment_terms as pat where status = 1`,
    sqlqueryc = `select count(*) count from payment_terms where status = 1 `;
  if (data.like) and.push(` payment_term like '%${data.like}%'`)
  if (data.hasOwnProperty('pay_id') && data.pay_id) {
    and.push(' payment_terms_id = ' + data.pay_id);
  }
  if (and.length > 0) {
    sqlbus += " and " + and.join(' AND ')
  }
  if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
    sqlbus += ' ORDER BY payment_terms_id DESC LIMIT ' + data.index + ', ' + data.limit;
  }
  console.log('Get Count Query :',);
  pool.getConnection( (err, conn) => {
    if (err) {
      console.log('List  Failed....');
      res.send(JSON.stringify('Failed'));
    } else {
     let sql = conn.query(sqlbus, function (err, result) {
        value.push(result)
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log('Listpaymentterms Connection Closed.');
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
          console.log('Listpaymentterms Connection Closed.');
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

async function addpayterm(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data=req.jwt_data;
    let data = req.body,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `select exists(select * from payment_terms where payment_term ='${data.paymonths}') count`;
        console.log('paymentterms query', sqlquery);
        let resp = await conn.query(sqlquery)
        console.log('result', resp);
        if (resp[0][0].count != 0) {
          console.log('payterms exists');
          errorvalue.push({ msg: "payterms already exists", err_code: 46 });
          await conn.rollback();
        } else {
          let sqlinsert = `insert into payment_terms set payment_term='${data.paymonths}',ctime=NOW(),created_by=${jwt_data.user_id}`;
          console.log('insert query', sqlinsert);
          let result = await conn.query(sqlinsert)
          console.log('result', result);
          if (result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='PAYTERMS INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if(logres[0]["affectedRows"]>0 && logres[0]["insertId"]>0)
            errorvalue.push({ msg: "Payterms Added Successfully", err_code: 0 })
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 86 })
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
    console.log('Addpayterm Connection Closed', errorvalue);
    return resolve(errorvalue);
  });
}

paymentterms.post("/addpayterm", schema.paymenttermschema, schema.validate, async (req, res) => {
  console.log(req.body)
  req.setTimeout(864000000);
  console.log('dhcbg---------', req.body);
  let result = await addpayterm(req);
  console.log(result);
  res.end(JSON.stringify(result));
});


paymentterms.post("/getpayterm", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlbuss = `select payment_term,status from veremaxpo.payment_terms where payment_terms_id=${data.payment_id}`;
    console.log("Query---", sqlbuss);
    let sqlg = con.query(sqlbuss, data.payment_id, (err, result) => {
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

async function updatepayterm(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data=req.jwt_data;
    let data = req.body,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from payment_terms where payment_term ='${data.paymonths}') count`;
        console.log("paymentterm query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          errorvalue.push({ msg: "payment term already exists", err_code: 144 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.payment_terms set payment_term='${data.paymonths}',mtime=NOW(),updated_by=${jwt_data.user_id}`;
          sqlupdate += ` where payment_terms_id= ${data.payment_id}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='PAYTERMS INFO  UPDATED ID:${data.payment_id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if(logres[0]["affectedRows"]>0)
            errorvalue.push({ msg: "Payment Term updated Successfully", err_code: 0 });
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 160 });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("catch error", err);
      }
    } else {                                //Log the Connection Error entered into the else part
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("Updatepayterm Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

paymentterms.post("/updatepayterm", schema.paymenttermschema, schema.validate, async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await updatepayterm(req);
  res.end(JSON.stringify(result));
});

module.exports = paymentterms;