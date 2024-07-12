// 'use strict'
const express = require('express'),
    level = express.Router(),
    pool = require('../connection/connection'),
    poolPromise = require('../connection/connection').poolpromise;

level.post('/listLevel', function (req, res) {
    var data = req.body, where = [], value = [], sql,
        sqlquery = `SELECT h.id,h.projectid,h.level_name,h.levelid,h.claim_amt_limit,h.descid,h.desc_name,h.cdate,h.cby 
        FROM p_project_hierarchical h WHERE h.projectid =${data.project_id}`,
        sqlqueryc = ' SELECT count(*) `count` FROM veremaxpo.p_project_hierarchical h';

    console.log(sqlquery, sqlqueryc, "-------");
    if (data.hasOwnProperty('projectid') && data.project_id) {
        sqlquery += ' where h.projectid = ' + data.project_id;
    }
    if (data.hasOwnProperty('descid') && data.design_name) {
        sqlquery += ' where h.descid = ' + data.design_name;
    }
    sqlquery += where.length ? ` WHERE ${where.join(' AND ')} ` : ''
    sqlqueryc += where.length ? ` WHERE ${where.join(' AND ')} ` : ''
    if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
        sqlquery += '  ORDER BY h.id DESC LIMIT ' + data.index + ', ' + data.limit;
    }
    console.log("List hierarchy Query : ", sqlquery)
    pool.getConnection((err, conn) => {
        if (err) {
            res.send(JSON.stringify('failed'));
        } else {
            sql = conn.query(sqlquery, function (err, result) {
                value.push(result)
                if (!err) {
                    sql = conn.query(sqlqueryc, function (err, result) {
                        conn.release();
                        if (!err) {
                            console.log('connection Closed.');
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
                    res.send(JSON.stringify(result));
                }
            });
        }
    });
});

async function addLevel(req) {
    return new Promise(async (resolve, reject) => {
        const jwt_data = req.jwt_data;
        let data = req.body, errorvalue = [],
            conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log("add Role", data);
                let sqlquery = `select * from veremaxpo.p_project_hierarchical where projectid='${data.project_id}' `;
                let resp = await conn.query(sqlquery);
                if (resp[0].length == 0) {
                    let insertdata = [];
                    for (let i of data.leveldetailsId) {
                        let designation_name = '""', design_name = 0;
                        if (i.design_name != '' && i.design_name != null) {
                            designation_name = `(SELECT role_name FROM veremaxpo.role_mas WHERE role_id_pk=${i.design_name})`;
                            design_name = i.design_name;
                            //  claim_amt_limit=i.claim_amt_limit
                        }
                        insertdata.push('(' + data.project_id, '"' + i.claim_amt_limit + '"', '"' + i.level_name + '"', i.level_id, design_name, designation_name + ')')
                    }
                    let levelQuery = `INSERT INTO veremaxpo.p_project_hierarchical (projectid,claim_amt_limit,level_name,levelid,descid,desc_name) VALUES ${insertdata} `
                    console.log(levelQuery, "23232323232322323223232");
                    let result = await conn.query(levelQuery);
                    console.log("result", result);
                    if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
                        let sqllog = `INSERT INTO veremaxpo.activity_log SET table_id='Add level',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}'`;
                        sqllog = await conn.query(sqllog);
                        if (sqllog[0]['affectedRows'] > 0) {
                            errorvalue.push({
                                msg: "LEVEL Added Successfully", err_code: 0
                            });
                            await conn.commit();
                        }
                        else {
                            errorvalue.push({ msg: "please try after sometime log err", err_code: 1 });
                            await conn.rollback();
                        }
                    } else {
                        errorvalue.push({ msg: "Please Try After Sometimes", err_code: 1 });
                        await conn.rollback();
                    }
                } else {
                    errorvalue.push({ msg: "Project level already added" });
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
        console.log("Return Value", errorvalue);
        return resolve(errorvalue);
    });
} 

level.post("/addLevel", async (req, res) => {
    console.log(req.body);
    req.setTimeout(864000000);
    let result = await addLevel(req);
    res.end(JSON.stringify(result));
});

async function deleteLevel(req, res) {
    return new Promise(async (resolve, reject) => {
        let data = req.body,
            conn, status = false, errorvalue = [];
        try {
            conn = await poolPromise.getConnection();
            await conn.beginTransaction();
            console.log("delete", data);
            sqldel = `SELECT EXISTS(SELECT * FROM p_project_hierarchical  WHERE projectid= ${data.project_id})AS count`;
            console.log("vendor exists for vend", sqldel);
            sqldel = await conn.query(sqldel)
            if (sqldel[0][0].count != 0) {
                var sqldel = `DELETE FROM p_project_hierarchical WHERE projectid= ${data.project_id} and claim_amt_limit !='0'`;
                console.log('Client can be deleted', sqldel);
                let resultde = await conn.query(sqldel);
                if (resultde[0]['affectedRows'] > 0) {
                    errorvalue.push({ msg: "Deleted", error_msg: "138" });
                    console.log("Succesfully Deleted")
                    await conn.commit();
                }
                else {
                    status = true
                    errorvalue.push({ msg: " FAILED  ", error_msg: '144' });
                    console.log('sqldel', sqldel);
                    console.log('Failed to delete heirarachy table');
                    await conn.rollback();
                }
            }
        } catch (e) {
            console.log("Catch Block Error", e);
            errorvalue.push({ msg: "Claim Amount has been entered so it can't be deleted ", error_msg: "CONN" });
            await conn.rollback();
        }
        conn.release();
        return resolve(errorvalue)
    });
}

level.post("/delLevel", async (req, res) => {
    console.log(req.body)
    req.setTimeout(864000000);
    console.log('dhcbg---------', req.body);
    let result = await deleteLevel(req);
    res.end(JSON.stringify(result));
});


level.post("/getLevel", (req, res) => {
    let sqlg, data = req.body;
    console.log("Data--", data);
    pool.getConnection((err, con) => {
        let sqlpr = `SELECT h.id,h.projectid,h.level_name,h.claim_amt_limit,h.levelid,h.descid,h.desc_name,h.cdate,h.cby 
        FROM p_project_hierarchical h WHERE h.projectid =${data.project_id} and h.descid!= '0'`;
        console.log("Query---", sqlpr);
        if (data.project_id) {
            sqlg = con.query(sqlpr, data.project_id, (err, result) => {
                con.release();
                console.log("GetLevel Connecion Closed.");    
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

// async function updateLevel(req, res) {
//     return new Promise(async (resolve, reject) => {
//         let data = req.body, conn, errorvalue = [];
//         try {
//             conn = await poolPromise.getConnection();
//             await conn.beginTransaction();
//             console.log("update", data);
//             let sqlq = `select exists(select * from veremaxpo.p_project_hierarchical where id= ${data.id}) count`;
//             console.log("project query", sqlq);
//             let resp = await conn.query(sqlq);
//             console.log("result", resp);
//             if (resp[0][0].count == 0) {
//                 errorvalue.push({ msg: "No Data Found", err_code: 1 });
//                 await conn.rollback();
//             } else {
//                 let sqlupdate = `update veremaxpo.project_mas set h.projectid=${data.projectid},h.level_name='${data.level_name}',h.levelid=${data.levelid},h.descid=${data.descid},h.desc_name='${data.desc_name}'`;
//                 sqlupdate += ` where project_id= ${data.project_id}`;
//                 console.log("update query", sqlupdate);
//                 let result = await conn.query(sqlupdate, data);
//                 console.log("result", result);
//                 if (result[0]["affectedRows"] > 0) {
//                     errorvalue.push({ msg: "Level updated Successfully", err_code: 0 });
//                     await conn.commit();
//                 } else {
//                     errorvalue.push({ msg: "Please Try After Sometimes", err_code: 1 });
//                     await conn.rollback();
//                 }
//             }
//         } catch (e) {
//             console.log("Catch Block Error", e);
//             errorvalue.push({ msg: "Please try after sometimes", error_msg: "CONN" });
//             await conn.rollback();
//         }
//         conn.release();
//         return resolve(errorvalue)
//     });
// }

// level.post("/updateLevel", async (req, res) => {
//     console.log(req.body);
//     req.setTimeout(864000000);
//     let result = await updateLevel(req);
//     res.end(JSON.stringify(result));
// });


module.exports = level;