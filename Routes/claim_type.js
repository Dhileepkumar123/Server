'use strict'
const express = require("express"),
  compress = require("compression"),
  claim_type = express.Router(),
  schema = require("../schema/schema"),
  pool = require("../connection/connection"),
  poolPromise = require("../connection/connection").poolpromise;
// claim_type.use(compress());

async function addclaimtype(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body, errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `select exists(select * from claim_type where claim_name ='${data.claimname} AND pay_type_id=${data.paytype_id} ') count`;
        console.log('paymentterms query', sqlquery);
        let resp = await conn.query(sqlquery)
        console.log('result', resp);
        if (resp[0][0].count != 0) {
          console.log('claim_type exists');
          errorvalue.push({ msg: "claim_type already exists", err_code: 46 })
          await conn.rollback();
        } else {
          let sqlinsert = `insert into claim_type set claim_name='${data.claimname}',pay_type_id=${data.paytype_id},
          ctime=NOW(),cby=${jwt_data.user_id}`;
          console.log('insert query', sqlinsert);
          let result = await conn.query(sqlinsert)
          console.log('result', result);
          if (result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='CALIMTYPE INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0 && logres[0]["insertId"] > 0)
              errorvalue.push({ msg: "claim_type Added Successfully", err_code: 0 })
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

claim_type.post("/addclaimtype", async (req, res) => {
  console.log('dhcbg---------', req.body);
  req.setTimeout(864000000);
  const validation = schema.claim_typeschema.validate(req.body);
  if (validation.error) {
    console.log(validation.error.details);
    return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
  }
  let result = await addclaimtype(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

claim_type.post("/listclaimtype", (req, res) => {
  let data = req.body, and = [], value = [];
  console.log("Data--", data);
  let sqlbus = `SELECT  clt.claim_id,clt.claim_name,clt.pay_type_id FROM claim_type as clt where status = 1`,
  sqlqueryc = `SELECT count(*) count from claim_type as clt where status = 1`;
  if (data.like) and.push(` claim_name like '%${data.like}%'`)
  if (data.hasOwnProperty('claim_id') && data.claim_id) {
    and.push(' clt.claim_id = ' + data.claim_id);
  }
  if (data.hasOwnProperty('pay_id') && data.pay_id) {
    and.push(' clt.pay_type_id = ' + data.pay_id);
  }
  if (and.length > 0) {
    sqlbus += " and" + and.join(' AND ')
  }
  if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
    sqlbus += ' ORDER BY clt.claim_id DESC LIMIT ' + data.index + ', ' + data.limit;
  }
  console.log('Get Count Query :', sqlbus);
  pool.getConnection((err, conn) => {
    if (err) {
      console.log('List  Failed....');
      res.send(JSON.stringify('Failed'));
    } else {
      let sql = conn.query(sqlbus, function (err, result) {
        value.push(result)
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log('Listclaimtype Connection Closed.');
            if (!err) {
              value.push(result[0]);
              // let name=({ListClaim:value});
              res.send(JSON.stringify(value));
            } else {
              console.log('Query Failed');
              res.send(JSON.stringify(result));
            }
          })
        } else {
          console.log('error', err);
          conn.release();
          console.log('Listclaimtype Connection Closed.');
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

claim_type.post("/getclaimtype", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection( (err, conn) => {
    let sqlbuss = `select claim_name,pay_type_id from veremaxpo.claim_type where claim_id='${data.claimid}'`;
    console.log("Query---", sqlbuss);
    let sqlg = conn.query(sqlbuss, data.claimid, (err, result) => {
      conn.release();
      console.log('getclaimtype connection closed.');
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});


async function updateclaimtype(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body, errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from claim_type where claim_name='${data.claimname}') count`;
        console.log("claimtype query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          errorvalue.push({ msg: "claim_type already exists", err_code: 126 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.claim_type set claim_name='${data.claimname}',pay_type_id=${data.paytype_id},
          mtime=NOW(),uby=${jwt_data.user_id}`;
          sqlupdate += ` where claim_id= ${data.claimid}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='CALIMTYPE INFO  UPDATED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0)
              errorvalue.push({ msg: "claim_type updated Successfully", err_code: 0 });
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 151 });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("catch error", err);
      }
    } else {                                       //Log the Connection Error entered into the else part
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("connection closed", errorvalue);
    return resolve(errorvalue);
  });
}

claim_type.post("/updateclaimtype", /*schema.claim_typeschema,schema.validate*/ async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await updateclaimtype(req);
  res.end(JSON.stringify(result));
});


module.exports = claim_type;