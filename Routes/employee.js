"use strict";
const express = require("express"),
  employee = express.Router(),
  // schema = require("../schema/schema"),
  joiValidate = require("../schema/employee"),  
  pool = require("../connection/connection"),
  poolPromise = require("../connection/connection").poolpromise;
const { log } = require("console");
const multer = require("multer");

////****ADD EMPLOYEE****/
async function addemployee(req) {
  return new Promise(async (resolve, reject) => {
    let data = req.body,jwt_data = req.jwt_data,errorvalue = [],status = false,conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("Add Employee", data);
        let sqlquery = `SELECT * FROM veremaxpo.employee WHERE emp_id='${data.employee_id}' and personal_mob_no='${data.mobile_no}'`;
        let emprole = `SELECT menu_role,role_id_pk FROM role_mas  WHERE role_id_pk=${data.employeerole}`;
        emprole = await conn.query(emprole);
        let resp = await conn.query(sqlquery);
        if (resp[0].length == 0) {
          let sqlinsert = `insert into veremaxpo.employee set emp_id='${data.employee_id}',first_name='${data.fst_name}',
          emp_type=${data.emp_type},depid=${data.emp_deptid},desid=${data.emp_desid},state_id_fk=${data.state},dist_id_fk=${data.district},personal_mob_no='${data.mobile_no}',
				  personal_email='${data.email_id}',pan_no='${data.pan_no}',last_name='${data.lst_name}',full_name=CONCAT('${data.fst_name}',' ','${data.lst_name}'),logintype=${data.logintype},created_by=${jwt_data.user_id}`;

          if (data.client) sqlinsert += `,client='${data.client}'`;
          if (data.projectname) sqlinsert += `,projectidfk='${data.projectname}'`;
          if (data.role) sqlinsert += `,levelid='${data.role}'`;
          if (data.sub_emp) sqlinsert += ` ,sub_emptype_id='${data.sub_emp}'`;
          if (data.birth != null) sqlinsert += ` ,dob='${data.birth}'`;
          if (data.joining) sqlinsert += ` ,doj='${data.joining}'`;
          if (data.bank_name) sqlinsert += ` ,bank_name='${data.bank_name}'`;
          if (data.acnt_no) sqlinsert += ` ,bank_acct_no='${data.acnt_no}'`;
          if (data.acnt_name) sqlinsert += ` ,bank_account_name='${data.acnt_name}'`;
          if (data.bank_branch) sqlinsert += ` ,branch_address='${data.bank_branch}'`;
          // if (data.experience) sqlinsert += ` ,exp_yrs='${data.experience}'`;
          if (data.ifsc_no) sqlinsert += ` ,ifsc_code='${data.ifsc_no}'`;
          if (data.micf_code) sqlinsert += ` ,micf_code='${data.micf_code}'`;
          if (data.gst_no) sqlinsert += ` ,gst_no='${data.gst_no}'`;
          if (data.experienc_yrs) sqlinsert += ` ,exp_yrs='${data.experience_yrs}'`;
          if (data.emergency_no) sqlinsert += ` ,emergency_no='${data.emergency_no}'`;
          if (data.present_addr) sqlinsert += ` ,persent_address='${data.present_addr}'`;
          if (data.permanent_addr) sqlinsert += ` ,permanent_address='${data.permanent_addr}'`;
          if (data.other_acnt_name) sqlinsert += ` ,other_bank_name='${data.other_acnt_name}'`;
          if (data.otherbnk_acnt_no) sqlinsert += ` ,other_bank_acc_no='${data.otherbnk_acnt_no}'`;
          if (data.otherbank_addr) sqlinsert += ` ,other_bank_address='${data.otherbank_addr}'`;
          if (data.other_ifsc_no) sqlinsert += ` ,other_bank_ifsc_code='${data.other_ifsc_no}'`;
          if (data.work_exp) sqlinsert += ` ,wok_exp_type='${data.work_exp}'`;
          if ((status = 1)) sqlinsert += ` ,status=${(status = 1)}`;

          let usmas = await conn.query(sqlinsert);
          if (usmas[0]["affectedRows"] > 0) {
            let check = ` select * from veremaxpo.employee_mas where username='${data.username}' `;
            let res = await conn.query(check);
            if (res[0].length == 1) {
              errorvalue.push({ msg: `User Already Exists`, err_code: 1 });
              await conn.rollback();
            } else {
              let umsql = `insert into veremaxpo.employee_mas set usercode='${data.usercode}',state_id=${data.state},city_id=${data.district},
								username='${data.username}',empid='${usmas[0]["insertId"]}',firstname='${data.fst_name}',lastname='${data.lst_name}',usr_password='${data.usr_password}',
								role_id=${data.employeerole},email='${data.email_id}',mobile='${data.mobile_no}',menu_role='${emprole[0][0].menu_role}',created_by=${jwt_data.user_id}`;
              let result = await conn.query(umsql);
              if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
                let id = result[0]['insertId']
                let logq = `INSERT INTO veremaxpo.activity_log SET table_id='EMPLOYEE ADDED ID:${id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}'`
                console.log(logq);
                let fres=await conn.query(logq);
                if(fres[0]['affectedRows'] > 0 && fres[0]['insertId'] > 0);
                errorvalue.push({ msg: `Employee Added Successfully ${result[0]["insertId"]}`,err_code: 0 });
                await conn.commit();
              }
            }
          } else {
            errorvalue.push({ msg: `Please try after sometime log`, err_code: 1 });
            await conn.rollback();
          }
        } else {
          errorvalue.push({ msg: "Employee Already Added" });
        }
      } catch (e) {
        console.log("Catch Block Error", e);
        errorvalue.push({ msg: "Please try after sometimes", error_msg: "103" });
        await conn.rollback();
      }
    } else {
      errorvalue.push({ msg: "Please try after sometimes", error_msg: "107" });
    }
    if (conn) conn.release();
    console.log("Addemployee Connection Closed.");
    console.log("Return Value", errorvalue);
    return resolve(errorvalue);
  });
}

