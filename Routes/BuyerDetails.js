"use strict"
const express = require('express'),
  BuyerDetails = express.Router(),
  compress = require('compression'),
  schema = require('../schema/schema'),
  pool = require('../connection/connection'),
  poolPromise = require('../connection/connection').poolpromise;
  const joiValidate = require('../schema/schema');
  BuyerDetails.use(compress());


BuyerDetails.post("/listbuyerdetails", (req, res) => {
  let data = req.body, and = [], value = [],sql;
  console.log("Data--", data);
  let sqlbus = `SELECT buy.*,buyer_id,buyer_name,company_name,register_address,shipment_address,pan_no,gst_no,state_id_fk,po_code FROM buyer_mas as buy
  left join states  s on s.id=buy.state_id_fk where status=1`,
    sqlqueryc = `select count(*) count from buyer_mas as buy  left join states  s on s.id=buy.state_id_fk where status=1 `;
  if (data.like) and.push(` buyer_name like '%${data.like}%'`)
  if (data.like1) and.push(` company_name like '%${data.like1}%'`)
  if (data.hasOwnProperty('id') && data.id) {
    and.push(" buy.state_id_fk  ='" + data.state_id + "'");
  }
  if (data.hasOwnProperty('buyer_id') && data.buyer_id) {
    and.push(" buyer_id  ='" + data.buyer_id + "'");
  }
  if (data.hasOwnProperty('company_name') && data.company_name) {
    and.push(' buyer_id = ' + data.company_name);
  }
  if (and.length > 0) {
    sqlbus += " and" + and.join(' AND ')
  }
  if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
    sqlbus += ' ORDER BY buyer_id DESC LIMIT ' + data.index + ', ' + data.limit;
  }
  console.log('Get Count Query :', sqlbus);
  pool.getConnection(function (err, conn) {
    if (err) {
      console.log('List  Failed....');
      res.send(JSON.stringify('failed'));
    } else {
      sql = conn.query(sqlbus, function (err, result) {
        value.push(result)
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log('listbuyerdetails connection closed.');
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
          console.log('listbuyerdetails connection closed.');
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

BuyerDetails.post("/listbuyerdetails1", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbus = `select * from buyer_mas as buy 
    left join states as s on s.id=buy.state_id_fk`;
    if (data.like) {
      sqlbus += ` where buyer_name like '%${data.like}%'`
    }
    console.log("Query---", sqlbus);
     let sql = conn.query(sqlbus, (err, result) => {
      conn.release();
      console.log('listbuyerdetails1 connection closed.');
      if (err) {
        console.log(err);
      } else {
        // console.log(result)
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function addbuyerdetails(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body,errorvalue = [];
      const jwt_data=req.jwt_data;
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `select exists(select * from buyer_mas where buyer_name ='${data.buyer_name}') count`;
        console.log('buyer query', sqlquery);
        let resp = await conn.query(sqlquery)
        console.log('result', resp);
        if (resp[0][0].count != 0) {
          console.log('buyer_name exists');
          errorvalue.push({ msg: "buyer_name already exists", err_code: 92 }) 
          await conn.rollback();
        } else {
          let sqlinsert = `insert into buyer_mas set buyer_name='${data.buyer_name}',company_name='${data.cmpnyname}',register_address='${data.regisaddress}',
          shipment_address='${data.shipmentaddress}',pan_no='${data.panno}',gst_no='${data.gstno}',
				   state_id_fk='${data.state_id}',created_by=${jwt_data.user_id},ctime=NOW()`;
          console.log('insert query', sqlinsert);
          let result = await conn.query(sqlinsert)
          console.log('result', result);
            if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
              let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='BUYERDETAILS INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
              console.log(logQuery);
              let logres = await conn.query(logQuery);
              if(logres[0]["affectedRows"]>0 && logres[0]["insertId"]>0)
            errorvalue.push({ msg: "buyer Added Successfully", err_code: 0 })
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

BuyerDetails.post("/addbuyerdetails",async (req, res) => {
  console.log(req.body)
  req.setTimeout(864000000);
  const validation = joiValidate.BuyerDetailsschema.validate(req.body);
  if (validation.error) {
      console.log(validation.error.details);
      return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
  }
  console.log('dhcbg---------', req.body);
  let result = await addbuyerdetails(req);
  console.log(result);
  res.end(JSON.stringify(result));
});


BuyerDetails.post("/getbuyerdetail", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbuss = `select buyer_name,company_name,register_address,shipment_address,pan_no,gst_no,state_id_fk from veremaxpo.buyer_mas where buyer_id='${data.buyer_id}'`;
    console.log("Query---", sqlbuss);
    let sqlg = conn.query(sqlbuss, data.expensetype_id, (err, result) => {
      conn.release();
      console.log('getbuyerdetail connection closed.');
      if (err) {
        console.log(err);
      } else {
        // console.log(result)
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updatebuyerdetail(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data=req.jwt_data;
    let data = req.body,
      errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from buyer_mas where 
            buyer_name ='${data.buyer_name}') count`;
        console.log("buyer query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          errorvalue.push({ msg: "buyer detail already exists", err_code: 170 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.buyer_mas set buyer_name='${data.buyer_name}',
          company_name='${data.cmpnyname}',register_address='${data.regisaddress}',
          shipment_address='${data.shipmentaddress}',pan_no='${data.panno}',gst_no='${data.gstno}',
			state_id_fk='${data.state_id}',updated_by=${jwt_data.user_id},mtime=NOW()`;
          sqlupdate += ` where buyer_id= ${data.buyer_id}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
              let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='BUYERDETAILS INFO  UPDATED ID:${data.buyer_id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
              console.log(logQuery);
              let logres = await conn.query(logQuery);
              if(logres[0]["affectedRows"]>0)
            errorvalue.push({
              msg: "buyerdetails updated Successfully",
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

BuyerDetails.post("/updatebuyerdetail", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  const validation = joiValidate.BuyerDetailsschema.validate(req.body);
  if (validation.error) {
      console.log(validation.error.details);
      return res.json([{ msg: validation.error.details[0].message, err_code: '228' }]);
  }
  let result = await updatebuyerdetail(req);
  res.end(JSON.stringify(result));
});

module.exports = BuyerDetails;