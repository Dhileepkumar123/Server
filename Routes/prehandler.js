var jwt = require('jsonwebtoken');
var privateKey = require('../config/key'),
    pool = require('../connection/connection');

module.exports = async (req, res, next) => {
    var sqlq;
    pool.getConnection(async (err, con) => {
        if (err) {
            console.log(err);
            con.release();
            return res.json({ msg: 'Internal Error', status: 0 });
        } else {
            const auth = req.headers.authorization || req.headers.Authorization;
            // console.error('AUTH----------',auth);
            try {
                let decoded = await jwt.verify(auth, privateKey, {
                    algorithm: ['HS512']
                });
                req.jwt_data = decoded;
                // console.log('jwt data', req.jwt_data);
                // if (decoded.role_id == 100) {
                    sqlq = ' SELECT EXISTS(SELECT * FROM employee_mas WHERE user_id=' + decoded.user_id + ') AS count ';
                // }
                var sql = con.query(sqlq, (err, result) => {
                    // console.log(sql.sql);
                    console.log("Prehandler Connection Closed...");
                    con.release();
                    if (err) {
                        console.log(err);
                        return res.json({ msg: 'plz try after sometimes', status: 0 });
                    } else {
                        if (result[0].count != 0) {
                            console.log("Session Success");
                            next();
                        } else {
                            console.log("Session Failed due to another logged In"); // Single Login .................
                            // console.log(req.body)
                            return res.status(401).send({ msg: 'User Not Authenticated', status: 401 });
                        }
                    }
                })
            } catch (e) { // Token Expiration..............
                con.release();
                // console.log("Inside catch", e);
                console.error('Inside prehandler Catch........TokenExpired......');
                // console.error('AUTH----------',auth);
                return res.status(401).send({ msg: 'Token is Expired', status: 401, restore: true });
            }
        }
    });
}