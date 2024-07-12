const express = require("express"),
  frt_room = express.Router(),
  pool = require("../connection/connection"),
  compression = require("compression"),
  // schema = require("../schema/schema"),
  poolPromise = require("../connection/connection").poolpromise;
const multer = require("multer");
const joiValidate = require("../schema/frt_room");

const { response } = require("express");
const { validationResult } = require("express-validator/");

async function addfrtroom(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body == null ? req : req.body,
      jwt_data = req.jwt_data,
      errorvalue = [],
      conn = await poolPromise.getConnection();
    console.log("Add FrtRoom---", data);
    if (conn) {
      await conn.beginTransaction();
      try {
        let sqlquery = `Select Exists(Select * from veremaxpo.frt_room where owner_name='${data.ownername}' and rent_address='${data.address}') count`;
        console.log("Frtroom query", sqlquery);
        let resp = await conn.query(sqlquery);
        // console.log("resp----", resp[0][0].count);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          console.log("Frt Room Already Exists");
          errorvalue.push({ msg: "Frt Room Already Exists", err_code: 26 });
          await conn.rollback();
        } else {
          let sqlinsert = `insert into veremaxpo.frt_room set owner_name='${data.ownername}',project_id=${data.project_id},
          stateid=${data.circle_name},districtid=${data.cluster}`;

          console.log("Undefined Data Occured...");
          if (data.advance_paid_date)
            sqlinsert += ` ,adv_paid_date='${data.advance_paid_date}'`;
          if (data.address) sqlinsert += ` ,rent_address='${data.address}'`;
          if (data.owner_address)
            sqlinsert += ` ,owner_address='${data.owner_address}'`;
          if (data.phonenumber)
            sqlinsert += ` ,owner_mobile=${data.phonenumber}`;
          if (data.email) sqlinsert += ` ,owner_mail='${data.email}'`;
          if (data.aadharno) sqlinsert += ` ,owner_aadhar=${data.aadharno}`;
          if (data.bank_name) sqlinsert += ` ,owner_bank='${data.bank_name}'`;
          if (data.roomadvance)
            sqlinsert += ` ,advance_amt=${data.roomadvance}`;
          if (data.monthly_rent) sqlinsert += ` ,rent_amt=${data.monthly_rent}`;
          if (data.advance_date)
            sqlinsert += ` ,adv_paid_date='${data.advance_date}'`;
          if (data.approving_manager)
            sqlinsert += ` ,approvalname='${data.approving_manager}'`;
          if (data.active_date)
            sqlinsert += ` ,start_date='${data.active_date}'`;
          if (data.closing_date)
            sqlinsert += ` ,end_date='${data.closing_date}'`;
          if (data.acnt_name) sqlinsert += ` ,accholdname='${data.acnt_name}'`;
          if (data.acnt_no) sqlinsert += ` ,accno='${data.acnt_no}'`;
          if (data.ifsc_no) sqlinsert += ` ,accifsc='${data.ifsc_no}'`;
          if (data.bank_branch)
            sqlinsert += ` ,accbranch='${data.bank_branch}'`;
          if (data.panno) sqlinsert += ` ,ownerpan='${data.panno}'`;
          if (data.agr_active_date)
            sqlinsert += ` ,asdate='${data.agr_active_date}'`;
          if (data.agr_expiry_date)
            sqlinsert += ` ,aedate='${data.agr_expiry_date}'`;
          if (data.sublocation)
            sqlinsert += ` ,sub_location='${data.sublocation}'`;
          if (data.room_cat) sqlinsert += ` ,room_category='${data.room_cat}'`;

          console.log("insert query", sqlinsert);
          let result = await conn.query(sqlinsert);
          console.log("result", result);

          if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
            console.log("result", result[0]["insertId"]);

            if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
              let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='FRT ROOM ADDED ID:${
                result[0]["insertId"]
              }',\`longtext\`='DONE BY',cby=${
                jwt_data.user_id
              },data='${JSON.stringify(data)}'`;
              console.log(logQuery);
              let logres = await conn.query(logQuery);
              if (logres["affectedRows"] > 0 && logres["insertId"] > 0)
                console.log("Frt Room Added Successfully");
              errorvalue.push({
                msg: "Frt Room Added Successfully",
                rentid: result[0]["insertId"],
                err_code: 0,
              });
              await conn.commit();
            } else {
              errorvalue.push({
                msg: "Please Try After Sometimes",
                err_code: 67,
              });
              await conn.rollback();
            }
          }
        }
      } catch (err) {
        console.log("Catch Error", err);
        errorvalue.push({
          msg: "Please Enter Required Fields",
          err_code: "71",
        });
        await conn.rollback();
      }
    } else {
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("Addfrtroom Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

frt_room.post("/addfrtroom", async (req, res) => {
  req.setTimeout(864000000);
  console.log("dhcbg---------", req.body);
  const validation = joiValidate.frtDataSchema.validate(req.body);
  if (validation.error) {
    console.log(validation.error.details);
    // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    return res.json([
      { msg: validation.error.details[0].message, err_code: "422" },
    ]);
  }
  let result = await addfrtroom(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

frt_room.post("/listfrtroom", function (req, res) {
  var data = req.body, //IF(frt.aedate>CURDATE(),"Active","Expired") agr_status
    where = [],
    value = [];
  let sqlqueryb = ` SELECT frt.roomid,frt.owner_name,frt.owner_address,p.project_title,s.name AS state_name,d.name district,DATE_FORMAT(frt.adv_paid_date,'%Y-%m-%d') adv_paid_date,
  frt.rent_address,frt.advance_amt,frt.holding_status,frt.owner_mail,frt.owner_mobile,frt.owner_aadhar,frt.owner_bank,frt.accholdname,
  frt.accno,frt.accifsc,frt.accbranch,frt.ownerpan,frt.rent_amt,DATE_FORMAT(frt.start_date,'%Y-%m-%d') start_date,DATE_FORMAT(frt.end_date,'%Y-%m-%d') end_date,
  frt.paymode,frt.approvalname,frt.stateid,frt.districtid,frt.project_id,frt.sub_location,frt.room_category,frt_c.id,frt_c.room_category room_category_name,
  DATE_FORMAT(frt.asdate, '%Y-%m-%d') agr_start_date,DATE_FORMAT(frt.aedate, '%Y-%m-%d') agr_end_date,  
  IF(frt.aedate>CURDATE(),"Expired","Active") agr_status
  FROM frt_room frt
  INNER JOIN states s ON frt.stateid=s.id
  INNER JOIN districts d ON frt.districtid=d.id
  LEFT JOIN frt_room_rent frt_r ON frt.roomid = frt_r.rentid 
  LEFT JOIN p_project_mas p ON frt.project_id=p.project_id
  LEFT JOIN frt_room_category frt_c ON frt.room_category = frt_c.id `,
    sqlqueryc = ` Select count(*) AS total from frt_room frt 
        INNER JOIN states s ON frt.stateid = s.id
        INNER JOIN districts d ON frt.districtid = d.id
        LEFT JOIN frt_room_rent frt_r ON frt.roomid = frt_r.rentid 
        LEFT JOIN p_project_mas p ON frt.project_id = p.project_id
        LEFT JOIN frt_room_category frt_c ON frt.room_category = frt_c.id `;
  console.log("data", data);
  console.log("sqll", sqlqueryb);

  if (data.hasOwnProperty("roomid") && data.roomid)
    where.push(" frt.roomid= " + data.roomid);
  if (data.hasOwnProperty("owner_name") && data.owner_name)
    where.push(" frt.owner_name LIKE '%" + data.owner_name + "%'");
  if (data.hasOwnProperty("project_id") && data.project_id)
    where.push(" frt.project_id= " + data.project_id);
  if (data.hasOwnProperty("state_id") && data.state_id)
    where.push(" frt.stateid= " + data.state_id);
  if (data.hasOwnProperty("cluster") && data.cluster)
    where.push(" frt.districtid= " + data.cluster);
  if (data.hasOwnProperty("start_date") && data.start_date)
    where.push(' start_date= "' + data.start_date + '"');
  if (data.hasOwnProperty("end_date") && data.end_date)
    where.push(' end_date= "' + data.end_date + '"');

  // if (data.hasOwnProperty('active_date') && data.active_date && !data.closing_date) {
  //     where.push(' start_date >= "' + data.active_date + '" ');
  // }

  // if (data.hasOwnProperty('closing_date') && data.closing_date && !data.active_date) {
  //     where.push(' end_date <= "' + data.closing_date + '" ');
  // }

  // if (data.hasOwnProperty('paymode') && data.payment_mode == 1) {     // Suspend
  //     where.push(" paymode  ='" + 1 + "'");
  // }

  // if (data.hasOwnProperty('paymode') && data.payment_mode == 2) {     // Suspend
  //     where.push(" paymode  ='" + 2 + "'");
  // }

  if (where.length > 0) {
    sqlqueryb += " where" + where.join(" AND ");
    sqlqueryc += " where " + where.join(" AND ");
  }
  if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
    sqlqueryb +=
      " ORDER BY frt.roomid DESC LIMIT " + data.index + ", " + data.limit;
  }
  console.log("Get Count Query :", sqlqueryb);
  pool.getConnection((err, conn) => {
    if (err) {
      console.log("List Failed....");
      res.send(JSON.stringify("Failed"));
    } else {
      sql = conn.query(sqlqueryb, function (err, result) {
        value.push(result);
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log("Listfrtroom Connection Closed.");
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
          console.log("Listfrtroom Connection Closed.");
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

frt_room.post("/getfrtroom", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbuss = `SELECT frt.roomid,frt.owner_name,frt.owner_address,frt.rent_address,frt.advance_amt,frt.holding_status,frt.owner_mail,
    frt.owner_mobile,frt.owner_aadhar,frt.owner_bank,frt.accholdname,frt.accno,frt.accifsc,frt.accbranch,frt.ownerpan,
    frt.rent_amt,DATE_FORMAT(frt.start_date,'%Y-%m-%d') start_date,DATE_FORMAT(frt.end_date,'%Y-%m-%d') end_date,
    DATE_FORMAT(frt.asdate, '%Y-%m-%d') agr_start_date,DATE_FORMAT(frt.aedate, '%Y-%m-%d') agr_end_date,
    frt.approvalname,frt.stateid,frt.districtid,frt.project_id,frt.sub_location,frt_c.id
    FROM frt_room frt
    LEFT JOIN frt_room_category frt_c ON frt_c.id = frt.roomid
    WHERE frt.roomid=${data.roomid}`;
    console.log("Query---", sqlbuss);
    let sqlg = conn.query(sqlbuss, data.roomid, (err, result) => {
      conn.release();
      console.log("GetFrtRoom Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

async function updatefrtroom(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,
      errorvalue = [],
      conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("Update Frt Room Data", data);
        let olddetails = `Select * from frt_room where roomid=${data.roomid}`;
        olddetails = await conn.query(olddetails);
        if (olddetails[0].length == 1) {
          olddetails = olddetails[0][0];
          console.log("old details :", olddetails);
          let sqlupdate = ` update veremaxpo.frt_room set owner_name='${data.ownername}',owner_address='${data.owner_address}',rent_address='${data.address}',rent_amt=${data.monthly_rent},owner_mobile=${data.phonenumber}
                    ,owner_mail='${data.email}',owner_aadhar=${data.aadharno},advance_amt='${data.roomadvance}',rent_amt='${data.monthly_rent}',adv_paid_date='${data.advance_paid_date}'
                    ,project_id=${data.project_id},stateid=${data.circle_name},districtid=${data.cluster},approvalname='${data.approving_manager}',start_date='${data.active_date}'
                    ,end_date='${data.closing_date}',asdate='${data.agr_active_date}',aedate='${data.agr_expiry_date}',paymode='${data.payment_mode}',owner_bank='${data.bank_name}',accholdname='${data.acnt_name}',accno=${data.acnt_no}
                    ,accifsc='${data.ifsc_no}',accbranch='${data.bank_branch}',ownerpan='${data.panno}',sub_location='${data.sublocation}',room_category='${data.room_cat}' `;
          if (data.payment_mode == false) {
            sqlupdate += ` ,paymode=${1}`;
          } else {
            sqlupdate += ` ,paymode=${2}`;
          }
          sqlupdate += ` where roomid = ${data.roomid}`;
          console.log("Update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='FRTROOM INFO UPDATED ID:${data.roomid}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0)
              errorvalue.push({
                msg: "Frt Room Updated Successfully",
                err_code: 0,
                ID: +data.roomid,
              });
            await conn.commit();
          } else {
            errorvalue.push({
              msg: "Please Try After Sometimes",
              err_code: "234",
            });
            await conn.rollback();
          }
        } else {
          console.log("No Room Details Found.");
        }
      } catch (err) {
        console.log("Catch Error", err);
      }
    } else {
      //Log the Connection Error entered into the else part
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("Update_Frtroom Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

frt_room.post("/updatefrtroom", async (req, res) => {
  req.setTimeout(864000000);
  console.log(req.body);
  const validation = joiValidate.editfrtroomDataSchema.validate(req.body);
  if (validation.error) {
    console.log(validation.error.details);
    // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    return res.json([
      { msg: validation.error.details[0].message, err_code: "422" },
    ]);
  }
  let result = await updatefrtroom(req);
  res.end(JSON.stringify(result));
});

async function bulkfrtroom(req) {
  return new Promise(async (resolve, reject) => {
    var data = req.body,
      errorarray = [];
    let conn = await poolPromise.getConnection();
    const jwt_data = req.jwt_data;
    if (conn) {
      console.log("Add file", data.bulk.length);
      for (var i = 0; i < data.bulk.length; i++) {
        await conn.beginTransaction();
        try {
          let d = data.bulk[i],
            frtid = {};
          console.log("FrtRoom Data", d);
          let projectid = "",
            distid = "",
            roomcid = "",
            stateid = `SELECT id from states WHERE name='${d.circle_name}'`;
          stateid = await conn.query(stateid);
          if (stateid[0].length == 1) {
            stateid = stateid[0][0].id;
            console.log("State", stateid);
            distid = `SELECT id from districts WHERE name='${d.cluster}' AND state_id=${stateid}`;
            distid = await conn.query(distid);
            if (distid[0].length == 1) {
              distid = distid[0][0].id;
              console.log("District", distid);
              roomcid = `SELECT id FROM frt_room_category WHERE room_category='${d.room_cat}'`;
              roomcid = await conn.query(roomcid);
              if (roomcid[0].length == 1) {
                roomcid = roomcid[0][0].id;
                console.log("Room Category ID", roomcid);
                if (d.project_id) {
                  projectid = `SELECT project_id  from p_project_mas WHERE project_title='${d.project_id}'`;
                  projectid = await conn.query(projectid);
                  console.log("Project ID", projectid[0]);
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
                }
                frtid["ownername"] = d.ownername;
                frtid["address"] = d.address;
                frtid["owner_address"] = d.owner_address;
                frtid["room_cat"] = roomcid;
                frtid["phonenumber"] = d.phonenumber;
                frtid["email"] = d.email;
                frtid["aadharno"] = d.aadharno;
                frtid["panno"] = d.panno;
                frtid["roomadvance"] = d.roomadvance;
                frtid["monthly_rent"] = d.monthly_rent;
                frtid["project_id"] = projectid[0][0]["project_id"];
                frtid["circle_name"] = stateid;
                frtid["cluster"] = distid;
                frtid["approving_manager"] = d.approving_manager;
                frtid["active_date"] = d.active_date;
                frtid["closing_date"] = d.closing_date;
                frtid["bank_name"] = d.bank_name;
                frtid["acnt_name"] = d.acnt_name;
                frtid["acnt_no"] = d.acnt_no;
                frtid["ifsc_no"] = d.ifsc_no;
                frtid["bank_branch"] = d.bank_branch;
                frtid["sublocation"] = d.sublocation;
                frtid["jwt_data"] = jwt_data;
                console.log("bulkfrtrroom", frtid);
                let res = await addfrtroom(frtid);
                console.log("res", res);
                errorarray.push(res[0]);
              } else {
                errorarray.push({
                  msg: "Room Category Name does not matched",
                  error_msg: 422,
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
      console.log("Bulkfrtroom Connection Closed.");
    } else {
      return resolve({ msg: "Please Try After Sometimes", error_msg: "CONN" });
    }
    return resolve(errorarray);
  });
}

frt_room.post(
  "/bulkfrtroom",
  /*schema.vehicleschema, schema.validate,*/ async (req, res) => {
    console.log(req.body);
    req.setTimeout(864000000);
    // console.log('dhcbg---------', req.body);
    let result = await bulkfrtroom(req);
    console.log(result);
    res.end(JSON.stringify(result));
  }
);

async function addrentamount(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body == null ? req : req.body,
      jwt_data = req.jwt_data,
      errorvalue = [],
      conn = await poolPromise.getConnection();
    console.log("Add Frtroomrent---", data);
    if (conn) {
      await conn.beginTransaction();
      try {
        let sqlquery = `Select Exists(Select * from veremaxpo.frt_room_rent where utr='${data.utrno}') count`;
        console.log("Frtrentamount query", sqlquery);
        let resp = await conn.query(sqlquery);
        console.log("resp----", resp[0][0].count);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          console.log("Frt Room Rent Exists");
          errorvalue.push({
            msg: "Add Rent Amount Already Exists",
            err_code: 466,
          });
          await conn.rollback();
        } else {
          let sqlinsert = `insert into veremaxpo.frt_room_rent set roomid=${data.room_id},projectid=${data.project_id},stateid=${data.circle_name},districtid=${data.cluster}`;
          console.log("Sqlinsert...", sqlinsert);

          if (data.paid_amount) sqlinsert += ` ,rentamt='${data.paid_amount}'`;
          if (data.paid_date) sqlinsert += ` ,paymonthdate='${data.paid_date}'`;
          if (data.pay_type) sqlinsert += ` ,paymode=${data.pay_type}`;
          if (data.utrno) sqlinsert += ` ,utr='${data.utrno}'`;
          if (data.rent_type) sqlinsert += ` ,renttype=${data.rent_type}`;
          if (data.recovery_amt)
            sqlinsert += ` ,recovery_amt='${data.recovery_amt}'`;
          if (data.brokerage_amt)
            sqlinsert += ` ,brokerage_amt='${data.brokerage_amt}'`;
          if (data.cheque_no) sqlinsert += ` ,cheque_no=${data.cheque_no}`;
          if (data.paid_to_name)
            sqlinsert += ` ,paid_name='${data.paid_to_name}'`;
          if (data.remarks) sqlinsert += ` ,rentnote='${data.remarks}'`;

          console.log("insert query", sqlinsert);
          let result = await conn.query(sqlinsert);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='RENTAMOUNT  Added rentid:${
              result[0]["insertId"]
            }',\`longtext\`='DONE BY',cby=${
              jwt_data.user_id
            },data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0 && logres[0]["insertId"] > 0)
              errorvalue.push({
                msg: "Frt Rent Amount Added Successfully",
                err_code: 0,
              });
            await conn.commit();
          } else {
            errorvalue.push({
              msg: "Please Try After Sometimes",
              err_code: 493,
            });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("catch error", err);
        errorvalue.push({ msg: "Please Enter Required Fields", err_code: 413 });
        await conn.rollback();
      }
    } else {
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("Addrentamount Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

frt_room.post("/addrentamount", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  console.log("dhcbg---------", req.body);
  const validation = joiValidate.frtroomrentDataSchema.validate(req.body);
  if (validation.error) {
    console.log(validation.error.details);
    // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
    return res.json([
      { msg: validation.error.details[0].message, err_code: "422" },
    ]);
  }
  let result = await addrentamount(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

frt_room.post("/listrentamount", (req, res) => {
  var data = req.body,
    where = [],
    value = [],
    condFor = "",
    sql,
    sqlqueryb = ` SELECT frt_r.rentid,frt_r.roomid,frt_r.rentamt,DATE_FORMAT(frt_r.paymonthdate,'%Y-%m-%d') paymonthdate,
        frt_r.paymode,frt_r.utr,frt_r.rentnote,frt_r.paid_name,p.project_title,s.name statename,d.name districtname,
        frt_r.renttype,frt_r.brokerage_amt,frt_r.recovery_amt,frt_r.cheque_no
        FROM frt_room_rent frt_r
        LEFT JOIN  states s ON frt_r.stateid=s.id
        LEFT JOIN districts d ON frt_r.districtid=d.id
        LEFT JOIN frt_room frt ON frt_r.rentid = frt.roomid
        LEFT JOIN p_project_mas p ON frt_r.projectid=p.project_id `,
    sqlqueryc = ` SELECT count(*) AS total from frt_room_rent frt_r
        LEFT JOIN states s ON frt_r.stateid=s.id
        LEFT JOIN districts d ON frt_r.districtid=d.id
        LEFT JOIN frt_room frt ON frt_r.rentid = frt.roomid
        LEFT JOIN p_project_mas p ON frt_r.projectid=p.project_id `;
  console.log("data", data);
  console.log("sqll", sqlqueryb);

  if (data.hasOwnProperty("rent_type") && data.rent_type)
    where.push(" frt_r.renttype= " + data.rent_type);
  if (data.hasOwnProperty("project_id") && data.project_id)
    where.push(" frt_r.projectid= " + data.project_id);
  if (data.hasOwnProperty("state_id") && data.circle_name)
    where.push(" frt_r.stateid= " + data.circle_name);
  if (data.hasOwnProperty("cluster") && data.cluster)
    where.push(" frt_r.districtid= " + data.cluster);
  if (data.hasOwnProperty("paid_date") && data.paid_date)
    where.push(' paymonthdate= "' + data.paid_date + '"');

  // if (data.hasOwnProperty('start_date') && data.start_date && !data.end_date) {
  //     where.push(' DATE_FORMAT(frt.start_date,"%Y-%m-%d") >= "' + data.start_date + '" ');
  //   }
  //   if (data.hasOwnProperty('end_date') && data.end_date && !data.start_date) {
  //     where.push(' DATE_FORMAT(frt.end_date,"%Y-%m-%d") <= "' + data.end_date + '" ');
  //   }

  if (data.hasOwnProperty("paymode") && data.pay_type == 1) {
    // Suspend
    where.push(" paymode ='" + 1 + "'");
  }
  if (data.hasOwnProperty("paymode") && data.pay_type == 2) {
    // Suspend
    where.push(" paymode  ='" + 2 + "'");
  }
  if (data.hasOwnProperty("paymode") && data.pay_type == 3) {
    // Suspend
    where.push(" paymode  ='" + 3 + "'");
  }
  if (where.length > 0) {
    sqlqueryb += " where" + where.join(" AND ");
    sqlqueryc += " where " + where.join(" AND ");
  }
  if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
    sqlqueryb +=
      " ORDER BY frt_r.rentid DESC LIMIT " + data.index + ", " + data.limit;
  }
  console.log("Get Count Query :", sqlqueryb);
  pool.getConnection((err, conn) => {
    if (err) {
      console.log("List  Failed....");
      res.send(JSON.stringify("failed"));
    } else {
      sql = conn.query(sqlqueryb, function (err, result) {
        value.push(result);
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log("Listrentamount Connection Closed.");
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
          console.log("Listrentamount Connection Closed.");
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

frt_room.post("/getrentamount", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbuss = ` SELECT frt_r.rentid,frt_r.roomid,frt_r.rentamt,DATE_FORMAT(frt_r.paymonthdate,'%Y-%m-%d') paymonthdate,frt_r.paymode
    ,frt_r.utr,frt_r.rentnote,frt_r.projectid,frt_r.stateid,frt_r.districtid,frt_r.renttype,frt_r.brokerage_amt,frt_r.recovery_amt,frt_r.cheque_no,frt_r.paid_name
    FROM frt_room_rent frt_r WHERE rentid=${data.rentid} `;
    console.log("Query---", sqlbuss);
    let sqlg = conn.query(sqlbuss, data.id, (err, result) => {
      conn.release();
      console.log("GetRentAmount Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

//DATE_FORMAT(frt_r.paymonthdate,'%Y-%m-%d') paymonthdate
async function updaterentamount(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,
      errorvalue = [],
      conn = await poolPromise.getConnection(),
      rentflag = false;
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("Update Data", data);
        if (data.pay_type == 1) {
          let olddetails = ` SELECT EXISTS ( Select rentid,utr from veremaxpo.frt_room_rent where  utr='${data.utrno}' and rentid!=${data.rentid} ) count `;
          console.log("olddetails", olddetails);
          let resp = await conn.query(olddetails);
          console.log("result", resp);
          if (resp[0][0].count == 0) {
            rentflag = true;
          } else {
            errorvalue.push({ msg: "UTR Already Exists", err_code: 566 });
            await conn.rollback();
          }
        } else {
          rentflag = true;
        }
        if (rentflag) {
          let sqlupdate = ` update veremaxpo.frt_room_rent set roomid=${data.room_id},rentamt='${data.paid_amount}'
                    ,projectid=${data.project_id},stateid=${data.circle_name},districtid=${data.cluster},paymonthdate='${data.paid_date}'
                    ,paid_name='${data.paid_to_name}',paymode=${data.pay_type},utr='${data.utrno}',rentnote='${data.remarks}',renttype=${data.rent_type}
                    ,recovery_amt='${data.recovery_amt}',brokerage_amt='${data.brokerage_amt}',cheque_no=${data.cheque_no} `;

          sqlupdate += ` where rentid = ${data.rentid}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='RENTAMOUNT INFO  UPDATED rentid:${
              data.rentid
            }',\`longtext\`='DONE BY',cby=${
              jwt_data.user_id
            },data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0)
              errorvalue.push({
                msg: "RentAmount Updated Successfully",
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
        console.log("Catch Error", err);
        errorvalue.push({ msg: "Please Enter Required Fields", err_code: 625 });
        await conn.rollback();
      }
    } else {
      //Log the Connection Error entered into the else part
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("Updaterentamount Connection Closed.", errorvalue);
    return resolve(errorvalue);
  });
}

