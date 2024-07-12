const express = require("express"),
  compression = require("compression"),
  employeeclaim = express.Router(),
  schema = require("../schema/schema"),
  pool = require("../connection/connection"),
  poolPromise = require("../connection/connection").poolpromise;
const { response } = require("express");
const { validationResult } = require("express-validator/");
const multer = require('multer');
var fs = require('fs');

async function addemployeeclaim(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,status = data.status == 1 ? 0 : 1,cdate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),errorvalue = [];
    var userSetting;
    var resultData = {};
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("data", data);
        let sqlquery = "SELECT SUM(round(ifnull(balance,0), 2)) as countcount FROM employee as tum WHERE emp_id_pk =" + data.employee_id;
        let dataCount = await conn.query(sqlquery);
        resultData["countcount"] = dataCount[0][0].countcount;
        let countCount = dataCount[0][0].countcount;
        if (countCount != 0) {
          console.log("employee claim exists");
          await conn.rollback();
        }
        if (data.claim_type_id == 1 || data.claim_type_id == 2) {
          var balance = Number(countCount) + Number(data.payment_amount);
        } else {
          var balance = Number(countCount) - Number(data.claim_amount);
        }
        var balifields = [balance, data.employee_id];
        let empqry = "UPDATE employee SET `balance`=?, mtime=NOW() WHERE emp_id_pk =?";
        let resultemp = await conn.query(empqry, balifields);
        if (resultemp[0]["affectedRows"] > 0) {        
          console.log("employee claim added successfully");
        } else {
          errorvalue.push({ msg: "Update Failed", error_code: "FAIL" });
          await conn.rollback();
          console.log("failed to update employee claim status");
        }        
        if (data.claim_type_id == 1 || data.claim_type_id == 2) {
          var balance = (Number(countCount) || 0) + (Number(data.payment_amount) || 0);
        } else {
          var balance = (Number(countCount) || 0) - (Number(data.claim_amount) || 0);
        }
        // if(data.payment_date!=null){
        // let paymentdate = new Date(data.payment_date)
        // paymentdate.setTime(Math.floor((paymentdate.getTime()) ));
        // let paydate = ((paymentdate).toISOString().replace(/T/, ' ').replace(/\..+/, '')).slice(0, 16);
        // console.log(paydate,"paydate");
        // }
        var adddata = {
          claim_type_id_fk: data.claim_type_id,
          payment_type_id: data.payment_type,
          circle_id: data.circle_name,
          cluster_id: data.cluster,
          user_id_fk: data.employee_id,
          other_claimname: data.other_claimname,
          payment_date: data.payment_date,
          payment_cost: data.payment_amount == null ? 0 : data.payment_amount,
          claim_cost: data.claim_amount == null ? 0 : data.claim_amount,
          utr_no: data.utr_no,
          approved_by: data.approved_by,
          payment_entry_date: data.payment_entry_date,
          payment_entry_by: data.payment_entry_by,
          claim_rcv_date: data.claim_rcv_date,
          claim_entry_date: data.claim_entry_date,
          bill_period_from: data.bill_period_from,
          bill_period_to: data.bill_period_to,
          claim_entry_by: data.claim_entry_by,
          remarks: data.remarks,
          claim_filename: data.filename,
          mail_filename: data.mailfilename,
          claimxcl_filename: data.exlfilename,
          verify_cost: data.verify_amount,
          client_id_fk: data.project,
          category_id: data.service_catg,
          balance: balance,
          status: status,
          ctime: cdate,
          // "created_by": data.login_user_id
        };
        let sqlqueryw = "INSERT INTO employee_claim SET ?";
        console.log(sqlqueryw, "sqlqueryw");
        let result = await conn.query(sqlqueryw, adddata);
        if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
          userSetting = result[0]["insertId"];
          console.log(userSetting, "userSetting");
          errorvalue.push({ msg: "Employeeclaim Added Successfully", err_code: 0 });
          await conn.commit();
        } else {
          errorvalue.push({ msg: "Please Try After Sometimes", err_code: 56 });
          await conn.rollback();
        }
      } catch (err) {
        console.log("catch error", err);
      }
    } else {
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

employeeclaim.post("/addemployeeclaim",
/*schema.employeeclaimschema, schema.validate*/ async (req, res) => {
    console.log(req.body);
    req.setTimeout(864000000);
    // console.log('dhcbg---------', req.body);
    let result = await addemployeeclaim(req);
    console.log(result);
    res.end(JSON.stringify(result));
  }
);

employeeclaim.post("/getallempclm", (req, res) => {
  let data = req.body, sql;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbus ='select tum.emp_id_pk,tum.emp_id,tum.first_name from employee as tum where status=1 and state_id_fk="' + data.employee_name_id + '" "order by tum.firstname"';
    console.log("Query---", sqlbus);
    let sql = conn.query(sqlbus, (err, result) => {
      conn.release();
      console.log('getallempclm connection closed.');
      if (err) {
        console.log(err);
      } else {
        // console.log(result)
        res.send(JSON.stringify(result));
      }
    });
  });
});

