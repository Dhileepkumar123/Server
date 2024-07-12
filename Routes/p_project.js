"use strict";
const express = require("express"),
  project = express.Router(),
  pool = require("../connection/connection"),
  poolPromise = require("../connection/connection").poolpromise;

project.post("/listEmpname", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlsel = `SELECT emp_id_pk,emp_id,full_name FROM employee`;
    let where = [];
    if (data.employee_name) where.push(`full_name like '%${data.employee_name}%'`);
    if (data.hasOwnProperty("full_name") && data.employee_name) {
      sqlquery += " where full_name = " + data.employee_name;
    }
    let sql = con.query(sqlsel, (err, result) => {
      con.release();
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

project.post("/listProject", (req, res) => {
  let data = req.body,value = [],where = [];
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlbus = `SELECT p.project_id,p.project_code,p.project_title,p.client_id,c.client_name,p.status FROM p_project_mas p
            LEFT JOIN veremaxpo.client c ON c.client_id  =  p.client_id`,
      sqlqueryc = ` SELECT count(*) count FROM veremaxpo.p_project_mas p
            LEFT JOIN veremaxpo.client c ON c.client_id  =  p.client_id`;
    
    if (data.hasOwnProperty("like") && data.like) where.push(' p.project_title LIKE "%' + data.like + '%"');
    if (data.hasOwnProperty("client_name") && data.client_name) where.push('c.client_name LIKE "%' + data.client_name + '%"');
    if (data.hasOwnProperty("client_id") && data.client_id) where.push(` p.client_id = ${data.client_id}`);
    // if (data.like) where.push(`client_name like '%${data.like}%'`);

    if (where.length > 0) {
      sqlbus += " where" + where.join(" AND ");
      sqlqueryc += " where " + where.join(" AND ");
    }
    if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
      sqlbus += "  ORDER BY p.project_id DESC LIMIT " + data.index + ", " + data.limit;
    }
    console.log("Get Count Query :", sqlbus);
    pool.getConnection((err, conn) => {
      if (err) {
        console.log("List project Failed....");
        res.send(JSON.stringify("failed"));
      } else {
        let sql = conn.query(sqlbus, function (err, result) {
          value.push(result);
          if (!err) {
            sql = conn.query(sqlqueryc, function (err, result) {
              conn.release();
              console.log("ListProject Connection Closed.");
              if (!err) {
                value.push(result[0]);
                res.send(JSON.stringify(value));
              } else {
                console.log("Query Failed");
                res.send(JSON.stringify(result));
                console.log(result, "1111111111111");
              }
            });
          } else {
            console.log("error", err);
            conn.release();
            res.send(JSON.stringify(result));
          }
        });
      }
    });
  });
});

async function addProject(req) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,conn,errorvalue = [];
    try {
      conn = await poolPromise.getConnection();
      await conn.beginTransaction();
      console.log("add Role", data);
      let sqlquery = `select exists (select * from veremaxpo.p_project_mas where project_title='${data.project_name}') count`;
      let resp = await conn.query(sqlquery);
      if (resp[0][0].count != 0) {
        console.log("Project  Exists");
        errorvalue.push({ msg: "Project Already Exists", err_code: 1 });
        await conn.rollback();
      } else {
        let sqlinsert = `insert into veremaxpo.p_project_mas set  client_id='${data.client_name}',project_title='${data.project_name}',project_code='${data.project_code}',created_by=${jwt_data.user_id},ctime=NOW()`;
        console.log("insert query", sqlinsert);
        let result = await conn.query(sqlinsert, data);
        console.log("result", result);
        if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
          let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='PROJECT INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
          console.log(logQuery);
          let logres = await conn.query(logQuery);
          if (logres[0]["affectedRows"] > 0 && logres[0]["insertId"] > 0)
            errorvalue.push({ msg: "Project Added Successfully", err_code: 0 });
          await conn.commit();
        } else {
          errorvalue.push({ msg: "Please Try After Sometimes", err_code: 1 });
          await conn.rollback();
        }
      }
    } catch (e) {
      console.log("Catch Block Error", e);
      errorvalue.push({ msg: "Please try after sometimes", error_msg: "CONN" });
      await conn.rollback();
    }
    conn.release();
    console.log("Add Project Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

project.post("/addProject", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await addProject(req);
  res.end(JSON.stringify(result));
});

project.post("/getProject", (req, res) => {
  let sqlg,data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlpr = `SELECT p.project_id,p.project_code,p.project_title,p.client_id,c.client_name,p.status FROM p_project_mas p
            INNER JOIN veremaxpo.client c ON c.client_id  =  p.client_id WHERE p.project_id=${data.project_id}`;
    console.log("Query---", sqlpr);
    if (data.project_id) {
      sqlg = con.query(sqlpr, data.project_id, (err, result) => {
        con.release();
        if (err) {
          console.log(err);
        } else {
          console.log(result);
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

async function updateProject(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body,conn,errorvalue = [];
    try {
      conn = await poolPromise.getConnection();
      await conn.beginTransaction();
      console.log("update", data);
      let sqlq = `select exists(select * from veremaxpo.p_project_mas where project_id= ${data.project_id}) count`;
      console.log("project query", sqlq);
      let resp = await conn.query(sqlq);
      console.log("result", resp);
      if (resp[0][0].count == 0) {
        errorvalue.push({ msg: "No Data Found", err_code: 1 });
        await conn.rollback();
      } else {
        let sqlupdate = `update veremaxpo.p_project_mas set client_id=${data.client_name},project_title='${data.project_name}',
                        project_code='${data.project_code}',mtime=NOW(),updated_by=${jwt_data.user_id}`;
        sqlupdate += ` where project_id= ${data.project_id}`;
        console.log("update query", sqlupdate);
        let result = await conn.query(sqlupdate, data);
        console.log("result", result);
        if (result[0]["affectedRows"] > 0) {
          let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='PROJECT INFO  UPDATED ID:${data.project_id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
          console.log(logQuery);
          let logres = await conn.query(logQuery);
          if (logres[0]["affectedRows"] > 0)
            errorvalue.push({msg: "Project Updated Successfully",err_code: 0});
          await conn.commit();
        } else {
          errorvalue.push({ msg: "Please Try After Sometimes", err_code: 1 });
          await conn.rollback();
        }
      }
    } catch (e) {
      console.log("Catch Block Error", e);
      errorvalue.push({ msg: "Please try after sometimes", error_msg: "CONN" });
      await conn.rollback();
    }
    conn.release();
    return resolve(errorvalue);
  });
}

project.post("/updateProject", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await updateProject(req);
  res.end(JSON.stringify(result));
});

module.exports = project;