frt_room.post(
  "/updaterentamount",
  /*schema.frtroom, schema.validate,*/ async (req, res) => {
    req.setTimeout(864000000);
    console.log("Update Frt Room Rent----", req.body);
    const validation = joiValidate.editfrtroomrentDataSchema.validate(req.body);
    if (validation.error) {
      console.log(validation.error.details);
      // return res.status(422).json({ msg: validation.error.details, err_code: '422' });
      return res.json([
        { msg: validation.error.details[0].message, err_code: "422" },
      ]);
    }
    let result = await updaterentamount(req);
    res.end(JSON.stringify(result));
  }
);

async function bulkfrtrentroom(req) {
  return new Promise(async (resolve, reject) => {
    var data = req.body,
      errorarray = [];
    let conn = await poolPromise.getConnection();
    const jwt_data = req.jwt_data;
    if (conn) {
      console.log("Add file", data.bulk.length);
      for (var i = 0; i < data.bulk.length; i++) {
        await conn.beginTransaction();
        try {
          let fr = data.bulk[i],
            frtrentid = {};
          console.log("Frt Rent Room Data", fr);
          let projectid = "",
            distid = "",
            stateid = `SELECT id from states WHERE name='${fr.circle_name}'`;
          stateid = await conn.query(stateid);
          if (stateid[0].length == 1) {
            stateid = stateid[0][0].id;
            console.log("State", stateid);
            distid = `SELECT id from districts WHERE name='${fr.cluster}' AND state_id=${stateid}`;
            distid = await conn.query(distid);
            if (distid[0].length == 1) {
              distid = distid[0][0].id;
              console.log("District", distid);
              if (fr.project_id) {
                projectid = `SELECT project_id  from p_project_mas WHERE project_title='${fr.project_id}'`;
                projectid = await conn.query(projectid);
                // console.log(projectid[0]);
                if (projectid[0].length == 0) {
                  errorarray.push({
                    msg: "Project Title Not Found.",
                    error_msg: 740,
                  });
                  await conn.rollback();
                  continue;
                }
              } else {
                console.log("Project Title");
              }
              frtrentid["room_id"] = fr.room_id;
              frtrentid["rent_type"] = fr.rent_type;
              frtrentid["project_id"] = projectid[0][0]["project_id"];
              frtrentid["circle_name"] = stateid;
              frtrentid["cluster"] = distid;
              frtrentid["pay_type"] = fr.pay_type;
              frtrentid["paid_amount"] = fr.paid_amount;
              frtrentid["paid_date"] = fr.paid_date;
              frtrentid["utrno"] = fr.utrno;
              frtrentid["remarks"] = fr.remarks;
              frtrentid["recovery_amt"] = fr.recovery_amt;
              frtrentid["brokerage_amt"] = fr.brokerage_amt;
              frtrentid["cheque_no"] = fr.cheque_no;
              frtrentid["paid_to_name"] = fr.paid_to_name;
              frtrentid["jwt_data"] = jwt_data;
              // frtrentid["pay_type"] = fr["Payment Mode"]== "To Account" ? 1 : fr["Payment Mode"]== "By Hand Cash" ? 2 :fr["Payment Mode"]== "Cheque" ? 3 : 4;
              // frtrentid['aadharimg'] = fr.aadharimg;
              // frtrentid['bank_name'] = fr.bank_name;
              // frtrentid['acnt_name'] = fr.acnt_name;
              // frtrentid['acnt_no'] = fr.acnt_no;
              // frtrentid['ifsc_no'] = fr.ifsc_no;
              // frtrentid['bank_branch'] = fr.bank_branch;
              // frtrentid['agreementcopy'] = fr.agreementcopy;
              // frtrentid['bank_branch'] = fr.bank_branch;
              // frtrentid['mailcopy'] = fr.mailcopy;
              console.log("bulkfrtrentroom", frtrentid);
              let res = await addrentamount(frtrentid);
              console.log("res", res);
              errorarray.push(res[0]);
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
      console.log("BulkFrtRentRoom Connection Closed.");
    } else {
      return resolve({ msg: "Please Try After Sometimes", error_msg: "CONN" });
    }
    return resolve(errorarray);
  });
}

frt_room.post(
  "/bulkfrtrentroom",
  /*schema.vehicleschema, schema.validate,*/ async (req, res) => {
    console.log(req.body);
    req.setTimeout(864000000);
    // console.log('dhcbg---------', req.body);
    let result = await bulkfrtrentroom(req);
    console.log(result);
    res.end(JSON.stringify(result));
  }
);

frt_room.post("/listfrtroomcategory", (req, res) => {
  var data = req.body,
    where = [],
    value = [],
    sql,
    sqlquery = ` SELECT frtc.id,frtc.room_category  FROM frt_room_category frtc 
    LEFT JOIN frt_room frtr ON frtc.id = frtr.room_category `,
    sqlqueryc = ` SELECT count(*) AS total  FROM frt_room_category frtc 
    LEFT JOIN frt_room frtr ON frtc.id = frtr.room_category `;
  console.log("data", data);
  console.log("sql", sqlquery);
  if (where.length > 0) {
    sqlquery += " where " + where.join(" AND ");
    sqlqueryc += " where " + where.join(" AND ");
  }
  if (data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
    sqlbus += " ORDER BY frtc.id  DESC LIMIT " + data.index + ", " + data.limit;
  }
  console.log("Get Count Query :", sqlquery);
  pool.getConnection((err, conn) => {
    if (err) {
      console.log("List Failed...");
      res.send(JSON.stringify("Failed"));
    } else {
      sql = conn.query(sqlquery, function (err, result) {
        value.push(result);
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log("Listfrtroomcategory Connection Closed.");
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
          console.log("Listfrtroomcategory Connection Closed.");
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

//Frt_room Upload
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    console.log("request file--", file);
    let namefile = file.originalname.split("-")[0],
      folder_status = false;
    console.log("file name ", file.originalname);
    const fs = require("fs");
    const filename = namefile;
    const imagePath = `${__dirname}/../Documents/FrtRoom/${filename}`;
    fs.exists(imagePath, (exists) => {
      if (exists) {
        folder_status = true;
        console.log("Directory Already created.");
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
    let edate = nowdate
      .toISOString()
      .replace(/T/, "-")
      .replace(/\..+/, "")
      .slice(0, 16);
    console.log("edateeee", edate);
    // let uid = file.originalname.split('-')[0],filetype=file.originalname.split('-')[1]

    // console.log('uid : ',uid,'\n\r file type :',filetype);
    // let idtype =filetype=='CAF'?3:filetype=='IDproof'?2:filetype=='AddressProof'?1:10
    // callback(null, file_name + '-' + nowdate.toISOString().slice(0, 10) + '.' + file.mimetype.split('/')[1])
    // callback(null, filename + '-' + 'CAF'+'-'+nowdate.toISOString().slice(0, 10) + '.' + 'png')
    // callback(null,  + '-' + 'ID'+'-'+nowdate.toISOString().slice(0, 10) + '.' + 'png')
    callback(
      null,
      file.originalname.split("-")[1] +
        "-" +
        nowdate.toISOString().slice(0, 10) +
        "." +
        "png"
    );
  },
});

const upload = multer({ storage: storage }).array("file", 4);

frt_room.post("/uploadfrtroom", function (req, res) {
  var errorarray = [],
    data,
    sqlquery,
    file;
  upload(req, res, function (err) {
    // console.log('file',file);
    if (err) {
      console.log("Error uploading file.", err);
      errorarray.push({ msg: "Upload Failed", error_msg: "FAIL" });
      res.end(JSON.stringify(errorarray));
    } else {
      (data = req.body), (file = req.files);
      const { rent_id } = req.body;
      console.log("Request.", req.body, file);
      console.log("Request Files .", file.length);
      const proof = [
        {
          id: 1,
          name: "Aadhar",
        },
        {
          id: 2,
          name: "Agreement",
        },
        {
          id: 3,
          name: "Mail",
        },
      ];
      let insertvalue = [];
      file.map((file) => {
        const doc_type =
          proof.find(
            (value) =>
              value.name == file.originalname.split("-")[1].split("@")[1]
          )?.id || 0;
        insertvalue.push([
          "(" + rent_id,
          "'" + file.filename + "'",
          doc_type + ")",
        ]);
        return insertvalue;
      });
      console.log("Insertvalue", insertvalue);
      sqlquery = ` insert into veremaxpo.frt_room_doc (frtroomid,doc_name,doc_type) VALUES ${insertvalue} `;
      console.log("Update Logo Query.", sqlquery);
      pool.getConnection(function (err, conn) {
        if (err) {
          console.log("Failed");
        } else {
          var sql = conn.query(sqlquery, function (err, result) {
            conn.release();
            if (!err) {
              if (result.affectedRows > 0) {
                errorarray.push({
                  msg: "Files Added Succesfully",
                  error_msg: 0,
                });
                console.log("File is uploaded.");
                res.end(JSON.stringify(errorarray));
              } else {
                console.log("File Not uploaded.", err);
                errorarray.push({ msg: "Upload Failed", error_msg: "FAIL" });
                res.end(JSON.stringify(errorarray));
              }
            } else {
              console.log("File Not uploaded.", err);
              errorarray.push({ msg: "Upload Failed", error_msg: "FAIL" });
              res.end(JSON.stringify(errorarray));
            }
          });
        }
      });
    }
  });
});

frt_room.post("/listfrtreport", (req, res) => {
  let data = req.body,
    where = [],
    value = [];
  let sqlbus = `SELECT frt.roomid,frt.owner_name,frt.owner_address,p.project_title,s.name AS state_name,d.name district,DATE_FORMAT(frt.adv_paid_date,'%Y-%m-%d') adv_paid_date,
  frt.rent_address,frt.advance_amt,frt.holding_status,frt.owner_mail,frt.owner_mobile,frt.owner_aadhar,frt.owner_bank,frt.accholdname,
  frt.accno,frt.accifsc,frt.accbranch,frt.ownerpan,frt.rent_amt,DATE_FORMAT(frt.start_date,'%Y-%m-%d') start_date,DATE_FORMAT(frt.end_date,'%Y-%m-%d') end_date,
  frt.paymode,frt.approvalname,frt.stateid,frt.districtid,frt.project_id,frt.sub_location,frt.room_category,frt_c.id,frt_c.room_category room_category_name,
  DATE_FORMAT(frt.asdate, '%Y-%m-%d') agr_start_date,DATE_FORMAT(frt.aedate, '%Y-%m-%d') agr_end_date,frt_r.rentid,frt_r.roomid,frt_r.rentamt,
  DATE_FORMAT(frt_r.paymonthdate,'%Y-%m-%d') paymonthdate,frt_r.paymode,frt_r.utr,frt_r.rentnote,frt_r.paid_name,p.project_title,s.name statename,
  d.name districtname,frt_r.renttype,frt_r.brokerage_amt,frt_r.recovery_amt,frt_r.cheque_no,
  IF(frt.aedate>CURDATE(),"Active","Expired") agr_status
  FROM frt_room frt
  INNER JOIN states s ON frt.stateid=s.id
  INNER JOIN districts d ON frt.districtid=d.id
  LEFT JOIN frt_room_rent frt_r ON frt.roomid = frt_r.roomid 
  LEFT JOIN p_project_mas p ON frt.project_id=p.project_id
  LEFT JOIN frt_room_category frt_c ON frt.room_category = frt_c.id`,
    sqlqueryc = ` SELECT Count(*) AS total from frt_room frt
  INNER JOIN states s ON frt.stateid=s.id
  INNER JOIN districts d ON frt.districtid=d.id
  LEFT JOIN frt_room_rent frt_r ON frt.roomid = frt_r.roomid
  LEFT JOIN p_project_mas p ON frt.project_id=p.project_id
  LEFT JOIN frt_room_category frt_c ON frt.room_category = frt_c.id`;
  console.log("data", data);
  console.log("Get Count Query:", sqlbus);

  if (data.hasOwnProperty("room_id") && data.room_id)
    where.push(" frt.roomid= " + data.room_id);
  if (data.hasOwnProperty("project_id") && data.project_id)
    where.push(" frt.project_id= " + data.project_id);
  if (data.hasOwnProperty("state_id") && data.state_id)
    where.push("frt.stateid= " + data.state_id);
  if (data.hasOwnProperty("cluster") && data.cluster)
    where.push("frt.districtid= " + data.cluster);

  if (where.length > 0) {
    sqlbus += " where " + where.join(" AND ");
    sqlqueryc += " where " + where.join(" AND ");
  }
  // if(data.hasOwnProperty("index") && data.hasOwnProperty("limit")) {
  //   sqlbus += " ORDER BY frt.roomid DESC LIMIT " + data.index + ", " + data.limit;
  // }
  sqlbus += " GROUP BY frt.roomid,frt_r.rentid ";
  if (data.index != null && data.limit != null) {
    sqlbus += " LIMIT " + data.index + "," + data.limit;
  }
  console.log("Get Count Query: ", sqlbus);
  pool.getConnection((err, conn) => {
    if (err) {
      console.log("List Failed...");
      res.send(JSON.stringify("Failed"));
    } else {
      sql = conn.query(sqlbus, function (err, result) {
        value.push(result);
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log("Listfrtreport Connection Closed.");
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
          console.log("Listfrtreport Connection Closed.");
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

module.exports = frt_room;

// file.forEach(x => {
//     // let proofObj = proof.find(value => value.name == x.originalname.split('-')[1]);
//     let proofValue = proofObj.rent_id;
//     console.log('proooo', proofValue);
//     let doc_type = proofValue == 1 ? data.aadhar_doc : proofValue == 2 ? data.agreement_doc : 0;
//     insertvalue.push(['(' + data.rent_id, "'" + x.filename + "'", proofValue, doc_type, 1 + ')'])
//     console.log('daaaatta', insertvalue);
// })
// console.log('insertvalue Array', insertvalue);
