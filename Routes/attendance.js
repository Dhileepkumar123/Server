'use strict'
const express = require('express'),
  attendance = express.Router(),
  pool = require('../connection/connection'),
  poolPromise = require('../connection/connection').poolpromise;

attendance.post('/listAttendance', function (req, res) {
  var data = req.body, where = [], value = [], sql,
    sqlquery = `select attendance_id,userid,latitude,longitude,att_month,att_status,
            approvestatus,approvedby,approveddate from veremaxpo.user_attendance`,
    sqlqueryc = `select count(*) c from  veremaxpo.user_attendance`;

  console.log(sqlquery, sqlqueryc, "-------");
  // if (data.hasOwnProperty('') && data.) {
  //     sqlquery += ' where  = ' + data.;
  // }
  sqlquery += where.length ? ` WHERE ${where.join(' AND ')} ` : ''
  sqlqueryc += where.length ? ` WHERE ${where.join(' AND ')} ` : ''
  // if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
  //     sqlquery += '  ORDER BY  DESC LIMIT ' + data.index + ', ' + data.limit;
  // }
  console.log("List Attendance Query : ", sqlquery)
  pool.getConnection(function (err, conn) {
    if (err) {
      res.send(JSON.stringify('failed'));
    } else {
      sql = conn.query(sqlquery, function (err, result) {
        value.push(result)
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log('listAttendance connection closed.');
            if (!err) {
              value.push(result[0]);
              let res1 = ({ List_attendance: value });
              res.send(JSON.stringify(res1));
            } else {
              console.log('Query Failed')
              res.send(JSON.stringify(result));
            }
          })
        } else {
          console.log('error', err);
          conn.release();
          console.log('listAttendance connection closed.');
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

async function addattendace(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data
    let data = req.body,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `SELECT attendance_id,userid,latitude,longitude,att_month,att_status,
                        approvestatus,approvedby,approveddate FROM veremaxpo.user_attendance WHERE 
                        userid ='${data.userid}' AND att_month=CURDATE()`
        console.log('expensetype query', sqlquery);
        let resp = await conn.query(sqlquery)
        console.log('result', resp);
        if (resp[0].length != 0) {
          console.log('Attendance')
          errorvalue.push({ msg: "Already attendance applied", status: 0 })
          await conn.rollback();
        } else {
          let sqlinsert = `insert into user_attendance set userid='${data.userid}',att_month=CURDATE(),latitude='${data.latitude}',att_status='${data.att_status}',longitude='${data.longitude}'
                        ON DUPLICATE KEY UPDATE userid='${data.userid}',latitude='${data.latitude}',longitude='${data.longitude}',att_status='${data.att_status}',createdby=${jwt_data.userid}`
          console.log('insert query', sqlinsert);
          let result = await conn.query(sqlinsert)
          console.log('result', result);
          if (result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0) {
            let insin = result[0]["insertId"]
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='ATTENDANCE APPLIED ID:${insin}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery)
            if (logres[0]["affectedRows"] > 0)
            errorvalue.push({ msg: "Attendance applied Successfully", status: 1 })
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", status: 0 })
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

attendance.post("/addAttendance", async (req, res) => {
  console.log(req.body)
  req.setTimeout(864000000);
  console.log('dhcbg---------', req.body);
  let result = await addattendace(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

module.exports = attendance;