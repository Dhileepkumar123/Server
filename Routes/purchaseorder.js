const express = require('express'),
    compression = require('compression'),
    purchaseorder = express.Router(),
    schema = require('../schema/schema'),
    pool = require('../connection/connection'),
    poolPromise = require('../connection/connection').poolpromise;
const { response } = require('express');
const { validationResult } = require('express-validator/');

async function addvendorservicepo(req, res) {
    return new Promise(async (resolve, reject) => {
        const jwt_data = req.jwt_data;
        let data = req.body, cdate = NOW(), userSetting;
        errorvalue = [];
        // var invoicereceived_date = data.invoicereceived_date == undefined ? null : data.invoicereceived_date.split("-").reverse().join("-");
        // var invoice_date = data.invoice_date == undefined ? null : data.invoice_date.split("-").reverse().join("-");
        // var service_startdate = data.service_startdate == undefined ? null : data.service_startdate.split("-").reverse().join("-");
        // var service_enddate = data.service_enddate == undefined ? null : data.service_enddate.split("-").reverse().join("-");
        // var payment_date = data.payment_date == undefined ? null : data.payment_date.split("-").reverse().join("-");
        // var period_startdate = data.period_startdate == undefined ? null : data.period_startdate.split("-").reverse().join("-");
        // var period_enddate = data.period_enddate == undefined ? null : data.period_enddate.split("-").reverse().join("-");
        // var received_date = data.received_date == undefined ? null : data.received_date.split("-").reverse().join("-");
        // var gst_date = data.gst_date == undefined ? null : data.gst_date.split("-").reverse().join("-");
        // var handover_date = data.handover_date == undefined ? null : data.handover_date.split("-").reverse().join("-");
        if (data.pay_type == 1) {
            var approval_sts = 5;
        } else {
            var approval_sts = data.pay_type == 2 ? 5 : 1
        }
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                console.log("add data", data);
                let sqlquery = `SELECT count(*) as countVendor from vendor_servicepo`;
                console.log('client query', sqlquery);
                let [[resp]] = await conn.query(sqlquery)
                let inc = autogenerate((resp.countVendor + 1), 8);
                let fr_no = ("FR" + (inc));
                console.log(fr_no, "++++++++");
                let sqlq = ` SELECT COUNT(*) a FROM veremaxpo.vendor_servicepo  WHERE fr_no='${fr_no}' `;
                let [[respon]] = await conn.query(sqlq)
                if (respon.a != 0) {
                    console.log("fr_no name exists");
                    errorvalue.push({ msg: "fr_no Already Exists", errorcode: 37 });
                    await conn.rollback();
                }
                else {
                    var ifields = {
                        "invoice_no": data.invoice_no,
                        "serive_po_id_fk": data.Ser_Po_id,
                        "expensetype_id_fk": data.expensetype,
                        "invoice_rcvddate": data.invoicereceived_date,
                        "invoice_date": data.invoice_date,
                        "period_startdate": data.period_startdate,
                        "period_enddate": data.period_enddate,
                        "srvperiod_startdate": data.service_startdate,
                        "srvperiod_enddate": data.service_enddate,
                        "inv_category": data.invoice_cat,
                        "fr_no": fr_no,
                        "reg_bank": data.reg_bank == undefined ? null : data.reg_bank,
                        "acount_name": data.beneficiary_name,
                        "bank_name": data.bank_name,
                        "bank_branch": data.bank_branch,
                        "acount_no": data.account_no,
                        "ifsc_no": data.ifsc_no,
                        "gst_sts": data.gst_status,
                        "remarks": data.remarks,
                        "tax_type": data.tax_type,
                        "count_basic_cost": data.countTaxableValue,
                        "gst_per": data.gst,
                        "gst_fill_date": data.gst_date,
                        "invoice_copy": data.invoice_copy_type,
                        "gst_count": data.gst_count,
                        "sgst_per": data.sgst,
                        "sgst_count": data.countSgst,
                        "cgst_per": data.cgst,
                        "cgst_count": data.countCgst,
                        "tds_per": data.TdsPer,
                        "tds_count": data.countTds,
                        "count_cost": data.grand_count,
                        "balance": data.balanceAmts,
                        "change_po_status": 0,
                        "invoice_copyfile": data.invoice_copy_filename,
                        "net_pay_aftrdeduct": data.netPayAfter,
                        "add_charge": data.additionalCharge,
                        "add_deduction": data.additionalDedution,
                        "add_gstdeduction": data.pocostDedution,
                        "received_by": data.receivedby,
                        "received_date": data.received_date,
                        "handover_by": data.handoverby,
                        "handover_date": data.handover_date,
                        "vendor_id_fk": data.vendor_id_fk,
                        "inv_remarks": data.invoice_remarks,
                        "unpaid_remarks": data.payment_remarks,
                        "payment_type": data.pay_type,
                        "paymentdate": data.payment_date,
                        "utr_no": data.utr_no,
                        "count_before_amts": data.countBeforeAmts,
                        "amount_paid": data.countAmtPaid == "" ? 0 : data.countAmtPaid,
                        "adv_amount": data.advance_amt == "" ? 0 : data.advance_amt,
                        "kilomtr_qty": data.kilometer == "" ? 0 : data.kilometer,
                        "kilomtr_rate": data.kilometer_rate == "" ? 0 : data.kilometer_rate,
                        "additional_km": data.count_kilometerValue == "" ? 0 : data.count_kilometerValue,
                        "paid_status": 1,
                        "add_charge_nogst": data.acNogst == "" ? 0 : data.acNogst,
                        "approval_sts": approval_sts,
                        // "basic3_count": data.basicAmt_three,
                        // "basic10_count": data.basicAmt_ten,
                        // "basicper_three ": data.basicPer_three,
                        // "basicper_ten": data.basicPer_ten,
                        "ctime": cdate,
                        "created_by": jwt_data.user_id
                        // "approval_by": data.login_user_id,
                        //"created_by": data.login_user_id
                    };
                    console.log(data.Ser_Po_id, "-----------");
                    console.log(data, "++++++++++++");
                    let sqlinsert = `insert into vendor_servicepo set?`;
                    console.log('insert query', sqlinsert);
                    let result = await conn.query(sqlinsert, ifields)
                    console.log('result', result);
                    if (result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0) {
                        let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='PURCHASEORDER INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
                        console.log(logQuery);
                        let logres = await conn.query(logQuery);
                        if (logres[0]["affectedRows"] > 0 && logres[0]["insertId"] > 0)
                        errorvalue.push({ msg: "purchaseorder Added Successfully", err_code: 0 })
                        await conn.commit();
                    } else {
                        errorvalue.push({ msg: "Please Try After Sometimes", err_code: 56 })
                        await conn.rollback();
                    }
                }
                if (data.utr_no != null && data.pay_type == 1) {
                    // var payment_date = data.payment_date.split("-").reverse().join("-");
                    var pricefields = {
                        "utr_no": data.utr_no,
                        "amount": data.amount_paid == "" ? 0 : data.amount_paid,
                        "adv_amount": data.advance_amt == "" ? 0 : data.advance_amt,
                        "payment_date": data.payment_date,
                        "count_amt": data.grand_count,
                        "vendor_service_id_fk": userSetting,
                        // "created_by": data.login_user_id,
                        "mail_status": 0,
                        "ctime": cdate
                    }
                    var poqry = "INSERT INTO invoice_payment_map SET ?";
                    let resb = await conn.query(poqry, pricefields)
                    if (resb[0]['affectedRows'] > 0 && resb[0]['insertId'] > 0) {
                        errorvalue.push({ msg: "invoicepayment Added Successfully", err_code: 0 })
                        await conn.commit();
                    } else {
                        errorvalue.push({ msg: "Please Try After Sometimes", err_code: 56 })
                        await conn.rollback();
                    }
                }
                if (data.inovice_status = 1) {
                    var invoicestats = 2
                    var qry = `UPDATE service_purchase_order SET inovice_status=${invoicestats},mtime=NOW(),updated_by=${jwt_data.user_id} WHERE serive_po_id_pk =${data.Ser_Po_id}`;
                    let udstas = await conn.query(qry)
                    if (udstas[0]['affectedRows'] > 0) {
                        let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='PURCHASEORDER INFO  UPDATED ID:${data.Ser_Po_id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
                        console.log(logQuery);
                        let logres = await conn.query(logQuery);
                        if (logres[0]["affectedRows"] > 0)
                        console.log("update invoice status Success");
                        errorvalue.push({ msg: "invoice updated", error_msg: 'ins', status: 0 });
                    } else {
                        console.log("Update  Status failed")
                        errorvalue.push({ msg: "invoice Failed", error_msg: 'invf', status: 48 });
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
        console.log('connection closed', errorvalue)
        return resolve(errorvalue);
    });
}

purchaseorder.post("/addvendorservicepo", /*schema.servicevendorposchema, schema.validate,*/ async (req, res) => {
    console.log(req.body);
    req.setTimeout(864000000);
    console.log('dhcbg---------', req.body);
    let result = await addvendorservicepo(req);
    console.log(result);
    res.end(JSON.stringify(result));
});

purchaseorder.post("/getservicelistpo", (req, res) => {
    let data = req.body;
    console.log("Data--", data);
    pool.getConnection((err, con) => {
        var sql, sqlquery = " SELECT tpm.service_indent_map_id,tsp.service_indent_id_fk,tsp.serive_po_id_pk,tpm.item_code,tpm.description,tpm.days,tpm.qty, " +
            " tpm.amountunit,tpm.countTaxableValue,tpm.uom,tpm.taxable_value,tpm.countCgst,tpm.countIgst,tpm.gst_per,tpm.gst_value,tpm.cgst_per,tpm.cgst_value,tpm.countamount,tpm.period_startdate,tpm.period_enddate, " +
            " tpm.sgst_per,tpm.count_basic_amt,tpm.sgst_value,tpm.others,tpm.countSgst,tpm.count_basic_amt,tpm.count_gstamt,tpm.grand_count, " +
            " tpm.count_gstamt " +
            " FROM service_indent_map AS tpm LEFT JOIN service_purchase_order AS tsp ON tsp.service_indent_id_fk = tpm.service_indent_id " +
            " LEFT JOIN service_indent AS tmi ON tmi.service_indent_id = tpm.service_indent_id ",
            sqlbus = " SELECT '' podetails,tsp.*, tum.username,tum.gst_no AS vendor_gst_no,tsi.process_type,tum.bank_name,tet.expensetype_id,tum.acount_name,tum.acount_name,tum.bank_branch,tum.acount_no,tum.ifsc_no,tet.expensetype_name,tsm.state_name,tmp.mept_name,tpm.countTaxableValue,tpm.countCgst,tpm.countSgst,tpm.grand_count, " +
                " countIgst,tpm.period_startdate,tpm.period_enddate,tpm.sgst_per,tpm.cgst_per,tpm.gst_per,tpm.count_basic_amt FROM service_purchase_order AS tsp " +
                " LEFT JOIN `vendor_user` AS tum ON tum.vuid= tsp.vendor_id_fk " +
                " LEFT JOIN `service_indent` AS tsi ON tsi.service_indent_id = tsp.service_indent_id_fk " +
                " LEFT JOIN  service_indent_map AS tpm ON tpm.service_indent_id = tsp.service_indent_id_fk " +
                " LEFT JOIN `expense_type` AS tet ON tet.expensetype_id = tsi.expensetype_id " +
                " LEFT JOIN `states` AS tsm ON tsm.id = tsi.circle_id " +
                " LEFT JOIN `maintenace_point` AS tmp ON tmp.maintenace_point_id = tsi.cluster_id ";
        data = req.body;
        // if (data.hasOwnProperty('service_indent_id') && data.service_indent_id) {
        //     sqlquery += ' WHERE tpm.service_indent_id = ' + data.service_indent_id;
        //     sqlbus += ' WHERE tpm.service_indent_id  = ' + data.service_indent_id;
        // }
        if (data.hasOwnProperty('service_id') && data.service_id) {
            sqlquery += ' where tsp.serive_po_id_pk = ' + data.service_id;
            sqlbus += ' where tsp.serive_po_id_pk  = ' + data.service_id;
        }
        console.log(sqlbus)
        console.log(sqlquery)
        sql = con.query(sqlbus, function (err, result1) {
            if (!err) {
                sql = con.query(sqlquery, function (err, result2) {
                    // console.log(sql.sql)
                    con.release();
                    if (!err) {
                        result1[0].podetails = result2;
                        res.end(JSON.stringify(result1[0]));
                    } else {
                        console.log(err);
                    }
                });
            } else {
                console.log("connection released")
                con.release();
            }
        });
    })
});



purchaseorder.post("/listpaytype", (req, res) => {
    let data = req.body;
    console.log("Data--", data);
    pool.getConnection((err, con) => {
        let sqlbus = `SELECT payment_type_id,payment_type FROM payment_type WHERE STATUS = 1`;
        if (data.like) {
            sqlbus += ` and  payment_type like '%${data.like}%'`
        }
        console.log("Query---", sqlbus);
        let sql = con.query(sqlbus, (err, result) => {
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

purchaseorder.post("/listregisterbank", (req, res) => {
    let data = req.body;
    console.log("Data--", data);
    pool.getConnection((err, con) => {
        let sqlbus = `SELECT register_bank,register_bank_id FROM register_bank WHERE STATUS = 1`;
        if (data.like) {
            sqlbus += ` and register_bank like '%${data.like}%'`
        }
        console.log("Query---", sqlbus);
        let sql = con.query(sqlbus, (err, result) => {
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

async function cancelinvoicepo(req, res) {
    return new Promise(async (resolve, reject) => {
        let data = req.body, conn, status = false, errorvalue = [];
        try {
            conn = await poolPromise.getConnection();
            await conn.beginTransaction();
            sqlvend = " SELECT tsp.*,tsp.vendor_name,tnm.nfa_id_pk,tnm.amount_utilized,tpm.count_basic_amt,tpm.grand_count,tsp.email,tsp.po_number FROM service_purchase_order AS tsp " +
                " LEFT JOIN `service_indent` AS tsi ON tsi.service_indent_id = tsp.service_indent_id_fk " +
                " LEFT JOIN service_indent_map AS tpm ON tpm.service_indent_id = tsp.service_indent_id_fk " +
                " LEFT JOIN `nfa_mas` AS tnm ON tnm.nfa_id_pk= tsi.nfa_id " +
                " LEFT JOIN `s` AS tsm ON tsm.id = tsi.circle_id WHERE serive_po_id_pk =" + data.renew_id_pk + "";
            console.log("vendor exists for vend", sqlvend)
            sqlvend = await conn.query(sqlvend)
            if (sqlvend[0][0].length != 0) {
                console.log(sqlvend[0][0], "ppppppp");
                var cancelId = sqlvend[0][0];
                errorvalue.push({ msg: "service po canceled successfully", err_code: 119 });
                await conn.rollback();
            }
            if (cancelId.nfa_id_pk != null) {
                var amount = Math.round((cancelId.amount_utilized - cancelId.count_basic_amt));
                console.log(amount, "++++++++");
                var balifields = [amount, cancelId.nfa_id_pk];
                var udcqry = "UPDATE nfa_mas SET `amount_utilized`=?, mtime=NOW() WHERE nfa_id_pk =? ";
                console.log(udcqry, "oooooooo");
                var canl = await conn.query(udcqry, balifields);
                if (canl[0]['affectedRows'] > 0) {
                    errorarray.push({ msg: "mail sent Successfully", error_msg: 0 });
                    console.log("LOG Successfully created");
                    await conn.commit();
                } else {
                    console.log("Failed to ADD Log.");
                    errorarray.push({ msg: "Failed to ADD Log.", error_msg: 'FAL' });
                    await conn.rollback();
                }
            }
            if (data.status == 1 || data.status != '') {
                var cancel = [ 2,data.cancel_reason,data.renew_id_pk ];
                var qryL = 'UPDATE service_purchase_order SET status=?,cancel_reason=?,mtime=NOW() WHERE serive_po_id_pk=?';
                console.log(qryL, "=====");
                let poqryy = await conn.query(qryL, cancel);
                console.log(poqryy[0], "++++++");
                if (poqryy[0]['affectedRows'] > 0) {
                    console.log("nfa updated");
                } else {
                    errorvalue.push({ msg: "Update Success", error_code: 'success' });
                    console.log('failed to update Ip status');
                    await conn.rollback();
                }
                // if (cancelId.status == 2) {
                // 	var sqldel = 'DELETE FROM veremaxpo.`service_indent` WHERE service_indent_id=' + DeletedId.service_indent_id;
                // 	console.log('Allowed vendor Delete Query', sqldel)
                // 	let resultde = await conn.query(sqldel);
                // 	if (resultde[0]['affectedRows'] > 0) {
                // 		console.log("Succesfully deleted data in service_indent table")
                // 		await conn.commit();
                // 	}
                // 	else {
                // 		status = true
                // 		errorvalue.push({ msg: " Failed to delete request ", error_msg: 'FTVT' });
                // 		console.log('sqldel', sqldel);
                // 		console.log('Failed to delete vendor table');
                // 		await conn.rollback();
                // 	}
                // }
            }
        }
        catch (e) {
            console.log("Catch Block Error", e);
            errorvalue.push({ msg: "Please try after sometimes", error_msg: "CONN" });
            await conn.rollback();
        }
        conn.release();
        return resolve(errorvalue)
    });
}


purchaseorder.post("/cancelinvoicepo", async (req, res) => {
    console.log(req.body)
    // const errors = validationResult(req);
    // console.log(errors);
    // if (!errors.isEmpty()) {
    // 	return res.status(422).json({
    // 		errors: errors.array(),
    // 	});
    req.setTimeout(864000000);
    // console.log('dhcbg---------', req.body);
    let result = await cancelinvoicepo(req);
    console.log(result);
    res.end(JSON.stringify(result));
});

purchaseorder.post("/listcancelpo", (req, res) => {
    let data = req.body; value = [], where = [],
        console.log("Data--", data);
    pool.getConnection( (err, con) => {
        let sqlbus = " SELECT tsp.*, tum.username,tsi.anaction_filename,tsm.state_mas_id,tet.expensetype_name,tsm.state_name,tmp.mept_name FROM service_purchase_order AS tsp " +
            " LEFT JOIN `vendor_user` AS tum ON tum.vuid= tsp.vendor_id_fk " +
            " LEFT JOIN `service_indent` AS tsi ON tsi.service_indent_id= tsp.service_indent_id_fk " +
            " LEFT JOIN `expense_type` AS tet ON tet.expensetype_id = tsi.expensetype_id " +
            " LEFT JOIN `states` AS tsm ON tsm.id= tsi.circle_id " +
            " LEFT JOIN `maintenace_point` AS tmp ON tmp.maintenace_point_id = tsi.cluster_id ",
            sqlqueryc = " SELECT COUNT(*) AS count FROM service_purchase_order AS tsp " +
                " LEFT JOIN `vendor_user` AS tum ON tum.vuid= tsp.vendor_id_fk " +
                " LEFT JOIN `service_indent` AS tsi ON tsi.service_indent_id= tsp.service_indent_id_fk " +
                " LEFT JOIN `expense_type` AS tet ON tet.expensetype_id = tsi.expensetype_id " +
                " LEFT JOIN `states` AS tsm ON tsm.id = tsi.circle_id " +
                " LEFT JOIN `maintenace_point` AS tmp ON tmp.maintenace_point_id = tsi.cluster_id ";
        where.push(" tsp.status in(" + 2 + ")");
        if (data.hasOwnProperty('vendor_name') && data.vendor_name) {
            where.push('tsp.vendor_name LIKE "%' + data.vendor_name + '%"');
            console.log(data.like, "like");
        }
        if (where.length > 0) {
            sqlbus += " where" + where.join(' AND ')
            sqlqueryc += " where " + where.join(' AND ')
        }
        if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
            sqlbus += ' ORDER BY tsp.po_date DESC ' + data.index + ', ' + data.limit;
        }
        console.log('Get Count Query :', sqlbus);
        pool.getConnection( (err, conn) => {
            if (err) {
                console.log('List employee Failed....')
                res.send(JSON.stringify('failed'));
            } else {
                sql = conn.query(sqlbus, function (err, result) {
                    value.push(result)
                    if (!err) {
                        sql = conn.query(sqlqueryc, function (err, result) {
                            conn.release();
                            if (!err) {
                                console.log('connection Closed.');
                                value.push(result[0]);
                                // console.log("List Deposit Result", value)
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
});


async function revisedpo(req, res) {
    return new Promise(async (resolve, reject) => {
        let data = req.body,conn, status = false,errorvalue = [];
        try {
            conn = await poolPromise.getConnection();
            await conn.beginTransaction();
            sqlvend = " SELECT tsp.*,tsp.vendor_name,tnm.nfa_id_pk,tnm.amount_utilized,tpm.count_basic_amt,tpm.grand_count,tsp.email,tsp.po_number FROM service_purchase_order AS tsp " +
                " LEFT JOIN `service_indent` AS tsi ON tsi.service_indent_id = tsp.service_indent_id_fk " +
                " LEFT JOIN service_indent_map AS tpm ON tpm.service_indent_id = tsp.service_indent_id_fk " +
                " LEFT JOIN `nfa_mas` AS tnm ON tnm.nfa_id_pk= tsi.nfa_id " +
                " LEFT JOIN `states` AS tsm ON tsm.id = tsi.circle_id WHERE serive_po_id_pk =" + data.renew_id + "";
            console.log("vendor exists for vend", sqlvend)
            sqlvend = await conn.query(sqlvend)
            if (sqlvend[0][0].length != 0) {
                console.log(sqlvend[0][0], "ppppppp");
                var reverseId = sqlvend[0][0];
                errorvalue.push({ msg: "service po Revised successfully", err_code: 119 });
                await conn.rollback();
            }
            if (data.service_indent_id != undefined || data.service_indent_id != '') {
                var qryre = `UPDATE service_indent SET service_po_rvd_id_fk=${data.renew_id},approval_status=4,approval_sts=6 WHERE service_indent_id =${data.service_indent_id}`;
                console.log(qryre, "=====");
                let poqryz = await conn.query(qryre);
                console.log(qryre[0], "++++++");
                if (poqryz[0]['affectedRows'] > 0) {
                    console.log("nfa updated")
                } else {
                    errorvalue.push({ msg: "Update Success", error_code: 'success' });
                    console.log('failed to update Ip status');
                    await conn.rollback();
                }
            }
            if (data.status == 1 || data.status != '') {
                var cancel = [
                    3,
                    data.revised_reason,
                    data.renew_id
                ];
                var qryL = 'UPDATE service_purchase_order SET status=?,revised_reason=?,mtime=NOW() WHERE serive_po_id_pk=?';
                console.log(qryL, "=====");
                let poqryy = await conn.query(qryL, cancel);
                console.log(poqryy[0], "++++++");
                if (poqryy[0]['affectedRows'] > 0) {
                    console.log("nfa updated")
                } else {
                    errorvalue.push({ msg: "Update Success", error_code: 'success' });
                    console.log('failed to update Ip status');
                    await conn.rollback();
                }
            }
            if (data.renew_id != null) {
                var amount = Math.round((reverseId.amount_utilized - reverseId.count_basic_amt));
                var balifields = [
                    amount,
                    data.renew_id
                ];
                var qrynfa = "UPDATE nfa_mas SET `amount_utilized`=?, mtime=NOW() WHERE nfa_id_pk =? ";
                console.log(qrynfa, "=====");
                let poqrn = await conn.query(qrynfa, balifields);
                console.log(poqrn[0], "++++++");
                if (poqrn[0]['affectedRows'] > 0) {
                    console.log("nfa updated")
                } else {
                    errorvalue.push({ msg: "Update Success", error_code: 'success' });
                    console.log('failed to update Ip status');
                    await conn.rollback();
                }
            }
        }
        catch (e) {
            console.log("Catch Block Error", e);
            errorvalue.push({ msg: "Please try after sometimes", error_msg: "CONN" });
            await conn.rollback();
        }
        conn.release();
        return resolve(errorvalue)
    });
}


purchaseorder.post("/revisedpo", async (req, res) => {
    console.log(req.body)
    // const errors = validationResult(req);
    // console.log(errors);
    // if (!errors.isEmpty()) {
    // 	return res.status(422).json({
    // 		errors: errors.array(),
    // 	});
    req.setTimeout(864000000);
    // console.log('dhcbg---------', req.body);
    let result = await revisedpo(req);
    console.log(result);
    res.end(JSON.stringify(result));
});

purchaseorder.post("/listrevisepo", (req, res) => {
    let data = req.body; value = [], where = [],
        console.log("Data--", data);
    pool.getConnection((err, con) => {
        let sqlbus = " SELECT tsp.*, tum.username,tsi.anaction_filename,tsm.state_mas_id,tet.expensetype_name,tsm.state_name,tmp.mept_name,IF(tsi.tax_type=1,tsim.countIgst,(tsim.countCgst+tsim.countSgst)) AS tax,tcm.client_short_form,tsc.service_category_name,tsim.grand_count,tsim.taxable_value,tcm.client_name,tsp.revised_reason FROM service_purchase_order AS tsp " +
            " LEFT JOIN `vendor_user` AS tum ON tum.vuid= tsp.vendor_id_fk " +
            " LEFT JOIN `service_indent` AS tsi ON tsi.service_indent_id= tsp.service_indent_id_fk " +
            " LEFT JOIN `expense_type` AS tet ON tet.expensetype_id = tsi.expensetype_id " +
            " LEFT JOIN `states` AS tsm ON tsm.id= tsi.circle_id " +
            " LEFT JOIN `maintenace_point` AS tmp ON tmp.maintenace_point_id = tsi.cluster_id " +
            " LEFT JOIN `service_indent_map` AS tsim ON tsim.service_indent_id = tsp.service_indent_id_fk " +
            " LEFT JOIN `client` AS tcm ON tcm.client_id = tsi.client_id " +
            " LEFT JOIN `service_category` AS tsc ON tsc.servicecat_id= tsi.servicecat_id ",
            sqlqueryc = " SELECT COUNT(*) AS count FROM service_purchase_order AS tsp " +
                " LEFT JOIN `vendor_user` AS tum ON tum.vuid= tsp.vendor_id_fk " +
                " LEFT JOIN `service_indent` AS tsi ON tsi.service_indent_id= tsp.service_indent_id_fk " +
                " LEFT JOIN `expense_type` AS tet ON tet.expensetype_id = tsi.expensetype_id " +
                " LEFT JOIN `states` AS tsm ON tsm.id = tsi.circle_id " +
                " LEFT JOIN `maintenace_point` AS tmp ON tmp.maintenace_point_id = tsi.cluster_id ";
        where.push(" tsp.status in(" + 3 + ")");
        if (data.hasOwnProperty('vendor_name') && data.vendor_name) {
            where.push('tsp.vendor_name LIKE "%' + data.vendor_name + '%"');
            console.log(data.like, "like");
        }
        if (where.length > 0) {
            sqlbus += " where" + where.join(' AND ')
            sqlqueryc += " where " + where.join(' AND ')
        }
        if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
            sqlbus += ' ORDER BY tsp.po_date DESC ' + data.index + ', ' + data.limit;
        }
        console.log('Get Count Query :', sqlbus);
        pool.getConnection(function (err, conn) {
            if (err) {
                console.log('List employee Failed....')
                res.send(JSON.stringify('failed'));
            } else {
                sql = conn.query(sqlbus, function (err, result) {
                    value.push(result)
                    if (!err) {
                        sql = conn.query(sqlqueryc, function (err, result) {
                            conn.release();
                            if (!err) {
                                console.log('connection Closed.');
                                value.push(result[0]);
                                // console.log("List Deposit Result", value)
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
});


purchaseorder.post('/listinvoiceservpo', function (req, res) {
    var data = req.body, where = [], value = [], condFor = "", sql, sqlqueryc,
        sqlqueryb = " Select tcm.client_short_form,tvs.* ,tpt.payment_type as payment_name,tbm.gst_no as gst_no,tsc.service_category_name,tcm.client_name,tmp.mept_name,tvs.period_startdate,SUM(ROUND(IFNULL(tipm.adv_amount,0), 2)) AS advamount,SUM(ROUND(IFNULL(tipm.amount,0), 2)) AS countcount,tvs.period_enddate,tet.expensetype_name,tum.username,IF(tvs.tax_type=1,tvs.gst_count,(tvs.sgst_count+tvs.cgst_count)) as tax,tum.gst_no as vendorgst_no, " +
            " tsm.name,tvs.invoice_no,tsp.vendor_name,tsp.po_number,tsp.po_date from vendor_servicepo as tvs " +
            " LEFT JOIN `service_purchase_order` AS tsp ON tvs.serive_po_id_fk = tsp.serive_po_id_pk " +
            " LEFT JOIN `vendor_user` AS tum ON tum.vuid= tvs.vendor_id_fk " +
            " LEFT JOIN `service_indent` AS tsi ON tsi.service_indent_id= tsp.service_indent_id_fk " +
            " LEFT JOIN `client` AS tcm ON tcm.client_id = tsi.client_id " +
            " LEFT JOIN `buyer_mas` AS tbm ON tbm.buyer_id = tsi.buyer_id " +
            " LEFT JOIN `service_category` AS tsc ON tsc.servicecat_id = tsi.servicecat_id " +
            " LEFT JOIN `expense_type` AS tet ON tet.expensetype_id = tsi.expensetype_id " +
            " LEFT JOIN `states` AS tsm ON tsm.id = tsi.circle_id " +
            " LEFT JOIN `maintenace_point` AS tmp ON tmp.maintenace_point_id = tsi.cluster_id " +
            " LEFT JOIN `invoice_payment_map` as tipm on tipm.vendor_service_id_fk = tvs.vendor_service_id_pk " +
            " LEFT JOIN `payment_type` AS tpt ON tpt.payment_type_id = tvs.payment_type where tvs.payment_type NOT IN(0) GROUP BY tvs.vendor_service_id_pk ORDER BY tvs.ctime DESC ",
        sqlqueryc = " SELECT COUNT(*) AS count FROM vendor_servicepo AS tvs " +
            " LEFT JOIN `service_purchase_order` AS tsp ON tvs.serive_po_id_fk = tsp.serive_po_id_pk " +
            " LEFT JOIN `vendor_user` AS tum ON tum.vuid= tvs.vendor_id_fk " +
            " LEFT JOIN `service_indent` AS tsi ON tsi.service_indent_id= tsp.service_indent_id_fk " +
            " LEFT JOIN `client` AS tcm ON tcm.client_id = tsi.client_id " +
            " LEFT JOIN `buyer_mas` AS tbm ON tbm.buyer_id = tsi.buyer_id " +
            " LEFT JOIN `service_category` AS tsc ON tsc.servicecat_id = tsi.servicecat_id " +
            " LEFT JOIN `expense_type` AS tet ON tet.expensetype_id = tsi.expensetype_id " +
            " LEFT JOIN `states` AS tsm ON tsm.id = tsi.circle_id " +
            " LEFT JOIN `maintenace_point` AS tmp ON tmp.maintenace_point_id = tsi.cluster_id WHERE tvs.payment_type NOT IN(1)";

    console.log('Get Count Query :', sqlqueryb);
    pool.getConnection( (err, conn) => {
        if (err) {
            console.log('List  Failed....')
            res.send(JSON.stringify('failed'));
        } else {
            sql = conn.query(sqlqueryb, function (err, result) {
                value.push(result)
                if (!err) {
                    sql = conn.query(sqlqueryc, function (err, result) {
                        conn.release();
                        if (!err) {
                            console.log('connection Closed.');
                            value.push(result[0]);
                            // console.log("List Deposit Result", value)
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

async function changepostatus(req, res) {
    return new Promise(async (resolve, reject) => {
        let data = req.body, cdate = new Date(), userSetting,errorvalue = [];
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                if (data.inovice_status = 2) {
                    var invoicestats = 1
                    var qry = `UPDATE service_purchase_order SET inovice_status = ${invoicestats}, mtime = NOW() WHERE serive_po_id_pk = ${data.Ser_Po_id} `;
                    let udstas = await conn.query(qry)
                    if (udstas[0]['affectedRows'] > 0) {
                        console.log("update invoice status Success");
                        errorvalue.push({ msg: "invoice updated", error_msg: 'ins', status: 0 });
                    } else {
                        console.log("Update  Status failed");
                        errorvalue.push({ msg: "invoice Failed", error_msg: 'invf', status: 48 });
                        await conn.rollback();
                    }
                }
                if (data.change_po_status == 0) {
                    var change_po_status = 1
                    var qryq = `UPDATE vendor_servicepo SET change_po_status = ${change_po_status}, mtime = NOW() WHERE vendor_service_id_pk = ${data.vend_Ser_Po_id} `;
                    let udstass = await conn.query(qryq)
                    if (udstass[0]['affectedRows'] > 0) {
                        console.log("update invoice status Success")
                        errorvalue.push({ msg: "invoice updated", error_msg: 'ins', status: 0 });
                    } else {
                        console.log("Update  Status failed")
                        errorvalue.push({ msg: "invoice Failed", error_msg: 'invf', status: 48 });
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
        console.log('connection closed', errorvalue)
        return resolve(errorvalue);
    });
}

purchaseorder.post("/changepostatus", /*schema.servicevendorposchema, schema.validate,*/ async (req, res) => {
    console.log(req.body);
    req.setTimeout(864000000);
    console.log('dhcbg---------', req.body);
    let result = await changepostatus(req);
    console.log(result);
    res.end(JSON.stringify(result));
});


async function addvendorchangservicepo(req, res) {
    return new Promise(async (resolve, reject) => {
        let data = req.body, cdate = new Date(), userSetting;
        errorvalue = [];
        if (data.pay_type == 1) {
            var approval_sts = 5;
        } else {
            var approval_sts = data.pay_type == 2 ? 5 : 1
        }
        let conn = await poolPromise.getConnection();
        if (conn) {
            await conn.beginTransaction();
            try {
                if (data.change_po_status == 2 || data.change_po_status != '') {
                    var change_po_status = [1];
                    var qryL = 'UPDATE vendor_servicepo SET change_po_status=?,mtime=NOW() WHERE vendor_service_id_pk IN(' + data.vend_Ser_Po_id + ')';
                    console.log(qryL, "=====");
                    let poqryy = await conn.query(qryL, change_po_status);
                    console.log(poqryy[0], "++++++");
                    if (poqryy[0]['affectedRows'] > 0) {
                        console.log("changevendoruser updated")
                    } else {
                        errorvalue.push({ msg: "Update Success", error_code: 'success' });
                        console.log('failed to update Ip status');
                        await conn.rollback();
                    }
                }
                console.log("add data", data);
                let sqlquery = `SELECT count(*) as countVendor from vendor_servicepo`;
                console.log('client query', sqlquery);
                let [[resp]] = await conn.query(sqlquery)
                let inc = autogenerate((resp.countVendor + 1), 8);
                let fr_no = ("FR" + (inc));
                console.log(fr_no, "++++++++");
                let sqlq = ` SELECT COUNT(*) a FROM veremaxpo.vendor_servicepo  WHERE fr_no='${fr_no}' `;
                let [[respon]] = await conn.query(sqlq)
                if (respon.a != 0) {
                    console.log("fr_no name exists");
                    errorvalue.push({ msg: "fr_no Already Exists", errorcode: 37 });
                    await conn.rollback();
                }
                else {
                    var ifields = {
                        "invoice_no": data.invoice_no,
                        "serive_po_id_fk": data.Ser_Po_id,
                        "expensetype_id_fk": data.expensetype,
                        "invoice_rcvddate": data.invoicereceived_date,
                        "invoice_date": data.invoice_date,
                        "period_startdate": data.period_startdate,
                        "period_enddate": data.period_enddate,
                        "srvperiod_startdate": data.service_startdate,
                        "srvperiod_enddate": data.service_enddate,
                        "inv_category": data.invoice_cat,
                        "fr_no": fr_no,
                        "reg_bank": data.reg_bank == undefined ? null : data.reg_bank,
                        "acount_name": data.beneficiary_name,
                        "bank_name": data.bank_name,
                        "bank_branch": data.bank_branch,
                        "acount_no": data.account_no,
                        "ifsc_no": data.ifsc_no,
                        "gst_sts": data.gst_status,
                        "remarks": data.remarks,
                        "tax_type": data.tax_type,
                        "count_basic_cost": data.countTaxableValue,
                        "gst_per": data.gst,
                        "gst_fill_date": data.gst_date,
                        "invoice_copy": data.invoice_copy_type,
                        "gst_count": data.gst_count,
                        "sgst_per": data.sgst,
                        "sgst_count": data.countSgst,
                        "cgst_per": data.cgst,
                        "cgst_count": data.countCgst,
                        "tds_per": data.TdsPer,
                        "tds_count": data.countTds,
                        "count_cost": data.grand_count,
                        "balance": data.balanceAmts,
                        "change_po_status": 0,
                        "invoice_copyfile": data.invoice_copy_filename,
                        "net_pay_aftrdeduct": data.netPayAfter,
                        "add_charge": data.additionalCharge,
                        "add_deduction": data.additionalDedution,
                        "add_gstdeduction": data.pocostDedution,
                        "received_by": data.receivedby,
                        "received_date": data.received_date,
                        "handover_by": data.handoverby,
                        "handover_date": data.handover_date,
                        "vendor_id_fk": data.vendor_id_fk,
                        "inv_remarks": data.invoice_remarks,
                        "unpaid_remarks": data.payment_remarks,
                        "payment_type": data.pay_type,
                        "paymentdate": data.payment_date,
                        "utr_no": data.utr_no,
                        "count_before_amts": data.countBeforeAmts,
                        "amount_paid": data.countAmtPaid == "" ? 0 : data.countAmtPaid,
                        "adv_amount": data.advance_amt == "" ? 0 : data.advance_amt,
                        "kilomtr_qty": data.kilometer == "" ? 0 : data.kilometer,
                        "kilomtr_rate": data.kilometer_rate == "" ? 0 : data.kilometer_rate,
                        "additional_km": data.count_kilometerValue == "" ? 0 : data.count_kilometerValue,
                        "paid_status": 1,
                        "add_charge_nogst": data.acNogst == "" ? 0 : data.acNogst,
                        "approval_sts": approval_sts,
                        // "basic3_count": data.basicAmt_three,
                        // "basic10_count": data.basicAmt_ten,
                        // "basicper_three ": data.basicPer_three,
                        // "basicper_ten": data.basicPer_ten,
                        "ctime": cdate,
                        // "approval_by": data.login_user_id,
                        //"created_by": data.login_user_id
                    };
                    console.log(data.Ser_Po_id, "-----------");
                    console.log(data, "++++++++++++");
                    let sqlinsert = `update vendor_servicepo set?`;
                    sqlinsert += ` where vendor_service_id_pk = ${data.vend_Ser_Po_id}`;
                    console.log('insert query', sqlinsert);
                    let result = await conn.query(sqlinsert, ifields)
                    console.log('result', result);
                    if (result[0]['affectedRows'] > 0) {
                        userSetting = result[0].insertId;
                        errorvalue.push({ msg: "purchaseorder Added Successfully", err_code: 0 })
                        await conn.commit();
                    } else {
                        errorvalue.push({ msg: "Please Try After Sometimes", err_code: 56 })
                        await conn.rollback();
                    }
                }
                if (data.utr_no != null && data.pay_type == 1) {
                    // var payment_date = data.payment_date.split("-").reverse().join("-");
                    var pricefields = {
                        "utr_no": data.utr_no,
                        "amount": data.amount_paid == "" ? 0 : data.amount_paid,
                        "adv_amount": data.advance_amt == "" ? 0 : data.advance_amt,
                        "payment_date": data.payment_date,
                        "count_amt": data.grand_count,
                        "vendor_service_id_fk": userSetting,
                        // "created_by": data.login_user_id,
                        "mail_status": 0,
                        "ctime": cdate
                    }
                    var poqry = "INSERT INTO invoice_payment_map SET ?";
                    let resb = await conn.query(poqry, pricefields)
                    if (resb[0]['affectedRows'] > 0 && resb[0]['insertId'] > 0) {
                        errorvalue.push({ msg: "invoicepayment Added Successfully", err_code: 0 })
                        await conn.commit();
                    } else {
                        errorvalue.push({ msg: "Please Try After Sometimes", err_code: 56 })
                        await conn.rollback();
                    }
                }
                if (data.inovice_status = 1) {
                    var invoicestats = 2
                    var qry = `UPDATE service_purchase_order SET inovice_status=${invoicestats},mtime=NOW() WHERE serive_po_id_pk =${data.Ser_Po_id}`;
                    let udstas = await conn.query(qry)
                    if (udstas[0]['affectedRows'] > 0) {
                        console.log("update invoice status Success")
                        errorvalue.push({ msg: "invoice updated", error_msg: 'ins', status: 0 });
                    } else {
                        console.log("Update  Status failed")
                        errorvalue.push({ msg: "invoice Failed", error_msg: 'invf', status: 48 });
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
        console.log('connection closed', errorvalue)
        return resolve(errorvalue);
    });
}

purchaseorder.post("/addvendorchangservicepo", /*schema.servicevendorposchema, schema.validate,*/ async (req, res) => {
    console.log(req.body)
    req.setTimeout(864000000);
    console.log('dhcbg---------', req.body);
    let result = await addvendorchangservicepo(req);
    console.log(result);
    res.end(JSON.stringify(result));
});


purchaseorder.post("/getservicelistpo", (req, res) => {
    let data = req.body;
    console.log("Data--", data);
    pool.getConnection( (err, con) => {
        var sql, sqlquery = " SELECT tpm.service_indent_map_id,tsp.service_indent_id_fk,tsp.serive_po_id_pk,tpm.item_code,tpm.description,tpm.days,tpm.qty, " +
            " tpm.amountunit,tpm.countTaxableValue,tpm.uom,tpm.taxable_value,tpm.countCgst,tpm.countIgst,tpm.gst_per,tpm.gst_value,tpm.cgst_per,tpm.cgst_value,tpm.countamount,tpm.period_startdate,tpm.period_enddate, " +
            " tpm.sgst_per,tpm.count_basic_amt,tpm.sgst_value,tpm.others,tpm.countSgst,tpm.count_basic_amt,tpm.count_gstamt,tpm.grand_count, " +
            " tpm.count_gstamt " +
            " FROM service_indent_map AS tpm LEFT JOIN service_purchase_order AS tsp ON tsp.service_indent_id_fk = tpm.service_indent_id " +
            " LEFT JOIN service_indent AS tmi ON tmi.service_indent_id = tpm.service_indent_id ",
            sqlbus = " SELECT '' podetails,tsp.*, tum.username,tum.gst_no AS vendor_gst_no,tsi.process_type,tum.bank_name,tet.expensetype_id,tum.acount_name,tum.acount_name,tum.bank_branch,tum.acount_no,tum.ifsc_no,tet.expensetype_name,tsm.state_name,tmp.mept_name,tpm.countTaxableValue,tpm.countCgst,tpm.countSgst,tpm.grand_count, " +
                " countIgst,tpm.period_startdate,tpm.period_enddate,tpm.sgst_per,tpm.cgst_per,tpm.gst_per,tpm.count_basic_amt FROM service_purchase_order AS tsp " +
                " LEFT JOIN `vendor_user` AS tum ON tum.vuid= tsp.vendor_id_fk " +
                " LEFT JOIN `service_indent` AS tsi ON tsi.service_indent_id = tsp.service_indent_id_fk " +
                " LEFT JOIN  service_indent_map AS tpm ON tpm.service_indent_id = tsp.service_indent_id_fk " +
                " LEFT JOIN `expense_type` AS tet ON tet.expensetype_id = tsi.expensetype_id " +
                " LEFT JOIN `states` AS tsm ON tsm.id = tsi.circle_id " +
                " LEFT JOIN `maintenace_point` AS tmp ON tmp.maintenace_point_id = tsi.cluster_id ";
        data = req.body;
        // if (data.hasOwnProperty('service_indent_id') && data.service_indent_id) {
        //     sqlquery += ' WHERE tpm.service_indent_id = ' + data.service_indent_id;
        //     sqlbus += ' WHERE tpm.service_indent_id  = ' + data.service_indent_id;
        // }
        if (data.hasOwnProperty('service_id') && data.service_id) {
            sqlquery += ' where tsp.serive_po_id_pk = ' + data.service_id;
            sqlbus += ' where tsp.serive_po_id_pk  = ' + data.service_id;
        }
        console.log(sqlbus)
        console.log(sqlquery)
        sql = con.query(sqlbus, function (err, result1) {
            if (!err) {
                sql = con.query(sqlquery, function (err, result2) {
                    // console.log(sql.sql)
                    con.release();
                    if (!err) {
                        result1[0].podetails = result2;
                        res.end(JSON.stringify(result1[0]));
                    } else {
                        console.log(err);
                    }
                });
            } else {
                console.log("connection released")
                con.release();
            }
        });
    })
});



const autogenerate = function (num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

module.exports = purchaseorder;