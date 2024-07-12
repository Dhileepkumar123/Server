'use strict'
const express = require('express'),
	vendorpo = express.Router(),
	schema = require('../schema/schema'),
	pool = require('../connection/connection'),
	poolPromise = require('../connection/connection').poolpromise;
const multer = require('multer');

vendorpo.post("/listvendorpo", (req, res) => {
	let data = req.body;
	console.log("Data--", data);
	pool.getConnection((err, con) => {
		let sqlbus = `SELECT cpo.*,cpo.po_uuid,cli.client_name,sta.name,um.uom_name FROM customer_po AS cpo 
		LEFT JOIN client AS cli ON cli.client_id = cpo.client_id
		LEFT JOIN states AS sta ON sta.id = cpo.circle_id
		LEFT JOIN unit_measure AS um ON um.um_id = cpo.unit_of_mnt_id`;
		if (data.customer_po_id) {
			// sqlbus += ' where id ='+ data.id +''
			sqlbus += ` where customer_po_id = ${data.customer_po_id}`;
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

vendorpo.post("/getallvendorDetail", (req, res) => {
	let data = req.body;
	console.log("Data--", data);
	// return;
	let sqlbuss = 'SELECT tum.username,tum.vuid,tum.vendor_name FROM vendor_site_map AS vs LEFT JOIN vendor_user AS tum ON tum.vuid = vs.vendor_id WHERE tum.role_id=444 AND tum.status=1 AND vs.state_id_="' + data.circle_name + '" GROUP BY vs.vendor_id'
	pool.getConnection((err, con) => {
		console.log("Query---", sqlbuss);
		let sqlg = con.query(sqlbuss, data.vuid, (err, result) => {
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

vendorpo.post("/getAllServiceVendor", (req, res) => {
	let data = req.body;
	console.log("Data--", data);
	// return;
	let sqlbuss = `SELECT email,gst_no,vuid,username,billing_address_one FROM vendor_user WHERE STATUS=1 AND vuid=${data.vuid}`;
	if (data.hasOwnProperty('vendor_name') && data.vendor_name) {
		sqlbuss += ' AND vuid = ' + data.vendor_name.vuid;
	}
	if (data.hasOwnProperty('like') && data.like != '') {
		// sqlquery += ' LIMIT 10 ';
	}
	pool.getConnection((err, con) => {
		console.log("Query---", sqlbuss);
		let sqlg = con.query(sqlbuss, data.vuid, (err, result) => {
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

async function addServiceIndent(req, res) {
	return new Promise(async (resolve, reject) => {
		let data = req.body, userSetting, status = false, errorarray = [], nfa_id_fk;
		errorvalue = [];
		if (data.nfa_id_fk != undefined) {
			nfa_id_fk = data.nfa_id_fk
		} else if (data.id != undefined) {
			nfa_id_fk = data.id;
		}
		var cdate = new Date();
		let conn = await poolPromise.getConnection();
		if (conn) {
			await conn.beginTransaction();
			try {
				if (data.id != undefined) {				// out scope
					var selqry = " SELECT tsi.po_type,tsi.process_type,tsi.subexpensetype_id,tsi.expensetype_id,tsi.client_id," +
						" tsi.circle_id,tsi.cluster_id,tsi.servicecat_id,tsi.buyer_id, " +
						" tsi.vendor_id,tsi.payment_terms,tsi.add_terms,tsi.approval_status,tsi.vendor_email, " +
						" tsi.address,tsi.shipment_address,tsi.cc_email,tsi.anaction_filename,tsi.service_po_rvd_id_fk," +
						" tsi.nfa_id,tsi.tax_type,tsi.ctime,tsi.mtime,tsi.created_by,tsi.updated_by,tsi.attachment_file, " +
						" tsi.approval_sts,tsi.remarks,tsi.tax_remarks,tsi.approval_by,tsi.gst_no, " +
						" SUM(ROUND(IFNULL(tsim.count_amt,0), 2)) AS countgstamt FROM service_indent AS tsi " +
						" LEFT JOIN  `service_indent_map` AS tsim ON tsim.`service_indent_id`=tsi.`service_indent_id` WHERE tsi.approval_status = 0 AND tsi.nfa_id =" + data.id;
					console.log(selqry, "+++++++++++++++++++");
					let vendorsel = await conn.query(selqry);
					// Check Length 
					console.log(vendorsel[0][0].countgstamt, "--------------------");
					//  return{};
					if ((data.nfa_balance - vendorsel[0][0].countgstamt) < data.count_basic) {
						errorarray.push({ msg: "BA Balance is Low " + (data.nfa_balance - vendorsel[0][0].countgstamt) + " ", status: 0 });
						console.log("UserID Not Exists ");
						await conn.rollback();
					}
				}
				var ifields = {							// common
					"po_type": data.calc_type,
					"process_type": data.process_type,
					"expensetype_id": data.expensetype,
					"subexpensetype_id": data.subexpensetype != undefined ? data.subexpensetype : 0,
					"client_id": data.customer,
					"circle_id": data.circle_name,
					"cluster_id": data.cluster,
					"servicecat_id": data.service_catg,
					"buyer_id": data.buyer,
					"vendor_id": data.vendor_name,
					"payment_terms": data.pay_terms,
					"add_terms": data.add_terms,
					"address": data.address,
					"vendor_email": data.vendor_email,
					"cc_email": data.cc_email,
					"anaction_filename": data.filename == "" ? null : data.filename,
					"service_po_rvd_id_fk": data.service_po_rvd_id_fk == undefined ? null : data.service_po_rvd_id_fk,
					"approval_status": 0,
					"nfa_id": nfa_id_fk == undefined ? null : nfa_id_fk,
					// "ctime": cdate,
					"gst_no": data.GST_NO,
					"approval_sts": data.process_type == 1 ? 4 : 4,
					"attachment_file": data.pofilename == "" ? null : data.pofilename,
					"tax_type": data.tax_type,
					"tax_remarks": data.tax_type == 2 ? data.tax_remarks : null,
					"shipment_address": data.shipment_address,
					"add_terms": data.pay_terms == 4 ? data.Addtional_terms : null
					// "created_by": data.login_user_id
				};
				console.log(ifields, "+++++++");
				let sqlins = "INSERT INTO service_indent SET ?";
				let result = await conn.query(sqlins, ifields);
				if (result[0]["affectedRows"] > 0 && result[0]["insertId"] > 0) {
					userSetting = result[0]["insertId"];
					// console.log(userSetting, "userSetting");
					errorvalue.push({ msg: "vendor po Added Successfully", err_code: 0, });
					await conn.commit();
				} else {
					errorvalue.push({ msg: "Please Try After Sometimes", err_code: 56 });
					await conn.rollback();
				}
				console.log('-------------------------', data.service_details.length);
				if (Object.keys(data.service_details[0]).length != 0) {
					var pricefields = [];
					for (var i = 0; i < data.service_details.length; i++) {
						let sd = data.service_details[i];
						console.log(i, 'Service Details :', sd);
						var period_startdate = sd.period_start;
						var period_enddate = sd.period_to;
						var amountunit = sd.amount_unit;
						var taxableValue = sd.taxableValue;
						var cgstvalue = Math.round(sd.cgst == undefined ? 0 : (sd.taxableValue * sd.cgst) / 100);
						var sgstvalue = Math.round(sd.sgst == undefined ? 0 : (sd.taxableValue * sd.sgst) / 100);
						var igstvalue = Math.round(sd.igst == undefined ? 0 : (sd.taxableValue * sd.igst) / 100);
						var countamount = Math.round(igstvalue + sgstvalue + cgstvalue + sd.taxableValue);
						//console.log(count_value,"sd.countsd.count")


						let qry = `INSERT INTO service_indent_map set service_indent_id =${userSetting},description ='${sd.description.toUpperCase()}',item_code='${sd.scn_code}',days=${sd.days},qty=${sd.quantity},uom='${sd.uom}',period_startdate='${period_startdate}',period_enddate ='${period_enddate}',
				 	count_gstamt=${countamount},amountunit=${amountunit},taxable_value=${taxableValue},countamount=${countamount},grand_count=${data.grandtotAmts},count_basic_amt=${data.countAmts},countTaxableValue=${data.countTaxableValue}`;
						if (sd.igst) {
							qry += ` ,gst_per =${sd.igst}`
						}
						if (igstvalue) {
							qry += ` ,gst_value=${igstvalue}`
						}
						if (cgstvalue) {
							qry += ` ,cgst_value=${cgstvalue}`
						}
						if (sd.cgst) {
							qry += ` ,cgst_per=${sd.cgst}`
						}
						if (sd.sgst) {
							qry += ` ,sgst_per=${sd.sgst}`
						}
						if (sgstvalue) {
							qry += ` ,sgst_value=${sgstvalue}`
						}
						if (data.countCgst) {
							qry += ` ,countCgst=${data.countCgst}`
						}
						if (data.countIgst) {
							qry += ` ,countIgst=${data.countIgst}`
						}
						if (data.countSgst) {
							qry += ` ,countSgst=${data.countSgst}`
						}
						let resp = await conn.query(qry);
						if (resp[0]['affectedRows'] > 0) {
							console.log("serviceindent map Success")
						} else {
							console.log("Failed to ADD ShareLog.");
							pricefields.push({ msg: "Failed to ADD Reseller.", error_msg: 'FAIL' });
							await conn.rollback();
						}
					}
				}
				var ifields = {
					"service_indent_id_fk": userSetting,
					"ctime": cdate
				};
				var udtqry = "INSERT INTO service_indent_req_approval SET ?";
				console.log("Log Query", udtqry)
				let resultM = await conn.query(udtqry, ifields);
				if (resultM[0]['affectedRows'] > 0) {
					userSetting = resultM.insertId;
					await conn.commit();
					console.log("service_indent_req_approval added successfully")
					errorvalue.push({ msg: "service_indent_req_approval ", error_msg: 0 });
				} else {
					errorvalue.push({ msg: "Internal Error.", error_msg: 'IER' });
					await conn.rollback();
				}
				var iifields = {
					"nfa_id_fk": nfa_id_fk,
					"status": 1,
					"service_indent_id_fk": data,
				}
				var insqry = 'INSERT INTO approval_history SET ?, ctime=NOW()';
				let resultq = await conn.query(insqry, iifields);
				if (resultq[0]['affectedRows'] > 0) {
					userSetting = resultq.insertId;
					await conn.commit();
					console.log("approval_history")
					errorvalue.push({ msg: "approval_history added successfully", error_msg: 0 });
				} else {
					errorvalue.push({ msg: "Internal Error.", error_msg: 'IER' });
					await conn.rollback();
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

vendorpo.post("/addServiceIndent", schema.vendorposchema, schema.validate, async (req, res) => {
	console.log(req.body)
	// const errors = validationResult(req);
	// console.log(errors);
	// if (!errors.isEmpty()) {
	// 	return res.status(422).json({
	// 		errors: errors.array(),
	// 	});

	req.setTimeout(864000000);
	// console.log('dhcbg---------', req.body);
	let result = await addServiceIndent(req);
	console.log(result);
	res.end(JSON.stringify(result));
});

async function addServiceIndentrevisedpo(req, res) {
	return new Promise(async (resolve, reject) => {
		let data = req.body, userSetting, status = false, errorarray = [], nfa_id_fk;
		errorvalue = [];
		if (data.nfa_id_fk != undefined) {
			nfa_id_fk = data.nfa_id_fk
		} else if (data.id != undefined) {
			nfa_id_fk = data.id;
		}
		var cdate = new Date();
		let conn = await poolPromise.getConnection();
		if (conn) {
			await conn.beginTransaction();
			try {
				let tot = data.service_indent_id
				sqlvend = 'SELECT * FROM veremaxpo.`service_indent` WHERE service_indent_id=' + data.service_indent_id + '';
				console.log("vendor exists for vend", sqlvend)
				sqlvend = await conn.query(sqlvend)
				if (sqlvend[0][0].length != 0) {
					console.log(sqlvend[0][0], "ppppppp");
					addid = sqlvend[0][0];
					console.log(addid, "+++");
					errorvalue.push({ msg: "service request revised successfully", err_code: 119 });
					await conn.rollback();
				}
				if (addid.approval_status == 4) {
					console.log(data.approval_status, "-------");
					var qryre = `UPDATE service_indent SET approval_status = 3  WHERE service_indent_id =${addid.service_indent_id}`;
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
				var ifields = {							// common
					"po_type": addid.po_type,
					"process_type": addid.process_type,
					"expensetype_id": addid.expensetype_id,
					"subexpensetype_id": addid.subexpensetype_id != undefined ? addid.subexpensetype_id : 0,
					"client_id": addid.client_id,
					"circle_id": addid.circle_id,
					"cluster_id": addid.cluster_id,
					"servicecat_id": addid.servicecat_id,
					"buyer_id": addid.buyer_id,
					"vendor_id": addid.vendor_id,
					"payment_terms": addid.payment_terms,
					"add_terms": addid.add_terms,
					"address": addid.address,
					"vendor_email": addid.vendor_email,
					"cc_email": addid.cc_email,
					"anaction_filename": addid.filename == "" ? null : addid.filename,
					"service_po_rvd_id_fk": addid.service_po_rvd_id_fk == undefined ? null : addid.service_po_rvd_id_fk,
					"approval_status": 0,
					"nfa_id": nfa_id_fk == undefined ? null : nfa_id_fk,
					// "ctime": cdate,
					"gst_no": addid.gst_no,
					"approval_sts": addid.process_type == 1 ? 4 : addid.process_type == 2 ? 4 : 4,
					"attachment_file": addid.attachment_file == "" ? null : addid.attachment_file,
					"tax_type": addid.tax_type,
					"tax_remarks": addid.tax_type == 2 ? addid.tax_remarks : null,
					"shipment_address": addid.shipment_address,
					"add_terms": addid.pay_terms == 4 ? addid.Addtional_terms : null
					// "created_by": addid.login_user_id
				}; console.log();
				console.log(ifields, "+++++++");
				let sqlins = " UPDATE service_indent SET?";
				sqlins += ` where service_indent_id= ${data.service_indent_id}`;
				let result = await conn.query(sqlins, ifields);
				if (result[0]["affectedRows"] > 0) {
					// console.log(userSetting, "userSetting");
					errorvalue.push({ msg: "vendor po Added Successfully", err_code: 0, });
					await conn.commit();
				} else {
					errorvalue.push({ msg: "Please Try After Sometimes", err_code: 56 });
					await conn.rollback();
				}
				console.log('-------------------------', data.service_details.length);
				if (Object.keys(data.service_details[0]).length != 0) {
					var qry = "delete from service_indent_map where service_indent_id=" + data.service_indent_id;
					let qqq = await conn.query(qry);
					if (qqq[0]['affectedRows'] > 0) {
						console.log("Mat_data", data.service_details)
						for (var i = 0; i < data.service_details.length; i++) {
							let sd = data.service_details[i];
							console.log(i, 'Service Details :', sd);
							var period_startdate = sd.period_start;
							var period_enddate = sd.period_to;
							var amountunit = sd.amount_unit;
							var taxableValue = sd.taxableValue;
							var cgstvalue = Math.round(sd.cgst == undefined ? 0 : (sd.taxableValue * sd.cgst) / 100);
							var sgstvalue = Math.round(sd.sgst == undefined ? 0 : (sd.taxableValue * sd.sgst) / 100);
							var igstvalue = Math.round(sd.igst == undefined ? 0 : (sd.taxableValue * sd.igst) / 100);
							var countamount = Math.round(igstvalue + sgstvalue + cgstvalue + sd.taxableValue);
							//console.log(count_value,"sd.countsd.count")
							let qry = `INSERT INTO service_indent_map set service_indent_id =${data.service_indent_id},description ='${sd.description.toUpperCase()}',item_code='${sd.scn_code}',days=${sd.days},qty=${sd.quantity},uom='${sd.uom}',period_startdate='${period_startdate}',period_enddate ='${period_enddate}',
						 count_gstamt=${countamount},amountunit=${amountunit},taxable_value=${taxableValue},countamount=${countamount},grand_count=${data.grandtotAmts},count_basic_amt=${data.countAmts},countTaxableValue=${data.countTaxableValue}`;
							if (sd.igst) {
								qry += ` ,gst_per =${sd.igst}`
							}
							if (igstvalue) {
								qry += ` ,gst_value=${igstvalue}`
							}
							if (cgstvalue) {
								qry += ` ,cgst_value=${cgstvalue}`
							}
							if (sd.cgst) {
								qry += ` ,cgst_per=${sd.cgst}`
							}
							if (sd.sgst) {
								qry += ` ,sgst_per=${sd.sgst}`
							}
							if (sgstvalue) {
								qry += ` ,sgst_value=${sgstvalue}`
							}
							if (data.countCgst) {
								qry += ` ,countCgst=${data.countCgst}`
							}
							if (data.countIgst) {
								qry += ` ,countIgst=${data.countIgst}`
							}
							if (data.countSgst) {
								qry += ` ,countSgst=${data.countSgst}`
							}
							let resp = await conn.query(qry);
							if (resp[0]['affectedRows'] > 0) {
								console.log("serviceindent map Success");
							} else {
								console.log("Failed to ADD ShareLog.");
								errorvalue.push({ msg: "Failed to ADD Reseller.", error_msg: 'FAIL' });
								await conn.rollback();
							} {
								errorvalue.push({ msg: " failed to delete material details", error_msg: 'FTDM' });
								console.log("qry", qry)
								await conn.rollback();
								console.log('failed to delete material details');
							}

						}
					}
				}
				if (data.appl_status != undefined) {
					var insqry = 'INSERT INTO approval_history SET ?, ctime=NOW()';
					var iifields = {
						"service_indent_id_fk": data.service_indent_id,
						"status": data.appl_status,
						"notes": data.reason

					}
					let resf = await conn.query(insqry, iifields);
					if (resf[0]["affectedRows"] > 0 && resf[0]["insertId"] > 0) {
						userSetting = resf[0]["insertId"];
						console.log("appl_status updated successfully");
					} else {
						errorvalue.push({ msg: "Update Failed", error_code: "FAIL" });
						await conn.rollback();
						console.log("failed to update approval status");
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

vendorpo.post("/addServiceIndentrevisedpo", /*schema.vendorposchema, schema.validate,*/ async (req, res) => {
	console.log(req.body)
	// const errors = validationResult(req);
	// console.log(errors);
	// if (!errors.isEmpty()) {
	// 	return res.status(422).json({
	// 		errors: errors.array(),
	// 	});
	req.setTimeout(864000000);
	// console.log('dhcbg---------', req.body);
	let result = await addServiceIndentrevisedpo(req);
	console.log(result);
	res.end(JSON.stringify(result));
});

vendorpo.post('/listserviceindent', function (req, res) {
	let data = req.body, where = [], value = [], sql,
		sqlqueryb = `SELECT tcm.client_short_form,tpm.grand_count,tsm.state_code,tpm.count_basic_amt AS po_amount_basic,IF(tmi.tax_type=1,tpm.countIgst,(tpm.countCgst+tpm.countSgst)) tax,
		CONCAT(tum.firstname) AS approved_user ,CONCAT(tum.firstname) AS createdby,tmi.*,tet.expensetype_name,tpm.period_startdate,
		tcm.client_name,tsm.name,tmi.nfa_id,tmp.mept_name,tsc.service_category_name,tum.vendor_name,tpm.taxable_value,
		tpm.countTaxableValue FROM service_indent AS tmi
			LEFT JOIN service_indent_map AS tpm ON tpm.service_indent_id = tmi.service_indent_id 
			LEFT JOIN expense_type AS tet ON tet.expensetype_id = tmi.expensetype_id 
			LEFT JOIN client AS tcm ON tcm.client_id = tmi.client_id 
			LEFT JOIN states AS tsm ON tsm.id = tmi.circle_id 
			LEFT JOIN maintenace_point AS tmp ON tmp.maintenace_point_id = tmi.cluster_id 
			LEFT JOIN service_category AS tsc ON tsc.servicecat_id= tmi.servicecat_id 
			LEFT JOIN vendor_user AS tum ON tum.vuid= tmi.vendor_id  WHERE tmi.approval_status IN(0,4) GROUP BY service_indent_id DESC`;
	let sqlqueryc = " SELECT count(*) as count FROM service_indent AS tmi where approval_status= 0 ";

	if (data.hasOwnProperty('vendor_name') && data.vendor_name) {
		where.push(" vendor_name LIKE '%" + data.vendor_name + "%'");
	}
	if (data.hasOwnProperty('expensetype_name') && data.expense_type) {
		where.push(' tet.expensetype_name LIKE "%' + data.expense_type + '%"');
	}
	if (data.hasOwnProperty('mept_name') && data.mept) {
		where.push(" tmp.mept_name LIKE '%" + data.mept + "%'");
	}
	if (data.hasOwnProperty('period_startdate') && data.period_startdate) {
		where.push(" tpm.period_startdate LIKE '%" + data.period_startdate + "%'");
	}
	if (where.length > 0) {
		sqlqueryb += " where" + where.join(' AND ')
		sqlqueryc += " where " + where.join(' AND ')
	}
	// if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
	// 	sqlqueryb += ' ORDER BY service_indent_id DESC LIMIT ' + data.index + ', ' + data.limit;
	// }
	console.log('Get Count Query :', sqlqueryb);
	pool.getConnection((err, conn) => {
		if (err) {
			console.log('List employeeclaim Failed....')
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

vendorpo.post('/getvendorpoEdit', function (req, res) {
	pool.getConnection((err, conn) => {
		if (!err) {
			console.log("GET EDIT", req.body)
			var sql, sqlquery = " SELECT tm_map.service_indent_map_id,tmi.service_indent_id,tm_map.item_code,tm_map.description,tm_map.days,tm_map.qty, " +
				" tm_map.amountunit,tm_map.uom,tm_map.countTaxableValue,tm_map.countCgst,tm_map.countIgst,tm_map.gst_per,tm_map.gst_value,tm_map.cgst_per,tm_map.cgst_value,tm_map.countamount, " +
				" tm_map.sgst_per,tm_map.sgst_value,tm_map.period_startdate,tm_map.period_enddate,tm_map.taxable_value,tm_map.others " +
				" FROM service_indent AS tmi " +
				" LEFT JOIN service_indent_map AS tm_map ON tm_map.service_indent_id = tmi.service_indent_id ",
				sqlqu = " SELECT '' sdetails,tmi.service_indent_id,tmi.po_type,tmi.`process_type`,tmi.`subexpensetype_id`,tmi.`expensetype_id`,tmi.`client_id`,tmi.`circle_id`,tmi.`cluster_id`, " +
					" tmi.`servicecat_id`,tmi.`buyer_id`,tmi.`vendor_id`,tmi.`payment_terms`,tmi.`add_terms`,tmi.`approval_status`, " +
					" tmi.`vendor_email`,tmi.`address`,tmi.`shipment_address`,tmi.`cc_email`,tmi.`anaction_filename`,tmi.`service_po_rvd_id_fk`, " +
					" tmi.`nfa_id`,tmi.`tax_type`,DATE_FORMAT(tmi.ctime,'%d-%m-%Y') AS `ctime`,tmi.`mtime`,tmi.`created_by`,tmi.`updated_by`,tmi.`attachment_file`,tmi.`approval_sts`, " +
					" tmi.`remarks`,tmi.`tax_remarks`,tmi.`approval_by`,tmi.`gst_no`,tet.expensetype_name,tpt.payment_terms_id,tum.gst_no,tum.email,tsm.state_code,tcm.client_name,tpm.grand_count,tpm.countTaxableValue,tpm.countCgst,tpm.countIgst,tpm.countSgst,tpm.count_basic_amt,tsm.state_name,tmp.mept_name,tsc.service_category_name,tum.vendor_name,tum.username,tum.contact_person_name,tum.mobile,tum.email,tum.billing_address_one FROM service_indent AS tmi " +
					" LEFT JOIN service_indent_map AS tpm ON tpm.service_indent_id = tmi.service_indent_id " +
					" LEFT JOIN `expense_type` AS tet ON tet.expensetype_id = tmi.expensetype_id " +
					" LEFT JOIN `client` AS tcm ON tcm.client_id = tmi.client_id " +
					" LEFT JOIN `states` AS tsm ON tsm.id = tmi.circle_id " +
					" LEFT JOIN `maintenace_point` AS tmp ON tmp.maintenace_point_id = tmi.cluster_id " +
					" LEFT JOIN `service_category` AS tsc ON tsc.servicecat_id= tmi.servicecat_id " +
					" LEFT JOIN `vendor_user` AS tum ON tum.vuid= tmi.vendor_id " +
					" LEFT JOIN `buyer` AS tbm ON tbm.buyer_id= tmi.buyer_id " +
					" LEFT JOIN `payment_terms` AS tpt ON tpt.payment_term= tmi.payment_terms ", finalresult = [],
				data = req.body;
			if (data.hasOwnProperty('service_indent_id') && data.service_indent_id) {
				sqlquery += ' WHERE tmi.service_indent_id = ' + data.service_indent_id;
				sqlqu += ' WHERE tmi.service_indent_id  = ' + data.service_indent_id;
			}
			console.log(sqlqu)
			console.log(sqlquery)
			sql = conn.query(sqlqu, function (err, result1) {
				if (!err) {
					sql = conn.query(sqlquery, function (err, result2) {
						// console.log(sql.sql)
						conn.release();
						if (!err) {
							result1[0].sdetails = result2;
							res.end(JSON.stringify(result1[0]));
						} else {
							console.log(err);
						}
					});
				} else {
					console.log("connection released")
					conn.release();
				}
			});
		}
	});
});

async function UpdateServiceIndent(req, res) {
	return new Promise(async (resolve, reject) => {
		var data = req.body, errorvalue = [], pwdField = "";
		var period_enddate = data.period_enddate;
		var period_startdate = data.period_startdate;
		var cdate = new Date();
		if (data.appl_status != undefined) {
			var pwdField = "approval_sts='" + data.appl_status + "',";
		}
		var userSetting;
		var ifields = [
			data.process_type,
			data.expensetype,
			data.customer,
			data.circle_name,
			data.cluster,
			data.service_catg,
			data.buyer,
			data.vendor_name,
			data.pay_terms,
			data.address,
			data.add_terms,
			data.cc_email,
			data.vendor_email,
			data.reason,
			data.filename == undefined ? data.anaction_filename : data.filename,
			data.service_indent_id
		];
		try {
			conn = await poolPromise.getConnection();
			await conn.beginTransaction();
			console.log("update", data);
			let sqlqv = "UPDATE service_indent SET " + pwdField + " `process_type`=?,`expensetype_id`=? ,`client_id`=? ,`circle_id`=?, `cluster_id`=?,`servicecat_id`=?,`buyer_id`=?, `vendor_id`=?,`payment_terms`=?,`address`=?,`add_terms`=?,`cc_email`=?,`vendor_email`=?,`remarks`=?, `anaction_filename`=?, mtime=NOW() WHERE service_indent_id =? ";
			console.log("project query", sqlqv);
			let resp = await conn.query(sqlqv, ifields);
			console.log("result", resp);
			if (resp[0]["affectedRows"] > 0) {
				errorvalue.push({
					msg: "vendorpo updated Successfully",
					err_code: 0,
				});
				await conn.commit();
			} else {
				errorvalue.push({
					msg: "Please Try After Sometimes",
					err_code: 135,
				});
				await conn.rollback();
			}
			if (Object.keys(data.service_details[0]).length != 0) {
				var qry = "delete from service_indent_map where service_indent_id=" + data.service_indent_id;
				let qqq = await conn.query(qry);
				if (qqq[0]['affectedRows'] > 0) {
					console.log("Mat_data", data.service_details)
					for (var i = 0; i < data.service_details.length; i++) {
						let sd = data.service_details[i];
						console.log(i, 'Service Details :', sd);
						var period_startdate = sd.period_start;
						var period_enddate = sd.period_to;
						var amountunit = sd.amount_unit;
						var taxableValue = sd.taxableValue;
						var cgstvalue = Math.round(sd.cgst == undefined ? 0 : (sd.taxableValue * sd.cgst) / 100);
						var sgstvalue = Math.round(sd.sgst == undefined ? 0 : (sd.taxableValue * sd.sgst) / 100);
						var igstvalue = Math.round(sd.igst == undefined ? 0 : (sd.taxableValue * sd.igst) / 100);
						var countamount = Math.round(igstvalue + sgstvalue + cgstvalue + sd.taxableValue);
						//console.log(count_value,"sd.countsd.count")
						let qry = `INSERT INTO service_indent_map set service_indent_id =${data.service_indent_id},description ='${sd.description.toUpperCase()}',item_code='${sd.scn_code}',days=${sd.days},qty=${sd.quantity},uom='${sd.uom}',period_startdate='${period_startdate}',period_enddate ='${period_enddate}',
				 	count_gstamt=${countamount},amountunit=${amountunit},taxable_value=${taxableValue},countamount=${countamount},grand_count=${data.grandtotAmts},count_basic_amt=${data.countAmts},countTaxableValue=${data.countTaxableValue}`;
						if (sd.igst) {
							qry += ` ,gst_per =${sd.igst}`
						}
						if (igstvalue) {
							qry += ` ,gst_value=${igstvalue}`
						}
						if (cgstvalue) {
							qry += ` ,cgst_value=${cgstvalue}`
						}
						if (sd.cgst) {
							qry += ` ,cgst_per=${sd.cgst}`
						}
						if (sd.sgst) {
							qry += ` ,sgst_per=${sd.sgst}`
						}
						if (sgstvalue) {
							qry += ` ,sgst_value=${sgstvalue}`
						}
						if (data.countCgst) {
							qry += ` ,countCgst=${data.countCgst}`
						}
						if (data.countIgst) {
							qry += ` ,countIgst=${data.countIgst}`
						}
						if (data.countSgst) {
							qry += ` ,countSgst=${data.countSgst}`
						}
						let resp = await conn.query(qry);
						if (resp[0]['affectedRows'] > 0) {
							console.log("serviceindent map Success");
						} else {
							console.log("Failed to ADD ShareLog.");
							errorvalue.push({ msg: "Failed to ADD Reseller.", error_msg: 'FAIL' });
							await conn.rollback();
						} {
							errorvalue.push({ msg: " failed to delete material details", error_msg: 'FTDM' });
							console.log("qry", qry)
							await conn.rollback();
							console.log('failed to delete material details');
						}

					}
				}
			}
			if (data.appl_status != undefined) {
				var insqry = 'INSERT INTO approval_history SET ?, ctime=NOW()';
				var iifields = {
					"service_indent_id_fk": data.service_indent_id,
					"status": data.appl_status,
					"notes": data.reason

				}
				let resf = await conn.query(insqry, iifields);
				if (resf[0]["affectedRows"] > 0 && resf[0]["insertId"] > 0) {
					userSetting = resf[0]["insertId"];
					console.log("appl_status updated successfully");
				} else {
					errorvalue.push({ msg: "Update Failed", error_code: "FAIL" });
					await conn.rollback();
					console.log("failed to update approval status");
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

vendorpo.post('/updateserviceindent', schema.vendorposchema, schema.validate, async (req, res) => {
	console.log('Inside update service indent');
	req.setTimeout(864000000);
	// console.log('result----', req.body);
	let result = await UpdateServiceIndent(req);
	console.log("Process Completed For update service_indent", result);
	res.end(JSON.stringify(result));
});

vendorpo.post('/servicepoinvoiceDetail', function (req, res) {
	pool.getConnection((err, conn) => {
		if (!err) {
			console.log("GET EDIT", req.body)
			var sql, sqlquery = " SELECT tm_map.service_indent_map_id,tmi.service_indent_id,tm_map.item_code,tm_map.description,tm_map.days,tm_map.qty, " +
				" tm_map.amountunit,tm_map.uom,tm_map.countTaxableValue,tm_map.countCgst,tm_map.countIgst,tm_map.gst_per,tm_map.gst_value,tm_map.cgst_per,tm_map.cgst_value,tm_map.countamount,(DATE_FORMAT(tm_map.period_startdate,'%d-%m-%Y')) as period_startdate,(DATE_FORMAT(tm_map.period_enddate,'%d-%m-%Y')) as period_enddate, " +
				" tm_map.sgst_per,tm_map.sgst_value,tm_map.taxable_value,tm_map.others " +
				" FROM service_indent AS tmi " +
				" LEFT JOIN service_indent_map AS tm_map ON tm_map.service_indent_id = tmi.service_indent_id ",

				sqlqu = "SELECT '' sdetails,tmi.service_indent_id,tmi.po_type,tmi.`process_type`,tmi.`subexpensetype_id`,tmi.`expensetype_id`,tmi.`client_id`,tmi.`circle_id`,tmi.`cluster_id`, " +
					" tmi.`servicecat_id`,tmi.`buyer_id`,tmi.`vendor_id`,tmi.`payment_terms`,tmi.`add_terms`,tmi.`approval_status`,tpt.payment_term, " +
					" tmi.`vendor_email`,tmi.`address`,tmi.`shipment_address`,tmi.`cc_email`,tmi.`anaction_filename`,tmi.`service_po_rvd_id_fk`, " +
					" tmi.`nfa_id`,tmi.`tax_type`,DATE_FORMAT(tmi.ctime,'%d-%m-%Y') AS `ctime`,tmi.`mtime`,tmi.`created_by`,tmi.`updated_by`,tmi.`attachment_file`,tmi.`approval_sts`, " +
					" tmi.`remarks`,tmi.`tax_remarks`,tmi.`approval_by`,tmi.`gst_no`,tet.expensetype_name,tum.gst_no,tsm.state_code,tcm.client_name,tpm.grand_count,tpm.countTaxableValue,tpm.countCgst,tpm.countIgst,tpm.countSgst,tpm.count_basic_amt,tsm.state_name,tmp.mept_name,tsc.service_category_name,tum.vendor_name,tum.username,tum.contact_person_name,tum.mobile,tum.email,tum.billing_address_one,tpm.period_startdate,tpm.period_enddate,tum.pan_no,tbm.pan_no as buy_pan_no,tbm.gst_no as buy_gst_no,tum.gst_no,tbm.register_address,tbm.shipment_address as ship_address,tet.expensetype_name,tbm.company_name as company_name,tcm.client_name,tsm.state_name,tmp.mept_name,tsc.service_category_name,tum.username,tum.contact_person_name,tum.mobile FROM service_indent AS tmi " +
					" LEFT JOIN service_indent_map AS tpm ON tpm.service_indent_id = tmi.service_indent_id " +
					" LEFT JOIN `expense_type` AS tet ON tet.expensetype_id = tmi.expensetype_id " +
					" LEFT JOIN `client` AS tcm ON tcm.client_id = tmi.client_id " +
					" LEFT JOIN `states` AS tsm ON tsm.id = tmi.circle_id " +
					" LEFT JOIN `maintenace_point` AS tmp ON tmp.maintenace_point_id = tmi.cluster_id " +
					" LEFT JOIN `service_category` AS tsc ON tsc.servicecat_id= tmi.servicecat_id " +
					" LEFT JOIN `vendor_user` AS tum ON tum.vuid= tmi.vendor_id " +
					" LEFT JOIN `buyer` AS tbm ON tbm.buyer_id= tmi.buyer_id " +
					" LEFT JOIN `payment_terms` AS tpt ON tpt.payment_terms_id= tmi.payment_terms ", finalresult = [],
				data = req.body;
			if (data.hasOwnProperty('service_indent_id') && data.service_indent_id) {
				sqlquery += ' WHERE tmi.service_indent_id = ' + data.service_indent_id;
				sqlqu += ' WHERE tmi.service_indent_id  = ' + data.service_indent_id;
			}
			console.log(sqlqu)
			console.log(sqlquery)
			sql = conn.query(sqlqu, function (err, result1) {
				if (!err) {
					sql = conn.query(sqlquery, function (err, result2) {
						// console.log(sql.sql)
						conn.release();
						if (!err) {
							result1[0].sdetails = result2;
							res.end(JSON.stringify(result1[0]));
						} else {
							console.log(err);
						}
					});
				} else {
					conn.release();
					console.log("connection released")
				}
			});
		}
	});
});

async function serviceindentRqstApprove(req, res) {
	return new Promise(async (resolve, reject) => {
		let data = req.body, errorvalue = [], postatus = false, status = false;
		let conn = await poolPromise.getConnection();
		if (conn) {
			console.log('Data ===', data);
			console.log('Data create_type===', data.srvid);
			for (var i = 0; (i < data.srvid.length); i++) {
				await conn.beginTransaction();
				try {
					let tot = data.srvid[i];
					var qrty = " SELECT tmi.*,tet.expensetype_name,CONCAT(tumb.firstname,'',tumb.lastname) AS appovedby_user,tuum.email AS tomail,tnm.amount_utilized,tmi.po_type,tsp.serive_po_id_pk,tpt.payment_term,tmi.add_terms,tmi.anaction_filename,tpm.gst_per,tpm.countIgst,tpm.cgst_per,tpm.countCgst,tpm.count_gstamt,tpm.sgst_per,tpm.countSgst,tum.pan_no,tmi.cc_email,tmi.vendor_email,tbm.shipment_address AS ship_address,tbm.company_name AS company_name,tbm.pan_no AS buy_pan_no,tbm.gst_no AS buy_gst_no,tbm.register_address,tum.gst_no,tsm.state_code,DATE_FORMAT(tmi.ctime, '%d-%m-%Y') AS `ctime`,DATE_FORMAT(tmi.mtime, '%d-%m-%Y') AS `mtime`,tcm.client_name,tcm.client_short_form,tpm.item_code,tpm.description,tpm.qty,tpm.grand_count,tpm.taxable_value,tpm.uom,tpm.count_basic_amt,DATE_FORMAT(tpm.period_startdate,'%d-%m-%Y') AS `startdate`,DATE_FORMAT(tpm.period_enddate,'%d-%m-%Y') AS `enddate`,tpm.countamount,tsm.state_name,tmp.mept_name,tsc.service_category_name,tum.vendor_name,tum.username,tum.contact_person_name,tum.mobile,tum.email,tum.billing_address_one,tum.bank_name,tum.acount_name,tum.username,tum.gst_no,tum.bank_branch,tum.acount_no,tum.ifsc_no,tum.service_tax_no,tmi.tax_remarks,tbm.po_code FROM service_indent AS tmi " +
						" LEFT JOIN service_indent_map AS tpm ON tpm.service_indent_id = tmi.service_indent_id " +
						" LEFT JOIN `service_purchase_order` AS tsp ON tsp.service_indent_id_fk = tmi.service_indent_id " +
						" LEFT JOIN `service_purchase_order` AS tps ON tps.service_indent_id_fk = tpm.service_indent_id " +
						" LEFT JOIN `expense_type` AS tet ON tet.expensetype_id = tmi.expensetype_id " +
						" LEFT JOIN `client` AS tcm ON tcm.client_id = tmi.client_id " +
						" LEFT JOIN `states` AS tsm ON tsm.id = tmi.circle_id " +
						" LEFT JOIN `maintenace_point` AS tmp ON tmp.maintenace_point_id = tmi.cluster_id " +
						" LEFT JOIN `service_category` AS tsc ON tsc.servicecat_id= tmi.servicecat_id " +
						" LEFT JOIN `vendor_user` AS tum ON tum.vuid= tmi.vendor_id " +
						" LEFT JOIN `vendor_user` AS tuum ON tuum.vuid= tmi.created_by " +
						" LEFT JOIN `vendor_user` AS tumb ON tumb.vuid= tmi.updated_by " +
						" LEFT JOIN `buyer_mas` AS tbm ON tbm.buyer_id= tmi.buyer_id " +
						" LEFT JOIN `nfa_mas` AS tnm ON tnm.nfa_id_pk= tmi.nfa_id " +
						" LEFT JOIN `payment_terms` AS tpt ON tpt.payment_terms_id= tmi.payment_terms " +
						" WHERE tpm.service_indent_id = " + tot + " ";
					console.log('Service Exsist Query', qrty);
					let resu = await conn.query(qrty);
					console.log(resu[0].length);
					console.log(resu[0][0]);
					if (resu[0].length != 0) {
						resu[0] = resu[0][0];
						var result = resu[0];
						// console.log(result, "$$$$$$$");
						console.log(resu[0].service_po_rvd_id_fk, "+++++++");
						status = true
						errorvalue.push({ msg: " '" + tot + "' serviceindent approve rqst already Exists. ", error_msg: 'UIAE' });
						console.log("Profile ID:'" + tot + "'  serviceindent approve rqst  already Exists. ");
						await conn.rollback();
					}
					console.log(result.service_po_rvd_id_fk, "dddd");
					if (result.service_po_rvd_id_fk != null) {
						var Qqry = "SELECT spo.*, po_number from service_purchase_order as spo where serive_po_id_pk =" + result.service_po_rvd_id_fk + "";
						console.log('Service Exsist Query', Qqry);
						let resultb = await conn.query(Qqry);
						console.log(resultb[0][0], "aaaaaaaa");
						if (resultb[0][0].po_number != 0) {
							data["po_num"] = resultb[0][0].po_number;
							postatus = true
							errorvalue.push({ msg: "Already po Exists.", error_code: 'APE' });
							await conn.rollback();
						}
					}
					console.log(data.po_num, '---------', data.po_num != undefined);
					if (data.po_num != undefined) {
						console.log(data.po_num, '---------', data.po_num != undefined);
						var id = data.po_num.toString();
						var finaldata = {};
						var lastFour = id.substr(id.length - 4); // => "Tabs1"
						var getData = lastFour.substring(0, lastFour.length - 1)
						// console.log(getData,"========")
						if (getData != "REV") {
							var newid = id + ("_REV1");
							finaldata = newid;
						} else {
							var lastFive = id.substr(id.length - 4);
							var lastChar = id.substr(id.length - 1);
							var finalChar = (+lastChar + +1);
							var getData = id.substring(0, id.length - 1);
							finaldata = (getData + finalChar);
						}
						var ldig = finaldata;
					}
					var qrt = 'SELECT (count(*)+1) as poCount from service_purchase_order';
					console.log('Service Exsist Query', qrt);
					let resul = await conn.query(qrt);
					console.log(resul[0][0], "-------");
					var countvalue = resul[0][0]
					data["po_count"] = resul[0][0].poCount;
					if (resul[0][0].poCount == 1) {
						postatus = true
						errorvalue.push({ msg: "Already pocount Exists.", error_msg: 'APOCE' });
						await conn.rollback();
					}
					var count = data.po_count;
					// console.log(count, "//////");
					function pad(str, max) {
						return str.length < max ? pad("0" + str, max) : str;
					}
					var da_count = pad(count.toString(), 6);
					// console.log(da_count, "====");
					console.log(result.client_short_form, "&&&&&&");
					var po_code = "PO_" + result.po_code + "_" + result.client_short_form + "_" + result.state_code + da_count;
					//s console.log( setlmnt.service_po_rvd_id_fk != null);
					var po_order = result.service_po_rvd_id_fk == null ? po_code : ldig;
					console.log(po_order, "****************");
					console.log(countvalue, "+++++++++++");
					countvalue = po_order;
					if (result.service_indent_id != null) {
						var qqqy = 'UPDATE service_indent_req_approval SET approval_status = 1 ,mtime=NOW() WHERE service_indent_id_fk=' + result.service_indent_id;
						console.log('Service Exsist Query', qqqy)
						let resultk = await conn.query(qqqy);
						if (resultk[0]['affectedRows'] > 0) {
							console.log("service_indent_req_approval status updated")
						} else {
							errorvalue.push({ msg: "Update success", error_code: 'success' });
							console.log('success to update service_indent_req_approval status');
							await conn.rollback();
						}
					}
					if (result.approval_status == 0) {
						var qqqyt = 'UPDATE service_indent SET approval_status = 1 ,mtime=NOW() WHERE service_indent_id =' + result.service_indent_id;
						console.log('Service Exsist Query', qqqyt)
						let resw = await conn.query(qqqyt);
						if (resw[0]['affectedRows'] > 0) {
							console.log("service indent status updated")
						} else {
							errorvalue.push({ msg: "Update success", error_code: 'success' });
							console.log('success to update service indent status');
							await conn.rollback();
						}
					}
					// console.log(data.po_count, "++++++++");
					var cdate = new Date();
					var servpuror = {
						"vendor_name": result.vendor_name,
						"service_indent_id_fk": result.service_indent_id,
						"vendor_id_fk": result.vendor_id,
						"contact_person": result.contact_person_name,
						"telephone": result.mobile,
						"email": result.email,
						"gst_no": result.gst_no,
						"tax_type": result.tax_type,
						"bank_name": result.bank_name,
						"service_tax_no": result.service_tax_no,
						"payment_term": result.payment_term,
						"billing_address": result.billing_address_one,
						"pan_no": result.pan_no,
						"branch_name": result.bank_branch,
						"acount_no": result.acount_no,
						"ifsc_code": result.ifsc_no,
						"sstart_date": cdate,
						"send_date": result.period_enddate,
						"po_ship_address": result.ship_address,
						"po_number": countvalue,
						"balance": result.grand_count,
						"po_date": cdate,
						"ctime": cdate,
						"status": 1,
						"inovice_status": 1
					};
					// console.log(vendor_name, "++++");
					console.log(servpuror, "++++");
					var qryES = "INSERT INTO service_purchase_order SET ?";
					let resn = await conn.query(qryES, servpuror);
					if (resn[0]["affectedRows"] > 0 && resn[0]["insertId"] > 0) {
						resn["grandcount"] = result.count_basic_amt;
						resn["amount_utilized"] = result.amount_utilized;
						await conn.commit();
						console.log("service purchase order added successfully");
						errorvalue.push({ msg: "Service Updated.", error_msg: 0 });
					} else {
						errorvalue.push({ msg: "Internal Error.", error_msg: 'IER' });
						await conn.rollback();
					}
					if (result.nfa_id != null) {
						var amount = Math.round((data.grandcount + data.amount_utilized || 0));
						var balifields = [amount, tot.nfa_id_fk];
						var qry = "UPDATE nfa_mas SET `amount_utilized`=?, mtime=NOW() WHERE nfa_id_pk =? ";
						let poqry = await conn.query(qry, balifields);
						console.log(poqry[0][0], "++++++");
						console.log("qry", qry)
						if (poqry[0]['affectedRows'] > 0) {
							console.log("nfa updated")
						} else {
							erroraray.push({ msg: "Update Failed", error_code: 'FAIL' });
							console.log('failed to update Ip status');
							await conn.rollback();
						}
					}
					// if (result.approval_status = 1) {
					// 	var sqldel = 'DELETE FROM veremaxpo.`service_indent` WHERE service_indent_id=' + result.service_indent_id;
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
				} catch (err) {
					console.log("catch error", err);
				}
			}
		} else {
			console.log("Connection Error.....");
		}
		conn.release();
		console.log('connection closed', errorvalue)
		return resolve(errorvalue);
	});
}

vendorpo.post('/serviceindentRqstApprove', async (req, res) => {
	console.log('serviceindentRqstApprove');
	req.setTimeout(864000000);
	// console.log('result----', req.body);
	let result = await serviceindentRqstApprove(req);
	console.log("Process Completed For serviceindentRqs", result);
	res.end(JSON.stringify(result));
});

async function Deleteservicerequest(req, res) {
	return new Promise(async (resolve, reject) => {
		let data = req.body,conn, status = false,errorvalue = [];
		try {
			conn = await poolPromise.getConnection();
			await conn.beginTransaction();
			sqlvend = 'SELECT * FROM veremaxpo.`service_indent` WHERE service_indent_id=' + data.service_indent_id + '';
			console.log("vendor exists for vend", sqlvend)
			sqlvend = await conn.query(sqlvend)
			if (sqlvend[0][0].length != 0) {
				console.log(sqlvend[0][0], "ppppppp");
				DeletedId = sqlvend[0][0];
				errorvalue.push({ msg: "service request deleted successfully", err_code: 119 });
				await conn.rollback();
			}
			if (DeletedId.approval_status == 0 || DeletedId.approval_status != '') {
				var qryL = 'UPDATE service_indent SET approval_status =2 ,mtime=NOW() WHERE service_indent_id =' + DeletedId.service_indent_id + '';
				console.log(qryL, "=====");
				let poqryy = await conn.query(qryL);
				console.log(poqryy[0], "++++++");
				if (poqryy[0]['affectedRows'] > 0) {
					console.log("nfa updated");
				} else {
					errorvalue.push({ msg: "Update Success", error_code: 'success' });
					console.log('failed to update Ip status');
					await conn.rollback();
				}
			}
			if (DeletedId.approval_status == 2) {
				var sqldel = 'DELETE FROM veremaxpo.`service_indent` WHERE service_indent_id=' + DeletedId.service_indent_id;
				console.log('Allowed vendor Delete Query', sqldel)
				let resultde = await conn.query(sqldel);
				if (resultde[0]['affectedRows'] > 0) {
					console.log("Succesfully deleted data in service_indent table")
					await conn.commit();
				}
				else {
					status = true
					errorvalue.push({ msg: " Failed to delete request ", error_msg: 'FTVT' });
					console.log('sqldel', sqldel);
					console.log('Failed to delete vendor table');
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

vendorpo.post("/Deleteservicerequest", async (req, res) => {
	console.log(req.body)
	// const errors = validationResult(req);
	// console.log(errors);
	// if (!errors.isEmpty()) {
	// 	return res.status(422).json({
	// 		errors: errors.array(),
	// 	});
	req.setTimeout(864000000);
	// console.log('dhcbg---------', req.body);
	let result = await Deleteservicerequest(req);
	console.log(result);
	res.end(JSON.stringify(result));
});

vendorpo.post('/getSerivceIndentlDetail', function (req, res) {
	pool.getConnection( (err, conn) => {
		if (!err) {
			console.log("GET EDIT", req.body);
			var sql, sqlquery = " SELECT tm_map.service_indent_map_id,tmi.service_indent_id,tm_map.item_code,tm_map.description,tm_map.days,tm_map.qty, " +
				" tm_map.amountunit,tm_map.uom,tm_map.countTaxableValue,tm_map.countCgst,tm_map.countIgst,tm_map.gst_per,tm_map.gst_value,tm_map.cgst_per,tm_map.cgst_value,tm_map.countamount,(DATE_FORMAT(tm_map.period_startdate,'%d-%m-%Y')) as period_startdate,(DATE_FORMAT(tm_map.period_enddate,'%d-%m-%Y')) as period_enddate, " +
				" tm_map.sgst_per,tm_map.sgst_value,tm_map.taxable_value,tm_map.others " +
				" FROM service_indent AS tmi " +
				" LEFT JOIN service_indent_map AS tm_map ON tm_map.service_indent_id = tmi.service_indent_id ",
				sqlqu = "SELECT '' sdetails,tmi.service_indent_id,tmi.po_type,tmi.`process_type`,tmi.`subexpensetype_id`,tmi.`expensetype_id`,tmi.`client_id`,tmi.`circle_id`,tmi.`cluster_id`, " +
					" tmi.`servicecat_id`,tmi.`buyer_id`,tmi.`vendor_id`,tmi.`payment_terms`,tmi.`add_terms`,tmi.`approval_status`,tpt.payment_term, " +
					" tmi.`vendor_email`,tmi.`address`,tmi.`shipment_address`,tmi.`cc_email`,tmi.`anaction_filename`,tmi.`service_po_rvd_id_fk`, " +
					" tmi.`nfa_id`,tmi.`tax_type`,DATE_FORMAT(tmi.ctime,'%d-%m-%Y') AS `ctime`,tmi.`mtime`,tmi.`created_by`,tmi.`updated_by`,tmi.`attachment_file`,tmi.`approval_sts`, " +
					" tmi.`remarks`,tmi.`tax_remarks`,tmi.`approval_by`,tmi.`gst_no`,tet.expensetype_name,tum.gst_no,tsm.state_code,tcm.client_name,tpm.grand_count,tpm.countTaxableValue,tpm.countCgst,tpm.countIgst,tpm.countSgst,tpm.count_basic_amt,tsm.state_name,tmp.mept_name,tsc.service_category_name,tum.vendor_name,tum.username,tum.contact_person_name,tum.mobile,tum.email,tum.billing_address_one,tpm.period_startdate,tpm.period_enddate,tum.pan_no,tbm.pan_no as buy_pan_no,tbm.gst_no as buy_gst_no,tum.gst_no,tbm.register_address,tbm.shipment_address as ship_address,tet.expensetype_name,tbm.company_name as company_name,tcm.client_name,tsm.state_name,tmp.mept_name,tsc.service_category_name,tum.username,tum.contact_person_name,tum.mobile FROM service_indent AS tmi " +
					" LEFT JOIN service_indent_map AS tpm ON tpm.service_indent_id = tmi.service_indent_id " +
					" LEFT JOIN `expense_type` AS tet ON tet.expensetype_id = tmi.expensetype_id " +
					" LEFT JOIN `client` AS tcm ON tcm.client_id = tmi.client_id " +
					" LEFT JOIN `states` AS tsm ON tsm.id = tmi.circle_id " +
					" LEFT JOIN `maintenace_point` AS tmp ON tmp.maintenace_point_id = tmi.cluster_id " +
					" LEFT JOIN `service_category` AS tsc ON tsc.servicecat_id= tmi.servicecat_id " +
					" LEFT JOIN `vendor_user` AS tum ON tum.vuid= tmi.vendor_id " +
					" LEFT JOIN `buyer` AS tbm ON tbm.buyer_id= tmi.buyer_id " +
					" LEFT JOIN `payment_terms` AS tpt ON tpt.payment_terms_id= tmi.payment_terms ", finalresult = [],data = req.body;
			if (data.hasOwnProperty('service_indent_id') && data.service_indent_id) {
				sqlquery += ' WHERE tmi.service_indent_id = ' + data.service_indent_id;
				sqlqu += ' WHERE tmi.service_indent_id  = ' + data.service_indent_id;
			}
			console.log(sqlqu);
			console.log(sqlquery);
			sql = conn.query(sqlqu, function (err, result1) {
				if (!err) {
					sql = conn.query(sqlquery, function (err, result2) {
						// console.log(sql.sql)
						conn.release();
						if (!err) {
							result1[0].sdetails = result2;
							res.end(JSON.stringify(result1[0]));
						} else {
							console.log(err);
						}
					});
				} else {
					console.log("connection released")
					conn.release();
				}
			});
		}
	});
});

vendorpo.post('/serivceindentldetailvpo', function (req, res) {
	pool.getConnection( (err, conn) => {
		if (!err) {
			console.log("GET EDIT", req.body);
			var sql, sqlquery = " SELECT tm_map.service_indent_map_id,tmi.service_indent_id,tm_map.item_code,tm_map.description,tm_map.days,tm_map.qty, " +
				" tm_map.amountunit,tm_map.uom,tm_map.countTaxableValue,tm_map.countCgst,tm_map.countIgst,tm_map.gst_per,tm_map.gst_value,tm_map.cgst_per,tm_map.cgst_value,tm_map.countamount,(DATE_FORMAT(tm_map.period_startdate,'%d-%m-%Y')) as period_startdate,(DATE_FORMAT(tm_map.period_enddate,'%d-%m-%Y')) as period_enddate, " +
				" tm_map.sgst_per,tm_map.sgst_value,tm_map.taxable_value,tm_map.others " +
				" FROM service_indent AS tmi " +
				" LEFT JOIN service_indent_map AS tm_map ON tm_map.service_indent_id = tmi.service_indent_id ",
				sqlqu = "SELECT '' sdetails,tmi.service_indent_id,tmi.po_type,tmi.`process_type`,tmi.`subexpensetype_id`,tmi.`expensetype_id`,tmi.`client_id`,tmi.`circle_id`,tmi.`cluster_id`, " +
					" tmi.`servicecat_id`,tmi.`buyer_id`,tmi.`vendor_id`,tmi.`payment_terms`,tmi.`add_terms`,tmi.`approval_status`,tpt.payment_term, " +
					" tmi.`vendor_email`,tmi.`address`,tmi.`shipment_address`,tmi.`cc_email`,tmi.`anaction_filename`,tmi.`service_po_rvd_id_fk`, " +
					" tmi.`nfa_id`,tmi.`tax_type`,DATE_FORMAT(tmi.ctime,'%d-%m-%Y') AS `ctime`,tmi.`mtime`,tmi.`created_by`,tmi.`updated_by`,tmi.`attachment_file`,tmi.`approval_sts`, " +
					" tmi.`remarks`,tmi.`tax_remarks`,tmi.`approval_by`,tmi.`gst_no`,tet.expensetype_name,tum.gst_no,tsm.state_code,tcm.client_name,tpm.grand_count,tpm.countTaxableValue,tpm.countCgst,tpm.countIgst,tpm.countSgst,tpm.count_basic_amt,tsm.state_name,tmp.mept_name,tsc.service_category_name,tum.vendor_name,tum.username,tum.contact_person_name,tum.mobile,tum.email,tum.billing_address_one,tpm.period_startdate,tpm.period_enddate,tum.pan_no,tbm.pan_no as buy_pan_no,tbm.gst_no as buy_gst_no,tum.gst_no,tbm.register_address,tbm.shipment_address as ship_address,tet.expensetype_name,tbm.company_name as company_name,tcm.client_name,tsm.state_name,tmp.mept_name,tsc.service_category_name,tum.username,tum.contact_person_name,tum.mobile FROM service_indent AS tmi " +
					" LEFT JOIN service_indent_map AS tpm ON tpm.service_indent_id = tmi.service_indent_id " +
					" LEFT JOIN `expense_type` AS tet ON tet.expensetype_id = tmi.expensetype_id " +
					" LEFT JOIN `client` AS tcm ON tcm.client_id = tmi.client_id " +
					" LEFT JOIN `states` AS tsm ON tsm.id = tmi.circle_id " +
					" LEFT JOIN `maintenace_point` AS tmp ON tmp.maintenace_point_id = tmi.cluster_id " +
					" LEFT JOIN `service_category` AS tsc ON tsc.servicecat_id= tmi.servicecat_id " +
					" LEFT JOIN `vendor_user` AS tum ON tum.vuid= tmi.vendor_id " +
					" LEFT JOIN `buyer` AS tbm ON tbm.buyer_id= tmi.buyer_id " +
					" LEFT JOIN `payment_terms` AS tpt ON tpt.payment_terms_id= tmi.payment_terms ", finalresult = [],data = req.body;
			if (data.hasOwnProperty('service_indent_id') && data.service_indent_id) {
				sqlquery += ' WHERE tmi.service_indent_id = ' + data.service_indent_id;
				sqlqu += ' WHERE tmi.service_indent_id  = ' + data.service_indent_id;
			}
			console.log(sqlqu);
			console.log(sqlquery);
			sql = conn.query(sqlqu, function (err, result1) {
				if (!err) {
					sql = conn.query(sqlquery, function (err, result2) {
						// console.log(sql.sql)
						conn.release();
						if (!err) {
							result1[0].sdetails = result2;
							res.end(JSON.stringify(result1[0]));
						} else {
							console.log(err);
						}
					});
				} else {
					conn.release();
					console.log("connection released");
				}
			});
		}
	});
});

vendorpo.post('/listservicepo', function (req, res) {
	var data = req.body, where = [], value = [], condFor = "", sql,
		sqlqueryb = `SELECT tsp.*,tsim.total_basic_amt AS po_amount_basic,IF(tsi.tax_type=1,tsim.totalSgst,(tsim.totalCgst+tsim.totalSgst)) AS tax,GROUP_CONCAT(tsim.totalamount) AS countamount,
		tsi.servicecat_id,tpt.payment_term,tsim.period_startdate AS period_speriod,tsim.period_enddate AS period_eperiod, 
		tsi.add_terms,GROUP_CONCAT(DATE_FORMAT(tsim.period_startdate,'%d-%m-%Y')) AS period_startdate,DATE_FORMAT(tsim.period_startdate, '%Y-%m') year_and_month, 
		GROUP_CONCAT(DATE_FORMAT(tsim.period_enddate,'%d-%m-%Y')) AS period_enddate,GROUP_CONCAT(tsim.days) AS days,tsim.totalTaxableValue, 
		GROUP_CONCAT(tsim.qty) AS qty,GROUP_CONCAT(tsim.totalIgst) AS gst_count,GROUP_CONCAT(tsim.totalCgst) AS cgst_count, 
		GROUP_CONCAT(tsim.totalSgst) AS sgst_count,GROUP_CONCAT(tsim.totalamount) AS count_amt,tsim.grand_total,tsim.cgst_per, 
		tsim.gst_per,tsim.sgst_per,tsim.taxable_value,tum.username,tcm.client_short_form,tcm.client_id,tcm.client_name,
		tsi.anaction_filename,tsm.id,tcum.firstname,tsim.service_indent_id,tet.expensetype_name,tsm.name,
		tnm.nfa_id_pk,tmp.mept_name,tmp.maintenace_point_id,tvs.invoice_no 
		FROM service_purchase_order AS tsp 
		LEFT JOIN vendor_user AS tum ON tum.vuid = tsp.vendor_id_fk 
		LEFT JOIN service_indent AS tsi ON tsi.service_indent_id = tsp.service_indent_id_fk 
		LEFT JOIN service_indent_map AS tsim ON tsim.service_indent_id = tsp.service_indent_id_fk 
		LEFT JOIN nfa_mas AS tnm ON tnm.nfa_id_pk = tsi.nfa_id 
		LEFT JOIN vendor_user AS tcum ON tcum.vuid = tsi.created_by 
		LEFT JOIN expense_type AS tet ON tet.expensetype_id = tsi.expensetype_id 
		LEFT JOIN states AS tsm ON tsm.id = tsi.circle_id 
		LEFT JOIN payment_terms AS tpt ON tpt.payment_terms_id = tsi.payment_terms 
		LEFT JOIN CLIENT AS tcm ON tcm.client_id = tsi.client_id 
		LEFT JOIN vendor_servicepo AS tvs ON tvs.serive_po_id_fk = tsp.serive_po_id_pk
		LEFT JOIN maintenace_point AS tmp ON tmp.maintenace_point_id = tsi.cluster_id`,
		sqlqueryc = `SELECT COUNT(DISTINCT 'serive_po_id_pk') AS count FROM service_purchase_order AS tsp 
		LEFT JOIN vendor_user AS tum ON tum.vuid = tsp.vendor_id_fk 
		LEFT JOIN service_indent AS tsi ON tsi.service_indent_id = tsp.service_indent_id_fk 
		LEFT JOIN service_indent_map AS tsim ON tsim.service_indent_id = tsp.service_indent_id_fk 
		LEFT JOIN nfa_mas AS tnm ON tnm.nfa_id_pk = tsi.nfa_id 
		LEFT JOIN vendor_user AS tcum ON tcum.vuid = tsi.created_by 
		LEFT JOIN expense_type AS tet ON tet.expensetype_id = tsi.expensetype_id 
		LEFT JOIN states AS tsm ON tsm.id = tsi.circle_id 
		LEFT JOIN payment_terms AS tpt ON tpt.payment_terms_id = tsi.payment_terms 
		LEFT JOIN CLIENT AS tcm ON tcm.client_id = tsi.client_id 
		LEFT JOIN vendor_servicepo AS tvs ON tvs.serive_po_id_fk = tsp.serive_po_id_pk
		LEFT JOIN maintenace_point AS tmp ON tmp.maintenace_point_id = tsi.cluster_id`;
	where.push(" tsp.status in(" + 1 + ")");
	if (data.hasOwnProperty('vendor_name') && data.vendor_name) where.push(" tum.vendor_name LIKE '%" + data.vendor_name + "%'");

	if (data.hasOwnProperty('status') && data.status == 1) where.push(" tsp.status ='" + 1 + "'"); //postatus=1 add
 
	if (data.hasOwnProperty('expensetype_name') && data.expensetype_name) where.push(' tet.expensetype_name LIKE "%' + data.expensetype_name + '%"');

	if (data.hasOwnProperty('mept_name') && data.mept_name) where.push(" tmp.mept_name LIKE '%" + data.mept_name + "%'");

	if (data.out_datefrm != null && data.out_datefrm != "" && data.out_datefrm != undefined && data.out_dateto != null && data.out_dateto != "" && data.out_dateto != undefined) {
		where.push(" DATE_FORMAT(tsp.po_date,'%Y-%m-%d') >= " + data.out_datefrm + " AND DATE_FORMAT(tsp.po_date,'%Y-%m-%d %hh:%mm:%ss') <= '" + data.out_dateto + " 23:59:59' ");
	}

	if (data.hasOwnProperty('out_datefrm') && data.out_datefrm && !data.out_dateto) where.push(' DATE_FORMAT(tsp.po_date,"%Y-%m-%d") >= "' + data.out_datefrm + '" ');

	if (data.hasOwnProperty('out_dateto') && data.out_dateto && !data.out_datefrm) where.push(' DATE_FORMAT(tsp.po_date,"%Y-%m-%d") <= "' + data.out_dateto + '" ');

	if (data.hasOwnProperty('year_and_month') && data.year_and_month) where.push(' DATE_FORMAT(tsim.period_startdate, "%Y-%m")  = "' + data.year_and_month + '" ');

	if (data.circle_name != null && data.circle_name != "" && data.circle_name != undefined) where.push(" tsm.id  ='" + data.circle_name + "'");

	if (data.cluster != null && data.cluster != "" && data.cluster != undefined) where.push(" tmp.maintenace_point_id ='" + data.cluster + "'");

	if (data.client_id != null && data.client_id != "" && data.client_id != undefined) where.push(" tsi.client_id ='" + data.client_id + "'");

	if (data.hasOwnProperty('client_short_form') && data.client_short_form) where.push(" tcm.client_short_form LIKE '%" + data.client_short_form + "%'");

	if (data.inv_status != null && data.inv_status != "" && data.inv_status != undefined) where.push(" tsp.inovice_status  ='" + data.inv_status + "'");

	if (data.po_number != null && data.po_number != "" && data.po_number != undefined) where.push(" tsp.po_number LIKE '%" + data.po_number + "%'");

	if (data.state_id_fk != null && data.state_id_fk != "" && data.state_id_fk != undefined) where.push("tsm.id  ='" + data.state_id_fk + "'");

	if (data.role_id_fk == 12 || data.role_id_fk == 7 || data.role_id_fk == 14) where.push("tsi.nfa_id IS NOT NULL");

	if (where.length > 0) {
		sqlqueryb += " where" + where.join(' AND ')
		sqlqueryc += " where " + where.join(' AND ')
	}
	sqlqueryb += ' GROUP BY tsp.serive_po_id_pk '
	if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
		sqlqueryb += ' ORDER BY tsp.po_date DESC LIMIT ' + data.index + ', ' + data.limit;
	}
	console.log('Get Count Query :', sqlqueryb);
	pool.getConnection(function (err, conn) {
		if (err) {
			console.log('List  Failed....')
			res.send(JSON.stringify('failed'));
		} else {
			sql = conn.query(sqlqueryb, function (err, result) {
				value.push(result)
				if (!err) {
					sql = conn.query(sqlqueryc, function (err, result) {
						conn.release();
						console.log('Listservicepo Connection Closed.');
						if (!err) {
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

const storage = multer.diskStorage({
	destination: function (req, file, callback) {
		console.log(file.originalname)
		let namefile = file.originalname.split('-')[0], folder_status = false;
		const fs = require("fs")
		const filename = namefile
		const imagePath = `${__dirname}/../Documents/anaction/${filename}`;
		fs.exists(imagePath, exists => {
			if (exists) {
				folder_status = true
				console.log(" Directory Already created.")
			} else {
				folder_status = true
				fs.mkdir(imagePath, { recursive: true }, function (err) {
					if (err) {
						console.log(err)
					} else { console.log("New directory Successfully Created.") }
				})
			}
			if (folder_status) { callback(null, imagePath); }
		});
	},
	filename: function (req, file, callback) {
		console.log(file);
		console.log("Filename", file.originalname)
		let nowdate = new Date();
		// let edate = ((nowdate).toISOString().replace(/T/, '-').replace(/\..+/, '')).slice(0, 16);
		let file_name = file.originalname.split('-')[1]
		let type = file.mimetype == 'application/pdf' ? 'pdf' : 'png';
		callback(null, file_name + '-' + nowdate.toISOString().slice(0, 10) + '.' + type)
	}
})

const upload = multer({ storage: storage }).array('file', 4)
//    const upload = multer({storage: storage}).single('file') 

vendorpo.post('/uploadAnaction', function (req, res) {
	console.log('Inside Upload Anaction-------------');
	var errorarray = [], data, sqlquery, file, img_path;
	upload(req, res, function (err) {
		if (err) {
			console.log("Error uploading file.", err)
			errorarray.push({ msg: "Upload Failed", error_code: 'FAIL' });
			res.end(JSON.stringify(errorarray));
		} else {
			console.log('req---', req.body, req.files);
			data = req.body, file = req.files;
			console.log(file, "--------------------------");
			// console.log(data, "=====");
			console.log(img_path, "------------");
			img_path = `${data.id}/${file[0].filename}`;
			sqlquery = " UPDATE veremaxpo.service_indent SET anaction_filename='" + img_path + "' WHERE  service_indent_id=" + data.id;
			console.log("Update  Query.", sqlquery);
			pool.getConnection(function (err, conn) {
				if (err) {
					console.log("Failed")
				} else {
					var sql = conn.query(sqlquery, function (err, result) {
						conn.release();
						if (!err) {
							if (result.affectedRows > 0) {
								let sqlact = "INSERT into veremaxpo.activity_log SET table_id= 'LOGIN BY:" + data.id + "' ,`longtext`= 'ADDITIONAL ANNACTION:" + img_path + "' ";
								let resultlog = conn.query(sqlact);
								if (resultlog != 0) {
									errorarray.push({ status: 1, msg: 'Upload Succesfully', error_msg: 0 });
									console.log("File is uploaded.")
									res.end(JSON.stringify(errorarray));
								} else {
									console.log("log error");
								}
							} else {
								console.log("File Not uploaded.", err)
								errorarray.push({ msg: "Please try after sometimes", error_msg: 'FAIL' });
								res.end(JSON.stringify(errorarray));
							}
						}
					});
				}
			});
		}
	});
});

async function getdoc(data) {
	return new Promise(async (resolve, reject) => {
		console.log(data.id, "data---");
		var sqlquery, imageName, img_result;
		img_result = { anaction_filename: '' };
		console.log(img_result, "++++++");
		let conn = await poolPromise.getConnection();
		if (conn) {
			console.log('Data===', data);
			await conn.beginTransaction();
			try {
				sqlquery = ` SELECT service_indent_id,anaction_filename FROM veremaxpo.service_indent WHERE service_indent_id =${data.id}`
				console.log("Get select Qwery", sqlquery)
				let result = await conn.query(sqlquery)
				console.log(result, "resuly");
				if (result[0][0].anaction_filename) {
					imageName = [{
						key: 'anaction_filename',
						fileName: `${result[0][0].anaction_filename}`
					}];
					const element = imageName[0]
					img_result[element.key] = await getImage(element.fileName)
				} else {
					// return resolve({ error: true, msg: 'Image Not Upload' })
					console.log('Image Not Upload');
				}
			} catch (e) {
				console.log('Inside Catch', e);
				// return resolve({ error: true, msg: e.toString() })
			}
			conn.release();
			if (img_result) {
				return resolve(img_result)
			} else {
				return resolve({ error: true, msg: 'Image Not Found' })
			}
		} else {
			console.log("Getdoc Connection Failed");
			return;
		}
	});
}

vendorpo.get('/getAnaction', async (req, res) => {
	req.setTimeout(864000000);
	const url = require('url');
	const url_parts = url.parse(req.url, true);
	const query = url_parts.query;
	console.log('Get proof', query);
	let resp = await getdoc(query);
	if (resp.error) {
		return res.end(JSON.stringify(resp));
	}
	res.end(JSON.stringify(resp));
});

const getImage = async (namefile) => {
	if (namefile) {
		const fs = require('fs');
		return new Promise((resolve, reject) => {
			const imagePath = `${__dirname}/../Documents/anaction/${namefile}`;
			console.log('Get ImagePath', imagePath);
			fs.exists(imagePath, exists => {
				if (exists) {
					return resolve(fs.readFileSync(imagePath).toString("base64"));
				} else {
					return reject('Error: Image does not exists');
				}
			});
		});
	}
};

// async function addvendorpobulk(req, res) {
// 	return new Promise(async (resolve, reject) => {
// 		let data = req, tot = data.resultUpload.length, multicount = data.resultUpload.length;
// 		var expenseArr = [], cilentArr = [], cattArr = [], payArr = [], cmpArr = [], stasArr = [], mpArr = [], vnArr = [];
// 		function insUpload() {
// 			var setlmnt = data.resultUpload.pop();
// 			var settlfields = {
// 				process_type: setlmnt.process_type,
// 				expense_type: setlmnt.expense_type,
// 				customer: setlmnt.customer,
// 				category: setlmnt.category,
// 				circle: setlmnt.circle,
// 				cluster: setlmnt.cluster,
// 				vendor_name: setlmnt.vendor_name,
// 				address: setlmnt.address,
// 				email: setlmnt.email,
// 				payment_terms: setlmnt.payment_terms,
// 				hsn_code: setlmnt.hsn_code,
// 				description: setlmnt.description,
// 				days: setlmnt.days,
// 				qty: setlmnt.qty,
// 				uom: setlmnt.uom,
// 				amount: setlmnt.amount,
// 				tt_amount: setlmnt.tt_amount,
// 				start_date: setlmnt.start_date,
// 				end_date: setlmnt.end_date,
// 				gst: setlmnt.gst,
// 				cgst: setlmnt.cgst,
// 				sgst: setlmnt.sgst,
// 				company_gst: setlmnt.company_gst,
// 				ccmail: setlmnt.ccmail,
// 				created_by: setlmnt.user_id_pk
// 			};
// 		}
// 		errorvalue = [];
// 		let conn = await poolPromise.getConnection();
// 		if (conn) {
// 			await conn.beginTransaction();
// 			try {



// 			}
// 			catch (err) {
// 				console.log("catch error", err);
// 			}
// 		} else {
// 			console.log("Connection Error.....");
// 			conn.release();
// 			console.log('connection closed', errorvalue)
// 			return resolve(errorvalue);
// 		}


// 	});
// }

// vendorpo.post("/addvendorpobulk", async (req, res) => {
// 	console.log(req.body)

// 	req.setTimeout(864000000);
// 	console.log('dhcbg---------', req.body);
// 	let result = await addvendorpobulk(req);
// 	console.log(result);
// 	res.end(JSON.stringify(result));
// });


async function bulkVendorpo(req) {
	return new Promise(async (resolve, reject) => {
		let data = req.body, expense = [], errorarray = [], expense_status = false, client_status = false, category_status = false,
			circle_status = false, cluster_status = false, payment_terms_status = false, company_gst_status = false;
		var cilentArr = []; var cattArr = []; var payArr = []; var cmpArr = []; var stasArr = []; var mpArr = []; var vnArr = [];
		let conn = await poolPromise.getConnection();
		if (conn) {
			console.log('Add file', data.bulk.length);
			for (var i = 0; i < data.bulk.length; i++) {
				await conn.beginTransaction();
				try {
					let bulkup = data.bulk[i];
					console.log('client data', bulkup);
					let sqlexists = `SELECT expensetype_id FROM expense_type where expensetype_name=${bulkup.expense_type}`;
					sqlexists = await conn.query(sqlexists);
					if (sqlexists[0].length > 0) {
						console.log(sqlexists[0].expensetype_id, "=========");
						data.expense_type = sqlexists[0].expensetype_id;
						expense.push(bulkup)
						expense_status = false;
					} else {
						expense_status = true;
						let txt = "ExpenseType column name mismatch " + bulkup.expense_type;
						errorarray.push({ msg: txt, error_msg: '0' });
						await conn.rollback();
						continue;
					}
					let w = `SELECT client_id FROM client WHERE client_name=${bulkup.customer}`;
					wq = await conn.query(w);
					if (wq[0].length > 0) {
						console.log(wq[0].client_id, "=========");
						data.customer = wq[0].client_id;
						cilentArr.push({ customer: wq[0].client_id })
						client_status = false;
					} else {
						client_status = true;
						let txt1 = "Customer column name mismatch" + bulkup.customer;
						errorarray.push({ msg: txt1, error_msg: '0' });
						await conn.rollback();
						continue;
					}
					let wh = `SELECT servicecat_id FROM service_category WHERE service_category_name=${bulkup.category}`;
					wqs = await conn.query(wh);
					if (wqs[0].length > 0) {
						console.log(wqs[0].servicecat_id, "=========");
						data.category = wqs[0].servicecat_id;
						cattArr.push({ category: wqs[0].servicecat_id })
						category_status = false;
					} else {
						console.log("Mept Name is not a valid for ", bulkup.circle, err);
						category_status = true;
						let txt2 = "Customer column name mismatch" + bulkup.category;
						errorarray.push({ msg: txt2, error_msg: '0' });
						data.category = "";
						await conn.rollback();
						continue;
					}
					let whe = `SELECT id FROM states WHERE name=${bulkup.circle}`;
					wqsq = await conn.query(whe);
					if (wqsq[0].length > 0) {
						console.log(wqsq[0].state_mas_id, "=========");
						data.circle = wqsq[0].state_mas_id;
						stasArr.push({ circle: wqsq[0].state_mas_id })
						circle_status = false;
					} else {
						console.log("Mept Name is not a valid for ", bulkup.circle, err);
						circle_status = true;
						let txt3 = "Circle column name mismatch" + bulkup.circle;
						errorarray.push({ msg: txt3, error_msg: '0' });
						data.circle = "";
						await conn.rollback();
						continue;
					}
					let wher = `SELECT maintenace_point_id FROM maintenace_point WHERE mept_name=${bulkup.cluster}`;
					wqsqs = await conn.query(wher);
					if (wqsqs[0].length > 0) {
						console.log(wqsqs[0].maintenace_point_id, "=========");
						data.cluster = wqsqs[0].maintenace_point_id;
						mpArr.push({ cluster: wqsqs[0].maintenace_point_id })
						cluster_status = false;
					} else {
						cluster_status = true;
						let txt4 = "Cluster column name mismatch" + bulkup.cluster;
						errorarray.push({ msg: txt4, error_msg: '0' });
						data.cluster = "";
						await conn.rollback();
						continue;
					}
					let where = `SELECT payment_terms_id FROM payment_terms WHERE payment_term=${bulkup.payment_terms}`;
					wwe = await conn.query(where);
					if (wwe[0].length > 0) {
						console.log(wwe[0].payment_terms_id, "=========");
						data.payment_terms = wwe[0].payment_terms_id;
						payArr.push({ payment_terms: wwe[0].payment_terms_id })
						payment_terms_status = false;
					} else {
						payment_terms_status = true;
						let txt5 = "Cluster column name mismatch" + bulkup.payment_terms;
						errorarray.push({ msg: txt5, error_msg: '0' });
						data.payment_terms = "";
						await conn.rollback();
						continue;
					}
					let ve = `SELECT buyer_id FROM buyer WHERE gst_no=${bulkup.company_gst}`;
					vi = await conn.query(ve);
					if (vi[0].length > 0) {
						console.log(vi[0].buyer_id, "=========");
						data.company_gst = vi[0].buyer_id;
						cmpArr.push({ company_gst: vi[0].buyer_id })
						company_gst_status = false;
					} else {
						company_gst_status = true;
						let txt6 = "Company GST No mismatch" + bulkup.company_gst;
						errorarray.push({ msg: txt6, error_msg: '0' });
						data.company_gst = "";
						await conn.rollback();
						continue;
					}
					let ves = `SELECT payment_terms_id FROM payment_terms where payment_term=${bulkup.payment_terms}`;
					vis = await conn.query(ves);
					if (vis[0].length > 0) {
						console.log(vi[0].buyer_id, "=========");
						data.payment_terms = vi[0].payment_terms_id;
						cmpArr.push({ company_gst: vi[0].buyer_id })
						payment_terms_status = false;
					} else {
						payment_terms_status = true;
						let txt7 = "Payment Terms mismatch" + bulkup.company_gst;
						errorarray.push({ msg: txt7, error_msg: '0' });
						data.payment_terms = "";
						await conn.rollback();
						continue;
					}
				}
				catch (e) {
					console.log('Inside Catch Error', e);
					await conn.rollback();
				}
				console.log('Success-1', errorarray);
				console.log('Connection Closed');
			}

		} else {
			errorarray.push({ msg: 'Please Try After Sometimes', error_msg: 'CONN' });
			conn.release();
			return;
		}
		return resolve(errorarray);
	});
}

vendorpo.post('/bulkVendorpo', async (req, res) => {
	req.setTimeout(864000000);
	let result = await bulkVendorpo(req);
	console.log("bulkVendorpo Process Completed", result);
	res.end(JSON.stringify(result));
});

module.exports = vendorpo;