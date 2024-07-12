'use strict'
const express = require('express'),
  serviceitem = express.Router(),
  schema = require('../schema/schema'),
  pool = require('../connection/connection'),
  poolPromise = require('../connection/connection').poolpromise;

async function addserviceitem(req, res) {
    return new Promise(async (resolve, reject) => {
      let data = req.body, errorvalue = [];
      const jwt_data = req.jwt_data;
      let conn = await poolPromise.getConnection();
      if (conn) {
        await conn.beginTransaction();
        try {
          console.log("add data", data);
          let sqlquery = ` select exists(select * from p_pr_type where prname ='${data.prname}') count `
          console.log('serviceitem query', sqlquery);
          let resp = await conn.query(sqlquery)
          console.log('result', resp);
          if (resp[0][0].count != 0) {
            console.log('serviceitem exists')
            errorvalue.push({ msg: "serviceitem name already exists", err_code: 46 })
            await conn.rollback();
          } else {
            let sqlinsert = ` insert into p_pr_type set prname='${data.prname}' `
            console.log('insert query', sqlinsert);
            let result = await conn.query(sqlinsert)
            console.log('result', result);
            if (result[0]["affectedRows"] > 0 && result[0]["insertId"]) {
              let insin = result[0]["insertId"]
              let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='PRTYPE ADDED ID:${insin}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
              console.log(logQuery);
              let logres = await conn.query(logQuery)
              if (logres[0]["affectedRows"] > 0)
                errorvalue.push({ msg: "serviceitem Added Successfully", err_code: 0 })
              await conn.commit();
            } else {
              errorvalue.push({ msg: "Please Try After Sometimes", err_code: 75 })
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
      console.log('Addprtype Connection Closed', errorvalue);
      return resolve(errorvalue);
    });
  }
  
serviceitem.post("/addserviceitem", async (req, res) => {
  console.log(req.body)
  req.setTimeout(864000000);
  console.log('dhcbg---------', req.body);
  let result = await addserviceitem(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

module.exports = serviceitem;