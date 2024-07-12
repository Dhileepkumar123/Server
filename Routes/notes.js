// operator.post('/listoperator', function (req, res, err) {
//     let jwt=req.jwt_data;
//     console.log('jwt_data', req.jwt_data);
//     var sqladd='',sql, sqlquery = ' SELECT  us.id, h.hdname,r.rolename,us.profileid,us.fullname,us.business_name,us.mobile,us.email1,us.hdid FROM smsv2.users us  LEFT JOIN smsv2.hd h ON us.hdid=h.hdid  LEFT JOIN smsv2.role r ON us.usertype=r.role WHERE r.role!=999 AND r.role!=770 LIMIT ?,? ',
//         sqlqueryc = ' SELECT COUNT(*) AS count FROM `smsv2`.users us  LEFT JOIN smsv2.hd h ON us.hdid=h.hdid  LEFT JOIN smsv2.role r ON us.usertype=r.role WHERE r.role!=999 AND r.role!=770', finalresult = [],
//         data = req.body;
//        console.log(data,'data h') 
//        if(jwt.role<=777) sqladd+=' and us.hdid='+jwt.hdid;
//     pool.getConnection(function (err, conn) {
//         if (!err) {
//             sql = conn.query(sqlquery+sqladd, [data.index, data.limit], function (err, result) {
//                 if (!err) {
//                     finalresult.push(result);
//                     sql = conn.query(sqlqueryc+sqladd, function (err, result) {
//                         conn.release();
//                         if (!err) {
//                             finalresult.push(result[0]);
//                             res.end(JSON.stringify(finalresult));
//                         } else {
//                             console.log('err');
//                         }
//                     });
//                 } else {
//                     conn.release();
//                 }
//             });
//         }
//     });
// });