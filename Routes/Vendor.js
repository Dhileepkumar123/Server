'use strict'
const express = require('express'),
	Vendor = express.Router(),
	schema = require('../schema/schema'),
	pool = require('../connection/connection'),
	poolPromise = require('../connection/connection').poolpromise;
const { validationResult } = require('express-validator/');
const multer = require('multer');

Vendor.post("/listvendor", (req, res) => {
	let data = req.body, value = [], where = [];
	console.log("Data--", data);
	pool.getConnection((err, con) => {
		let sqlbus = `SELECT vu.vuid, vu.usercode,vu.username,vu.usr_password,vu.firstname,vu.lastname,vu.vendor_name, 
	   vu.contact_person_name,vc.vcid,vu.status,vu.flag_status,vu.project_type,vu.circle_category_id,vu.email,
	   vu.alternate_email,vu.mobile,vu.telephone,vu.billing_address_one,vu.billing_address_two,
	   vu.location,sta.state_mas_id,dis.city_mas_id,con.country_id,vu.pin_code,vu.pan_no,vu.service_tax_no,vu.ifsc_no,
	   vc.process_type,vu.gst_no,vu.balance,ban.bank_name,vu.acount_name,vu.bank_branch,vu.acount_no,
	   vu.mail_status,vu.pan_file,vu.gst_file,vu.bankdoc_file,vu.aadhar_file,vu.aadhar_file,vu.mail_file,vu.auditlog_msg,
	   vu.role_id,vu.menurole FROM vendor_user vu LEFT JOIN vendor_category vc ON vu.vcid=vc.vcid 
	   LEFT JOIN states sta ON sta.id=vu.state_id LEFT JOIN bank ban ON ban.bank_name=vu.bank_name 
	   LEFT JOIN city_mas dis ON dis.city_mas_id=vu.city_id LEFT JOIN country con ON con.country_id=vu.country_id`,
			sqlqueryc = `SELECT COUNT(*) AS count FROM vendor_user AS vu 
				 LEFT JOIN vendor_category vc ON vu.vcid=vc.vcid 
				 LEFT JOIN states sta ON sta.id=vu.state_id 
				 LEFT JOIN bank ban ON ban.bank_name=vu.bank_name 
				 LEFT JOIN city_mas dis ON dis.city_mas_id=vu.city_id 
				 LEFT JOIN country con ON con.country_id=vu.country_id `;

		if (data.like) where.push(`vendor_name like '%${data.like}%'`)
		if (data.hasOwnProperty('vendor_name') && data.vendor_name) {
			where.push(' vu.vendor_name LIKE "%' + data.vendor_name + '%"');
			console.log(data.like, "like");
		}
		if (data.hasOwnProperty('vendor_code') && data.vendor_code) {
			where.push(' vu.usercode LIKE "%' + data.vendor_code + '%"');
			console.log(data.like, "like");
		}
		if (data.hasOwnProperty('username') && data.username) {
			where.push(' vu.username LIKE "%' + data.username + '%"');
			console.log(data.like, "like");
		}
		if (where.length > 0) {
			sqlbus += " where" + where.join(' AND ')
			sqlqueryc += " where " + where.join(' AND ')
		}
		if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
			sqlbus += ' ORDER BY vu.vuid LIMIT ' + data.index + ', ' + data.limit;
		}
		console.log('Get Count Query :', sqlbus);
		pool.getConnection((err, conn) => {
			if (err) {
				console.log('List employee Failed....')
				res.send(JSON.stringify('failed'));
			} else {
				let sql = conn.query(sqlbus, function (err, result) {
					value.push(result)
					if (!err) {
						sql = conn.query(sqlqueryc, function (err, result) {
							conn.release();
							console.log('Listvendor Connection Closed.');
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
						console.log('Listvendor Connection Closed.');
						res.send(JSON.stringify(result));
					}
				});
			}
		});
	});
});

Vendor.post("/listvendorcat", (req, res) => {
	let data = req.body, and = [], value = [];
	console.log("Data--", data);
	let sqlbus = `SELECT vc.vcid,vc.category_name,vc.code FROM vendor_category AS vc WHERE vc.status=1 `,
		sqlqueryc = `select count(*) count from vendor_category `;
	if (data.like) where.push(` sta.state_name like '%${data.like}%'`)
	if (data.hasOwnProperty('category_name') && data.category_name) {
		and.push(" vc.category_name LIKE '%" + data.category_name + "%'");
	}
	if (data.hasOwnProperty('code') && data.code) {
		and.push(" vc.code LIKE '%" + data.code + "%'");
	}
	if (and.length > 0) {
		sqlbus += " and" + and.join(' AND ')
	}
	if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
		sqlbus += ' ORDER BY vc.vcid DESC LIMIT ' + data.index + ', ' + data.limit;
	}
	console.log('Get Count Query :', sqlbus);
	pool.getConnection((err, conn) => {
		if (err) {
			console.log('List  Failed....')
			res.send(JSON.stringify('Failed'));
		} else {
			let sql = conn.query(sqlbus, function (err, result) {
				value.push(result)
				if (!err) {
					let sql = conn.query(sqlqueryc, function (err, result) {
						conn.release();
						console.log('Listvendorcat Connection Closed.');
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
					console.log('Listvendorcat Connection Closed.');
					res.send(JSON.stringify(result));
				}
			});
		}
	});
});

Vendor.post("/listmept1", (req, res) => {
	let data = req.body, and = [], sql;
	console.log("Data--", data);
	pool.getConnection((err, con) => {
		let sqlbus = `SELECT maintenace_point_id,mept_name,status,state_id_fk,created_by,updated_by,ctime,mtime FROM maintenace_point where status=1`;
		if (data.hasOwnProperty('state_id_fk') && data.state_id_fk) {
			and.push(' state_id_fk = ' + data.state_id_fk);
		}
		if (data.like) and.push(` mept_name like '%${data.like}%'`)
		if (and.length > 0) {
			sqlbus += " and" + and.join(' AND ')
		}
		console.log("Query---", sqlbus);
		sql = con.query(sqlbus, (err, result) => {
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

async function addVendoruser(req) {
	return new Promise(async (resolve, reject) => {
		const jwt_data = req.jwt_data;
		let data = req.body, errorvalue = [];
		console.log(req.body, "BODYYYY DATAAAA");
		let conn = await poolPromise.getConnection();
		if (conn) {
			await conn.beginTransaction();
			try {
				console.log("add data", data);
				let sqlquery = `SELECT count(*)  count from vendor_user`;
				let [[resp]] = await conn.query(sqlquery)
				let inc = autogenerate((resp.countVendor + 1), 6);
				let username = ("VMX_" + (inc));
				console.log("Username", username);
				let sqlq = ` SELECT COUNT(*) a FROM veremaxpo.vendor_user  WHERE username='${data.username}' `;
				let [[respon]] = await conn.query(sqlq)
				if (respon.a != 0) {
					console.log("Username Name Exists");
					errorvalue.push({ msg: "Username Already Exists", errorcode: 176 });
					await conn.rollback();
				}
				else {
					let status = data.status == true ? 1 : 0;
					let sqlinsert = `insert into vendor_user set  vendor_name='${data.vendorname}',contact_person_name='${data.contactpersonname}',email='${data.emailid}',
					mobile='${data.mobile}',billing_address_one='${data.billingaddress}',state_id='${data.state_id}',
					city_id='${data.city}',country_id=${data.country_name},vcid=${data.category},
					process_type='${data.processtype}',status=${status},cby=${jwt_data.user_id},ctime=NOW()`
					if (username) sqlinsert += ` ,username='${username}'`
			
					if (data.vendorcode) sqlinsert += ` ,usercode='${data.vendorcode}'`
			
					if (data.alteremail) sqlinsert += ` ,alternate_email='${data.alteremail}'`
			
					if (data.telephone) sqlinsert += ` ,telephone=${data.telephone}`
					
					if (data.pincode) sqlinsert += ` ,pin_code=${data.pincode}` 
					
					if (data.panno) sqlinsert += ` ,pan_no='${data.panno}'`
			
					if (data.ifsc_Code) sqlinsert += ` ,ifsc_no='${data.ifsc_Code}'`
			
					if (data.gstno) sqlinsert += ` ,gst_no='${data.gstno}'`
			
					if (data.bankname) sqlinsert += ` ,bank_name='${data.bankname}'`
					
					if (data.bankrecord) sqlinsert += ` ,acount_name='${data.bankrecord}'`
					
					if (data.branch) sqlinsert += ` ,bank_branch='${data.branch}'`
					
					if (data.accountnum) sqlinsert += ` ,acount_no=${data.accountnum}`
					
					// if (data.flag_status) sqlinsert += ` ,flag_status='${99}'`
					// if (data.status) sqlinsert += ` ,status=${data.status}`
					// if (data.panupload) sqlinsert += ` ,pan_file=${data.panupload}`
					console.log('insert query', sqlinsert);
					let result = await conn.query(sqlinsert)
					console.log('result', result);
					if (result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0) {
						// img_path = `${data.id}/${file[0].filename}`;
						// console.log(img_path, "++++++++++++");
						// usersetting = result[0]['insertId'];
						errorvalue.push({ msg: "Vendoruser Added Successfully", err_code: 0, id: result[0]['insertId'] })
						await conn.commit();
					} else {
						errorvalue.push({ msg: "Please Try After Sometimes", err_code: 222 })
						await conn.rollback();
					}
					let sqlq = `SELECT * FROM
					(SELECT COUNT(*) a FROM veremaxpo.vendor_user  WHERE username='${username}') a,
					(SELECT COUNT(*) b FROM veremaxpo.vendor_user WHERE usercode='${data.vendorcode}') b `;
					console.log('vendor query', sqlq);
					let respon = await conn.query(sqlq)
					console.log(respon, 'respon');
					if (respon[0][0].a != 0 || respon[0][0].b != 0) {
						console.log("username name exists");
						errorvalue.push({ msg: "username name exists", errorcode: 37 });
						await conn.rollback();
					}
					let qryE = `INSERT INTO veremaxpo.vendor_site_map Set vendor_id=${result[0]['insertId']},state_id_=${data.assigncircle}`;
					console.log("+++", qryE);
					let resultv = await conn.query(qryE);
					if (resultv[0]['affectedRows'] > 0) {
						let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='VENDOR INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
						console.log(logQuery);
						let logres = await conn.query(logQuery);
						if (logres[0]["affectedRows"] > 0)
							errorvalue.push({ msg: " Added Successfully", err_code: 0 })
						await conn.commit();
					} else {
						errorvalue.push({ msg: "Please Try After Sometimes", err_code: 56, id: result[0]['insertId'] })
						await conn.rollback();
					}
				}
			}
			catch (err) {
				console.log("catch error", err);
			}
		} else {
			console.log("Connection Error.....");
		}
		conn.release();
		console.log('AddVendoruser Connection Closed', errorvalue)
		return resolve(errorvalue);
	});
}

Vendor.post("/addVendoruser", schema.vendorschema, schema.validate, async (req, res) => {
	console.log(req.body);
	req.setTimeout(864000000);
	console.log('dhcbg---------', req.body);
	let result = await addVendoruser(req);
	console.log(result);
	res.end(JSON.stringify(result));
});

async function updateVendoruser(req, res) {
	return new Promise(async (resolve, reject) => {
		const jwt_data = req.jwt_data;
		let data = req.body, conn, errorvalue = [];
		try {
			conn = await poolPromise.getConnection();
			await conn.beginTransaction();
			console.log("update", data);
			let sqlq = `SELECT count(*) as countVendor from vendor_user`;
			console.log("project query", sqlq);
			let resp = await conn.query(sqlq);
			console.log("result", resp);
			if (resp[0][0].countVendor == 0) {
				errorvalue.push({ msg: "No Data Found", err_code: 119 });
				await conn.rollback();
			} else {
				let sqlupdate = `update veremaxpo.vendor_user set vendor_name='${data.vendorname}',contact_person_name='${data.contactpersonname}',email='${data.emailid}',
		  		mobile='${data.mobile}',billing_address_one='${data.billingaddress}',state_id='${data.state_id}',
		  		city_id='${data.city}',country_id=${data.country_name},vcid=${data.category},
		  		process_type='${data.processtype}',mby=${jwt_data.user_id},mtime=NOW()`
		  
				if (data.vendorcode) sqlupdate += ` ,usercode='${data.vendorcode}'`
				if (data.alteremail) sqlupdate += ` ,alternate_email='${data.alteremail}'`
				if (data.telephone) sqlupdate += ` ,telephone=${data.telephone}`
				if (data.pincode) sqlupdate += ` ,pin_code=${data.pincode}`
				if (data.panno) sqlupdate += ` ,pan_no='${data.panno}'`
				if (data.ifsc_Code) sqlupdate += ` ,ifsc_no='${data.ifsc_Code}'`
				if (data.gstno) sqlupdate += ` ,gst_no='${data.gstno}'`
				if (data.bankname) sqlupdate += ` ,bank_name='${data.bankname}'`
				if (data.bankrecord) sqlupdate += ` ,acount_name='${data.bankrecord}'`
				if (data.branch) sqlupdate += ` ,bank_branch='${data.branch}'`
				if (data.accountnum) sqlupdate += ` ,acount_no=${data.accountnum}`

				if (data.status == false) {
					sqlupdate += ` ,status=${0}`
				}
				else {
					sqlupdate += ` ,status=${1}`
				}
				// if (data.panupload) sqlinsert += ` ,pan_file=${data.panupload}`
				// if (data.aadharupload) sqlinsert += ` ,aadhar_file=${data.aadharupload}`
				// if (data.gstupload) sqlinsert += ` ,gst_file=${data.gstupload}`
				// if (data.bankdocupload) sqlinsert += ` ,bankdoc_file=${data.bankdocupload}`
				// if (data.mailupload) sqlinsert += ` ,mail_file=${data.mailupload}`
				
				sqlupdate += ` where vuid= ${data.vuid}`;
				console.log("Update Query", sqlupdate);
				let result = await conn.query(sqlupdate, data);
				console.log("result", result);
				if (result[0]["affectedRows"] > 0) {
					errorvalue.push({ msg: "vendor updated Successfully", err_code: 0 });
					await conn.commit();
				} else {
					errorvalue.push({ msg: "Please Try After Sometimes", err_code: 326 });
					await conn.rollback();
				}
				let sqlq = `SELECT * FROM
				(SELECT COUNT(*) a FROM veremaxpo.vendor_user  WHERE username='${data.username}') a,
				(SELECT COUNT(*) b FROM veremaxpo.vendor_user WHERE usercode='${data.vendorcode}') b `;
				console.log('vendor query', sqlq);
				let respon = await conn.query(sqlq)
				console.log(respon, 'respon');
				if (respon[0][0].a != 0 || respon[0][0].b != 0) {
					console.log("username name exists");
					errorvalue.push({ msg: "username name exists", errorcode: 37 });
					await conn.rollback();
				}
			}
			let qryE = `update vendor_site_map set state_id_=${data.assigncircle}`;
			qryE += ` where  vendor_id= ${data.vuid}`;
			console.log(data.vuid, "ooooooooooo");
			let resultv = await conn.query(qryE);
			if (resultv[0]['affectedRows'] > 0) {
				let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='VENDOR INFO  UPDATED ID:${data.vuid}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
				console.log(logQuery);
				let logres = await conn.query(logQuery);
				if (logres[0]["affectedRows"] > 0)
					errorvalue.push({ msg: " Updated Successfully", err_code: 0 })
				await conn.commit();
			} else {
				errorvalue.push({ msg: "Please Try After Sometimes", err_code: 56 })
				await conn.rollback();
			}
		} catch (e) {
			console.log("Catch Block Error", e);
			errorvalue.push({ msg: "Please try after sometimes", error_msg: "CONN" });
			await conn.rollback();
		}
		conn.release();
		console.log("UpdateVendoruser Updated Successfully", qryE);
		return resolve(errorvalue)
	});
}

Vendor.post("/updateVendoruser", /*schema.vendorschema, schema.validate,*/ async (req, res) => {
	console.log(req.body)
	// const errors = validationResult(req);
	// console.log(errors);
	// if (!errors.isEmpty()) {
	// 	return res.status(422).json({
	// 		errors: errors.array(),
	// 	});
	req.setTimeout(864000000);
	console.log('dhcbg---------', req.body);
	let result = await updateVendoruser(req);
	console.log(result);
	res.end(JSON.stringify(result));
});

async function changeVendoruser(req, res) {
	return new Promise(async (resolve, reject) => {
		let data = req.body, conn, status = false, errorvalue = [];
		try {
			conn = await poolPromise.getConnection();
			await conn.beginTransaction();
			console.log("delete", data);
			sqlvend = " SELECT vu.vuid, vu.usercode,vu.username,vu.usr_password,vu.firstname,vu.lastname,vu.vendor_name, " +
				" vu.contact_person_name,vc.vcid,vu.status,vu.flag_status,vu.project_type,vu.circle_category_id,vu.email, " +
				" vu.alternate_email,vu.mobile,vu.telephone,vu.billing_address_one,vu.billing_address_two, " +
				" vu.location,sta.state_mas_id,dis.city_mas_id,con.country_id,vu.pin_code,vu.pan_no,vu.service_tax_no,vu.ifsc_no, " +
				" vc.process_type,vu.gst_no,vu.balance,ban.bank_name,vu.acount_name,vu.bank_branch,vu.acount_no, " +
				" vu.mail_status,vu.pan_file,vu.gst_file,vu.bankdoc_file,vu.aadhar_file,vu.aadhar_file,vu.mail_file,vu.auditlog_msg, " +
				" vu.role_id,vu.menurole FROM vendor_user vu LEFT JOIN vendor_category vc ON vu.vcid=vc.vcid " +
				" LEFT JOIN states sta ON sta.id=vu.state_id LEFT JOIN bank ban ON ban.bank_name=vu.bank_name " +
				" LEFT JOIN city_mas dis ON dis.city_mas_id=vu.city_id LEFT JOIN country con ON con.country_id=vu.country_id WHERE vuid=" + data.vuid + "";
			console.log("vendor exists for vend", sqlvend)
			sqlvend = await conn.query(sqlvend)
			if (sqlvend[0][0].length != 0) {
				console.log(sqlvend[0][0], "ppppppp");
				var vendorid = sqlvend[0][0];
				errorvalue.push({ msg: "vendor user flagstatus changed successfully", err_code: 119 });
				await conn.rollback();
			}
			if (data.flag_status == 99 || data.flag_status != '') {
				var flag_status = [100, data.vuid];
				var qryL = 'UPDATE vendor_user SET flag_status=?,mtime=NOW() WHERE vuid=?';
				console.log(qryL, "=====");
				let poqryy = await conn.query(qryL, flag_status);
				console.log(poqryy[0], "++++++");
				if (poqryy[0]['affectedRows'] > 0) {
					console.log("changevendoruser updated")
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


Vendor.post("/changeVendoruser", async (req, res) => {
	console.log(req.body)
	// const errors = validationResult(req);
	// console.log(errors);
	// if (!errors.isEmpty()) {
	// 	return res.status(422).json({
	// 		errors: errors.array(),
	// 	});
	req.setTimeout(864000000);
	console.log('dhcbg---------', req.body);
	let result = await changeVendoruser(req);
	console.log(result);
	res.end(JSON.stringify(result));
});


Vendor.post("/getvendoruser", (req, res) => {
	let data = req.body;
	console.log("Data--", data);
	pool.getConnection((err, con) => {
		let sqlbuss = `SELECT vu.*,vu.vuid, vc.category_name, dis.city_name , sta.name, cu.country_name, vsm.state_id  AS assigncircle_id FROM vendor_user 
		AS vu LEFT JOIN vendor_category AS vc ON vc.vcid = vu.vcid
		LEFT JOIN city_mas AS dis ON dis.city_mas_id = vu.city_id 
		LEFT JOIN states AS sta ON sta.id = vu.state_id
		LEFT JOIN vendor_site_map vsm ON vsm.vendor_id=vu.vuid  
		LEFT JOIN country AS cu ON cu.country_id = vu.country_id WHERE vuid='${data.id}'`;
		console.log("Query---", sqlbuss);
		let sqlg = con.query(sqlbuss, data.id, (err, result) => {
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


async function addVendorcat(req) {
	return new Promise(async (resolve, reject) => {
		const jwt_data = req.jwt_data;
		let data = req.body, errorvalue = [];
		let conn = await poolPromise.getConnection();
		if (conn) {
			await conn.beginTransaction();
			try {
				console.log("add data", data);
				let sqlquery = 'SELECT sum(CASE WHEN category_name="' + data.category_name + '"  THEN 1 ELSE 0  END) AS category_name, SUM(CASE WHEN code= "' + data.category_code + '" THEN 1 ELSE 0  END) AS category_code  FROM vendor_category where status=1'
				console.log('vendor query', sqlquery);
				let resp = await conn.query(sqlquery)
				console.log('result', resp);
				if (resp[0][0].category_name == 1) {
					console.log('category exists')
					errorvalue.push({ msg: "categoryname already exists", err_code: 46 })
				} else if (resp[0][0].category_code == 1) {
					errorvalue.push({ msg: "categorycode already exists", err_code: 46 })
					await conn.rollback();
				}
				else {
					// var ifields = {
					// 	"category_name": data.category_name,
					// 	"code": data.category_code,
					// };
					let sqlinsert = `insert into vendor_category set  
					category_name='${data.category_name}',code='${data.category_code}',
					description='${data.description}',process_type=${data.processtype},
					ctime=NOW(),cby=${jwt_data.user_id}`;
					console.log('insert query', sqlinsert);
					let result = await conn.query(sqlinsert)
					console.log('result', result);
					if (result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0) {
						let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='VENDORCAT INFO  ADDED ID:${result[0]["insertId"]}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
						console.log(logQuery);
						let logres = await conn.query(logQuery);
						if (logres[0]["affectedRows"] > 0 && logres[0]["insertId"] > 0)
							errorvalue.push({ msg: "Vendor category Added Successfully", err_code: 0 })
						await conn.commit();
					} else {
						errorvalue.push({ msg: "Please Try After Sometimes", err_code: 56 })
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

Vendor.post("/addVendorcat", schema.vendorcatschema, schema.validate, async (req, res) => {
	console.log(req.body)
	// const errors = validationResult(req);
	// console.log(errors);
	// if (!errors.isEmpty()) {
	// 	return res.status(422).json({
	// 		errors: errors.array(),
	// 	});
	// }
	req.setTimeout(864000000);
	console.log('dhcbg---------', req.body);
	let result = await addVendorcat(req);
	console.log(result);
	res.end(JSON.stringify(result));
});

// Vendor.post("/listvendorcat", (req, res) => {
// 	let data = req.body;
// 	console.log("Data--", data);
// 	pool.getConnection((err, con) => {
// 		let sqlbus = `SELECT vc.vcid,vc.category_name,vc.code FROM vendor_category as vc`;
// 		console.log("Query---", sqlbus);
// 		let sql = con.query(sqlbus, (err, result) => {
// 			con.release();
// 			if (err) {
// 				console.log(err);
// 			} else {
// 				// console.log(result)
// 				res.send(JSON.stringify(result));
// 			}
// 		});
// 	});
// });

Vendor.post("/getvendorusercat", (req, res) => {
	let data = req.body;
	console.log("Data--", data);
	pool.getConnection((err, con) => {
		let sqlbuss = `SELECT category_name,code,description,process_type FROM vendor_category as vc WHERE vcid='${data.cat_id}'`;
		console.log("Query---", sqlbuss);
		let sqlg = con.query(sqlbuss, data.cat_id, (err, result) => {
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

async function updateVendorcat(req) {
	return new Promise(async (resolve, reject) => {
		const jwt_data = req.jwt_data;
		let data = req.body,
			ifields = [
				data.category_name,
				data.category_code,
				data.description,
				data.processtype,
				jwt_data.user_id
			];
		errorvalue = [];
		let conn = await poolPromise.getConnection();
		if (conn) {
			await conn.beginTransaction();
			try {
				console.log("add data", data);
				let sqlquery = "SELECT SUM(CASE WHEN category_name= '" + data.category_name + "' THEN 1 ELSE 0  END) AS category_name,SUM(CASE WHEN code= '" + data.category_code + "' THEN 1 ELSE 0  END) AS category_code " +
					"FROM vendor_category";
				console.log('vendor query', sqlquery);
				let vencatRes = await conn.query(sqlquery)
				if (vencatRes != null) {
					if (vencatRes[0][0].category_name == 1) {
						console.log('category name exists')
						errorvalue.push({ msg: "category name already exists", err_code: 46 })
					} else if (vencatRes[0][0].category_code == 1) {
						console.log('category code exists')
						errorvalue.push({ msg: "category code already exists", err_code: 46 })
						await conn.rollback();
					} else {
						let sqlinsert = "update veremaxpo.vendor_category set `category_name`=?,`code`=?,`description`=?,`process_type`=?,`mby`=?";
						sqlinsert += ` where vcid= ${data.cat_id}`;
						console.log('insert query', sqlinsert);
						let result = await conn.query(sqlinsert, ifields)
						console.log('result', result);
						if (result[0]['affectedRows'] > 0) {
							let logQuery = ` INSERT INTO veremaxpo.activity_log SET table_id='Vendorcategory INFO  UPDATED ID:${data.cat_id}',\`longtext\`='DONE BY',cby=${jwt_data.user_id},data='${JSON.stringify(data)}' `;
							console.log(logQuery);
							let logres = await conn.query(logQuery);
							if (logres[0]["affectedRows"] > 0 && logres[0]["insertId"] > 0)
								errorvalue.push({ msg: "Vendorcategory updated Successfully", err_code: 0 })
							await conn.commit();
						} else {
							errorvalue.push({ msg: "Please Try After Sometimes", err_code: 56 })
							await conn.rollback();
						}
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

Vendor.post("/updateVendorcat", schema.vendorcatschema, schema.validate, async (req, res) => {
	console.log(req.body)
	// const errors = validationResult(req);
	// console.log(errors);
	// if (!errors.isEmpty()) {
	// 	return res.status(422).json({
	// 		errors: errors.array(),
	// 	});
	// }
	req.setTimeout(864000000);
	console.log('dhcbg---------', req.body);
	let result = await updateVendorcat(req);
	console.log(result);
	res.end(JSON.stringify(result));
});


Vendor.post("/listcircle", (req, res) => {
	let data = req.body, where = [];
	console.log("Data--", data);
	pool.getConnection((err, con) => {
		let sqlbus = `SELECT state_mas_id AS assign_id, state_name AS circlename FROM `;
		console.log("Query---", sqlbus);
		if (data.assign_id) {
			sqlbus += ` where circlename = ${data.deptname}`;
		}
		if (data.like) where.push(`state_name like '%${data.like}%'`)
		if (where.length > 0) {
			sqlbus += " where " + where.join(' AND ')
		}
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


const storage = multer.diskStorage({
	destination: function (req, file, callback) {
		console.log('files---', file);
		let namefile = file.originalname.split('-')[0], folder_status = false;
		const fs = require("fs")
		const filename = namefile
		const imagePath = `${__dirname}/../Documents/Vendor/${filename}`;
		fs.exists(imagePath, exists => {
			if (exists) {
				folder_status = true
				console.log(" Directory Already created.")
			} else {
				folder_status = true
				fs.mkdir(imagePath, { recursive: true }, function (err) {
					if (err) {
						console.log(err)
					} else { console.log("New directory successfully created.") }
				})
			}
			if (folder_status) { callback(null, imagePath); }
		});
	},
	filename: function (req, file, callback) {
		console.log(file);
		let nowdate = new Date();
		let filename = file.originalname.split('-')[1]
		let type = file.mimetype == 'application/pdf' ? 'pdf' : 'png';
		callback(null, filename + '-' + nowdate.toISOString().slice(0, 10) + '.' + type)
	}
})

const upload = multer({ storage: storage }).array('file', 5)

Vendor.post('/uploadDoc', function (req, res) {
	console.log('Upload Document');
	let errorarray = [], data, sqlquery, file, pan, gst, aadhar, bank, mail, proof, sql;
	upload(req, res, function (err) {
		if (err) {
			console.log("Error uploading file.", err)
			errorarray.push({ msg: "Upload Failed", error_code: 'FAIL' });
			res.end(JSON.stringify(errorarray));
		} else {
			console.log(data, ".......................", 'files', req.files);
			data = req.body, file = req.files;
			pan = `${file[0].filename}`; gst = `${file[1].filename}`; bank = `${file[2].filename}`; aadhar = `${file[3].filename}`; mail = `${file[4].filename}`
			sqlquery = " UPDATE veremaxpo.vendor_user SET gst_file='" + gst + "',aadhar_file='" + aadhar + "',mail_file='" + mail + "',pan_file='" + pan + "',bankdoc_file='" + bank + "' WHERE vuid =" + data.id;
			console.log("Update Payment Proof Query.", sqlquery)
			pool.getConnection((err, conn) => {
				if (err) {
					console.log("Failed");
				}
				else {
					sql = conn.query(sqlquery, function (err, result) {
						conn.release();
						if (!err) {
							if (!err) {
								if (result.affectedRows > 0) {
									errorarray.push({ status: 1, msg: 'Added Succesfully', error_msg: 0 });
									console.log("File is uploaded.")
									res.end(JSON.stringify(errorarray));
								}
							} else {
								console.log("File Not uploaded.", err)
								errorarray.push({ msg: "Please try after sometimes", error_msg: 'FAIL' });
								res.end(JSON.stringify(errorarray));
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

const autogenerate = function (num, size) {
	var s = num + "";
	while (s.length < size) s = "0" + s;
	return s;
}

module.exports = Vendor;