'use strict'
const express = require('express'),
    pclaim = express.Router(),
    pool = require('../connection/connection'),
    poolPromise = require('../connection/connection').poolpromise,
    multer = require('multer');

pclaim.post("/listClaimType", (req, res) => {
    let data = req.body;
    console.log("Data--", data);
    let sql, sqlsel = `SELECT claim_id,claim_name FROM p_claim_type`;
    pool.getConnection((err, con) => {
        console.log('query', sqlsel);
        sql = con.query(sqlsel, (err, result) => {
            con.release();
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        });
    });
});

const addEmployeeClaimAdmin = async (req) => {
    return new Promise(async (resolve, reject) => {
        const jwt_data = req.jwt_data;
        let data = req.body, errorarray = [],conn = await poolPromise.getConnection();
        console.log('Add Claim Data--', data);
        if (conn) {
            await conn.beginTransaction()
            try {
                let claimExistQuery = ` SELECT * FROM veremaxpo.p_employee_claim WHERE clientid = ?  AND projectidfk = ? `
                let [[claimExistResp]] = await conn.query(claimExistQuery, [data.clientid, data.projectidfk]);
                if (claimExistResp) {
                    console.log('Claim Already Exists', claimExistResp);
                    errorarray.push({ msg: 'Project Already Claimed', err_code: 33 })
                } else {
                    delete data.prtype; delete data.ecfile1; delete data.ecfile2; delete data.ecfile3;
                    let approvalAmountQuery = ` SELECT * FROM veremaxpo.p_project_hierarchical WHERE projectid = ? AND levelid = ? `
                    let [[approvalAmtResp]] = await conn.query(approvalAmountQuery, [data.projectidfk, data.user_cur_levelid])
                    if (approvalAmtResp) {
                        data.claim_status = Number(data.approval_amt) <= Number(approvalAmtResp.claim_amt_limit) ? data.claim_status : 1;
                    }
                    let claimdata = { ...data, cur_level: data.user_cur_levelid }
                    console.log('Data', claimdata);
                    let claimQuery = `INSERT INTO veremaxpo.p_employee_claim SET ? `;
                    let [claimResp] = await conn.query(claimQuery, [claimdata]);
                    if (claimResp.affectedRows > 0 && claimResp.insertId > 0) {
                        let claimFlowData = { ecsidfk: claimResp.insertId, msg: data.des, claim_status: data.claim_status, userid: data.userid, createdlevelid: data.user_cur_levelid }
                        let claimFlowQuery = ` INSERT INTO veremaxpo.p_employee_claim_flow SET ? `;
                        let [claimFlowResp] = await conn.query(claimFlowQuery, [claimFlowData])
                        if (claimFlowResp.affectedRows > 0 && claimFlowResp.insertId > 0) {
                            let claimUpdateQuery = ` UPDATE veremaxpo.p_employee_claim SET ec_flow_last = ${claimFlowResp.insertId} WHERE ecsid =${claimResp.insertId}`
                            let [claimUpdateResp] = await conn.query(claimUpdateQuery);
                            if (claimUpdateResp.affectedRows > 0) {
                                let logQuery = `INSERT INTO veremaxpo.activity_log SET table_id='ADMIN EMPLOYEE CLAIM ID:${claimFlowResp.insertId}',\`longtext\`='DONE BY',data='${JSON.stringify(data)}' `;
                                let [logResp] = await conn.query(logQuery);
                                if (logResp.affectedRows > 0 && logResp.insertId > 0) {
                                    await conn.commit();
                                    errorarray.push({ msg: 'Claim Added Successfully', err_code: 0, id: claimFlowResp.insertId })
                                } else {
                                    await conn.rollback();
                                    errorarray.push({ msg: 'Please try after sometimes', err_code: 56 })
                                }
                            } else {
                                await conn.rollback();
                                errorarray.push({ msg: 'Please try after sometimes', err_code: 59 })
                            }
                        } else {
                            await conn.rollback();
                            errorarray.push({ msg: 'Please try after sometimes', err_code: 63 })
                        }
                    } else {
                        await conn.rollback();
                        errorarray.push({ msg: 'Please Try After Sometimes', err_code: 66 })
                    }
                }
            } catch (e) {
                console.log('catch block error', e);
                errorarray.push({ msg: 'Please try after sometimes', err_code: '74' })
                await conn.rollback();
            }
        } else {
            errorarray.push({ msg: 'Please try after sometimes', err_code: 'CONN' })
        }
        conn.release();
        console.log('Add Claim result', errorarray);
        return resolve(errorarray)
    });
};