employeeclaim.post("/getallclmtype", (req, res) => {
  let data = req.body, sql;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbus = "SELECT * FROM claim_type WHERE pay_type_id = " + data.payment_type;
    console.log("Query---", sqlbus);
    let sql = conn.query(sqlbus, (err, result) => {
      conn.release();
      console.log('getallclmtype connection closed.');
      if (err) {
        console.log(err);
      } else {
        // console.log(result);
        res.send(JSON.stringify(result));
      }
    });
  });
});

employeeclaim.post('/listempclm', function (req, res) {
  var data = req.body, where = [], value = [], condFor = "", sql,
    sqlqueryb = `SELECT tcm.ecid,tcm.payment_type_id,tcm.claim_type_id,tcm.circle_id,tcm.cluster_id,tcm.user_id,tcm.client_id,tcm.category_id,tcm.other_claimname,tcm.payment_date,tcm.payment_entry_date,tcm.payment_entry_by, 
       tcm.claim_rcv_date,tcm.claim_entry_date,tcm.claim_entry_by,tcm.bill_period_from,tcm.bill_period_to,tcm.payment_cost,tcm.claim_cost,tcm.balance,tcm.utr_no,tcm.approved_by,tcm.remarks,tmas.client_name, 
       tcm.verify_cost,tcm.claim_filename,tcm.mail_filename,tcm.claimxcl_filename,tcm.claim_status,tcm.ctime,tcm.mtime,tcm.created_by,tcm.updated_by,tum.emp_id,tct.claim_name,tum.first_name,tsca.service_category_name,tsm.name,tmas.client_short_form,tmp.mept_name 
       ,IF(tcm.claim_type_id=2,CONCAT('-',tcm.payment_cost),IF(tcm.claim_type_id=10<3,CONCAT('+',tcm.claim_cost),'')) claim_cost1, 
       IF(tcm.claim_type_id=2,DATE_FORMAT(tcm.payment_date,'%d-%m-%Y'),IF(tcm.claim_type_id=10<3,DATE_FORMAT(tcm.bill_period_from,'%d-%m-%Y'),'' ))pay_expense_month, 
       IF(tcm.claim_type_id=2,DATE_FORMAT(tcm.payment_entry_date,'%d-%m-%Y'),IF(tcm.claim_type_id=10<3,DATE_FORMAT(tcm.claim_entry_date,'%d-%m-%Y'),'' ))Date 
       FROM employee_claim tcm
       INNER JOIN employee AS tum ON tum.emp_id_pk= tcm.user_id 
       LEFT JOIN claim_type AS tct ON tct.claim_id= tcm.claim_type_id 
       LEFT JOIN service_category AS tsca ON tsca.servicecat_id= tcm.category_id 
       LEFT JOIN states AS tsm ON tsm.id= tcm.circle_id 
       LEFT JOIN client AS tmas ON tmas.client_id= tcm.client_id 
       LEFT JOIN maintenace_point AS tmp ON tmp.maintenace_point_id= tcm.cluster_id 
       LEFT JOIN client AS tclm ON tclm.client_id= tcm.client_id `,
    sqlqueryc = `SELECT COUNT(*) AS total FROM employee_claim AS tcm 
    INNER JOIN employee AS tum ON tum.emp_id_pk= tcm.user_id 
    LEFT JOIN claim_type AS tct ON tct.claim_id= tcm.claim_type_id 
    LEFT JOIN service_category AS tsca ON tsca.servicecat_id= tcm.category_id 
    LEFT JOIN states AS tsm ON tsm.id= tcm.circle_id 
    LEFT JOIN client AS tmas ON tmas.client_id= tcm.client_id 
    LEFT JOIN maintenace_point AS tmp ON tmp.maintenace_point_id= tcm.cluster_id 
    LEFT JOIN client AS tclm ON tclm.client_id= tcm.client_id `;

  if (data.hasOwnProperty('like') && data.like) {
    where.push(' tum.first_name LIKE "%' + data.like + '%"');
    console.log(data.like, "like");
  }
  if (data.hasOwnProperty('out_datefrm') && data.out_datefrm && !data.out_dateto) {
    where.push(' DATE_FORMAT(tcm.ctime,"%Y-%m-%d") >= "' + data.out_datefrm + '" ');
  }
  if (data.hasOwnProperty('out_dateto') && data.out_dateto && !data.out_datefrm) {
    where.push(' DATE_FORMAT(tcm.ctime,"%Y-%m-%d") <= "' + data.out_dateto + '" ');
  }
  if (data.hasOwnProperty('out_datefrm') && data.out_datefrm != '' && data.hasOwnProperty('out_dateto') && data.out_dateto != '') {
    where.push(' DATE_FORMAT(tcm.ctime,"%Y-%m-%d") >= "' + data.out_datefrm + '" AND  DATE_FORMAT(tcm.ctime,"%Y-%m-%d %hh:%mm:%ss")<= "' + data.out_dateto + " 23:59:59 " + '" ');
  }
  if (data.circle_name != null && data.circle_name != "" && data.circle_name != undefined) {
    where.push(" tsm.state_mas_id  ='" + data.circle_name + "'");
  }
  if (data.cluster != null && data.cluster != "" && data.cluster != undefined) {
    where.push(" tmp.maintenace_point_id ='" + data.cluster + "'");
  }
  if (data.hasOwnProperty('project') && data.project) {  //Invoice Id
    where.push(' tcm.client_id = ' + data.project);
  }
  if (data.hasOwnProperty('client_short_form') && data.client_short_form) {  //Invoice Id
    where.push(' tmas.client_short_form  LIKE "%' + data.client_short_form + '%"');
  }
  if (where.length > 0) {
    sqlqueryb += " where" + where.join(' AND ')
    sqlqueryc += " where " + where.join(' AND ')
  }
  if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
    sqlqueryb += ' ORDER BY tcm.ctime DESC LIMIT ' + data.index + ', ' + data.limit;
  }
  console.log('Get Count Query :', sqlqueryb);
  pool.getConnection((err, conn) => {
    if (err) {
      console.log('List employeeclaim Failed....');
      res.send(JSON.stringify('failed'));
    } else {
      sql = conn.query(sqlqueryb, function (err, result) {
        value.push(result)
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log('listempclm connection Closed.');
            if (!err) {
              value.push(result[0]);
              // console.log("List Deposit Result", value)
              res.send(JSON.stringify(value));
            } else {
              console.log('Query Failed');
              res.send(JSON.stringify(result));
            }
          })
        } else {
          console.log('error', err);
          conn.release();
          console.log('listempclm connection Closed.');
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

employeeclaim.post("/getempclm", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, conn) => {
    let sqlbuss =  `SELECT tcm.claim_type_id,tcm.payment_type_id,tcm.client_id,tcm.circle_id,tcm.cluster_id,tcm.user_id,tcm.client_id, 
    tcm.category_id,tcm.other_claimname,tcm.payment_date,tcm.payment_entry_date,tcm.payment_entry_by,tcm.claim_rcv_date,tcm.claim_entry_date,tcm.claim_entry_by,tcm.bill_period_from, 
    tcm.bill_period_to,tcm.payment_cost,tcm.claim_cost,tcm.balance,tcm.utr_no,tcm.approved_by,tcm.remarks,tcm.verify_cost,tcm.claim_filename,tcm.mail_filename, 
    tcm.claimxcl_filename,tcm.claim_status,tcm.ctime,tcm.mtime,tcm.created_by,tcm.updated_by FROM employee_claim AS tcm 
    LEFT JOIN employee AS tum ON tum.emp_id_pk= tcm.user_id 
    LEFT JOIN claim_type AS tct ON tct.claim_id= tcm.claim_type_id 
    LEFT JOIN maintenace_point AS tmp ON tmp.maintenace_point_id= tcm.cluster_id 
    LEFT JOIN states AS tsm ON tsm.id= tcm.circle_id WHERE tcm.claim_type_id=${data.id} `;

    console.log("Query---", sqlbuss);
    let sqlg = conn.query(sqlbuss, data.id, (err, result) => {
      conn.release();
      console.log('Getempclm Connection Closed.');
      if (err) {
        console.log(err);
      } else {
        // console.log(result)
        res.send(JSON.stringify(result));
      }
    });
  });
});

employeeclaim.post('/editempclm', function (req, res, err) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array()
    });
  }
  // console.log("succed")
  pool.getConnection( (err, conn) => {
    if (err) {
      errorhandler('Failed To Upload')
      console.log("Failed");
    } else {
      var data = req.body,
        sql;
      var updateField = [
        data.claim_type_id,
        data.payment_type,
        data.circle_name,
        data.cluster,
        data.employee_id,
        data.other_claimname,
        data.payment_date,
        data.payment_amount == null ? 0 : data.payment_amount,
        data.claim_amount == null ? 0 : data.claim_amount,
        data.utr_no,
        data.payment_entry_date,
        data.payment_entry_by,
        data.claim_rcv_date,
        data.claim_entry_date,
        data.bill_period_from,
        data.bill_period_to,
        data.claim_entry_by,
        data.remarks,
        data.verify_amount,
        data.project,
        data.service_catg,
        data.id,
      ];
      console.log(data)
      var update = "UPDATE employee_claim SET `claim_type_id_fk`=?,`payment_type_id`=? ,`circle_id`=? ,`cluster_id`=?,`user_id_fk`=?,`other_claimname`=?,`payment_date`=?,`payment_cost`=?,`claim_cost`=?,`utr_no`=?,`payment_entry_date`=?,`payment_entry_by`=?,`claim_rcv_date`=?,`claim_entry_date`=?,`bill_period_from`=?,`bill_period_to`=?,`claim_entry_by`=?,`remarks`=?,`verify_cost`=?,`client_id_fk`=?,`category_id`=?,mtime=NOW() WHERE employee_claim_id_pk =? ";
      sql = conn.query(update, updateField, function (err) {
        console.log(sql.sql);
        if (!err) {
          errorhandler("SuccessFully Updatee", 1);
        } else {
          errorhandler("Failed To Update");
        }
      });
      function errorhandler(msg, status = 0) {
        // log.activeLogs("Edit Customer",data,data.username +" "+ msg+" done by " +data.username_per,err,req.ip);
        conn.release();
        console.log('editempclm connection Closed.');
        // console.log(sql.sql)
        res.send(JSON.stringify({
          msg: msg,
          status: status
        }));
      }
    }
  });
});

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    // console.log(file.originalname)
    let namefile = file.originalname.split('-')[0], folder_status = false;
    const fs = require("fs")
    // const filename = namefile
    const imagePath = `${__dirname}/../Documents/empclaim/${namefile}`;
    fs.exists(imagePath, exists => {
      if (exists) {
        folder_status = true
        console.log(" Directory Already created.")
      } else {
        folder_status = true
        fs.mkdir(imagePath, { recursive: true }, function (err) {
          if (err) {
            console.log(err)
          } else { console.log("New directory successfully created.") }
        })
      }
      if (folder_status) { callback(null, imagePath); }
    });
  },
  filename: function (req, file, callback) {
    console.log('mime', req.body.file_type);
    let file_type = req.body.file_type;
    console.log("Filename", file.originalname)
    let nowdate = new Date();
    // let edate = ((nowdate).toISOString().replace(/T/, '-').replace(/\..+/, '')).slice(0, 16);
    let file_name = file.originalname.split('-')[1]
    if (file_type == 1) {
      console.log(file_type, "00000");
      callback(null, file_name + '-' + nowdate.toISOString().slice(0, 10) + '.' + 'xlsx')
    } else {
      let type = file.mimetype == 'application/pdf' ? 'pdf' : 'png';
      callback(null, file_name + '-' + nowdate.toISOString().slice(0, 10) + '.' + type)
    }
  }
})

