const express = require('express'),
    compression = require('compression'),
    customerpo = express.Router(),
    schema = require('../schema/schema'),
    pool = require('../connection/connection'),
    poolPromise = require('../connection/connection').poolpromise;
const { response } = require('express');


customerpo.post("/listcustomerpo", (req, res) => {
	let data = req.body;
	console.log("Data--", data);
	pool.getConnection((err, conn) => {
		let sqlbus = ` SELECT cpo.*,cpo.po_uuid,cli.client_name,sta.name,um.uom_name FROM customer_po AS cpo 
		LEFT JOIN client AS cli ON cli.client_id = cpo.client_id
		LEFT JOIN states AS sta ON sta.id = cpo.circle_id
		LEFT JOIN unit_measure AS um ON um.um_id = cpo.unit_of_mnt_id `;
		if (data.customer_po_id) {
			// sqlbus += ' where id ='+ data.id +''
			sqlbus += ` where customer_po_id = ${data.customer_po_id}`;
		}
		console.log("Query---", sqlbus);
		let sql = conn.query(sqlbus, (err, result) => {
			conn.release();
			console.log('Listcustomerpo Connection Closed.');
			if (err) {
				console.log(err);
			} else {
				// console.log(result)
				res.send(JSON.stringify(result));
			}
		});
	});
});

// async function addcustomerpo(req) {
// 	return new Promise(async (resolve, reject) => {
// 	  let data = req.body,
// 		errorvalue = [];
// 		console.log(req.body,"BODYYYY DATAAAA");
// 	  let conn = await poolPromise.getConnection();
// 	  if (conn) {
// 		await conn.beginTransaction();
// 		try {
// 		  console.log("add data", data);
// 		  let sqlquery= `SELECT count(*) as count from customer_po`;
// 			  console.log('customerpo query',sqlquery);
// 			  let resp = await conn.query(sqlquery)
// 			  console.log(resp,'Result');
// 			  let inc = utils.padNumber((resp[0][0].count+ 1), 8);
// 			  data["pocount"] = ("CP"+ (inc));
// 			  console.log(data.pocount,"pocount");
// 			let po_date =  data.po_date == undefined? null: data.po_date.split("-").reverse().join("-");
//         	let po_validity_from = data.po_validity_from == undefined? null: data.po_validity_from.split("-").reverse().join("-");
//         	let po_validity_to = data.po_validity_to == undefined? null: data.po_validity_to.split("-").reverse().join("-");
// 				    let sqlinsert = `insert into customer_po set  po_uuid='${data.pocount}',client_id='${data.client_id}',circle_id='${data.circle_id}',type_id_fk='${data.type_id_fk}',
// 					customer_po_no='${data.customer_po_no}',no_nfa_created='${data.no_nfa_created}',po_netvalue='${data.po_netvalue}',po_grossvalue='${data.po_grossvalue}',po_date='${po_date}',po_validity_from='${po_validity_from}',
// 					po_validity_to='${po_validity_to}',description='${data.description}',communication='${data.communication}',po_file_name='${data.po_file_name}'`				
// 				   console.log('insert query',sqlinsert);
// 				   let result = await conn.query(sqlinsert)
// 				   console.log('result',result);
// 				   if(result[0]['affectedRows'] > 0 && result[0]['insertId'] > 0){
// 					  errorvalue.push({msg:"customerpo Added Successfully",err_code:0})
// 					  await conn.commit();
// 					}else{
// 					  errorvalue.push({msg:"Please Try After Sometimes",err_code:56})
// 					  await conn.rollback();
// 				   }
				
// 			//    }
// 		} catch (err) {
// 		  console.log("catch error", err);
// 		}
// 	  } else {
// 		console.log("Connection Error.....");
// 	  }
// 	  conn.release();
// 	  console.log('connection closed',errorvalue)
// 	  return resolve(errorvalue);
// 	});
//   }
// customerpo.post("/addcustomerpo"/*schema.customerposchema*/,async (req, res) => {
//     console.log(req.body)
    
//     req.setTimeout(864000000);
//     console.log('dhcbg---------', req.body);
//     let result = await addcustomerpo(req);
//     console.log(result);
//     res.end(JSON.stringify(result));
// });

module.exports = customerpo;