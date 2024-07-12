"use strict";
var express = require('express'),
	select = express.Router(),
	pool = require('../connection/connection');

select.post("/liststates", (req, res) => {
	let data = req.body, sql, where = [], value = [];
	console.log("Data--", data);
	let sqlsel = `select * from states`,
		sqlqueryc = `select count(*) count from states`;
	if (data.like) where.push(` name like '%${data.like}%'`)
	if (data.hasOwnProperty('state_id') && data.state_id) {
		where.push(" id=" + data.state_id );
	}
	if (where.length > 0) {
		sqlsel += " where " + where.join(' AND ')
		sqlqueryc += " where " + where.join(' AND ')
	}
	if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
		sqlbus += ' ORDER BY id  DESC LIMIT ' + data.index + ', ' + data.limit;
	}
	console.log('Get Count Query :',);
	pool.getConnection( (err, conn) => {
		if (err) {
			console.log('List  Failed....');
			res.send(JSON.stringify('Failed'));
		} else {
			sql = conn.query(sqlsel, function (err, result) {
				value.push(result)
				if (!err) {
					sql = conn.query(sqlqueryc, function (err, result) {
						conn.release();
						console.log('Liststates Connection Closed.');
						if (!err) {
							value.push(result[0]);
							// console.log("List Deposit Result", value);
							res.send(JSON.stringify(value));
						} else {
							console.log('Query Failed');
							res.send(JSON.stringify(result));
						}
					})
				} else {
					console.log('error', err);
					conn.release();
					console.log('Liststates Connection Closed.');
					res.send(JSON.stringify(result));
				}
			});
		}
	});
});

select.post("/listDistricts", (req, res) => {
	let data = req.body, where = [], sql;
	console.log("Data--", data);
	pool.getConnection( (err, con) => {
		let sqlbus = `SELECT id,state_id,name FROM districts`;
		if (data.like) where.push(` name like '%${data.like}%'`)
		if (data.hasOwnProperty('state_id') && data.state_id) {
			where.push(' state_id = ' + data.state_id)
		}
		if(where.length>0){
			sqlbus += " where " + where.join(' AND ')
		}
		console.log("Query---", sqlbus);
		sql = con.query(sqlbus, (err, result) => {
			con.release();
			if (err) {
				console.log(err);
			} else {
				res.send(JSON.stringify(result));
			}
		});
	});
});

select.post("/liststatesmas", (req, res) => {
	let data = req.body, sql, where = [], value = [];
	console.log("Data--", data);
	let sqlsel = `select * from states`,
		sqlqueryc = `select count(*) count from states `;
	if (data.like) where.push(` name like '%${data.like}%'`)
	if (data.hasOwnProperty('state_id') && data.state_id) {
		where.push(" state_mas_id ='" + data.state_id + "'");
	}
	if (where.length > 0) {
		sqlsel += " where " + where.join(' AND ')
		sqlqueryc += " where " + where.join(' AND ')
	}
	if (data.hasOwnProperty('index') && data.hasOwnProperty('limit')) {
		sqlbus += ' ORDER BY state_mas_id  DESC LIMIT ' + data.index + ', ' + data.limit;
	}
	console.log('Get Count Query :',sqlsel);
	pool.getConnection( (err, conn) => {
		if (err) {
			console.log('List  Failed....')
			res.send(JSON.stringify('failed'));
		} else {
			sql = conn.query(sqlsel, function (err, result) {
				value.push(result)
				if (!err) {
					sql = conn.query(sqlqueryc, function (err, result) {
						conn.release();
						if (!err) {
							console.log('Liststatesmas Connection Closed.');
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

select.post("/listdistricts", (req, res) => {
	let data = req.body;
	console.log("Data--", data);
	pool.getConnection( (err, con) => {
		let sqlsel = `SELECT * FROM city_mas where state_mas_id=${data.state_mas_id}`;
		let where = [], whereVal = [];
		if (data.like) where.push(`city_name like '%${data.like}%'`)
		where = where.length ? ` WHERE ${where.join(' AND ')}` : '';
		sqlsel += where
		let sql = con.query(sqlsel, whereVal, (err, result) => {
			con.release();
			if (err) {
				console.log(err);
			} else {
				res.send(JSON.stringify(result));
			}
		});
	});
});

select.post("/listcountry", (req, res) => {
	let data = req.body;
	console.log("Data--", data);
	pool.getConnection( (err, con) => {
		let sqlsel = "select * from country";
		let where = [], whereVal = [];
		if (data.like) where.push(`country_name like '%${data.like}%'`)
		if (data.country_code) {
			where.push(` country_code = ?`);
			whereVal.push(data.country_code);
		}
		if (data.status) {
			where.push(` status = ?`);
			whereVal.push(data.status);
		}
		where = where.length
			? ` WHERE ${where.join(' AND ')}`
			: '';
		sqlsel += where
		let sql = con.query(sqlsel, whereVal, (err, result) => {
			con.release();
			if (err) {
				console.log(err);
			} else {
				res.send(JSON.stringify(result));
			}
		});
	});
});

module.exports = select;