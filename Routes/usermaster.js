const express = require('express'),
  compression = require('compression'),
  usermaster = express.Router(),
  schema = require('../schema/schema'),
  pool = require('../connection/connection'),
  poolPromise = require('../connection/connection').poolpromise;
const { response } = require('express');

usermaster.post("/listEmpname", (req, res) => {
  let sqls, data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlshow = ``;
    sqls = con.query(sqlshow, (err, result) => {
      con.release();
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

usermaster.post('/listUsermaster', function (req, res, err) {
  var value = [], where = [], data = req.body, sql,
    sqlquery = `SELECT um.user_id,um.usercode,um.username,um.usr_password,um.firstname,um.lastname,um.mobile,um.email,um.status,um.token,um.refresh_token,um.role_id,um.menu_role,rm.role_name FROM employee_mas um
      LEFT JOIN role_mas rm ON rm.role_id_pk=um.role_id`,
    sqlqueryc = `SELECT COUNT(*) AS count FROM employee_mas AS um 
      LEFT JOIN role_mas AS rm ON rm.role_id_pk = um.user_id `;
  console.log('list listUsermaster...', sqlquery);
  console.log(data, "dadsdasdas");
  // if (data.hasOwnProperty('') && data.) {
  //   sqlquery += ' where  = ' + data.;
  // }
  // if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
  //   sqlquery += '  ORDER BY  DESC LIMIT ' + data.index + ', ' + data.limit;
  // }
  sqlquery += where.length ? ` WHERE ${where.join(' AND ')} ` : ''
  sqlqueryc += where.length ? ` WHERE ${where.join(' AND ')} ` : ''
  pool.getConnection((err, conn) => {
    if (!err) {
      sql = conn.query(sqlquery, function (err, result) {
        if (!err) {
          value.push(result);
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            if (!err) {
              value.push(result[0]);
              res.json(value)
            }
          });
        } else {
          conn.release();
        }
      });
    }
  });
});

async function addUsermaster(req) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,errorvalue = [];
    insertdata = { menu_role: JSON.stringify(data.menu_role), };
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `select exists(select * from veremaxpo.employee_mas where usercode='${data.usercode}') count`;
        console.log("business query", sqlquery);
        let resp = await conn.query(sqlquery);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          console.log("Usercode Name exists");
          errorvalue.push({ msg: "Usercode already exists", err_code: 1 });
          await conn.rollback();
        } else {
          let sqlinsert = `insert into veremaxpo.employee_mas set role_id=${data.role},menu_role='${insertdata.menu_role}'`;
          // if (data.) {
          //   sqlinsert += ` ,pincode =${data.}`;
          // }
          console.log("insert query", sqlinsert);
          let result = await conn.query(sqlinsert);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
            errorvalue.push({ msg: "Usermaster Added Successfully", err_code: 0 });
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 1 });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("catch error", err);
        await conn.rollback();
      }
    } else {
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("connection closed", errorvalue);
    return resolve(errorvalue);
  });
}

usermaster.post("/addUsermaster", async (req, res) => {
  console.log(req.body);
  // const validation = joiValidate.addbus.validate(req.body);
  //   if (validation.error) {
  //       console.log(validation.error.details);
  //       return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
  //   }
  req.setTimeout(864000000);
  let result = await addUsermaster(req);
  res.end(JSON.stringify(result));
});

usermaster.post("/getUsermaster", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlbuss = "select user_id,usercode,username,usr_password,firstname,lastname,mobile,email,status,role_id,menu_role from veremaxpo.employee_mas where user_id = ?";
    console.log("Query---", sqlbuss);
    let sqlg = con.query(sqlbuss, data.id, (err, result) => {
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

async function updateUsermaster(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body,errorvalue = [];
    insertdata = { menu_role: JSON.stringify(data.menu_role), };
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from veremaxpo.employee_mas where user_id=${data.id}) count`;
        console.log("EXISTS query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count == 0) {
          errorvalue.push({ msg: "No Data Found", err_code: 1 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.employee_mas set usercode='${data.usercode}',
            username='${data.username}',usr_password=${data.usr_password},firstname='${data.firstname}',
            lastname='${data.lastname}',mobile='${data.mobile}', email='${data.email}',status='${data.status}',role_id=${data.role},menu_role='${insertdata.menu_role}'`;
          sqlupdate += ` where user_id= ${data.id}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            errorvalue.push({ msg: "Usermaster updated Successfully", err_code: 0 });
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 1 });
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

usermaster.post("/updateUsermaster", async (req, res) => {
  console.log(req.body);
  // const validation = joiValidate.editbus.validate(req.body);
  // if (validation.error) {
  //     console.log(validation.error.details);
  //     return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
  // }
  req.setTimeout(864000000);
  let result = await updateUsermaster(req);
  res.end(JSON.stringify(result));
});

usermaster.post("/showUsermaster", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlshow = `SELECT usercode,username,usr_password,firstname,lastname,mobile,email,status FROM veremaxpo.employee_mas where id=?`
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

module.exports = usermaster;