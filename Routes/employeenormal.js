"use strict";
const express = require("express"),
  empclmnorm = express.Router(),
  pool = require("../connection/connection"),
  poolPromise = require("../connection/connection").poolpromise;
const multer = require("multer");
const { type } = require("os");
const joiValidate = require("../schema/employeenormal");

async function addempclmnorm(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body == null ? req : req.body,jwt_data = req.jwt_data,errorarray = [],conn = await poolPromise.getConnection();
    console.log("Add EmpClmNorm---", data);
    if (conn) {
      await conn.beginTransaction();
      try {
        let sqlquery = `Select Exists(Select * FROM veremaxpo.claim_normal where emp_name=${data.emp_name} and empid=${data.emp_id}) count`;
        console.log("EmpClmNorm Query", sqlquery);
        let resp = await conn.query(sqlquery);
        console.log("EmpClmNorm resp---", resp[0][0].count);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          console.log("Employee ClaimNorm Exists");
          errorarray.push({ msg: "Employee Claim Already Exists", err_code: 22 });
          await conn.rollback();
        } else {
          let sqlinsert = `INSERT INTO veremaxpo.claim_normal SET empid=${data.emp_id},projectid=${data.projectidfk},emp_name=${data.emp_name},
          circleid=${data.state_id},clusterid=${data.district_id}`;

          console.log("Undefined Data Occured......");
          if (data.emp_deptid) sqlinsert += ` ,deptid=${data.emp_deptid}`;
          if (data.emp_desid) sqlinsert += ` ,desid=${data.emp_desid}`;
          if (data.type) sqlinsert += ` ,p_pr_sm=${data.type}`;
          if (data.activity) sqlinsert += ` ,activity=${data.activity}`;
          if (data.claim_amt) sqlinsert += ` ,claimamt=${data.claim_amt}`;
          if (data.start_date) sqlinsert += ` ,servicesdate='${data.start_date}'`;
          if (data.end_date) sqlinsert += ` ,serviceedate='${data.end_date}'`;
          if (data.remarks) sqlinsert += ` ,remarks='${data.remarks}'`;
          // if(data.approval) sqlinsert += ` ,approval_status=${data.approval}`;

          console.log("Insert Query", sqlinsert);
          let result = await conn.query(sqlinsert);
          console.log("result", result);
          // if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
          //   console.log("result", result[0]["insertId"]);
            if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
              let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='EMPLOYEE CLAIM ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
              console.log(logQuery);
              let logres = await conn.query(logQuery);
              if (logres["affectedRows"] > 0 && logres["insertId"] > 0)
              console.log("Employee Claim Added Successfully");
              errorarray.push({ msg: "Employee Claim Added Successfully", err_code: 0, id: result[0]["insertId"]});
              await conn.commit();
            } else {
              errorarray.push({ msg: "Please Try After Sometimes", err_code: 50 });
              await conn.rollback();
            }          
        }
      } catch (err) {
        console.log("Catch Error", err);
        errorarray.push({ msg: "Please Enter Required Fields", err_code: "57" });
        await conn.rollback();
      }
    } else {
      console.log("Connection Error...");
    }
    conn.release();
    console.log("Add Employee Claim Connection Closed", errorarray);
    return resolve(errorarray);
  });
}

