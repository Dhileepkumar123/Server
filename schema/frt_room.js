const Joi = require('joi');

////----Frt Room Schema----////
const frtRoomschema={
        ownername: Joi.string().required().label("Invalid Ownername"),
        project_id: Joi.number().required().label("Invalid Project Name"),
        circle_name: Joi.number().required().label("Invalid State"),
        cluster: Joi.number().required().label("Invalid District"),
        address: Joi.string().required().label("Invalid Address"),
        owner_address: Joi.string().required().label("Invalid Owner Address"),
        // phonenumber: Joi.string().length(10).pattern(/^[0-9]+$/).required().label("Invalid Phone Number"),
        phonenumber: Joi.string().max(10, 'utf8').required().label("Invalid Phone Number"),
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required().label("Invalid Email_ID"),
        aadharno: Joi.string().length(12).pattern(/^[0-9]+$/).required().label("Invalid Aadhar Number"),
        bank_name: Joi.string().required().label("Invalid Bank Name"),
        roomadvance: Joi.number().precision(2).required().label("Invalid Room Advance Amount"),
        monthly_rent: Joi.number().precision(2).required().label("Invalid Monthly Rent Amount"),
        approving_manager: Joi.string().required().label("Invalid Manager Name"),
        active_date: Joi.date().required().label("Invalid Start Date"),
        closing_date: Joi.date().required().label("Invalid Close Date"),
        acnt_name: Joi.string().required().label("Invalid Account Name"),
        acnt_no: Joi.number().required().label("Invalid Account Number"),
        ifsc_no: Joi.string().required().label("Invalid IFSC Number"),
        bank_branch: Joi.string().required().label("Invalid Account Branch"),
        panno: Joi.string().required().label("Invalid Pan Number"),
        agr_active_date: Joi.date().required().label("Invalid Agreement Date"),
        agr_expiry_date: Joi.date().required().label("Invalid Agreement Expiry Date"),
        sublocation: Joi.string().required().label("Invalid Sub Location Name"),
        // advance_date: Joi.date().required().label("Invalid Advance Date"),
        // room_cat: Joi.string().required().label("Invalid Room Category")
        // advance_paid_date: Joi.date().required().label("Invalid Advance Paid Date"),
        // phonenumber: Joi.string().regex(/^[0-9]{10}$/).messages({'string.pattern.base': `Phone number must have 10 digits.`}).required().label("Invalid Phone Number"),
}

const updatefrtroomData={ roomid: Joi.number().integer().required().label('ID Required') }

module.exports.frtDataSchema = Joi.object().keys(
    frtRoomschema
  ).options({ stripUnknown: true });
  
module.exports.editfrtroomDataSchema = Joi.object().keys(frtRoomschema, updatefrtroomData).options({ stripUnknown: true });
////-------------------------------------------------------------------------------------////

////----Frt Room Rent Schema----////
const frtRoomRentschema = {
  room_id: Joi.number().required().label("Invalid Room ID"),
  project_id: Joi.number().required().label("Invalid Project Name"),
  circle_name: Joi.number().required().label("Invalid State Name"),
  cluster: Joi.number().required().label("Invalid District Name"),
  paid_date: Joi.date().required().label("Invalid Paid Date"),
  pay_type: Joi.number().required().label("Invalid Payment Type")
  // salary: Joi.alternatives().conditional('type', { is: 2, then: Joi.number().required() }),
  // recovery_amt: Joi.string().required().label("Invalid Advance Recovery Amount"),
  // brokerage_amt: Joi.string().required().label("Invalid Brokerage Amount"),
  // utrno: Joi.string().required().label("Invalid UTR Number"),
  // paid_amount: Joi.string().required().label("Invalid Paid Amount"),
  // cheque_no: Joi.number().required().label("Invalid Cheque Number"),
  // paid_to_name: Joi.string().required().label("Invalid Paid Name"),
  // remarks: Joi.string().required().label("Invalid Remarks")
}

const updatefrtroomrentData ={ rentid: Joi.number().integer().required().label("RENT ID Required") }

module.exports.frtroomrentDataSchema = Joi.object().keys(
  frtRoomRentschema
).options({ stripUnknown: true });

module.exports.editfrtroomrentDataSchema = Joi.object().keys(frtRoomRentschema, updatefrtroomrentData).options({ stripUnknown: true });
////-------------------------------------------------------------------------------------////