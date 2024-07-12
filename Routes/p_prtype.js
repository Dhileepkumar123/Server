'use strict'
const express = require('express'),
  prtype = express.Router(),
  schema = require('../schema/schema'),
  pool = require('../connection/connection'),
  poolPromise = require('../connection/connection').poolpromise;

prtype.post("/listprtype", (req, res) => {
  let data = req.body, and = [], value = [];
  console.log("Data--", data);
  let sqlbus = ` SELECT prid,prname,prstatus FROM p_pr_type WHERE prstatus=1 `,
    sqlqueryc = ` SELECT count(*) total FROM p_pr_type WHERE prstatus=1 `;
  console.log('list Query :', sqlbus);

  if (data.like) and.push(` prname like '%${data.like}%'`);
  if (data.hasOwnProperty('prid') && data.prid) and.push(' prid = ' + data.prid);

  if (and.length > 0) {
    sqlbus += " and" + and.join(' AND ');
    sqlqueryc += " and" + and.join('AND');
  }
  if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
    sqlbus += ' ORDER BY prid ASC LIMIT ' + data.index + ', ' + data.limit;
  }
  pool.getConnection((err, conn) => {
    if (err) {
      console.log('List prtype Failed....');
      res.send(JSON.stringify('Failed'));
    } else {
      let sql = conn.query(sqlbus, function (err, result) {
        value.push(result);
        if (!err) {
          sql = conn.query(sqlqueryc, function (err, result) {
            conn.release();
            console.log('Listprtype Connection Closed.');
            if (!err) {
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
          console.log('Listprtype Connection Closed.');
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

async function addprtype(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body, errorvalue = [];
    const jwt_data = req.jwt_data;
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = ` select exists(select * from p_pr_type where prname ='${data.prname}') count `
        console.log('prtype query', sqlquery);
        let resp = await conn.query(sqlquery)
        console.log('result', resp);
        if (resp[0][0].count != 0) {
          console.log('prtype exists');
          errorvalue.push({ msg: "prtype name already exists", err_code: 46 })
          await conn.rollback();
        } else {
          let sqlinsert = ` insert into p_pr_type set prname='${data.prname}' `;
          console.log('insert query', sqlinsert);
          let result = await conn.query(sqlinsert)
          console.log('result', result);
          if (result[0]["affectedRows"] > 0 && result[0]["insertId"]) {
            let insin = result[0]["insertId"]
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='PRTYPE ADDED ID:${insin}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery)
            if (logres[0]["affectedRows"] > 0)
              errorvalue.push({ msg: "prtype Added Successfully", err_code: 0 })
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
    console.log('Addprtype Connection Closed', errorvalue)
    return resolve(errorvalue);
  });
}

prtype.post("/addprtype", async (req, res) => {
  console.log(req.body)
  req.setTimeout(864000000);
  console.log('dhcbg---------', req.body);
  let result = await addprtype(req);
  console.log(result);
  res.end(JSON.stringify(result));
});


prtype.post("/getprtype", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlbuss = `SELECT prid,prname,prstatus FROM p_pr_type WHERE prid ='${data.prid}'`;
    console.log("Query---", sqlbuss);
    let sqlg = con.query(sqlbuss, data.prid, (err, result) => {
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

async function updateprtype(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body, errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from p_pr_type where prid =${data.prid}) count`;
        console.log("expensetype query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          errorvalue.push({ msg: "pr type type already exists", err_code: 142 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.p_pr_type set prname = '${data.prname}'`;
          sqlupdate += ` where prid =${data.prid}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='PRTYPE INFO  UPDATED ID:${data.prid}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres["affectedRows"] > 0 && logres["insertId"] > 0)
              errorvalue.push({ msg: "pr type updated Successfully", err_code: 0 });
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 151 });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("catch error", err);
      }
    } else {                                //Log the Connection Error entered into the else part
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("Updateprtype Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

prtype.post("/updateprtype", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await updateprtype(req);
  res.end(JSON.stringify(result));
});

prtype.post("/showprtype", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqls, sqlshow = "SELECT prid,prname,prstatus FROM p_pr_type WHERE prstatus=1";
    sqls = con.query(sqlshow, (err, result) => {
      con.release();
      console.log("Showprtype Connection Closed.");
      if (err) {
        console.log(err);
      } else {
        res.send(JSON.stringify(result));
      }
    });
  });
});

//sub menu 
// 'use strict'   uncomment this 
prtype.post("/listsmprtype", (req, res) => {
  let data = req.body, and = [], value = [], sql;
  console.log("Data--", data);
  let sqlbus = ` SELECT s.prsmid,s.prid,p.prname,s.prsmname,s.prsmstatus FROM p_pr_sm s
  INNER JOIN p_pr_type p ON p.prid=s.prid WHERE prsmstatus=1 `,
    sqlqueryc = ` SELECT count(*) total FROM p_pr_sm s 
    INNER JOIN p_pr_type p ON p.prid=s.prid WHERE prsmstatus=1 `;
  console.log('list Query: ', sqlbus);
  if (data.like) and.push(` prsmname like '%${data.like}%'`)
  if (data.hasOwnProperty('prid') && data.prid) {
    and.push(" s.prid  ='" + data.prid + "'");
  }
  // if (data.hasOwnProperty('sm.prid') && data.prsmid) {
  //   and.push(' sm.prid = ' + data.prsmid);
  // }
  if (and.length > 0) {
    sqlbus += " and" + and.join(' AND ')
    sqlqueryc += " and" + and.join('AND')
  }
  if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
    sqlbus += ' ORDER BY prsmid DESC LIMIT ' + data.index + ', ' + data.limit;
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
            console.log('Listsmprtype Connection Closed.');
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
          console.log('Listsmprtype Connection Closed.');
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

async function addsmprtype(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body,errorvalue = [];
    const jwt_data = req.jwt_data;
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `select exists(select * from p_pr_sm where prsmname ='${data.prsmname}') count`
        console.log('prtype query', sqlquery);
        let resp = await conn.query(sqlquery)
        console.log('result', resp);
        if (resp[0][0].count != 0) {
          console.log('Prtype Exists');
          errorvalue.push({ msg: "Sub Menu Name Already Exists", err_code: 46 })
          await conn.rollback();
        } else {
          let sqlinsert = `insert into p_pr_sm set prid=${data.prid},prsmname='${data.prsmname}'`;
          console.log('insert query', sqlinsert);
          let result = await conn.query(sqlinsert)
          console.log('result', result);
          if (result[0]["affectedRows"] > 0 && result[0]["insertId"]) {
            let insin = result[0]["insertId"]
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='PRTYPE ADDED ID:${insin}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery)
            if (logres[0]["affectedRows"] > 0)
              errorvalue.push({ msg: "Prtype Sub Menu Added Successfully", err_code: 0 })
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
    console.log('Addsmprtype Connection Closed', errorvalue);
    return resolve(errorvalue);
  });
}

prtype.post("/addsmprtype", async (req, res) => {
  console.log(req.body)
  req.setTimeout(864000000);
  console.log('dhcbg---------', req.body);
  let result = await addsmprtype(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

prtype.post("/getsmprtype", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlbuss = `SELECT prsmid,prid,prsmname,prsmstatus FROM p_pr_sm WHERE prsmid=${data.prsmid}`;
    console.log("Query---", sqlbuss);
    let sqlg = con.query(sqlbuss, data.prsmid, (err, result) => {
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

async function updatesmprtype(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body,errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from p_pr_sm where prsmname = '${data.prsmname}') count`;
        console.log("expensetype query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          errorvalue.push({ msg: "pr type submenu type already exists", err_code: 350 });
          await conn.rollback();
        } else {
          let sqlupdate = `update veremaxpo.p_pr_sm set prid=${data.prid},prsmname = '${data.prsmname}'`;
          sqlupdate += ` where prsmid =${data.prsmid}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='PRTYPE SUBMENU INFO  UPDATED ID:${data.prsmid}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0)
              errorvalue.push({ msg: "Menu Updated Successfully", err_code: 0 });
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 370 });
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("catch error", err);
      }
    } else {                                    //Log the Connection Error entered into the else part
      console.log("Connection Error.....");
    }
    conn.release();
    console.log("Updatesmprtype Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

prtype.post("/updatesmprtype", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await updatesmprtype(req);
  res.end(JSON.stringify(result));
});

//sub sub  menu 
prtype.post("/listsmsmprtype", (req, res) => {
  let data = req.body, and = [], value = [], sql;
  console.log("Data--", data);
  let sqlbus = ` SELECT sm.prsmsm1id,sm.prid,p.prname,sm.prsmid,m.prsmname,sm.prsmsmname,sm.prsmsmstatus FROM p_pr_smsm sm 
  INNER JOIN p_pr_type p ON p.prid=sm.prid
  INNER JOIN p_pr_sm m ON m.prsmid=sm.prsmid `,
    sqlqueryc = `select count(*) total from p_pr_smsm sm
    INNER JOIN p_pr_type p ON p.prid=sm.prid
    INNER JOIN p_pr_sm m ON m.prsmid=sm.prsmid `;
  console.log('list Query :', sqlbus);
  if (data.like) and.push(` prsmsmname like '%${data.like}%'`)
  if (data.hasOwnProperty('prsmid') && data.prsm) {
    and.push(' prsmid = ' + data.prsm);
  }
  if (and.length > 0) {
    sqlbus += " and" + and.join(' AND ')
    sqlqueryc += " and" + and.join('AND')
  }
  if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
    sqlbus += ' ORDER BY prsmid DESC LIMIT ' + data.index + ', ' + data.limit;
  }
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
            console.log('Listsmsmprtype Connection Closed.');
            if (!err) {
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
          console.log('Listsmsmprtype Connection Closed.');
          res.send(JSON.stringify(result));
        }
      });
    }
  });
});

async function addsmsmprtype(req, res) {
  return new Promise(async (resolve, reject) => {
    let data = req.body, errorvalue = [];
    const jwt_data = req.jwt_data;
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("add data", data);
        let sqlquery = `select exists(select * from p_pr_smsm where prsmsmname ='${data.prsmsmname}') count`
        console.log('prtype query', sqlquery);
        let resp = await conn.query(sqlquery)
        console.log('result', resp);
        if (resp[0][0].count != 0) {
          console.log('prtype exists');
          errorvalue.push({ msg: "Sub menu name already exists", err_code: 46 })
          await conn.rollback();
        } else {
          let sqlinsert = `insert into p_pr_smsm set prid=${data.prid},prsmid=${data.prsm},prsmsmname='${data.prsmname}'`
          console.log('insert query', sqlinsert);
          let result = await conn.query(sqlinsert)
          console.log('result', result);
          if (result[0]["affectedRows"] > 0 && result[0]["insertId"]) {
            let insin = result[0]["insertId"]
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='SUBMENU PRTYPE ADDED ID:${insin}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery)
            if (logres[0]["affectedRows"] > 0)
            errorvalue.push({ msg: "Prtype Sub Menu Added Successfully", err_code: 0 })
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 75 })
            await conn.rollback();
          }
        }
      } catch (err) {
        console.log("Catch Error", err);
      }
    } else {
      console.log("Connection Error.....");
    }
    conn.release();
    console.log('Addsmsmprtype Connection Closed', errorvalue);
    return resolve(errorvalue);
  });
}

prtype.post("/addsmsmprtype", async (req, res) => {
  console.log(req.body)
  req.setTimeout(864000000);
  console.log('dhcbg---------', req.body);
  let result = await addsmsmprtype(req);
  console.log(result);
  res.end(JSON.stringify(result));
});

prtype.post("/getsmsmprtype", (req, res) => {
  let data = req.body;
  console.log("Data--", data);
  pool.getConnection((err, con) => {
    let sqlbuss = `SELECT prsmsm1id,prid,prsmid,prsmsmname,prsmsmstatus FROM p_pr_smsm WHERE prsmsm1id='${data.prsmsm1id}'`;
    console.log("Query---", sqlbuss);
    let sqlg = con.query(sqlbuss, data.prsmsm1id, (err, result) => {
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

async function updatesmsmprtype(req, res) {
  return new Promise(async (resolve, reject) => {
    const jwt_data = req.jwt_data;
    let data = req.body, errorvalue = [];
    let conn = await poolPromise.getConnection();
    if (conn) {
      await conn.beginTransaction();
      try {
        console.log("update data", data);
        let sqlq = `select exists(select * from p_pr_smsm where prid=${data.prid} AND prsmid=${data.prsm} AND
          prsmsmname ='${data.prsmname}') count`;
        console.log("expensetype query", sqlq);
        let resp = await conn.query(sqlq);
        console.log("result", resp);
        if (resp[0][0].count != 0) {
          errorvalue.push({ msg: "pr type submenu type already exists", err_code: 540 });
          await conn.rollback();
        } else {
          let sqlupdate = `update p_pr_smsm set prid=${data.prid},prsmid=${data.prsm},prsmsmname='${data.prsmname}'`;
          sqlupdate += ` where prsmsm1id =${data.prsmsm1id}`;
          console.log("update query", sqlupdate);
          let result = await conn.query(sqlupdate);
          console.log("result", result);
          if (result[0]["affectedRows"] > 0) {
            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='PRTYPE SUBMENU INFO  UPDATED ID:${data.prsm}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
            console.log(logQuery);
            let logres = await conn.query(logQuery);
            if (logres[0]["affectedRows"] > 0)
              errorvalue.push({ msg: "Menu updated Successfully", err_code: 0 });
            await conn.commit();
          } else {
            errorvalue.push({ msg: "Please Try After Sometimes", err_code: 370 });
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
    console.log("Updatesmsmprtype Connection Closed", errorvalue);
    return resolve(errorvalue);
  });
}

prtype.post("/updatesmsmprtype", async (req, res) => {
  console.log(req.body);
  req.setTimeout(864000000);
  let result = await updatesmsmprtype(req);
  res.end(JSON.stringify(result));
});

module.exports = prtype;