empclmnorm.post("/addempclmnorm", async (req, res) => {
  req.setTimeout(84000);
  console.log("addemployeeclaimnormal------", req.body);
  const validation = joiValidate.employeeclaimDataSchema.validate(req.body);
  if (validation.error) {
    console.log(validation.error.details);
    // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    return res.json([
      { msg: validation.error.details[0].message, err_code: "422" },
    ]);
  }
  let result = await addempclmnorm(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

empclmnorm.post("/listempclmnorm", async (req, res) => {
  var data = req.body,where = [],value = [];
  let sqlqueryl = `SELECT cn.id,cn.projectid,cn.empid,e.emp_id,e.full_name,cn.activity,pm.project_title,cn.circleid,s.name state_name,cn.clusterid
  ,d.name dist_name,dept.depname,des.desname,psm.prsmid,psm.prsmname,cn.claimamt,cn.approval_status,remarks,DATE_FORMAT(cn.servicesdate, '%Y-%m-%d') servicesdate
  ,DATE_FORMAT(cn.serviceedate, '%Y-%m-%d') serviceedate
  FROM claim_normal cn
  INNER JOIN states s ON s.id=cn.circleid
  INNER JOIN districts d ON d.id=cn.clusterid
  LEFT JOIN p_project_mas pm ON pm.project_id=cn.projectid
  LEFT JOIN employee e ON e.emp_id_pk=cn.empid
  LEFT JOIN p_pr_sm psm ON psm.prsmid=cn.p_pr_sm
  LEFT JOIN department dept ON dept.id=cn.deptid
  LEFT JOIN designation des ON des.id=cn.desid`,
    sqlqueryc = `SELECT COUNT(*) AS total FROM claim_normal cn
  INNER JOIN states s ON s.id=cn.circleid
  INNER JOIN districts d ON d.id=cn.clusterid
  LEFT JOIN p_project_mas pm ON pm.project_id=cn.projectid
  LEFT JOIN employee e ON e.emp_id_pk=cn.empid
  LEFT JOIN p_pr_sm psm ON psm.prsmid=cn.p_pr_sm  
  LEFT JOIN department dept ON dept.id=cn.deptid
  LEFT JOIN designation des ON des.id=cn.desid`;
  console.log("data", data);
  console.log("sqll", sqlqueryl);

  if (data.hasOwnProperty("emp_id") && data.emp_id) where.push('cn.empid  LIKE "%' + data.emp_id + '%"');
  if (data.hasOwnProperty("project_id") && data.project_id) where.push(" cn.projectid= " + data.project_id);
  if (data.hasOwnProperty("state_id") && data.state_id) where.push(" cn.circleid= " + data.state_id);
  if (data.hasOwnProperty("district_id") && data.district_id) where.push(" cn.clusterid= " + data.district_id);
  
  // if (data.hasOwnProperty("project_id") && data.project_id) where.push(' cn.projectid LIKE "%' + data.project_id + '%"');
  // if (data.hasOwnProperty("start_date") && data.start_date) where.push(' cn.servicesdate= "' + data.start_date + '"');
  // if (data.hasOwnProperty("end_date") && data.end_date) where.push(' cn.serviceedate= "' + data.end_date + '"');

  if (where.length > 0) {
    sqlqueryl += " where " + where.join(" AND ");
    sqlqueryc += " where " + where.join(" AND ");
  }
  if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
    sqlqueryl += " ORDER BY cn.id DESC LIMIT " + data.index + ", " + data.limit;
  }
  console.log("Get Count Query :", sqlqueryl);
  pool.getConnection((err, conn) => {
    if (err) {
      console.log("List Failed....");
      res.send(JSON.stringify("Failed"));
    } else {
      let sql = conn.query(sqlqueryl, function (err, result) {
        value.push(result);
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log("ListEmpclmnorm Connection Closed.");
            if (!err) {
              value.push(result[0]);
              res.send(JSON.stringify(value));
            } else {
              console.log("Query Failed");
              res.send(JSON.stringify(result));
            }
          });
        } else {
          console.log("error", err);
          conn.release();
          console.log("ListEmpclmnorm Connection Closed.");
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

empclmnorm.post("/getempclmnorm", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbuss = `SELECT cn.id,pm.project_id,cn.projectid,cn.empid,cn.emp_name,cn.circleid,cn.clusterid,dept.depname,des.desname,cn.desid,cn.deptid,cn.activity,psm.prsmid,cn.p_pr_sm,cn.claimamt
    ,DATE_FORMAT(cn.servicesdate, '%Y-%m-%d') servicesdate,DATE_FORMAT(cn.serviceedate, '%Y-%m-%d') serviceedate,cn.approval_status,cn.remarks,e.emp_id_pk,e.emp_id
    FROM claim_normal cn
      INNER JOIN states s ON s.id=cn.circleid
      INNER JOIN districts d ON d.id=cn.clusterid
      LEFT JOIN p_project_mas pm ON pm.project_id=cn.projectid
      LEFT JOIN employee e ON e.emp_id_pk=cn.empid
      LEFT JOIN p_pr_sm psm ON psm.prsmid=cn.p_pr_sm
      LEFT JOIN department dept ON dept.id=cn.deptid
      LEFT JOIN designation des ON des.id=cn.desid
      WHERE cn.id=${data.clmid}`;
    console.log("Query---", sqlbuss);
    let sqlg = conn.query(sqlbuss, data.clmid, (err, result) => {
      conn.release();
      console.log("Get Claim_Normal Connection Closed.");      
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updateempclmnorm(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,errorvalue = [],conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("Update EmpClmNorm Data", data);
        let preadd = `SELECT * FROM veremaxpo.claim_normal WHERE id=${data.clmid}`;
        preadd = await conn.query(preadd);
        if (preadd[0].length == 1) {
          preadd = preadd[0][0];
          console.log("Preadd Details:", preadd);
          let sqlupdate = ` UPDATE veremaxpo.claim_normal SET empid=${data.emp_id},emp_name=${data.emp_name},projectid=${data.projectidfk},deptid=${data.emp_deptid},desid=${data.emp_desid},p_pr_sm=${data.type}
                          ,activity=${data.activity},claimamt=${data.claim_amt},circleid=${data.state_id},clusterid=${data.district_id},servicesdate='${data.start_date}',serviceedate='${data.end_date}'`;

                          // ,approval_status=${data.approval},remarks='${data.remarks}'
          // ,approval_status=${data.approval}
          /*,approval_status=${data.approval},deptid=${data.department} */

          // if (data.activity == false) {
          //   sqlupdate += ` ,activity=${1}`;
          // } else if (data.activity == false) {
          //   sqlupdate += ` ,activity=${2}`;
          // } else {
          //   sqlupdate += ` ,activity=${3}`;
          // }
          sqlupdate += ` where id=${data.clmid}`;
          console.log("Update EmpClmNorm Data", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='EMPLOYEECLAIM INFO UPDATED ID:${data.id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0)
              errorvalue.push({
                msg: "Employee Claim Updated Successfully",
                err_code: 0,
              });
            await conn.commit();
          } else {
            errorvalue.push({
              msg: "Please Try After Sometimes",
              err_code: "215",
            });
            await conn.rollback();
          }
        } else {
          console.log("No Employee Claim Found.");
        }
      } catch (err) {
        console.log("Catch Error", err);
      }
    } else {
      console.log("Connection Error...");
    }
    conn.release();
    console.log("Update Employee Claim Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

empclmnorm.post("/updateempclmnorm", async (req, res) => {
  req.setTimeout(86400000);
  console.log("updateempclmnorm------", req.body);
  const validation = joiValidate.editemployeeclaimDataSchema.validate(req.body);
  if (validation.error) {
    console.log(validation.error.details);
    // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    return res.json([
      { msg: validation.error.details[0].message, err_code: "422" },
    ]);
  }
  let result = await updateempclmnorm(req);
  res.end(JSON.stringify(result));
});

// Empclmnorm Upload
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    console.log("request file--", file);
    let namefile = file.originalname.split("-")[0],folder_status = false;
    console.log("file name ", file.originalname);
    const fs = require("fs");
    const filename = namefile;
    const imagePath = `${__dirname}/../Documents/empclaim/${filename}`;
    fs.exists(imagePath, (exists) => {
      if (exists) {
        folder_status = true;
        console.log("Directory Already Created.");
      } else {
        folder_status = true;
        fs.mkdir(imagePath, { recursive: true }, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("New Directory Successfully Created.");
          }
        });
      }
      if (folder_status) {
        callback(null, imagePath);
      }
    });
  },
  filename: function (req, file, callback) {
    console.log("Filename*****", file.originalname);
    let nowdate = new Date();
    console.log("now date", file);
    let edate = nowdate.toISOString().replace(/T/, "-").replace(/\..+/, "").slice(0, 16);
    console.log("edate", edate);
    let file_name = file.originalname.split("-")[0];
    console.log("file type 420", file_name);

    let minetype1 = file.mimetype.split("/")[1];

    console.log("mine type", minetype1);
    callback(null, file_name);
    // let type = file.mimetype == "application/pdf" ? "pdf" : "png";
    // callback(
    //   null,
    //   file_name + "_" + nowdate.toISOString().slice(0, 10) + "." + type
    // );
  },
});

const upload = multer({ storage: storage }).array("file", 1000);

empclmnorm.post("/uploadempclaim", (req, res) => {
  var erroraray = [],data,sqlquery,file;
  file = req.body;
  upload(req, res, function (err) {
    if (err) {
      console.log("Error uploading file.", err);
      erroraray.push({ msg: "Upload Failed", error_msg: "FAIL" });
      res.end(JSON.stringify(erroraray));
    } else {
      (data = req.body), (file = req.files);
      // const { cnid } = req.body;
      console.log("Request.", req.body, file);
      console.log("Request Files .", file.length);
      let insertvalue = [];
      file.forEach((x) => {
        x.originalname.split("-")[1];
        let minetype1 = x.mimetype.split("/")[1];
        insertvalue.push([ "(" + data.id, "'" + x.filename + "'", "'" + minetype1 + "'" + ")", ]);
        console.log("Mimetype....", minetype1);
        console.log("InsertValue---", insertvalue);
      });
      sqlquery = ` INSERT INTO veremaxpo.claim_file (cnid,filename,filetype) VALUES ${insertvalue} `;
      console.log("Upload EmployeeClaim Query.", sqlquery);
      pool.getConnection(function (err, conn) {
        if (err) {
          console.log("Failed");
        } else {
          var sql = conn.query(sqlquery, function (err, result) {
            conn.release();
            if (!err) {
              if (result.affectedRows > 0) {
                erroraray.push({
                  msg: "Files Added Successfully",
                  error_msg: 0,
                });
                console.log("File is Uploaded.");
                res.end(JSON.stringify(erroraray));
              } else {
                console.log("File Not Uploaded.", err);
                erroraray.push({ msg: "Upload Failed", error_msg: "FAIL" });
                res.end(JSON.stringify(erroraray));
              }
            } else {
              console.log("File Not Uploaded.", err);
              erroraray.push({ msg: "Upload Failed", error_msg: "FAIL" });
              res.end(JSON.stringify(erroraray));
            }
          });
        }
      });
    }
  });
});

empclmnorm.post("/getempname", (req, res) => {
  let data = req.body,where = [],sql;
  console.log("Getempid Data---", data);
  pool.getConnection((err, con) => {
    let sqlquery = `SELECT p.project_id,p.project_title,e.emp_id_pk,e.emp_id,e.full_name FROM veremaxpo.p_project_mas p 
    INNER JOIN veremaxpo.employee e ON  p.project_id=e.projectidfk`;

    if (data.hasOwnProperty("project_id") && data.project_id) {
      where.push("p.project_id= " + data.project_id);
    }
    if (data.hasOwnProperty("emp_id") && data.emp_id) {
      where.push("e.emp_id_pk= " + data.emp_id);
    }
    if (where.length > 0) {
      sqlquery += " where " + where.join(" AND ");
    }

    console.log("Query---", sqlquery);
    sql = con.query(sqlquery, (err, result) => {
      con.release();
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updateapprovalstatus(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,
      errorvalue = [],
      conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("Update EmpClmNorm Data", data);
        let preadd = `SELECT * FROM veremaxpo.claim_normal WHERE id=${data.clmid}`;
        preadd = await conn.query(preadd);
        if (preadd[0].length == 1) {
          preadd = preadd[0][0];
          console.log("Preadd Details:", preadd);
          let sqlupdate = ` UPDATE veremaxpo.claim_normal SET approval_status=${data.approval},remarks='${data.remark}'`;

          // ,approval_status=${data.approval}
          /*,approval_status=${data.approval},deptid=${data.department} */

          // if (data.activity == false) {
          //   sqlupdate += ` ,activity=${1}`;
          // } else if (data.activity == false) {
          //   sqlupdate += ` ,activity=${2}`;
          // } else {
          //   sqlupdate += ` ,activity=${3}`;
          // }
          sqlupdate += ` where id=${data.clmid}`;
          console.log("Update EmpClmNorm Data", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='EMPLOYEECLAIM APPROVAL STATUS INFO UPDATED ID:${data.id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0)
              errorvalue.push({
                msg: "Employee Approval Status Updated Successfully",
                err_code: 0,
              });
            await conn.commit();
          } else {
            errorvalue.push({
              msg: "Please Try After Sometimes",
              err_code: "215",
            });
            await conn.rollback();
          }
        } else {
          console.log("No Employee Claim Normal Found.");
        }
      } catch (err) {
        console.log("Catch Error", err);
      }
    } else {
      console.log("Connection Error...");
    }
    conn.release();
    console.log(
      "Update EmployeeClaim Approval Status Connection Closed",
      errorvalue
    );
    return resolve(errorvalue);
  });
}

empclmnorm.post("/updateapprovalstatus", async (req, res) => {
  console.log(req.body);
  req.setTimeout(86400000);
  let result = await updateapprovalstatus(req);
  res.end(JSON.stringify(result));
});

async function bulkemployeeclaim(req) {
  return new Promise(async (resolve, reject) => {
    var data = req.body,dd,errorarray = [];
    let conn = await poolPromise.getConnection();
    const jwt_data = req.jwt_data;
    if (conn) {
      console.log("Add file", data.bulk.length);
      for (var i = 0; i < data.bulk.length; i++) {
        await conn.beginTransaction();
        try {
          let empclmbid = data.bulk[i],bempclmid = {};
          console.log("Bulk Employee Claim Data", data.bulk);
          let projectid = "",distid = "",empid = "",deptid = "",desid = "",typeid = "",
          stateid = `SELECT id from states WHERE name='${empclmbid.state_id}'`;
          stateid = await conn.query(stateid);
          if (stateid[0].length == 1) {
            stateid = stateid[0][0].id;
            console.log("State", stateid);
            distid = `SELECT id from districts WHERE name='${empclmbid.district_id}' AND state_id=${stateid}`;
            distid = await conn.query(distid);
            if (distid[0].length == 1) {
              distid = distid[0][0].id;
              console.log("District", distid);
              empid = `SELECT emp_id_pk FROM employee WHERE emp_id='${empclmbid.emp_id}' AND full_name='${empclmbid.emp_name}'`;
              empid = await conn.query(empid);
              if (empid[0].length == 1) {
                empid = empid[0][0].emp_id_pk;
                console.log("Employee ID", empid);
                deptid = `SELECT id FROM department WHERE depname='${empclmbid.emp_deptid}'`;
                deptid = await conn.query(deptid);
                if (deptid[0].length == 1) {
                  deptid = deptid[0][0].id;
                  console.log("Department ID", deptid);
                  desid = `SELECT id FROM designation WHERE desname='${empclmbid.emp_desid}' AND depid=${deptid}`;
                  desid = await conn.query(desid);
                  if (desid[0].length == 1) {
                    desid = desid[0][0].id;
                    console.log("Designation ID", desid);
                    typeid = `SELECT prsmid FROM p_pr_sm WHERE prsmname='${empclmbid.type}'`;
                    typeid = await conn.query(typeid);
                    if (typeid[0].length == 1) {
                      typeid = typeid[0][0].prsmid;
                      console.log("Prsm Type ID", typeid);          
                      if (empclmbid.projectidfk) {
                        projectid = `SELECT project_id from p_project_mas WHERE project_title='${empclmbid.projectidfk}'`;
                        projectid = await conn.query(projectid);
                        dd = projectid[0][0].project_id;
                        console.log("Project ID", dd);
                        if (projectid[0].length == 0) {
                          errorarray.push({
                            msg: "Project Title Not Found.",
                            error_msg: 287,
                          });
                          await conn.rollback();
                          continue;
                        }
                      } else {
                        console.log("Project Title");
                        console.log("Activity", activity);
                      }                      
                      bempclmid["emp_id"] = empid;                    
                      bempclmid["emp_name"] = empid;    
                      bempclmid["emp_deptid"] = deptid;
                      bempclmid["emp_desid"] = desid;
                      bempclmid["type"] = typeid;
                      bempclmid["claim_amt"] = empclmbid.claim_amt;
                      bempclmid["start_date"] = empclmbid.start_date.slice(0 ,10);
                      bempclmid["end_date"] = empclmbid.end_date.slice(0, 10);          
                      // bempclmid["activity"] = empclmbid.activity;
                      bempclmid["activity"] = empclmbid["activity"] == "O&M" ? 1 : empclmbid["activity"] == "Project" ? 2 : 3;
                      // bempclmid["projectidfk"] = projectid[0][0]["projectidfk"];
                      bempclmid["projectidfk"] = dd;
                      bempclmid["state_id"] = stateid;
                      bempclmid["district_id"] = distid;
                      bempclmid["jwt_data"] = jwt_data;                                                  
                      console.log("bulkemployeeclaim", bempclmid);
                      let res = await addempclmnorm(bempclmid);
                      console.log("res", res);
                      errorarray.push(res[0]);
                    } else {
                      errorarray.push({
                        msg: "Type Name does not matched",
                        error_msg: 867,
                      });
                      await conn.rollback();
                      continue;
                    }
                  } else {
                    errorarray.push({
                      msg: "Designation Name does not matched",
                      error_msg: 855,
                    });
                    await conn.rollback();
                    continue;
                  }
                } else {
                  errorarray.push({
                    msg: "Department Name does not matched",
                    error_msg: 848,
                  });
                  await conn.rollback();
                  continue;
                }
              } else {
                errorarray.push({
                  msg: "Employee ID and Employee Name and Project Name does not matched",
                  error_msg: 841,
                });
                await conn.rollback();
                continue;
              }
            } else {
              errorarray.push({
                msg: "District Name does not matched",
                error_msg: 2471,
              });
              await conn.rollback();
              continue;
            }
          } else {
            errorarray.push({
              msg: "State name does not matched",
              error_msg: 2476,
            });
            await conn.rollback();
            continue;
          }
        } catch (e) {
          console.log("Inside Catch Error", e);
          await conn.rollback();
        }
      }
      console.log("Success-1", errorarray);
      conn.release();
      console.log("Bulkemployeeclaim Connection Closed.");
    } else {
      return resolve({ msg: "Please Try After Sometimes", error_msg: "CONN" });
    }
    return resolve(errorarray);
  });
}

empclmnorm.post("/bulkemployeeclaim",/*schema.vehicleschema, schema.validate,*/ async (req, res) => {
    console.log(req.body);
    req.setTimeout(864000000);
    // console.log('dhcbg---------', req.body);
    let result = await bulkemployeeclaim(req);
    console.log(result);
    res.end(JSON.stringify(result));
  }
);

module.exports = empclmnorm;