const upload = multer({ storage: storage }).single('file')

employeeclaim.post('/uploadclaim', function (req, res) {
  var errorarray = [], data, sqlquery, file, img_path;
  upload(req, res, function (err) {
    if (err) {
      console.log("Error uploading file.", err)
      errorarray.push({ msg: "Upload Failed", error_code: 'FAIL' });
      res.end(JSON.stringify(errorarray));
    } else {
      data = req.body, file = req.file;
      console.log(file, "--------------------------");
      console.log(data, "=====");
      img_path = `${data.id}/${file.filename}`;
      console.log(img_path, "------------");
      sqlquery = " UPDATE veremaxpo.employee_claim SET "
      if (data.type == 1) {  //list
        sqlquery += " claim_filename='" + img_path + "' "
      } else {
        sqlquery += " mail_filename='" + img_path + "' "
      }
      sqlquery += " WHERE employee_claim_id_pk =" + data.id;
      console.log("Update  Query.", sqlquery)
      pool.getConnection(function (err, conn) {
        if (err) {
          console.log("Failed")
        } else {
          var sql = conn.query(sqlquery, function (err, result) {
            if (!err) {
              conn.release();
              console.log('uploadclaim connection closed.');
              if (result.affectedRows > 0) {
                errorarray.push({ status: 1, msg: 'Upload Succesfully', error_msg: 0 });
                console.log("File is uploaded.")
                res.end(JSON.stringify(errorarray));
              }
            } else {
              console.log("File Not uploaded.", err)
              errorarray.push({ msg: "Please try after sometimes", error_msg: 'FAIL' });
              conn.release();
              console.log('uploadclaim connection closed.');
              res.end(JSON.stringify(errorarray));
            }
          });

        }
      });

    }
  });
});

