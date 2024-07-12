'use strict'
const express = require('express'),
    appclaim = express.Router(),
    pool = require('../connection/connection'),
    poolPromise = require('../connection/connection').poolpromise;
const multer = require('multer');
//list claim


//addclaim
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        console.log('request files---', file);
        let namefile = file.originalname.split('-')[0], folder_status = false;
        const fs = require("fs")
        const filename = namefile
        const imagePath = `${__dirname}/../Documents/Claimfiles/${filename}`;
        fs.exists(imagePath, exists => {
            if (exists) {
                folder_status = true
                console.log(" Directory Already created.");
            } else {
                folder_status = true
                fs.mkdir(imagePath, { recursive: true }, function (err) {
                    if (err) {
                    console.log(err);
                    } else { console.log("New directory successfully created.") }
                })
            }
            if (folder_status) { callback(null, imagePath); }
        });
    },
    filename: function (req, file, callback) {
        console.log(file);
        let nowdate = new Date();
        let file_name = file.originalname.split('-')[1]
        let type = file.mimetype == 'application/pdf' ? 'pdf' : 'png';
        callback(null, file_name + '-' + nowdate.toISOString().slice(0, 10) + '.' + type)
    }
})

const upload = multer({ storage: storage }).array('file', 5)

appclaim.post('/uploadFile', function (req, res) {
    console.log('Upload Document');
    const jwt_data=req.jwt_data;
    let errorarray = [], sql, data, file, sqlquery;
    upload(req, res, function (err) {
        if (err) {
            console.log("Error uploading file.", err)
            errorarray.push({ msg: "Upload Failed", error_code: 'FAIL' });
            res.end(JSON.stringify(errorarray));
        } else {
            data = req.body, file = req.files;
            console.log('file length-@@@@@@@@@@@@@@@@@', file.length)
            console.log(data, file, "errrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr")
            let fields = '', file_values = '', file_fields = '';
            switch (file.length) {
                case 1: {
                    fields = '(file1,user_id)';
                    file_values = `('${file[0].filename}',${data.id})`,
                        file_fields = `file1='${file[0].filename}',user_id=${data.id}`
                }
                case 2: {
                    fields = '(file1,file2,user_id)';
                    file_values = `('${file[0].filename}','${file[1].filename}',${data.id})`,
                        file_fields = `file1='${file[0].filename}',file2='${file[1].filename}',user_id=${data.id}`
                }
                case 3: {
                    fields = '(file1,file2,file3,user_id)';
                    file_values = `('${file[0].filename}','${file[1].filename}','${file[2].filename}',${data.id})`,
                        file_fields = `file1='${file[0].filename}',file2='${file[1].filename}',
                        file3='${file[2].filename}',user_id=${data.id}`
                }
            }    
            sqlquery = `INSERT INTO veremaxpo.employee_claim (${fields},created_by) VALUES 
               (${file_values},${jwt_data.user_id})           
                  ON DUPLICATE KEY
                  UPDATE  ${file_fields}`
            console.log("Update claim file Query.", sqlquery)
            pool.getConnection(function (err, conn) {
                if (err) {
                    console.log("Failed")
                }
                else {
                    sql = conn.query(sqlquery, function (err, result) {
                        if (!err) {
                            conn.release();
                            console.log('uploadFile connection closed.');
                            if (result.affectedRows > 0) {
                                let log=`INSERT INTO veremaxpo.activity_log SET table_id='Claim file stored:${file_values}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(file)}' `
                                console.log(log,"log query");
                                sql = conn.query(log, function (err, result) {
                                if(err){
                                 console.log("log error");
                                errorarray.push({ status: 0, msg: 'log error', error_msg: 1 });
                                }else{
                                    errorarray.push({ status: 1, msg: 'Added Succesfully', error_msg: 0 });
                                    console.log("File is uploaded.")
                                    res.end(JSON.stringify(errorarray));
                                }
                            });                            
                            }
                        } else {
                            console.log("File Not uploaded.", err)
                            errorarray.push({ msg: "Please try after sometimes", error_msg: 'FAIL' });
                            res.end(JSON.stringify(errorarray));
                        }
                    });
                }

            });
        }
    });
});

module.exports = appclaim;