pclaim.post('/addEmployeeClaimAdmin', async (req, res) => {
    req.setTimeout(864000000);
    const result = addEmployeeClaimAdmin(req);
    res.json(result)
});

const updateEmployeeClaimAdmin = async (req) => {
    return new Promise(async (resolve, reject) => {
        const jwt_data = req.jwt_data;
        let data = req.body, conn = await poolPromise.getConnection(), errorarray = [];
        console.log('Update Claim Data--', data);
        if (conn) {
            await conn.beginTransaction()
            try {
                let claimStatusQuery = `SELECT * FROM veremaxpo.p_employee_claim c WHERE c.ecsid =${data.id} AND c.claim_status IN (5,6) `
                let [[claimStatusResp]] = await conn.query(claimStatusQuery);
                if (claimStatusResp) {
                    errorarray.push({ msg: 'Project Already Updated', err_code: '111' })
                } else {
                    let insertClaim = ` INSERT INTO veremaxpo.p_employee_claim_flow SET claim_status=${data.claim_status},ecsidfk=${data.id},userid=${jwt_data.empid},
                    createdlevelid=${data.createdlevelid},msg='${data.msg}' `
                    const [insertClaimResp] = await conn.query(insertClaim);
                    if (insertClaimResp.insertId > 0 && insertClaimResp.affectedRows > 0) {
                        let updateClaim = ` UPDATE veremaxpo.p_employee_claim SET ec_flow_last=${insertClaimResp.insertId}, claim_status = ${data.claim_status} `
                        if (data.claim_status == 2) {  // Query
                            updateClaim += ` ,cur_level = ${data.createdlevelid - 1}`
                        }
                        if (data.claim_status == 3) { //Query Response
                            updateClaim += ` ,cur_level = ${data.createdlevelid + 1}`
                        }
                        if (![2, 3].includes(data.claim_status)) updateClaim += ` ,cur_level = ${data.createdlevelid}`
                        updateClaim += ` WHERE ecsid =${data.id}`
                        const [updateClaimResp] = await conn.query(updateClaim);
                        if (updateClaimResp.affectedRows > 0) {
                            let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='UPDATE ADMIN EMPLOYEE CLAIM ID:${data.id}',\`longtext\`='DONE BY',data='${JSON.stringify(data)}' `;
                            let [logResp] = await conn.query(logQuery);
                            if (logResp.affectedRows > 0 && logResp.insertId > 0) {
                                await conn.commit();
                                errorarray.push({ msg: 'Claim Updated Successfully', err_code: 0 })
                            } else {
                                await conn.rollback()
                                errorarray.push({ msg: 'Please try after sometimes', err_code: 134 })
                            }
                        }
                    } else {
                        errorarray.push({ msg: 'Please try after sometimes', err_code: '138' })
                        await conn.rollback();
                    }
                }
            } catch (e) {
                console.log('catch block error', e);
                errorarray.push({ msg: 'Please try after sometimes', err_code: '74' })
                await conn.rollback();
            }
        } else {
            errorarray.push({ msg: 'Please try after sometimes', err_code: 'CONN' })
        }
        conn.release();
        console.log('Update Claim result', errorarray);
        return resolve(errorarray)
    });
};