employee.post("/addemployee", async (req, res) => {
  req.setTimeout(864000000);
  console.log("Add Employee-----",req.body);
  const validation = joiValidate.employeeDataSchema.validate(req.body);
  if (validation.error) {
      console.log(validation.error.details);
      return res.json([{ msg: validation.error.details[0].message, err_code: '91' }]);
  }
  let result = await addemployee(req);
  res.end(JSON.stringify(result));
});

employee.post("/listempdata", function (req, res) {
  var data = req.body,where = [],value = [],sql,
    sqlqueryb = `SELECT e.emp_id_pk,e.emp_id,e.first_name,e.full_name,e.last_name,DATE_FORMAT(e.dob,'%d-%m-%Y') AS dob,DATE_FORMAT(e.doj,'%d-%m-%Y') AS doj,  
		e.blood_group,e.reporting_to,e.bank_name,e.bank_acct_no,e.micf_code,e.bank_account_name,e.branch_address,e.ifsc_code,e.gst_no,e.pan_no,e.pf_no,  
		e.personal_mob_no,e.personal_email,e.exp_yrs,e.emergency_no,e.persent_address,e.permanent_address,e.father_name,e.spouse_name,e.esi_applicable,  
		e.pf_applicable,e.fixed_allowance_applicable,e.emp_frm,e.other_bank_name,e.other_bank_acc_no,e.other_bank_address,
		e.other_bank_ifsc_code,e.system_allocated_no,e.emp_type,e.sub_emptype_id,dept.depname,des.desname,
		e.outsourcing_from,e.status,e.cdate,e.mdate,e.created_by,e.updated_by,e.client,pc.client_name,
		e.projectidfk,ppm.project_title,e.state_id_fk,s.name,e.dist_id_fk,d.name dist_name,e.levelid FROM employee e
		INNER JOIN states s ON s.id= e.state_id_fk
		INNER JOIN districts d ON d.id= e.dist_id_fk
		LEFT JOIN p_client pc ON pc.client_id=e.client
		LEFT JOIN p_project_mas ppm ON ppm.project_id=e.projectidfk
		LEFT JOIN department dept ON dept.id=e.depid
		LEFT JOIN designation des ON des.id=e.desid`,
    sqlqueryc = `SELECT count(emp_id_pk) total FROM employee e
		INNER JOIN states s ON s.id= e.state_id_fk
		INNER JOIN districts d ON d.id= e.dist_id_fk
		LEFT JOIN p_client pc ON pc.client_id=e.client
		LEFT JOIN p_project_mas ppm ON ppm.project_id=e.projectidfk
		LEFT JOIN department dept ON dept.id=e.depid
		LEFT JOIN designation des ON des.id=e.desid`;

  if (data.like) where.push(` emp_name like '%${data.like}%'`);

  if (data.hasOwnProperty("emp_name") && data.emp_name) {
    where.push(" first_name LIKE '%" + data.emp_name + "%'" + " OR last_name LIKE '%" + data.emp_name + "%'");
    console.log(data.like, "like");
  }
  if (data.hasOwnProperty("emp_id") && data.emp_id) {
    where.push(" emp_id LIKE '%" + data.emp_id + "%'");
  }
  if (data.hasOwnProperty("status") && data.status) {
    where.push(" status= " + data.status);
  }
  if (where.length > 0) {
    sqlqueryb += " where" + where.join(" AND ");
    sqlqueryc += " where " + where.join(" AND ");
  }
  if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
    sqlqueryb += " ORDER BY emp_id DESC LIMIT " + data.index + ", " + data.limit;
  }
  console.log("Get Count Query :", sqlqueryb);
  pool.getConnection((err, conn) => {
    if (err) {
      console.log("Listempdata Connection Error.");
      res.send(JSON.stringify("failed"));
    } else {
      sql = conn.query(sqlqueryb, function (err, result) {
        value.push(result);
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log("Listempdata Connection Closed.");
            if (!err) {
              value.push(result[0]);
              // console.log("List Deposit Result", value);
              res.send(JSON.stringify(value));
            } else {
              console.log("Query Failed");
              res.send(JSON.stringify(result));
            }
          });
        } else {
          console.log("error", err);
          conn.release();
          console.log("Listempdata Connection Closed.");
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

employee.post("/getempmas", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbuss = `SELECT e.emp_id_pk,e.emp_id,e.first_name,e.full_name,e.last_name,DATE_FORMAT(dob,'%d-%m-%Y') AS dob,DATE_FORMAT(doj,'%d-%m-%Y') AS doj, 
    e.blood_group,e.reporting_to,e.bank_name,e.bank_acct_no,e.state_id_fk,e.dist_id_fk,e.micf_code,e.bank_account_name,e.branch_address,e.ifsc_code,e.gst_no,
    e.pan_no,e.pf_no,e.personal_mob_no,e.personal_email,e.wok_exp_type,e.exp_yrs,e.emergency_no,e.persent_address,e.permanent_address,e.father_name,e.spouse_name,
    e.esi_applicable,e.pf_applicable,e.fixed_allowance_applicable,e.emp_frm,e.other_bank_name,e.other_bank_acc_no,e.other_bank_address,e.other_bank_ifsc_code,
    e.system_allocated_no,e.emp_type,e.sub_emptype_id,e.outsourcing_from,e.status,e.client,e.projectidfk,e.levelid rolelevel,um.user_id,um.empid,um.usercode,
    um.username,um.usr_password,um.firstname,um.lastname,um.role_id,um.mobile,um.email,e.logintype,e.depid,e.desid
    FROM employee e
    LEFT JOIN employee_mas um ON um.empid =e.emp_id_pk
    LEFT JOIN department dept ON dept.id=e.depid
    LEFT JOIN designation des ON des.id=e.desid
    WHERE e.emp_id_pk=${data.id}`;
    console.log("Query---", sqlbuss);
    let sqlg = conn.query(sqlbuss, data.id, (err, result) => {
      conn.release();
      console.log("Getempmas Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        // console.log(result);
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updateemp(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body,fixedData = {},status = false,errorvalue = [];
    const jwt_data = req.jwt_data;
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let insqry = `select exists(select * from veremaxpo.employee where emp_id_pk=${data.id}) count`;
        console.log("employee query", insqry);
        let userNameCheck = await conn.query(insqry);
        console.log("result", userNameCheck);
        if (userNameCheck[0][0].count == 0) {
          console.log("employee id exists");
          errorvalue.push({ msg: "emplyoee info error", err_code: 264 });
          await conn.rollback();
        } else {
          //  let client =data.client== userNameCheck.client? userNameCheck.client:data.client ==null?null:data.client==''?null:data.client;
          //  let projectname =data.projectname== userNameCheck.projectidfk? userNameCheck.projectidfk:data.projectname ==null?null:data.projectname==''?null:data.projectname;
          //  let role=data.role== userNameCheck.levelid? userNameCheck.levelid:data.role ==null?null:data.role==''?null:data.role;
          let sqlupdate = `update veremaxpo.employee set emp_id='${data.employee_id}',first_name='${data.fst_name}',
					emp_type=${data.emp_type},state_id_fk=${data.state},dist_id_fk=${data.district},personal_mob_no='${data.mobile_no}',
					personal_email='${data.email_id}',pan_no='${data.pan_no}',last_name='${data.lst_name}',client='${data.client}',
					projectidfk='${data.projectname}',levelid='${data.role}',depid=${data.emp_deptid},desid=${data.emp_desid},sub_emptype_id='${data.sub_emp}',
          dob='${data.birth}',doj='${data.joining}',bank_name='${data.bank_name}',bank_acct_no='${data.acnt_no}',bank_account_name='${data.acnt_name}',
					branch_address='${data.bank_branch}',emergency_no='${data.emergency_no}',persent_address='${data.present_addr}',permanent_address='${data.permanent_addr}',
          other_bank_name='${data.other_acnt_name}',other_bank_acc_no='${data.otherbnk_acnt_no}',other_bank_address='${data.otherbank_addr}',
					other_bank_ifsc_code='${data.other_ifsc_no}',wok_exp_type='${data.work_exp}',updated_by=${jwt_data.user_id}`;
          if (data.experienc_yrs) {
            sqlupdate += ` ,exp_yrs='${data.experienc_yrs}'`;
          }
          sqlupdate += ` where emp_id_pk= ${data.id}`;
          console.log("Update Employee Query---------", sqlupdate);
          let final = await conn.query(sqlupdate, data);
          console.log(final, "finallll");
          if (final[0]["affectedRows"] > 0) {
            let ussql = `update veremaxpo.employee_mas set usercode='${data.usercode}',
						username='${data.username}',firstname='${data.fst_name}',lastname='${data.lst_name}',usr_password='${data.usr_password}',
						role_id=${data.employeerole},email='${data.email_id}',mobile='${data.mobile_no}',updated_by=${jwt_data.user_id}`;
            ussql += ` where empid=${data.id}`;
            console.log("usermas update", ussql);
            let result = await conn.query(ussql, data);
            console.log("result", result[0]["affectedRows"]);
            if (result[0]["affectedRows"] > 0) {
              let logQuery = ` INSERT into  veremaxpo.activity_log SET table_id='Employee updated ID:${data.employee_id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},\`data\`='${JSON.stringify(data)}' `;
              console.log(logQuery);
              let logres = await conn.query(logQuery);
              if (logres["affectedRows"] > 0)
                console.log(logres, "212121212121212121");
              errorvalue.push({
                msg: "employee updated Successfully",
                err_code: 0,
              });
              await conn.commit();
            } else {
              errorvalue.push({
                msg: "Please Try After Sometimes",
                err_code: 300,
              });
              await conn.rollback();
            }
          }
        }
      } catch (err) {
        console.log("catch error", err);
      }
    } else {
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("updateemp connection closed", errorvalue);
    return resolve(errorvalue);
  });
}

employee.post("/updateemp", async (req, res) => {
  req.setTimeout(864000000);
  console.log("Update Employee------",req.body);
  const validation = joiValidate.editemployeeDataSchema.validate(req.body);
  if (validation.error) {
      console.log(validation.error.details);
      return res.json([{ msg: validation.error.details[0].message, err_code: '91' }]);
  }
  let result = await updateemp(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

// async function bulkemployeemaster(req){
//   return new Promise(async (resolve, reject) => {
//     var data = req.body,errorarray = [],conn = await poolPromise.getConnection(),jwt_data = req.jwt_data;
//     if(conn) {
//       console.log("Add File", data.bulk.length);
//       for(var i=0; i < data.bulk.length; i++) {
//           await conn.beginTransaction();
//           try {
//             let empmas = data.bulk[i],empmid = {};
//             console.log("Bulk Employee Master", empmas);
//             let deptid = "", 
//             emptypeid = `SELECT empay_type_id_pk FROM emp_pay_type WHERE empay_type_name="${empmid.emp_type}"`;
//             emptypeid = await conn.query(emptypeid);
//             if(emptypeid[0].length == 1) {
//               emptypeid = emptypeid[0][0].empay_type_id_pk;
//               console.log("Employee Type ID", emptypeid);
//               deptid = `SELECT id FROM department WHERE depname="${empmid.emp_deptid}"`;
//               deptid = await conn.query(deptid);
//               if(deptid[0].length == 1) {
//                 deptid = deptid[0][0].id;
//                 console.log("Department ID", deptid);
//               }
//             }
//           }
//       }
//     }
//   })
// }


////----List Project----////
employee.post("/listproj", (req, res) => {
  let sqls,data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlshow = `SELECT project_id,project_title FROM p_project_mas`;
    sqls = conn.query(sqlshow, (err, result) => {
      conn.release();
      console.log("Listproj Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

employee.post("/rptemp", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbuss ="SELECT tem.emp_id_pk,tem.emp_id,tem.first_name,tem.middle_name,tem.last_name FROM employee AS tem";
    console.log("Query---", sqlbuss);
    let sqlg = conn.query(sqlbuss, data.id, (err, result) => {
      conn.release();
      console.log("Rptemp Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

employee.post("/listemptype", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbus = ` Select * from emp_pay_type where emp_pay_status = 0 `;
    console.log("Query---", sqlbus);
    let sql = conn.query(sqlbus, (err, result) => {
      conn.release();
      console.log("Listemptype Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        // console.log(result)
        res.send(JSON.stringify(result));
      }
    });
  });
});

employee.post("/listdoctype", (req, res) => {
  let data = req.body,sql,where = [];
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbus = `SELECT doc_type_id_pk,doc_name,status,ctime,mtime,created_by,updated_by FROM  doc_type_mas`;
    console.log("Query---", sqlbus);
    if (data.hasOwnProperty("status") && data.status) {
      where.push("status = " + data.status);
    }
    let sql = conn.query(sqlbus, (err, result) => {
      conn.release();
      console.log("Listdoctype Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        // console.log(result)
        res.send(JSON.stringify(result));
      }
    });
  });
});

////****ADD SUB EMPLOYEE TYPE****/
async function addsubemptype(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `select exists(select * from sub_emp_pay_type where sub_empay_type_name ='${data.subempayname}') count`;
        console.log("client query", sqlquery);
        let resp = await conn.query(sqlquery);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          console.log("Subemployeepay Exists");
          errorvalue.push({ msg: "Subemptype Name Already Exists", err_code: 46 });
          await conn.rollback();
        } else {
          let sqlinsert = `insert into sub_emp_pay_type set sub_empay_type_name='${data.subempayname}',created_by=${jwt_data.user_id}`;
          console.log("insert query", sqlinsert);
          let result = await conn.query(sqlinsert);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='SUBEMPINFO INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0 && logres[0]["insertId"] > 0)
            errorvalue.push({ msg: "Subemptype Added Successfully", err_code: 0 });
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 56 });
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
    console.log("addsubemptype connection closed", errorvalue);
    return resolve(errorvalue);
  });
}

employee.post("/addsubemptype", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  const validation = schema.subemptypeschema.validate(req.body);
  if (validation.error) {
    console.log(validation.error.details);
    return res.json([
      { msg: validation.error.details[0].message, err_code: "422" },
    ]);
  }
  console.log("dhcbg---------", req.body);
  let result = await addsubemptype(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

employee.post("/listsubemptype", (req, res) => {
  let data = req.body,and = [],value = [],sql;
  console.log("Data--", data);
  let sqlbus = `select * from sub_emp_pay_type where empay_type_id=2`,
    sqlqueryc = `select count(*) total from sub_emp_pay_type`;

  if (data.like) and.push(` sub_empay_type_name like '%${data.like}%'`);
  if (data.hasOwnProperty("subemptype_id") && data.subemptype_id) {
    and.push(" sub_empay_type_id_pk = " + data.subemptype_id);
  }
  if (data.hasOwnProperty("subemptype") && data.subemptype) {
    and.push(" sub_empay_type_name LIKE '%" + data.subemptype + "%'");
  }
  if (and.length > 0) {
    sqlbus += " and" + and.join(" AND ");
    sqlqueryc += " and" + and.join(" AND ");
  }
  if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
    sqlbus += " ORDER BY sub_empay_type_id_pk DESC LIMIT " + data.index + ", " + data.limit;
  }
  console.log("Get Count Query :", sqlbus);
  pool.getConnection((err, conn) => {
    if (err) {
      console.log("List  Failed....");
      res.send(JSON.stringify("failed"));
    } else {
      sql = conn.query(sqlbus, function (err, result) {
        value.push(result);
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log("Listsubemptype Connection Closed.");
            if (!err) {
              value.push(result[0]);
              // console.log("List Deposit Result", value)
              res.send(JSON.stringify(value));
            } else {
              console.log("Query Failed");
              res.send(JSON.stringify(result));
            }
          });
        } else {
          console.log("error", err);
          conn.release();
          console.log("Listsubemptype Connection Closed.");
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

employee.post("/getsubemptype", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbuss = `select sub_empay_type_id_pk,sub_empay_type_name,empay_type_id from veremaxpo.sub_emp_pay_type where sub_empay_type_id_pk=${data.subemp_id}`;
    console.log("Query---", sqlbuss);
    let sqlg = conn.query(sqlbuss, data.client_id, (err, result) => {
      conn.release();
      console.log("Getsubemptype Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        // console.log(result)
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updatesubemptype(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from sub_emp_pay_type where sub_empay_type_name ='${data.subempayname}') count`;
        console.log("subemptype query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          errorvalue.push({ msg: "subemptype already exists", err_code: 126 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.sub_emp_pay_type set sub_empay_type_name='${data.subempayname}',updated_by=${jwt_data.user_id}`;
          sqlupdate += ` where sub_empay_type_id_pk= ${data.subemp_id}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='SUBEMPINFO INFO  UPDATED ID:${data.subemp_id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0 && logres[0]["insertId"] > 0)
              errorvalue.push({
                msg: "subemptype updated Successfully",
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
    } else {
      ////Log the Connection Error entered into the else part
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("Updatesubemptype Connection Closed.", errorvalue);
    return resolve(errorvalue);
  });
}

employee.post("/updatesubemptype", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  const validation = schema.editsubemptypeschema.validate(req.body);
  if (validation.error) {
    console.log(validation.error.details);
    return res.json([
      { msg: validation.error.details[0].message, err_code: "422" },
    ]);
  }
  let result = await updatesubemptype(req);
  res.end(JSON.stringify(result));
});

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    console.log(file.originalname);
    let namefile = file.originalname.split("-")[0],folder_status = false;
    const fs = require("fs");
    const filename = namefile;
    const imagePath = `${__dirname}/../Documents/CertificateDoc/${filename}`;
    if (fs.existsSync(imagePath)) {
      folder_status = true;
      console.log(" Directory Already created.");
      if (folder_status) {
        callback(null, imagePath);
      }
    } else {
      folder_status = true;
      fs.mkdir(imagePath, { recursive: true }, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("New directory successfully created.");
        }
      });
      if (folder_status) {
        callback(null, imagePath);
      }
    }
  },
  filename: function (req, file, callback) {
    console.log(file);
    console.log("Filename", file.originalname);
    let nowdate = new Date();
    // let edate = ((nowdate).toISOString().replace(/T/, '-').replace(/\..+/, '')).slice(0, 16);
    let file_name = file.originalname.split("-")[1];
    let type = file.mimetype == "application/pdf" ? "pdf" : "png";
    callback(
      null,
      file_name + "-" + nowdate.toISOString().slice(0, 10) + "." + type
    );
  },
});

const upload = multer({ storage: storage }).array("file", 4);

employee.post("/uploadCertificate", function (req, res) {
  // Initial Upload Document
  var erroraray = [],data,filename;
  upload(req, res, function (err) {
    if (err) {
      console.log("Error uploading file.", err);
      erroraray.push({ msg: "Upload Failed", error_code: "FAIL" });
      res.end(JSON.stringify(erroraray));
    } else {
      data = req.body;
      let file = req.files;
      console.log("Data", data, "files", file);
      let sqlexists = `SELECT COUNT(*) count FROM veremaxpo.emp_doc_map WHERE emp_id =${data.id} AND doc_type_id =${data.type}`;
      pool.getConnection(function (err, conn) {
        if (err) {
          console.log("Failed");
          res.json({ msg: "Please try after sometimes", status: 0 });
        } else {
          var usql = "",
            sql = conn.query(sqlexists, function (err, result) {
              console.log("count", result);
              if (!err) {
                if (result[0]["count"] == 1) {
                  usql = `UPDATE veremaxpo.emp_doc_map set file_name='${file[0]["filename"]}' `;
                  usql += ` WHERE emp_id =${data.id} AND doc_type_id =${data.type}`;
                } else {
                  usql = ` insert into veremaxpo.emp_doc_map set file_name='${file[0]["filename"]}',emp_id=${data.id},doc_type_id=${data.type}`;
                }
                console.log("Update  Query.", usql);
                sql = conn.query(usql, function (err, result) {
                  if (!err) {
                    if (result["affectedRows"] > 0) {
                      let sqllog = `INSERT into veremaxpo.activity_log SET table_id= ${data.id} ,longtext ='${file[0]["filename"]}'`;
                      console.log(sqllog,"===============****================");
                      sql = conn.query(sqllog, function (err, result) {
                        if (!err) {
                          errorHandler({
                            msg: "DOCUMENT uploaded",
                            status: "0",
                          });
                        } else {
                          errorHandler({ msg: "log Failed", status: "1" });
                        }
                      });
                    }
                  } else {
                    console.log("File Not uploaded.", err);
                    errorHandler("Upload Failed");
                  }
                });
              } else {
                errorHandler("Upload Failed");
              }
            });
        }
        function errorHandler(msg, status = 1) {
          conn.release();
          res.json({ msg: msg, status: status });
        }
      });
    }
  });
});

employee.post("/getEmployee", (req, res) => {
  const data = req.body;
  let sql,where = [],
  sqlquery = ` SELECT e.emp_id_pk,e.emp_id,e.levelid,e.client,e.projectidfk FROM veremaxpo.employee e `;
  
  if (data.hasOwnProperty("emp_id") && data.emp_id) where.push(` e.emp_id LIKE '%${data.emp_id}%'`);
  if (data.hasOwnProperty("levelid") && data.levelid) where.push(`e.levelid=${data.levelid}`);
  if (where.length) sqlquery += ` WHERE ${where.join(" AND ")}`;

  pool.getConnection((err, conn) => {
    if (err) {
      res.send("Please Try after sometimes");
    } else {
      sql = conn.query(sqlquery, (err, result) => {
        conn.release();
        console.log("GetEmployee Connection Closed.");
        if (err) res.send("Please try after sometimes");
        else res.json(result);
      });
    }
  });
});

////----Department----/////
async function adddepartment(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body,errorvalue = [],conn = await poolPromise.getConnection();
    console.log("Add FrtRoom---", data);
    if (conn) {
      await conn.beginTransaction();
      try {
        let sqlquery = `SELECT EXISTS(SELECT * FROM veremaxpo.department WHERE depname='${data.emp_department}') COUNT`;
        console.log("Department Query", sqlquery);
        let resp = await conn.query(sqlquery);
        console.log("resp----", resp[0][0].count);
        console.log("result", resp);
        if (resp[0][0].count == 0) {
          console.log("Department Already Exists");
          errorvalue.push({ msg: "Department Already Exists", err_code: 26 });
          await conn.rollback();
        } else {
          let sqlinsert = `insert into veremaxpo.department SET depname = '${data.emp_department}'`;            
          console.log("insert query", sqlinsert);
          let result = await conn.query(sqlinsert);
          console.log("result", result);
          if (result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0) {
            errorvalue.push({ msg: "Department Added Successfully", err_code: 0 })
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 56 })
            await conn.rollback();
          }    
        }
      } catch (err) {
        console.log("Catch Error", err);
        errorvalue.push({ msg: "Please Enter Required Fields", err_code: "71" });
        await conn.rollback();
      }
    } else {
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("Add Department Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

employee.post("/adddepartment", async (req, res) => {
  req.setTimeout(864000000);
  console.log("Add Department-------",req.body);
  const validation = joiValidate.departmentDataSchema.validate(req.body);
  if (validation.error) {
      console.log(validation.error.details);
      return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
  }
  let result = await adddepartment(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

employee.post("/listdepartment", (req, res) => {
  let data = req.body, and = [], value = [], sql;
  console.log("Data--", data);
  let sqlbus = `SELECT id,depname FROM department`,
    sqlqueryc = `select count(*) total from department`;

    if(data.hasOwnProperty('emp_department') && data.emp_department) and.push(" depname= " + data.emp_department);
    if (data.hasOwnProperty('emp_deptid') && data.emp_deptid) and.push(' id = ' + data.emp_deptid);

    if (and.length > 0) {
      sqlbus += " and" + and.join(' AND ');
      sqlqueryc += " and" + and.join('AND');
    }

  if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
    sqlbus += ' ORDER BY id DESC LIMIT ' + data.index + ', ' + data.limit;
  }
  console.log('list Query :', sqlbus);
  pool.getConnection((err, conn) => {
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
              console.log('listdepartment connection Closed.');
              value.push(result[0]);
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

employee.post("/getdepartment", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbuss = `SELECT id,depname FROM veremaxpo.department WHERE id = ${data.id}`;
    console.log("Query---", sqlbuss);
    let sqlg = conn.query(sqlbuss, data.id, (err, result) => {
      conn.release();
      console.log("Get Department Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updatedepartment(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body, errorvalue = [],jwt_data = req.jwt_data;
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from veremaxpo.department where depname ='${data.emp_department}') count`;
        console.log("Department Query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          errorvalue.push({ msg: "Department Update Aready Exists", err_code: 126 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.department set depname = '${data.emp_department}'`;
          sqlupdate += ` where id= ${data.id}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='DEPARTMENT UPDATED ID:${data.id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0)
            errorvalue.push({ msg: "Department Updated Successfully", err_code: 0 });
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 151 });
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
    console.log("Connection closed", errorvalue);
    return resolve(errorvalue);
  });
}

employee.post("/updatedepartment", async (req, res) => {
  req.setTimeout(864000000);
  console.log(req.body);
  const validation = joiValidate.editdepartmentDataSchema.validate(req.body);
  if (validation.error) {
      console.log(validation.error.details);
      return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
  }
  let result = await updatedepartment(req);
  res.end(JSON.stringify(result));
});

////****Designation****////
async function adddesignation(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body,errorvalue = [];
    const jwt_data = req.jwt_data;
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `select exists(select * from designation where depid= ${data.emp_deptid} and desname ='${data.emp_designation}') count`
        console.log('Designation query', sqlquery);
        let resp = await conn.query(sqlquery)
        console.log('result', resp);
        if (resp[0][0].count != 0) {
          console.log('Designation Exists');
          errorvalue.push({ msg: "Designation Name Already Exists", err_code: 46 })
          await conn.rollback();
        } else {
          let sqlinsert = `insert into designation set depid=${data.emp_deptid},desname='${data.emp_designation}'`;
          console.log('insert query', sqlinsert);
          let result = await conn.query(sqlinsert)
          console.log('result', result);
          if (result[0]["affectedRows"] > 0 && result[0]["insertId"]) {
            let insin = result[0]["insertId"]
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='DESIGNATION ADDED ID:${insin}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery)
            if (logres[0]["affectedRows"] > 0)
              errorvalue.push({ msg: "Designation Added Successfully", err_code: 0 })
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 75 });
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
    console.log('Add Designation Connection Closed', errorvalue);
    return resolve(errorvalue);
  });
}

employee.post("/adddesignation", async (req, res) => {
  req.setTimeout(864000000);
  console.log("Add Designation-----",req.body)
  const validation = joiValidate.designationDataSchema.validate(req.body);
  if (validation.error) {
      console.log(validation.error.details);
      return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
  }
  let result = await adddesignation(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

employee.post("/listdesignation", (req, res) => {
  let data = req.body, and = [], value = [], sql;
  console.log("Data--", data);
  let sqlbus = `SELECT des.id,des.depid,dept.depname,des.desname,des.desstatus FROM designation des
    INNER JOIN department dept ON dept.id=des.depid `,
    sqlqueryc = ` SELECT COUNT(*) total FROM designation des
    INNER JOIN department dept ON dept.id=des.depid `;
  console.log('list Query: ', sqlbus);
  if (data.like) and.push(` desname like '%${data.like}%'`)
  if (data.hasOwnProperty('deptid') && data.deptid) {
    and.push(" des.depid  ='" + data.deptid + "'");
  }
  // if (data.hasOwnProperty('sm.prid') && data.prsmid) {
  //   and.push(' sm.prid = ' + data.prsmid);
  // }
  if (and.length > 0) {
    sqlbus += " and" + and.join(' AND ')
    sqlqueryc += " and" + and.join('AND')
  }
  if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
    sqlbus += ' ORDER BY id DESC LIMIT ' + data.index + ', ' + data.limit;
  }
  pool.getConnection((err, conn) => {
    if (err) {
      console.log('List  Failed....')
      res.send(JSON.stringify('failed'));
    } else {
      sql = conn.query(sqlbus, function (err, result) {
        value.push(result)
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log('Get Empdeptdes Connection Closed.');
            if (!err) {
              value.push(result[0]);
              res.send(JSON.stringify(value));
            } else {
              console.log('Query Failed')
              res.send(JSON.stringify(result));
            }
          })
        } else {
          console.log('error', err);
          conn.release();
          console.log('Get Empdeptdes Connection Closed.');
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

employee.post("/getdesignation", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbuss = `SELECT id,depid,desname FROM veremaxpo.designation WHERE id=${data.id}`;
    console.log("Query---", sqlbuss);
    let sqlg = conn.query(sqlbuss, data.id, (err, result) => {
      conn.release();
      console.log("Get Designation Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updatedesignation(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body, errorvalue = [],jwt_data = req.jwt_data;
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from veremaxpo.designation where depid=${data.emp_deptid} and desname='${data.emp_designation}') count`;
        console.log("Designation Query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          errorvalue.push({ msg: "Designation Update Aready Exists", err_code: 126 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.designation set depid=${data.emp_deptid},desname= '${data.emp_designation}'`;
          sqlupdate += ` where id= ${data.id}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='DESIGNATION UPDATED ID:${data.id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0)
            errorvalue.push({ msg: "Designation Updated Successfully", err_code: 0 });
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 151 });
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
    console.log("Connection closed", errorvalue);
    return resolve(errorvalue);
  });
}

employee.post("/updatedesignation", async (req, res) => {
  req.setTimeout(864000000);
  console.log("Update Designation-----",req.body);
  const validation = joiValidate.designationDataSchema.validate(req.body);
  if (validation.error) {
      console.log(validation.error.details);
      return res.json([{ msg: validation.error.details[0].message, err_code: '422' }]);
  }
  let result = await updatedesignation(req);
  res.end(JSON.stringify(result));
});

module.exports = employee;