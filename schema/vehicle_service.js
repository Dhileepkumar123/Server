const Joi = require('joi');

////---Vehicle Service Schema---////
const vehicleServiceschema = {    
    vehicleno: Joi.number().required().label("Invalid VehicleNumber"),
    invoiceno: Joi.string().required().label("Invalid Invoice Number"),
    vsdate: Joi.date().required().label("Invalid Vehicle Service Date"),
    invoamt: Joi.string().required().label("Invalid Invoice Amount"),
    drivenkms: Joi.number().required().label("Invalid Kilometers"),
    vsdate: Joi.date().required().label("Invalid Vehicle Service Date"),
    paymdate: Joi.date().required().label("Invalid Payment Date"),
    paymamt: Joi.string().required().label("Invalid Payment Amount"),
    utrno: Joi.string().required().label("Invalid UTR Number"),
    paymto: Joi.number().required().label("Invalid Payment Date"),
    // empid: Joi.number().required().label("Invalid Employee ID"),
    acc_no: Joi.number().required().label("Invalid Account Number"),
    ifsc_code: Joi.string().required().label("Invalid IFSC Code"),
    billstatus: Joi.number().required().label("Invalid Bill Status"),
    circle_name: Joi.number().required().label("Invalid State Name"),
    cluster: Joi.number().required().label("Invalid District Name")
}

const updatevehicleserviceData = { vsid: Joi.number().integer().required().label("ID Required") };

module.exports.vehicleserviceDataSchema = Joi.object().keys(
    vehicleServiceschema
).options({ stripUnknown: true });

module.exports.editvehicleserviceDataSchema = Joi.object().keys(vehicleServiceschema, updatevehicleserviceData).options({ stripUnknown: true });