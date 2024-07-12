const Joi = require('joi');

////---Vehicle Registration Schema---////
const vehicleregschema= {
    regNo: Joi.string().regex(/^[a-zA-Z]{2}[0-9]{2}[a-zA-Z]{1,2}[0-9]{4}$/).required().label("Invalid VehicleNumber"),
    engNo: Joi.string().required().label("Invalid Engine Number"),
    chasNo: Joi.string().required().label("Invalid Chassis Number"),
    // chasNo: Joi.string().max(17, 'utf8').required().label("Invalid Chassis Number"),
    companyname: Joi.number().required().label("Invalid Company Name"),
    dept: Joi.number().required().label("Invalid Vehicle_Type"),
    model: Joi.string().required().label("Invalid Makers Name"),
    fuelcardid: Joi.number().required().label("Invalid Fuelcard Number"),
    circle_name:Joi.number().integer().required().label("Invalid State Name"),
    cluster:Joi.number().integer().required().label("Invalid District Name"),
    regdate: Joi.date().required().label("Invalid Registration Date")
}

const updatevehicleData={ id: Joi.number().integer().required().label('ID Required') };

module.exports.vehicleDataSchema = Joi.object().keys(
    vehicleregschema
).options({ stripUnknown: true });

module.exports.editvehicleDataSchema = Joi.object().keys(vehicleregschema, updatevehicleData).options({ stripUnknown: true });
////-------------------------------------------------------------------------------////

////---Vehicle Project Assigning Schema---////
const vehcileprojectschema = {
    project_id: Joi.number().required().label("Invalid Project Name"),    
    vehicle_id: Joi.number().required().label("Invalid Vehicle Number"),
    start_date: Joi.date().required().label("Invalid Start Date")
}

const updatevehicleprojectData = { id: Joi.number().integer().required().label("ID Required") };

module.exports.vehicleprojectDataSchema = Joi.object().keys(
    vehcileprojectschema
).options({ stripUnknown: true });

module.exports.editvehicleprojectDataSchema = Joi.object().keys(vehcileprojectschema, updatevehicleprojectData).options({ stripUnknown: true });
////--------------------------------------------------------------------////

////---Vehicle Track Schema---////
const vehicletrackschema = {
    date: Joi.date().required().label("Invalid Date"),
    project: Joi.number().required().label("Invalid Project Name"),
    regNo: Joi.number().required().label("Invalid VehicleNumber"),
    opening_km: Joi.number().required().label("Invalid Starting Km"),
    // closing_km: Joi.string().required().label("Invalid Closing Km"),
    companyname: Joi.number().required().label("Invalid Company Name"),
    vehicletype: Joi.number().required().label("Invalid Vehicle Type"),
    drivername: Joi.string().required().label("Invalid Company Driver Name"),
    mobile_no: Joi.string().max(10, 'utf8').required().label("Invalid Phone Number"),
    // act_driver: Joi.string().required().label("Invalid Acting Driver Name"),
    jcname: Joi.string().required().label("Invalid Jio Center Name"),
    activity: Joi.string().required().label("Invalid Activity")
}

const updatevehicletrackData = { vehicle_km_id: Joi.number().integer().required().label("ID Required") };

module.exports.vehicletrackDataSchema = Joi.object().keys(
    vehicletrackschema
).options({ stripUnknown: true });

module.exports.editvehicletrackDataSchema = Joi.object().keys(vehicletrackschema, updatevehicletrackData).options({ stripUnknown: true });
////--------------------------------------------------------------------////