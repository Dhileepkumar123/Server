'use strict'
const express = require('express'),
    role = express.Router(),
    pool = require('../connection/connection'),
    poolPromise = require('../connection/connection').poolpromise;

role.post('/listRole', function (req, res) {
    var data = req.body, where = [], value = [], sql,
        sqlquery = 'SELECT role_id_pk,role_name,role,menu_role,description FROM veremaxpo.role_mas r',
        sqlqueryc = ' SELECT count(*) `count` FROM veremaxpo.role_mas r ';
    console.log(sqlquery, sqlqueryc, "-------");
    if (data.hasOwnProperty('role_name') && data.role_name) {
        sqlquery += where.push(" r.role_id_pk LIKE '%" + data.role_name + "%'" );
    }
    where.push('r.role NOT IN(999,998)')
    sqlquery += where.length ? ` WHERE ${where.join(' AND ')} ` : ''
    sqlqueryc += where.length ? ` WHERE ${where.join(' AND ')} ` : ''
    
    if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
        sqlquery += '  ORDER BY r.role_id_pk  LIMIT ' + data.index + ', ' + data.limit;
    }
    console.log("List Role Query : ", sqlquery);
    pool.getConnection( (err, conn) => {
        if (err) {
            res.send(JSON.stringify('failed'));
        } else {
            sql = conn.query(sqlquery, function (err, result) {
                value.push(result)
                if (!err) {
                    sql = conn.query(sqlqueryc, function (err, result) {
                        conn.release();
                        console.log('listRole connection Closed.');
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
                    console.log('ListRole Connection Closed.');
                    res.send(JSON.stringify(result));
                }
            });
        }
    });
});

async function addRole(req) {
    return new Promise(async (resolve, reject) => {
        let data = req.body, conn, errorvalue = [],
        insertdata = { menu_role: JSON.stringify(data.menu_role) };
        const jwt_data=req.jwt_data;
        try {
            conn = await poolPromise.getConnection();
            await conn.beginTransaction();
            console.log("add Role", data);
            let sqlquery = `select exists (select * from veremaxpo.role_mas where role_name='${data.profile}') count`;
            let resp = await conn.query(sqlquery);
            if (resp[0][0].count != 0) {
                console.log("Role  exists");
                errorvalue.push({msg: "Role already exists", err_code: 1});
                await conn.rollback();
            } else {
                let sqlinsert = `insert into veremaxpo.role_mas set  role_name='${data.profile}',menu_role='${insertdata.menu_role}',ctime=NOW(),created_by=${jwt_data.user_id}`
                
                if(data.description) sqlinsert +=`  ,description='${data.description}'`
                
                console.log("insert query", sqlinsert);
                let result = await conn.query(sqlinsert, data);
                console.log("result", result);
                    if (result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0) {
                        let logQuery = ` INSERT into  veremaxpo.activity_log SET table_id='ROLE ADDED :${data.profile}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
                        console.log(logQuery);
                        let logres = await conn.query(logQuery)
                        if(logres["affectedRows"]>0 && logres[0]['insertId'] > 0)
                        console.log("Test");
                    errorvalue.push({msg: "Role Added Successfully", err_code: 0});
                    await conn.commit();
                } else {
                    errorvalue.push({ msg: "Please Try After Sometimes", err_code: 1 });
                    await conn.rollback();
                }
            }
        } catch (e){
            console.log("Catch Block Error", e);
            errorvalue.push({ msg: "Please try after sometimes", error_msg: "CONN" });
            await conn.rollback();
        }
        conn.release();
        console.log("Return Value", errorvalue);
        return resolve(errorvalue);
    });
}

role.post("/addRole", async (req, res) => {
    console.log(req.body);
    req.setTimeout(864000000);
    let result = await addRole(req);
    res.end(JSON.stringify(result));
});

role.post("/getRole", (req, res) =>  {
    let sqlg,data = req.body;
    console.log("Data--", data);
    pool.getConnection( (err, con) => {
        let sqlpr = `select role_id_pk,role_name,menu_role,description from veremaxpo.role_mas where role_id_pk =${data.role_id}`;
        console.log("Query---", sqlpr);
        if (data.role_id) {
             sqlg = con.query(sqlpr, data.role_id, (err, result) => {
                con.release();
                if (err) {
                    console.log(err);
                } else {
                    console.log(result)
                    res.send(JSON.stringify(result));
                }
            });
        }
    });
});


async function updateRole(req, res) {
    return new Promise(async (resolve, reject) => {
        let data = req.body, conn, errorvalue = [],  
        insertdata = { menu_role: JSON.stringify(data.menu_role), };
        const jwt_data=req.jwt_data;
        try {
            conn = await poolPromise.getConnection();
            await conn.beginTransaction();
            console.log("update", data);
            let sqlq = `select exists(select * from veremaxpo.role_mas where role_id_pk ='${data.role_id}') count`;
            console.log("project query", sqlq);
            let resp = await conn.query(sqlq);
            console.log("result", resp);
            if (resp[0][0].count == 0) {
                errorvalue.push({ msg: "No Data Found", err_code: 1 });
                await conn.rollback();
            } else {
                let sqlupdate = `update veremaxpo.role_mas set role_name='${data.profile}',menu_role='${insertdata.menu_role}',
                description='${data.description}',mtime=NOW(),updated_by=${jwt_data.user_id}`;
                sqlupdate += ` where role_id_pk= ${data.role_id}`;
                console.log("update query", sqlupdate);
                let result = await conn.query(sqlupdate, data);
                console.log("result", result);
                if (result[0]["affectedRows"] > 0) {
                    let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='ROLE INFO  UPDATED ID:${data.role_id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
                    console.log(logQuery);
                    let logres = await conn.query(logQuery);
                    if(logres[0]["affectedRows"]>0)
                    errorvalue.push({ msg: "Role updated Successfully", err_code: 0 });
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
        return resolve(errorvalue)
    });
}

role.post("/updateRole", async (req, res) => {
    console.log(req.body);
    req.setTimeout(864000000);
    let result = await updateRole(req);
    res.end(JSON.stringify(result));
}
);


module.exports = role;