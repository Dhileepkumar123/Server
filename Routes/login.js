'use strict'
const express = require('express');
const login = express();
const bodyParser = require('body-parser');
login.use(bodyParser.json());          // to support JSON-encoded bodies
login.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

const jwt = require('jsonwebtoken');
const tokenExpireTime = 2 * 60 * 60 * 1000;
const refreshTokenExpireTime = 24 * 60 * 60 * 1000;
const privateKey = require('../config/key');
const poolPromise = require('../connection/connection').poolpromise;

async function account(data) {
    console.log("Login Data", data);
    return new Promise(async (resolve, reject) => {
        var sqlquery, name, password, erroraray = [], refresh_token;
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                sqlquery = ` SELECT um.user_id uid,um.empid,um.firstname,um.role_id,um.lastname,um.menu_role,e.projectidfk
                ,IFNULL(e.logintype,0) logintype FROM employee_mas um
                LEFT JOIN employee e ON um.empid = e.emp_id_pk
                LEFT JOIN role_mas r ON r.role_id_pk=um.role_id
                WHERE um.username='${data.Username}' AND um.usr_password='${data.Password}' `;
                let usercount = " SELECT EXISTS( " + sqlquery + " ) AS c ";
                console.log('User Exists Query ', usercount);
                let [[userava]] = await conn.query(usercount);
                if (userava['c'] == 1) {
                    let result = await conn.query(sqlquery);
                    console.log('Length ', result[0].length);
                    if (result[0].length == 1) {
                        let userDet = result[0][0];
                        console.log('Userdetails', userDet);
                        if (data.logintype == userDet.logintype) {
                            let session_id = generateRandomString(), token, updatetoken;
                            try {
                                token = await jwt.sign({
                                    user_id: userDet.uid, empid: userDet.empid, mail: userDet.email, userc: userDet.usercode, role: userDet.role_id, menurole: userDet.menu_role, mobile: userDet.mobile,
                                    client: userDet.client, projectid: userDet.projectidfk, stateid: userDet.state_id_fk, districtid: userDet.dist_id_fk, levelid: userDet.levelid, logintype: data.logintype
                                },
                                privateKey, { algorithm: 'HS512', expiresIn: tokenExpireTime });
                                refresh_token = await jwt.sign({ id: userDet.uid, userc: userDet.usercode },
                                privateKey, { algorithm: 'HS512', expiresIn: refreshTokenExpireTime });
                            } catch (e) {
                                erroraray.push({ msg: "Please Try After Sometimes", status: 0, error_msg: '46' });
                                return;
                            }
                            let user_details = {
                                id: userDet.uid, empid: userDet.empid, code: userDet.usercode, fname: userDet.firstname, role: userDet.role_id, menurole: userDet.menu_role, mail: userDet.email, mobile: userDet.mobile,
                                client: userDet.client, projectid: userDet.prokectidfk, stateid: userDet.state_id, districtid: userDet.city_id, levelid: userDet.levelid, logintype: data.logintype
                            }
                            console.log(token, "token");
                            updatetoken = " UPDATE veremaxpo.employee_mas set `token`='" + token + "', `refresh_token`='" + refresh_token + "' where `user_id`=" + userDet.uid
                            console.log('updatetoken', updatetoken);
                            updatetoken = await conn.query(updatetoken);
                            if (updatetoken[0]['affectedRows'] != 0) {
                                await conn.commit();
                                erroraray.push({ msg: "Login Successfully", status: 1, error_msg: 0, user_details: user_details, token: token, refresh_token: refresh_token });
                                console.log("Login Successfully");
                            } else {
                                erroraray.push({ msg: " Please Try After 15 Min. ", status: 2, error_msg: 64 });
                                await conn.rollback();
                            }
                        } else {
                            erroraray.push({ msg: " Login Type Wrong. ", status: 2, error_msg: 68 });
                            await conn.rollback();
                        }
                    } else {
                        erroraray.push({ msg: "Please Try After 5 Min", status: 0, error_msg: 72 });
                        await conn.rollback();
                    }
                } else {
                    console.log(' COUNT is 0 :  ', userava['COUNT']);
                    erroraray.push({ msg: "User ID or Password Incorrect.", status: 0, error_msg: 77 });
                    await conn.rollback();
                }
            } catch (e) {
                console.log('Error ', e);
                erroraray.push({ status: 0, msg: 'Internal Error Please Try Later ', error_msg: 82 });
            }
        } else {
            erroraray.push({ status: 0, msg: 'Internal Error Please Try Later ', error_msg: 87 });
            return;
        }
        conn.release();
        console.log('Login Connection Closed.');
        console.log('Success--2');
        return resolve(erroraray);
    });
}

login.post('/account', async (req, res) => {
    req.setTimeout(864000000);
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log('result----', ip);
    let result = await account(req.body);
    console.log("Process Completed", result);
    res.end(JSON.stringify(result));
});

const generateRandomString = (length = 20, stringNeedToGenerate = 'ab56789cRSjklmnopqdefghiABCDEFGHIJKL0123MNOPQrstuvwxyzTUVWXYZ4') => {
    let randomString = '';
    for (var i = 0; i < length; i++) {
        let index = Math.floor(Math.random() * stringNeedToGenerate.length);
        randomString += stringNeedToGenerate[index];
    }
    return randomString;
}

module.exports = login;