"use strict"

const express = require('express'),
    cloaster = express.Router(),
    pool = require('../connection/connection'),
    poolPromise = require('../connection/connection');

cloaster.post('/listcloaster', (req, res) => {
    let data = req.body, sql, where = [];
    console.log("Data...", data);
    let sqla = `select * from vehicle`,
        sqlqueryc = `select count(*) count from vehicle`;
    if (data.hasOwnProperty('vehicle') && data.vehicle_id != '' && data.vehicle_id != null) {
        sqlbuss += ' AND vehicle_id =' + data.vehicle_id;
    }
    if (data.hasOwnProperty('like') && data.like != '') {
    }
    console.log('Get Count Query :');
    pool.getConnection( (err, conn) => {
        if (err) {
            console.log('List Failed...');
            res.send(JSON.stringify('failed'));
        } else {
            sql = conn.query(sqlq, function (err, result) {
                value.push(result)
                if (!err) {
                    sql = conn.query(sqlqueryc, function (err, result) {
                        conn.release();
                        console.log("listcloaster Connection Closed.");
                        if (!err) {
                            value.push(result[0]);
                            res.send(JSON.stringify(value));
                        } else {
                            console.log('Query Failed');
                            res.send(JSON.stringify(result));
                        }
                    });
                }
            });
        }
    });
});

module.exports = cloaster;