pclaim.post('/updateEmployeeClaimAdmin', async (req, res) => {
    req.setTimeout(864000000);
    const result = await updateEmployeeClaimAdmin(req);
    res.json(result)
});
//Upload Claim Document

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        console.log('request files---', file);
        let namefile = file.originalname.split('-')[0], folder_status = false;
        const fs = require("fs")
        const filename = namefile
        const imagePath = `${__dirname}/../Documents/AdminClaim/${filename}`;
        fs.exists(imagePath, exists => {
            if (exists) {
                folder_status = true
                console.log(" Directory Already created.");
            } else {
                console.log('folder createeee');
                // folder_status = true
                fs.mkdir(imagePath, { recursive: true }, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        folder_status = true
                        console.log("New directory successfully created.");
                        callback(null, imagePath)
                    }
                })
            }
            if (folder_status) { console.log('folder last'); callback(null, imagePath); }
        });
    },
    filename: function (req, file, callback) {
        console.log('File Uploadddd');
        let nowdate = new Date();
        let file_name = file.originalname.split('-')[1]
        let type = file.mimetype == 'application/pdf' ? 'pdf' : 'png';
        callback(null, file_name + '-' + nowdate.toISOString().slice(0, 10) + '.' + type)
    }
})

const upload = multer({ storage: storage }).array('file', 3)


pclaim.post('/uploadClaimProof', function (req, res) {
    let errorarray = [], sql, updateQuery = '', data, file, sqlquery;
    upload(req, res, function (err) {
        if (err) {
            errorarray.push({ msg: "Upload Failed", error_code: 127 });
            res.json(errorarray);
        } else {
            data = req.body, file = req.files;
            console.log('file length', file.length);
            console.log(data, file);
            switch (file.length) {
                case 1: {
                    updateQuery += ` ecffile1 = '${file[0].filename}'`
                    break;
                }
                case 2: {
                    updateQuery += ` ecffile1 = '${file[0].filename}',ecffile2 = '${file[1].filename}'`
                    break;
                }
                case 3: {
                    updateQuery += ` ecffile1 = '${file[0].filename}',ecffile2 = '${file[1].filename}',ecffile3 = '${file[2].filename}'`
                    break;
                }
            }
            sqlquery = ` UPDATE veremaxpo.p_employee_claim_flow SET ${updateQuery} WHERE ecfid = ${data.ecsidfk} `
            console.log("Update claim Admin file Query.", sqlquery);
            pool.getConnection(function (err, conn) {
                if (err) {
                    console.log("Failed");
                }
                else {
                    sql = conn.query(sqlquery, function (err, result) {
                        conn.release();
                        if (!err) {
                            if (result.affectedRows > 0) {
                                errorarray.push({ status: 1, msg: 'Claim Added Succesfully', err_code: 0 });
                                res.json(errorarray)
                            }
                        } else {
                            errorarray.push({ msg: "Please try after sometimes", error_msg: '162' });
                            res.json(errorarray)
                        }
                    });
                }
            });
        }
    });
});

pclaim.post('/showClaimStatus', async (req, res) => {
    let data = req.body;
    let where = [], sql, sqlquery = `SELECT * FROM p_emp_claim_status`;
    if (data.hasOwnProperty('like') && data.like) {
        where.push(`ecs_name LIKE '% ${data.like} %' `)
    }
    if (where.length) sqlquery += ` WHERE ${where.join(' AND ')}`
    pool.getConnection((err, conn) => {
        sql = conn.query(sqlquery, (err, result) => {
            conn.release();
            if (err) {
                console.log(err);
            } else {
                res.json(result)
            }
        });
    });
});

