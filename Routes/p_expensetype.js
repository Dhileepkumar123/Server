'use strict'
const express = require('express'),
  p_expensetype = express.Router(),
  schema = require('../schema/schema'),
  pool = require('../connection/connection'),
  poolPromise = require('../connection/connection').poolpromise;

p_expensetype.post("/listexpensetype", (req, res) => {
  let data = req.body, and = [], value = [], sql;
  console.log("Data--", data);
  let sqlbus = `SELECT expensetype_id,expensetype_name FROM p_expense_type where status=1`,
    sqlqueryc = `select count(*) count from p_expense_type where status=1`;
  if (data.like) and.push(` expensetype_name like '%${data.like}%'`)
  if (data.hasOwnProperty('expensetype_id') && data.expensetype_id) {
    and.push(' expensetype_id = ' + data.expensetype_id);
  }
  if (data.hasOwnProperty('expensetypeid') && data.expensetypeid) {
    and.push(' expensetype_id = ' + data.expensetypeid);
  }
  if (and.length > 0) {
    sqlbus += " and " + and.join(' AND ')
    sqlqueryc += " and " + and.join('AND')
  }
  if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
    sqlbus += ' ORDER BY expensetype_id DESC LIMIT ' + data.index + ', ' + data.limit;
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
            if (!err) {
              console.log('Listexpensetype Connection Closed.');
              value.push(result[0]);
              // console.log("List Deposit Result", value);
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

async function addexpensetype(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `select exists(select * from p_expense_type where expensetype_name ='${data.expensetype_name}') count`
        console.log('expensetype query', sqlquery);
        let resp = await conn.query(sqlquery)
        console.log('result', resp);
        if (resp[0][0].count != 0) {
          console.log('Expensetype Exists');
          errorvalue.push({ msg: "Expensetype Name Already Exists", err_code: 46 })
          await conn.rollback();
        } else {
          let sqlinsert = `insert into p_expense_type set expensetype_name=UPPER('${data.expensetype_name}'),ctime=NOW(),created_by=${jwt_data.user_id}`
          console.log('insert query', sqlinsert);
          let result = await conn.query(sqlinsert)
          console.log('result', result);
          if (result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='EXPENSETYPE INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0 && logres[0]["insertId"] > 0)
            errorvalue.push({ msg: "Expensetype Added Successfully", err_code: 0 })
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 56 })
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("Catch Error", err);
      }
    } else {
      console.log("Connection Error.....");
    }
    conn.release();
    console.log('AddExpenseType Connection Closed', errorvalue);
    return resolve(errorvalue);
  });
}

p_expensetype.post("/addexpensetype", schema.expensetypeschema, schema.validate, async (req, res) => {
  console.log(req.body)
  req.setTimeout(864000000);
  console.log('dhcbg---------', req.body);
  let result = await addexpensetype(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

p_expensetype.post("/getexpensetype", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlbuss = `select expensetype_id,expensetype_name,status from veremaxpo.p_expense_type where expensetype_id ='${data.expensetype_id}'`;
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

async function updateexpensetype(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from veremaxpo.p_expense_type where 
            expensetype_name ='${data.expensetype_name}') count`;
        console.log("expensetype_id", data.expensetype_name);
        console.log("expensetype query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          errorvalue.push({ msg: "expense type already exists", err_code: 126 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.p_expense_type set expensetype_name = '${data.expensetype_name}',mtime=NOW(),updated_by=${jwt_data.user_id}`;
          sqlupdate += ` where expensetype_id= ${data.expensetype_id}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='BUYERDETAILS INFO  UPDATED ID:${data.expensetype_id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0)
              errorvalue.push({
                msg: "expensetype updated Successfully",
                err_code: 0,
              });
            await conn.commit();
          } else {
            errorvalue.push({ msg: "PleaseTry After Sometimes", err_code: 151});
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
    console.log("connection closed", errorvalue);
    return resolve(errorvalue);
  });
}

p_expensetype.post("/updateexpensetype", schema.expensetypeschema, schema.validate, async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await updateexpensetype(req);
  res.end(JSON.stringify(result));
});

p_expensetype.post("/showexpensetype", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlshow = "select expensetype_id,expensetype_name,status from veremaxpo.p_expense_type where status = 1";
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

module.exports = p_expensetype;

