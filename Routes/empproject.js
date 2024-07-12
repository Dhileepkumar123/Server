const express = require('express'),
    empproject = express.Router(),
    pool = require('../connection/connection'),
    poolPromise = require('../connection/connection').poolpromise;

empproject.post("/listEmp", (req, res) => {
    let sqls, data = req.body;
    console.log("Data--", data);
    pool.getConnection((err, conn) => {
        let sqlshow = `SELECT emp_id_pk,full_name,projectidfk FROM employee`;
        sqls = conn.query(sqlshow, (err, result) => {
            conn.release();
            console.log('listEmp connection closed.');
            if (err) {
                console.log(err);
            } else {
                res.send(JSON.stringify(result));
            }
        });
    });
});

empproject.post('/listEmpprj', function (req, res) {
    var data = req.body, where = [], value = [], sql,
        sqlquery = `  SELECT ep.id,ep.empid,e.full_name,ep.projectid,pm.project_title,ep.levelid,ep.designation,ep.cby,ep.cdate,ep.mby,ep.mdate FROM p_emp_project ep
        LEFT JOIN employee e ON e.emp_id_pk =ep.empid
        LEFT JOIN p_project_mas pm ON pm.project_id=ep.projectid
        LEFT JOIN p_project_hierarchical ph ON ph.id=ep.levelid  `,
        sqlqueryc = ' SELECT count(*) `count` FROM veremaxpo.p_emp_project ep';
    console.log(sqlquery, sqlqueryc, "-------");
    if (data.hasOwnProperty('project_title') && data.emp_id) {
        where.push(" project_title LIKE '%" + data.emp_id + "%'");
    }
    sqlquery += where.length ? ` WHERE ${where.join(' AND ')} ` : ''
    sqlqueryc += where.length ? ` WHERE ${where.join(' AND ')} ` : ''
    if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
        sqlquery += '  ORDER BY ep.id DESC LIMIT ' + data.index + ', ' + data.limit;
    }
    console.log("List employee project Query : ", sqlquery)
    pool.getConnection( (err, conn) => {
        if (err) {
            res.send(JSON.stringify('failed'));
        } else {
            sql = conn.query(sqlquery, function (err, result) {
                value.push(result)
                if (!err) {
                    sql = conn.query(sqlqueryc, function (err, result) {
                        conn.release();
                        console.log('ListEmpprj Connection Closed.');
                        if (!err) {
                            value.push(result[0]);
                            res.send(JSON.stringify(value));
                        } else {
                            console.log('Query Failed')
                            res.send(JSON.stringify(result));
                        }
                    });
                } else {
                    console.log('error', err);
                    conn.release();
                    console.log('ListEmpprj Connection Closed.');
                    res.send(JSON.stringify(result));
                }
            });
        }
    });
});

async function Emproj(req) {
    return new Promise(async (resolve, reject) => {
        const jwt_data = req.jwt_data;
        let data = req.body, conn, errorvalue = [];
        console.log(data, "12112121121");
        try {
            conn = await poolPromise.getConnection();
            await conn.beginTransaction();
            console.log("add Role", data);
            let sqlquery = `SELECT * FROM veremaxpo.p_emp_project WHERE
            empid=${data.employee_id} AND projectid=${data.project_id}`;
            let resp = await conn.query(sqlquery);
            if (resp[0].length == 1) {
                console.log("Employee assigned to project");
                errorvalue.push({
                    msg: "Employee assigned to project", err_code: 1
                });
                await conn.rollback();
            } else {
                let sqlinsert = `INSERT INTO veremaxpo.p_emp_project SET  projectid=${data.project_id},empid=${data.employee_id},
                levelid=${data.levelid},descid=${data.design_name},designation='${data.designation}',cby=${jwt_data.user_id}`;
                console.log("insert query", sqlinsert);
                let result = await conn.query(sqlinsert, data);
                console.log("result", result);
                if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
                    let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='EMPLOYEE ADDED TO PROJECT ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
                    console.log(logQuery);
                    let logres = await conn.query(logQuery);
                    if (logres[0]["affectedRows"] > 0 && logres[0]["insertId"] > 0)
                        errorvalue.push({ msg: "Employee Added to project Successfully", err_code: 0 });
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
        console.log('Emproj connection closed.');
        console.log("Return Value", errorvalue);
        return resolve(errorvalue);
    });
}

empproject.post("/addEmproj", async (req, res) => {
    console.log(req.body);
    req.setTimeout(864000000);
    let result = await Emproj(req);
    res.end(JSON.stringify(result));
});

async function updateEmpproj(req, res) {
    return new Promise(async (resolve, reject) => {
        const jwt_data = req.jwt_data;
        let data = req.body, conn, errorvalue = [];
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
                let sqlupdate = `update veremaxpo.p_project_mas SET  projectid=${data.project_id},descid=${data.descid},
                empid=${data.employee_id},levelid=${data.design_name},designation='${data.designation}',`;
                sqlupdate += ` where project_id= ${data.project_id},mby=${jwt_data.user_id}`;
                console.log("update query", sqlupdate);
                let result = await conn.query(sqlupdate, data);
                console.log("result", result);
                if (result[0]["affectedRows"] > 0) {
                    let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='Employee project updated PROJID:${data.project_id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
                    console.log(logQuery);
                    let logres = await conn.query(logQuery);
                    if (logres[0]["affectedRows"] > 0)
                        errorvalue.push({ msg: "Employee project updated Successfully", err_code: 0 });
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
        console.log("Return Value", errorvalue);
        return resolve(errorvalue)
    });
}

empproject.post("/updateEmpproj", async (req, res) => {
    console.log(req.body);
    req.setTimeout(864000000);
    let result = await updateEmpproj(req);
    res.end(JSON.stringify(result));
}
);

empproject.post("/getEmproj", (req, res) => {
    let sqlg, data = req.body;
    console.log("Data--", data);
    pool.getConnection( (err, conn) => {
        let sqlpr = `SELECT id,empid,projectid,levelid,descid,designation FROM p_emp_project WHERE projectid =${data.project_id}  `;
        console.log("Query---", sqlpr);
        if (data.project_id) {
            sqlg = conn.query(sqlpr, data.project_id, (err, result) => {
                conn.release();
                console.log('getEmproj connection closed.');
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

module.exports = empproject;