pclaim.post('/listEmpClaimAdmin', function (req, res) {
    const jwt_data = req.jwt_data;
    console.log('jwt', jwt_data);
    var data = req.body, where = [], value = [], sql,
        sqlquery = ` SELECT pec.ecsid, pec.ecid,ct.claim_name,pec.clientid,pc.client_name,pec.projectidfk,ppm.project_title,pec.userid,e.emp_id,
        pec.user_cur_levelid,r.desc_name user_role,pec.des,pec.cur_level,rc.desc_name cur_role,pec.ecamt,pec.approval_amt,
        pec.ec_flow_last,pec.claim_status,pecs.ecs_name,ex.expensetype_name FROM p_employee_claim pec
        INNER JOIN claim_type  ct ON pec.ecid = ct.claim_id
        INNER JOIN p_client  pc ON pec.clientid=pc.client_id
        INNER JOIN p_project_mas ppm ON pec.projectidfk=ppm.project_id
        INNER JOIN employee e ON pec.userid=e.emp_id_pk
        INNER JOIN p_emp_claim_status pecs ON pec.claim_status= pecs.ecsid
        INNER JOIN p_project_hierarchical r ON pec.user_cur_levelid = r.levelid AND pec.projectidfk = r.projectid
        INNER JOIN p_project_hierarchical rc ON pec.cur_level = rc.levelid AND pec.projectidfk = rc.projectid
        INNER JOIN p_expense_type ex ON ex.expensetype_id=pec.expenseid `,

        sqlqueryc = ` SELECT count(*) count FROM veremaxpo.p_employee_claim pec
        INNER JOIN claim_type  ct ON pec.ecid = ct.claim_id
        INNER JOIN p_client  pc ON pec.clientid=pc.client_id
        INNER JOIN p_project_mas ppm ON pec.projectidfk=ppm.project_id
        INNER JOIN employee e ON pec.userid=e.emp_id_pk
        INNER JOIN p_emp_claim_status pecs ON pec.claim_status= pecs.ecsid
        INNER JOIN p_project_hierarchical r ON pec.user_cur_levelid = r.levelid AND pec.projectidfk = r.projectid
        INNER JOIN p_project_hierarchical rc ON pec.cur_level = rc.levelid AND pec.projectidfk = rc.projectid
        INNER JOIN p_expense_type ex ON ex.expensetype_id=pec.expenseid `;

    if (jwt_data.client) where.push(`pec.clientid = ${jwt_data.client}`)
    if (jwt_data.projectid) where.push(`pec.projectidfk = ${jwt_data.projectid}`)
    if (jwt_data.levelid) where.push(`pec.user_cur_levelid >= ${jwt_data.levelid}`)

    sqlquery += where.length ? ` WHERE ${where.join(' AND ')} ` : ''
    sqlqueryc += where.length ? ` WHERE ${where.join(' AND ')} ` : ''
    if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
        sqlquery += '  ORDER BY pec.ecid DESC LIMIT ' + data.index + ', ' + data.limit;
    }
    console.log("List employeeclaim Query : ", sqlquery, 'count', sqlqueryc)
    pool.getConnection( (err, conn) => {
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

//list claimtype flow
pclaim.post('/listClaimflow', function (req, res) {
    console.log('req--', req.body);
    const jwt_data = req.jwt_data;
    var data = req.body, where = [], value = [], sql,
        sqlquery = `SELECT pcf.*,e.emp_id,r.desc_name role_name,pecs.ecs_name  FROM p_employee_claim_flow pcf
       INNER JOIN employee e ON pcf.userid=e.emp_id_pk
        INNER JOIN p_project_hierarchical r ON pcf.createdlevelid = r.levelid AND 
        (SELECT projectidfk FROM veremaxpo.p_employee_claim WHERE ecsid = pcf.ecsidfk) = r.projectid
        INNER JOIN p_emp_claim_status pecs ON pcf.claim_status= pecs.ecsid `,
        sqlqueryc = ' SELECT count(*) `count` FROM veremaxpo.p_employee_claim_flow pcf';

    if (data.hasOwnProperty('ecsidfk') && data.ecsidfk) {
        where.push(` pcf.ecsidfk = ${data.ecsidfk}`)
    }
    console.log('where', where);
    sqlquery += where.length ? ` WHERE ${where.join(' AND ')} ` : ''
    sqlqueryc += where.length ? ` WHERE ${where.join(' AND ')} ` : ''
    if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
        sqlquery += '  ORDER BY pcf.ecfid DESC LIMIT ' + data.index + ', ' + data.limit;
    }
    console.log("List employeeclaimflow Query : ", sqlquery)
    pool.getConnection( (err, conn) => {
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

pclaim.post("/listclaim", (req, res) => {
    let data = req.body;
    console.log("Data--", data);
    pool.getConnection( (err, con) => {
        let sql, sqlsel = `SELECT claim_id,claim_name FROM p_claim_type`;
        sql = con.query(sqlsel, (err, result) => {
            con.release();
            if (err) {
                console.log(err);
            } else {
                res.send(JSON.stringify(result));
            }
        });
    });
});

async function addpclaim(req) {
    return new Promise(async (resolve, reject) => {
        let data = req.body, conn, errorvalue = [];
        try {
            conn = await poolPromise.getConnection();
            await conn.beginTransaction();
            console.log("add Role", data);
            let sqlquery = `select exists (select * from veremaxpo.p_project_mas where
                    project_title='${data.project_name}') count`;
            let resp = await conn.query(sqlquery);
            if (resp[0][0].count != 0) {
                console.log("Project  exists");
                errorvalue.push({
                    msg: "Project already exists", err_code: 1
                });
                await conn.rollback();
            } else {
                let sqlinsert = `insert into veremaxpo.p_project_mas set  client_id='${data.client_name}',project_title='${data.project_name}',project_code='${data.project_code}'`;
                console.log("insert query", sqlinsert);
                let result = await conn.query(sqlinsert, data);
                console.log("result", result);
                if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
                    errorvalue.push({
                        msg: "Project Added Successfully", err_code: 0
                    });
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
        return resolve(errorvalue);
    });
}

pclaim.post("/addpclaim", async (req, res) => {
    console.log(req.body);
    req.setTimeout(864000000);
    let result = await addpclaim(req);
    res.end(JSON.stringify(result));
});

pclaim.post("/getpclaim", (req, res) => {
    let sqlg, data = req.body;
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

async function updatepclaim(req, res) {
    return new Promise(async (resolve, reject) => {
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
                let sqlupdate = `update veremaxpo.p_project_mas set client_id=${data.client_name},project_title='${data.project_name}',project_code='${data.project_code}'`;
                sqlupdate += ` where project_id= ${data.project_id}`;
                console.log("update query", sqlupdate);
                let result = await conn.query(sqlupdate, data);
                console.log("result", result);
                if (result[0]["affectedRows"] > 0) {
                    errorvalue.push({ msg: "Claim updated Successfully", err_code: 0 });
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

pclaim.post("/updatepclaim", async (req, res) => {
    console.log(req.body);
    req.setTimeout(864000000);
    let result = await updatepclaim(req);
    res.end(JSON.stringify(result));
}
);

//get image list claim

// async function getImg(data) {
//     return new Promise(async (resolve, reject) => {
//         console.log(data.id)
//         var sqlquery, imageName, img_result;
//         img_result = { isp_logo: '' };
//         let conn = await poolPromise.getConnection();
//         if (conn) {
//             console.log('Data===', data);
//             await conn.beginTransaction();
//             try {
//                 sqlquery = ' SELECT ecfid,ecffile1,ecffile2,ecffile3 FROM p_employee_claim_flow WHERE ecfid =' + data.id
//                 console.log("Get IspLogo Qwery", sqlquery)
//                 let result = await conn.query(sqlquery)

//                 if (result[0][0].isplogo) {
//                     imageName = [{
//                         key: 'isp_logo',
//                         fileName: `${data.id}/${result[0][0].isplogo}`
//                     }];
//                     const element = imageName[0]
//                     img_result[element.key] = await getImage(element.fileName)
//                 } else {
//                     // return resolve({ error: true, msg: 'Image Not Upload' })
//                     console.log('Image Not Upload')
//                 }
//             } catch (e) {
//                 console.log('Inside Catch', e)
//                 // return resolve({ error: true, msg: e.toString() })
//             }
//             conn.release();
//             if (img_result) {
//                 return resolve(img_result)
//             } else {
//                 return resolve({ error: true, msg: 'Image Not Found' })
//             }
//         } else {
//             console.log("Connection Failed")
//             return
//         }
//     });
// }

// pclaim.get('/getImg', async (req, res) => {
//     req.setTimeout(864000000);
//     const url = require('url');
//     const url_parts = url.parse(req.url, true);
//     const query = url_parts.query;
//     console.log('Get Logo', query);
//     let resp = await getImg(query);
//     if (resp.error) {
//         return res.end(JSON.stringify(resp));
//     }
//     res.end(JSON.stringify(resp));
// });

module.exports = pclaim;