async function getclaim(data) {
  return new Promise(async (resolve, reject) => {
    console.log(data.id, "@@@@@@@@@@@@@@@@@@@@@");
    var sqlquery, imageName, img_result;
    img_result = { claim_copy: '' };
    console.log(img_result, "++++++");
    let conn = await poolPromise.getConnection();
    if (conn) {
      console.log('Data===', data);
      await conn.beginTransaction();
      try {
        sqlquery = ' SELECT employee_claim_id_pk,claim_filename,mail_filename FROM veremaxpo.employee_claim WHERE employee_claim_id_pk =' + data.id
        console.log("Get claim proof Qwery", sqlquery);
        let result = await conn.query(sqlquery)
        console.log(result, "resuly");
        if (result[0][0].claim_filename) {
          imageName = [{
            key: 'claim_copy',
            fileName: `${result[0][0].claim_filename}`
          }];
          const element = imageName[0]
          img_result[element.key] = await getImage(element.fileName)
        } else {
          // return resolve({ error: true, msg: 'Image Not Upload' })
          console.log('Image Not Upload')
        }
        if (data.type == 1) {
          if (result[0][0].mail_filename) {
            imageName = [{
              key: 'mail_copy',
              fileName: `${result[0][0].mail_filename}`
            }];
            const element = imageName[0]
            img_result[element.key] = await getImage(element.fileName)
          }
        } else {
          // return resolve({ error: true, msg: 'Image Not Upload' })
          console.log('Image Not Upload');
        }
      } catch (e) {
        console.log('Inside Catch', e);
        // return resolve({ error: true, msg: e.toString() })
      }
      if (img_result) {
        return resolve(img_result)
      } else {
        return resolve({ error: true, msg: 'Image Not Found' })
      }
    } else {
      conn.release();
      console.log("getclaim Connection Failed");
      return resolve(img_result)         //return resolve(img_result) changed in this else part
    }
  });
}

employeeclaim.get('/getclaim', async (req, res) => {
  req.setTimeout(864000000);
  const url = require('url');
  const url_parts = url.parse(req.url, true);
  const query = url_parts.query;
  console.log('Get proof', query);
  let resp = await getclaim(query);
  if (resp.error) {
    return res.end(JSON.stringify(resp));
  }
  res.end(JSON.stringify(resp));
});

const getImage = async (namefile) => {
  if (namefile) {
    const fs = require('fs');
    return new Promise((resolve, reject) => {
      const imagePath = `${__dirname}/../Documents/empclaim/${namefile}`;
      console.log('Get ImagePath', imagePath);
      fs.exists(imagePath, exists => {
        if (exists) {
          return resolve(fs.readFileSync(imagePath).toString("base64"))
        } else {
          return reject('Error: Image does not exists');
        }
      });
    });
  }
};

module.exports = employeeclaim;